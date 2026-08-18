// ============================================================
// gallery.js — loads hub/index.json and renders the featured hero
// section plus the card grid.
//
// Status model: three values. "live" gets no badge and the default
// card border (no special treatment needed). "known-issue" and
// "retired" each get their own badge color, border treatment, and
// card class so they're visibly distinct from each other, not just
// from "live".
// ============================================================

const PLACEHOLDER_PREVIEW = "assets/preview-placeholder.svg";

const STATUS_LABELS = {
  "known-issue": "KNOWN ISSUE",
  retired: "RETIRED",
};

export class Gallery {
  constructor({ gridEl, emptyEl, countEl, featuredEl }) {
    this.gridEl = gridEl;
    this.emptyEl = emptyEl;
    this.countEl = countEl;
    this.featuredEl = featuredEl;
    this.entries = [];
    this.featured = null;
    this.filter = "live";
  }

  async load(jsonUrl = "index.json") {
    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error(`Failed to load ${jsonUrl}: ${res.status}`);
    const data = await res.json();
    this.entries = Array.isArray(data.entries) ? data.entries : [];
    this.featured = data.featured || null;
    this.renderFeatured();
    this.render();
    return this.entries;
  }

  setFilter(status) {
    this.filter = status;
    this.render();
  }

  _visibleEntries() {
    if (this.filter === "all") return this.entries;
    return this.entries.filter((e) => e.status === this.filter);
  }

  renderFeatured() {
    if (!this.featuredEl) return;
    this.featuredEl.innerHTML = "";

    if (!this.featured) {
      this.featuredEl.hidden = true;
      return;
    }
    this.featuredEl.hidden = false;

    const tag = this.featured.link ? "a" : "div";
    const card = document.createElement(tag);
    card.className = "featured-card";
    if (tag === "a") card.href = this.featured.link;

    const eyebrow = document.createElement("span");
    eyebrow.className = "featured-eyebrow";
    eyebrow.textContent = "FEATURED BUILD";

    const title = document.createElement("h2");
    title.className = "featured-title";
    title.textContent = this.featured.title;

    const blurb = document.createElement("p");
    blurb.className = "featured-blurb";
    blurb.textContent = this.featured.blurb || "";

    card.appendChild(eyebrow);
    card.appendChild(title);
    card.appendChild(blurb);

    if (this.featured.testStatus) {
      const test = document.createElement("p");
      test.className = "featured-test";
      test.textContent = this.featured.testStatus;
      card.appendChild(test);
    }

    this.featuredEl.appendChild(card);
  }

  _buildCard(entry) {
    const isLive = entry.status === "live";
    const tag = entry.link ? "a" : "div";
    const card = document.createElement(tag);
    card.className = `card status-${entry.status}`;
    if (tag === "a") {
      card.href = entry.link;
    }
    card.dataset.status = entry.status;
    card.dataset.folder = entry.folder;

    const preview = document.createElement("div");
    preview.className = "card-preview";
    const img = document.createElement("img");
    img.src = entry.preview || PLACEHOLDER_PREVIEW;
    img.alt = `${entry.title} preview`;
    img.loading = "lazy";
    img.addEventListener("error", () => {
      if (img.src.indexOf("preview-placeholder") === -1) img.src = PLACEHOLDER_PREVIEW;
    });
    preview.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h2");
    title.className = "card-title";
    title.textContent = entry.title;

    const blurb = document.createElement("p");
    blurb.className = "card-blurb";
    blurb.textContent = entry.blurb || "";

    const footer = document.createElement("div");
    footer.className = "card-footer";

    const tags = document.createElement("div");
    tags.className = "card-tags";

    if (!isLive) {
      const badge = document.createElement("span");
      badge.className = `status-badge ${entry.status}`;
      badge.textContent = STATUS_LABELS[entry.status] || entry.status;
      tags.appendChild(badge);
    }

    const folder = document.createElement("span");
    folder.className = "card-folder";
    folder.textContent = entry.folder;
    tags.appendChild(folder);

    footer.appendChild(tags);

    if (entry.version) {
      const version = document.createElement("span");
      version.className = "card-version";
      version.textContent = `v${entry.version}`;
      footer.appendChild(version);
    }

    body.appendChild(title);
    body.appendChild(blurb);
    body.appendChild(footer);

    card.appendChild(preview);
    card.appendChild(body);
    return card;
  }

  render() {
    const visible = this._visibleEntries();
    this.gridEl.innerHTML = "";
    for (const entry of visible) this.gridEl.appendChild(this._buildCard(entry));

    this.emptyEl.hidden = visible.length > 0;
    this.gridEl.hidden = visible.length === 0;

    if (this.countEl) {
      this.countEl.textContent = `${visible.length} of ${this.entries.length}`;
    }
  }
}
