// tuning.js — tuning & traction console: carrier drum, magic eye, beat scope,
// vernier handwheel (drag), goniometer (drag), main contactor. Also populates
// the alarm board on the machine plinth.

import { el, html, jit, polar, clamp, lerp } from './util.js';
import * as sim from './sim.js';
import { S, destById, now } from './sim.js';
import { buildScope, renderScope, eyeClosure } from './scope.js';

const ease = {};
function eased(key, target, k, dt) {
  if (!(key in ease)) ease[key] = target;
  ease[key] = lerp(ease[key], target, clamp(k * dt, 0, 1));
  return ease[key];
}

let lastTripAt = -99;

function rotaryDrag(elm, onDelta) {
  let last = null;
  const angleOf = (e) => {
    const r = elm.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  };
  elm.addEventListener('pointerdown', (e) => {
    try { elm.setPointerCapture(e.pointerId); } catch (_) {} // synthetic events have no active pointer
    last = angleOf(e); e.preventDefault();
  });
  elm.addEventListener('pointermove', (e) => {
    if (last === null) return;
    const a = angleOf(e);
    let d = a - last;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    last = a;
    onDelta(d);
  });
  const end = () => { last = null; };
  elm.addEventListener('pointerup', end);
  elm.addEventListener('pointercancel', end);
}

export function buildTuning() {
  const T = el('tuning-right');
  T.style.left = '1348px'; T.style.top = '462px';

  // goniometer card graduations
  let gonioMarks = '';
  for (let a = 0; a < 360; a += 10) {
    const big = a % 30 === 0;
    const [x0, y0] = polar(0, 0, 64, a), [x1, y1] = polar(0, 0, big ? 52 : 58, a);
    gonioMarks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#c9bd9f" stroke-width="${big ? 2 : 1}" opacity="0.85"/>`;
    if (big) {
      const [tx, ty] = polar(0, 0, 43, a);
      gonioMarks += `<text x="${tx.toFixed(1)}" y="${(ty + 3.5).toFixed(1)}" text-anchor="middle" font-family="Georgia,serif" font-size="9.5" fill="#c9bd9f" transform="rotate(${a} ${tx.toFixed(1)} ${ty.toFixed(1)})">${a}</text>`;
    }
  }

  // vernier wheel spokes
  let vSpokes = '';
  for (let i = 0; i < 5; i++) {
    const a = i * 72 + jit(1);
    const [x1, y1] = polar(0, 0, 74, a);
    vSpokes += `<line x1="0" y1="0" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="url(#leverArmG)" stroke-width="11" stroke-linecap="round"/>`;
  }

  html(T, `
  <svg width="565" height="585" viewBox="0 0 565 585" style="transform:rotate(0.3deg)">
    <defs>
      <linearGradient id="consoleG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#414b42"/><stop offset="0.55" stop-color="#2f3930"/><stop offset="1" stop-color="#1f2820"/>
      </linearGradient>
      <radialGradient id="eyeG" cx="0.4" cy="0.35" r="0.9">
        <stop offset="0" stop-color="#7ee89a"/><stop offset="0.6" stop-color="#2f9a52"/><stop offset="1" stop-color="#123c1e"/>
      </radialGradient>
      <radialGradient id="jewelRed" cx="0.35" cy="0.3" r="1">
        <stop offset="0" stop-color="#f0a08c"/><stop offset="0.4" stop-color="#c23a26"/><stop offset="1" stop-color="#5a120a"/>
      </radialGradient>
      <radialGradient id="jewelGreen" cx="0.35" cy="0.3" r="1">
        <stop offset="0" stop-color="#a8e8b8"/><stop offset="0.4" stop-color="#3f9f5f"/><stop offset="1" stop-color="#123c22"/>
      </radialGradient>
      <radialGradient id="jewelAmber" cx="0.35" cy="0.3" r="1">
        <stop offset="0" stop-color="#f5d9a0"/><stop offset="0.4" stop-color="#d98f2b"/><stop offset="1" stop-color="#5e3a0d"/>
      </radialGradient>
    </defs>

    <rect x="6" y="8" width="552" height="568" rx="10" fill="url(#consoleG)" stroke="#141a14" stroke-width="3"/>
    ${[[24,26],[540,22],[22,558],[542,562],[282,20],[284,564]]
      .map(([x, y]) => `<circle cx="${x + jit(3)}" cy="${y + jit(3)}" r="4.4" fill="url(#rivetG)"/>`).join('')}
    <text x="30" y="48" class="stencil" font-size="19" fill="#c9bd9f" opacity="0.85">TUNING &amp; TRACTION</text>

    <!-- carrier drum -->
    <g transform="translate(30, 66) rotate(-0.5)">
      <rect width="204" height="86" rx="6" fill="#20261f" stroke="#0f130e" stroke-width="2"/>
      <rect x="12" y="14" width="122" height="34" rx="3" fill="#0c0f0a" stroke="#39423a" stroke-width="1.5"/>
      <text id="kc-drum" x="73" y="40" text-anchor="middle" class="typed" font-size="24" fill="#e8dfae" letter-spacing="3">000.0</text>
      <text x="146" y="38" class="stencil" font-size="11" fill="#c9bd9f" opacity="0.75">KC/S</text>
      <rect x="12" y="54" width="84" height="22" rx="3" fill="#0c0f0a" stroke="#39423a" stroke-width="1.2"/>
      <text id="rpm-drum" x="54" y="70" text-anchor="middle" class="typed" font-size="14" fill="#cfc48f" letter-spacing="2">0</text>
      <text x="104" y="70" class="stencil" font-size="10" fill="#c9bd9f" opacity="0.7">REV/MIN</text>
    </g>

    <!-- magic eye + latch jewel -->
    <g transform="translate(292, 108)">
      <circle r="30" fill="#10140f" stroke="#39423a" stroke-width="3"/>
      <circle r="24" fill="url(#eyeG)"/>
      <path id="eye-shadow" d="" fill="#0a1c0e" opacity="0.92"/>
      <circle r="5" fill="#0a1c0e"/>
      <text y="50" text-anchor="middle" class="stencil" font-size="11" fill="#c9bd9f" opacity="0.8">RESONANCE</text>
      <circle id="latch-jewel" cx="52" cy="-12" r="7" fill="#2a3325" stroke="#4d574b" stroke-width="1.6"/>
      <text x="52" y="10" text-anchor="middle" class="typed" font-size="8.5" fill="#9a9276">LATCH</text>
    </g>

    <!-- scope bezel (canvas overlays it) -->
    <g transform="translate(462, 108)">
      <circle r="78" fill="url(#bezelG)"/>
      <circle r="68" fill="#0a0f0a"/>
      <text y="94" text-anchor="middle" class="stencil" font-size="11" fill="#c9bd9f" opacity="0.8">BEAT SCOPE</text>
    </g>

    <!-- vernier handwheel -->
    <g transform="translate(120, 372)">
      <text y="-108" text-anchor="middle" class="stencil" font-size="13" fill="#c9bd9f" opacity="0.85">VERNIER · KC FINE</text>
      <path d="M -60 -84 A 100 100 0 0 1 60 -84" fill="none" stroke="#20261f" stroke-width="8"/>
      <path id="vernier-arc" d="" fill="none" stroke="#c9a55a" stroke-width="4" stroke-linecap="round"/>
      <g id="vernier-wheel" class="grab">
        <g id="vernier-rot">
          <circle r="86" fill="none" stroke="url(#steelRing)" stroke-width="17"/>
          ${vSpokes}
          <circle r="16" fill="url(#boltG)"/>
          <circle cx="0" cy="-66" r="10" fill="url(#knobBlkG)"/>
        </g>
        <circle r="98" fill="transparent"/>
      </g>
    </g>

    <!-- goniometer -->
    <g transform="translate(330, 372)">
      <text y="-108" text-anchor="middle" class="stencil" font-size="13" fill="#c9bd9f" opacity="0.85">GONIOMETER</text>
      <circle r="86" fill="url(#bezelG)"/>
      <circle r="76" fill="#1b211c"/>
      <g id="gonio-card" class="grab">
        <g id="gonio-rot">
          <circle r="70" fill="#232b24" stroke="#39423a" stroke-width="2"/>
          ${gonioMarks}
          <g id="gonio-preset" opacity="0">
            <path d="M 0 -66 L -5 -50 L 5 -50 Z" fill="#c23a26"/>
          </g>
        </g>
        <circle r="86" fill="transparent"/>
      </g>
      <path d="M 0 -84 L -6 -68 L 6 -68 Z" fill="#e8dfae" pointer-events="none"/>
      <rect x="-1.4" y="-68" width="2.8" height="20" fill="#e8dfae" opacity="0.8" pointer-events="none"/>
      <text id="gonio-read" y="26" text-anchor="middle" class="typed" font-size="13" fill="#cfc48f">000°</text>
      <circle id="aim-jewel" cx="66" cy="64" r="7" fill="#2a3325" stroke="#4d574b" stroke-width="1.6"/>
      <text x="66" y="84" text-anchor="middle" class="typed" font-size="8.5" fill="#9a9276">AIM</text>
    </g>

    <!-- main contactor -->
    <g transform="translate(462, 260)">
      <rect x="-38" y="0" width="86" height="300" rx="8" fill="#2a322b" stroke="#11150f" stroke-width="2.5"/>
      <text x="5" y="24" text-anchor="middle" class="stencil" font-size="12" fill="#c9bd9f" opacity="0.85">MAIN</text>
      <text x="5" y="40" text-anchor="middle" class="stencil" font-size="12" fill="#c9bd9f" opacity="0.85">CONTACTOR</text>
      <circle id="arc-jewel" cx="5" cy="66" r="9" fill="#3a2a25" stroke="#5c4a42" stroke-width="2"/>
      <g id="contactor-lever" class="push">
        <g id="contactor-arm" transform="rotate(-26 5 190)">
          <rect x="1" y="86" width="9" height="104" rx="4" fill="url(#leverArmG)"/>
          <circle cx="5" cy="82" r="17" fill="url(#knobRedG)" stroke="#3d120a" stroke-width="1.6"/>
        </g>
        <circle cx="5" cy="190" r="14" fill="url(#boltG)"/>
        <rect x="-40" y="52" width="90" height="160" fill="transparent"/>
      </g>
      <text x="5" y="232" text-anchor="middle" class="typed" font-size="9.5" fill="#9a9276">UP=OPEN</text>
      <text x="5" y="246" text-anchor="middle" class="typed" font-size="9.5" fill="#9a9276">DN=CLOSED</text>
      <text x="5" y="284" text-anchor="middle" class="typed" font-size="9" fill="#8a6a54">DO NOT CLOSE</text>
      <text x="5" y="295" text-anchor="middle" class="typed" font-size="9" fill="#8a6a54">BEFORE ANSWER</text>
    </g>
  </svg>

  <canvas id="scope-canvas" width="132" height="132"
    style="position:absolute; left:396px; top:42px; width:132px; height:132px; border-radius:50%; pointer-events:none;"></canvas>`);

  buildScope(el('scope-canvas'));

  // alarm board on the machine plinth
  const AB = el('alarm-board');
  const jewels = [
    ['j-oil', 'OIL', 'jewelAmber'], ['j-lock', 'LOCK', 'jewelGreen'], ['j-aim', 'AIM', 'jewelGreen'],
    ['j-ansr', 'ANSR', 'jewelGreen'], ['j-arc', 'ARC', 'jewelRed'], ['j-fault', 'FAULT', 'jewelRed'],
  ];
  AB.innerHTML = `
    <rect x="-6" y="-6" width="212" height="74" rx="5" fill="#252c24" stroke="#101410" stroke-width="2"/>
    ${jewels.map(([id, label, _], i) => {
      const x = 14 + (i % 3) * 56 + jit(2), y = 12 + Math.floor(i / 3) * 34 + jit(1.5);
      return `<circle id="${id}" cx="${x}" cy="${y}" r="7.5" fill="#2c2c24" stroke="#4d574b" stroke-width="1.5"/>
              <text x="${x + 12}" y="${y + 3.5}" class="typed" font-size="8.5" fill="#9a9276">${label}</text>`;
    }).join('')}
    <g id="reset-button" class="push">
      <circle cx="186" cy="30" r="13" fill="url(#knobBlkG)" stroke="#0d100c" stroke-width="1.6"/>
      <text x="186" y="56" text-anchor="middle" class="typed" font-size="8.5" fill="#9a9276">RESET</text>
      <circle cx="186" cy="30" r="20" fill="transparent"/>
    </g>`;

  // wiring
  rotaryDrag(el('vernier-wheel'), (d) => sim.nudgeVernier(d / 90));       // 1 turn = 4 kc
  rotaryDrag(el('gonio-card'), (d) => sim.setBearing(sim.bearingAt() + d));
  el('contactor-lever').addEventListener('click', () => sim.toggleContactor());
  el('reset-button').addEventListener('click', () => sim.resetTrips());

  sim.onEvent((type) => { if (type === 'trip') lastTripAt = now(); });
}

function jewel(id, lit, litFill) {
  const j = el(id);
  if (j) j.setAttribute('fill', lit ? `url(#${litFill})` : '#2c2c24');
}

export function renderTuning(t, dt) {
  const kc = sim.kcAt(t);
  el('kc-drum').textContent = kc.toFixed(1).padStart(5, '0');
  el('rpm-drum').textContent = String(Math.round(sim.rpmAt(t)));

  // magic eye: shadow fan closes toward 0° as the beat nulls
  const cl = eyeClosure(t);
  const half = (1 - cl) * 46 + 2; // degrees each side
  const [ax, ay] = polar(0, 0, 24, 180 - half);
  const [bx, by] = polar(0, 0, 24, 180 + half);
  el('eye-shadow').setAttribute('d',
    `M 0 0 L ${ax.toFixed(1)} ${ay.toFixed(1)} A 24 24 0 ${half > 90 ? 1 : 0} 1 ${bx.toFixed(1)} ${by.toFixed(1)} Z`);

  jewel('latch-jewel', S.latched, 'jewelGreen');

  // vernier: wheel angle + trim arc
  const vAng = S.vernierKc * 90;
  el('vernier-rot').setAttribute('transform', `rotate(${eased('vern', vAng, 14, dt).toFixed(1)})`);
  const trimA = -90 + (S.vernierKc / 6) * 52;
  const [tx0, ty0] = polar(0, 0, 100, -52 + 0.001), [tx1, ty1] = polar(0, 0, 100, clamp((S.vernierKc / 6) * 52, -52, 52));
  el('vernier-arc').setAttribute('d',
    `M ${polar(0,0,100,0)[0].toFixed(1)} ${polar(0,0,100,0)[1].toFixed(1)} A 100 100 0 0 ${S.vernierKc >= 0 ? 1 : 0} ${tx1.toFixed(1)} ${ty1.toFixed(1)}`);

  // goniometer: card rotates so current bearing sits under the lubber line
  const brg = sim.bearingAt(t);
  el('gonio-rot').setAttribute('transform', `rotate(${(-brg).toFixed(1)})`);
  el('gonio-read').textContent = String(Math.round(((brg % 360) + 360) % 360)).padStart(3, '0') + '°';
  const d = destById(S.order);
  const preset = el('gonio-preset');
  preset.setAttribute('opacity', d ? '1' : '0');
  if (d) preset.setAttribute('transform', `rotate(${d.brg})`);
  jewel('aim-jewel', S.aimed, 'jewelGreen');

  // contactor: eased throw + trip kick
  let target = S.contactor ? 26 : -26;
  let kick = 0;
  if (t - lastTripAt < 0.5) kick = Math.sin((t - lastTripAt) * 40) * 6 * (1 - (t - lastTripAt) / 0.5);
  el('contactor-arm').setAttribute('transform', `rotate(${(eased('cont', target, 10, dt) + kick).toFixed(1)} 5 190)`);
  jewel('arc-jewel', S.arc === 'open' || S.arc === 'striking', 'jewelRed');

  // alarm board
  const L = sim.lampState();
  jewel('j-oil', S.dieselOn ? !L.oilOk : S.trips.oil, 'jewelAmber');
  jewel('j-lock', L.lock, 'jewelGreen');
  jewel('j-aim', L.aim, 'jewelGreen');
  jewel('j-ansr', L.answer, 'jewelGreen');
  jewel('j-arc', L.arc, 'jewelRed');
  jewel('j-fault', L.fault && (Math.sin(t * 7) > -0.3), 'jewelRed');

  renderScope(t);
}
