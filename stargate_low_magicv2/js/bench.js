// Verification bench. Never runs for a plain visitor: only via ?changes[=mode]
// or window.__belfry.trial(mode). Modes: manual | chime | false | guards | dark | all.
//
// Every interaction here is a real dispatched pointer event against the same
// element a visitor's hand would land on, found by elementFromPoint — no
// internal function calls, no shortcuts.

const st = () => window.__belfry.state();
const results = [];

function log(...a) { console.log('[bench]', ...a); }
function assert(name, cond) {
  results.push({ name, pass: !!cond });
  log(cond ? 'PASS' : 'FAIL', name);
}

function realClick(el) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const target = document.elementFromPoint(x, y) || el;
  const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, view: window };
  target.dispatchEvent(new PointerEvent('pointerdown', opts));
  target.dispatchEvent(new PointerEvent('pointerup', opts));
  target.dispatchEvent(new MouseEvent('click', opts));
  return target === el;
}

// Poll on a MessageChannel pump and count polls, not wall-clock — hidden-tab
// throttling stretches seconds but the pump keeps stepping.
function waitFor(cond, maxPolls = 120, every = 100) {
  return new Promise(res => {
    let n = 0;
    const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      n++;
      if (cond()) return res(true);
      if (n >= maxPolls) return res(false);
      setTimeout(() => ch.port2.postMessage(0), every);
    };
    ch.port2.postMessage(0);
  });
}
const pause = polls => waitFor(() => false, polls, 60).then(() => {});

const H = () => window.__belfry.hits;

async function resetToLatched() {
  if (st().phase === 'open') { realClick(H().ropes[5]); await waitFor(() => st().phase === 'latched'); }
  if (st().phase === 'dark') { await waitFor(() => st().phase === 'latched', 200); }
  if (st().phase === 'set') { realClick(H().latch); await waitFor(() => st().phase === 'latched'); }
  await waitFor(() => !st().busy);
}

async function ringChange(order) {
  for (const bell of order) { realClick(H().ropes[bell - 1]); await pause(3); }
}

async function trialManual() {
  log('--- manual dial: Marrow Fen (1 3 5 2 4, close on Grief) ---');
  await resetToLatched();
  assert('manual: hit-test lands on latch', realClick(H().latch));
  assert('manual: stay-bolt drawn', await waitFor(() => st().phase === 'set'));
  await ringChange([1, 3, 5, 2, 4]);
  assert('manual: five bells chalked in order', st().rung.join('') === '13524');
  realClick(H().ropes[5]);
  assert('manual: way opens on Grief', await waitFor(() => st().phase === 'open'));
  assert('manual: door gives onto Marrow Fen', st().openRoad === 'marrow-fen');
  assert('manual: opened the patient way (not fast)', st().openedFast === false);
  await pause(8);
  realClick(H().ropes[5]);
  assert('manual: Grief tolls the way shut', await waitFor(() => st().phase === 'latched'));
}

async function trialChime() {
  log('--- fast dial: the sexton\'s barrel -> Under-Ash ---');
  await resetToLatched();
  let guard = 0;
  while (st().card !== 'Under-Ash' && guard++ < 8) { realClick(H().crank); await pause(2); }
  assert('chime: crank indexes the card to Under-Ash', st().card === 'Under-Ash');
  assert('chime: hit-test lands on engage lever', realClick(H().engage));
  assert('chime: barrel run engages (busy)', await waitFor(() => st().busy));
  assert('chime: way opens without the stay-bolt', await waitFor(() => st().phase === 'open', 200));
  assert('chime: door gives onto Under-Ash', st().openRoad === 'under-ash');
  assert('chime: opened fast, by the pins', st().openedFast === true);
  realClick(H().ropes[5]);
  assert('chime: Grief tolls the way shut', await waitFor(() => st().phase === 'latched'));
}

async function trialFalse() {
  log('--- false change: 2 1 3 4 5 ---');
  await resetToLatched();
  realClick(H().latch);
  await waitFor(() => st().phase === 'set');
  await ringChange([2, 1, 3, 4, 5]);
  realClick(H().ropes[5]);
  await pause(5);
  assert('false: the change falls false, way stays shut', st().phase === 'set' && st().openRoad === null);
  assert('false: slate wiped', st().rung.length === 0);
  realClick(H().latch);
  await waitFor(() => st().phase === 'latched');
}

async function trialGuards() {
  log('--- guards and interlocks ---');
  await resetToLatched();
  realClick(H().ropes[2]);
  await pause(3);
  assert('guard: latched stays swallow the pull (no bell chalked)', st().rung.length === 0 && st().phase === 'latched');
  // rounds open nothing
  realClick(H().latch); await waitFor(() => st().phase === 'set');
  await ringChange([1, 2, 3, 4, 5]);
  realClick(H().ropes[5]);
  await pause(5);
  assert('guard: rounds open nothing', st().phase === 'set' && st().openRoad === null);
  realClick(H().latch); await waitFor(() => st().phase === 'latched');
  // barrel is deaf while a way stands open
  realClick(H().crank); await pause(2);
  const idx = st().barrelIndex;
  realClick(H().engage);
  await waitFor(() => st().phase === 'open', 200);
  realClick(H().crank); await pause(2);
  assert('guard: crank is deaf while the way is open', st().barrelIndex === idx);
  realClick(H().engage); await pause(3);
  assert('guard: engage is deaf while the way is open', st().phase === 'open');
  realClick(H().ropes[5]);
  await waitFor(() => st().phase === 'latched');
}

async function trialDark() {
  log('--- the struck road: Wrycross (5 3 1 4 2) ---');
  await resetToLatched();
  realClick(H().latch); await waitFor(() => st().phase === 'set');
  await ringChange([5, 3, 1, 4, 2]);
  realClick(H().ropes[5]);
  assert('dark: Wrycross answers', await waitFor(() => st().phase === 'dark'));
  assert('dark: the door slams itself shut', await waitFor(() => st().phase === 'latched', 250));
}

export async function run(mode = 'all') {
  results.length = 0;
  log(`bench start (${mode}) — visibilityState=${document.visibilityState}`);
  const suites = { manual: trialManual, chime: trialChime, false: trialFalse, guards: trialGuards, dark: trialDark };
  const list = mode === 'all' || mode === '' ? Object.values(suites) : [suites[mode]].filter(Boolean);
  for (const s of list) await s();
  const passed = results.filter(r => r.pass).length;
  log(`bench done: ${passed}/${results.length} passed`);
  window.__belfryBench = { passed, total: results.length, results: [...results] };
  return window.__belfryBench;
}
