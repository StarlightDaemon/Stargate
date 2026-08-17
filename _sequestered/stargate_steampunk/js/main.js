/* Boot, wiring, and the render loop. Rendering chases the sim's
   closed-form state; a coarse setInterval backstop keeps chasing it
   if requestAnimationFrame is starved (hidden pane). */

import { now } from './clock.js';
import * as sim from './sim.js';
import * as audio from './audio.js';
import { buildIris, renderIris } from './iris.js';
import * as panels from './panels.js';
import { CORRESPONDENTS, ROMANS } from './cards.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

const ui = {
  drawThrowT: -10,
  ventThrowT: -10,
  tapeSeq: -1,
  readerSig: null,
  traySig: null,
  placard: '',
  prev: { locks: 0, liveNow: false, deadNow: false, strikeT: -10, feedTick: -1 },
  lastRenderT: -10,
};

/* real-world clock for tape timestamps */
const epochMs = Date.now() - performance.now();
function stamp(perfSeconds) {
  const d = new Date(epochMs + perfSeconds * 1000);
  let h = d.getHours(); const m = d.getMinutes();
  const ap = h >= 12 ? 'p.m.' : 'a.m.';
  h = h % 12 || 12;
  return `${h}.${String(m).padStart(2, '0')} ${ap}`;
}

function wiggle(el) {
  el.classList.remove('refused');
  void el.offsetWidth;
  el.classList.add('refused');
}

/* ---------------- wiring ---------------- */

function wire() {
  $('damper').addEventListener('click', () => { sim.toggleDamper(); audio.clank(); });

  panels.buildRack((i) => {
    const r = sim.insertLibrary(i, CORRESPONDENTS[i]);
    if (r.ok) audio.clank(); else wiggle($('rack'));
  });

  $('reader-card').addEventListener('click', () => {
    const r = sim.eject();
    if (r.ok) audio.clank(); else wiggle($('reader-slot'));
  });

  $('tray-card').addEventListener('click', () => {
    const r = sim.insertTray();
    if (r.ok) audio.clank(); else wiggle($('tray'));
  });

  $('draw-lever').addEventListener('click', () => {
    const r = sim.throwDraw();
    if (r.ok) { ui.drawThrowT = now(); audio.clank(); }
    else wiggle($('draw-lever'));
  });

  $('coupling-lever').addEventListener('click', () => {
    const r = sim.throwCoupling();
    if (r.ok) audio.clank(); else wiggle($('coupling-lever'));
  });

  $('vent-lever').addEventListener('click', () => {
    sim.vent();
    ui.ventThrowT = now();
    audio.ventBurst();
  });

  panels.buildPunch((v) => { sim.punchSetValue(v); audio.tick(); });

  $('strike').addEventListener('click', () => {
    const r = sim.punchStrike();
    if (r.ok) audio.thunk(); else wiggle($('strike'));
  });

  $('spoil').addEventListener('click', () => {
    const r = sim.punchSpoil();
    if (r.ok) audio.clank(); else wiggle($('spoil'));
  });

  $('sound-toggle').addEventListener('click', () => {
    const on = !audio.isEnabled();
    audio.setEnabled(on);
    $('sound-toggle').setAttribute('aria-pressed', String(on));
    $('sound-state').textContent = on ? 'ON' : 'OFF';
  });

  /* audio contexts need a genuine gesture */
  window.addEventListener('pointerdown', () => audio.ensureCtx(), { once: false });
}

/* ---------------- render ---------------- */

const cardSig = (c) => c ? c.code.join('') + (c.certified ? 'C' : 'U') : null;

function placardText(t, S, open, p) {
  if (S.aperture && S.aperture.live)
    return open > 0.5
      ? `${S.aperture.dest.name} — ${S.aperture.dest.advisory}`
      : 'THE LEAVES TURN…';
  if (S.aperture && !S.aperture.live)
    return 'NO CORRESPONDENCE UPON THE LINE';
  if (sim.alignedAt(t))
    return 'REGISTERS IN CORRESPONDENCE — THROW THE COUPLING';
  if (sim.drawingAt(t)) {
    if (S.draw.certified) return 'DRAWING AT GOVERNOR SPEED…';
    const col = sim.provingColAt(t);
    return col >= 0 ? `PROVING COLUMN ${ROMANS[col]}…` : 'PROVING THE CARD…';
  }
  if (S.reader)
    return `CARD READY — ${S.reader.name || 'UNCERTIFIED COMPOSITION'}`;
  if (S.damperOpen && p < sim.P.WORKING_MIN)
    return 'RAISING STEAM…';
  return 'THE LINE IS QUIET';
}

const wisps = [];

export function render(t = now()) {
  ui.lastRenderT = t;
  sim.poll();
  const S = sim.refs;
  const p = sim.pressureAt(t);
  const open = sim.apertureOpenness(t);

  panels.renderGauge(t);
  panels.renderGovernor(t);
  panels.renderFlags(t);
  panels.renderRack();
  panels.renderPunch(t);

  panels.renderLever('damper', t, S.damperOpen);
  $('damper').setAttribute('aria-pressed', String(S.damperOpen));
  panels.renderLever('coupling-lever', t, S.coupling);
  $('coupling-lever').setAttribute('aria-pressed', String(S.coupling));
  panels.renderMomentary('draw-lever', t, ui.drawThrowT);
  panels.renderMomentary('vent-lever', t, ui.ventThrowT);

  renderIris(t, open, S.aperture ? S.aperture.live : false);

  /* firebox */
  const flick = 0.08 * Math.sin(t * 9.7) + 0.05 * Math.sin(t * 23.3 + 1);
  $('fire-glow').style.opacity =
    clamp((S.damperOpen ? 0.62 : 0.1) + flick * (S.damperOpen ? 1 : 0.3), 0, 1);

  /* steam wisps */
  const ventBoost = Math.max(0, 1 - (t - S.ventT) / 1.6);
  const wispBase = clamp((p - 30) / 130, 0, 1) * 0.4 + ventBoost * 0.75;
  wisps.forEach((w, i) => {
    const k = ((t / (3.2 + i * 0.9) + i * 0.37) % 1);
    w.style.opacity = Math.max(0, wispBase * (1 - k) * k * 2.2).toFixed(3);
    /* rise and thin out — vapour streaks, not inflating bubbles */
    w.style.transform =
      `translate(${(Math.sin((t + i * 7) * 0.55) * 14 - 27).toFixed(1)}px, ${(-k * 150).toFixed(1)}px) scale(${(0.75 + k * 0.35).toFixed(2)}, ${(0.9 + k * 1.1).toFixed(2)})`;
  });

  /* reader card */
  const rc = $('reader-card');
  const rSig = cardSig(S.reader);
  if (rSig !== ui.readerSig) {
    ui.readerSig = rSig;
    rc.hidden = !S.reader;
    if (S.reader) panels.renderCardFace(rc, S.reader.code, S.reader.certified, S.reader.name);
  }
  if (S.reader) {
    let prog = 0;
    if (S.draw) prog = clamp((t - S.draw.t0) / (S.draw.cols[5].lockT - S.draw.t0), 0, 1);
    rc.style.transform = `translateX(${(-64 * prog).toFixed(1)}px)`;
  }

  /* tray card */
  const tc = $('tray-card');
  const tSig = cardSig(S.tray);
  if (tSig !== ui.traySig) {
    ui.traySig = tSig;
    tc.hidden = !S.tray;
    if (S.tray) panels.renderCardFace(tc, S.tray.code, false, null);
  }

  /* placard */
  const ptxt = placardText(t, S, open, p);
  if (ptxt !== ui.placard) { ui.placard = ptxt; $('placard-text').textContent = ptxt; }

  /* tape */
  const tape = $('tape');
  for (const entry of S.log) {
    if (entry.seq > ui.tapeSeq) {
      ui.tapeSeq = entry.seq;
      const pEl = document.createElement('p');
      pEl.innerHTML = `<span class="tt">${stamp(entry.t)}</span>${entry.text}`;
      tape.appendChild(pEl);
      while (tape.children.length > 26) tape.removeChild(tape.firstChild);
    }
  }

  /* continuous audio */
  audio.setHiss(clamp((p - 20) / 140, 0, 1) * (S.damperOpen ? 1 : 0.45) + ventBoost * 0.9);
  audio.setShimmer(open * (S.aperture && S.aperture.live ? 1 : 0.15));

  /* edge-triggered effects */
  const locks = sim.locksAt(t);
  if (locks > ui.prev.locks) audio.flagTak();
  ui.prev.locks = locks;

  const liveNow = !!(S.aperture && S.aperture.live && open > 0.15);
  if (liveNow && !ui.prev.liveNow) audio.whoomph();
  ui.prev.liveNow = liveNow;

  const deadNow = !!(S.aperture && !S.aperture.live && open > 0.08);
  if (deadNow && !ui.prev.deadNow) audio.sadThud();
  ui.prev.deadNow = deadNow;

  if (S.draw && sim.drawingAt(t)) {
    const step = S.draw.certified ? 0.09 : 0.42;
    const ftick = Math.floor((t - S.draw.t0) / step);
    if (ftick !== ui.prev.feedTick) { audio.tick(); ui.prev.feedTick = ftick; }
  }
}

/* ---------------- boot ---------------- */

function boot() {
  panels.buildGauge();
  panels.buildGovernor();
  panels.buildAnnunciator();
  buildIris();
  wire();
  document.querySelectorAll('#steam-wisps i').forEach(w => wisps.push(w));

  const frame = () => { render(now()); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  /* backstop: keep chasing state if rAF is starved */
  setInterval(() => { const t = now(); if (t - ui.lastRenderT > 0.28) render(t); }, 250);

  console.log('[old-punctual] visibilityState =', document.visibilityState);
  document.addEventListener('visibilitychange', () =>
    console.log('[old-punctual] visibilityState →', document.visibilityState));

  if (new URLSearchParams(location.search).has('works')) {
    import('./harness.js').then(m => m.init()).catch(e => console.error('[works] failed to load', e));
  }
}

boot();
