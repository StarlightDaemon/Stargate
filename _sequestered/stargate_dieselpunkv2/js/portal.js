// The "translux" doorway surface. Civilian and inviting: pearl-and-gold
// core with a teal fringe, slow swirl arms, drifting shimmer rings.
// Entirely closed-form in t and phase — no per-frame integration state.

const W = 640, H = 900;
const CX = W / 2, CY = 448, RMAX = 330;

export function drawPortal(ctx, t, phase) {
  ctx.clearRect(0, 0, W, H);
  // recess behind the leaves — dim machine hall
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0d10');
  bg.addColorStop(0.65, '#06080b');
  bg.addColorStop(1, '#03040610');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (phase <= 0.001) return;

  const R = RMAX * (0.35 + 0.65 * phase);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // core glow
  let g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
  g.addColorStop(0, `rgba(255,248,228,${0.85 * phase})`);
  g.addColorStop(0.35, `rgba(244,214,150,${0.5 * phase})`);
  g.addColorStop(0.72, `rgba(120,168,164,${0.3 * phase})`);
  g.addColorStop(1, 'rgba(30,60,70,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // swirl arms — three rotating elongated blobs at differing radii/speeds
  for (let i = 0; i < 3; i++) {
    const spin = t / (2600 + i * 900) * (i % 2 ? -1 : 1) + i * 2.1;
    const rr = R * (0.42 + i * 0.19);
    const bx = CX + Math.cos(spin) * rr * 0.55;
    const by = CY + Math.sin(spin) * rr * 0.55;
    const bg2 = ctx.createRadialGradient(bx, by, 0, bx, by, rr);
    const warm = i !== 1;
    bg2.addColorStop(0, warm
      ? `rgba(255,226,170,${0.30 * phase})`
      : `rgba(150,214,206,${0.26 * phase})`);
    bg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg2;
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(spin * 0.7);
    ctx.scale(1, 0.62);
    ctx.translate(-CX, -CY);
    ctx.beginPath();
    ctx.arc(bx, by, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // shimmer rings drifting outward
  for (let k = 0; k < 4; k++) {
    const u = ((t / 1500) + k / 4) % 1;
    const rr = R * (0.15 + 0.85 * u);
    ctx.beginPath();
    ctx.ellipse(CX, CY, rr, rr * 1.16, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,240,210,${(1 - u) * 0.16 * phase})`;
    ctx.lineWidth = 2.2 - u * 1.4;
    ctx.stroke();
  }

  // soft vertical sheet — the "membrane"
  const sheet = ctx.createLinearGradient(CX - R, 0, CX + R, 0);
  sheet.addColorStop(0, 'rgba(140,190,185,0)');
  sheet.addColorStop(0.5, `rgba(235,240,235,${0.10 * phase * (0.7 + 0.3 * Math.sin(t / 700))})`);
  sheet.addColorStop(1, 'rgba(140,190,185,0)');
  ctx.fillStyle = sheet;
  ctx.fillRect(CX - R, CY - R * 1.3, R * 2, R * 2.6);

  ctx.restore();
}
