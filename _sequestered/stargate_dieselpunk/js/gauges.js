// gauges.js — round instrument factory. Instances deliberately differ:
// bezel size, face tint, tilt, scale style — mixed makers, one machine hall.

import { polar, jit, rng } from './util.js';
import { clamp } from './util.js';

const needles = {};

export function makeGauge(o) {
  const {
    id, x, y, r, label, sub = '', min, max, tilt = 0,
    a0 = -128, a1 = 128, face = '#d8cdb4', majors = 6, redFrom = null,
  } = o;

  let ticks = '';
  for (let i = 0; i <= majors; i++) {
    const f = i / majors;
    const ang = a0 + (a1 - a0) * f;
    const [x0, y0] = polar(0, 0, r * 0.78, ang);
    const [x1, y1] = polar(0, 0, r * 0.64, ang);
    ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#2e2a1e" stroke-width="${r * 0.035}"/>`;
    const [tx, ty] = polar(0, 0, r * 0.5, ang);
    const v = min + (max - min) * f;
    ticks += `<text x="${tx.toFixed(1)}" y="${(ty + r * 0.05).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-size="${(r * 0.16).toFixed(0)}" fill="#3a3524">${Math.round(v)}</text>`;
    // minor ticks
    if (i < majors) {
      for (let k = 1; k < 5; k++) {
        const fa = a0 + (a1 - a0) * (f + k / (5 * majors));
        const [mx0, my0] = polar(0, 0, r * 0.78, fa);
        const [mx1, my1] = polar(0, 0, r * 0.71, fa);
        ticks += `<line x1="${mx0.toFixed(1)}" y1="${my0.toFixed(1)}" x2="${mx1.toFixed(1)}" y2="${my1.toFixed(1)}" stroke="#4a442f" stroke-width="${r * 0.016}"/>`;
      }
    }
  }

  let redArc = '';
  if (redFrom !== null) {
    const fa = (redFrom - min) / (max - min);
    const angA = a0 + (a1 - a0) * fa;
    const steps = 14;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const ang = angA + (a1 - angA) * (i / steps);
      const [px, py] = polar(0, 0, r * 0.815, ang);
      d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
    }
    redArc = `<path d="${d}" fill="none" stroke="#a03225" stroke-width="${r * 0.05}"/>`;
  }

  needles[id] = { a0, a1, min, max };

  return `
  <g transform="translate(${x} ${y}) rotate(${tilt})">
    <circle r="${r * 1.12}" fill="url(#bezelG)" stroke="#191d19" stroke-width="1.6"/>
    <circle r="${r * 0.97}" fill="#211e15"/>
    <circle r="${r * 0.92}" fill="${face}"/>
    ${redArc}
    ${ticks}
    <text y="${-r * 0.18}" text-anchor="middle" font-family="Georgia, serif" font-size="${(r * 0.15).toFixed(0)}" fill="#4a442f" letter-spacing="1">${label}</text>
    ${sub ? `<text y="${r * 0.34}" text-anchor="middle" font-family="Georgia, serif" font-size="${(r * 0.11).toFixed(0)}" fill="#6a6248">${sub}</text>` : ''}
    <g id="${id}-needle" transform="rotate(${a0})">
      <path d="M 0 ${r * 0.1} L ${-r * 0.03} 0 L 0 ${-r * 0.72} L ${r * 0.03} 0 Z" fill="#3a1f18"/>
    </g>
    <circle r="${r * 0.09}" fill="url(#boltG)"/>
    <path d="M ${-r * 0.62} ${-r * 0.62} A ${r * 0.88} ${r * 0.88} 0 0 1 ${r * 0.25} ${-r * 0.85}"
          fill="none" stroke="rgba(255,244,220,0.14)" stroke-width="${r * 0.13}" stroke-linecap="round"/>
  </g>`;
}

// value in gauge units; jiggle adds live quiver
export function setGauge(id, value, jiggle = 0) {
  const n = needles[id];
  const elN = document.getElementById(id + '-needle');
  if (!n || !elN) return;
  const f = clamp((value - n.min) / (n.max - n.min), -0.02, 1.02);
  const ang = n.a0 + (n.a1 - n.a0) * f + (jiggle ? (Math.random() - 0.5) * jiggle : 0);
  elN.setAttribute('transform', `rotate(${ang.toFixed(2)})`);
}
