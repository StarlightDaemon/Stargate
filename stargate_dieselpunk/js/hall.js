// hall.js — the machine hall: corrugated wall, roof girder, skylight shaft,
// drifting dust, a tannoy horn (audio toggle), floor with oil staining.

import { el, html, jit, rng } from './util.js';

let dustCtx, motes = [], hornEl;

export function buildHall(onHornToggle) {
  const hall = el('hall');
  html(hall, `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="wallG" x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color="#2c2f2a"/><stop offset="0.5" stop-color="#22251f"/><stop offset="1" stop-color="#181a16"/>
      </linearGradient>
      <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2e2f28"/><stop offset="1" stop-color="#1b1c17"/>
      </linearGradient>
      <linearGradient id="girderG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3b423b"/><stop offset="0.5" stop-color="#262c25"/><stop offset="1" stop-color="#151813"/>
      </linearGradient>
      <linearGradient id="shaftG" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="rgba(255,222,160,0.13)"/>
        <stop offset="0.6" stop-color="rgba(255,214,150,0.05)"/>
        <stop offset="1" stop-color="rgba(255,214,150,0)"/>
      </linearGradient>
      <radialGradient id="bezelG" cx="0.32" cy="0.28" r="1">
        <stop offset="0" stop-color="#8b9096"/><stop offset="0.45" stop-color="#4a4d52"/><stop offset="1" stop-color="#26282b"/>
      </radialGradient>
    </defs>

    <rect width="1920" height="900" fill="url(#wallG)"/>

    <!-- corrugation: uneven sheet widths, a few rust runs -->
    ${(() => {
      let x = 0, out = '';
      while (x < 1920) {
        const w = 46 + jit(6);
        out += `<rect x="${x.toFixed(0)}" y="0" width="${(w * 0.45).toFixed(0)}" height="880" fill="#00000022"/>` +
               `<rect x="${(x + w * 0.45).toFixed(0)}" y="0" width="3" height="880" fill="#ffffff08"/>`;
        x += w;
      }
      for (let i = 0; i < 7; i++) {
        const rx = 120 + rng() * 1680, rw = 5 + rng() * 14, rh = 120 + rng() * 320;
        out += `<rect x="${rx.toFixed(0)}" y="${(80 + rng() * 200).toFixed(0)}" width="${rw.toFixed(0)}" height="${rh.toFixed(0)}" fill="#5a3d24" opacity="${(0.05 + rng() * 0.09).toFixed(2)}"/>`;
      }
      return out;
    })()}

    <!-- sheet seams / horizontal wale -->
    <rect x="0" y="286" width="1920" height="6" fill="#00000033"/>
    <rect x="0" y="592" width="1920" height="6" fill="#00000033"/>

    <!-- roof girder with jittered rivets -->
    <rect x="0" y="18" width="1920" height="58" fill="url(#girderG)"/>
    <rect x="0" y="70" width="1920" height="8" fill="#0d0f0c"/>
    ${Array.from({length: 30}, (_, i) => {
      const x = 30 + i * 64 + jit(9);
      return `<circle cx="${x.toFixed(0)}" cy="${(47 + jit(5)).toFixed(0)}" r="4.4" fill="url(#rivetHallG)"/>`;
    }).join('')}
    <radialGradient id="rivetHallG" cx="0.32" cy="0.3" r="0.9">
      <stop offset="0" stop-color="#79837a"/><stop offset="1" stop-color="#232a24"/>
    </radialGradient>

    <!-- skylight shaft, upper-left -->
    <polygon points="120,76 560,76 980,1080 260,1080" fill="url(#shaftG)"/>

    <!-- floor -->
    <rect x="0" y="900" width="1920" height="180" fill="url(#floorG)"/>
    <rect x="0" y="896" width="1920" height="7" fill="#0e0f0b"/>
    <ellipse cx="700" cy="1006" rx="200" ry="17" fill="#12130e" opacity="0.7"/>
    <ellipse cx="1520" cy="1028" rx="150" ry="13" fill="#12130e" opacity="0.5"/>
    <ellipse cx="330" cy="1042" rx="120" ry="11" fill="#141510" opacity="0.5"/>

    <!-- hazard strip along the gangway approach, worn -->
    <g opacity="0.5">
      ${Array.from({length: 9}, (_, i) =>
        `<rect x="${620 + i * 46}" y="962" width="26" height="10" fill="${i % 2 ? '#8a7420' : '#1c1c16'}" transform="skewX(-32)" opacity="${(0.4 + rng() * 0.5).toFixed(2)}"/>`).join('')}
    </g>
  </svg>

  <canvas id="dust-canvas" width="640" height="720" style="left:150px; top:80px;"></canvas>

  <!-- tannoy horn: audio toggle -->
  <div id="tannoy" class="push" title="Hall tannoy — click to mute/unmute"
       style="position:absolute; left:1735px; top:96px; width:120px; height:100px;">
    <svg width="120" height="100" viewBox="0 0 120 100">
      <path d="M 96 12 L 30 40 L 30 62 L 96 90 Z" fill="url(#girderG)" stroke="#11140f" stroke-width="2"/>
      <ellipse cx="97" cy="51" rx="10" ry="41" fill="#171a15" stroke="#3c443c" stroke-width="2.5"/>
      <rect x="12" y="42" width="20" height="18" rx="3" fill="#333b32"/>
      <rect x="2" y="46" width="12" height="10" rx="2" fill="#262d25"/>
      <circle id="tannoy-lamp" cx="21" cy="51" r="3.4" fill="#d98f2b"/>
    </svg>
  </div>`);

  const dc = el('dust-canvas');
  dustCtx = dc.getContext('2d');
  for (let i = 0; i < 42; i++) {
    motes.push({
      x: Math.random() * 640, y: Math.random() * 720,
      vx: 4 + Math.random() * 7, vy: 6 + Math.random() * 10,
      r: 0.6 + Math.random() * 1.5, o: 0.05 + Math.random() * 0.22,
      ph: Math.random() * 6.3,
    });
  }

  hornEl = el('tannoy');
  hornEl.addEventListener('click', onHornToggle);
}

export function setTannoyLamp(on) {
  const l = el('tannoy-lamp');
  if (l) l.setAttribute('fill', on ? '#d98f2b' : '#4a4234');
}

let lastDust = null;
export function renderHall(t) {
  if (lastDust === null) lastDust = t;
  const dt = Math.min(t - lastDust, 0.1);
  lastDust = t;
  dustCtx.clearRect(0, 0, 640, 720);
  for (const m of motes) {
    m.x += (m.vx + Math.sin(t * 0.6 + m.ph) * 3) * dt;
    m.y += m.vy * dt;
    if (m.y > 720 || m.x > 640) { m.x = Math.random() * 500; m.y = -4; }
    // brighter inside the shaft band (diagonal)
    const inShaft = m.x * 0.9 + 60 > m.y * 0.42 && m.x * 0.9 - 260 < m.y * 0.42;
    dustCtx.fillStyle = `rgba(255,228,175,${(m.o * (inShaft ? 1 : 0.25)).toFixed(3)})`;
    dustCtx.beginPath();
    dustCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    dustCtx.fill();
  }
}
