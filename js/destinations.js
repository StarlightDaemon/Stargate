// ============================================================
// destinations.js — the registered address book.
// Every destination is fictional and self-contained; addresses
// are 7 distinct sigil indices (0..35) into the Meridian set.
// ============================================================

export const DESTINATIONS = [
  { name: "THAROS EXPANSE",  tag: "survey outpost · dust nebula",      addr: [4, 17, 29, 8, 22, 34, 11] },
  { name: "VEIL OF KESSET",  tag: "listening post · twilight band",    addr: [2, 31, 14, 25, 7, 19, 33] },
  { name: "ORRIN DEEP",      tag: "ocean world · research trench",     addr: [9, 0, 27, 16, 35, 5, 21] },
  { name: "CINDER REACH",    tag: "forge colony · tidally locked",     addr: [13, 24, 3, 30, 18, 6, 28] },
  { name: "NYX HOLLOW",      tag: "archive vault · rogue planetoid",   addr: [26, 10, 32, 1, 15, 23, 12] },
  { name: "PELUNE ATOLL",    tag: "waystation · ring shepherd moon",   addr: [20, 34, 7, 29, 2, 16, 9] },
];

export function randomAddress() {
  const pool = Array.from({ length: 36 }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 7);
}
