// ============================================================
// main.js — wiring: loads the catalog, wires the status filter,
// drives the starfield render loop.
//
// Console test hook (documented per family convention):
//   window.__hub.report()      -> { total, visible, filter, byStatus:
//                                    {live, "known-issue", retired},
//                                    featuredRendered }
//   window.__hub.setFilter(s)  -> programmatically set the status filter
//                                  ("all"|"live"|"known-issue"|"retired")
//   window.__hub.gallery       -> the live Gallery instance
// ============================================================

import { Starfield } from "./starfield.js";
import { Gallery } from "./gallery.js";

const $ = (id) => document.getElementById(id);

const STATUS_VALUES = ["live", "known-issue", "retired"];

const starfield = new Starfield($("stars"));
const gallery = new Gallery({
  gridEl: $("grid"),
  emptyEl: $("empty-state"),
  countEl: $("filter-count"),
  featuredEl: $("featured"),
});

const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
function setActiveButton(status) {
  for (const b of filterButtons) {
    const active = b.dataset.status === status;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  }
}
for (const b of filterButtons) {
  b.addEventListener("click", () => {
    gallery.setFilter(b.dataset.status);
    setActiveButton(b.dataset.status);
  });
}

gallery.load().catch((err) => {
  $("grid").hidden = true;
  const empty = $("empty-state");
  empty.hidden = false;
  empty.textContent = "Catalog failed to load — see console.";
  console.error(err);
});

function frame(now) {
  starfield.render(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__hub = {
  gallery,
  setFilter(status) {
    gallery.setFilter(status);
    setActiveButton(status);
  },
  report() {
    const byStatus = {};
    for (const s of STATUS_VALUES) byStatus[s] = 0;
    for (const e of gallery.entries) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    const featuredRendered = !!(
      gallery.featuredEl &&
      !gallery.featuredEl.hidden &&
      gallery.featuredEl.querySelector(".featured-card")
    );
    return {
      total: gallery.entries.length,
      visible: gallery.gridEl.children.length,
      filter: gallery.filter,
      byStatus,
      featuredRendered,
    };
  },
};
