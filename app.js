// Audio context for procedural sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol=0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playLockSound() { playTone(440, 'sine', 1.5, 0.2); playTone(660, 'triangle', 1.5, 0.1); }
function playOriginSound() { playTone(220, 'sine', 3, 0.3); playTone(330, 'square', 2, 0.05); }
function playSelectSound() { playTone(880, 'sine', 0.2, 0.05); }
function playFailSound() { playTone(110, 'sawtooth', 0.5, 0.1); }

// Data setup
const SYMBOLS = ['✧', '⟡', '⎈', '⎊', '⍟', '۞', '◈', '◇', '⌾'];
const NUM_CHEVRONS = 9; // 0 is origin
const MAX_SELECTIONS = 4;
// We will assign chevrons 2,4,6,8 to the 4 symbols in a basic dial
const DIAL_CHEVRONS = [2, 4, 6, 8]; 

let selectedSymbols = [];
let isDialing = false;
let isConnected = false;
let wardActive = false;
let currentRotation = 0;

// DOM Elements
const grid = document.getElementById('symbol-grid');
const innerRingSymbols = document.querySelector('.ring-symbols');
const outerNetwork = document.querySelector('.outer-network');
const innerRing = document.getElementById('inner-ring');
const engageBtn = document.getElementById('engage-btn');
const disengageBtn = document.getElementById('disengage-btn');
const wardToggle = document.getElementById('ward-toggle');
const wardStatus = document.getElementById('ward-status');
const wardBarrier = document.querySelector('.ward-barrier');
const livingSurface = document.querySelector('.living-surface');
const statusReadout = document.getElementById('status-readout');
const operatorBtn = document.getElementById('operator-ref-btn');
const operatorModal = document.getElementById('operator-ref-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const quickBtns = document.querySelectorAll('.btn-quick');

// Initialize DOM
function init() {
    // Generate Chevrons (0 is origin, already placed in HTML logic, but let's build them dynamically for perfect angles)
    outerNetwork.innerHTML = '';
    for(let i=0; i<NUM_CHEVRONS; i++) {
        const c = document.createElement('div');
        c.className = 'chevron' + (i===0 ? ' origin' : '');
        c.dataset.index = i;
        const angle = i * (360 / NUM_CHEVRONS);
        c.style.transform = `rotate(${angle}deg)`;
        outerNetwork.appendChild(c);
    }

    // Generate Ring Symbols
    SYMBOLS.forEach((sym, i) => {
        // Grid button
        const btn = document.createElement('button');
        btn.className = 'symbol-btn';
        btn.textContent = sym;
        btn.dataset.index = i;
        btn.onclick = () => handleSymbolSelect(i);
        grid.appendChild(btn);

        // Ring symbol
        const rs = document.createElement('div');
        rs.className = 'ring-symbol';
        rs.textContent = sym;
        const angle = i * (360 / SYMBOLS.length);
        rs.style.transform = `rotate(${angle}deg)`;
        innerRingSymbols.appendChild(rs);
    });
}

// Handlers
function handleSymbolSelect(index) {
    if (isDialing || isConnected || selectedSymbols.length >= MAX_SELECTIONS) return;
    
    playSelectSound();
    selectedSymbols.push(index);
    
    // Update grid UI
    const btn = grid.children[index];
    btn.classList.add('selected');
    btn.disabled = true;

    // Check if ready
    if (selectedSymbols.length === MAX_SELECTIONS) {
        statusReadout.textContent = "READY FOR ENGAGE";
        statusReadout.style.color = "var(--glow-primary)";
        engageBtn.disabled = false;
        disableAll(true, '.symbol-btn');
    }
}

async function handleEngage() {
    if (wardActive) {
        playFailSound();
        statusReadout.textContent = "WARD LOCK ACTIVE - CONNECTION DENIED";
        statusReadout.style.color = "var(--glow-danger)";
        setTimeout(() => {
            if(selectedSymbols.length === MAX_SELECTIONS) {
                statusReadout.textContent = "READY FOR ENGAGE";
                statusReadout.style.color = "var(--glow-primary)";
            }
        }, 2000);
        return;
    }

    isDialing = true;
    engageBtn.disabled = true;
    disableAll(true, '.btn-quick');
    statusReadout.textContent = "DIALING SEQUENCE COMMENCED";
    statusReadout.style.color = "var(--glow-secondary)";
    disengageBtn.disabled = false; // Always reachable

    // Perform sequence
    let dir = 1;
    for (let i = 0; i < selectedSymbols.length; i++) {
        if (!isDialing) break; // Interrupted by disengage
        const symIndex = selectedSymbols[i];
        const targetChevron = DIAL_CHEVRONS[i];
        await dialNode(symIndex, targetChevron, dir);
        dir *= -1; // alternate
    }

    if (isDialing) { // If not interrupted
        // Lock origin
        await dialNode(0, 0, dir, true); // Origin chevron is 0, let's just rotate ring to 0 for flair, though not required
        
        if (isDialing) {
            isConnected = true;
            isDialing = false;
            statusReadout.textContent = "CONDUIT ESTABLISHED";
            statusReadout.style.color = "var(--glow-primary)";
            livingSurface.classList.add('active');
        }
    }
}

async function dialNode(symIndex, chevronIndex, dir, isOrigin = false) {
    return new Promise(resolve => {
        // Calculate rotation
        // We want ring symbol `symIndex` to align with chevron `chevronIndex`.
        // Ring symbol base angle = symIndex * 40
        // Chevron angle = chevronIndex * 40
        // We need to rotate inner-ring so that: (symIndex * 40 + rotation) % 360 == chevronIndex * 40
        const symAngle = symIndex * (360 / SYMBOLS.length);
        const chevAngle = chevronIndex * (360 / NUM_CHEVRONS);
        
        let targetRot = chevAngle - symAngle;
        // Make sure it rotates in the right direction
        // Simple approach: just add 360 or subtract 360 based on dir to make a nice spin
        targetRot += dir * 360; 
        currentRotation += targetRot;

        innerRing.style.transform = `rotate(${currentRotation}deg)`;
        
        // Highlight chevron as seeking
        const chevrons = document.querySelectorAll('.chevron');
        const targetElement = chevrons[chevronIndex];
        
        setTimeout(() => {
            if (!isDialing && !isOrigin) return resolve(); // Interrupted
            targetElement.classList.add('seeking');
        }, 300); // slight delay after rotation starts

        // Wait for rotation to finish (1s transition)
        setTimeout(() => {
            if ((!isDialing && !isOrigin && !isConnected)) {
                targetElement.classList.remove('seeking');
                return resolve();
            }
            targetElement.classList.remove('seeking');
            targetElement.classList.add('locked');
            if (isOrigin) {
                playOriginSound();
            } else {
                playLockSound();
            }
            resolve();
        }, 1100);
    });
}

function handleDisengage() {
    isDialing = false;
    isConnected = false;
    selectedSymbols = [];
    currentRotation = 0;
    
    // Reset Ring
    innerRing.style.transform = `rotate(0deg)`;
    livingSurface.classList.remove('active');
    
    // Reset Chevrons
    document.querySelectorAll('.chevron').forEach(c => {
        c.classList.remove('seeking', 'locked');
    });

    // Reset Controls
    document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
    disableAll(false, '.btn-quick');
    engageBtn.disabled = true;
    disengageBtn.disabled = true;
    
    statusReadout.textContent = "DORMANT";
    statusReadout.style.color = "rgba(197, 220, 216, 0.6)";
}

function handleWard() {
    wardActive = !wardActive;
    if (wardActive) {
        wardToggle.classList.add('active');
        wardStatus.textContent = "ACTIVE";
        wardBarrier.classList.remove('hidden');
    } else {
        wardToggle.classList.remove('active');
        wardStatus.textContent = "INACTIVE";
        wardBarrier.classList.add('hidden');
    }
}

function handleQuickDial(addressStr) {
    if (isDialing || isConnected) return;
    const addr = addressStr.split(',').map(Number);
    // Reset first
    selectedSymbols = [];
    document.querySelectorAll('.symbol-btn').forEach(b => {
        b.classList.remove('selected');
        b.disabled = false;
    });
    
    // Select them fast
    addr.forEach(idx => handleSymbolSelect(idx));
    
    // Auto engage
    if(selectedSymbols.length === MAX_SELECTIONS) {
        setTimeout(handleEngage, 500);
    }
}

function disableAll(disable, selector) {
    document.querySelectorAll(selector).forEach(el => el.disabled = disable);
}

// Event Listeners
engageBtn.onclick = handleEngage;
disengageBtn.onclick = handleDisengage;
wardToggle.onclick = handleWard;

quickBtns.forEach(btn => {
    btn.onclick = () => handleQuickDial(btn.dataset.address);
});

operatorBtn.onclick = () => operatorModal.classList.remove('hidden');
closeModalBtn.onclick = () => operatorModal.classList.add('hidden');

init();
