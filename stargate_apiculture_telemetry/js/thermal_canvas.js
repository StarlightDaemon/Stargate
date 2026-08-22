/**
 * IPATC APICULTURE TELEMETRY NETWORK — BROOD NEST THERMAL CANVAS RENDERER
 * 2D False-Color Infrared Heat Matrix visualizer for brood frame thermal regulation.
 */

class ThermalCanvasRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 12; // 12x12 thermal probe array
    this.animationId = null;
    this.hoverX = -1;
    this.hoverY = -1;
    this.setupEvents();
    this.startLoop();
  }

  setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cellW = rect.width / this.gridSize;
      const cellH = rect.height / this.gridSize;
      this.hoverX = Math.floor(x / cellW);
      this.hoverY = Math.floor(y / cellH);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverX = -1;
      this.hoverY = -1;
    });
  }

  startLoop() {
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  getThermalColor(temp) {
    // 28.0°C (indigo) -> 31.0°C (cyan) -> 33.5°C (emerald) -> 34.8°C-35.2°C (amber/gold) -> 36.0°C (crimson/white)
    const t = Math.max(28.0, Math.min(36.0, temp));
    const norm = (t - 28.0) / (36.0 - 28.0); // 0..1

    if (norm < 0.3) {
      // Indigo to Cyan
      const factor = norm / 0.3;
      return `rgb(${Math.floor(20 + factor * 0)}, ${Math.floor(40 + factor * 200)}, ${Math.floor(120 + factor * 135)})`;
    } else if (norm < 0.6) {
      // Cyan to Emerald/Amber
      const factor = (norm - 0.3) / 0.3;
      return `rgb(${Math.floor(factor * 255)}, ${Math.floor(240 - factor * 40)}, ${Math.floor(255 - factor * 255)})`;
    } else if (norm < 0.85) {
      // Amber/Gold
      const factor = (norm - 0.6) / 0.25;
      return `rgb(255, ${Math.floor(180 + factor * 75)}, ${Math.floor(factor * 50)})`;
    } else {
      // White/Hot
      return `rgb(255, 255, 255)`;
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width = this.canvas.clientWidth || 500;
    const h = this.canvas.height = this.canvas.clientHeight || 450;
    ctx.clearRect(0, 0, w, h);

    const matrix = window.telemetryEngine ? window.telemetryEngine.getBroodThermalMatrix(this.gridSize, this.gridSize) : [];
    if (!matrix.length) return;

    const cellW = w / this.gridSize;
    const cellH = h / this.gridSize;

    // Draw thermal color cells
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const temp = matrix[y][x];
        ctx.fillStyle = this.getThermalColor(temp);
        ctx.fillRect(x * cellW, y * cellH, cellW, cellH);

        // Subtle cell grid border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellW, y * cellH, cellW, cellH);

        // Highlight hovered cell
        if (x === this.hoverX && y === this.hoverY) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);

          // Update tooltip readout if element exists
          const tooltip = document.getElementById('thermal-probe-readout');
          if (tooltip) {
            tooltip.innerText = `PROBE [${x + 1}, ${y + 1}]: ${temp.toFixed(2)}°C (${temp >= 34.5 ? 'BROOD CORE OPTIMAL' : 'PERIMETER REGION'})`;
          }
        }
      }
    }

    // Overlay Isothermal Contour Circles
    const cx = w * 0.5;
    const cy = h * 0.5;
    [0.2, 0.45, 0.75].forEach((ratio, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, (w * 0.45) * ratio, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }
}

window.ThermalCanvasRenderer = ThermalCanvasRenderer;
