// DEADRINGER dial state machine.
// Everything is a function of wall-clock time; tick() advances phases and is
// driven by both rAF and the worker heartbeat, so a throttled tab still runs.

import {
  DESTS, CHIPS, SEG_SPANS, DEAD_SEG, STALL_SEG, SEG_NAMES,
  SPOOL_ORDER, SPOOL_DELTAS, STALL_AUTOCLEAR_MS, TTL_WARN_MS, TTL_DROP_MS, ghex,
} from './data.js';
import { now } from './clock.js';

export const S = {
  phase: 'idle',
  phaseAt: 0,
  dest: null,          // dest id
  mode: 'full',        // 'full' | 'resume'
  segAt: new Array(SEG_SPANS.length).fill(0), // energize timestamp per segment (0 = dark)
  spool: null,         // {idx, nextT, endT, stall:{since}|null, stallDone}
  script: null,        // {lines:[{t,text,cls}], idx, endT, next}
  coverOpen: false,
  lever: false,
  seated: null,        // chip id in reader
  tickets: new Set(),  // session-cached destinations
  openAt: 0,
  ttlWarned: false,
  audio: false,
  dials: 0,            // completed opens (flavor)
  lastNag: 0,
};

const subs = {};
export function on(ev, fn) { (subs[ev] ??= []).push(fn); }
export function emit(ev, ...a) { for (const fn of subs[ev] ?? []) fn(...a); }

const say = (text, cls) => emit('line', text, cls);
function nag(text) {
  const t = now();
  if (t - S.lastNag < 1200) return;
  S.lastNag = t; say(text, 'warn');
}

function setPhase(p) {
  S.phase = p; S.phaseAt = now(); emit('phase', p);
}

export const routeStr = id => 'KV//' + DESTS[id].hops.join(':');
const ACTIVE = new Set(['spool', 'negotiate', 'resume', 'lock', 'ready', 'open']);

export function canResume(id) {
  if (!id) return false;
  if (S.tickets.has(id)) return true;
  const chip = CHIPS.find(c => c.id === S.seated);
  return !!(chip && chip.ok && chip.dest === id);
}

// ---------------- actions ----------------

export const actions = {
  selectDest(id) {
    const d = DESTS[id];
    if (!d) return;
    if (ACTIVE.has(S.phase) && S.phase !== 'idle') { nag('ROUTE LOCKED IN. SEVER FIRST.'); return; }
    if (d.dead) { nag(`${d.name}? no. tag is struck through. it stays struck through.`); return; }
    S.dest = id;
    say(`ROUTE STAGED :: ${d.name}`, 'ok');
    say(`  ${routeStr(id)}`);
    if (canResume(id)) say('  warm session available — RES will take it.', 'dim');
  },

  negotiate() {
    if (S.phase !== 'idle') { nag('rig is busy. CUT if you mean it.'); return; }
    if (!S.dest) { nag('stage a route first. the board is right there.'); return; }
    S.mode = 'full';
    S.segAt.fill(0);
    S.spool = { idx: 0, nextT: now() + SPOOL_DELTAS[0], endT: 0, stall: null, stallDone: false };
    say(`SPOOL :: RING A7-113 WAKING — ${DESTS[S.dest].name}`, 'ok');
    setPhase('spool');
  },

  resume() {
    if (S.phase !== 'idle') { nag('rig is busy. CUT if you mean it.'); return; }
    if (!S.dest) { nag('stage a route first.'); return; }
    if (!canResume(S.dest)) {
      nag(`NO WARM SESSION FOR ${DESTS[S.dest].name}. run the long way, or seat a ghost key.`);
      return;
    }
    S.mode = 'resume';
    const t = now();
    // hot slam: every live segment energizes in quick irregular order
    SPOOL_ORDER.forEach((seg, k) => { if (seg !== DEAD_SEG) S.segAt[seg] = t + 380 + k * 70; });
    const d = DESTS[S.dest];
    const lines = [
      { t: 0, text: `TICKET REPLAY :: ${d.name}`, cls: 'ok' },
      { t: 350, text: `SESSION ${ghex('tkt' + d.id)} STILL WARM` },
      ...d.hops.map((h, i) => ({ t: 820 + i * 260, text: `RESUME ${h} :: ACCEPT` })),
      { t: 820 + d.hops.length * 260 + 480, text: 'LATTICE FORMING (HOT)', cls: 'ok' },
    ];
    S.script = { lines, idx: 0, endT: t + lines[lines.length - 1].t + 200, next: 'lock', base: t };
    setPhase('resume');
  },

  whack() {
    const sp = S.spool;
    if (S.phase === 'spool' && sp && sp.stall && !sp.stallDone) {
      clearStall('percussive maintenance registered. driver up.');
    }
  },

  toggleCover() {
    S.coverOpen = !S.coverOpen;
    if (S.coverOpen && S.phase !== 'ready') say('cover up. bar does nothing until the lattice pins.', 'dim');
  },

  pullLever() {
    if (!S.coverOpen) return;
    if (S.phase !== 'ready') { nag('no lattice. the bar is not a magic wand.'); return; }
    S.lever = true;
    S.openAt = now(); S.ttlWarned = false;
    const d = DESTS[S.dest];
    say(`APERTURE OPEN :: ${d.name}`, 'hot');
    if (S.mode === 'full' && !S.tickets.has(S.dest)) {
      S.tickets.add(S.dest);
      say(`TICKET CACHED :: ${d.name} (until rig powers down)`, 'ok');
    }
    S.dials++;
    setPhase('open');
  },

  cut() {
    if (S.phase === 'open') {
      say('CUT. route severed clean.', 'warn');
      S.lever = false;
      setPhase('sever');
    } else if (ACTIVE.has(S.phase)) {
      say('CUT — spooling down mid-handshake. the exchange will sulk.', 'warn');
      S.lever = false;
      setPhase('abort');
    }
  },

  seatChip(id) {
    const chip = CHIPS.find(c => c.id === id);
    if (!chip) return;
    if (S.seated === id) { S.seated = null; say(`ghost key out :: ${chip.label}`, 'dim'); return; }
    if (!chip.ok) { nag('key reads burned. because it is burned.'); return; }
    S.seated = id;
    say(`ghost key seated :: ${chip.label} (${DESTS[chip.dest].name})`, 'ok');
  },

  toggleAudio() { S.audio = !S.audio; emit('audio', S.audio); },
};

// ---------------- internals ----------------

function clearStall(msg) {
  const sp = S.spool, t = now();
  sp.stall = null; sp.stallDone = true;
  S.segAt[STALL_SEG] = t;
  say(msg, 'ok');
  sp.idx++;
  sp.nextT = t + (SPOOL_DELTAS[sp.idx] ?? 400);
}

function buildNegotiate() {
  const d = DESTS[S.dest], t = now(), lines = [];
  const carriers = [
    'CARRIER UP. derelict, trickle power. still listening.',
    'CARRIER UP. echo is bad. somebody left a pump running.',
    'CARRIER UP. answers on the second ring, like always.',
  ];
  let base = 0;
  d.hops.forEach((h, i) => {
    lines.push({ t: base, text: `PROBE ${h} ......` });
    lines.push({ t: base + 900, text: '  ' + carriers[i % carriers.length], cls: 'dim' });
    lines.push({ t: base + 1700, text: `  CHAL ${ghex(d.id + h)}` });
    lines.push({ t: base + 2550, text: `  RESP ${ghex(h + d.id)} :: GHOSTED`, cls: 'ok' });
    lines.push({ t: base + 3100, text: `  ACCEPT — HOP ${i + 1}/${d.hops.length} PINNED`, cls: 'ok' });
    base += 3400 + ((i * 537) % 900);
  });
  const endOff = base + 550;
  lines.push({ t: endOff, text: 'ALL HOPS PINNED — FORMING LATTICE', cls: 'hot' });
  S.script = { lines, idx: 0, endT: t + endOff + 350, next: 'lock', base: t };
}

const LOCK_MS = { full: 2200, resume: 900 };

export function tick(t = now()) {
  const el = t - S.phaseAt;

  if (S.phase === 'spool') {
    const sp = S.spool;
    while (sp.idx < SPOOL_ORDER.length && t >= sp.nextT) {
      const seg = SPOOL_ORDER[sp.idx];
      if (seg === STALL_SEG && !sp.stallDone) {
        if (!sp.stall) {
          sp.stall = { since: t };
          say(`SEG ${SEG_NAMES[seg]} DRIVER STALL — cold again. give it a whack.`, 'warn');
        }
        if (t >= sp.stall.since + STALL_AUTOCLEAR_MS) clearStall('driver crawled back up on its own. eventually.');
        break;
      }
      if (seg === DEAD_SEG) say(`SEG ${SEG_NAMES[seg]} NO RESPONSE. (segment ${SEG_NAMES[seg]} never responds.)`, 'dim');
      else S.segAt[seg] = t;
      sp.idx++;
      if (sp.idx < SPOOL_ORDER.length) sp.nextT = t + SPOOL_DELTAS[sp.idx];
      else sp.endT = t + 500;
    }
    if (sp.idx >= SPOOL_ORDER.length && t >= sp.endT) {
      say('RING HOT. beginning negotiation. this is the slow, honest forgery.', 'ok');
      buildNegotiate();
      setPhase('negotiate');
    }
  }

  if (S.phase === 'negotiate' || S.phase === 'resume') {
    const sc = S.script;
    while (sc.idx < sc.lines.length && t >= sc.base + sc.lines[sc.idx].t) {
      const L = sc.lines[sc.idx++];
      say(L.text, L.cls);
    }
    if (t >= sc.endT) setPhase(sc.next);
  }

  if (S.phase === 'lock' && el >= LOCK_MS[S.mode]) {
    say('LATTICE STABLE. APERTURE ARMED — lift the cover, pull the bar.', 'hot');
    setPhase('ready');
  }

  if (S.phase === 'open') {
    const dur = t - S.openAt;
    if (!S.ttlWarned && dur >= TTL_WARN_MS) {
      S.ttlWarned = true;
      say('SESSION TTL LOW. the exchange will drop us on its own clock.', 'warn');
    }
    if (dur >= TTL_DROP_MS) {
      say('TTL EXPIRED — EXCHANGE DROPPED THE ROUTE.', 'warn');
      S.lever = false;
      setPhase('sever');
    }
  }

  if (S.phase === 'sever' && el >= 900) setPhase('cooldown');
  if (S.phase === 'abort' && el >= 700) setPhase('cooldown');
  if (S.phase === 'cooldown' && el >= 3000) {
    S.segAt.fill(0); S.spool = null; S.script = null;
    say('ring cold. rig idle.', 'dim');
    setPhase('idle');
  }
}

// ---------------- shared energy curve (ring / portal / meter) ----------------

export function energy(t = now()) {
  const el = t - S.phaseAt;
  const lit = S.segAt.reduce((n, a) => n + (a && a <= t ? 1 : 0), 0) / (SEG_SPANS.length - 1);
  switch (S.phase) {
    case 'idle': return 0.045;
    case 'spool': return 0.05 + lit * 0.42;
    case 'resume': return 0.05 + lit * 0.55;
    case 'negotiate': return 0.47 + 0.05 * Math.sin(t / 420);
    case 'lock': return 0.52 + 0.28 * Math.min(1, el / LOCK_MS[S.mode]);
    case 'ready': return 0.78 + 0.05 * Math.sin(t / 800);
    case 'open': return 0.97 + 0.03 * Math.sin(t / 130) * Math.sin(t / 47);
    case 'sever': return Math.max(0.15, 1 - el / 900 * 0.85);
    case 'abort': return Math.max(0.1, 0.5 - el / 700 * 0.4);
    case 'cooldown': return Math.max(0.045, 0.16 * (1 - el / 3000));
    default: return 0.045;
  }
}
