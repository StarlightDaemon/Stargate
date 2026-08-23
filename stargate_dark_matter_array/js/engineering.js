/**
 * BOREAS-IX Cryogenic Engineering Cross-Section Renderer
 * Interactive 2D schematic of subterranean shielding, cryostat vessels, and target chamber.
 */

class CryoEngineeringRenderer {
  constructor(canvasId, infoPanelId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.infoPanel = document.getElementById(infoPanelId);

    this.width = 900;
    this.height = 540;
    this.hoveredComponent = null;
    this.selectedComponent = 'target_chamber';

    this.components = [
      {
        id: 'mountain_shield',
        name: 'Mt. Caldera Rock Overburden (1,450m)',
        layer: 'Subterranean Geological Shield',
        material: 'Granite & Dolomite Overburden (4,200 m.w.e.)',
        attenuation: 'Cosmic muon flux reduced by factor of 10⁶',
        specs: '1,450 meters vertical rock shield, reducing surface cosmic-ray muon rate from 180 Hz/m² to 0.038 Hz total.',
        x: 40, y: 30, w: 820, h: 45,
        color: '#334155',
        accent: '#94a3b8'
      },
      {
        id: 'water_veto',
        name: '120-Tonne Water Cherenkov Cosmic Muon Veto Tank',
        layer: 'Outer Active Veto Shield',
        material: 'Ultra-Pure Deionized Water + 84 Submerged 8" PMTs',
        attenuation: '99.98% Cosmic Muon Tagging Efficiency (50ns coincidence)',
        specs: 'Cylindrical tank (8m diameter x 8m height) lined with high-reflectivity Tyvek. Detects relativistic Cherenkov cones from penetrating muons.',
        x: 80, y: 90, w: 740, h: 410,
        color: 'rgba(14, 165, 233, 0.12)',
        accent: '#38bdf8'
      },
      {
        id: 'lead_shield',
        name: 'Ultra-Low-Activity Radiogenic Lead Shield',
        layer: 'Passive Gamma Attenuation',
        material: 'Ancient Roman Lead (Pb-210 < 0.2 Bq/kg) + Oxygen-Free Copper',
        attenuation: 'Ambient rock gamma suppression factor > 10⁴',
        specs: '15cm thick lead vault surrounding the cryostat to absorb gamma rays from surrounding cavern rock and concrete.',
        x: 180, y: 135, w: 540, h: 325,
        color: 'rgba(100, 116, 139, 0.25)',
        accent: '#64748b'
      },
      {
        id: 'outer_cryostat',
        name: 'Vacuum Insulation Cryostat Vessel',
        layer: 'Thermal & Cryogenic Isolation',
        material: 'Electron-Beam Welded Grade-1 Titanium',
        attenuation: 'Insulation Vacuum: 1.24 × 10⁻⁹ mbar',
        specs: 'Double-walled vacuum vessel minimizing thermal conduction and radiogenic background from structural welds.',
        x: 230, y: 170, w: 440, h: 260,
        color: 'rgba(139, 92, 246, 0.2)',
        accent: '#a855f7'
      },
      {
        id: 'target_chamber',
        name: 'Dual-Phase Liquid Xenon Time-Projection Chamber (TPC)',
        layer: 'Active Rare-Event Detection Core',
        material: '3.50 Tonnes Ultra-Purified Liquid Xenon (165.20 K, 2.0 bar)',
        attenuation: 'Radon-222 Activity < 0.95 µBq/kg; Electron Lifetime > 2.0 ms',
        specs: '100cm height x 100cm diameter active cylindrical volume enclosed by high-reflectivity PTFE tiles. Generates prompt S1 scintillation (178nm) and delayed S2 ionization signals.',
        x: 290, y: 215, w: 320, h: 175,
        color: 'rgba(56, 189, 248, 0.35)',
        accent: '#00f0ff'
      },
      {
        id: 'top_pmt_array',
        name: 'Top PMT Array Ring & Anode Extraction Grid (+4.5 kV)',
        layer: 'Gas-Phase Electroluminescence Detection',
        material: '84 Low-Background 3" Hamamatsu R11410 PMTs',
        attenuation: '178nm VUV Quantum Efficiency: 36%',
        specs: 'Positioned in gaseous xenon layer above the liquid surface to detect electroluminescence photons from extracted ionization electrons (S2 signal).',
        x: 300, y: 220, w: 300, h: 28,
        color: 'rgba(236, 72, 153, 0.4)',
        accent: '#f472b6'
      },
      {
        id: 'bottom_pmt_array',
        name: 'Bottom PMT Array Ring & Cathode Grid (-10.5 kV)',
        layer: 'Liquid-Phase Scintillation Collection',
        material: '120 Low-Background 3" Hamamatsu R11410 PMTs',
        attenuation: '90% Prompt S1 Photon Collection Efficiency',
        specs: 'Submerged below the high-voltage cathode mesh at the bottom of the active target volume to capture prompt scintillation photons.',
        x: 300, y: 355, w: 300, h: 30,
        color: 'rgba(236, 72, 153, 0.4)',
        accent: '#f472b6'
      }
    ];

    if (this.canvas) {
      this.resize();
      this.bindEvents();
      this.render();
      this.updateInfoPanel(this.selectedComponent);
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 900;
    this.height = rect.height || 540;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      const y = (e.clientY - rect.top) * (this.height / rect.height);
      this.handlePointerMove(x, y);
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.width / rect.width);
      const y = (e.clientY - rect.top) * (this.height / rect.height);
      this.handlePointerClick(x, y);
    });
  }

  handlePointerMove(x, y) {
    let found = null;
    // Iterate in reverse (innermost / top components first)
    for (let i = this.components.length - 1; i >= 0; i--) {
      const c = this.components[i];
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
        found = c.id;
        break;
      }
    }
    if (this.hoveredComponent !== found) {
      this.hoveredComponent = found;
      this.render();
    }
  }

  handlePointerClick(x, y) {
    if (this.hoveredComponent) {
      this.selectedComponent = this.hoveredComponent;
      this.updateInfoPanel(this.selectedComponent);
      this.render();
      if (window.dmAudio) window.dmAudio.playChannelSelect();
      if (window.dmLogger) {
        const c = this.components.find(item => item.id === this.selectedComponent);
        if (c) window.dmLogger.log('SYSTEM', `Inspecting engineering subsystem: ${c.name}`);
      }
    }
  }

  updateInfoPanel(componentId) {
    const comp = this.components.find(c => c.id === componentId) || this.components[4];
    if (!this.infoPanel) return;

    this.infoPanel.innerHTML = `
      <div class="eng-card">
        <div class="eng-header">
          <span class="eng-tag">${comp.layer.toUpperCase()}</span>
          <h3 class="eng-title">${comp.name}</h3>
        </div>
        <div class="eng-grid">
          <div class="eng-field">
            <span class="eng-label">MATERIAL & COMPOSITION</span>
            <span class="eng-val">${comp.material}</span>
          </div>
          <div class="eng-field">
            <span class="eng-label">BACKGROUND ATTENUATION / SPECS</span>
            <span class="eng-val highlight">${comp.attenuation}</span>
          </div>
        </div>
        <p class="eng-desc">${comp.specs}</p>
      </div>
    `;
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Render each component layer
    this.components.forEach(c => {
      const isSelected = this.selectedComponent === c.id;
      const isHovered = this.hoveredComponent === c.id;

      ctx.save();
      ctx.beginPath();
      ctx.rect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = c.color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = c.accent;
        ctx.shadowBlur = 12;
      } else if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Label inside component
      ctx.fillStyle = isSelected || isHovered ? '#ffffff' : 'rgba(226, 232, 240, 0.8)';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(c.name.split('(')[0].trim().toUpperCase(), c.x + 12, c.y + 18);

      ctx.restore();
    });

    // Dimension indicators and central axis
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 80);
    ctx.lineTo(this.width / 2, 490);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('CENTRAL DRIFT AXIS (Z = 0 to 100 cm)', this.width / 2 + 10, 105);
    ctx.restore();
  }
}

window.CryoEngineeringRenderer = CryoEngineeringRenderer;
