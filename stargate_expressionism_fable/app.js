'use strict';
/* SPLITTERLICHT - Torkammer Neun
   A German-Expressionist gate console. Dialing = cracking seven shards out of a
   leaning wall. The wall tilts as it fractures. Tearing it open is a lever, never
   a side effect. Everything is flat vector: no gradients, no shading, no material.
*/
(() => {
  const W = 1920, H = 1080;
  const RING = { cx: 1340, cy: 440, rOut: 290, rIn: 160 };
  const N = 7;
  const VERSION = '1.0.0';

  const INK = '#000', BONE = '#efe3c6', CAD = '#f0b90b', VERM = '#d1301a', WHITE = '#fff';

  // ---------- seeded randomness (deterministic set dressing) ----------
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  const R = rng(19210226);
  const jit = (a) => (R() * 2 - 1) * a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rad = (d) => d * Math.PI / 180;

  // ---------- glyphs: twelve angular marks ----------
  const GLYPHS = [
    { id: 'zackenstern',  name: 'ZACKENSTERN',  en: 'jag-star',      d: 'M20 2 L26 14 L38 12 L30 22 L36 36 L20 28 L6 36 L10 22 L2 12 L14 14 Z' },
    { id: 'schraegkreuz', name: 'SCHRÄGKREUZ',  en: 'slant-cross',   d: 'M6 10 L16 4 L24 18 L34 8 L38 14 L28 24 L36 34 L28 38 L20 26 L8 36 L4 30 L14 20 Z' },
    { id: 'brennglas',    name: 'BRENNGLAS',    en: 'burning-glass', d: 'M4 20 L20 6 L36 20 L20 34 Z M12 20 L28 20 M20 12 L20 28', open: true },
    { id: 'nachtwinkel',  name: 'NACHTWINKEL',  en: 'night-angle',   d: 'M6 34 L6 6 L34 6 L34 14 L14 14 L14 34 Z' },
    { id: 'hohlzahn',     name: 'HOHLZAHN',     en: 'hollow-tooth',  d: 'M8 4 L32 4 L28 36 L20 22 L12 36 Z' },
    { id: 'riegelschlag', name: 'RIEGELSCHLAG', en: 'bolt-strike',   d: 'M4 16 L26 16 L26 6 L38 20 L26 34 L26 24 L4 24 Z' },
    { id: 'spiegelriss',  name: 'SPIEGELRISS',  en: 'mirror-crack',  d: 'M20 2 L24 14 L18 18 L26 26 L18 30 L22 38 M8 10 L15 17 M32 10 L25 17 M6 30 L14 24 M34 30 L26 24', open: true },
    { id: 'turmkippe',    name: 'TURMKIPPE',    en: 'tower-lean',    d: 'M12 38 L18 6 L30 4 L28 38 Z M14 27 L28 25 M16 16 L29 14', open: true },
    { id: 'bergwolf',     name: 'BERGWOLF',     en: 'hill-wolf',     d: 'M2 36 L12 12 L18 24 L26 4 L38 36 Z' },
    { id: 'dornhaken',    name: 'DORNHAKEN',    en: 'thorn-hook',    d: 'M8 4 L15 4 L15 25 L23 25 L23 17 L33 29 L21 38 L8 30 Z' },
    { id: 'lichtkeil',    name: 'LICHTKEIL',    en: 'light-wedge',   d: 'M4 8 L36 20 L4 32 Z M8 20 L22 20', open: true },
    { id: 'schattenhand', name: 'SCHATTENHAND', en: 'shadow-hand',   d: 'M10 38 L10 20 L5 8 L12 10 L14 20 L14 4 L20 4 L20 20 L24 6 L30 8 L26 22 L35 26 L26 38 Z' },
  ];

  // ---------- old scars: routes the wall remembers ----------
  const ROUTES = [
    { id: 'turmstadt', name: 'TURMSTADT OBEN',     en: 'the tower-town above', seq: [7, 0, 3, 10, 8, 1, 5], tone: 'bone' },
    { id: 'gasse',     name: 'DIE SCHIEFE GASSE',  en: 'the crooked lane',     seq: [1, 4, 9, 6, 2, 11, 0], tone: 'yellow' },
    { id: 'hohlsee',   name: 'HOHLSEE',            en: 'hollow lake',          seq: [2, 8, 10, 4, 5, 11, 7], tone: 'bone' },
    { id: 'vermauert', name: 'DAS VERMAUERTE TOR', en: 'the walled-up gate',   seq: [11, 6, 9, 1, 4, 8, 3], tone: 'dark', dark: true },
    { id: 'fabrik',    name: 'SCHLAFENDE FABRIK',  en: 'the sleeping factory', seq: [5, 3, 0, 8, 9, 2, 6], tone: 'red' },
  ];

  // ---------- timing (ms) ----------
  const T = {
    crackManual: 950, fractureManual: 420,
    crackScar: 360, fractureScar: 190,
    buildup: 2400, breakthrough: 700, failing: 1100, walling: 650,
    alert: 1500,
  };

  // ---------- state ----------
  const S = {
    phase: 'sleep', phaseAt: 0, dur: 0,
    locked: [], pending: null, queue: [],
    bolt: false, auto: null, dark: false, dest: null,
    tilt: 0, unrest: 0,
    msg: { de: '', en: '' }, alert: null, alertAt: 0,
    muted: false, cracks: [], fit: 1, opens: 0, fails: 0,
    activeAt: 0, autoHalted: false,
  };

  // ---------- geometry: the shard ring ----------
  const bounds = [];
  for (let i = 0; i < N; i++) bounds.push(-100 + i * 360 / N + jit(7));
  const rOutB = [], rInB = [];
  for (let i = 0; i < N; i++) { rOutB.push(RING.rOut + jit(38)); rInB.push(RING.rIn + jit(26)); }
  const pt = (a, r) => [RING.cx + Math.cos(rad(a)) * r, RING.cy + Math.sin(rad(a)) * r];

  const shards = [];
  for (let i = 0; i < N; i++) {
    const a0 = bounds[i];
    const a1 = (i === N - 1) ? bounds[0] + 360 : bounds[i + 1];
    const span = a1 - a0;
    const outer = [
      pt(a0, rOutB[i]),
      pt(a0 + span * 0.33 + jit(4), RING.rOut + jit(44)),
      pt(a0 + span * 0.66 + jit(4), RING.rOut + jit(44)),
      pt(a1, rOutB[(i + 1) % N]),
    ];
    const inner = [
      pt(a0, rInB[i]),
      pt(a0 + span * 0.4 + jit(5), RING.rIn + jit(30)),
      pt(a1, rInB[(i + 1) % N]),
    ];
    const poly = outer.concat(inner.slice().reverse());
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
    const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    const dx = cx - RING.cx, dy = cy - RING.cy, len = Math.hypot(dx, dy);
    shards.push({
      poly, cx, cy, nx: dx / len, ny: dy / len,
      outerMid: pt(a0 + span * 0.5, RING.rOut + 6),
      tilt: jit(4), inner,
    });
  }
  const holePts = [];
  shards.forEach(sh => { holePts.push(sh.inner[0], sh.inner[1]); });

  // jagged polyline from A to B (midpoint-displacement style), own rng so cracks are stable per slot
  function jaggedPath(x0, y0, x1, y1, segs, amp, seed) {
    const r = rng(seed);
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const px = -dy / L, py = dx / L;
    const pts = [[x0, y0]];
    for (let k = 1; k < segs; k++) {
      const t = k / segs;
      const env = Math.sin(t * Math.PI);
      const off = (r() * 2 - 1) * amp * (0.35 + env);
      pts.push([x0 + dx * t + px * off, y0 + dy * t + py * off]);
    }
    pts.push([x1, y1]);
    let len = 0;
    for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    return { d: 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L'), len };
  }

  // ---------- geometry: the staircase ----------
  // two crooked flights: a shallow one across the floor, a steeper one up the wall
  const TREAD_W = 90, TREAD_H = 66;
  const treads = [];
  for (let i = 0; i < 12; i++) {
    let x, y;
    if (i < 6) { x = 140 + i * 74; y = 975 - i * 35; }
    else { x = 600 + (i - 6) * 64; y = 752 - (i - 6) * 48; }
    x += jit(4); y += jit(3);
    const rot = (i < 6 ? -7 : -11) + jit(5);
    const p = [[jit(3), 6 + jit(4)], [96 + jit(3), jit(2)], [100, 90 + jit(6)], [5 + jit(3), 100]];
    const poly = `polygon(${p.map(q => `${q[0].toFixed(1)}% ${q[1].toFixed(1)}%`).join(', ')})`;
    treads.push({ x, y, rot, poly, cx: x + TREAD_W / 2, cy: y + TREAD_H / 2 });
  }
  // stringer: a black band cut under the treads, following the flights
  function stringerPoints() {
    const top = treads.map(t => [t.x - 4, t.y + TREAD_H + 4]);
    top.push([treads[11].x + TREAD_W + 10, treads[11].y + TREAD_H - 4]);
    const under = top.slice().reverse().map(p => [p[0] + 14, p[1] + 46]);
    return top.concat(under).map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  }

  // ---------- DOM helpers ----------
  const $ = (id) => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(svgNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function glyphSVG(g) {
    return `<svg class="gl${g.open ? ' open' : ''}" viewBox="0 0 40 40" aria-hidden="true"><path d="${g.d}"/></svg>`;
  }

  // ---------- build the ring ----------
  const ringG = $('ring');
  // hole (the wall inside the ring; becomes the eye)
  const holePoly = svgEl('polygon', { id: 'hole', points: holePts.map(p => p.join(',')).join(' '), fill: INK }, ringG);
  const clip = svgEl('clipPath', { id: 'holeClip' }, ringG);
  svgEl('polygon', { points: holePts.map(p => p.join(',')).join(' ') }, clip);
  // buildup web
  const webG = svgEl('g', { id: 'web', 'clip-path': 'url(#holeClip)' }, ringG);
  const webLines = [];
  for (let k = 0; k < 12; k++) {
    const a = k * 360 / 12 + jit(12);
    const [x0, y0] = pt(a, RING.rIn + 30);
    const cxj = RING.cx + jit(30), cyj = RING.cy + jit(30);
    const jp = jaggedPath(x0, y0, cxj, cyj, 6, 22, 500 + k);
    const path = svgEl('path', { d: jp.d, fill: 'none', stroke: BONE, 'stroke-width': 3, 'stroke-dasharray': jp.len.toFixed(1), 'stroke-dashoffset': jp.len.toFixed(1) }, webG);
    webLines.push({ path, len: jp.len });
  }
  // vortex iris (active state)
  const vortexG = svgEl('g', { id: 'vortex', 'clip-path': 'url(#holeClip)', style: 'display:none' }, ringG);
  const irisG = svgEl('g', { id: 'iris' }, vortexG);
  const IRIS_COLORS = [INK, VERM, INK, BONE, INK, VERM, INK, CAD, INK, VERM, INK, BONE];
  for (let k = 0; k < 12; k++) {
    const a0 = k * 30, a1 = a0 + 30;
    const r = 260;
    const p0 = pt(a0, r), p1 = pt(a0 + 10, r + 30), p2 = pt(a1, r);
    svgEl('polygon', { points: `${RING.cx},${RING.cy} ${p0.join(',')} ${p1.join(',')} ${p2.join(',')}`, fill: IRIS_COLORS[k] }, irisG);
  }
  // the pupil: a jagged black eye
  const pupilPts = [];
  for (let k = 0; k < 9; k++) pupilPts.push(pt(k * 40 + jit(10), 46 + jit(14)));
  svgEl('polygon', { points: pupilPts.map(p => p.join(',')).join(' '), fill: INK, stroke: BONE, 'stroke-width': 5 }, vortexG);

  // shards
  shards.forEach((sh, i) => {
    const g = svgEl('g', { class: 'shard', id: 'shard' + i }, ringG);
    sh.el = g;
    sh.polyEl = svgEl('polygon', { points: sh.poly.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '), fill: 'none', stroke: BONE, 'stroke-opacity': .25, 'stroke-width': 3, 'stroke-linejoin': 'miter' }, g);
    sh.glyphEl = svgEl('path', { d: '', transform: `translate(${(sh.cx - 40).toFixed(1)} ${(sh.cy - 40).toFixed(1)}) scale(2)`, style: 'display:none' }, g);
    sh.glyphId = null;
  });

  const cracksG = $('cracks');
  svgEl('polygon', { points: stringerPoints(), fill: INK, stroke: BONE, 'stroke-width': 4, 'stroke-linejoin': 'miter' }, $('stringer'));
  const boltEl = $('bolt');
  const flashEl = $('flash');
  const lampCone = $('lampCone');
  const lampBulb = $('lampBulb');

  // ---------- build the staircase ----------
  const stairsEl = $('stairs');
  treads.forEach((t, i) => {
    const g = GLYPHS[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tread';
    b.id = 'tread-' + g.id;
    b.dataset.glyph = String(i);
    b.style.left = t.x.toFixed(1) + 'px';
    b.style.top = t.y.toFixed(1) + 'px';
    b.style.transform = `rotate(${t.rot.toFixed(2)}deg)`;
    b.style.setProperty('--poly', t.poly);
    b.title = `${g.name} - ${g.en}`;
    b.innerHTML = `<span class="face">${glyphSVG(g)}<span class="nm">${g.name}</span><span class="nm-en">${g.en}</span></span>`;
    b.addEventListener('click', () => pressTread(i));
    stairsEl.appendChild(b);
    t.el = b;
  });

  // ---------- build the posters ----------
  const postersEl = $('posters');
  ROUTES.forEach((r, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'poster ' + r.tone;
    b.id = 'poster-' + r.id;
    b.style.left = (160 + jit(6)).toFixed(1) + 'px';
    b.style.top = (112 + i * 100 + jit(3)).toFixed(1) + 'px';
    b.style.transform = `rotate(${(i % 2 ? 4 : -5) + jit(3)}deg)`;
    b.title = `${r.name} - ${r.en}`;
    b.innerHTML = `<span class="p-de">${r.name}</span><span class="p-en">${r.en}</span><span class="p-seq">${r.seq.map(k => GLYPHS[k].name.slice(0, 3)).join(' ')}</span>`;
    b.addEventListener('click', () => pressPoster(r));
    postersEl.appendChild(b);
    r.el = b;
  });

  // ---------- build the pad slots ----------
  const slotsEl = $('slots');
  const slotEls = [];
  for (let i = 0; i < N; i++) {
    const d = document.createElement('div');
    d.className = 'slot empty';
    d.style.transform = `rotate(${jit(5).toFixed(1)}deg)`;
    slotsEl.appendChild(d);
    slotEls.push({ el: d, glyph: null });
  }

  // ---------- title lettering: hand-cut, off-kilter ----------
  (function jitterTitle() {
    const t = $('titleMain');
    const text = t.textContent;
    t.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.transform = `rotate(${jit(7).toFixed(1)}deg) translateY(${jit(6).toFixed(1)}px)`;
      t.appendChild(s);
    }
  })();

  // ---------- audio: atonal, dry, percussive ----------
  const audio = (() => {
    let ctx = null, master = null, activeNodes = null;
    function ensure() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return true; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = S.muted ? 0 : 0.9;
        master.connect(ctx.destination);
        drone();
        return true;
      } catch (e) { ctx = null; return false; }
    }
    function noise(dur) {
      const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const b = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = b; return s;
    }
    function drone() {
      const g = ctx.createGain(); g.gain.value = 0.045;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 240; f.Q.value = 4;
      [55, 77.78].forEach(fr => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); });
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lg = ctx.createGain(); lg.gain.value = 110;
      lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      f.connect(g); g.connect(master);
    }
    function crackle(t, gain, freq, dur) {
      const s = noise(dur);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t); s.stop(t + dur + 0.02);
    }
    function thud(t, f0, f1, dur, gain) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
    }
    function tone(type, f0, f1, t, dur, gain) {
      const o = ctx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.linearRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
      return { o, g };
    }
    const guard = (fn) => (...a) => { if (!ctx) return; try { fn(...a); } catch (e) { /* audio is decorative */ } };
    return {
      ensure,
      setMuted: (m) => { if (master) master.gain.value = m ? 0 : 0.9; },
      crack: guard((durMs) => {
        const t0 = ctx.currentTime, n = Math.max(4, Math.round(durMs / 70));
        for (let k = 0; k < n; k++) crackle(t0 + (durMs / 1000) * k / n + Math.random() * 0.02, 0.10 + 0.25 * k / n, 1400 + 2000 * k / n, 0.05);
      }),
      fracture: guard(() => {
        const t = ctx.currentTime;
        thud(t, 75, 38, 0.32, 0.55);
        crackle(t, 0.5, 900, 0.12);
        crackle(t + 0.01, 0.35, 5200, 0.04);
      }),
      ready: guard(() => {
        const t = ctx.currentTime;
        tone('square', 880, 880, t, 0.22, 0.08);
        tone('square', 932, 932, t + 0.02, 0.22, 0.08);
        thud(t, 90, 50, 0.3, 0.4);
      }),
      buildup: guard(() => {
        const t = ctx.currentTime, d = T.buildup / 1000;
        [110, 116.5, 155.6].forEach((f, i) => {
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 2.1, t + d);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.14, t + d); g.gain.setValueAtTime(0, t + d + 0.05);
          const trem = ctx.createOscillator(); trem.type = 'square'; trem.frequency.setValueAtTime(3 + i, t); trem.frequency.linearRampToValueAtTime(14, t + d);
          const tg = ctx.createGain(); tg.gain.value = 0.5;
          trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t + d + 0.1);
          o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.1);
        });
        for (let k = 0; k < 18; k++) crackle(t + (d * k * k) / 324, 0.12 + 0.02 * k, 800 + 200 * k, 0.05);
      }),
      breakthrough: guard(() => {
        const t = ctx.currentTime;
        const s = noise(0.7);
        const f = ctx.createBiquadFilter(); f.type = 'highpass';
        f.frequency.setValueAtTime(150, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.6);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 0.75);
        [261.6, 277.2, 370, 392, 523.3].forEach(fr => tone('sawtooth', fr, fr, t + 0.05, 1.3, 0.12));
        thud(t, 120, 30, 0.6, 0.8);
      }),
      active: guard((on) => {
        if (!on) { if (activeNodes) { try { activeNodes.forEach(n => n.stop()); } catch (e) {} activeNodes = null; } return; }
        if (activeNodes) return;
        const t = ctx.currentTime;
        const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 65.4;
        const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 92.5;
        const gate = ctx.createOscillator(); gate.type = 'square'; gate.frequency.value = 7;
        const gg = ctx.createGain(); gg.gain.value = 0.5;
        const g = ctx.createGain(); g.gain.value = 0.06;
        gate.connect(gg); gg.connect(g.gain);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        o.connect(f); o2.connect(f); f.connect(g); g.connect(master);
        o.start(t); o2.start(t); gate.start(t);
        activeNodes = [o, o2, gate];
      }),
      wall: guard(() => {
        const t = ctx.currentTime;
        thud(t, 95, 45, 0.2, 0.5); thud(t + 0.14, 75, 40, 0.2, 0.5); thud(t + 0.3, 55, 30, 0.35, 0.6);
        crackle(t + 0.3, 0.3, 600, 0.15);
      }),
      fail: guard(() => {
        const t = ctx.currentTime;
        [220, 233, 311, 330].forEach(fr => tone('sawtooth', fr, fr * 0.5, t, 0.9, 0.12));
        thud(t + 0.1, 100, 28, 0.8, 0.9);
        for (let k = 0; k < 6; k++) crackle(t + 0.2 + k * 0.08, 0.3, 500 - k * 50, 0.08);
      }),
      buzz: guard(() => {
        const t = ctx.currentTime;
        tone('square', 48, 48, t, 0.35, 0.22); tone('square', 97, 97, t, 0.35, 0.12);
      }),
      knock: guard(() => { thud(ctx.currentTime, 130, 70, 0.12, 0.4); }),
      scar: guard(() => {
        const t = ctx.currentTime;
        for (let k = 0; k < 5; k++) crackle(t + k * 0.05, 0.2, 3000 - k * 400, 0.05);
      }),
      bolt: guard((on) => {
        const t = ctx.currentTime;
        crackle(t, 0.45, 3200, 0.05); thud(t + 0.02, on ? 60 : 95, on ? 40 : 60, 0.16, 0.6);
      }),
    };
  })();

  // ---------- messages ----------
  function say(de, en) { S.msg = { de, en }; }
  function raiseAlert(text, now) { S.alert = text; S.alertAt = now; }
  function routeFor(seq) {
    return ROUTES.find(r => r.seq.length === seq.length && r.seq.every((g, i) => g === seq[i])) || null;
  }

  // ---------- phase control ----------
  function setPhase(ph, now, dur) { S.phase = ph; S.phaseAt = now; S.dur = dur; }
  const nowMs = () => performance.now();

  function startCrack(g, now) {
    S.pending = g;
    const slot = S.locked.length;
    const t = treads[g];
    const target = shards[slot].outerMid;
    const jp = jaggedPath(t.cx, t.cy, target[0], target[1], 14, 26, 900 + g * 31 + slot);
    const under = svgEl('path', { d: jp.d, fill: 'none', stroke: INK, 'stroke-width': 9, 'stroke-linejoin': 'miter', 'stroke-dasharray': jp.len.toFixed(1), 'stroke-dashoffset': jp.len.toFixed(1) }, cracksG);
    const over = svgEl('path', { d: jp.d, fill: 'none', stroke: BONE, 'stroke-width': 3.5, 'stroke-linejoin': 'miter', 'stroke-dasharray': jp.len.toFixed(1), 'stroke-dashoffset': jp.len.toFixed(1) }, cracksG);
    S.cracks.push({ slot, g, len: jp.len, under, over });
    const dur = S.auto ? T.crackScar : T.crackManual;
    setPhase('cracking', now, dur);
    audio.crack(dur);
    say(`DER RISS LÄUFT … ${GLYPHS[g].name}`, `the crack runs toward shard ${slot + 1}`);
  }

  function clearAll() {
    S.locked = []; S.pending = null; S.queue = []; S.auto = null; S.dark = false; S.dest = null;
    S.cracks = [];
    while (cracksG.firstChild) cracksG.removeChild(cracksG.firstChild);
    audio.active(false);
  }

  // ---------- actions ----------
  function pressTread(g) {
    const now = nowMs();
    audio.ensure();
    if (S.bolt) { raiseAlert('RIEGEL VOR!', now); audio.buzz(); say('RIEGEL VOR — NICHTS REISST.', 'the bolt is thrown; nothing cracks while it holds'); return; }
    if (S.auto) { say('DIE NARBE FÜHRT.', 'an old scar is leading; wall up to take the stairs yourself'); audio.knock(); return; }
    const dialing = S.phase === 'sleep' || S.phase === 'dialing' || S.phase === 'cracking' || S.phase === 'fracturing';
    if (!dialing) {
      if (S.phase === 'ready') say('SIEBEN SPLITTER. BEREIT.', 'seven shards already; pull AUFREISSEN, or wall up');
      else say('ERST ZUMAUERN.', 'wall up first');
      audio.knock();
      return;
    }
    if (S.locked.includes(g) || S.pending === g || S.queue.includes(g)) { say(`${GLYPHS[g].name} — SCHON GERISSEN.`, 'that stair is already cracked into the wall'); audio.knock(); return; }
    if (S.locked.length + (S.pending !== null ? 1 : 0) + S.queue.length >= N) { say('KEIN PLATZ MEHR IM RISS.', 'no room left in the fracture'); audio.knock(); return; }
    S.queue.push(g);
  }

  function pressTear() {
    const now = nowMs();
    audio.ensure();
    if (S.phase !== 'ready') {
      if (S.phase === 'active') say('ES STEHT SCHON OFFEN.', 'it is already open');
      else if (S.phase === 'buildup' || S.phase === 'breakthrough') say('ES REISST BEREITS.', 'it is already tearing');
      else say('NOCH KEIN VOLLER RISS.', `${S.locked.length} of 7 shards; the wall will not tear yet`);
      audio.knock();
      return;
    }
    if (S.bolt) { raiseAlert('RIEGEL VOR!', now); audio.buzz(); say('RIEGEL VOR — DER HEBEL SITZT FEST.', 'the bolt is thrown; draw it back first'); return; }
    const route = routeFor(S.locked);
    S.dark = !!(route && route.dark);
    S.dest = route ? route : null;
    setPhase('buildup', now, T.buildup);
    audio.buildup();
    say('ES REISST …', 'it tears - the wall keels');
  }

  function pressWall() {
    const now = nowMs();
    audio.ensure();
    if (S.phase === 'walling') return;
    if (S.phase === 'sleep' && S.locked.length === 0 && !S.auto) { say('NICHTS ZU MAUERN.', 'nothing to wall up'); audio.knock(); return; }
    S.auto = null; S.queue = []; S.pending = null;
    audio.active(false);
    setPhase('walling', now, T.walling);
    audio.wall();
    say('ZUMAUERN …', 'walling up');
  }

  function pressBolt() {
    const now = nowMs();
    audio.ensure();
    S.bolt = !S.bolt;
    audio.bolt(S.bolt);
    if (S.bolt) {
      say('RIEGEL VOR.', 'bolt thrown; the stairs and the tear-lever are held');
      if (S.auto) { S.auto = null; S.queue = []; S.autoHalted = true; raiseAlert('RIEGEL VOR!', now); audio.buzz(); say('RIEGEL VOR — DIE NARBE STOCKT.', 'bolt thrown mid-scar; the old crack stops where it is'); }
    } else {
      say('RIEGEL ZURÜCK.', 'bolt drawn back');
    }
  }

  function pressPoster(r) {
    const now = nowMs();
    audio.ensure();
    if (S.bolt) { raiseAlert('RIEGEL VOR!', now); audio.buzz(); say('RIEGEL VOR — KEINE NARBE ÖFFNET.', 'the bolt is thrown; no scar reopens'); return; }
    if (S.auto) { say('EINE NARBE LÄUFT SCHON.', 'a scar is already reopening'); audio.knock(); return; }
    if (!(S.phase === 'sleep' && S.locked.length === 0)) { say('ERST ZUMAUERN.', 'wall up before reopening an old scar'); audio.knock(); return; }
    S.auto = { route: r, seq: r.seq.slice(), i: 0 };
    S.autoHalted = false;
    audio.scar();
    say(`ALTE NARBE: ${r.name}`, 'the wall remembers where it broke; old cracks reopen fast');
  }

  function toggleMute() {
    S.muted = !S.muted;
    audio.ensure();
    audio.setMuted(S.muted);
    const b = $('btnMute');
    b.textContent = S.muted ? 'TON: AUS' : 'TON: AN';
    b.classList.toggle('off', S.muted);
    b.setAttribute('aria-pressed', S.muted ? 'true' : 'false');
  }

  // ---------- simulation ----------
  function update(now) {
    const p = S.dur ? clamp((now - S.phaseAt) / S.dur, 0, 1) : 1;
    switch (S.phase) {
      case 'cracking':
        if (p >= 1) { setPhase('fracturing', now, S.auto ? T.fractureScar : T.fractureManual); audio.fracture(); }
        break;
      case 'fracturing':
        if (p >= 1) {
          S.locked.push(S.pending); S.pending = null;
          if (S.locked.length >= N) {
            setPhase('ready', now, 0);
            if (S.auto) S.auto = null;
            audio.ready();
            say('SIEBEN SPLITTER. BEREIT.', 'seven shards out of the wall - pull AUFREISSEN to tear it open');
          } else {
            setPhase('dialing', now, 0);
            say(`SPLITTER ${S.locked.length} VON 7 GEBROCHEN.`, `${S.locked.length} of 7 shards broken out`);
          }
        }
        break;
      case 'buildup':
        if (p >= 1) {
          if (S.dark) { S.fails++; setPhase('failing', now, T.failing); audio.fail(); say('MAUER HÄLT.', 'the wall holds - that gate was bricked up for a reason'); }
          else { setPhase('breakthrough', now, T.breakthrough); audio.breakthrough(); say('DURCHBRUCH!', 'breakthrough'); }
        }
        break;
      case 'breakthrough':
        if (p >= 1) {
          S.opens++; S.activeAt = now;
          setPhase('active', now, 0);
          audio.active(true);
          const name = S.dest ? S.dest.name : 'UNBENANNTER ORT';
          const en = S.dest ? S.dest.en : 'an unnamed place; the wall opened anyway';
          say(`OFFEN — ${name}`, `open: ${en}`);
        }
        break;
      case 'failing':
        if (p >= 1) { clearAll(); setPhase('sleep', now, 0); say('MAUER HÄLT. DIE SPLITTER SITZEN WIEDER.', 'the wall held; the shards sit back in it - dial again'); }
        break;
      case 'walling':
        if (p >= 1) { clearAll(); setPhase('sleep', now, 0); say('ZUGEMAUERT.', 'walled up; the wall sleeps'); }
        break;
    }
    const idle = S.phase === 'sleep' || S.phase === 'dialing';
    if (S.auto && idle) {
      if (S.bolt) {
        S.auto = null; S.queue = []; S.autoHalted = true;
        raiseAlert('RIEGEL VOR!', now); audio.buzz();
        say('RIEGEL VOR — DIE NARBE STOCKT.', 'bolt thrown mid-scar; the old crack stops where it is');
      } else if (S.auto.i < S.auto.seq.length && S.queue.length === 0 && S.locked.length < N) {
        S.queue.push(S.auto.seq[S.auto.i++]);
      }
    }
    if (S.queue.length && idle && S.locked.length < N) {
      const g = S.queue.shift();
      if (!S.locked.includes(g)) startCrack(g, now);
    }
    if (S.alert && now - S.alertAt > T.alert) S.alert = null;

    // tilt: the room keels as the wall fractures
    const PER = 0.6, LURCH = 6.5;
    const base = S.locked.length * PER;
    let tilt = base;
    const p2 = S.dur ? clamp((now - S.phaseAt) / S.dur, 0, 1) : 1;
    switch (S.phase) {
      case 'cracking': tilt = base + 0.4 * Math.sin(now / 38); break;
      case 'fracturing': tilt = base + PER * p2 + (p2 < 0.3 ? 1.0 * Math.sin(now / 20) : 0); break;
      case 'buildup': tilt = base + Math.floor(p2 * 7) / 7 * LURCH + (p2 > 0.6 ? 0.5 * Math.sin(now / 23) : 0); break;
      case 'breakthrough': tilt = -5; break;
      case 'active': tilt = -2.5 + ((Math.floor(now / 260) % 2) ? 1.2 : -1.2); break;
      case 'failing': tilt = (base + LURCH) * (1 - p2) + (p2 < 0.4 ? 2.5 * Math.sin(now / 22) : 0); break;
      case 'walling': tilt = base * (1 - p2); break;
    }
    S.tilt = tilt;

    // unrest
    let u = S.locked.length * 12;
    switch (S.phase) {
      case 'sleep': u = 2 + 2 * Math.sin(now / 900); break;
      case 'cracking': u += 6 + 4 * Math.sin(now / 60); break;
      case 'fracturing': u += 12; break;
      case 'ready': u = 84 + 2 * Math.sin(now / 300); break;
      case 'buildup': u = 84 + 16 * p2; break;
      case 'breakthrough': u = 100; break;
      case 'active': u = 70 + ((Math.floor(now / 260) % 2) ? 6 : -6); break;
      case 'failing': u = 100 * (1 - p2); break;
      case 'walling': u = S.locked.length * 12 * (1 - p2); break;
    }
    S.unrest = clamp(u, 0, 100);
  }

  // ---------- render ----------
  const room = $('room');
  const msgDe = $('msgDe'), msgEn = $('msgEn'), wortlaut = $('wortlaut');
  const alertEl = $('alert'), alertText = $('alertText');
  const btnTear = $('btnTear'), btnWall = $('btnWall'), btnBolt = $('btnBolt');
  const boltLabel = $('boltLabel'), boltSub = $('boltSub');
  const mTilt = $('mTilt'), mUnrest = $('mUnrest'), mShards = $('mShards'), unrestFill = $('unrestFill');
  let lastMsg = '', lastAlert = null, lastVortex = false;

  function render(now) {
    const p = S.dur ? clamp((now - S.phaseAt) / S.dur, 0, 1) : 1;
    const ph = S.phase;

    room.style.transform = `rotate(${S.tilt.toFixed(2)}deg) skewX(${(S.tilt * 0.55).toFixed(2)}deg)`;

    // shards
    shards.forEach((sh, i) => {
      const locked = i < S.locked.length;
      const pend = S.pending !== null && i === S.locked.length;
      let fill = 'none', stroke = BONE, sop = 0.25, sw = 3, glyph = null, tx = 0, ty = 0, rot = 0, gfill = INK;
      if (locked) {
        glyph = GLYPHS[S.locked[i]];
        fill = BONE; stroke = INK; sop = 1; sw = 7; tx = sh.nx * 14; ty = sh.ny * 14; rot = sh.tilt;
        if (ph === 'buildup') {
          const k = Math.ceil(p * 7 * 1.6);
          if (i < k) fill = VERM;
          const amp = 1.5 + p * 9;
          tx += Math.sin(now / 17 + i * 7) * amp; ty += Math.cos(now / 13 + i * 5) * amp;
          rot += Math.sin(now / 21 + i) * p * 3;
        } else if (ph === 'breakthrough') {
          fill = WHITE; stroke = INK; tx *= 1.8; ty *= 1.8;
        } else if (ph === 'active') {
          fill = CAD; gfill = VERM; const st = Math.floor(now / 130) % 3;
          tx += (st - 1) * 2; ty += (st === 1 ? 2 : -1);
        } else if (ph === 'failing') {
          fill = VERM; const s = 1 - p; tx *= s; ty *= s; rot *= s;
          if (p < 0.4) { tx += Math.sin(now / 15 + i) * 6; }
        } else if (ph === 'walling') {
          const s = 1 - p; tx *= s; ty *= s; rot *= s;
        }
      } else if (pend) {
        stroke = BONE; sw = 4; sop = (Math.floor(now / 70) % 2) ? 0.95 : 0.45;
        if (ph === 'fracturing') {
          fill = p < 0.5 ? WHITE : BONE; sop = 1; stroke = INK; sw = 7;
          glyph = p >= 0.5 ? GLYPHS[S.pending] : null;
          tx = sh.nx * 14 * p; ty = sh.ny * 14 * p; rot = sh.tilt * p;
        }
      }
      sh.polyEl.setAttribute('fill', fill);
      sh.polyEl.setAttribute('stroke', stroke);
      sh.polyEl.setAttribute('stroke-opacity', sop);
      sh.polyEl.setAttribute('stroke-width', sw);
      sh.el.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) rotate(${rot.toFixed(2)} ${sh.cx.toFixed(1)} ${sh.cy.toFixed(1)})`);
      sh.el.setAttribute('class', 'shard' + (locked ? ' locked' : pend ? ' pending' : ''));
      if (glyph) {
        if (sh.glyphId !== glyph.id) { sh.glyphEl.setAttribute('d', glyph.d); sh.glyphId = glyph.id; }
        sh.glyphEl.style.display = '';
        sh.glyphEl.setAttribute('fill', glyph.open ? 'none' : gfill);
        sh.glyphEl.setAttribute('stroke', gfill);
        sh.glyphEl.setAttribute('stroke-width', glyph.open ? 3.4 : 1.4);
      } else {
        sh.glyphEl.style.display = 'none';
      }
    });

    // pending crack propagation
    if (S.pending !== null && ph === 'cracking') {
      const c = S.cracks[S.cracks.length - 1];
      const off = (c.len * (1 - p)).toFixed(1);
      c.under.setAttribute('stroke-dashoffset', off); c.over.setAttribute('stroke-dashoffset', off);
    } else if (S.cracks.length) {
      const c = S.cracks[S.cracks.length - 1];
      if (c.over.getAttribute('stroke-dashoffset') !== '0') { c.under.setAttribute('stroke-dashoffset', '0'); c.over.setAttribute('stroke-dashoffset', '0'); }
    }

    // the hole / the eye
    let holeFill = INK;
    if (ph === 'buildup') holeFill = p < 0.3 ? INK : '#5a1208';
    else if (ph === 'breakthrough') holeFill = WHITE;
    else if (ph === 'active') holeFill = CAD;
    else if (ph === 'failing') holeFill = p < 0.5 ? VERM : INK;
    holePoly.setAttribute('fill', holeFill);

    webLines.forEach((w, k) => {
      let f = 0;
      if (ph === 'buildup') f = clamp((p - k * 0.05) / 0.5, 0, 1);
      else if (ph === 'breakthrough') f = 1;
      w.path.setAttribute('stroke-dashoffset', (w.len * (1 - f)).toFixed(1));
      w.path.setAttribute('stroke', ph === 'breakthrough' ? INK : BONE);
    });

    const vortexOn = ph === 'active';
    if (vortexOn !== lastVortex) { vortexG.style.display = vortexOn ? '' : 'none'; lastVortex = vortexOn; }
    if (vortexOn) {
      const ang = Math.floor((now - S.activeAt) / 140) * 11;
      irisG.setAttribute('transform', `rotate(${ang} ${RING.cx} ${RING.cy})`);
    }

    // bolt + flash
    boltEl.style.display = (ph === 'breakthrough' && p < 0.75 && (Math.floor(now / 60) % 4 !== 3)) ? '' : 'none';
    flashEl.setAttribute('fill-opacity', ph === 'breakthrough' ? (p < 0.15 ? 0.85 : 0) : 0);

    // lamp
    let cone = 0.10, bulb = CAD;
    if (ph === 'buildup') { cone = (Math.floor(now / 45 + p * 12) % 3 === 0) ? 0.03 : 0.2; bulb = (cone > 0.1) ? CAD : BONE; }
    else if (ph === 'breakthrough') { cone = 0.35; bulb = WHITE; }
    else if (ph === 'active') { cone = 0.22; bulb = CAD; lampCone.setAttribute('fill', CAD); }
    if (ph !== 'active') lampCone.setAttribute('fill', BONE);
    lampCone.setAttribute('fill-opacity', cone);
    lampBulb.setAttribute('fill', bulb);

    // stairs
    const sealed = !(ph === 'sleep' || ph === 'dialing' || ph === 'cracking' || ph === 'fracturing');
    stairsEl.classList.toggle('barred', S.bolt);
    stairsEl.classList.toggle('sealed', sealed && !S.bolt);
    treads.forEach((t, i) => {
      const cls = 'tread' + (S.locked.includes(i) ? ' locked' : S.pending === i ? ' pending' : S.queue.includes(i) ? ' queued' : '');
      if (t.el.className !== cls) t.el.className = cls;
    });

    // posters
    ROUTES.forEach(r => {
      const running = S.auto && S.auto.route === r;
      r.el.classList.toggle('running', !!running);
      r.el.classList.toggle('barred', S.bolt);
    });

    // pad
    for (let i = 0; i < N; i++) {
      const s = slotEls[i];
      const locked = i < S.locked.length;
      const pend = S.pending !== null && i === S.locked.length;
      const g = locked ? GLYPHS[S.locked[i]] : null;
      if (s.glyph !== (g ? g.id : null)) { s.el.innerHTML = g ? glyphSVG(g) : ''; s.glyph = g ? g.id : null; }
      let cls = 'slot ' + (locked ? 'filled' : pend ? 'pending' : 'empty');
      if (locked && (ph === 'buildup' || ph === 'failing')) cls += ' hot';
      if (locked && ph === 'active') cls += ' open';
      if (s.el.className !== cls) s.el.className = cls;
    }
    mTilt.textContent = `${S.tilt >= 0 ? '+' : ''}${S.tilt.toFixed(1)}°`;
    mUnrest.textContent = String(Math.round(S.unrest));
    mShards.textContent = `${S.locked.length} / 7`;
    unrestFill.style.width = S.unrest.toFixed(0) + '%';

    // levers
    const tearCls = 'lever tear' + (ph === 'ready' && !S.bolt ? ((Math.floor(now / 220) % 2) ? ' armed' : '') : '') +
      ((ph === 'buildup' || ph === 'breakthrough' || ph === 'active') ? ' on' : '') + (S.bolt && ph === 'ready' ? ' blocked' : '');
    if (btnTear.className !== tearCls) btnTear.className = tearCls;
    const wallCls = 'lever wall' + (ph === 'walling' ? ' on' : '');
    if (btnWall.className !== wallCls) btnWall.className = wallCls;
    const boltCls = 'lever bolt' + (S.bolt ? ' on' : '');
    if (btnBolt.className !== boltCls) {
      btnBolt.className = boltCls;
      boltLabel.textContent = S.bolt ? 'RIEGEL VOR' : 'RIEGEL';
      boltSub.textContent = S.bolt ? 'bolt thrown · held' : 'bolt · drawn back';
    }

    // message
    const key = S.msg.de + '|' + S.msg.en;
    if (key !== lastMsg) { msgDe.textContent = S.msg.de; msgEn.textContent = S.msg.en; lastMsg = key; }
    wortlaut.classList.toggle('hot', ph === 'buildup' || ph === 'failing' || (S.alert !== null));
    wortlaut.classList.toggle('open', ph === 'active');

    // alert
    if (S.alert !== lastAlert) {
      lastAlert = S.alert;
      if (S.alert) { alertText.textContent = S.alert; alertEl.hidden = false; } else { alertEl.hidden = true; }
    }
  }

  // ---------- loop: rAF plus a coarse backstop so hidden tabs still advance ----------
  function tick() { const now = nowMs(); update(now); render(now); }
  function raf() { tick(); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  setInterval(tick, 100);

  // ---------- fit the 1920x1080 scene to any viewport ----------
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    if (!(w > 0 && h > 0)) { setTimeout(fit, 150); return; }
    const s = Math.min(w / W, h / H);
    document.documentElement.style.setProperty('--fit', String(s));
    S.fit = s;
  }
  window.addEventListener('resize', fit);
  fit();

  // ---------- wiring ----------
  btnTear.addEventListener('click', pressTear);
  btnWall.addEventListener('click', pressWall);
  btnBolt.addEventListener('click', pressBolt);
  $('btnMute').addEventListener('click', toggleMute);
  document.addEventListener('pointerdown', () => audio.ensure(), { passive: true });
  document.addEventListener('keydown', () => audio.ensure());

  say('DIE WAND SCHLÄFT.', 'the wall sleeps - step on a stair to crack a shard out of it');
  tick();

  // ---------- diagnostics ----------
  window.__splitterlicht = {
    version: VERSION,
    glyphs: GLYPHS.map(g => g.id),
    routes: ROUTES.map(r => ({ id: r.id, seq: r.seq.slice(), dark: !!r.dark })),
    state() {
      return {
        phase: S.phase, phaseAt: S.phaseAt, dur: S.dur,
        locked: S.locked.slice(), pending: S.pending, queue: S.queue.slice(),
        bolt: S.bolt, auto: S.auto ? { route: S.auto.route.id, i: S.auto.i } : null, autoHalted: S.autoHalted,
        dark: S.dark, dest: S.dest ? S.dest.id : null,
        tilt: S.tilt, unrest: S.unrest, msg: S.msg, alert: S.alert, muted: S.muted,
        cracks: S.cracks.length, fit: S.fit, opens: S.opens, fails: S.fails,
        roomTransform: room.style.transform,
      };
    },
  };
})();
