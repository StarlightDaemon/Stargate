/**
 * AERIS Subspace Network Star-Chart & Spatial Projection Map
 * Interactive 2D/3D orbital radar map with pan/zoom, destination nodes,
 * and live active subspace transit conduit beams.
 */

class AerisStarMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.width = 800;
    this.height = 600;
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1.0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this.selectedDest = null;
    this.hoveredDest = null;
    this.activeDest = null;

    // Background Starfield
    this.stars = [];
    this.generateStarfield(180);

    // Map Nodes from AerisDB
    this.mapNodes = [];
    this.initNodes();

    this.initCanvas();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || 800;
    this.height = rect.height || 600;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);

    this.offsetX = this.width / 2;
    this.offsetY = this.height / 2;
  }

  generateStarfield(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 2400,
        y: (Math.random() - 0.5) * 2400,
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.2 + Math.random() * 0.7,
        speed: 0.1 + Math.random() * 0.3
      });
    }
  }

  initNodes() {
    if (!window.aerisDB) return;
    const destinations = window.aerisDB.destinations;

    // Map radial sectors to coordinates
    this.mapNodes = destinations.map((d, index) => {
      let angle = 0;
      let dist = 100;

      if (d.sector === 'Inner Sol Boundary') {
        angle = (index / 5) * (Math.PI * 0.5) - Math.PI * 0.25;
        dist = 50 + d.distanceLY * 12;
      } else if (d.sector === 'Perseus Arm') {
        angle = (index / 7) * (Math.PI * 0.6) + Math.PI * 0.3;
        dist = 160 + (d.distanceLY / 1500) * 120;
      } else if (d.sector === 'Cygnus Rift') {
        angle = (index / 6) * (Math.PI * 0.6) + Math.PI * 0.95;
        dist = 220 + (d.distanceLY / 4500) * 140;
      } else {
        // Outer Magellanic
        angle = (index / 5) * (Math.PI * 0.5) + Math.PI * 1.6;
        dist = 360 + (d.distanceLY / 25000) * 120;
      }

      if (d.id === 'DST-22') { // Local origin
        dist = 0;
      }

      return {
        ...d,
        mapX: Math.cos(angle) * dist,
        mapY: Math.sin(angle) * dist,
        baseAngle: angle,
        baseDist: dist
      };
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvas());

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.offsetX;
      this.dragStartY = e.clientY - this.offsetY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.offsetX = e.clientX - this.dragStartX;
        this.offsetY = e.clientY - this.dragStartY;
      }
      this.checkHover(e);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      this.scale = Math.max(0.4, Math.min(3.2, this.scale * zoomFactor));
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - this.offsetX) / this.scale;
      const mouseY = (e.clientY - rect.top - this.offsetY) / this.scale;

      const hit = this.mapNodes.find(node => {
        const dx = node.mapX - mouseX;
        const dy = node.mapY - mouseY;
        return Math.sqrt(dx * dx + dy * dy) < 16;
      });

      if (hit) {
        this.selectNode(hit);
      }
    });
  }

  checkHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - this.offsetX) / this.scale;
    const mouseY = (e.clientY - rect.top - this.offsetY) / this.scale;

    this.hoveredDest = this.mapNodes.find(node => {
      const dx = node.mapX - mouseX;
      const dy = node.mapY - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < 16;
    }) || null;

    this.canvas.style.cursor = this.hoveredDest ? 'pointer' : (this.isDragging ? 'grabbing' : 'crosshair');
  }

  selectNode(node) {
    this.selectedDest = node;
    if (window.aerisAudio) {
      window.aerisAudio.playClick(1400);
    }
    const infoPanel = document.getElementById('starmap-info-card');
    if (infoPanel) {
      infoPanel.classList.remove('hidden');
      document.getElementById('starmap-dest-name').textContent = `${node.designation} — ${node.name}`;
      document.getElementById('starmap-dest-sector').textContent = `${node.sector} · ${node.distanceLY} LY`;
      document.getElementById('starmap-dest-env').textContent = node.environment;
      document.getElementById('starmap-dest-threat').textContent = node.threatLevel;
      document.getElementById('starmap-dest-threat').style.color = node.threatColor;

      // Glyphs preview
      const glyphsBox = document.getElementById('starmap-dest-glyphs');
      if (glyphsBox) {
        glyphsBox.innerHTML = '';
        node.coords.forEach(gId => {
          const g = window.aerisDB.getGlyph(gId);
          if (g) {
            const badge = document.createElement('span');
            badge.className = 'starmap-glyph-badge';
            badge.textContent = g.code;
            glyphsBox.appendChild(badge);
          }
        });
      }
    }
  }

  setActiveDestination(dest) {
    this.activeDest = dest;
  }

  resetView() {
    this.scale = 1.0;
    this.offsetX = this.width / 2;
    this.offsetY = this.height / 2;
  }

  animate(timestamp) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const ctx = this.ctx;

    // Background Void
    ctx.fillStyle = '#040711';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // 1. Starfield
    for (let s of this.stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 225, 255, ${s.alpha})`;
      ctx.fill();
    }

    // 2. Radar Grid Rings & Sector Boundaries
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let r = 80; r <= 500; r += 80) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Distance tag
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillText(`${r * 15} LY`, r + 4, -4);
    }

    // Sector dividers
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 550, Math.sin(a) * 550);
      ctx.stroke();
    }

    // 3. Active Wormhole Conduit Beam
    if (this.activeDest && window.aerisApp && window.aerisApp.gateState === 'ACTIVE') {
      const activeNode = this.mapNodes.find(n => n.id === this.activeDest.id);
      if (activeNode) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(activeNode.mapX, activeNode.mapY);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3 + Math.sin(timestamp * 0.01) * 1.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Traveling energy pulses along the beam
        const pulseProgress = (timestamp * 0.0012) % 1.0;
        const px = activeNode.mapX * pulseProgress;
        const py = activeNode.mapY * pulseProgress;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }
    }

    // 4. Render Nodes
    for (let node of this.mapNodes) {
      const isOrigin = node.id === 'DST-22';
      const isSelected = this.selectedDest && this.selectedDest.id === node.id;
      const isHovered = this.hoveredDest && this.hoveredDest.id === node.id;
      const isActiveNode = this.activeDest && this.activeDest.id === node.id;

      ctx.save();
      ctx.translate(node.mapX, node.mapY);

      if (isOrigin) {
        // Central origin beacon (ADRL-04)
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.fill();

        // Expanding radar pulse
        const pulseR = (timestamp * 0.03) % 40;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${1 - pulseR / 40})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '10px "Inter", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('ADRL-04 (SOL ORIGIN)', 14, 4);
      } else {
        // Destination Node
        ctx.beginPath();
        ctx.arc(0, 0, isSelected || isHovered ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isActiveNode
          ? '#00f0ff'
          : isSelected
          ? '#ff4b72'
          : node.threatColor || '#38bdf8';
        if (isSelected || isHovered || isActiveNode) {
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 12;
        }
        ctx.fill();

        // Node label
        ctx.font = isSelected ? 'bold 10px "Inter", sans-serif' : '9px "Inter", sans-serif';
        ctx.fillStyle = isSelected || isHovered ? '#ffffff' : 'rgba(203, 213, 225, 0.75)';
        ctx.fillText(node.designation, 10, 3);
      }

      ctx.restore();
    }

    ctx.restore();

    requestAnimationFrame(this.animate);
  }
}

window.AerisStarMap = AerisStarMap;
