// Rendering chases the closed-form sim. rAF when the pane is live, plus a
// 400 ms interval backstop so state is never invisible after a stall.

import * as sim from './sim.js';
import { DESTS, BANDS } from './directory.js';
import {
  buildBigDial, buildVernier, buildBandSel, buildShadowMeter,
  buildVoltmeter, buildSunburst, buildIris, engineTurnTile,
  dialAngle, BAND_ANGLES, IRIS_CX, IRIS_CY, IRIS_R,
} from './svgparts.js';
import { drawPortal } from './portal.js';
import { updateContinuous, washTick } from './audio.js';

const $ = id => document.getElementById(id);
let dialNeedle, vernRot, bandRot, shadowBand, voltNeedle, irisLeaves, portalCtx;

export function setupScene() {
  dialNeedle = buildBigDial($('bigdial'));
  vernRot = buildVernier($('vernier'));
  bandRot = buildBandSel($('bandsel'));
  shadowBand = buildShadowMeter($('shadowmeter'));
  voltNeedle = buildVoltmeter($('voltmeter'));
  buildSunburst($('sunburst'));
  irisLeaves = buildIris($('iris'));
  portalCtx = $('portal').getContext('2d');

  // engine-turned fascia
  const fascia = $('fascia');
  fascia.style.backgroundImage =
    `linear-gradient(105deg, rgba(255,252,242,.16), rgba(0,0,0,.18) 60%, rgba(255,255,255,.07)), url(${engineTurnTile()})`;
  fascia.style.backgroundSize = 'auto, 8.4rem 8.4rem';

  // presel keys
  const rack = $('presel-keys');
  for (let n = 1; n <= 5; n++) {
    const d = DESTS.find(x => x.presel === n);
    const b = document.createElement('button');
    b.className = 'presel-key';
    b.id = `presel-${n}`;
    b.dataset.presel = n;
    b.setAttribute('aria-label', `Presel key ${n}: ${d.name}`);
    b.innerHTML = `<span class="keynum">${n}</span><span class="keydest">${abbrev(d.name)}</span>`;
    rack.appendChild(b);
  }

  // directory
  const list = $('dir-list');
  for (const d of DESTS) {
    const li = document.createElement('li');
    li.id = `dir-${d.id}`;
    if (d.presel === null) li.classList.add('manual');
    li.innerHTML =
      `<span class="dn">${d.presel ?? '★'}</span>` +
      `<span class="dname">${d.name}</span>` +
      `<span class="daddr">${BANDS[d.band]} · ${d.metres} m</span>`;
    list.appendChild(li);
  }
}

function abbrev(name) {
  const w = name.split(' ');
  return w.length > 1 ? w.map(x => x.slice(0, 4)).join(' ') : name.slice(0, 8);
}

/* ---------------- frame ---------------- */
let lastStatus = '';
export function renderFrame() {
  const t = sim.now();
  const salon = $('salon');
  const v = sim.volts(t);
  const lineFrac = Math.max(0, Math.min(1, v / sim.LINE_VOLTS));
  const tuned = sim.tuned(t);
  const beacon = sim.activeBeacon(t);
  const err = beacon ? beacon.err : 99;
  const locked = sim.latched(t);
  const phase = sim.portalPhase(t);

  salon.classList.toggle('line-on', sim.state.lineOn);
  salon.classList.toggle('latched', !!locked || sim.state.engaged);

  // big dial needle — shows tuned wavelength (coarse + vernier)
  dialNeedle.setAttribute('transform',
    `rotate(${dialAngle(Math.max(sim.METRES_MIN, Math.min(sim.METRES_MAX, tuned))).toFixed(2)} 200 200)`);
  $('bigdial').setAttribute('aria-valuenow', tuned.toFixed(1));

  vernRot.setAttribute('transform',
    `rotate(${(sim.state.vernier / sim.VERNIER_RANGE * 150).toFixed(1)} 70 70)`);
  $('vernier').setAttribute('aria-valuenow', Math.round(sim.state.vernier * 10));

  bandRot.setAttribute('transform', `rotate(${BAND_ANGLES[sim.state.band]} 60 62)`);
  $('bandsel').setAttribute('aria-valuenow', sim.state.band);

  // shadow meter: err 0 → hairline, err ≥ 5 → full smother; unpowered → dark
  const wFull = 126, cx = 75;
  const k = Math.max(0, Math.min(1, err / 5));
  const w = 4 + k * (wFull - 4);
  shadowBand.setAttribute('x', (cx - w / 2).toFixed(1));
  shadowBand.setAttribute('width', w.toFixed(1));
  const lamp = document.getElementById('shadow-lamp');
  lamp.setAttribute('opacity', (0.12 + 0.88 * lineFrac).toFixed(2));

  // volts needle with idle wander baked into sim.volts
  voltNeedle.setAttribute('transform',
    `rotate(${(-55 + Math.max(0, Math.min(150, v)) / 150 * 110).toFixed(2)} 85 96)`);

  // annunciator
  const st = sim.status(t);
  const stEl = $('statustext');
  if (st.text !== lastStatus) {
    stEl.textContent = st.text;
    stEl.className = st.cls;
    lastStatus = st.text;
  }

  // lever + line switch reflect sim truth
  $('travel-lever').setAttribute('aria-pressed', String(sim.state.engaged));
  $('linesw').setAttribute('aria-pressed', String(sim.state.lineOn));

  // directory highlight
  for (const d of DESTS) {
    const el = document.getElementById(`dir-${d.id}`);
    const cur = (locked && locked.id === d.id) ||
      (sim.state.engaged && sim.state.engagedDest?.id === d.id);
    el.classList.toggle('current', !!cur);
  }

  // presel key pressed state during slew
  const slewing = !!sim.state.slew;
  document.querySelectorAll('.presel-key').forEach(kEl => {
    const d = DESTS.find(x => x.presel === +kEl.dataset.presel);
    kEl.classList.toggle('pressed',
      slewing && d && sim.state.slew.to === d.metres && sim.state.band === d.band);
  });

  // doorway
  drawPortal(portalCtx, t, phase);
  const delta = 42 * phase;
  irisLeaves.forEach((leaf, i) => {
    const th = i * 30 + 15;
    const rad = th * Math.PI / 180;
    const px = IRIS_CX + Math.cos(rad) * IRIS_R * 0.985;
    const py = IRIS_CY + Math.sin(rad) * IRIS_R * 0.985;
    leaf.setAttribute('transform',
      `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${(th + 180 + delta).toFixed(2)})`);
  });

  updateContinuous({
    lineFrac,
    err,
    searching: sim.state.lineOn && sim.warmed(t) && !sim.state.engaged && !slewing,
    slewing,
  });
  washTick(phase);
}

export function startLoops() {
  const raf = () => { renderFrame(); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  setInterval(renderFrame, 400);   // backstop for rAF-starved viewers
}
