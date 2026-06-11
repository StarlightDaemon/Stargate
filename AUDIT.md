# GATE DIALING COMPUTER — FUSION  
## Pre-Refinement Audit Report  
**Date:** 2026-06-10  
**Auditor:** Claude (read-only pass — no source files modified)

---

## 1. Project Structure

```
/
├── .gitignore
├── index.html                  ← Entry point (single HTML file)
├── assets/
│   └── fusion.css              ← All styles + full theme system
├── logic/
│   ├── addresses.js            ← Address DB, GLYPH_SYMBOLS, GLYPH_NAMES
│   ├── audio.js                ← Web Audio API, procedural sound generation
│   ├── engine.js               ← SDCEngine: state machine + UI orchestration
│   ├── ring.js                 ← RingController: physics simulation
│   ├── signal.js               ← SignalStrength: oscilloscope canvas widget
│   └── theme.js                ← ThemeController: localStorage persistence
├── references/                 ← Reference images/vectors (NOT served/used by app)
│   ├── ASSET_INVENTORY.md
│   ├── concept/
│   ├── misc/
│   ├── ui/
│   └── vectors/
└── archive/                    ← Archived prior React/Vite version (SG_MK7)
    ├── FINAL_STEWARDSHIP_REPORT.md
    ├── README_ARCHITECT.md
    └── SG_MK7/stargate-dialing-console/
        ├── dist/               ← Build artifacts from MK7 (NOT active)
        ├── src/                ← React source (NOT active)
        └── node_modules/       ← MK7 dependencies (NOT active)
```

**Entry point:** `index.html`  
**No build step.** All source files served directly as-is.  
**Build artifacts:** Only in `archive/SG_MK7/dist/` — inactive.  
**Config files:** `.gitignore` only (no package.json, tsconfig, vite.config, etc. in root).  
**Git:** Repository already initialized with 7 commits on `main`.

---

## 2. Stack Inventory

| Layer | Detail |
|---|---|
| Languages | HTML5, CSS3 (custom properties), ES2020 JavaScript |
| Frameworks | **None** — pure vanilla stack confirmed |
| Build tooling | **None** — no bundler, transpiler, or task runner |
| External fonts | Google Fonts CDN: Orbitron (wght 400/700/900), VT323 |
| APIs used | SVG (inline), Canvas 2D, Web Audio API, ResizeObserver |
| Security | CSP meta tag in `<head>` — `default-src 'self'`, allows Google Fonts, inline styles/scripts |
| Storage | `localStorage` for theme persistence only |
| Archive stack | React 18 + Vite + TypeScript (inactive, in `archive/`) |

No `<script type="module">` — scripts loaded in order via classic `<script src="…">` tags at bottom of `<body>`. Load order: `addresses.js → audio.js → ring.js → signal.js → engine.js → theme.js`.

---

## 3. Gate Animation Implementation

**Mechanism:** JavaScript `requestAnimationFrame` physics simulation.  
**File:** `logic/ring.js` — class `RingController`  
**Target element:** `<g id="innerRing">` — the rotating SVG group containing glyphs and tick marks.

**How rotation is applied:**
```js
// ring.js:143
this.innerRing.style.transform = `rotate(${this.currentAngle}deg)`;
```
The `transform-origin` is set in CSS to `250px 250px` (gate centre) via `fusion.css:557`.

**What triggers rotation:**  
`engine.js:417` calls `ringController.rotateToGlyph(glyphId, i % 2 === 0)` for each chevron in the sequence. Direction alternates — even-indexed chevrons in the sequence pass `clockwise=true`, odd pass `false`.

**Direction encoding in ring.js:**
```js
// ring.js:111-112
const rotation = clockwise ? -360 : 360;
this.targetAngle = targetGlyphAngle + rotation;
```
`targetGlyphAngle = -(glyphIndex * degreesPerGlyph)`. A negative rotation in CSS is visually counter-clockwise, so the `clockwise=true` parameter actually drives the ring counter-clockwise for one extra revolution before settling. **The parameter name is inverted relative to visual direction.**

**Physics values (exact, `ring.js:12–19`):**

| Parameter | Normal mode | Fast mode (set in `engine.js:735–736`) |
|---|---|---|
| `maxVelocity` | `120` deg/s | `900` deg/s |
| `acceleration` | `200` deg/s² | `1800` deg/s² |
| `friction` | `0.92` (multiplier per frame) | same |
| `overshootAmplitude` | `1.5` degrees (static default) | same |
| `overshootDecay` | `6` | same |

**Deceleration:** Friction (`velocity *= 0.92`) is applied each frame when `Math.abs(distance) < 30` degrees (`ring.js:183`). Below 0.5° distance triggers the overshoot phase directly.

**Overshoot (settle) model — damped harmonic oscillator (`ring.js:159–169`):**
```js
decay = Math.exp(-6 * overshootTime)
oscillation = Math.cos(2π × 4 × overshootTime)   // 4 Hz
currentAngle = targetAngle + (overshootAmplitude × decay × oscillation)
// exits when decay < 0.01
```
The static `overshootAmplitude = 1.5°` is used when entering overshoot from the close-enough path. A velocity-scaled amplitude (`Math.abs(velocity) * 0.015`) is computed only when the ring genuinely overshoots the target (`ring.js:194`) and overwrites the config property.

**Stopping:** `stop()` method (`ring.js:225`) immediately zeros velocity, clears flags, and resolves any pending `rotateToGlyph` promise — used during abort.

**Reset:** `reset()` (`ring.js:239`) sets angle to 0 and applies `innerRing.style.transform = 'rotate(0deg)'` — instant snap, no animation.

---

## 4. Chevron System

**Count:** 12 chevrons, defined in `index.html:98–146`.

**Positions and numbering (30° pitch):**

| SVG rotation | `data-num` | Notes |
|---|---|---|
| 0° (12 o'clock) | **9** | Master chevron |
| 30° | 1 | |
| 60° | 2 | |
| 90° | 3 | |
| 120° | 4 | |
| 150° | 5 | |
| 180° | 6 | |
| 210° | 7 | |
| 240° | 8 | |
| 270° | 10 | |
| 300° | 11 | |
| 330° | 12 | |

**State tracking:** CSS class toggling on the `.chevron` SVG group element.  
States: `(none)` → `encoding` → `locked`.  
Applied via `engine.js:493–501` (`lockChevron`) and `engine.js:506–513` (`setChevronState`).

**Shape:** 11-point polygon identical on all 12. Defined inline in `index.html:99,103` (representative):
```
chevron-body:  points="210,-16 290,-16 290,-2 274,-2 274,14 268,22 250,74 232,22 226,14 226,-2 210,-2"
chevron-inner: points="235,4 265,4 250,70"
```

**Locking sequence order (`engine.js:54–61`):**
```js
this.sequences = {
    7:  [1, 8, 2, 7, 3, 6, 9],
    8:  [1, 8, 2, 7, 3, 6, 4, 9],
    9:  [1, 8, 2, 7, 3, 6, 4, 5, 9],
    10: [1, 7, 2, 8, 3, 10, 4, 11, 5, 9],
    11: [1, 7, 2, 8, 3, 10, 4, 11, 5, 12, 9],
    12: [1, 7, 2, 8, 3, 10, 4, 11, 5, 12, 6, 9]
};
```
Modes 7–9: criss-cross legacy pairs (original 9-chevron pattern). Modes 10–12: true-opposite pairs (180° apart). Last entry is always chevron 9 (master) with `glyphId=0` (Point of Origin).

**Visual feedback on lock:**
- SVG: `.encoding` class → `.locked` class. CSS transitions on `fill`, `stroke`, `filter` (0.25s, `fusion.css:512–513`).
- `.encoding`: body fill lightens, stroke brightens, crystal blinks (`chevronBlink 0.35s infinite`, `fusion.css:529`).
- `.locked`: crystal lit to `--chevron-locked-crystal`, glow filter applied (`filter: url(#glow-locked)` — Gaussian blur stdDeviation=3).
- Side panel: `.chev-indicator` element at matching index gains `.active` class.

**Audio on lock:** `audioManager.play('chevronLock')` — `engine.js:428`.

**Timing parameters:**
```js
// engine.js:39–44
encodeDelay: 200,        // ms between ring-stop and chevron-lock
encodeDuration: 300,     // ms  ← DEFINED BUT NEVER READ (see §11)
lockDuration: 500,       // ms  ← DEFINED BUT NEVER READ (see §11)
interChevronDelay: 400,  // ms between locking one chevron and starting next spin
```

---

## 5. Dialing Sequences

**Definition:** Hardcoded in `SDCEngine` constructor (`engine.js:54–61`). Same object as documented in §4 above.

**Sequence advancement:** The `engage()` method (`engine.js:384–441`) iterates over `this.sequences[mode]` with a `for` loop. Each iteration:
1. Sets `.encoding` on the gate chevron and panel indicator.
2. `await ringController.rotateToGlyph(glyphId, alternating-direction)` — awaits ring arrival.
3. `await sleep(encodeDelay=200ms)` scaled by fast-mode multiplier.
4. Locks chevron visually, plays audio.
5. `await sleep(interChevronDelay=400ms)` scaled.
6. Continues to next chevron.

**Auto-dial (`engine.js:340–378`):** Selects mode automatically based on address length, then enters glyphs with 200ms inter-glyph delay (scaled), then calls `engage()` after 500ms.

**Interruptibility:** Yes, at every `await` point. `this.state === 'aborting'` is checked at the top of each loop iteration (`engine.js:407`, `engine.js:419`). `abort()` sets state and calls `ringController.stop()` which immediately resolves the pending `rotateToGlyph` promise.

**Instant mode:** `engageInstant()` (`engine.js:446`) bypasses ring rotation entirely. Uses hardcoded `sleep(80)` + `sleep(120)` per chevron — these **do not** go through `this.t()`.

---

## 6. Other Interactive Elements

| Element | Location | Status |
|---|---|---|
| Quick Dial panel | Left aside (movable) | Functional — triggers `autoDial()` per entry |
| Panel position toggle (▶/◀) | Quick dial header | Functional — toggles `quick-dial-right` CSS class |
| Gate Theme buttons (SDC/MW/PEG) | Right panel, GATE THEME | Functional — persists to `localStorage` |
| Mode buttons (7–12) | Right panel, MODE SELECT | Functional; modes 10/11/12 labelled "TBD" in HTML |
| Address Buffer display | Right panel, ADDRESS BUFFER | Visual only — updates on glyph entry |
| Glyph grid (Input Area) | Right panel, 8×5 grid | Functional — 38 clickable glyph buttons + 2 hidden spacers |
| Glyph ring (SVG inner ring) | Gate viewport | Functional — each glyph is clickable |
| Chevron status strip | Right panel | Visual indicator only |
| Signal strength canvas | Right panel | Procedural animation, always running, mode-reactive |
| ENGAGE / ABORT / DISCONNECT | Right panel, bottom | Functional state machine; disabled until buffer full |
| Dial Speed (NORMAL/FAST/INSTANT) | Right panel, bottom | Functional — modifies physics config and timing |
| Status log | Right panel, STATUS | Single-line text, updated throughout sequence |
| Dest info | Right panel, STATUS | Populated on wormhole establishment |
| Header status dot + text | Header bar | Updates IDLE/ACTIVE |
| Keyboard: `Escape` | Global | Calls `abort()` |
| Keyboard: `Enter` | Global | Calls `engage()` when button not disabled |
| Iris toggle | — | **Stub only** — `toggleIris()` method logs a message, no effect, no button |

---

## 7. Audio

**System:** Web Audio API — all sounds procedurally generated at runtime. No external audio files.  
**Global instance:** `const audioManager = new AudioManager()` at bottom of `audio.js:192`.

**Sounds generated at init (`audio.js:41–55`):**

| Name | Duration | Description |
|---|---|---|
| `chevronLock` | 0.15s | Metallic clunk: freq sweep 150→~0 Hz, noise layer, exp decay (×30) |
| `ringRotate` | 0.5s | Mechanical hum: 80/160/240 Hz harmonics, sin envelope |
| `kawoosh` | 1.2s | Filtered noise + pitch sweep (200±100 Hz sin-modulated) |
| `engage` | 0.2s | Pure tone 880 Hz, sin envelope |
| `abort` | 0.3s | Pure tone 220 Hz, sin envelope |
| `alarm` | — | **Never generated** — `this.sounds.alarm = null` (`audio.js:18`). Slot reserved, calling `play('alarm')` silently no-ops. |

**Trigger map:**

| Event | Sound | Volume |
|---|---|---|
| Glyph clicked (manual entry) | `engage` | 0.2 |
| Ring rotation starts | `ringRotate` | 0.3 |
| Chevron lock | `chevronLock` | 1.0 (default) |
| Wormhole established | `kawoosh` | 1.0 |
| Abort / Disconnect | `abort` | 1.0 |

**Known audio issues:**
1. `ringRotate` is 0.5s non-looping, played once per chevron spin-start. A typical normal-mode spin takes 2–5s — audio ends long before the ring stops.
2. Each new ring spin triggers a fresh `ringRotate` play without stopping the previous. At `interChevronDelay=400ms`, consecutive rotations can produce overlapping sound instances.
3. No distinct audio for the master chevron (chevron 9 / last lock).
4. `AudioContext` is created inside `initAudio()` which is called fire-and-forget from `init()` (`engine.js:72`) — not `await`ed. Harmless in practice (first interaction is well after init) but creates a brief window.

---

## 8. Visual Design System

### Themes

Three named themes, selected via `data-theme` attribute on `.sdc-fusion-container`. CSS custom properties propagate to all children. Theme persisted in `localStorage` via `ThemeController`.

| CSS Variable | Terminal (`terminal`) | Amber (`amber`) | Cyan (`cyan`) |
|---|---|---|---|
| `--green` | `#00cc28` | `#cc7700` | `#00aad4` |
| `--green-bright` | `#00cc00` | `#e89000` | `#00ccff` |
| `--green-dim` | `#007a1e` | `#7a4800` | `#006680` |
| `--bg` | `#000800` | `#080500` | `#000408` |
| `--bg-panel` | `#001100` | `#0f0800` | `#000810` |
| `--border` | `#008822` | `#7a4a00` | `#006a88` |
| `--ring-body` | `#080e08` | `#0c0c0c` | `#0a0c0e` |
| `--ring-housing` | `#1a2e1a` | `#2c2c2c` | `#1e2e3a` |
| `--chevron-fill` | `#151f15` | `#252525` | `#0f1a22` |
| `--chevron-locked-body` | `#0a2e0a` | `#2a1800` | `#00182a` |
| `--chevron-locked-crystal` | `#00cc28` | `#e89000` | `#00ccff` |
| `--horizon-c1` | `#00ff33` | `#ffaa00` | `#00d4ff` |
| `--horizon-c2` | `#00aa2a` | `#cc6600` | `#0088cc` |
| `--horizon-c3` | `#003300` | `#2a0e00` | `#001a33` |
| `--kawoosh-c1` | `rgba(0,204,40,0.7)` | `rgba(232,144,10,0.7)` | `rgba(0,180,216,0.7)` |
| `--signal-line` | `#00ff41` | `#ff9900` | `#00ccff` |
| `--align-mark-color` | `#00cc28` | `#cc7700` | `#00aad4` |

`:root` fallback in `fusion.css:171–209` mirrors terminal values — page never renders unstyled.

### Typography
- **Orbitron** — section headers, button labels, buffer slots, signal stats, all "computer" chrome
- **VT323** — body/status text, quick dial designation labels; monospaced pixel-font aesthetic

### Glow Effects
- SVG `<filter id="glow-locked">`: `feGaussianBlur stdDeviation="3"` merged with source. Applied to `.locked` chevron body and inner crystal via `filter: url(#glow-locked)`.

### Layout
- CSS Grid: `grid-template-columns: clamp(130px,13vw,175px) 1fr clamp(300px,30vw,420px)` — Quick Dial | Gate | Utility Panel.
- Gate SVG: `viewBox="-20 -20 540 540"`, ring center at `(250, 250)`, outer boundary r=255.
- `overflow: hidden` on body — no scrolling at any viewport size.

### Kawoosh Animation (`fusion.css:637–675`)
```css
/* .kawoosh-effect.active */
@keyframes kawoosh {
    0%   { transform: translate(-50%,-50%) scale(0);          opacity: 1; }
    30%  { transform: translate(-50%,-50%) scale(1.5) scaleY(0.3); opacity: 1; }
    60%  { transform: translate(-50%,-50%) scale(0.8);        opacity: 0.7; }
    100% { transform: translate(-50%,-50%) scale(1);          opacity: 0; }
}
/* duration: 0.8s ease-out forwards */
```

---

## 9. Known Breakage and Incomplete Work

### Broken (was or should be working, currently not)
- None confirmed broken by code inspection.

### Incomplete (started, not finished)
1. **Iris system** — `toggleIris()` at `engine.js:678` is a stub: logs "Iris control activated", no animation, no UI button. The iris overlay feature is unimplemented.
2. **`alarm` sound** — `audio.js:18`: `alarm: null`. Reserved in the sound table but never generated by `generateProceduralSounds()`. Calling `audioManager.play('alarm')` silently no-ops.
3. **Mode names 10/11/12** — `index.html:220–231`: mode buttons 10/11/12 are labelled `TBD`. The sequences exist and work; the labels are placeholder.
4. **Ring reset animation** — `ringController.reset()` snaps the ring to 0° instantly. No spin-down or idle return animation.

### Placeholder (intentional stubs)
1. **Glyph art** — `addresses.js:100–106`: glyphs are Unicode/Greek letters and geometric symbols. Not authentic Stargate constellation art.
2. **Reference images** — all assets in `references/` directory are unused by the app. `ASSET_INVENTORY.md` checkboxes are all unchecked.
3. **`spinDuration: 1500`, `encodeDuration: 300`, `lockDuration: 500`** — defined in `this.timing` (`engine.js:40–43`) but never read. Ring physics govern actual spin duration. These are misleading ghost values.

### Structural gaps (functional but incomplete)
1. **Glyph 0 (Point of Origin)** not clickable from the glyph grid — `generateGlyphGrid()` loops `i=1..38` (`engine.js:242`). Users cannot manually enter the PoO; it is always added automatically as the last chevron.
2. **`ringRotate` audio truncates** — 0.5s sound for a multi-second rotation. Non-looping.
3. **Event horizon is static** — No shimmering/ripple animation while wormhole is active. Just a radial gradient fill swap.

---

## 10. Realism Gap Assessment

### Present and correct
- ✅ Ring rotates to each glyph position before chevron locks
- ✅ Alternating clockwise/counter-clockwise rotation per chevron
- ✅ Criss-cross chevron locking order (opposite-side pairs)
- ✅ Ring decelerates and settles before chevron locks
- ✅ Chevron 9 (master, 12 o'clock) locks last
- ✅ Audio feedback on lock
- ✅ Kawoosh event on final lock
- ✅ Event horizon activates after kawoosh

### Missing or miscalibrated

| Issue | Severity | Detail |
|---|---|---|
| **Overshoot amplitude is static** | Low | The static 1.5° default is used when the ring reaches target slowly. Velocity-scaled path (`velocity * 0.015`, `ring.js:194`) only fires on genuine overshoot. A slow deceleration produces a uniform 1.5° wobble regardless of entry conditions. |
| **No "clunk/thunk" mechanical halt** | Low | On ring arrival the overshoot produces a 1.5° 4Hz wobble. This is mathematically correct but lacks the visceral mechanical "thud" of a heavy ring stopping. The oscillation frequency (4 Hz) may feel too fast/light. |

---

## 11. Hardcoded Values and Magic Numbers

These are Fable 5's primary calibration targets.

### `engine.js`
```
engine.js:40   spinDuration: 1500      // ms — UNUSED (ghost value)
engine.js:41   encodeDelay: 200        // ms — delay before chevron locks after ring stop
engine.js:42   encodeDuration: 300     // ms — UNUSED (ghost value)
engine.js:43   lockDuration: 500       // ms — UNUSED (ghost value)
engine.js:44   interChevronDelay: 400  // ms — delay between chevron lock and next spin
engine.js:45   kawooshDuration: 800    // ms — kawoosh CSS animation match
engine.js:47   fastMultiplier: 15      // timing divisor in fast mode
engine.js:373  await this.sleep(this.t(200))  // ms — glyph entry delay in autoDial
engine.js:377  await this.sleep(this.t(500))  // ms — pre-engage pause in autoDial
engine.js:470  await this.sleep(80)    // ms — instant-mode encoding flash (bypasses this.t())
engine.js:482  await this.sleep(120)   // ms — instant-mode inter-chevron (bypasses this.t())
engine.js:574  setTimeout(() => this.reset(), 500)   // ms — abort cleanup delay
engine.js:594  setTimeout(() => this.reset(), 600)   // ms — disconnect cleanup delay
engine.js:735  rc.maxVelocity = 900    // deg/s — fast-mode ring speed
engine.js:736  rc.acceleration = 1800  // deg/s² — fast-mode ring acceleration
engine.js:738  rc.maxVelocity = 120    // deg/s — normal-mode ring speed (duplicate of ring.js:15)
engine.js:739  rc.acceleration = 200   // deg/s² — normal-mode acceleration (duplicate of ring.js:16)
```

### `ring.js`
```
ring.js:13   totalGlyphs: 39
ring.js:14   degreesPerGlyph: 360/39    // ≈ 9.2308°
ring.js:15   maxVelocity: 120           // deg/s
ring.js:16   acceleration: 200          // deg/s²
ring.js:17   friction: 0.92             // velocity multiplier per frame when distance < 30°
ring.js:18   overshootAmplitude: 1.5    // degrees — static settle wobble
ring.js:19   overshootDecay: 6          // exp decay rate
ring.js:43   radius = 175               // SVG units — glyph placement radius
ring.js:50   r1 = 160, r2 = 190         // SVG units — slot-divider radii
ring.js:105  Math.abs(normalizedDiff) < 60   // degrees — threshold for adding extra rotation
ring.js:162  Math.cos(2 * Math.PI * 4 * ...)  // 4 Hz — overshoot oscillation frequency
ring.js:167  decay < 0.01               // oscillation exit threshold
ring.js:183  Math.abs(distance) < 30    // degrees — friction-start threshold
ring.js:191  Math.abs(velocity) > 5     // deg/s — overshoot trigger minimum
ring.js:194  Math.abs(velocity) * 0.015 // overshoot amplitude scale factor
```

### `audio.js`
```
audio.js:59   duration = 0.15           // s — chevron lock sound
audio.js:67   freq = 150 - (t * 500)    // Hz — lock sound frequency sweep
audio.js:68   Math.exp(-t * 30)         // envelope decay
audio.js:77   duration = 0.5            // s — ring rotate sound
audio.js:85   80 Hz fundamental
audio.js:86   160 Hz harmonic × 0.5
audio.js:87   240 Hz harmonic × 0.25
audio.js:95   duration = 1.2            // s — kawoosh sound
audio.js:105  freq = 200 + Math.sin(t * 10) * 100   // Hz — kawoosh sweep
audio.js:107  t < 0.3 ? (t/0.3) : Math.exp(-(t-0.3)*3)  // kawoosh envelope
```

### `fusion.css`
```
fusion.css:529  chevronBlink 0.35s infinite        // chevron encoding blink rate
fusion.css:565  stroke-dasharray: 2.5 28.25        // 39 tick-mark spacing
fusion.css:653  animation: kawoosh 0.8s ease-out   // kawoosh duration (must match engine.js:45)
```

### `signal.js`
```
signal.js:25   WAVEFORM_LEN = 120
signal.js:35   BAR_COUNT = 20
signal.js:149  barTimer = 6 + Math.floor(Math.random() * 18)   // bar update interval (frames)
signal.js:153  * 0.18                  // bar smoothing factor
signal.js:159  barHold[i] = 45         // peak hold (frames)
signal.js:162  barPeaks[i] - 0.01      // peak decay rate per frame
signal.js:175  * 0.04                  // stats smoothing factor
signal.js:210  WAVE_W = W * 0.63       // waveform section 63% of canvas width
signal.js:211  GAP = W * 0.04          // divider gap 4%
```

---

## 12. Structural Observations

**1. Ghost values in `timing` object.**  
`spinDuration`, `encodeDuration`, and `lockDuration` are defined in `this.timing` but never read by any code path. They create the false impression that these durations are configurable. Fable 5 should either wire them up or remove them.

**2. Instant-mode bypasses the timing system.**  
`engageInstant()` uses hardcoded `sleep(80)` and `sleep(120)` (`engine.js:470`, `engine.js:482`) that do not go through `this.t()`. Tuning `this.timing.*` has no effect on instant mode.

**3. Normal-mode physics are duplicated.**  
`ring.js:15–16` initializes `maxVelocity: 120, acceleration: 200`. `engine.js:738–739` resets them to the same values on NORMAL speed selection. If the defaults in `ring.js` are changed, `engine.js` must also be updated.

**4. State machine uses bare strings.**  
States `'idle' | 'dialing' | 'locking' | 'active' | 'aborting'` are plain strings. No enum, no constant map. Typos would silently break transitions. Low risk for a small codebase but worth noting.

**5. Abort/disconnect use `setTimeout` for cleanup.**  
`abort()` sets `state = 'aborting'` then schedules `reset()` after 500ms via `setTimeout` (`engine.js:574`). `disconnect()` uses 600ms. Any `await`-based loop that checks `state !== 'aborting'` could still be running during this window, though in practice `ringController.stop()` resolves all pending promises immediately.

**6. `ringRotate` audio collision.**  
`audioManager.play('ringRotate')` is called at the start of every `rotateToGlyph()` call (`ring.js:126`). With `interChevronDelay=400ms` between chevrons and a 0.5s sound, the previous chevron's rotation sound is still playing when the next starts. No stop-before-restart logic exists.

**7. `autoDial` mode-switching reads `this.sequences` but does not validate.**  
`engine.js:353`: `if (this.sequences[requiredMode])` — a valid guard. But if `address.address.length + 1` is outside the 7–12 range (e.g., a 6-symbol address giving mode=7 is fine, but a 5-symbol address gives mode=6 which has no sequence), the mode switch silently fails and the prior mode is used. The current address data is all valid but this is a latent bug.

**8. `color-mix()` usage.**  
`fusion.css:349`, `522`, `779`: `color-mix(in srgb, var(--green) 5%, var(--bg-panel))` etc. This is a modern CSS function (baseline support ~2023). Not a problem for current browsers but worth noting for completeness.

**9. Chevron shape uses identical polygon for all 12.**  
Every `.chevron` group uses the exact same `points` string on body and inner crystal. This is structurally clean — shape is purely controlled by `transform="rotate(…, 250, 250)"`. Good.

**10. `signalStrength` is accessed via `window.signalStrength`.**  
`engine.js:75`: `this.signalStrength = window.signalStrength || null`. The signal widget initializes in its own `DOMContentLoaded` handler in `signal.js:319`. Both handlers fire on the same event, and `signal.js` is loaded before `engine.js` in `index.html:311–316`, so `window.signalStrength` is set before `engine.js:init()` runs. The ordering is load-order dependent — fragile but consistent with the fixed script order.

---

## Summary

The project is a well-structured pure-vanilla Stargate dialing computer with no build step, clean three-theme CSS custom property system, working physics-driven ring rotation, functional 12-chevron gate, and a complete dialing state machine supporting modes 7–12. The core loop — glyph selection → ring spin → chevron lock → kawoosh → event horizon — works end-to-end. The highest-priority gaps for Fable 5 to address are: (1) the kawoosh effect is 2D-only and visually weak; (2) the event horizon has no active-state animation; (3) `ringRotate` audio truncates mid-spin; and (4) three ghost timing values in `this.timing` that should either be wired up or deleted to prevent calibration confusion. The glyph symbols are Unicode placeholders and no authentic glyph art has been integrated yet, which limits visual authenticity.
