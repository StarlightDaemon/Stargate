// screens.js — DOM readouts: rect screens, lamps, knob rotations, CRT status text.
// Purely presentational; reads sim state, writes DOM at a coarse cadence.

import { state, DESTS, RATIOS, meshKv, onLog, ratioMatchesDest, wrapDiff } from './sim.js';

const $ = id => document.getElementById(id);
const stage = $('stage');
const fmtPhase = v => `${v >= 0 ? '+' : '−'}${String(Math.abs(v).toFixed(1)).padStart(5, '0')}°`;

/* ---------- build destination rows ---------- */
const destRowEls = [];
{
  const holder = $('dest-rows');
  DESTS.forEach((d, i) => {
    const row = document.createElement('div');
    row.className = 'dest-row';
    row.dataset.dest = i;
    row.innerHTML =
      `<span class="c-id">${d.id}</span><span class="c-name">${d.name}</span>` +
      `<span class="c-fig">${d.a}:${d.b}</span><span class="c-ph">+${String(d.phase).padStart(3, '0')}°</span>` +
      `<span class="c-st">&mdash;</span>`;
    holder.appendChild(row);
    destRowEls.push(row);
  });
}

/* ---------- build store rows ---------- */
const storeRowEls = [];
{
  const holder = $('store-rows');
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'store-row empty';
    row.dataset.slot = i;
    row.innerHTML = `<span>S${i + 1}</span><span class="sl-name">&middot; &middot; &middot;</span>` +
      `<span class="sl-fig"></span><span class="sl-ph"></span><span class="recall-tag"></span>`;
    holder.appendChild(row);
    storeRowEls.push(row);
  }
}

/* ---------- log ---------- */
const logHolder = $('log-lines');
onLog(entry => {
  const el = document.createElement('div');
  el.className = 'll' + (entry.cls ? ' ' + entry.cls : '');
  el.innerHTML = `<span class="t">${entry.stamp}</span>${entry.msg}`;
  logHolder.appendChild(el);
  while (logHolder.children.length > 15) logHolder.removeChild(logHolder.firstChild);
});

/* ---------- coarse update ---------- */
let lastUpd = 0;
export function update(t) {
  if (t - lastUpd < 90) return;
  lastUpd = t;

  stage.dataset.power = state.power ? '1' : '0';
  stage.dataset.warm = state.power && state.htReady ? '1' : '0';

  // knobs
  const ratioKnob = $('knob-ratio'), phaseKnob = $('knob-phase');
  const span = RATIOS.length - 1;
  ratioKnob.firstElementChild.style.transform =
    `rotate(${-135 + 270 * (state.ratioIdx / span)}deg)`;
  ratioKnob.setAttribute('aria-valuenow', state.ratioIdx);
  phaseKnob.firstElementChild.style.transform = `rotate(${state.phase}deg)`;
  phaseKnob.setAttribute('aria-valuenow', Math.round(state.phase));
  const [ra, rb] = RATIOS[state.ratioIdx];
  $('ratio-readout').textContent = `${ra}:${rb}`;
  $('phase-readout').textContent = fmtPhase(state.phase);

  // toggles / cover
  $('power-toggle').classList.toggle('on', state.power);
  $('power-toggle').setAttribute('aria-checked', String(state.power));
  $('energize-switch').classList.toggle('on', state.energize);
  $('energize-switch').setAttribute('aria-checked', String(state.energize));
  $('energize-unit').classList.toggle('open', state.coverOpen);

  // lamps
  const now = performance.now();
  const lamp = (id, lit, amber) => {
    const el = $(id);
    el.classList.toggle('lit', !!lit);
    if (amber != null) el.classList.toggle('amber', amber);
  };
  lamp('lamp-power', state.power);
  lamp('lamp-ht', state.power && state.htReady, true);
  lamp('lamp-latch', !!state.latch);
  lamp('lamp-live', !!state.live);
  lamp('lamp-ap', state.aperture.st === 'open' || state.aperture.st === 'opening');
  lamp('lamp-fault', state.faultUntil > now && Math.floor(now / 260) % 2 === 0);

  // CRT status block
  $('st-fig').textContent = `${ra}:${rb}`;
  $('st-phase').textContent = fmtPhase(state.phase);
  $('st-afc').textContent = state.latch ? 'LATCH' : '—';
  $('st-mesh').textContent = `${meshKv(now).toFixed(1)}kV`;
  const ap = state.aperture;
  $('st-mode').textContent =
    ap.st === 'open' ? `APERTURE — ${DESTS[ap.destIdx].id}` :
    ap.st === 'opening' ? 'MESH FLOOD' :
    ap.st === 'collapsing' ? 'COLLAPSING' :
    state.live ? `TRACE LIVE — ${DESTS[state.live.destIdx].id}` :
    state.latch ? 'FIGURE STANDING' :
    state.htReady ? 'FREE RUN' : 'HT RISING';

  // dest rows
  DESTS.forEach((d, i) => {
    const row = destRowEls[i];
    row.classList.toggle('registered', state.register === i);
    const isOpen = (ap.st === 'open' || ap.st === 'opening') && ap.destIdx === i;
    const isLatch = state.latch && state.latch.destIdx === i;
    row.classList.toggle('open', isOpen);
    row.classList.toggle('latched', !!isLatch);
    let st = '—';
    if (isOpen) st = ap.st === 'open' ? 'OPEN' : 'FLOOD';
    else if (state.live && state.live.destIdx === i) st = 'LIVE';
    else if (isLatch) st = 'LATCH';
    else if (state.power && state.htReady && ratioMatchesDest(i)) {
      const off = wrapDiff(state.phase, d.phase);
      st = `Δ${off >= 0 ? '+' : '−'}${Math.abs(off).toFixed(0)}°`;
    }
    row.querySelector('.c-st').textContent = st;
  });

  // store rows
  storeRowEls.forEach((row, i) => {
    const slot = state.slots[i];
    row.classList.toggle('empty', !slot);
    row.classList.toggle('filled', !!slot);
    row.classList.toggle('live-src', !!slot && !!state.live && state.live.destIdx === slot.destIdx);
    if (slot) {
      const d = DESTS[slot.destIdx];
      row.querySelector('.sl-name').textContent = `${d.id} ${d.name}`;
      row.querySelector('.sl-fig').textContent = `${d.a}:${d.b}`;
      row.querySelector('.sl-ph').textContent = `+${String(d.phase).padStart(3, '0')}°`;
      row.querySelector('.recall-tag').textContent = '[RECALL]';
    } else {
      row.querySelector('.sl-name').innerHTML = '&middot; &middot; &middot;';
      row.querySelector('.sl-fig').textContent = '';
      row.querySelector('.sl-ph').textContent = '';
      row.querySelector('.recall-tag').textContent = '';
    }
  });

  $('mesh-kv').textContent = state.power ? `· ${meshKv(now).toFixed(1)} kV` : '';
}
