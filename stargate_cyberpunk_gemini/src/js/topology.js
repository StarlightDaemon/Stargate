/**
 * Khepri Cipher Terminal - Cyberspace Network Topology Map View
 * Interactive 2D Canvas routing lattice distinct from the main ring.
 */

class CipherTopologyMap {
  constructor() {
    this.modal = document.getElementById('topology-modal');
    this.canvas = document.getElementById('topology-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.activeSector = 'ALL';
    this.selectedNode = null;
    this.hoveredNode = null;

    this.nodes = [
      { id: 'NODE-SOLAR-0', name: 'Helios Array 0', x: 280, y: 160, sector: 'ORBITAL', latency: '4.2ms', ice: '38%', address: [0, 2, 4, 1, 6, 3, 5] },
      { id: 'NODE-LUNAR-1', name: 'Apollo Lunar Relay', x: 520, y: 120, sector: 'ORBITAL', latency: '1280ms', ice: '91%', address: [5, 9, 3, 7, 1, 6, 0] },
      { id: 'NODE-SAT-2', name: 'Nexus Orbital Alpha', x: 800, y: 180, sector: 'ORBITAL', latency: '12.4ms', ice: '41%', address: [3, 6, 9, 2, 5, 8, 1] },
      
      { id: 'NODE-BENTHIC-3', name: 'Leviathan Subcable 14', x: 220, y: 520, sector: 'UNDERGRID', latency: '18.1ms', ice: '85%', address: [5, 7, 9, 1, 4, 6, 8] },
      { id: 'NODE-SEATTLE-4', name: 'Vortex Hydroponic', x: 440, y: 460, sector: 'UNDERGRID', latency: '6.5ms', ice: '32%', address: [1, 4, 7, 0, 3, 6, 9] },
      { id: 'NODE-HONGKONG-5', name: 'Orpheus Cyberdeck Hub', x: 680, y: 560, sector: 'UNDERGRID', latency: '22.0ms', ice: '45%', address: [3, 7, 1, 5, 9, 4, 8] },
      
      { id: 'NODE-LOTUS-6', name: 'Black-Lotus Clearing', x: 380, y: 320, sector: 'MEGACORP', latency: '8.4ms', ice: '44%', address: [1, 3, 5, 7, 0, 2, 4] },
      { id: 'NODE-CHIMERA-7', name: 'Chimera Biotech Vault', x: 620, y: 300, sector: 'MEGACORP', latency: '9.1ms', ice: '52%', address: [2, 4, 6, 8, 1, 3, 5] },
      { id: 'NODE-AEGIS-8', name: 'Aegis Traceback Core', x: 860, y: 360, sector: 'MEGACORP', latency: '3.2ms', ice: '65%', address: [0, 3, 6, 1, 4, 7, 2] },
      { id: 'NODE-ECLIPSE-9', name: 'Eclipse Rail Array', x: 1040, y: 240, sector: 'MEGACORP', latency: '14.8ms', ice: '92%', address: [3, 5, 7, 9, 2, 4, 6] },
      
      { id: 'NODE-PARADOX-10', name: 'Ghost-Paradox Coma Vault', x: 920, y: 580, sector: 'DEEP VOID', latency: '44.0ms', ice: '88%', address: [4, 6, 8, 0, 3, 5, 7] },
      { id: 'NODE-HYDRA-11', name: 'Hydra Arctic Mine', x: 1160, y: 440, sector: 'DEEP VOID', latency: '68.2ms', ice: '89%', address: [6, 9, 2, 5, 8, 1, 4] },
      { id: 'NODE-VALKYRIE-12', name: 'Valkyrie Drone Fleet', x: 1020, y: 680, sector: 'DEEP VOID', latency: '11.0ms', ice: '84%', address: [8, 1, 4, 7, 0, 3, 6] },
      { id: 'NODE-SINGULARITY-13', name: 'Null-Singularity Core', x: 1240, y: 660, sector: 'DEEP VOID', latency: '0.01ms', ice: '98%', address: [6, 8, 0, 2, 5, 7, 9] },
      { id: 'NODE-OMEGA-14', name: 'Genesis Seed Omega', x: 1320, y: 220, sector: 'DEEP VOID', latency: '999ms', ice: '99%', address: [9, 8, 7, 6, 5, 4, 3] },
      { id: 'NODE-KHEPRI-15', name: 'Khepri Brokerage (Current Deck)', x: 600, y: 720, sector: 'UNDERGRID', latency: '0.0ms', ice: '0% (SECURE)', address: [0, 1, 2, 3, 4, 5, 6] }
    ];

    // Inter-node connection links
    this.links = [
      [0, 1], [1, 2], [0, 6], [2, 7], [3, 4], [4, 5], [3, 6],
      [6, 7], [7, 8], [8, 9], [6, 15], [5, 15], [7, 10], [8, 10],
      [9, 11], [10, 12], [11, 13], [12, 13], [9, 14], [13, 14], [2, 9]
    ];

    // Packets moving along links
    this.packets = [];
    for (let i = 0; i < 24; i++) {
      const linkIdx = Math.floor(Math.random() * this.links.length);
      this.packets.push({
        linkIdx: linkIdx,
        progress: Math.random(),
        speed: Math.random() * 0.008 + 0.004,
        forward: Math.random() > 0.5
      });
    }

    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.canvas.width = 1440;
    this.canvas.height = 960;

    // Filter buttons
    const filterBtns = document.querySelectorAll('.sector-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeSector = btn.getAttribute('data-sector') || 'ALL';
      });
    });

    // Close button
    const closeBtn = document.getElementById('btn-close-topology');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Mouse interactions on canvas
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    this.selectedNode = this.nodes[0];
    this.renderInspector(this.selectedNode);

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  open() {
    if (this.modal) this.modal.classList.add('open');
  }

  close() {
    if (this.modal) this.modal.classList.remove('open');
  }

  isOpen() {
    return this.modal && this.modal.classList.contains('open');
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    this.hoveredNode = null;
    for (const node of this.nodes) {
      const dx = node.x - mx;
      const dy = node.y - my;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        this.hoveredNode = node;
        break;
      }
    }
  }

  handleClick(e) {
    if (this.hoveredNode) {
      this.selectedNode = this.hoveredNode;
      this.renderInspector(this.selectedNode);
      if (window.CipherAudio) window.CipherAudio.playCandidateTick();
    }
  }

  renderInspector(node) {
    const inspector = document.getElementById('topology-inspector-panel');
    if (!inspector || !node) return;

    inspector.innerHTML = `
      <div class="topology-inspector">
        <span style="font-size: 11px; color: var(--secondary-color); letter-spacing: 0.1em;">${node.id} // ${node.sector}</span>
        <h3 class="inspector-node-title">${node.name}</h3>

        <div class="inspector-field">
          <span class="inspector-field-label">SECTOR REGISTRY</span>
          <span class="inspector-field-val">${node.sector}</span>
        </div>
        <div class="inspector-field">
          <span class="inspector-field-label">MEASURED LATENCY</span>
          <span class="inspector-field-val" style="color: var(--secondary-color);">${node.latency}</span>
        </div>
        <div class="inspector-field">
          <span class="inspector-field-label">ICE BARRIER INTEGRITY</span>
          <span class="inspector-field-val" style="color: var(--accent-amber);">${node.ice}</span>
        </div>
        <div class="inspector-field">
          <span class="inspector-field-label">ENCRYPTION VECTORS</span>
          <span class="inspector-field-val">${node.address.map(n => `0${n + 1}`).join(' · ')}</span>
        </div>

        <button class="dossier-load-btn" id="btn-dial-topology-node" style="margin-top: 20px;">
          ⚡ SET GATE TARGET & INJECT
        </button>
      </div>
    `;

    const dialBtn = inspector.querySelector('#btn-dial-topology-node');
    if (dialBtn) {
      dialBtn.addEventListener('click', () => {
        if (window.CipherDialer) {
          window.CipherDialer.loadPresetAddress(node.address, node.name);
          this.close();
        }
      });
    }
  }

  animate() {
    if (this.ctx && this.modal && this.modal.classList.contains('open')) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.renderGrid();
      this.renderLinks();
      this.renderPackets();
      this.renderNodes();
    }
    requestAnimationFrame(this.animate);
  }

  renderGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.05)';
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < this.canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  renderLinks() {
    const ctx = this.ctx;
    this.links.forEach(([fromIdx, toIdx]) => {
      const from = this.nodes[fromIdx];
      const to = this.nodes[toIdx];

      const isFiltered = this.activeSector !== 'ALL' && 
        from.sector !== this.activeSector && to.sector !== this.activeSector;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = isFiltered ? 'rgba(0, 255, 157, 0.04)' : 'rgba(0, 255, 157, 0.2)';
      ctx.lineWidth = isFiltered ? 1 : 1.5;
      ctx.stroke();
    });
  }

  renderPackets() {
    const ctx = this.ctx;
    this.packets.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1.0) {
        p.progress = 0;
        p.linkIdx = Math.floor(Math.random() * this.links.length);
      }

      const [fromIdx, toIdx] = this.links[p.linkIdx];
      const from = this.nodes[fromIdx];
      const to = this.nodes[toIdx];

      const isFiltered = this.activeSector !== 'ALL' && 
        from.sector !== this.activeSector && to.sector !== this.activeSector;
      if (isFiltered) return;

      const t = p.forward ? p.progress : 1.0 - p.progress;
      const px = from.x + (to.x - from.x) * t;
      const py = from.y + (to.y - from.y) * t;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderNodes() {
    const ctx = this.ctx;
    this.nodes.forEach(node => {
      const isSelected = this.selectedNode && this.selectedNode.id === node.id;
      const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
      const isDimmed = this.activeSector !== 'ALL' && node.sector !== this.activeSector;

      ctx.save();
      ctx.translate(node.x, node.y);

      // Node ring
      ctx.beginPath();
      ctx.arc(0, 0, isSelected ? 12 : 8, 0, Math.PI * 2);
      ctx.fillStyle = isDimmed ? 'rgba(5, 15, 23, 0.4)' : (isSelected ? 'var(--primary-color)' : '#071824');
      ctx.fill();

      ctx.strokeStyle = isDimmed ? 'rgba(0, 255, 157, 0.15)' : (isSelected ? '#ffffff' : (isHovered ? '#00e1ff' : '#00ff9d'));
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.shadowColor = isSelected ? '#00ff9d' : '#00e1ff';
      ctx.shadowBlur = isSelected ? 14 : (isHovered ? 8 : 4);
      ctx.stroke();

      // Node label
      if (!isDimmed || isSelected) {
        ctx.fillStyle = isSelected ? '#ffffff' : 'var(--text-secondary)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, 0, isSelected ? 24 : 18);
      }

      ctx.restore();
    });
  }
}

// Global Export
window.CipherTopologyMap = CipherTopologyMap;
