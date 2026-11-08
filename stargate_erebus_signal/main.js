const Synth = {
    ctx: null,
    humOsc: null,
    humGain: null,
    transientSources: new Set(),
    effectTimers: new Set(),
    scheduleEffect(callback, ms) {
        const timer = setTimeout(() => {
            this.effectTimers.delete(timer);
            callback();
        }, ms);
        this.effectTimers.add(timer);
    },
    stopEffects() {
        for (const timer of this.effectTimers) clearTimeout(timer);
        this.effectTimers.clear();
        for (const source of this.transientSources) source.stop();
        this.transientSources.clear();
    },
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playTone(freq, type, duration, vol=0.1) {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        this.transientSources.add(osc);
        osc.onended = () => {
            this.transientSources.delete(osc);
            osc.disconnect(); gain.disconnect();
        };
        osc.start();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.stop(this.ctx.currentTime + duration);
    },
    playNoise(duration, vol=0.1) {
        if(!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        const gain = this.ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        this.transientSources.add(noise);
        noise.onended = () => {
            this.transientSources.delete(noise);
            noise.disconnect(); filter.disconnect(); gain.disconnect();
        };
        noise.start();
    },
    playLock() {
        this.playTone(800, 'square', 0.1, 0.15);
        this.scheduleEffect(() => this.playTone(1200, 'square', 0.1, 0.15), 100);
    },
    playFinalLock() {
        this.playTone(400, 'sawtooth', 0.2, 0.2);
        this.scheduleEffect(() => this.playTone(800, 'sawtooth', 0.4, 0.3), 150);
        this.playNoise(0.5, 0.3); // loud burst
    },
    playHum() {
        if(!this.ctx) return;
        if(this.humOsc) this.stopHum();
        this.humOsc = this.ctx.createOscillator();
        this.humGain = this.ctx.createGain();
        this.humOsc.type = 'square'; // harsher hum
        this.humOsc.frequency.setValueAtTime(50, this.ctx.currentTime);
        
        // Add a bit of filter for analog warmth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        this.humOsc.connect(filter);
        filter.connect(this.humGain);
        this.humGain.connect(this.ctx.destination);
        this.humGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        const osc = this.humOsc, gain = this.humGain;
        osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
        this.humOsc.start();
    },
    stopHum() {
        const osc = this.humOsc, gain = this.humGain;
        this.humOsc = null;
        this.humGain = null;
        if(osc && gain) {
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
            osc.stop(this.ctx.currentTime + 1);
        }
    },
    playReject() {
        this.playTone(150, 'sawtooth', 0.5, 0.3);
        this.playTone(200, 'sawtooth', 0.5, 0.3);
        this.playNoise(0.8, 0.4);
    }
};

const chevronIndices = [1, 8, 2, 7]; // sequence of chevrons to lock for the 4 symbols
const finalChevronIndex = 0;

let currentRotation = 0;
let direction = 1;
let sequence = [];
let isBusy = false;
let isConnected = false;
let operationGeneration = 0;
const operationTimers = new Map();
let rejectionBlink = null;

function waitForOperation(ms, generation) {
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            operationTimers.delete(timer);
            resolve(generation === operationGeneration);
        }, ms);
        operationTimers.set(timer, resolve);
    });
}

function cancelOperations() {
    operationGeneration++;
    Synth.stopEffects();
    for (const [timer, resolve] of operationTimers) {
        clearTimeout(timer);
        resolve(false);
    }
    operationTimers.clear();
    if (rejectionBlink !== null) clearInterval(rejectionBlink);
    rejectionBlink = null;
    document.body.style.backgroundColor = '';
}

async function selectSymbol(symbolIdx) {
    if (isBusy || isConnected || sequence.length >= 4) return;
    Synth.init();
    isBusy = true;
    const generation = operationGeneration;
    updateUI();
    Synth.playTone(600, 'sine', 0.1);

    const targetChevron = chevronIndices[sequence.length];
    
    let targetAngle = (targetChevron - symbolIdx) * 40;
    
    let normalizedCurrent = ((currentRotation % 360) + 360) % 360;
    let diff = targetAngle - normalizedCurrent;
    let rotations = 720; // Must be a multiple of 360
    if (direction === 1) {
        if (diff <= 0) diff += 360;
        currentRotation += rotations + diff;
    } else {
        if (diff >= 0) diff -= 360;
        currentRotation -= rotations - diff;
    }
    direction *= -1;

    document.getElementById('inner-ring').style.transform = `rotate(${currentRotation}deg)`;
    document.body.classList.add('seeking');
    
    const targetChevronEl = document.querySelector(`.chevron-wrapper:nth-child(${targetChevron + 1}) .chevron`);
    targetChevronEl.classList.add('seeking-target');
    
    Synth.playNoise(1.5, 0.15);

    if (!await waitForOperation(1500, generation)) return;

    document.body.classList.remove('seeking');
    targetChevronEl.classList.remove('seeking-target');
    Synth.playLock();
    
    targetChevronEl.classList.add('locked');
    sequence.push(symbolIdx);
    
    isBusy = false;
    updateUI();
}

async function toggleEngage() {
    if (isConnected || isBusy || (sequence.length > 0 && sequence.length < 4)) {
        disengage();
    } else {
        engage();
    }
}

async function engage() {
    if (isBusy || isConnected || sequence.length < 4) return;
    Synth.init();
    isBusy = true;
    const generation = operationGeneration;
    updateUI();

    const lockout = document.getElementById('signal-lockout').checked;
    
    // Final spin
    currentRotation += 360 * direction;
    direction *= -1;
    document.getElementById('inner-ring').style.transform = `rotate(${currentRotation}deg)`;
    document.body.classList.add('seeking');
    
    const finalChevronEl = document.querySelector(`.chevron-wrapper:nth-child(${finalChevronIndex + 1}) .chevron`);
    finalChevronEl.classList.add('seeking-target');
    
    Synth.playNoise(1.0, 0.2);
    
    if (!await waitForOperation(1000, generation)) return;
    
    document.body.classList.remove('seeking');
    finalChevronEl.classList.remove('seeking-target');

    if (lockout) {
        Synth.playReject();
        document.getElementById('surface').classList.add('rejected');
        
        // Blink red
        rejectionBlink = setInterval(() => {
            document.body.style.backgroundColor = document.body.style.backgroundColor === 'rgb(50, 0, 0)' ? '' : 'rgb(50, 0, 0)';
        }, 100);

        if (!await waitForOperation(1500, generation)) return;
        clearInterval(rejectionBlink);
        rejectionBlink = null;
        document.body.style.backgroundColor = '';
        document.getElementById('surface').classList.remove('rejected');
        isBusy = false;
        resetGate();
        return;
    }

    // Success
    Synth.playFinalLock();
    finalChevronEl.classList.add('locked');
    
    document.getElementById('surface').classList.add('active');
    
    // Breakthrough flash
    document.body.classList.add('breakthrough-flash');
    waitForOperation(200, generation).then(current => {
        if (current) document.body.classList.remove('breakthrough-flash');
    });

    Synth.playHum();
    isConnected = true;
    isBusy = false;
    updateUI();
}

async function disengage() {
    const wasConnected = isConnected;
    cancelOperations();
    const generation = operationGeneration;
    Synth.init();
    Synth.stopHum();
    isConnected = false;
    isBusy = wasConnected;
    document.body.classList.remove('seeking', 'breakthrough-flash');
    const surface = document.getElementById('surface');
    surface.classList.remove('active', 'rejected', 'degrading');
    resetGate();
    if (wasConnected) {
        Synth.playNoise(1.5, 0.4);
        surface.classList.add('degrading');
        if (!await waitForOperation(1500, generation)) return;
        surface.classList.remove('degrading');
        isBusy = false;
        updateUI();
    }
}

function resetGate() {
    sequence = [];
    document.querySelectorAll('.chevron').forEach(c => {
        c.classList.remove('locked');
        c.classList.remove('seeking-target');
    });
    updateUI();
}

function updateUI() {
    const btns = document.querySelectorAll('.symbol-btn');
    btns.forEach(b => b.disabled = (sequence.length >= 4 || isConnected || isBusy));
    
    const engageBtn = document.getElementById('engage-btn');
    if (isConnected) {
        engageBtn.textContent = 'DISCONNECT_LINK';
        engageBtn.disabled = false;
    } else if (isBusy || (sequence.length > 0 && sequence.length < 4)) {
        engageBtn.textContent = 'CANCEL_LINK';
        engageBtn.disabled = false;
    } else {
        engageBtn.textContent = 'ENGAGE_LINK';
        engageBtn.disabled = (sequence.length < 4 || isBusy);
    }
    
    const quickDialBtns = document.querySelectorAll('.quick-dial-btn');
    quickDialBtns.forEach(b => b.disabled = (isConnected || isBusy));
}

async function quickDial(addressString) {
    if (isBusy || isConnected) return;
    Synth.init();
    cancelOperations();
    const generation = operationGeneration;
    resetGate();
    const addrs = addressString.split(',').map(Number);
    for (let i = 0; i < addrs.length; i++) {
        await selectSymbol(addrs[i]);
        if (generation !== operationGeneration) return;
    }
    // A completed preset remains pending until the operator explicitly engages.
    updateUI();
}

// Ambient static setup on first click
window.addEventListener('click', () => {
    Synth.init();
}, {once: true});

/* --- Terminal fit -------------------------------------------------------
   The terminal is authored at a fixed 1920x1080 design box; scale it as one
   proportional unit so it fills the display from 1080p through 4K instead of
   stranding the control clusters at the edges of a large panel. */
const FIT_W = 1920, FIT_H = 1080;
let fitK = 0;

function fitTerminal() {
    const stage = document.getElementById('fit-stage');
    const box = document.getElementById('fit');
    if (!stage || !box) return;
    const availW = stage.clientWidth, availH = stage.clientHeight;
    // stylesheet may not have applied yet — retry on a timer, not an animation
    // frame (rAF is starved in hidden/background viewers)
    if (availW <= 0 || availH <= 0) { setTimeout(fitTerminal, 60); return; }
    const k = Math.min(availW / FIT_W, availH / FIT_H);
    if (k === fitK) return;
    fitK = k;
    box.style.transform = k === 1 ? 'none' : `scale(${k})`;
}

fitTerminal();
window.addEventListener('resize', fitTerminal);
if (window.ResizeObserver) new ResizeObserver(fitTerminal).observe(document.getElementById('fit-stage'));
// resize events and ResizeObserver both ride the rendering lifecycle, which is
// starved in hidden/throttled viewers; this poll is a no-op when k is unchanged
setInterval(fitTerminal, 500);
