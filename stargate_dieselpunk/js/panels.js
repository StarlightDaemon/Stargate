// panels.js — left engine pedestal (fuel cock, air start, clutch, governor
// quadrant, engine gauges) and the framed standing-orders placard.
// Levers ease toward their sim state; nothing logical reads a rendered value.

import { el, html, jit, clamp, lerp } from './util.js';
import { makeGauge, setGauge } from './gauges.js';
import * as sim from './sim.js';
import { S, NOTCH_RPM } from './sim.js';

// eased display values (visual only)
const ease = {};
function eased(key, target, k = 10, dt = 1 / 60) {
  if (!(key in ease)) ease[key] = target;
  ease[key] = lerp(ease[key], target, clamp(k * dt, 0, 1));
  return ease[key];
}

// governor quadrant geometry
const GQ = { cx: 265, cy: 640, r: 150, a0: -64, a1: 64 };
function notchAngle(n) { return GQ.a0 + (GQ.a1 - GQ.a0) * (n / (NOTCH_RPM.length - 1)); }

let airP = 34; // air receiver, visual garnish

export function buildPanels() {
  const P = el('pedestal-left');
  P.style.left = '28px'; P.style.top = '348px';

  html(P, `
  <svg width="540" height="700" viewBox="0 0 540 700" style="transform:rotate(-0.4deg)">
    <defs>
      <linearGradient id="plateG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#454f44"/><stop offset="0.5" stop-color="#333d33"/><stop offset="1" stop-color="#222b22"/>
      </linearGradient>
      <linearGradient id="slotG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#10140f"/><stop offset="0.5" stop-color="#1c221b"/><stop offset="1" stop-color="#10140f"/>
      </linearGradient>
      <linearGradient id="leverArmG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#7d858a"/><stop offset="1" stop-color="#3a3f44"/>
      </linearGradient>
      <radialGradient id="knobRedG" cx="0.32" cy="0.3" r="1">
        <stop offset="0" stop-color="#c66a55"/><stop offset="0.55" stop-color="#8c2e1d"/><stop offset="1" stop-color="#4c150c"/>
      </radialGradient>
      <radialGradient id="knobBlkG" cx="0.32" cy="0.3" r="1">
        <stop offset="0" stop-color="#5a5f58"/><stop offset="0.6" stop-color="#2b2f2a"/><stop offset="1" stop-color="#141612"/>
      </radialGradient>
    </defs>

    <!-- cabinet -->
    <rect x="8" y="6" width="524" height="668" rx="10" fill="url(#plateG)" stroke="#161b15" stroke-width="3"/>
    <rect x="8" y="660" width="524" height="30" fill="#181d17"/>
    ${[[26,26],[268,20],[512,28],[24,664],[510,668],[270,672],[22,340],[514,336]]
      .map(([x, y]) => `<circle cx="${x + jit(3)}" cy="${y + jit(3)}" r="4.6" fill="url(#rivetG)"/>`).join('')}
    <text x="34" y="52" class="stencil" font-size="21" fill="#c9bd9f" opacity="0.85">PRIME MOVER · ENGINE N<tspan font-size="14">o</tspan> 3</text>
    <rect x="32" y="60" width="266" height="3" fill="#c9bd9f" opacity="0.35"/>
    <!-- worn patch of newer paint -->
    <rect x="352" y="410" width="120" height="86" fill="#3f4c3d" opacity="0.7" transform="rotate(1.2 412 453)"/>

    ${makeGauge({ id: 'g-tach', x: 150, y: 160, r: 84, label: 'REVOLUTIONS', sub: 'R.P.M. × 10', min: 0, max: 90, majors: 9, redFrom: 86, tilt: jit(1.2) })}
    ${makeGauge({ id: 'g-oil', x: 335, y: 118, r: 54, label: 'LUB. OIL', sub: 'LB / SQ IN', min: 0, max: 60, majors: 6, redFrom: null, tilt: 1.8, face: '#c9bd9f' })}
    ${makeGauge({ id: 'g-air', x: 452, y: 208, r: 47, label: 'START AIR', sub: 'ATM', min: 0, max: 40, majors: 4, tilt: -2.2, face: '#cdbd93' })}

    <!-- fuel cock -->
    <g transform="translate(78, 330)">
      <rect x="-14" y="-64" width="20" height="150" rx="6" fill="#3a423a"/>
      <rect x="-10" y="-64" width="5" height="150" fill="#5c665c"/>
      <circle r="20" fill="url(#bezelG)"/>
      <g id="fuel-cock" class="push">
        <g id="fuel-handle" transform="rotate(0)">
          <rect x="-9" y="-58" width="18" height="72" rx="8" fill="url(#knobRedG)" stroke="#3d120a" stroke-width="1.4"/>
        </g>
        <circle r="9" fill="url(#boltG)"/>
        <circle r="26" fill="transparent"/>
      </g>
      <text y="46" text-anchor="middle" class="stencil" font-size="13" fill="#c9bd9f" opacity="0.8">FUEL COCK</text>
      <text y="62" text-anchor="middle" class="typed" font-size="9.5" fill="#9a9276">ACROSS = SHUT</text>
    </g>

    <!-- air start lever (hold) -->
    <g transform="translate(196, 262)">
      <rect x="-10" y="0" width="20" height="150" rx="9" fill="url(#slotG)" stroke="#0c0f0b" stroke-width="1.5"/>
      <g id="air-lever" class="push">
        <g id="air-knob" transform="translate(0 18)">
          <rect x="-7" y="0" width="14" height="44" rx="5" fill="url(#leverArmG)"/>
          <circle cy="0" r="17" fill="url(#knobBlkG)" stroke="#101310" stroke-width="1.4"/>
        </g>
        <rect x="-24" y="-6" width="48" height="170" fill="transparent"/>
      </g>
      <text y="176" text-anchor="middle" class="stencil" font-size="13" fill="#c9bd9f" opacity="0.8">AIR START</text>
      <text y="192" text-anchor="middle" class="typed" font-size="9.5" fill="#9a9276">HOLD DOWN TO CRANK</text>
    </g>

    <!-- clutch lever -->
    <g transform="translate(430, 372)">
      <path d="M -46 44 A 60 60 0 0 1 46 44" fill="none" stroke="#20261f" stroke-width="14"/>
      <g id="clutch-lever" class="push">
        <g id="clutch-arm" transform="rotate(-34)">
          <rect x="-8" y="-104" width="16" height="112" rx="7" fill="url(#leverArmG)" stroke="#23282c" stroke-width="1.2"/>
          <circle cy="-108" r="19" fill="url(#knobRedG)" stroke="#3d120a" stroke-width="1.5"/>
        </g>
        <circle r="15" fill="url(#boltG)"/>
        <rect x="-120" y="-130" width="240" height="160" fill="transparent"/>
      </g>
      <text y="74" text-anchor="middle" class="stencil" font-size="13" fill="#c9bd9f" opacity="0.8">MAIN CLUTCH</text>
      <text y="90" text-anchor="middle" class="typed" font-size="9.5" fill="#9a9276">OIL 25 LB BEFORE ENGAGING</text>
    </g>

    <!-- governor quadrant -->
    <g transform="translate(0, 0)">
      <path d="M ${GQ.cx + (GQ.r + 24) * Math.sin(GQ.a0 * Math.PI / 180)} ${GQ.cy - (GQ.r + 24) * Math.cos(GQ.a0 * Math.PI / 180)}
               A ${GQ.r + 24} ${GQ.r + 24} 0 0 1
               ${GQ.cx + (GQ.r + 24) * Math.sin(GQ.a1 * Math.PI / 180)} ${GQ.cy - (GQ.r + 24) * Math.cos(GQ.a1 * Math.PI / 180)}"
            fill="none" stroke="#252d24" stroke-width="46"/>
      ${NOTCH_RPM.map((rpm, n) => {
        const a = notchAngle(n) * Math.PI / 180;
        const x = GQ.cx + (GQ.r + 24) * Math.sin(a), y = GQ.cy - (GQ.r + 24) * Math.cos(a);
        const lx = GQ.cx + (GQ.r + 52) * Math.sin(a), ly = GQ.cy - (GQ.r + 52) * Math.cos(a);
        return `
          <circle id="gov-notch-${n}" class="push" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="#1a201a" stroke="#4d574b" stroke-width="2"/>
          <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" class="typed" font-size="10.5" fill="#b5ac8d">${n === 0 ? 'IDLE' : rpm}</text>`;
      }).join('')}
      <g id="gov-lever">
        <g id="gov-arm" transform="rotate(${notchAngle(0)} ${GQ.cx} ${GQ.cy})">
          <rect x="${GQ.cx - 7}" y="${GQ.cy - GQ.r - 38}" width="14" height="${GQ.r + 38}" rx="6" fill="url(#leverArmG)"/>
          <circle cx="${GQ.cx}" cy="${GQ.cy - GQ.r - 40}" r="16" fill="url(#knobBlkG)" stroke="#111" stroke-width="1.3"/>
        </g>
        <circle cx="${GQ.cx}" cy="${GQ.cy}" r="17" fill="url(#boltG)"/>
      </g>
      <text x="${GQ.cx}" y="${GQ.cy + 44}" text-anchor="middle" class="stencil" font-size="14" fill="#c9bd9f" opacity="0.85">GOVERNOR · SPEED BANDS</text>
      <g id="xtal-jewel">
        <circle cx="${GQ.cx + 128}" cy="${GQ.cy + 36}" r="7.5" fill="#3a3325" stroke="#6b5f3c" stroke-width="2"/>
        <text x="${GQ.cx + 128}" y="${GQ.cy + 58}" text-anchor="middle" class="typed" font-size="9" fill="#9a9276">XTAL GOV</text>
      </g>
    </g>
  </svg>`);

  // ---- placard
  const K = el('placard');
  K.style.left = '46px'; K.style.top = '44px';
  html(K, `
  <svg width="510" height="290" viewBox="0 0 510 290" style="transform:rotate(0.5deg)">
    <rect x="4" y="4" width="500" height="278" rx="4" fill="#171b16" stroke="#3c443c" stroke-width="5"/>
    <rect x="16" y="15" width="477" height="256" fill="#cfc4a6"/>
    <rect x="16" y="15" width="477" height="256" fill="url(#shaftG)" opacity="0.5"/>
    <text x="254" y="44" text-anchor="middle" class="stencil" font-size="19" fill="#33301f" letter-spacing="2">STANDING ORDERS — TRACTION WORKING</text>
    <line x1="40" y1="53" x2="468" y2="53" stroke="#33301f" stroke-width="1.4" opacity="0.7"/>
    ${[
      '1. FUEL COCK OPEN — HOLD AIR START UNTIL ENGINE FIRES.',
      '2. POST A TRAFFIC ORDER FROM THE LEDGER, OR SEAT THE',
      '    ISSUED CRYSTAL. OIL 25 LB, THEN ENGAGE CLUTCH.',
      '3. HAND TUNE: QUADRANT TO SPEED BAND, NULL THE BEAT',
      '    ON THE VERNIER, LAY GONIOMETER ON STAMPED BEARING.',
      '4. CRYSTAL: BRIDGE GOVERNS AND LAYS AIM UNAIDED.',
      '5. KEY THE CALL. AWAIT ANSWERING SIGNATURE ON SCOPE.',
      '6. ONLY THEN CLOSE THE MAIN CONTACTOR.',
    ].map((s, i) => `<text x="42" y="${82 + i * 24 + jit(1.2)}" class="typed" font-size="13.5" fill="#3a3524" transform="rotate(${jit(0.3)} 42 ${82 + i * 24})">${s}</text>`).join('')}
    <text x="42" y="270" class="typed" font-size="10" fill="#6a6248">O.W.T.B. FORM 12 · EARLY CLOSING TRIPS THE OVERLOAD · RESET AT ALARM BOARD</text>
  </svg>`);

  // ---- wiring
  el('fuel-cock').addEventListener('click', () => sim.setFuel(!S.fuelOpen));

  const air = el('air-lever');
  air.addEventListener('pointerdown', (e) => {
    try { air.setPointerCapture(e.pointerId); } catch (_) {} // synthetic events have no active pointer
    sim.crankStart();
  });
  air.addEventListener('pointerup', () => sim.crankEnd());
  air.addEventListener('pointercancel', () => sim.crankEnd());

  el('clutch-lever').addEventListener('click', () => sim.setClutch(!S.clutch));

  for (let n = 0; n < NOTCH_RPM.length; n++) {
    el(`gov-notch-${n}`).addEventListener('click', () => sim.setNotch(n));
  }
}

export function renderPanels(t, dt) {
  const rpm = sim.rpmAt(t);
  const running = S.dieselOn;
  setGauge('g-tach', rpm / 10, running ? 0.7 : 0);
  setGauge('g-oil', sim.oilAt(t), running ? 0.5 : 0);

  // air receiver garnish
  if (S.cranking) airP = Math.max(8, airP - 5 * dt);
  else if (running) airP = Math.min(34, airP + 1.2 * dt);
  setGauge('g-air', airP, S.cranking ? 1.2 : 0);

  // fuel handle: across (0) = shut, along pipe (90) = open
  el('fuel-handle').setAttribute('transform', `rotate(${eased('fuel', S.fuelOpen ? 90 : 0, 9, dt).toFixed(1)})`);

  // air lever slides down while held
  el('air-knob').setAttribute('transform', `translate(0 ${eased('air', S.cranking ? 92 : 18, 12, dt).toFixed(1)})`);

  // clutch arm
  el('clutch-arm').setAttribute('transform', `rotate(${eased('clutch', S.clutch ? 30 : -34, 8, dt).toFixed(1)})`);

  // governor lever follows the EFFECTIVE target (crystal servo drives it visibly)
  let leverN = S.notch;
  if (S.crystalId && S.dieselOn) {
    const tgt = S.rpm.target;
    // fractional notch position for the servo-held lever
    let f = 0;
    for (let n = 0; n < NOTCH_RPM.length - 1; n++) {
      if (tgt >= NOTCH_RPM[n] && tgt <= NOTCH_RPM[n + 1]) {
        f = n + (tgt - NOTCH_RPM[n]) / (NOTCH_RPM[n + 1] - NOTCH_RPM[n]);
        break;
      }
      if (tgt > NOTCH_RPM[NOTCH_RPM.length - 1]) f = NOTCH_RPM.length - 1;
    }
    leverN = f;
  }
  const targetAng = notchAngle(leverN);
  el('gov-arm').setAttribute('transform',
    `rotate(${eased('gov', targetAng, S.crystalId ? 3.5 : 8, dt).toFixed(1)} ${GQ.cx} ${GQ.cy})`);

  // XTAL jewel
  const xj = el('xtal-jewel').firstElementChild;
  xj.setAttribute('fill', S.crystalId ? '#e0b23f' : '#3a3325');
}
