const Synth = {
    ctx: null,
    humOsc: null,
    humGain: null,
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
        noise.start();
    },
    playLock() {
        this.playTone(800, 'square', 0.1, 0.15);
        setTimeout(() => this.playTone(1200, 'square', 0.1, 0.15), 100);
    },
    playFinalLock() {
        this.playTone(400, 'sawtooth', 0.2, 0.2);
        setTimeout(() => this.playTone(800, 'sawtooth', 0.4, 0.3), 150);
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
        this.humOsc.start();
    },
    stopHum() {
        if(this.humGain) {
            this.humGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
            setTimeout(() => {
                if(this.humOsc) {
                    this.humOsc.stop();
                    this.humOsc = null;
                }
            }, 1000);
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

async function selectSymbol(symbolIdx) {
    if (isBusy || isConnected || sequence.length >= 4) return;
    Synth.init();
    isBusy = true;
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

    await new Promise(r => setTimeout(r, 1500));

    document.body.classList.remove('seeking');
    targetChevronEl.classList.remove('seeking-target');
    Synth.playLock();
    
    targetChevronEl.classList.add('locked');
    sequence.push(symbolIdx);
    
    updateUI();
    isBusy = false;
}

async function toggleEngage() {
    if (isConnected) {
        disengage();
    } else {
        engage();
    }
}

async function engage() {
    if (isBusy || isConnected || sequence.length < 4) return;
    Synth.init();
    isBusy = true;

    const lockout = document.getElementById('signal-lockout').checked;
    
    // Final spin
    currentRotation += 360 * direction;
    direction *= -1;
    document.getElementById('inner-ring').style.transform = `rotate(${currentRotation}deg)`;
    document.body.classList.add('seeking');
    
    const finalChevronEl = document.querySelector(`.chevron-wrapper:nth-child(${finalChevronIndex + 1}) .chevron`);
    finalChevronEl.classList.add('seeking-target');
    
    Synth.playNoise(1.0, 0.2);
    
    await new Promise(r => setTimeout(r, 1000));
    
    document.body.classList.remove('seeking');
    finalChevronEl.classList.remove('seeking-target');

    if (lockout) {
        Synth.playReject();
        document.getElementById('surface').classList.add('rejected');
        
        // Blink red
        let blinkInterval = setInterval(() => {
            document.body.style.backgroundColor = document.body.style.backgroundColor === 'rgb(50, 0, 0)' ? '' : 'rgb(50, 0, 0)';
        }, 100);

        setTimeout(() => {
            clearInterval(blinkInterval);
            document.body.style.backgroundColor = '';
            document.getElementById('surface').classList.remove('rejected');
            resetGate();
            isBusy = false;
        }, 1500);
        return;
    }

    // Success
    Synth.playFinalLock();
    finalChevronEl.classList.add('locked');
    
    document.getElementById('surface').classList.add('active');
    
    // Breakthrough flash
    document.body.classList.add('breakthrough-flash');
    setTimeout(() => document.body.classList.remove('breakthrough-flash'), 200);

    Synth.playHum();
    isConnected = true;
    updateUI();
    isBusy = false;
}

function disengage() {
    if (isBusy || !isConnected) return;
    Synth.init();
    isBusy = true;
    
    Synth.stopHum();
    Synth.playNoise(1.5, 0.4); 
    
    document.getElementById('surface').classList.add('degrading');
    document.getElementById('surface').classList.remove('active');
    
    setTimeout(() => {
        document.getElementById('surface').classList.remove('degrading');
        resetGate();
        isConnected = false;
        isBusy = false;
        updateUI();
    }, 1500);
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
        engageBtn.disabled = isBusy;
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
    resetGate();
    const addrs = addressString.split(',').map(Number);
    for (let i = 0; i < addrs.length; i++) {
        await selectSymbol(addrs[i]);
    }
    await engage();
}

// Ambient static setup on first click
window.addEventListener('click', () => {
    Synth.init();
}, {once: true});
