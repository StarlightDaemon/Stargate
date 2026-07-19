// Geodesic cache — the in-universe basis of fast dialing.
// Once Meridian has cold-solved a route, the solution is imprinted in its
// lattice; this module persists that fact locally (localStorage only,
// nothing ever leaves the page).

const KEY = 'meridian.geodesic-cache.v1';
export const CACHE_SLOTS = 8;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export class GeodesicCache {
  constructor() { this.entries = load(); }

  has(id) { return this.entries.some(e => e.id === id); }

  add(id) {
    if (this.has(id)) return;
    this.entries.push({ id, solvedAt: Date.now() });
    if (this.entries.length > CACHE_SLOTS) this.entries.shift();
    this.save();
  }

  purge() { this.entries = []; this.save(); }

  get count() { return this.entries.length; }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.entries)); } catch { /* private mode: cache is session-only */ }
  }
}
