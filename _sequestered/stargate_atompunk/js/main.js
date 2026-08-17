// VANTAGE — integration: DOM wiring, render chase loop, viewport fit.

import * as sim from './sim.js';
import { drawScope } from './scope.js';

const now = () => performance.now();
const state = sim.makeState();
sim.seedDrum(state);

const $ = sel => document.querySelector(sel);
const canvas = $('#scope');
const consoleEl = $('#console');
const stageEl = $('#stage');

// --- Nixie tube construction ------------------------------------------------
function buildTubes() {
  document.querySelectorAll('.tubes').forEach(group => {
    const n = parseInt(group.dataset.digits, 10);
    for (let i = 0; i < n; i++) {
      const tube = document.createElement('span');
      tube.className = 'tube blank';
      tube.innerHTML = '<span class="ghost">8</span><span class="lit">0</span>';
      group.appendChild(tube);
    }
  });
}
function setTubes(name, text) {
  const group = document.querySelector(`[data-nixie="${name}"]`);
  const tubes = group.children;
  const s = String(text ?? '').padStart(tubes.length, ' ');
  for (let i = 0; i < tubes.length; i++) {
    const ch = s[s.length - tubes.length + i];
    const lit = tubes[i].querySelector('.lit');
    if (ch >= '0' && ch <= '9') {
      tubes[i].classList.remove('blank');
      lit.textContent = ch;
    } else {
      tubes[i].classList.add('blank');
    }
  }
}

// --- target log -------------------------------------------------------------
function buildLog() {
  const tbody = $('#logTable tbody');
  for (const d of sim.DESTS) {
    const tr = document.createElement('tr');
    tr.dataset.dest = d.id;
    tr.innerHTML =
      `<td class="name-cell">${d.name}</td>` +
      `<td class="num">${String(d.brg).padStart(3, '0')}</td>` +
      `<td class="num">${String(d.rng).padStart(3, '0')}</td>` +
      `<td class="drum-cell"><span class="drum-dot"></span></td>`;
    tbody.appendChild(tr);
  }
}

// --- legends / lamps --------------------------------------------------------
function setLegend(name, on) {
  document.querySelector(`[data-legend="${name}"]`).classList.toggle('on', !!on);
}

// --- knob visuals (cumulative turn so the pointer never snaps backwards) ----
const knobTurns = { bearing: 0, range: 3, slot: 0 };
function turnKnob(id, key, stepDeg, dir) {
  knobTurns[key] += dir;
  $(id).querySelector('.cap').style.transform = `rotate(${knobTurns[key] * stepDeg}deg)`;
}

// --- control wiring ---------------------------------------------------------
function wireKnob(el, onStep) {
  el.addEventListener('click', e => {
    const r = el.getBoundingClientRect();
    const dir = e.clientX < r.left + r.width / 2 ? -1 : 1;
    onStep(dir);
  });
  el.addEventListener('wheel', e => {
    e.preventDefault();
    onStep(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
}

function wire() {
  $('#htToggle').addEventListener('click', () => {
    sim.setHT(state, now(), !state.ht);
    render();
  });

  wireKnob($('#knobBearing'), dir => {
    const before = state.bearingIdx;
    sim.stepBearing(state, now(), dir);
    if (state.bearingIdx !== before) turnKnob('#knobBearing', 'bearing', sim.BEARING_STEP, dir);
    render();
  });

  wireKnob($('#knobRange'), dir => {
    const before = state.rangeIdx;
    sim.stepRange(state, now(), dir);
    if (state.rangeIdx !== before) turnKnob('#knobRange', 'range', 30, dir);
    render();
  });

  wireKnob($('#knobSlot'), dir => {
    const before = state.slotIdx;
    sim.stepSlot(state, now(), dir);
    if (state.slotIdx !== before) turnKnob('#knobSlot', 'slot', 90, dir);
    render();
  });

  $('#btnChallenge').addEventListener('click', () => {
    sim.pressChallenge(state, now());
    render();
  });

  $('#btnRecall').addEventListener('click', () => {
    sim.pressRecall(state, now());
    render();
  });

  // Cover lid: clicking the closed lid opens it. Hinge bar always toggles.
  $('#inductCover').addEventListener('click', () => {
    if (!state.coverOpen) { sim.toggleCover(state, now()); render(); }
  });
  $('#coverHinge').addEventListener('click', () => {
    sim.toggleCover(state, now());
    render();
  });

  $('#inductSwitch').addEventListener('click', () => {
    sim.setInduct(state, now(), !state.induct);
    render();
  });
}

// --- render chase -----------------------------------------------------------
function render() {
  const t = now();
  sim.tick(state, t);

  drawScope(canvas, state, t);

  const g = sim.renderGates(state, t);
  setTubes('brg', state.ht ? String(Math.round(g.brg) % 360).padStart(3, '0') : '');
  setTubes('rng', state.ht ? String(Math.round(g.rng)).padStart(3, '0') : '');
  const paints = state.locked ? sim.PAINTS_NEEDED : sim.paintsOf(state, t);
  setTubes('trk', state.ht && state.track ? String(paints) : '');
  setTubes('sig', state.sig && /^\d+$/.test(state.sig) ? state.sig : '');
  setTubes('slot', String(state.slotIdx + 1));

  setLegend('search', state.ht && !state.track && !state.open);
  setLegend('track', !!state.track && !state.locked);
  setLegend('lock', state.locked);
  setLegend('verify', state.verified);
  setLegend('nojoy', state.noJoy);
  setLegend('open', state.open);

  $('#faultStrip').textContent =
    state.fault ? state.fault :
    state.challenge ? 'INTERROGATING…' :
    state.recall ? 'DRUM REPLAY…' : ' ';

  document.querySelector('[data-lamp="ht"]').classList.toggle('on', state.ht);
  $('#htToggle').classList.toggle('on', state.ht);
  $('#htToggle').setAttribute('aria-checked', String(state.ht));
  $('#inductSwitch').classList.toggle('on', state.induct);
  $('#inductSwitch').setAttribute('aria-checked', String(state.induct));
  $('#inductAssembly').classList.toggle('open', state.coverOpen);
  $('#bezel').classList.toggle('aperture-open', state.open);

  const slot = state.slots[state.slotIdx];
  $('#drumName').textContent = slot ? sim.destById(slot.destId).name : '————';

  document.querySelectorAll('#logTable tbody tr').forEach(tr => {
    const id = tr.dataset.dest;
    tr.classList.toggle('tracked', !!state.track && state.track.destId === id);
    tr.classList.toggle('dark-station', state.darkKnown.includes(id));
    tr.querySelector('.drum-dot').classList.toggle('stored',
      state.slots.some(s => s && s.destId === id));
  });
}

// --- clocks: rAF for smoothness, interval backstop, worker heartbeat --------
function startClocks() {
  const frame = () => { render(); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  setInterval(render, 300); // backstop when rAF is starved
  try {
    // Blob worker heartbeat is immune to Chrome intensive throttling
    const src = 'setInterval(() => postMessage(1), 250);';
    const worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = () => sim.tick(state, now());
  } catch (e) { /* heartbeat is best-effort; closed-form physics survive without it */ }
}

// --- viewport fit: scale the fixed-px console into the stage ----------------
function fitStage() {
  const availW = stageEl.clientWidth - 16;
  const availH = stageEl.clientHeight - 16;
  if (availW <= 0 || availH <= 0) { // stylesheet not applied yet — try again shortly
    setTimeout(fitStage, 150);
    return;
  }
  consoleEl.style.transform = 'none';
  const pr = consoleEl.getBoundingClientRect();
  const k = Math.min(availW / pr.width, availH / pr.height);
  consoleEl.style.transform = `scale(${k})`;
}

// --- boot -------------------------------------------------------------------
buildTubes();
buildLog();
wire();
fitStage();
window.addEventListener('resize', fitStage);
// stylesheet may land after module init in some panes — re-fit on a beat
setTimeout(fitStage, 120);
setTimeout(fitStage, 600);
startClocks();
render();

// --- test access (non-default; never runs for a plain visitor) --------------
window.__vantage = {
  state, sim, now, render, fitStage,
  drill(mode = 'all') {
    return import('./bench.js').then(m => m.drill(mode));
  },
};

const drillParam = new URLSearchParams(location.search).get('drill');
if (new URLSearchParams(location.search).has('drill')) {
  window.__vantage.drill(drillParam || 'all');
}

// --- operator reference (Watch Officer's card) -------------------------------
{
  const btn = document.getElementById('opRefBtn');
  const overlay = document.getElementById('opRefOverlay');
  const closeBtn = document.getElementById('opRefClose');

  const setOpRef = (open) => {
    overlay.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) closeBtn.focus(); else btn.focus();
  };

  btn.addEventListener('click', () => setOpRef(overlay.hidden));
  closeBtn.addEventListener('click', () => setOpRef(false));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) setOpRef(false); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) { e.preventDefault(); setOpRef(false); }
  });
}
