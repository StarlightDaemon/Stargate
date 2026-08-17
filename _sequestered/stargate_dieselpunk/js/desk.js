// desk.js — the traffic board: destination ledger (click to post an order),
// crystal rack + oven socket (the fast-dial mechanism), transmit key, and
// the posted traffic-order chit. Deliberately a wooden, hand-used object:
// uneven baselines, pencil marks, nothing card-like.

import { el, html, jit, rng } from './util.js';
import * as sim from './sim.js';
import { S, DESTS, destById } from './sim.js';

export function buildDesk() {
  const D = el('desk-right');
  D.style.left = '1328px'; D.style.top = '26px';

  const rows = DESTS.map((d, i) => {
    const y = 104 + i * 27 + jit(1.6);
    const rot = jit(0.5);
    return `
    <g id="ledger-row-${d.id}" class="push" transform="rotate(${rot} 230 ${y})">
      <rect x="222" y="${y - 15}" width="332" height="24" fill="transparent"/>
      <text x="230" y="${y}" class="typed" font-size="13" fill="#33301f">${d.name}</text>
      <text x="398" y="${y}" class="typed" font-size="13" fill="#33301f">${d.call}</text>
      <text x="428" y="${y}" class="typed" font-size="13" fill="#33301f">${d.kc.toFixed(1)}</text>
      <text x="482" y="${y}" class="typed" font-size="13" fill="#33301f">${String(d.brg).padStart(3, '0')}°</text>
      <text id="tick-${d.id}" x="522" y="${y}" class="typed" font-size="14" fill="#5a4630" opacity="0">✓</text>
      ${d.crystal ? `<circle cx="545" cy="${y - 4}" r="3.5" fill="#8a6d3b"/>` : ''}
    </g>`;
  }).join('');

  html(D, `
  <svg width="595" height="440" viewBox="0 0 595 440" style="transform:rotate(0.35deg)">
    <defs>
      <linearGradient id="woodG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4f3d28"/><stop offset="0.5" stop-color="#3d2e1e"/><stop offset="1" stop-color="#2a1f14"/>
      </linearGradient>
      <linearGradient id="paperG" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="#d8cdb4"/><stop offset="1" stop-color="#bfb290"/>
      </linearGradient>
      <linearGradient id="paper2G" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="#ddd3bc"/><stop offset="1" stop-color="#c7ba9a"/>
      </linearGradient>
      <linearGradient id="bakeliteG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4a3226"/><stop offset="0.6" stop-color="#301f16"/><stop offset="1" stop-color="#1d130c"/>
      </linearGradient>
    </defs>

    <!-- wooden backboard, grain lines -->
    <rect x="6" y="4" width="583" height="430" rx="7" fill="url(#woodG)" stroke="#191209" stroke-width="3"/>
    ${Array.from({length: 9}, (_, i) =>
      `<path d="M 12 ${34 + i * 48 + jit(9)} q 150 ${jit(7)} 290 ${jit(4)} t 285 ${jit(6)}" stroke="#00000026" stroke-width="${(1 + rng() * 2).toFixed(1)}" fill="none"/>`).join('')}
    <text x="297" y="30" text-anchor="middle" class="stencil" font-size="16" fill="#c9a55a" opacity="0.9" letter-spacing="2">TRAFFIC · OVERLAND NET</text>

    <!-- ledger page, pinned -->
    <g transform="rotate(-0.8 380 190)">
      <rect x="212" y="46" width="352" height="258" fill="url(#paperG)" stroke="#8f8468" stroke-width="1"/>
      <rect x="212" y="46" width="352" height="258" fill="none" stroke="#00000022" stroke-width="4"/>
      <circle cx="228" cy="58" r="4" fill="#7d848a"/><circle cx="549" cy="60" r="4" fill="#7d848a"/>
      <text x="230" y="72" class="typed" font-size="11" fill="#6a6248">WORKING STATIONS — LEDGER 9 — SHEET 41</text>
      <text x="230" y="88" class="typed" font-size="10" fill="#6a6248">STATION            CALL  KC/S  BRG   ·=XTAL ISSUED</text>
      <line x1="224" y1="93" x2="552" y2="93" stroke="#6a6248" stroke-width="0.8"/>
      ${rows}
      <text x="252" y="286" class="typed" font-size="10.5" fill="#7a6248" transform="rotate(-1.2 252 286)">SF: signature drifts — HAND TUNE ONLY  (pencil, Fitch)</text>
    </g>

    <!-- crystal rack -->
    <g transform="translate(30, 158) rotate(-0.6)">
      <rect width="172" height="150" rx="6" fill="#39413a" stroke="#161b16" stroke-width="2.5"/>
      <text x="86" y="18" text-anchor="middle" class="stencil" font-size="12" fill="#c9bd9f" opacity="0.85">CHANNEL CRYSTALS</text>
      ${DESTS.filter(d => d.crystal).map((d, i) => {
        const cx = 14 + (i % 2) * 84 + jit(2.5), cy = 30 + Math.floor(i / 2) * 58 + jit(2.5);
        return `
        <g id="xtal-${d.id}" class="push" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${jit(1.4)})">
          <rect width="72" height="48" rx="4" fill="#232a24"/>
          <g id="xtal-can-${d.id}">
            <rect x="6" y="5" width="60" height="38" rx="3" fill="url(#bakeliteG)" stroke="#0f0a06" stroke-width="1.2"/>
            <rect x="12" y="11" width="48" height="15" rx="2" fill="url(#paper2G)"/>
            <text x="36" y="22" text-anchor="middle" class="typed" font-size="9.5" fill="#33301f">${d.call} ${d.kc.toFixed(1)}</text>
            <circle cx="26" cy="36" r="2.6" fill="#8a6d3b"/><circle cx="46" cy="36" r="2.6" fill="#8a6d3b"/>
          </g>
        </g>`;
      }).join('')}
    </g>

    <!-- oven socket -->
    <g id="xtal-socket" class="push" transform="translate(52, 322)">
      <rect width="128" height="92" rx="6" fill="#2c342d" stroke="#141a15" stroke-width="2.5"/>
      <rect x="24" y="14" width="80" height="52" rx="3" fill="#191f1a" stroke="#3e463e" stroke-width="1.5"/>
      <g id="socket-can" opacity="0">
        <rect x="30" y="19" width="68" height="42" rx="3" fill="url(#bakeliteG)" stroke="#0f0a06" stroke-width="1.2"/>
        <rect x="37" y="26" width="54" height="16" rx="2" fill="url(#paper2G)"/>
        <text id="socket-label" x="64" y="38" text-anchor="middle" class="typed" font-size="10" fill="#33301f"></text>
      </g>
      <circle id="oven-lamp" cx="12" cy="14" r="4.5" fill="#4a3d2a"/>
      <text x="64" y="82" text-anchor="middle" class="stencil" font-size="11" fill="#c9bd9f" opacity="0.8">OVEN SOCKET</text>
    </g>

    <!-- transmit key -->
    <g transform="translate(330, 318) rotate(-0.9)">
      <rect width="222" height="98" rx="8" fill="url(#woodG)" stroke="#191209" stroke-width="2"/>
      <rect x="10" y="64" width="202" height="24" rx="4" fill="#241a10"/>
      <g id="key-arm-g">
        <g id="key-rocker" transform="rotate(0 60 62)">
          <rect x="34" y="54" width="150" height="9" rx="4" fill="url(#brassG)" stroke="#4e3d20" stroke-width="1"/>
          <circle cx="172" cy="50" r="15" fill="url(#bakeliteG)" stroke="#100a05" stroke-width="1.4"/>
        </g>
        <rect x="42" y="40" width="18" height="30" fill="#6b5330"/>
        <circle cx="51" cy="44" r="7" fill="url(#brassG)"/>
      </g>
      <g id="key-arm" class="push"><rect x="120" y="18" width="100" height="72" fill="transparent"/></g>
      <text x="70" y="28" class="stencil" font-size="12.5" fill="#c9a55a" opacity="0.9">TRANSMIT · CODER</text>
    </g>

    <!-- traffic order chit (posted order) -->
    <g id="order-chit-g" transform="translate(30, 40) rotate(-2)">
      <rect x="60" y="0" width="16" height="12" rx="2" fill="#7d848a"/>
      <g id="order-chit" opacity="0">
        <rect x="0" y="8" width="150" height="104" fill="url(#paper2G)" stroke="#8f8468" stroke-width="1"/>
        <text x="10" y="26" class="typed" font-size="10" fill="#6a6248">TRAFFIC ORDER — 77B</text>
        <text id="chit-name" x="10" y="45" class="typed" font-size="11.5" fill="#33301f"></text>
        <text id="chit-freq" x="10" y="63" class="typed" font-size="11.5" fill="#33301f"></text>
        <text id="chit-brg" x="10" y="81" class="typed" font-size="11.5" fill="#33301f"></text>
        <text id="chit-mode" x="10" y="99" class="typed" font-size="10" fill="#7a3020" transform="rotate(-4 10 99)"></text>
      </g>
    </g>
  </svg>`);

  // wiring
  for (const d of DESTS) {
    el(`ledger-row-${d.id}`).addEventListener('click', () => sim.postOrder(d.id));
    if (d.crystal) {
      el(`xtal-${d.id}`).addEventListener('click', () => {
        if (S.crystalId === d.id) sim.removeCrystal();
        else sim.insertCrystal(d.id);
      });
    }
  }
  el('xtal-socket').addEventListener('click', () => sim.removeCrystal());
  el('key-arm').addEventListener('click', () => sim.pressKey());

  sim.onEvent((type) => {
    if (type === 'order' || type === 'crystal') refreshPaper();
  });
  refreshPaper();
}

function refreshPaper() {
  const d = destById(S.order);
  for (const dd of DESTS) {
    const tick = el(`tick-${dd.id}`);
    if (tick) tick.setAttribute('opacity', S.order === dd.id ? '0.9' : '0');
    if (dd.crystal) {
      el(`xtal-can-${dd.id}`).setAttribute('opacity', S.crystalId === dd.id ? '0' : '1');
    }
  }
  el('socket-can').setAttribute('opacity', S.crystalId ? '1' : '0');
  el('oven-lamp').setAttribute('fill', S.crystalId ? '#d98f2b' : '#4a3d2a');
  if (S.crystalId) el('socket-label').textContent = destById(S.crystalId).call + ' ' + destById(S.crystalId).kc.toFixed(1);

  el('order-chit').setAttribute('opacity', d ? '1' : '0');
  if (d) {
    el('chit-name').textContent = `${d.name}  «${d.call}»`;
    el('chit-freq').textContent = `CARRIER ${d.kc.toFixed(1)} KC/S`;
    el('chit-brg').textContent = `BEARING ${String(d.brg).padStart(3, '0')}°`;
    el('chit-mode').textContent = d.crystal ? (S.crystalId === d.id ? 'CRYSTAL WORKING' : 'XTAL ISSUED') : 'HAND TUNE ONLY';
  }
}

export function renderDesk(t) {
  // key rocker taps while the coder drum runs
  const rocker = el('key-rocker');
  if (S.keying) {
    const ph = (t - S.keyT0) * 9;
    const down = (Math.sin(ph) > -0.2 && Math.sin(ph * 1.7 + 1) > 0) ? 3.4 : 0;
    rocker.setAttribute('transform', `rotate(${down} 60 62)`);
  } else {
    rocker.setAttribute('transform', 'rotate(0 60 62)');
  }
}
