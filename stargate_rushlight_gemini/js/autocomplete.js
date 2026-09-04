// autocomplete.js — Folk destination typeahead combobox and catalog browser
// Provides keyboard navigation (Up/Down/Enter/Escape), filtering, and rune sequence preview.

export class FolkAutocomplete {
  constructor({ inputEl, dropdownEl, destinations, runes, onSelect }) {
    this.input = inputEl;
    this.dropdown = dropdownEl;
    this.destinations = destinations;
    this.runes = runes;
    this.onSelect = onSelect;

    this.filtered = [...this.destinations];
    this.selectedIndex = -1;
    this.isOpen = false;

    this.initEvents();
  }

  initEvents() {
    this.input.addEventListener("input", () => this.handleInput());
    this.input.addEventListener("focus", () => this.open());
    this.input.addEventListener("keydown", (e) => this.handleKeyDown(e));

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.close();
      }
    });
  }

  filterDestinations(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...this.destinations];
    }
    return this.destinations.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.herb.toLowerCase().includes(q) ||
      d.lore.toLowerCase().includes(q)
    );
  }

  handleInput() {
    this.filtered = this.filterDestinations(this.input.value);
    this.selectedIndex = this.filtered.length > 0 ? 0 : -1;
    this.renderDropdown();
    this.open();
  }

  handleKeyDown(e) {
    if (!this.isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      this.open();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (this.filtered.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.filtered.length;
        this.updateActiveItem();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (this.filtered.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.filtered.length) % this.filtered.length;
        this.updateActiveItem();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (this.selectedIndex >= 0 && this.selectedIndex < this.filtered.length) {
        this.selectDestination(this.filtered[this.selectedIndex]);
      }
    } else if (e.key === "Escape") {
      this.close();
    }
  }

  open() {
    this.filtered = this.filterDestinations(this.input.value);
    this.renderDropdown();
    this.dropdown.classList.remove("dropdown-hidden");
    this.input.setAttribute("aria-expanded", "true");
    this.isOpen = true;
  }

  close() {
    this.dropdown.classList.add("dropdown-hidden");
    this.input.setAttribute("aria-expanded", "false");
    this.isOpen = false;
  }

  renderDropdown() {
    this.dropdown.innerHTML = "";
    if (this.filtered.length === 0) {
      this.dropdown.innerHTML = `
        <div class="autocomplete-empty">
          <em>No folk thresholds match in the parish registry.</em>
        </div>
      `;
      return;
    }

    this.filtered.forEach((dest, index) => {
      const item = document.createElement("div");
      item.className = `autocomplete-item ${index === this.selectedIndex ? "selected" : ""}`;
      item.setAttribute("role", "option");
      item.setAttribute("id", `dest-opt-${dest.id}`);
      item.setAttribute("aria-selected", index === this.selectedIndex ? "true" : "false");

      // Generate compact rune glyph pills
      const runesPills = dest.address.map(id => {
        const r = this.runes.find(x => x.id === id);
        return `<span class="mini-rune-pill" title="${r ? r.name : ''}">#${id}</span>`;
      }).join("");

      item.innerHTML = `
        <div class="dest-item-main">
          <div class="dest-item-header">
            <span class="dest-item-name">${dest.name}</span>
            <span class="dest-item-cat">${dest.category}</span>
          </div>
          <div class="dest-item-lore">${dest.lore}</div>
          <div class="dest-item-footer">
            <span class="dest-item-herb">🌿 ${dest.herb}</span>
            <div class="dest-runes-seq">${runesPills}</div>
          </div>
        </div>
      `;

      item.addEventListener("click", () => {
        this.selectDestination(dest);
      });

      this.dropdown.appendChild(item);
    });

    this.scrollSelectedIntoView();
  }

  updateActiveItem() {
    const items = this.dropdown.querySelectorAll(".autocomplete-item");
    items.forEach((item, idx) => {
      const isSelected = idx === this.selectedIndex;
      item.classList.toggle("selected", isSelected);
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
    this.scrollSelectedIntoView();
  }

  scrollSelectedIntoView() {
    const active = this.dropdown.querySelector(".autocomplete-item.selected");
    if (active) {
      active.scrollIntoView({ block: "nearest" });
    }
  }

  selectDestination(dest) {
    this.input.value = dest.name;
    this.close();
    if (this.onSelect) {
      this.onSelect(dest);
    }
  }
}
