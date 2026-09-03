/* AUREOLE — procedural sound. Web Audio only, no samples.
 * Signature: theremin glides, a Geiger-style tick ambient, bright capture
 * pings, and a warm detuned hum once the threshold is open. */
window.AUREOLE_AUDIO = (() => {
  let ctx = null, master = null, muted = false;
  let ambientTimer = null, hum = null, huntVoice = null, tickRate = 900;

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
    return true;
  }
  function unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!ambientTimer) scheduleTick();
  }
  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.02);
  }
  const now = () => ctx.currentTime;

  function noiseBuffer(sec) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  /* Geiger-style ambient: a sparse click, rate rises when the threshold is open. */
  function tick() {
    if (!ctx || muted) return;
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.012);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400 + Math.random() * 1800; f.Q.value = 6;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + 0.04);
  }
  function scheduleTick() {
    ambientTimer = setTimeout(() => { tick(); scheduleTick(); }, tickRate * (0.4 + Math.random() * 1.2));
  }
  function setTickRate(ms) { tickRate = ms; }

  /* Theremin-style resonance hunt: a sine glide toward the isotope's tone with
   * growing vibrato, ending in the capture ping. */
  function huntStart(targetHz, dur) {
    if (!ctx || muted) return;
    huntStop();
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sine';
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5;
    const lfoG = ctx.createGain(); lfoG.gain.setValueAtTime(0, t); lfoG.gain.linearRampToValueAtTime(targetHz * 0.02, t + dur);
    lfo.connect(lfoG); lfoG.connect(o.frequency);
    o.frequency.setValueAtTime(targetHz * 0.62, t);
    o.frequency.exponentialRampToValueAtTime(targetHz, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.08);
    o.connect(g); g.connect(master); o.start(t); lfo.start(t);
    huntVoice = { o, lfo, g };
  }
  function huntStop() {
    if (!huntVoice) return;
    const t = now();
    huntVoice.g.gain.cancelScheduledValues(t);
    huntVoice.g.gain.setTargetAtTime(0.0001, t, 0.03);
    huntVoice.o.stop(t + 0.2); huntVoice.lfo.stop(t + 0.2);
    huntVoice = null;
  }
  /* Servo run to a cam stop: a short filtered sawtooth whirr. */
  function servo(dur) {
    if (!ctx || muted) return;
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(160, t + dur);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
    g.gain.setValueAtTime(0.09, t + dur - 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  /* Capture: a bright ping an octave up plus a tiny click. */
  function ping(hz) {
    if (!ctx || muted) return;
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz * 2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.75);
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = hz * 3;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.08, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + 0.3);
    tick();
  }
  /* Buildup: a long rising glide with widening vibrato and a rising noise bed. */
  function buildup(dur) {
    if (!ctx || muted) return;
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(700, t + dur);
    const lfo = ctx.createOscillator(); lfo.frequency.setValueAtTime(3, t); lfo.frequency.linearRampToValueAtTime(9, t + dur);
    const lg = ctx.createGain(); lg.gain.setValueAtTime(2, t); lg.gain.linearRampToValueAtTime(40, t + dur);
    lfo.connect(lg); lg.connect(o.frequency);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + dur * 0.9); g.gain.setValueAtTime(0.22, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    o.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + dur + 0.15); lfo.stop(t + dur + 0.15);
    const n = ctx.createBufferSource(); n.buffer = noiseBuffer(dur + 0.2);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(3000, t + dur);
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.12, t + dur); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    n.connect(f); f.connect(ng); ng.connect(master); n.start(t); n.stop(t + dur + 0.2);
  }
  /* Breakthrough: a noise burst and a bright major chord. */
  function breakthrough() {
    if (!ctx || muted) return;
    const t = now();
    const n = ctx.createBufferSource(); n.buffer = noiseBuffer(0.6);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    n.connect(f); f.connect(ng); ng.connect(master); n.start(t); n.stop(t + 0.6);
    [523.3, 659.3, 784, 1046.5].forEach((hz, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + i * 0.02); g.gain.exponentialRampToValueAtTime(0.16, t + 0.05 + i * 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.7);
    });
  }
  /* Sustained open: two detuned sines with slow vibrato. */
  function humStart() {
    if (!ctx || muted || hum) return;
    const t = now();
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14, t + 0.8);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.7;
    const lg = ctx.createGain(); lg.gain.value = 3; lfo.connect(lg);
    const oscs = [110, 110.8, 220.4, 330.1].map((hz, i) => {
      const o = ctx.createOscillator(); o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = hz;
      lg.connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = i < 2 ? 1 : 0.25;
      o.connect(og); og.connect(g); o.start(t); return o;
    });
    g.connect(master); lfo.start(t);
    hum = { g, oscs, lfo };
    setTickRate(260);
  }
  function humStop() {
    if (!hum) return;
    const t = now();
    hum.g.gain.cancelScheduledValues(t); hum.g.gain.setTargetAtTime(0.0001, t, 0.15);
    hum.oscs.forEach((o) => o.stop(t + 0.8)); hum.lfo.stop(t + 0.8);
    hum = null;
    setTickRate(900);
  }
  /* Discharge: a descending sweep and a relay clack. */
  function discharge() {
    if (!ctx || muted) return;
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.6);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.7);
    const n = ctx.createBufferSource(); n.buffer = noiseBuffer(0.05);
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.3, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(ng); ng.connect(master); n.start(t); n.stop(t + 0.06);
  }
  /* Refusal buzzer: three short square-wave bursts. */
  function refuse() {
    if (!ctx || muted) return;
    const t = now();
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 118;
      const g = ctx.createGain(); const s = t + i * 0.16;
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.11, s + 0.01); g.gain.setValueAtTime(0.11, s + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.12);
      o.connect(g); g.connect(master); o.start(s); o.stop(s + 0.13);
    }
  }
  /* Dark route: a sagging glide when nothing answers. */
  function dark() {
    if (!ctx || muted) return;
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(440, t); o.frequency.exponentialRampToValueAtTime(55, t + 1.2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.35);
  }
  function relay() {
    if (!ctx || muted) return;
    const t = now();
    const n = ctx.createBufferSource(); n.buffer = noiseBuffer(0.03);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t + 0.04);
  }

  return { unlock, setMuted, isMuted: () => muted, huntStart, huntStop, servo, ping, buildup, breakthrough, humStart, humStop, discharge, refuse, dark, relay };
})();
