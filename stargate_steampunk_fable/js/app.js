// PERPETUA — app.js
// The Aldercroft Concordance Engine. Single-page decorative fiction.
// All rendering is flat schematic line-work; rotation and glow carry the
// mechanism — never simulated material surfaces.
'use strict';

(() => {
  const { INDICES, ADDRESS_LEN, COLUMNS, RACK, ARCHIVE } = window.PDATA;
  const VERSION = '1.0.0';
  const LS_KEY = 'perpetua.v1';

  // stage timings (ms)
  const T_BUILDUP = 2400;
  const T_BREAKTHROUGH = 950;
  const T_FEED = 380;          // manual card feed cadence
  const T_RACK_FEED = 430;     // governor-speed replay cadence per card

  const $ = (sel) => document.querySelector(sel);
  const C = 420;               // wheel svg center
  const SVGNS = 'http://www.w3.org/2000/svg';

  // ------------------------------------------------------------------ state
  const S = {
    state: 'idle',             // idle | dialing | pending | buildup | breakthrough | active
    locked: [],                // index ids in feed order
    feeding: false,
    feedQueue: [],
    autodial: null,            // { timers: [], folio }
    hold: false,               // proving hold — DEFAULT RELEASED
    residual: 847,
    stageT: {},                // state -> performance.now()
    tele: { P: 58, T: 4, C: 3, draw: 0.25, eng: 0.15 },
    history: [],
    log: [],
    dialHistory: [],
    viewed: new Set(),
    settings: {
      theme: 'draught', density: 'comfortable', motion: 'full',
      master: 0.8, ambient: 0.6, mechanism: 0.8, bell: 0.9
    }
  };

  // ------------------------------------------------------------ persistence
  function saveLS() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        settings: S.settings,
        dialHistory: S.dialHistory.slice(-40),
        viewed: [...S.viewed]
      }));
    } catch (e) {}
  }
  function loadLS() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.settings) Object.assign(S.settings, d.settings);
      if (Array.isArray(d.dialHistory)) S.dialHistory = d.dialHistory;
      if (Array.isArray(d.viewed)) S.viewed = new Set(d.viewed);
    } catch (e) {}
  }

  // -------------------------------------------------------------- day-book
  function log(kind, text) {
    const t = new Date();
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    const ss = String(t.getSeconds()).padStart(2, '0');
    S.log.push({ time: `${hh}:${mm}:${ss}`, kind, text });
    if (S.log.length > 400) S.log.shift();
    if (currentModal === 'log') renderLogModal();
  }

  // ---------------------------------------------------------------- audio
  let audioArmed = false;
  function armAudio() {
    if (audioArmed) return;
    audioArmed = true;
    if (PAUDIO.init()) {
      PAUDIO.setLevels(S.settings);
      PAUDIO.startAmbient();
    }
  }
  document.addEventListener('pointerdown', armAudio, { capture: true });

  // ================================================================== FIG.1
  // The Store wheel: 8 coordinate value-wheel rings + carriage-check band +
  // residual, around the Aperture frame. Pure line-work; rotation is real.
  const rings = [];  // { g, angle, target, spin, lockedGlyph }
  let apertureG, apIdle, apBuild, apBurst, apActive, residualText, checkG;
  let apBuildCam, apBuildDisc, apFlash;

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function buildWheel() {
    const svg = el('svg', { viewBox: '0 0 840 840' });
    $('#wheel-mount').appendChild(svg);

    // outer rules + tooth ticks (the great wheel's gear rim, drawn as a diagram)
    el('circle', { cx: C, cy: C, r: 352, class: 'rw-rule' }, svg);
    el('circle', { cx: C, cy: C, r: 344, class: 'rw-faint' }, svg);
    const teeth = el('g', {}, svg);
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const x1 = C + Math.cos(a) * 344, y1 = C + Math.sin(a) * 344;
      const x2 = C + Math.cos(a) * 352, y2 = C + Math.sin(a) * 352;
      el('line', { x1, y1, x2, y2, class: 'rw-faint' }, teeth);
    }

    // eight coordinate rings
    for (let i = 0; i < ADDRESS_LEN; i++) {
      const rOuter = 338 - i * 21;
      const rMid = rOuter - 9;
      const g = el('g', { class: 'rw-ring', 'data-ring': i }, svg);
      el('circle', { cx: C, cy: C, r: rOuter, class: 'rw-band', 'data-band': i }, g);
      const rot = el('g', { class: 'rw-rot' }, g);
      for (let k = 0; k < INDICES.length; k++) {
        const a = -Math.PI / 2 + (k / INDICES.length) * Math.PI * 2;
        const gx = C + Math.cos(a) * rMid, gy = C + Math.sin(a) * rMid;
        const sc = 0.62 - i * 0.028;
        const gg = el('g', {
          class: 'rw-slot', 'data-k': k,
          transform: `translate(${gx} ${gy}) rotate(${(a * 180 / Math.PI) + 90}) scale(${sc}) translate(-12 -12)`
        }, rot);
        el('path', { d: INDICES[k].glyph, class: 'rw-glyph' }, gg);
      }
      rings.push({ g, rot, angle: 0, target: 0, home: 0, lockedK: -1, drift: (i % 2 ? 1 : -1) * (0.25 + i * 0.05) });
    }

    // carriage-check band (8 stations that fill as wheels lock)
    checkG = el('g', {}, svg);
    el('circle', { cx: C, cy: C, r: 158, class: 'rw-check' }, svg);
    for (let i = 0; i < ADDRESS_LEN; i++) {
      const a = -Math.PI / 2 + (i / ADDRESS_LEN) * Math.PI * 2;
      const x = C + Math.cos(a) * 148, y = C + Math.sin(a) * 148;
      el('circle', { cx: x, cy: y, r: 5, class: 'rw-check', 'data-chk': i }, checkG);
    }

    // reading index line (top), the instrument's datum
    el('line', { x1: C, y1: C - 366, x2: C, y2: C - 140, class: 'rw-index-line', 'stroke-width': 2 }, svg);
    el('path', { d: `M${C - 6} ${C - 146} L${C} ${C - 134} L${C + 6} ${C - 146}`, class: 'rw-index-line', fill: 'none', 'stroke-width': 2 }, svg);
    el('text', { x: C + 10, y: C - 350, class: 'rw-index-text' }, svg).textContent = 'READING INDEX';

    // residual readout, beneath the index arrow
    residualText = el('text', { x: C, y: C - 108, class: 'rw-residual-text' }, svg);
    residualText.textContent = 'R·0847';

    // the Aperture frame
    apertureG = el('g', {}, svg);
    el('circle', { cx: C, cy: C, r: 96, class: 'rw-rule', 'stroke-dasharray': '5 5' }, apertureG);
    apIdle = el('g', { id: 'aperture-idle' }, apertureG);
    el('line', { x1: C - 78, y1: C, x2: C + 78, y2: C }, apIdle);
    el('line', { x1: C, y1: C - 78, x2: C, y2: C + 78 }, apIdle);
    el('circle', { cx: C, cy: C, r: 26 }, apIdle);
    apBuild = el('g', { id: 'aperture-build', display: 'none' }, apertureG);
    apBuildDisc = el('circle', { cx: C, cy: C, r: 86, class: 'ap-build-disc', opacity: 0 }, apBuild);
    apBuildCam = el('g', {}, apBuild);
    el('circle', { cx: C, cy: C, r: 64, class: 'ap-build-cam', 'stroke-dasharray': '18 9' }, apBuildCam);
    el('circle', { cx: C, cy: C, r: 40, class: 'ap-build-cam', 'stroke-dasharray': '6 10' }, apBuildCam);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      el('line', {
        x1: C + Math.cos(a) * 14, y1: C + Math.sin(a) * 14,
        x2: C + Math.cos(a) * 62, y2: C + Math.sin(a) * 62, class: 'ap-build-cam'
      }, apBuildCam);
    }
    apBurst = el('g', { id: 'aperture-burst', display: 'none' }, apertureG);
    apFlash = el('circle', { cx: C, cy: C, r: 88, class: 'ap-flash' }, apBurst);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      el('line', {
        x1: C + Math.cos(a) * 10, y1: C + Math.sin(a) * 10,
        x2: C + Math.cos(a) * 90, y2: C + Math.sin(a) * 90,
        class: 'ap-burst', 'data-burst': i
      }, apBurst);
    }
    apActive = el('g', { id: 'aperture-active', display: 'none' }, apertureG);
    el('circle', { cx: C, cy: C, r: 88, class: 'ap-open-disc' }, apActive);
    for (let i = 0; i < 3; i++) {
      el('circle', { cx: C, cy: C, r: 30 + i * 24, class: 'ap-shimmer', 'stroke-dasharray': '10 14', 'data-shim': i }, apActive);
    }
    el('circle', { cx: C, cy: C, r: 90, class: 'ap-veil', 'stroke-width': 2 }, apActive);

    // patent-sheet callouts with leader lines
    const annos = [
      { x: 32, y: 60, tx: 150, ty: 190, label: 'MAIN SHAFT — 40:1' },
      { x: 566, y: 46, tx: 600, ty: 170, label: 'VALUE-WHEEL RINGS, I–VIII' },
      { x: 30, y: 806, tx: 210, ty: 660, label: 'ANTICIPATING CARRIAGE' },
      { x: 640, y: 812, tx: 545, ty: 560, label: 'APERTURE FRAME' }
    ];
    for (const a of annos) {
      el('line', { x1: a.x + 4, y1: a.y + (a.y < C ? 8 : -12), x2: a.tx, y2: a.ty, class: 'rw-anno-line', 'stroke-dasharray': '3 4' }, svg);
      el('circle', { cx: a.tx, cy: a.ty, r: 2.5, class: 'rw-anno-line', fill: 'currentColor' }, svg);
      el('text', { x: a.x, y: a.y, class: 'rw-anno' }, svg).textContent = a.label;
    }
    el('text', { x: 30, y: 96, class: 'rw-anno' }, svg).textContent = 'RATIO OF PROOF 1:1';
  }

  // ring animation
  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    const motion = S.settings.motion === 'full';

    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      if (r.lockedK < 0 && (S.state === 'idle' || S.state === 'dialing') && motion) {
        r.target += r.drift * dt * 4;   // unlocked wheels wander gently
      }
      if (S.state === 'buildup' && motion) {
        r.target += (40 + i * 14) * dt; // mill run-up turns the whole store
      }
      const diff = r.target - r.angle;
      r.angle += Math.abs(diff) < 0.01 ? diff : diff * Math.min(1, dt * 6.5);
      r.rot.setAttribute('transform', `rotate(${r.angle} ${C} ${C})`);
    }

    // aperture animations
    if (S.state === 'buildup') {
      const p = Math.min(1, (now - S.stageT.buildup) / T_BUILDUP);
      apBuildDisc.setAttribute('opacity', String(0.30 * p * p));
      const camA = ((now - S.stageT.buildup) / 1000) * (60 + 300 * p);
      apBuildCam.setAttribute('transform', `rotate(${camA} ${C} ${C})`);
    } else if (S.state === 'breakthrough') {
      const t = (now - S.stageT.breakthrough) / T_BREAKTHROUGH;
      apFlash.setAttribute('opacity', String(Math.max(0.15, 0.6 * (1 - t * 0.6))));
      apBurst.querySelectorAll('line').forEach((ln, i) => {
        const ph = Math.min(1, Math.max(0, t * 1.4 - (i % 6) * 0.05));
        const a = (i / 24) * Math.PI * 2;
        ln.setAttribute('x2', C + Math.cos(a) * (10 + 80 * ph));
        ln.setAttribute('y2', C + Math.sin(a) * (10 + 80 * ph));
        ln.setAttribute('opacity', String(1 - t * 0.3));
      });
    } else if (S.state === 'active' && motion) {
      const t = now / 1000;
      apActive.querySelectorAll('.ap-shimmer').forEach((c, i) => {
        c.setAttribute('stroke-dashoffset', String((t * (8 + i * 5)) % 100 * (i % 2 ? -1 : 1)));
        c.setAttribute('r', String(30 + i * 24 + Math.sin(t * 1.3 + i) * 2.5));
      });
    }
    requestAnimationFrame(frame);
  }

  // ============================================================ card train
  function buildTray() {
    const tray = $('#index-tray');
    for (const idx of INDICES) {
      const b = document.createElement('button');
      b.className = 'index-card';
      b.dataset.index = idx.id;
      b.innerHTML =
        `<svg class="ic-glyph" viewBox="0 0 24 24"><path d="${idx.glyph}"/></svg>` +
        `<span class="ic-name">${idx.id}</span>` +
        `<span class="ic-holes">${holePattern(idx.n)}</span>`;
      b.addEventListener('click', () => requestFeed(idx.id, 'hand'));
      tray.appendChild(b);
    }
  }
  function holePattern(n) {
    let h = '';
    for (let bit = 0; bit < 5; bit++) h += `<i class="${(n >> bit) & 1 ? 'p' : ''}"></i>`;
    return h;
  }

  function buildRack() {
    const rack = $('#folio-rack');
    for (const f of RACK) {
      const b = document.createElement('button');
      b.className = 'rack-row';
      b.dataset.folio = f.folio;
      b.innerHTML =
        `<span class="rk-folio">${f.folio}</span>` +
        `<span class="rk-name">${f.name}</span>` +
        `<span class="rk-tier ${f.tier}">${f.tier.toUpperCase()}</span>`;
      b.title = f.note;
      b.addEventListener('click', () => startAutodial(f));
      rack.appendChild(b);
    }
    const note = document.createElement('p');
    note.className = 'rack-note';
    note.textContent = 'A racked folio is re-fed by the mechanism at governor speed — every card still reads in order, and the mill still waits for your hand.';
    rack.appendChild(note);
  }

  // queue-through feeding: clicks during a feed are queued, never dropped
  function requestFeed(id, source) {
    if (S.autodial && source === 'hand') { log('CARD', `${id} refused — rack replay in progress.`); return; }
    if (!['idle', 'dialing'].includes(S.state)) { log('CARD', `${id} refused — engine not setting.`); return; }
    if (S.locked.includes(id)) return;
    if (S.locked.length + S.feedQueue.length >= ADDRESS_LEN) return;
    if (S.feedQueue.includes(id)) return;
    S.feedQueue.push(id);
    if (!S.feeding) processFeedQueue(source);
  }
  function processFeedQueue(source) {
    if (!S.feedQueue.length) { S.feeding = false; return; }
    S.feeding = true;
    const id = S.feedQueue.shift();
    feedCard(id, source, () => processFeedQueue(source));
  }

  function feedCard(id, source, done) {
    const idx = INDICES.find(x => x.id === id);
    const col = S.locked.length;                 // 0-based column this card sets
    if (S.state === 'idle') setState('dialing');

    // reader animation: the card drops through the slot
    const cardEl = $('#reader-card');
    cardEl.innerHTML =
      `<svg viewBox="0 0 100 60">` +
      `<rect x="2" y="2" width="96" height="56" class="rc-frame"/>` +
      `<path d="M2 2 L14 2 L2 14 Z" class="rc-frame" fill="none"/>` +
      Array.from({ length: 5 }, (_, b) =>
        `<rect x="${12 + b * 16}" y="44" width="8" height="10" class="rc-hole ${(idx.n >> b) & 1 ? 'p' : ''}"/>`).join('') +
      `<g transform="translate(38 8) scale(1.1)"><path d="${idx.glyph}" class="rc-glyph"/></g>` +
      `</svg>`;
    cardEl.classList.remove('feed');
    void cardEl.offsetWidth;                      // restart transition
    cardEl.classList.add('feed');
    $('#reader-note').textContent = `READING ${id} — CARD ${col + 1} OF ${ADDRESS_LEN}`;
    const trayCard = document.querySelector(`.index-card[data-index="${id}"]`);
    if (trayCard) trayCard.classList.add('feeding');
    PAUDIO.cardClack();

    setTimeout(() => {
      // the value-wheel ring advances and locks
      S.locked.push(id);
      const ring = rings[col];
      const k = INDICES.indexOf(idx);
      ring.lockedK = k;
      ring.target = -(k * (360 / INDICES.length)) - 360;   // one full turn, then present the index
      ring.g.classList.add('locked');
      ring.g.querySelector(`circle[data-band="${col}"]`).classList.add('locked');
      const slot = ring.rot.querySelector(`.rw-slot[data-k="${k}"] .rw-glyph`);
      if (slot) slot.classList.add('at-index');
      const chk = checkG.querySelector(`circle[data-chk="${col}"]`);
      if (chk) { chk.setAttribute('fill', 'currentColor'); chk.classList.add('rw-check-on'); }
      PAUDIO.ratchet(5 + col, 0.34);
      if (trayCard) { trayCard.classList.remove('feeding'); trayCard.classList.add('spent'); }
      updateRegister();
      if (S.state === 'dialing') {
        $('#annunciator').textContent = `${ANNUN.dialing} — ${S.locked.length} OF ${ADDRESS_LEN}`;
      }
      log('CARD', `${id} read ${source === 'rack' ? 'at governor speed' : 'by hand'} — wheel ${roman(col + 1)} locked.`);

      if (S.locked.length >= ADDRESS_LEN) {
        setState('pending');                       // NEVER auto-fires
        $('#reader-note').textContent = 'TRAIN COMPLETE — READER AT REST';
        log('TRAIN', `Train of ${ADDRESS_LEN} set${S.autodial ? ` from folio ${S.autodial.folio}` : ' by hand'}. Mill at ready — awaiting the lever.`);
        S.dialHistory.push({ t: Date.now(), seq: [...S.locked], via: S.autodial ? S.autodial.folio : 'hand', outcome: 'set' });
        saveLS();
        if (S.autodial) S.autodial = null;
      } else {
        setTimeout(done, source === 'rack' ? 40 : 60);
        return;
      }
      done();
    }, source === 'rack' ? T_RACK_FEED - 90 : T_FEED - 40);
  }

  function roman(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n); }

  // ------------------------------------------------------------- autodial
  function startAutodial(folio) {
    if (S.state !== 'idle') { log('RACK', `${folio.folio} refused — engine must be at rest (disengage first).`); flashAnnunciator(); return; }
    if (S.autodial) return;
    S.autodial = { folio: folio.folio, timers: [] };
    log('RACK', `Folio ${folio.folio} “${folio.name}” (${folio.tier}) racked — replaying the punched train at governor speed.`);
    folio.seq.forEach((id, i) => {
      const t = setTimeout(() => { if (S.autodial) requestFeed(id, 'rack'); }, 200 + i * T_RACK_FEED);
      S.autodial.timers.push(t);
    });
  }
  function cancelAutodial() {
    if (!S.autodial) return;
    for (const t of S.autodial.timers) clearTimeout(t);
    log('RACK', `Rack replay of ${S.autodial.folio} abandoned.`);
    S.autodial = null;
  }

  // ============================================================== governor
  function updateRegister() {
    const cells = document.querySelectorAll('.reg-cell');
    for (let i = 0; i < ADDRESS_LEN; i++) {
      const cell = cells[i];
      const id = S.locked[i];
      cell.classList.toggle('locked', !!id);
      cell.querySelector('.rg-num').textContent = id ? String(INDICES.find(x => x.id === id).n).padStart(2, '0') : '··';
    }
    const chk = cells[8], res = cells[9];
    chk.querySelector('.rg-num').textContent = S.locked.length >= ADDRESS_LEN ? '✓' : String(S.locked.length);
    chk.classList.toggle('locked', S.locked.length > 0);
    res.querySelector('.rg-num').textContent = S.state === 'active' || S.state === 'breakthrough' ? '00' : String(S.residual).padStart(2, '0').slice(-2);
  }
  function buildRegister() {
    const reg = $('#store-register');
    for (let i = 0; i < COLUMNS; i++) {
      const d = document.createElement('div');
      d.className = 'reg-cell' + (i >= 8 ? ' special' : '');
      d.innerHTML = `<span class="rg-num">··</span><span class="rg-lab">${i < 8 ? roman(i + 1) : i === 8 ? 'CHECK' : 'RESID'}</span>`;
      reg.appendChild(d);
    }
  }

  const ANNUN = {
    idle: 'ENGINE AT REST',
    dialing: 'SETTING THE TRAIN',
    pending: 'TRAIN SET — MILL AT READY',
    buildup: 'MILL ENGAGED — DRIVING THE RESIDUAL',
    breakthrough: 'RESIDUAL AT NOUGHT — APERTURE OPENS',
    active: 'CONCORDANCE HOLDS — APERTURE OPEN'
  };

  function setState(next) {
    S.state = next;
    S.stageT[next] = performance.now();
    const ann = $('#annunciator');
    ann.dataset.state = next;
    ann.textContent = ANNUN[next] + (next === 'dialing' ? ` — ${S.locked.length} OF ${ADDRESS_LEN}` : '');
    $('#btn-engage').disabled = next !== 'pending';
    $('#btn-engage').classList.toggle('armed', next === 'pending');
    document.body.dataset.engine = next;
    updateRegister();
  }

  function flashAnnunciator() {
    const ann = $('#annunciator');
    ann.style.transition = 'none';
    ann.style.opacity = '0.25';
    setTimeout(() => { ann.style.transition = 'opacity 0.4s'; ann.style.opacity = '1'; }, 60);
  }

  // -------------------------------------------------------------- engage
  let stageTimers = [];
  function engage() {
    if (S.state !== 'pending') { flashAnnunciator(); return; }
    if (S.hold) { refuse(); return; }
    setState('buildup');
    apIdle.setAttribute('display', 'none');
    apBuild.setAttribute('display', '');
    log('MILL', 'Lever thrown — mill engaged, run-up begun.');
    PAUDIO.buildupStart(T_BUILDUP);
    // residual counts down through the run-up
    const startRes = S.residual, t0 = performance.now();
    const resTimer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / T_BUILDUP);
      const v = Math.round(startRes * (1 - p * p));
      residualText.textContent = 'R·' + String(v).padStart(4, '0');
      if (p >= 1) clearInterval(resTimer);
    }, 60);
    stageTimers.push(resTimer);
    stageTimers.push(setTimeout(() => breakthrough(), T_BUILDUP));
  }

  function breakthrough() {
    if (S.state !== 'buildup') return;
    setState('breakthrough');
    residualText.textContent = 'R·0000';
    apIdle.setAttribute('display', 'none');
    apBuild.setAttribute('display', 'none');
    apBurst.setAttribute('display', '');
    document.querySelectorAll('.reg-cell').forEach(c => c.classList.add('proved'));
    PAUDIO.stopBuildup();
    PAUDIO.bell();
    log('APERTURE', 'The residual stands at nought. The bell strikes; the Aperture opens.');
    S.dialHistory.push({ t: Date.now(), seq: [...S.locked], via: 'engage', outcome: 'opened' });
    saveLS();
    stageTimers.push(setTimeout(() => {
      if (S.state !== 'breakthrough') return;
      setState('active');
      apBurst.setAttribute('display', 'none');
      apActive.setAttribute('display', '');
      PAUDIO.activeStart();
      log('APERTURE', 'Aperture holds open under steam.');
    }, T_BREAKTHROUGH));
  }

  function refuse() {
    const r = $('#refusal');
    r.hidden = false;
    const ann = $('#annunciator');
    ann.dataset.state = 'refused';
    ann.textContent = 'MILL REFUSED — PROVING HOLD ENGAGED';
    PAUDIO.refusal();
    log('HOLD', 'Engage refused — the Proving Hold bars the mill.');
    setTimeout(() => {
      r.hidden = true;
      if (S.state === 'pending') setState('pending');
    }, 2300);
  }

  // ------------------------------------------------------------ disengage
  function disengage() {
    const was = S.state;
    cancelAutodial();
    for (const t of stageTimers) { clearTimeout(t); clearInterval(t); }
    stageTimers = [];
    S.feedQueue = []; S.feeding = false;
    PAUDIO.stopBuildup(); PAUDIO.activeStop();
    if (was === 'idle' && !S.locked.length) { log('MILL', 'Disengage thrown at rest — nothing to spill.'); return; }
    PAUDIO.chuff();
    // unwind the store
    for (const r of rings) {
      r.lockedK = -1;
      r.target = 0; r.angle = r.angle % 360;
      r.g.classList.remove('locked');
      r.g.querySelectorAll('.locked').forEach(x => x.classList.remove('locked'));
      r.g.querySelectorAll('.at-index').forEach(x => x.classList.remove('at-index'));
    }
    checkG.querySelectorAll('circle').forEach(c => c.removeAttribute('fill'));
    document.querySelectorAll('.index-card.spent, .index-card.feeding')
      .forEach(c => c.classList.remove('spent', 'feeding'));
    document.querySelectorAll('.reg-cell').forEach(c => c.classList.remove('proved', 'locked'));
    S.locked = [];
    S.residual = 700 + Math.floor(Math.random() * 260);
    residualText.textContent = 'R·' + String(S.residual).padStart(4, '0');
    apBuild.setAttribute('display', 'none');
    apBurst.setAttribute('display', 'none');
    apActive.setAttribute('display', 'none');
    apIdle.removeAttribute('display');
    $('#reader-note').textContent = 'READER AT REST — PRESENT A CARD';
    setState('idle');
    log('MILL', `Disengaged from ${was.toUpperCase()} — steam spilled, store cleared, frame closed.`);
    if (was === 'active' || was === 'breakthrough') {
      S.dialHistory.push({ t: Date.now(), seq: [], via: 'disengage', outcome: 'closed' });
      saveLS();
    }
  }

  // -------------------------------------------------------------- hold
  function toggleHold() {
    S.hold = !S.hold;
    const b = $('#btn-hold');
    b.setAttribute('aria-checked', String(S.hold));
    $('#hold-state').textContent = S.hold ? 'ENGAGED' : 'RELEASED';
    log('HOLD', `Proving Hold ${S.hold ? 'engaged — the mill is barred' : 'released — the mill answers the lever'}.`);
  }

  // ============================================================= telemetry
  // Coupled quantities: boiler feed chases a set point against draw; torque
  // is steam pressure times engagement; confidence follows the proof and is
  // discounted when torque runs shy of nominal. Nothing ticks independently.
  const gaugeRefs = {};
  function buildGauge(id, min, max, unit) {
    const svg = document.querySelector(`#${id} .gauge-svg`);
    const cx = 60, cy = 64, R = 46;
    el('path', { d: `M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy}`, class: 'g-arc' }, svg);
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      el('line', {
        x1: cx + Math.cos(a) * (R - 4), y1: cy + Math.sin(a) * (R - 4),
        x2: cx + Math.cos(a) * R, y2: cy + Math.sin(a) * R,
        class: 'g-tick'
      }, svg);
      if (i % 5 === 0) {
        el('text', {
          x: cx + Math.cos(a) * (R - 13), y: cy + Math.sin(a) * (R - 13) + 3,
          class: 'g-num', 'text-anchor': 'middle'
        }, svg).textContent = String(Math.round(min + (i / 10) * (max - min)));
      }
    }
    const needle = el('line', { x1: cx, y1: cy, x2: cx - R + 8, y2: cy, class: 'g-needle' }, svg);
    el('circle', { cx, cy, r: 3, class: 'g-pivot' }, svg);
    gaugeRefs[id] = { needle, cx, cy, R, min, max };
  }
  function setGauge(id, val) {
    const g = gaugeRefs[id];
    const f = Math.max(0, Math.min(1, (val - g.min) / (g.max - g.min)));
    const a = Math.PI + f * Math.PI;
    g.needle.setAttribute('x2', g.cx + Math.cos(a) * (g.R - 8));
    g.needle.setAttribute('y2', g.cy + Math.sin(a) * (g.R - 8));
  }

  function teleTick() {
    const t = S.tele;
    const st = S.state;
    // engagement of the mill with the store (the clutch of the fiction)
    const engTarget = { idle: 0.15, dialing: 0.2 + 0.05 * S.locked.length, pending: 0.38, buildup: 1.0, breakthrough: 1.15, active: 0.85 }[st];
    t.eng += (engTarget - t.eng) * 0.25;
    // steam draw follows engagement plus the frame's appetite when open
    const drawTarget = 0.22 + t.eng * 0.9 + (st === 'active' ? 0.45 : 0) + (st === 'breakthrough' ? 0.8 : 0);
    t.draw += (drawTarget - t.draw) * 0.3;
    // boiler: regulator feeds against pressure error; draw spends it
    const feed = 0.55 + 0.5 * Math.max(0, 1 - t.P / 120);
    t.P += (feed - t.draw) * 4.2 + (Math.random() - 0.5) * 0.7;
    t.P = Math.max(8, Math.min(160, t.P));
    // torque = pressure x engagement (with lag) — the coupling under test
    const Ttarget = (t.P / 120) * t.eng * 100;
    t.T += (Ttarget - t.T) * 0.35;
    // concordance confidence: proof progress, discounted by torque shortfall
    const proof = st === 'active' || st === 'breakthrough' ? 1
      : st === 'buildup' ? Math.min(1, (performance.now() - S.stageT.buildup) / T_BUILDUP) * 0.6 + 0.4 * (S.locked.length / ADDRESS_LEN)
      : (S.locked.length / ADDRESS_LEN) * (st === 'pending' ? 0.72 : 0.5);
    const torqueFactor = 0.65 + 0.35 * Math.min(1, t.T / 55);
    const Ctarget = 100 * proof * torqueFactor;
    t.C += (Ctarget - t.C) * 0.3;

    setGauge('gauge-boiler', t.P);
    setGauge('gauge-torque', t.T);
    setGauge('gauge-conf', t.C);
    $('#val-boiler').textContent = `${t.P.toFixed(0)} lb`;
    $('#val-torque').textContent = `${t.T.toFixed(0)} gr·ft`;
    $('#val-conf').textContent = `${t.C.toFixed(0)} pts`;

    S.history.push({ t: Date.now(), P: t.P, T: t.T, C: t.C, draw: t.draw, eng: t.eng });
    if (S.history.length > 800) S.history.shift();
  }

  // ================================================================ modals
  let currentModal = null;
  function openModal(name) {
    currentModal = name;
    $('#modal-root').hidden = false;
    const title = { archive: 'THE BUREAU ARCHIVE — CONCORDANCE FOLIOS', section: 'FIG. 2 — THE ENGINE IN SECTION', log: 'THE DAY-BOOK — THIS SESSION', settings: 'ADJUSTMENTS' }[name];
    $('#modal-title').textContent = title;
    if (name === 'archive') renderArchive();
    else if (name === 'section') renderSection();
    else if (name === 'log') renderLogModal();
    else if (name === 'settings') renderSettings();
    log('SESSION', `Opened ${title.split('—')[0].trim()}.`);
  }
  function closeModal() {
    currentModal = null;
    $('#modal-root').hidden = true;
    $('#modal-body').innerHTML = '';
  }

  // -- archive
  let archSel = null;
  function renderArchive() {
    const body = $('#modal-body');
    body.innerHTML = `<div class="arch-layout"><div class="arch-list" id="arch-list"></div><div class="arch-detail" id="arch-detail"></div></div>`;
    const list = $('#arch-list');
    for (const e of ARCHIVE) {
      const b = document.createElement('button');
      b.className = 'arch-item' + (S.viewed.has(e.folio) ? ' viewed' : '');
      b.dataset.folio = e.folio;
      b.innerHTML = `<span class="ai-folio">${e.folio}</span> <span class="ai-viewed">${S.viewed.has(e.folio) ? '· READ' : ''}</span><span class="ai-title">${e.title}</span>`;
      b.addEventListener('click', () => selectFolio(e.folio));
      list.appendChild(b);
    }
    selectFolio(archSel || ARCHIVE[0].folio);
  }
  function selectFolio(folio) {
    const e = ARCHIVE.find(x => x.folio === folio);
    if (!e) return;
    archSel = folio;
    S.viewed.add(folio);
    saveLS();
    document.querySelectorAll('.arch-item').forEach(b => {
      b.classList.toggle('sel', b.dataset.folio === folio);
      if (b.dataset.folio === folio) {
        b.classList.add('viewed');
        b.querySelector('.ai-viewed').textContent = '· READ';
      }
    });
    const rack = RACK.find(r => r.folio === folio);
    const backrefs = ARCHIVE.filter(o => o.folio !== folio && o.body.includes(`[[${folio}]]`)).map(o => o.folio);
    const bodyHtml = e.body.replace(/\[\[(F-[0-9a-z]+)\]\]/g, (_, f) => `<a class="xref" data-xref="${f}">${f}</a>`);
    $('#arch-detail').innerHTML =
      `<h3>${e.folio} — ${e.title}</h3>` +
      `<p class="arch-meta">${e.date} · ${e.by}<span class="st ${e.status}">${e.status.toUpperCase()}</span></p>` +
      `<p class="arch-body">${bodyHtml}</p>` +
      (rack ? `<p class="arch-seq">TRAIN: ${rack.seq.join(' · ')}</p>` : '') +
      (backrefs.length ? `<p class="arch-backrefs">CITED BY: ${backrefs.map(f => `<a class="xref" data-xref="${f}">${f}</a>`).join(' · ')}</p>` : '');
    $('#arch-detail').querySelectorAll('.xref').forEach(a =>
      a.addEventListener('click', () => {
        selectFolio(a.dataset.xref);
        const item = document.querySelector(`.arch-item[data-folio="${a.dataset.xref}"]`);
        if (item) item.scrollIntoView({ block: 'nearest' });
      }));
    log('SESSION', `Read folio ${folio}.`);
  }

  // -- cross-section (FIG. 2)
  function renderSection() {
    const turning = ['buildup', 'breakthrough', 'active'].includes(S.state) ? ' turning' : '';
    $('#modal-body').innerHTML = `<div id="section-svg-wrap">
<svg viewBox="0 0 1060 620">
  <text x="30" y="36" class="xs-title">FIG. 2. — ENGINE No. 3 IN SECTION, LOOKING NORTH</text>
  <line x1="30" y1="560" x2="1030" y2="560" class="xs-line"/>
  ${Array.from({ length: 50 }, (_, i) => `<line x1="${30 + i * 20}" y1="560" x2="${18 + i * 20}" y2="574" class="xs-hatch"/>`).join('')}

  <!-- boiler -->
  <ellipse cx="150" cy="440" rx="95" ry="115" class="xs-bright"/>
  <ellipse cx="150" cy="440" rx="80" ry="100" class="xs-faint" stroke-dasharray="4 5"/>
  <rect x="132" y="250" width="36" height="80" class="xs-line" fill="none"/>
  <line x1="150" y1="250" x2="150" y2="215" class="xs-faint"/>
  <path d="M144 236 q6 -10 12 0 M140 224 q10 -14 20 0" class="xs-faint"/>
  <text x="92" y="595" class="xs-label">BOILER — 120 lb WORKING</text>

  <!-- steam chest + main shaft -->
  <rect x="285" y="405" width="90" height="70" class="xs-line" fill="none"/>
  <line x1="245" y1="440" x2="285" y2="440" class="xs-accent" stroke-width="2"/>
  <line x1="375" y1="440" x2="470" y2="440" class="xs-bright" stroke-width="3"/>
  <text x="278" y="595" class="xs-label">STEAM CHEST</text>

  <!-- governor -->
  <g class="xs-spin${turning}">
    <circle cx="420" cy="360" r="26" class="xs-line"/>
    <line x1="420" y1="334" x2="420" y2="386" class="xs-faint"/>
    <circle cx="404" cy="352" r="6" class="xs-bright"/>
    <circle cx="436" cy="352" r="6" class="xs-bright"/>
  </g>
  <line x1="420" y1="386" x2="420" y2="440" class="xs-line"/>
  <text x="392" y="322" class="xs-label">GOVERNOR</text>

  <!-- the mill: gear cluster, drawn as circles with tooth ticks -->
  <g class="xs-spin${turning}"><circle cx="520" cy="440" r="58" class="xs-bright"/>
    ${Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return `<line x1="${520 + Math.cos(a) * 58}" y1="${440 + Math.sin(a) * 58}" x2="${520 + Math.cos(a) * 66}" y2="${440 + Math.sin(a) * 66}" class="xs-faint"/>`; }).join('')}
    <line x1="520" y1="390" x2="520" y2="490" class="xs-faint"/><line x1="470" y1="440" x2="570" y2="440" class="xs-faint"/></g>
  <g class="xs-spin${turning}"><circle cx="610" cy="382" r="34" class="xs-line"/>
    ${Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `<line x1="${610 + Math.cos(a) * 34}" y1="${382 + Math.sin(a) * 34}" x2="${610 + Math.cos(a) * 40}" y2="${382 + Math.sin(a) * 40}" class="xs-faint"/>`; }).join('')}</g>
  <text x="478" y="595" class="xs-label">THE MILL — 40:1 TRAIN</text>

  <!-- card reader chute -->
  <path d="M620 180 L700 180 L700 250 L672 300 L644 300 L620 250 Z" class="xs-line" fill="none"/>
  <rect x="632" y="192" width="56" height="34" class="xs-accent" fill="none"/>
  <line x1="658" y1="300" x2="658" y2="360" class="xs-accent" stroke-dasharray="4 4"/>
  <text x="596" y="164" class="xs-label">CARD READER — TRAIN FEEDS EDGEWISE</text>

  <!-- the store: value-wheel column in elevation -->
  ${Array.from({ length: 10 }, (_, i) => `<rect x="740" y="${180 + i * 34}" width="120" height="26" class="${i < 8 ? 'xs-line' : 'xs-accent'}" fill="none"/><line x1="752" y1="${193 + i * 34}" x2="848" y2="${193 + i * 34}" class="xs-hatch"/>`).join('')}
  <text x="742" y="164" class="xs-label">THE STORE — WHEELS I–VIII, CHECK, RESIDUAL</text>
  <line x1="800" y1="520" x2="800" y2="560" class="xs-line"/>

  <!-- aperture frame in elevation -->
  <circle cx="960" cy="370" r="76" class="xs-bright" stroke-dasharray="6 5"/>
  <circle cx="960" cy="370" r="48" class="xs-faint"/>
  <line x1="960" y1="446" x2="960" y2="560" class="xs-line"/>
  <text x="906" y="272" class="xs-label">APERTURE FRAME</text>

  <!-- transmission lines -->
  <line x1="578" y1="440" x2="740" y2="440" class="xs-faint" stroke-dasharray="6 5"/>
  <line x1="860" y1="370" x2="884" y2="370" class="xs-faint" stroke-dasharray="6 5"/>
  <text x="30" y="80" class="xs-label" font-style="italic">THE WHOLE OF THE WORK IS SHOWN DIAGRAMMATICALLY; THE BUREAU DRAWS WHAT A THING DOES, NOT WHAT IT IS.</text>
</svg></div>`;
  }

  // -- day-book
  function renderLogModal() {
    const rows = S.log.slice().reverse().map(e =>
      `<tr><td class="log-time">${e.time}</td><td class="log-kind">${e.kind}</td><td class="log-text">${e.text}</td></tr>`).join('');
    $('#modal-body').innerHTML = S.log.length
      ? `<table class="log-table"><tbody>${rows}</tbody></table>`
      : `<p class="log-empty">The day-book is blank. The engine waits.</p>`;
  }

  // -- settings
  function renderSettings() {
    const s = S.settings;
    const seg = (name, opts, cur) => `<span class="seg" data-set="${name}">${opts.map(o => `<button data-v="${o}" class="${o === cur ? 'on' : ''}">${o.toUpperCase()}</button>`).join('')}</span>`;
    const slider = (name, label, val) => `<label class="set-row">${label}<input type="range" min="0" max="1" step="0.05" value="${val}" data-slide="${name}"></label>`;
    $('#modal-body').innerHTML = `<div class="set-grid">
      <div class="set-block"><h3>THE SHEET</h3>
        <div class="set-row">INK ${seg('theme', ['draught', 'verdigris', 'blueprint', 'ember'], s.theme)}</div>
        <div class="set-row">DENSITY ${seg('density', ['comfortable', 'compact'], s.density)}</div>
        <div class="set-row">MOTION ${seg('motion', ['full', 'reduced'], s.motion)}</div>
      </div>
      <div class="set-block"><h3>THE ROOM</h3>
        ${slider('master', 'MASTER', s.master)}
        ${slider('ambient', 'AMBIENT WORKS', s.ambient)}
        ${slider('mechanism', 'MECHANISM', s.mechanism)}
        ${slider('bell', 'PROVING BELL', s.bell)}
      </div>
      <p class="set-note">Adjustments persist in this browser only — the Bureau keeps no ledger of its visitors.</p>
    </div>`;
    $('#modal-body').querySelectorAll('.seg button').forEach(b =>
      b.addEventListener('click', () => {
        const name = b.closest('.seg').dataset.set;
        s[name] = b.dataset.v;
        b.closest('.seg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        applySettings();
        saveLS();
        log('ADJUST', `${name} set to ${b.dataset.v}.`);
      }));
    $('#modal-body').querySelectorAll('input[data-slide]').forEach(i =>
      i.addEventListener('input', () => {
        s[i.dataset.slide] = parseFloat(i.value);
        PAUDIO.setLevels(s);
        saveLS();
      }));
  }
  function applySettings() {
    document.body.dataset.theme = S.settings.theme;
    document.body.dataset.density = S.settings.density;
    document.body.dataset.motion = S.settings.motion;
    PAUDIO.setLevels(S.settings);
  }

  // ================================================================== fit
  // scale the 1920x1080 sheet to the viewport; --fit is a bare number (a
  // ratio computed in JS), never a CSS length division.
  function fitStage() {
    const w = window.innerWidth, h = window.innerHeight;
    if (w <= 0 || h <= 0) { setTimeout(fitStage, 120); return; }
    const k = Math.min(w / 1920, h / 1080);
    document.body.style.setProperty('--fit', String(k));
  }

  // ================================================================== boot
  function boot() {
    loadLS();
    applySettings();
    buildWheel();
    buildTray();
    buildRack();
    buildRegister();
    buildGauge('gauge-boiler', 0, 160);
    buildGauge('gauge-torque', 0, 100);
    buildGauge('gauge-conf', 0, 100);
    setState('idle');
    updateRegister();
    residualText.textContent = 'R·' + String(S.residual).padStart(4, '0');

    // controls
    $('#btn-engage').addEventListener('click', engage);
    $('#btn-disengage').addEventListener('click', disengage);
    $('#btn-hold').addEventListener('click', toggleHold);
    $('#traytab-index').addEventListener('click', () => setTray('index'));
    $('#traytab-rack').addEventListener('click', () => setTray('rack'));
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.addEventListener('click', () => openModal(b.dataset.modal)));
    $('#modal-close').addEventListener('click', closeModal);
    $('#modal-scrim').addEventListener('click', closeModal);
    $('#ref-toggle').addEventListener('click', () => { $('#ref-overlay').hidden = false; log('SESSION', 'Consulted the operator’s reference.'); });
    $('#ref-dismiss').addEventListener('click', () => { $('#ref-overlay').hidden = true; });
    $('#ref-overlay').addEventListener('click', (e) => { if (e.target === $('#ref-overlay')) $('#ref-overlay').hidden = true; });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); $('#ref-overlay').hidden = true; }
    });

    fitStage();
    window.addEventListener('resize', fitStage);
    setInterval(teleTick, 250);
    requestAnimationFrame(frame);
    log('SESSION', `Session opened. PERPETUA v${VERSION} at rest; Proving Hold ${S.hold ? 'ENGAGED' : 'RELEASED'}.`);
  }
  function setTray(which) {
    $('#traytab-index').classList.toggle('active', which === 'index');
    $('#traytab-rack').classList.toggle('active', which === 'rack');
    $('#traytab-index').setAttribute('aria-selected', String(which === 'index'));
    $('#traytab-rack').setAttribute('aria-selected', String(which === 'rack'));
    $('#index-tray').hidden = which !== 'index';
    $('#folio-rack').hidden = which !== 'rack';
  }

  // test hooks (read-only views of live state)
  window.__perpetua = {
    version: VERSION,
    get state() { return S.state; },
    get locked() { return [...S.locked]; },
    get hold() { return S.hold; },
    get autodialing() { return !!S.autodial; },
    get history() { return S.history; },
    get log() { return S.log; },
    get dialHistory() { return S.dialHistory; },
    get settings() { return { ...S.settings }; },
    get fit() { return document.body.style.getPropertyValue('--fit'); },
    timings: { T_BUILDUP, T_BREAKTHROUGH, T_RACK_FEED, T_FEED }
  };

  boot();
})();
