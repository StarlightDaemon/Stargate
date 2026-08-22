/**
 * VXD-9000 Zenith Optical Collimator & Star-Ball Aperture Ring Controller
 * Mount Tycho Zenith Fulldome Observatory
 */

class VXDRingController {
  constructor(options = {}) {
    this.container = document.getElementById('ephemeris-sector-dialing-array');
    this.nodesLayer = document.getElementById('sector-nodes-layer');
    this.ticksGroup = document.getElementById('azimuth-ticks-group');
    this.strutsGroup = document.getElementById('cage-struts-group');
    this.gearsGroup = document.getElementById('cage-gears-group');
    this.cageGroup = document.getElementById('motorized-cage-ring');
    this.apertureBlades = document.getElementById('aperture-blades');
    this.emitterRing = document.getElementById('emitter-ring');
    this.hudPhase = document.getElementById('hud-phase-name');
    this.hudAddress = document.getElementById('hud-address-preview');
    this.hudFluxBar = document.getElementById('hud-flux-bar');

    this.centerSvgX = 380;
    this.centerSvgY = 380;
    this.nodeRadius = 280; // Radius of 12 sector nodes circle

    this.currentCageRotation = 0;
    this.onNodeClick = options.onNodeClick || (() => {});
    
    this.nodeElements = [];
    this.initSvgDecorations();
    this.initSectorNodes();
  }

  initSvgDecorations() {
    // 1. Generate 360-degree Azimuth ticks & degree markings
    let ticksHtml = '';
    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg - 90) * Math.PI / 180;
      const isMajor = deg % 30 === 0;
      const isSemi = deg % 15 === 0 && !isMajor;
      const r1 = isMajor ? 342 : (isSemi ? 348 : 354);
      const r2 = 362;

      const x1 = this.centerSvgX + Math.cos(rad) * r1;
      const y1 = this.centerSvgY + Math.sin(rad) * r1;
      const x2 = this.centerSvgX + Math.cos(rad) * r2;
      const y2 = this.centerSvgY + Math.sin(rad) * r2;

      ticksHtml += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="azimuth-tick ${isMajor ? 'major' : ''}" />`;

      if (isMajor) {
        const textR = 330;
        const tx = this.centerSvgX + Math.cos(rad) * textR;
        const ty = this.centerSvgY + Math.sin(rad) * textR;
        ticksHtml += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="azimuth-label">${deg}°</text>`;
      }
    }
    this.ticksGroup.innerHTML = ticksHtml;

    // 2. Structural Cage Struts (12 radial support arms)
    let strutsHtml = '';
    for (let i = 0; i < 12; i++) {
      const rad = (i * 30 - 90) * Math.PI / 180;
      const x1 = this.centerSvgX + Math.cos(rad) * 235;
      const y1 = this.centerSvgY + Math.sin(rad) * 235;
      const x2 = this.centerSvgX + Math.cos(rad) * 325;
      const y2 = this.centerSvgY + Math.sin(rad) * 325;
      strutsHtml += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="cage-strut" />`;
    }
    this.strutsGroup.innerHTML = strutsHtml;

    // 3. Mechanical Stepper Gear Teeth
    let gearsHtml = '';
    for (let g = 0; g < 72; g++) {
      const rad = (g * 5) * Math.PI / 180;
      const x1 = this.centerSvgX + Math.cos(rad) * 324;
      const y1 = this.centerSvgY + Math.sin(rad) * 324;
      const x2 = this.centerSvgX + Math.cos(rad) * 328;
      const y2 = this.centerSvgY + Math.sin(rad) * 328;
      gearsHtml += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(0,240,255,0.4)" stroke-width="1.5" />`;
    }
    this.gearsGroup.innerHTML = gearsHtml;
  }

  initSectorNodes() {
    this.nodesLayer.innerHTML = '';
    this.nodeElements = [];

    VXD_SECTORS.forEach((sector, index) => {
      const angleDeg = index * 30; // 0, 30, 60, ... 330
      const angleRad = (angleDeg - 90) * Math.PI / 180;
      
      const left = this.centerSvgX + Math.cos(angleRad) * this.nodeRadius;
      const top = this.centerSvgY + Math.sin(angleRad) * this.nodeRadius;

      const nodeEl = document.createElement('button');
      nodeEl.className = 'sector-node';
      nodeEl.id = `sector-node-${sector.code.toLowerCase()}`;
      nodeEl.dataset.sectorCode = sector.code;
      nodeEl.dataset.sectorIndex = index;
      nodeEl.title = `${sector.code} // ${sector.name} (AZ: ${sector.azimuth.toFixed(1)}°)`;
      nodeEl.setAttribute('aria-label', `Select ${sector.name} sector`);

      nodeEl.style.left = `${left.toFixed(1)}px`;
      nodeEl.style.top = `${top.toFixed(1)}px`;

      nodeEl.innerHTML = `
        <svg class="node-glyph-svg" viewBox="0 0 28 28">
          ${sector.glyphSvg}
        </svg>
        <span class="node-code">${sector.code}</span>
        <span class="node-coord-mini">${sector.azimuth.toFixed(0)}°</span>
      `;

      nodeEl.addEventListener('mouseenter', () => {
        window.vxdAudio.playHover();
      });

      nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onNodeClick(sector, index);
      });

      this.nodesLayer.appendChild(nodeEl);
      this.nodeElements.push({
        sector,
        element: nodeEl,
        svgX: left,
        svgY: top,
        angleDeg
      });
    });
  }

  // Rotate motorized optical cage to bring the selected sector to top alignment latch
  rotateCageToSector(sectorIndex) {
    const targetSector = VXD_SECTORS[sectorIndex];
    const targetDeg = targetSector.azimuth;
    // Calculate shortest angular rotation to bring target to 0 deg
    this.currentCageRotation = -targetDeg;
    this.cageGroup.style.transform = `rotate(${this.currentCageRotation}deg)`;
  }

  setNodeLocked(sectorCode, isLocked) {
    const found = this.nodeElements.find(n => n.sector.code === sectorCode);
    if (found) {
      if (isLocked) {
        found.element.classList.add('locked');
      } else {
        found.element.classList.remove('locked');
      }
    }
  }

  clearAllLockedNodes() {
    this.nodeElements.forEach(n => n.element.classList.remove('locked'));
  }

  setApertureDilated(dilated) {
    if (dilated) {
      this.apertureBlades.classList.add('aperture-dilated');
    } else {
      this.apertureBlades.classList.remove('aperture-dilated');
    }
  }

  setEmitterMode(mode) {
    this.emitterRing.className = 'emitter-pulse-ring';
    if (mode === 'buildup') this.emitterRing.classList.add('buildup');
    if (mode === 'active') this.emitterRing.classList.add('active');
  }

  updateHud(phaseName, addressText, fluxPercent = 0) {
    if (this.hudPhase) this.hudPhase.textContent = phaseName;
    if (this.hudAddress) this.hudAddress.textContent = addressText;
    if (this.hudFluxBar) this.hudFluxBar.style.width = `${Math.max(0, Math.min(100, fluxPercent))}%`;
  }

  getNodePositionOnScreen(sectorCode) {
    const found = this.nodeElements.find(n => n.sector.code === sectorCode);
    if (!found) return null;
    const rect = found.element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
}

window.VXDRingController = VXDRingController;
