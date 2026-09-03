/* TRELLIS — Hollin Reach Canopy Commons · Sunspan Ring
 *
 * The ring is a working instrument. Every waymark pledged does visible work:
 *   1. the dial hoop slews the chosen waymark round until it sits under the
 *      next open bay (a heliostat turning to face its light),
 *   2. the share flows from the stem join along a conduit to that bay,
 *   3. the bay's collector opens its petals and holds the waymark.
 * Seven held shares pool at the centre and then the ring waits. Only the
 * hearth opens the span, in three stages: the pool gathers (dusk), breaks
 * into sunlight, and stands open. Folding sends every share home.
 *
 * All motion is closed-form on the wall clock (tweens carry from/to/t0/dur),
 * so a starved frame never desynchronises the instrument from its state. */

(function () {
  'use strict';

  const WM = window.TRELLIS_WAYMARKS;
  const ROUTES = window.TRELLIS_ROUTES;
  const AUDIO = window.TrellisAudio;

  const N_BAYS = 7;
  const ROUTE_LEN = 7;
  const N_WM = WM.length;
  const WM_STEP = 360 / N_WM;
  const CX = 450, CY = 450;
  const RAD = { outer: 432, outer2: 422, conduit: 410, bay: 330, slot: 278, hoop: 240, hoopInner: 228, hoopGlyph: 216, pool: 196, aperture: 188 };
  const STEM_ANGLE = 90; // the stem joins the ring at the bottom

  const PACE = {
    hand:   { slewMin: 420, slewSpan: 320, fill: 480, open: 380, settle: 140, label: 'by hand' },
    ledger: { slewMin: 200, slewSpan: 130, fill: 220, open: 180, settle: 50,  label: 'at ledger pace' }
  };
  const BUILDUP_MS = 2400;
  const BREAK_MS = 700;
  const FOLD_MS = 900;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';

  /* ---------- state ---------- */
  function tw(v) { return { from: v, to: v, t0: 0, dur: 1 }; }
  function setTw(t, to, now, dur) { t.from = tv(t, now); t.to = to; t.t0 = now; t.dur = Math.max(1, dur); }
  function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function tv(t, now) {
    const p = Math.max(0, Math.min(1, (now - t.t0) / t.dur));
    return t.from + (t.to - t.from) * easeInOut(p);
  }
  function done(t, now) { return now >= t.t0 + t.dur; }

  const S = {
    phase: 'idle',
    route: [],
    queue: [],
    pumping: false,
    gen: 0,
    hoop: tw(0),
    hoopAngle: 0,
    bays: [],
    pool: tw(0),
    phaseT0: performance.now(),
    latch: false,
    walking: null,     // route id being walked from the ledger
    routeName: null,
    pledging: null,    // waymark currently being routed
    sun: 62,
    draw: 0,
    minute: 9 * 60 + 40,
    lastUi: 0,
    lastTick: performance.now(),
    log: [],
    bannerTimer: null
  };
  for (let i = 0; i < N_BAYS; i++) S.bays.push({ open: tw(0), conduit: tw(0), wid: null });

  const byId = {};
  WM.forEach(function (w, i) { byId[w.id] = Object.assign({ index: i }, w); });

  /* ---------- dom ---------- */
  const $ = function (id) { return document.getElementById(id); };
  const stage = $('stage');
  const ringSvg = $('ring');
  const aperture = $('aperture');
  const actx = aperture.getContext('2d');
  const ringWord = $('ring-word');
  const banner = $('banner');
  const boardGrid = $('board-grid');
  const slotsEl = $('slots');
  const heldWord = $('held-word');
  const routeList = $('route-list');
  const logEl = $('log');
  const logCount = $('log-count');
  const btnOpen = $('btn-open');
  const btnFold = $('btn-fold');
  const btnLatch = $('btn-latch');
  const latchState = $('latch-state');
  const hearthNote = $('hearth-note');
  const btnGuide = $('btn-guide');
  const btnGuideClose = $('btn-guide-close');
  const guide = $('guide');
  const btnSound = $('btn-sound');
  const gaugeNote = $('gauge-note');
  const hourEl = $('hour');
  const skyEl = $('skyword');
  const sunDot = $('sun-dot');

  /* ---------- helpers ---------- */
  function el(name, attrs, parent) {
    const e = document.createElementNS(SVG_NS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function useGlyph(wid, x, y, size, parent) {
    const u = el('use', { x: x, y: y, width: size, height: size }, parent);
    u.setAttribute('href', '#wm-' + wid);
    u.setAttributeNS(XLINK, 'xlink:href', '#wm-' + wid);
    return u;
  }
  function bayAngle(i) { return -90 + i * (360 / N_BAYS); }
  function polar(r, deg) { const a = deg * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; }
  function wrap180(d) { d = ((d + 180) % 360 + 360) % 360 - 180; return d; }
  function fmtHour(m) {
    m = ((m % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60), mm = Math.floor(m % 60);
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  }
  function daylight() {
    const t = (S.minute - 6 * 60) / (14 * 60);
    if (t <= 0 || t >= 1) return 0;
    return Math.sin(Math.PI * t);
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function inlineGlyphSvg(wid, size) {
    const w = byId[wid];
    return '<svg viewBox="0 0 40 40" width="' + size + '" height="' + size + '" aria-hidden="true"><path d="' + w.path + '"/></svg>';
  }

  /* ---------- glyph symbols ---------- */
  (function buildDefs() {
    const defs = $('glyph-defs');
    WM.forEach(function (w) {
      const sym = el('symbol', { id: 'wm-' + w.id, viewBox: '0 0 40 40' }, defs);
      el('path', { d: w.path, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sym);
    });
  })();

  /* ---------- ring construction ---------- */
  const R = { conduits: [], conduitLen: [], bays: [], hoopGlyphs: {}, slots: [], slotGlyphs: [] };

  (function buildRing() {
    const g = el('g', { id: 'r-static' }, ringSvg);
    el('circle', { cx: CX, cy: CY, r: RAD.outer, class: 'r-trellis-outer' }, g);
    el('circle', { cx: CX, cy: CY, r: RAD.outer2, class: 'r-trellis' }, g);

    // trellis braces where the frame meets each bay, plus a leaf on every other one
    for (let i = 0; i < N_BAYS; i++) {
      const bg = el('g', { transform: 'rotate(' + bayAngle(i) + ' ' + CX + ' ' + CY + ') translate(' + (CX + RAD.outer) + ' ' + CY + ')' }, g);
      el('path', { d: 'M0 0 c -12 -16 -34 -12 -40 6 M0 0 c -12 16 -34 12 -40 -6', class: 'r-brace' }, bg);
      el('path', { d: 'M4 0 c 14 -10 30 -8 40 6 c -12 10 -30 8 -40 -6 z', class: 'r-brace-leaf', transform: i % 2 ? 'rotate(30)' : 'rotate(-30)' }, bg);
      const [tx, ty] = polar(458, bayAngle(i));
      const t = el('text', { x: tx, y: ty, class: 'r-bay-index' }, g);
      t.textContent = 'bay ' + (i + 1);
    }

    // conduit tracks from the stem join to every bay
    const cg = el('g', { id: 'r-conduits' }, ringSvg);
    for (let i = 0; i < N_BAYS; i++) {
      let delta = wrap180(bayAngle(i) - STEM_ANGLE);
      if (Math.abs(Math.abs(delta) - 180) < 0.01) delta = -179.9;
      const a0 = STEM_ANGLE, a1 = STEM_ANGLE + delta;
      const [x0, y0] = polar(RAD.conduit, a0);
      const [x1, y1] = polar(RAD.conduit, a1);
      const d = 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A ' + RAD.conduit + ' ' + RAD.conduit + ' 0 0 ' + (delta > 0 ? 1 : 0) + ' ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
      el('path', { d: d, class: 'r-conduit-track' }, g);
      const fill = el('path', { d: d, class: 'r-conduit-fill' }, cg);
      const len = fill.getTotalLength();
      fill.setAttribute('stroke-dasharray', len);
      fill.setAttribute('stroke-dashoffset', len);
      R.conduits.push(fill);
      R.conduitLen.push(len);
    }
    const [sx, sy] = polar(RAD.conduit, STEM_ANGLE);
    el('circle', { cx: sx, cy: sy, r: 10, class: 'r-stem-join' }, g);

    // pool rim and aperture
    el('circle', { cx: CX, cy: CY, r: RAD.pool, class: 'r-pool-track' }, g);
    el('circle', { cx: CX, cy: CY, r: RAD.aperture, class: 'r-aperture-rim' }, g);
    R.idleArcs = el('g', { id: 'r-idle' }, g);
    el('circle', { cx: CX, cy: CY, r: 150, class: 'r-idle-arc' }, R.idleArcs);
    el('circle', { cx: CX, cy: CY, r: 104, class: 'r-idle-arc' }, R.idleArcs);
    el('circle', { cx: CX, cy: CY, r: 58, class: 'r-idle-arc' }, R.idleArcs);

    // the dial hoop: fourteen waymarks that slew under the bays
    R.hoop = el('g', { id: 'r-hoop' }, ringSvg);
    el('circle', { cx: CX, cy: CY, r: RAD.hoop, class: 'r-hoop' }, R.hoop);
    el('circle', { cx: CX, cy: CY, r: RAD.hoopInner, class: 'r-hoop-inner' }, R.hoop);
    WM.forEach(function (w, k) {
      const a = k * WM_STEP;
      const [x1, y1] = polar(RAD.hoop - 8, a);
      const [x2, y2] = polar(RAD.hoop + 10, a);
      el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'r-tick' }, R.hoop);
      const gg = el('g', { transform: 'rotate(' + a + ' ' + CX + ' ' + CY + ') translate(' + (CX + RAD.hoopGlyph) + ' ' + CY + ') rotate(90)', class: 'r-hoop-glyph', 'data-wid': w.id }, R.hoop);
      useGlyph(w.id, -13, -13, 26, gg);
      R.hoopGlyphs[w.id] = gg;
    });

    // pool fill (drawn above the hoop so it reads as the centre filling)
    R.poolFill = el('circle', { cx: CX, cy: CY, r: RAD.pool, class: 'r-pool-fill', transform: 'rotate(90 ' + CX + ' ' + CY + ')' }, ringSvg);
    R.poolLen = 2 * Math.PI * RAD.pool;
    R.poolFill.setAttribute('stroke-dasharray', R.poolLen);
    R.poolFill.setAttribute('stroke-dashoffset', R.poolLen);

    // bays: collector petals and the slot that holds the waymark
    const bays = el('g', { id: 'r-bays' }, ringSvg);
    for (let i = 0; i < N_BAYS; i++) {
      const th = bayAngle(i);
      const bay = el('g', { class: 'r-bay', transform: 'rotate(' + th + ' ' + CX + ' ' + CY + ') translate(' + (CX + RAD.bay) + ' ' + CY + ')' }, bays);
      const petals = [];
      for (let k = -2; k <= 2; k++) {
        const pg = el('g', {}, bay);
        el('path', { d: 'M0 0 C 8 -16, 36 -22, 58 0 C 36 22, 8 16, 0 0 Z', class: 'r-petal' }, pg);
        el('path', { d: 'M3 0 L 50 0', class: 'r-petal-rib' }, pg);
        petals.push({ g: pg, k: k });
      }
      el('circle', { cx: 0, cy: 0, r: 8, class: 'r-bay-base' }, bay);
      const slotG = el('g', { transform: 'translate(' + (RAD.slot - RAD.bay) + ' 0) rotate(' + (-th) + ')' }, bay);
      const slot = el('circle', { cx: 0, cy: 0, r: 25, class: 'r-slot' }, slotG);
      const sg = el('g', { class: 'r-slot-glyph' }, slotG);
      R.bays.push({ g: bay, petals: petals });
      R.slots.push(slot);
      R.slotGlyphs.push(sg);
    }
  })();

  /* ---------- board, slots, ledger ---------- */
  const wmButtons = {};
  (function buildBoard() {
    // two shallow arcs of seven, leaves along the stem
    WM.forEach(function (w, i) {
      const row = i < 7 ? 0 : 1;
      const col = i % 7;
      const x = 2 + col * 112 + (row ? 40 : 0);
      const arc = Math.sin((col / 6) * Math.PI) * 26;
      const y = (row ? 176 : 22) + (row ? -arc : arc);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wm';
      b.dataset.wid = w.id;
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      b.title = w.name + ' — ' + w.gloss;
      b.setAttribute('aria-label', 'Pledge ' + w.name);
      b.innerHTML = '<span class="wm-disc">' + inlineGlyphSvg(w.id, 46) + '</span><span class="wm-name">' + w.name + '</span>';
      b.addEventListener('click', function () { onWaymark(w.id); });
      boardGrid.appendChild(b);
      wmButtons[w.id] = b;
    });
  })();

  const slotEls = [];
  (function buildSlots() {
    for (let i = 0; i < ROUTE_LEN; i++) {
      const d = document.createElement('div');
      d.className = 'slot';
      d.innerHTML = '<span class="slot-n">' + (i + 1) + '</span>';
      slotsEl.appendChild(d);
      slotEls.push(d);
    }
  })();

  const routeButtons = {};
  (function buildLedger() {
    ROUTES.forEach(function (r) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'route';
      b.dataset.route = r.id;
      b.innerHTML = '<span class="route-name">' + r.name + '</span><span class="route-note">' + r.note + '</span>';
      b.addEventListener('click', function () { onRoute(r.id); });
      routeList.appendChild(b);
      routeButtons[r.id] = b;
    });
  })();

  /* ---------- log ---------- */
  function log(text, warm) {
    S.log.unshift({ t: fmtHour(S.minute), text: text, warm: !!warm, at: performance.now() });
    if (S.log.length > 40) S.log.length = 40;
    renderLog();
  }
  function renderLog() {
    const now = performance.now();
    logEl.innerHTML = '';
    S.log.slice(0, 6).forEach(function (e, i) {
      const li = document.createElement('li');
      if (e.warm) li.className = 'is-warm';
      else if (i === 0 && now - e.at < 4000) li.className = 'is-fresh';
      li.innerHTML = '<span class="t">' + e.t + '</span><span>' + e.text + '</span>';
      logEl.appendChild(li);
    });
    logCount.textContent = S.log.length ? S.log.length + ' entries today' : '';
  }

  function showBanner(text) {
    banner.textContent = text;
    banner.hidden = false;
    banner.classList.remove('is-shaking');
    void banner.offsetWidth;
    banner.classList.add('is-shaking');
    clearTimeout(S.bannerTimer);
    S.bannerTimer = setTimeout(function () { banner.hidden = true; }, 3600);
  }

  /* ---------- the lock pipeline ---------- */
  function currentRouteName() {
    if (S.routeName) return S.routeName;
    return 'a route of the commons’ own choosing';
  }

  function enqueue(wid, pace) {
    S.queue.push({ wid: wid, pace: pace });
    pump();
  }

  function pump() {
    if (S.pumping) return;
    S.pumping = true;
    (async function () {
      try {
        while (S.queue.length) {
          const item = S.queue.shift();
          const ok = await lockOne(item);
          if (!ok) break;
        }
      } finally {
        S.pumping = false;
      }
    })();
  }

  async function lockOne(item) {
    const gen = S.gen;
    const now0 = performance.now();
    if (S.phase !== 'idle' && S.phase !== 'dialing') return false;
    if (S.route.length >= ROUTE_LEN) return false;
    const bayIndex = S.route.length;
    const w = byId[item.wid];
    const pace = item.pace;
    S.phase = 'dialing';
    S.pledging = w.id;
    stage.dataset.phase = 'dialing';

    // 1. slew the hoop so this waymark sits under the open bay
    const target = bayAngle(bayIndex) - w.index * WM_STEP;
    const cur = tv(S.hoop, now0);
    const delta = wrap180(target - cur);
    const slewMs = pace.slewMin + pace.slewSpan * Math.abs(delta) / 180;
    setTw(S.hoop, cur + delta, now0, slewMs);
    AUDIO.slew(slewMs / 1000, Math.abs(delta) / 180);
    log('hoop slews ' + Math.round(Math.abs(delta)) + '° to bring <em>' + w.name + '</em> under bay ' + (bayIndex + 1) + ' ' + pace.label);
    await sleep(slewMs);
    if (gen !== S.gen) return false;

    // 2. the share flows down the conduit
    const t1 = performance.now();
    setTw(S.bays[bayIndex].conduit, 1, t1, pace.fill);
    AUDIO.trickle(pace.fill / 1000);
    await sleep(pace.fill);
    if (gen !== S.gen) return false;

    // 3. the collector opens and holds the waymark
    const t2 = performance.now();
    S.bays[bayIndex].wid = w.id;
    S.route.push(w.id);
    setTw(S.bays[bayIndex].open, 1, t2, pace.open);
    setTw(S.pool, S.route.length / ROUTE_LEN, t2, pace.open + pace.settle - 40);
    AUDIO.petal(bayIndex);
    log('bay ' + (bayIndex + 1) + ' opens and holds <em>' + w.name + '</em> · ' + w.gloss);
    await sleep(pace.open + pace.settle);
    if (gen !== S.gen) return false;

    S.pledging = null;
    if (S.route.length >= ROUTE_LEN) {
      S.phase = 'pending';
      S.phaseT0 = performance.now();
      stage.dataset.phase = 'pending';
      S.walking = null;
      AUDIO.held();
      log('seven shares held for ' + currentRouteName() + '. The ring waits for the hearth.', false);
    }
    updateUi(performance.now(), true);
    return true;
  }

  /* ---------- controls ---------- */
  function onWaymark(wid) {
    AUDIO.resume();
    const w = byId[wid];
    if (S.phase === 'pending') { note('the route is already held; open the span or fold it'); return; }
    if (S.phase !== 'idle' && S.phase !== 'dialing') { note('the span is busy; fold it before pledging again'); return; }
    if (S.walking) { note('the ledger is walking a route; let it finish or fold the span'); return; }
    if (S.route.indexOf(wid) >= 0 || S.pledging === wid || S.queue.some(function (q) { return q.wid === wid; })) { note(w.name + ' is already pledged'); return; }
    if (S.route.length + S.queue.length + (S.pledging ? 1 : 0) >= ROUTE_LEN) { note('seven is enough; the trellis holds no more'); return; }
    AUDIO.tok();
    if (!S.routeName && S.route.length === 0 && S.queue.length === 0) S.routeName = null;
    enqueue(wid, PACE.hand);
    updateUi(performance.now(), true);
  }

  function onRoute(rid) {
    AUDIO.resume();
    const r = ROUTES.filter(function (x) { return x.id === rid; })[0];
    if (!r) return;
    if (S.phase !== 'idle') {
      if (S.phase === 'dialing') note('a route is already being pledged; fold the span to start over');
      else if (S.phase === 'pending') note('a route is already held; open the span or fold it first');
      else note('the span is open; fold it before walking another route');
      return;
    }
    if (S.walking) return;
    S.walking = r.id;
    S.routeName = r.name;
    AUDIO.tap();
    log('the ledger re-pledges <em>' + r.name + '</em>: shares already promised, routed ' + PACE.ledger.label);
    r.marks.forEach(function (wid) { enqueue(wid, PACE.ledger); });
    updateUi(performance.now(), true);
  }

  function onOpen() {
    AUDIO.resume();
    if (S.latch) {
      AUDIO.refuse();
      showBanner('Quiet hours are kept. Release the latch at the hearth to open the span.');
      btnOpen.classList.remove('is-refused'); void btnOpen.offsetWidth; btnOpen.classList.add('is-refused');
      log('the hearth declines: quiet hours are kept while the latch is engaged', true);
      return;
    }
    if (S.phase === 'active' || S.phase === 'buildup' || S.phase === 'breakthrough') { note('the span is already opening'); return; }
    if (S.phase !== 'pending') { note('hold seven waymarks first; the pool has ' + S.route.length + ' of seven'); return; }
    const gen = ++S.gen;
    S.phase = 'buildup';
    S.phaseT0 = performance.now();
    stage.dataset.phase = 'buildup';
    AUDIO.buildup(BUILDUP_MS / 1000);
    log('the hearth opens the span: the pool gathers its light for ' + currentRouteName());
    setTimeout(function () {
      if (gen !== S.gen || S.phase !== 'buildup') return;
      S.phase = 'breakthrough';
      S.phaseT0 = performance.now();
      stage.dataset.phase = 'breakthrough';
      AUDIO.breakthrough();
      log('sunburst — the pool breaks into daylight');
      setTimeout(function () {
        if (gen !== S.gen || S.phase !== 'breakthrough') return;
        S.phase = 'active';
        S.phaseT0 = performance.now();
        stage.dataset.phase = 'active';
        AUDIO.activeStart();
        log('the span stands open to ' + currentRouteName() + '. Neighbours may cross.');
        updateUi(performance.now(), true);
      }, BREAK_MS);
      updateUi(performance.now(), true);
    }, BUILDUP_MS);
    updateUi(performance.now(), true);
  }

  function onFold() {
    AUDIO.resume();
    if (S.phase === 'idle' && S.route.length === 0 && S.queue.length === 0) { note('the ring is already resting'); AUDIO.tap(); return; }
    if (S.phase === 'folding') return;
    const gen = ++S.gen;
    const was = S.phase;
    S.queue.length = 0;
    S.walking = null;
    S.pledging = null;
    S.phase = 'folding';
    S.phaseT0 = performance.now();
    stage.dataset.phase = 'folding';
    AUDIO.fold();
    const now = performance.now();
    S.bays.forEach(function (b, i) {
      setTw(b.open, 0, now + i * 40, 420);
      setTw(b.conduit, 0, now + 120 + i * 40, 480);
    });
    setTw(S.pool, 0, now, FOLD_MS);
    setTw(S.hoop, 0, now, FOLD_MS);
    log(was === 'active' ? 'the span folds; the light settles and every share flows home' : 'the span folds before opening; shares flow home');
    setTimeout(function () {
      if (gen !== S.gen) return;
      S.phase = 'idle';
      S.phaseT0 = performance.now();
      stage.dataset.phase = 'idle';
      S.route = [];
      S.routeName = null;
      S.bays.forEach(function (b) { b.wid = null; });
      log('the ring rests');
      updateUi(performance.now(), true);
    }, FOLD_MS + 60);
    updateUi(performance.now(), true);
  }

  function onLatch() {
    AUDIO.resume();
    S.latch = !S.latch;
    AUDIO.latch(S.latch);
    btnLatch.setAttribute('aria-pressed', S.latch ? 'true' : 'false');
    latchState.textContent = S.latch ? 'engaged · quiet hours' : 'released';
    hearthNote.textContent = S.latch ? 'quiet hours · the span stays folded until released' : 'open hours · the span may be opened';
    log(S.latch ? 'quiet-hours latch engaged: the commons is resting, the span will not open' : 'quiet-hours latch released: open hours again');
  }

  function note(text) {
    log(text);
    updateUi(performance.now(), true);
  }

  btnOpen.addEventListener('click', onOpen);
  btnFold.addEventListener('click', onFold);
  btnLatch.addEventListener('click', onLatch);
  btnGuide.addEventListener('click', function () { AUDIO.resume(); guide.hidden = false; });
  btnGuideClose.addEventListener('click', function () { guide.hidden = true; });
  guide.addEventListener('click', function (e) { if (e.target === guide) guide.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') guide.hidden = true; });
  btnSound.addEventListener('click', function () {
    const on = !AUDIO.isEnabled();
    AUDIO.setEnabled(on);
    btnSound.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { AUDIO.resume(); AUDIO.tap(); if (S.phase === 'active') AUDIO.activeStart(); }
  });
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { AUDIO.resume(); }, { passive: true });
  });

  /* ---------- rendering ---------- */
  function render(now) {
    // hoop
    const h = tv(S.hoop, now);
    S.hoopAngle = h;
    R.hoop.setAttribute('transform', 'rotate(' + h.toFixed(3) + ' ' + CX + ' ' + CY + ')');

    // bays
    for (let i = 0; i < N_BAYS; i++) {
      const b = S.bays[i];
      const o = tv(b.open, now);
      const rb = R.bays[i];
      rb.petals.forEach(function (p) {
        const ang = p.k * 24 * o;
        const sx = 0.42 + 0.58 * o;
        const sy = 0.18 + 0.82 * o;
        p.g.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ')');
      });
      rb.g.classList.toggle('is-open', o > 0.5);
      const c = tv(b.conduit, now);
      R.conduits[i].setAttribute('stroke-dashoffset', (R.conduitLen[i] * (1 - c)).toFixed(2));
      R.conduits[i].style.opacity = c > 0.001 ? '1' : '0';
      const held = !!b.wid;
      R.slots[i].classList.toggle('is-held', held);
      const sg = R.slotGlyphs[i];
      const want = held ? b.wid : '';
      if (sg.dataset.wid !== want) {
        sg.dataset.wid = want;
        while (sg.firstChild) sg.removeChild(sg.firstChild);
        if (held) useGlyph(b.wid, -15, -15, 30, sg);
      }
    }

    // pool
    const pool = tv(S.pool, now);
    R.poolFill.setAttribute('stroke-dashoffset', (R.poolLen * (1 - pool)).toFixed(2));

    // idle arcs drift
    R.idleArcs.setAttribute('transform', 'rotate(' + ((now / 1000) * 1.5 % 360).toFixed(2) + ' ' + CX + ' ' + CY + ')');
    const phaseIdleLike = S.phase === 'idle' || S.phase === 'dialing' || S.phase === 'pending' || S.phase === 'folding';
    R.idleArcs.style.opacity = phaseIdleLike ? '1' : '0';

    // hoop glyph highlight
    for (const wid in R.hoopGlyphs) R.hoopGlyphs[wid].classList.toggle('is-locked', S.route.indexOf(wid) >= 0);

    drawAperture(now, pool);
  }

  const motes = [];
  for (let i = 0; i < 90; i++) motes.push({ r: 40 + ((i * 37) % 140), a: (i * 2.399) % (Math.PI * 2), s: 0.6 + ((i * 13) % 7) / 10 });

  function drawAperture(now, pool) {
    const c = actx;
    const W = aperture.width, H = aperture.height;
    const cx = W / 2, cy = H / 2, R0 = 196;
    const t = now / 1000;
    c.clearRect(0, 0, W, H);
    c.save();
    c.beginPath(); c.arc(cx, cy, R0, 0, Math.PI * 2); c.clip();

    const ph = S.phase;
    const p = Math.min(1, (now - S.phaseT0) / (ph === 'buildup' ? BUILDUP_MS : ph === 'breakthrough' ? BREAK_MS : 1000));

    if (ph === 'idle' || ph === 'dialing' || ph === 'pending' || ph === 'folding') {
      // a pale hearth glow that grows with the pool
      if (pool > 0.001) {
        const pulse = ph === 'pending' ? 0.85 + 0.15 * Math.sin(t * 2.2) : 1;
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, R0 * (0.35 + 0.55 * pool));
        g.addColorStop(0, 'rgba(240,166,58,' + (0.45 * pool * pulse).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(240,166,58,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        const n = Math.round(pool * 42);
        for (let i = 0; i < n; i++) {
          const m = motes[i];
          const a = m.a + t * 0.25 * m.s;
          const r = m.r * (0.55 + 0.45 * pool);
          c.beginPath();
          c.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 2.6, 0, Math.PI * 2);
          c.fillStyle = 'rgba(196,98,59,0.55)';
          c.fill();
        }
      }
    } else if (ph === 'buildup') {
      // the pool gathers: the aperture dims to ember while the light draws inward
      const e = easeInOut(p);
      c.fillStyle = 'rgba(120,52,30,' + (0.82 * e).toFixed(3) + ')';
      c.fillRect(0, 0, W, H);
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, R0 * (0.15 + 0.35 * e));
      g.addColorStop(0, 'rgba(255,207,122,' + (0.25 + 0.7 * e * e).toFixed(3) + ')');
      g.addColorStop(0.6, 'rgba(240,166,58,' + (0.35 * e).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(240,166,58,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      const n = 90;
      for (let i = 0; i < n; i++) {
        const m = motes[i];
        const spin = t * (0.4 + 3.2 * e * e) * m.s;
        const r = (m.r + 40) * (1 - 0.88 * e) + 6;
        const a = m.a + spin;
        c.beginPath();
        c.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 2 + 2.5 * e, 0, Math.PI * 2);
        c.fillStyle = 'rgba(' + Math.round(240 + 15 * e) + ',' + Math.round(166 + 60 * e) + ',' + Math.round(58 + 140 * e) + ',0.85)';
        c.fill();
      }
      if (e > 0.45) {
        const ra = (e - 0.45) / 0.55;
        c.strokeStyle = 'rgba(255,220,150,' + (0.55 * ra).toFixed(3) + ')';
        c.lineWidth = 1.5;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + t * 0.6;
          c.beginPath();
          c.moveTo(cx + 20 * Math.cos(a), cy + 20 * Math.sin(a));
          c.lineTo(cx + R0 * ra * Math.cos(a), cy + R0 * ra * Math.sin(a));
          c.stroke();
        }
      }
    } else if (ph === 'breakthrough') {
      // sunburst
      const flash = p < 0.12 ? p / 0.12 : 1;
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, R0);
      g.addColorStop(0, 'rgba(255,250,225,1)');
      g.addColorStop(0.4, 'rgba(255,224,140,1)');
      g.addColorStop(1, 'rgba(255,196,90,1)');
      c.globalAlpha = 0.75 + 0.25 * flash;
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,240,' + (0.95 * (1 - p * 0.6)).toFixed(3) + ')';
      c.lineWidth = 3;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2 + t * 0.3;
        c.beginPath();
        c.moveTo(cx + 10 * Math.cos(a), cy + 10 * Math.sin(a));
        c.lineTo(cx + R0 * Math.cos(a), cy + R0 * Math.sin(a));
        c.stroke();
      }
      c.beginPath();
      c.arc(cx, cy, R0 * p, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - p)).toFixed(3) + ')';
      c.lineWidth = 26 * (1 - p) + 2;
      c.stroke();
    } else if (ph === 'active') {
      // the span stands open: a woven daylight, breathing
      const breathe = 1 + 0.02 * Math.sin(t * 1.3);
      c.save();
      c.translate(cx, cy); c.scale(breathe, breathe); c.translate(-cx, -cy);
      const layers = [
        { rot: t * 0.35, cols: ['rgba(232,150,52,0.95)', 'rgba(147,173,116,0.9)', 'rgba(255,196,110,0.95)', 'rgba(110,140,86,0.9)'] },
        { rot: -t * 0.22 + 1.1, cols: ['rgba(255,207,122,0.5)', 'rgba(95,122,74,0.45)', 'rgba(240,166,58,0.55)', 'rgba(147,173,116,0.5)'] },
        { rot: t * 0.55 + 2.4, cols: ['rgba(255,240,200,0.4)', 'rgba(196,98,59,0.3)', 'rgba(255,240,200,0.4)'] }
      ];
      layers.forEach(function (L, li) {
        const g = c.createConicGradient(L.rot, cx, cy);
        const n = L.cols.length;
        for (let i = 0; i < n; i++) {
          for (let rep = 0; rep < 3; rep++) g.addColorStop(((i + rep * n) / (n * 3)), L.cols[i]);
        }
        g.addColorStop(1, L.cols[0]);
        c.fillStyle = g;
        c.beginPath(); c.arc(cx, cy, R0 * (1 - li * 0.18), 0, Math.PI * 2); c.fill();
      });
      const core = c.createRadialGradient(cx, cy, 0, cx, cy, R0 * 0.45);
      core.addColorStop(0, 'rgba(255,252,238,0.8)');
      core.addColorStop(0.5, 'rgba(255,240,200,0.25)');
      core.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = core; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) {
        const life = ((t * 0.25 + i / 14) % 1);
        const a = motes[i].a + i;
        const r = R0 * life;
        c.beginPath();
        c.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 3 * (1 - life) + 1, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,245,' + (0.9 * (1 - life)).toFixed(3) + ')';
        c.fill();
      }
      c.restore();
      const rim = c.createRadialGradient(cx, cy, R0 * 0.8, cx, cy, R0);
      rim.addColorStop(0, 'rgba(196,98,59,0)');
      rim.addColorStop(1, 'rgba(196,98,59,0.45)');
      c.fillStyle = rim; c.fillRect(0, 0, W, H);
    }
    c.restore();
  }

  /* ---------- telemetry and ui ---------- */
  function tick(now) {
    const dt = Math.min(0.5, (now - S.lastTick) / 1000);
    S.lastTick = now;
    S.minute += dt * 0.5;
    const day = daylight();
    let draw = 0;
    if (S.phase === 'buildup') draw = 4.5 * Math.min(1, (now - S.phaseT0) / BUILDUP_MS);
    else if (S.phase === 'breakthrough') draw = 9.5;
    else if (S.phase === 'active') draw = 6.4 + 1.2 * Math.sin(now / 1400) + 0.4 * Math.sin(now / 310);
    S.draw += (draw - S.draw) * Math.min(1, dt * 4);
    S.sun += dt * (0.06 * day) - dt * (S.draw / 60);
    S.sun = Math.max(0, Math.min(100, S.sun));
  }

  function setGauge(id, frac, val) {
    const g = document.getElementById(id);
    const fill = g.querySelector('.gauge-fill');
    fill.style.strokeDashoffset = (301.6 * (1 - Math.max(0, Math.min(1, frac)))).toFixed(1);
    g.querySelector('.val').textContent = val;
  }

  const WORDS = {
    idle: function () { return S.route.length ? 'the ring holds ' + S.route.length + ' of seven' : 'the ring is resting'; },
    dialing: function () { return S.pledging ? 'pledging ' + byId[S.pledging].name + '…' : 'the ring holds ' + S.route.length + ' of seven'; },
    pending: function () { return 'seven shares held · the span waits for the hearth'; },
    buildup: function () { return 'the pool gathers its light…'; },
    breakthrough: function () { return 'sunburst'; },
    active: function () { return 'the span stands open to ' + currentRouteName(); },
    folding: function () { return 'folding · shares flowing home'; }
  };

  function updateUi(now, force) {
    if (!force && now - S.lastUi < 150) return;
    S.lastUi = now;

    ringWord.textContent = WORDS[S.phase]();

    // sky
    hourEl.textContent = fmtHour(S.minute);
    const day = daylight();
    skyEl.textContent = day > 0.8 ? 'bright and open' : day > 0.4 ? 'warm and clear' : day > 0.1 ? 'long light' : 'dusk · canopy resting';
    const tt = Math.max(0, Math.min(1, (S.minute - 6 * 60) / (14 * 60)));
    sunDot.setAttribute('cx', (80 - 70 * Math.cos(Math.PI * tt)).toFixed(1));
    sunDot.setAttribute('cy', (62 - 70 * Math.sin(Math.PI * tt)).toFixed(1));

    // gauges
    setGauge('gauge-sun', S.sun / 100, Math.round(S.sun));
    setGauge('gauge-pool', S.route.length / ROUTE_LEN, S.route.length);
    setGauge('gauge-draw', S.draw / 10, S.draw.toFixed(1));
    gaugeNote.textContent = S.phase === 'active' ? 'neighbours are drawing on the pool' :
      S.phase === 'buildup' || S.phase === 'breakthrough' ? 'the pool is gathering' :
      day > 0.1 ? 'the canopy is charging on its own' : 'the canopy rests until dawn';

    // board
    const canPledge = (S.phase === 'idle' || S.phase === 'dialing') && !S.walking && S.route.length + S.queue.length + (S.pledging ? 1 : 0) < ROUTE_LEN;
    WM.forEach(function (w) {
      const b = wmButtons[w.id];
      const pledged = S.route.indexOf(w.id) >= 0;
      const queued = !pledged && (S.pledging === w.id || S.queue.some(function (q) { return q.wid === w.id; }));
      b.classList.toggle('is-pledged', pledged);
      b.classList.toggle('is-queued', queued);
      b.classList.toggle('is-resting', !pledged && !queued && !canPledge);
    });

    // slots
    for (let i = 0; i < ROUTE_LEN; i++) {
      const s = slotEls[i];
      const wid = S.route[i] || null;
      const has = !!wid;
      s.classList.toggle('is-held', has);
      s.classList.toggle('is-next', !has && i === S.route.length && (S.phase === 'idle' || S.phase === 'dialing'));
      if (s.dataset.wid !== (wid || '')) {
        s.dataset.wid = wid || '';
        s.innerHTML = (has ? inlineGlyphSvg(wid, 38) : '') + '<span class="slot-n">' + (i + 1) + '</span>';
        if (has) s.title = byId[wid].name;
      }
    }
    heldWord.textContent = S.route.length === 0 ? (S.queue.length ? 'pledging…' : 'nothing chosen yet') :
      S.route.length < ROUTE_LEN ? S.route.length + ' of seven held' + (S.walking ? ' · from the ledger' : '') :
      'seven held · ' + currentRouteName();

    // ledger
    ROUTES.forEach(function (r) {
      const b = routeButtons[r.id];
      b.classList.toggle('is-walking', S.walking === r.id);
      b.classList.toggle('is-resting', S.phase !== 'idle' && S.walking !== r.id);
    });

    // hearth
    btnOpen.disabled = false;
    btnFold.disabled = false;
    btnOpen.setAttribute('aria-label', S.phase === 'pending' ? 'Open the Span (route held)' : 'Open the Span');
    btnFold.textContent = S.phase === 'active' ? 'Fold the Span' : S.phase === 'idle' && S.route.length === 0 ? 'Let the ring rest' : 'Fold the Span';

    renderLog();
  }

  /* ---------- fit and loop ---------- */
  function fit() {
    const f = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.setProperty('--fit', String(f));
  }
  window.addEventListener('resize', fit);
  fit();

  function frame(now) {
    tick(now);
    render(now);
    updateUi(now, false);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setInterval(function () { const n = performance.now(); tick(n); render(n); updateUi(n, false); }, 250);

  log('the ring is tended today by four neighbours · open hours · latch released');
  updateUi(performance.now(), true);

  /* ---------- read-only window for the test harness ---------- */
  window.__trellis = {
    version: '1.0.0',
    state: function () {
      const now = performance.now();
      return {
        phase: S.phase,
        route: S.route.slice(),
        queue: S.queue.map(function (q) { return q.wid; }),
        walking: S.walking,
        pledging: S.pledging,
        latch: S.latch,
        hoop: tv(S.hoop, now),
        pool: tv(S.pool, now),
        bays: S.bays.map(function (b) { return { open: tv(b.open, now), conduit: tv(b.conduit, now), wid: b.wid }; }),
        sun: S.sun,
        draw: S.draw,
        minute: S.minute,
        fit: getComputedStyle(stage).getPropertyValue('--fit').trim(),
        audio: AUDIO.state(),
        logLength: S.log.length
      };
    },
    waymarks: WM.map(function (w) { return w.id; }),
    routes: ROUTES.map(function (r) { return { id: r.id, marks: r.marks.slice() }; }),
    timings: { BUILDUP_MS: BUILDUP_MS, BREAK_MS: BREAK_MS, FOLD_MS: FOLD_MS, PACE: PACE }
  };
})();
