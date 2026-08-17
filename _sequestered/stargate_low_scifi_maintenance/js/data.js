// Routing ledger — every destination is fictional utility infrastructure.
export const LEDGER = [
  { route: '40221', name: 'BRINEWELL PUMPING STN.', note: 'WKLY PUMP INSP.' },
  { route: '07714', name: 'HIGH SHELF QUARRY',      note: 'HAUL SHIFT ONLY' },
  { route: '21940', name: 'RELAY FARM 12',          note: 'KEEP DRY' },
  { route: '88405', name: 'SOUTH TAILINGS DEPOT',   note: 'MASK REQ’D' },
  { route: '15530', name: 'GLASSHOUSE ANNEX',       note: 'FRAGILE FREIGHT' },
  { route: '52063', name: 'FOUNDRY GATE B',         note: 'HOT WORK PERMIT' },
  { route: '30172', name: 'UPPER MET. HUT',         note: 'WINTER: CLOSED' },
  { route: '66090', name: 'CENTRAL STORES',         note: 'MANIFEST REQ’D' },
];

// Pre-punched, supervisor-stamped route cards kept in the rack.
// A seated card gang-releases the stepping relays and carries the
// pre-transit certification stamp (Maintenance Order 7-C).
export const CARDS = ['40221', '21940', '66090'];

export const CHECKLIST = [
  'SEAL RING SEATED',
  'PLENUM EQUALIZED',
  'TRAFFIC BOARD CLEAR',
];

export function findRoute(route) {
  return LEDGER.find(r => r.route === route) || null;
}
