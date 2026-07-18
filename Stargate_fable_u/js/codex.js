/* ============================================================
   codex.js — the Codex of Known Cants.

   A cant is a seven-sigil attunement: six waypoint sigils and
   the closing origin, Solyn. Every destination here is fiction,
   named for the vault's own mythology. One entry — Cor-Avenna —
   is recorded as lost; its cant still locks, but the strike
   finds nothing on the far side.
   ============================================================ */

export const ORIGIN = 0; // Solyn, the Standing Sun

export const CANTS = [
  {
    name: "Vhal-Meridia",
    desc: "the Noon City, where the light never leans",
    sigils: [3, 11, 19, 7, 24, 15, ORIGIN],
  },
  {
    name: "Umbrareach",
    desc: "eclipse observatory on the dark limb",
    sigils: [22, 5, 17, 9, 28, 13, ORIGIN],
  },
  {
    name: "Cindral Deep",
    desc: "forge-vault beneath the ember sea",
    sigils: [8, 26, 2, 20, 14, 29, ORIGIN],
  },
  {
    name: "Selenis Veil",
    desc: "the pale gardens, kept at first light",
    sigils: [12, 4, 23, 16, 27, 6, ORIGIN],
  },
  {
    name: "Auric Shoal",
    desc: "landing on the sea of first light",
    sigils: [25, 10, 18, 1, 21, 9, ORIGIN],
  },
  {
    name: "Cor-Avenna",
    desc: "the Drowned Meridian — record reads: signal lost",
    sigils: [14, 3, 27, 21, 8, 17, ORIGIN],
    unstable: true,
  },
];

/* Compose a random, valid, previously unwritten cant. */
export function driftCant() {
  const pool = [];
  for (let i = 1; i < 30; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6).concat(ORIGIN);
}

/* Render the codex list. `onPick(cant, li)` fires on click. */
export function buildCodex(ul, onPick) {
  ul.innerHTML = "";
  for (const cant of CANTS) {
    const li = document.createElement("li");
    li.className = "codex-entry" + (cant.unstable ? " unstable" : "");
    li.innerHTML =
      `<div class="cx-name">${cant.name}</div>` +
      `<div class="cx-desc">${cant.desc}</div>`;
    li.addEventListener("click", () => onPick(cant, li));
    ul.appendChild(li);
  }
}
