// ============================================================================
//  Observation sphere renderer — what the pilot sees through the acrylic.
//  Water column light falloff, marine snow, lamp cones, bioluminescence at
//  the Lantern Line, the Threshold ring and its opening aperture, plus the
//  HUD (attitude ladder, reticle, depth). Pure canvas, no textures.
// ============================================================================
import { VESSEL, GLYPH_BY_ID } from './data.js';

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export class Viewport {
  constructor(canvas, size) {
    this.canvas = canvas; this.size = size; this.ctx = canvas.getContext('2d');
    this.particles = []; this.flashes = []; this.t = 0;
    this.motion = 1; this.renderScale = 1;
    this.setRenderScale(1);
    this.setMood({ accent: '#35d6ff', accent2: '#7cf3ff', warn: '#ffb347', danger: '#ff4d5e' });
    this._seed();
  }
  setRenderScale(s) {
    this.renderScale = s;
    const px = Math.round(this.size * s);
    if (this.canvas.width !== px) { this.canvas.width = px; this.canvas.height = px; }
  }
  setMood(m) { this.accent = hexToRgb(m.accent); this.accent2 = hexToRgb(m.accent2); this.warn = hexToRgb(m.warn); this.danger = hexToRgb(m.danger); }
  _seed() {
    const n = 220; this.particles = [];
    for (let i = 0; i < n; i++) this.particles.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, r: 0.6 + Math.random() * 1.8, p: Math.random() * 6.28 });
  }

  draw(sim, dt, phase) {
    const ctx = this.ctx, S = this.size, s = this.renderScale;
    this.t += dt;
    const t = this.t;
    const tel = sim.telemetry || { depth: 0, lux: 2000 };
    const depth = tel.depth;
    const n = Math.min(1, depth / VESSEL.ratedDepth);
    const light = Math.min(1, Math.pow(Math.exp(-depth / 260), 0.6)) * (1 - sim.lightDim * 0.9);
    const lamps = depth > 150 ? Math.min(1, (depth - 150) / 150) : 0;
    const motion = this.motion;
    const shakeAmp = sim.shake * 6 * motion;
    const sx = (Math.random() - 0.5) * shakeAmp, sy = (Math.random() - 0.5) * shakeAmp;

    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); ctx.clip();
    ctx.translate(sx, sy);

    // --- water column
    const surfTop = [18, 110, 160], surfBot = [4, 40, 70];
    const deepTop = [2, 10, 20], deepBot = [0, 2, 6];
    const top = mix(deepTop, surfTop, light), bot = mix(deepBot, surfBot, light);
    const g = ctx.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, rgba(top, 1)); g.addColorStop(1, rgba(bot, 1));
    ctx.fillStyle = g; ctx.fillRect(-20, -20, S + 40, S + 40);
    // sun shafts while shallow
    if (light > 0.08) {
      ctx.save(); ctx.globalAlpha = light * 0.35;
      for (let i = 0; i < 5; i++) {
        const x = S * (0.15 + i * 0.18) + Math.sin(t * 0.3 + i) * 18;
        const sg = ctx.createLinearGradient(x, 0, x + 40, S);
        sg.addColorStop(0, 'rgba(180,230,255,0.35)'); sg.addColorStop(1, 'rgba(180,230,255,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + 30, -10); ctx.lineTo(x + 110, S); ctx.lineTo(x + 10, S); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // --- lamp cones
    if (lamps > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const lampCol = mix([255, 236, 200], this.accent, 0.25);
      for (const side of [-1, 1]) {
        const lx = S / 2 + side * S * 0.42, ly = S * 0.92;
        const lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, S * 0.62);
        lg.addColorStop(0, rgba(lampCol, 0.26 * lamps)); lg.addColorStop(0.5, rgba(lampCol, 0.07 * lamps)); lg.addColorStop(1, rgba(lampCol, 0));
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(S / 2 - side * S * 0.15, -S * 0.1); ctx.lineTo(S / 2 - side * S * 0.55, -S * 0.1); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // --- Threshold ring (approach & active)
    this._drawRing(ctx, sim, S, t, phase);
    // --- marine snow
    const vel = sim.vel || 0;
    const rise = (vel * 0.0009 + 0.012) * dt * motion;
    const pCount = Math.round(this.particles.length * (motion < 0.5 ? 0.4 : motion > 1.5 ? 1 : 0.75));
    ctx.save();
    const snowCol = lamps > 0 ? mix([210, 220, 230], this.accent2, 0.2) : mix([120, 180, 220], this.accent, 0.4);
    for (let i = 0; i < pCount; i++) {
      const p = this.particles[i];
      p.y -= rise * p.z; p.x += Math.sin(t * 0.4 + p.p) * 0.00025 * p.z;
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
      const a = (lamps > 0 ? 0.55 : 0.22 + light * 0.4) * p.z * (0.6 + 0.4 * Math.sin(t * 2 + p.p));
      ctx.fillStyle = rgba(snowCol, a);
      ctx.beginPath(); ctx.arc(p.x * S, p.y * S, p.r * p.z, 0, 6.283); ctx.fill();
    }
    ctx.restore();
    // --- bioluminescence at the Lantern Line
    if (depth > 560 && depth < 860 && Math.random() < 0.12 * motion) {
      this.flashes.push({ x: Math.random() * S, y: Math.random() * S, r: 4 + Math.random() * 14, a: 1, hue: Math.random() < 0.7 ? this.accent : this.accent2 });
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    this.flashes = this.flashes.filter(f => f.a > 0.02);
    for (const f of this.flashes) {
      f.a *= Math.pow(0.1, dt); f.y -= 6 * dt;
      const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      fg.addColorStop(0, rgba(f.hue, 0.8 * f.a)); fg.addColorStop(1, rgba(f.hue, 0));
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
    }
    ctx.restore();
    ctx.restore(); // un-shake for HUD

    // --- HUD overlay
    this._drawHUD(ctx, sim, S, t, phase);
    // --- acrylic sphere: edge vignette + specular
    ctx.save();
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, 6.283); ctx.clip();
    const vg = ctx.createRadialGradient(S / 2, S / 2, S * 0.33, S / 2, S / 2, S * 0.5);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, S, S);
    const sp = ctx.createRadialGradient(S * 0.3, S * 0.22, 0, S * 0.3, S * 0.22, S * 0.35);
    sp.addColorStop(0, 'rgba(255,255,255,0.07)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp; ctx.fillRect(0, 0, S, S);
    ctx.restore();
  }

  _drawRing(ctx, sim, S, t, phase) {
    const glow = sim.ringGlow, ap = sim.aperture;
    const show = phase === 'pending' || phase === 'buildup' || phase === 'breakthrough' || phase === 'active' || (phase === 'ascending' && glow > 0.01);
    if (!show) return;
    let cy, R, alpha;
    if (phase === 'pending') { cy = S * 0.86; R = S * 0.16; alpha = 0.35 + 0.1 * Math.sin(t * 1.5); }
    else if (phase === 'buildup') { const u = glow / 0.35; cy = S * 0.86 - (S * 0.36) * u; R = S * 0.16 + S * 0.19 * u; alpha = 0.45 + 0.5 * u; }
    else { cy = S * 0.5; R = S * 0.35; alpha = 0.95; }
    const cx = S / 2;
    const A = this.accent, A2 = this.accent2;
    ctx.save();
    // outer basalt lip — dark with lit edge
    ctx.lineWidth = 16; ctx.strokeStyle = `rgba(0,0,0,${0.55 * alpha})`;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * (phase === 'pending' || phase === 'buildup' ? 0.42 + 0.58 * (glow / 0.35 > 1 ? 1 : glow / 0.35) : 1), 0, 0, 6.283); ctx.stroke();
    const squash = (phase === 'pending' || phase === 'buildup') ? 0.42 + 0.58 * Math.min(1, glow / 0.35) : 1;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 4; ctx.strokeStyle = rgba(A, 0.55 * alpha * (0.5 + glow));
    ctx.shadowColor = rgba(A, 0.9); ctx.shadowBlur = 18 * glow + 4;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * squash, 0, 0, 6.283); ctx.stroke();
    // glyph marks around the lip
    ctx.shadowBlur = 0; ctx.lineWidth = 2.2;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * 6.283 + t * 0.15 * (phase === 'active' ? 1 : 0.2);
      const x1 = cx + Math.cos(a) * (R - 10), y1 = cy + Math.sin(a) * (R - 10) * squash;
      const x2 = cx + Math.cos(a) * (R + 8), y2 = cy + Math.sin(a) * (R + 8) * squash;
      ctx.strokeStyle = rgba(A2, (0.25 + 0.7 * glow) * alpha * (0.5 + 0.5 * Math.sin(t * 3 + i)));
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // aperture: iris blades open to reveal the core
    if (ap > 0.001 || glow > 0.36) {
      const coreR = R * 0.82;
      const open = ap;
      // core light
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      cg.addColorStop(0, rgba([255, 255, 255], 0.95 * open)); cg.addColorStop(0.25, rgba(A2, 0.85 * open)); cg.addColorStop(0.7, rgba(A, 0.35 * open)); cg.addColorStop(1, rgba(A, 0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy, coreR, coreR * squash, 0, 0, 6.283); ctx.fill();
      // rotating inner lattice
      ctx.lineWidth = 1.5;
      for (let ring = 1; ring <= 3; ring++) {
        const rr = coreR * (0.25 * ring) * (0.4 + 0.6 * open);
        ctx.strokeStyle = rgba(A2, 0.5 * open);
        ctx.setLineDash([rr * 0.4, rr * 0.25]); ctx.lineDashOffset = t * 30 * (ring % 2 ? 1 : -1);
        ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * squash, 0, 0, 6.283); ctx.stroke();
      }
      ctx.setLineDash([]);
      // iris blades (closing portion)
      const blades = 9;
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < blades; i++) {
        const a0 = i / blades * 6.283 + t * 0.05, a1 = a0 + 6.283 / blades;
        const inner = coreR * open;
        ctx.fillStyle = `rgba(4,10,18,${0.92})`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a0) * inner, cy + Math.sin(a0) * inner * squash);
        ctx.lineTo(cx + Math.cos(a0) * coreR, cy + Math.sin(a0) * coreR * squash);
        ctx.lineTo(cx + Math.cos(a1) * coreR, cy + Math.sin(a1) * coreR * squash);
        ctx.lineTo(cx + Math.cos(a1) * inner, cy + Math.sin(a1) * inner * squash);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(A, 0.35 + 0.3 * glow); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * inner, cy + Math.sin(a0) * inner * squash); ctx.lineTo(cx + Math.cos(a0) * coreR, cy + Math.sin(a0) * coreR * squash); ctx.stroke();
      }
      // light rays when open
      if (open > 0.5) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * 6.283 + t * 0.08;
          const len = coreR * (1.1 + 0.5 * Math.abs(Math.sin(t * 0.9 + i * 1.7)));
          const rg = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
          rg.addColorStop(0, rgba(A2, 0.22 * (open - 0.5) * 2)); rg.addColorStop(1, rgba(A2, 0));
          ctx.strokeStyle = rg; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  _drawHUD(ctx, sim, S, t, phase) {
    const A = this.accent, A2 = this.accent2;
    const tel = sim.telemetry || { depth: 0, vel: 0 };
    ctx.save();
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, 6.283); ctx.clip();
    const cx = S / 2, cy = S / 2;
    ctx.strokeStyle = rgba(A, 0.5); ctx.fillStyle = rgba(A, 0.85); ctx.lineWidth = 1.2;
    ctx.font = `600 ${S * 0.022}px "Rajdhani", "Segoe UI", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // attitude ladder: horizon rotates with roll, shifts with pitch
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(sim.roll * Math.PI / 180); ctx.translate(0, sim.pitch * S * 0.012);
    for (let i = -3; i <= 3; i++) {
      const y = i * S * 0.085; const w = i === 0 ? S * 0.22 : S * 0.12;
      ctx.globalAlpha = i === 0 ? 0.8 : 0.35;
      ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(-S * 0.05, y); ctx.moveTo(S * 0.05, y); ctx.lineTo(w, y); ctx.stroke();
      if (i !== 0) { ctx.textAlign = 'left'; ctx.fillText(`${-i * 5}°`, w + 6, y); ctx.textAlign = 'right'; ctx.fillText(`${-i * 5}°`, -w - 6, y); }
    }
    ctx.restore();
    ctx.globalAlpha = 0.9; ctx.textAlign = 'center';
    // reticle
    ctx.strokeStyle = rgba(A2, 0.8); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, S * 0.035, 0, 6.283); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - S * 0.05, cy); ctx.lineTo(cx - S * 0.035, cy); ctx.moveTo(cx + S * 0.035, cy); ctx.lineTo(cx + S * 0.05, cy); ctx.moveTo(cx, cy - S * 0.05); ctx.lineTo(cx, cy - S * 0.035); ctx.stroke();
    // depth readout top
    ctx.fillStyle = rgba(A2, 0.95); ctx.font = `700 ${S * 0.05}px "Rajdhani", "Segoe UI", sans-serif`;
    ctx.fillText(`${Math.round(tel.depth).toString().padStart(5, '0')} m`, cx, S * 0.13);
    ctx.font = `600 ${S * 0.02}px "Rajdhani", "Segoe UI", sans-serif`; ctx.fillStyle = rgba(A, 0.8);
    ctx.fillText('SPHERE DEPTH', cx, S * 0.095);
    // vertical speed ladder (left) and hull load (right)
    ctx.textAlign = 'left'; ctx.fillText('V/S', S * 0.12, S * 0.40);
    const vs = tel.vel || 0;
    ctx.fillStyle = rgba(vs > 0 ? A : A2, 0.95); ctx.font = `700 ${S * 0.03}px "Rajdhani", "Segoe UI", sans-serif`;
    const tc = window.__TIME_COMPRESSION || 240;
    ctx.fillText(sim.auto ? 'REPLAY' : `${vs >= 0 ? '▼' : '▲'} ${Math.abs(vs * 60 / tc).toFixed(1)} m/min`, S * 0.12, S * 0.44);
    ctx.textAlign = 'right'; ctx.font = `600 ${S * 0.02}px "Rajdhani", "Segoe UI", sans-serif`; ctx.fillStyle = rgba(A, 0.8);
    ctx.fillText('HULL', S * 0.88, S * 0.40);
    const hl = tel.hullLoad || 0; const hc = hl > 95 ? this.danger : hl > 80 ? this.warn : A2;
    ctx.fillStyle = rgba(hc, 0.95); ctx.font = `700 ${S * 0.03}px "Rajdhani", "Segoe UI", sans-serif`;
    ctx.fillText(`${hl.toFixed(1)} %`, S * 0.88, S * 0.44);
    // phase banner bottom
    ctx.textAlign = 'center'; ctx.font = `700 ${S * 0.026}px "Rajdhani", "Segoe UI", sans-serif`;
    const label = { idle: sim.holdDepth > 0 ? 'NEUTRAL HOLD' : 'SURFACE — IDLE', locking: sim.lock && sim.lock.stage === 'settle' ? 'SETTLING · THRUSTERS CORRECTING' : 'FLOODING BALLAST', pending: 'APPROACH HOLD · READY', buildup: 'FINAL DESCENT', breakthrough: 'APERTURE OPENING', active: 'RING HOLD · ACTIVE', ascending: 'EMERGENCY ASCENT' }[phase] || '';
    const lc = phase === 'ascending' ? this.warn : phase === 'active' ? A2 : A;
    ctx.fillStyle = rgba(lc, 0.9 * (phase === 'locking' ? 0.6 + 0.4 * Math.abs(Math.sin(t * 6)) : 1));
    ctx.fillText(label, cx, S * 0.83);
    if (phase === 'active') {
      const secs = Math.floor((performance.now() - sim.activeSince) / 1000);
      ctx.font = `600 ${S * 0.02}px "Rajdhani", "Segoe UI", sans-serif`; ctx.fillStyle = rgba(A, 0.8);
      ctx.fillText(`HOLD ${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`, cx, S * 0.87);
    }
    ctx.restore();
  }
}

// ============================================================================
//  Crush-depth gauge — SVG ring around the sphere. 270° sweep, 0 → 12 000 m,
//  rated depth 11 000 m, red band above it.
// ============================================================================
export class Gauge {
  constructor(svg) {
    this.svg = svg; this.R = 430; this.r = 396; this.start = -225; this.sweep = 270;
    this.max = VESSEL.gaugeMax;
    this._build();
  }
  ang(depth) { return this.start + this.sweep * Math.min(1, Math.max(0, depth / this.max)); }
  pt(deg, r) { const a = deg * Math.PI / 180; return [Math.cos(a) * r, Math.sin(a) * r]; }
  arc(d0, d1, r) {
    const a0 = this.ang(d0), a1 = this.ang(d1);
    if (a1 - a0 < 0.01) return '';
    const [x0, y0] = this.pt(a0, r), [x1, y1] = this.pt(a1, r);
    const large = (a1 - a0) > 180 ? 1 : 0;
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  band(d0, d1, r0, r1) {
    const a0 = this.ang(d0), a1 = this.ang(d1);
    const [ax, ay] = this.pt(a0, r1), [bx, by] = this.pt(a1, r1), [cx, cy] = this.pt(a1, r0), [dx, dy] = this.pt(a0, r0);
    const large = (a1 - a0) > 180 ? 1 : 0;
    return `M ${ax.toFixed(2)} ${ay.toFixed(2)} A ${r1} ${r1} 0 ${large} 1 ${bx.toFixed(2)} ${by.toFixed(2)} L ${cx.toFixed(2)} ${cy.toFixed(2)} A ${r0} ${r0} 0 ${large} 0 ${dx.toFixed(2)} ${dy.toFixed(2)} Z`;
  }
  _el(tag, attrs, parent) { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || this.svg).appendChild(e); return e; }
  _build() {
    const svg = this.svg; svg.setAttribute('viewBox', '-450 -450 900 900');
    const g = this._el('g', { class: 'gauge-static' });
    this._el('path', { d: this.band(0, this.max, this.r, this.R), class: 'g-track' }, g);
    this._el('path', { d: this.band(0, VESSEL.ratedDepth, this.r, this.R), class: 'g-rated' }, g);
    this._el('path', { d: this.band(VESSEL.ratedDepth, this.max, this.r, this.R), class: 'g-danger' }, g);
    this._el('path', { d: this.band(VESSEL.crushDepth, this.max, this.r - 6, this.R + 6), class: 'g-crush' }, g);
    // ticks
    for (let d = 0; d <= this.max; d += 250) {
      const major = d % 1000 === 0; const a = this.ang(d);
      const [x0, y0] = this.pt(a, this.r - (major ? 14 : 6)), [x1, y1] = this.pt(a, this.r - 1);
      this._el('line', { x1: x0, y1: y0, x2: x1, y2: y1, class: major ? 'g-tick-major' : 'g-tick' }, g);
      if (major) {
        const [tx, ty] = this.pt(a, this.r - 30);
        const tl = this._el('text', { x: tx, y: ty, class: 'g-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, g);
        tl.textContent = d === 0 ? '0' : `${d / 1000}k`;
      }
    }
    const [rx, ry] = this.pt(this.ang(VESSEL.ratedDepth), this.R + 22);
    const rl = this._el('text', { x: rx, y: ry, class: 'g-rated-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, g);
    rl.textContent = 'RATED 11 000';
    // dynamic
    this.profileArc = this._el('path', { class: 'g-profile', d: '' });
    this.lockedArc = this._el('path', { class: 'g-locked', d: '' });
    this.depthArc = this._el('path', { class: 'g-depth', d: '' });
    this.planTicks = this._el('g', { class: 'g-plan-ticks' });
    this.wpTicks = this._el('g', { class: 'g-wp-ticks' });
    this.holdMark = this._el('path', { class: 'g-hold', d: '' });
    this.needle = this._el('g', { class: 'g-needle' });
    this._el('line', { x1: 0, y1: -(this.r - 40), x2: 0, y2: -(this.R + 10), class: 'g-needle-line' }, this.needle);
    this._el('circle', { cx: 0, cy: -(this.R + 14), r: 5, class: 'g-needle-dot' }, this.needle);
    this.ringMark = this._el('path', { class: 'g-ring', d: '' });
    this._lastPlan = ''; this._lastWp = '';
  }
  update(sim, plan) {
    const depth = Math.max(0, sim.depth);
    this.depthArc.setAttribute('d', depth > 2 ? this.arc(0, depth, (this.R + this.r) / 2) : '');
    this.needle.setAttribute('transform', `rotate(${this.ang(depth) + 90})`);
    // locked progress
    this.lockedArc.setAttribute('d', sim.holdDepth > 2 ? this.arc(0, sim.holdDepth, this.R + 6) : '');
    // planned profile (known during replay or once complete)
    const planKey = plan ? plan.join(',') : '';
    if (planKey !== this._lastPlan) {
      this._lastPlan = planKey;
      this.planTicks.innerHTML = '';
      if (plan && plan.length) {
        const last = plan[plan.length - 1];
        this.profileArc.setAttribute('d', this.arc(0, last + VESSEL.ringOffset, this.R + 6));
        for (const d of plan) { const a = this.ang(d); const [x0, y0] = this.pt(a, this.R + 2), [x1, y1] = this.pt(a, this.R + 12); this._el('line', { x1: x0, y1: y0, x2: x1, y2: y1 }, this.planTicks); }
        const a = this.ang(last + VESSEL.ringOffset); const [x0, y0] = this.pt(a, this.R + 2), [x1, y1] = this.pt(a, this.R + 18);
        this.ringMark.setAttribute('d', `M ${x0} ${y0} L ${x1} ${y1}`);
      } else { this.profileArc.setAttribute('d', ''); this.ringMark.setAttribute('d', ''); }
    }
    const wpKey = sim.sequence.join(',');
    if (wpKey !== this._lastWp) {
      this._lastWp = wpKey; this.wpTicks.innerHTML = '';
      sim.sequence.forEach((id, i) => {
        const depthOf = GLYPH_BY_ID[id] ? GLYPH_BY_ID[id].depth : null;
        if (depthOf == null) return;
        const a = this.ang(depthOf); const [x0, y0] = this.pt(a, this.r - 2), [x1, y1] = this.pt(a, this.R + 8);
        this._el('line', { x1: x0, y1: y0, x2: x1, y2: y1 }, this.wpTicks);
        const [cx, cy] = this.pt(a, this.R + 14); this._el('circle', { cx, cy, r: 4 }, this.wpTicks);
      });
    }
    if (sim.holdDepth > 2) {
      const a = this.ang(sim.holdDepth); const [x0, y0] = this.pt(a - 1.2, this.r - 20), [x1, y1] = this.pt(a, this.r - 8), [x2, y2] = this.pt(a + 1.2, this.r - 20);
      this.holdMark.setAttribute('d', `M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2}`);
    } else this.holdMark.setAttribute('d', '');
    const load = sim.telemetry ? sim.telemetry.hullLoad : 0;
    this.svg.dataset.load = load > 95 ? 'critical' : load > 80 ? 'high' : 'normal';
  }
}
