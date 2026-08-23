/**
 * KONSTRUKT TRANSIT BUREAU
 * Core Vector State Machine & Dialing Engine
 */

class KonstruktDialer {
  constructor(audio) {
    this.audio = audio;
    this.state = 'IDLE'; // IDLE, DIALING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE, DISENGAGING
    this.address = []; // Max 6 glyph IDs
    this.maxAddressLength = 6;
    this.interlockEngaged = false; // MUST default to RELEASED (false)
    this.autoDialTimer = null;
    this.activePresetId = null;
    this.buildupTimeout = null;
    this.breakthroughTimeout = null;
    this.listeners = [];
  }

  onStateChange(fn) {
    this.listeners.push(fn);
  }

  notify(event, data) {
    this.listeners.forEach((fn) => {
      try {
        fn(this.state, event, data);
      } catch (e) {
        console.error('Listener error:', e);
      }
    });
  }

  setState(newState, event = null, data = null) {
    const oldState = this.state;
    this.state = newState;
    this.notify(event || 'STATE_CHANGED', { oldState, newState, ...data });
  }

  // Add glyph manually or from preset
  inputGlyph(glyphId) {
    if (this.state === 'ACTIVE' || this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH' || this.state === 'DISENGAGING') {
      return false;
    }

    if (this.address.length >= this.maxAddressLength) {
      return false; // Address register full
    }

    const glyph = GLYPHS.find((g) => g.id === glyphId);
    if (!glyph) return false;

    this.address.push(glyphId);
    const index = this.address.length - 1;

    // Trigger audio
    this.audio.playDetent();
    setTimeout(() => {
      this.audio.playSqueegeePass();
    }, 40);

    if (this.address.length === this.maxAddressLength) {
      this.setState('PENDING', 'GLYPH_ADDED', { glyph, index, isPending: true });
    } else {
      this.setState('DIALING', 'GLYPH_ADDED', { glyph, index, isPending: false });
    }

    return true;
  }

  // Remove last symbol
  popGlyph() {
    if (this.state === 'ACTIVE' || this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH' || this.state === 'DISENGAGING') {
      return false;
    }
    if (this.address.length === 0) return false;

    this.stopAutoDial();
    this.address.pop();
    this.audio.playDetent();

    if (this.address.length === 0) {
      this.setState('IDLE', 'GLYPH_REMOVED', { address: [...this.address] });
    } else {
      this.setState('DIALING', 'GLYPH_REMOVED', { address: [...this.address] });
    }
    return true;
  }

  // Clear address
  clearAddress() {
    if (this.state === 'ACTIVE' || this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH') {
      return this.disengage();
    }
    this.stopAutoDial();
    this.address = [];
    this.activePresetId = null;
    this.audio.playDetent();
    this.setState('IDLE', 'ADDRESS_CLEARED');
  }

  // Execute Quick-Dial Preset sequence
  loadPreset(presetId) {
    if (this.state === 'ACTIVE' || this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH') {
      return false;
    }

    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return false;

    this.stopAutoDial();
    this.address = [];
    this.activePresetId = presetId;
    this.setState('DIALING', 'PRESET_START', { preset });

    let step = 0;
    const runStep = () => {
      if (step < preset.sequence.length) {
        const glyphId = preset.sequence[step];
        this.inputGlyph(glyphId);
        step++;
        if (step < preset.sequence.length) {
          this.autoDialTimer = setTimeout(runStep, 320); // ~320ms per symbol
        } else {
          this.autoDialTimer = null;
          // Notice: stops here in PENDING state. Never auto-fires!
        }
      }
    };

    runStep();
    return true;
  }

  stopAutoDial() {
    if (this.autoDialTimer) {
      clearTimeout(this.autoDialTimer);
      this.autoDialTimer = null;
    }
  }

  // Toggle Safety Interlock
  toggleInterlock() {
    this.interlockEngaged = !this.interlockEngaged;
    this.audio.playDetent();
    this.notify('INTERLOCK_TOGGLED', { engaged: this.interlockEngaged });
    return this.interlockEngaged;
  }

  setInterlock(engaged) {
    this.interlockEngaged = !!engaged;
    this.notify('INTERLOCK_TOGGLED', { engaged: this.interlockEngaged });
  }

  // Master Activation Control
  activate() {
    // Only pending state can be activated
    if (this.state !== 'PENDING') {
      return { success: false, reason: 'NOT_PENDING' };
    }

    // Check Safety Interlock
    if (this.interlockEngaged) {
      this.audio.playInterlockHazard();
      this.notify('INTERLOCK_BLOCKED', { message: 'VECTOR DIRECTIVE BLOCKED: INTERLOCK ENGAGED' });
      return { success: false, reason: 'INTERLOCK_ENGAGED' };
    }

    // Stage 1: BUILDUP (~1.8s)
    this.setState('BUILDUP', 'ACTIVATION_INITIATED');
    this.audio.startBuildup(1800);

    this.buildupTimeout = setTimeout(() => {
      // Stage 2: BREAKTHROUGH (~0.6s)
      this.setState('BREAKTHROUGH', 'PORTAL_BREAKTHROUGH');
      this.audio.playBreakthrough();

      this.breakthroughTimeout = setTimeout(() => {
        // Stage 3: SUSTAINED ACTIVE
        this.setState('ACTIVE', 'PORTAL_SUSTAINED');
        this.audio.startActiveDrone();
      }, 600);

    }, 1800);

    return { success: true };
  }

  // Master Disengage / Purge Control
  disengage() {
    this.stopAutoDial();
    if (this.buildupTimeout) clearTimeout(this.buildupTimeout);
    if (this.breakthroughTimeout) clearTimeout(this.breakthroughTimeout);

    this.audio.playDisengage();
    this.setState('DISENGAGING', 'DISENGAGE_START');

    setTimeout(() => {
      this.address = [];
      this.activePresetId = null;
      this.setState('IDLE', 'RESET_COMPLETE');
    }, 450);

    return true;
  }
}

if (typeof window !== 'undefined') {
  window.KonstruktDialer = KonstruktDialer;
}
