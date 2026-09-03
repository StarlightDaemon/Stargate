/* WIDDERSHINS — procedural sound for the gatehouse. Web Audio only, no
 * samples. Texture, not beeps: a distant tolling bell, iron creaking as the
 * fence turns, a raven, wind through the broken glass of the gatehouse,
 * the candle taking, iron clanging shut.
 *
 * The context is created on the first user gesture (autoplay policy). */

(function () {
  let ctx = null, master = null, enabled = true, ambienceOn = false;
  let noiseBuf = null;
  let wind = null, drone = null;
  const timers = [];

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      // pinkish noise (Paul Kellet's economy filter)
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.96300 * b1 + w * 0.296315;
      b2 = 0.57000 * b2 + w * 1.052300;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
    }
    return ctx;
  }
  function now() { return ctx.currentTime; }
  function noise() { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; }
  function env(g, t, a, peak, d, sustain, r) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    if (sustain !== undefined) {
      g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0002), t + a + d);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + r);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
  }

  /* ---- the bell: distant, inharmonic partials, long decay, low-passed ---- */
  function bell(distance, base) {
    if (!ensure()) return;
    distance = distance === undefined ? 1 : distance; // 1 = far, 0 = near
    base = base || 164.8;
    const t = now();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 + (1 - distance) * 2400; lp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 1;
    lp.connect(g); g.connect(master);
    const partials = [[0.5, 0.35, 5.5], [1, 0.5, 4.5], [1.183, 0.22, 3.2], [1.506, 0.26, 3.0], [2.0, 0.2, 2.2], [2.514, 0.1, 1.6], [2.662, 0.08, 1.4], [3.011, 0.06, 1.0]];
    const amp = 0.12 * (1 - distance * 0.55);
    for (const [ratio, a, dec] of partials) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = base * ratio * (1 + (Math.random() - 0.5) * 0.004);
      const og = ctx.createGain();
      env(og, t, 0.008, a * amp, dec * (0.8 + distance * 0.5));
      o.connect(og); og.connect(lp);
      o.start(t); o.stop(t + dec * 1.5 + 0.5);
    }
    // the strike itself: a short thud of noise
    const n = noise(); const ng = ctx.createGain(); const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 1.5;
    env(ng, t, 0.004, amp * 0.5, 0.12);
    n.connect(bp); bp.connect(ng); ng.connect(lp); n.start(t); n.stop(t + 0.3);
  }

  /* ---- creaking iron while the fence turns ---- */
  let creakNodes = null;
  function creakStart(dur) {
    if (!ensure()) return;
    creakStop();
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(95 + Math.random() * 30, t);
    o.frequency.linearRampToValueAtTime(140 + Math.random() * 40, t + dur);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 6;
    const bpl = ctx.createOscillator(); bpl.type = 'sine'; bpl.frequency.value = 2.3;
    const bpg = ctx.createGain(); bpg.gain.value = 350; bpl.connect(bpg); bpg.connect(bp.frequency);
    // stick-slip gate
    const gate = ctx.createGain(); gate.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 13 + Math.random() * 6;
    const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(gate.gain);
    const g = ctx.createGain(); env(g, t, 0.15, 0.05, Math.max(0.05, dur - 0.3), 0.04, 0.25);
    // rust grain
    const n = noise(); const nb = ctx.createBiquadFilter(); nb.type = 'highpass'; nb.frequency.value = 1800;
    const ng = ctx.createGain(); ng.gain.value = 0.12;
    o.connect(bp); bp.connect(gate); gate.connect(g); n.connect(nb); nb.connect(ng); ng.connect(gate); g.connect(master);
    o.start(t); lfo.start(t); bpl.start(t); n.start(t);
    const stopAt = t + dur + 0.4;
    o.stop(stopAt); lfo.stop(stopAt); bpl.stop(stopAt); n.stop(stopAt);
    creakNodes = { g, o, lfo, bpl, n };
  }
  function creakStop() {
    if (!creakNodes || !ctx) return;
    const t = now();
    try { creakNodes.g.gain.cancelScheduledValues(t); creakNodes.g.gain.setValueAtTime(creakNodes.g.gain.value, t); creakNodes.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); } catch (e) { /* already stopped */ }
    creakNodes = null;
  }
  function ratchet() {
    if (!ensure()) return;
    const t = now();
    const n = noise(); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200;
    const g = ctx.createGain(); env(g, t, 0.002, 0.05, 0.03);
    n.connect(hp); hp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.08);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 1150 + Math.random() * 200;
    const og = ctx.createGain(); env(og, t, 0.001, 0.03, 0.04);
    o.connect(og); og.connect(master); o.start(t); o.stop(t + 0.08);
  }

  /* ---- the candle takes: whoosh + a dull iron catch ---- */
  function take() {
    if (!ensure()) return;
    const t = now();
    const n = noise(); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2;
    bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.45);
    const g = ctx.createGain(); env(g, t, 0.05, 0.16, 0.5);
    n.connect(bp); bp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.7);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 180;
    const og = ctx.createGain(); env(og, t + 0.05, 0.004, 0.14, 0.35);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120;
    o.connect(hp); hp.connect(og); og.connect(master); o.start(t); o.stop(t + 0.6);
    const p = ctx.createOscillator(); p.type = 'sine'; p.frequency.value = 2350;
    const pg = ctx.createGain(); env(pg, t + 0.05, 0.002, 0.05, 0.6);
    p.connect(pg); pg.connect(master); p.start(t); p.stop(t + 0.8);
  }

  /* ---- the raven ---- */
  function raven(count) {
    if (!ensure()) return;
    count = count || 2;
    let t = now() + 0.02;
    for (let i = 0; i < count; i++) {
      const n = noise(); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4.5;
      bp.frequency.setValueAtTime(950 - i * 60, t); bp.frequency.exponentialRampToValueAtTime(520, t + 0.32);
      const am = ctx.createGain(); am.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 27 + Math.random() * 6;
      const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
      const sq = ctx.createOscillator(); sq.type = 'sawtooth';
      sq.frequency.setValueAtTime(230, t); sq.frequency.exponentialRampToValueAtTime(140, t + 0.32);
      const sg = ctx.createGain(); sg.gain.value = 0.25;
      const g = ctx.createGain(); env(g, t, 0.03, 0.11, 0.3);
      n.connect(bp); bp.connect(am); sq.connect(sg); sg.connect(bp); am.connect(g); g.connect(master);
      n.start(t); lfo.start(t); sq.start(t); n.stop(t + 0.5); lfo.stop(t + 0.5); sq.stop(t + 0.5);
      t += 0.42 + Math.random() * 0.1;
    }
  }

  /* ---- hinges screaming open, iron slamming shut ---- */
  function hinge(reverse) {
    if (!ensure()) return;
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const f0 = reverse ? 820 : 380, f1 = reverse ? 360 : 900;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.45); o.frequency.exponentialRampToValueAtTime((f0 + f1) / 2, t + 0.7);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9; bp.frequency.setValueAtTime(f0 * 2, t); bp.frequency.exponentialRampToValueAtTime(f1 * 2, t + 0.5);
    const g = ctx.createGain(); env(g, t, 0.05, 0.07, 0.6, 0.03, 0.2);
    const n = noise(); const nh = ctx.createBiquadFilter(); nh.type = 'highpass'; nh.frequency.value = 3000;
    const ng = ctx.createGain(); ng.gain.value = 0.25;
    o.connect(bp); bp.connect(g); n.connect(nh); nh.connect(ng); ng.connect(g); g.connect(master);
    o.start(t); n.start(t); o.stop(t + 1); n.stop(t + 1);
  }
  function clang(big) {
    if (!ensure()) return;
    const t = now();
    const base = big ? 110 : 150;
    for (const [r, a, dec] of [[1, 0.5, 1.1], [1.41, 0.3, 0.8], [2.09, 0.22, 0.6], [2.83, 0.12, 0.45], [3.7, 0.08, 0.3]]) {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = base * r;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600;
      const g = ctx.createGain(); env(g, t, 0.003, a * (big ? 0.16 : 0.1), dec);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dec + 0.2);
    }
    const n = noise(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    const ng = ctx.createGain(); env(ng, t, 0.003, big ? 0.35 : 0.2, 0.18);
    n.connect(lp); lp.connect(ng); ng.connect(master); n.start(t); n.stop(t + 0.4);
  }
  function refuse() {
    if (!ensure()) return;
    clang(false);
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 58;
    const g = ctx.createGain(); env(g, t + 0.05, 0.02, 0.09, 0.45);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.8);
  }

  /* ---- the candle blown out: a short breath of noise ---- */
  function snuff() {
    if (!ensure()) return;
    const t = now();
    const n = noise(); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(300, t + 0.35);
    const g = ctx.createGain(); env(g, t, 0.02, 0.1, 0.4);
    n.connect(bp); bp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.6);
  }

  /* ---- wind through broken glass: continuous bed + occasional whistles ---- */
  function windStart() {
    if (!ensure() || wind) return;
    const t = now();
    const n = noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.8;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(bp.frequency);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 3);
    const gl = ctx.createOscillator(); gl.type = 'sine'; gl.frequency.value = 0.11;
    const glg = ctx.createGain(); glg.gain.value = 0.02; gl.connect(glg); glg.connect(g.gain);
    n.connect(bp); bp.connect(g); g.connect(master);
    n.start(t); lfo.start(t); gl.start(t);
    wind = { n, lfo, gl, g };
  }
  function whistle() {
    if (!ctx || !ambienceOn) return;
    const t = now();
    const o = ctx.createOscillator(); o.type = 'sine';
    const f = 1500 + Math.random() * 1300;
    o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (0.85 + Math.random() * 0.3), t + 2);
    const v = ctx.createOscillator(); v.type = 'sine'; v.frequency.value = 5 + Math.random() * 3;
    const vg = ctx.createGain(); vg.gain.value = 18; v.connect(vg); vg.connect(o.frequency);
    const g = ctx.createGain(); env(g, t, 0.9, 0.012 + Math.random() * 0.01, 0.8, 0.008, 1.2);
    o.connect(g); g.connect(master); o.start(t); v.start(t); o.stop(t + 3.2); v.stop(t + 3.2);
  }
  function windLevel(level, ramp) {
    if (!wind) return;
    const t = now();
    wind.g.gain.cancelScheduledValues(t);
    wind.g.gain.setValueAtTime(Math.max(wind.g.gain.value, 0.0002), t);
    wind.g.gain.exponentialRampToValueAtTime(Math.max(level, 0.0002), t + (ramp || 1));
  }

  /* ---- the open gate: a low detuned drone with a slow ghost-light shimmer ---- */
  function droneStart() {
    if (!ensure() || drone) return;
    const t = now();
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 1.5);
    const oscs = [];
    for (const f of [55, 55.6, 82.4, 110.7]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = f < 60 ? 0.6 : 0.25;
      o.connect(og); og.connect(g); o.start(t); oscs.push(o);
    }
    const sh = ctx.createOscillator(); sh.type = 'triangle'; sh.frequency.value = 660;
    const shf = ctx.createBiquadFilter(); shf.type = 'bandpass'; shf.Q.value = 12; shf.frequency.value = 1320;
    const shl = ctx.createOscillator(); shl.type = 'sine'; shl.frequency.value = 0.21;
    const shlg = ctx.createGain(); shlg.gain.value = 400; shl.connect(shlg); shlg.connect(shf.frequency);
    const shg = ctx.createGain(); shg.gain.value = 0.08;
    sh.connect(shf); shf.connect(shg); shg.connect(g); sh.start(t); shl.start(t);
    g.connect(master);
    drone = { g, oscs, sh, shl };
  }
  function droneStop() {
    if (!drone || !ctx) return;
    const t = now(); const d = drone; drone = null;
    d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(Math.max(d.g.gain.value, 0.0002), t); d.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    setTimeout(() => { try { d.oscs.forEach((o) => o.stop()); d.sh.stop(); d.shl.stop(); } catch (e) { /* ignore */ } }, 900);
  }

  /* ---- ambience scheduler: idle bell, raven, whistles ---- */
  function ambience() {
    if (!ensure() || ambienceOn) return;
    ambienceOn = true;
    windStart();
    const schedule = (fn, min, max) => {
      const loop = () => { timers.push(setTimeout(() => { if (ambienceOn) { fn(); loop(); } }, min + Math.random() * (max - min))); };
      loop();
    };
    schedule(() => bell(1, 164.8), 24000, 46000);
    schedule(() => raven(1 + Math.round(Math.random())), 30000, 70000);
    schedule(whistle, 4000, 9000);
    timers.push(setTimeout(whistle, 1500));
  }

  function setEnabled(on) {
    enabled = on;
    if (master) { const t = now(); master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(on ? 0.9 : 0, t + 0.15); }
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  window.WIDDERSHINS_AUDIO = {
    ensure, resume, ambience, setEnabled, isEnabled: () => enabled,
    bell, creakStart, creakStop, ratchet, take, raven, hinge, clang, refuse, snuff, windLevel, droneStart, droneStop
  };
})();
