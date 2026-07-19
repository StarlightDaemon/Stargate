// Integration: builds the console UI, wires every module together, and runs
// the single rAF loop that drives ring + portal. Fully client-side.

import { GLYPHS, ERIDU, glyphSvg } from './glyphs.js';
import { DESTINATIONS, findBySignature } from './destinations.js';
import { GeodesicCache, CACHE_SLOTS } from './cache.js';
import { audio } from './audio.js';
import { Telemetry } from './telemetry.js';
import { Ring } from './ring.js';
import { Portal } from './portal.js';
import { Dialer } from './dialer.js';
import { maybeRunDiagnostics } from './selftest.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (id) => document.getElementById(id);

// ---------- module wiring ----------

const telemetry = new Telemetry();
const cache = new GeodesicCache();
const ring = new Ring($('ring'), REDUCED);
const portal = new Portal($('aperture'), REDUCED);
const dialer = new Dialer({ ring, portal, audio, telemetry, cache });

// ---------- catalog panel ----------

const catalogEl = $('catalog');
const dialButtons = [];

function buildCatalog() {
  for (const dest of DESTINATIONS) {
    const li = document.createElement('li');
    li.className = 'route';
    li.title = dest.epithet + ' — ' + dest.hazard;

    const name = document.createElement('div');
    name.className = 'r-name';
    name.textContent = dest.name;

    const meta = document.createElement('div');
    meta.className = 'r-meta';
    const sigSpan = document.createElement('span');
    sigSpan.className = 'r-sig';
    sigSpan.innerHTML = dest.signature.map(glyphSvg).join('');
    meta.append(`${dest.cls} · ${dest.distanceLy.toLocaleString('en-US')} ly`, sigSpan);
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'RECALL';
    badge.hidden = true;
    meta.append(badge);

    const btn = document.createElement('button');
    btn.className = 'ctl small dialBtn';
    btn.type = 'button';
    btn.textContent = 'DIAL';
    btn.addEventListener('click', () => { audio.click(); dialer.dial(dest); });

    li.append(name, meta, btn);
    catalogEl.appendChild(li);
    dialButtons.push({ btn, badge, dest });
  }
}

function refreshCacheBadges() {
  for (const { badge, dest } of dialButtons) badge.hidden = !cache.has(dest.id);
  telemetry.setCache(cache.count, CACHE_SLOTS);
}

// ---------- signature composer ----------

const slotsEl = $('slots');
const paletteEl = $('palette');
const compileBtn = $('compileBtn');
let composed = []; // up to 8 glyph indices

function buildComposer() {
  for (let i = 0; i < 35; i++) {
    const b = document.createElement('button');
    b.className = 'gbtn';
    b.type = 'button';
    b.title = GLYPHS[i].name;
    b.innerHTML = glyphSvg(i);
    b.addEventListener('click', () => {
      if (dialer.phase !== 'idle' || composed.length >= 8) return;
      audio.click();
      composed.push(i);
      renderSlots();
    });
    paletteEl.appendChild(b);
  }
  renderSlots();
}

function renderSlots() {
  slotsEl.replaceChildren();
  for (let i = 0; i < 9; i++) {
    const s = document.createElement('button');
    s.type = 'button';
    if (i === 8) {
      s.className = 'slot terminal';
      s.title = 'ERIDU — local invariant (fixed)';
      s.innerHTML = glyphSvg(ERIDU);
      s.tabIndex = -1;
    } else if (i < composed.length) {
      s.className = 'slot';
      s.title = GLYPHS[composed[i]].name + ' — click to remove from here';
      s.innerHTML = glyphSvg(composed[i]);
      const at = i;
      s.addEventListener('click', () => {
        if (dialer.phase !== 'idle') return;
        audio.click();
        composed = composed.slice(0, at);
        renderSlots();
      });
    } else {
      s.className = 'slot empty';
      s.title = 'empty slot';
    }
    slotsEl.appendChild(s);
  }
  compileBtn.disabled = composed.length !== 8 || dialer.phase !== 'idle';
}

compileBtn.addEventListener('click', () => {
  if (composed.length !== 8 || dialer.phase !== 'idle') return;
  audio.click();
  const match = findBySignature(composed);
  const sig = composed;
  composed = [];
  renderSlots();
  if (match) {
    telemetry.log(`manual signature matches surveyed route: ${match.name}`, 'ice');
    dialer.dial(match);
  } else {
    dialer.divergeSequence(sig);
  }
});

$('clearSigBtn').addEventListener('click', () => {
  audio.click();
  composed = [];
  renderSlots();
});

// ---------- stage controls & status ----------

const lamp = $('statusLamp');
const phaseText = $('phaseText');
const abortBtn = $('abortBtn');
const probeBtn = $('probeBtn');
const collapseBtn = $('collapseBtn');

const LAMP_BY_PHASE = { idle: 'idle', solve: 'solve', recall: 'recall', open: 'open', collapse: 'idle' };

dialer.addEventListener('state', (e) => {
  const { phase, dest } = e.detail;
  lamp.className = 'lamp ' + (LAMP_BY_PHASE[phase] || 'idle');
  abortBtn.hidden = !(phase === 'solve' || phase === 'recall');
  collapseBtn.hidden = phase !== 'open';
  probeBtn.hidden = !(phase === 'open' && dest && dest.probe.length);
  const busy = phase !== 'idle';
  for (const { btn } of dialButtons) btn.disabled = busy;
  for (const b of paletteEl.children) b.disabled = busy;
  compileBtn.disabled = busy || composed.length !== 8;
});

dialer.addEventListener('phasetext', (e) => {
  phaseText.textContent = e.detail.text;
  phaseText.className = e.detail.cls || '';
  if (e.detail.cls === 'danger') lamp.className = 'lamp danger';
});

dialer.addEventListener('cachechange', refreshCacheBadges);

abortBtn.addEventListener('click', () => { audio.click(); dialer.abort(); });
collapseBtn.addEventListener('click', () => { audio.click(); dialer.close(); });

let probeBusy = false;
probeBtn.addEventListener('click', async () => {
  if (probeBusy || dialer.phase !== 'open' || !dialer.dest) return;
  probeBusy = true;
  probeBtn.disabled = true;
  const dest = dialer.dest;
  audio.probeBeep(0);
  telemetry.log('probe away — transit time 0.4 s', 'ice');
  let n = 1;
  for (const line of dest.probe) {
    await new Promise(r => setTimeout(r, 1400));
    if (dialer.dest !== dest || dialer.phase !== 'open') break; // aperture closed mid-telemetry
    audio.probeBeep(n++);
    telemetry.log('probe: ' + line, 'ice');
  }
  if (dialer.phase === 'open') telemetry.log('probe telemetry complete; probe holding station', 'ok');
  probeBusy = false;
  probeBtn.disabled = false;
});

// ---------- top bar ----------

$('aboutBtn').addEventListener('click', () => { audio.click(); $('aboutDialog').showModal(); });

const muteBtn = $('muteBtn');
const SOUND_KEY = 'meridian.sound.v1';

function setSound(on) {
  if (on) { audio.init(); audio.setMuted(false); }
  else audio.setMuted(true);
  muteBtn.textContent = on ? 'SOUND: ON' : 'SOUND: OFF';
  muteBtn.setAttribute('aria-pressed', String(on));
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { }
}

muteBtn.addEventListener('click', () => setSound(audio.muted));

// restore a previous sound preference on the first user gesture
// (browsers require a gesture before audio can start)
if ((() => { try { return localStorage.getItem(SOUND_KEY) === 'on'; } catch { return false; } })()) {
  window.addEventListener('pointerdown', () => setSound(true), { once: true });
}

$('purgeBtn').addEventListener('click', () => {
  audio.click();
  cache.purge();
  refreshCacheBadges();
  telemetry.log('ENGINEERING: geodesic cache purged — all routes revert to COLD SOLVE', 'warn');
});

// ---------- main loop ----------

window.__meridian = window.__meridian || {};
window.__meridian.frames = 0;
window.__meridian.dialer = dialer;

let last = performance.now();
function frame(now) {
  const dt = Math.min(now - last, 100);
  last = now;
  ring.tick(dt);
  portal.tick(dt);
  audio.setSpin(ring.spin);
  window.__meridian.frames++;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- boot ----------

buildCatalog();
buildComposer();
refreshCacheBadges();

telemetry.startAmbient(() => portal.strain * 0.8 + (dialer.phase === 'open' ? 0.45 : 0));
telemetry.log('MERIDIAN console online — local instance, fully client-side', 'ok');
telemetry.log('artifact link nominal; ambient drift 0.03 rad/s');
telemetry.log('no data leaves this page. all destinations are fictional.');
if (cache.count > 0) {
  telemetry.log(`geodesic cache loaded — ${cache.count} imprint(s) ready for LATTICE RECALL`, 'recall');
}
if (REDUCED) telemetry.log('reduced-motion preference honored: calm rendering profile', 'ice');

maybeRunDiagnostics({ dialer, telemetry, cache });
