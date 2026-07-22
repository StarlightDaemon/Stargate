// VANTAGE drill bench. Loaded only via ?drill=… or window.__vantage.drill().
// Every driver hit-tests document.elementFromPoint at the control's rendered
// screen position and dispatches the event train on WHATEVER is actually
// there — occlusion fails loudly instead of being masked.

const V = () => window.__vantage;

// ---------------------------------------------------------------------------
// reporting
const results = [];
let overlay = null;

function logLine(text, cls) {
  console.log('[drill] ' + text);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'drillOverlay';
    // must never eat hit-tests (STENTOR lesson): pointer-events none
    overlay.style.cssText =
      'position:fixed;left:8px;top:8px;z-index:9999;pointer-events:none;' +
      'font:11px "Lucida Console",monospace;color:#9f9;max-width:520px;' +
      'background:rgba(0,0,0,0.72);padding:6px 8px;border-radius:4px;' +
      'white-space:pre-wrap;max-height:80vh;overflow:hidden;';
    document.body.appendChild(overlay);
  }
  const line = document.createElement('div');
  line.textContent = text;
  if (cls === 'fail') line.style.color = '#f66';
  if (cls === 'info') line.style.color = '#aac';
  overlay.appendChild(line);
  while (overlay.children.length > 46) overlay.removeChild(overlay.firstChild);
}

function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
  logLine(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`, ok ? 'pass' : 'fail');
}

// ---------------------------------------------------------------------------
// timing: poll-count-bounded waits (never wall-clock-bounded — frozen panes
// expire wall clocks spuriously); each poll drives render() so sim ticks.
// Sleeps ride a dedicated worker heartbeat: page timers clamp to 1 s (or
// 1/min under intensive throttling) in hidden panes, workers do not.
const beat = (() => {
  let waiters = [];
  try {
    const w = new Worker(URL.createObjectURL(new Blob(
      ['setInterval(() => postMessage(1), 50);'], { type: 'text/javascript' })));
    w.onmessage = () => { const ws = waiters; waiters = []; for (const fn of ws) fn(); };
    return () => new Promise(res => waiters.push(res));
  } catch (e) {
    return () => new Promise(res => setTimeout(res, 50));
  }
})();
const sleep = async ms => {
  for (let i = 0, n = Math.max(1, Math.ceil(ms / 50)); i < n; i++) await beat();
};

async function waitFor(name, cond, maxPolls = 900, stepMs = 60) {
  for (let i = 0; i < maxPolls; i++) {
    V().render();
    if (cond()) return true;
    await sleep(stepMs);
  }
  check(name, false, `condition never held in ${maxPolls} polls`);
  return false;
}

// ---------------------------------------------------------------------------
// event drivers — all hit-tested at rendered position
function describe(el) {
  if (!el) return '(nothing)';
  return el.id ? '#' + el.id : el.tagName + '.' + String(el.className).split(' ')[0];
}

function realClick(el, xFrac = 0.5, yFrac = 0.5) {
  V().render(); // sync DOM classes to sim state before hit-testing
  const r = el.getBoundingClientRect();
  const x = r.left + r.width * xFrac;
  const y = r.top + r.height * yFrac;
  const hit = document.elementFromPoint(x, y);
  if (hit) {
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      const Ev = type.startsWith('pointer') ? PointerEvent : MouseEvent;
      hit.dispatchEvent(new Ev(type, {
        bubbles: true, cancelable: true, clientX: x, clientY: y, view: window,
      }));
    }
  }
  return { hit, within: !!hit && (el === hit || el.contains(hit)), x, y };
}

function clickControl(name, el, xFrac = 0.5, yFrac = 0.5) {
  const res = realClick(el, xFrac, yFrac);
  if (!res.within) {
    check(`${name} reachable`, false,
      `cursor at (${Math.round(res.x)},${Math.round(res.y)}) lands on ${describe(res.hit)}`);
  }
  return res;
}

async function stepKnobTo(name, el, getIdx, targetIdx, mod) {
  for (let guard = 0; guard < 40; guard++) {
    const cur = getIdx();
    if (cur === targetIdx) return true;
    let dir;
    if (mod) {
      const fwd = (targetIdx - cur + mod) % mod;
      dir = (fwd !== 0 && fwd <= mod / 2) ? 1 : -1;
    } else {
      dir = targetIdx > cur ? 1 : -1;
    }
    clickControl(name, el, dir > 0 ? 0.82 : 0.18);
    await sleep(25);
  }
  check(`${name} steps to ${targetIdx}`, false, 'never arrived');
  return false;
}

// ---------------------------------------------------------------------------
// scenario helpers
const S = () => V().state;
const el = id => document.getElementById(id);

async function ensureHT(on) {
  if (S().ht !== on) clickControl('H.T. toggle', el('htToggle'));
  await sleep(20);
}

async function ensureCover(open) {
  V().render();
  if (S().coverOpen === open) return;
  if (open) clickControl('cover lid', el('inductCover'));
  else clickControl('cover hinge', el('coverHinge'));
  await sleep(20);
}

async function normalize() {
  // induct off, cover shut, gates parked off-target, solution cleared
  V().render();
  if (S().induct) clickControl('INDUCT switch', el('inductSwitch'));
  await sleep(20);
  await ensureCover(false);
  if (S().ht) {
    await stepKnobTo('BEARING knob', el('knobBearing'), () => S().bearingIdx, 0, 24);
    await stepKnobTo('RANGE knob', el('knobRange'), () => S().rangeIdx, 3);
  }
}

function scopeCenterBrightness() {
  const c = document.getElementById('scope');
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(c.width / 2 - 16, c.height / 2 - 16, 32, 32).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
  return sum / (d.length / 4);
}

// ---------------------------------------------------------------------------
// SCENARIO: geometry — every control reachable at its rendered position,
// knob internals contained, no unintended overlaps among interactive controls.
async function scenarioGeometry() {
  logLine('— GEOMETRY AUDIT —', 'info');

  const probes = [
    ['H.T. toggle', el('htToggle'), 0.5, 0.5],
    ['BEARING knob left', el('knobBearing'), 0.18, 0.5],
    ['BEARING knob right', el('knobBearing'), 0.82, 0.5],
    ['RANGE knob left', el('knobRange'), 0.18, 0.5],
    ['RANGE knob right', el('knobRange'), 0.82, 0.5],
    ['SLOT knob left', el('knobSlot'), 0.18, 0.5],
    ['SLOT knob right', el('knobSlot'), 0.82, 0.5],
    ['CHALLENGE button', el('btnChallenge'), 0.5, 0.5],
    ['RECALL button', el('btnRecall'), 0.5, 0.5],
    ['cover hinge', el('coverHinge'), 0.5, 0.5],
  ];
  V().render();
  for (const [name, target, xf, yf] of probes) {
    const r = target.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width * xf, r.top + r.height * yf);
    const within = !!hit && (target === hit || target.contains(hit));
    check(`geometry: ${name} reachable`, within, within ? '' : `occluded by ${describe(hit)}`);
  }

  // cover closed → the lid is what the cursor meets at the switch position
  await ensureCover(false);
  V().render();
  {
    const r = el('inductSwitch').getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const lidThere = !!hit && el('inductCover').contains(hit);
    check('geometry: closed cover shields INDUCT switch', lidThere,
      `point resolves to ${describe(hit)}`);
  }
  // cover open → the switch itself is reachable
  await ensureCover(true);
  V().render();
  document.body.offsetHeight;
  {
    const r = el('inductSwitch').getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const within = !!hit && (el('inductSwitch') === hit || el('inductSwitch').contains(hit));
    check('geometry: raised cover frees INDUCT switch', within,
      `point resolves to ${describe(hit)}`);
  }
  await ensureCover(false);

  // knob internals anchored to their own knob (Augur cap-anchoring regression)
  for (const id of ['knobBearing', 'knobRange', 'knobSlot']) {
    const k = el(id);
    const cap = k.querySelector('.cap');
    check(`geometry: #${id} cap anchored`, cap.offsetParent === k,
      `offsetParent=${describe(cap.offsetParent)}`);
  }

  // pairwise overlap among distinct interactive controls (layout boxes);
  // the cover/switch/hinge assembly overlaps by design and is excluded.
  const ids = ['htToggle', 'knobBearing', 'knobRange', 'knobSlot', 'btnChallenge', 'btnRecall'];
  let overlaps = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = el(ids[i]).getBoundingClientRect();
      const b = el(ids[j]).getBoundingClientRect();
      const sep = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
      if (!sep) overlaps.push(ids[i] + '×' + ids[j]);
    }
  }
  check('geometry: no unintended control overlaps', overlaps.length === 0, overlaps.join(', '));
}

// ---------------------------------------------------------------------------
// SCENARIO: manual — full cold-start dial onto BAKER LIGHT (120° / 175 mi)
async function scenarioManual() {
  logLine('— MANUAL DIAL: BAKER LIGHT —', 'info');
  const sim = V().sim;

  if (S().ht) await ensureHT(false); // true cold start
  await normalize().catch(() => {});
  await ensureHT(true);
  check('manual: H.T. up, sweep running', S().ht);

  await stepKnobTo('BEARING knob', el('knobBearing'), () => S().bearingIdx, 120 / 15, 24);
  await stepKnobTo('RANGE knob', el('knobRange'), () => S().rangeIdx, (175 - 25) / 25);
  check('manual: gates straddle BAKER LIGHT',
    !!S().track && S().track.destId === 'baker',
    S().track ? S().track.destId : 'no track');

  const sawPaint = await waitFor('manual: paint accumulates',
    () => sim.paintsOf(S(), V().now()) >= 1, 900, 60);
  if (sawPaint) check('manual: paint accumulates', true);
  const lockOk = await waitFor('manual: LOCK after 3 paints', () => S().locked, 900, 60);
  if (lockOk) check('manual: LOCK after 3 paints', true);

  clickControl('CHALLENGE button', el('btnChallenge'));
  const verOk = await waitFor('manual: signature verifies', () => S().verified, 900, 60);
  if (verOk) check('manual: signature verifies', true, 'SIG ' + S().sig);
  check('manual: solution auto-written to drum',
    S().slots.some(s => s && s.destId === 'baker'));

  const preBright = scopeCenterBrightness();
  await ensureCover(true);
  clickControl('INDUCT switch', el('inductSwitch'));
  const openOk = await waitFor('manual: aperture opens', () => S().open, 300, 60);
  if (openOk) check('manual: aperture opens', true);
  await sleep(1800); // let the pool flood the tube (grow completes at ~1.4 s)
  V().render();
  const postBright = scopeCenterBrightness();
  check('manual: scope tube floods (pixels)', postBright > preBright && postBright > 180,
    `${preBright.toFixed(1)} → ${postBright.toFixed(1)}`);

  // shut down: switch off, cover shut
  clickControl('INDUCT switch', el('inductSwitch'));
  await sleep(30);
  check('manual: aperture closes on switch-off', !S().open);
  await ensureCover(false);
}

// ---------------------------------------------------------------------------
// SCENARIO: store — drum recall fast dial (slot 1, ABLE ORCHARD, pre-seeded)
async function scenarioStore() {
  logLine('— DRUM RECALL FAST DIAL: ABLE ORCHARD —', 'info');
  await ensureHT(true);
  await normalize();
  check('store: no solution before recall', !S().verified && !S().locked);

  await stepKnobTo('SLOT knob', el('knobSlot'), () => S().slotIdx, 0, 4);
  check('store: slot 1 holds ABLE ORCHARD',
    !!S().slots[0] && S().slots[0].destId === 'able');

  const t0 = V().now();
  clickControl('RECALL button', el('btnRecall'));
  const ok = await waitFor('store: drum replay verifies', () => S().verified, 900, 60);
  const elapsed = V().now() - t0;
  if (ok) check('store: drum replay verifies', true, `${Math.round(elapsed)} ms`);
  // fast by mechanism: replay must beat even a single sweep revolution
  check('store: recall skips the sweep', elapsed < V().sim.SWEEP_PERIOD * 2,
    `${Math.round(elapsed)} ms vs ${V().sim.SWEEP_PERIOD * 3} ms sweep-lock floor`);
  check('store: gates laid on ABLE ORCHARD',
    V().sim.bearingOf(S()) === 45 && V().sim.rangeOf(S()) === 100);

  await ensureCover(true);
  clickControl('INDUCT switch', el('inductSwitch'));
  await sleep(50);
  V().render();
  check('store: aperture opens from recall', S().open);
  clickControl('INDUCT switch', el('inductSwitch'));
  await sleep(30);
  await ensureCover(false);
}

// ---------------------------------------------------------------------------
// SCENARIO: guards — interlocks hold
async function scenarioGuards() {
  logLine('— GUARDS —', 'info');
  const sim = V().sim;
  await ensureHT(true);
  await normalize();

  // 1. induct with no verified solution → springs back with fault
  await ensureCover(true);
  clickControl('INDUCT switch', el('inductSwitch'));
  await sleep(40);
  V().render();
  check('guards: unverified INDUCT refused', !S().open && !S().induct,
    'fault: ' + (S().fault || '(none)'));
  await ensureCover(false);

  // 2. closed cover physically shields the switch — click the switch's own
  // screen position and confirm the sim never sees it
  {
    const before = S().induct;
    const r = el('inductSwitch').getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (hit) {
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        const Ev = type.startsWith('pointer') ? PointerEvent : MouseEvent;
        hit.dispatchEvent(new Ev(type, {
          bubbles: true, cancelable: true,
          clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, view: window,
        }));
      }
    }
    await sleep(30);
    V().render();
    check('guards: closed cover blocks switch throw',
      S().induct === before && !S().open,
      `click landed on ${describe(hit)}`);
    // that click opened the lid (by design); shut it again
    await ensureCover(false);
  }

  // 3. knob motion breaks a building track
  await stepKnobTo('BEARING knob', el('knobBearing'), () => S().bearingIdx, 210 / 15, 24);
  await stepKnobTo('RANGE knob', el('knobRange'), () => S().rangeIdx, (75 - 25) / 25);
  await waitFor('guards: track building on DOG RIVER',
    () => sim.paintsOf(S(), V().now()) >= 1, 900, 60);
  clickControl('BEARING knob', el('knobBearing'), 0.82);
  await sleep(30);
  V().render();
  check('guards: knob motion drops the track', !S().track && !S().locked);

  // 4. dark station answers NO JOY and cannot be inducted
  await stepKnobTo('BEARING knob', el('knobBearing'), () => S().bearingIdx, 255 / 15, 24);
  await stepKnobTo('RANGE knob', el('knobRange'), () => S().rangeIdx, (200 - 25) / 25);
  const locked = await waitFor('guards: CHARLIE GLASS locks', () => S().locked, 900, 60);
  if (locked) check('guards: CHARLIE GLASS locks', true);
  clickControl('CHALLENGE button', el('btnChallenge'));
  const nj = await waitFor('guards: dark station answers NO JOY', () => S().noJoy, 900, 60);
  if (nj) check('guards: dark station answers NO JOY', true);
  check('guards: NO JOY blocks verification', !S().verified);
  await ensureCover(true);
  clickControl('INDUCT switch', el('inductSwitch'));
  await sleep(40);
  V().render();
  check('guards: NO JOY blocks INDUCT', !S().open);
  await ensureCover(false);

  // 5. empty drum slot refuses recall
  await normalize();
  await stepKnobTo('SLOT knob', el('knobSlot'), () => S().slotIdx, 3, 4);
  clickControl('RECALL button', el('btnRecall'));
  await sleep(40);
  V().render();
  check('guards: empty drum slot refused', !S().recall && !S().verified,
    'fault: ' + (S().fault || '(none)'));
  await stepKnobTo('SLOT knob', el('knobSlot'), () => S().slotIdx, 0, 4);
}

// ---------------------------------------------------------------------------
export async function drill(mode = 'all') {
  logLine(`VANTAGE drill: ${mode} — visibility=${document.visibilityState}`, 'info');
  const t0 = performance.now();
  // force-settle ALL transitions for the whole drill: frozen mid-transition
  // covers/levers in rAF-starved panes otherwise corrupt occlusion judgments
  const settleStyle = document.createElement('style');
  settleStyle.textContent = '*{transition:none !important;animation:none !important;}';
  document.head.appendChild(settleStyle);
  document.body.offsetHeight; // reflow
  try {
    if (mode === 'geometry' || mode === 'all') await scenarioGeometry();
    if (mode === 'manual' || mode === 'all') await scenarioManual();
    if (mode === 'store' || mode === 'all') await scenarioStore();
    if (mode === 'guards' || mode === 'all') await scenarioGuards();
  } catch (err) {
    check('drill completed without exception', false, String(err && err.stack || err));
  }
  settleStyle.remove();
  const pass = results.filter(r => r.ok).length;
  const summary = `VANTAGE DRILL ${mode}: ${pass}/${results.length} PASS ` +
    `(${Math.round(performance.now() - t0)} ms)`;
  logLine(summary, pass === results.length ? 'pass' : 'fail');
  window.__vantageDrill = { mode, pass, total: results.length, results, summary };
  return window.__vantageDrill;
}
