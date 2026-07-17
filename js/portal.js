/* ============================================================
   AETHERGATE — portal renderer
   A WebGL fragment shader draws the event horizon: layered
   noise shimmer, radial ripples, rim glow, opening surge and
   collapse. Falls back to a Canvas2D approximation if WebGL
   is unavailable.

   Geometry note: the aperture at rest occupies APERTURE (0.72)
   of the canvas half-size, leaving headroom for the opening
   surge to overshoot past the ring's inner rim.
   ============================================================ */
(function () {
  "use strict";
  window.AG = window.AG || {};

  const APERTURE = 0.72;
  const OPEN_MS = 2600;
  const CLOSE_MS = 1500;

  const VERT = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform float u_open;   // 0..~1.32 aperture openness (radius factor)
    uniform float u_burst;  // 0..1 activation surge energy
    uniform float u_turb;   // extra turbulence while collapsing
    uniform float u_pulse;  // seconds since probe pulse (large = none)

    float hash(vec2 p) {
      p = fract(p * vec2(233.34, 851.73));
      p += dot(p, p + 23.45);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.03 + vec2(17.0, 9.2);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
      float r = length(uv);
      float ap = ${APERTURE.toFixed(2)} * u_open;

      if (u_open < 0.004 || r > ap + 0.30) {
        gl_FragColor = vec4(0.0);
        return;
      }

      vec2 q = uv / max(ap, 0.0001);       // surface coords, |q|<=~1 inside
      float rq = length(q);

      // flowing shimmer: two layers of fbm drifting opposite ways
      float freq = 1.0 + u_turb * 1.6;
      float n = fbm(q * 2.7 * freq + vec2(u_time * 0.11, -u_time * 0.17));
      n += 0.55 * fbm(q * 5.3 * freq - vec2(u_time * 0.26, u_time * 0.05) + n * 1.3);
      n *= 0.65;

      // concentric ripples wobbled by the noise
      float rip = sin(rq * 26.0 - u_time * 2.4 + n * 6.0) * 0.5 + 0.5;
      rip = pow(rip, 3.0);

      // probe pulse: an expanding bright band
      float pr = u_pulse * 0.85;
      float pulse = exp(-45.0 * abs(rq - pr)) * exp(-u_pulse * 1.4);

      // palette
      vec3 deep   = vec3(0.010, 0.055, 0.110);
      vec3 mid    = vec3(0.055, 0.400, 0.580);
      vec3 bright = vec3(0.600, 0.950, 1.050);

      vec3 col = mix(deep, mid, clamp(n * 1.5, 0.0, 1.0));
      col += bright * rip * (0.22 + 0.25 * n);
      col += bright * pulse * 0.9;

      // luminous rim where the horizon meets the ring
      float rim = smoothstep(0.30, 0.02, abs(r - ap));
      col += vec3(0.35, 0.75, 0.95) * rim * (0.35 + 0.65 * u_burst);

      // center vortex brightening
      col += mid * smoothstep(0.55, 0.0, rq) * 0.35;

      // activation surge: white-hot wash and boosted contrast
      col += vec3(0.95, 0.98, 1.0) * u_burst * (0.30 + 0.5 * n + 0.5 * rim);

      // body alpha + soft corona just outside the aperture
      float body = smoothstep(ap + 0.015, ap - 0.05, r);
      float halo = (r > ap)
        ? exp(-(r - ap) * 9.0) * (0.30 + 0.70 * u_burst)
        : 0.0;
      float alpha = clamp(body + halo, 0.0, 1.0);

      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeInCubic(t) { return t * t * t; }

  class Portal {
    constructor(canvas) {
      this.canvas = canvas;
      this.mode = "idle";        // idle | opening | active | closing
      this.t0 = 0;
      this.pulseAt = -1e9;
      this._resolvers = [];
      this.gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false
      });
      if (this.gl) this._initGL();
      else this.ctx2d = canvas.getContext("2d");
      AG.raf(this._frame.bind(this));
    }

    _initGL() {
      const gl = this.gl;
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error("AETHERGATE shader error:", gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      };
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) { this.gl = null; this.ctx2d = this.canvas.getContext("2d"); return; }
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.u = {};
      for (const name of ["u_res", "u_time", "u_open", "u_burst", "u_turb", "u_pulse"]) {
        this.u[name] = gl.getUniformLocation(prog, name);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied
      gl.clearColor(0, 0, 0, 0);
    }

    open() {
      this.mode = "opening";
      this.t0 = performance.now();
      return new Promise(res => this._resolvers.push({ at: this.t0 + OPEN_MS, res }));
    }

    close() {
      this.mode = "closing";
      this.t0 = performance.now();
      return new Promise(res => this._resolvers.push({ at: this.t0 + CLOSE_MS, res }));
    }

    /* immediate collapse (abort during opening) */
    snuff() {
      this.mode = "idle";
      this._flushResolvers();
    }

    pulse() { this.pulseAt = performance.now(); }

    get isVisible() { return this.mode !== "idle"; }

    _flushResolvers() {
      this._resolvers.forEach(r => r.res());
      this._resolvers = [];
    }

    /* per-frame envelope: openness, surge energy, turbulence */
    _envelope(now) {
      const t = now - this.t0;
      let open = 0, burst = 0, turb = 0;
      if (this.mode === "opening") {
        if (t <= 700) {
          open = easeOutQuart(t / 700) * 1.32;
          burst = 1;
        } else if (t <= OPEN_MS) {
          const p = (t - 700) / (OPEN_MS - 700);
          open = 1.32 + (1 - 1.32) * easeInOut(p);
          burst = 1 - p;
        } else {
          this.mode = "active";
          open = 1;
        }
      } else if (this.mode === "active") {
        open = 1 + 0.008 * Math.sin(now / 900);
      } else if (this.mode === "closing") {
        const p = Math.min(t / CLOSE_MS, 1);
        open = 1 - easeInCubic(p);
        turb = p * 1.4;
        burst = p * 0.25;
        if (p >= 1) { this.mode = "idle"; open = 0; }
      }
      return { open, burst, turb };
    }

    _frame(now) {
      AG.raf(this._frame.bind(this));
      // settle promises whose time has come
      if (this._resolvers.length) {
        const due = this._resolvers.filter(r => now >= r.at);
        if (due.length) {
          this._resolvers = this._resolvers.filter(r => now < r.at);
          due.forEach(r => r.res());
        }
      }
      const { open, burst, turb } = this._envelope(now);
      const pulseAge = (now - this.pulseAt) / 1000;
      if (this.gl) this._drawGL(now, open, burst, turb, pulseAge);
      else this._draw2D(now, open, burst);
    }

    _drawGL(now, open, burst, turb, pulseAge) {
      const gl = this.gl;
      const w = this.canvas.width, h = this.canvas.height;
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (open <= 0.004) return;
      gl.uniform2f(this.u.u_res, w, h);
      gl.uniform1f(this.u.u_time, now / 1000);
      gl.uniform1f(this.u.u_open, open);
      gl.uniform1f(this.u.u_burst, burst);
      gl.uniform1f(this.u.u_turb, turb);
      gl.uniform1f(this.u.u_pulse, Math.min(pulseAge, 100));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /* modest 2D fallback: pulsing radial gradient pool */
    _draw2D(now, open, burst) {
      const c = this.ctx2d;
      const w = this.canvas.width, h = this.canvas.height;
      c.clearRect(0, 0, w, h);
      if (open <= 0.004) return;
      const cx = w / 2, cy = h / 2;
      const R = (Math.min(w, h) / 2) * APERTURE * open;
      const wob = 1 + 0.02 * Math.sin(now / 300);
      const g = c.createRadialGradient(cx, cy, R * 0.05, cx, cy, R * wob);
      g.addColorStop(0, "rgba(30, 120, 170, 0.95)");
      g.addColorStop(0.55, "rgba(12, 70, 110, 0.9)");
      g.addColorStop(0.88, `rgba(90, 200, 240, ${0.7 + burst * 0.3})`);
      g.addColorStop(1, "rgba(120, 220, 255, 0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, R * wob, 0, Math.PI * 2);
      c.fill();
      // a few drifting ripple rings
      c.strokeStyle = "rgba(140, 225, 255, 0.25)";
      c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const rr = ((now / 1400 + i / 3) % 1) * R;
        c.globalAlpha = 0.5 * (1 - rr / R);
        c.beginPath();
        c.arc(cx, cy, rr, 0, Math.PI * 2);
        c.stroke();
      }
      c.globalAlpha = 1;
    }
  }

  AG.Portal = Portal;
})();
