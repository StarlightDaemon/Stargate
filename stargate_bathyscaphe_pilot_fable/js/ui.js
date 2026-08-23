// ============================================================================
//  Pilot console controller — wires the simulation, audio, sphere renderer,
//  crush-depth gauge, the two primary control clusters, passive telemetry,
//  secondary panels, localStorage persistence and the session log.
// ============================================================================
import { VERSION, VESSEL, CHANNELS, GLYPHS, GLYPH_BY_ID, PRESETS, MOODS, ARCHIVE, ARCHIVE_BY_ID, ARCHIVE_TYPES, REFERENCE } from './data.js';
import { AudioEngine } from './audio.js';
import { Sim, TIMING, RATED_BAR } from './sim.js';
import { Viewport, Gauge } from './viewport.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const fmt = (n, d = 0) => Number(n).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/,/g, ' ');
const pad2 = n => String(n).padStart(2, '0');
// Dive time runs at ×240 compression: one real second is four dive minutes.
// Vertical speeds are reported in dive-time m/min so they read as a real descent.
const TIME_COMPRESSION = 240;
window.__TIME_COMPRESSION = TIME_COMPRESSION;

// ---------------------------------------------------------------------------
// localStorage persistence (single-user, single-device, this build only)
// ---------------------------------------------------------------------------
const STORE_PREFIX = 'lantern.v1.';
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(STORE_PREFIX + key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, val) { try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(val)); } catch { /* storage unavailable — run volatile */ } },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith(STORE_PREFIX)).forEach(k => localStorage.removeItem(k)); } catch { } },
};
const DEFAULT_PREFS = { mood: 'cerulean', density: 'standard', motion: 'normal', master: 0.8, layers: { ambient: true, vessel: true, effects: true, groans: true }, autoAudio: true };
const prefs = Object.assign({}, DEFAULT_PREFS, store.get('prefs', {}));
prefs.layers = Object.assign({}, DEFAULT_PREFS.layers, prefs.layers || {});
let history = store.get('history', []);
let viewed = new Set(store.get('viewed', []));
const sessionsBefore = store.get('sessions', 0);
store.set('sessions', sessionsBefore + 1);

// ---------------------------------------------------------------------------
// Session log — real, timestamped, this visitor's actions only
// ---------------------------------------------------------------------------
const sessionT0 = performance.now();
const sessionLog = [];
function elapsed() { const ms = performance.now() - sessionT0; const s = Math.floor(ms / 1000); return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}.${String(Math.floor(ms % 1000)).padStart(3, '0')}`; }
function log(kind, msg, level = '') {
  const e = { t: elapsed(), wall: new Date().toISOString(), kind, msg, level };
  sessionLog.push(e);
  $('#helm-ticker').textContent = `${e.t.slice(0, 8)}  ${kind} · ${msg}`;
  if (panelOpen === 'log') renderLog();
}

// ---------------------------------------------------------------------------
// Scale: the 1920×1080 stage scales by a bare number — never a length.
// ---------------------------------------------------------------------------
const stage = $('#stage');
let uiScale = 1;
function applyScale() {
  const vw = window.innerWidth, vh = window.innerHeight;
  uiScale = Math.min(vw / 1920, vh / 1080);
  document.documentElement.style.setProperty('--ui-scale', String(uiScale));
  stage.style.left = `${Math.round((vw - 1920 * uiScale) / 2)}px`;
  stage.style.top = `${Math.round((vh - 1080 * uiScale) / 2)}px`;
  if (viewport) viewport.setRenderScale(Math.min(2.5, Math.max(1, uiScale * (window.devicePixelRatio || 1))));
  window.__lanternScale = { uiScale, vw, vh, transform: getComputedStyle(stage).transform };
}
window.addEventListener('resize', applyScale);

// ---------------------------------------------------------------------------
// Build: glyph bank, sequence strip, channels, telemetry rows
// ---------------------------------------------------------------------------
function glyphSvg(g, cls = '') {
  return `<svg viewBox="0 0 40 40" class="${cls}" aria-hidden="true"><path d="${g.path}"/></svg>`;
}
const bank = $('#glyph-bank');
GLYPHS.forEach(g => {
  const b = document.createElement('button');
  b.className = 'glyph available'; b.dataset.glyph = g.id; b.title = `${g.name} — ${g.note}`;
  b.innerHTML = `${glyphSvg(g)}<span><span class="g-name">${g.name.toUpperCase()}</span><br><span class="g-depth">${fmt(g.depth)} m</span></span><span class="g-id">${g.id}</span>`;
  bank.appendChild(b);
});
const seqStrip = $('#seq-strip');
for (let i = 0; i < VESSEL.sequenceLength; i++) {
  const s = document.createElement('div'); s.className = 'seq-slot'; s.dataset.slot = i;
  s.innerHTML = `<span class="ss-idx">${i + 1}</span><span class="ss-empty">—</span>`;
  seqStrip.appendChild(s);
}
const chanEls = {};
const chanWrap = $('#channels');
CHANNELS.forEach(c => {
  const d = document.createElement('div'); d.className = `chan ${c.kind}`; d.dataset.ch = c.id;
  d.innerHTML = `<span class="c-id">${c.id}</span><span class="c-label">${c.label}</span><span class="c-bar"><span class="c-fill"></span></span><span class="c-val">0 %</span>`;
  chanWrap.appendChild(d);
  chanEls[c.id] = { fill: $('.c-fill', d), val: $('.c-val', d), row: d };
});
const TEL = {
  env: [['pressure', 'AMBIENT PRESSURE', 'bar'], ['waterTemp', 'WATER TEMP', '°C'], ['density', 'DENSITY', 'kg/m³'], ['lux', 'AMBIENT LIGHT', 'lux'], ['lampPower', 'LAMPS', '%']],
  hull: [['hullLoad', 'HULL LOAD', '% rated'], ['crushMargin', 'CRUSH MARGIN', '%'], ['strain', 'EQUATOR STRAIN', 'µε'], ['compression', 'SPHERE COMPRESSION', 'mm'], ['seatLoad', 'SEAT RING LOAD', '%']],
  cabin: [['o2', 'CABIN O₂', '%'], ['co2', 'CABIN CO₂', 'ppm'], ['scrubber', 'SCRUBBER', ''], ['cabinTemp', 'CABIN TEMP', '°C'], ['battery', 'BATTERY', '%']],
  att: [['pitch', 'PITCH', '°'], ['roll', 'ROLL', '°'], ['trim', 'TRIM BIAS', ''], ['vel', 'VERTICAL SPEED', 'm/min'], ['thrTotal', 'THRUST LOAD', '%']],
};
const telEls = {};
for (const grp in TEL) {
  const wrap = $(`#tel-${grp}`);
  TEL[grp].forEach(([k, label, unit]) => {
    const r = document.createElement('div'); r.className = 'tel-row';
    r.innerHTML = `<span class="t-label">${label}</span><span class="t-val">—</span><span class="t-unit">${unit}</span>`;
    wrap.appendChild(r); telEls[k] = { row: r, val: $('.t-val', r) };
  });
}

// ---------------------------------------------------------------------------
// Engines
// ---------------------------------------------------------------------------
const audio = new AudioEngine();
audio.layers = Object.assign({}, prefs.layers); audio.master = prefs.master;
const viewport = new Viewport($('#viewport'), 660);
const gauge = new Gauge($('#gauge'));
const sim = new Sim(onSimEvent);
window.__lantern = { sim, audio, prefs, sessionLog, get history() { return history; }, store, VERSION };

// ---------------------------------------------------------------------------
// Sim event handling → UI, audio, log, persistence
// ---------------------------------------------------------------------------
let currentPlan = null;   // planned waypoint depths (replay), for the gauge
let activePreset = null;
let lastMsg = '';
function setMsg(text, cls = '') { const m = $('#profile-msg'); m.textContent = text; m.className = `profile-msg ${cls}`; lastMsg = text; }

function onSimEvent(type, p) {
  switch (type) {
    case 'lockStart': {
      const g = GLYPH_BY_ID[p.glyphId];
      setMsg(`${p.auto ? 'REPLAY ' : ''}WP ${p.index + 1} · FLOODING BALLAST → ${g.name.toUpperCase()} ${fmt(g.depth)} m`);
      audio.flood(p.dur / 1000 * 0.55, Math.min(1, 0.5 + (p.to - p.from) / 2000));
      log('PROFILE', `waypoint ${p.index + 1} selected: ${g.id} ${g.name} ${fmt(g.depth)} m${p.auto ? ' (dive computer replay)' : ''}`);
      break;
    }
    case 'lockStage': setMsg(`SETTLING · THRUSTERS CORRECTING TOWARD NEUTRAL BUOYANCY`, ''); break;
    case 'thruster': audio.thruster(p.dur / 1000, p.power); break;
    case 'vent': audio.vent(0.45); break;
    case 'groan': audio.groan(p.intensity); log('HULL', `creak event at ${fmt(p.depth)} m — seat relaxation, within limits`, 'warn'); break;
    case 'lockComplete': {
      const g = GLYPH_BY_ID[p.glyphId];
      audio.holdConfirm();
      log('HOLD', `neutral buoyancy hold at ${fmt(p.depth)} m (${g.name}) — waypoint ${p.index + 1}/${VESSEL.sequenceLength} locked`, 'good');
      if (!sim.complete) setMsg(`HOLD CONFIRMED AT ${fmt(p.depth)} m · SELECT WAYPOINT ${p.index + 2}`);
      break;
    }
    case 'pending':
      setMsg(`PROFILE COMPLETE · APPROACH HOLD ${fmt(sim.holdDepth)} m · RING AT ${fmt(sim.holdDepth + VESSEL.ringOffset)} m — HELM: COMMENCE FINAL DESCENT`, '');
      log('PROFILE', `profile complete — approach hold ${fmt(sim.holdDepth)} m. System PENDING; awaiting pilot activation`, 'good');
      break;
    case 'reject':
      audio.reject(); setMsg(p.why, 'warn');
      if (p.glyphId) { const b = $(`.glyph[data-glyph="${p.glyphId}"]`); if (b) { b.classList.add('rejected'); setTimeout(() => b.classList.remove('rejected'), 400); } }
      log('REJECT', p.why + (p.glyphId ? ` (${p.glyphId})` : ''), 'warn');
      break;
    case 'lockoutBlocked':
      audio.lockoutAlarm(); showLockoutBanner();
      log('LOCKOUT', 'final descent inhibited — hull-integrity lockout engaged', 'danger');
      break;
    case 'lockout':
      $('#lockout-ctl').classList.toggle('engaged', p.on); $('#lockout-state').textContent = p.on ? 'ENGAGED' : 'RELEASED';
      log('LOCKOUT', p.on ? 'hull-integrity lockout ENGAGED by pilot' : 'hull-integrity lockout released', p.on ? 'danger' : 'good');
      if (!p.on) hideLockoutBanner();
      break;
    case 'buildup':
      audio.buildup(p.dur / 1000); currentPlan = sim.sequence.map(id => GLYPH_BY_ID[id].depth);
      setMsg(`FINAL DESCENT · ${fmt(p.from)} → ${fmt(p.to)} m`, '');
      log('ACTIVATE', `COMMENCE FINAL DESCENT — buildup from ${fmt(p.from)} m to ring depth ${fmt(p.to)} m`, 'good');
      break;
    case 'breakthrough':
      audio.breakthrough(); setMsg(`BREAKTHROUGH · RING RESPONDING · APERTURE OPENING`, '');
      log('BREAKTHROUGH', `target depth ${fmt(p.depth)} m reached — pressure-hull aperture opening, ring responding`, 'good');
      break;
    case 'active':
      audio.startActiveDrone(); setMsg(`SUSTAINED HOLD INSIDE RING · ${fmt(p.depth)} m · EMERGENCY ASCENT TO LEAVE`, '');
      log('ACTIVE', `sustained ring hold at ${fmt(p.depth)} m — aperture open, station-keeping`, 'good');
      recordDive({ outcome: 'ring hold', depth: p.depth });
      break;
    case 'ascendStart': {
      audio.stopActiveDrone(); audio.blowBallast(); currentPlan = null; hideLockoutBanner();
      const what = p.fromPhase === 'idle' && p.fromDepth < 1 ? 'at surface — ballast already empty' : `from ${fmt(p.fromDepth)} m (${p.fromPhase})`;
      log('ASCENT', `EMERGENCY ASCENT — blow all ballast ${what}`, 'warn');
      setMsg(p.fromDepth < 1 ? 'BALLAST BLOWN AT SURFACE · NO EFFECT' : `EMERGENCY ASCENT · ALL BALLAST BLOWN · ${fmt(p.fromDepth)} m → SURFACE`, 'warn');
      if (!p.wasActive && p.sequence.length) recordDive({ outcome: 'aborted', depth: p.fromDepth, sequence: p.sequence, presetId: p.presetId, maxHullLoad: p.maxHullLoad });
      activePreset = null;
      break;
    }
    case 'surfaced':
      setMsg('SURFACED · PROFILE CLEARED · SELECT THE FIRST STRATUM TO BEGIN A NEW DESCENT');
      log('SURFACE', 'vessel surfaced — profile cleared, console idle', '');
      break;
    case 'autoStart':
      activePreset = p.preset; currentPlan = p.preset.sequence.map(id => GLYPH_BY_ID[id].depth);
      log('REPLAY', `dive computer replay ${p.preset.id} ${p.preset.name} (${p.preset.tier}) — ${p.preset.sequence.length} waypoints at processor speed`, p.preset.tier === 'experimental' ? 'warn' : 'good');
      setMsg(`DIVE COMPUTER REPLAY ${p.preset.id} · ${p.preset.name.toUpperCase()}`);
      break;
    case 'autoStep': break;
    case 'autoDone': log('REPLAY', `replay ${p.preset.id} complete — approach hold reached, PENDING. Activation remains a pilot action`, 'good'); break;
    case 'autoAbort': log('REPLAY', `replay ${p.preset.id} aborted at ${p.glyphId}`, 'danger'); break;
  }
  renderControls();
}

function recordDive(d) {
  const entry = {
    when: new Date().toISOString(), outcome: d.outcome, depth: Math.round(d.depth),
    sequence: d.sequence || sim.sequence.slice(), presetId: d.presetId !== undefined ? d.presetId : (activePreset ? activePreset.id : sim.presetId),
    maxHullLoad: Math.round((d.maxHullLoad != null ? d.maxHullLoad : sim.maxHullLoad) * 10) / 10,
  };
  history.unshift(entry); history = history.slice(0, 60); store.set('history', history);
  if (panelOpen === 'computer') renderHistory();
}

// ---------------------------------------------------------------------------
// Lockout banner
// ---------------------------------------------------------------------------
let bannerTimer = null;
function showLockoutBanner() {
  const b = $('#lockout-banner'); b.hidden = false;
  $('#btn-commence').classList.add('lockout-blocked');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(hideLockoutBanner, 3600);
}
function hideLockoutBanner() { $('#lockout-banner').hidden = true; $('#btn-commence').classList.remove('lockout-blocked'); }

// ---------------------------------------------------------------------------
// Controls rendering (state → DOM)
// ---------------------------------------------------------------------------
function renderControls() {
  const phase = sim.phase;
  document.body.dataset.phase = phase;
  // glyph bank
  $$('.glyph').forEach(b => {
    const id = b.dataset.glyph; const g = GLYPH_BY_ID[id];
    const locked = sim.sequence.includes(id);
    const locking = sim.lock && sim.lock.glyphId === id;
    const avail = !locked && !locking && (phase === 'idle') && !sim.complete && g.depth > sim.holdDepth;
    b.classList.toggle('locked', locked); b.classList.toggle('locking', !!locking);
    b.classList.toggle('available', avail); b.classList.toggle('unavailable', !avail && !locked && !locking);
    b.disabled = false; // never disabled: rejection feedback is informative
    b.setAttribute('aria-pressed', locked ? 'true' : 'false');
  });
  // sequence strip
  $$('.seq-slot').forEach((s, i) => {
    const id = sim.sequence[i];
    const locking = sim.lock && sim.lock.index === i;
    s.classList.toggle('locked', !!id); s.classList.toggle('locking', !!locking);
    if (id) { const g = GLYPH_BY_ID[id]; s.innerHTML = `<span class="ss-idx">${i + 1}</span>${glyphSvg(g)}<span class="ss-depth">${fmt(g.depth)}</span>`; }
    else if (locking) { const g = GLYPH_BY_ID[sim.lock.glyphId]; s.innerHTML = `<span class="ss-idx">${i + 1}</span>${glyphSvg(g)}<span class="ss-depth">…</span>`; }
    else s.innerHTML = `<span class="ss-idx">${i + 1}</span><span class="ss-empty">—</span>`;
  });
  // helm
  $('#hp-count').textContent = sim.sequence.length;
  const commence = $('#btn-commence'); const cs = $('#commence-state');
  const canCommence = phase === 'pending';
  commence.disabled = !canCommence;
  commence.dataset.armed = canCommence ? 'true' : 'false';
  cs.textContent = { idle: sim.sequence.length ? 'PROFILE IN PROGRESS' : 'AWAITING PROFILE', locking: 'TRIM SEQUENCE RUNNING', pending: sim.lockout ? 'INHIBITED — LOCKOUT' : 'ARMED — PILOT ACTION REQUIRED', buildup: 'DESCENDING', breakthrough: 'APERTURE OPENING', active: 'RING HOLD ACTIVE', ascending: 'ASCENDING' }[phase];
  $('#helm-state').textContent = {
    idle: sim.holdDepth > 0 ? `NEUTRAL HOLD · ${fmt(sim.holdDepth)} m` : 'SURFACE · NO PROFILE',
    locking: `TRIMMING TO ${fmt(sim.lock ? sim.lock.to : 0)} m`,
    pending: `READY · RING ${fmt(sim.holdDepth + VESSEL.ringOffset)} m`,
    buildup: 'FINAL DESCENT · BUILDUP', breakthrough: 'BREAKTHROUGH', active: `ACTIVE · RING HOLD ${fmt(sim.ringDepth)} m`, ascending: 'EMERGENCY ASCENT',
  }[phase];
  $('#ro-target').textContent = sim.complete || phase === 'buildup' || phase === 'breakthrough' || phase === 'active' ? fmt(sim.ringDepth || sim.holdDepth + VESSEL.ringOffset) : (currentPlan ? fmt(currentPlan[currentPlan.length - 1] + VESSEL.ringOffset) : '—');
}

// ---------------------------------------------------------------------------
// Telemetry rendering (passive, every frame at a modest rate)
// ---------------------------------------------------------------------------
let telTick = 0;
function renderTelemetry() {
  const t = sim.telemetry; if (!t) return;
  for (const c of CHANNELS) {
    const s = sim.ch[c.id]; const e = chanEls[c.id];
    if (c.kind === 'trim') {
      const v = Math.max(-1, Math.min(1, s.v)); e.fill.style.width = `${Math.abs(v) * 50}%`; e.fill.classList.toggle('neg', v < 0);
      e.val.textContent = `${v >= 0 ? '+' : ''}${(v * 100).toFixed(0)} %`;
    } else {
      const v = Math.max(0, Math.min(1, s.v)); e.fill.style.width = `${v * 100}%`; e.val.textContent = `${(v * 100).toFixed(0)} %`;
      e.row.classList.toggle('hot', (c.kind === 'vthr' || c.kind === 'hthr') && v > 0.85);
    }
  }
  if (++telTick % 3) return;  // environment rows at ~20 Hz
  const set = (k, v, cls) => { const e = telEls[k]; if (!e) return; e.val.textContent = v; e.row.className = `tel-row ${cls || ''}`; };
  set('pressure', t.pressure < 10 ? t.pressure.toFixed(2) : fmt(t.pressure, 1));
  set('waterTemp', t.waterTemp.toFixed(2));
  set('density', fmt(t.density, 1));
  set('lux', t.lux >= 1 ? fmt(t.lux, 1) : t.lux >= 0.001 ? t.lux.toFixed(3) : '0.000', t.lux < 0.001 ? 'warn' : '');
  set('lampPower', t.lampPower.toFixed(0), t.lampPower > 0 ? 'good' : '');
  set('hullLoad', t.hullLoad.toFixed(1), t.hullLoad > 95 ? 'danger' : t.hullLoad > 80 ? 'warn' : '');
  set('crushMargin', t.crushMargin.toFixed(1), t.crushMargin < 8 ? 'danger' : t.crushMargin < 20 ? 'warn' : '');
  set('strain', fmt(t.strain, 0));
  set('compression', t.compression.toFixed(2));
  set('seatLoad', t.seatLoad.toFixed(1));
  set('o2', t.o2.toFixed(2), t.o2 < 19.5 ? 'warn' : '');
  set('co2', fmt(t.co2, 0), t.co2 > 1100 ? 'warn' : '');
  set('scrubber', t.scrubberCycle ? 'CYCLING' : 'STANDBY', t.scrubberCycle ? 'good' : '');
  set('cabinTemp', t.cabinTemp.toFixed(1), t.cabinTemp < 12 ? 'warn' : '');
  set('battery', t.battery.toFixed(1), t.battery < 30 ? 'warn' : '');
  set('pitch', `${t.pitch >= 0 ? '+' : ''}${t.pitch.toFixed(1)}`);
  set('roll', `${t.roll >= 0 ? '+' : ''}${t.roll.toFixed(1)}`);
  set('trim', `${t.trim >= 0 ? 'FWD ' : 'AFT '}${Math.abs(t.trim * 100).toFixed(0)}`);
  set('vel', sim.auto ? 'REPLAY' : `${t.vel >= 0 ? '▼' : '▲'} ${Math.abs(t.vel * 60 / TIME_COMPRESSION).toFixed(1)}`);
  set('thrTotal', (t.thrTotal * 100).toFixed(0), t.thrTotal > 0.7 ? 'warn' : '');
  $('#ro-depth').textContent = fmt(t.depth, 0);
  $('#ro-pressure').textContent = t.pressure < 10 ? t.pressure.toFixed(2) : fmt(t.pressure, 0);
  $('#ro-hull').textContent = t.hullLoad.toFixed(1);
  audio.setDepthNorm(Math.min(1, t.depth / VESSEL.ratedDepth));
  if (vesselLive && panelOpen === 'vessel') renderVesselLive();
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let lastT = performance.now();
let lastPhase = sim.phase;
let creakTimer = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  sim.update(now, dt);
  if (sim.phase !== lastPhase) { lastPhase = sim.phase; renderControls(); }
  // random seat creaks at depth, more frequent deeper
  creakTimer -= dt;
  if (creakTimer <= 0) { creakTimer = 4 + Math.random() * 10; if (sim.depth > 3000 && Math.random() < sim.depth / VESSEL.ratedDepth) audio.creak(); }
  viewport.draw(sim, dt, sim.phase);
  gauge.update(sim, currentPlan);
  renderTelemetry();
  const s = Math.floor((now - sessionT0) / 1000);
  $('#mission-clock').textContent = `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}`;
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Input — primary controls
// ---------------------------------------------------------------------------
function ensureAudio() { if (!audio.started && prefs.autoAudio !== false) toggleAudio(true); else audio.resume(); }
bank.addEventListener('click', e => {
  const b = e.target.closest('.glyph'); if (!b) return;
  ensureAudio(); audio.uiTick();
  sim.selectGlyph(b.dataset.glyph);
  renderControls();
});
$('#btn-commence').addEventListener('click', () => { ensureAudio(); audio.click(); log('HELM', 'COMMENCE FINAL DESCENT pressed'); sim.commence(); renderControls(); });
$('#btn-ascend').addEventListener('click', () => { ensureAudio(); log('HELM', 'EMERGENCY ASCENT pressed'); sim.emergencyAscent(); renderControls(); });
$('#lockout').addEventListener('change', e => { ensureAudio(); audio.click(); sim.setLockout(e.target.checked); renderControls(); });

function toggleAudio(force) {
  const want = force != null ? force : !audio.started;
  if (want) {
    if (audio.start()) { $('#btn-audio').classList.add('on'); $('#audio-state').textContent = 'ON'; audio.setMaster(prefs.master); for (const k in prefs.layers) audio.setLayer(k, prefs.layers[k]); if (sim.phase === 'active') audio.startActiveDrone(); log('AUDIO', 'audio engine started — ambient, vessel, effects, groan layers'); prefs.autoAudio = true; savePrefs(); }
  } else {
    // Web Audio contexts can be suspended but the engine stays built.
    if (audio.ctx) { try { audio.ctx.close(); } catch { } }
    $('#btn-audio').classList.remove('on'); $('#audio-state').textContent = 'OFF'; audio.started = false; audio.ctx = null; audio._activeDrone = null;
    log('AUDIO', 'audio engine stopped'); prefs.autoAudio = false; savePrefs();
  }
}
$('#btn-audio').addEventListener('click', () => toggleAudio());

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------
let panelOpen = null;
let vesselLive = false;
function openPanel(name) {
  if (panelOpen === name) { closePanel(); return; }
  panelOpen = name;
  $('#panel-layer').hidden = false;
  $$('.panel').forEach(p => p.hidden = p.id !== `panel-${name}`);
  $$('.tab[data-panel]').forEach(t => t.classList.toggle('active', t.dataset.panel === name));
  if (name === 'archive') renderArchive();
  if (name === 'vessel') { buildVessel(); vesselLive = true; }
  if (name === 'computer') { renderPresets(); renderHistory(); }
  if (name === 'log') renderLog();
  if (name === 'settings') renderSettings();
  log('PANEL', `opened ${name.toUpperCase()} panel`);
}
function closePanel() {
  if (!panelOpen) return;
  log('PANEL', `closed ${panelOpen.toUpperCase()} panel`);
  panelOpen = null; vesselLive = false;
  $('#panel-layer').hidden = true; $$('.tab[data-panel]').forEach(t => t.classList.remove('active'));
}
$$('.tab[data-panel]').forEach(t => t.addEventListener('click', () => { ensureAudio(); audio.uiTick(); openPanel(t.dataset.panel); }));
$$('[data-close]').forEach(b => b.addEventListener('click', closePanel));
$('#panel-layer').addEventListener('click', e => { if (e.target.id === 'panel-layer') closePanel(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePanel(); $('#help-overlay').hidden = true; } });

// ---- Archive ---------------------------------------------------------------
const TYPE_COL = { DIVE: 'var(--accent)', CREW: 'var(--accent2)', INCIDENT: 'var(--danger)', DISCOVERY: '#ffd36b', MAINT: 'var(--dim)' };
let archiveFilter = 'ALL', archiveQuery = '', archiveSel = null;
const backlinks = {};
ARCHIVE.forEach(e => e.refs.forEach(r => { (backlinks[r] = backlinks[r] || []).push(e.id); }));
function renderArchive() {
  const fw = $('#archive-filters');
  if (!fw.children.length) {
    ['ALL', ...Object.keys(ARCHIVE_TYPES)].forEach(t => {
      const b = document.createElement('button'); b.className = 'af'; b.dataset.f = t; b.textContent = t === 'ALL' ? `ALL (${ARCHIVE.length})` : `${ARCHIVE_TYPES[t].toUpperCase()} (${ARCHIVE.filter(e => e.type === t).length})`;
      b.addEventListener('click', () => { archiveFilter = t; renderArchive(); }); fw.appendChild(b);
    });
    $('#archive-search').addEventListener('input', e => { archiveQuery = e.target.value.toLowerCase(); renderArchive(); });
  }
  $$('.af', fw).forEach(b => b.classList.toggle('active', b.dataset.f === archiveFilter));
  const list = $('#archive-list'); list.innerHTML = '';
  const items = ARCHIVE.filter(e => (archiveFilter === 'ALL' || e.type === archiveFilter) && (!archiveQuery || (e.id + ' ' + e.title + ' ' + e.body + ' ' + (e.pilot || '')).toLowerCase().includes(archiveQuery)));
  items.forEach(e => {
    const b = document.createElement('button'); b.className = `ar${viewed.has(e.id) ? ' viewed' : ''}${archiveSel === e.id ? ' active' : ''}`; b.style.setProperty('--type-col', TYPE_COL[e.type]);
    b.innerHTML = `<span class="ar-id">${e.id}</span><span class="ar-title">${e.title}</span><span class="ar-date">${e.date}</span>`;
    b.addEventListener('click', () => showArchive(e.id)); list.appendChild(b);
  });
  if (!items.length) list.innerHTML = '<div class="empty">NO RECORDS MATCH</div>';
  if (!archiveSel) $('#archive-detail').innerHTML = `<div class="ad-empty">SELECT A RECORD<br><br><span class="archive-stats">${ARCHIVE.length} RECORDS · ${ARCHIVE.reduce((n, e) => n + e.refs.length, 0)} CROSS-REFERENCES · ${viewed.size} READ</span></div>`;
  else showArchive(archiveSel, true);
}
function showArchive(id, silent) {
  const e = ARCHIVE_BY_ID[id]; if (!e) return;
  archiveSel = id;
  if (!viewed.has(id)) { viewed.add(id); store.set('viewed', Array.from(viewed)); }
  if (!silent) { audio.uiTick(); log('ARCHIVE', `read ${id} — ${e.title}`); }
  $$('.ar').forEach(b => { b.classList.toggle('active', b.querySelector('.ar-id').textContent === id); if (b.querySelector('.ar-id').textContent === id) b.classList.add('viewed'); });
  const refs = e.refs.map(r => ARCHIVE_BY_ID[r]).filter(Boolean);
  const back = (backlinks[id] || []).map(r => ARCHIVE_BY_ID[r]).filter(Boolean);
  const refBtn = r => `<button class="ref" data-ref="${r.id}" style="--type-col:${TYPE_COL[r.type]}"><span class="ar-id">${r.id}</span><span class="ar-title">${r.title}</span></button>`;
  const preset = PRESETS.find(p => p.logged === id);
  $('#archive-detail').innerHTML = `
    <span class="ad-type" style="--type-col:${TYPE_COL[e.type]}">${ARCHIVE_TYPES[e.type].toUpperCase()}</span><span class="ad-id">${e.id}</span>
    <div class="ad-title">${e.title}</div>
    <div class="ad-meta"><span>DATE <b>${e.date}</b></span>${e.depth ? `<span>DEPTH <b>${fmt(e.depth)} m</b></span><span>PRESSURE <b>${fmt(1.01325 + e.depth * 0.1005 * (1 + e.depth * 2.2e-6), 0)} bar</b></span>` : ''}<span>${e.type === 'MAINT' ? 'ENGINEER' : e.type === 'DISCOVERY' ? 'SCIENCE LEAD' : 'PILOT / AUTHOR'} <b>${e.pilot}</b></span></div>
    ${preset ? `<div class="ad-glyphs"><span class="ad-glyph">LOGGED PROFILE ${preset.id}</span>${preset.sequence.map(g => `<span class="ad-glyph">${glyphSvg(GLYPH_BY_ID[g])}${GLYPH_BY_ID[g].name}</span>`).join('')}</div>` : ''}
    <div class="ad-body">${e.body}</div>
    <div class="ad-links">
      <div><h4>REFERENCES (${refs.length})</h4>${refs.map(refBtn).join('') || '<div class="empty">none</div>'}</div>
      <div><h4>REFERENCED BY (${back.length})</h4>${back.map(refBtn).join('') || '<div class="empty">none</div>'}</div>
    </div>`;
  $$('.ref', $('#archive-detail')).forEach(b => b.addEventListener('click', () => { showArchive(b.dataset.ref); renderArchiveListState(); }));
}
function renderArchiveListState() { $$('.ar').forEach(b => { const id = b.querySelector('.ar-id').textContent; b.classList.toggle('active', id === archiveSel); b.classList.toggle('viewed', viewed.has(id)); }); }

// ---- Vessel cross-section ---------------------------------------------------
let vesselBuilt = false; const vs = {};
function svgEl(tag, attrs, parent) { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
function buildVessel() {
  if (vesselBuilt) return; vesselBuilt = true;
  const svg = $('#vessel-svg');
  const text = (x, y, s, cls = 'vs-label', anchor = 'start') => { const t = svgEl('text', { x, y, class: cls, 'text-anchor': anchor }, svg); t.textContent = s; return t; };
  // ---- side elevation (left, large)
  text(40, 40, 'SIDE ELEVATION — PORT', 'vs-title');
  text(40, 62, 'pressure sphere forward · syntactic-foam float body aft · 4 main ballast · 2 trim · 4 thrusters · lamps under the sphere');
  // float body (aft of the sphere)
  svgEl('path', { d: 'M 400 150 L 860 150 Q 930 150 930 210 L 930 330 Q 930 390 860 390 L 400 390 Q 335 390 335 330 L 335 210 Q 335 150 400 150 Z', class: 'vs-hull' }, svg);
  svgEl('line', { x1: 335, y1: 270, x2: 930, y2: 270, class: 'vs-dim' }, svg);
  text(632, 140, 'FLOAT BODY · SYNTACTIC FOAM', 'vs-label', 'middle');
  // pressure sphere, forward
  svgEl('circle', { cx: 215, cy: 330, r: 120, class: 'vs-sphere' }, svg);
  svgEl('circle', { cx: 215, cy: 330, r: 104, class: 'vs-dim' }, svg);
  svgEl('path', { d: 'M 155 270 Q 215 220 275 270', class: 'vs-line' }, svg);
  text(215, 322, 'SPHERE', 'vs-label', 'middle'); vs.sphereTxt = text(215, 344, '', 'vs-val', 'middle'); vs.sphereTxt2 = text(215, 364, '', 'vs-val', 'middle');
  // seat ring between sphere and float
  svgEl('path', { d: 'M 337 282 L 358 282 L 358 378 L 337 378', class: 'vs-line' }, svg); text(347, 404, 'SEAT', 'vs-label', 'middle');
  // lamps under the sphere
  svgEl('circle', { cx: 150, cy: 448, r: 9, class: 'vs-lamp' }, svg); svgEl('circle', { cx: 280, cy: 448, r: 9, class: 'vs-lamp' }, svg);
  text(215, 440, 'LAMPS', 'vs-label', 'middle');
  vs.lampL = svgEl('path', { d: 'M 215 456 L 140 572 L 290 572 Z', class: 'vs-lamp' }, svg); vs.lampL.style.opacity = 0;
  // ballast tanks inside the float
  const tank = (x, y, w, h, id, label) => {
    svgEl('rect', { x, y, width: w, height: h, rx: 6, class: 'vs-tank' }, svg);
    vs[id] = svgEl('rect', { x: x + 3, y: y + h - 3, width: w - 6, height: 0, class: 'vs-fill' }, svg); vs[id + 'y0'] = y + h - 3;
    text(x + w / 2, y - 8, label, 'vs-label', 'middle'); vs[id + 'txt'] = text(x + w / 2, y + h + 18, '', 'vs-val', 'middle');
  };
  tank(380, 180, 150, 70, 'BT1', 'BT1 FWD-P'); tank(380, 290, 150, 70, 'BT3', 'BT3 AFT-P');
  tank(700, 180, 150, 70, 'BT2', 'BT2 FWD-S'); tank(700, 290, 150, 70, 'BT4', 'BT4 AFT-S');
  // trim tanks with transfer line
  svgEl('rect', { x: 560, y: 215, width: 120, height: 30, rx: 4, class: 'vs-tank' }, svg); vs.TRF = svgEl('rect', { x: 563, y: 218, width: 0, height: 24, class: 'vs-trim' }, svg); text(620, 205, 'TRIM FWD', 'vs-label', 'middle');
  svgEl('rect', { x: 560, y: 310, width: 120, height: 30, rx: 4, class: 'vs-tank' }, svg); vs.TRA = svgEl('rect', { x: 563, y: 313, width: 0, height: 24, class: 'vs-trim' }, svg); text(620, 360, 'TRIM AFT', 'vs-label', 'middle');
  svgEl('path', { d: 'M 620 245 L 620 310', class: 'vs-dim' }, svg); text(628, 282, 'XFER', 'vs-label');
  // thrusters: vertical pair under the float, horizontal pair aft
  const thr = (x, y, id, label) => {
    svgEl('circle', { cx: x, cy: y, r: 26, class: 'vs-thr' }, svg);
    vs[id + 'g'] = svgEl('circle', { cx: x, cy: y, r: 22, class: 'vs-thr-glow' }, svg);
    vs[id] = svgEl('g', { transform: `translate(${x} ${y})` }, svg); vs[id + 'pos'] = [x, y];
    for (let i = 0; i < 3; i++) svgEl('line', { x1: 0, y1: 0, x2: Math.cos(i * 2.094) * 18, y2: Math.sin(i * 2.094) * 18, class: 'vs-thr-blade' }, vs[id]);
    text(x, y + 46, label, 'vs-label', 'middle'); vs[id + 'txt'] = text(x, y + 62, '', 'vs-val', 'middle');
    vs[id + 'rot'] = 0;
  };
  thr(600, 450, 'VTP', 'VT-P ▼'); thr(760, 450, 'VTS', 'VT-S ▼');
  thr(975, 230, 'HTP', 'HT-P ▶'); thr(975, 340, 'HTS', 'HT-S ▶');
  // battery / scrubber pods under the float
  svgEl('rect', { x: 400, y: 410, width: 110, height: 40, rx: 4, class: 'vs-tank' }, svg); text(455, 435, 'BATTERY', 'vs-label', 'middle'); vs.battTxt = text(455, 468, '', 'vs-val', 'middle');
  svgEl('rect', { x: 850, y: 410, width: 110, height: 40, rx: 4, class: 'vs-tank' }, svg); text(905, 435, 'SCRUBBER', 'vs-label', 'middle'); vs.scrubTxt = text(905, 468, '', 'vs-val', 'middle');
  // attitude indicator
  text(40, 600, 'ATTITUDE', 'vs-label'); vs.pitchG = svgEl('g', { transform: 'translate(170 600)' }, svg);
  svgEl('line', { x1: -60, y1: 0, x2: 60, y2: 0, class: 'vs-line' }, vs.pitchG); svgEl('circle', { cx: 0, cy: 0, r: 4, class: 'vs-lamp' }, vs.pitchG);
  vs.pitchTxt = text(250, 605, '', 'vs-val');
  // ---- water column (right): vessel position vs rated depth
  text(1100, 40, 'WATER COLUMN', 'vs-title'); text(1100, 62, 'vessel position vs rated depth');
  svgEl('rect', { x: 1120, y: 90, width: 60, height: 480, class: 'vs-tank' }, svg);
  vs.column = svgEl('rect', { x: 1123, y: 93, width: 54, height: 0, class: 'vs-fill' }, svg); vs.column.style.opacity = 0.35;
  svgEl('rect', { x: 1120, y: 90 + 480 * (11000 / 12000), width: 60, height: 480 * (1000 / 12000), class: 'vs-danger' }, svg).style.opacity = 0.5;
  for (let d = 0; d <= 12000; d += 2000) { const y = 90 + 480 * d / 12000; svgEl('line', { x1: 1180, y1: y, x2: 1192, y2: y, class: 'vs-line' }, svg); text(1200, y + 4, `${d / 1000} km`, 'vs-val'); }
  vs.marker = svgEl('path', { d: 'M 1105 90 L 1120 84 L 1120 96 Z', class: 'vs-lamp' }, svg);
  vs.markerTxt = text(1250, 100, '', 'vs-val'); vs.markerTxt2 = text(1250, 118, '', 'vs-val'); vs.markerTxt3 = text(1250, 136, '', 'vs-val');
  // hull load bar
  text(1100, 600, 'HULL LOAD', 'vs-label'); svgEl('rect', { x: 1180, y: 588, width: 160, height: 16, class: 'vs-tank' }, svg);
  vs.loadBar = svgEl('rect', { x: 1183, y: 591, width: 0, height: 10, class: 'vs-fill' }, svg); vs.loadTxt = text(1350, 601, '', 'vs-val');
  const legend = $('#vessel-legend');
  legend.innerHTML = [['RATED DEPTH', `${fmt(VESSEL.ratedDepth)} m`], ['CRUSH DEPTH', `${fmt(VESSEL.crushDepth)} m`], ['SPHERE', '2.10 m / 178 mm'], ['MAIN BALLAST', '4 × 1 420 L'], ['TRIM TANKS', '2 × 160 L'], ['THRUSTERS', '2 vert · 2 horz']].map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
}
function renderVesselLive() {
  const t = sim.telemetry; const ch = sim.ch;
  for (const id of ['BT1', 'BT2', 'BT3', 'BT4']) { const v = Math.max(0, Math.min(1, ch[id].v)); const h = 64 * v; vs[id].setAttribute('height', h); vs[id].setAttribute('y', vs[id + 'y0'] - h); vs[id + 'txt'].textContent = `${(v * 100).toFixed(0)} % · ${fmt(v * 1420, 0)} L`; }
  const trf = Math.max(-1, Math.min(1, ch.TRF.v)), tra = Math.max(-1, Math.min(1, ch.TRA.v));
  vs.TRF.setAttribute('width', 114 * Math.min(1, Math.max(0.05, 0.5 + trf * 0.5))); vs.TRA.setAttribute('width', 114 * Math.min(1, Math.max(0.05, 0.5 + tra * 0.5)));
  for (const id of ['VTP', 'VTS', 'HTP', 'HTS']) {
    const v = Math.max(0, Math.min(1, ch[id].v)); vs[id + 'rot'] += v * 14;
    const [x, y] = vs[id + 'pos'];
    vs[id].setAttribute('transform', `translate(${x} ${y}) rotate(${vs[id + 'rot'] % 360})`);
    vs[id + 'g'].style.opacity = v * 0.5; vs[id + 'txt'].textContent = `${(v * 100).toFixed(0)} %`;
  }
  vs.sphereTxt.textContent = `${fmt(t.pressure, 0)} bar`; vs.sphereTxt2.textContent = `${t.compression.toFixed(2)} mm`;
  vs.lampL.style.opacity = t.lampPower / 100 * 0.35;
  vs.battTxt.textContent = `${t.battery.toFixed(1)} %`; vs.scrubTxt.textContent = t.scrubberCycle ? 'CYCLING' : `${fmt(t.co2, 0)} ppm`;
  const y = 90 + 480 * Math.min(1, t.depth / 12000);
  vs.column.setAttribute('height', Math.max(0, y - 93)); vs.marker.setAttribute('d', `M 1105 ${y} L 1120 ${y - 6} L 1120 ${y + 6} Z`);
  const ty = Math.min(y, 530);
  vs.markerTxt.setAttribute('y', ty + 4); vs.markerTxt.textContent = `${fmt(t.depth, 0)} m · ${fmt(t.pressure, 0)} bar`;
  vs.markerTxt2.setAttribute('y', ty + 22); vs.markerTxt2.textContent = `${t.waterTemp.toFixed(1)} °C · ${fmt(t.density, 0)} kg/m3`;
  vs.markerTxt3.setAttribute('y', ty + 40); vs.markerTxt3.textContent = t.lux >= 1 ? `${fmt(t.lux, 0)} lux` : 'aphotic — lamps on';
  vs.loadBar.setAttribute('width', 154 * Math.min(1, t.hullLoad / 100)); vs.loadBar.setAttribute('class', t.hullLoad > 95 ? 'vs-danger' : t.hullLoad > 80 ? 'vs-warn' : 'vs-fill'); vs.loadTxt.textContent = `${t.hullLoad.toFixed(1)} %`;
  vs.pitchG.setAttribute('transform', `translate(170 600) rotate(${-t.pitch * 3})`); vs.pitchTxt.textContent = `PITCH ${t.pitch >= 0 ? '+' : ''}${t.pitch.toFixed(1)}° · ROLL ${t.roll >= 0 ? '+' : ''}${t.roll.toFixed(1)}°`;
}

// ---- Dive computer ----------------------------------------------------------
function renderPresets() {
  for (const tier of ['verified', 'experimental']) {
    const wrap = $(`#presets-${tier}`); wrap.innerHTML = '';
    PRESETS.filter(p => p.tier === tier).forEach(p => {
      const last = GLYPH_BY_ID[p.sequence[p.sequence.length - 1]];
      const ringDepth = last.depth + VESSEL.ringOffset;
      const load = (1.01325 + ringDepth * 0.1005 * (1 + ringDepth * 2.2e-6)) / RATED_BAR * 100;
      const b = document.createElement('button'); b.className = `preset ${tier}`; b.dataset.preset = p.id;
      b.disabled = sim.phase !== 'idle' || sim.sequence.length > 0;
      b.innerHTML = `<div class="pr-head"><span class="pr-id">${p.id}</span><span class="pr-ring">${p.ring.toUpperCase()}</span></div>
        <div class="pr-name">${p.name}</div>
        <div class="pr-seq">${p.sequence.map(g => glyphSvg(GLYPH_BY_ID[g])).join('')}</div>
        <div class="pr-meta"><span>RING ${fmt(ringDepth)} m</span><span>HULL ${load.toFixed(1)} %</span><span>LOG ${p.logged}</span><span>${p.pilot}</span></div>
        <div class="pr-note">${p.note}</div>
        ${tier === 'experimental' ? `<div class="pr-warn">⚠ UNCONFIRMED ROUTE · ${load > 95 ? 'HULL MARGIN ' + (100 - load).toFixed(1) + ' % · ' : ''}REPLAY AT PILOT DISCRETION</div>` : ''}
        <div class="pr-action">${b.disabled ? 'DISENGAGE BEFORE REPLAY' : 'REPLAY PROFILE ▶'}</div>`;
      b.addEventListener('click', () => { ensureAudio(); audio.click(); if (sim.startAuto(p)) { closePanel(); renderControls(); } else renderPresets(); });
      wrap.appendChild(b);
    });
  }
}
function renderHistory() {
  const h = $('#history'); h.innerHTML = '';
  if (!history.length) { h.innerHTML = `<div class="empty">NO DIVES RECORDED YET<br><small>sessions on this device: ${sessionsBefore + 1}</small></div>`; return; }
  history.forEach(d => {
    const e = document.createElement('div'); e.className = 'hist';
    const when = new Date(d.when);
    e.innerHTML = `<span class="h-when">${when.toLocaleDateString('en-GB')} ${when.toLocaleTimeString('en-GB')}</span>
      <span class="h-what">${d.presetId ? `replay ${d.presetId}` : 'manual profile'} · ${fmt(d.depth)} m · hull ${d.maxHullLoad} %</span>
      <span class="h-out ${d.outcome === 'aborted' ? 'abort' : ''}">${d.outcome.toUpperCase()}</span>
      <span class="h-seq">${d.sequence.join(' → ')}</span>`;
    h.appendChild(e);
  });
}
$('#btn-clear-history').addEventListener('click', () => { history = []; store.set('history', history); renderHistory(); log('STORE', 'pilot record cleared', 'warn'); });

// ---- Session log ------------------------------------------------------------
function renderLog() {
  const l = $('#log-list');
  l.innerHTML = sessionLog.map(e => `<div class="le ${e.level}"><span class="le-t">${e.t}</span><span class="le-k">${e.kind}</span><span class="le-m">${e.msg}</span></div>`).join('');
  const kinds = {}; sessionLog.forEach(e => kinds[e.kind] = (kinds[e.kind] || 0) + 1);
  $('#log-stats').innerHTML = `<span>ENTRIES <b>${sessionLog.length}</b></span><span>SESSION <b>${elapsed().slice(0, 8)}</b></span><span>HOLDS <b>${kinds.HOLD || 0}</b></span><span>ACTIVATIONS <b>${kinds.ACTIVATE || 0}</b></span><span>ASCENTS <b>${kinds.ASCENT || 0}</b></span><span>REJECTS <b>${kinds.REJECT || 0}</b></span><span>DEVICE SESSIONS <b>${sessionsBefore + 1}</b></span>`;
}

// ---- Settings ---------------------------------------------------------------
function savePrefs() { store.set('prefs', prefs); }
function applyPrefs() {
  document.body.dataset.mood = prefs.mood; document.body.dataset.density = prefs.density; document.body.dataset.motion = prefs.motion;
  viewport.setMood(MOODS[prefs.mood] || MOODS.cerulean);
  viewport.motion = prefs.motion === 'low' ? 0.4 : prefs.motion === 'high' ? 1.8 : 1;
}
function renderSettings() {
  const body = $('#settings-body');
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-set="${key}" data-val="${v}" class="${prefs[key] === v ? 'active' : ''}">${l}</button>`).join('')}</div>`;
  body.innerHTML = `
    <div class="set-group"><h3>INSTRUMENT COLOUR MOOD</h3><p>Changes every instrument, the gauge, the sphere HUD and the background theme.</p>
      <div class="swatches">${Object.entries(MOODS).map(([k, m]) => `<button class="swatch ${prefs.mood === k ? 'active' : ''}" data-set="mood" data-val="${k}"><span class="sw" style="background:linear-gradient(90deg,${m.ink2},${m.accent},${m.accent2})"></span>${m.label.toUpperCase()}</button>`).join('')}</div></div>
    <div class="set-group"><h3>DISPLAY DENSITY</h3><p>Compact hides the attitude group and loosens spacing; dense packs every telemetry row tighter.</p>${seg('density', [['compact', 'COMPACT'], ['standard', 'STANDARD'], ['dense', 'DENSE']])}</div>
    <div class="set-group"><h3>MOTION INTENSITY</h3><p>Scales sphere shake, marine snow, bioluminescence rate and pulse animations.</p>${seg('motion', [['low', 'LOW'], ['normal', 'NORMAL'], ['high', 'HIGH']])}</div>
    <div class="set-group"><h3>AUDIO LAYERS</h3><p>Each layer is synthesised live. Audio must be started from the AUDIO control in the top bar (browser gesture rule).</p>
      ${[['ambient', 'DEEP-WATER AMBIENCE'], ['vessel', 'VESSEL INTERIOR — HUM & SCRUBBER'], ['effects', 'PILOTING EFFECTS — FLOOD, VENT, THRUST'], ['groans', 'HULL CREAK & GROAN']].map(([k, l]) => `<div class="toggle-row"><span>${l}</span><button data-layer="${k}" class="${prefs.layers[k] ? 'on' : ''}">${prefs.layers[k] ? 'ON' : 'OFF'}</button></div>`).join('')}
      <div class="range-row"><span>MASTER</span><input type="range" id="master" min="0" max="1" step="0.02" value="${prefs.master}"><output id="master-out">${Math.round(prefs.master * 100)} %</output></div></div>
    <div class="set-group"><h3>PERSISTED DATA</h3><p>Stored in this browser's localStorage under the <code>lantern.v1.</code> prefix: preferences, pilot record (${history.length} dives), read archive entries (${viewed.size}), device session count (${sessionsBefore + 1}). Nothing leaves this device.</p>
      <button class="danger-btn" id="btn-wipe">CLEAR ALL PERSISTED DATA</button></div>
    <div class="set-group"><h3>ABOUT</h3><p>DSV-7 Cerulean Lantern pilot console v${VERSION}. Hadal Threshold Institute. Client-side simulation — no server, no network. Hull-integrity lockout is released on every load.</p></div>`;
  $$('[data-set]', body).forEach(b => b.addEventListener('click', () => { prefs[b.dataset.set] = b.dataset.val; applyPrefs(); savePrefs(); audio.uiTick(); log('SETTINGS', `${b.dataset.set} → ${b.dataset.val}`); renderSettings(); }));
  $$('[data-layer]', body).forEach(b => b.addEventListener('click', () => { const k = b.dataset.layer; prefs.layers[k] = !prefs.layers[k]; audio.setLayer(k, prefs.layers[k]); savePrefs(); log('SETTINGS', `audio layer ${k} ${prefs.layers[k] ? 'on' : 'off'}`); renderSettings(); }));
  $('#master', body).addEventListener('input', e => { prefs.master = parseFloat(e.target.value); audio.setMaster(prefs.master); $('#master-out').textContent = `${Math.round(prefs.master * 100)} %`; savePrefs(); });
  $('#btn-wipe', body).addEventListener('click', () => { store.clear(); history = []; viewed = new Set(); Object.assign(prefs, JSON.parse(JSON.stringify(DEFAULT_PREFS))); applyPrefs(); log('STORE', 'all persisted data cleared', 'warn'); renderSettings(); });
}

// ---- Help overlay -----------------------------------------------------------
$('#help-body').innerHTML = REFERENCE.map(r => `<section><h3>${r.h.toUpperCase()}</h3><p>${r.p}</p></section>`).join('') + `<div class="help-note">v${VERSION} · ${VESSEL.sequenceLength} waypoints · ${CHANNELS.length} trim channels · ${GLYPHS.length} strata glyphs · ${ARCHIVE.length} archive records · ESC closes</div>`;
$('#help-btn').addEventListener('click', () => { ensureAudio(); audio.uiTick(); const h = $('#help-overlay'); h.hidden = !h.hidden; log('PANEL', h.hidden ? 'closed operator reference' : 'opened operator reference'); });
$('#help-close').addEventListener('click', () => { $('#help-overlay').hidden = true; log('PANEL', 'closed operator reference'); });
$('#help-overlay').addEventListener('click', e => { if (e.target.id === 'help-overlay') { e.target.hidden = true; } });

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
$('#version-label').textContent = `v${VERSION}`;
applyPrefs(); applyScale();
renderControls();
log('BOOT', `console online — ${VESSEL.hull} ${VESSEL.name} · session ${sessionsBefore + 1} on this device · lockout RELEASED`);
requestAnimationFrame(frame);
