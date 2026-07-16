/**
 * requestAnimationFrame ring-rotation controller, after the archived
 * SG_MK7/stargate-dialing-console approach: the machine owns the phase, the
 * UI owns the motion, and reports back with ROTATION_COMPLETE when the target
 * glyph reaches the master chevron. Trapezoidal velocity profile (accelerate,
 * cruise, decelerate) instead of the console's fixed degrees-per-frame.
 */

import { useEffect, useRef, useState } from 'react';
import {
  GLYPH_ANGLE_DEG,
  RING_ACCEL_DEG_S2,
  RING_MAX_VELOCITY_DEG_S,
} from '../state/constants';

interface RingControllerInput {
  aligning: boolean;
  targetGlyph: number | null;
  symbolIndex: number;
  onRotationComplete: () => void;
}

const norm360 = (deg: number): number => ((deg % 360) + 360) % 360;

export function useRingController({
  aligning,
  targetGlyph,
  symbolIndex,
  onRotationComplete,
}: RingControllerInput): number {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const completeRef = useRef(onRotationComplete);
  completeRef.current = onRotationComplete;

  useEffect(() => {
    if (!aligning || targetGlyph === null) return;

    // Rotate so the target glyph sits at the top (master chevron). The glyph
    // ring draws glyph g at angle g * GLYPH_ANGLE_DEG, so the ring must end
    // at -g * GLYPH_ANGLE_DEG (mod 360).
    const finalAngle = norm360(-targetGlyph * GLYPH_ANGLE_DEG);
    const direction = symbolIndex % 2 === 0 ? 1 : -1;
    const start = rotationRef.current;
    let travel =
      direction === 1 ? norm360(finalAngle - norm360(start)) : norm360(norm360(start) - finalAngle);
    if (travel < 60) travel += 360; // always a readable sweep

    let travelled = 0;
    let velocity = 0;
    let last: number | null = null;
    let raf = 0;
    let done = false;

    const step = (now: number) => {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const remaining = travel - travelled;
      // Decelerate when the stopping distance reaches the remaining travel.
      const stoppingDistance = (velocity * velocity) / (2 * RING_ACCEL_DEG_S2);
      if (remaining <= stoppingDistance) {
        velocity = Math.max(velocity - RING_ACCEL_DEG_S2 * dt, 8);
      } else {
        velocity = Math.min(velocity + RING_ACCEL_DEG_S2 * dt, RING_MAX_VELOCITY_DEG_S);
      }

      travelled = Math.min(travelled + velocity * dt, travel);
      const value = start + direction * travelled;
      rotationRef.current = value;
      setRotation(value);

      if (travelled >= travel) {
        if (!done) {
          done = true;
          rotationRef.current = start + direction * travel;
          setRotation(rotationRef.current);
          completeRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [aligning, targetGlyph, symbolIndex]);

  return rotation;
}
