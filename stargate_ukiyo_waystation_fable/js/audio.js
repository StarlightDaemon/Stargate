/* Sound of the Kagerō Road — everything synthesized live.
   The voice of the console is the print shop and the road itself:
   woodblock knocks, the baren's press, paper sliding, a bronze bell,
   wind through the pass and open water. Nothing electronic. */

const Sound = (() => {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let wind = null;
  let water = null;
  let dropletTimer = null;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      const len = ctx.sampleRate * 2;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noiseSource() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    return src;
  }

  /* A dry wooden "tok" — the dial's ratchet passing a notch. */
  function tok(gain = 0.10, freq = 820) {
    const c = ensure(); const t = c.currentTime;
    const o = c.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.06);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.09);
  }

  /* The block coming down under the baren — a deep stamp thud. */
  function thud(gain = 0.5) {
    const c = ensure(); const t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(58, t + 0.16);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.26);
    const n = noiseSource();
    const bp = c.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 210; bp.Q.value = 1.4;
    const ng = c.createGain();
    ng.gain.setValueAtTime(gain * 0.5, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    n.connect(bp).connect(ng).connect(master);
    n.start(t); n.stop(t + 0.12);
  }

  /* Paper shifting on the press bed. */
  function rustle(dur = 0.28, gain = 0.09) {
    const c = ensure(); const t = c.currentTime;
    const n = noiseSource();
    const hp = c.createBiquadFilter(); hp.type = 'highpass';
    hp.frequency.value = 1400;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(hp).connect(g).connect(master);
    n.start(t); n.stop(t + dur + 0.05);
  }

  /* A long paper drag — the finished sheet peeled away. */
  function peel() {
    const c = ensure(); const t = c.currentTime;
    const n = noiseSource();
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(2200, t);
    bp.frequency.exponentialRampToValueAtTime(500, t + 0.55);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    n.connect(bp).connect(g).connect(master);
    n.start(t); n.stop(t + 0.7);
  }

  /* The warden's bronze bell. */
  function bell(base = 156, gain = 0.4, dur = 3.5) {
    const c = ensure(); const t = c.currentTime;
    const partials = [[1, 1], [2.0, 0.5], [2.76, 0.38], [4.07, 0.22], [5.43, 0.12]];
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const sum = c.createGain(); sum.gain.value = gain;
    sum.connect(lp).connect(master);
    partials.forEach(([ratio, amp], i) => {
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.value = base * ratio * (1 + (i % 2 ? 0.002 : -0.002));
      const g = c.createGain();
      g.gain.setValueAtTime(amp, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (1 - i * 0.12));
      o.connect(g).connect(sum);
      o.start(t); o.stop(t + dur);
    });
  }

  /* A small wind-chime voice for gentle confirmations. */
  function chime(base = 1040) {
    bell(base, 0.10, 1.3);
  }

  /* Accelerating drum of the buildup — ink gathering. */
  function drumRoll(duration = 2.0) {
    const c = ensure(); const t0 = c.currentTime;
    let t = 0, gap = 0.30;
    while (t < duration) {
      const at = t0 + t;
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(92, at);
      o.frequency.exponentialRampToValueAtTime(50, at + 0.18);
      const g = c.createGain();
      const amp = 0.16 + 0.30 * (t / duration);
      g.gain.setValueAtTime(amp, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
      o.connect(g).connect(master);
      o.start(at); o.stop(at + 0.25);
      t += gap;
      gap = Math.max(0.085, gap * 0.86);
    }
  }

  /* The wave breaking open — a crash of water, no synthesizer sweep. */
  function crash() {
    const c = ensure(); const t = c.currentTime;
    const n = noiseSource();
    const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(360, t + 1.3);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    n.connect(lp).connect(g).connect(master);
    n.start(t); n.stop(t + 1.5);
  }

  /* Refusal: two heavy knocks on a closed gate. */
  function refusal() {
    thud(0.55);
    setTimeout(() => thud(0.45), 170);
  }

  function startWind() {
    const c = ensure();
    if (wind) return;
    const n = noiseSource();
    const bp = c.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 320; bp.Q.value = 0.5;
    const g = c.createGain(); g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.045, c.currentTime + 2.5);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = c.createGain(); lfoG.gain.value = 140;
    lfo.connect(lfoG).connect(bp.frequency);
    n.connect(bp).connect(g).connect(master);
    n.start(); lfo.start();
    wind = { n, lfo, g };
  }

  function stopWind() {
    if (!wind) return;
    const c = ctx;
    wind.g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 1.0);
    const w = wind; wind = null;
    setTimeout(() => { try { w.n.stop(); w.lfo.stop(); } catch (e) {} }, 1200);
  }

  function startWater() {
    const c = ensure();
    if (water) return;
    const n = noiseSource();
    const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.value = 620; lp.Q.value = 0.7;
    const g = c.createGain(); g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.06, c.currentTime + 1.2);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.28;
    const lfoG = c.createGain(); lfoG.gain.value = 220;
    lfo.connect(lfoG).connect(lp.frequency);
    n.connect(lp).connect(g).connect(master);
    n.start(); lfo.start();
    water = { n, lfo, g };
    dropletTimer = setInterval(() => {
      const t = c.currentTime;
      const o = c.createOscillator(); o.type = 'sine';
      const f = 380 + Math.random() * 260;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.09);
      const dg = c.createGain();
      dg.gain.setValueAtTime(0.05, t);
      dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(dg).connect(master);
      o.start(t); o.stop(t + 0.15);
    }, 2600 + Math.random() * 1800);
  }

  function stopWater() {
    if (!water) return;
    const c = ctx;
    water.g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.8);
    const w = water; water = null;
    if (dropletTimer) { clearInterval(dropletTimer); dropletTimer = null; }
    setTimeout(() => { try { w.n.stop(); w.lfo.stop(); } catch (e) {} }, 1000);
  }

  return { ensure, tok, thud, rustle, peel, bell, chime, drumRoll, crash,
           refusal, startWind, stopWind, startWater, stopWater };
})();
