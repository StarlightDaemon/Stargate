// System Configurations
const MAX_SEQUENCE_LENGTH = 4;
let currentSequence = [];
let isSystemActive = false;

// Audio Context System (Web Audio API)
const AudioSys = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playTone(freq, type = 'sine', duration = 0.3, volume = 0.3) {
        if (!this.ctx) return;
        this.init(); // Ensure context is active
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
    playButtonHover() {
        this.playTone(800, 'sine', 0.1, 0.05);
    },
    playSymbolSelect(index) {
        // Ascending tones based on index
        const baseFreq = 400;
        const interval = 100; // Hz
        this.playTone(baseFreq + (index * interval), 'sine', 0.3);
    },
    playError() {
        this.playTone(150, 'sawtooth', 0.4, 0.2);
    },
    playClear() {
        this.playTone(300, 'sine', 0.2);
        setTimeout(() => this.playTone(200, 'sine', 0.2), 100);
    },
    playEngage() {
        if (!this.ctx) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 1.5);
        
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
        this.init();
        setTimeout(() => this.playTone(600, 'sine', 0.2, 0.3), 1500);
        setTimeout(() => this.playTone(800, 'sine', 0.4, 0.3), 1700);
    }
};

// Data Definitions
const symbols = [
    { id: 'S1', name: 'Orbit', svg: '<circle cx="50" cy="50" r="15"/><ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(30 50 50)"/>' },
    { id: 'S2', name: 'Star', svg: '<polygon points="50,10 60,40 90,50 60,60 50,90 40,60 10,50 40,40"/>' },
    { id: 'S3', name: 'Delta', svg: '<polygon points="50,20 90,80 10,80"/>' },
    { id: 'S4', name: 'Crescent', svg: '<path d="M60,20 A40,40 0 1,0 60,80 A30,30 0 1,1 60,20 Z"/>' },
    { id: 'S5', name: 'Ring', svg: '<circle cx="50" cy="50" r="35"/><circle cx="50" cy="50" r="20"/>' },
    { id: 'S6', name: 'Helix', svg: '<path d="M10,50 Q30,10 50,50 T90,50"/>' },
    { id: 'S7', name: 'Pulsar', svg: '<circle cx="50" cy="50" r="15"/><line x1="50" y1="10" x2="50" y2="25"/><line x1="50" y1="75" x2="50" y2="90"/><line x1="10" y1="50" x2="25" y2="50"/><line x1="75" y1="50" x2="90" y2="50"/>' },
    { id: 'S8', name: 'Zenith', svg: '<polygon points="50,20 80,70 20,70"/><line x1="10" y1="85" x2="90" y2="85" />' }
];

const destinations = [
    { id: 'D1', name: 'Lunar Botanical Gardens', sequence: ['S1', 'S4', 'S5', 'S2'] },
    { id: 'D2', name: 'Oceanic Research Pavilion', sequence: ['S3', 'S6', 'S4', 'S8'] },
    { id: 'D3', name: 'Starlight Observatory', sequence: ['S2', 'S7', 'S1', 'S5'] }
];

// DOM Elements
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
    overlayRef: document.getElementById('operator-reference-overlay')
};

// Initialize Application
function init() {
    renderSymbols();
    renderDestinations();
    bindEvents();
    logActivity('System initialized. Awaiting input.', 'success');
}

// Renderers
function renderSymbols() {
    symbols.forEach(sym => {
        const btn = document.createElement('button');
        btn.className = 'symbol-btn';
        btn.dataset.id = sym.id;
        btn.innerHTML = `
            <svg viewBox="0 0 100 100">${sym.svg}</svg>
            <span>${sym.name}</span>
        `;
        
        btn.addEventListener('mouseenter', () => { if(!isSystemActive) AudioSys.playButtonHover(); });
        btn.addEventListener('click', () => handleSymbolClick(sym, btn));
        
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
                <div class="dest-seq">Coord: ${seqNames}</div>
            </div>
            <button class="btn btn-express" data-target="${dest.id}">Express Token</button>
        `;
        
        const expressBtn = li.querySelector('.btn-express');
        expressBtn.addEventListener('click', () => handleExpressDial(dest));
        
        els.destList.appendChild(li);
    });
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
    
    els.btnRefOpen.addEventListener('click', () => {
        els.overlayRef.classList.remove('hidden');
    });
    
    els.btnRefClose.addEventListener('click', () => {
        els.overlayRef.classList.add('hidden');
    });
    
    // First interaction initializes Audio Context
    document.body.addEventListener('click', () => AudioSys.init(), { once: true });
}

// Core Logic
function handleSymbolClick(sym, btn) {
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
    
    // Add to sequence
    currentSequence.push(sym.id);
    btn.classList.add('active');
    
    const index = currentSequence.length - 1;
    AudioSys.playSymbolSelect(index);
    
    updateDisplay();
    logActivity(`Coordinate locked: ${sym.name}`);
}

function updateDisplay() {
    // Update Slots
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
    
    // Update Ring Visual (Progress)
    const progress = (currentSequence.length / MAX_SEQUENCE_LENGTH) * 100;
    els.ringEnergyFill.style.setProperty('--fill-angle', `${progress}%`);
    
    // Update Status
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
    updateDisplay();
    logActivity('Sequence cleared.');
    
    // Reset Portal
    els.portalSurface.classList.remove('active');
    els.ringContainer.classList.remove('spin');
}

async function handleExpressDial(dest) {
    if (isSystemActive) return;
    
    clearSequence();
    logActivity(`Express Token inserted for ${dest.name}...`);
    
    for (let i = 0; i < dest.sequence.length; i++) {
        await new Promise(r => setTimeout(r, 400));
        const symId = dest.sequence[i];
        const sym = symbols.find(s => s.id === symId);
        const btn = document.querySelector(`.symbol-btn[data-id="${symId}"]`);
        handleSymbolClick(sym, btn);
    }
    
    await new Promise(r => setTimeout(r, 500));
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
        
        // Find matching destination
        const destMatch = destinations.find(d => JSON.stringify(d.sequence) === JSON.stringify(currentSequence));
        const destName = destMatch ? destMatch.name : 'Unknown Coordinate';
        
        logActivity(`Connection established to: ${destName}`, 'success');
        
        // Reset after duration
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

// Start
init();
