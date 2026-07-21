// The Hollowbeck Six — state machine and hands.
//
// Logic here never reads anything rendered; the scene chases this state.
// Phases: latched -> set -> (judge on Grief) -> open | dark -> latched.

import { BELLS, PINNED, judgeChange, COPY } from './roads.js';
import * as audio from './audio.js';
import { build } from './scene.js';

const svg = document.getElementById('scene');
const scene = build(svg);

const state = {
  phase: 'latched',        // 'latched' | 'set' | 'open' | 'dark'
  rung: [],                // treble-five pulled this attempt, in order
  openRoad: null,
  openedFast: false,
  openedAt: 0,
  busy: false,             // barrel run or door swing in progress
  barrelIndex: 0,
  counters: { manualOpens: 0, chimeOpens: 0, falseChanges: 0 },
};

const OPEN_MS = 60_000;
const CHIME_STEP = 320;

scene.setCard(PINNED[0].name);
scene.slate.msg(COPY.latched);

// ---- timers that survive a throttled tab -------------------------------
// setTimeout clamps hard in hidden tabs; a MessageChannel trampoline with a
// wall-clock check keeps sequences honest without ever busy-waiting.
function after(ms, fn) {
  const due = performance.now() + ms;
  const ch = new MessageChannel();
  ch.port1.onmessage = () => {
    if (performance.now() >= due) { fn(); return; }
    setTimeout(() => ch.port2.postMessage(0), Math.min(250, Math.max(0, due - performance.now())));
  };
  ch.port2.postMessage(0);
}

// ---- actions ------------------------------------------------------------
function actLatch() {
  if (state.busy || state.phase === 'open' || state.phase === 'dark') return;
  audio.clunk();
  if (state.phase === 'latched') {
    state.phase = 'set';
    scene.setLatch(true);
    scene.slate.msg(COPY.drawn);
    audio.creak(0.5);
  } else {
    state.phase = 'latched';
    state.rung = [];
    scene.setLatch(false);
    scene.slate.chalk([]);
    scene.slate.msg(COPY.relatch);
  }
}

function actRope(bellN) {
  if (state.busy) return;
  const bell = BELLS[bellN - 1];
  if (state.phase === 'open' || state.phase === 'dark') {
    if (bellN === 6 && state.phase === 'open') {   // Grief tolls the way shut
      scene.pullRope(5);
      audio.toll(bell.freq);
      closeWay(COPY.toll);
    }
    return;
  }
  if (state.phase === 'latched') {
    scene.pullRope(bellN - 1);                     // the rope tugs, the bell won't go
    audio.clunk();
    scene.slate.msg(COPY.latched);
    return;
  }
  // set: the bell rings
  scene.pullRope(bellN - 1);
  after(180, () => audio.bell(bell.freq));
  if (bellN === 6) {
    judge();
  } else {
    state.rung.push(bellN);
    scene.slate.chalk(state.rung);
    if (state.rung.length > 5) { judge(); }        // over-rung: falls false at once
  }
}

function judge() {
  const verdict = state.rung.length === 5 ? judgeChange(state.rung) : { kind: state.rung.length < 5 ? 'short' : 'false' };
  const rung = state.rung;
  state.rung = [];
  if (verdict.kind === 'road') {
    state.counters.manualOpens++;
    openWay(verdict.road, false);
  } else if (verdict.kind === 'dark') {
    openDark();
  } else if (verdict.kind === 'rounds') {
    scene.slate.chalk([]);
    scene.slate.msg(COPY.rounds);
  } else {
    state.counters.falseChanges++;
    scene.slate.chalk([]);
    audio.jow();
    scene.slate.msg(verdict.kind === 'short' ? COPY.short : COPY.false);
  }
}

function actCrank() {
  if (state.busy || state.phase === 'open' || state.phase === 'dark') return;
  state.barrelIndex = (state.barrelIndex + 1) % PINNED.length;
  scene.crankClick();
  scene.setCard(PINNED[state.barrelIndex].name);
  audio.ratchet();
}

function actEngage() {
  if (state.busy || state.phase === 'open' || state.phase === 'dark') return;
  const road = PINNED[state.barrelIndex];
  state.busy = true;
  state.rung = [];
  scene.slate.chalk([]);
  scene.setEngaged(true);
  audio.clunk();
  scene.slate.msg(COPY.chiming);
  const seq = [...road.change, 6];
  seq.forEach((bellN, i) => {
    after(400 + i * CHIME_STEP, () => {
      scene.snapHammer(bellN - 1);
      audio.chimeStrike(BELLS[bellN - 1].freq);
      scene.slate.chalk(seq.slice(0, Math.min(i + 1, 5)));
    });
  });
  after(400 + seq.length * CHIME_STEP + 250, () => {
    scene.setEngaged(false);
    state.busy = false;
    state.counters.chimeOpens++;
    openWay(road, true);
  });
}

function openWay(road, fast) {
  state.phase = 'open';
  state.openRoad = road;
  state.openedFast = fast;
  state.openedAt = performance.now();
  scene.setWay('fair');
  audio.creak(1.4);
  audio.humStart(false);
  scene.slate.msg(fast ? COPY.chimeOpen(road.name) : COPY.open(road.name));
  const stamp = state.openedAt;
  after(OPEN_MS, () => {
    if (state.phase === 'open' && state.openedAt === stamp) closeWay(COPY.fade);
  });
}

function closeWay(message) {
  state.phase = 'latched';
  state.openRoad = null;
  scene.setWay(null);
  scene.setLatch(false);
  scene.slate.chalk([]);
  audio.humStop();
  after(900, () => audio.clunk());
  scene.slate.msg(message);
}

function openDark() {
  state.phase = 'dark';
  state.busy = true;
  scene.setWay('dark');
  audio.creak(2);
  audio.humStart(true);
  scene.slate.msg(COPY.dark);
  after(4200, () => {
    scene.setWay(null);
    audio.humStop();
    audio.slam();
    scene.setLatch(false);
    scene.slate.chalk([]);
    scene.slate.msg(COPY.darkShut);
    after(1200, () => { state.phase = 'latched'; state.busy = false; });
  });
}

// ---- wiring: real pointer events on the real elements -------------------
function onDown(e) {
  audio.wake();
  const t = e.target;
  if (!(t instanceof Element) || !t.classList.contains('hit')) return;
  const act = t.getAttribute('data-act');
  if (act === 'rope') actRope(+t.getAttribute('data-bell'));
  else if (act === 'latch') actLatch();
  else if (act === 'crank') actCrank();
  else if (act === 'engage') actEngage();
}
svg.addEventListener('pointerdown', onDown);

// ---- render loop: rAF chased by a coarse backstop -----------------------
function frame() {
  scene.tick(performance.now());
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setInterval(() => scene.tick(performance.now()), 250);  // keeps state visible in rAF-starved panes

// ---- non-default verification hooks (never fire for a plain visitor) ----
window.__belfry = {
  state: () => ({
    phase: state.phase,
    rung: [...state.rung],
    openRoad: state.openRoad ? state.openRoad.id : null,
    openedFast: state.openedFast,
    busy: state.busy,
    barrelIndex: state.barrelIndex,
    card: PINNED[state.barrelIndex].name,
    counters: { ...state.counters },
  }),
  hits: scene.hits,
};

import('./bench.js').then(m => {
  window.__belfry.trial = m.run;
  const q = new URLSearchParams(location.search);
  if (q.has('changes')) m.run(q.get('changes') || 'all');
});
