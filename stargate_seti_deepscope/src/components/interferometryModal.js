// 10-Dish Physical Array Geometry & UV-Coverage Canvas Component

import { soundEngine } from '../audio/soundEngine.js';

export class InterferometryModal {
  constructor() {
    this.modal = document.getElementById('modal-array');
    this.canvas = document.getElementById('canvas-array-geometry');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.dishes = [];
    this.initDishPositions();

    this.bindEvents();
    this.startAnimation();
  }

  initDishPositions() {
    // 10 cryogenic dishes in a 3-arm Y-configuration (14.8 km synthetic baseline array)
    const cx = this.canvas ? this.canvas.width / 2 : 240;
    const cy = this.canvas ? this.canvas.height / 2 : 190;
    const armLengths = [150, 150, 150];
    const armAngles = [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6];

    this.dishes = [
      { id: 'D01', name: 'Dish 01 (Central Hub)', x: cx, y: cy }
    ];

    // Distribute remaining 9 dishes (3 per arm at geometric distances)
    let dishIdx = 2;
    for (let arm = 0; arm < 3; arm++) {
      const angle = armAngles[arm];
      [0.35, 0.68, 1.0].forEach(frac => {
        const d = armLengths[arm] * frac;
        const x = cx + Math.cos(angle) * d;
        const y = cy + Math.sin(angle) * d;
        this.dishes.push({
          id: `D0${dishIdx}`.slice(-3),
          name: `Dish 0${dishIdx}`.slice(-3),
          x,
          y
        });
        dishIdx++;
      });
    }
  }

  bindEvents() {
    const openBtn = document.getElementById('btn-open-array');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.modal.classList.add('is-open');
        this.modal.setAttribute('aria-hidden', 'false');
      });
    }

    document.querySelectorAll('[data-close="modal-array"]').forEach(btn => {
      btn.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.modal.classList.remove('is-open');
        this.modal.setAttribute('aria-hidden', 'true');
      });
    });
  }

  startAnimation() {
    let phase = 0;
    const render = () => {
      if (this.ctx && this.modal.classList.contains('is-open')) {
        phase += 0.03;
        this.draw(phase);
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  draw(phase) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    const step = 30;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Range Rings (5km, 10km, 15km)
    const cx = w / 2;
    const cy = h / 2;
    [50, 100, 150].forEach((r, idx) => {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.font = '9px "Share Tech Mono"';
      ctx.fillText(`${(idx + 1) * 5}km`, cx + r + 4, cy - 4);
    });

    // Synthetic Baseline Correlation Lines between dishes
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.dishes.length; i++) {
      for (let j = i + 1; j < this.dishes.length; j++) {
        ctx.beginPath();
        ctx.moveTo(this.dishes[i].x, this.dishes[i].y);
        ctx.lineTo(this.dishes[j].x, this.dishes[j].y);
        ctx.stroke();
      }
    }

    // Animated Plane Wavefront sweeping across the array
    const waveAngle = Math.PI / 4;
    const waveSpacing = 35;
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = -6; i < 8; i++) {
      const offset = (i * waveSpacing + (phase * 15) % waveSpacing);
      const x1 = cx + Math.cos(waveAngle) * offset - Math.sin(waveAngle) * 200;
      const y1 = cy + Math.sin(waveAngle) * offset + Math.cos(waveAngle) * 200;
      const x2 = cx + Math.cos(waveAngle) * offset + Math.sin(waveAngle) * 200;
      const y2 = cy + Math.sin(waveAngle) * offset - Math.cos(waveAngle) * 200;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 10 Dishes
    this.dishes.forEach((d, idx) => {
      // Dish Outer Glow
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Dish Core
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Share Tech Mono"';
      ctx.fillText(d.id, d.x + 8, d.y + 3);
    });
  }
}
