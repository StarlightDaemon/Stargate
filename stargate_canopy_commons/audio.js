/* TRELLIS — sound of a commons at work.
 * Everything is synthesised with the Web Audio API: no samples, no files.
 * Vocabulary: wooden toks for choosing, a soft slew-whirr for the hoop,
 * a rising trickle while a share flows down its conduit, a warm pentatonic
 * chime when a collector opens, a swelling chord while the pool gathers,
 * a bright sun-gong at the sunburst, and a breathing drone while the span
 * stands open. Folding descends; the quiet-hours latch answers low and gentle. */

window.TrellisAudio = (function () {
  let ctx = null;
  let master = null;
  let droneNodes = null;
  let enabled = true;

  const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33]; // C D E G A C D

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function resume() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume().catch(function () {});
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function env(node, t0, a, d, s, r, peak) {
    const g = node.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(peak, t0 + a);
    g.linearRampToValueAtTime(peak * s, t0 + a + d);
    g.setValueAtTime(peak * s, t0 + a + d);
    g.exponentialRampToValueAtTime(0.0001, t0 + a + d + r);
  }

  function tone(freq, type, t0, a, d, s, r, peak, dest) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    o.connect(g); g.connect(dest || master);
    env(g, t0, a, d, s, r, peak);
    o.start(t0); o.stop(t0 + a + d + r + 0.05);
    return o;
  }

  function noise(t0, dur, peak, filterFreq, q) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filterFreq; f.Q.value = q || 1;
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(master);
    env(g, t0, 0.005, dur * 0.3, 0.4, dur * 0.7, peak);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  function guard(fn) {
    return function () {
      if (!enabled) return;
      if (!ensure()) return;
      try { fn.apply(null, arguments); } catch (e) { /* sound is optional */ }
    };
  }

  /* choosing a waymark: a small wooden tok */
  const tok = guard(function () {
    const t = now();
    noise(t, 0.08, 0.25, 1800, 2);
    tone(520, 'triangle', t, 0.004, 0.05, 0.1, 0.06, 0.18);
  });

  /* the hoop slewing round: a soft whirr that rises with distance */
  const slew = guard(function (durSec, distFrac) {
    const t = now();
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t);
    o.frequency.linearRampToValueAtTime(90 + 140 * (0.3 + distFrac), t + durSec * 0.6);
    o.frequency.linearRampToValueAtTime(110, t + durSec);
    f.type = 'lowpass'; f.frequency.setValueAtTime(420, t); f.Q.value = 2;
    o.connect(f); f.connect(g); g.connect(master);
    env(g, t, 0.06, durSec * 0.5, 0.6, durSec * 0.45, 0.12);
    o.start(t); o.stop(t + durSec + 0.1);
  });

  /* a share flowing down its conduit: an ascending trickle */
  const trickle = guard(function (durSec) {
    const t = now();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const f = 880 + i * 130 + Math.random() * 40;
      tone(f, 'sine', t + (durSec / n) * i, 0.01, 0.05, 0.2, 0.09, 0.07);
    }
  });

  /* a collector opening: a warm chime, one step up the pentatonic per bay */
  const petal = guard(function (index) {
    const t = now();
    const f = PENTA[index % PENTA.length] * 2;
    tone(f, 'triangle', t, 0.008, 0.25, 0.25, 0.9, 0.22);
    tone(f * 2.01, 'sine', t, 0.008, 0.15, 0.2, 0.6, 0.08);
    tone(f * 0.5, 'sine', t + 0.02, 0.02, 0.3, 0.3, 0.8, 0.10);
  });

  /* the route is held: a small settled two-note */
  const held = guard(function () {
    const t = now();
    tone(392, 'triangle', t, 0.01, 0.2, 0.3, 0.6, 0.16);
    tone(523.25, 'triangle', t + 0.18, 0.01, 0.25, 0.3, 0.8, 0.16);
  });

  /* pooling: a rising chord swell with a slow pulse underneath */
  const buildup = guard(function (durSec) {
    const t = now();
    const chord = [130.81, 196.00, 261.63, 329.63];
    chord.forEach(function (f, i) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const fl = ctx.createBiquadFilter();
      o.type = i % 2 ? 'sawtooth' : 'triangle';
      o.frequency.setValueAtTime(f, t);
      o.frequency.linearRampToValueAtTime(f * 1.06, t + durSec);
      fl.type = 'lowpass';
      fl.frequency.setValueAtTime(300, t);
      fl.frequency.exponentialRampToValueAtTime(3200, t + durSec);
      o.connect(fl); fl.connect(g); g.connect(master);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + durSec * 0.9);
      g.gain.linearRampToValueAtTime(0.0001, t + durSec + 0.15);
      o.start(t); o.stop(t + durSec + 0.2);
    });
    const pulses = Math.floor(durSec / 0.4);
    for (let i = 0; i < pulses; i++) {
      const pt = t + i * 0.4 * (1 - i / (pulses * 2.2));
      tone(65, 'sine', pt, 0.005, 0.08, 0.1, 0.12, 0.2 + i * 0.03);
    }
  });

  /* sunburst: a bright major bloom with a gong-like body */
  const breakthrough = guard(function () {
    const t = now();
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
      tone(f, 'triangle', t + i * 0.015, 0.01, 0.4, 0.4, 1.8, 0.2);
    });
    tone(130.81, 'sine', t, 0.01, 0.6, 0.5, 2.2, 0.35);
    tone(196.0, 'sine', t, 0.02, 0.5, 0.4, 2.0, 0.2);
    noise(t, 0.5, 0.3, 4000, 0.7);
  });

  function activeStop() {
    if (!droneNodes || !ctx) return;
    const d = droneNodes; droneNodes = null;
    clearInterval(d.timer);
    const t = now();
    try {
      d.gain.gain.cancelScheduledValues(t);
      d.gain.gain.setValueAtTime(d.gain.gain.value, t);
      d.gain.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    } catch (e) {}
    d.nodes.forEach(function (n) { try { n.stop(t + 0.7); } catch (e) {} });
  }

  /* the span standing open: a breathing drone with occasional soft chimes */
  const activeStart = guard(function () {
    activeStop();
    const t = now();
    const nodes = [];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.10, t + 0.8);
    g.connect(master);
    [196.0, 293.66, 392.0].forEach(function (f, i) {
      const o = ctx.createOscillator();
      o.type = i === 1 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.18 + i * 0.07;
      const lg = ctx.createGain(); lg.gain.value = 2.5;
      lfo.connect(lg); lg.connect(o.frequency);
      o.connect(g); o.start(t); lfo.start(t);
      nodes.push(o, lfo);
    });
    const trem = ctx.createOscillator();
    trem.frequency.value = 0.25;
    const tg = ctx.createGain(); tg.gain.value = 0.03;
    trem.connect(tg); tg.connect(g.gain); trem.start(t);
    nodes.push(trem);
    const chimeTimer = setInterval(function () {
      if (!droneNodes) return;
      const f = PENTA[Math.floor(Math.random() * PENTA.length)] * 2;
      try { tone(f, 'sine', now(), 0.01, 0.2, 0.2, 1.2, 0.05); } catch (e) {}
    }, 1900);
    droneNodes = { nodes: nodes, gain: g, timer: chimeTimer };
  });

  /* folding the span: descending soft chimes and a settling sigh */
  const fold = guard(function () {
    activeStop();
    const t = now();
    [523.25, 440, 392, 329.63, 261.63].forEach(function (f, i) {
      tone(f, 'triangle', t + i * 0.09, 0.01, 0.15, 0.2, 0.5, 0.12);
    });
    noise(t, 0.7, 0.12, 600, 0.8);
  });

  /* quiet-hours latch refusing: three low, gentle tones */
  const refuse = guard(function () {
    const t = now();
    [220, 196, 174.61].forEach(function (f, i) {
      tone(f, 'triangle', t + i * 0.22, 0.01, 0.15, 0.3, 0.3, 0.18);
    });
  });

  /* latch moving: a soft wooden clack */
  const latch = guard(function (engaged) {
    const t = now();
    noise(t, 0.06, 0.28, engaged ? 900 : 1400, 3);
    tone(engaged ? 180 : 260, 'triangle', t, 0.004, 0.06, 0.1, 0.1, 0.14);
  });

  /* a small acknowledgement for notes and ledger taps */
  const tap = guard(function () {
    const t = now();
    tone(660, 'sine', t, 0.004, 0.04, 0.2, 0.08, 0.09);
  });

  function setEnabled(v) {
    enabled = !!v;
    if (!enabled) activeStop();
  }

  return {
    resume: resume, tok: tok, slew: slew, trickle: trickle, petal: petal, held: held,
    buildup: buildup, breakthrough: breakthrough, activeStart: activeStart,
    activeStop: function () { try { activeStop(); } catch (e) {} },
    fold: fold, refuse: refuse, latch: latch, tap: tap, setEnabled: setEnabled,
    isEnabled: function () { return enabled; },
    state: function () { return ctx ? ctx.state : 'none'; }
  };
})();
