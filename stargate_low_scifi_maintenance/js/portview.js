// Inspection-port renderer. Canvas 2D, deliberately mundane:
// a glass window onto the conduit bore, a butterfly gate valve,
// and — when open — a thin iridescent "carrier film" across the
// throat, like an oil film on water. No glow-magic.

export function createPortView(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const CX = W / 2, CY = H / 2;
  const R = W / 2 - 6;

  // condensation specks on the glass (static per session)
  const specks = [];
  let seed = 9127;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, rr = R * (0.35 + rnd() * 0.6);
    specks.push({ x: CX + Math.cos(a) * rr, y: CY + Math.sin(a) * rr, s: 0.6 + rnd() * 1.6, o: 0.04 + rnd() * 0.09 });
  }

  // ripples on the carrier film
  const ripples = []; // {t0, x, y}
  let lastRipple = 0;

  function drawThroat(t, film) {
    // receding bore rings
    for (let i = 0; i < 8; i++) {
      const rr = R * Math.pow(0.82, i + 1);
      const breathe = 1 + 0.012 * Math.sin(t * 0.4 + i * 0.9);
      const shade = 26 - i * 3;
      ctx.beginPath();
      ctx.arc(CX, CY + i * 1.5, rr * breathe, 0, Math.PI * 2);
      ctx.strokeStyle = `rgb(${shade + 14},${shade + 16},${shade + 15})`;
      ctx.lineWidth = 5 - i * 0.45;
      ctx.stroke();
    }
    // depth haze at center
    const g = ctx.createRadialGradient(CX, CY + 8, 4, CX, CY + 8, R * 0.5);
    g.addColorStop(0, 'rgba(8,10,11,0.9)');
    g.addColorStop(1, 'rgba(8,10,11,0)');
    ctx.fillStyle = g;
    ctx.fillRect(CX - R * 0.55, CY - R * 0.5, R * 1.1, R * 1.1);

    if (film <= 0.01) return;

    // ----- carrier film: sinusoidal interference bands -----
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R * 0.86, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = film;

    const bands = 5;
    for (let k = 0; k < bands; k++) {
      const ph = t * (0.12 + k * 0.05) + k * 2.1;
      const yBase = CY + Math.sin(ph) * R * 0.5;
      const hue = 185 + 40 * Math.sin(t * 0.09 + k * 1.7);
      const grad = ctx.createLinearGradient(0, yBase - 34, 0, yBase + 34);
      grad.addColorStop(0, `hsla(${hue},60%,62%,0)`);
      grad.addColorStop(0.5, `hsla(${hue},60%,62%,0.075)`);
      grad.addColorStop(1, `hsla(${hue},60%,62%,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(CX - R, yBase - 34, R * 2, 68);
    }

    // faint film sheen over the whole mouth
    const sheen = ctx.createRadialGradient(CX - R * 0.2, CY - R * 0.25, R * 0.1, CX, CY, R * 0.86);
    sheen.addColorStop(0, 'rgba(190,215,225,0.10)');
    sheen.addColorStop(0.6, 'rgba(150,180,200,0.035)');
    sheen.addColorStop(1, 'rgba(120,150,175,0.09)');
    ctx.fillStyle = sheen;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    // occasional ripple ring — film flexing in the draft
    if (t - lastRipple > 5.5 + rnd() * 4 && film > 0.9) {
      lastRipple = t;
      const a = rnd() * Math.PI * 2, rr = rnd() * R * 0.4;
      ripples.push({ t0: t, x: CX + Math.cos(a) * rr, y: CY + Math.sin(a) * rr });
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      const age = t - rp.t0;
      if (age > 2.2) { ripples.splice(i, 1); continue; }
      const rr = 6 + age * 55;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,225,235,${(0.14 * (1 - age / 2.2)).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawValve(t, open) {
    // butterfly disc rotating about the horizontal axis:
    // projected height shrinks as it opens; a thin bar remains.
    const theta = open * (Math.PI / 2) * 0.94;
    const projH = Math.max(0.055, Math.cos(theta));
    const discR = R * 0.965;

    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(1, projH);

    const grad = ctx.createLinearGradient(0, -discR, 0, discR);
    grad.addColorStop(0, '#6e726d');
    grad.addColorStop(0.45, '#4a4e49');
    grad.addColorStop(0.55, '#3d413c');
    grad.addColorStop(1, '#232622');
    ctx.beginPath();
    ctx.arc(0, 0, discR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // brushed-metal arcs on the disc face
    ctx.globalAlpha = 0.16 * (1 - open * 0.7);
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, discR * i / 6, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 ? '#7d817b' : '#31342f';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // hinge shaft across the middle — always visible
    ctx.fillStyle = '#181a17';
    ctx.fillRect(CX - discR, CY - 2.6, discR * 2, 5.2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(CX - discR, CY - 2.6, discR * 2, 1.4);
  }

  function drawGlass(powered) {
    // permanent diagonal reflection on the inspection glass
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();

    const streak = ctx.createLinearGradient(0, 0, W, H);
    streak.addColorStop(0.32, 'rgba(255,255,255,0)');
    streak.addColorStop(0.42, `rgba(255,255,255,${powered ? 0.05 : 0.033})`);
    streak.addColorStop(0.47, 'rgba(255,255,255,0)');
    streak.addColorStop(0.62, 'rgba(255,255,255,0)');
    streak.addColorStop(0.68, `rgba(255,255,255,${powered ? 0.028 : 0.02})`);
    streak.addColorStop(0.74, 'rgba(255,255,255,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(0, 0, W, H);

    for (const s of specks) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,225,230,${s.o})`;
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(t, { valve = 0, film = 0, powered = false }) {
    ctx.clearRect(0, 0, W, H);

    // bore background
    const bg = ctx.createRadialGradient(CX, CY, R * 0.1, CX, CY, R);
    bg.addColorStop(0, powered ? '#101315' : '#0a0c0d');
    bg.addColorStop(1, '#151719');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fill();

    if (valve > 0.02) drawThroat(t, film);
    drawValve(t, valve);
    drawGlass(powered);

    // vignette
    const vg = ctx.createRadialGradient(CX, CY, R * 0.55, CX, CY, R);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fill();
  }

  return { draw };
}
