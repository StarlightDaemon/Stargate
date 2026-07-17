/* ============================================================
   main.js — conductor of the Threshold Annulus.

   The instrument's life is a strict sequence:

     REST → DIALING (seal by seal) → PRIMED → SUNSTRIKE → OPEN
          → SEALING (Umbral Occulter transit) → REST
     with two failure exits: GUTTER (a lost cant) and
     COLLAPSE (stability lapses while the well stands open).
   ============================================================ */

import { SIGIL_NAMES, sigilSvg } from "./sigils.js";
import { AudioEngine } from "./audio.js";
import { Ring } from "./ring.js";
import { Seals } from "./seals.js";
import { Portal } from "./portal.js";
import { Occluder } from "./occluder.js";
import { ORIGIN, CANTS, driftCant, buildCodex } from "./codex.js";

const $ = (sel) => document.querySelector(sel);

const STABILITY_SECONDS = 38;
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

// ---------- assemble the instrument ----------

const audio = new AudioEngine();
const ring = new Ring($("#gate"), { onSigilClick: onSigil });
const seals = new Seals($("#gate"));
const portal = new Portal($("#portal"));
const occluder = new Occluder($("#gate"));
portal.start();

// ---------- console elements ----------

const statusText = $("#status-text");
const statusLamp = $("#status-lamp");
const socketsEl = $("#sockets");
const logEl = $("#log");
const stabilityRow = $("#stability-row");
const stabilityFill = $("#stability-fill");
const stabilityTime = $("#stability-time");
const btnRandom = $("#btn-random");
const btnAbort = $("#btn-abort");
const btnSeal = $("#btn-seal");
const btnMute = $("#btn-mute");
const btnHelp = $("#btn-help");
const helpOverlay = $("#help-overlay");
const gateWrap = $("#gate-wrap");
const flash = $("#flash");

// sockets I..VII
const sockets = [];
for (let i = 0; i < 7; i++) {
  const d = document.createElement("div");
  d.className = "socket";
  d.innerHTML = `<span class="roman">${ROMAN[i]}</span>`;
  socketsEl.appendChild(d);
  sockets.push(d);
}

// ---------- state ----------

let state = "REST";        // REST | DIALING | PRIMED | OPEN | SEALING | ENDING
let busy = false;          // band turning / seal driving
let dialed = [];           // locked sigil indices
let currentCant = null;    // codex entry being dialed, if any
let activeEntry = null;    // its <li>
let abortFlag = false;
let stabilityTimer = null;
let stabilityLeft = 0;
let lastWarnSecond = -1;

// ---------- small helpers ----------

function log(msg, cls = "") {
  const t = new Date();
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  const div = document.createElement("div");
  div.className = "entry";
  div.innerHTML = `<span class="t">${hh}:${mm}:${ss}</span><span class="${cls}">${msg}</span>`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  while (logEl.children.length > 120) logEl.removeChild(logEl.firstChild);
}

function setStatus(text, lamp) {
  statusText.textContent = text;
  statusLamp.className = `lamp ${lamp}`;
}

function refreshButtons() {
  btnRandom.disabled = state !== "REST";
  btnAbort.disabled = !(state === "DIALING" || (state === "REST" && dialed.length > 0));
  btnSeal.disabled = state !== "OPEN";
}

function targetName() {
  return currentCant ? currentCant.name : "an unwritten cant";
}

function setActiveEntry(li) {
  activeEntry?.classList.remove("active");
  activeEntry = li || null;
  activeEntry?.classList.add("active");
}

// ---------- dialing ----------

async function lockSigil(sigil) {
  busy = true;
  ring.setBusy(true);
  const n = dialed.length; // seal index about to lock
  setStatus(`ATTUNING ${ROMAN[n]}/VII`, "dialing");
  audio.ringStart();
  await ring.rotateToSigil(sigil, {
    onTick: (k) => { for (let j = 0; j < k; j++) audio.ratchet(sigil + j); },
  });
  dialed.push(sigil);
  ring.litSigil(sigil);
  seals.lock(n);
  audio.sealLock(n);
  sockets[n].classList.add("filled");
  sockets[n].insertAdjacentHTML("afterbegin", sigilSvg(sigil, 26));
  log(`Seal ${ROMAN[n]} locked — <b>${SIGIL_NAMES[sigil]}</b>.`, n === 6 ? "gold" : "");
  await pause(420);
  busy = false;
  ring.setBusy(false);
  refreshButtons();
}

function pause(ms) { return new Promise((r) => setTimeout(r, ms)); }

function onSigil(sigil) {
  audio.unlock();
  if (busy || (state !== "REST" && state !== "DIALING")) return;
  if (state === "DIALING" && currentCant) return; // codex auto-dial owns the band

  // validation
  if (dialed.includes(sigil)) {
    ring.refuseSigil(sigil);
    audio.refuse();
    log(`${SIGIL_NAMES[sigil]} is already written into this cant.`, "warn");
    return;
  }
  if (sigil === ORIGIN && dialed.length < 6) {
    ring.refuseSigil(sigil);
    audio.refuse();
    log("Solyn closes a cant — it cannot open one.", "warn");
    return;
  }
  if (dialed.length === 6 && sigil !== ORIGIN) {
    ring.refuseSigil(sigil);
    audio.refuse();
    log("The seventh seal answers only to Solyn, the Standing Sun.", "warn");
    return;
  }

  if (state === "REST") {
    state = "DIALING";
    currentCant = null;
    setActiveEntry(null);
    log("Manual attunement begun.", "teal");
    refreshButtons();
  }

  lockSigil(sigil).then(() => {
    if (abortFlag) return;
    if (dialed.length === 7) prime();
    else setStatus(`AWAIT SIGIL ${ROMAN[dialed.length]}`, "dialing");
  });
}

async function autoDial(cant, li) {
  if (state !== "REST" || busy) return;
  audio.unlock();
  state = "DIALING";
  abortFlag = false;
  currentCant = cant;
  setActiveEntry(li);
  refreshButtons();
  log(`Codex attunement: <b>${cant.name}</b> — ${cant.desc}.`, "teal");
  for (const sigil of cant.sigils) {
    if (abortFlag) return;
    await lockSigil(sigil);
    if (abortFlag) return;
    await pause(160);
  }
  if (!abortFlag) prime();
}

// ---------- strike / open ----------

async function prime() {
  state = "PRIMED";
  refreshButtons();
  setStatus("SEVENTH SEAL — PRIMED", "dialing");
  log("Seven seals answer. The well draws breath…", "gold");
  ring.setClawLit(true);
  audio.primeSwell(1.15);
  await pause(1150);
  if (abortFlag) return;
  if (currentCant?.unstable) gutter();
  else strike();
}

async function strike() {
  state = "OPEN";
  audio.burst();
  portal.strike();
  ring.setBezelFire(true);
  flash.classList.add("on");
  gateWrap.classList.add("shake");
  setTimeout(() => flash.classList.remove("on"), 180);
  setTimeout(() => gateWrap.classList.remove("shake"), 600);
  await pause(500);
  audio.wellOpen();
  setStatus(`WELL OPEN · ${targetName().toUpperCase()}`, "open");
  log(`<b>Sunstrike.</b> The Wellglass stands open toward ${targetName()}.`, "gold");
  startStability();
  refreshButtons();
}

// ---------- stability ----------

function startStability() {
  stabilityLeft = STABILITY_SECONDS;
  lastWarnSecond = -1;
  stabilityRow.hidden = false;
  stabilityRow.classList.remove("low");
  const t0 = performance.now();
  stabilityTimer = setInterval(() => {
    stabilityLeft = Math.max(0, STABILITY_SECONDS - (performance.now() - t0) / 1000);
    stabilityFill.style.width = `${(stabilityLeft / STABILITY_SECONDS) * 100}%`;
    stabilityTime.textContent = Math.ceil(stabilityLeft);
    if (stabilityLeft <= 10) {
      stabilityRow.classList.add("low");
      statusLamp.className = "lamp danger";
      portal.setInstability(((10 - stabilityLeft) / 10) * 0.85);
      const s = Math.ceil(stabilityLeft);
      if (s !== lastWarnSecond) { lastWarnSecond = s; audio.warn(); }
    }
    if (stabilityLeft <= 0) {
      stopStability();
      collapse();
    }
  }, 100);
}

function stopStability() {
  if (stabilityTimer) clearInterval(stabilityTimer);
  stabilityTimer = null;
  stabilityRow.hidden = true;
  stabilityRow.classList.remove("low");
}

// ---------- endings ----------

async function releaseSealsAndSockets() {
  await seals.releaseStaggered(130, (i) => {
    audio.sealRelease(i);
    sockets[i].classList.remove("filled");
    sockets[i].querySelector("svg")?.remove();
  });
  ring.clearLit();
  ring.setClawLit(false);
}

function resetToRest(message) {
  dialed = [];
  currentCant = null;
  setActiveEntry(null);
  abortFlag = false;
  state = "REST";
  setStatus("AT REST", "idle");
  refreshButtons();
  if (message) log(message);
}

/* The proper ending: the Umbral Occulter transits and seals the well. */
async function sealThreshold() {
  if (state !== "OPEN") return;
  state = "SEALING";
  refreshButtons();
  stopStability();
  portal.setInstability(0);
  setStatus("OCCULTER IN TRANSIT", "dialing");
  log("The Umbral Occulter begins its transit.", "teal");
  audio.occluderMove(1.6);
  await occluder.close(1600);
  audio.occluderSeat();
  gateWrap.classList.add("shake");
  setTimeout(() => gateWrap.classList.remove("shake"), 600);
  audio.wellClose();
  ring.setBezelFire(false);
  await portal.quench(true);      // quenched in shadow, behind the disc
  occluder.douseCorona();
  log("Eclipse total. The well is quenched.", "gold");
  await pause(500);
  await releaseSealsAndSockets();
  await pause(300);
  setStatus("OCCULTER RETRACTING", "idle");
  await occluder.retract(1600);
  resetToRest("The Annulus is at rest.");
}

/* Stability lapsed: the well tears itself shut. */
async function collapse() {
  if (state !== "OPEN") return;
  state = "ENDING";
  refreshButtons();
  setStatus("APERTURE COLLAPSE", "danger");
  log("Stability lapsed — the well collapses unseated!", "warn");
  portal.setInstability(1);
  audio.wellClose(true);
  audio.collapse();
  gateWrap.classList.add("shake");
  setTimeout(() => gateWrap.classList.remove("shake"), 600);
  await pause(350);
  ring.setBezelFire(false);
  await portal.quench(true);
  await releaseSealsAndSockets();
  resetToRest("Collapse spent. The Annulus is at rest.");
}

/* The seventh seal locked on a lost cant: the strike finds nothing. */
async function gutter() {
  state = "ENDING";
  refreshButtons();
  setStatus("SIGNAL LOST", "danger");
  audio.fizzle();
  log(`The strike reaches for ${targetName()} and finds <b>nothing</b>. The well gutters.`, "warn");
  await portal.gutter();
  ring.setBezelFire(false);
  await releaseSealsAndSockets();
  resetToRest("Lost cant released. The Annulus is at rest.");
}

/* Operator releases a part-written cant. */
async function releaseCant() {
  if (state !== "DIALING" && !(state === "REST" && dialed.length)) return;
  abortFlag = true;
  const wait = () => new Promise((r) => {
    const w = () => (busy ? setTimeout(w, 60) : r());
    w();
  });
  await wait();
  state = "ENDING";
  refreshButtons();
  log("Attunement released by the operator.", "teal");
  await releaseSealsAndSockets();
  resetToRest("The Annulus is at rest.");
}

// ---------- ambient idle life ----------

(function idleGlints() {
  const tick = () => {
    if (state === "REST" && !document.hidden) ring.glintRandom();
    setTimeout(tick, 5000 + Math.random() * 9000);
  };
  setTimeout(tick, 4000);
})();

// ---------- wiring ----------

buildCodex($("#codex"), (cant, li) => {
  if (state !== "REST" || busy) { audio.uiTap(); return; }
  autoDial(cant, li);
});

btnRandom.addEventListener("click", () => {
  audio.unlock(); audio.uiTap();
  if (state !== "REST" || busy) return;
  const cant = { name: "a drift cant", desc: "composed by the instrument", sigils: driftCant() };
  autoDial(cant, null);
});

btnAbort.addEventListener("click", () => { audio.unlock(); audio.uiTap(); releaseCant(); });
btnSeal.addEventListener("click", () => { audio.unlock(); audio.uiTap(); sealThreshold(); });

btnMute.addEventListener("click", () => {
  audio.unlock();
  audio.setMuted(!audio.muted);
  btnMute.classList.toggle("off", audio.muted);
});

function toggleHelp(force) {
  const show = force !== undefined ? force : helpOverlay.hidden;
  helpOverlay.hidden = !show;
}
btnHelp.addEventListener("click", () => { audio.unlock(); audio.uiTap(); toggleHelp(); });
$("#btn-help-close").addEventListener("click", () => { audio.uiTap(); toggleHelp(false); });
helpOverlay.addEventListener("click", (e) => {
  if (e.target === helpOverlay) toggleHelp(false);
});

document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  audio.unlock();
  switch (e.key.toLowerCase()) {
    case "r": if (!btnRandom.disabled) btnRandom.click(); break;
    case "s": if (!btnSeal.disabled) btnSeal.click(); break;
    case "m": btnMute.click(); break;
    case "h": toggleHelp(); break;
    case "escape":
      if (!helpOverlay.hidden) toggleHelp(false);
      else if (!btnAbort.disabled) releaseCant();
      break;
  }
});

// unlock audio on the first pointer touch anywhere
document.addEventListener("pointerdown", () => audio.unlock(), { once: false });

// ---------- first words ----------

setStatus("AT REST", "idle");
refreshButtons();
log("HELIORA · Threshold Annulus — Meridian Vault Instrument No. 1.", "gold");
log("Thirty sigils stand ready. Choose a cant from the Codex, drift one, or write your own on the ring.", "");
log("Every cant closes with Solyn, the Standing Sun.", "teal");
