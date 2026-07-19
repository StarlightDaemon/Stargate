// Station readouts and the scrolling log. All values are locally simulated
// flavor — there is no real telemetry and nothing is transmitted anywhere.

const fmtSci = (v) => v.toExponential(1).replace('e-', 'e−');

export class Telemetry {
  constructor() {
    this.el = {
      temp: document.getElementById('roTemp'),
      strain: document.getElementById('roStrain'),
      residual: document.getElementById('roResidual'),
      cache: document.getElementById('roCache'),
      log: document.getElementById('log'),
      uptime: document.getElementById('uptime'),
    };
    this.t0 = performance.now();
    this.residual = null;
    this.strainBase = 0.00021;
    this.linesShown = 0;
  }

  stationTime() {
    const s = Math.floor((performance.now() - this.t0) / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `T+${hh}:${mm}:${ss}`;
  }

  log(msg, cls = '') {
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    const t = document.createElement('span');
    t.className = 't';
    t.textContent = this.stationTime();
    div.appendChild(t);
    div.appendChild(document.createTextNode(msg));
    this.el.log.appendChild(div);
    while (this.el.log.childElementCount > 90) this.el.log.firstElementChild.remove();
    this.el.log.scrollTop = this.el.log.scrollHeight;
  }

  setResidual(v) {
    this.residual = v;
    if (v == null) {
      this.el.residual.textContent = '—';
      this.el.residual.classList.remove('hot');
    } else {
      this.el.residual.textContent = fmtSci(v) + ' δg';
      this.el.residual.classList.toggle('hot', v > 1);
    }
  }

  setCache(count, slots) {
    this.el.cache.textContent = `${count} / ${slots} SLOTS`;
  }

  /** ambient readout jitter + uptime clock; call ~4×/s from the main loop timer */
  startAmbient(getStrainBoost) {
    setInterval(() => {
      const boost = getStrainBoost();
      const temp = 4.2 + Math.sin(performance.now() / 9000) * 0.03 + Math.random() * 0.01 + boost * 2.4;
      this.el.temp.textContent = temp.toFixed(2) + ' mK';
      const strain = this.strainBase * (1 + boost * 40) + Math.random() * 0.00004;
      this.el.strain.textContent = strain.toFixed(5) + ' ε';
      this.el.strain.classList.toggle('hot', boost > 0.5);
    }, 400);
    setInterval(() => { this.el.uptime.textContent = this.stationTime(); }, 1000);
  }
}
