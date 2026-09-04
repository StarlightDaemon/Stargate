// gate-renderer.js — SVG Spindle Ring, Bone Pins, Thread Matrix, and Hearth Aperture
// Implements flat 2D folk-craft vector aesthetics without fake 3D material simulation.

export class FolkGateRenderer {
  constructor(svgElement, runes) {
    this.svg = svgElement;
    this.runes = runes;
    this.currentRotation = 0;
    this.lockedPins = [];
    this.activeThreads = [];
    this.stage = "idle"; // idle, dialing, pending, buildup, active

    this.initDOM();
  }

  initDOM() {
    this.svg.innerHTML = `
      <defs>
        <!-- Flat craft shadow filters (crisp 2D offsets, not blurry 3D) -->
        <filter id="craft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#2a231b" flood-opacity="0.25"/>
        </filter>
        <filter id="ember-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#e27d32" flood-opacity="0.6"/>
        </filter>
        <filter id="salt-flash" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ffffff" flood-opacity="0.9"/>
        </filter>

        <!-- Folk cross-stitch pattern for perimeter -->
        <pattern id="stitch-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
          <line x1="2" y1="2" x2="10" y2="10" stroke="#8b684a" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="10" y1="2" x2="2" y2="10" stroke="#8b684a" stroke-width="1.2" stroke-linecap="round"/>
        </pattern>
      </defs>

      <!-- Parchment Background Plate -->
      <g id="base-layer">
        <circle cx="350" cy="350" r="340" class="ring-plate-outer"/>
        <circle cx="350" cy="350" r="332" class="ring-stitch-border"/>
        <circle cx="350" cy="350" r="260" class="ring-track"/>
      </g>

      <!-- 7 Perimeter Bone Pins (Outer Ward Claps) -->
      <g id="bone-pins-layer"></g>

      <!-- Rotating Spindle Ring containing 36 folk glyphs -->
      <g id="spindle-ring" transform="rotate(0, 350, 350)">
        <circle cx="350" cy="350" r="255" class="inner-track"/>
        <circle cx="350" cy="350" r="185" class="inner-track-divider"/>
        <!-- Botanical leaf marginalia along inner ring -->
        <g id="vine-marginalia"></g>
        <!-- 36 Runes -->
        <g id="runes-group"></g>
      </g>

      <!-- Woven Thread Matrix (Twine strings drawn between locked runes and hub) -->
      <g id="threads-layer"></g>

      <!-- Central Hearth Aperture & Salt Line -->
      <g id="hearth-aperture" transform="translate(350, 350)">
        <!-- Salt Circle -->
        <circle cx="0" cy="0" r="150" class="salt-line-ring" id="salt-ring"/>
        <circle cx="0" cy="0" r="142" class="salt-dot-ring"/>

        <!-- Hearthstone Foundation Plate -->
        <circle cx="0" cy="0" r="130" class="hearthstone-disc"/>

        <!-- Idle/Cold Hearth Elements (Dried Chamomile, Charcoal, Ash) -->
        <g id="cold-hearth-group">
          <!-- Stylized dried sprigs in chalk-and-iron style -->
          <path d="M-40 20 Q-20 40 10 30 Q40 20 60 40" class="hearth-sprig-stem"/>
          <circle cx="-35" cy="22" r="4" class="hearth-berry"/>
          <circle cx="5" cy="32" r="4" class="hearth-berry"/>
          <circle cx="55" cy="38" r="4" class="hearth-berry"/>
          <!-- Inactive Rushlight Holder -->
          <path d="M-15 15 L0 -25 L15 15 Z" class="rushlight-pith-clip"/>
          <line x1="0" y1="-25" x2="0" y2="-55" class="rushlight-tallow-stem"/>
        </g>

        <!-- Active / Buildup Hearth Window -->
        <g id="active-hearth-group" class="hearth-hidden">
          <!-- Stylized woodcut smoke wisps for kindling buildup -->
          <g id="smoke-wisps-group" class="smoke-wisps">
            <path d="M-8 -30 C-20 -50 -5 -70 -15 -95" class="smoke-wisp-line"/>
            <path d="M6 -32 C18 -55 5 -75 14 -105" class="smoke-wisp-line"/>
            <path d="M0 -35 C-10 -60 12 -80 0 -115" class="smoke-wisp-line"/>
          </g>

          <!-- Living Hearth Flame (Stylized flat 2D folklore cut-out layers) -->
          <path id="hearth-flame-outer" d="M0 -90 C45 -45 55 15 35 60 C15 90 -15 90 -35 60 C-55 15 -45 -45 0 -90 Z" class="flame-outer"/>
          <path id="hearth-flame-mid" d="M0 -65 C30 -30 35 15 22 45 C10 70 -10 70 -22 45 C-35 15 -30 -30 0 -65 Z" class="flame-mid"/>
          <path id="hearth-flame-core" d="M0 -40 C18 -20 20 10 12 30 C5 45 -5 45 -12 30 C-20 10 -18 -20 0 -40 Z" class="flame-core"/>

          <!-- Animated Folk Herbal Motes & Chamomile Petals drifting in the warmth -->
          <g id="drifting-motes">
            <circle cx="-25" cy="-20" r="3.5" class="mote-herbal"/>
            <circle cx="30" cy="-35" r="3" class="mote-herbal"/>
            <circle cx="-12" cy="-60" r="2.2" class="mote-spark"/>
            <circle cx="18" cy="-75" r="2.5" class="mote-spark"/>
            <path d="M-20 -40 C-18 -46 -12 -44 -14 -38 Z" class="mote-petal"/>
            <path d="M22 -50 C24 -56 30 -54 28 -48 Z" class="mote-petal"/>
          </g>
        </g>

        <!-- Center Spindle Hub / Bone Whorl -->
        <circle cx="0" cy="0" r="32" class="spindle-hub-plate" filter="url(#craft-shadow)"/>
        <circle cx="0" cy="0" r="24" class="spindle-hub-inner"/>
        <circle cx="0" cy="0" r="8" class="spindle-pin-eye"/>
      </g>
    `;

    this.renderBonePins();
    this.renderVineMarginalia();
    this.renderRunes();
  }

  // 7 Perimeter Bone Pins (at 0, 51.43, 102.86, 154.29, 205.71, 257.14, 308.57 deg)
  renderBonePins() {
    const pinsGroup = this.svg.querySelector("#bone-pins-layer");
    pinsGroup.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const angleDeg = i * (360 / 7);
      const rad = (angleDeg - 90) * (Math.PI / 180);
      const rBase = 310;
      const x = 350 + rBase * Math.cos(rad);
      const y = 350 + rBase * Math.sin(rad);

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("id", `bone-pin-${i}`);
      g.setAttribute("class", "bone-pin-assembly");
      g.setAttribute("transform", `translate(${x}, ${y}) rotate(${angleDeg})`);

      // Illustrated bone toggle pin with carved notch and eyelet
      g.innerHTML = `
        <g class="bone-pin-carrier" id="pin-carrier-${i}">
          <!-- Wooden bracket -->
          <rect x="-14" y="-12" width="28" height="24" rx="3" class="pin-bracket"/>
          <!-- Carved Bone Pin -->
          <path d="M-8 -26 C-10 -15 -8 15 -6 24 C-3 28 3 28 6 24 C8 15 10 -15 8 -26 C4 -30 -4 -30 -8 -26 Z" class="bone-pin-body" filter="url(#craft-shadow)"/>
          <!-- Carved Knot Marks on Bone -->
          <line x1="-5" y1="-12" x2="5" y2="-12" class="bone-carving"/>
          <line x1="-5" y1="-6" x2="5" y2="-6" class="bone-carving"/>
          <circle cx="0" cy="12" r="3" class="bone-eyelet"/>
          <circle cx="0" cy="12" r="1.5" class="bone-knot-center"/>
        </g>
      `;
      pinsGroup.appendChild(g);
    }
  }

  // Botanical leaves inked along the inner perimeter
  renderVineMarginalia() {
    const vineGroup = this.svg.querySelector("#vine-marginalia");
    vineGroup.innerHTML = "";
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = i * (360 / count);
      const rad = (angle - 90) * (Math.PI / 180);
      const r = 210;
      const x = 350 + r * Math.cos(rad);
      const y = 350 + r * Math.sin(rad);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M0 0 C4 -8 12 -6 12 0 C12 6 4 8 0 0 Z");
      path.setAttribute("transform", `translate(${x}, ${y}) rotate(${angle + 45}) scale(0.85)`);
      path.setAttribute("class", "botanical-leaf");
      vineGroup.appendChild(path);
    }
  }

  // 36 Folk Runes placed evenly on the rotating spindle
  renderRunes() {
    const runesGroup = this.svg.querySelector("#runes-group");
    runesGroup.innerHTML = "";
    const total = this.runes.length;

    this.runes.forEach((rune, index) => {
      const angleDeg = index * (360 / total);
      const rad = (angleDeg - 90) * (Math.PI / 180);
      const r = 222;
      const x = 350 + r * Math.cos(rad);
      const y = 350 + r * Math.sin(rad);

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("id", `glyph-roundel-${rune.id}`);
      g.setAttribute("class", "glyph-roundel");
      g.setAttribute("data-id", rune.id);
      g.setAttribute("transform", `translate(${x}, ${y}) rotate(${angleDeg})`);

      g.innerHTML = `
        <circle cx="0" cy="0" r="15" class="glyph-roundel-bg"/>
        <circle cx="0" cy="0" r="13" class="glyph-roundel-border"/>
        <g transform="translate(-16, -16) scale(1)" class="glyph-icon-wrap">
          <path d="${rune.path}" class="glyph-path"/>
        </g>
        <text x="0" y="24" class="glyph-number" text-anchor="middle">${rune.id}</text>
      `;

      runesGroup.appendChild(g);
    });
  }

  // Rotate ring to target angle
  rotateToAngle(targetAngleDeg, onComplete) {
    const ring = this.svg.querySelector("#spindle-ring");
    this.currentRotation = targetAngleDeg;
    ring.style.transition = "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)";
    ring.setAttribute("transform", `rotate(${targetAngleDeg}, 350, 350)`);

    if (onComplete) {
      setTimeout(onComplete, 650);
    }
  }

  // Lock a bone pin and weave a tension thread
  lockPin(pinIndex, runeId, isAuto = false) {
    const carrier = this.svg.querySelector(`#pin-carrier-${pinIndex}`);
    if (carrier) {
      carrier.classList.add("pin-seated");
    }

    const roundel = this.svg.querySelector(`#glyph-roundel-${runeId}`);
    if (roundel) {
      roundel.classList.add("glyph-locked");
    }

    // Compute coordinate of pin on outer perimeter
    const pinAngle = pinIndex * (360 / 7);
    const pinRad = (pinAngle - 90) * (Math.PI / 180);
    const pinX = 350 + 295 * Math.cos(pinRad);
    const pinY = 350 + 295 * Math.sin(pinRad);

    // Compute hub anchor point with slight variation per pin
    const hubOffsetAngle = (pinAngle + 180) * (Math.PI / 180);
    const hubX = 350 + 22 * Math.cos(hubOffsetAngle);
    const hubY = 350 + 22 * Math.sin(hubOffsetAngle);

    // Draw tensioned linen thread (SVG path with subtle catenary bow)
    const threadsLayer = this.svg.querySelector("#threads-layer");
    const threadPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const midX = (pinX + hubX) / 2 + (Math.sin(pinRad) * 12);
    const midY = (pinY + hubY) / 2 - (Math.cos(pinRad) * 12);

    threadPath.setAttribute("d", `M ${pinX} ${pinY} Q ${midX} ${midY} ${hubX} ${hubY}`);
    threadPath.setAttribute("class", "woven-thread-strand");
    threadPath.setAttribute("id", `thread-${pinIndex}`);

    threadsLayer.appendChild(threadPath);
    this.activeThreads.push(threadPath);
    this.lockedPins.push({ pinIndex, runeId });
  }

  // Stage 1: Buildup — flint sparks, tallow kindling, rising thread tension
  setBuildup() {
    this.stage = "buildup";
    const activeHearth = this.svg.querySelector("#active-hearth-group");
    const coldHearth = this.svg.querySelector("#cold-hearth-group");
    const saltRing = this.svg.querySelector("#salt-ring");

    activeHearth.classList.remove("hearth-hidden");
    activeHearth.classList.add("hearth-buildup");
    coldHearth.classList.add("cold-hearth-dim");
    saltRing.classList.add("salt-ring-warming");

    // Tension threads hum
    this.activeThreads.forEach(t => t.classList.add("thread-tensioned"));
  }

  // Stage 2: Breakthrough — bright salt flare, floral snap
  setBreakthrough() {
    this.stage = "breakthrough";
    const saltRing = this.svg.querySelector("#salt-ring");
    saltRing.classList.add("salt-ring-flare");
    const activeHearth = this.svg.querySelector("#active-hearth-group");
    activeHearth.classList.add("hearth-breakthrough");
  }

  // Stage 3: Sustained Active — peaceful living hearth window
  setSustainedActive() {
    this.stage = "active";
    const saltRing = this.svg.querySelector("#salt-ring");
    saltRing.classList.remove("salt-ring-flare");
    saltRing.classList.add("salt-ring-active");

    const activeHearth = this.svg.querySelector("#active-hearth-group");
    activeHearth.classList.remove("hearth-buildup", "hearth-breakthrough");
    activeHearth.classList.add("hearth-sustained");

    this.activeThreads.forEach(t => {
      t.classList.remove("thread-tensioned");
      t.classList.add("thread-active-glow");
    });
  }

  // Reset to idle / cold hearth
  resetToIdle() {
    this.stage = "idle";
    const activeHearth = this.svg.querySelector("#active-hearth-group");
    const coldHearth = this.svg.querySelector("#cold-hearth-group");
    const saltRing = this.svg.querySelector("#salt-ring");

    if (activeHearth) {
      activeHearth.className.baseVal = "hearth-hidden";
    }
    if (coldHearth) {
      coldHearth.classList.remove("cold-hearth-dim");
    }
    if (saltRing) {
      saltRing.className.baseVal = "salt-line-ring";
    }

    // Unseat all bone pins
    for (let i = 0; i < 7; i++) {
      const carrier = this.svg.querySelector(`#pin-carrier-${i}`);
      if (carrier) carrier.classList.remove("pin-seated");
    }

    // Unmark locked glyphs
    const lockedGlyphs = this.svg.querySelectorAll(".glyph-locked");
    lockedGlyphs.forEach(g => g.classList.remove("glyph-locked"));

    // Clear threads
    const threadsLayer = this.svg.querySelector("#threads-layer");
    if (threadsLayer) threadsLayer.innerHTML = "";

    this.activeThreads = [];
    this.lockedPins = [];
  }
}
