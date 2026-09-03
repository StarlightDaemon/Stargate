/**
 * Khepri Cipher Terminal - Cross-Referenced Breach Database Archive UI
 */

class CipherArchiveUI {
  constructor() {
    this.entries = window.CIPHER_ARCHIVE_DATA || [];
    this.selectedEntry = this.entries[0] || null;
    this.activeTag = 'ALL';
    this.searchQuery = '';
    this.viewedHistory = this.loadViewedHistory();

    this.modal = document.getElementById('archive-modal');
    this.listContainer = document.getElementById('archive-list-container');
    this.dossierContainer = document.getElementById('archive-dossier-view');
    this.searchInput = document.getElementById('archive-search-input');
    this.tagFilters = document.querySelectorAll('.tag-pill');

    this.init();
  }

  init() {
    if (!this.modal) return;

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderList();
      });
    }

    // Tag pills
    this.tagFilters.forEach((pill) => {
      pill.addEventListener('click', () => {
        this.tagFilters.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeTag = pill.getAttribute('data-tag') || 'ALL';
        this.renderList();
      });
    });

    // Close button
    const closeBtn = document.getElementById('btn-close-archive');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    this.renderList();
    if (this.selectedEntry) {
      this.renderDossier(this.selectedEntry);
    }
  }

  open(targetId = null) {
    if (!this.modal) return;
    this.modal.classList.add('open');
    if (targetId) {
      this.selectEntryById(targetId);
    }
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
  }

  isOpen() {
    return this.modal && this.modal.classList.contains('open');
  }

  selectEntryById(id) {
    const found = this.entries.find(e => e.id === id);
    if (found) {
      this.selectedEntry = found;
      this.markViewed(found.id);
      this.renderList();
      this.renderDossier(found);
    }
  }

  markViewed(id) {
    if (!this.viewedHistory.includes(id)) {
      this.viewedHistory.push(id);
      this.saveViewedHistory();
    }
  }

  loadViewedHistory() {
    try {
      const stored = localStorage.getItem('khepri_viewed_archives');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveViewedHistory() {
    try {
      localStorage.setItem('khepri_viewed_archives', JSON.stringify(this.viewedHistory));
    } catch (e) {}
  }

  renderList() {
    if (!this.listContainer) return;
    this.listContainer.innerHTML = '';

    const filtered = this.entries.filter((entry) => {
      const matchesTag = this.activeTag === 'ALL' || entry.tags.includes(this.activeTag);
      const matchesSearch = !this.searchQuery || 
        entry.name.toLowerCase().includes(this.searchQuery) ||
        entry.id.toLowerCase().includes(this.searchQuery) ||
        entry.sector.toLowerCase().includes(this.searchQuery) ||
        entry.description.toLowerCase().includes(this.searchQuery);
      return matchesTag && matchesSearch;
    });

    if (filtered.length === 0) {
      this.listContainer.innerHTML = '<div style="padding: 24px; color: var(--text-muted); text-align: center;">NO DATA ENCLAVES MATCH CRITERIA</div>';
      return;
    }

    filtered.forEach((entry) => {
      const item = document.createElement('div');
      const isSelected = this.selectedEntry && this.selectedEntry.id === entry.id;
      const isViewed = this.viewedHistory.includes(entry.id);
      item.className = `archive-item ${isSelected ? 'selected' : ''}`;
      
      const tierClass = entry.tier === 'verified' ? 'tier-verified' : 'tier-deepice';
      const tierLabel = entry.tier === 'verified' ? 'VERIFIED' : 'DEEP ICE';

      item.innerHTML = `
        <div class="archive-item-top">
          <span class="archive-item-id">${entry.id} ${isViewed ? '✓' : ''}</span>
          <span class="archive-tier-badge ${tierClass}">${tierLabel}</span>
        </div>
        <div class="archive-item-name">${entry.name}</div>
        <div class="archive-item-sector">${entry.sector}</div>
      `;

      item.addEventListener('click', () => {
        this.selectedEntry = entry;
        this.markViewed(entry.id);
        this.renderList();
        this.renderDossier(entry);
        if (window.CipherAudio) window.CipherAudio.playCandidateTick();
      });

      this.listContainer.appendChild(item);
    });
  }

  renderDossier(entry) {
    if (!this.dossierContainer) return;

    // Convert [REF: ID] into clickable interactive badges
    const formatRefs = (text) => {
      return text.replace(/\[REF:\s*([A-Z0-9_-]+)\]/g, (match, refId) => {
        return `<span class="cross-ref-badge" data-ref="${refId}">[REF: ${refId}]</span>`;
      });
    };

    const formattedTranscript = formatRefs(entry.transcript);
    const formattedDesc = formatRefs(entry.description);

    this.dossierContainer.innerHTML = `
      <div class="dossier-hero">
        <div class="dossier-heading">
          <span class="dossier-id">${entry.id} // ${entry.sector}</span>
          <h2 class="dossier-title">${entry.name}</h2>
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            ${entry.tags.map(t => `<span class="tag-pill" style="font-size: 9px;">${t}</span>`).join('')}
          </div>
        </div>
        <div class="dossier-actions">
          <button class="dossier-load-btn" id="btn-load-sequence">
            ⚡ LOAD VECTOR SEQUENCE
          </button>
        </div>
      </div>

      <div class="dossier-grid">
        <div class="dossier-stat-box">
          <span class="stat-label">CLEARANCE LEVEL</span>
          <span class="stat-value">${entry.clearance}</span>
        </div>
        <div class="dossier-stat-box">
          <span class="stat-label">FIREWALL / ICE RATING</span>
          <span class="stat-value">${entry.iceRating}</span>
        </div>
        <div class="dossier-stat-box">
          <span class="stat-label">PAYLOAD CLASSIFICATION</span>
          <span class="stat-value">${entry.payloadType}</span>
        </div>
      </div>

      <div class="dossier-section">
        <span class="section-label">Target Assessment & Intelligence</span>
        <p class="dossier-text">${formattedDesc}</p>
      </div>

      <div class="dossier-section">
        <span class="section-label">Decrypted Memory Transcript Shard</span>
        <div class="transcript-box">${formattedTranscript}</div>
      </div>

      <div class="dossier-section">
        <span class="section-label">Cross-Referenced Network Incursions</span>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${entry.relatedRefs.map(ref => `
            <button class="cross-ref-badge" data-ref="${ref}" style="padding: 6px 12px; font-size: 11px;">
              🔗 ACCESS ${ref}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Bind cross-reference click handlers
    const refBadges = this.dossierContainer.querySelectorAll('.cross-ref-badge');
    refBadges.forEach((badge) => {
      badge.addEventListener('click', (e) => {
        const refId = e.currentTarget.getAttribute('data-ref');
        if (refId) {
          this.selectEntryById(refId);
        }
      });
    });

    // Bind "LOAD VECTOR SEQUENCE" button
    const loadBtn = this.dossierContainer.querySelector('#btn-load-sequence');
    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        if (window.CipherDialer) {
          window.CipherDialer.loadPresetAddress(entry.address, entry.name);
          this.close();
        }
      });
    }
  }
}

// Global Export
window.CipherArchiveUI = CipherArchiveUI;
