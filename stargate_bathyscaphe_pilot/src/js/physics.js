/**
 * DSV-9 ARCHELON - Physical Ocean Dynamics & Hydrostatic Simulation
 * Computes authentic physical relationships based on current bathyscaphe depth:
 * - Hydrostatic pressure gradient
 * - Exponential thermocline temperature decay
 * - Hadopelagic seawater density equation of state
 * - Grade-5 titanium spherical hull elastic microstrain
 * - Dynamic buoyancy delta (ΔF) and vehicle trim dynamics
 */

const Physics = (() => {
  // Physical Constants & Hull Specs
  const P_SURFACE = 1.01325; // bar
  const T_SURFACE = 24.50; // °C
  const T_ABYSS = 1.20; // °C
  const THERMO_SCALE = 1200; // m
  const RHO_SURFACE = 1025.0; // kg/m³
  const CRUSH_DEPTH = 11850; // m
  const SPHERE_RADIUS = 1.05; // m (inner radius)
  const SPHERE_WALL = 0.094; // m (94mm Ti-6Al-4V)
  const E_TITANIUM = 113.8e9; // Pa (Young's Modulus)
  const YIELD_STRENGTH_MPA = 880; // MPa

  // Live Vehicle State
  const state = {
    depth: 0,
    targetDepth: 0,
    velocity: 0,
    maxVelocity: 45.0, // m/s during rapid descent
    pressureBar: 1.01325,
    temperatureC: 24.5,
    densityKgM3: 1025.0,
    hullMicrostrain: 12.4,
    elasticMarginPct: 98.8,
    buoyancyDeltaKN: 0.0,
    pitchDeg: 0.0,
    rollDeg: 0.0,
    isAscending: false,
    isDescending: false
  };

  let lastTime = performance.now();

  const update = () => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Depth integration with smooth deceleration toward target
    const depthDiff = state.targetDepth - state.depth;
    if (Math.abs(depthDiff) > 0.5) {
      const dir = Math.sign(depthDiff);
      const targetSpeed = Math.min(state.maxVelocity, Math.abs(depthDiff) * 1.5);
      
      // Accelerate / Decelerate
      if (Math.abs(state.velocity) < targetSpeed) {
        state.velocity += dir * 18.0 * dt;
      } else {
        state.velocity = dir * targetSpeed;
      }

      state.depth += state.velocity * dt;
      if ((dir > 0 && state.depth > state.targetDepth) || (dir < 0 && state.depth < state.targetDepth)) {
        state.depth = state.targetDepth;
        state.velocity = 0;
      }
    } else {
      state.depth = state.targetDepth;
      state.velocity = 0;
    }

    // Hydrostatic Pressure: P(z) = P0 + 0.1008 * z [bar]
    state.pressureBar = P_SURFACE + (0.10085 * state.depth);

    // Thermocline: T(z) = T_abyss + (T_surf - T_abyss) * e^(-z / 1200)
    state.temperatureC = T_ABYSS + (T_SURFACE - T_ABYSS) * Math.exp(-state.depth / THERMO_SCALE);

    // Seawater Density: rho(z) = rho0 + 0.0045 * z
    state.densityKgM3 = RHO_SURFACE + (0.0045 * state.depth);

    // Hull Microstrain: epsilon = (P * r) / (2 * E * t) * 1e6
    const pressurePa = state.pressureBar * 1e5;
    const stressPa = (pressurePa * SPHERE_RADIUS) / (2 * SPHERE_WALL);
    state.hullMicrostrain = (stressPa / E_TITANIUM) * 1e6;
    
    // Elastic Margin: (1 - Stress / Yield) * 100
    const stressMPa = stressPa / 1e6;
    state.elasticMarginPct = Math.max(0, ((YIELD_STRENGTH_MPA - stressMPa) / YIELD_STRENGTH_MPA) * 100);

    // Dynamic pitch/roll perturbation during movement
    if (Math.abs(state.velocity) > 0.1) {
      state.pitchDeg = Math.sin(now * 0.003) * 0.8 - (state.velocity > 0 ? 1.2 : -1.5);
      state.rollDeg = Math.cos(now * 0.002) * 0.5;
    } else {
      state.pitchDeg *= 0.95;
      state.rollDeg *= 0.95;
    }

    return state;
  };

  const setTargetDepth = (targetMeters, speedMultiplier = 1.0) => {
    state.targetDepth = Math.max(0, Math.min(CRUSH_DEPTH, targetMeters));
    state.maxVelocity = 35.0 * speedMultiplier;
  };

  const setBuoyancyDelta = (kn) => {
    state.buoyancyDeltaKN = kn;
  };

  const getState = () => state;

  return {
    update,
    setTargetDepth,
    setBuoyancyDelta,
    getState,
    CRUSH_DEPTH
  };
})();

window.Physics = Physics;
