/**
 * D.S.T.C.L. TERMINAL OS/88-V - CONDUIT RING VISUALIZER & RESOLVER
 * A fully functioning display element where the circular form is the physical
 * mechanism: 36 radial commutator sectors, harmonic oscilloscope carrier track,
 * 7 solenoid clamp chevrons, mechanical iris aperture blades, and event horizon vortex.
 */

class ConduitRingVisualizer {
  constructor() {
    this.canvas = document.getElementById('ring-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.svg = document.getElementById('ring-svg');
    this.sectorsGroup = document.getElementById('svg-commutator-sectors');
    this.chevronsGroup = document.getElementById('svg-chevrons-group');
    this.irisGroup = document.getElementById('svg-iris-blades');
    
    // HUD & Readout Elements
    this.hudBadge = document.getElementById('hud-badge');
    this.hudDestTitle = document.getElementById('hud-dest-title');
    this.hudCoordsString = document.getElementById('hud-coords-string');
    this.hudTimer = document.getElementById('hud-timer');
    this.ringCommState = document.getElementById('ring-commutator-state');
    this.ringResonance = document.getElementById('ring-resonance-val');
    this.ringApertureFlux = document.getElementById('ring-aperture-flux');
    this.roPolarity = document.getElementById('ro-polarity');
    this.roMass = document.getElementById('ro-mass');
    this.roDrift = document.getElementById('ro-drift');

    // Ring State
    this.state = 'IDLE'; // 'IDLE', 'DIALING', 'LOCKED', 'OPEN', 'ABORTING'
    this.currentRotation = 0;
    this.targetRotation = 0;
    this.lockedSlots = []; // Array of locked sector IDs [1..36]
    this.lockedChevrons = 0;
    this.resonanceFreq = 0.0;
    this.apertureFlux = 0.0;
    this.timeRemaining = 0;
    this.timerInterval = null;

    // Animation & Waveform Particles
    this.particles = [];
    this.animFrame = null;
    this.lastTime = performance.now();
    this.oscPhase = 0;
    this.vortexRotation = 0;

    this.center = { x: 310, y: 310 };
    this.outerRadius = 280;
    this.midRadius = 240;
    this.innerRadius = 170;
    this.apertureRadius = 110;

    this.initSVG();
    this.initParticles();
    this.startAnimationLoop();
  }

  initSVG() {
    if (!this.svg) return;

    // 1. Build 36 Radial Sector Segments
    if (this.sectorsGroup) {
      this.sectorsGroup.innerHTML = '';
      const numSectors = 36;
      const angleStep = (2 * Math.PI) / numSectors;

      for (let i = 0; i < numSectors; i++) {
        const startAngle = i * angleStep - Math.PI / 2;
        const endAngle = (i + 1) * angleStep - Math.PI / 2;
        const midAngle = startAngle + angleStep / 2;

        const p1x = this.center.x + this.outerRadius * Math.cos(startAngle);
        const p1y = this.center.y + this.outerRadius * Math.sin(startAngle);
        const p2x = this.center.x + this.outerRadius * Math.cos(endAngle);
        const p2y = this.center.y + this.outerRadius * Math.sin(endAngle);
        const p3x = this.center.x + this.midRadius * Math.cos(endAngle);
        const p3y = this.center.y + this.midRadius * Math.sin(endAngle);
        const p4x = this.center.x + this.midRadius * Math.cos(startAngle);
        const p4y = this.center.y + this.midRadius * Math.sin(startAngle);

        const pathD = `M ${p1x} ${p1y} A ${this.outerRadius} ${this.outerRadius} 0 0 1 ${p2x} ${p2y} L ${p3x} ${p3y} A ${this.midRadius} ${this.midRadius} 0 0 0 ${p4x} ${p4y} Z`;

        const sectorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        sectorPath.setAttribute('d', pathD);
        sectorPath.setAttribute('class', 'sector-segment');
        sectorPath.setAttribute('id', `svg-sector-${i + 1}`);
        sectorPath.dataset.sectorId = i + 1;

        // Sector Label
        const labelRadius = (this.outerRadius + this.midRadius) / 2;
        const lx = this.center.x + labelRadius * Math.cos(midAngle);
        const ly = this.center.y + labelRadius * Math.sin(midAngle);

        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', lx);
        labelText.setAttribute('y', ly);
        labelText.setAttribute('class', 'sector-label');
        labelText.setAttribute('id', `svg-label-${i + 1}`);
        const hex = (i + 1).toString(16).toUpperCase().padStart(2, '0');
        labelText.textContent = `0x${hex}`;

        // Click to select sector directly
        sectorPath.addEventListener('click', () => {
          if (window.formController) {
            window.formController.handleSectorClick(i + 1);
          }
        });

        this.sectorsGroup.appendChild(sectorPath);
        this.sectorsGroup.appendChild(labelText);
      }
    }

    // 2. Build 7 Solenoid Clamp Chevrons around perimeter
    if (this.chevronsGroup) {
      this.chevronsGroup.innerHTML = '';
      const chevronAngles = [
        -Math.PI / 2,                  // Top Lock (0 deg)
        -Math.PI / 2 + (2 * Math.PI * 1 / 7), // 51.4 deg
        -Math.PI / 2 + (2 * Math.PI * 2 / 7), // 102.8 deg
        -Math.PI / 2 + (2 * Math.PI * 3 / 7), // 154.2 deg
        -Math.PI / 2 + (2 * Math.PI * 4 / 7), // 205.7 deg
        -Math.PI / 2 + (2 * Math.PI * 5 / 7), // 257.1 deg
        -Math.PI / 2 + (2 * Math.PI * 6 / 7)  // 308.5 deg
      ];

      chevronAngles.forEach((ang, idx) => {
        const deg = (ang * 180 / Math.PI) + 90;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'chevron-group');
        g.setAttribute('id', `svg-chevron-${idx}`);
        g.setAttribute('transform', `rotate(${deg} 310 310)`);

        // Heavy clamp wedge
        const wedge = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        wedge.setAttribute('points', '294,16 326,16 332,48 310,64 288,48');
        wedge.setAttribute('class', 'chevron-clamp');

        // Solenoid indicator lamp
        const lamp = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        lamp.setAttribute('cx', '310');
        lamp.setAttribute('cy', '32');
        lamp.setAttribute('r', '5');
        lamp.setAttribute('class', 'chevron-lamp');

        g.appendChild(wedge);
        g.appendChild(lamp);
        this.chevronsGroup.appendChild(g);
      });
    }

    // 3. Build 8 Mechanical Iris Aperture Blades
    if (this.irisGroup) {
      this.irisGroup.innerHTML = '';
      const numBlades = 8;
      for (let i = 0; i < numBlades; i++) {
        const angle = (i * 360) / numBlades;
        const blade = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        blade.setAttribute('d', 'M 310 200 A 110 110 0 0 1 420 310 L 310 310 Z');
        blade.setAttribute('class', 'iris-blade');
        blade.setAttribute('id', `iris-blade-${i}`);
        blade.setAttribute('transform', `rotate(${angle} 310 310) scale(1)`);
        this.irisGroup.appendChild(blade);
      }
    }
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        radius: Math.random() * this.apertureRadius,
        angle: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.04,
        radialSpeed: (Math.random() - 0.5) * 0.8,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.8,
        hueOffset: Math.random() * 20 - 10
      });
    }
  }

  // Set ring rotation to point to a specific sector ID (1..36)
  rotateToSector(sectorId) {
    const anglePerSector = 360 / 36;
    // Calculate target angle
    this.targetRotation = (sectorId - 1) * anglePerSector;
  }

  // Lock a chevron clamp into place
  lockChevron(index, sectorId) {
    if (index >= 7) return;
    this.lockedChevrons = index + 1;
    this.lockedSlots[index] = sectorId;

    // Highlight SVG Sector
    const sectorEl = document.getElementById(`svg-sector-${sectorId}`);
    const labelEl = document.getElementById(`svg-label-${sectorId}`);
    if (sectorEl) sectorEl.classList.add('locked');
    if (labelEl) labelEl.classList.add('locked');

    // Clamp Chevron
    const chevEl = document.getElementById(`svg-chevron-${index}`);
    if (chevEl) {
      chevEl.classList.add('locked');
    }

    // Telemetry updates
    this.resonanceFreq = parseFloat((14.285 * (index + 1) / 7).toFixed(3));
    this.apertureFlux = parseFloat((99.4 * (index + 1) / 7).toFixed(1));
    this.updateTelemetry();
  }

  // Open Sub-Aetheric Event Aperture
  openAperture(destName, coordsStr, durationSec = 45) {
    this.state = 'OPEN';
    this.timeRemaining = durationSec;

    // Retract Iris Blades
    const blades = this.irisGroup ? this.irisGroup.querySelectorAll('.iris-blade') : [];
    blades.forEach((b, i) => {
      const angle = (i * 360) / 8;
      b.style.transform = `rotate(${angle}deg) scale(0.05)`;
      b.style.opacity = '0.1';
    });

    // Mark chevrons engaged
    const chevs = this.chevronsGroup ? this.chevronsGroup.querySelectorAll('.chevron-group') : [];
    chevs.forEach(c => c.classList.add('engaged'));

    // HUD Display
    if (this.hudBadge) {
      this.hudBadge.textContent = 'CONDUIT ACTIVE';
      this.hudBadge.classList.add('active');
    }
    if (this.hudDestTitle) {
      this.hudDestTitle.textContent = destName || 'SUB-AETHERIC TUNNEL OPEN';
    }
    if (this.hudCoordsString) {
      this.hudCoordsString.textContent = coordsStr;
    }
    if (this.ringCommState) {
      this.ringCommState.textContent = '7/7 BUFFER LOCKED';
    }
    if (this.ringResonance) {
      this.ringResonance.textContent = '14.285 GHz [NOMINAL]';
    }
    if (this.ringApertureFlux) {
      this.ringApertureFlux.textContent = '99.4 % [STABLE]';
    }
    if (this.roPolarity) {
      this.roPolarity.textContent = 'TRANSIT STABLE';
    }

    // Countdown Timer
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.hudTimer) {
        this.hudTimer.textContent = `WINDOW: ${this.timeRemaining}s REMAINING`;
        this.hudTimer.classList.add('counting');
      }
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.resetRing('CONDUIT WINDOW EXPIRED // BUFFER PURGED');
      }
    }, 1000);
  }

  // Reset / Disengage Ring
  resetRing(reasonMessage = 'STANDBY / UNCOMMITTED') {
    this.state = 'IDLE';
    this.lockedSlots = [];
    this.lockedChevrons = 0;
    this.resonanceFreq = 0.0;
    this.apertureFlux = 0.0;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Close Iris Blades
    const blades = this.irisGroup ? this.irisGroup.querySelectorAll('.iris-blade') : [];
    blades.forEach((b, i) => {
      const angle = (i * 360) / 8;
      b.style.transform = `rotate(${angle}deg) scale(1)`;
      b.style.opacity = '1';
    });

    // Reset Chevrons
    const chevs = this.chevronsGroup ? this.chevronsGroup.querySelectorAll('.chevron-group') : [];
    chevs.forEach(c => {
      c.classList.remove('locked');
      c.classList.remove('engaged');
    });

    // Reset Sectors
    const sectors = this.sectorsGroup ? this.sectorsGroup.querySelectorAll('.sector-segment') : [];
    sectors.forEach(s => s.classList.remove('locked'));
    const labels = this.sectorsGroup ? this.sectorsGroup.querySelectorAll('.sector-label') : [];
    labels.forEach(l => l.classList.remove('locked'));

    // Reset HUD
    if (this.hudBadge) {
      this.hudBadge.textContent = 'STANDBY';
      this.hudBadge.classList.remove('active');
    }
    if (this.hudDestTitle) {
      this.hudDestTitle.textContent = 'NO TARGET CONDUIT';
    }
    if (this.hudCoordsString) {
      this.hudCoordsString.textContent = '-- · -- · -- · -- · -- · -- · --';
    }
    if (this.hudTimer) {
      this.hudTimer.textContent = 'BUFFER: READY';
      this.hudTimer.classList.remove('counting');
    }

    this.updateTelemetry(reasonMessage);
  }

  updateTelemetry(statusStr) {
    if (this.ringResonance) {
      this.ringResonance.textContent = `${this.resonanceFreq.toFixed(3)} GHz`;
    }
    if (this.ringApertureFlux) {
      this.ringApertureFlux.textContent = `${this.apertureFlux.toFixed(1)} %`;
    }
    if (this.ringCommState && statusStr) {
      this.ringCommState.textContent = statusStr;
    }
  }

  // Animation Loop: Renders dynamic Canvas Oscilloscope & Swirling Vortex
  startAnimationLoop() {
    const render = (time) => {
      const dt = (time - this.lastTime) / 1000;
      this.lastTime = time;

      this.oscPhase += dt * (this.state === 'OPEN' ? 8 : 2.5);
      this.vortexRotation += dt * (this.state === 'OPEN' ? 1.5 : 0.2);

      // Smooth commutator rotation easing
      this.currentRotation += (this.targetRotation - this.currentRotation) * 0.08;
      if (this.sectorsGroup) {
        this.sectorsGroup.setAttribute('transform', `rotate(${this.currentRotation} 310 310)`);
      }

      this.drawCanvas(dt);
      this.animFrame = requestAnimationFrame(render);
    };

    this.animFrame = requestAnimationFrame(render);
  }

  drawCanvas(dt) {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    this.ctx.clearRect(0, 0, w, h);

    const isAmber = document.body.classList.contains('crt-amber');
    const primaryColor = isAmber ? '#ffaa00' : '#33ff77';
    const brightColor = isAmber ? '#fff4cc' : '#d9ffe3';
    const dimColor = isAmber ? 'rgba(255, 170, 0, 0.2)' : 'rgba(51, 255, 119, 0.2)';

    // 1. Draw Oscilloscope Harmonic Carrier Wave around mid-radius track
    this.ctx.save();
    this.ctx.beginPath();
    const waveRadius = (this.innerRadius + this.midRadius) / 2;
    const steps = 180;
    const waveAmplitude = this.state === 'OPEN' ? 8 : (this.lockedChevrons > 0 ? 4 : 2);
    const harmonics = this.state === 'OPEN' ? 12 : 6;

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const wave = Math.sin(theta * harmonics + this.oscPhase) * waveAmplitude;
      const r = waveRadius + wave;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.strokeStyle = this.state === 'OPEN' ? brightColor : primaryColor;
    this.ctx.lineWidth = this.state === 'OPEN' ? 2 : 1.2;
    this.ctx.shadowBlur = this.state === 'OPEN' ? 12 : 4;
    this.ctx.shadowColor = primaryColor;
    this.ctx.stroke();
    this.ctx.restore();

    // 2. Draw Center Sub-Aetheric Event Horizon Vortex if OPEN
    if (this.state === 'OPEN') {
      this.ctx.save();

      // Deep radial glow gradient
      const grad = this.ctx.createRadialGradient(cx, cy, 5, cx, cy, this.apertureRadius);
      if (isAmber) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, '#ffd54f');
        grad.addColorStop(0.55, '#ff8000');
        grad.addColorStop(0.85, '#993300');
        grad.addColorStop(1, 'rgba(20, 10, 0, 0)');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, '#80ffaa');
        grad.addColorStop(0.55, '#00cc44');
        grad.addColorStop(0.85, '#006622');
        grad.addColorStop(1, 'rgba(0, 20, 5, 0)');
      }

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, this.apertureRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // Swirling Sub-Aetheric Particles
      this.particles.forEach(p => {
        p.angle += p.speed;
        p.radius += p.radialSpeed;
        if (p.radius > this.apertureRadius) {
          p.radius = 5 + Math.random() * 10;
        } else if (p.radius < 5) {
          p.radius = this.apertureRadius - 5;
        }

        const px = cx + p.radius * Math.cos(p.angle);
        const py = cy + p.radius * Math.sin(p.angle);

        this.ctx.fillStyle = brightColor;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.beginPath();
        this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      });

      // Swirling Spiral Spiral Arms
      this.ctx.globalAlpha = 0.45;
      this.ctx.strokeStyle = brightColor;
      this.ctx.lineWidth = 1.5;
      for (let arm = 0; arm < 4; arm++) {
        this.ctx.beginPath();
        const baseAngle = this.vortexRotation + (arm * Math.PI / 2);
        for (let r = 10; r < this.apertureRadius; r += 4) {
          const theta = baseAngle + (r * 0.06);
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);
          if (r === 10) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
      }

      this.ctx.restore();
    } else {
      // Idle / Standby subtle sweeping phosphor radar line
      this.ctx.save();
      const sweepAngle = this.vortexRotation * 0.8;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + this.apertureRadius * Math.cos(sweepAngle), cy + this.apertureRadius * Math.sin(sweepAngle));
      this.ctx.strokeStyle = dimColor;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Draw Radial Laser Beams to Locked Sectors
    if (this.lockedChevrons > 0 && this.lockedSlots.length > 0) {
      this.ctx.save();
      this.ctx.strokeStyle = brightColor;
      this.ctx.lineWidth = 1;
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = primaryColor;

      const angleStep = (2 * Math.PI) / 36;
      this.lockedSlots.forEach((secId) => {
        if (!secId) return;
        const currentSecAngle = (secId - 1) * angleStep - Math.PI / 2 + (this.currentRotation * Math.PI / 180);
        const sx = cx + this.midRadius * Math.cos(currentSecAngle);
        const sy = cy + this.midRadius * Math.sin(currentSecAngle);

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(sx, sy);
        this.ctx.stroke();
      });
      this.ctx.restore();
    }
  }
}

window.ConduitRingVisualizer = ConduitRingVisualizer;
