/**
 * Stargate Orthographic CAD Terminal - SVG Technical Ring Engine
 * Bureau: Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau
 * Spec: AV-CAD-STG-9042-REV-D
 * Renders annotated SVG technical drawing with real dimension lines, cross-section hatching,
 * rotating precision vector rotor, 8 orthographic caliper lock nodes, and drafted leader lines.
 */

import { cadAudio } from './audio.js';

export const GLYPH_DEFS = [
  { id: 0, code: "V-00", name: "ORIGIN DATUM", symbol: "⊕", path: "M-12,0 L12,0 M0,-12 L0,12 M-8,-8 L8,8 M-8,8 L8,-8 M0,0 m-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0" },
  { id: 1, code: "V-01", name: "ISOCLINE TRIAD", symbol: "▲", path: "M0,-14 L12,10 L-12,10 Z M0,-5 L0,10 M-6,3 L6,3" },
  { id: 2, code: "V-02", name: "DUAL CHORD", symbol: "⫽", path: "M-10,-12 L10,-12 M-12,0 L12,0 M-10,12 L10,12 M-6,-12 L-6,12 M6,-12 L6,12" },
  { id: 3, code: "V-03", name: "POLAR RETICLE", symbol: "⊙", path: "M0,0 m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M0,0 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M-14,0 L14,0 M0,-14 L0,14" },
  { id: 4, code: "V-04", name: "ORTHO CROSS", symbol: "✛", path: "M-14,-3 L-3,-3 L-3,-14 L3,-14 L3,-3 L14,-3 L14,3 L3,3 L3,14 L-3,14 L-3,3 L-14,3 Z" },
  { id: 5, code: "V-05", name: "TANGENT ARC", symbol: "⌒", path: "M-14,8 Q0,-14 14,8 M-14,8 L-14,12 M14,8 L14,12 M0,-6 L0,12" },
  { id: 6, code: "V-06", name: "SINE INVOLUTE", symbol: "∿", path: "M-14,0 Q-7,-16 0,0 Q7,16 14,0 M-14,-10 L-14,10 M14,-10 L14,10" },
  { id: 7, code: "V-07", name: "ELLIPTIC PIVOT", symbol: "⬭", path: "M0,0 m-14,0 a14,7 0 1,0 28,0 a14,7 0 1,0 -28,0 M-14,0 L14,0 M0,-12 L0,12" },
  { id: 8, code: "V-08", name: "T-SQUARE VECTOR", symbol: "⊤", path: "M-14,-10 L14,-10 M0,-10 L0,14 M-6,14 L6,14 M-8,-2 L8,-2" },
  { id: 9, code: "V-09", name: "VERNIER CALIPER", symbol: "⊓", path: "M-12,14 L-12,-12 L12,-12 L12,14 M-6,-12 L-6,4 M0,-12 L0,8 M6,-12 L6,4" },
  { id: 10, code: "V-10", name: "RHOMBOID STATOR", symbol: "◇", path: "M0,-14 L12,0 L0,14 L-12,0 Z M-5,-5 L5,5 M-5,5 L5,-5" },
  { id: 11, code: "V-11", name: "HELIX NODE", symbol: "⟁", path: "M0,-12 L10,12 L-10,12 Z M0,-12 m0,7 a5,5 0 1,1 0,0.1 M-4,6 L4,6" },
  { id: 12, code: "V-12", name: "SAGITTA SECTOR", symbol: "⌔", path: "M0,-14 L12,10 L0,4 L-12,10 Z M0,4 L0,-14 M-6,7 L6,7" },
  { id: 13, code: "V-13", name: "INCLINED FLANGE", symbol: "⧄", path: "M-12,-12 L12,-12 L12,12 L-12,12 Z M-12,-12 L12,12 M-12,12 L12,-12" },
  { id: 14, code: "V-14", name: "BEZIER SPLINE", symbol: "∾", path: "M-14,-8 C-5,14 5,-14 14,8 M-14,-8 L-8,-8 M14,8 L8,8" },
  { id: 15, code: "V-15", name: "ANNULAR APEX", symbol: "◎", path: "M0,0 m-13,0 a13,13 0 1,0 26,0 a13,13 0 1,0 -26,0 M0,0 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0 M0,-13 L0,-7 M0,7 L0,13" },
  { id: 16, code: "V-16", name: "HEXAGONAL TRUSS", symbol: "⬡", path: "M0,-14 L12,-7 L12,7 L0,14 L-12,7 L-12,-7 Z M0,-14 L0,14 M-12,-7 L12,7 M-12,7 L12,-7" },
  { id: 17, code: "V-17", name: "PARALLAX GAUGE", symbol: "⫚", path: "M-14,-8 L14,-8 M-10,0 L10,0 M-6,8 L6,8 M0,-14 L0,14" },
  { id: 18, code: "V-18", name: "HYPERBOLIC CONE", symbol: "⧅", path: "M-12,-12 L12,-12 L0,0 L12,12 L-12,12 L0,0 Z M-6,0 L6,0" },
  { id: 19, code: "V-19", name: "RADIAL KEYWAY", symbol: "⎍", path: "M-12,-14 L-6,-14 L-6,-4 L6,-4 L6,-14 L12,-14 L12,14 L-12,14 Z" },
  { id: 20, code: "V-20", name: "ISOMETRIC PRISM", symbol: "⬢", path: "M0,-14 L12,-7 L12,7 L0,14 L-12,7 L-12,-7 Z M0,0 L0,-14 M0,0 L12,7 M0,0 L-12,7" },
  { id: 21, code: "V-21", name: "MITER CAM", symbol: "◬", path: "M-14,12 L0,-14 L14,12 Z M-8,6 L8,6 M0,-14 L0,6" },
  { id: 22, code: "V-22", name: "CYCLOID TOOTH", symbol: "⋒", path: "M-12,12 C-12,-12 12,-12 12,12 M-8,12 L-8,2 M0,12 L0,-4 M8,12 L8,2" },
  { id: 23, code: "V-23", name: "ORTHO GRADIENT", symbol: "⧆", path: "M-12,-12 L12,-12 L12,12 L-12,12 Z M-12,0 L12,0 M0,-12 L0,12 M-6,-6 L6,6 M-6,6 L6,-6" },
  { id: 24, code: "V-24", name: "MERIDIAN APERTURE", symbol: "◈", path: "M0,-14 L14,0 L0,14 L-14,0 Z M0,-7 L7,0 L0,7 L-7,0 Z M0,-14 L0,14 M-14,0 L14,0" }
];

export const CALIPER_CONFIGS = [
  { id: "alpha", name: "CALIPER-α [0° ORIGIN]", angle: 0, x: 0, y: -380, labelAngle: -90, designation: "NODE-01-A" },
  { id: "beta",  name: "CALIPER-β [45° NORTEAST]", angle: 45, x: 268.7, y: -268.7, labelAngle: -45, designation: "NODE-02-B" },
  { id: "gamma", name: "CALIPER-γ [90° EAST]", angle: 90, x: 380, y: 0, labelAngle: 0, designation: "NODE-03-C" },
  { id: "delta", name: "CALIPER-δ [135° SOUTHEAST]", angle: 135, x: 268.7, y: 268.7, labelAngle: 45, designation: "NODE-04-D" },
  { id: "epsilon", name: "CALIPER-ε [180° SOUTH]", angle: 180, x: 0, y: 380, labelAngle: 90, designation: "NODE-05-E" },
  { id: "zeta",  name: "CALIPER-ζ [225° SOUTHWEST]", angle: 225, x: -268.7, y: 268.7, labelAngle: 135, designation: "NODE-06-F" },
  { id: "eta",   name: "CALIPER-η [270° WEST]", angle: 270, x: -380, y: 0, labelAngle: 180, designation: "NODE-07-G" },
  { id: "theta", name: "CALIPER-θ [315° NORTHWEST]", angle: 315, x: -268.7, y: -268.7, labelAngle: 225, designation: "NODE-08-H" }
];

export class CadRingRenderer {
  constructor(svgContainerId) {
    this.container = document.getElementById(svgContainerId);
    this.rotorAngle = 0;
    this.lockedCalipers = new Map(); // index -> { glyph, caliperConfig }
    this.targetRotorAngle = 0;
    this.isRotating = false;
    this.activeLeaderLines = [];

    this.initSvg();
  }

  initSvg() {
    if (!this.container) return;

    this.container.innerHTML = `
      <svg id="cad-ring-svg" viewBox="-550 -550 1100 1100" class="cad-svg-viewport" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Hatching patterns for structural cross sections -->
          <pattern id="cad-hatch-45" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(93, 230, 255, 0.22)" stroke-width="1" />
          </pattern>
          <pattern id="cad-cross-hatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(93, 230, 255, 0.18)" stroke-width="0.8" />
            <line x1="0" y1="0" x2="12" y2="0" stroke="rgba(93, 230, 255, 0.18)" stroke-width="0.8" />
          </pattern>
          <pattern id="cad-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(93, 230, 255, 0.08)" stroke-width="0.6"/>
            <circle cx="0" cy="0" r="1" fill="rgba(93, 230, 255, 0.25)"/>
          </pattern>

          <!-- SVG Filters for radiant CAD Vector Glow -->
          <filter id="cad-glow-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cad-glow-intense" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5.5" result="blur1" />
            <feGaussianBlur stdDeviation="1.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cad-portal-surge" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" result="glow" />
            <feColorMatrix type="matrix" values="
              0 0 0 0 0.36
              0 0 0 0 0.90
              0 0 0 0 1.00
              0 0 0 1 0" result="cyanGlow" />
            <feMerge>
              <feMergeNode in="cyanGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <!-- Arrowhead markers for dimension lines -->
          <marker id="dim-arrow-start" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 10 2 L 0 5 L 10 8 z" fill="#5de6ff"/>
          </marker>
          <marker id="dim-arrow-end" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 2 L 10 5 L 0 8 z" fill="#5de6ff"/>
          </marker>
          <marker id="dim-tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <line x1="2" y1="2" x2="8" y2="8" stroke="#5de6ff" stroke-width="1.5"/>
          </marker>
        </defs>

        <!-- Background Drafting Grid Overlay -->
        <rect x="-550" y="-550" width="1100" height="1100" fill="url(#cad-grid-pattern)" />

        <!-- Master Drawing Coordinate Axes & Graticules -->
        <g id="layer-coordinate-axes" class="cad-layer">
          <line x1="-520" y1="0" x2="520" y2="0" stroke="rgba(93, 230, 255, 0.25)" stroke-width="0.8" stroke-dasharray="8 4 2 4" />
          <line x1="0" y1="-520" x2="0" y2="520" stroke="rgba(93, 230, 255, 0.25)" stroke-width="0.8" stroke-dasharray="8 4 2 4" />
          <circle cx="0" cy="0" r="490" fill="none" stroke="rgba(93, 230, 255, 0.15)" stroke-width="0.7" stroke-dasharray="4 4" />
          <circle cx="0" cy="0" r="420" fill="none" stroke="rgba(93, 230, 255, 0.18)" stroke-width="0.7" stroke-dasharray="12 4" />
        </g>

        <!-- Layer 0: Portal Event Horizon (Hybrid Canvas sits behind SVG vector rings) -->
        <g id="layer-portal-canvas-mount"></g>

        <!-- Layer 1: Structural Stator Assembly (Outer Ring) -->
        <g id="layer-stator" class="cad-layer">
          <!-- Cross-section hatched structural rim -->
          <circle cx="0" cy="0" r="370" fill="none" stroke="#22a6db" stroke-width="28" opacity="0.4" />
          <circle cx="0" cy="0" r="370" fill="none" stroke="url(#cad-hatch-45)" stroke-width="26" />
          <circle cx="0" cy="0" r="384" fill="none" stroke="#5de6ff" stroke-width="1.6" />
          <circle cx="0" cy="0" r="356" fill="none" stroke="#5de6ff" stroke-width="1.2" />

          <!-- PCD Bolt Circle (32x M36 Tapped Flange Bolts) -->
          <circle cx="0" cy="0" r="370" fill="none" stroke="rgba(93, 230, 255, 0.3)" stroke-width="0.8" stroke-dasharray="2 4" />
          <g id="stator-flange-bolts">
            ${this.generateBoltCircle(32, 370)}
          </g>

          <!-- 8 Primary Radial Truss Spars -->
          <g id="stator-truss-spars">
            ${this.generateTrussSpars()}
          </g>
        </g>

        <!-- Layer 2: Rotating Precision Vector Rotor Ring -->
        <g id="layer-vector-rotor" class="cad-layer" style="transform-origin: 0 0; transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);">
          <circle cx="0" cy="0" r="348" fill="none" stroke="#5de6ff" stroke-width="1.2" />
          <circle cx="0" cy="0" r="282" fill="none" stroke="#5de6ff" stroke-width="1.5" />
          <circle cx="0" cy="0" r="315" fill="none" stroke="rgba(93, 230, 255, 0.25)" stroke-width="64" />
          <circle cx="0" cy="0" r="315" fill="none" stroke="url(#cad-cross-hatch)" stroke-width="62" />

          <!-- 24 Epicyclic Vector Coordinate Glyph Sectors -->
          <g id="rotor-glyph-sectors">
            ${this.generateRotorSectors()}
          </g>

          <!-- Outer Vernier Index Teeth -->
          <g id="rotor-vernier-teeth">
            ${this.generateVernierTeeth(144, 348, 354)}
          </g>
        </g>

        <!-- Layer 3: Inner Aperture Stator Collar & Bore Graticule -->
        <g id="layer-bore-stator" class="cad-layer">
          <circle cx="0" cy="0" r="278" fill="none" stroke="#5de6ff" stroke-width="1.8" />
          <circle cx="0" cy="0" r="270" fill="none" stroke="rgba(93, 230, 255, 0.5)" stroke-width="0.8" stroke-dasharray="3 3" />
          <circle cx="0" cy="0" r="260" fill="none" stroke="#22a6db" stroke-width="1.2" />
          
          <!-- Inner Iris Aperture Boundary -->
          <circle id="inner-bore-circle" cx="0" cy="0" r="252" fill="rgba(7, 20, 38, 0.7)" stroke="#5de6ff" stroke-width="2" filter="url(#cad-glow-soft)" />
          
          <!-- Central Origin Crosshairs & Vernier Graticule -->
          <g id="central-graticule">
            <line x1="-30" y1="0" x2="30" y2="0" stroke="#5de6ff" stroke-width="1" />
            <line x1="0" y1="-30" x2="0" y2="30" stroke="#5de6ff" stroke-width="1" />
            <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(93, 230, 255, 0.4)" stroke-width="0.8" stroke-dasharray="2 2" />
            <circle cx="0" cy="0" r="40" fill="none" stroke="rgba(93, 230, 255, 0.3)" stroke-width="0.6" />
          </g>
        </g>

        <!-- Layer 4: Real CAD Dimension Lines & Technical Annotations -->
        <g id="layer-dimensions" class="cad-layer">
          <!-- O.D. Dimension Line Ø 12,850 mm -->
          <g class="cad-dim-group" id="dim-od">
            <line x1="384" y1="0" x2="475" y2="0" stroke="#5de6ff" stroke-width="0.8" stroke-dasharray="2 2" />
            <line x1="-384" y1="0" x2="-475" y2="0" stroke="#5de6ff" stroke-width="0.8" stroke-dasharray="2 2" />
            <line x1="465" y1="-384" x2="465" y2="384" stroke="#5de6ff" stroke-width="1" marker-start="url(#dim-arrow-start)" marker-end="url(#dim-arrow-end)" />
            <line x1="384" y1="-384" x2="480" y2="-384" stroke="rgba(93, 230, 255, 0.5)" stroke-width="0.8" />
            <line x1="384" y1="384" x2="480" y2="384" stroke="rgba(93, 230, 255, 0.5)" stroke-width="0.8" />
            <text x="475" y="5" fill="#e0f7ff" font-family="'Space Mono', monospace" font-size="11" letter-spacing="1">Ø 12,850 mm O.D.</text>
          </g>

          <!-- I.D. Dimension Line Ø 9,400 mm -->
          <g class="cad-dim-group" id="dim-id">
            <line x1="-282" y1="-282" x2="-435" y2="-435" stroke="rgba(93, 230, 255, 0.5)" stroke-width="0.8" />
            <line x1="-282" y1="0" x2="-440" y2="0" stroke="rgba(93, 230, 255, 0.5)" stroke-width="0.8" />
            <text x="-485" y="-120" fill="#5de6ff" font-family="'Space Mono', monospace" font-size="10">Ø 9,400 mm I.D.</text>
            <path d="M-380,-115 L-315,-115 L-278,-50" fill="none" stroke="#5de6ff" stroke-width="0.8" />
          </g>

          <!-- Bore Radius R 4,700 mm -->
          <g class="cad-dim-group" id="dim-bore">
            <line x1="0" y1="0" x2="178" y2="178" stroke="#5de6ff" stroke-width="1" marker-end="url(#dim-arrow-end)" />
            <polyline points="178,178 240,178 300,178" fill="none" stroke="#5de6ff" stroke-width="0.8" />
            <text x="210" y="172" fill="#e0f7ff" font-family="'Space Mono', monospace" font-size="10">R 4,700 mm BORE</text>
          </g>

          <!-- Flange Bolt Callout PCD 11,200 mm -->
          <g class="cad-dim-group" id="dim-pcd">
            <path d="M 261,-261 L 340,-340 L 440,-340" fill="none" stroke="#5de6ff" stroke-width="0.8" />
            <text x="345" y="-346" fill="#5de6ff" font-family="'Space Mono', monospace" font-size="9.5">PCD 11,200 mm 32x M36 TAPPED</text>
            <circle cx="261" cy="-261" r="2.5" fill="#5de6ff" />
          </g>

          <!-- Section Callout Detail SEC A-A [1:10] -->
          <g class="cad-dim-group" id="callout-sec-a">
            <circle cx="-390" cy="270" r="18" fill="rgba(7, 20, 38, 0.9)" stroke="#5de6ff" stroke-width="1.2" />
            <line x1="-408" y1="270" x2="-372" y2="270" stroke="#5de6ff" stroke-width="0.8" />
            <text x="-390" y="266" fill="#e0f7ff" font-family="'Space Mono', monospace" font-size="9" text-anchor="middle" font-weight="bold">SEC A</text>
            <text x="-390" y="282" fill="#5de6ff" font-family="'Space Mono', monospace" font-size="8" text-anchor="middle">1:10</text>
            <path d="M -372,270 L -330,270 L -310,230" fill="none" stroke="#5de6ff" stroke-width="0.8" />
          </g>
        </g>

        <!-- Layer 5: 8 Radial Orthographic Caliper Nodes -->
        <g id="layer-calipers" class="cad-layer">
          ${this.generateCalipers()}
        </g>

        <!-- Layer 6: Dynamic Active Drafting Leader Lines -->
        <g id="layer-drafted-lines" class="cad-layer"></g>
      </svg>
    `;
  }

  generateBoltCircle(count, radius) {
    let bolts = "";
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);
      bolts += `
        <g transform="translate(${x.toFixed(2)}, ${y.toFixed(2)})">
          <circle cx="0" cy="0" r="4.5" fill="none" stroke="#5de6ff" stroke-width="0.8" />
          <circle cx="0" cy="0" r="1.5" fill="#5de6ff" />
          <line x1="-6" y1="0" x2="6" y2="0" stroke="rgba(93, 230, 255, 0.4)" stroke-width="0.5" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke="rgba(93, 230, 255, 0.4)" stroke-width="0.5" />
        </g>
      `;
    }
    return bolts;
  }

  generateTrussSpars() {
    let spars = "";
    for (let i = 0; i < 8; i++) {
      const angle = i * 45 + 22.5; // Offset between caliper nodes
      spars += `
        <g transform="rotate(${angle})">
          <line x1="282" y1="0" x2="356" y2="0" stroke="#5de6ff" stroke-width="2" stroke-dasharray="10 4 2 4" />
          <line x1="282" y1="-8" x2="356" y2="-8" stroke="rgba(93, 230, 255, 0.3)" stroke-width="0.8" />
          <line x1="282" y1="8" x2="356" y2="8" stroke="rgba(93, 230, 255, 0.3)" stroke-width="0.8" />
        </g>
      `;
    }
    return spars;
  }

  generateVernierTeeth(count, rInner, rOuter) {
    let teeth = "";
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const isMajor = i % 6 === 0;
      const isSemi = i % 3 === 0 && !isMajor;
      const rOut = isMajor ? rOuter + 4 : isSemi ? rOuter + 2 : rOuter;
      const strokeW = isMajor ? 1.2 : 0.6;
      teeth += `
        <g transform="rotate(${angle})">
          <line x1="${rInner}" y1="0" x2="${rOut}" y2="0" stroke="#5de6ff" stroke-width="${strokeW}" />
        </g>
      `;
    }
    return teeth;
  }

  generateRotorSectors() {
    let sectors = "";
    const total = GLYPH_DEFS.length; // 25 total glyphs (0 to 24)
    for (let i = 0; i < total; i++) {
      const glyph = GLYPH_DEFS[i];
      const angle = (i * 360) / total;
      sectors += `
        <g class="rotor-sector-node" data-glyph-id="${glyph.id}" transform="rotate(${angle}) translate(315, 0)">
          <!-- Sector separator line -->
          <line x1="-32" y1="0" x2="32" y2="0" stroke="rgba(93, 230, 255, 0.35)" stroke-width="0.8" transform="rotate(90)" />
          
          <!-- Sector glyph mount -->
          <g transform="rotate(90)" class="sector-glyph-wrapper">
            <rect x="-18" y="-18" width="36" height="36" fill="rgba(7, 20, 38, 0.6)" stroke="rgba(93, 230, 255, 0.4)" stroke-width="0.8" rx="2" />
            <path d="${glyph.path}" fill="none" stroke="#e0f7ff" stroke-width="1.4" />
            <text x="0" y="24" fill="rgba(93, 230, 255, 0.7)" font-family="'Space Mono', monospace" font-size="6.5" text-anchor="middle">${glyph.code}</text>
          </g>
        </g>
      `;
    }
    return sectors;
  }

  generateCalipers() {
    return CALIPER_CONFIGS.map((c, idx) => {
      const isTop = idx === 0;
      return `
        <g id="caliper-node-${idx}" class="caliper-assembly" transform="translate(${c.x.toFixed(2)}, ${c.y.toFixed(2)}) rotate(${c.labelAngle + 90})">
          <!-- Caliper Mounting Bracket -->
          <rect x="-24" y="-35" width="48" height="30" fill="rgba(7, 20, 38, 0.95)" stroke="#5de6ff" stroke-width="1.4" rx="2" class="caliper-base" />
          
          <!-- Vernier index lines on caliper head -->
          <line x1="-18" y1="-28" x2="18" y2="-28" stroke="rgba(93, 230, 255, 0.4)" stroke-width="0.8" />
          <line x1="-12" y1="-32" x2="-12" y2="-24" stroke="#5de6ff" stroke-width="0.8" />
          <line x1="0" y1="-34" x2="0" y2="-22" stroke="#5de6ff" stroke-width="1.2" />
          <line x1="12" y1="-32" x2="12" y2="-24" stroke="#5de6ff" stroke-width="0.8" />

          <!-- Caliper Sliding Inscription Jaws (animated on clamp) -->
          <g id="caliper-jaw-left-${idx}" class="caliper-jaw jaw-left">
            <path d="M-18,-5 L-18,25 L-12,28 L-12,-5 Z" fill="rgba(93, 230, 255, 0.15)" stroke="#5de6ff" stroke-width="1.2" />
          </g>
          <g id="caliper-jaw-right-${idx}" class="caliper-jaw jaw-right">
            <path d="M18,-5 L18,25 L12,28 L12,-5 Z" fill="rgba(93, 230, 255, 0.15)" stroke="#5de6ff" stroke-width="1.2" />
          </g>

          <!-- Inscription Status Light & Coordinate Slot -->
          <rect id="caliper-slot-${idx}" x="-16" y="-20" width="32" height="18" fill="rgba(4, 12, 24, 0.9)" stroke="rgba(93, 230, 255, 0.4)" stroke-width="1" />
          <g id="caliper-glyph-render-${idx}" class="caliper-glyph-slot" transform="translate(0, -11) scale(0.6)"></g>

          <!-- Caliper Designation Tag -->
          <g transform="translate(0, -42)" class="caliper-tag-group">
            <rect x="-36" y="-12" width="72" height="14" fill="rgba(7, 20, 38, 0.9)" stroke="rgba(93, 230, 255, 0.5)" stroke-width="0.8" />
            <text id="caliper-label-${idx}" x="0" y="-2" fill="#5de6ff" font-family="'Space Mono', monospace" font-size="7.5" text-anchor="middle" font-weight="bold">${c.designation}</text>
          </g>

          <!-- Caliper State Indicator LED -->
          <circle id="caliper-led-${idx}" cx="0" cy="18" r="3.5" fill="rgba(93, 230, 255, 0.2)" stroke="#5de6ff" stroke-width="1" />
        </g>
      `;
    }).join("");
  }

  /**
   * Rotate precision vector rotor to highlight selected glyph
   */
  rotateRotorToGlyph(glyphId, duration = 350) {
    const total = GLYPH_DEFS.length;
    const sectorAngle = 360 / total;
    // Rotate so glyph aligns near current active caliper
    const target = - (glyphId * sectorAngle);
    this.targetRotorAngle = target;
    const rotorEl = document.getElementById("layer-vector-rotor");
    if (rotorEl) {
      cadAudio.playRotorMove();
      rotorEl.style.transform = `rotate(${target}deg)`;
    }
  }

  /**
   * Lock a Caliper with an Inscribed Glyph and Vector Leader Line
   */
  lockCaliper(caliperIndex, glyph, addressIndex) {
    const caliperConfig = CALIPER_CONFIGS[caliperIndex];
    if (!caliperConfig) return;

    this.lockedCalipers.set(caliperIndex, { glyph, caliperConfig, addressIndex });

    // 1. Play Caliper Clamping Audio + Scribing
    cadAudio.playPlotterInk();
    setTimeout(() => {
      cadAudio.playCaliperClamp(caliperIndex);
    }, 80);

    // 2. Animate Caliper Clamping Jaws
    const nodeEl = document.getElementById(`caliper-node-${caliperIndex}`);
    if (nodeEl) {
      nodeEl.classList.add("caliper-locked");
    }

    const ledEl = document.getElementById(`caliper-led-${caliperIndex}`);
    if (ledEl) {
      ledEl.setAttribute("fill", "#5de6ff");
      ledEl.setAttribute("filter", "url(#cad-glow-intense)");
    }

    const slotEl = document.getElementById(`caliper-slot-${caliperIndex}`);
    if (slotEl) {
      slotEl.setAttribute("stroke", "#5de6ff");
      slotEl.setAttribute("fill", "rgba(93, 230, 255, 0.25)");
    }

    const glyphSlot = document.getElementById(`caliper-glyph-render-${caliperIndex}`);
    if (glyphSlot) {
      glyphSlot.innerHTML = `<path d="${glyph.path}" fill="none" stroke="#ffffff" stroke-width="2" filter="url(#cad-glow-soft)"/>`;
    }

    // 3. Ink Real-Time Vector Leader Line
    this.inscribeLeaderLine(caliperIndex, caliperConfig, glyph);
  }

  /**
   * Inscribe vector leader line from center graticule to caliper head with coordinate brackets
   */
  inscribeLeaderLine(caliperIndex, config, glyph) {
    const leaderLayer = document.getElementById("layer-drafted-lines");
    if (!leaderLayer) return;

    const startX = 0;
    const startY = 0;
    const endX = config.x;
    const endY = config.y;

    const lineId = `leader-line-${caliperIndex}`;
    const existing = document.getElementById(lineId);
    if (existing) existing.remove();

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", lineId);
    g.setAttribute("class", "drafted-leader-group");

    // Compute coordinate text for leader line annotation
    const coordX = (config.x * 12.85).toFixed(1);
    const coordY = (config.y * -12.85).toFixed(1);
    const angleDeg = config.angle.toFixed(2);
    const midX = (startX + endX) * 0.55;
    const midY = (startY + endY) * 0.55;

    g.innerHTML = `
      <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="#5de6ff" stroke-width="1.6" stroke-dasharray="4 2" class="leader-stroke-animated" filter="url(#cad-glow-soft)" />
      <circle cx="${startX}" cy="${startY}" r="3" fill="#5de6ff" />
      <circle cx="${endX}" cy="${endY}" r="4" fill="#5de6ff" filter="url(#cad-glow-soft)" />
      <g transform="translate(${midX}, ${midY})" class="leader-annotation-bubble">
        <rect x="-60" y="-10" width="120" height="20" fill="rgba(7, 20, 38, 0.92)" stroke="#5de6ff" stroke-width="0.9" rx="2" />
        <text x="0" y="3.5" fill="#e0f7ff" font-family="'Space Mono', monospace" font-size="7.5" text-anchor="middle">
          [X:${coordX > 0 ? '+' : ''}${coordX} Y:${coordY > 0 ? '+' : ''}${coordY} θ:${angleDeg}°]
        </text>
      </g>
    `;

    leaderLayer.appendChild(g);
  }

  /**
   * Reset all Caliper nodes, leader lines, and rotor
   */
  resetRing() {
    this.lockedCalipers.clear();
    
    // Clear all calipers visually
    CALIPER_CONFIGS.forEach((c, idx) => {
      const nodeEl = document.getElementById(`caliper-node-${idx}`);
      if (nodeEl) nodeEl.classList.remove("caliper-locked");

      const ledEl = document.getElementById(`caliper-led-${idx}`);
      if (ledEl) {
        ledEl.setAttribute("fill", "rgba(93, 230, 255, 0.2)");
        ledEl.removeAttribute("filter");
      }

      const slotEl = document.getElementById(`caliper-slot-${idx}`);
      if (slotEl) {
        slotEl.setAttribute("stroke", "rgba(93, 230, 255, 0.4)");
        slotEl.setAttribute("fill", "rgba(4, 12, 24, 0.9)");
      }

      const glyphSlot = document.getElementById(`caliper-glyph-render-${idx}`);
      if (glyphSlot) glyphSlot.innerHTML = "";
    });

    // Clear leader lines
    const leaderLayer = document.getElementById("layer-drafted-lines");
    if (leaderLayer) leaderLayer.innerHTML = "";

    // Reset rotor
    const rotorEl = document.getElementById("layer-vector-rotor");
    if (rotorEl) rotorEl.style.transform = "rotate(0deg)";
  }
}
