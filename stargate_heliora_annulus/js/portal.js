/* ============================================================
   portal.js — the Wellglass.

   A WebGL fragment shader renders the aperture: a near-black
   void when the ring is at rest, and a molten, slowly churning
   sun-surface with a dark eclipse core when the well is open.
   The Sunstrike is an expanding shock rendered in the same
   shader. Falls back to a CSS gradient if WebGL is missing.
   ============================================================ */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform float u_open;    // 0 at rest .. 1 fully open
uniform float u_burst;   // seconds since Sunstrike, negative = none
uniform float u_instab;  // 0 stable .. 1 tearing itself apart

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.3, 9.1);
    a *= 0.55;
  }
  return v;
}
vec2 rot(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// molten-gold palette, deep char to white-hot
vec3 sunPal(float x) {
  x = clamp(x, 0.0, 1.25);
  vec3 c1 = vec3(0.13, 0.04, 0.01);
  vec3 c2 = vec3(0.62, 0.24, 0.05);
  vec3 c3 = vec3(1.00, 0.62, 0.24);
  vec3 c4 = vec3(1.00, 0.90, 0.68);
  vec3 col = mix(c1, c2, smoothstep(0.0, 0.45, x));
  col = mix(col, c3, smoothstep(0.4, 0.8, x));
  col = mix(col, c4, smoothstep(0.78, 1.15, x));
  return col;
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - u_res) / u_res.y;
  float r = length(p);
  float t = u_time;

  // ---------- resting void ----------
  float drift = fbm(p * 2.2 + vec2(0.0, t * 0.03));
  vec3 voidCol = vec3(0.012, 0.024, 0.028) + vec3(0.05, 0.10, 0.09) * drift * 0.55;
  // slow ember motes rising through the dark
  vec2 mp = p * 5.0 + vec2(t * 0.02, t * 0.11);
  float mote = pow(noise(mp), 18.0) * 2.2;
  voidCol += vec3(0.9, 0.55, 0.2) * mote * (0.25 + 0.2 * sin(t * 0.7 + r * 5.0));

  // ---------- the open well ----------
  vec2 q = rot(p, t * 0.05 + r * 1.7);
  float n1 = fbm(q * 2.5 + vec2(t * 0.10, -t * 0.06));
  float n2 = fbm(q * 5.5 - vec2(t * 0.16, t * 0.02));
  float filaments = pow(abs(sin(n1 * 6.283 + n2 * 4.0)), 3.0);
  float lum = n1 * 0.85 + filaments * 0.6 + (1.0 - r) * 0.18;

  vec3 sun = sunPal(lum);

  // the eclipse core: a dark occlusion at centre with a burning limb
  float core = smoothstep(0.36, 0.28, r);
  sun = mix(sun, sun * 0.16 + vec3(0.04, 0.012, 0.004), core * 0.9);
  float limb = exp(-abs(r - 0.335) * 26.0);
  sun += vec3(1.0, 0.72, 0.38) * limb * (0.75 + 0.25 * sin(t * 1.3 + n2 * 8.0));

  // breathing rim near the bezel
  float rim = exp(-abs(r - 0.93) * 18.0);
  sun += vec3(1.0, 0.78, 0.45) * rim * (0.5 + 0.15 * sin(t * 0.9));

  // instability: hard flicker and torn brightness
  float tear = step(0.45, fract(t * 12.9 + n2 * 6.0));
  sun *= 1.0 - u_instab * (0.45 * tear + 0.25 * fbm(p * 9.0 + t));

  // ---------- blend void/sun through the aperture ----------
  float openEdge = u_open * 1.08;
  float inside = smoothstep(openEdge, openEdge - 0.14, r) * step(0.005, u_open);
  vec3 col = mix(voidCol, sun, inside);
  // bright annular front where the aperture is still growing
  float front = exp(-abs(r - openEdge) * 22.0) * step(0.02, u_open) * (1.0 - step(0.995, u_open));
  col += vec3(1.0, 0.8, 0.5) * front * 0.9;

  // ---------- Sunstrike shock ----------
  if (u_burst >= 0.0) {
    float b = u_burst;
    float wave = exp(-pow((r - b * 1.9) * 5.5, 2.0)) * exp(-b * 1.1);
    col += vec3(1.0, 0.85, 0.55) * wave * 2.6;
    col += vec3(1.0, 0.93, 0.75) * exp(-b * 5.0) * 2.2;
  }

  float alpha = smoothstep(1.0, 0.965, r);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export class Portal {
  constructor(canvas) {
    this.canvas = canvas;
    this.open = 0;          // current aperture
    this._target = 0;
    this._rate = 1;         // aperture units per second
    this.instab = 0;
    this._instabTarget = 0;
    this._burstAt = -1;
    this._t0 = performance.now();
    this._last = this._t0;
    this.gl = null;
    this._init();
  }

  _init() {
    let gl = null;
    try {
      gl = this.canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true })
        || this.canvas.getContext("experimental-webgl", { alpha: true });
    } catch (_) { /* fall through */ }
    if (!gl) { this._cssFallback(); return; }
    this.gl = gl;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s));
      }
      return s;
    };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog));
      }
    } catch (e) {
      console.warn("Wellglass shader failed, using fallback:", e);
      this.gl = null;
      this._cssFallback();
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {
      res: gl.getUniformLocation(prog, "u_res"),
      time: gl.getUniformLocation(prog, "u_time"),
      open: gl.getUniformLocation(prog, "u_open"),
      burst: gl.getUniformLocation(prog, "u_burst"),
      instab: gl.getUniformLocation(prog, "u_instab"),
    };
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  _cssFallback() {
    this.canvas.style.background =
      "radial-gradient(circle, #101a1c 0%, #0a0e12 70%)";
    this.canvas.style.transition = "background 1s, box-shadow 1s";
    this._fallback = true;
  }

  start() {
    const loop = (now) => {
      this._step(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  _step(now) {
    const dt = Math.min(0.1, (now - this._last) / 1000);
    this._last = now;

    // ease aperture toward target
    if (this.open !== this._target) {
      const d = this._target - this.open;
      const step = this._rate * dt;
      this.open = Math.abs(d) <= step ? this._target : this.open + Math.sign(d) * step;
      if (this._fallback) this._applyFallback();
    }
    this.instab += (this._instabTarget - this.instab) * Math.min(1, dt * 3);

    if (!this.gl) return;
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const t = (now - this._t0) / 1000;
    gl.uniform2f(this.u.res, w, h);
    gl.uniform1f(this.u.time, t);
    gl.uniform1f(this.u.open, this.open);
    gl.uniform1f(this.u.burst, this._burstAt < 0 ? -1 : t - this._burstAt);
    gl.uniform1f(this.u.instab, this.instab);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (this._burstAt >= 0 && t - this._burstAt > 3.5) this._burstAt = -1;
  }

  _applyFallback() {
    const o = this.open;
    this.canvas.style.background = o > 0.05
      ? `radial-gradient(circle, #1a0800 ${Math.round(18 * o)}%, #ff9d3c ${Math.round(38 * o)}%, #b4470f ${Math.round(70 * o)}%, #0a0e12 100%)`
      : "radial-gradient(circle, #101a1c 0%, #0a0e12 70%)";
    this.canvas.style.boxShadow = o > 0.05 ? "0 0 60px #ff9d3c66" : "none";
  }

  /* The Sunstrike: shock + fast aperture opening. */
  strike() {
    this._burstAt = (performance.now() - this._t0) / 1000;
    this._target = 1;
    this._rate = 1 / 0.85;
    this._instabTarget = 0;
  }

  /* Quench the well. Resolves once the aperture is shut. */
  quench(fast = false) {
    this._target = 0;
    this._rate = fast ? 1 / 0.35 : 1 / 1.2;
    this._instabTarget = 0;
    return new Promise((res) => {
      const wait = () => (this.open <= 0.001 ? res() : setTimeout(wait, 40));
      wait();
    });
  }

  /* A failed strike: the well gutters at a fraction and dies. */
  gutter() {
    this._burstAt = -1;
    this._target = 0.4;
    this._rate = 1 / 0.5;
    this._instabTarget = 1;
    return new Promise((res) => {
      setTimeout(() => {
        this._target = 0;
        this._rate = 1 / 0.45;
        setTimeout(() => { this._instabTarget = 0; res(); }, 700);
      }, 900);
    });
  }

  setInstability(v) { this._instabTarget = v; }

  get isOpen() { return this.open > 0.9; }
}
