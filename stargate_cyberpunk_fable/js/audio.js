/* NIGHTGLASS — the glass loom.
   Layered synthesized sound: an ambient grain texture, soft glass keys,
   a pentatonic weave chime that resolves out of shimmer, and the link's
   riser / bloom / sustained hum. Everything is generated here; there are
   no audio files. */
'use strict';

const Loom = (() => {
  let ctx = null;
  let master, busAmbient, busUI, busLink;
  let noiseBuf = null;
  let ambientOn = false;
  let grainTimer = null;
  let humNodes = null;
  let sparkleTimer = null;
  let levels = { master: 0.8, ambient: 0.5, ui: 0.7, link: 0.8 };

  /* Minor-pentatonic ladder for the seven locks, in semitones above C5. */
  const LADDER = [0, 3, 5, 7, 10, 12, 15];
  const st = (base, semi) => base * Math.pow(2, semi / 12);

  function makeNoise() {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return false; }
    master = ctx.createGain();
    busAmbient = ctx.createGain();
    busUI = ctx.createGain();
    busLink = ctx.createGain();
    busAmbient.connect(master); busUI.connect(master); busLink.connect(master);
    master.connect(ctx.destination);
    noiseBuf = makeNoise();
    applyLevels();
    return true;
  }

  function applyLevels() {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(levels.master * levels.master, t, 0.05);
    busAmbient.gain.setTargetAtTime(levels.ambient * 0.5, t, 0.1);
    busUI.gain.setTargetAtTime(levels.ui, t, 0.05);
    busLink.gain.setTargetAtTime(levels.link, t, 0.05);
  }

  function setLevels(next) { Object.assign(levels, next); applyLevels(); }

  /* — small builders — */

  function tone(bus, freq, dur, { type = 'sine', gain = 0.2, at = 0, attack = 0.01, glideTo = null } = {}) {
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(bus, dur, { freq = 1200, q = 1, gain = 0.2, at = 0, sweepTo = null, attack = 0.01 } = {}) {
    if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  /* — ambient bed: two detuned drones, air, and sparse data-grains — */

  function ambientStart() {
    if (!ctx || ambientOn) return;
    ambientOn = true;
    const mk = (freq, gain) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq; g.gain.value = gain;
      o.connect(g); g.connect(busAmbient); o.start();
      return [o, g];
    };
    ambientStart.nodes = [mk(110, 0.05), mk(110.7, 0.045), mk(165.2, 0.02)];
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 0.4;
    const g = ctx.createGain(); g.gain.value = 0.05;
    src.connect(f); f.connect(g); g.connect(busAmbient); src.start();
    ambientStart.air = [src, g];
    const grain = () => {
      if (!ambientOn) return;
      noise(busAmbient, 0.05 + Math.random() * 0.08,
        { freq: 900 + Math.random() * 3200, q: 8, gain: 0.05 + Math.random() * 0.05 });
      grainTimer = setTimeout(grain, 240 + Math.random() * 1300);
    };
    grain();
  }

  function ambientStop() {
    ambientOn = false;
    clearTimeout(grainTimer);
    (ambientStart.nodes || []).forEach(([o]) => { try { o.stop(); } catch (e) {} });
    if (ambientStart.air) { try { ambientStart.air[0].stop(); } catch (e) {} }
    ambientStart.nodes = null; ambientStart.air = null;
  }

  /* — interface voices — */

  const key = () => { tone(busUI, 1760, 0.05, { gain: 0.06 }); noise(busUI, 0.03, { freq: 2600, q: 3, gain: 0.05 }); };

  /* The signal-lock: shimmer resolving into a clean glass tone, one rung
     of the ladder per locked glyph, with a soft settle on the last. */
  function lock(i, total) {
    const f = st(523.25, LADDER[Math.min(i, LADDER.length - 1)]);
    noise(busUI, 0.28, { freq: f * 2.4, q: 2.2, gain: 0.11, sweepTo: f * 1.02 });
    tone(busUI, f, 0.55, { gain: 0.16, at: 0.10, attack: 0.03 });
    tone(busUI, f * 2.001, 0.4, { gain: 0.05, at: 0.12 });
    if (i >= total - 1) tone(busUI, 65, 0.35, { type: 'triangle', gain: 0.12, at: 0.16 });
  }

  const readyChord = () => {
    [523.25, 659.25, 784.0].forEach((f, n) => tone(busUI, f, 1.1, { gain: 0.07, at: n * 0.06, attack: 0.05 }));
  };

  const denyBuzz = () => {
    tone(busUI, 92, 0.38, { type: 'triangle', gain: 0.2 });
    tone(busUI, 88, 0.38, { type: 'triangle', gain: 0.16, at: 0.02 });
  };

  const closeTone = () => {
    tone(busLink, 660, 0.7, { gain: 0.12, glideTo: 190 });
    noise(busLink, 0.8, { freq: 1400, q: 0.8, gain: 0.08, sweepTo: 260 });
  };

  /* — the link crescendo — */

  function buildup(dur) {
    noise(busLink, dur, { freq: 180, q: 1.4, gain: 0.22, sweepTo: 2600, attack: dur * 0.55 });
    tone(busLink, 130.8, dur, { gain: 0.1, glideTo: 523.25, attack: dur * 0.4 });
    tone(busLink, 196.0, dur, { gain: 0.07, glideTo: 784.0, attack: dur * 0.5 });
    let n = 0;
    const tick = () => {
      if (n > 14) return;
      noise(busLink, 0.05, { freq: 1200 + n * 260, q: 6, gain: 0.06 });
      n++; setTimeout(tick, Math.max(40, 210 - n * 12));
    };
    tick();
  }

  function breakthrough() {
    [523.25, 659.25, 784.0, 987.77, 1174.66].forEach((f, n) =>
      tone(busLink, f, 2.2, { gain: 0.12 - n * 0.015, at: n * 0.045, attack: 0.02 }));
    tone(busLink, 55, 0.9, { type: 'triangle', gain: 0.3 });
    noise(busLink, 1.8, { freq: 3600, q: 0.6, gain: 0.16, sweepTo: 420 });
  }

  function humStart() {
    if (!ctx || humNodes) return;
    const g = ctx.createGain(); g.gain.value = 0;
    g.connect(busLink);
    const oscs = [110, 164.8, 220.4, 329.6].map((f, n) => {
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; og.gain.value = [0.14, 0.08, 0.05, 0.025][n];
      o.connect(og); og.connect(g); o.start();
      return o;
    });
    const lfo = ctx.createOscillator(); const lg = ctx.createGain();
    lfo.frequency.value = 0.13; lg.gain.value = 0.05;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    g.gain.setTargetAtTime(0.22, ctx.currentTime, 0.4);
    humNodes = { g, oscs, lfo };
    const sparkle = () => {
      if (!humNodes) return;
      tone(busLink, 1046.5 * Math.pow(2, Math.floor(Math.random() * 5) * 3 / 12), 0.4,
        { gain: 0.025, attack: 0.02 });
      sparkleTimer = setTimeout(sparkle, 700 + Math.random() * 1800);
    };
    sparkle();
  }

  function humStop() {
    clearTimeout(sparkleTimer);
    if (!humNodes) return;
    const { g, oscs, lfo } = humNodes; humNodes = null;
    g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
    setTimeout(() => { oscs.forEach(o => { try { o.stop(); } catch (e) {} }); try { lfo.stop(); } catch (e) {} }, 1400);
  }

  return { init, setLevels, ambientStart, ambientStop, key, lock, readyChord, denyBuzz, closeTone, buildup, breakthrough, humStart, humStop,
    get active() { return !!ctx; } };
})();
