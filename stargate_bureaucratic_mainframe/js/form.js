/**
 * D.S.T.C.L. TERMINAL OS/88-V - FORM 44-A FILING CONTROLLER (CLUSTER 1)
 * Handles destination routes, 7-slot buffer coordinates, 36-keypad sector encoder,
 * cargo categorization, and quarantine compliance validation.
 */

class Form44AController {
  constructor() {
    this.routeSelect = document.getElementById('route-selector');
    this.cargoSelect = document.getElementById('cargo-classification');
    this.quarantineChk = document.getElementById('chk-quarantine');
    this.slotsContainer = document.getElementById('glyph-slots-container');
    this.keypadGrid = document.getElementById('sector-keypad-grid');
    this.keypadCounter = document.getElementById('keypad-selection-counter');
    this.btnClearCoords = document.getElementById('btn-clear-coords');

    this.currentSlots = [null, null, null, null, null, null, null];
    this.activeSlotIndex = 0;
    this.selectedDestination = null;

    this.init();
  }

  init() {
    this.populateRouteSelector();
    this.buildKeypadGrid();
    this.attachEventListeners();
    this.updateSlotsDisplay();
  }

  populateRouteSelector() {
    if (!this.routeSelect || !window.REGISTERED_DESTINATIONS) return;
    this.routeSelect.innerHTML = '<option value="" disabled selected>-- SELECT PRE-REGISTERED JURISDICTION --</option>';

    window.REGISTERED_DESTINATIONS.forEach(dest => {
      const opt = document.createElement('option');
      opt.value = dest.id;
      opt.textContent = `[${dest.code}] ${dest.name} (${dest.fee})`;
      this.routeSelect.appendChild(opt);
    });

    // Option for manual vector input
    const manualOpt = document.createElement('option');
    manualOpt.value = 'manual-custom';
    manualOpt.textContent = '>> [CUSTOM VECTORS] MANUAL 7-STAGE BUFFER ENTRY <<';
    this.routeSelect.appendChild(manualOpt);
  }

  buildKeypadGrid() {
    if (!this.keypadGrid || !window.SECTOR_DEFINITIONS) return;
    this.keypadGrid.innerHTML = '';

    window.SECTOR_DEFINITIONS.forEach(sec => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'keypad-btn';
      btn.id = `keypad-btn-${sec.id}`;
      btn.dataset.sectorId = sec.id;
      btn.title = `${sec.name} (${sec.glyph})`;
      btn.textContent = sec.code;

      btn.addEventListener('click', () => {
        this.handleSectorClick(sec.id);
      });

      this.keypadGrid.appendChild(btn);
    });
  }

  attachEventListeners() {
    // Route Dropdown Selection
    if (this.routeSelect) {
      this.routeSelect.addEventListener('change', (e) => {
        window.terminalAudio.playKeyClick();
        const selectedId = e.target.value;
        if (selectedId === 'manual-custom') {
          this.selectedDestination = {
            id: 'manual-custom',
            name: 'MANUAL VECTOR ROUTE',
            code: 'CUST-0x',
            coords: [...this.currentSlots],
            tariffClass: this.cargoSelect ? this.cargoSelect.value : 'CLASS_B_PASSENGER',
            fee: '7.50 CREDITS'
          };
          window.terminalLogger.logInfo('Form 44-A set to MANUAL SECTOR VECTOR ENTRY mode.');
        } else {
          const dest = window.REGISTERED_DESTINATIONS.find(d => d.id === selectedId);
          if (dest) {
            this.loadDestination(dest);
          }
        }
      });
    }

    // Cargo Select Change
    if (this.cargoSelect) {
      this.cargoSelect.addEventListener('change', (e) => {
        window.terminalAudio.playKeyClick();
        window.terminalLogger.logInfo(`Cargo manifest classified: ${e.target.value}. Mass capacitors calibrated.`);
        const massMap = {
          'CLASS_B_PASSENGER': '450.0 METRIC TONS',
          'CLASS_A_HEAVY_FREIGHT': '24,000.0 METRIC TONS',
          'CLASS_C_PRIORITY_COURIER': '12.5 METRIC TONS',
          'CLASS_D_HAZMAT': '1,200.0 METRIC TONS',
          'CLASS_E_LIVESTOCK': '850.0 METRIC TONS'
        };
        const roMass = document.getElementById('ro-mass');
        if (roMass && massMap[e.target.value]) {
          roMass.textContent = massMap[e.target.value];
        }
      });
    }

    // Quarantine Checkbox Change
    if (this.quarantineChk) {
      this.quarantineChk.addEventListener('change', (e) => {
        window.terminalAudio.playKeyClick();
        if (e.target.checked) {
          window.terminalLogger.logInfo('Bio-quarantine compliance § 88-12B certified by officer.');
        } else {
          window.terminalLogger.logWarn('WARNING: Bio-quarantine compliance uncertified. Buffer locking will be rejected.');
        }
      });
    }

    // Clear Coordinates Button
    if (this.btnClearCoords) {
      this.btnClearCoords.addEventListener('click', () => {
        window.terminalAudio.playKeyClick();
        this.clearSlots();
        window.terminalLogger.logInfo('Form 44-A buffer slots purged by operator.');
      });
    }

    // Slot Direct Selection (Clicking a slot to edit)
    if (this.slotsContainer) {
      const slotEls = this.slotsContainer.querySelectorAll('.glyph-slot');
      slotEls.forEach(slotEl => {
        slotEl.addEventListener('click', () => {
          window.terminalAudio.playKeyClick();
          const idx = parseInt(slotEl.dataset.index, 10);
          this.setActiveSlot(idx);
        });
      });
    }
  }

  loadDestination(dest) {
    this.selectedDestination = dest;
    this.currentSlots = [...dest.coords];
    this.activeSlotIndex = 0;
    this.updateSlotsDisplay();

    if (this.cargoSelect && dest.tariffClass) {
      this.cargoSelect.value = dest.tariffClass;
    }

    window.terminalLogger.logInfo(`Form 44-A: Loaded preset route for ${dest.name}. Sector vector: [${dest.coords.map(c => '0x' + c.toString(16).toUpperCase().padStart(2, '0')).join('-')}].`);

    if (window.ringVisualizer) {
      window.ringVisualizer.rotateToSector(dest.coords[0]);
    }
  }

  handleSectorClick(sectorId) {
    window.terminalAudio.playKeyClick();
    this.currentSlots[this.activeSlotIndex] = sectorId;

    // Advance to next slot if not at end
    if (this.activeSlotIndex < 6) {
      this.activeSlotIndex++;
    }

    this.updateSlotsDisplay();

    if (window.ringVisualizer) {
      window.ringVisualizer.rotateToSector(sectorId);
    }
  }

  setActiveSlot(index) {
    this.activeSlotIndex = index;
    this.updateSlotsDisplay();
  }

  clearSlots() {
    this.currentSlots = [null, null, null, null, null, null, null];
    this.activeSlotIndex = 0;
    this.selectedDestination = null;
    if (this.routeSelect) this.routeSelect.value = '';
    this.updateSlotsDisplay();

    if (window.ringVisualizer) {
      window.ringVisualizer.resetRing('STANDBY / UNCOMMITTED');
    }
  }

  updateSlotsDisplay() {
    let filledCount = 0;

    for (let i = 0; i < 7; i++) {
      const slotEl = this.slotsContainer ? this.slotsContainer.querySelector(`.glyph-slot[data-index="${i}"]`) : null;
      const valEl = document.getElementById(`slot-${i}`);
      const nameEl = document.getElementById(`slot-name-${i}`);
      const secId = this.currentSlots[i];

      if (slotEl) {
        slotEl.classList.toggle('active', i === this.activeSlotIndex);
        slotEl.classList.toggle('locked', secId !== null);
        slotEl.classList.toggle('empty', secId === null);
      }

      if (secId !== null) {
        filledCount++;
        const sec = window.SECTOR_DEFINITIONS.find(s => s.id === secId);
        if (valEl) valEl.textContent = sec ? sec.code : '0x' + secId.toString(16).toUpperCase().padStart(2, '0');
        if (nameEl) nameEl.textContent = sec ? sec.glyph : `SEC-${secId}`;
      } else {
        const defaultNames = ['ORIGIN', 'AXIS', 'NODE', 'FLUX', 'AZIMUTH', 'PARITY', 'LOCK'];
        if (valEl) valEl.textContent = '--';
        if (nameEl) nameEl.textContent = defaultNames[i];
      }
    }

    // Update Counter
    if (this.keypadCounter) {
      this.keypadCounter.textContent = `${filledCount} / 7 SLOTS LOCKED`;
    }

    // Highlight Keypad Buttons
    const allKeypadBtns = this.keypadGrid ? this.keypadGrid.querySelectorAll('.keypad-btn') : [];
    allKeypadBtns.forEach(btn => {
      const sId = parseInt(btn.dataset.sectorId, 10);
      const isSelected = this.currentSlots.includes(sId);
      btn.classList.toggle('selected', isSelected);
    });
  }

  validateForm() {
    // 1. Check all 7 slots are filled
    const missingSlotIdx = this.currentSlots.findIndex(s => s === null);
    if (missingSlotIdx !== -1) {
      return {
        valid: false,
        error: `FORM 44-A INCOMPLETE: Buffer slot S-${missingSlotIdx + 1} is empty.`
      };
    }

    // 2. Check Quarantine compliance checkbox
    if (this.quarantineChk && !this.quarantineChk.checked) {
      return {
        valid: false,
        error: `REGULATORY REJECTION: Quarantine compliance § 88-12B uncertified.`
      };
    }

    // All valid
    return {
      valid: true,
      destinationName: this.selectedDestination ? this.selectedDestination.name : 'CUSTOM TRANSIT VECTOR',
      coords: [...this.currentSlots],
      coordsString: this.currentSlots.map(s => '0x' + s.toString(16).toUpperCase().padStart(2, '0')).join(' · '),
      cargoClass: this.cargoSelect ? this.cargoSelect.value : 'CLASS_B_PASSENGER'
    };
  }
}

window.Form44AController = Form44AController;
