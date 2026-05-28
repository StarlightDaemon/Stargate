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

        // Criss-cross chevron sequences
        this.sequences = {
            7: [1, 8, 2, 7, 3, 6, 9],
            8: [1, 8, 2, 7, 3, 6, 4, 9],
            9: [1, 8, 2, 7, 3, 6, 4, 5, 9]
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
        this.bindEvents();
        this.populateAddressBook();
        this.generateDHDKeyboard();
        this.log('System initialized. Ready for dialing sequence.');
    }

    cacheDom() {
        this.dom = {
            svg: document.getElementById('stargateSvg'),
            innerRing: document.getElementById('innerRing'),
            eventHorizon: document.getElementById('eventHorizon'),
            kawoosh: document.getElementById('kawooshEffect'),

            // Fusion layout elements
            headerStatus: document.getElementById('headerStatus'),
            chevronIndicators: document.getElementById('chevronIndicators'),
            destCode: document.getElementById('destCode'),
            statusInfo: document.getElementById('statusInfo'),
            bufferDisplay: document.getElementById('bufferDisplay'),
            addressBook: document.getElementById('addressBook'),
            dhdGrid: document.getElementById('dhdGrid'),
            btnEngage: document.getElementById('engageBtn'),
            statusText: document.getElementById('statusText'),
            chevronCount: document.getElementById('chevronCount')
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

    bindEvents() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.state !== 'idle') return;
                this.mode = parseInt(btn.dataset.mode);
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.reset();
                this.updateChevronCount();
            });
        });

        // Engage button
        this.dom.btnEngage.addEventListener('click', () => this.engage());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.abort();
            if (e.key === 'Enter' && !this.dom.btnEngage.disabled) this.engage();
        });
    }

    populateAddressBook() {
        this.dom.addressBook.innerHTML = '';

        Object.entries(ADDRESSES).forEach(([key, addr]) => {
            const btn = document.createElement('button');
            btn.className = 'address-btn';
            btn.innerHTML = `
                <span class="planet-name">${addr.name}</span>
                <span class="planet-code">${addr.designation}</span>
            `;
            btn.addEventListener('click', () => this.autoDial(key));
            this.dom.addressBook.appendChild(btn);
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
     * Update chevron count display
     */
    updateChevronCount() {
        if (this.dom.chevronCount) {
            this.dom.chevronCount.textContent = `${this.lockedChevrons.length}/${this.mode}`;
        }
    }

    /**
     * Update buffer display slots
     */
    updateBufferDisplay() {
        const slots = this.dom.bufferSlots.querySelectorAll('.buffer-slot:not(.poo)');
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

        this.log(`Auto-dialing: ${address.name}`);
        this.destination = address;

        // Update signal strength to dialing mode
        if (this.signalStrength) {
            this.signalStrength.setMode('dialing');
        }

        // Enter glyphs with delay
        for (const glyphId of address.address) {
            this.handleGlyphClick(glyphId);
            await this.sleep(200);
        }

        // Auto-engage after brief delay
        await this.sleep(500);
        this.engage();
    }

    /**
     * Engage the dialing sequence
     */
    async engage() {
        if (this.state !== 'dialing' || this.buffer.length < this.mode - 1) {
            return;
        }

        this.state = 'locking';
        this.dom.btnEngage.disabled = true;
        this.disableKeyboard(true);

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
            await this.sleep(this.timing.encodeDelay);
            this.lockChevron(chevronNum, i);
            this.setChevronState(i, 'locked');

            // Play chevron lock sound
            if (typeof audioManager !== 'undefined') {
                audioManager.play('chevronLock');
            }

            this.log(`Chevron ${i + 1} locked.`);

            // Delay before next chevron
            await this.sleep(this.timing.interChevronDelay);
        }

        // Establish wormhole
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
     * Set chevron state in left panel indicators
     */
    setChevronState(index, state) {
        const indicators = this.dom.chevronIndicators.querySelectorAll('.chev-indicator');
        if (indicators[index]) {
            indicators[index].classList.remove('encoding', 'active');
            if (state === 'encoding' || state === 'locked') {
                indicators[index].classList.add('active');
            }
        }

        // Update chevron count
        this.updateChevronCount();
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

        await this.sleep(this.timing.kawooshDuration);

        this.dom.kawoosh.classList.remove('active');

        // Activate event horizon
        this.dom.eventHorizon.classList.add('active');

        // Update destination display
        if (this.destination) {
            this.dom.destCode.textContent = this.destination.designation;
            this.dom.statusInfo.textContent = this.destination.description;
        } else {
            this.dom.destCode.textContent = 'P??-???';
            this.dom.statusInfo.textContent = 'Unknown world';
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
     * Abort the current operation
     */
    abort() {
        if (this.state === 'idle') return;

        this.state = 'aborting';
        this.log('Aborting sequence...');

        // Play abort sound
        if (typeof audioManager !== 'undefined') {
            audioManager.play('abort');
        }

        // Stop ring
        this.ringController.stop();

        // Reset after short delay
        setTimeout(() => this.reset(), 500);
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

        // Reset destination
        if (this.dom.destCode) this.dom.destCode.textContent = '---';
        if (this.dom.statusInfo) this.dom.statusInfo.textContent = 'AWAITING';

        // Deactivate event horizon
        this.dom.eventHorizon.classList.remove('active');

        // Reset controls
        this.dom.btnEngage.disabled = true;
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

        // Update chevron count
        this.updateChevronCount();

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
        // Update status text
        if (this.dom.statusInfo) {
            this.dom.statusInfo.textContent = message;
        }
        console.log('[SDC]', message);
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
