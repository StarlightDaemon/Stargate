/**
 * Tunable timing / mechanical parameters for the gate.
 * Phase timings derive from the design-07 foundation spec; attract-mode
 * timings are compressed so the loop reads well unattended.
 */

// Dialing phase (per symbol)
export const ALIGNMENT_TIMEOUT_MS = 8000; // watchdog if the UI rotation controller never reports
export const ALIGNMENT_SETTLE_TIME_MS = 250;
export const CHEVRON_LOCK_DURATION_MS = 650;

// Connection phase
export const IGNITION_DURATION_MS = 500;
export const KAWOOSH_DURATION_MS = 1400;
export const SHIELDED_IGNITION_DURATION_MS = 500;
export const STABILIZATION_DURATION_MS = 1500;
export const STEADY_MAX_DURATION_MS = 38 * 60 * 1000; // the canonical 38-minute wormhole ceiling
export const DISCONNECT_DECAY_MS = 900;

// Cooldown
export const COOLDOWN_MS = 4000;
export const ABORT_COOLDOWN_MS = 1800;

// Iris
export const IRIS_TRANSIT_MS = 1100;

// Idle / attract mode
export const ATTRACT_DELAY_MS = 45_000; // idle time before the gate starts dialing on its own
export const ATTRACT_STEADY_MS = 8000; // wormhole hold during attract loop
export const ATTRACT_COOLDOWN_MS = 2500;

// Ring geometry
export const TOTAL_GLYPHS = 39;
export const GLYPH_ANGLE_DEG = 360 / TOTAL_GLYPHS;
export const ADDRESS_LENGTH = 7; // six coordinates + point of origin
export const TOTAL_CHEVRONS = 9;
export const ORIGIN_GLYPH = 0;

// Ring rotation physics (consumed by the rAF controller, mirrored here for tests)
export const RING_MAX_VELOCITY_DEG_S = 65;
export const RING_ACCEL_DEG_S2 = 55;
