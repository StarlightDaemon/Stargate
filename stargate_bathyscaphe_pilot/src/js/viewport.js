/**
 * DSV-9 ARCHELON - Viewport Particle Visualizer & Crush-Depth Gauge Ring Engine
 * Renders:
 * - Real-time canvas marine snow & abyssal particle physics
 * - Dimensional portal rift vortex during breakthrough and sustained active stages
 * - SVG Crush-Depth instrument ring with calibrated depth arc and locked waypoint chevrons
 * - Digital pilot HUD HUD overlays
 */

const Viewport = (() => {
  let canvas = null;
  let ctx = null;
  let particles = [];
  const PARTICLE_COUNT = 85;

  // Concentric SVG ring elements
  let svgDepthArc = null;
  let svgGaugeTicks = null;
  let svgWaypointMarkers = null;

  // Digital HUD elements
  let hudDepthDisplay = null;
  let hudPressureDisplay = null;
  let hudVelocityDisplay = null;
  let hudHullStressDisplay = null;
  let hudStrataTag = null;
  let meterPitchBar = null;
  let meterPitchVal = null;
  let meterRollBar = null;
  let meterRollVal = null;
  let meterTempBar = null;
  let meterTempVal = null;

  const init = () => {
    canvas = document.getElementById('viewport-canvas');
    if (canvas) {
      ctx = canvas.getContext('2d');
      initParticles();
    }

    svgDepthArc = document.getElementById('svg-depth-arc');
    svgGaugeTicks = document.getElementById('svg-gauge-ticks');
    svgWaypointMarkers = document.getElementById('svg-waypoint-markers');

    hudDepthDisplay = document.getElementById('hud-depth-display');
    hudPressureDisplay = document.getElementById('hud-pressure-display');
    hudVelocityDisplay = document.getElementById('hud-velocity-display');
    hudHullStressDisplay = document.getElementById('hud-hull-stress-display');
    hudStrataTag = document.getElementById('hud-strata-tag');

    meterPitchBar = document.getElementById('meter-pitch-bar');
    meterPitchVal = document.getElementById('meter-pitch-val');
    meterRollBar = document.getElementById('meter-roll-bar');
    meterRollVal = document.getElementById('meter-roll-val');
    meterTempBar = document.getElementById('meter-temp-bar');
    meterTempVal = document.getElementById('meter-temp-val');

    buildGaugeTicks();
    buildWaypointMarkers();
    requestAnimationFrame(renderLoop);
  };

  const initParticles = () => {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * 640,
        y: Math.random() * 640,
        size: 0.8 + Math.random() * 2.2,
        speedY: 0.2 + Math.random() * 0.8,
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: 0.15 + Math.random() * 0.65,
        color: Math.random() > 0.85 ? '#00ff9d' : '#00e5ff'
      });
    }
  };

  /**
   * Build SVG Gauge Ticks along 0 to 12,000m (270° arc from top clockwise)
   */
  const buildGaugeTicks = () => {
    if (!svgGaugeTicks) return;
    let ticksHtml = '';
    const cx = 300, cy = 300, r = 260;
    const totalTicks = 24;

    for (let i = 0; i <= totalTicks; i++) {
      // Angle spans from -90deg (top) to +180deg (bottom-left)
      const angleDeg = -90 + (i / totalTicks) * 270;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x1 = cx + Math.cos(angleRad) * (r - (i % 4 === 0 ? 12 : 6));
      const y1 = cy + Math.sin(angleRad) * (r - (i % 4 === 0 ? 12 : 6));
      const x2 = cx + Math.cos(angleRad) * r;
      const y2 = cy + Math.sin(angleRad) * r;

      const isMajor = i % 4 === 0;
      ticksHtml += `
        <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" 
              stroke="${isMajor ? 'rgba(0, 229, 255, 0.6)' : 'rgba(0, 229, 255, 0.2)'}" 
              stroke-width="${isMajor ? 2 : 1}" />
      `;

      if (isMajor) {
        const depthVal = Math.round((i / totalTicks) * 12000);
        const tx = cx + Math.cos(angleRad) * (r - 22);
        const ty = cy + Math.sin(angleRad) * (r - 22);
        ticksHtml += `
          <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="rgba(0, 229, 255, 0.6)" 
                font-family="var(--font-mono)" font-size="8" text-anchor="middle" dominant-baseline="central">
            ${depthVal > 0 ? (depthVal / 1000) + 'k' : '0'}
          </text>
        `;
      }
    }

    svgGaugeTicks.innerHTML = ticksHtml;
  };

  /**
   * Build Waypoint Markers on the SVG instrument ring
   */
  const buildWaypointMarkers = () => {
    if (!svgWaypointMarkers || !window.Dialer) return;
    const waypoints = Dialer.WAYPOINTS;
    const cx = 300, cy = 300, r = 242;

    svgWaypointMarkers.innerHTML = waypoints.map((wp) => {
      const frac = Math.min(1, wp.depth / 12000);
      const angleDeg = -90 + frac * 270;
      const angleRad = (angleDeg * Math.PI) / 180;
      const px = cx + Math.cos(angleRad) * r;
      const py = cy + Math.sin(angleRad) * r;

      return `
        <g class="svg-wp-marker" id="svg-marker-${wp.id}">
          <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="rgba(0, 229, 255, 0.2)" stroke="rgba(0, 229, 255, 0.6)" stroke-width="1.5" />
        </g>
      `;
    }).join('');
  };

  /**
   * Main Render Loop
   */
  const renderLoop = () => {
    const phys = Physics.update();
    const dialerState = (window.Dialer && window.Dialer.getDialerState()) || 'IDLE';

    // 1. Render Canvas Particles
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Depth lighting ambient backdrop
      const depthFrac = Math.min(1, phys.depth / 11800);
      const grad = ctx.createRadialGradient(320, 320, 20, 320, 320, 320);
      if (dialerState === 'SUSTAINED_ACTIVE') {
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
        grad.addColorStop(0.4, 'rgba(0, 255, 157, 0.18)');
        grad.addColorStop(1, 'rgba(0, 4, 12, 0.95)');
      } else {
        const topAlpha = Math.max(0.04, 0.28 * (1 - depthFrac));
        grad.addColorStop(0, `rgba(0, 180, 255, ${topAlpha})`);
        grad.addColorStop(0.7, 'rgba(1, 6, 16, 0.7)');
        grad.addColorStop(1, 'rgba(0, 2, 6, 0.95)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Marine Snow / Particles
      const speedMultiplier = phys.velocity > 0 ? (1 + phys.velocity * 0.12) : 1;
      const isVortexActive = dialerState === 'SUSTAINED_ACTIVE' || dialerState === 'BREAKTHROUGH';

      particles.forEach((p, idx) => {
        if (isVortexActive) {
          // Vortex spiral motion toward center (320, 320)
          const dx = p.x - 320;
          const dy = p.y - 320;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) + 0.04;
          const newDist = Math.max(20, dist - 1.5);
          
          p.x = 320 + Math.cos(angle) * newDist;
          p.y = 320 + Math.sin(angle) * newDist;

          if (newDist <= 25) {
            p.x = Math.random() * 640;
            p.y = Math.random() * 640;
          }
        } else {
          // Standard upward/downward drift relative to bathyscaphe movement
          p.y += (p.speedY * speedMultiplier) + (phys.velocity > 0 ? 1.5 : 0);
          p.x += p.speedX;

          if (p.y > 640) p.y = 0;
          if (p.y < 0) p.y = 640;
          if (p.x > 640) p.x = 0;
          if (p.x < 0) p.x = 640;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (isVortexActive ? 0.9 : (1 - depthFrac * 0.4));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (isVortexActive ? 1.4 : 1), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    }

    // 2. Update SVG Crush-Depth Gauge Arc
    if (svgDepthArc) {
      const cx = 300, cy = 300, r = 260;
      const frac = Math.min(1, phys.depth / 12000);
      const angleDeg = -90 + frac * 270;
      const angleRad = (angleDeg * Math.PI) / 180;
      const startX = cx;
      const startY = cy - r;
      const endX = cx + Math.cos(angleRad) * r;
      const endY = cy + Math.sin(angleRad) * r;
      const largeArc = frac > (180 / 270) ? 1 : 0;

      if (frac <= 0.001) {
        svgDepthArc.setAttribute('d', `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${startX} ${startY}`);
      } else {
        svgDepthArc.setAttribute('d', `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`);
      }
    }

    // 3. Update Waypoint Marker Lock Status on SVG Ring
    if (window.Dialer) {
      const locked = Dialer.getLockedWaypoints();
      Dialer.WAYPOINTS.forEach(wp => {
        const markerEl = document.getElementById(`svg-marker-${wp.id}`);
        if (markerEl) {
          const isLock = locked.some(w => w.id === wp.id);
          const circle = markerEl.querySelector('circle');
          if (circle) {
            circle.setAttribute('fill', isLock ? 'var(--accent-emerald)' : 'rgba(0, 229, 255, 0.2)');
            circle.setAttribute('stroke', isLock ? '#ffffff' : 'rgba(0, 229, 255, 0.6)');
            circle.setAttribute('r', isLock ? '6' : '4');
          }
        }
      });
    }

    // 4. Update Central Digital Readouts
    if (hudDepthDisplay) {
      hudDepthDisplay.textContent = Math.round(phys.depth).toLocaleString('en-US', { minimumIntegerDigits: 5 });
    }
    if (hudPressureDisplay) {
      hudPressureDisplay.textContent = `${phys.pressureBar.toFixed(1)} BAR`;
    }
    if (hudVelocityDisplay) {
      hudVelocityDisplay.textContent = `${Math.abs(phys.velocity).toFixed(1)} M/S`;
    }
    if (hudHullStressDisplay) {
      hudHullStressDisplay.textContent = `${phys.elasticMarginPct.toFixed(1)}%`;
      hudHullStressDisplay.className = phys.elasticMarginPct > 50 ? 'stat-val text-emerald' : 'stat-val text-red';
    }
    if (hudStrataTag) {
      if (phys.depth < 1000) hudStrataTag.textContent = 'EPIPELAGIC ZONE';
      else if (phys.depth < 4000) hudStrataTag.textContent = 'MESOPELAGIC ZONE';
      else if (phys.depth < 6000) hudStrataTag.textContent = 'BATHYPELAGIC RIDGE';
      else if (phys.depth < 8500) hudStrataTag.textContent = 'ABYSSOPELAGIC CHASM';
      else if (phys.depth < 11500) hudStrataTag.textContent = 'HADAL TRENCH FLOOR';
      else hudStrataTag.textContent = 'ABYSSAL GATEWAY HORIZON';
    }

    // 5. Update Bottom Sub-Meters
    if (meterPitchBar && meterPitchVal) {
      const pitchPct = Math.min(100, Math.max(0, 50 + (phys.pitchDeg * 10)));
      meterPitchBar.style.width = `${pitchPct}%`;
      meterPitchVal.textContent = `${phys.pitchDeg >= 0 ? '+' : ''}${phys.pitchDeg.toFixed(1)}°`;
    }
    if (meterRollBar && meterRollVal) {
      const rollPct = Math.min(100, Math.max(0, 50 + (phys.rollDeg * 10)));
      meterRollBar.style.width = `${rollPct}%`;
      meterRollVal.textContent = `${phys.rollDeg >= 0 ? '+' : ''}${phys.rollDeg.toFixed(1)}°`;
    }
    if (meterTempBar && meterTempVal) {
      const tempPct = Math.min(100, Math.max(5, (phys.temperatureC / 25) * 100));
      meterTempBar.style.width = `${tempPct}%`;
      meterTempVal.textContent = `${phys.temperatureC.toFixed(1)}°C`;
    }

    // 6. Update Telemetry Matrix Live Readouts (if open)
    const telePressure = document.getElementById('telemetry-pressure-live');
    const teleTemp = document.getElementById('telemetry-temp-live');
    const teleStrain = document.getElementById('telemetry-strain-live');
    const teleDensity = document.getElementById('telemetry-density-live');
    const teleDepthRef = document.getElementById('tele-depth-ref');

    if (telePressure) telePressure.textContent = `${phys.pressureBar.toFixed(2)} BAR (${(phys.pressureBar * 14.5038).toFixed(1)} PSI)`;
    if (teleTemp) teleTemp.textContent = `${phys.temperatureC.toFixed(2)} °C (${((phys.temperatureC * 9/5) + 32).toFixed(1)} °F)`;
    if (teleStrain) teleStrain.textContent = `${phys.hullMicrostrain.toFixed(1)} με (Elastic Margin ${phys.elasticMarginPct.toFixed(1)}%)`;
    if (teleDensity) teleDensity.textContent = `${phys.densityKgM3.toFixed(1)} kg/m³`;
    if (teleDepthRef) teleDepthRef.textContent = `${Math.round(phys.depth)} m`;

    requestAnimationFrame(renderLoop);
  };

  return {
    init
  };
})();

window.Viewport = Viewport;
