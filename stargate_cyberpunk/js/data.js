// DEADRINGER — static data. All destinations are fictional; routes go nowhere.

export const DESTS = {
  marrow: {
    id: 'marrow', name: 'PALE MARROW', hops: ['EXCH-04', 'SPUR-19', 'DROP-113'],
    hue: 168, note: 'flooded stacks. dry above L3.', wear: 0.55, tilt: -1.6,
  },
  birdcage: {
    id: 'birdcage', name: 'THE BIRDCAGE', hops: ['EXCH-04', 'RING-02', 'TETHER-A'],
    hue: 36, note: 'tether anchor, stripped. wind.', wear: 0.2, tilt: 1.1,
  },
  saltcath: {
    id: 'saltcath', name: 'SALT CATHEDRAL', hops: ['EXCH-11', 'SPUR-03', 'PIER-77'],
    hue: 108, note: 'desal hulk. bring goggles.', wear: 0.75, tilt: 0.6,
  },
  pearl: {
    id: 'pearl', name: 'MOTHER-OF-PEARL', hops: ['EXCH-09', 'FREEPORT-6'],
    hue: 286, note: 'freeport. they know us. behave.', wear: 0.1, tilt: -0.8,
  },
  hum: {
    id: 'hum', name: 'THE HUM', hops: ['EXCH-04', 'SUB-31', 'YARD-9'],
    hue: 52, note: 'substation commune. pay the toll.', wear: 0.4, tilt: 1.8,
  },
  cinder: {
    id: 'cinder', name: 'CINDER STREET', hops: ['EXCH-02', 'SPUR-40', 'CELLAR-5'],
    hue: 8, note: 'collapsed 3/86. DO NOT.', wear: 0.9, tilt: -2.3, dead: true,
  },
};

export const DEST_ORDER = ['marrow', 'birdcage', 'saltcath', 'pearl', 'hum', 'cinder'];

// Ghost keys in the rack. One is burned.
export const CHIPS = [
  { id: 'chipA', dest: 'pearl',  label: 'M.O.P.',  ok: true,  tilt: -2 },
  { id: 'chipB', dest: 'marrow', label: 'MARROW',  ok: true,  tilt: 1.4 },
  { id: 'chipC', dest: null,     label: '—',  ok: false, tilt: 3.1 }, // burned
];

// Ring geometry: 11 segments, irregular arc spans (degrees, sum 360).
export const SEG_SPANS = [38, 30, 27, 41, 29, 33, 36, 25, 40, 31, 30];
export const SEG_GAP = 2.6;               // joint gap eaten out of each span
export const FAB_SEGS = new Set([2, 6, 9]); // black-market replacements (magenta pilots)
export const DEAD_SEG = 4;                  // scorched, never lights
export const SEG_NAMES = 'ABCDEFGHIJK';
export const STALL_SEG = 2;                 // C stalls on cold spool

// Spool-up order (irregular) with irregular delays (ms before each event).
export const SPOOL_ORDER = [3, 8, 0, 5, 10, 2, 7, 1, 6, 4, 9];
export const SPOOL_DELTAS = [0, 320, 610, 380, 450, 520, 700, 340, 610, 280, 490];
export const STALL_AUTOCLEAR_MS = 3500;

export const TTL_WARN_MS = 90_000;
export const TTL_DROP_MS = 120_000;

// Deterministic junk hex from a string (for CHAL/RESP lines).
export function ghex(s, len = 8) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  let out = '';
  for (let i = 0; i < len; i++) { h = Math.imul(h ^ (h >>> 15), 2246822519); out += ((h >>> 24) & 15).toString(16); }
  return out.toUpperCase();
}

// Ambient beacon lines the dead network coughs up while idle.
export const AMBIENT_LINES = [
  'bcn EXCH-04 :: still here. nobody home.',
  'bcn EXCH-11 :: pump fault W3 (ack 4,112 days ago)',
  'bcn RING-02 :: tether sway nominal',
  'noise floor -87dB. water in the cable vault again.',
  'bcn EXCH-09 :: freeport relay OK',
  'kv-nms: license expired. service continues anyway.',
  'bcn SUB-31 :: 50Hz strong tonight',
  'segment E polled. segment E says nothing. as usual.',
];
