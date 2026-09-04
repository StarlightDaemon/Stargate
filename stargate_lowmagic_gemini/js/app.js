/**
 * app.js — Main Application Orchestrator & Viewport Scale Manager
 * Part of Stargate Low Magic ("RUSHLIGHT")
 *
 * Coordinates:
 * - 1920x1080 Viewport Scale Manager (pure unitless scale float)
 * - Destination Autocomplete & Typeahead Registry
 * - Staged Sequential Auto-Dialing
 * - Operator Handbook (The Herbwife's Guide)
 * - Audio unlock & mute management
 * - Full keyboard accessibility & prefers-reduced-motion
 */

class RushlightApp {
  constructor() {
    this.baseWidth = 1920;
    this.baseHeight = 1080;
    this.currentScale = 1.0;

    this.appRootEl = null;
    this.guideModalEl = null;
    this.destInputEl = null;
    this.destDropdownEl = null;
    this.destTotalCountEl = null;
    this.muteBtnEl = null;

    this.autoDialTimer = null;
    this.dropdownIndex = -1;
  }

  init() {
    this.appRootEl = document.getElementById('app-root');
    this.guideModalEl = document.getElementById('operator-guide-modal');
    this.destInputEl = document.getElementById('destination-search-input');
    this.destDropdownEl = document.getElementById('destination-autocomplete-dropdown');
    this.destTotalCountEl = document.getElementById('destination-total-count');
    this.muteBtnEl = document.getElementById('btn-toggle-sound');

    this.setupScaleManager();
    this.setupAudioUnlock();
    this.setupGuideModal();
    this.setupMuteToggle();
    this.setupAutocomplete();
    this.setupPresetButtons();
    this.setupKeyboardShortcuts();
    this.setupReducedMotion();

    // Initialize subsystems
    window.HearthDial.init();
    window.Portal.init();

    // Populate total destination count
    if (this.destTotalCountEl && window.FOLK_DESTINATIONS) {
      this.destTotalCountEl.textContent = `${window.FOLK_DESTINATIONS.length} Cot-Hearths`;
    }
  }

  setupScaleManager() {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = vw / this.baseWidth;
      const scaleY = vh / this.baseHeight;
      const scale = Math.min(scaleX, scaleY);
      this.currentScale = scale;

      document.documentElement.style.setProperty('--app-scale', scale.toFixed(5));

      if (this.appRootEl) {
        this.appRootEl.style.transform = `scale(${scale})`;
        const leftOffset = Math.max(0, (vw - this.baseWidth * scale) / 2);
        const topOffset = Math.max(0, (vh - this.baseHeight * scale) / 2);
        this.appRootEl.style.left = `${leftOffset}px`;
        this.appRootEl.style.top = `${topOffset}px`;
      }
    };

    window.addEventListener('resize', updateScale);
    updateScale();
  }

  setupAudioUnlock() {
    const unlock = () => {
      window.FolkAudio.ensureContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  setupMuteToggle() {
    if (this.muteBtnEl) {
      this.muteBtnEl.addEventListener('click', () => {
        const isMuted = window.FolkAudio.toggleMute();
        this.muteBtnEl.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
        this.muteBtnEl.classList.toggle('muted', isMuted);
        const label = document.getElementById('sound-status-label');
        if (label) {
          label.textContent = isMuted ? "Sound: Muted" : "Sound: Folk Acoustics";
        }
      });
    }
  }

  setupGuideModal() {
    const openBtn = document.getElementById('btn-help-guide');
    const closeBtn = document.getElementById('btn-close-modal');

    if (openBtn && this.guideModalEl) {
      openBtn.addEventListener('click', () => {
        this.guideModalEl.classList.add('visible');
        window.FolkAudio.playChalkScrape();
      });
    }

    if (closeBtn && this.guideModalEl) {
      closeBtn.addEventListener('click', () => {
        this.guideModalEl.classList.remove('visible');
        window.FolkAudio.playShearSnip();
      });
    }

    if (this.guideModalEl) {
      this.guideModalEl.addEventListener('click', (e) => {
        if (e.target === this.guideModalEl) {
          this.guideModalEl.classList.remove('visible');
        }
      });
    }
  }

  setupAutocomplete() {
    if (!this.destInputEl || !this.destDropdownEl) return;

    const renderMatches = (matches) => {
      this.destDropdownEl.innerHTML = '';
      this.dropdownIndex = -1;

      if (matches.length === 0) {
        this.destDropdownEl.innerHTML = `<div class="autocomplete-no-match">No hearth matching this name found in the ledger.</div>`;
        this.destDropdownEl.classList.add('open');
        return;
      }

      matches.slice(0, 10).forEach((dest, idx) => {
        const item = document.createElement('button');
        item.setAttribute('type', 'button');
        item.className = 'autocomplete-item';
        item.id = `autocomplete-item-${idx}`;
        item.setAttribute('data-id', dest.id);

        // Preview of first 3 symbols
        const symPreview = dest.symbols.slice(0, 4).map(sid => {
          const sym = window.FOLK_SYMBOLS.find(s => s.id === sid);
          return `<span class="mini-sym dye-${sym ? sym.dyes : 'iron'}">${sym ? sym.svg : ''}</span>`;
        }).join('');

        item.innerHTML = `
          <div class="dest-match-info">
            <span class="dest-match-name">${dest.name}</span>
            <span class="dest-match-region">${dest.region} · ${dest.season}</span>
          </div>
          <div class="dest-match-symbols">${symPreview}</div>
        `;

        item.addEventListener('click', () => {
          this.selectDestination(dest);
        });

        this.destDropdownEl.appendChild(item);
      });

      this.destDropdownEl.classList.add('open');
    };

    this.destInputEl.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        this.destDropdownEl.classList.remove('open');
        return;
      }

      const matches = window.FOLK_DESTINATIONS.filter(d => {
        return d.name.toLowerCase().includes(q) ||
               d.lore.toLowerCase().includes(q) ||
               d.region.toLowerCase().includes(q);
      });

      renderMatches(matches);
    });

    this.destInputEl.addEventListener('focus', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q) {
        const matches = window.FOLK_DESTINATIONS.filter(d => d.name.toLowerCase().includes(q));
        renderMatches(matches);
      } else {
        // Show top 6 seeds on blank focus
        renderMatches(window.FOLK_DESTINATIONS.slice(0, 6));
      }
    });

    // Keyboard navigation within autocomplete
    this.destInputEl.addEventListener('keydown', (e) => {
      const items = this.destDropdownEl.querySelectorAll('.autocomplete-item');
      if (!items || items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.dropdownIndex = (this.dropdownIndex + 1) % items.length;
        this.highlightDropdownItem(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.dropdownIndex = (this.dropdownIndex - 1 + items.length) % items.length;
        this.highlightDropdownItem(items);
      } else if (e.key === 'Enter') {
        if (this.dropdownIndex >= 0 && items[this.dropdownIndex]) {
          e.preventDefault();
          items[this.dropdownIndex].click();
        }
      } else if (e.key === 'Escape') {
        this.destDropdownEl.classList.remove('open');
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!this.destInputEl.contains(e.target) && !this.destDropdownEl.contains(e.target)) {
        this.destDropdownEl.classList.remove('open');
      }
    });
  }

  highlightDropdownItem(items) {
    items.forEach((item, idx) => {
      if (idx === this.dropdownIndex) {
        item.classList.add('focused');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('focused');
      }
    });
  }

  selectDestination(dest) {
    if (this.destInputEl) {
      this.destInputEl.value = dest.name;
    }
    if (this.destDropdownEl) {
      this.destDropdownEl.classList.remove('open');
    }

    // Launch staged sequential auto-dialing
    this.startSequentialAutoDial(dest.symbols);
  }

  startSequentialAutoDial(symbolSequence) {
    if (window.Portal.getState() === 'BUILDUP' || window.Portal.getState() === 'ACTIVE') {
      return;
    }

    // Clear current dial
    window.HearthDial.clearDial();

    // Cancel any ongoing auto-dialing
    if (this.autoDialTimer) {
      clearInterval(this.autoDialTimer);
      this.autoDialTimer = null;
    }

    let idx = 0;
    const intervalMs = 210; // ~210ms per symbol (satisfies Standards Sec 6: visible staged sequence)

    this.autoDialTimer = setInterval(() => {
      // Check if state got cancelled or disengaged
      if (idx >= symbolSequence.length || window.Portal.getState() === 'ACTIVE' || window.Portal.getState() === 'BUILDUP') {
        clearInterval(this.autoDialTimer);
        this.autoDialTimer = null;
        return;
      }

      const symId = symbolSequence[idx];
      window.HearthDial.dialSymbol(symId, true);
      idx++;

      if (idx >= symbolSequence.length) {
        clearInterval(this.autoDialTimer);
        this.autoDialTimer = null;
        // Ends in PENDING_KINDLE state. STRICT NO-AUTO-FIRE GUARANTEE.
      }
    }, intervalMs);
  }

  setupPresetButtons() {
    const presetBtns = document.querySelectorAll('.hearth-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const destId = btn.getAttribute('data-dest-id');
        const dest = window.FOLK_DESTINATIONS.find(d => d.id === destId);
        if (dest) {
          this.selectDestination(dest);
        }
      });
    });
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // If modal open, Escape closes modal
      if (this.guideModalEl && this.guideModalEl.classList.contains('visible')) {
        if (e.key === 'Escape') {
          this.guideModalEl.classList.remove('visible');
        }
        return;
      }

      // Ignore shortcuts if user is typing into input
      if (document.activeElement === this.destInputEl) {
        return;
      }

      if (e.key === 'k' || e.key === 'K') {
        window.Portal.attemptKindle();
      } else if (e.key === 'Escape' || e.key === 's' || e.key === 'S') {
        window.Portal.disengage("Operator key command");
      } else if (e.key === 'i' || e.key === 'I') {
        window.Portal.toggleSafetyInterlock();
      } else if (e.key === 'c' || e.key === 'C') {
        window.HearthDial.clearDial();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        if (this.guideModalEl) {
          this.guideModalEl.classList.toggle('visible');
        }
      }
    });
  }

  setupReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotion = (matches) => {
      if (matches) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    };
    handleReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', (e) => handleReducedMotion(e.matches));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.App = new RushlightApp();
  window.App.init();
});
