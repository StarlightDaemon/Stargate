/**
 * Gate Dialing Computer - Main Engine
 * State machine, UI bindings, and orchestration
 */

// Valid glyph ID set for sanitization
const VALID_GLYPHS = new Set([...Array(39).keys()]);

/**
 * Sanitize glyph input (security)
 */
function sanitizeGlyphInput(id) {
    const num = parseInt(id, 10);
    if (!Number.isInteger(num) || !VALID_GLYPHS.has(num)) {
        console.warn('[Security] Invalid glyph ID rejected:', id);
        return null;
    }
    return num;
}

/**
 * Main SDC Engine
 */
class SDCEngine {
    constructor() {
        // State
        this.state = 'idle'; // idle, dialing, locking, active, aborting
        this.mode = 7;
        this.buffer = [];
        this.lockedChevrons = [];
        this.destination = null;

        // Controllers
        this.ringController = null;

        // Animation timing (configurable)
        this.timing = {
            spinDuration: 1500,      // Base ring spin time
            encodeDelay: 200,        // Delay before chevron encodes
            encodeDuration: 300,     // Chevron encoding animation
            lockDuration: 500,       // Chevron lock animation
            interChevronDelay: 400,  // Delay between chevrons
            kawooshDuration: 800     // Kawoosh effect duration
        };

        // Fast mode (testing)
        this.fastMode = false;
        this.fastMultiplier = 15;
        this.instantMode = false;

        // Criss-cross chevron sequences
        // Modes 7-9: legacy pairs (original 9-chevron gate)
        // Modes 10-12: true-opposite pairs (all 180° apart on 12-chevron gate)
        this.sequences = {
            7:  [1, 8, 2, 7, 3, 6, 9],
            8:  [1, 8, 2, 7, 3, 6, 4, 9],
            9:  [1, 8, 2, 7, 3, 6, 4, 5, 9],
            10: [1, 7, 2, 8, 3, 10, 4, 11, 5, 9],
            11: [1, 7, 2, 8, 3, 10, 4, 11, 5, 12, 9],
            12: [1, 7, 2, 8, 3, 10, 4, 11, 5, 12, 6, 9]
        };

        // DOM references
        this.dom = {};
    }

    /**
     * Initialize the engine
     */
    async init() {
        this.cacheDom();
        this.initRing();
        this.initAudio();
        this.signalStrength = window.signalStrength || null;
        this.bindEvents();
        this.generateGlyphGrid();
        this.generateQuickDial();
        this.updateBufferLabel();
        this.log('System initialized. Ready for dialing sequence.');
    }

    cacheDom() {
        this.dom = {
            svg: document.getElementById('stargateSvg'),
            innerRing: document.getElementById('innerRing'),
            eventHorizon: document.getElementById('eventHorizon'),
            kawoosh: document.getElementById('kawooshEffect'),
            headerStatus: document.getElementById('headerStatus'),
            chevronIndicators: document.getElementById('chevronIndicators'),
            statusLog: document.getElementById('statusLog'),
            destInfo: document.getElementById('destInfo'),
            bufferLabel: document.getElementById('bufferLabel'),
            bufferSlots: document.getElementById('bufferSlots'),
            glyphGrid: document.getElementById('glyphGrid'),
            btnEngage: document.getElementById('engageBtn'),
            quickDialList: document.getElementById('quickDialList'),
            quickDialPosBtn: document.getElementById('quickDialPosBtn'),
            container: document.querySelector('.sdc-fusion-container'),
        };
    }

    initRing() {
        this.ringController = new RingController(this.dom.svg, this.dom.innerRing);
    }

    async initAudio() {
        if (typeof audioManager !== 'undefined') {
            await audioManager.init();
        }
    }

    generateQuickDial() {
        const list = this.dom.quickDialList;
        list.innerHTML = '';
        const entries = Object.entries(ADDRESSES);
        for (const [key, addr] of entries) {
            const btn = document.createElement('button');
            btn.className = 'qd-entry';
            btn.dataset.addrKey = key;
            btn.innerHTML = `<span class="qd-name">${addr.name}</span><span class="qd-desig">${addr.designation}</span>`;
            btn.addEventListener('click', () => this.autoDial(key));
            list.appendChild(btn);
        }

        // Position toggle
        this.dom.quickDialPosBtn.addEventListener('click', () => {
            const right = this.dom.container.classList.toggle('quick-dial-right');
            this.dom.quickDialPosBtn.textContent = right ? '◀' : '▶';
        });
    }

    disableQuickDial(disabled) {
        if (!this.dom.quickDialList) return;
        this.dom.quickDialList.querySelectorAll('.qd-entry').forEach(btn => {
            btn.disabled = disabled;
        });
    }

    bindEvents() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.state !== 'idle') return;
                this.mode = parseInt(btn.dataset.mode);
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.reset();
                this.updateBufferLabel();
            });
        });

        // Engage / Abort / Disconnect button
        this.dom.btnEngage.addEventListener('click', () => {
            if (this.state === 'locking') this.abort();
            else if (this.state === 'active') this.disconnect();
            else this.engage();
        });

        // Dial speed segmented control
        document.querySelectorAll('.dial-speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.dial-speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const speed = btn.dataset.speed;
                this.setFastMode(speed === 'fast');
                this.instantMode = speed === 'instant';
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.abort();
            if (e.key === 'Enter' && !this.dom.btnEngage.disabled) this.engage();
        });
    }

    generateGlyphGrid() {
        this.dom.glyphGrid.innerHTML = '';

        // Generate 40 glyph keys (1-38 + 2 empty) for 8x5 grid
        for (let i = 1; i <= 38; i++) {
            const btn = document.createElement('button');
            btn.className = 'dhd-key';
            btn.dataset.glyphId = i;
            btn.textContent = GLYPH_SYMBOLS[i] || String.fromCharCode(65 + (i % 26));
            btn.title = GLYPH_NAMES[i] || `Glyph ${i}`;
            btn.addEventListener('click', () => this.handleGlyphClick(i));
            this.dom.glyphGrid.appendChild(btn);
        }

        // Add 2 empty cells for 8x5 grid alignment
        for (let i = 0; i < 2; i++) {
            const empty = document.createElement('div');
            empty.className = 'dhd-key';
            empty.style.visibility = 'hidden';
            this.dom.glyphGrid.appendChild(empty);
        }
    }

    /**
     * Handle glyph selection (from keyboard or ring click)
     */
    handleGlyphClick(glyphId) {
        // Sanitize input
        const id = sanitizeGlyphInput(glyphId);
        if (id === null) return;

        // State check
        if (this.state !== 'idle' && this.state !== 'dialing') {
            this.log('Cannot dial while gate is active.');
            return;
        }

        // Duplicate check
        if (this.buffer.includes(id)) {
            this.log('Glyph already in sequence.');
            return;
        }

        // Buffer full check
        const maxGlyphs = this.mode - 1;
        if (this.buffer.length >= maxGlyphs) {
            this.log('Address buffer full.');
            return;
        }

        // Add to buffer
        this.buffer.push(id);
        this.state = 'dialing';

        // Update UI
        this.updateBufferDisplay();
        this.highlightDHDKey(id);
        this.ringController.highlightGlyph(id);

        // Play sound
        if (typeof audioManager !== 'undefined') {
            audioManager.play('engage', { volume: 0.2 });
        }

        this.log(`Symbol ${this.buffer.length} encoded: ${GLYPH_NAMES[id] || 'Unknown'}`);

        // Check if ready to engage
        if (this.buffer.length >= maxGlyphs) {
            this.dom.btnEngage.disabled = false;
            this.log('Address complete. Ready to engage.');
        }
    }

    /**
     * Update buffer section label to reflect current mode
     */
    updateBufferLabel() {
        if (this.dom.bufferLabel) {
            this.dom.bufferLabel.textContent = `ADDRESS BUFFER — ${this.mode} CHEVRONS`;
        }
    }

    /**
     * Update buffer display slots
     */
    updateBufferDisplay() {
        const slots = this.dom.bufferSlots.querySelectorAll('.buffer-slot:not(.origin-slot)');
        slots.forEach((slot, i) => {
            if (i < this.buffer.length) {
                const glyphId = this.buffer[i];
                slot.textContent = GLYPH_SYMBOLS[glyphId] || '?';
                slot.classList.add('filled');
            } else {
                slot.textContent = '—';
                slot.classList.remove('filled');
            }
        });
    }

    /**
     * Auto-dial a known address
     */
    async autoDial(addressKey) {
        if (this.state !== 'idle') {
            this.log('Cannot auto-dial while gate is busy.');
            return;
        }

        const address = ADDRESSES[addressKey];
        if (!address) {
            this.log('Unknown address.');
            return;
        }

        // Auto-select mode matching address length
        const requiredMode = address.address.length + 1;
        if (this.sequences[requiredMode]) {
            this.mode = requiredMode;
            document.querySelectorAll('.mode-btn').forEach(b => {
                b.classList.toggle('active', parseInt(b.dataset.mode) === this.mode);
            });
            this.updateBufferLabel();
        }

        this.log(`Auto-dialing: ${address.name}`);
        this.destination = address;

        // Update signal strength to dialing mode
        if (this.signalStrength) {
            this.signalStrength.setMode('dialing');
        }

        // Enter glyphs with delay
        for (const glyphId of address.address) {
            this.handleGlyphClick(glyphId);
            if (!this.instantMode) await this.sleep(this.t(200));
        }

        // Auto-engage after brief delay
        if (!this.instantMode) await this.sleep(this.t(500));
        this.engage();
    }

    /**
     * Engage the dialing sequence
     */
    async engage() {
        if (this.state !== 'dialing' || this.buffer.length < this.mode - 1) {
            return;
        }

        if (this.instantMode) return this.engageInstant();

        this.state = 'locking';
        this.setEngageBtn('abort');
        this.disableGlyphGrid(true);
        this.disableQuickDial(true);

        this.log('Initiating dialing sequence...');

        // Determine destination
        if (!this.destination) {
            this.destination = this.findDestination(this.buffer);
        }

        const sequence = this.sequences[this.mode];

        // Lock chevrons in criss-cross order
        for (let i = 0; i < sequence.length; i++) {
            if (this.state === 'aborting') break;

            const chevronNum = sequence[i];
            const isLast = i === sequence.length - 1;
            const glyphId = isLast ? 0 : this.buffer[i]; // 0 = Earth PoO

            // Spin ring to glyph
            this.log(`Chevron ${i + 1} encoding...`);
            this.setChevronState(i, 'encoding');

            await this.ringController.rotateToGlyph(glyphId, i % 2 === 0);

            if (this.state === 'aborting') break;

            // Lock chevron
            await this.sleep(this.t(this.timing.encodeDelay));
            this.lockChevron(chevronNum, i);
            this.setChevronState(i, 'locked');

            // Play chevron lock sound
            if (typeof audioManager !== 'undefined') {
                audioManager.play('chevronLock');
            }

            this.log(`Chevron ${i + 1} locked.`);

            // Delay before next chevron
            await this.sleep(this.t(this.timing.interChevronDelay));
        }

        // Establish wormhole
        if (this.state !== 'aborting') {
            await this.establishWormhole();
        }
    }

    /**
     * Instant dial — lock all chevrons without ring rotation (DHD style)
     */
    async engageInstant() {
        this.state = 'locking';
        this.setEngageBtn('abort');
        this.disableGlyphGrid(true);
        this.disableQuickDial(true);

        this.log('Initiating instant dial sequence...');

        if (!this.destination) {
            this.destination = this.findDestination(this.buffer);
        }

        const sequence = this.sequences[this.mode];

        for (let i = 0; i < sequence.length; i++) {
            if (this.state === 'aborting') break;

            const chevronNum = sequence[i];
            const isLast = i === sequence.length - 1;
            const glyphId = isLast ? 0 : this.buffer[i];

            this.ringController.highlightGlyph(glyphId);
            this.setChevronState(i, 'encoding');

            await this.sleep(80);

            if (this.state === 'aborting') break;

            this.lockChevron(chevronNum, i);
            this.setChevronState(i, 'locked');

            if (typeof audioManager !== 'undefined') {
                audioManager.play('chevronLock');
            }

            this.log(`Chevron ${i + 1} locked.`);
            await this.sleep(120);
        }

        if (this.state !== 'aborting') {
            await this.establishWormhole();
        }
    }

    /**
     * Lock a chevron (visual)
     */
    lockChevron(chevronNum, index) {
        const chevron = document.querySelector(`.chevron[data-num="${chevronNum}"]`);
        if (chevron) {
            chevron.classList.remove('encoding');
            chevron.classList.add('locked');
        }

        this.lockedChevrons.push(chevronNum);
    }

    /**
     * Set chevron state in panel indicators
     */
    setChevronState(index, state) {
        const indicators = this.dom.chevronIndicators.querySelectorAll('.chev-indicator');
        if (indicators[index]) {
            indicators[index].classList.remove('encoding', 'active');
            if (state === 'encoding' || state === 'locked') {
                indicators[index].classList.add('active');
            }
        }
    }

    /**
     * Establish wormhole (kawoosh!)
     */
    async establishWormhole() {
        this.state = 'active';

        this.log('Wormhole establishing...');

        // Play kawoosh sound
        if (typeof audioManager !== 'undefined') {
            audioManager.play('kawoosh');
        }

        // Trigger kawoosh animation
        this.dom.kawoosh.classList.add('active');

        await this.sleep(this.t(this.timing.kawooshDuration));

        this.dom.kawoosh.classList.remove('active');

        // Activate event horizon
        this.dom.eventHorizon.classList.add('active');
        this.setEngageBtn('disconnect');

        // Update destination display
        if (this.destination) {
            this.dom.destInfo.textContent = `${this.destination.name}  ·  ${this.destination.designation}`;
        } else {
            this.dom.destInfo.textContent = 'UNKNOWN WORLD  ·  P??-???';
        }

        if (this.dom.headerStatus) {
            this.dom.headerStatus.textContent = 'ACTIVE';
        }

        // Update signal mode
        if (this.signalStrength) {
            this.signalStrength.setMode('active');
        }

        this.log('Wormhole established. Connection stable.');
    }

    /**
     * Abort the current operation (mid-dial)
     */
    abort() {
        if (this.state === 'idle') return;

        this.state = 'aborting';
        this.log('Aborting sequence...');
        this.setEngageBtn('engage');

        if (typeof audioManager !== 'undefined') {
            audioManager.play('abort');
        }

        this.ringController.stop();
        setTimeout(() => this.reset(), 500);
    }

    /**
     * Disconnect an active wormhole
     */
    disconnect() {
        if (this.state !== 'active') return;

        this.state = 'aborting';
        this.log('Severing connection...');
        this.setEngageBtn('engage');

        if (typeof audioManager !== 'undefined') {
            audioManager.play('abort');
        }

        this.dom.eventHorizon.classList.remove('active');
        if (this.dom.headerStatus) this.dom.headerStatus.textContent = 'IDLE';

        setTimeout(() => this.reset(), 600);
    }

    /**
     * Set engage button state: 'engage' | 'abort' | 'disconnect'
     */
    setEngageBtn(mode) {
        const btn = this.dom.btnEngage;
        btn.classList.remove('state-abort', 'state-disconnect');

        if (mode === 'abort') {
            btn.textContent = 'ABORT';
            btn.classList.add('state-abort');
            btn.disabled = false;
        } else if (mode === 'disconnect') {
            btn.textContent = 'DISCONNECT';
            btn.classList.add('state-disconnect');
            btn.disabled = false;
        } else {
            btn.textContent = 'ENGAGE';
            btn.disabled = true;
        }
    }

    /**
     * Reset to idle state
     */
    reset() {
        this.state = 'idle';
        this.buffer = [];
        this.lockedChevrons = [];
        this.destination = null;

        // Reset ring
        this.ringController.reset();

        // Reset chevrons (visual)
        document.querySelectorAll('.chevron').forEach(c => {
            c.classList.remove('encoding', 'locked');
        });

        // Reset chevron indicators
        if (this.dom.chevronIndicators) {
            this.dom.chevronIndicators.querySelectorAll('.chev-indicator').forEach(ind => {
                ind.classList.remove('encoding', 'active');
            });
        }

        // Reset buffer display
        this.updateBufferDisplay();

        // Reset status
        if (this.dom.statusLog) this.dom.statusLog.textContent = 'AWAITING';
        if (this.dom.destInfo) this.dom.destInfo.textContent = '';

        // Deactivate event horizon
        this.dom.eventHorizon.classList.remove('active');

        // Reset controls
        this.setEngageBtn('engage');
        this.disableGlyphGrid(false);

        // Reset system status
        if (this.dom.headerStatus) this.dom.headerStatus.textContent = 'IDLE';

        // Reset signal mode
        if (this.signalStrength) {
            this.signalStrength.setMode('idle');
        }

        // Clear glyph grid highlights
        this.dom.glyphGrid.querySelectorAll('.dhd-key').forEach(k => {
            k.classList.remove('selected');
        });

        // Re-enable quick dial
        this.disableQuickDial(false);

        this.log('Gate reset. Standing by.');
    }

    /**
     * Toggle iris (visual only)
     */
    toggleIris() {
        this.log('Iris control activated.');
        // Future: Add iris overlay animation
    }

    /**
     * Highlight a glyph grid key
     */
    highlightDHDKey(glyphId) {
        const key = this.dom.glyphGrid.querySelector(`[data-glyph-id="${glyphId}"]`);
        if (key) {
            key.classList.add('selected');
        }
    }

    /**
     * Disable/enable glyph grid
     */
    disableGlyphGrid(disabled) {
        this.dom.glyphGrid.querySelectorAll('.dhd-key').forEach(k => {
            k.disabled = disabled;
        });
    }

    /**
     * Find destination by address
     */
    findDestination(address) {
        for (const [key, dest] of Object.entries(ADDRESSES)) {
            if (JSON.stringify(dest.address) === JSON.stringify(address)) {
                return dest;
            }
        }
        return {
            name: 'UNKNOWN WORLD',
            designation: 'P??-???',
            description: 'No data available. Proceed with caution.'
        };
    }

    /**
     * Log a message to the status panel
     */
    log(message) {
        if (this.dom.statusLog) {
            this.dom.statusLog.textContent = message;
        }
        console.log('[SDC]', message);
    }

    /**
     * Enable/disable fast mode — scales timing and ring physics
     */
    setFastMode(enabled) {
        this.fastMode = enabled;
        const rc = this.ringController.config;
        if (enabled) {
            rc.maxVelocity = 900;
            rc.acceleration = 1800;
        } else {
            rc.maxVelocity = 120;
            rc.acceleration = 200;
        }
    }

    /**
     * Timing helper — returns ms scaled by fast mode multiplier
     */
    t(ms) {
        return this.fastMode ? Math.round(ms / this.fastMultiplier) : ms;
    }

    /**
     * Helper: Sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.sdcEngine = new SDCEngine();
    window.sdcEngine.init();
});
