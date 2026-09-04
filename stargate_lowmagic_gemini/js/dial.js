/**
 * dial.js — The Hearth-Stone Spindle & "Tying the Knot" Dialing Instrument
 * Part of Stargate Low Magic ("RUSHLIGHT")
 * Features rotating spindle, cord-binding locking mechanism, and 7-slot address ledger.
 */

class HearthDialController {
  constructor() {
    this.symbols = window.FOLK_SYMBOLS || [];
    this.currentAddress = []; // Array of symbol IDs (max 7)
    this.currentRotation = 0; // Degrees
    this.isLocked = false;
    this.onAddressChanged = null;
    this.onPendingKindle = null;

    this.spindleRingEl = null;
    this.slotsContainerEl = null;
    this.activeSymbolNameEl = null;
    this.activeSymbolLoreEl = null;
    this.hearthCordSvgEl = null;
  }

  init() {
    this.spindleRingEl = document.getElementById('spindle-wheel');
    this.slotsContainerEl = document.getElementById('address-cord-slots');
    this.activeSymbolNameEl = document.getElementById('inspect-symbol-name');
    this.activeSymbolLoreEl = document.getElementById('inspect-symbol-lore');
    this.hearthCordSvgEl = document.getElementById('hearth-cord-overlay');

    this.renderWheelSymbols();
    this.renderAddressSlots();
    this.setupEventListeners();
  }

  renderWheelSymbols() {
    if (!this.spindleRingEl) return;
    this.spindleRingEl.innerHTML = '';

    const total = this.symbols.length;
    const radius = 245; // Spindle radius in 1920x1080 fixed space
    const center = 280; // 560x560 container center

    this.symbols.forEach((sym, idx) => {
      const angleDeg = (idx * 360) / total;
      const angleRad = (angleDeg - 90) * (Math.PI / 180);
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);

      const btn = document.createElement('button');
      btn.className = `spindle-glyph-btn dye-${sym.dyes}`;
      btn.id = `spindle-glyph-${sym.id}`;
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-label', `${sym.name}: ${sym.lore}`);
      btn.setAttribute('data-symbol-id', sym.id);
      btn.setAttribute('data-index', idx);
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;

      // Counter-rotate the icon so it stays upright relative to the disc
      btn.innerHTML = `<div class="glyph-inner" style="transform: rotate(${-angleDeg}deg)">${sym.svg}</div>`;

      btn.addEventListener('click', () => {
        if (!this.isLocked) {
          this.dialSymbol(sym.id);
        }
      });

      btn.addEventListener('mouseenter', () => {
        this.inspectSymbol(sym);
      });

      btn.addEventListener('focus', () => {
        this.inspectSymbol(sym);
      });

      this.spindleRingEl.appendChild(btn);
    });
  }

  renderAddressSlots() {
    if (!this.slotsContainerEl) return;
    this.slotsContainerEl.innerHTML = '';

    for (let i = 0; i < 7; i++) {
      const slot = document.createElement('div');
      slot.className = 'address-knot-slot';
      slot.id = `knot-slot-${i}`;
      slot.setAttribute('data-slot-index', i);

      const boundSymId = this.currentAddress[i];
      if (boundSymId) {
        const sym = this.symbols.find(s => s.id === boundSymId);
        slot.classList.add('bound');
        slot.innerHTML = `
          <div class="knot-pin-icon dye-${sym.dyes}">${sym.svg}</div>
          <span class="knot-pin-name">${sym.name}</span>
          <span class="knot-pin-order">Knot ${i + 1}</span>
        `;
      } else {
        slot.classList.add('empty');
        slot.innerHTML = `
          <div class="knot-pin-empty-mark">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="1.5">
              <path d="M12 4v16m-8-8h16" stroke-dasharray="2 2"/>
            </svg>
          </div>
          <span class="knot-pin-name">Open Stitch</span>
          <span class="knot-pin-order">Slot ${i + 1}</span>
        `;
      }

      this.slotsContainerEl.appendChild(slot);
    }
  }

  inspectSymbol(sym) {
    if (this.activeSymbolNameEl) {
      this.activeSymbolNameEl.textContent = sym.name;
    }
    if (this.activeSymbolLoreEl) {
      this.activeSymbolLoreEl.textContent = `“${sym.lore}”`;
    }
  }

  setupEventListeners() {
    const clearBtn = document.getElementById('btn-clear-hearth');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!this.isLocked) {
          this.clearDial();
        }
      });
    }

    const undoBtn = document.getElementById('btn-undo-cord');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (!this.isLocked) {
          this.undoSymbol();
        }
      });
    }
  }

  dialSymbol(symbolId, isAuto = false) {
    if (this.isLocked) return false;
    if (this.currentAddress.length >= 7) return false;

    const symIndex = this.symbols.findIndex(s => s.id === symbolId);
    if (symIndex === -1) return false;

    const sym = this.symbols[symIndex];
    const total = this.symbols.length;
    const stepDeg = 360 / total;

    // Rotate spindle wheel so this symbol moves to the North (0 deg / top)
    const targetSymbolDeg = symIndex * stepDeg;
    // We want the wheel rotation R such that (targetSymbolDeg + R) % 360 == 0
    // To turn smoothly without unwinding multiple turns:
    const desiredTarget = -targetSymbolDeg;
    let delta = (desiredTarget - this.currentRotation) % 360;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    this.currentRotation += delta;

    if (this.spindleRingEl) {
      this.spindleRingEl.style.transform = `rotate(${this.currentRotation}deg)`;
    }

    // Audio feedback: cord pluck + cinch
    const step = this.currentAddress.length;
    window.FolkAudio.playCordPluck(step);
    window.FolkAudio.playKnotCinch();

    // Add to address
    this.currentAddress.push(symbolId);
    this.renderAddressSlots();
    this.drawHearthCord(step, symIndex);
    this.inspectSymbol(sym);

    // Update active highlight on Spindle
    document.querySelectorAll('.spindle-glyph-btn').forEach(btn => btn.classList.remove('active-pinned'));
    const btn = document.getElementById(`spindle-glyph-${symbolId}`);
    if (btn) btn.classList.add('active-pinned');

    // Notify listeners
    if (this.onAddressChanged) {
      this.onAddressChanged([...this.currentAddress]);
    }

    // Check if 7 knots are bound
    if (this.currentAddress.length === 7) {
      // Announce live state
      const liveRegion = document.getElementById('live-portal-caption');
      if (liveRegion) {
        liveRegion.textContent = "Seven knots bound upon the hearth. Ready for the Kindler.";
      }
      if (this.onPendingKindle) {
        this.onPendingKindle([...this.currentAddress]);
      }
    }

    return true;
  }

  drawHearthCord(slotIndex, symIndex) {
    if (!this.hearthCordSvgEl) return;
    const center = 280;
    const innerRadius = 130;
    const outerRadius = 240;

    const angleDeg = (symIndex * 360) / this.symbols.length + this.currentRotation;
    const angleRad = (angleDeg - 90) * (Math.PI / 180);

    const x1 = center + innerRadius * Math.cos(angleRad);
    const y1 = center + innerRadius * Math.sin(angleRad);
    const x2 = center + outerRadius * Math.cos(angleRad);
    const y2 = center + outerRadius * Math.sin(angleRad);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', 'hearth-bound-thread');
    line.setAttribute('id', `hearth-thread-${slotIndex}`);

    const knotCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    knotCircle.setAttribute('cx', x1);
    knotCircle.setAttribute('cy', y1);
    knotCircle.setAttribute('r', '4');
    knotCircle.setAttribute('class', 'hearth-bound-knot');
    knotCircle.setAttribute('id', `hearth-knot-pin-${slotIndex}`);

    this.hearthCordSvgEl.appendChild(line);
    this.hearthCordSvgEl.appendChild(knotCircle);
  }

  clearDial() {
    if (this.isLocked) return;
    this.currentAddress = [];
    this.renderAddressSlots();
    if (this.hearthCordSvgEl) {
      this.hearthCordSvgEl.innerHTML = '';
    }
    document.querySelectorAll('.spindle-glyph-btn').forEach(btn => btn.classList.remove('active-pinned'));
    window.FolkAudio.playChalkScrape();

    const liveRegion = document.getElementById('live-portal-caption');
    if (liveRegion) {
      liveRegion.textContent = "Hearth swept clean. All cords released.";
    }

    if (this.onAddressChanged) {
      this.onAddressChanged([]);
    }
  }

  undoSymbol() {
    if (this.isLocked || this.currentAddress.length === 0) return;
    const removedIndex = this.currentAddress.length - 1;
    this.currentAddress.pop();
    this.renderAddressSlots();

    // Remove cord
    const thread = document.getElementById(`hearth-thread-${removedIndex}`);
    const knot = document.getElementById(`hearth-knot-pin-${removedIndex}`);
    if (thread) thread.remove();
    if (knot) knot.remove();

    window.FolkAudio.playShearSnip();

    if (this.onAddressChanged) {
      this.onAddressChanged([...this.currentAddress]);
    }
  }

  setLock(locked) {
    this.isLocked = locked;
    const btns = document.querySelectorAll('.spindle-glyph-btn, #btn-clear-hearth, #btn-undo-cord');
    btns.forEach(b => {
      if (locked) {
        b.setAttribute('disabled', 'true');
      } else {
        b.removeAttribute('disabled');
      }
    });
  }

  getAddress() {
    return [...this.currentAddress];
  }

  isAddressComplete() {
    return this.currentAddress.length === 7;
  }
}

window.HearthDial = new HearthDialController();
