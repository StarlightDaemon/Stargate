/* NIGHTGLASS — main stage logic.
   A decorative fiction: weaving glyph-threads of light and opening a
   staged, purely theatrical link. Nothing here has any real function. */
'use strict';

(() => {

  /* ———— constants ———— */
  const ADDR_LEN = 7;             /* glyphs per route */
  const NODE_COUNT = GLYPHS.length; /* ten resonance glyphs */
  const AUTO_STEP_MS = 430;       /* loom-speed reweave cadence */
  const BUILDUP_MS = 1800;
  const BREAKTHROUGH_MS = 1050;
  const COOLDOWN_MS = 700;
  const LSK = { prefs: 'nightglass.prefs', history: 'nightglass.history', seen: 'nightglass.seen' };

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const stage = $('#stage');
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ———— state ———— */
  const S = {
    state: 'idle',
    locked: [],
    dest: null,
    ward: false,
    autoTimers: [],
    autoThread: null,
    seqTimers: [],
    tide: false,
    seen: new Set(),
    history: [],
    prefs: {
      theme: 'neon-dusk', density: 'standard', motion: 'full',
      audio: { master: 0.8, ambient: 0.5, ui: 0.7, link: 0.8 }
    }
  };

  /* ———— persistence (single-visitor, this browser only) ———— */
  const store = {
    read(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    clear() { try { Object.values(LSK).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  };

  /* ———— journal ———— */
  const journal = [];
  const fmtT = t => new Date(t).toLocaleTimeString('en-GB', { hour12: false });
  function log(msg, kind) {
    journal.push({ t: Date.now(), msg, kind: kind || 'info' });
    const tick = $('#log-ticker');
    tick.innerHTML = journal.slice(-3).map(e =>
      `<li><time>${fmtT(e.t)}</time>${e.msg}</li>`).join('');
    const jl = $('#journal-list');
    if (jl && !$('#ov-journal').hidden) renderJournal();
  }
  function renderJournal() {
    $('#journal-list').innerHTML = journal.map(e =>
      `<li class="jk-${e.kind}"><time>${fmtT(e.t)}</time><span class="${e.kind === 'link' ? 'jk-link' : e.kind === 'warn' ? 'jk-warn' : ''}">${e.msg}</span></li>`
    ).reverse().join('');
  }

  /* ———— fit: scale the 1920×1080 stage to the viewport ————
     The ratio is computed here in JS as a bare number, because dividing
     a CSS length by a bare number inside scale() is silently invalid. */
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) { setTimeout(fit, 120); return; }
    const k = Math.min(w / 1920, h / 1080);
    document.documentElement.style.setProperty('--fit', String(k));
  }
  window.addEventListener('resize', fit);

  /* ———— background lattice canvas ———— */
  const bg = (() => {
    const cv = $('#lattice-bg'), cx = cv.getContext('2d');
    let pts = [], raf = 0, W = 0, H = 0;
    function size() {
      W = cv.width = window.innerWidth; H = cv.height = window.innerHeight;
      const n = Math.round((W * H) / 16000);
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        z: 0.35 + Math.random() * 0.65,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.09
      }));
    }
    function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
    function frame() {
      const accent = css('--accent') || '#55f0ff';
      const accent2 = css('--accent2') || '#ff58d8';
      const amp = S.prefs.motion === 'still' ? 0 : (S.prefs.motion === 'soft' ? 0.45 : 1);
      const boost = S.state === 'active' ? 1.5 : (S.state === 'buildup' || S.state === 'breakthrough') ? 1.25 : 1;
      cx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx * p.z * amp * boost; p.y += p.vy * p.z * amp * boost;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      }
      cx.lineWidth = 0.5;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < i + 7 && j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 26000) {
            cx.globalAlpha = (1 - d2 / 26000) * 0.13 * a.z * boost;
            cx.strokeStyle = accent;
            cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
          }
        }
      }
      for (const p of pts) {
        cx.globalAlpha = 0.28 * p.z * boost;
        cx.fillStyle = p.z > 0.8 ? accent2 : accent;
        cx.fillRect(p.x, p.y, 1.6 * p.z, 1.6 * p.z);
      }
      cx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', size);
    return { start() { size(); cancelAnimationFrame(raf); frame(); } };
  })();

  /* ———— the veil ring ———— */
  const RING = { C: 340, rShard: 252, rProg: 210, slotDeg: 360 / ADDR_LEN, gapDeg: 6 };
  const polar = (r, deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return [RING.C + r * Math.cos(a), RING.C + r * Math.sin(a)];
  };
  let roilNode = null;

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function buildRing() {
    const svg = $('#ring');
    /* defs: the open well's gradient + liquid-light roil filter */
    const defs = el('defs', {}, svg);
    const grad = el('radialGradient', { id: 'wellgrad', cx: '50%', cy: '46%', r: '62%' }, defs);
    [['0%', '--well1', 1], ['45%', '--well2', 0.95], ['82%', '--well3', 0.85], ['100%', '--well3', 0.4]]
      .forEach(([o, v, op]) => {
        const s = el('stop', { offset: o }, grad);
        s.style.stopColor = `var(${v})`; s.style.stopOpacity = op;
      });
    const filt = el('filter', { id: 'roil', x: '-25%', y: '-25%', width: '150%', height: '150%' }, defs);
    roilNode = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.012 0.02', numOctaves: '2', seed: '7', result: 'n' }, filt);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '30' }, filt);

    /* rotating barrier layers */
    const rot = el('g', { class: 'ring-rot' }, svg);
    el('circle', { class: 'ring-dash', cx: 340, cy: 340, r: 322 }, rot);
    el('circle', { class: 'ring-frame', cx: 340, cy: 340, r: 331 }, rot);
    const rev = el('g', { class: 'ring-rot-rev' }, svg);
    el('circle', { class: 'ring-dash2', cx: 340, cy: 340, r: 296 }, rev);
    el('circle', { class: 'ring-frame', cx: 340, cy: 340, r: 288 }, rev);

    /* seven veil shards */
    for (let i = 0; i < ADDR_LEN; i++) {
      const a0 = i * RING.slotDeg + RING.gapDeg / 2;
      const a1 = (i + 1) * RING.slotDeg - RING.gapDeg / 2;
      const [x0, y0] = polar(RING.rShard, a0);
      const [x1, y1] = polar(RING.rShard, a1);
      el('path', {
        class: 'shard', 'data-slot': i,
        d: `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${RING.rShard} ${RING.rShard} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
      }, svg);
      const [tx0, ty0] = polar(232, i * RING.slotDeg);
      const [tx1, ty1] = polar(272, i * RING.slotDeg);
      el('line', { class: 'shard-tick', x1: tx0, y1: ty0, x2: tx1, y2: ty1 }, svg);
      /* glyph anchor at the shard's midpoint (filled on lock) */
      const [gx, gy] = polar(RING.rShard, (a0 + a1) / 2);
      el('g', { class: 'ring-glyph', 'data-slot': i, transform: `translate(${(gx - 16).toFixed(1)} ${(gy - 16).toFixed(1)}) scale(0.5)` }, svg);
    }

    /* progress arc */
    const C = 2 * Math.PI * RING.rProg;
    el('circle', {
      id: 'progress-arc', cx: 340, cy: 340, r: RING.rProg,
      'stroke-dasharray': C.toFixed(1), 'stroke-dashoffset': C.toFixed(1),
      transform: 'rotate(-90 340 340)'
    }, svg);

    /* aperture — idle veil, pending breath, and the open well */
    const well = el('g', { id: 'aperture-well' }, svg);
    const core = el('circle', { cx: 340, cy: 340, r: 184, fill: 'url(#wellgrad)' }, well);
    core.setAttribute('filter', 'url(#roil)');
    el('circle', { cx: 340, cy: 340, r: 184, fill: 'none', stroke: 'var(--well1)', 'stroke-width': 2, opacity: 0.7 }, well);

    const idle = el('g', { id: 'aperture-idle' }, svg);
    el('circle', { id: 'aperture-core-idle', cx: 340, cy: 340, r: 186 }, idle);
    [148, 108, 66].forEach(r => el('circle', { class: 'ap-ring', cx: 340, cy: 340, r }, idle));
    el('circle', { id: 'aperture-breath', cx: 340, cy: 340, r: 182 }, svg);
  }

  function setRoil(on) {
    if (!roilNode) return;
    if (roilAnim.raf) { cancelAnimationFrame(roilAnim.raf); roilAnim.raf = 0; }
    if (on && S.prefs.motion !== 'still') {
      const step = () => {
        const t = performance.now() / 1000;
        const bf = 0.012 + 0.004 * Math.sin(t * 0.7);
        roilNode.setAttribute('baseFrequency', `${bf.toFixed(4)} ${(bf * 1.7).toFixed(4)}`);
        roilAnim.raf = requestAnimationFrame(step);
      };
      step();
    }
  }
  const roilAnim = { raf: 0 };

  function glyphInto(group, g) {
    group.innerHTML = '';
    for (const d of g.marks) el('path', { d }, group);
    for (const r of g.rings) el('circle', { cx: r[0], cy: r[1], r: r[2] }, group);
    for (const p of g.dots) el('circle', { class: 'dot', cx: p[0], cy: p[1], r: 3.2 }, group);
  }

  /* ———— the weave deck ———— */
  function buildDeck() {
    const track = $('#addr-track');
    for (let i = 0; i < ADDR_LEN; i++) {
      const d = document.createElement('div');
      d.className = 'addr-slot'; d.dataset.slot = i;
      d.innerHTML = `<span class="slot-num">${i + 1}</span>`;
      track.appendChild(d);
    }
    const keys = $('#glyph-keys');
    GLYPHS.forEach((g, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'gkey'; b.dataset.glyph = i;
      b.setAttribute('aria-label', `glyph ${g.name}, ${g.hint}`);
      b.innerHTML = glyphSVG(g) + `<span class="kname">${g.name}</span>`;
      b.addEventListener('click', () => { wake(); tryManualLock(i); });
      keys.appendChild(b);
    });
    markNextSlot();
  }

  function markNextSlot() {
    $$('.addr-slot').forEach((s, i) => s.classList.toggle('next',
      i === S.locked.length && (S.state === 'idle' || S.state === 'weaving')));
  }

  function tryManualLock(gi) {
    if (S.state === 'autodial') { log('the loom is busy reweaving — close the link to interrupt', 'warn'); Loom.denyBuzz(); return; }
    if (S.state !== 'idle' && S.state !== 'weaving') { Loom.key(); return; }
    if (S.locked.includes(gi) || S.locked.length >= ADDR_LEN) return;
    lockGlyph(gi);
  }

  /* The signal-lock: glyph resolves from static, a light-thread arcs to
     the ring, and one veil shard dissolves into its lit state. */
  function lockGlyph(gi) {
    if (S.state === 'idle') setState('weaving');
    const slot = S.locked.length;
    S.locked.push(gi);
    const g = GLYPHS[gi];

    const slotEl = $(`.addr-slot[data-slot="${slot}"]`);
    slotEl.classList.add('filled');
    slotEl.insertAdjacentHTML('beforeend', glyphSVG(g, 'slot-glyph'));

    const key = $(`.gkey[data-glyph="${gi}"]`);
    key.classList.add('used', 'flash');
    setTimeout(() => key.classList.remove('flash'), 350);

    const shard = $(`.shard[data-slot="${slot}"]`);
    shard.classList.add('dissolving');
    setTimeout(() => { shard.classList.remove('dissolving'); shard.classList.add('locked'); }, 680);

    const rg = $(`.ring-glyph[data-slot="${slot}"]`);
    glyphInto(rg, g);
    setTimeout(() => rg.classList.add('lit'), 300);

    const C = 2 * Math.PI * RING.rProg;
    $('#progress-arc').setAttribute('stroke-dashoffset', (C * (1 - S.locked.length / ADDR_LEN)).toFixed(1));

    threadFX(key, slot);
    Loom.lock(slot, ADDR_LEN);
    log(`glyph ${g.name} resolved — shard ${S.locked.length} of ${ADDR_LEN}`);

    if (S.locked.length >= ADDR_LEN) {
      finishWeave();
    } else {
      if (S.state === 'weaving') caption(`weaving — ${S.locked.length} of ${ADDR_LEN} shards set`);
      markNextSlot();
    }
  }

  function finishWeave() {
    const addr = S.locked.join(',');
    S.dest = THREADS.find(t => t.addr.join(',') === addr) || null;
    const via = S.autoThread ? `thread · ${S.autoThread.name}` : 'hand-woven';
    if (S.autoThread) { $$('.thread-btn').forEach(b => b.classList.remove('weaving')); }
    S.autoThread = null; S.autoTimers = [];
    setState('pending');
    Loom.readyChord();
    const destName = S.dest ? S.dest.name : 'an unnamed reach';
    caption(`thread complete — the link to ${destName} waits`);
    log(`thread complete (${via}) — the link waits, pending`, 'link');
    pushHistory(destName, via);
    markNextSlot();
  }

  /* light-thread from a deck key to the ring's next shard */
  function threadFX(fromEl, slot) {
    const ov = $('#thread-overlay');
    const st = stage.getBoundingClientRect();
    const k = st.width / 1920;
    const fr = fromEl.getBoundingClientRect();
    const x0 = (fr.left + fr.width / 2 - st.left) / k;
    const y0 = (fr.top + fr.height / 2 - st.top) / k;
    const a0 = slot * RING.slotDeg + RING.gapDeg / 2;
    const a1 = (slot + 1) * RING.slotDeg - RING.gapDeg / 2;
    const [rx, ry] = polar(RING.rShard, (a0 + a1) / 2);
    const x1 = 880 + rx, y1 = 104 + ry;
    const path = el('path', {
      class: 'lthread',
      d: `M ${x0.toFixed(0)} ${y0.toFixed(0)} Q ${((x0 + x1) / 2).toFixed(0)} ${(Math.min(y0, y1) - 170).toFixed(0)} ${x1.toFixed(0)} ${y1.toFixed(0)}`
    }, ov);
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    path.animate(
      [{ strokeDashoffset: len, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }],
      { duration: 240, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => path.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }), 260);
    setTimeout(() => path.remove(), 560);
  }

  /* ———— state machine ———— */
  const CAPTIONS = {
    idle: 'the veil turns, unhurried',
    weaving: 'weaving',
    autodial: 'reweaving at loom speed',
    pending: 'thread complete — the link waits',
    buildup: 'light gathers behind the veil',
    breakthrough: 'B R E A K T H R O U G H',
    active: 'the link is open',
    cooldown: 'the veil re-forms'
  };
  function caption(t) { $('#state-caption').textContent = t; }
  function setState(next) {
    S.state = next;
    stage.dataset.state = next;
    $('#btn-open').dataset.armed = next === 'pending' ? '1' : '0';
    caption(CAPTIONS[next]);
    if (next === 'active') setRoil(true); else if (next !== 'breakthrough') setRoil(false);
  }

  /* ———— open link: the only trigger for activation ———— */
  function openLink() {
    wake();
    if (S.state !== 'pending') {
      log('no completed thread to open', 'warn');
      Loom.denyBuzz();
      return;
    }
    if (S.ward) {
      wardBlock();
      return;
    }
    const destName = S.dest ? S.dest.name : 'an unnamed reach';
    setState('buildup');
    caption(`light gathers — ${destName}`);
    log('opening the link — light gathers', 'link');
    Loom.buildup(BUILDUP_MS / 1000);
    S.seqTimers.push(setTimeout(() => {
      setState('breakthrough');
      Loom.breakthrough();
      log('breakthrough — the veil parts', 'link');
      S.seqTimers.push(setTimeout(() => {
        setState('active');
        caption(`the link is open — ${destName}`);
        Loom.humStart();
        log(`link established — ${destName}`, 'link');
      }, BREAKTHROUGH_MS));
    }, BUILDUP_MS));
  }

  function wardBlock() {
    const b = $('#ward-banner');
    b.hidden = false;
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    Loom.denyBuzz();
    log('the drift ward held the link closed', 'warn');
    clearTimeout(wardBlock.t);
    wardBlock.t = setTimeout(() => { b.hidden = true; }, 3200);
  }

  /* ———— close link: always within reach ———— */
  function closeLink() {
    wake();
    S.seqTimers.forEach(clearTimeout); S.seqTimers = [];
    switch (S.state) {
      case 'idle':
        log('nothing to close — the spire idles'); Loom.key(); break;
      case 'weaving':
        clearWeave(); setState('idle'); log('thread unwound'); Loom.closeTone(); break;
      case 'autodial':
        S.autoTimers.forEach(clearTimeout); S.autoTimers = [];
        $$('.thread-btn').forEach(b => b.classList.remove('weaving'));
        S.autoThread = null;
        clearWeave(); setState('idle'); log('reweave halted — thread unwound', 'warn'); Loom.closeTone(); break;
      case 'pending':
        clearWeave(); setState('idle'); log('thread released without opening'); Loom.closeTone(); break;
      case 'buildup':
      case 'breakthrough':
        Loom.humStop(); Loom.closeTone();
        setState('cooldown');
        log('link closed before it opened', 'warn');
        setTimeout(() => { clearWeave(); setState('idle'); }, COOLDOWN_MS);
        break;
      case 'active':
        Loom.humStop(); Loom.closeTone();
        setState('cooldown');
        log('link closed — the veil re-forms', 'link');
        setTimeout(() => { clearWeave(); setState('idle'); }, COOLDOWN_MS);
        break;
      case 'cooldown':
        log('the veil is already re-forming'); break;
    }
  }

  function clearWeave() {
    S.locked = []; S.dest = null;
    $$('.addr-slot').forEach(s => {
      s.classList.remove('filled');
      const g = s.querySelector('svg'); if (g) g.remove();
    });
    $$('.gkey').forEach(k => k.classList.remove('used'));
    $$('.shard').forEach(sh => sh.classList.remove('locked', 'dissolving'));
    $$('.ring-glyph').forEach(rg => { rg.classList.remove('lit'); rg.innerHTML = ''; });
    const C = 2 * Math.PI * RING.rProg;
    $('#progress-arc').setAttribute('stroke-dashoffset', C.toFixed(1));
    markNextSlot();
  }

  /* ———— drift ward (defaults to RELEASED) ———— */
  function toggleWard() {
    wake();
    S.ward = !S.ward;
    const b = $('#btn-ward');
    b.classList.toggle('engaged', S.ward);
    b.setAttribute('aria-pressed', String(S.ward));
    $('#ward-state').textContent = S.ward ? 'ENGAGED' : 'RELEASED';
    $('#ward-chip').hidden = !S.ward;
    log(S.ward ? 'drift ward engaged — the link will be held' : 'drift ward released', S.ward ? 'warn' : 'info');
    Loom.key();
  }

  /* ———— threads: remembered routes, re-woven glyph by glyph ———— */
  function buildThreads() {
    for (const t of THREADS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'thread-btn'; b.dataset.thread = t.id;
      b.innerHTML = `${t.name}<small>${t.note}</small>`;
      b.addEventListener('click', () => { wake(); weaveThread(t, b); });
      $(t.tier === 'anchored' ? '#tier-anchored' : '#tier-frayed').appendChild(b);
    }
  }

  function weaveThread(t, btn) {
    if (['buildup', 'breakthrough', 'active', 'cooldown'].includes(S.state)) {
      log('a link is open — close it before reweaving', 'warn'); Loom.denyBuzz(); return;
    }
    if (S.state === 'autodial') {
      log('the loom is already reweaving', 'warn'); Loom.denyBuzz(); return;
    }
    S.seqTimers.forEach(clearTimeout); S.seqTimers = [];
    clearWeave();
    setState('autodial');
    S.autoThread = t;
    btn.classList.add('weaving');
    caption(`reweaving "${t.name}" — loom speed`);
    log(`reweaving "${t.name}" (${t.tier} thread) — the route is remembered, not re-derived`, 'link');
    t.addr.forEach((gi, n) => {
      S.autoTimers.push(setTimeout(() => {
        if (S.state !== 'autodial') return;
        lockGlyph(gi);
      }, 360 + n * AUTO_STEP_MS));
    });
  }

  /* ———— history (persists across visits) ———— */
  function pushHistory(name, via) {
    S.history.push({ t: Date.now(), name, via, session: 'this' });
    store.write(LSK.history, S.history.map(h => ({ t: h.t, name: h.name, via: h.via })).slice(-40));
    renderHistory();
  }
  function renderHistory() {
    $('#history-list').innerHTML = S.history.slice().reverse().map(h =>
      `<li class="${h.session === 'prior' ? 'hl-old' : ''}"><time>${fmtT(h.t)}</time>${h.name}<span class="hl-via">${h.via}</span></li>`
    ).join('') || '<li class="hl-old">no weaves yet</li>';
  }

  /* ———— telemetry ———— */
  const TELE_DEFS = [
    { k: 'carrier', label: 'CARRIER', unit: 'cd·lm', max: 100 },
    { k: 'coherence', label: 'COHERENCE', unit: '%', max: 100 },
    { k: 'throughput', label: 'THROUGHPUT', unit: 'strands/s', max: 240 },
    { k: 'drift', label: 'DRIFT', unit: 'mote', max: 100, warn: true }
  ];
  function buildTele() {
    $('#mini-tele').innerHTML = TELE_DEFS.map(d =>
      `<div class="mt-row ${d.warn ? 'warn' : ''}" data-k="${d.k}"><span>${d.label}</span><div class="mt-bar"><div class="mt-fill"></div></div><span class="mt-val">—</span></div>`
    ).join('');
    $('#tele-grid').innerHTML = TELE_DEFS.map(d =>
      `<div class="tele-card" data-k="${d.k}"><h4>${d.label}</h4><div class="tc-val">—<small>${d.unit}</small></div><canvas width="480" height="56"></canvas></div>`
    ).join('');
  }
  function drawSpark(cv, arr, max) {
    const c = cv.getContext('2d');
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#55f0ff';
    c.clearRect(0, 0, cv.width, cv.height);
    if (arr.length < 2) return;
    c.strokeStyle = accent; c.lineWidth = 1.6; c.globalAlpha = 0.9;
    c.beginPath();
    arr.forEach((v, i) => {
      const x = (i / (arr.length - 1)) * cv.width;
      const y = cv.height - 4 - (v / max) * (cv.height - 10);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    });
    c.stroke(); c.globalAlpha = 1;
  }
  function teleTick() {
    const s = Tele.sample(S.state, S.ward, S.tide);
    for (const d of TELE_DEFS) {
      const row = $(`.mt-row[data-k="${d.k}"]`);
      if (row) {
        row.querySelector('.mt-fill').style.width = `${Math.min(100, (s[d.k] / d.max) * 100)}%`;
        row.querySelector('.mt-val').textContent = s[d.k];
      }
      if (!$('#ov-telemetry').hidden) {
        const card = $(`.tele-card[data-k="${d.k}"]`);
        card.querySelector('.tc-val').innerHTML = `${s[d.k]}<small>${d.unit}</small>`;
        drawSpark(card.querySelector('canvas'), Tele.history[d.k], d.max);
      }
    }
    const tideEl = $('#tide-status');
    if (tideEl) {
      tideEl.textContent = S.tide ? 'tide: a drift tide passes — the loom holds its breath' : 'tide: slack water — good weaving';
      tideEl.classList.toggle('surge', S.tide);
      drawSpark($('#turb-spark'), Tele.history.turbulence, 1);
    }
  }
  /* drift tides: occasional ambient weather, never touches the weave */
  function tideLoop() {
    setTimeout(() => {
      S.tide = true;
      log('a drift tide passes through the near sky');
      setTimeout(() => { S.tide = false; tideLoop(); }, 6500);
    }, 45000 + Math.random() * 50000);
  }

  /* ———— archive ———— */
  const KINDS = ['all', 'node', 'route', 'persona', 'phenomenon', 'fragment'];
  let archFilter = 'all', archSel = null;
  function buildArchive() {
    $('#archive-filters').innerHTML = KINDS.map(k =>
      `<button type="button" class="af-chip ${k === 'all' ? 'on' : ''}" data-kind="${k}">${k.toUpperCase()}</button>`).join('');
    $$('#archive-filters .af-chip').forEach(c => c.addEventListener('click', () => {
      archFilter = c.dataset.kind;
      $$('#archive-filters .af-chip').forEach(x => x.classList.toggle('on', x === c));
      renderArchiveList();
    }));
    renderArchiveList();
  }
  function renderArchiveList() {
    const list = ARCHIVE.filter(e => archFilter === 'all' || e.kind === archFilter);
    $('#archive-list').innerHTML = list.map(e =>
      `<li data-id="${e.id}" class="${S.seen.has(e.id) ? 'seen' : ''} ${archSel === e.id ? 'sel' : ''}">
        <span class="al-kind">${e.kind.toUpperCase()}</span><span class="al-name">${e.name}</span></li>`).join('');
    $$('#archive-list li').forEach(li => li.addEventListener('click', () => selectEntry(li.dataset.id)));
  }
  function selectEntry(id) {
    const e = ARCHIVE.find(x => x.id === id);
    if (!e) return;
    archSel = id;
    if (!S.seen.has(id)) {
      S.seen.add(id);
      store.write(LSK.seen, [...S.seen]);
      log(`read the record of ${e.name}`);
    }
    const backrefs = ARCHIVE.filter(o => o.id !== id && o.refs.includes(id));
    $('#archive-detail').innerHTML = `
      <span class="ad-kind">${e.kind.toUpperCase()}</span><span class="ad-tier">${(e.tier || '').toUpperCase()}</span>
      <h3>${e.name}</h3>
      <p class="ad-body">${e.body}</p>
      <div class="ad-refs"><h5>THREADS OF REFERENCE</h5>
        ${e.refs.map(r => { const t = ARCHIVE.find(x => x.id === r); return t ? `<button type="button" class="ref-chip" data-id="${t.id}"><span class="rk">${t.kind[0].toUpperCase()}</span>${t.name}</button>` : ''; }).join('')}
      </div>
      ${backrefs.length ? `<div class="ad-refs"><h5>REFERRED TO BY</h5>${backrefs.map(t => `<button type="button" class="ref-chip backref" data-id="${t.id}"><span class="rk">${t.kind[0].toUpperCase()}</span>${t.name}</button>`).join('')}</div>` : ''}`;
    $$('#archive-detail .ref-chip').forEach(c => c.addEventListener('click', () => selectEntry(c.dataset.id)));
    renderArchiveList();
  }

  /* ———— lattice chart ———— */
  const CHART_POS = {
    spire: [170, 360],
    'prism-orchard': [430, 150], 'halcyon-reef': [700, 115], 'quiet-loom': [390, 430],
    'meridian-well': [640, 355], 'the-roost': [770, 285], 'glass-estuary': [520, 565],
    'pale-observatory': [980, 165], 'murmur-vault': [905, 470], 'cinder-archive': [1120, 375],
    'static-garden': [1075, 585], 'untuned-spire': [1250, 235], 'saffron-shallows': [1275, 520]
  };
  const CHART_EDGES = [
    ['glass-estuary', 'meridian-well'], ['meridian-well', 'the-roost'], ['halcyon-reef', 'the-roost'],
    ['prism-orchard', 'glass-estuary'], ['murmur-vault', 'cinder-archive'], ['pale-observatory', 'quiet-loom'],
    ['saffron-shallows', 'static-garden']
  ];
  let chartBuilt = false;
  function buildChart() {
    if (chartBuilt) return; chartBuilt = true;
    const svg = $('#chart-svg');
    for (const t of THREADS) {
      const [x1, y1] = CHART_POS.spire, [x2, y2] = CHART_POS[t.ref];
      el('line', { class: 'ch-edge known', x1, y1, x2, y2 }, svg);
    }
    for (const [a, b] of CHART_EDGES) {
      const [x1, y1] = CHART_POS[a], [x2, y2] = CHART_POS[b];
      el('line', { class: 'ch-edge', x1, y1, x2, y2 }, svg);
    }
    const amber = el('path', { d: 'M 1150 700 C 1195 560, 1230 470, 1400 420', fill: 'none', stroke: 'var(--warn)', 'stroke-dasharray': '8 10', opacity: 0.5 }, svg);
    amber.setAttribute('stroke-width', '1.6');
    const at = el('text', { class: 'ch-label dim', x: 1190, y: 655, 'text-anchor': 'end' }, svg); at.textContent = 'the amber line (approximate)';
    for (const id in CHART_POS) {
      const [x, y] = CHART_POS[id];
      const isSpire = id === 'spire';
      const entry = ARCHIVE.find(e => e.id === id);
      const g = el('g', { class: 'ch-group', 'data-id': id }, svg);
      el('circle', { class: 'ch-halo', cx: x, cy: y, r: 17 }, g);
      el('circle', { class: `ch-node ${isSpire ? 'spire' : (entry && entry.tier === 'frayed' ? 'frayed' : '')}`, cx: x, cy: y, r: isSpire ? 11 : 8 }, g);
      const lb = el('text', { class: 'ch-label', x: x + 18, y: y + 4 }, g);
      if (x > 1120) { lb.setAttribute('text-anchor', 'end'); lb.setAttribute('x', x - 18); }
      lb.textContent = isSpire ? 'NIGHTGLASS (you are here)' : entry.name;
      if (!isSpire) g.addEventListener('click', () => { openOverlay('archive'); selectEntry(id); });
    }
  }

  /* ———— settings ———— */
  const THEMES = [
    { id: 'neon-dusk', name: 'Neon Dusk', dot: '#55f0ff' },
    { id: 'emberveil', name: 'Emberveil', dot: '#ffb054' },
    { id: 'viridian', name: 'Viridian', dot: '#4dffb0' },
    { id: 'ghostline', name: 'Ghostline', dot: '#dfe7f2' }
  ];
  const DENSITIES = [['compact', 0.9], ['standard', 1], ['expanded', 1.12]];
  const MOTIONS = ['still', 'soft', 'full'];
  const AUDIO_LAYERS = [['master', 'master'], ['ambient', 'ambient bed'], ['ui', 'interface'], ['link', 'link voice']];

  function buildSettings() {
    $('#settings-body').innerHTML = `
      <div class="set-group"><h4>THEME</h4><div class="set-row" id="set-theme">
        ${THEMES.map(t => `<button type="button" class="set-opt" data-v="${t.id}"><span class="theme-dot" style="background:${t.dot}"></span>${t.name}</button>`).join('')}
      </div></div>
      <div class="set-group"><h4>DISPLAY DENSITY</h4><div class="set-row" id="set-density">
        ${DENSITIES.map(([d]) => `<button type="button" class="set-opt" data-v="${d}">${d}</button>`).join('')}
      </div></div>
      <div class="set-group"><h4>MOTION</h4><div class="set-row" id="set-motion">
        ${MOTIONS.map(m => `<button type="button" class="set-opt" data-v="${m}">${m}</button>`).join('')}
      </div></div>
      <div class="set-group"><h4>THE LOOM'S VOICES</h4>
        ${AUDIO_LAYERS.map(([k, label]) => `
          <div class="slider-row"><span>${label}</span>
            <input type="range" min="0" max="100" data-layer="${k}" value="${Math.round(S.prefs.audio[k] * 100)}">
            <output>${Math.round(S.prefs.audio[k] * 100)}</output></div>`).join('')}
      </div>
      <div class="set-group"><h4>MEMORY</h4>
        <button type="button" id="btn-forget">forget this visit — clear kept preferences, history, and read-marks</button>
      </div>`;
    $$('#set-theme .set-opt').forEach(b => b.addEventListener('click', () => { S.prefs.theme = b.dataset.v; applyPrefs(); log(`theme set — ${b.textContent.trim()}`); }));
    $$('#set-density .set-opt').forEach(b => b.addEventListener('click', () => { S.prefs.density = b.dataset.v; applyPrefs(); log(`display density set — ${b.dataset.v}`); }));
    $$('#set-motion .set-opt').forEach(b => b.addEventListener('click', () => { S.prefs.motion = b.dataset.v; applyPrefs(); log(`motion set — ${b.dataset.v}`); }));
    $$('#settings-body input[type="range"]').forEach(r => r.addEventListener('input', () => {
      S.prefs.audio[r.dataset.layer] = r.value / 100;
      r.parentElement.querySelector('output').textContent = r.value;
      applyPrefs(false);
    }));
    $('#btn-forget').addEventListener('click', () => { store.clear(); log('kept memory cleared — the spire will forget this visit on reload', 'warn'); });
  }

  function applyPrefs(save = true) {
    const html = document.documentElement;
    html.dataset.theme = S.prefs.theme;
    html.dataset.density = S.prefs.density;
    html.dataset.motion = S.prefs.motion;
    html.style.setProperty('--den', String(DENSITIES.find(d => d[0] === S.prefs.density)[1]));
    Loom.setLevels(S.prefs.audio);
    $$('#set-theme .set-opt').forEach(b => b.classList.toggle('on', b.dataset.v === S.prefs.theme));
    $$('#set-density .set-opt').forEach(b => b.classList.toggle('on', b.dataset.v === S.prefs.density));
    $$('#set-motion .set-opt').forEach(b => b.classList.toggle('on', b.dataset.v === S.prefs.motion));
    if (S.state === 'active') setRoil(true);
    if (save) store.write(LSK.prefs, S.prefs);
  }

  /* ———— overlays ———— */
  function openOverlay(name) {
    $$('.overlay').forEach(o => { o.hidden = true; });
    $$('#dock button').forEach(b => b.classList.toggle('open', b.dataset.ov === name));
    const ov = $(`#ov-${name}`);
    if (!ov) return;
    ov.hidden = false;
    if (name === 'chart') buildChart();
    if (name === 'journal') { renderJournal(); renderHistory(); }
    Loom.key();
  }
  function closeOverlays() {
    $$('.overlay').forEach(o => { o.hidden = true; });
    $$('#dock button').forEach(b => b.classList.remove('open'));
  }

  /* ———— audio wake (first gesture only) ———— */
  let woke = false;
  function wake() {
    if (woke) return;
    woke = true;
    if (Loom.init()) {
      Loom.setLevels(S.prefs.audio);
      Loom.ambientStart();
      const chip = $('#audio-chip');
      chip.classList.add('on'); chip.textContent = 'loom awake — ambient bed running';
      log('the loom wakes — ambient bed running');
    }
  }

  /* ———— init ———— */
  function init() {
    /* stored state */
    const p = store.read(LSK.prefs, null);
    if (p) { S.prefs = Object.assign(S.prefs, p); S.prefs.audio = Object.assign({ master: 0.8, ambient: 0.5, ui: 0.7, link: 0.8 }, p.audio); }
    (store.read(LSK.seen, [])).forEach(id => S.seen.add(id));
    S.history = (store.read(LSK.history, [])).map(h => ({ ...h, session: 'prior' }));

    buildRing();
    buildDeck();
    buildThreads();
    buildTele();
    buildArchive();
    buildSettings();
    applyPrefs(false);
    fit();
    bg.start();
    renderHistory();

    $('#btn-open').addEventListener('click', openLink);
    $('#btn-close').addEventListener('click', closeLink);
    $('#btn-ward').addEventListener('click', toggleWard);
    $$('#dock button').forEach(b => b.addEventListener('click', () => { wake(); openOverlay(b.dataset.ov); }));
    $('#btn-help').addEventListener('click', () => { wake(); openOverlay('help'); });
    $$('.ov-close').forEach(b => b.addEventListener('click', closeOverlays));
    $$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) closeOverlays(); }));
    document.addEventListener('pointerdown', wake, { once: false });

    setInterval(teleTick, 500);
    teleTick();
    tideLoop();
    setState('idle');
    log('NIGHTGLASS idle — the veil turns, nothing weaves without you');
  }

  /* read-only handle for the verification harness */
  window.__nightglass = {
    get state() { return S.state; },
    get locked() { return S.locked.slice(); },
    get ward() { return S.ward; },
    get dest() { return S.dest ? S.dest.name : null; },
    get journalCount() { return journal.length; },
    get prefs() { return JSON.parse(JSON.stringify(S.prefs)); },
    get historyCount() { return S.history.length; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
