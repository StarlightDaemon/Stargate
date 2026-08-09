const MAX_SEQUENCE_LENGTH = 4;
let currentSequence = [];
let isSystemActive = false;
let idleHumOscillator = null;

const AudioSys = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.startIdleHum();
        }
    },
    startIdleHum() {
        if (idleHumOscillator) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(50, this.ctx.currentTime); // Low hum
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        idleHumOscillator = osc;
    },
    playTone(freq, type = 'sine', duration = 0.3, volume = 0.3) {
        if (!this.ctx) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    playButtonHover() { this.playTone(800, 'sine', 0.1, 0.02); },
    playSymbolSelect(index) { this.playTone(400 + (index * 100), 'sine', 0.2, 0.2); },
    playChevronLock(index) {
        // Distinct mechanical lock sound
        const base = [200, 250, 300, 350][index];
        this.playTone(base, 'square', 0.2, 0.1);
        this.playTone(100, 'sawtooth', 0.15, 0.15); // Mechanical thud
        setTimeout(() => this.playTone(base*2, 'sine', 0.3, 0.1), 50); // Resonance
    },
    playError() { this.playTone(150, 'sawtooth', 0.4, 0.2); },
    playClear() { this.playTone(300, 'sine', 0.2); setTimeout(() => this.playTone(200, 'sine', 0.2), 100); },
    playEngage() {
        if (!this.ctx) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 1.8);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 2.5);
    },
    playSuccess() {
        if (!this.ctx) return;
        setTimeout(() => this.playTone(600, 'sine', 0.2, 0.3), 1500);
        setTimeout(() => this.playTone(800, 'sine', 0.4, 0.3), 1700);
        setTimeout(() => this.playTone(1200, 'sine', 0.6, 0.3), 1900);
    }
};

// 24 Unique Glyphs
const symbols = [
    { id: 'S1', name: 'Aperture', svg: '<circle cx="50" cy="50" r="30"/><path d="M50 20 L80 50 L50 80 L20 50 Z"/>' },
    { id: 'S2', name: 'Vector', svg: '<path d="M30 80 L50 20 L70 80 L50 60 Z"/>' },
    { id: 'S3', name: 'Meridian', svg: '<circle cx="50" cy="50" r="35"/><line x1="50" y1="15" x2="50" y2="85"/><line x1="15" y1="50" x2="85" y2="50"/><ellipse cx="50" cy="50" rx="35" ry="10"/>' },
    { id: 'S4', name: 'Zenith', svg: '<polygon points="50,20 80,70 20,70"/><line x1="50" y1="70" x2="50" y2="20"/>' },
    { id: 'S5', name: 'Equinox', svg: '<circle cx="50" cy="50" r="30"/><path d="M50 20 A30 30 0 0 1 50 80 Z"/>' },
    { id: 'S6', name: 'Prism', svg: '<polygon points="50,20 80,70 20,70"/><line x1="20" y1="70" x2="80" y2="20"/>' },
    { id: 'S7', name: 'Lattice', svg: '<path d="M25 25 L75 25 M25 50 L75 50 M25 75 L75 75 M25 25 L25 75 M50 25 L50 75 M75 25 L75 75"/>' },
    { id: 'S8', name: 'Solstice', svg: '<circle cx="50" cy="50" r="15"/><path d="M50 15 L50 25 M85 50 L75 50 M50 85 L50 75 M15 50 L25 50 M75 25 L68 32 M75 75 L68 68 M25 75 L32 68 M25 25 L32 32"/>' },
    { id: 'S9', name: 'Orbit', svg: '<circle cx="50" cy="50" r="15"/><ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(30 50 50)"/>' },
    { id: 'S10', name: 'Helix', svg: '<path d="M20 20 Q50 80 80 20 M20 80 Q50 20 80 80"/>' },
    { id: 'S11', name: 'Pulsar', svg: '<circle cx="50" cy="50" r="10"/><circle cx="50" cy="50" r="25" stroke-dasharray="5,5"/><circle cx="50" cy="50" r="40" stroke-dasharray="10,5"/>' },
    { id: 'S12', name: 'Nexus', svg: '<circle cx="50" cy="50" r="30"/><line x1="28" y1="28" x2="72" y2="72"/><line x1="28" y1="72" x2="72" y2="28"/>' },
    { id: 'S13', name: 'Echo', svg: '<path d="M30 50 A20 20 0 0 1 70 50 M20 50 A30 30 0 0 1 80 50 M10 50 A40 40 0 0 1 90 50"/>' },
    { id: 'S14', name: 'Vertex', svg: '<path d="M20 20 L80 20 L80 80 M20 20 L80 80"/>' },
    { id: 'S15', name: 'Cosmos', svg: '<circle cx="30" cy="30" r="5"/><circle cx="70" cy="40" r="8"/><circle cx="40" cy="70" r="6"/><path d="M30 30 L40 70 L70 40 Z" stroke-dasharray="3,3"/>' },
    { id: 'S16', name: 'Catalyst', svg: '<path d="M40 15 L60 15 L50 45 L70 45 L30 85 L40 45 L20 45 Z"/>' },
    { id: 'S17', name: 'Horizon', svg: '<line x1="10" y1="50" x2="90" y2="50"/><path d="M20 50 A30 30 0 0 1 80 50"/>' },
    { id: 'S18', name: 'Continuum', svg: '<path d="M20 50 Q20 20 50 50 T80 50 Q80 80 50 50 T20 50"/>' },
    { id: 'S19', name: 'Pinnacle', svg: '<polygon points="50,10 70,50 50,90 30,50"/>' },
    { id: 'S20', name: 'Apex', svg: '<path d="M20 80 L50 20 L80 80"/>' },
    { id: 'S21', name: 'Beacon', svg: '<path d="M40 80 L60 80 L50 40 Z"/><line x1="50" y1="10" x2="50" y2="25"/><path d="M30 30 A20 20 0 0 1 70 30"/>' },
    { id: 'S22', name: 'Parallax', svg: '<rect x="20" y="20" width="40" height="40"/><rect x="40" y="40" width="40" height="40"/>' },
    { id: 'S23', name: 'Quantum', svg: '<ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(45 50 50)"/><ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(-45 50 50)"/><circle cx="50" cy="50" r="5"/>' },
    { id: 'S24', name: 'Kinetic', svg: '<line x1="20" y1="30" x2="60" y2="30"/><line x1="40" y1="50" x2="80" y2="50"/><line x1="20" y1="70" x2="60" y2="70"/><circle cx="65" cy="30" r="5"/><circle cx="85" cy="50" r="5"/><circle cx="65" cy="70" r="5"/>' }
];

const destinations = [
    { id: 'D1', name: 'Lunar Botanical Gardens', sequence: ['S1', 'S18', 'S9', 'S5'], x: 20, y: 30, meta: { dist: '1.3 LS', auth: 'Public', gravity: '0.16g' } },
    { id: 'D2', name: 'Oceanic Research Pavilion', sequence: ['S3', 'S13', 'S17', 'S2'], x: 70, y: 40, meta: { dist: '400km Depth', auth: 'Level 2', gravity: '1.0g' } },
    { id: 'D3', name: 'Starlight Observatory', sequence: ['S4', 'S15', 'S21', 'S19'], x: 50, y: 80, meta: { dist: 'Geo-Sync', auth: 'Public', gravity: 'Micro' } },
    { id: 'D4', name: 'Aero-Transit Hub Delta', sequence: ['S24', 'S7', 'S12', 'S14'], x: 80, y: 20, meta: { dist: 'Surface', auth: 'Transit', gravity: '1.0g' } }
];

const els = {
    symbolGrid: document.getElementById('symbol-grid'),
    destList: document.getElementById('destination-list'),
    logList: document.getElementById('activity-log'),
    seqSlots: document.querySelectorAll('.sequence-slot'),
    ringEnergyFill: document.getElementById('ring-energy-fill'),
    ringStatus: document.getElementById('ring-status'),
    portalSurface: document.getElementById('portal-surface'),
    ringContainer: document.querySelector('.ring-container'),
    btnEngage: document.getElementById('btn-engage'),
    btnClear: document.getElementById('btn-clear'),
    btnRefOpen: document.getElementById('operator-reference-btn'),
    btnRefClose: document.getElementById('close-reference-btn'),
    overlayRef: document.getElementById('operator-reference-overlay'),
    chevrons: [
        document.getElementById('chev-0'),
        document.getElementById('chev-1'),
        document.getElementById('chev-2'),
        document.getElementById('chev-3')
    ],
    animLayer: document.getElementById('animation-layer'),
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    starChart: document.getElementById('star-chart-svg')
};

function init() {
    renderSymbols();
    renderDestinations();
    renderStarChart();
    bindEvents();
    logActivity('System initialized. Awaiting input.', 'success');
}

function renderSymbols() {
    symbols.forEach(sym => {
        const btn = document.createElement('button');
        btn.className = 'symbol-btn';
        btn.dataset.id = sym.id;
        btn.innerHTML = `<svg viewBox="0 0 100 100">${sym.svg}</svg><span>${sym.name}</span>`;
        btn.addEventListener('mouseenter', () => { if(!isSystemActive) AudioSys.playButtonHover(); });
        btn.addEventListener('click', (e) => handleSymbolClick(sym, btn, e));
        els.symbolGrid.appendChild(btn);
    });
}

function renderDestinations() {
    destinations.forEach(dest => {
        const li = document.createElement('li');
        li.className = 'dest-item';
        const seqNames = dest.sequence.map(id => symbols.find(s => s.id === id).name).join(', ');
        li.innerHTML = `
            <div class="dest-info">
                <div class="dest-name">${dest.name}</div>
                <div class="dest-meta">
                    <span class="meta-tag">${dest.meta.dist}</span>
                    <span class="meta-tag">${dest.meta.auth}</span>
                    <span class="meta-tag">${dest.meta.gravity}</span>
                </div>
                <div class="dest-meta">Coord: ${seqNames}</div>
            </div>
            <button class="btn btn-express" data-target="${dest.id}">Express Token</button>
        `;
        li.querySelector('.btn-express').addEventListener('click', () => handleExpressDial(dest));
        els.destList.appendChild(li);
    });
}

function renderStarChart() {
    let svgHtml = '';
    // Draw links to center
    destinations.forEach(dest => {
        svgHtml += `<line x1="50" y1="50" x2="${dest.x}" y2="${dest.y}" class="sc-link" />`;
    });
    // Draw center
    svgHtml += `<circle cx="50" cy="50" r="3" class="sc-node" fill="#ffffff" /><text x="50" y="56" class="sc-label">PAVILION</text>`;
    // Draw nodes
    destinations.forEach(dest => {
        svgHtml += `
            <circle cx="${dest.x}" cy="${dest.y}" r="2" class="sc-node" />
            <text x="${dest.x}" y="${dest.y + 4}" class="sc-label">${dest.name.split(' ')[0]}</text>
        `;
    });
    els.starChart.innerHTML = svgHtml;
}

function bindEvents() {
    els.btnClear.addEventListener('click', () => {
        if (isSystemActive) return;
        AudioSys.playClear();
        clearSequence();
    });
    els.btnEngage.addEventListener('click', () => {
        if (isSystemActive || currentSequence.length !== MAX_SEQUENCE_LENGTH) return;
        engageTransit();
    });
    els.btnRefOpen.addEventListener('click', () => els.overlayRef.classList.remove('hidden'));
    els.btnRefClose.addEventListener('click', () => els.overlayRef.classList.add('hidden'));
    document.body.addEventListener('click', () => AudioSys.init(), { once: true });

    els.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            els.tabs.forEach(t => t.classList.remove('active'));
            els.tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

function handleSymbolClick(sym, btn, e) {
    if (isSystemActive) return;
    if (currentSequence.length >= MAX_SEQUENCE_LENGTH) {
        AudioSys.playError();
        logActivity('Sequence buffer full.', 'warn');
        return;
    }
    if (currentSequence.includes(sym.id)) {
        AudioSys.playError();
        logActivity(`Symbol ${sym.name} already in sequence.`, 'warn');
        return;
    }

    const index = currentSequence.length;
    currentSequence.push(sym.id);
    btn.classList.add('active');
    AudioSys.playSymbolSelect(index);
    logActivity(`Coordinate locked: ${sym.name}`);

    // Animate to Chevron
    animateLock(sym, btn, index);
}

function animateLock(sym, btn, index) {
    const startRect = btn.getBoundingClientRect();
    const targetChev = els.chevrons[index];
    const endRect = targetChev.getBoundingClientRect();
    
    const floater = document.createElement('div');
    floater.className = 'floating-glyph';
    floater.innerHTML = `<svg viewBox="0 0 100 100">${sym.svg}</svg>`;
    floater.style.left = `${startRect.left + startRect.width/2 - 20}px`;
    floater.style.top = `${startRect.top + startRect.height/2 - 20}px`;
    
    els.animLayer.appendChild(floater);

    // Force reflow
    void floater.offsetWidth;
    
    floater.style.left = `${endRect.left + endRect.width/2 - 20}px`;
    floater.style.top = `${endRect.top + endRect.height/2 - 20}px`;

    setTimeout(() => {
        floater.remove();
        targetChev.classList.add('locked');
        targetChev.querySelector('.chev-inner').innerHTML = `<svg viewBox="0 0 100 100">${sym.svg}</svg>`;
        AudioSys.playChevronLock(index);
        updateDisplay();
    }, 600); // matches transition time
}

function updateDisplay() {
    els.seqSlots.forEach((slot, idx) => {
        if (idx < currentSequence.length) {
            const sym = symbols.find(s => s.id === currentSequence[idx]);
            slot.innerHTML = `<svg viewBox="0 0 100 100">${sym.svg}</svg>`;
            slot.classList.add('filled');
        } else {
            slot.innerHTML = '';
            slot.classList.remove('filled');
        }
    });
    
    const progress = (currentSequence.length / MAX_SEQUENCE_LENGTH) * 100;
    els.ringEnergyFill.style.setProperty('--fill-angle', `${progress}%`);
    
    if (currentSequence.length === MAX_SEQUENCE_LENGTH) {
        els.ringStatus.textContent = 'READY TO ENGAGE';
        els.ringStatus.className = 'ring-status status-ready';
        els.btnEngage.disabled = false;
    } else {
        els.ringStatus.textContent = 'AWAITING INPUT';
        els.ringStatus.className = 'ring-status';
        els.btnEngage.disabled = true;
    }
}

function clearSequence() {
    currentSequence = [];
    document.querySelectorAll('.symbol-btn.active').forEach(b => b.classList.remove('active'));
    els.chevrons.forEach(chev => {
        chev.classList.remove('locked');
        chev.querySelector('.chev-inner').innerHTML = '';
    });
    updateDisplay();
    logActivity('Sequence cleared.');
    els.portalSurface.classList.remove('active');
    els.ringContainer.classList.remove('spin');
}

async function handleExpressDial(dest) {
    if (isSystemActive) return;
    clearSequence();
    logActivity(`Express Token inserted for ${dest.name}...`);
    
    // Simulate mechanical input delay
    for (let i = 0; i < dest.sequence.length; i++) {
        await new Promise(r => setTimeout(r, 800)); // Time for animation to finish
        const symId = dest.sequence[i];
        const sym = symbols.find(s => s.id === symId);
        const btn = document.querySelector(`.symbol-btn[data-id="${symId}"]`);
        handleSymbolClick(sym, btn);
    }
    await new Promise(r => setTimeout(r, 1000));
    engageTransit();
}

function engageTransit() {
    isSystemActive = true;
    els.btnEngage.disabled = true;
    els.btnClear.disabled = true;
    document.querySelectorAll('.symbol-btn').forEach(b => b.disabled = true);
    document.querySelectorAll('.btn-express').forEach(b => b.disabled = true);
    
    AudioSys.playEngage();
    logActivity('TRANSIT SEQUENCE INITIATED.', 'warn');
    els.ringStatus.textContent = 'TRANSIT ACTIVE';
    els.ringStatus.className = 'ring-status status-active';
    els.ringContainer.classList.add('spin');
    
    setTimeout(() => {
        els.portalSurface.classList.add('active');
        AudioSys.playSuccess();
        const destMatch = destinations.find(d => JSON.stringify(d.sequence) === JSON.stringify(currentSequence));
        const destName = destMatch ? destMatch.name : 'Unknown Coordinate';
        logActivity(`Connection established to: ${destName}`, 'success');
        
        setTimeout(() => {
            logActivity('Transit complete. Connection closed.', 'warn');
            clearSequence();
            isSystemActive = false;
            document.querySelectorAll('.symbol-btn').forEach(b => b.disabled = false);
            document.querySelectorAll('.btn-express').forEach(b => b.disabled = false);
            els.btnClear.disabled = false;
        }, 5000);
    }, 1500);
}

function logActivity(message, type = 'normal') {
    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString([], { hour12: false });
    li.textContent = `[${time}] ${message}`;
    if (type !== 'normal') li.className = type;
    els.logList.appendChild(li);
    els.logList.parentElement.scrollTop = els.logList.parentElement.scrollHeight;
}

init();
