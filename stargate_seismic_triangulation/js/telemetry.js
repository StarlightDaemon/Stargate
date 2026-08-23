/**
 * telemetry.js - Seismological Telemetry, Station Database & Focal Mechanism Math
 * Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9)
 */

const SEISMIC_STATIONS = [
  { id: 'ST-01', code: 'BLANCO_BH1', name: 'Cape Blanco Borehole', angle: 0, lat: 42.84, lng: -124.56, pVel: 8.1, noiseRms: 0.12 },
  { id: 'ST-02', code: 'JDF_OBS', name: 'Juan de Fuca Deep OBS', angle: 36, lat: 46.22, lng: -129.18, pVel: 7.8, noiseRms: 0.18 },
  { id: 'ST-03', code: 'OLYMPIC_BB', name: 'Olympic Peninsula BB', angle: 72, lat: 47.75, lng: -123.85, pVel: 8.0, noiseRms: 0.14 },
  { id: 'ST-04', code: 'CASCADIA_DEEP', name: 'Cascadia Trench SMR', angle: 108, lat: 44.50, lng: -125.20, pVel: 7.9, noiseRms: 0.16 },
  { id: 'ST-05', code: 'NEWBERRY_CAL', name: 'Newberry Caldera BH', angle: 144, lat: 43.72, lng: -121.23, pVel: 7.7, noiseRms: 0.11 },
  { id: 'ST-06', code: 'GORDA_RIDGE', name: 'Gorda Hydrothermal', angle: 180, lat: 41.00, lng: -127.50, pVel: 7.9, noiseRms: 0.19 },
  { id: 'ST-07', code: 'RAINIER_LP', name: 'Mt Rainier Lithoprobe', angle: 216, lat: 46.85, lng: -121.76, pVel: 8.2, noiseRms: 0.13 },
  { id: 'ST-08', code: 'SEDONA_BH', name: 'Sedona Craton Ref', angle: 252, lat: 34.87, lng: -111.76, pVel: 8.3, noiseRms: 0.09 },
  { id: 'ST-09', code: 'ASTORIA_FAN', name: 'Astoria Submarine OBS', angle: 288, lat: 45.90, lng: -126.10, pVel: 7.9, noiseRms: 0.15 },
  { id: 'ST-10', code: 'SHASTA_CRUST', name: 'Mt Shasta Crustal', angle: 324, lat: 41.42, lng: -122.20, pVel: 8.1, noiseRms: 0.12 }
];

const PRELOADED_FAULT_PRESETS = [
  // Tier 1: Monitored Subduction Faults
  {
    id: 'preset-cascadia',
    tier: 1,
    tierName: 'Monitored Subduction Faults',
    name: 'Cascadia Megathrust Slip Zone',
    region: 'Subduction Interface / Oregon-WA Margin',
    mw: 8.8,
    depthKm: 24.5,
    strike: 350,
    dip: 12,
    rake: 90,
    stations: [0, 1, 3, 2, 6, 8, 9] // 7 stations
  },
  {
    id: 'preset-queencharlotte',
    tier: 1,
    tierName: 'Monitored Subduction Faults',
    name: 'Queen Charlotte Transform Fault',
    region: 'Pacific-North American Shear Boundary',
    mw: 7.9,
    depthKm: 15.2,
    strike: 325,
    dip: 85,
    rake: 175,
    stations: [1, 2, 0, 8, 6, 4, 7]
  },
  {
    id: 'preset-sanandreas',
    tier: 1,
    tierName: 'Monitored Subduction Faults',
    name: 'San Andreas Northern Splice',
    region: 'Mendocino Extension / Point Arena',
    mw: 7.4,
    depthKm: 10.8,
    strike: 310,
    dip: 90,
    rake: 180,
    stations: [0, 5, 9, 4, 7, 3, 1]
  },

  // Tier 2: Deep Mantle Ultra-Active Zones
  {
    id: 'preset-gorda',
    tier: 2,
    tierName: 'Deep Mantle Ultra-Active Zones',
    name: 'Gorda Plate Slab Tear',
    region: 'Intra-Slab Mantle Wedge Rupture',
    mw: 9.1,
    depthKm: 48.0,
    strike: 45,
    dip: 45,
    rake: -90,
    stations: [5, 0, 1, 9, 3, 8, 4]
  },
  {
    id: 'preset-mendocino',
    tier: 2,
    tierName: 'Deep Mantle Ultra-Active Zones',
    name: 'Mendocino Triple Junction Shear',
    region: 'Lithospheric Boundary Collision Knot',
    mw: 8.6,
    depthKm: 32.4,
    strike: 270,
    dip: 60,
    rake: 45,
    stations: [5, 9, 0, 4, 7, 1, 3]
  },
  {
    id: 'preset-explorer',
    tier: 2,
    tierName: 'Deep Mantle Ultra-Active Zones',
    name: 'Explorer Sub-Crustal Breach',
    region: 'Northern Juan de Fuca Microplate',
    mw: 8.3,
    depthKm: 41.2,
    strike: 15,
    dip: 30,
    rake: -45,
    stations: [2, 1, 8, 6, 0, 3, 7]
  }
];

class TelemetryEngine {
  constructor() {
    this.stations = SEISMIC_STATIONS;
    this.presets = PRELOADED_FAULT_PRESETS;
  }

  /**
   * Triangulation Solver: calculates epicenter coordinates, error ellipse,
   * depth and magnitude based on locked stations.
   */
  solveTriangulation(lockedIndices, centerX, centerY, arrayRadius) {
    const count = lockedIndices.length;
    if (count === 0) {
      return {
        resolved: false,
        x: centerX,
        y: centerY,
        lat: 44.50,
        lng: -124.80,
        depthKm: 0.0,
        mw: 0.0,
        ellipseA: 180,
        ellipseB: 140,
        ellipseAngle: 0,
        rmsResidual: 1.84,
        coherencePercent: 0,
        strike: 0,
        dip: 0,
        rake: 0
      };
    }

    // Centroid of locked stations with slight bias toward subduction zone center
    let sumX = 0;
    let sumY = 0;
    let weightSum = 0;

    lockedIndices.forEach(idx => {
      const st = this.stations[idx];
      const rad = (st.angle - 90) * (Math.PI / 180);
      const stX = centerX + Math.cos(rad) * arrayRadius;
      const stY = centerY + Math.sin(rad) * arrayRadius;
      sumX += stX;
      sumY += stY;
      weightSum += 1;
    });

    const avgX = sumX / weightSum;
    const avgY = sumY / weightSum;

    // Pull toward center with non-linear convergence as count increases
    const convergenceFactor = Math.min(1.0, count / 7.0);
    const targetEpicenterX = centerX + (avgX - centerX) * (1 - convergenceFactor * 0.7);
    const targetEpicenterY = centerY + (avgY - centerY) * (1 - convergenceFactor * 0.7);

    // Error ellipse shrinks as more stations lock (7 stations = tight focal point)
    const ellipseA = Math.max(12, 180 * Math.pow(0.68, count));
    const ellipseB = Math.max(8, 130 * Math.pow(0.65, count));
    const ellipseAngle = (lockedIndices[0] * 36 + count * 15) % 180;

    // Magnitude and depth evolution
    const baseMw = 5.2 + count * 0.48;
    const depth = 12.0 + count * 3.8;
    const coherence = Math.min(100, Math.round((count / 7.0) * 98.4));
    const rms = Math.max(0.04, +(1.84 - count * 0.25).toFixed(2));

    // Focal mechanism angles derived from array distribution
    const strike = (lockedIndices[0] * 36 + 320) % 360;
    const dip = Math.min(88, 15 + count * 10);
    const rake = (count % 2 === 0) ? 90 : 175;

    return {
      resolved: count >= 7,
      x: targetEpicenterX,
      y: targetEpicenterY,
      lat: +(42.5 + (targetEpicenterY - centerY) * 0.015).toFixed(3),
      lng: +(-125.0 + (targetEpicenterX - centerX) * 0.015).toFixed(3),
      depthKm: +depth.toFixed(1),
      mw: +baseMw.toFixed(1),
      ellipseA,
      ellipseB,
      ellipseAngle,
      rmsResidual: rms,
      coherencePercent: coherence,
      strike,
      dip,
      rake
    };
  }

  /**
   * Draw Focal Mechanism Double-Couple Beachball
   */
  renderBeachball(canvas, strike = 350, dip = 45, rake = 90) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const r = (Math.min(w, h) / 2) - 2;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Outer circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0f223a';
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Compressive quadrants (shaded)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#00e5ff';
    const radStrike = (strike - 90) * (Math.PI / 180);

    ctx.translate(cx, cy);
    ctx.rotate(radStrike);

    // First nodal plane curve
    const dipRatio = Math.cos(dip * (Math.PI / 180));
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * dipRatio, 0, 0, Math.PI);
    ctx.lineTo(r, 0);
    ctx.arc(0, 0, r, 0, Math.PI, false);
    ctx.fill();

    // Second quadrant based on rake
    if (Math.abs(rake) < 135) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.85, r * dipRatio * 0.8, 0, Math.PI, Math.PI * 2);
      ctx.lineTo(-r, 0);
      ctx.arc(0, 0, r, Math.PI, Math.PI * 2, false);
      ctx.fill();
    }

    ctx.restore();

    // Center crosshair
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy);
    ctx.lineTo(cx + 4, cy);
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx, cy + 4);
    ctx.stroke();
  }
}

window.seismicTelemetry = new TelemetryEngine();
