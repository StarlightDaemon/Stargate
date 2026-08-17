// machine.js — the Type 88 resonance alternator, end-on.
// One warm light source, upper-left. Deterministic seeded irregularity:
// unequal stator segments, jittered rivets, a repainted hatch, oil drips,
// and a freight gangway that breaks the radial symmetry on purpose.

import { rng, jit, polar, clamp, el, html } from './util.js';
import { S, rpmAt, now } from './sim.js';

export const BORE = { cx: 385, cy: 470, r: 190 };   // in machine-wrap coords

function sector(cx, cy, R1, R2, a0, a1) {
  const [x0, y0] = polar(cx, cy, R1, a0), [x1, y1] = polar(cx, cy, R1, a1);
  const [x2, y2] = polar(cx, cy, R2, a1), [x3, y3] = polar(cx, cy, R2, a0);
  const large = (a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R1} ${R1} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} ` +
         `L${x2.toFixed(1)} ${y2.toFixed(1)} A${R2} ${R2} 0 ${large} 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z`;
}

function rivet(x, y, r = 4.2) {
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#rivetG)"/>`;
}

function boltHead(x, y, r = 5.5, rot = 0) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (rot + i * 60) * Math.PI / 180;
    pts.push(`${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="url(#boltG)" stroke="#1c211c" stroke-width="0.7"/>` +
         `<circle cx="${(x - r * 0.25).toFixed(1)}" cy="${(y - r * 0.25).toFixed(1)}" r="${r * 0.3}" fill="#9aa198" opacity="0.5"/>`;
}

let rotorGroup, blurRing, spokesG, glowEl, svgRoot, shiverG;
let rotorAngle = 0, lastT = null;

export function buildMachine() {
  const { cx, cy, r } = BORE;
  const R_OUT = 330, R_SHIELD = 252, R_RING = 218, R_GAP = 196;

  // ---- stator end-shield: 9 unequal bolted segments
  const widths = [42, 38, 45, 36, 41, 39, 44, 37, 38]; // sums to 360
  let a = -8 + jit(3);
  const segs = [];
  const grads = ['greenA', 'greenB', 'greenA', 'greenC', 'greenB', 'greenA', 'greenB', 'greenC', 'greenA'];
  for (let i = 0; i < widths.length; i++) {
    const a0 = a, a1 = a + widths[i];
    segs.push({ a0, a1, g: grads[i] });
    a = a1;
  }

  let segsSvg = '', ribsSvg = '', rivetsSvg = '';
  for (const s of segs) {
    segsSvg += `<path d="${sector(cx, cy, R_OUT, R_SHIELD, s.a0 + 0.6, s.a1 - 0.6)}" fill="url(#${s.g})" stroke="#20261f" stroke-width="1.2"/>`;
    // rivet arcs on each segment, mid-band, jittered radius/spacing
    const n = Math.max(3, Math.round((s.a1 - s.a0) / 9));
    for (let k = 1; k < n; k++) {
      const ang = s.a0 + (s.a1 - s.a0) * (k / n) + jit(1.2);
      const [rx, ry] = polar(cx, cy, 290 + jit(4), ang);
      rivetsSvg += rivet(rx, ry, 3.8 + jit(0.5));
    }
    // flange rib at segment start
    const [fx0, fy0] = polar(cx, cy, R_OUT + 4, s.a0);
    const [fx1, fy1] = polar(cx, cy, R_SHIELD - 4, s.a0);
    ribsSvg += `<line x1="${fx0.toFixed(1)}" y1="${fy0.toFixed(1)}" x2="${fx1.toFixed(1)}" y2="${fy1.toFixed(1)}" stroke="#242b23" stroke-width="7" stroke-linecap="round"/>` +
               `<line x1="${fx0.toFixed(1)}" y1="${fy0.toFixed(1)}" x2="${fx1.toFixed(1)}" y2="${fy1.toFixed(1)}" stroke="url(#ribG)" stroke-width="4.4" stroke-linecap="round"/>`;
    for (const rr of [R_OUT - 14, (R_OUT + R_SHIELD) / 2, R_SHIELD + 14]) {
      const [bx, by] = polar(cx, cy, rr, s.a0);
      ribsSvg += boltHead(bx, by, 5 + jit(0.6), rng() * 60);
    }
  }

  // ---- rotor spokes (visible when slow)
  let spokes = '';
  for (let i = 0; i < 8; i++) {
    const ang = i * 45 + jit(0.8);
    const [x0, y0] = polar(cx, cy, 52, ang);
    const [x1, y1] = polar(cx, cy, 172, ang);
    spokes += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="url(#spokeG)" stroke-width="${17 + jit(1.5)}" stroke-linecap="round"/>`;
  }
  // balance weights: two odd lumps on the rim (real rotors are corrected, not perfect)
  spokes += `<circle cx="${polar(cx, cy, 168, 112)[0].toFixed(1)}" cy="${polar(cx, cy, 168, 112)[1].toFixed(1)}" r="9" fill="#3c423e"/>`;
  spokes += `<rect x="${(polar(cx, cy, 165, 241)[0] - 7).toFixed(1)}" y="${(polar(cx, cy, 165, 241)[1] - 5).toFixed(1)}" width="14" height="10" rx="2" fill="#41473f"/>`;

  // ---- gangway (front, lower-left, breaks symmetry)
  const gang = `
    <g id="gangway">
      <path d="M 96 1002 L 232 668 L 318 668 L 214 1002 Z" fill="url(#gangG)" stroke="#15181494" stroke-width="2"/>
      <path d="M 96 1002 L 232 668 L 244 668 L 112 1002 Z" fill="#454c44"/>
      ${[0,1,2,3,4,5,6].map(i => {
        const t0 = i / 7, t1 = t0 + 0.02;
        const x0 = 96 + (232 - 96) * t0 + 22 * t0, y0 = 1002 + (668 - 1002) * t0;
        return `<line x1="${(x0 + 6).toFixed(0)}" y1="${(y0 - 3).toFixed(0)}" x2="${(x0 + 96 - i * 3).toFixed(0)}" y2="${(y0 - 3).toFixed(0)}" stroke="#20261f" stroke-width="3" opacity="0.7"/>`;
      }).join('')}
      <path d="M 118 972 L 244 690" stroke="#5d6455" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M 118 972 L 244 690" stroke="#767d6c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${[0.12,0.36,0.62,0.86].map(t => {
        const x = 118 + (244 - 118) * t, y = 972 + (690 - 972) * t;
        return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x + 9).toFixed(0)}" y2="${(y + 26).toFixed(0)}" stroke="#565d50" stroke-width="4.5"/>`;
      }).join('')}
      <path d="M 130 998 l 22 0 l -8 8 l -22 0 Z M 168 998 l 22 0 l -8 8 l -22 0 Z M 206 998 l 22 0 l -8 8 l -22 0 Z"
            fill="#a8912f" opacity="0.85"/>
    </g>`;

  const svg = `
  <svg id="machine-svg" width="770" height="1010" viewBox="0 0 770 1010">
    <defs>
      <linearGradient id="greenA" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#576550"/><stop offset="0.55" stop-color="#3d4a3e"/><stop offset="1" stop-color="#28332a"/>
      </linearGradient>
      <linearGradient id="greenB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#51604c"/><stop offset="0.55" stop-color="#38453a"/><stop offset="1" stop-color="#243026"/>
      </linearGradient>
      <linearGradient id="greenC" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5d6b54"/><stop offset="0.55" stop-color="#42503f"/><stop offset="1" stop-color="#2b372c"/>
      </linearGradient>
      <linearGradient id="hatchG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#66755b"/><stop offset="1" stop-color="#3a4837"/>
      </linearGradient>
      <linearGradient id="ribG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6a7a66"/><stop offset="1" stop-color="#333f32"/>
      </linearGradient>
      <radialGradient id="rivetG" cx="0.32" cy="0.3" r="0.9">
        <stop offset="0" stop-color="#8f9a89"/><stop offset="0.5" stop-color="#4d584a"/><stop offset="1" stop-color="#222a22"/>
      </radialGradient>
      <radialGradient id="boltG" cx="0.32" cy="0.3" r="1">
        <stop offset="0" stop-color="#98a094"/><stop offset="0.6" stop-color="#535b50"/><stop offset="1" stop-color="#272e26"/>
      </radialGradient>
      <linearGradient id="steelRing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#9aa1a4"/><stop offset="0.35" stop-color="#5c6266"/><stop offset="0.7" stop-color="#3c4145"/><stop offset="1" stop-color="#282c30"/>
      </linearGradient>
      <radialGradient id="boreDepth" cx="0.42" cy="0.4" r="0.85">
        <stop offset="0" stop-color="#181d1a"/><stop offset="0.75" stop-color="#0c100d"/><stop offset="1" stop-color="#070908"/>
      </radialGradient>
      <linearGradient id="spokeG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4b524c"/><stop offset="1" stop-color="#262c27"/>
      </linearGradient>
      <linearGradient id="concreteG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#575852"/><stop offset="0.12" stop-color="#4a4b45"/><stop offset="1" stop-color="#33342f"/>
      </linearGradient>
      <linearGradient id="pedG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4b5347"/><stop offset="1" stop-color="#2a322a"/>
      </linearGradient>
      <linearGradient id="gangG" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0" stop-color="#3f463d"/><stop offset="1" stop-color="#272d26"/>
      </linearGradient>
      <linearGradient id="brassG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c9a55a"/><stop offset="0.5" stop-color="#8a6d3b"/><stop offset="1" stop-color="#5e4a28"/>
      </linearGradient>
      <radialGradient id="glowG" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#9cc8ff" stop-opacity="0.55"/>
        <stop offset="0.55" stop-color="#5f92d8" stop-opacity="0.28"/>
        <stop offset="1" stop-color="#5f92d8" stop-opacity="0"/>
      </radialGradient>
      <clipPath id="boreClip"><circle cx="${cx}" cy="${cy}" r="${r - 4}"/></clipPath>
    </defs>

    <g id="machine-shiver">
      <!-- foundation plinth -->
      <path d="M 60 918 L 710 918 L 742 1006 L 30 1006 Z" fill="url(#concreteG)"/>
      <path d="M 60 918 L 710 918 L 716 934 L 52 934 Z" fill="#5d5e57" opacity="0.65"/>
      <ellipse cx="300" cy="990" rx="90" ry="9" fill="#1a1b17" opacity="0.55"/>
      <ellipse cx="472" cy="1000" rx="56" ry="7" fill="#191a16" opacity="0.45"/>
      ${[88, 200, 336, 468, 596, 688].map((x, i) =>
        `<g transform="translate(${x + jit(6)}, ${958 + jit(5)})">${boltHead(0, 0, 7, rng() * 60)}<rect x="-10" y="8" width="20" height="4" fill="#22251f"/></g>`).join('')}

      <!-- bearing pedestal -->
      <path d="M 268 760 L 502 760 L 540 922 L 232 922 Z" fill="url(#pedG)" stroke="#1d231c" stroke-width="2"/>
      <path d="M 268 760 L 502 760 L 508 782 L 262 782 Z" fill="#59654f" opacity="0.7"/>
      ${[290, 350, 415, 478].map(x => rivet(x + jit(4), 900 + jit(4), 4.5)).join('')}

      <!-- brass makers plate -->
      <g transform="translate(316, 786) rotate(-0.8)">
        <rect width="150" height="46" rx="4" fill="url(#brassG)" stroke="#4e3d20" stroke-width="1.5"/>
        <text x="75" y="15" text-anchor="middle" class="engraved" font-size="10.5" fill="#3a2d15">HALVORSEN &amp; KRAG</text>
        <text x="75" y="28" text-anchor="middle" class="engraved" font-size="8.5" fill="#3a2d15">RESONANCE ALTERNATOR · TYPE 88</text>
        <text x="75" y="40" text-anchor="middle" class="engraved" font-size="8.5" fill="#3a2d15">WORKS No 3 · 1931 · 96 T</text>
        <circle cx="9" cy="9" r="2.6" fill="#5e4a28"/><circle cx="141" cy="9" r="2.6" fill="#5e4a28"/>
        <circle cx="9" cy="37" r="2.6" fill="#5e4a28"/><circle cx="141" cy="37" r="2.6" fill="#5e4a28"/>
      </g>

      <!-- alarm board on plinth -->
      <g id="alarm-board" transform="translate(548, 930) rotate(0.9)"></g>

      <!-- stator back plate -->
      <circle cx="${cx}" cy="${cy}" r="${R_OUT + 8}" fill="#171c17"/>
      <circle cx="${cx + 10}" cy="${cy + 14}" r="${R_OUT + 6}" fill="#0d100d" opacity="0.6"/>

      <!-- segments, ribs, rivets -->
      ${segsSvg}
      ${ribsSvg}
      ${rivetsSvg}

      <!-- repainted inspection hatch (upper-left segment, newer paint) -->
      <g transform="rotate(${-52 + jit(2)} ${cx} ${cy})">
        <rect x="${cx - 34}" y="${cy - R_OUT + 26}" width="68" height="46" rx="5" fill="url(#hatchG)" stroke="#222b21" stroke-width="1.5"/>
        ${boltHead(cx - 24, cy - R_OUT + 36, 4.4, 12)}${boltHead(cx + 24, cy - R_OUT + 36, 4.4, 40)}
        ${boltHead(cx - 24, cy - R_OUT + 62, 4.4, 28)}${boltHead(cx + 24, cy - R_OUT + 62, 4.4, 4)}
      </g>

      <!-- machined shield ring + air gap -->
      <circle cx="${cx}" cy="${cy}" r="${R_SHIELD}" fill="none" stroke="url(#steelRing)" stroke-width="${R_SHIELD - R_RING}"/>
      <circle cx="${cx}" cy="${cy}" r="${R_RING}" fill="none" stroke="#1b201d" stroke-width="${R_RING - R_GAP}"/>
      <circle cx="${cx}" cy="${cy}" r="${R_GAP}" fill="none" stroke="#0e1210" stroke-width="${R_GAP - r}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#boreDepth)"/>

      <!-- pole-shoe teeth hint on the gap ring -->
      ${Array.from({length: 72}, (_, i) => {
        const ang = i * 5 + jit(0.35);
        const [x0, y0] = polar(cx, cy, r + 1, ang), [x1, y1] = polar(cx, cy, R_GAP - 1, ang);
        return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#232a25" stroke-width="2.4"/>`;
      }).join('')}

      <!-- rotor -->
      <g clip-path="url(#boreClip)">
        <g id="rotor-group">
          <g id="rotor-spokes">
            <circle cx="${cx}" cy="${cy}" r="178" fill="none" stroke="#2e352f" stroke-width="16"/>
            ${spokes}
            <circle cx="${cx}" cy="${cy}" r="52" fill="url(#steelRing)"/>
            <circle cx="${cx}" cy="${cy}" r="20" fill="#202521"/>
            ${boltHead(cx - 34, cy - 12, 5, 10)}${boltHead(cx + 28, cy - 26, 5, 40)}${boltHead(cx + 18, cy + 34, 5, 70)}
          </g>
        </g>
        <g id="rotor-blur" opacity="0">
          <circle cx="${cx}" cy="${cy}" r="178" fill="none" stroke="#31383266" stroke-width="16"/>
          <circle cx="${cx}" cy="${cy}" r="115" fill="none" stroke="#2b322c33" stroke-width="120"/>
          <circle cx="${cx}" cy="${cy}" r="52" fill="url(#steelRing)"/>
          <circle cx="${cx}" cy="${cy}" r="20" fill="#202521"/>
          <circle cx="${cx}" cy="${cy}" r="36" fill="none" stroke="#454c4522" stroke-width="30"/>
        </g>
      </g>

      <!-- oil line to top bearing fitting, with drip stain -->
      <path d="M ${cx + 96} 96 q 22 30 14 74 q -8 44 -34 66" fill="none" stroke="#4c5148" stroke-width="8" stroke-linecap="round"/>
      <path d="M ${cx + 96} 96 q 22 30 14 74 q -8 44 -34 66" fill="none" stroke="#767b70" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="${cx + 76}" cy="238" r="9" fill="url(#boltG)"/>
      <path d="M ${cx + 74} 248 q 4 26 -2 54 q 8 -8 10 -54 Z" fill="#141712" opacity="0.55"/>

      <!-- lifting eyes, off-center -->
      <g transform="translate(${cx - 68}, 118) rotate(-4)">
        <circle r="16" fill="none" stroke="#3c453a" stroke-width="9"/><rect x="-11" y="12" width="22" height="12" fill="#39423a"/>
      </g>
      <g transform="translate(${cx + 34}, 108) rotate(3)">
        <circle r="14" fill="none" stroke="#3c453a" stroke-width="8"/><rect x="-10" y="10" width="20" height="11" fill="#39423a"/>
      </g>

      <!-- terminal box lower right with conduits -->
      <g transform="translate(608, 618) rotate(1.6)">
        <rect width="118" height="128" rx="6" fill="url(#greenB)" stroke="#1e241d" stroke-width="2"/>
        <rect x="10" y="10" width="98" height="74" rx="4" fill="#2c352c" stroke="#1c221b" stroke-width="1.4"/>
        ${boltHead(16, 100, 5, 15)}${boltHead(60, 104, 5, 45)}${boltHead(102, 100, 5, 0)}
        <text x="59" y="121" text-anchor="middle" class="stencil" font-size="12" fill="#b9b092" opacity="0.85">CARRIER MAIN</text>
      </g>
      <path d="M 700 700 q 46 10 58 60 l 4 246" fill="none" stroke="#31382f" stroke-width="16" stroke-linecap="round"/>
      <path d="M 700 736 q 34 14 40 58 l 2 212" fill="none" stroke="#2b322a" stroke-width="11" stroke-linecap="round"/>

      <!-- stencils: works number, slightly skew -->
      <g transform="translate(148, 640) rotate(-2.4)">
        <text class="stencil" font-size="64" fill="#c9bd9f" opacity="0.8">N<tspan font-size="40">o</tspan> 3</text>
        <text y="26" class="stencil" font-size="15" fill="#c9bd9f" opacity="0.65">O.W.T.B.</text>
      </g>
      <text x="586" y="286" class="stencil" font-size="13" fill="#c4b795" opacity="0.5" transform="rotate(3 586 286)">OIL EVERY SHIFT</text>

      <!-- paint chips / weathering dashes -->
      ${Array.from({length: 14}, () => {
        const ang = rng() * 360, rr = 258 + rng() * 66;
        const [px, py] = polar(cx, cy, rr, ang);
        return `<rect x="${px.toFixed(0)}" y="${py.toFixed(0)}" width="${(3 + rng() * 9).toFixed(0)}" height="${(2 + rng() * 3).toFixed(0)}" fill="#6f7a68" opacity="${(0.12 + rng() * 0.2).toFixed(2)}" transform="rotate(${(rng() * 90).toFixed(0)} ${px.toFixed(0)} ${py.toFixed(0)})"/>`;
      }).join('')}

      ${gang}

      <!-- casing glow when arc is live (above everything but under canvas) -->
      <circle id="bore-glow" cx="${cx}" cy="${cy}" r="268" fill="url(#glowG)" opacity="0"/>
    </g>
  </svg>`;

  const wrap = el('machine-wrap');
  html(wrap, svg);
  html(wrap, `<canvas id="arc-canvas" width="${(r - 6) * 2}" height="${(r - 6) * 2}"
    style="left:${cx - r + 6}px; top:${cy - r + 6}px; width:${(r - 6) * 2}px; height:${(r - 6) * 2}px;"></canvas>`);

  svgRoot = el('machine-svg');
  shiverG = el('machine-shiver');
  rotorGroup = el('rotor-group');
  spokesG = el('rotor-spokes');
  blurRing = el('rotor-blur');
  glowEl = el('bore-glow');
}

export function renderMachine(t) {
  if (lastT === null) lastT = t;
  const dt = clamp(t - lastT, 0, 0.1);
  lastT = t;

  const rpm = rpmAt(t);
  rotorAngle = (rotorAngle + rpm / 60 * 360 * dt) % 360;
  rotorGroup.setAttribute('transform', `rotate(${rotorAngle.toFixed(2)} ${BORE.cx} ${BORE.cy})`);

  const blur = clamp((rpm - 90) / 160, 0, 1);
  spokesG.style.opacity = (1 - blur).toFixed(2);
  blurRing.style.opacity = (blur * 0.9).toFixed(2);

  // machine shiver when turning
  if (rpm > 40) {
    const amp = clamp(rpm / 840, 0, 1) * 1.1;
    const sx = Math.sin(t * 47) * amp, sy = Math.cos(t * 53) * amp * 0.6;
    shiverG.setAttribute('transform', `translate(${sx.toFixed(2)} ${sy.toFixed(2)})`);
  } else {
    shiverG.setAttribute('transform', '');
  }

  // casing glow tracks arc state
  let g = 0;
  const dtA = t - S.arcT0;
  if (S.arc === 'striking') g = clamp(dtA / 0.9, 0, 1) * (0.6 + Math.sin(t * 40) * 0.25);
  else if (S.arc === 'open') g = 0.85 + Math.sin(t * 9.7) * 0.07 + Math.sin(t * 23.1) * 0.04;
  else if (S.arc === 'collapsing') g = clamp(1 - dtA / 1.3, 0, 1) * 0.7;
  glowEl.style.opacity = g.toFixed(2);
}
