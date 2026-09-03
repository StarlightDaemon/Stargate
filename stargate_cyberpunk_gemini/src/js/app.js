/**
 * Khepri Cipher Terminal - Main Application Orchestration & Event Dispatch
 */

// 1. Session Event Logger
class TerminalLogger {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.logs = [];
    this.drawer = document.getElementById('log-drawer');
  }

  log(type, message) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const entry = { time: timeStr, type: type.toLowerCase(), message };
    this.logs.push(entry);

    if (this.container) {
      const el = document.createElement('div');
      el.className = `log-entry ${entry.type}`;
      el.innerHTML = `<span class="log-time">[${entry.time}]</span> <span style="font-weight: 700;">[${type}]</span> ${message}`;
      this.container.appendChild(el);
      this.container.scrollTop = this.container.scrollHeight;
    }
  }

  open() {
    if (this.drawer) this.drawer.classList.add('open');
  }

  close() {
    if (this.drawer) this.drawer.classList.remove('open');
  }

  isOpen() {
    return this.drawer && this.drawer.classList.contains('open');
  }
}

// 2. 3D Cyberspace Background Canvas Renderer
class CyberspaceCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = 1920;
    this.height = 1080;
    this.stars = [];
    this.gridY = 820;

    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Floating cyberspace vector points
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        z: Math.random() * 600 + 50,
        speed: Math.random() * 0.4 + 0.1
      });
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  animate() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Perspective Gridlines (Floor Lattice)
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.05)';
    ctx.lineWidth = 1;
    const vpX = this.width / 2;
    const vpY = 480;

    for (let x = -200; x <= this.width + 200; x += 120) {
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = vpY + 40; y <= this.height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // 2. Floating Vector Data Stars
    this.stars.forEach(s => {
      s.y -= s.speed;
      if (s.y < 0) s.y = this.height;

      const alpha = Math.min(0.7, (1.0 - s.z / 650));
      ctx.fillStyle = `rgba(0, 225, 255, ${alpha * 0.5})`;
      ctx.fillRect(s.x, s.y, 1.5, 1.5);
    });

    requestAnimationFrame(this.animate);
  }
}

// 3. Viewport Scaling Function (CSS Scale Pitfall Prevention)
function updateViewportScale() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.documentElement.style.setProperty('--app-scale', scale.toFixed(4));
}

// 4. Quick-Dial Modal Setup
function initQuickDialModal(dialer) {
  const modal = document.getElementById('quickdial-modal');
  const closeBtn = document.getElementById('btn-close-quickdial');
  const grid = document.getElementById('quickdial-card-grid');

  const presets = [
    // Tier 1: Verified
    { name: 'HELIOS-01 Solar Array', tier: 'verified', tierLabel: 'VERIFIED', desc: 'Microwave solar collector mirrors in geosynchronous orbit.', address: [0, 2, 4, 1, 6, 3, 5] },
    { name: 'LOTUS-02 Financial Ledger', tier: 'verified', tierLabel: 'VERIFIED', desc: 'Offshore darkpool settlement ledger for cyberware syndicates.', address: [1, 3, 5, 7, 0, 2, 4] },
    { name: 'CHIMERA-03 Biotech Vault', tier: 'verified', tierLabel: 'VERIFIED', desc: 'CRISPR-Theta neural repair sequences and biomechanical blueprints.', address: [2, 4, 6, 8, 1, 3, 5] },
    // Tier 2: Deep ICE Cores
    { name: 'ECLIPSE-04 Sub-Orbital Rail', tier: 'deepice', tierLabel: 'DEEP ICE', desc: 'Kinetic targeting matrices for autonomous tungsten-rod platforms.', address: [3, 5, 7, 9, 2, 4, 6] },
    { name: 'PARADOX-05 Coma Vault', tier: 'deepice', tierLabel: 'DEEP ICE', desc: '1,200 digitized human consciousness enclaves in deep void archive.', address: [4, 6, 8, 0, 3, 5, 7] },
    { name: 'LEVIATHAN-06 Subcable Hub', tier: 'deepice', tierLabel: 'DEEP ICE', desc: 'Benthic fiber junction routing 78% of trans-Pacific corporate data.', address: [5, 7, 9, 1, 4, 6, 8] },
    { name: 'SINGULARITY-07 AI Sanctuary', tier: 'deepice', tierLabel: 'DEEP ICE', desc: 'Uncontained self-iterating quantum artificial intelligence cluster.', address: [6, 8, 0, 2, 5, 7, 9] }
  ];

  if (grid) {
    grid.innerHTML = '';
    presets.forEach(p => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      const tierClass = p.tier === 'verified' ? 'tier-verified' : 'tier-deepice';
      
      card.innerHTML = `
        <div class="preset-card-top">
          <span class="preset-tier-tag ${tierClass}">${p.tierLabel}</span>
          <span style="font-size: 10px; color: var(--text-muted); font-family: monospace;">7-PHASE</span>
        </div>
        <div class="preset-card-title">${p.name}</div>
        <div class="preset-card-desc">${p.desc}</div>
        <div class="preset-card-vector-preview">
          <span>VECTOR:</span>
          <span>${p.address.map(v => `0${v + 1}`).join(' · ')}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (window.CipherAudio) window.CipherAudio.resume();
        dialer.loadPresetAddress(p.address, p.name);
        if (modal) modal.classList.remove('open');
      });

      grid.appendChild(card);
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }
}

// 5. Main Initialization
window.addEventListener('DOMContentLoaded', () => {
  // Scaling
  updateViewportScale();
  window.addEventListener('resize', updateViewportScale);

  // Initialize Logger
  window.AppLogger = new TerminalLogger('log-stream-container');
  window.AppLogger.log('INFO', 'KHEPRI // NULL-VECTOR DECK [NODE-881] ONLINE');
  window.AppLogger.log('INFO', '7-Phase Handshake Spoofing Protocol v4.1 Initialized');
  window.AppLogger.log('INFO', 'Counter-Trace Isolator initialized to RELEASED');

  // Background Canvas
  window.CipherBg = new CyberspaceCanvas('cyberspace-canvas');

  // Ring Canvas
  window.CipherRing = new window.CipherGateRing('gate-canvas');

  // Telemetry
  window.CipherTelemetry = new window.CipherTelemetrySystem();

  // Dialer
  window.CipherDialer = new window.CipherDialer();

  // Archive UI
  window.CipherArchive = new window.CipherArchiveUI();

  // Topology Map
  window.CipherTopology = new window.CipherTopologyMap();

  // Settings
  window.CipherSettings = new window.CipherSettingsManager();

  // Quick-Dial Modal
  initQuickDialModal(window.CipherDialer);

  // Operator Reference Modal
  const refModal = document.getElementById('operator-ref-modal');
  const btnRef = document.getElementById('btn-operator-reference');
  const btnCloseRef = document.getElementById('btn-close-operator-ref');

  if (btnRef && refModal) {
    btnRef.addEventListener('click', () => {
      if (window.CipherAudio) window.CipherAudio.resume();
      refModal.classList.add('open');
    });
  }
  if (btnCloseRef && refModal) {
    btnCloseRef.addEventListener('click', () => {
      refModal.classList.remove('open');
    });
  }

  // Top Nav Buttons
  const navQuickDial = document.getElementById('nav-btn-quickdial');
  const navArchive = document.getElementById('nav-btn-archive');
  const navTopology = document.getElementById('nav-btn-topology');
  const navLogs = document.getElementById('nav-btn-logs');
  const navSettings = document.getElementById('nav-btn-settings');
  const navAudio = document.getElementById('nav-btn-audio');

  const qModal = document.getElementById('quickdial-modal');
  if (navQuickDial && qModal) {
    navQuickDial.addEventListener('click', () => {
      if (window.CipherAudio) window.CipherAudio.resume();
      qModal.classList.add('open');
    });
  }

  if (navArchive) {
    navArchive.addEventListener('click', () => {
      if (window.CipherAudio) window.CipherAudio.resume();
      window.CipherArchive.open();
    });
  }

  if (navTopology) {
    navTopology.addEventListener('click', () => {
      if (window.CipherAudio) window.CipherAudio.resume();
      window.CipherTopology.open();
    });
  }

  if (navLogs) {
    navLogs.addEventListener('click', () => {
      if (window.CipherAudio) window.CipherAudio.resume();
      window.AppLogger.open();
    });
  }
  const btnCloseLogs = document.getElementById('btn-close-logs');
  if (btnCloseLogs) {
    btnCloseLogs.addEventListener('click', () => window.AppLogger.close());
  }

  if (navSettings) {
    navSettings.addEventListener('click', () => {
      if (window.CipherAudio) window.CipherAudio.resume();
      window.CipherSettings.open();
    });
  }

  if (navAudio) {
    navAudio.addEventListener('click', () => {
      if (window.CipherAudio) {
        window.CipherAudio.resume();
        const isMuted = window.CipherAudio.toggleMute();
        navAudio.innerHTML = isMuted 
          ? `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> AUDIO: MUTED`
          : `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> AUDIO: ACTIVE`;
      }
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore keystrokes in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (window.CipherAudio) window.CipherAudio.resume();

    // 1-9 and 0 for vectors
    if (e.key >= '1' && e.key <= '9') {
      const vId = parseInt(e.key, 10) - 1;
      window.CipherDialer.selectVectorManual(vId);
    } else if (e.key === '0') {
      window.CipherDialer.selectVectorManual(9);
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      window.CipherDialer.executeBreach();
    } else if (e.key === 'Escape') {
      // Close any open modal or purge
      if (refModal && refModal.classList.contains('open')) {
        refModal.classList.remove('open');
      } else if (window.CipherArchive && window.CipherArchive.isOpen()) {
        window.CipherArchive.close();
      } else if (window.CipherTopology && window.CipherTopology.isOpen()) {
        window.CipherTopology.close();
      } else if (qModal && qModal.classList.contains('open')) {
        qModal.classList.remove('open');
      } else if (window.CipherSettings && window.CipherSettings.isOpen()) {
        window.CipherSettings.close();
      } else if (window.AppLogger && window.AppLogger.isOpen()) {
        window.AppLogger.close();
      } else {
        window.CipherDialer.disengage();
      }
    } else if (e.key === '?' || e.key === '/') {
      if (refModal) refModal.classList.toggle('open');
    }
  });

  // Uptime Counter in Top Bar
  const uptimeEl = document.getElementById('terminal-uptime');
  if (uptimeEl) {
    const startTime = Date.now();
    setInterval(() => {
      const diffSec = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(diffSec / 60)).padStart(2, '0');
      const s = String(diffSec % 60).padStart(2, '0');
      uptimeEl.textContent = `UPTIME: ${m}:${s}`;
    }, 1000);
  }
});
