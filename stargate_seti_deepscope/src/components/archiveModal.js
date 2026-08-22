// Historical Technosignature Archive Component (Searchable & Filterable)

import { ARCHIVE_RECORDS } from '../data/carriers.js';
import { soundEngine } from '../audio/soundEngine.js';

export class ArchiveModal {
  constructor(onSelectTarget) {
    this.records = ARCHIVE_RECORDS;
    this.filteredRecords = [...this.records];
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.onSelectTarget = onSelectTarget;

    this.initElements();
    this.bindEvents();
    this.renderTable();
  }

  initElements() {
    this.modal = document.getElementById('modal-archive');
    this.searchInput = document.getElementById('archive-search-input');
    this.tableBody = document.getElementById('archive-table-body');
    this.countLabel = document.getElementById('archive-result-count');
    this.filterPills = document.querySelectorAll('.filter-pill');
  }

  bindEvents() {
    const openBtn = document.getElementById('btn-open-archive');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.modal.classList.add('is-open');
        this.modal.setAttribute('aria-hidden', 'false');
      });
    }

    document.querySelectorAll('[data-close="modal-archive"]').forEach(btn => {
      btn.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.modal.classList.remove('is-open');
        this.modal.setAttribute('aria-hidden', 'true');
      });
    });

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.applyFilters();
      });
    }

    this.filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentFilter = pill.dataset.filter;
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    this.filteredRecords = this.records.filter(rec => {
      // Classification filter
      if (this.currentFilter === 'verified' && rec.class !== 'VERIFIED') return false;
      if (this.currentFilter === 'rfi' && rec.class !== 'RFI') return false;
      if (this.currentFilter === 'anomaly' && rec.class !== 'UNCONFIRMED') return false;

      // Text search
      if (this.searchTerm) {
        const rowText = `${rec.time} ${rec.id} ${rec.target} ${rec.freq} ${rec.class}`.toLowerCase();
        if (!rowText.includes(this.searchTerm)) return false;
      }

      return true;
    });

    this.renderTable();
  }

  renderTable() {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = '';

    if (this.countLabel) {
      this.countLabel.textContent = `SHOWING ${this.filteredRecords.length} OF ${this.records.length} RECORDS`;
    }

    if (this.filteredRecords.length === 0) {
      this.tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding: 20px;">NO ARCHIVED RECORDS MATCH CURRENT FILTERS</td></tr>`;
      return;
    }

    this.filteredRecords.forEach(rec => {
      const tr = document.createElement('tr');

      let classColor = 'var(--text-muted)';
      if (rec.class === 'VERIFIED') classColor = 'var(--accent)';
      if (rec.class === 'RFI') classColor = 'var(--color-rose)';
      if (rec.class === 'UNCONFIRMED') classColor = 'var(--color-amber)';

      const hasCarriers = rec.carriers && rec.carriers.length > 0;

      tr.innerHTML = `
        <td style="color: var(--text-muted); font-size: 10px;">${rec.time}</td>
        <td><strong>${rec.id}</strong> &bull; ${rec.target}</td>
        <td style="color: var(--accent);">${rec.freq}</td>
        <td>${rec.drift} Hz/s</td>
        <td>${rec.snr} dB</td>
        <td>${rec.dm} pc/cm³</td>
        <td><strong style="color: ${classColor};">${rec.class}</strong></td>
        <td>
          ${hasCarriers ? `<button class="panel-action-btn load-target-btn" data-id="${rec.id}">LOAD TO CONSOLE</button>` : `<span style="color:var(--text-dim); font-size:9px;">NO CARRIER LOCK</span>`}
        </td>
      `;

      if (hasCarriers) {
        const loadBtn = tr.querySelector('.load-target-btn');
        if (loadBtn) {
          loadBtn.addEventListener('click', () => {
            soundEngine.playUiClick();
            if (this.onSelectTarget) {
              this.onSelectTarget(rec);
            }
            this.modal.classList.remove('is-open');
            this.modal.setAttribute('aria-hidden', 'true');
          });
        }
      }

      this.tableBody.appendChild(tr);
    });
  }
}
