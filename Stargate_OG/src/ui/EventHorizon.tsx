/**
 * Canvas event horizon, after the archived dialing-console renderer:
 * low-res radial gradient pool with time-perturbed concentric ripples, plus
 * the named Kawoosh Burst — an expanding vortex flare on ignition. A shielded
 * ignition (iris closed) skips the burst and renders a dim pressure glow.
 */

import { useEffect, useRef } from 'react';

export type HorizonPhase =
  | 'off'
  | 'ignition'
  | 'kawoosh'
  | 'shielded'
  | 'stabilization'
  | 'steady'
  | 'collapse';

const SIZE = 240;

export function EventHorizon({ phase }: { phase: HorizonPhase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const phaseStartRef = useRef(performance.now());

  if (phaseRef.current !== phase) {
    phaseRef.current = phase;
    phaseStartRef.current = performance.now();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = SIZE;
    canvas.height = SIZE;

    let raf = 0;
    const c = SIZE / 2;

    const draw = (now: number) => {
      const p = phaseRef.current;
      const t = now / 1000;
      const sincePhase = (now - phaseStartRef.current) / 1000;
      ctx.clearRect(0, 0, SIZE, SIZE);

      if (p !== 'off') {
        // Base pool. Dim during ignition/shielded, full during steady.
        const level =
          p === 'ignition'
            ? Math.min(sincePhase / 0.5, 1) * 0.45
            : p === 'shielded'
              ? 0.5
              : p === 'collapse'
                ? Math.max(1 - sincePhase / 0.9, 0)
                : 1;

        const gradient = ctx.createRadialGradient(c, c, 8, c, c, c);
        gradient.addColorStop(0, `rgba(186, 230, 253, ${0.95 * level})`);
        gradient.addColorStop(0.55, `rgba(14, 165, 233, ${0.85 * level})`);
        gradient.addColorStop(1, `rgba(7, 25, 48, ${0.9 * level})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(c, c, c - 1, 0, Math.PI * 2);
        ctx.fill();

        // Time-perturbed concentric ripples.
        ctx.lineWidth = 1.5;
        for (let r = 12; r < c - 4; r += 7) {
          const distortion = Math.sin(r * 0.22 - t * 4.5) * 2.2;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 * level})`;
          ctx.beginPath();
          ctx.arc(c, c, r + distortion, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Luminance pulse at the middle.
        const pulse = Math.sin(t * 2.6) * 4;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.28 * level})`;
        ctx.beginPath();
        ctx.arc(c, c, 14 + pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p === 'kawoosh') {
        // Kawoosh Burst: shock ring + turbulent core surging outward, then
        // falling back into the pool.
        const k = Math.min(sincePhase / 1.4, 1);
        const surge = Math.sin(k * Math.PI); // out and back
        const radius = 10 + surge * (c - 12);
        ctx.strokeStyle = `rgba(224, 242, 254, ${0.85 * surge})`;
        ctx.lineWidth = 6 * surge + 1;
        ctx.beginPath();
        ctx.arc(c, c, radius, 0, Math.PI * 2);
        ctx.stroke();

        const core = ctx.createRadialGradient(c, c, 2, c, c, radius);
        core.addColorStop(0, `rgba(255, 255, 255, ${0.9 * surge})`);
        core.addColorStop(1, 'rgba(125, 211, 252, 0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(c, c, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p === 'shielded') {
        // Suppressed ignition: energy pressing against the closed iris.
        const flicker = 0.5 + Math.sin(t * 17) * 0.08 + Math.sin(t * 5.1) * 0.06;
        ctx.fillStyle = `rgba(56, 189, 248, ${0.12 * flicker})`;
        ctx.beginPath();
        ctx.arc(c, c, c - 2, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className={`horizon horizon--${phase}`} aria-hidden="true" />;
}
