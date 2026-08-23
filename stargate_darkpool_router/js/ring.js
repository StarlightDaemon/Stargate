/**
 * VALENCE-9 Orbital Order-Book Depth Ring Engine
 * Renders 10 radial exchange nodes, dynamic bid/ask liquidity depth walls,
 * converging liquidity vectors, and central execution vortex aperture.
 */

class OrderBookRing {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.ringRadius = 260;
    this.innerRadius = 140;

    // 10 Exchange Nodes
    this.nodes = [
      { id: 'LSE-DARK', name: 'LSE Dark Pool', code: 'LSE', basePrice: 142.85, angle: -Math.PI / 2, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 142.85, fillFlash: 0 },
      { id: 'NY4-ULTRA', name: 'NY4 Equinix Secaucus', code: 'NY4', basePrice: 285.40, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 1, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 285.40, fillFlash: 0 },
      { id: 'TY3-MWAVE', name: 'Tokyo Nihonbashi MW', code: 'TY3', basePrice: 88.15, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 2, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 88.15, fillFlash: 0 },
      { id: 'SG1-LASER', name: 'Singapore Laser Hub', code: 'SG1', basePrice: 312.60, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 3, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 312.60, fillFlash: 0 },
      { id: 'HK1-OPTIC', name: 'HK Tseung Kwan O', code: 'HK1', basePrice: 194.50, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 4, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 194.50, fillFlash: 0 },
      { id: 'FR2-DIRECT', name: 'Frankfurt Direct Core', code: 'FR2', basePrice: 167.30, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 5, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 167.30, fillFlash: 0 },
      { id: 'CME-AURORA', name: 'CME Aurora Anchor', code: 'CME', basePrice: 420.95, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 6, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 420.95, fillFlash: 0 },
      { id: 'CHI-BATS', name: 'Chicago BZX Engine', code: 'CHI', basePrice: 210.10, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 7, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 210.10, fillFlash: 0 },
      { id: 'ZUR-QNTM', name: 'Zurich Quantum State', code: 'ZUR', basePrice: 530.75, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 8, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 530.75, fillFlash: 0 },
      { id: 'TOK-SUBSEA', name: 'Transpacific Subsea', code: 'TOK', basePrice: 365.20, angle: -Math.PI / 2 + (2 * Math.PI / 10) * 9, locked: false, instrument: null, bidDepth: 0.15, askDepth: 0.15, currentPrice: 365.20, fillFlash: 0 }
    ];

    this.particles = [];
    this.vortexRotation = 0;
    this.breakthroughFlash = 0;
    this.buildupIntensity = 0;
    this.systemState = 'IDLE'; // IDLE, DIALING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE
    this.hoveredNode = null;

    this.initParticles();
    this.setupInteractivity();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        r: this.innerRadius + Math.random() * (this.ringRadius - this.innerRadius),
        theta: Math.random() * Math.PI * 2,
        speed: (0.003 + Math.random() * 0.008) * (Math.random() > 0.5 ? 1 : -1),
        size: 1 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.6,
        color: Math.random() > 0.5 ? '#00ff9d' : '#00f3ff'
      });
    }
  }

  setupInteractivity() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      let found = null;
      for (const node of this.nodes) {
        const nx = this.centerX + Math.cos(node.angle) * this.ringRadius;
        const ny = this.centerY + Math.sin(node.angle) * this.ringRadius;
        const dist = Math.hypot(mouseX - nx, mouseY - ny);
        if (dist < 32) {
          found = node;
          break;
        }
      }
      this.hoveredNode = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredNode && window.lockingEngine) {
        window.lockingEngine.handleNodeDirectClick(this.hoveredNode);
      }
    });
  }

  setSystemState(state) {
    this.systemState = state;
  }

  setBuildupIntensity(val) {
    this.buildupIntensity = val; // 0 to 1
  }

  triggerBreakthroughFlash() {
    this.breakthroughFlash = 1.0;
  }

  lockNode(index, instrument) {
    if (this.nodes[index]) {
      this.nodes[index].locked = true;
      this.nodes[index].instrument = instrument;
      this.nodes[index].fillFlash = 1.0;
      this.nodes[index].bidDepth = 0.65 + Math.random() * 0.35;
      this.nodes[index].askDepth = 0.65 + Math.random() * 0.35;
      this.nodes[index].currentPrice = +(this.nodes[index].basePrice + (Math.random() * 0.8 - 0.4)).toFixed(2);
    }
  }

  unlockAllNodes() {
    this.nodes.forEach(node => {
      node.locked = false;
      node.instrument = null;
      node.fillFlash = 0;
      node.bidDepth = 0.15;
      node.askDepth = 0.15;
      node.currentPrice = node.basePrice;
    });
    this.buildupIntensity = 0;
    this.breakthroughFlash = 0;
  }

  animate() {
    this.update();
    this.render();
    requestAnimationFrame(this.animate);
  }

  update() {
    const time = performance.now() * 0.001;

    // Vortex rotation speed depends on state
    if (this.systemState === 'ACTIVE') {
      this.vortexRotation += 0.045;
    } else if (this.systemState === 'BUILDUP') {
      this.vortexRotation += 0.02 + this.buildupIntensity * 0.06;
    } else {
      this.vortexRotation += 0.005;
    }

    // Decay flashes
    if (this.breakthroughFlash > 0) {
      this.breakthroughFlash = Math.max(0, this.breakthroughFlash - 0.035);
    }

    this.nodes.forEach(node => {
      if (node.fillFlash > 0) {
        node.fillFlash = Math.max(0, node.fillFlash - 0.04);
      }
      // Micro-tick price fluctuation
      if (this.systemState === 'ACTIVE' || this.systemState === 'BUILDUP') {
        const jitter = (Math.sin(time * 8 + node.basePrice) * 0.08);
        node.currentPrice = +(node.basePrice + jitter).toFixed(2);
      }
    });

    // Particle update
    this.particles.forEach(p => {
      p.theta += p.speed * (this.systemState === 'ACTIVE' ? 3.5 : (this.systemState === 'BUILDUP' ? 2.0 : 1.0));
      if (this.systemState === 'BUILDUP') {
        // Particles pulled toward center during buildup
        p.r -= 0.3 * this.buildupIntensity;
        if (p.r < this.innerRadius) p.r = this.ringRadius;
      }
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Ambient Background Glow
    this.renderBackgroundGlow(ctx);

    // 2. Central Execution Aperture & Vortex
    this.renderCentralAperture(ctx);

    // 3. Radial Order-Book Depth Walls
    this.renderDepthWalls(ctx);

    // 4. Particle Field & Optical Flux
    this.renderParticles(ctx);

    // 5. Inter-Node Route Arcs & Liquidity Streams
    this.renderRouteArcs(ctx);

    // 6. 10 Exchange Node Stations & Readouts
    this.renderNodes(ctx);

    // 7. Breakthrough Shockwave
    if (this.breakthroughFlash > 0) {
      this.renderShockwave(ctx);
    }
  }

  renderBackgroundGlow(ctx) {
    const grad = ctx.createRadialGradient(this.centerX, this.centerY, 10, this.centerX, this.centerY, this.ringRadius + 100);
    if (this.systemState === 'ACTIVE') {
      grad.addColorStop(0, 'rgba(0, 255, 157, 0.22)');
      grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.12)');
      grad.addColorStop(1, 'rgba(5, 8, 17, 0)');
    } else if (this.systemState === 'BUILDUP') {
      grad.addColorStop(0, `rgba(255, 183, 0, ${0.15 + this.buildupIntensity * 0.25})`);
      grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.1)');
      grad.addColorStop(1, 'rgba(5, 8, 17, 0)');
    } else {
      grad.addColorStop(0, 'rgba(0, 243, 255, 0.04)');
      grad.addColorStop(0.6, 'rgba(15, 28, 54, 0.08)');
      grad.addColorStop(1, 'rgba(5, 8, 17, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.ringRadius + 120, 0, Math.PI * 2);
    ctx.fill();
  }

  renderCentralAperture(ctx) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Outer aperture ring
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, this.innerRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotating reticle ring
    ctx.save();
    ctx.rotate(this.vortexRotation);
    ctx.strokeStyle = this.systemState === 'ACTIVE' ? 'rgba(0, 255, 157, 0.8)' : 'rgba(0, 243, 255, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, this.innerRadius - 15, i * Math.PI / 2 + 0.1, (i + 1) * Math.PI / 2 - 0.1);
      ctx.stroke();
    }
    ctx.restore();

    // Active Wormhole Vortex / Quantum Execution Core
    if (this.systemState === 'ACTIVE' || this.systemState === 'BUILDUP') {
      const numRays = 16;
      ctx.save();
      ctx.rotate(-this.vortexRotation * 1.5);
      for (let i = 0; i < numRays; i++) {
        const ang = (i / numRays) * Math.PI * 2;
        const rayLen = this.innerRadius - 20;
        const grad = ctx.createLinearGradient(0, 0, Math.cos(ang) * rayLen, Math.sin(ang) * rayLen);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.3, this.systemState === 'ACTIVE' ? 'rgba(0, 255, 157, 0.6)' : 'rgba(255, 183, 0, 0.6)');
        grad.addColorStop(1, 'rgba(0, 243, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.cos(ang + 0.4) * (rayLen * 0.6),
          Math.sin(ang + 0.4) * (rayLen * 0.6),
          Math.cos(ang) * rayLen,
          Math.sin(ang) * rayLen
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // Inner Core Center Box & Readout
    ctx.fillStyle = '#060c18';
    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.systemState === 'ACTIVE' ? '#00ff9d' : '#00f3ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center Text Metrics
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.systemState === 'ACTIVE') {
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff9d';
      ctx.fillText('EXECUTION CORE', 0, -28);

      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('MATCHED', 0, -6);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.fillText('Δ 0.0000 SPREAD', 0, 14);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#7592b5';
      ctx.fillText('THROUGHPUT: 1.48M/s', 0, 30);
    } else if (this.systemState === 'BUILDUP') {
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffb700';
      ctx.fillText('ROUTING PACKET', 0, -25);

      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('MATCHING...', 0, -4);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffb700';
      ctx.fillText(`CONVERGENCE ${(this.buildupIntensity * 100).toFixed(0)}%`, 0, 16);
    } else if (this.systemState === 'PENDING') {
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffe600';
      ctx.fillText('BASKET READY', 0, -22);

      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('7/7 LOCKED', 0, -3);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffe600';
      ctx.fillText('AWAITING EXECUTE', 0, 15);
    } else {
      // IDLE or DIALING
      const lockedCount = this.nodes.filter(n => n.locked).length;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#7592b5';
      ctx.fillText('VALENCE-9 GATE', 0, -24);

      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = lockedCount > 0 ? '#00f3ff' : '#4a6785';
      ctx.fillText(`${lockedCount}/7 LEGS`, 0, -3);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#7592b5';
      const spreadVal = (0.4850 * Math.max(0.05, 1 - (lockedCount / 7))).toFixed(4);
      ctx.fillText(`SPREAD: ${spreadVal} Δ`, 0, 16);
    }

    ctx.restore();
  }

  renderDepthWalls(ctx) {
    const time = performance.now() * 0.003;
    const numSegments = 120;
    const angleStep = (Math.PI * 2) / numSegments;

    // Draw circumferential bid and ask liquidity depth profile
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    for (let i = 0; i < numSegments; i++) {
      const ang = i * angleStep;
      // Find closest node to modulate depth
      let maxDepth = 0.12;
      let isNodeLocked = false;
      this.nodes.forEach(n => {
        let diff = Math.abs(ang - n.angle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
        if (diff < 0.35) {
          const factor = 1 - (diff / 0.35);
          if (n.locked) {
            isNodeLocked = true;
            maxDepth = Math.max(maxDepth, 0.35 + factor * 0.55);
          } else {
            maxDepth = Math.max(maxDepth, 0.12 + factor * 0.15);
          }
        }
      });

      // Fluctuation wave
      const wave = Math.sin(ang * 8 + time) * 0.06;
      const depthVal = Math.min(1.0, maxDepth + wave);

      // Bid depth (inner to mid)
      const bidInner = this.innerRadius + 6;
      const bidOuter = bidInner + depthVal * 45;
      const bidGrad = ctx.createLinearGradient(
        Math.cos(ang) * bidInner, Math.sin(ang) * bidInner,
        Math.cos(ang) * bidOuter, Math.sin(ang) * bidOuter
      );
      bidGrad.addColorStop(0, isNodeLocked ? 'rgba(0, 255, 157, 0.05)' : 'rgba(0, 243, 255, 0.03)');
      bidGrad.addColorStop(1, isNodeLocked ? 'rgba(0, 255, 157, 0.45)' : 'rgba(0, 243, 255, 0.18)');

      ctx.strokeStyle = bidGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * bidInner, Math.sin(ang) * bidInner);
      ctx.lineTo(Math.cos(ang) * bidOuter, Math.sin(ang) * bidOuter);
      ctx.stroke();

      // Ask depth (mid to outer)
      const askInner = this.ringRadius - 6;
      const askOuter = askInner - depthVal * 35;
      const askGrad = ctx.createLinearGradient(
        Math.cos(ang) * askInner, Math.sin(ang) * askInner,
        Math.cos(ang) * askOuter, Math.sin(ang) * askOuter
      );
      askGrad.addColorStop(0, isNodeLocked ? 'rgba(255, 183, 0, 0.45)' : 'rgba(255, 0, 85, 0.18)');
      askGrad.addColorStop(1, isNodeLocked ? 'rgba(255, 183, 0, 0.05)' : 'rgba(255, 0, 85, 0.03)');

      ctx.strokeStyle = askGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * askInner, Math.sin(ang) * askInner);
      ctx.lineTo(Math.cos(ang) * askOuter, Math.sin(ang) * askOuter);
      ctx.stroke();
    }

    // Outer boundary ring track
    ctx.strokeStyle = 'rgba(74, 103, 133, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      const x = Math.cos(p.theta) * p.r;
      const y = Math.sin(p.theta) * p.r;
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  renderRouteArcs(ctx) {
    const lockedNodes = this.nodes.filter(n => n.locked);
    if (lockedNodes.length < 2) return;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    for (let i = 0; i < lockedNodes.length - 1; i++) {
      const n1 = lockedNodes[i];
      const n2 = lockedNodes[i + 1];
      const x1 = Math.cos(n1.angle) * this.ringRadius;
      const y1 = Math.sin(n1.angle) * this.ringRadius;
      const x2 = Math.cos(n2.angle) * this.ringRadius;
      const y2 = Math.sin(n2.angle) * this.ringRadius;

      // Arc through inner radius
      const midAngle = (n1.angle + n2.angle) / 2;
      const ctrlX = Math.cos(midAngle) * (this.innerRadius + 40);
      const ctrlY = Math.sin(midAngle) * (this.innerRadius + 40);

      ctx.strokeStyle = this.systemState === 'ACTIVE' ? 'rgba(0, 255, 157, 0.7)' : 'rgba(0, 243, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(ctrlX, ctrlY, x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderNodes(ctx) {
    this.nodes.forEach((node, idx) => {
      const nx = this.centerX + Math.cos(node.angle) * this.ringRadius;
      const ny = this.centerY + Math.sin(node.angle) * this.ringRadius;
      const isHovered = this.hoveredNode === node;

      ctx.save();
      ctx.translate(nx, ny);

      // Fill confirmation flash flare
      if (node.fillFlash > 0) {
        ctx.fillStyle = `rgba(0, 255, 157, ${node.fillFlash * 0.7})`;
        ctx.beginPath();
        ctx.arc(0, 0, 36 + (1 - node.fillFlash) * 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 230, 0, ${node.fillFlash})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Station Hub Outer Ring
      ctx.fillStyle = node.locked ? '#0b1d28' : '#0a1120';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      // Border styling
      if (node.locked) {
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 10;
      } else if (isHovered) {
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = '#223859';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Node Code Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = node.locked ? '#00ff9d' : (isHovered ? '#00f3ff' : '#9bb6d8');
      ctx.fillText(node.code, 0, -4);

      // Price or Instrument Badge
      ctx.font = '9px "JetBrains Mono", monospace';
      if (node.locked && node.instrument) {
        ctx.fillStyle = '#ffe600';
        ctx.fillText(node.instrument.symbol, 0, 7);
      } else {
        ctx.fillStyle = '#4a6785';
        ctx.fillText(`$${node.currentPrice.toFixed(1)}`, 0, 7);
      }

      // Exterior Price Label Tag (projected radially outward)
      const labelDist = 38;
      const lx = Math.cos(node.angle) * labelDist;
      const ly = Math.sin(node.angle) * labelDist;

      ctx.fillStyle = node.locked ? '#ffffff' : '#7592b5';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`$${node.currentPrice.toFixed(2)}`, lx, ly);

      ctx.restore();
    });
  }

  renderShockwave(ctx) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    const radius = (1 - this.breakthroughFlash) * (this.ringRadius + 80);

    ctx.strokeStyle = `rgba(255, 255, 255, ${this.breakthroughFlash})`;
    ctx.lineWidth = 8 * this.breakthroughFlash;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(0, 255, 157, ${this.breakthroughFlash * 0.8})`;
    ctx.lineWidth = 14 * this.breakthroughFlash;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

window.OrderBookRing = OrderBookRing;
