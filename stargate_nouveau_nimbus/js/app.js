/**
 * STARGATE: LE NIMBUS FLORIÉ (Art Nouveau Botanical Portal)
 * Main Application Orchestrator & User Interaction Controller
 */

class NimbusApp {
  constructor() {
    this.audio = nimbusAudio;
    this.state = nimbusState;
    this.autoDialTimer = null;
    this.activationTimers = [];
    this.canvasAnimId = null;

    this.initElements();
    this.initScaling();
    this.renderHaloCartouches();
    this.renderLithoPlates();
    this.renderQuickDialPresets();
    this.renderSequenceRegister();
    this.bindEvents();
    this.initApertureCanvas();
    this.applySettingsToUI();
  }

  initElements() {
    this.scalerEl = document.getElementById("viewport-scaler");
    this.posterEl = document.querySelector(".nouveau-poster");
    this.haloContainer = document.getElementById("nimbus-halo-container");
    this.apertureCore = document.getElementById("aperture-core");
    this.apertureStatus = document.getElementById("aperture-status");
    this.btnActivate = document.getElementById("btn-activate");
    this.btnDisengage = document.getElementById("btn-disengage");
    this.safetyLatch = document.getElementById("safety-latch-toggle");
    this.safetyBanner = document.getElementById("safety-alert-banner");
    this.registerSlots = document.getElementById("sequence-slots");
    this.lithoPlatesGrid = document.getElementById("litho-plates-grid");
    this.presetListEl = document.getElementById("preset-list");
    this.btnClearSeq = document.getElementById("btn-clear-seq");
    this.operatorRefBtn = document.getElementById("operator-ref-btn");

    // Modals
    this.modalBackdrop = document.getElementById("nouveau-modal-backdrop");
    this.modalTitle = document.getElementById("modal-title");
    this.modalContent = document.getElementById("modal-content-scroll");
    this.modalCloseBtn = document.getElementById("modal-close-btn");
  }

  // --- 1. ROBUST VIEWPORT SCALING (NO CSS CALC SCALE PITFALL) ---
  initScaling() {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(w / 1920, h / 1080);
      document.documentElement.style.setProperty("--app-scale", scale);
    };
    window.addEventListener("resize", updateScale);
    updateScale();
  }

  // --- 2. RENDER THE 9 NIMBUS HALO CARTOUCHES ---
  renderHaloCartouches() {
    // 9 angles around the circular nimbus (radius = 240px from center 290, 290)
    const radius = 236;
    const center = 290;
    
    // Clear previous if any
    const existing = this.haloContainer.querySelectorAll(".nimbus-stone-cartouche");
    existing.forEach(el => el.remove());

    GLYPHS.forEach((glyph, i) => {
      // Start from top (-90 deg) and distribute 9 stones equally (40 deg apart)
      const angleDeg = -90 + (i * 40);
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);

      const cartouche = document.createElement("div");
      cartouche.className = "nimbus-stone-cartouche";
      cartouche.id = `cartouche-${glyph.id}`;
      cartouche.style.left = `${x}px`;
      cartouche.style.top = `${y}px`;
      cartouche.title = `${glyph.name} (${glyph.commonName}) - ${glyph.harmonicFreq} Hz`;
      cartouche.style.setProperty("--stone-pigment", glyph.pigmentHex);

      cartouche.innerHTML = `
        <svg viewBox="0 0 100 100" style="width:44px; height:44px;">
          ${glyph.iconDetails}
        </svg>
      `;

      cartouche.addEventListener("click", () => {
        this.handleGlyphSelect(glyph.id);
      });

      this.haloContainer.appendChild(cartouche);
    });
  }

  // --- 3. RENDER 9-GLYPH LITHO KEYBOARD (3x3 ARRAY) ---
  renderLithoPlates() {
    this.lithoPlatesGrid.innerHTML = "";
    GLYPHS.forEach(glyph => {
      const btn = document.createElement("button");
      btn.className = "litho-plate-btn";
      btn.id = `plate-btn-${glyph.id}`;
      btn.setAttribute("data-glyph-id", glyph.id);
      btn.innerHTML = `
        <svg viewBox="0 0 100 100" class="plate-glyph-icon">
          ${glyph.iconDetails}
        </svg>
        <span class="plate-title">${glyph.name}</span>
        <span class="plate-freq">${glyph.harmonicFreq} Hz</span>
      `;

      btn.addEventListener("click", () => {
        this.handleGlyphSelect(glyph.id);
      });

      this.lithoPlatesGrid.appendChild(btn);
    });
  }

  // --- 4. RENDER 7-GLYPH SEQUENCE REGISTER SLOTS ---
  renderSequenceRegister() {
    this.registerSlots.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const slot = document.createElement("div");
      slot.className = "register-slot";
      slot.id = `seq-slot-${i}`;
      slot.innerHTML = `<span class="slot-number">#${i + 1}</span>`;
      this.registerSlots.appendChild(slot);
    }
  }

  // --- 5. RENDER QUICK-DIAL PRESET DESTINATIONS ---
  renderQuickDialPresets() {
    this.presetListEl.innerHTML = "";
    
    // Group by tier
    const tier1 = QUICK_DIAL_PRESETS.filter(p => p.tier === 1);
    const tier2 = QUICK_DIAL_PRESETS.filter(p => p.tier === 2);

    const appendGroup = (title, items) => {
      const h = document.createElement("div");
      h.className = "tier-section-title";
      h.textContent = title;
      this.presetListEl.appendChild(h);

      items.forEach(preset => {
        const card = document.createElement("div");
        card.className = "preset-card";
        card.id = `preset-card-${preset.id}`;
        card.innerHTML = `
          <div class="preset-name">${preset.name}</div>
          <div class="preset-sub">${preset.subtitle}</div>
          <div class="preset-glyph-pills">
            ${preset.address.map(gid => {
              const g = GLYPHS.find(x => x.id === gid);
              return `<span class="glyph-mini-pill" title="${g ? g.name : gid}">${gid.charAt(0).toUpperCase()}</span>`;
            }).join("")}
          </div>
        `;

        card.addEventListener("click", () => {
          this.triggerAutoDial(preset);
        });

        this.presetListEl.appendChild(card);
      });
    };

    appendGroup("Tier I: Réseau Métropolitain", tier1);
    appendGroup("Tier II: Sanctuaires Aethériques", tier2);
  }

  // --- 6. BIND USER INTERACTION EVENTS ---
  bindEvents() {
    // Primary Action: Activate Aperture
    this.btnActivate.addEventListener("click", () => {
      this.triggerActivation();
    });

    // Primary Action: Disengage / Clear
    this.btnDisengage.addEventListener("click", () => {
      this.disengageAperture();
    });

    // Clear Sequence
    this.btnClearSeq.addEventListener("click", () => {
      this.clearCurrentSequence();
    });

    // Safety Interlock Switch
    this.safetyLatch.addEventListener("click", () => {
      this.toggleSafetyLatch();
    });

    // Operator Reference
    this.operatorRefBtn.addEventListener("click", () => {
      this.openOperatorReference();
    });

    // Navigation Ribbon Buttons
    document.querySelectorAll(".nav-ribbon-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-modal");
        this.openModal(target);
      });
    });

    // Modal Close
    this.modalCloseBtn.addEventListener("click", () => {
      this.closeModal();
    });
    this.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === this.modalBackdrop) this.closeModal();
    });

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      // If modal is open, Escape closes it
      if (e.key === "Escape") {
        if (this.modalBackdrop.classList.contains("open")) {
          this.closeModal();
          return;
        }
        this.disengageAperture();
        return;
      }

      // If user typing in input, ignore
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      // Numeric keys 1-9
      if (e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key, 10) - 1;
        if (GLYPHS[index]) {
          this.handleGlyphSelect(GLYPHS[index].id);
        }
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.triggerActivation();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        this.disengageAperture();
      } else if (e.key.toLowerCase() === "s") {
        this.toggleSafetyLatch();
      } else if (e.key === "?") {
        this.openOperatorReference();
      }
    });

    // State Subscriptions
    this.state.subscribe((event, data) => {
      this.handleStateUpdate(event, data);
    });
  }

  // --- 7. TWO-PASS LITHOGRAPHIC LOCKING MECHANISM ---
  handleGlyphSelect(glyphId) {
    if (this.state.sequence.length >= 7) return;
    if (this.state.gateState === "ACTIVE" || this.state.gateState === "BUILDUP") return;

    const glyphObj = GLYPHS.find(g => g.id === glyphId);
    if (!glyphObj) return;

    const cartouche = document.getElementById(`cartouche-${glyphId}`);
    const slotIdx = this.state.sequence.length;

    // PASS 1: Greasy Crayon Lithographique Contour Flow
    if (cartouche) {
      cartouche.classList.add("drawing-pass");
    }
    this.audio.playLithoCrayonStroke(0.25);

    // PASS 2: Registration Color Wash Settling & Press Stone Impact (~150ms later)
    setTimeout(() => {
      if (cartouche) {
        cartouche.classList.remove("drawing-pass");
        cartouche.classList.add("registered-pass");
      }
      this.audio.playGlassBeadChime(glyphObj.harmonicFreq);
      this.audio.playStoneSettle();

      // Update Slot
      const slot = document.getElementById(`seq-slot-${slotIdx}`);
      if (slot) {
        slot.classList.add("filled");
        slot.style.borderColor = glyphObj.accentHex;
        slot.innerHTML = `
          <span class="slot-number">#${slotIdx + 1}</span>
          <svg viewBox="0 0 100 100" style="width:34px; height:34px;">
            ${glyphObj.iconDetails}
          </svg>
        `;
      }

      this.state.addGlyph(glyphId);
    }, 150);
  }

  // --- 8. THREE-STAGE STAGED ACTIVATION LIFECYCLE ---
  triggerActivation() {
    // Safety Interlock Check: Unmissable feedback if engaged
    if (this.state.isSafetyEngaged) {
      this.showSafetyWarning("Sécurité Enclenchée : Déverrouillez le loquet pour engager !");
      this.audio.playSafetyClick(true);
      return;
    }

    // Sequence completeness check
    if (this.state.sequence.length < 7) {
      this.showSafetyWarning("Séquence Incomplète : 7 pierres d'alignement requises.");
      return;
    }

    if (this.state.gateState !== "PENDING") return;

    // STAGE 1: BUILDUP (2.0s duration - Tendrils Blooming & Gaslights Warming)
    this.state.setGateState("BUILDUP");
    this.apertureCore.className = "aperture-iris-core buildup";
    this.apertureStatus.textContent = "BUILDUP : OUVERTURE DU NIMBUS...";
    this.btnActivate.disabled = true;
    this.btnActivate.classList.remove("ready-pulse");
    this.audio.playBuildupSound(2.0);

    // STAGE 2: BREAKTHROUGH (~2.0s mark - Radiant Golden Flash)
    const tBreakthrough = setTimeout(() => {
      this.state.setGateState("BREAKTHROUGH");
      this.apertureCore.className = "aperture-iris-core breakthrough";
      this.apertureStatus.textContent = "BREAKTHROUGH : ÉCLOSION RADIANTE";
      this.audio.playBreakthroughChord();

      // STAGE 3: SUSTAINED ACTIVE (~2.8s mark - Flowing Aetheric Vortex)
      const tActive = setTimeout(() => {
        this.state.setGateState("ACTIVE");
        this.apertureCore.className = "aperture-iris-core active";
        this.apertureStatus.textContent = "APERTURE SOUTENUE : ACCORD ÉTABLI";
        this.btnActivate.disabled = true;
        this.btnDisengage.classList.add("pulse-warn");
      }, 800);

      this.activationTimers.push(tActive);
    }, 2000);

    this.activationTimers.push(tBreakthrough);
  }

  // --- 9. DISENGAGE / ROMPRE L'ACCORD ---
  disengageAperture() {
    // Clear any pending timers
    if (this.autoDialTimer) {
      clearInterval(this.autoDialTimer);
      this.autoDialTimer = null;
    }
    this.activationTimers.forEach(t => clearTimeout(t));
    this.activationTimers = [];

    this.audio.playDisengageSound();
    this.state.clearSequence();
    this.resetVisualsToIdle();
  }

  clearCurrentSequence() {
    if (this.autoDialTimer) {
      clearInterval(this.autoDialTimer);
      this.autoDialTimer = null;
    }
    this.state.clearSequence();
    this.resetVisualsToIdle();
  }

  resetVisualsToIdle() {
    this.apertureCore.className = "aperture-iris-core";
    this.apertureStatus.textContent = "NIMBUS AU REPOS : EN ATTENTE";
    this.btnActivate.disabled = true;
    this.btnActivate.classList.remove("ready-pulse");
    this.btnDisengage.classList.remove("pulse-warn");

    // Reset ring cartouches
    document.querySelectorAll(".nimbus-stone-cartouche").forEach(el => {
      el.className = "nimbus-stone-cartouche";
    });

    // Reset register slots
    for (let i = 0; i < 7; i++) {
      const slot = document.getElementById(`seq-slot-${i}`);
      if (slot) {
        slot.className = "register-slot";
        slot.style.borderColor = "";
        slot.innerHTML = `<span class="slot-number">#${i + 1}</span>`;
      }
    }

    // Reset preset card active highlight
    document.querySelectorAll(".preset-card").forEach(c => c.classList.remove("active-target"));
  }

  // --- 10. QUICK-DIAL AUTO-SEQUENCER (STAGED, NEVER AUTO-FIRES) ---
  triggerAutoDial(preset) {
    if (this.state.gateState === "ACTIVE" || this.state.gateState === "BUILDUP") {
      this.disengageAperture();
    } else {
      this.clearCurrentSequence();
    }

    // Highlight selected card
    document.querySelectorAll(".preset-card").forEach(c => c.classList.remove("active-target"));
    const activeCard = document.getElementById(`preset-card-${preset.id}`);
    if (activeCard) activeCard.classList.add("active-target");

    this.state.activePresetId = preset.id;
    this.state.addLog("AUTODIAL", `Auto-dial initiated for: ${preset.name}`);

    let step = 0;
    const dialStep = () => {
      if (step < preset.address.length) {
        const glyphId = preset.address[step];
        this.handleGlyphSelect(glyphId);
        step++;
        this.autoDialTimer = setTimeout(dialStep, 280);
      } else {
        this.autoDialTimer = null;
        // Lands strictly in PENDING state, ready for manual activation!
      }
    };

    dialStep();
  }

  // --- 11. BOTANICAL SAFETY INTERLOCK LATCH ---
  toggleSafetyLatch() {
    this.state.toggleSafety();
    this.audio.playSafetyClick(this.state.isSafetyEngaged);
    if (this.state.isSafetyEngaged) {
      this.safetyLatch.classList.add("engaged");
      this.showSafetyWarning("Verrou de Sécurité Botanique ENCLENCHÉ");
    } else {
      this.safetyLatch.classList.remove("engaged");
      this.hideSafetyWarning();
    }
  }

  showSafetyWarning(text) {
    this.safetyBanner.textContent = text;
    this.safetyBanner.style.display = "flex";
    setTimeout(() => {
      if (!this.state.isSafetyEngaged) this.hideSafetyWarning();
    }, 3000);
  }

  hideSafetyWarning() {
    if (!this.state.isSafetyEngaged) {
      this.safetyBanner.style.display = "none";
    }
  }

  // --- 12. STATE REACTIVITY & UI SYNC ---
  handleStateUpdate(event, data) {
    if (event === "state_change") {
      if (data.newState === "PENDING") {
        this.btnActivate.disabled = false;
        this.btnActivate.classList.add("ready-pulse");
        this.apertureStatus.textContent = "ACCORD PRÊT : ENGAGER LE NIMBUS";
      }
    } else if (event === "telemetry_update") {
      this.updateTelemetryDisplays(data);
    } else if (event === "mood_change") {
      this.posterEl.setAttribute("data-mood", data);
    }
  }

  updateTelemetryDisplays(t) {
    const elVisc = document.getElementById("telem-viscosity");
    const elHarm = document.getElementById("telem-harmonic");
    const elPress = document.getElementById("telem-pressure");
    const elFlux = document.getElementById("telem-flux");
    const elChroma = document.getElementById("telem-chroma");
    const elPollen = document.getElementById("telem-pollen");

    if (elVisc) elVisc.textContent = `${t.aethericViscosity.toFixed(2)} mPa·s`;
    if (elHarm) elHarm.textContent = `${t.harmonicResonance.toFixed(1)} Hz`;
    if (elPress) elPress.textContent = `${t.lithoPressure.toFixed(2)} bar`;
    if (elFlux) elFlux.textContent = `${t.luminanceFlux.toFixed(0)} lx`;
    if (elChroma) elChroma.textContent = `${t.chromaPurity.toFixed(1)} %`;
    if (elPollen) elPollen.textContent = `${t.pollenDriftIndex.toFixed(1)} /m³`;
  }

  applySettingsToUI() {
    this.posterEl.setAttribute("data-mood", this.state.colorMood);
  }

  // --- 13. MODALS & SECONDARY DRAWERS ---
  openModal(type) {
    this.modalBackdrop.classList.add("open");
    document.querySelectorAll(".nav-ribbon-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-modal") === type);
    });

    if (type === "archive") this.renderArchiveModal();
    else if (type === "legend") this.renderLegendModal();
    else if (type === "telemetry") this.renderTelemetryModal();
    else if (type === "settings") this.renderSettingsModal();
    else if (type === "logs") this.renderLogsModal();
  }

  closeModal() {
    this.modalBackdrop.classList.remove("open");
    document.querySelectorAll(".nav-ribbon-btn").forEach(b => b.classList.remove("active"));
  }

  openOperatorReference() {
    this.modalTitle.textContent = "Manuel de l'Opérateur du Nimbus Florié";
    this.modalContent.innerHTML = `
      <div style="font-size:16px; line-height:1.6; max-width:850px; margin:0 auto;">
        <h3 style="font-family:'Cinzel Decorative'; color:var(--teal-deep); margin-bottom:8px;">Protocole d'Alignement Lithographique</h3>
        <p>Le <strong>Nimbus Florié</strong> est une passerelle spatio-botanique de la Belle Époque régie par l'Ennéade des Phases Florales. Chaque composition requiert l'alignement rigoureux de sept pierres de registre lithographique.</p>
        
        <h4 style="color:var(--rose-deep); margin:16px 0 6px;">Instructions de Fonctionnement :</h4>
        <ol style="padding-left:24px; margin-bottom:16px;">
          <li><strong>Sélection des Pierres :</strong> Cliquez sur 7 glyphes dans le clavier lithographique ou utilisez les touches <code>1 à 9</code>. Chaque pierre dépose son contour au crayon gras puis son lavis minéral en registre parfait.</li>
          <li><strong>État en Attente :</strong> À 7 glyphes, le portail passe en mode <em>PENDING</em>. L'aperture ne s'ouvre JAMAIS automatiquement.</li>
          <li><strong>Engagement :</strong> Pressez la commande dorée <strong>« Engager le Nimbus »</strong> (ou <code>Espace/Entrée</code>) pour déclencher la séquence en trois phases (Éclosion &rarr; Percée Radiante &rarr; Soutenu).</li>
          <li><strong>Désengagement :</strong> Pressez <strong>« Rompre l'Accord »</strong> (ou <code>Échap/Retour</code>) à tout instant pour refermer le vortex et réinitialiser les pierres.</li>
          <li><strong>Loquet de Sécurité :</strong> Activé par la touche <code>S</code>. Il empêche tout engagement intempestif lorsqu'il est verrouillé.</li>
        </ol>

        <h4 style="color:var(--rose-deep); margin:16px 0 6px;">Raccourcis Clavier :</h4>
        <p><code>1–9</code> : Enregistrer Glyphe 1 à 9 &bull; <code>Espace / Entrée</code> : Engager Aperture &bull; <code>Échap / Retour</code> : Rompre l'Accord &bull; <code>S</code> : Basculer Sécurité &bull; <code>?</code> : Ouvrir ce Manuel.</p>
      </div>
    `;
    this.modalBackdrop.classList.add("open");
  }

  // --- 14. ARCHIVE / CODEX MODAL WITH CROSS-REFERENCE LINK NAVIGATION ---
  renderArchiveModal() {
    this.modalTitle.textContent = "Grand Codex des Portails Botaniques & Archives";
    this.modalContent.innerHTML = `
      <div class="archive-layout">
        <div class="archive-sidebar">
          <input type="text" id="archive-search" class="archive-search-input" placeholder="Rechercher une station, maître...">
          <div class="archive-category-tabs">
            <button class="archive-cat-btn active" data-cat="all">Toutes les Rubriques</button>
            <button class="archive-cat-btn" data-cat="stations">Stations & Pavillons</button>
            <button class="archive-cat-btn" data-cat="founders">Maîtres Artisans</button>
            <button class="archive-cat-btn" data-cat="flora">Curiosités Botaniques</button>
            <button class="archive-cat-btn" data-cat="events">Chroniques & Traités</button>
            <button class="archive-cat-btn" data-cat="patents">Brevets Lithographiques</button>
          </div>
          <div class="archive-items-list" id="archive-items-list"></div>
        </div>
        <div class="archive-article-viewer" id="archive-article-viewer"></div>
      </div>
    `;

    const listEl = document.getElementById("archive-items-list");
    const viewerEl = document.getElementById("archive-article-viewer");
    const searchInput = document.getElementById("archive-search");
    let currentCat = "all";

    const populateList = (filterText = "") => {
      listEl.innerHTML = "";
      const filtered = ARCHIVE_ENTRIES.filter(e => {
        const matchesCat = currentCat === "all" || e.category === currentCat;
        const matchesSearch = !filterText || (e.title.toLowerCase().includes(filterText.toLowerCase()) || e.summary.toLowerCase().includes(filterText.toLowerCase()));
        return matchesCat && matchesSearch;
      });

      filtered.forEach(entry => {
        const item = document.createElement("div");
        item.className = "archive-nav-item";
        item.id = `archive-item-${entry.id}`;
        item.innerHTML = `<strong>${entry.title}</strong><div style="font-size:12px; color:#6a574d;">${entry.subtitle}</div>`;
        item.addEventListener("click", () => {
          showArticle(entry.id);
        });
        listEl.appendChild(item);
      });
    };

    const showArticle = (entryId) => {
      const entry = ARCHIVE_ENTRIES.find(e => e.id === entryId);
      if (!entry) return;

      this.state.markEntryDiscovered(entryId);

      document.querySelectorAll(".archive-nav-item").forEach(i => i.classList.remove("active"));
      const navItem = document.getElementById(`archive-item-${entryId}`);
      if (navItem) navItem.classList.add("active");

      viewerEl.innerHTML = `
        <div class="article-header">
          <div class="article-title">${entry.title}</div>
          <div class="article-subtitle">${entry.subtitle}</div>
          <div class="article-meta-row">
            <span><strong>Catégorie:</strong> ${entry.categoryLabel}</span>
            <span><strong>Datation:</strong> ${entry.date}</span>
          </div>
        </div>
        <div class="article-body">
          ${entry.bodyHtml}
        </div>
        <div class="related-entries-box">
          <strong style="color:var(--teal-deep);">Folios Croisés & Références :</strong>
          <div class="related-links">
            ${entry.relatedIds.map(rid => {
              const rel = ARCHIVE_ENTRIES.find(x => x.id === rid);
              return `<span class="related-pill" data-target="${rid}">${rel ? rel.title : rid}</span>`;
            }).join("")}
          </div>
        </div>
      `;

      // Bind clickable cross-reference links inside article body and related pills
      viewerEl.querySelectorAll(".codex-link, .related-pill").forEach(link => {
        link.addEventListener("click", (ev) => {
          ev.preventDefault();
          const targetId = link.getAttribute("data-target");
          showArticle(targetId);
        });
      });
    };

    // Category Tabs
    document.querySelectorAll(".archive-cat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".archive-cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCat = btn.getAttribute("data-cat");
        populateList(searchInput.value);
      });
    });

    searchInput.addEventListener("input", (e) => {
      populateList(e.target.value);
    });

    populateList();
    showArticle("station-paris-auteuil");
  }

  // --- 15. ICONOGRAPHY LEGEND MODAL (CODEX VIEW OF GLYPH SYSTEM) ---
  renderLegendModal() {
    this.modalTitle.textContent = "Clef Iconographique de l'Ennéade Botanique";
    this.modalContent.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px;">
        ${GLYPHS.map(g => `
          <div style="background:var(--bg-parchment-dark); border:2px solid var(--vermeil-gold-dark); border-radius:6px; padding:14px; display:flex; flex-direction:column; align-items:center; text-align:center;">
            <svg viewBox="0 0 100 100" style="width:60px; height:60px; color:${g.pigmentHex};">
              ${g.iconDetails}
            </svg>
            <div style="font-family:'Cinzel Decorative'; font-size:16px; color:var(--teal-deep); margin-top:8px;">${g.name}</div>
            <div style="font-size:13px; font-style:italic; color:var(--rose-deep);">${g.commonName}</div>
            <div style="font-size:12px; margin:6px 0; color:#4a3b32;"><strong>Phase:</strong> ${g.phase} &bull; <strong>Harmonique:</strong> ${g.harmonicFreq} Hz</div>
            <div style="font-size:12px; color:#221612; line-height:1.4;">${g.meaning}</div>
            <div style="margin-top:8px; font-size:11px; padding:2px 8px; border-radius:10px; background:${g.pigmentHex}; color:#fff;">Pigment: ${g.pigment}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  // --- 16. SIMULATED TELEMETRY MODAL ---
  renderTelemetryModal() {
    this.modalTitle.textContent = "Télémétrie Aethérique & Physique Couplée";
    const t = this.state.telemetry;
    this.modalContent.innerHTML = `
      <div class="telemetry-grid">
        <div class="telemetry-card">
          <div class="telemetry-title">Viscosité Aethérique (&eta;)</div>
          <div class="telemetry-value-big" id="telem-viscosity">${t.aethericViscosity.toFixed(2)} mPa·s</div>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width:${(t.aethericViscosity / 4) * 100}%"></div></div>
          <div class="telemetry-desc">Mesure de friction du fluide supraluminique dans les canaux de Guimard.</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-title">Résonance Harmonique (Hz)</div>
          <div class="telemetry-value-big" id="telem-harmonic">${t.harmonicResonance.toFixed(1)} Hz</div>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width:${(t.harmonicResonance / 1000) * 100}%"></div></div>
          <div class="telemetry-desc">Fréquence fondamentale d'accord des pierres de registre alignées.</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-title">Pression Lithographique (bar)</div>
          <div class="telemetry-value-big" id="telem-pressure">${t.lithoPressure.toFixed(2)} bar</div>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width:${(t.lithoPressure / 10) * 100}%"></div></div>
          <div class="telemetry-desc">Pression exercée par les presses hydrauliques de Bavière sur le nimbus.</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-title">Flux de Luminance (lux)</div>
          <div class="telemetry-value-big" id="telem-flux">${t.luminanceFlux.toFixed(0)} lx</div>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width:${Math.min(100, (t.luminanceFlux / 1500) * 100)}%"></div></div>
          <div class="telemetry-desc">Émission radiative au cœur de l'iris lors de la percée et du maintien.</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-title">Pureté Chromatique (%)</div>
          <div class="telemetry-value-big" id="telem-chroma">${t.chromaPurity.toFixed(1)} %</div>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width:${t.chromaPurity}%"></div></div>
          <div class="telemetry-desc">Alignement spectral des encres minérales sans diffraction résiduelle.</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-title">Dérive du Pollen (/m³)</div>
          <div class="telemetry-value-big" id="telem-pollen">${t.pollenDriftIndex.toFixed(1)} /m³</div>
          <div class="telemetry-bar-track"><div class="telemetry-bar-fill" style="width:${(t.pollenDriftIndex / 50) * 100}%"></div></div>
          <div class="telemetry-desc">Densité de micro-spores d'Iris en suspension dans la chambre de transit.</div>
        </div>
      </div>
    `;
  }

  // --- 17. SETTINGS MODAL ---
  renderSettingsModal() {
    this.modalTitle.textContent = "Paramètres de l'Atelier & Esthétique";
    this.modalContent.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-title">Palettes Minérales de la Belle Époque</div>
        <div class="palette-options-row">
          <div class="palette-btn ${this.state.colorMood === 'nancy-teal' ? 'active' : ''}" data-mood="nancy-teal">
            <div class="palette-swatches">
              <div class="swatch" style="background:#0e2a30;"></div>
              <div class="swatch" style="background:#d4af37;"></div>
              <div class="swatch" style="background:#c47d8b;"></div>
              <div class="swatch" style="background:#f4edd8;"></div>
            </div>
            <strong>Vermeil & Nancy Teal</strong>
          </div>
          <div class="palette-btn ${this.state.colorMood === 'secession-rose' ? 'active' : ''}" data-mood="secession-rose">
            <div class="palette-swatches">
              <div class="swatch" style="background:#1c1518;"></div>
              <div class="swatch" style="background:#c9933b;"></div>
              <div class="swatch" style="background:#d47087;"></div>
              <div class="swatch" style="background:#f7efe6;"></div>
            </div>
            <strong>Sécession & Rose Poudré</strong>
          </div>
          <div class="palette-btn ${this.state.colorMood === 'absinthe' ? 'active' : ''}" data-mood="absinthe">
            <div class="palette-swatches">
              <div class="swatch" style="background:#0f241d;"></div>
              <div class="swatch" style="background:#c29f2b;"></div>
              <div class="swatch" style="background:#8ba832;"></div>
              <div class="swatch" style="background:#f0ede1;"></div>
            </div>
            <strong>Vert-de-Gris & Absinthe</strong>
          </div>
          <div class="palette-btn ${this.state.colorMood === 'sevres-azure' ? 'active' : ''}" data-mood="sevres-azure">
            <div class="palette-swatches">
              <div class="swatch" style="background:#0c1c2b;"></div>
              <div class="swatch" style="background:#deb033;"></div>
              <div class="swatch" style="background:#75a4cc;"></div>
              <div class="swatch" style="background:#eff3f7;"></div>
            </div>
            <strong>Bleu de Sèvres & Nacre</strong>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Harmonie Audio Web Synthétisée</div>
        <div class="audio-sliders-grid">
          <div class="slider-group">
            <label>Volume Général de l'Atelier</label>
            <input type="range" id="vol-master" min="0" max="1" step="0.05" value="${this.audio.volumes.master}">
          </div>
          <div class="slider-group">
            <label>Frottement du Crayon Gras Litho</label>
            <input type="range" id="vol-crayon" min="0" max="1" step="0.05" value="${this.audio.volumes.crayon}">
          </div>
          <div class="slider-group">
            <label>Carillons de Cristal & Perles de Verre</label>
            <input type="range" id="vol-glass" min="0" max="1" step="0.05" value="${this.audio.volumes.glass}">
          </div>
          <div class="slider-group">
            <label>Impact de la Presse Lithographique</label>
            <input type="range" id="vol-stone" min="0" max="1" step="0.05" value="${this.audio.volumes.stone}">
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Journal de l'Opérateur (Persistance Locale)</div>
        <textarea id="operator-notes-input" style="width:100%; height:80px; font-family:'Cormorant Garamond'; font-size:15px; padding:8px; border:1.5px solid var(--vermeil-gold-dark); border-radius:4px; background:var(--bg-parchment);">${this.state.sessionData.operatorNotes || ''}</textarea>
      </div>
    `;

    // Palette change handlers
    document.querySelectorAll(".palette-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".palette-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const mood = btn.getAttribute("data-mood");
        this.state.setColorMood(mood);
      });
    });

    // Volume handlers
    const bindVol = (id, channel) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          this.audio.setVolume(channel, parseFloat(e.target.value));
        });
      }
    };
    bindVol("vol-master", "master");
    bindVol("vol-crayon", "crayon");
    bindVol("vol-glass", "glass");
    bindVol("vol-stone", "stone");

    // Notes handler
    const notesEl = document.getElementById("operator-notes-input");
    if (notesEl) {
      notesEl.addEventListener("change", (e) => {
        this.state.saveOperatorNotes(e.target.value);
      });
    }
  }

  // --- 18. SESSION LOGS MODAL ---
  renderLogsModal() {
    this.modalTitle.textContent = "Registre des Événements & Séquences de Transit";
    this.modalContent.innerHTML = `
      <table class="logs-table">
        <thead>
          <tr>
            <th>Horodatage</th>
            <th>Type</th>
            <th>Détail de l'Action</th>
            <th>État Passerelle</th>
          </tr>
        </thead>
        <tbody>
          ${this.state.sessionData.sessionLogs.map(l => `
            <tr>
              <td>${l.timestamp}</td>
              <td><span class="log-type-tag">${l.type}</span></td>
              <td>${l.message}</td>
              <td><code>${l.gateState}</code></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // --- 19. APERTURE CANVAS LIQUID RIPPLES ANIMATION ---
  initApertureCanvas() {
    const canvas = document.getElementById("portal-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let angle = 0;

    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        r: Math.random() * 120 + 10,
        theta: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.005,
        size: Math.random() * 2.5 + 1
      });
    }

    const render = () => {
      if (this.state.gateState === "ACTIVE" || this.state.gateState === "BREAKTHROUGH") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Draw swirling whiplash rings
        ctx.save();
        ctx.translate(cx, cy);
        angle += 0.015;

        for (let r = 20; r < 130; r += 24) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(212, 175, 55, ${0.15 + (r / 200)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw orbital pollen particles
        particles.forEach(p => {
          p.theta += p.speed;
          const px = Math.cos(p.theta) * p.r;
          const py = Math.sin(p.theta) * p.r;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "#fae498";
          ctx.shadowColor = "#ffd966";
          ctx.shadowBlur = 4;
          ctx.fill();
        });

        ctx.restore();
      }
      this.canvasAnimId = requestAnimationFrame(render);
    };

    render();
  }
}

// Instantiate on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new NimbusApp();
});
