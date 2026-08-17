// Operator's bench: route board, ghost-key rack, guarded aperture bar,
// CUT mushroom, mismatched current meter. All hand-hung, nothing gridded.

import { DESTS, DEST_ORDER, CHIPS } from './data.js';
import { S, actions, canResume, energy, on } from './state.js';
import { now } from './clock.js';

const $ = id => document.getElementById(id);
let needle, digital, runLed, readerLed, tagEls = {}, chipEls = {};

export function initRig() {
  buildBoard();
  buildChips();

  $('negKey').addEventListener('click', () => actions.negotiate());
  $('resKey').addEventListener('click', () => actions.resume());
  $('guardCover').addEventListener('click', () => actions.toggleCover());
  $('lever').addEventListener('click', () => actions.pullLever());
  $('cutBtn').addEventListener('click', () => actions.cut());
  $('audioTgl').addEventListener('click', () => actions.toggleAudio());

  needle = $('needle'); digital = $('digital'); runLed = $('runLed'); readerLed = $('readerLed');

  // meter tick marks — stamped by hand, so not quite even
  const ticks = $('meterTicks');
  for (let i = 0; i <= 8; i++) {
    const a = (-152 + i * 15.5 + (i % 3) * 0.9) * Math.PI / 180;
    const x0 = 60 + Math.cos(a) * 47, y0 = 66 + Math.sin(a) * 47;
    const x1 = 60 + Math.cos(a) * (i % 2 ? 52 : 55), y1 = 66 + Math.sin(a) * (i % 2 ? 52 : 55);
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x0); l.setAttribute('y1', y0); l.setAttribute('x2', x1); l.setAttribute('y2', y1);
    l.setAttribute('stroke', '#8a8577'); l.setAttribute('stroke-width', i % 2 ? 0.8 : 1.4);
    ticks.appendChild(l);
  }

  on('phase', () => syncStatic());
  on('audio', v => { const b = $('audioTgl'); b.classList.toggle('on', v); b.setAttribute('aria-pressed', String(v)); });
  syncStatic();
}

function buildBoard() {
  const wrap = $('destTags');
  for (const id of DEST_ORDER) {
    const d = DESTS[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dtag' + (d.dead ? ' struck' : '');
    b.style.setProperty('--tilt', d.tilt + 'deg');
    b.style.setProperty('--wear', d.wear);
    b.innerHTML = `<span class="dtag-name">${d.name}</span>` +
      `<span class="dtag-route">KV//${d.hops.join(':')}</span>` +
      `<span class="dtag-note">${d.note}</span>` +
      `<span class="dtag-tkt" title="warm session">TKT</span>`;
    b.addEventListener('click', () => actions.selectDest(id));
    wrap.appendChild(b);
    tagEls[id] = b;
  }
}

function buildChips() {
  const rack = $('chipRack');
  for (const c of CHIPS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (c.ok ? '' : ' burned');
    b.style.setProperty('--tilt', c.tilt + 'deg');
    b.innerHTML = `<span class="chip-notch"></span><span class="chip-lbl">${c.label}</span><span class="chip-pins"></span>`;
    b.addEventListener('click', () => actions.seatChip(c.id));
    rack.appendChild(b);
    chipEls[c.id] = b;
  }
}

// things that only change on events
function syncStatic() {
  for (const id of DEST_ORDER) {
    tagEls[id].classList.toggle('sel', S.dest === id);
  }
  for (const c of CHIPS) chipEls[c.id].classList.toggle('seated', S.seated === c.id);
  $('lever').classList.toggle('pulled', S.lever);
  $('guardCover').classList.toggle('up', S.coverOpen);
  document.body.dataset.phase = S.phase;
}

export function renderRig(t = now()) {
  syncStatic(); // cover/lever toggles don't emit phase events; cheap to re-sync
  const e = energy(t);

  // analog needle: sweeps -62°..+62°; reads a touch low and lags a little
  const noisy = e + 0.015 * Math.sin(t / 140) * (S.phase === 'open' ? 2.2 : 1);
  const ang = -62 + Math.max(0, Math.min(1, noisy * 0.93)) * 124;
  needle.setAttribute('transform', `rotate(${ang.toFixed(2)} 60 66)`);

  // digital readout disagrees: different calibration, of course
  const ka = (noisy * 3.31 + 0.07 + 0.02 * Math.sin(t / 90)).toFixed(2);
  digital.textContent = ka;
  digital.classList.toggle('hot', e > 0.9);

  const busy = ['spool', 'negotiate', 'resume', 'lock'].includes(S.phase);
  runLed.className = 'run-led' + (busy ? ' busy' : S.phase === 'ready' ? ' ready' : S.phase === 'open' ? ' open' : '');

  const chip = CHIPS.find(c => c.id === S.seated);
  readerLed.className = 'reader-led' + (chip ? ' lit' : '');

  for (const id of DEST_ORDER) tagEls[id].classList.toggle('warm', canResume(id));

  $('guardCover').classList.toggle('nudge', S.phase === 'ready' && !S.coverOpen && Math.sin(t / 500) > 0);
}
