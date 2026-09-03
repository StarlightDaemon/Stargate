/* WIDDERSHINS — The Gatehouse at Corvane Hollow.
 *
 * State machine, fence-ring, gate leaves, candle, fog, ledger, fit.
 *
 * The fence-ring only turns widdershins (counter-sunwise). Choosing a ward
 * turns the whole fence until that ward's finial reaches the keeper's
 * lantern at the top, where it takes flame from the one candle; a ghost
 * chain then binds it to the last ward caught. Six wards unbar the gate.
 * Nothing opens it but the bell.
 *
 * All motion is a closed-form function of wall-clock time; rendering chases
 * it. A coarse setInterval backstop keeps state moving when rAF starves. */

(function () {
  const D = window.WIDDERSHINS_DATA;
  const A = window.WIDDERSHINS_AUDIO;
  const { WARDS, WARD_BY_ID, ADDRESS_LENGTH, ROADS, HANDS, sigilPath } = D;
  const SVG = 'http://www.w3.org/2000/svg';
  const N = WARDS.length;
  const STEP = 360 / N;
  const CX = 500, CY = 500;
  const R_PLATE = 350, R_OUTER = 380;

  const PACE = {
    hand:       { degPerSec: 200, minMs: 800, takeMs: 500 },
    remembered: { degPerSec: 420, minMs: 350, takeMs: 250 }
  };
  const T_BUILDUP = 2400, T_BREAK = 800, T_DARK_HOLD = 1200, T_REFUSED = 1500;
  const HAND_GAP = 120;

  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(SVG, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const pt = (angleDeg, r) => { const a = (angleDeg - 90) * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const norm = (deg) => ((deg % 360) + 360) % 360;

  /* ------------------------------------------------------------ state */
  const S = {
    stage: 'idle', stageT0: performance.now(),
    locked: [], queue: [], turning: null, preset: null,
    rot: 0, vel: 0, salt: false,
    warnText: '', warnHold: false, warnTimer: null,
    dest: null, road: null, dark: false,
    fit: '1', lastTick: performance.now(), ghostA: 0
  };

  /* ------------------------------------------------------------ DOM refs */
  const body = document.body;
  const fenceSvg = $('#fenceSvg');
  const fence = $('#fence');
  const chain = $('#chain');
  const wisps = $('#wisps');
  const ghost = $('#ghost');
  const rays = $('#rays');
  const lantern = $('#lantern');
  const statusEl = $('#status');
  const warnEl = $('#warn');
  const logEl = $('#log');
  const wardCol = $('#wards');
  const keyRow = $('#keys');
  const led = {
    turning: $('#ledTurning'), road: $('#ledRoad'), note: $('#ledNote'), fence: $('#ledFence'), hand: $('#ledHand'), salt: $('#saltState'), stones: []
  };

  /* ------------------------------------------------------------ build the fence-ring */
  const pickets = {};
  function buildRing() {
    el('circle', { class: 'rail', cx: CX, cy: CY, r: R_OUTER }, fence);
    el('circle', { class: 'rail rail-in', cx: CX, cy: CY, r: 320 }, fence);
    // rail rivets: 26 small ticks between pickets
    for (let i = 0; i < N * 2; i++) {
      const a = i * STEP / 2;
      const [x1, y1] = pt(a, 374), [x2, y2] = pt(a, 386);
      el('line', { class: 'rivet', x1, y1, x2, y2 }, fence);
    }
    fence.appendChild(chain);
    WARDS.forEach((w, i) => {
      const g = el('g', { class: 'picket', 'data-ward': w.id, transform: `rotate(${i * STEP} ${CX} ${CY})` }, fence);
      el('line', { class: 'shaft', x1: 500, y1: 210, x2: 500, y2: 78 }, g);
      el('path', { class: 'finial', d: 'M500 62 L511 92 L500 85 L489 92 Z' }, g);
      el('line', { class: 'collar', x1: 488, y1: 100, x2: 512, y2: 100 }, g);
      el('path', { class: 'plate', d: 'M500 120 L526 150 L500 180 L474 150 Z' }, g);
      el('path', { class: 'sigil', d: sigilPath(w.sigil, 36, 6), transform: 'translate(482 132)' }, g);
      el('circle', { class: 'ember', cx: 500, cy: 70, r: 4 }, g);
      pickets[w.id] = g;
    });
    for (let i = 0; i < 16; i++) {
      const a = i * 22.5;
      const [x1, y1] = pt(a, 300), [x2, y2] = pt(a, 490);
      el('line', { x1, y1, x2, y2 }, rays);
    }
    for (let i = 0; i < 12; i++) el('circle', { r: 3 + (i % 3) * 2, cx: CX, cy: CY }, wisps);
  }

  function chainLink(fromId, toId) {
    const ia = WARDS.findIndex((w) => w.id === fromId), ib = WARDS.findIndex((w) => w.id === toId);
    const a1 = ia * STEP, a2 = ib * STEP;
    const diff = norm(a2 - a1);
    const sweep = diff <= 180 ? 1 : 0;
    const large = 0;
    const [x1, y1] = pt(a1, R_PLATE), [x2, y2] = pt(a2, R_PLATE);
    const p = el('path', { class: 'chain', d: `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R_PLATE} ${R_PLATE} 0 ${large} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}` }, chain);
    const len = (Math.min(diff, 360 - diff) / 360) * 2 * Math.PI * R_PLATE;
    p.style.setProperty('--len', len.toFixed(0));
    return p;
  }

  /* ------------------------------------------------------------ build the ward fence and keys */
  function buildControls() {
    WARDS.forEach((w) => {
      const b = document.createElement('button');
      b.className = 'ward'; b.dataset.ward = w.id; b.type = 'button';
      b.setAttribute('aria-label', 'ward ' + w.name);
      b.innerHTML = `<svg viewBox="0 0 36 36" aria-hidden="true"><path d="${sigilPath(w.sigil, 36, 6)}"/></svg><span class="wname">${w.name}</span>`;
      b.addEventListener('click', () => onWard(w.id));
      wardCol.appendChild(b);
    });
    HANDS.forEach((h) => {
      const b = document.createElement('button');
      b.className = 'key'; b.dataset.key = h.id; b.type = 'button';
      b.setAttribute('aria-label', 'remembered hand: ' + h.road);
      b.innerHTML = `<svg viewBox="0 0 40 96" aria-hidden="true"><path class="hook" d="M20 2 v10"/><circle cx="20" cy="22" r="10"/><circle cx="20" cy="22" r="4"/><path d="M20 32 v54"/><path d="M20 70 h9 v6 h-9 M20 80 h6 v6 h-6"/></svg><span class="kroad">${h.road}</span><span class="khand">${h.hand}</span>`;
      b.addEventListener('click', () => onKey(h.id));
      keyRow.appendChild(b);
    });
    led.stones = Array.from(document.querySelectorAll('.wardstone'));
  }

  /* ------------------------------------------------------------ ledger and log */
  function log(text, cls) {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    logEl.prepend(p);
    while (logEl.children.length > 8) logEl.lastChild.remove();
  }
  function showWarn(text, blink, hold) {
    S.warnText = text; S.warnHold = !!hold;
    warnEl.textContent = text;
    warnEl.className = 'on' + (blink ? ' blink' : '');
    clearTimeout(S.warnTimer);
    if (!hold) S.warnTimer = setTimeout(() => { if (!S.warnHold) clearWarn(); }, 2400);
  }
  function clearWarn() { S.warnText = ''; S.warnHold = false; warnEl.className = ''; warnEl.textContent = ''; }
  function refuse(text, blink) {
    showWarn(text, blink, S.salt);
    if (S.salt) A.refuse(); else A.clang(false);
    log(text, 'refused');
  }
  function setStatus(text) { statusEl.textContent = text; }

  function setStage(stage) {
    S.stage = stage; S.stageT0 = performance.now();
    body.dataset.stage = stage;
  }
  function stageElapsed() { return performance.now() - S.stageT0; }

  /* ------------------------------------------------------------ turning the fence */
  function targetFor(wardId) {
    const i = WARDS.findIndex((w) => w.id === wardId);
    return -i * STEP; // finial i sits at angle i*STEP in fence coords; rot + i*STEP ≡ 0 brings it to the lantern
  }
  function startTurn(wardId, pace) {
    const P = PACE[pace];
    const target = targetFor(wardId);
    let delta = norm(S.rot - target); // widdershins = decreasing rot
    if (delta < 0.5) delta = 360; // it will not catch without turning
    const dur = Math.max(P.minMs, (delta / P.degPerSec) * 1000);
    S.turning = { ward: wardId, from: S.rot, to: S.rot - delta, t0: performance.now(), dur, catchAt: null, takeMs: P.takeMs, pace, ticks: 0, delta };
    body.dataset.turning = '1';
    pickets[wardId].classList.add('turning');
    wardBtn(wardId).classList.add('turning');
    A.creakStart(dur / 1000);
    const w = WARD_BY_ID[wardId];
    log(`${pace === 'hand' ? 'the fence turns' : 'the iron turns itself'} widdershins to ${w.name} — ${Math.round(delta)}°`);
    setStatus(pace === 'hand' ? 'THE FENCE TURNS WIDDERSHINS' : 'A REMEMBERED HAND TURNS THE IRON');
    led.turning.textContent = w.name + (pace === 'hand' ? '' : ' (remembered)');
  }
  function onCatch(T) {
    A.creakStop(); A.take();
    pickets[T.ward].classList.remove('turning');
    pickets[T.ward].classList.add('taking');
    lantern.classList.remove('flare'); void lantern.offsetWidth; lantern.classList.add('flare');
  }
  function finishCatch(T) {
    const w = WARD_BY_ID[T.ward];
    pickets[T.ward].classList.remove('taking');
    pickets[T.ward].classList.add('caught');
    wardBtn(T.ward).classList.remove('turning');
    wardBtn(T.ward).classList.add('caught');
    if (S.locked.length) chainLink(S.locked[S.locked.length - 1], T.ward);
    S.locked.push(T.ward);
    led.stones[S.locked.length - 1].classList.add('lit');
    S.turning = null; body.dataset.turning = '';
    led.turning.textContent = 'still';
    log(`${w.name} takes flame at the lantern — ${S.locked.length} of ${ADDRESS_LENGTH} caught`, 'caught');
    if (S.locked.length >= ADDRESS_LENGTH) {
      const road = ROADS[S.locked.join(',')] || { name: 'AN UNLISTED ROAD', note: 'no entry in the gate-book for this turning' };
      S.road = road; S.dest = road.name; S.dark = !!road.dark;
      S.preset = null; S.queue = [];
      document.querySelectorAll('.key.active').forEach((k) => k.classList.remove('active'));
      setStage('pending');
      setStatus('SIX WARDS CAUGHT · THE GATE STANDS UNBARRED');
      led.road.textContent = road.name; led.note.textContent = road.note;
      log('six wards bound. the bar lifts. the gate stands unbarred — ring the bell, or bar it.', 'mark');
      A.clang(false);
      return;
    }
    setStatus('THE GATE STANDS BARRED');
    if (S.preset) { S.preset.nextAt = performance.now() + HAND_GAP; return; }
    if (S.queue.length) startTurn(S.queue.shift(), 'hand');
  }
  const wardBtn = (id) => wardCol.querySelector(`.ward[data-ward="${id}"]`);

  /* ------------------------------------------------------------ the bell: three stages */
  function ringBell() {
    setStage('buildup');
    setStatus('THE BELL IS RINGING');
    S.vel = 0;
    A.bell(0.35, 130.8);
    setTimeout(() => { if (S.stage === 'buildup') A.bell(0.3, 130.8); }, 800);
    setTimeout(() => { if (S.stage === 'buildup') A.bell(0.2, 130.8); }, 1600);
    A.windLevel(0.12, 2);
    log('the bell-pull is drawn. the bell tolls. the fence begins to spin.', 'mark');
  }
  function breakthrough() {
    setStage('breakthrough');
    setStatus('THE GATE OPENS');
    A.hinge(false); A.raven(2);
    log('the leaves fling open. something on the far side draws breath.', 'mark');
  }
  function goActive() {
    setStage('active');
    setStatus('THE GATE STANDS OPEN ON ' + S.dest);
    A.droneStart(); A.windLevel(0.09, 1);
    log('the gate stands open on ' + S.dest.toLowerCase() + '. ' + S.road.note + '.', 'caught');
  }
  function goRefused() {
    setStage('refused');
    setStatus('SOMETHING KNOCKED BACK · THE GATE SHUT ITSELF');
    A.hinge(true); A.clang(true); A.snuff();
    lantern.classList.add('out');
    log('nothing answers from ' + S.dest.toLowerCase() + '. something knocks back. the leaves slam and the candle goes out.', 'refused');
    setTimeout(() => lantern.classList.remove('out'), 1400);
  }

  /* ------------------------------------------------------------ bar the gate (disengage) */
  function barGate(reason) {
    const wasOpen = S.stage === 'active' || S.stage === 'breakthrough';
    const hadWork = S.locked.length || S.turning || S.queue.length || S.preset || S.stage !== 'idle';
    if (S.stage === 'active' || S.stage === 'breakthrough') { A.hinge(true); A.clang(true); }
    else if (hadWork) A.clang(false);
    A.creakStop(); A.droneStop(); A.windLevel(0.045, 1.5);
    S.locked = []; S.queue = []; S.turning = null; S.preset = null; S.vel = 0;
    S.dest = null; S.road = null; S.dark = false;
    body.dataset.turning = '';
    Object.values(pickets).forEach((p) => p.classList.remove('caught', 'taking', 'turning'));
    while (chain.firstChild) chain.firstChild.remove();
    document.querySelectorAll('.ward.caught, .ward.turning').forEach((b) => b.classList.remove('caught', 'turning'));
    document.querySelectorAll('.key.active').forEach((k) => k.classList.remove('active'));
    led.stones.forEach((s) => s.classList.remove('lit'));
    led.turning.textContent = 'still'; led.road.textContent = '—'; led.note.textContent = ''; led.hand.textContent = 'none';
    lantern.classList.remove('out');
    setStage('idle');
    setStatus('THE GATE STANDS BARRED');
    if (reason) log(reason, 'mark');
    else log(wasOpen ? 'the leaves are dragged shut and the bar drops. every ward goes dark.' : hadWork ? 'the bar drops. every ward goes dark; the fence rests where it stopped.' : 'the gate is already barred.', hadWork ? 'mark' : undefined);
  }

  /* ------------------------------------------------------------ handlers */
  function gesture() { A.ensure(); A.resume(); A.ambience(); }
  function onWard(id) {
    gesture();
    const w = WARD_BY_ID[id];
    if (S.salt) return refuse('THE SALT HOLDS — the iron will not turn while the line is laid', true);
    if (S.stage === 'pending') return refuse('the gate stands unbarred — ring the bell, or bar it');
    if (S.stage !== 'idle') return refuse(S.stage === 'active' ? 'the gate stands open — bar it before turning the fence' : 'the bell is ringing — nothing turns by hand now');
    if (S.preset) return refuse('a remembered hand is on the iron — wait, or bar the gate');
    if (S.locked.includes(id) || S.queue.includes(id) || (S.turning && S.turning.ward === id)) return refuse('the ward ' + w.name + ' is already caught');
    if (S.locked.length + S.queue.length + (S.turning ? 1 : 0) >= ADDRESS_LENGTH) return refuse('six wards are already bound');
    if (S.turning) { S.queue.push(id); wardBtn(id).classList.add('turning'); log(w.name + ' waits its turn'); return; }
    startTurn(id, 'hand');
  }
  function onKey(id) {
    gesture();
    const h = HANDS.find((x) => x.id === id);
    if (S.salt) return refuse('THE SALT HOLDS — no remembered hand can cross it', true);
    if (S.stage !== 'idle' || S.locked.length || S.turning || S.queue.length || S.preset) return refuse('the iron only remembers from rest — bar the gate first');
    S.preset = { id, i: 0, nextAt: performance.now() };
    keyRow.querySelector(`.key[data-key="${id}"]`).classList.add('active');
    led.hand.textContent = h.hand;
    log('a key is lifted from its hook: ' + h.hand + ' takes the iron.', 'mark');
  }
  function onBell() {
    gesture();
    $('#bell').classList.remove('tug'); void $('#bell').offsetWidth; $('#bell').classList.add('tug');
    if (S.salt) return refuse('THE SALT HOLDS — the bell will not answer across the line', true);
    if (S.stage === 'pending') return ringBell();
    if (S.stage === 'active') return refuse('the gate already stands open');
    if (S.stage === 'buildup' || S.stage === 'breakthrough') return refuse('the bell is already ringing');
    if (S.stage === 'refused') return refuse('the gate is still shuddering shut');
    if (!S.locked.length && !S.turning) return refuse('no ward is caught — the bell answers only a bound fence');
    return refuse('only ' + S.locked.length + ' of six wards caught — the bar still holds');
  }
  function onBar() { gesture(); barGate(); }
  function onSalt() {
    gesture();
    S.salt = !S.salt;
    body.classList.toggle('salt', S.salt);
    const b = $('#salt');
    b.setAttribute('aria-checked', String(S.salt));
    led.salt.textContent = S.salt ? 'LAID' : 'UNLAID';
    if (S.salt) {
      A.clang(false);
      showWarn('THE SALT LINE IS LAID — NOTHING PASSES THE THRESHOLD', false, true);
      log('a line of salt is poured across the threshold. nothing passes.', 'mark');
    } else {
      clearWarn();
      log('the salt is swept away. the threshold is open to the iron again.');
    }
  }

  /* ------------------------------------------------------------ tick: state advances on wall-clock time */
  function tick(now) {
    const dt = Math.min(0.1, (now - S.lastTick) / 1000); S.lastTick = now;
    const T = S.turning;
    if (T) {
      if (T.catchAt === null) {
        const p = Math.min(1, (now - T.t0) / T.dur);
        S.rot = T.from + (T.to - T.from) * ease(p);
        const ticks = Math.floor((T.from - S.rot) / (STEP / 2));
        if (ticks > T.ticks) { T.ticks = ticks; A.ratchet(); }
        if (p >= 1) { S.rot = T.to; T.catchAt = now; onCatch(T); }
      } else if (now - T.catchAt >= T.takeMs) finishCatch(T);
    } else if (S.preset && S.stage === 'idle' && now >= S.preset.nextAt) {
      const h = HANDS.find((x) => x.id === S.preset.id);
      if (S.preset.i < h.wards.length) { startTurn(h.wards[S.preset.i++], 'remembered'); }
    }
    const e = stageElapsed();
    if (S.stage === 'buildup') {
      S.vel = 90 * (e / 1000);            // °/s, accelerating widdershins
      S.rot -= S.vel * dt;
      if (e >= T_BUILDUP) breakthrough();
    } else if (S.stage === 'breakthrough') {
      S.vel = Math.max(20, 216 - (e / T_BREAK) * 196);
      S.rot -= S.vel * dt;
      if (S.dark ? e >= T_DARK_HOLD : e >= T_BREAK) (S.dark ? goRefused : goActive)();
    } else if (S.stage === 'active') {
      S.vel = 20; S.rot -= S.vel * dt;
    } else if (S.stage === 'refused') {
      S.vel = 0;
      if (e >= T_REFUSED) barGate('the gate shut itself. every ward is dark. the candle relights, smaller than before.');
    }
    render(now);
  }

  function render(now) {
    fence.setAttribute('transform', `rotate(${S.rot.toFixed(2)} ${CX} ${CY})`);
    led.fence.textContent = Math.round(norm(S.rot)) + '° · ' + (S.turning || S.vel ? 'turning' : 'still');
    // ghost-light travelling the outer rail (ambient, never dials)
    S.ghostA = (now / 1000) * 28;
    const [gx, gy] = pt(S.ghostA, R_OUTER);
    ghost.setAttribute('cx', gx.toFixed(1)); ghost.setAttribute('cy', gy.toFixed(1));
    ghost.setAttribute('opacity', (0.35 + 0.35 * Math.sin(now / 700)).toFixed(2));
    // wisps spiralling in through the open gate
    if (S.stage === 'active' || S.stage === 'breakthrough') {
      const t = now / 1000;
      wisps.childNodes.forEach((c, i) => {
        const r = 290 - ((t * 55 + i * 47) % 290);
        const a = -t * 70 + i * 30 + r * 0.9;
        const [x, y] = pt(a, r);
        c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
        c.setAttribute('opacity', (r / 290 * 0.9).toFixed(2));
      });
    }
    $('#aperture').style.setProperty('--spin', ((now / 1000) * 12 % 360).toFixed(1) + 'deg');
  }

  /* ------------------------------------------------------------ fit to viewport (bare ratio, see build standards) */
  function fit() {
    const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty('--fit', String(k));
    S.fit = String(k);
  }

  /* ------------------------------------------------------------ boot */
  buildRing();
  buildControls();
  fit();
  window.addEventListener('resize', fit);
  $('#bell').addEventListener('click', onBell);
  $('#bar').addEventListener('click', onBar);
  $('#salt').addEventListener('click', onSalt);
  $('#guideBtn').addEventListener('click', () => { gesture(); $('#guide').hidden = false; });
  $('#guideClose').addEventListener('click', () => { $('#guide').hidden = true; });
  $('#soundBtn').addEventListener('click', () => {
    gesture();
    const on = !A.isEnabled(); A.setEnabled(on);
    $('#soundBtn').textContent = on ? 'SOUND ON' : 'SOUND OFF';
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#guide').hidden = true; });
  setStage('idle');
  setStatus('THE GATE STANDS BARRED');
  log('the gatehouse is cold. the fence rests where the last hand left it.');
  log('choose a ward; the fence turns widdershins until it reaches the lantern.');

  let rafOn = false;
  function frame(now) { rafOn = true; tick(now); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  setInterval(() => { if (!rafOn) tick(performance.now()); rafOn = false; }, 50);

  /* ------------------------------------------------------------ test surface */
  window.__widdershins = {
    state: () => ({
      stage: S.stage, stageElapsed: Math.round(stageElapsed()),
      locked: S.locked.slice(), queue: S.queue.slice(),
      turning: S.turning ? { ward: S.turning.ward, captured: S.turning.catchAt !== null, pace: S.turning.pace, delta: Math.round(S.turning.delta) } : null,
      preset: S.preset ? S.preset.id : null,
      salt: S.salt, warn: warnEl.className, warnText: S.warnText,
      fit: S.fit, rot: Math.round(norm(S.rot) * 10) / 10, vel: Math.round(S.vel),
      destination: S.dest, dark: S.dark,
      chainLinks: chain.childElementCount, caughtPickets: fence.querySelectorAll('.picket.caught').length,
      stonesLit: led.stones.filter((s) => s.classList.contains('lit')).length
    }),
    wardAngleAtLantern: (id) => norm(S.rot + WARDS.findIndex((w) => w.id === id) * STEP)
  };
})();
