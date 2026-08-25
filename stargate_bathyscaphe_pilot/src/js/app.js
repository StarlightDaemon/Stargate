/**
 * DSV-9 ARCHELON - Top-Level Application Orchestrator
 * Coordinates all cockpit subsystems, responsive view scaling,
 * tab navigation, keyboard controls, and real-time HUD synchronization.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Scale Engine
  const updateViewportScale = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / 1920, h / 1080);
    document.documentElement.style.setProperty('--hud-scale', scale.toFixed(4));
  };
  window.addEventListener('resize', updateViewportScale);
  updateViewportScale();

  // 2. Initialize Subsystem Modules
  Storage.logEvent('SYSTEM_BOOT', 'ARCHELON Mk VII Piloting OS initializing core subsystems');
  SoundEngine.init();
  Viewport.init();
  QuickDial.init();
  Engineering.init();
  Archive.init();
  Settings.init();
  Dialer.renderTrimBars();
  Dialer.updateUIState();

  // 3. Tab Navigation
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = {
    'panel-hud': document.getElementById('panel-hud'),
    'panel-engineering': document.getElementById('panel-engineering'),
    'panel-archive': document.getElementById('panel-archive'),
    'panel-telemetry': document.getElementById('panel-telemetry'),
    'panel-events': document.getElementById('panel-events'),
    'panel-settings': document.getElementById('panel-settings')
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      if (!targetId || !panels[targetId]) return;

      // Update tab active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update panel visibility
      Object.keys(panels).forEach(id => {
        if (panels[id]) {
          panels[id].style.display = (id === targetId) ? (id === 'panel-hud' ? 'grid' : 'flex') : 'none';
        }
      });

      SoundEngine.playSolenoidClick();
      Storage.logEvent('NAV_SYSTEM', `Switched view to subsystem: ${tab.querySelector('.tab-label').textContent}`);

      if (targetId === 'panel-events') {
        renderEventLogFeed();
      }
    });
  });

  // 4. Core Cockpit Event Bindings
  // Waypoint clicks delegation
  document.addEventListener('click', (e) => {
    const wpBtn = e.target.closest('.waypoint-btn');
    if (wpBtn) {
      const idx = parseInt(wpBtn.getAttribute('data-wp-index'), 10);
      if (!isNaN(idx)) {
        Dialer.selectWaypoint(idx);
      }
    }
  });

  // Safety Interlock Toggle
  const interlockToggle = document.getElementById('safety-interlock-toggle');
  if (interlockToggle) {
    interlockToggle.addEventListener('click', () => {
      Dialer.toggleInterlock();
    });
  }

  // Primary Actuation Button
  const actBtn = document.getElementById('btn-commence-descent');
  if (actBtn) {
    actBtn.addEventListener('click', () => {
      Dialer.commenceDescent();
    });
  }

  // Emergency Ascent / Blow Ballast Button
  const emergBtn = document.getElementById('btn-emergency-blow');
  if (emergBtn) {
    emergBtn.addEventListener('click', () => {
      Dialer.emergencyBlowBallast();
    });
  }

  // Audio Toggle Button
  const audioToggleBtn = document.getElementById('btn-audio-toggle');
  const audioIcon = document.getElementById('audio-icon-indicator');
  const audioLabel = document.getElementById('audio-state-label');

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      const isMuted = SoundEngine.toggleMute();
      if (audioIcon) audioIcon.textContent = isMuted ? '🔇' : '🔊';
      if (audioLabel) audioLabel.textContent = isMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
      SoundEngine.playSolenoidClick();
    });
  }

  // Operator Reference Manual Modal
  const helpBtn = document.getElementById('btn-operator-help');
  const helpModal = document.getElementById('modal-operator-help');
  const helpClose = document.getElementById('btn-close-help');
  const helpDismiss = document.getElementById('btn-dismiss-help');

  const openHelp = () => {
    if (helpModal) {
      helpModal.style.display = 'flex';
      helpModal.setAttribute('aria-hidden', 'false');
      SoundEngine.playSolenoidClick();
      Storage.logEvent('OPERATOR', 'Opened Operator Reference Manual');
    }
  };

  const closeHelp = () => {
    if (helpModal) {
      helpModal.style.display = 'none';
      helpModal.setAttribute('aria-hidden', 'true');
      SoundEngine.playSolenoidClick();
    }
  };

  if (helpBtn) helpBtn.addEventListener('click', openHelp);
  if (helpClose) helpClose.addEventListener('click', closeHelp);
  if (helpDismiss) helpDismiss.addEventListener('click', closeHelp);

  // 5. Live Telemetry Subsystem Table Updater
  const populateTelemetryTable = () => {
    const tbody = document.getElementById('telemetry-table-body');
    if (!tbody) return;

    const rows = [
      { sys: 'HULL INTEGRITY', ch: 'CH-01 // TI-SPHERE STRAIN', val: '12.4 με', norm: '< 45.0 με', stat: 'NOMINAL' },
      { sys: 'BALLAST HYDRAULICS', ch: 'CH-02 // MANIFOLD PRESSURE', val: '450 BAR', norm: '400 - 500 BAR', stat: 'NOMINAL' },
      { sys: 'LIFE SUPPORT', ch: 'CH-03 // O2 PARTIAL PRESSURE', val: '0.210 BAR', norm: '0.190 - 0.230 BAR', stat: 'OPTIMAL' },
      { sys: 'POWER GRID', ch: 'CH-04 // LI-PO BUS VOLTAGE', val: '128.4 VDC', norm: '115 - 135 VDC', stat: 'OPTIMAL' },
      { sys: 'VECTORED THRUST', ch: 'CH-05 // MAGNETIC COUPLING', val: '99.8%', norm: '> 95.0%', stat: 'LOCKED' },
      { sys: 'PORTAL APERTURE', ch: 'CH-06 // HARMONIC COHERENCE', val: '0.994 Ψ', norm: '> 0.950 Ψ', stat: 'SYNCHRONIZED' }
    ];

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${r.sys}</strong></td>
        <td>${r.ch}</td>
        <td class="text-cyan">${r.val}</td>
        <td>${r.norm}</td>
        <td><span class="text-emerald">● ${r.stat}</span></td>
      </tr>
    `).join('');
  };
  populateTelemetryTable();

  // 6. Session Event Log Feed Renderer
  const renderEventLogFeed = () => {
    const feed = document.getElementById('event-log-feed');
    const countTag = document.getElementById('log-count-tag');
    if (!feed) return;

    const events = Storage.getSessionEvents();
    if (countTag) countTag.textContent = `${events.length} EVENTS RECORDED`;

    feed.innerHTML = events.map(ev => `
      <div class="log-item ${ev.level === 'warn' ? 'log-warn' : (ev.level === 'alert' ? 'log-alert' : '')}">
        <span class="log-time">[${ev.time}]</span>
        <span class="log-source">[${ev.source}]</span>
        <span class="log-msg">${ev.message}</span>
      </div>
    `).join('');
  };

  window.onNewSessionEvent = () => {
    const feed = document.getElementById('event-log-feed');
    if (feed && feed.offsetParent !== null) {
      renderEventLogFeed();
    }
  };

  const btnExportLog = document.getElementById('btn-export-log');
  if (btnExportLog) {
    btnExportLog.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(Storage.getSessionEvents(), null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `archelon_session_log_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  const btnClearLog = document.getElementById('btn-clear-log');
  if (btnClearLog) {
    btnClearLog.addEventListener('click', () => {
      Storage.clearSessionEvents();
      renderEventLogFeed();
    });
  }

  // 7. Live Clock & Geolocation Coordinate Ticker
  const clockEl = document.getElementById('live-utc-clock');
  setInterval(() => {
    if (clockEl) {
      const d = new Date();
      clockEl.textContent = `UTC ${d.toTimeString().split(' ')[0]}`;
    }
  }, 1000);

  // 8. Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore when typing in search input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    // Number keys 1-8 for waypoints
    if (e.key >= '1' && e.key <= '8') {
      const idx = parseInt(e.key, 10) - 1;
      Dialer.selectWaypoint(idx);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      Dialer.commenceDescent();
    } else if (e.key === 'Escape') {
      Dialer.emergencyBlowBallast();
      closeHelp();
    } else if (e.key === 'p' || e.key === 'P') {
      const toggleBtn = document.getElementById('btn-quickdial-toggle');
      if (toggleBtn) toggleBtn.click();
    } else if (e.key === 'm' || e.key === 'M') {
      if (audioToggleBtn) audioToggleBtn.click();
    } else if (e.key === '?') {
      openHelp();
    }
  });

  Storage.logEvent('SYSTEM_READY', 'All systems online. DSV-9 ARCHELON ready for deep hadal descent.');
});
