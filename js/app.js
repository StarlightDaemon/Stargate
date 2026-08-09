const symbols = [
    { id: 'S0', name: 'Origin', svg: '<polygon points="50,15 85,85 15,85"/><circle cx="50" cy="65" r="12"/>' }, // Used for Engage Final Lock
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
    { id: 'D1', name: 'Lunar Botanical Gardens', sequence: ['S1', 'S18', 'S9', 'S5'], x: 20, y: 30, meta: { dist: '1.3 LS', auth: 'Public', gravity: '0.16g' }, adv: false, tokenClass: 'public' },
    { id: 'D2', name: 'Oceanic Research Pavilion', sequence: ['S3', 'S13', 'S17', 'S2'], x: 70, y: 40, meta: { dist: '400km Depth', auth: 'Level 2', gravity: '1.0g' }, adv: false, tokenClass: 'standard' },
    { id: 'D3', name: 'Starlight Observatory', sequence: ['S4', 'S15', 'S21', 'S19'], x: 50, y: 80, meta: { dist: 'Geo-Sync', auth: 'Public', gravity: 'Micro' }, adv: false, tokenClass: 'public' },
    { id: 'D4', name: 'Aegis Defense Perimeter', sequence: ['S8', 'S6', 'S16', 'S20'], x: 15, y: 70, meta: { dist: '1.5 AU', auth: 'Level 5', gravity: '1.2g' }, adv: false, tokenClass: 'emergency' },
    { id: 'D5', name: 'Solar Core Tap', sequence: ['S10', 'S24', 'S1', 'S11'], x: 80, y: 80, meta: { dist: '1.0 AU', auth: 'Engineering', gravity: '0.8g' }, adv: false, tokenClass: 'vip' },
    { id: 'D6', name: 'Alpha Centauri Embassy', sequence: ['S18', 'S22', 'S12', 'S19', 'S14', 'S3', 'S6', 'S2'], x: 90, y: 50, meta: { dist: '4.3 LY', auth: 'Diplomatic', gravity: '1.0g' }, adv: true, tokenClass: 'diplomatic' },
    { id: 'D7', name: 'Deep Space Terminal Nine', sequence: ['S24', 'S7', 'S12', 'S14', 'S22', 'S11', 'S10', 'S23'], x: 90, y: 10, meta: { dist: '40.5 LY', auth: 'Advanced', gravity: '1.2g' }, adv: true, tokenClass: 'vip' }
];

// Configuration
let isAdvancedMode = false;
let currentMaxSequence = 4;
const chevOrders = {
    standard: [1, 8, 2, 7],
    advanced: [1, 8, 2, 7, 3, 6, 4, 5]
};
let currentSequence = [];
let dialQueue = [];
let isSystemActive = false;
let isDialing = false;
let currentRingRotation = 0;
let lastRotationDirection = 1; // 1 CW, -1 CCW

const AudioSys = {
    ctx: null, portalOsc: null, portalGain: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    playTone(freq, type = 'sine', duration = 0.3, volume = 0.3) {
        if (!this.ctx) return; this.init();
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    playButtonHover() { this.playTone(800, 'sine', 0.1, 0.02); },
    playSymbolSelect(index) { this.playTone(400 + (index * 100), 'sine', 0.2, 0.2); },
    playChevronLock(index) {
        const base = 250 + (index * 20);
        this.playTone(base, 'square', 0.2, 0.1);
        this.playTone(100, 'sawtooth', 0.15, 0.15); // Mechanical clamp
    },
    playFinalLock() {
        this.playTone(150, 'sawtooth', 0.5, 0.3);
        this.playTone(300, 'square', 0.4, 0.2);
        setTimeout(() => this.playTone(100, 'triangle', 0.8, 0.4), 100);
    },
    playError() { this.playTone(150, 'sawtooth', 0.4, 0.2); },
    playClear() { this.playTone(300, 'sine', 0.2); setTimeout(() => this.playTone(200, 'sine', 0.2), 100); },
    playDischarge() {
        if (!this.ctx) return; this.init();
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1.0);
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 1.0);
    },
    startPortalHum() {
        if (this.portalOsc) return;
        this.portalOsc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        this.portalOsc.type = 'sine'; this.portalOsc.frequency.setValueAtTime(120, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        this.portalOsc.connect(gain); gain.connect(this.ctx.destination);
        this.portalOsc.start(); this.portalGain = gain;
    },
    stopPortalHum() {
        if (this.portalOsc) {
            this.portalGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);
            this.portalOsc.stop(this.ctx.currentTime + 1.0); this.portalOsc = null;
        }
    },
    playCollapse() {
        this.playTone(200, 'sawtooth', 0.8, 0.3);
        setTimeout(() => this.playTone(100, 'sine', 0.5, 0.2), 200);
    }
};

const els = {
    symbolGrid: document.getElementById('symbol-grid'), destList: document.getElementById('destination-list'),
    logList: document.getElementById('activity-log'), seqDisplay: document.getElementById('sequence-display'),
    ringStatus: document.getElementById('ring-status'), portalSurface: document.getElementById('portal-surface'),
    ringRotator: document.getElementById('ring-rotator'), energyDischarge: document.getElementById('energy-discharge'),
    btnEngage: document.getElementById('btn-engage'), btnClear: document.getElementById('btn-clear'),
    btnRefOpen: document.getElementById('operator-reference-btn'), btnRefClose: document.getElementById('close-reference-btn'),
    overlayRef: document.getElementById('operator-reference-overlay'), advToggle: document.getElementById('adv-route-toggle'),
    chevrons: [
        document.getElementById('chev-0'), document.getElementById('chev-1'), document.getElementById('chev-2'),
        document.getElementById('chev-3'), document.getElementById('chev-4'), document.getElementById('chev-5'),
        document.getElementById('chev-6'), document.getElementById('chev-7'), document.getElementById('chev-8')
    ],
    tabs: document.querySelectorAll('.tab-btn'), tabContents: document.querySelectorAll('.tab-content'),
    starChart: document.getElementById('star-chart-svg')
};

function logActivity(msg, type = 'normal') {
    const li = document.createElement('li');
    li.className = type;
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    li.textContent = `[${time}] ${msg}`;
    els.logList.appendChild(li);
    els.logList.parentElement.scrollTop = els.logList.parentElement.scrollHeight;
}

function init() {
    renderRingGlyphs();
    renderSymbols();
    renderDestinations();
    renderStarChart();
    updateSequenceDisplay();
    bindEvents();
    logActivity('System initialized. Standby.', 'success');
}

function renderRingGlyphs() {
    els.ringRotator.innerHTML = '';
    const angleStep = 360 / symbols.length; // 25 glyphs -> 14.4 degrees
    symbols.forEach((sym, idx) => {
        const div = document.createElement('div');
        div.className = 'glyph-on-ring';
        // Position on the edge of the 500px ring (radius 250px)
        // translateY(-235) to sit inside the track
        div.style.transform = `rotate(${idx * angleStep}deg) translateY(-225px) rotate(180deg)`;
        div.innerHTML = `<svg viewBox="0 0 100 100">${sym.svg}</svg>`;
        els.ringRotator.appendChild(div);
    });
}

function renderSymbols() {
    els.symbolGrid.innerHTML = '';
    // Skip index 0 (Origin) for the input console
    for (let i = 1; i < symbols.length; i++) {
        const sym = symbols[i];
        const btn = document.createElement('button');
        btn.className = 'symbol-btn'; btn.dataset.id = sym.id;
        btn.innerHTML = `<svg viewBox="0 0 100 100">${sym.svg}</svg><span>${sym.name}</span>`;
        btn.addEventListener('mouseenter', () => { if(!isSystemActive && !isDialing) AudioSys.playButtonHover(); });
        btn.addEventListener('click', () => handleSymbolClick(sym, btn));
        els.symbolGrid.appendChild(btn);
    }
}

function renderDestinations() {
    els.destList.innerHTML = '';
    destinations.forEach(dest => {
        if (dest.adv && !isAdvancedMode) return; // Hide advanced destinations in standard mode
        const li = document.createElement('li'); li.className = 'dest-item';
        const seqNames = dest.sequence.map(id => symbols.find(s => s.id === id).name).join(', ');
        li.innerHTML = `
            <div class="dest-info">
                <div class="dest-name">${dest.name}</div>
                <div class="dest-meta">
                    <span class="meta-tag">${dest.meta.dist}</span><span class="meta-tag">${dest.meta.auth}</span><span class="meta-tag">${dest.meta.gravity}</span>
                </div>
                <div class="dest-meta">Coord: ${seqNames}</div>
            </div>
            <button class="btn btn-express token-${dest.tokenClass}" data-target="${dest.id}">
                ${getTokenIcon(dest.tokenClass)} Express Token
            </button>
        `;
        li.querySelector('.btn-express').addEventListener('click', () => handleExpressDial(dest));
        els.destList.appendChild(li);
    });
}

function getTokenIcon(type) {
    switch(type) {
        case 'vip': return '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L15 9h8l-6 5 2 8-7-5-7 5 2-8-6-5h8z"/></svg>';
        case 'emergency': return '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
        case 'diplomatic': return '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>';
        case 'public':
        case 'standard':
        default: return '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 11.5v-1c0-.8-.7-1.5-1.5-1.5H16v-2c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4.5c-.8 0-1.5.7-1.5 1.5v1c0 .8.7 1.5 1.5 1.5H8v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2h3.5c.8 0 1.5-.7 1.5-1.5z"/></svg>';
    }
}

function renderStarChart() {
    let svgHtml = '';
    destinations.forEach(dest => {
        if (dest.adv && !isAdvancedMode) return;
        svgHtml += `<line x1="50" y1="50" x2="${dest.x}" y2="${dest.y}" class="sc-link" />`;
    });
    svgHtml += `<circle cx="50" cy="50" r="3" class="sc-node" fill="#ffffff" /><text x="50" y="56" class="sc-label">PAVILION</text>`;
    destinations.forEach(dest => {
        if (dest.adv && !isAdvancedMode) return;
        svgHtml += `<circle cx="${dest.x}" cy="${dest.y}" r="2" class="sc-node" /><text x="${dest.x}" y="${dest.y + 4}" class="sc-label">${dest.name.split(' ')[0]}</text>`;
    });
    els.starChart.innerHTML = svgHtml;
}

function bindEvents() {
    els.btnClear.addEventListener('click', () => {
        if (isSystemActive || isDialing) return;
        AudioSys.playClear(); clearSequence();
    });
    els.btnEngage.addEventListener('click', () => {
        if (isSystemActive) { disengageTransit(); }
        else if (currentSequence.length === currentMaxSequence && !isDialing) { engageTransit(); }
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

    els.advToggle.addEventListener('change', (e) => {
        if (isSystemActive || isDialing) {
            e.target.checked = !e.target.checked;
            logActivity('Cannot change routing mode while system active.', 'error');
            return;
        }
        isAdvancedMode = e.target.checked;
        currentMaxSequence = isAdvancedMode ? 8 : 4;
        clearSequence();
        renderDestinations();
        renderStarChart();
        updateSequenceDisplay();
        logActivity(`Routing Mode set to: ${isAdvancedMode ? 'Advanced (8-Symbol)' : 'Standard (4-Symbol)'}`, 'warn');
    });
}

function handleSymbolClick(sym, btn) {
    if (isSystemActive || isDialing) return;
    if (currentSequence.length + dialQueue.length >= currentMaxSequence) {
        AudioSys.playError(); logActivity('Sequence buffer full.', 'warn'); return;
    }
    if (currentSequence.includes(sym.id) || dialQueue.includes(sym)) {
        AudioSys.playError(); logActivity(`Symbol ${sym.name} already in sequence.`, 'warn'); return;
    }

    btn.classList.add('active');
    AudioSys.playSymbolSelect(currentSequence.length + dialQueue.length);
    dialQueue.push(sym);
    if (!isDialing) processDialQueue();
}

async function processDialQueue() {
    isDialing = true;
    els.advToggle.disabled = true;
    els.btnClear.disabled = true;
    
    while (dialQueue.length > 0) {
        const sym = dialQueue.shift();
        const seqIndex = currentSequence.length;
        const chevOrderArr = isAdvancedMode ? chevOrders.advanced : chevOrders.standard;
        const chevIndex = chevOrderArr[seqIndex];
        const targetChev = els.chevrons[chevIndex];
        const glyphIndex = symbols.findIndex(s => s.id === sym.id);
        
        targetChev.classList.add('seeking');
        await rotateRingToAlign(glyphIndex, chevIndex);
        
        targetChev.classList.remove('seeking');
        targetChev.classList.add('locked');
        AudioSys.playChevronLock(seqIndex);
        
        currentSequence.push(sym.id);
        updateSequenceDisplay();
        await new Promise(r => setTimeout(r, 400));
    }
    
    isDialing = false;
    els.btnClear.disabled = false;
    els.advToggle.disabled = false;
    
    if (currentSequence.length === currentMaxSequence) {
        els.ringStatus.textContent = 'READY TO ENGAGE';
        els.ringStatus.className = 'ring-status status-ready';
        els.btnEngage.disabled = false;
    }
}

function rotateRingToAlign(glyphIndex, chevIndex) {
    return new Promise(resolve => {
        const angleStep = 360 / symbols.length;
        const A_g = glyphIndex * angleStep;
        const A_c = [0, 40, 80, 120, 160, 200, 240, 280, 320][chevIndex];
        
        let TargetR_base = (A_c - A_g) % 360;
        if (TargetR_base < 0) TargetR_base += 360;
        let CurrentR_mod = ((currentRingRotation % 360) + 360) % 360;
        let delta = TargetR_base - CurrentR_mod;
        
        if (lastRotationDirection === 1) { // CW
            if (delta <= 0) delta += 360;
            delta += 360; // Extra spin for mechanical richness
        } else { // CCW
            if (delta >= 0) delta -= 360;
            delta -= 360;
        }
        
        let NewR = currentRingRotation + delta;
        currentRingRotation = NewR;
        lastRotationDirection *= -1; // alternate next time
        
        // Easing out, decelerates visibly
        els.ringRotator.style.transition = `transform 1.8s cubic-bezier(0.25, 1, 0.3, 1)`;
        els.ringRotator.style.transform = `rotate(${NewR}deg)`;
        
        setTimeout(resolve, 1800);
    });
}

function updateSequenceDisplay() {
    els.seqDisplay.innerHTML = '';
    for (let i = 0; i < currentMaxSequence; i++) {
        const slot = document.createElement('div');
        slot.className = 'sequence-slot';
        if (i < currentSequence.length) {
            const sym = symbols.find(s => s.id === currentSequence[i]);
            slot.innerHTML = `<svg viewBox="0 0 100 100">${sym.svg}</svg>`;
            slot.classList.add('filled');
        }
        els.seqDisplay.appendChild(slot);
    }
}

function clearSequence() {
    currentSequence = []; dialQueue = [];
    document.querySelectorAll('.symbol-btn.active').forEach(b => b.classList.remove('active'));
    els.chevrons.forEach(chev => { chev.classList.remove('seeking', 'locked'); });
    updateSequenceDisplay();
    els.ringStatus.textContent = 'STANDBY';
    els.ringStatus.className = 'ring-status';
    els.btnEngage.disabled = true;
    logActivity('Sequence cleared.');
}

async function handleExpressDial(dest) {
    if (isSystemActive || isDialing) return;
    if (dest.adv && !isAdvancedMode) return;
    clearSequence();
    logActivity(`Express Token inserted for ${dest.name}...`);
    
    dest.sequence.forEach(symId => {
        const sym = symbols.find(s => s.id === symId);
        const btn = document.querySelector(`.symbol-btn[data-id="${symId}"]`);
        btn.classList.add('active');
        dialQueue.push(sym);
    });
    
    await processDialQueue();
    await new Promise(r => setTimeout(r, 600));
    engageTransit();
}

async function engageTransit() {
    isSystemActive = true;
    els.btnEngage.disabled = true;
    els.btnClear.disabled = true;
    els.advToggle.disabled = true;
    document.querySelectorAll('.symbol-btn').forEach(b => b.disabled = true);
    document.querySelectorAll('.btn-express').forEach(b => b.disabled = true);
    
    logActivity('TRANSIT SEQUENCE INITIATED.', 'warn');
    els.ringStatus.textContent = 'ACTIVATING...';
    
    // Final Origin Lock (Glyph 0 to Chevron 0)
    els.chevrons[0].classList.add('seeking');
    await rotateRingToAlign(0, 0);
    els.chevrons[0].classList.remove('seeking');
    els.chevrons[0].classList.add('locked');
    AudioSys.playFinalLock();
    
    await new Promise(r => setTimeout(r, 600));
    
    // Discharge & Portal
    AudioSys.playDischarge();
    els.energyDischarge.classList.add('active');
    
    setTimeout(() => {
        els.portalSurface.classList.remove('collapsing');
        els.portalSurface.classList.add('active');
        AudioSys.startPortalHum();
        
        els.ringStatus.textContent = 'TRANSIT ACTIVE';
        els.ringStatus.className = 'ring-status status-active';
        
        els.btnEngage.textContent = 'DISENGAGE';
        els.btnEngage.classList.add('btn-danger');
        els.btnEngage.disabled = false;
        
        const destMatch = destinations.find(d => JSON.stringify(d.sequence) === JSON.stringify(currentSequence));
        logActivity(`Wormhole established to: ${destMatch ? destMatch.name : 'Unknown Coordinate'}`, 'success');
    }, 1000);
}

async function disengageTransit() {
    els.btnEngage.disabled = true;
    logActivity('Disengaging transit sequence...', 'warn');
    
    AudioSys.stopPortalHum();
    AudioSys.playCollapse();
    
    els.portalSurface.classList.remove('active');
    els.portalSurface.classList.add('collapsing');
    
    await new Promise(r => setTimeout(r, 1500));
    
    els.portalSurface.classList.remove('collapsing');
    els.energyDischarge.classList.remove('active');
    
    els.btnEngage.textContent = 'ENGAGE';
    els.btnEngage.classList.remove('btn-danger');
    
    document.querySelectorAll('.symbol-btn').forEach(b => b.disabled = false);
    document.querySelectorAll('.btn-express').forEach(b => b.disabled = false);
    els.btnClear.disabled = false;
    els.advToggle.disabled = false;
    isSystemActive = false;
    
    clearSequence();
}

init();
