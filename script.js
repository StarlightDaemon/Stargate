const SYMBOLS = [
    "Δ", "∇", "Σ", "Ω", "Λ", "Φ", "Ψ", "Γ",
    "Θ", "Ξ", "Π", "∝", "∞", "∫", "≈", "⊕"
];

const QUICK_DIALS = [
    { tier: 1, name: "ORBITAL HUB ALPHA", sequence: ["Δ", "Σ", "Λ", "Ψ", "Θ", "Π", "∞", "⊕"] },
    { tier: 1, name: "LUNAR DOCK 4", sequence: ["∇", "Ω", "Φ", "Γ", "Ξ", "∝", "∫", "≈"] },
    { tier: 1, name: "DEEP SPACE RELAY", sequence: ["Σ", "Λ", "Ψ", "Θ", "Π", "∞", "⊕", "Δ"] },
    { tier: 2, name: "RESEARCH STATION EPSILON", sequence: ["Ω", "Φ", "Γ", "Ξ", "∝", "∫", "≈", "∇"] },
    { tier: 2, name: "ASTEROID MINING SITE-7", sequence: ["Λ", "Ψ", "Θ", "Π", "∞", "⊕", "Δ", "Σ"] },
    { tier: 2, name: "TERRAFORMING SEED B", sequence: ["Φ", "Γ", "Ξ", "∝", "∫", "≈", "∇", "Ω"] }
];

const MAX_ADDRESS_LENGTH = 8;
const CHEVRON_COUNT = 10;
let currentAddress = [];
let isConnected = false;
let isDialing = false;

// UI Elements
const symbolGrid = document.getElementById('symbol-grid');
const addressBuffer = document.getElementById('address-buffer');
const lockPointsContainer = document.getElementById('lock-points-container');
const btnDisengage = document.getElementById('btn-disengage');
const toggleReviewHold = document.getElementById('toggle-review-hold');
const drawingStatus = document.getElementById('drawing-status');
const approvalStamp = document.getElementById('approval-stamp');
const portalEventHorizon = document.getElementById('portal-event-horizon');
const qdTier1 = document.getElementById('qd-tier1');
const qdTier2 = document.getElementById('qd-tier2');
const svgGate = document.querySelector('.gate-svg');

// Audio Context
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playDraftingSound() {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    
    const gain = audioCtx.createGain();
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    noiseSource.start();
}

function playStampSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// Initialization
function init() {
    // Check Viewport scaling
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty('--scale-factor', scale);
    window.addEventListener('resize', () => {
        const newScale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        document.documentElement.style.setProperty('--scale-factor', newScale);
    });

    // Populate Symbols
    SYMBOLS.forEach(symbol => {
        const btn = document.createElement('button');
        btn.className = 'symbol-btn';
        btn.textContent = symbol;
        btn.onclick = () => handleSymbolSelect(symbol, btn);
        symbolGrid.appendChild(btn);
    });

    // Populate Quick Dials
    QUICK_DIALS.forEach(qd => {
        const btn = document.createElement('button');
        btn.className = 'qd-btn';
        btn.innerHTML = `<span>${qd.name}</span> <span>[${qd.sequence.join('')}]</span>`;
        btn.onclick = () => handleQuickDial(qd.sequence);
        const container = qd.tier === 1 ? qdTier1 : qdTier2;
        container.appendChild(btn);
    });

    // Controls
    btnDisengage.onclick = disengage;

    // Operator Reference
    document.getElementById('btn-operator-ref').onclick = () => {
        document.getElementById('operator-overlay').classList.remove('hidden');
    };
    document.getElementById('btn-close-overlay').onclick = () => {
        document.getElementById('operator-overlay').classList.add('hidden');
    };
    
    // First interaction unlocks audio
    document.body.addEventListener('click', initAudio, { once: true });
}

function updateBufferDisplay() {
    addressBuffer.innerHTML = currentAddress.map(sym => `<span>${sym}</span>`).join('');
}

function handleSymbolSelect(symbol, btnElement) {
    if (isConnected || isDialing || currentAddress.length >= MAX_ADDRESS_LENGTH) return;
    
    btnElement.classList.add('selected');
    btnElement.disabled = true;
    
    currentAddress.push(symbol);
    updateBufferDisplay();
    
    const index = currentAddress.length - 1;
    drawLockPoint(index, symbol);
    
    playDraftingSound();
    btnDisengage.disabled = false;

    if (currentAddress.length === MAX_ADDRESS_LENGTH) {
        checkFinalization();
    }
}

async function handleQuickDial(sequence) {
    if (isConnected || isDialing) return;
    isDialing = true;
    disengage(false); // Silent reset
    btnDisengage.disabled = false;
    
    for (let i = 0; i < sequence.length; i++) {
        if (!isDialing) break; // Interrupted by disengage
        const symbol = sequence[i];
        
        // Find button
        const buttons = Array.from(symbolGrid.children);
        const btn = buttons.find(b => b.textContent === symbol);
        if (btn) {
            btn.classList.add('selected');
            btn.disabled = true;
        }
        
        currentAddress.push(symbol);
        updateBufferDisplay();
        drawLockPoint(i, symbol);
        playDraftingSound();
        
        await new Promise(r => setTimeout(r, 400));
    }
    
    if (isDialing && currentAddress.length === MAX_ADDRESS_LENGTH) {
        checkFinalization();
    }
    isDialing = false;
}

function drawLockPoint(index, symbol) {
    // Draw evenly around the circle, but based on CHEVRON_COUNT (10)
    // Angles: -90, -54, -18, ...
    const angle = index * (360 / CHEVRON_COUNT) - 90;
    const radius = 400;
    const x = Math.cos(angle * Math.PI / 180) * radius;
    const y = Math.sin(angle * Math.PI / 180) * radius;
    
    const callout = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const dx = Math.cos(angle * Math.PI / 180) * (radius + 60);
    const dy = Math.sin(angle * Math.PI / 180) * (radius + 60);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const xDir = dx > 0 ? 1 : -1;
    const textOffsetX = 50 * xDir;
    
    path.setAttribute('d', `M ${x} ${y} L ${dx} ${dy} L ${dx + textOffsetX} ${dy}`);
    path.setAttribute('stroke', 'var(--highlight-color)');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '2');
    
    // Animate path
    path.style.strokeDasharray = "200";
    path.style.strokeDashoffset = "200";
    path.style.animation = "drawPath 0.3s forwards";
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', dx + (textOffsetX) + (5 * xDir));
    text.setAttribute('y', dy + 5);
    text.setAttribute('fill', 'var(--highlight-color)');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-family', 'var(--font-main)');
    text.setAttribute('text-anchor', dx > 0 ? 'start' : 'end');
    text.textContent = `WELD-PT-${index + 1}: [${symbol}]`;
    text.style.opacity = "0";
    text.style.animation = "fadeIn 0.2s 0.3s forwards";
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '8');
    circle.setAttribute('fill', 'var(--bg-color)');
    circle.setAttribute('stroke', 'var(--highlight-color)');
    circle.setAttribute('stroke-width', '2');
    circle.style.opacity = "0";
    circle.style.animation = "fadeIn 0.1s forwards";

    callout.appendChild(path);
    callout.appendChild(text);
    callout.appendChild(circle);
    
    lockPointsContainer.appendChild(callout);
}

function checkFinalization() {
    if (toggleReviewHold.checked) {
        drawingStatus.textContent = "REVIEW HOLD";
        drawingStatus.style.color = "var(--alert-color)";
        return; // Block finalization
    }
    
    finalizeConnection();
}

function finalizeConnection() {
    isConnected = true;
    drawingStatus.textContent = "APPROVED";
    drawingStatus.style.color = "var(--highlight-color)";
    
    svgGate.classList.add('is-active');
    approvalStamp.classList.add('stamp-anim');
    
    portalEventHorizon.style.opacity = "1";
    portalEventHorizon.style.fill = "url(#hatch)";
    
    playStampSound();
    
    // Disable quick dials and symbol buttons during active connection
    Array.from(symbolGrid.children).forEach(btn => btn.disabled = true);
    Array.from(qdTier1.children).forEach(btn => btn.disabled = true);
    Array.from(qdTier2.children).forEach(btn => btn.disabled = true);
}

function disengage(playSound = true) {
    isDialing = false;
    isConnected = false;
    currentAddress = [];
    updateBufferDisplay();
    
    // Reset visuals
    lockPointsContainer.innerHTML = '';
    
    drawingStatus.textContent = "DRAFT";
    drawingStatus.style.color = "var(--line-color)";
    
    svgGate.classList.remove('is-active');
    approvalStamp.classList.remove('stamp-anim');
    
    portalEventHorizon.style.opacity = "0";
    portalEventHorizon.style.fill = "none";
    
    // Reset buttons
    Array.from(symbolGrid.children).forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
    Array.from(qdTier1.children).forEach(btn => btn.disabled = false);
    Array.from(qdTier2.children).forEach(btn => btn.disabled = false);
    
    btnDisengage.disabled = true;
    
    if (playSound && audioCtx) {
        playDraftingSound(); // Using drafting sound for erase/reset
    }
}

// Watch Review Hold toggle to allow finalization if disabled after dialing
toggleReviewHold.addEventListener('change', () => {
    if (!toggleReviewHold.checked && currentAddress.length === MAX_ADDRESS_LENGTH && !isConnected) {
        finalizeConnection();
    } else if (toggleReviewHold.checked && currentAddress.length === MAX_ADDRESS_LENGTH && !isConnected) {
        drawingStatus.textContent = "REVIEW HOLD";
        drawingStatus.style.color = "var(--alert-color)";
    }
});

// Run Init
document.addEventListener('DOMContentLoaded', init);
