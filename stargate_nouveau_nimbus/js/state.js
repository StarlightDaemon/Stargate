/**
 * STARGATE: LE NIMBUS FLORIÉ
 * State Management, Coupled Telemetry Physics, and LocalStorage Session Persistence
 */

const STORAGE_KEY = "nouveau_nimbus_session_v1";

class NimbusStateManager {
  constructor() {
    this.gateState = "IDLE"; // IDLE, DIALING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE, DISENGAGING
    this.sequence = []; // Array of up to 7 locked glyph IDs
    this.isSafetyEngaged = false; // MUST default to false (RELEASED)
    this.activePresetId = null;
    this.activeModal = null;
    this.colorMood = "nancy-teal"; // nancy-teal, secession-rose, absinthe, sevres-azure
    this.motionIntensity = 1.0;
    this.gaslightFlicker = true;

    // Telemetry model with coupled relationships
    this.telemetry = {
      aethericViscosity: 1.24, // mPa·s
      harmonicResonance: 432.0, // Hz
      lithoPressure: 3.4, // bar
      luminanceFlux: 45.0, // lux
      chromaPurity: 62.5, // %
      pollenDriftIndex: 14.2 // grains/m³
    };

    // Persistent user session data
    this.sessionData = {
      dialHistory: [],
      discoveredEntries: ["station-paris-auteuil", "figure-guimard-aether"],
      bookmarkedEntries: ["station-paris-auteuil"],
      sessionLogs: [],
      operatorNotes: "Station calibrated. Harmonic conduits clear."
    };

    this.listeners = new Set();
    this.loadPersistence();
    this.startTelemetryLoop();
  }

  // --- PERSISTENCE: LOCALSTORAGE ---
  loadPersistence() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sessionData) {
          this.sessionData = { ...this.sessionData, ...parsed.sessionData };
        }
        if (parsed.colorMood) this.colorMood = parsed.colorMood;
        if (parsed.motionIntensity !== undefined) this.motionIntensity = parsed.motionIntensity;
        if (parsed.gaslightFlicker !== undefined) this.gaslightFlicker = parsed.gaslightFlicker;
        this.addLog("RELOAD", "Session restored from Belle Époque local register.");
      } else {
        this.addLog("INIT", "Initial session initiated. Ennead gateway at idle equilibrium.");
      }
    } catch (e) {
      console.warn("Storage load exception:", e);
    }
  }

  savePersistence() {
    try {
      const payload = {
        sessionData: this.sessionData,
        colorMood: this.colorMood,
        motionIntensity: this.motionIntensity,
        gaslightFlicker: this.gaslightFlicker,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Storage save exception:", e);
    }
  }

  // --- EVENT LOGGING ---
  addLog(type, message) {
    const timestamp = new Date().toLocaleTimeString("fr-FR", { hour12: false });
    const logItem = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp,
      type,
      message,
      gateState: this.gateState
    };
    this.sessionData.sessionLogs.unshift(logItem);
    if (this.sessionData.sessionLogs.length > 80) {
      this.sessionData.sessionLogs.pop();
    }
    this.savePersistence();
    this.notify("log", logItem);
  }

  // --- DISCOVERED & BOOKMARKED ENTRIES ---
  markEntryDiscovered(entryId) {
    if (!this.sessionData.discoveredEntries.includes(entryId)) {
      this.sessionData.discoveredEntries.push(entryId);
      this.addLog("CODEX", `Archival folio discovered: [${entryId}]`);
      this.savePersistence();
      this.notify("codex_update");
    }
  }

  toggleBookmark(entryId) {
    const idx = this.sessionData.bookmarkedEntries.indexOf(entryId);
    if (idx > -1) {
      this.sessionData.bookmarkedEntries.splice(idx, 1);
      this.addLog("BOOKMARK", `Removed bookmark: [${entryId}]`);
    } else {
      this.sessionData.bookmarkedEntries.push(entryId);
      this.addLog("BOOKMARK", `Bookmarked archive folio: [${entryId}]`);
    }
    this.savePersistence();
    this.notify("codex_update");
  }

  saveOperatorNotes(text) {
    this.sessionData.operatorNotes = text;
    this.savePersistence();
    this.notify("notes_update");
  }

  // --- STATE MUTATORS ---
  setGateState(newState) {
    const oldState = this.gateState;
    this.gateState = newState;
    this.addLog("STATE", `Gate transition: ${oldState} &rarr; ${newState}`);
    this.updateCoupledTelemetry();
    this.notify("state_change", { oldState, newState });
  }

  toggleSafety() {
    this.isSafetyEngaged = !this.isSafetyEngaged;
    this.addLog("SAFETY", `Botanical safety latch ${this.isSafetyEngaged ? "ENGAGED (LOCKED)" : "RELEASED (OPEN)"}`);
    this.notify("safety_change", this.isSafetyEngaged);
  }

  addGlyph(glyphId) {
    if (this.sequence.length >= 7) return false;
    this.sequence.push(glyphId);

    if (this.sequence.length === 7) {
      this.setGateState("PENDING");
      this.addLog("SEQUENCE", "All 7 registration stones aligned. Gate PENDING operator activation.");
    } else {
      this.setGateState("DIALING");
      this.addLog("GLYPH", `Stone pass #${this.sequence.length} registered: ${glyphId}`);
    }
    this.updateCoupledTelemetry();
    this.notify("sequence_change", this.sequence);
    return true;
  }

  clearSequence() {
    this.sequence = [];
    this.activePresetId = null;
    this.setGateState("IDLE");
    this.addLog("DISENGAGE", "Lithographic sequence cleared. Nimbus returned to rest.");
    this.updateCoupledTelemetry();
    this.notify("sequence_change", this.sequence);
  }

  setColorMood(moodId) {
    this.colorMood = moodId;
    this.savePersistence();
    this.addLog("PALETTE", `Mineral color mood shifted to: ${moodId}`);
    this.notify("mood_change", moodId);
  }

  setMotionIntensity(val) {
    this.motionIntensity = parseFloat(val);
    this.savePersistence();
    this.notify("motion_change", this.motionIntensity);
  }

  setGaslightFlicker(val) {
    this.gaslightFlicker = Boolean(val);
    this.savePersistence();
    this.notify("gaslight_change", this.gaslightFlicker);
  }

  // --- COUPLED TELEMETRY PHYSICS ENGINE ---
  updateCoupledTelemetry() {
    const count = this.sequence.length;

    // 1. Aetheric Viscosity scales with locked stones and gate state
    let targetViscosity = 1.24 + (count * 0.18);
    if (this.gateState === "BUILDUP") targetViscosity = 2.45;
    if (this.gateState === "BREAKTHROUGH") targetViscosity = 3.60;
    if (this.gateState === "ACTIVE") targetViscosity = 2.85;
    if (this.gateState === "IDLE") targetViscosity = 1.24;
    this.telemetry.aethericViscosity = targetViscosity;

    // 2. Litho-Pressure responds directly to Viscosity (coupled transfer function)
    // Formula: P = 2.8 + (Viscosity * 1.45) + (Active ? 2.2 : 0)
    const activeBoost = this.gateState === "ACTIVE" ? 1.8 : (this.gateState === "BUILDUP" ? 1.2 : 0);
    this.telemetry.lithoPressure = parseFloat((2.8 + (this.telemetry.aethericViscosity * 1.35) + activeBoost).toFixed(2));

    // 3. Harmonic Resonance computed from sequence glyph frequencies
    if (count > 0) {
      let totalFreq = 0;
      this.sequence.forEach(id => {
        const glyphObj = GLYPHS.find(g => g.id === id);
        if (glyphObj) totalFreq += glyphObj.harmonicFreq;
      });
      const avgFreq = totalFreq / count;
      if (this.gateState === "ACTIVE") {
        this.telemetry.harmonicResonance = parseFloat(avgFreq.toFixed(1));
      } else {
        this.telemetry.harmonicResonance = parseFloat((avgFreq + (Math.random() * 0.6 - 0.3)).toFixed(1));
      }
    } else {
      this.telemetry.harmonicResonance = 432.0;
    }

    // 4. Luminance Flux responds to gate state and pressure
    if (this.gateState === "IDLE") this.telemetry.luminanceFlux = 45.0;
    else if (this.gateState === "DIALING") this.telemetry.luminanceFlux = 45.0 + count * 15;
    else if (this.gateState === "PENDING") this.telemetry.luminanceFlux = 165.0;
    else if (this.gateState === "BUILDUP") this.telemetry.luminanceFlux = 380.0;
    else if (this.gateState === "BREAKTHROUGH") this.telemetry.luminanceFlux = 1420.0;
    else if (this.gateState === "ACTIVE") this.telemetry.luminanceFlux = 720.0;

    // 5. Chroma Purity
    this.telemetry.chromaPurity = parseFloat((62.5 + (count / 7) * 37.0).toFixed(1));

    // 6. Pollen Drift Index responds to Luminance and Gate State
    this.telemetry.pollenDriftIndex = parseFloat((12.0 + (this.telemetry.luminanceFlux * 0.04)).toFixed(1));

    this.notify("telemetry_update", this.telemetry);
  }

  startTelemetryLoop() {
    setInterval(() => {
      // Subtle organic breathing drift in idle/active
      if (this.gateState === "IDLE") {
        this.telemetry.harmonicResonance = parseFloat((432.0 + (Math.sin(Date.now() / 3000) * 0.4)).toFixed(1));
        this.telemetry.pollenDriftIndex = parseFloat((14.0 + (Math.cos(Date.now() / 2400) * 1.5)).toFixed(1));
        this.notify("telemetry_update", this.telemetry);
      } else if (this.gateState === "ACTIVE") {
        this.telemetry.lithoPressure = parseFloat((6.2 + (Math.sin(Date.now() / 1500) * 0.15)).toFixed(2));
        this.telemetry.luminanceFlux = parseFloat((720.0 + (Math.sin(Date.now() / 1000) * 35)).toFixed(1));
        this.notify("telemetry_update", this.telemetry);
      }
    }, 1000);
  }

  // --- OBSERVER SUBSCRIPTION ---
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(event, data) {
    this.listeners.forEach(fn => {
      try {
        fn(event, data);
      } catch (e) {
        console.error("Listener error:", e);
      }
    });
  }
}

const nimbusState = new NimbusStateManager();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NimbusStateManager, nimbusState };
}
