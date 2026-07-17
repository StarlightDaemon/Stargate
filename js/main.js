// ============================================================
// main.js — wiring: UI construction, input, starfield, rAF loop.
// ============================================================

import { GLYPH_COUNT, GLYPH_NAMES, glyphCanvas } from "./glyphs.js";
import { Gate } from "./gate.js";
import { AudioEngine } from "./audio.js";
import { Dialer } from "./dialer.js";
import { DESTINATIONS, randomAddress } from "./destinations.js";

const $ = (id) => document.getElementById(id);

// ---------------- log ----------------
const logEl = $("log");
function log(msg, cls = "") {
  const line = document.createElement("div");
  line.className = `line ${cls}`;
  const t = new Date();
  const stamp = [t.getHours(), t.getMinutes(), t.getSeconds()]
    .map((n) => String(n).padStart(2, "0")).join(":");
  line.innerHTML = `<span class="t">${stamp}</span>`;
  line.appendChild(document.createTextNode(msg));
  logEl.appendChild(line);
  while (logEl.children.length > 120) logEl.removeChild(logEl.firstChild);
  logEl.scrollTop = logEl.scrollHeight;
}

// ---------------- core objects ----------------
const gate = new Gate($("gate"));
const sfx = new AudioEngine();

// ---------------- address readout ----------------
const readoutEl = $("readout");
const slots = [];
for (let i = 0; i < 7; i++) {
  const d = document.createElement("div");
  d.className = "slot";
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const idx = document.createElement("span");
  idx.className = "idx";
  idx.textContent = i + 1;
  d.appendChild(c);
  d.appendChild(idx);
  readoutEl.appendChild(d);
  slots.push({ el: d, canvas: c });
}

function paintSlot(i, glyphIdx, color) {
  const { canvas } = slots[i];
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 64, 64);
  if (glyphIdx !== null && glyphIdx !== undefined) {
    const g = glyphCanvas(glyphIdx, 64, color);
    ctx.drawImage(g, 0, 0);
    slots[i].el.title = `Sigil of ${GLYPH_NAMES[glyphIdx]}`;
  } else {
    slots[i].el.title = "";
  }
}

// ---------------- keypad ----------------
const keypadEl = $("keypad");
const keys = [];
for (let i = 0; i < GLYPH_COUNT; i++) {
  const b = document.createElement("button");
  b.className = "key";
  b.title = `Sigil of ${GLYPH_NAMES[i]}`;
  b.setAttribute("aria-label", `Sigil of ${GLYPH_NAMES[i]}`);
  b.appendChild(glyphCanvas(i, 56, "#9db4c8"));
  b.addEventListener("click", () => {
    if (dialer.queueSymbol(i)) refreshEditState();
    else sfx.fail();
  });
  keypadEl.appendChild(b);
  keys.push(b);
}

// ---------------- destinations ----------------
const destEl = $("destinations");
const destButtons = [];
for (const d of DESTINATIONS) {
  const b = document.createElement("button");
  b.className = "dest";
  b.innerHTML = `<span>${d.name}</span><span class="tag">${d.tag}</span>`;
  b.addEventListener("click", () => {
    if (!dialer.canEdit()) return;
    log(`Recalling registered address: ${d.name}`);
    dialer.setAddress(d.addr, d.name);
    refreshEditState();
    setTimeout(() => dialer.engage(), 450);
  });
  destEl.appendChild(b);
  destButtons.push(b);
}

// ---------------- controls ----------------
const btnEngage = $("btn-engage"), btnRandom = $("btn-random"), btnClear = $("btn-clear");
const btnAbort = $("btn-abort"), btnSeal = $("btn-seal"), btnMute = $("btn-mute"), btnHelp = $("btn-help");
const lamp = $("status-lamp");
const capStatus = $("caption-status"), capDest = $("caption-dest");
const stabilityPanel = $("stability-panel"), stabilityBar = $("stability-bar"), stabilityTime = $("stability-time");

function refreshEditState() {
  const editable = dialer.canEdit();
  const addr = dialer.address;
  btnEngage.disabled = !(editable && addr.length === 7);
  btnClear.disabled = !(editable && addr.length > 0);
  btnRandom.disabled = !editable;
  for (let i = 0; i < GLYPH_COUNT; i++) {
    keys[i].disabled = !editable || addr.length >= 7 || addr.includes(i);
    keys[i].classList.toggle("used", addr.includes(i));
  }
  for (const b of destButtons) b.disabled = !editable;
}

const ui = {
  onLog: log,
  onSlot(i, phase, glyphIdx) {
    const el = slots[i].el;
    if (phase === "filled") {
      el.className = "slot filled";
      paintSlot(i, glyphIdx, "#8fd4ea");
    } else if (phase === "current") {
      el.className = "slot filled current";
    } else if (phase === "locked") {
      el.className = "slot locked";
      paintSlot(i, dialer.address[i], "#ffc46e");
    }
  },
  onAddressReplaced(addr) {
    for (let i = 0; i < 7; i++) {
      if (i < addr.length) {
        slots[i].el.className = "slot filled";
        paintSlot(i, addr[i], "#8fd4ea");
      } else {
        slots[i].el.className = "slot";
        paintSlot(i, null);
      }
    }
    refreshEditState();
  },
  onState(s) {
    lamp.className = { idle: "idle", dialing: "dialing", igniting: "dialing", active: "active", sealing: "dialing" }[s];
    capStatus.className = { idle: "idle", dialing: "dialing", igniting: "fault", active: "active", sealing: "dialing" }[s];
    capStatus.textContent = {
      idle: "RING SEALED — STANDBY",
      dialing: "DIALING — SIGIL ACQUISITION",
      igniting: "CONDUIT IGNITION",
      active: "CONDUIT OPEN — TRANSIT AUTHORIZED",
      sealing: "COLLAPSING CONDUIT — SEALING",
    }[s];
    capDest.textContent = s === "active"
      ? `ROUTE: ${dialer.destName ?? "MANUAL VECTOR"}` : "";
    btnAbort.hidden = s !== "dialing";
    btnSeal.hidden = s !== "active";
    stabilityPanel.hidden = !(s === "active" || s === "sealing");
    refreshEditState();
  },
  onStability(frac, secs) {
    stabilityBar.style.width = `${frac * 100}%`;
    stabilityBar.classList.toggle("low", frac < 0.25);
    const m = Math.floor(secs / 60), sec = Math.floor(secs % 60);
    stabilityTime.textContent = `AUTO-SEAL IN ${m}:${String(sec).padStart(2, "0")}`;
  },
};

const dialer = new Dialer(gate, sfx, ui);

btnEngage.addEventListener("click", () => dialer.engage());
btnAbort.addEventListener("click", () => dialer.abort());
btnSeal.addEventListener("click", () => dialer.shutdown());
btnClear.addEventListener("click", () => { dialer.clear(); });
btnRandom.addEventListener("click", () => {
  if (!dialer.canEdit()) return;
  dialer.setAddress(randomAddress(), null);
  log("Random vector composed — coordinates unregistered", "warn");
  refreshEditState();
});
btnMute.addEventListener("click", () => {
  sfx.ensure();
  sfx.setMuted(!sfx.muted);
  btnMute.textContent = sfx.muted ? "SND OFF" : "SND ON";
  btnMute.setAttribute("aria-pressed", String(sfx.muted));
});
btnHelp.addEventListener("click", () => { $("help").hidden = false; });
$("btn-help-close").addEventListener("click", () => { $("help").hidden = true; });
$("help").addEventListener("click", (e) => { if (e.target.id === "help") $("help").hidden = true; });

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !btnEngage.disabled) dialer.engage();
  else if (e.key === "Escape") {
    if (!$("help").hidden) $("help").hidden = true;
    else if (dialer.state === "dialing") dialer.abort();
    else if (dialer.state === "active") dialer.shutdown();
  } else if ((e.key === "r" || e.key === "R") && dialer.canEdit()) btnRandom.click();
});

// ---------------- gate canvas interaction ----------------
const PROBE_REPORTS = [
  "Probe away. Telemetry nominal — far-side atmosphere within tolerance.",
  "Probe away. Return ping in 3.1s — conduit throughput 99.2%.",
  "Probe away. Far-side beacon answered with a valid survey handshake.",
  "Probe away. Micro-turbulence detected in the conduit throat — within limits.",
];
$("gate").addEventListener("click", (e) => {
  const p = gate.toLocal(e);
  if (dialer.state === "active" && gate.inHorizon(p)) {
    if (Math.hypot(p.x, p.y) < 80) {
      // full transit
      sfx.plunge();
      gate.spawnRipple(p.x, p.y);
      const f = $("flash");
      f.classList.add("on");
      setTimeout(() => f.classList.remove("on"), 90);
      log(`TRANSIT — traveler enroute to ${dialer.destName ?? "unregistered coordinates"}…`, "warn");
      setTimeout(() => log("Far-side arrival confirmed. Welcome through the Meridian.", "ok"), 1600);
    } else if (dialer.probe()) {
      gate.spawnRipple(p.x, p.y);
      log(PROBE_REPORTS[Math.floor(Math.random() * PROBE_REPORTS.length)]);
    }
    return;
  }
  if (dialer.canEdit()) {
    const sym = gate.symbolAt(p);
    if (sym >= 0) {
      if (dialer.queueSymbol(sym)) refreshEditState();
      else sfx.fail();
    }
  }
});

// ---------------- ambience ----------------
let humArmed = false;
document.addEventListener("pointerdown", () => {
  if (humArmed) return;
  humArmed = true;
  if (sfx.ensure()) { sfx.humStart(); log("Audio bus online — ambient systems audible", ""); }
}, { once: false });

// idle sigil glints
setInterval(() => { if (Math.random() < 0.75) gate.glintRandom(); }, 3200);

// ---------------- starfield ----------------
const starsCv = $("stars");
const starsCtx = starsCv.getContext("2d");
let stars = [];
function seedStars() {
  starsCv.width = innerWidth;
  starsCv.height = innerHeight;
  stars = Array.from({ length: Math.floor((innerWidth * innerHeight) / 6500) }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.3 + 0.3,
    ph: Math.random() * Math.PI * 2,
    sp: 0.4 + Math.random() * 1.4,
  }));
}
seedStars();
addEventListener("resize", seedStars);

function drawStars(t) {
  starsCtx.clearRect(0, 0, starsCv.width, starsCv.height);
  starsCtx.fillStyle = "#cfe2f3";
  for (const s of stars) {
    const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
    starsCtx.globalAlpha = a;
    starsCtx.beginPath();
    starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    starsCtx.fill();
  }
  starsCtx.globalAlpha = 1;
}

// ---------------- burst -> active handoff & main loop ----------------
let last = performance.now();
let lastFrameAt = 0;
function step(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  lastFrameAt = now;
  const t = now / 1000;
  gate.update(dt);
  dialer.tick(dt);
  gate.render(t);
  drawStars(t);
}
function frame(now) {
  step(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Watchdog: some embedded/occluded webviews throttle rAF to zero.
// If no frame has run recently, keep the simulation alive on a timer
// (the rAF loop resumes seamlessly once frames flow again).
setInterval(() => {
  const now = performance.now();
  if (now - lastFrameAt > 250) step(now);
}, 66);

// Debug/verification handle (harmless in production).
window.__meridian = { gate, dialer, sfx, step };

// ---------------- boot chatter ----------------
ui.onAddressReplaced([]);
ui.onState("idle");
log("MERIDIAN RING terminal 04-A — operations console initialized", "ok");
setTimeout(() => log("Clamp actuators: 8/8 responding. Iris: sealed. Capacitors: charged."), 500);
setTimeout(() => log("Compose a seven-sigil address, or select a registered destination."), 1100);
