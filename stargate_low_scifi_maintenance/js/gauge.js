// Bakelite panel meters. SVG face, needle driven by an underdamped
// spring so it overshoots and settles like a real movement.

const SWEEP_FROM = -50;   // degrees from vertical
const SWEEP_TO = 50;

export function makeGauge({ label, unit, min, max, zones = [], ticks = 10 }) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = document.createElement('div');
  el.className = 'gauge';

  const cx = 60, cy = 76, rFace = 52, rArc = 44;

  const angFor = v => SWEEP_FROM + (SWEEP_TO - SWEEP_FROM) * (v - min) / (max - min);
  const pt = (ang, r) => {
    const a = (ang - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arcPath = (a0, a1, r) => {
    const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };

  let inner = `
    <rect x="4" y="4" width="112" height="86" rx="6" fill="#efe9d8"/>
    <rect x="4" y="4" width="112" height="86" rx="6" fill="none" stroke="#1b1712" stroke-width="1.4" opacity=".65"/>`;

  for (const z of zones) {
    inner += `<path d="${arcPath(angFor(z.from), angFor(z.to), rArc)}" stroke="${z.color}" stroke-width="5" fill="none" opacity=".85"/>`;
  }

  for (let i = 0; i <= ticks; i++) {
    const v = min + (max - min) * i / ticks;
    const a = angFor(v);
    const major = i % (ticks / 5) === 0;
    const [x0, y0] = pt(a, rArc + 3.5);
    const [x1, y1] = pt(a, rArc - (major ? 6 : 3));
    inner += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#211d16" stroke-width="${major ? 1.6 : 0.8}"/>`;
    if (major) {
      const [tx, ty] = pt(a, rArc - 13);
      inner += `<text x="${tx.toFixed(1)}" y="${(ty + 3).toFixed(1)}" font-size="7.5" text-anchor="middle" fill="#211d16" font-family="Consolas, monospace">${Math.round(v)}</text>`;
    }
  }

  inner += `
    <text x="${cx}" y="40" font-size="8.5" text-anchor="middle" fill="#211d16" letter-spacing="1.5" font-weight="bold">${label}</text>
    <text x="${cx}" y="50" font-size="6.5" text-anchor="middle" fill="#5c5645">${unit}</text>
    <g id="needle" transform="rotate(0 ${cx} ${cy})">
      <line x1="${cx}" y1="${cy + 8}" x2="${cx}" y2="${cy - rFace + 10}" stroke="#14100c" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="5.5" fill="#14100c"/>
      <circle cx="${cx}" cy="${cy}" r="2" fill="#3a332a"/>
    </g>
    <rect x="4" y="80" width="112" height="10" rx="3" fill="#0f0d0a" opacity=".18"/>`;

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 94');
  svg.innerHTML = inner;
  el.appendChild(svg);

  const needle = svg.querySelector('#needle');

  // spring state
  let value = min, vel = 0, target = min, jitter = 0;

  function tick(dt) {
    const K = 68, C = 7.5;
    const goal = Math.max(min, Math.min(max, target + jitter));
    vel += (K * (goal - value) - C * vel) * dt;
    value += vel * dt;
    needle.setAttribute('transform', `rotate(${angFor(Math.max(min, Math.min(max, value))).toFixed(2)} ${cx} ${cy})`);
  }

  return {
    el,
    tick,
    set target(v) { target = v; },
    get target() { return target; },
    set jitter(j) { jitter = j; },
    get value() { return value; },
  };
}
