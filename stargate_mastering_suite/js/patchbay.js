/**
 * Axiom Patchbay & Routing Engine - Dynamic SVG Patch Cables, Jack Snapping, & Bus Matrix
 */

class AxiomPatchbay {
  constructor() {
    this.svgContainer = null;
    this.cables = []; // { sourceId, targetId, pathEl, glowEl, color }
    this.maxBusStages = 7;
    
    // Channel definitions
    this.channels = [
      { id: 0, glyph: '∿', name: 'SUB-BASS', freq: '32 Hz', busStage: 'PHASE-ALIGN', desc: 'Phase Vector Calibration' },
      { id: 1, glyph: '⎍', name: 'RESONANCE', freq: '65 Hz', busStage: 'SUB-CARRIER', desc: 'Sub-Harmonic Fundamental' },
      { id: 2, glyph: '⋔', name: 'LOW-MID', freq: '130 Hz', busStage: 'MODULATOR', desc: 'Formant Filter Matrix' },
      { id: 3, glyph: '◈', name: 'MID-CORE', freq: '260 Hz', busStage: 'RESONATOR', desc: 'Harmonic Core Density' },
      { id: 4, glyph: '⨁', name: 'UPPER-MID', freq: '520 Hz', busStage: 'SUM-MATRIX', desc: 'Polyphonic Summing Matrix' },
      { id: 5, glyph: '∾', name: 'PRESENCE', freq: '1.04 kHz', busStage: 'SPATIAL-BUS', desc: 'Stereo Field Dispersion' },
      { id: 6, glyph: '⨂', name: 'BRILLIANCE', freq: '2.08 kHz', busStage: 'SIDECHAIN', desc: 'Dynamic Spectral Sidechain' },
      { id: 7, glyph: '⋇', name: 'AIR-BAND', freq: '4.18 kHz', busStage: 'EXCITER', desc: 'Quantum Air Dispersion' },
      { id: 8, glyph: '⨀', name: 'HYPER-HARM', freq: '8.37 kHz', busStage: 'FLUX-GATE', desc: 'Ultra-Harmonic Aperture' },
      { id: 9, glyph: '⨝', name: 'QUANTUM-FLUX', freq: '12.5 kHz', busStage: 'MASTER-GATE', desc: 'Singularity Threshold Gate' }
    ];

    this.cableColors = [
      '#00f0ff', // Cyan
      '#ffaa00', // Amber
      '#00ff88', // Green
      '#ff5522', // Coral
      '#ffee00', // Yellow
      '#55f6ff', // Bright Cyan
      '#ff7744'  // Orange
    ];
  }

  init() {
    this.svgContainer = document.getElementById('patch-cables-svg');
    window.addEventListener('resize', () => this.updateAllCablePaths());
  }

  /**
   * Connect a channel jack to the next available Master Bus stage
   */
  addCable(channelIndex, busStageIndex) {
    if (!this.svgContainer) return;

    const sourceEl = document.querySelector(`.patch-jack[data-channel="${channelIndex}"]`);
    const targetEl = document.querySelector(`.bus-jack[data-bus="${busStageIndex}"]`);
    if (!sourceEl || !targetEl) return;

    const color = this.cableColors[busStageIndex % this.cableColors.length];

    // Create SVG Cable Path
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('class', 'patch-cable-line');
    pathEl.setAttribute('stroke', color);
    pathEl.setAttribute('stroke-width', '4');
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke-linecap', 'round');

    const glowEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glowEl.setAttribute('class', 'patch-cable-glow');
    glowEl.setAttribute('stroke', color);
    glowEl.setAttribute('stroke-width', '10');
    glowEl.setAttribute('fill', 'none');
    glowEl.setAttribute('stroke-linecap', 'round');
    glowEl.setAttribute('opacity', '0.35');

    this.svgContainer.appendChild(glowEl);
    this.svgContainer.appendChild(pathEl);

    const cableRecord = {
      channelIndex,
      busStageIndex,
      sourceEl,
      targetEl,
      pathEl,
      glowEl,
      color
    };

    this.cables.push(cableRecord);
    this.updateCableGeometry(cableRecord);

    // Add snap animation class to jacks
    sourceEl.classList.add('jack-connected');
    targetEl.classList.add('jack-connected');
  }

  /**
   * Clear all patch cables
   */
  clearAllCables() {
    if (!this.svgContainer) return;
    this.svgContainer.innerHTML = '';
    this.cables = [];

    document.querySelectorAll('.patch-jack').forEach(j => j.classList.remove('jack-connected'));
    document.querySelectorAll('.bus-jack').forEach(j => j.classList.remove('jack-connected'));
  }

  /**
   * Update geometry of a single cable based on element coordinates
   */
  updateCableGeometry(cable) {
    const rootContainer = document.querySelector('.console-workspace');
    if (!rootContainer) return;

    const rootRect = rootContainer.getBoundingClientRect();
    const sRect = cable.sourceEl.getBoundingClientRect();
    const tRect = cable.targetEl.getBoundingClientRect();

    // Coordinates relative to console workspace (unscaled container)
    // Use offset calculations or scale-aware bounding client rects
    const sx = (sRect.left + sRect.width / 2 - rootRect.left) / (window.appScale || 1);
    const sy = (sRect.top + sRect.height / 2 - rootRect.top) / (window.appScale || 1);
    const tx = (tRect.left + tRect.width / 2 - rootRect.left) / (window.appScale || 1);
    const ty = (tRect.top + tRect.height / 2 - rootRect.top) / (window.appScale || 1);

    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Natural physics sag (gravity droop)
    const sag = Math.min(180, Math.max(50, dist * 0.35));
    const cx1 = sx + dx * 0.25;
    const cy1 = sy + sag + (dy * 0.1);
    const cx2 = sx + dx * 0.75;
    const cy2 = ty + sag - (dy * 0.1);

    const d = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
    cable.pathEl.setAttribute('d', d);
    cable.glowEl.setAttribute('d', d);
  }

  updateAllCablePaths() {
    this.cables.forEach(c => this.updateCableGeometry(c));
  }
}

window.AxiomBay = new AxiomPatchbay();
