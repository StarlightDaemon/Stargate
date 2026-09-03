/* AUREOLE — Meadowlark Atomic Exposition · Threshold Pavilion
 * Console No. 2. A seven-shell Bohr model is the ring; seating an isotope
 * means hunting for its resonance on the next shell and capturing it. Seven
 * seated shells leave the console ready; only EXCITE opens the threshold.
 * Everything is client-side and fictional. */
(() => {
  'use strict';

  const ISO = window.AUREOLE_ISOTOPES;
  const PRESETS = window.AUREOLE_PRESETS;
  const SHELLS = window.AUREOLE_SHELLS;
  const AUDIO = window.AUREOLE_AUDIO;
  const ISO_BY = Object.fromEntries(ISO.map((i) => [i.id, i]));

  /* Geometry: ring svg is 900×900 at stage (190,70); local centre (450,450) is stage (640,520). */
  const R = [150, 190, 230, 270, 310, 350, 390];
  const LC = 450, CX = 640, CY = 520;
  const N = SHELLS.length;
  const SEAT_ANGLE = (i) => -Math.PI / 2 + i * (2 * Math.PI / N);

  /* Timing (ms). Hand tuning hunts for resonance; a cam runs straight to its stop. */
  const HAND = { hunt: 820, cap: 430 };
  const CAM = { hunt: 250, cap: 240 };
  const CAM_GAP = 90;
  const T_BUILD = 2300, T_BREAK = 700, T_COLLAPSE = 900;

  const $ = (s) => document.querySelector(s);
  const now = () => performance.now();
  const ease = (p) => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const svgNS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(svgNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  /* ---------- State ---------- */
  const S = {
    stage: 'idle',          // idle | pending | buildup | breakthrough | active | collapse
    stageStart: now(),
    locked: [],             // isotope ids, shell K outward
    hunt: null,             // { shell, iso, mode, t0, huntDur, capDur, captured }
    queue: [],              // rapid inputs waiting their turn, validated when they run
    shutter: false,         // lead shutter interlock — released by default
    preset: null,           // { id, i }
    timers: [],
    refuseAt: -1e9,
    scatterAt: -1e9,
    scatterAngles: [],
    pops: [],
    epoch: now(),
    lastT: now(),
    meter: 4,
    destination: null,
    log: []
  };
  const E = SHELLS.map((_, i) => ({
    a: Math.random() * Math.PI * 2,
    w: (0.9 - i * 0.09) * (i % 2 ? -1 : 1)  // rad/s, alternating sense
  }));

  /* ---------- DOM build ---------- */
  const stageEl = $('#stage');
  const shellsG = $('#shells'), trailsG = $('#trails'), elG = $('#electrons'), nucG = $('#nucleus');
  const spikesG = $('#spikes'), popsG = $('#pops'), scatterG = $('#scatter'), huntArc = $('#huntArc');
  const shellEls = [], trailEls = [], elEls = [], seatEls = [], lampEls = [], spikeEls = [], nucEls = [];
  const isoBtns = {}, specLines = {};

  // ring ticks: four Googie starburst clusters on the outer dashed circle
  const ticks = $('#ringSvg .ring-ticks');
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2;
    for (let j = -1; j <= 1; j++) {
      const aa = a + j * 0.06;
      const r0 = 430, r1 = j === 0 ? 452 : 442;
      mk('line', { x1: LC + r0 * Math.cos(aa), y1: LC + r0 * Math.sin(aa), x2: LC + r1 * Math.cos(aa), y2: LC + r1 * Math.sin(aa) }, ticks);
    }
  }
  for (let i = 0; i < N; i++) {
    shellEls.push(mk('circle', { class: 'shell', cx: LC, cy: LC, r: R[i] }, shellsG));
    trailEls.push(mk('path', { class: 'trail', d: '' }, trailsG));
    elEls.push(mk('circle', { class: 'electron', r: 6 }, elG));
    const seat = document.createElement('div');
    seat.className = 'seat'; seat.dataset.shell = SHELLS[i];
    seat.innerHTML = '<span class="sym"></span><span class="shell-letter">' + SHELLS[i] + '</span>';
    $('#seats').appendChild(seat); seatEls.push(seat);
    const lamp = document.createElement('div');
    lamp.className = 'lamp'; lamp.dataset.shell = SHELLS[i];
    lamp.innerHTML = '<div class="lamp-shell">' + SHELLS[i] + '</div><div class="lamp-iso">·</div>';
    $('#lamps').appendChild(lamp); lampEls.push(lamp);
  }
  for (let i = 0; i < 7; i++) nucEls.push(mk('circle', { r: 7, cx: LC, cy: LC, class: i ? 'hidden' : '' }, nucG));
  for (let i = 0; i < 16; i++) spikeEls.push(mk('line', { class: i % 2 ? 'alt' : '', x1: LC, y1: LC, x2: LC, y2: LC, opacity: 0 }, spikesG));
  const scatterEls = [];
  for (let i = 0; i < 14; i++) scatterEls.push(mk('line', { x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0 }, scatterG));

  // spectrograph
  const specBox = $('#specLines');
  for (let nm = 400; nm <= 700; nm += 25) {
    const t = document.createElement('div'); t.className = 'spec-tick';
    t.style.left = ((nm - 400) / 300 * 100) + '%'; specBox.appendChild(t);
  }
  ISO.forEach((iso) => {
    const l = document.createElement('div'); l.className = 'spec-line';
    l.style.left = ((iso.nm - 400) / 300 * 100) + '%';
    l.style.setProperty('--line', nmColor(iso.nm));
    l.dataset.iso = iso.id; specBox.appendChild(l); specLines[iso.id] = l;
  });
  function nmColor(nm) {
    // stylised emission colours: violet → red across the strip
    const stops = [[400, '#8c7bff'], [460, '#4aa8ff'], [500, '#48e3d2'], [550, '#a6ff7a'], [590, '#ffe9b0'], [630, '#ff9c5c'], [700, '#ff5c4b']];
    for (let i = 1; i < stops.length; i++) if (nm <= stops[i][0]) {
      const [n0, c0] = stops[i - 1], [n1, c1] = stops[i]; const p = (nm - n0) / (n1 - n0);
      const h = (c) => [1, 3, 5].map((k) => parseInt(c.substr(k, 2), 16));
      const a = h(c0), b = h(c1);
      return 'rgb(' + a.map((v, k) => Math.round(v + (b[k] - v) * p)).join(',') + ')';
    }
    return '#ff5c4b';
  }

  // isotope starburst
  const board = $('#isoBoard'), spokes = $('#isoSpokes');
  mk('circle', { cx: 200, cy: 200, r: 150 }, spokes);
  ISO.forEach((iso, i) => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / ISO.length);
    const x = 200 + 150 * Math.cos(a), y = 200 + 150 * Math.sin(a);
    mk('line', { x1: 200 + 46 * Math.cos(a), y1: 200 + 46 * Math.sin(a), x2: 200 + 116 * Math.cos(a), y2: 200 + 116 * Math.sin(a) }, spokes);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'iso'; b.dataset.iso = iso.id;
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.innerHTML = '<b>' + iso.id + '</b><small>' + iso.name + '</small>';
    b.title = iso.name + ' · ' + iso.nm + ' nm';
    b.addEventListener('click', () => { AUDIO.unlock(); selectIsotope(iso.id, 'hand'); });
    board.appendChild(b); isoBtns[iso.id] = b;
  });

  // preset cams
  const presetEls = {};
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'preset' + (p.dark ? ' dark' : ''); b.dataset.preset = p.id;
    b.innerHTML = '<span class="p-num">CAM ' + p.id + '</span><span class="p-name">' + p.name + '</span><span class="p-note">' + p.note + '</span>';
    b.addEventListener('click', () => { AUDIO.unlock(); runPreset(p); });
    $('#presets').appendChild(b); presetEls[p.id] = b;
  });

  // meter ticks
  const mt = $('#meter .meter-ticks');
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + i * Math.PI / 10;
    const r0 = i % 5 ? 58 : 54;
    mk('line', { x1: 80 + r0 * Math.cos(a), y1: 84 + r0 * Math.sin(a), x2: 80 + 64 * Math.cos(a), y2: 84 + 64 * Math.sin(a) }, mt);
  }

  /* ---------- Helpers ---------- */
  function later(fn, ms) {
    const id = setTimeout(() => { S.timers = S.timers.filter((t) => t !== id); fn(); }, ms);
    S.timers.push(id); return id;
  }
  function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }
  function setStage(s) {
    S.stage = s; S.stageStart = now(); stageEl.dataset.stage = s; updateStatus();
    render(now()); // rendering chases state; never let the DOM lag a frame behind a state change
  }
  function clockText(t) {
    const base = Date.UTC(1957, 7, 16, 9, 14, 0);
    const d = new Date(base + (t - S.epoch));
    return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()].map((v) => String(v).padStart(2, '0')).join(':');
  }
  function log(msg) {
    S.log.push({ ts: clockText(now()), msg });
    if (S.log.length > 5) S.log.shift();
    $('#log').innerHTML = S.log.map((l) => '<div class="line"><span class="ts">' + l.ts + '</span>' + l.msg + '</div>').join('');
  }
  function findDestination() {
    return PRESETS.find((p) => p.address.join() === S.locked.join()) || null;
  }
  function updateStatus() {
    let text;
    const n = S.locked.length;
    if (S.hunt) text = 'HUNTING RESONANCE · ' + ISO_BY[S.hunt.iso].name.toUpperCase() + ' → SHELL ' + SHELLS[S.hunt.shell];
    else if (S.stage === 'idle') text = n ? 'SEATING · ' + n + ' OF 7 SHELLS' : 'STANDING BY · SEAT SEVEN ISOTOPES';
    else if (S.stage === 'pending') text = 'ADDRESS SEATED · EXCITE TO OPEN';
    else if (S.stage === 'buildup') text = 'EXCITING · SHELLS CONTRACTING';
    else if (S.stage === 'breakthrough') text = 'BREAKTHROUGH';
    else if (S.stage === 'active') text = 'THRESHOLD OPEN · ' + (S.destination ? S.destination.name : 'UNLISTED ADDRESS');
    else if (S.stage === 'collapse') text = 'NO ANSWERING RESONANCE';
    $('#status').textContent = text;
  }
  let warnTimer = null;
  function showWarn(text, blink) {
    const w = $('#warn');
    w.textContent = text; w.className = 'on' + (blink ? ' blink' : '');
    clearTimeout(warnTimer);
    warnTimer = setTimeout(() => {
      if (S.shutter) { w.textContent = 'LEAD SHUTTER ENGAGED · CAPTURE BLOCKED'; w.className = 'on'; }
      else { w.className = ''; }
    }, 1800);
  }
  function refuse(text) {
    S.refuseAt = now();
    showWarn(text, true);
    AUDIO.refuse();
    log('REFUSED — ' + text.toLowerCase());
  }
  function pop(shell, angle) {
    const r = R[shell] * contraction(now());
    S.pops.push({ x: LC + r * Math.cos(angle), y: LC + r * Math.sin(angle), t0: now(), el: mk('path', { d: '' }, popsG) });
  }

  /* ---------- Core: seating an isotope ---------- */
  function selectIsotope(id, mode) {
    if (S.stage !== 'idle') {
      refuse(S.stage === 'pending' ? 'ADDRESS FULL · EXCITE OR DISCHARGE' : 'DISCHARGE BEFORE RESEATING');
      return false;
    }
    if (S.shutter) { refuse('LEAD SHUTTER ENGAGED · CAPTURE BLOCKED'); return false; }
    const pendingIds = S.queue.map((q) => q.id).concat(S.hunt ? [S.hunt.iso] : []);
    if (S.locked.includes(id) || pendingIds.includes(id)) { refuse(ISO_BY[id].name.toUpperCase() + ' ALREADY SEATED'); return false; }
    if (S.locked.length + pendingIds.length >= N) { refuse('ALL SEVEN SHELLS SPOKEN FOR'); return false; }
    if (S.hunt) {
      S.queue.push({ id, mode });
      isoBtns[id].classList.add('queued');
      log('QUEUED ' + id + ' · waiting for shell ' + SHELLS[S.locked.length + S.queue.length]);
      return true;
    }
    startHunt(id, mode);
    return true;
  }
  function startHunt(id, mode) {
    const shell = S.locked.length;
    const T = mode === 'cam' ? CAM : HAND;
    S.hunt = { shell, iso: id, mode, t0: now(), huntDur: T.hunt, capDur: T.cap, captured: false };
    isoBtns[id].classList.remove('queued'); isoBtns[id].classList.add('busy');
    seatEls[shell].classList.add('hunting');
    seatEls[shell].querySelector('.sym').textContent = id;
    if (mode === 'cam') { AUDIO.servo(T.hunt / 1000); log('CAM STOP · shell ' + SHELLS[shell] + ' → ' + ISO_BY[id].name); }
    else { AUDIO.huntStart(ISO_BY[id].tone, T.hunt / 1000); log('HUNTING · shell ' + SHELLS[shell] + ' for ' + ISO_BY[id].name + ' (' + ISO_BY[id].nm + ' nm)'); }
    updateStatus();
    later(capture, T.hunt);
    later(finishLock, T.hunt + T.cap);
  }
  function capture() {
    const h = S.hunt; if (!h) return;
    h.captured = true;
    E[h.shell].a = SEAT_ANGLE(h.shell);
    pop(h.shell, SEAT_ANGLE(h.shell));
    AUDIO.huntStop(); AUDIO.ping(ISO_BY[h.iso].tone);
    specLines[h.iso].classList.add('on');
    lampEls[h.shell].classList.add('lit');
    lampEls[h.shell].querySelector('.lamp-iso').textContent = h.iso;
    seatEls[h.shell].classList.remove('hunting'); seatEls[h.shell].classList.add('locked');
    nucEls[h.shell].classList.remove('hidden');
    S.meter = 100;
  }
  function finishLock() {
    const h = S.hunt; if (!h) return;
    S.locked.push(h.iso);
    isoBtns[h.iso].classList.remove('busy'); isoBtns[h.iso].classList.add('used');
    S.hunt = null;
    render(now());
    log('SEATED · ' + ISO_BY[h.iso].name + ' in shell ' + SHELLS[h.shell] + ' (' + S.locked.length + '/7)');
    if (S.locked.length === N) {
      S.queue.forEach((q) => isoBtns[q.id].classList.remove('queued')); S.queue = [];
      S.preset = null; Object.values(presetEls).forEach((b) => b.classList.remove('running'));
      setStage('pending');
      log('ADDRESS SEATED · console ready — EXCITE to open. Nothing opens by itself.');
      return;
    }
    updateStatus();
    if (S.preset) { later(presetStep, CAM_GAP); return; }
    const next = S.queue.shift();
    if (next) selectIsotope(next.id, next.mode);
  }

  /* ---------- Preset cams ---------- */
  function runPreset(p) {
    if (S.stage !== 'idle' || S.locked.length || S.hunt || S.preset) { refuse('DISCHARGE BEFORE RUNNING A CAM'); return false; }
    if (S.shutter) { refuse('LEAD SHUTTER ENGAGED · CAM HALTED'); return false; }
    S.preset = { id: p.id, i: 0, p };
    presetEls[p.id].classList.add('running');
    log('CAM ' + p.id + ' ENGAGED · ' + p.name + ' — servo running to stops');
    AUDIO.relay();
    presetStep();
    return true;
  }
  function presetStep() {
    const pr = S.preset; if (!pr) return;
    if (S.shutter) {
      S.preset = null; presetEls[pr.id].classList.remove('running');
      refuse('LEAD SHUTTER ENGAGED · CAM HALTED AT SHELL ' + SHELLS[S.locked.length]);
      return;
    }
    const id = pr.p.address[pr.i++];
    if (!id) { S.preset = null; return; }
    selectIsotope(id, 'cam');
  }

  /* ---------- Excite: the only trigger ---------- */
  function excite() {
    if (S.shutter) { refuse('LEAD SHUTTER ENGAGED · EXCITATION BLOCKED'); return false; }
    if (S.stage === 'active') { refuse('THRESHOLD ALREADY OPEN'); return false; }
    if (S.stage !== 'pending') { refuse('NO SEATED ADDRESS · SEAT SEVEN ISOTOPES FIRST'); return false; }
    S.destination = findDestination();
    setStage('buildup');
    AUDIO.buildup(T_BUILD / 1000);
    log('EXCITING · shells contracting toward the nucleus');
    later(() => {
      setStage('breakthrough');
      AUDIO.breakthrough();
      log('BREAKTHROUGH');
      later(() => {
        if (S.destination && S.destination.dark) {
          setStage('collapse'); AUDIO.dark();
          log('NO ANSWERING RESONANCE from ' + S.destination.name + ' — shells falling');
          later(() => { resetShells(); setStage('idle'); log('COLLAPSED · console cleared'); }, T_COLLAPSE);
        } else {
          setStage('active'); AUDIO.humStart();
          log('THRESHOLD OPEN · ' + (S.destination ? S.destination.name : 'unlisted address') + ' answering');
        }
      }, T_BREAK);
    }, T_BUILD);
    return true;
  }

  /* ---------- Discharge: always reachable ---------- */
  function discharge() {
    const had = S.locked.length || S.hunt || S.stage !== 'idle' || S.preset;
    clearTimers();
    AUDIO.huntStop(); AUDIO.humStop();
    S.queue = []; S.preset = null; S.hunt = null;
    Object.values(presetEls).forEach((b) => b.classList.remove('running'));
    if (had) {
      S.scatterAt = now();
      S.scatterAngles = scatterEls.map(() => Math.random() * Math.PI * 2);
      AUDIO.discharge();
    }
    resetShells();
    setStage('idle');
    log(had ? 'DISCHARGED · all shells dropped' : 'DISCHARGE · nothing seated');
    return true;
  }
  function resetShells() {
    S.locked = []; S.hunt = null; S.destination = null; S.meter = 4;
    Object.values(isoBtns).forEach((b) => b.classList.remove('used', 'busy', 'queued'));
    Object.values(specLines).forEach((l) => l.classList.remove('on'));
    seatEls.forEach((s) => { s.classList.remove('hunting', 'locked'); s.querySelector('.sym').textContent = ''; });
    lampEls.forEach((l) => { l.classList.remove('lit'); l.querySelector('.lamp-iso').textContent = '·'; });
    nucEls.forEach((n, i) => { if (i) n.classList.add('hidden'); });
    huntArc.setAttribute('hidden', '');
  }

  /* ---------- Lead shutter interlock ---------- */
  function toggleShutter() {
    S.shutter = !S.shutter;
    const sw = $('#shutter'), st = $('#shutterState'), w = $('#warn');
    sw.setAttribute('aria-checked', String(S.shutter));
    st.textContent = S.shutter ? 'ENGAGED' : 'RELEASED';
    st.classList.toggle('engaged', S.shutter);
    AUDIO.relay();
    if (S.shutter) {
      S.queue.forEach((q) => isoBtns[q.id].classList.remove('queued')); S.queue = [];
      if (S.preset) { presetEls[S.preset.id].classList.remove('running'); S.preset = null; log('CAM HALTED by lead shutter'); }
      w.textContent = 'LEAD SHUTTER ENGAGED · CAPTURE BLOCKED'; w.className = 'on';
      log('LEAD SHUTTER ENGAGED · captures and excitation blocked');
    } else {
      w.className = '';
      log('LEAD SHUTTER RELEASED');
    }
  }

  /* ---------- Render ---------- */
  const cv = $('#aperture'), ctx = cv.getContext('2d');
  function contraction(t) {
    const el = t - S.stageStart;
    switch (S.stage) {
      case 'buildup': return 1 - 0.42 * ease(clamp01(el / T_BUILD));
      case 'breakthrough': return 0.58 + 0.48 * easeOut(clamp01(el / T_BREAK));
      case 'active': return 1 + 0.03 * Math.sin(t / 600);
      case 'collapse': return 0.58 + 0.42 * easeOut(clamp01(el / T_COLLAPSE));
      default: return 1;
    }
  }
  function speedMult(i, t) {
    const el = t - S.stageStart;
    if (S.stage === 'buildup') return 1 + 9 * Math.pow(clamp01(el / T_BUILD), 2);
    if (S.stage === 'breakthrough') return 6;
    if (S.stage === 'active') return 3;
    if (S.stage === 'collapse') return 2 * (1 - clamp01(el / T_COLLAPSE));
    if (S.hunt && S.hunt.shell === i) return S.hunt.captured ? 2 : 5;
    return i < S.locked.length ? 1.6 : 1;
  }
  let renderBusy = false;
  function render(t) {
    if (renderBusy) return; renderBusy = true;
    const dt = Math.min(0.05, (t - S.lastT) / 1000); S.lastT = t;
    const c = contraction(t), el = t - S.stageStart;
    const refusing = t - S.refuseAt < 500;
    const hunting = S.hunt;

    for (let i = 0; i < N; i++) {
      const locked = i < S.locked.length;
      const isHunt = hunting && hunting.shell === i;
      E[i].a += E[i].w * speedMult(i, t) * dt;
      let r = R[i] * c;
      if (isHunt && !hunting.captured) r += 8 * Math.sin(t / 18);
      const sh = shellEls[i];
      sh.setAttribute('r', r.toFixed(2));
      sh.setAttribute('class', 'shell' + (locked ? ' locked' : '') + (isHunt ? ' hunting' : '') + (refusing ? ' refuse' : ''));
      const a = E[i].a;
      const ex = LC + r * Math.cos(a), ey = LC + r * Math.sin(a);
      const e = elEls[i];
      e.setAttribute('cx', ex.toFixed(2)); e.setAttribute('cy', ey.toFixed(2));
      e.setAttribute('r', locked || isHunt ? 7 : 5);
      e.setAttribute('class', 'electron' + (locked ? ' locked' : '') + (isHunt ? ' hunting' : ''));
      const span = (locked ? 0.6 : 0.28) * (S.stage === 'active' ? 1.6 : 1) * (isHunt ? 1.8 : 1);
      const sgn = E[i].w > 0 ? 1 : -1;
      const a0 = a - sgn * span;
      trailEls[i].setAttribute('d', 'M' + (LC + r * Math.cos(a0)).toFixed(1) + ' ' + (LC + r * Math.sin(a0)).toFixed(1) + ' A' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 0 ' + (sgn > 0 ? 1 : 0) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1));
      trailEls[i].setAttribute('class', 'trail' + (locked ? ' locked' : ''));
      // seat tile follows the shell's contraction
      const sa = SEAT_ANGLE(i);
      seatEls[i].style.transform = 'translate(' + (CX + R[i] * c * Math.cos(sa)).toFixed(1) + 'px,' + (CY + R[i] * c * Math.sin(sa)).toFixed(1) + 'px)';
    }
    // resonance hunt arc sweeps ahead of the hunting electron
    if (hunting && !hunting.captured) {
      const i = hunting.shell, r = R[i] * c, a = E[i].a, sgn = E[i].w > 0 ? 1 : -1;
      const p = clamp01((t - hunting.t0) / hunting.huntDur);
      const sweep = 0.4 + 1.6 * p;
      const a1 = a + sgn * sweep;
      huntArc.setAttribute('d', 'M' + (LC + r * Math.cos(a)).toFixed(1) + ' ' + (LC + r * Math.sin(a)).toFixed(1) + ' A' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 ' + (sweep > Math.PI ? 1 : 0) + ' ' + (sgn > 0 ? 1 : 0) + ' ' + (LC + r * Math.cos(a1)).toFixed(1) + ' ' + (LC + r * Math.sin(a1)).toFixed(1));
      huntArc.removeAttribute('hidden');
    } else huntArc.setAttribute('hidden', '');

    // nucleus: one dot per captured shell, packed around the centre
    const nCount = S.locked.length + (hunting && hunting.captured ? 1 : 0);
    const nScale = S.stage === 'buildup' ? 1 + 1.2 * clamp01(el / T_BUILD) : S.stage === 'active' ? 1.4 : 1;
    for (let i = 0; i < 7; i++) {
      const n = nucEls[i];
      if (i === 0) { n.setAttribute('r', (7 * nScale).toFixed(1)); n.setAttribute('class', nCount ? '' : 'dim'); continue; }
      if (i >= Math.max(1, nCount)) continue;
      const a = -Math.PI / 2 + (i - 1) * Math.PI / 3 + t / 2500;
      n.setAttribute('cx', (LC + 14 * nScale * Math.cos(a)).toFixed(1)); n.setAttribute('cy', (LC + 14 * nScale * Math.sin(a)).toFixed(1));
      n.setAttribute('r', (6 * nScale).toFixed(1));
    }

    // starburst spikes: shoot out at breakthrough, linger as a slow halo while open
    let spikeLen = 0, spikeOp = 0, spikeRot = 0;
    if (S.stage === 'breakthrough') { const p = clamp01(el / T_BREAK); spikeLen = easeOut(p); spikeOp = 1 - p * 0.4; }
    else if (S.stage === 'active') { spikeLen = 0.3; spikeOp = 0.7; spikeRot = t / 40; }
    else if (S.stage === 'collapse') { const p = clamp01(el / T_COLLAPSE); spikeLen = 0.5 * (1 - p); spikeOp = 0.6 * (1 - p); }
    for (let i = 0; i < 16; i++) {
      const s = spikeEls[i];
      if (!spikeLen) { s.setAttribute('opacity', 0); continue; }
      const a = (i / 16) * Math.PI * 2 + spikeRot * Math.PI / 180;
      const inner = R[6] * c + 16;
      const len = (i % 2 ? 90 : 150) * spikeLen * (S.stage === 'active' ? 1 + 0.15 * Math.sin(t / 300 + i) : 1);
      s.setAttribute('x1', (LC + inner * Math.cos(a)).toFixed(1)); s.setAttribute('y1', (LC + inner * Math.sin(a)).toFixed(1));
      s.setAttribute('x2', (LC + (inner + len) * Math.cos(a)).toFixed(1)); s.setAttribute('y2', (LC + (inner + len) * Math.sin(a)).toFixed(1));
      s.setAttribute('opacity', spikeOp.toFixed(2));
    }

    // capture pops: a small starburst that expands and fades
    S.pops = S.pops.filter((p) => {
      const q = (t - p.t0) / 520;
      if (q >= 1) { p.el.remove(); return false; }
      const rr = 6 + 40 * easeOut(q); let d = '';
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; d += 'M' + (p.x + rr * 0.35 * Math.cos(a)).toFixed(1) + ' ' + (p.y + rr * 0.35 * Math.sin(a)).toFixed(1) + 'L' + (p.x + rr * Math.cos(a)).toFixed(1) + ' ' + (p.y + rr * Math.sin(a)).toFixed(1); }
      p.el.setAttribute('d', d); p.el.setAttribute('opacity', (1 - q).toFixed(2));
      return true;
    });
    // discharge scatter: sparks flung outward
    const sq = (t - S.scatterAt) / 650;
    scatterEls.forEach((s, i) => {
      if (sq >= 1 || sq < 0) { s.setAttribute('opacity', 0); return; }
      const a = S.scatterAngles[i] || 0, r0 = 160 + 340 * easeOut(sq);
      s.setAttribute('x1', (LC + r0 * Math.cos(a)).toFixed(1)); s.setAttribute('y1', (LC + r0 * Math.sin(a)).toFixed(1));
      s.setAttribute('x2', (LC + (r0 + 26) * Math.cos(a)).toFixed(1)); s.setAttribute('y2', (LC + (r0 + 26) * Math.sin(a)).toFixed(1));
      s.setAttribute('opacity', (1 - sq).toFixed(2));
    });

    drawAperture(t, el);

    // resonance meter
    let target;
    if (hunting) target = hunting.captured ? 100 : 8 + 88 * clamp01((t - hunting.t0) / hunting.huntDur) + 6 * Math.sin(t / 30);
    else if (S.stage === 'buildup') target = 40 + 60 * clamp01(el / T_BUILD);
    else if (S.stage === 'breakthrough') target = 100;
    else if (S.stage === 'active') target = 86 + 4 * Math.sin(t / 220);
    else if (S.stage === 'pending') target = 22 + 3 * Math.sin(t / 400);
    else target = 4 + 2 * Math.sin(t / 700) + (Math.random() - 0.5) * 2;
    S.meter += (target - S.meter) * Math.min(1, dt * 9);
    $('#needle').style.transform = 'rotate(' + (-80 + 160 * S.meter / 100).toFixed(1) + 'deg)';

    // countdown and telemetry
    const cd = $('#countdown');
    if (S.stage === 'buildup') cd.textContent = 'T−' + Math.max(0, (T_BUILD - el) / 1000).toFixed(1);
    else if (S.stage === 'breakthrough') cd.textContent = 'T−0.0';
    else if (S.stage === 'active') cd.textContent = 'OPEN';
    else if (S.stage === 'pending') cd.textContent = 'READY';
    else if (S.stage === 'collapse') cd.textContent = 'ABORT';
    else cd.textContent = '— —';
    $('#clock').textContent = clockText(t);
    const cyc = Math.floor(((t - S.epoch) * 9192631.77) % 1e9);
    $('#cycles').textContent = String(cyc).padStart(9, '0').replace(/(\d{3})(?=\d)/g, '$1 ');
    const ev = S.locked.length * 137 + (S.stage === 'active' ? 1370 + 40 * Math.sin(t / 500) : S.stage === 'buildup' ? 1370 * clamp01(el / T_BUILD) : S.stage === 'breakthrough' ? 2400 : 0);
    $('#energy').textContent = Math.round(ev) + ' eV';
    const fx = S.stage === 'active' ? 3.2 + 0.4 * Math.sin(t / 700) : S.stage === 'buildup' ? 3.2 * clamp01(el / T_BUILD) : S.stage === 'breakthrough' ? 9.9 : S.stage === 'pending' ? 0.4 : 0;
    $('#flux').textContent = fx.toFixed(2) + ' Mc';
    renderBusy = false;
  }

  function drawAperture(t, el) {
    const W = 340, c = 170;
    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.beginPath(); ctx.arc(c, c, 150, 0, Math.PI * 2); ctx.clip();
    if (S.stage === 'idle' || S.stage === 'pending') {
      ctx.fillStyle = 'rgba(72,227,210,0.035)'; ctx.fillRect(0, 0, W, W);
      if (S.stage === 'pending') {
        const g = ctx.createRadialGradient(c, c, 0, c, c, 150);
        g.addColorStop(0, 'rgba(255,233,176,' + (0.10 + 0.06 * Math.sin(t / 300)).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,233,176,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
        ctx.strokeStyle = 'rgba(255,233,176,' + (0.25 + 0.15 * Math.sin(t / 300)).toFixed(3) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c, c, 144, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (S.stage === 'buildup') {
      const p = clamp01(el / T_BUILD), flick = 0.85 + 0.15 * Math.sin(t / 23);
      const rad = 20 + 130 * p;
      const g = ctx.createRadialGradient(c, c, 0, c, c, rad);
      g.addColorStop(0, 'rgba(255,233,176,' + ((0.2 + 0.8 * p) * flick).toFixed(3) + ')');
      g.addColorStop(0.4, 'rgba(72,227,210,' + (0.55 * p).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(72,227,210,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const u = 1 - ((t / 700 + k / 3) % 1);
        ctx.strokeStyle = 'rgba(72,227,210,' + (0.6 * (1 - u)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(c, c, 150 * u, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (S.stage === 'breakthrough') {
      const p = clamp01(el / T_BREAK);
      ctx.fillStyle = 'rgba(255,240,205,' + (1 - 0.3 * p).toFixed(3) + ')'; ctx.fillRect(0, 0, W, W);
      const g = ctx.createRadialGradient(c, c, 0, c, c, 150);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,' + (0.6 * (1 - p)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(72,227,210,' + (0.5 * p).toFixed(3) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      ctx.strokeStyle = 'rgba(255,125,92,' + (0.9 * (1 - p)).toFixed(3) + ')'; ctx.lineWidth = 3;
      for (let k = 0; k < 24; k++) {
        const a = k * Math.PI / 12 + p * 0.3;
        ctx.beginPath(); ctx.moveTo(c + 20 * Math.cos(a), c + 20 * Math.sin(a)); ctx.lineTo(c + 150 * Math.cos(a), c + 150 * Math.sin(a)); ctx.stroke();
      }
    } else if (S.stage === 'active') {
      const rot = t / 2000;
      const g = ctx.createConicGradient ? ctx.createConicGradient(rot, c, c) : null;
      if (g) {
        const stops = ['#48e3d2', '#c8fff3', '#ff7d5c', '#ffe9b0', '#48e3d2', '#ff7d5c', '#c8fff3', '#48e3d2'];
        stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
        ctx.fillStyle = g;
      } else ctx.fillStyle = '#48e3d2';
      ctx.fillRect(0, 0, W, W);
      const v = ctx.createRadialGradient(c, c, 30, c, c, 150);
      v.addColorStop(0, 'rgba(255,255,255,' + (0.35 + 0.1 * Math.sin(t / 500)).toFixed(3) + ')');
      v.addColorStop(0.55, 'rgba(13,27,38,0.05)'); v.addColorStop(1, 'rgba(13,27,38,0.55)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, W);
      ctx.fillStyle = '#fff7dd';
      for (let i = 0; i < 28; i++) {
        const ph = i / 28, u = ((t / 2600) + ph * 1.7) % 1;
        const r = u * 150, a = ph * Math.PI * 2 + u * 2.2 + t / 3000;
        ctx.globalAlpha = 1 - u;
        ctx.beginPath(); ctx.arc(c + r * Math.cos(a), c + r * Math.sin(a), 2.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (S.stage === 'collapse') {
      const p = clamp01(el / T_COLLAPSE);
      ctx.fillStyle = 'rgba(168,69,44,' + (0.6 * (1 - p)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, W);
      const g = ctx.createRadialGradient(c, c, 0, c, c, 150 * (1 - p) + 1);
      g.addColorStop(0, 'rgba(255,125,92,' + (0.8 * (1 - p)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,125,92,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
    }
    ctx.restore();
  }

  function frame() { render(now()); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  setInterval(() => render(now()), 120); // backstop when rAF is starved

  /* ---------- Viewport fit: bare ratio, computed in JS ---------- */
  function fit() {
    const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    if (!(k > 0)) { setTimeout(fit, 100); return; }
    document.documentElement.style.setProperty('--fit', String(k));
  }
  fit(); window.addEventListener('resize', fit);

  /* ---------- Controls ---------- */
  $('#excite').addEventListener('click', () => { AUDIO.unlock(); excite(); });
  $('#discharge').addEventListener('click', () => { AUDIO.unlock(); discharge(); });
  $('#shutter').addEventListener('click', () => { AUDIO.unlock(); toggleShutter(); });
  const guide = $('#guide');
  const toggleGuide = (open) => { guide.hidden = open === undefined ? !guide.hidden : !open; };
  $('#guideBtn').addEventListener('click', () => toggleGuide());
  $('#guideClose').addEventListener('click', () => toggleGuide(false));
  guide.addEventListener('click', (e) => { if (e.target === guide) toggleGuide(false); });
  const soundBtn = $('#soundBtn');
  soundBtn.addEventListener('click', () => {
    AUDIO.unlock();
    const m = !AUDIO.isMuted(); AUDIO.setMuted(m);
    soundBtn.setAttribute('aria-pressed', String(!m)); soundBtn.textContent = m ? 'SOUND OFF' : 'SOUND ON';
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === '?') toggleGuide();
    else if (e.key === 'Escape') toggleGuide(false);
  });
  window.addEventListener('pointerdown', () => AUDIO.unlock(), { once: false });

  log('CONSOLE NO. 2 ENERGIZED · Meadowlark Atomic Exposition');
  log('Lead shutter released · seat seven isotopes to compose an address');
  updateStatus();

  /* ---------- Test hook ---------- */
  window.__aureole = {
    state() {
      return {
        stage: S.stage,
        stageElapsed: Math.round(now() - S.stageStart),
        locked: S.locked.slice(),
        hunting: S.hunt ? { shell: SHELLS[S.hunt.shell], iso: S.hunt.iso, mode: S.hunt.mode, captured: S.hunt.captured } : null,
        queue: S.queue.map((q) => q.id),
        shutter: S.shutter,
        preset: S.preset ? S.preset.id : null,
        destination: S.destination ? S.destination.name : null,
        lampsLit: lampEls.filter((l) => l.classList.contains('lit')).length,
        specLines: Object.values(specLines).filter((l) => l.classList.contains('on')).length,
        warn: $('#warn').className,
        warnText: $('#warn').textContent,
        status: $('#status').textContent,
        fit: getComputedStyle(document.documentElement).getPropertyValue('--fit').trim(),
        lastLog: S.log.length ? S.log[S.log.length - 1].msg : ''
      };
    },
    shellRadius(i) { return parseFloat(shellEls[i].getAttribute('r')); }
  };
})();
