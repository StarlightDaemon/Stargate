/**
 * DSV-9 ARCHELON - Vessel Engineering Cross-Section Controller
 * Generates an interactive SVG schematic of the bathyscaphe hull,
 * ballast tanks, high-pressure variable buoyancy spheres, and thrusters.
 */

const Engineering = (() => {
  const COMPARTMENTS = {
    'ti-sphere': {
      badge: 'COMPARTMENT: TI-SPHERE-01',
      title: 'Grade-5 Titanium Spherical Pressure Hull',
      desc: '2.1m inner diameter forged titanium-alloy pressure sphere housing 2 pilot stations, environmental scrubbers, and primary HUD vectoring compute clusters. Rated for continuous cyclic dives to 12,000m.',
      specs: [
        { k: 'Wall Thickness:', v: '94.0 mm (3.70 in)' },
        { k: 'Yield Strength:', v: '880 MPa (Ti-6Al-4V ELI)' },
        { k: 'Current Internal Pressure:', v: '1.00 ATM (Normoxic)' },
        { k: 'Oxygen Partial Pressure:', v: '0.210 BAR (Nominal)' }
      ]
    },
    'syntactic-foam': {
      badge: 'FLOTATION: SYNTACTIC-MATRIX',
      title: 'Syntactic Foam Buoyancy Blocks',
      desc: 'High-density epoxy resin matrix packed with microscopic hollow glass microspheres (density 0.54 g/cm³), providing 8.2 tons of passive buoyant lift immune to hydrostatic compression.',
      specs: [
        { k: 'Matrix Density:', v: '540 kg/m³' },
        { k: 'Crush Threshold:', v: '14,000 m equivalent' },
        { k: 'Total Displacement:', v: '15.4 m³' },
        { k: 'Hydrostatic Water Absorption:', v: '< 0.05% / 1000 hrs' }
      ]
    },
    'ballast-fwd': {
      badge: 'BALLAST: MF-01 / MF-02',
      title: 'Forward Main Ballast Tanks',
      desc: 'Dual free-flooding seawater ballast tanks with high-pressure pneumatic emergency blow valves. Flooded during initial descent initiation and vented during surface return.',
      specs: [
        { k: 'Capacity:', v: '2 x 1,200 Liters' },
        { k: 'Venting Pressure:', v: '450 BAR Compressed N2' },
        { k: 'Flood Time to 100%:', v: '32.4 Seconds' },
        { k: 'Current Fluid State:', v: 'Active Hydrostatic Fill' }
      ]
    },
    'ballast-aft': {
      badge: 'BALLAST: MA-01 / MA-02',
      title: 'Aft Main Ballast Tanks & Trim Manifold',
      desc: 'Aft ballast and longitudinal trim tanks linked via high-speed hydraulic cross-flow pump to adjust vessel pitch angle from -15° (dive) to +20° (ascent).',
      specs: [
        { k: 'Capacity:', v: '2 x 1,200 Liters' },
        { k: 'Trim Pump Flow Rate:', v: '85 L/min' },
        { k: 'Pitch Authority:', v: '± 25.0° Range' },
        { k: 'Fluid Load:', v: 'Seawater Trim Balanced' }
      ]
    },
    'vbt-spheres': {
      badge: 'BUOYANCY: VBT-A / VBT-B',
      title: 'High-Pressure Variable Buoyancy Spheres',
      desc: 'Titanium micro-spheres with positive displacement hydraulic oil pumps that alter net vehicle displacement by pumping oil into external bladders against 1,200 bar ambient pressure.',
      specs: [
        { k: 'Max Hydraulic Pressure:', v: '1,350 BAR' },
        { k: 'Trim Authority:', v: '± 450 N Fine Buoyancy' },
        { k: 'Precision Tolerance:', v: '± 0.02 kN' },
        { k: 'Pump Motor Type:', v: 'Brushless DC Inverted' }
      ]
    },
    'thruster-pack': {
      badge: 'PROPULSION: VT-01 / VT-04',
      title: '4-Axis Vectored Magnetic-Coupled Thrusters',
      desc: 'Four pressure-tolerant oil-filled brushless DC thrusters magnetically coupled to high-aspect composite ducted props, providing 360° omnidirectional maneuverability.',
      specs: [
        { k: 'Max Continuous Thrust:', v: '4 x 2.2 kN (8.8 kN Total)' },
        { k: 'Magnetic Coupling Gap:', v: '6.5 mm Inconel Seal' },
        { k: 'RPM Limit:', v: '2,400 RPM' },
        { k: 'Power Consumption:', v: '18.4 kW (Full Surge)' }
      ]
    },
    'battery-banks': {
      badge: 'POWER: LI-PO PRESSURE-TOLERANT',
      title: 'Pressure-Tolerant Lithium Polymer Battery Banks',
      desc: 'Dielectric silicone-oil immersed 120 kWh battery system operating directly at ambient hydrostatic pressure, eliminating the weight penalty of a secondary pressure vessel.',
      specs: [
        { k: 'Total Storage Capacity:', v: '120.0 kWh' },
        { k: 'Bus Voltage:', v: '128.0 VDC Nominal' },
        { k: 'Immersion Fluid:', v: 'Dow Corning 200 Fluid' },
        { k: 'State of Charge:', v: '94.2% (113.0 kWh)' }
      ]
    }
  };

  let activeCompartment = 'ti-sphere';

  const init = () => {
    renderSchematicSVG();
    bindEvents();
  };

  const renderSchematicSVG = () => {
    const svg = document.getElementById('vessel-schematic-svg');
    if (!svg) return;

    svg.innerHTML = `
      <defs>
        <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#08182c" />
          <stop offset="100%" stop-color="#040c18" />
        </linearGradient>
        <linearGradient id="sphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0e3a58" />
          <stop offset="100%" stop-color="#051c2e" />
        </linearGradient>
        <pattern id="foamPattern" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.5" fill="rgba(0, 229, 255, 0.15)" />
          <circle cx="9" cy="9" r="1.5" fill="rgba(0, 229, 255, 0.15)" />
        </pattern>
      </defs>

      <!-- Outer Syntactic Foam Hydrodynamic Hull Frame -->
      <path d="M 120 240 Q 150 100 450 100 Q 750 100 820 240 Q 750 380 450 380 Q 150 380 120 240 Z" 
            fill="url(#hullGrad)" stroke="rgba(0, 229, 255, 0.4)" stroke-width="2.5" />
      
      <!-- Syntactic Foam Matrix Region (Clickable) -->
      <path id="svg-foam" data-comp="syntactic-foam" class="svg-comp-interactive"
            d="M 180 240 Q 210 130 450 130 Q 690 130 760 240 Q 690 350 450 350 Q 210 350 180 240 Z" 
            fill="url(#foamPattern)" stroke="rgba(0, 229, 255, 0.2)" stroke-width="1.5" />

      <!-- Forward Main Ballast Tanks MF-01 / MF-02 (Clickable) -->
      <rect id="svg-ballast-fwd" data-comp="ballast-fwd" class="svg-comp-interactive"
            x="640" y="160" width="90" height="160" rx="10" 
            fill="rgba(0, 229, 255, 0.12)" stroke="var(--accent-cyan)" stroke-width="2" />
      <rect x="645" y="200" width="80" height="110" rx="6" fill="rgba(0, 229, 255, 0.35)" class="svg-fluid-fill" />
      <text x="685" y="245" fill="var(--text-bright)" font-family="var(--font-mono)" font-size="10" font-weight="700" text-anchor="middle">MF-BALLAST</text>

      <!-- Aft Main Ballast Tanks MA-01 / MA-02 (Clickable) -->
      <rect id="svg-ballast-aft" data-comp="ballast-aft" class="svg-comp-interactive"
            x="200" y="160" width="90" height="160" rx="10" 
            fill="rgba(0, 229, 255, 0.12)" stroke="var(--accent-cyan)" stroke-width="2" />
      <rect x="205" y="200" width="80" height="110" rx="6" fill="rgba(0, 229, 255, 0.35)" class="svg-fluid-fill" />
      <text x="245" y="245" fill="var(--text-bright)" font-family="var(--font-mono)" font-size="10" font-weight="700" text-anchor="middle">MA-BALLAST</text>

      <!-- Titanium Grade-5 Spherical Pressure Hull (Center-Dominant, Clickable) -->
      <circle id="svg-ti-sphere" data-comp="ti-sphere" class="svg-comp-interactive active-selected"
              cx="460" cy="240" r="95" 
              fill="url(#sphereGrad)" stroke="var(--accent-cyan)" stroke-width="3.5" />
      <circle cx="460" cy="240" r="82" fill="none" stroke="rgba(0, 229, 255, 0.3)" stroke-width="1.5" stroke-dasharray="4 4" />
      <text x="460" y="235" fill="var(--text-bright)" font-family="var(--font-display)" font-size="12" font-weight="800" text-anchor="middle">TI-SPHERE</text>
      <text x="460" y="252" fill="var(--accent-emerald)" font-family="var(--font-mono)" font-size="9" font-weight="700" text-anchor="middle">PILOT COCKPIT</text>

      <!-- High-Pressure Variable Buoyancy Spheres VBT-A & VBT-B (Clickable) -->
      <circle id="svg-vbt-a" data-comp="vbt-spheres" class="svg-comp-interactive"
              cx="330" cy="200" r="26" fill="rgba(255, 170, 0, 0.15)" stroke="var(--accent-amber)" stroke-width="2" />
      <text x="330" y="204" fill="var(--accent-amber)" font-family="var(--font-mono)" font-size="8" font-weight="700" text-anchor="middle">VBT-A</text>

      <circle id="svg-vbt-b" data-comp="vbt-spheres" class="svg-comp-interactive"
              cx="330" cy="280" r="26" fill="rgba(255, 170, 0, 0.15)" stroke="var(--accent-amber)" stroke-width="2" />
      <text x="330" y="284" fill="var(--accent-amber)" font-family="var(--font-mono)" font-size="8" font-weight="700" text-anchor="middle">VBT-B</text>

      <!-- Battery Banks (Clickable) -->
      <rect id="svg-battery" data-comp="battery-banks" class="svg-comp-interactive"
            x="380" y="350" width="160" height="24" rx="4" 
            fill="rgba(0, 255, 157, 0.15)" stroke="var(--accent-emerald)" stroke-width="1.5" />
      <text x="460" y="366" fill="var(--accent-emerald)" font-family="var(--font-mono)" font-size="9" font-weight="700" text-anchor="middle">120 kWh LI-PO BATTERIES</text>

      <!-- 4 Vectored Thrusters (Clickable) -->
      <!-- Dorsal Thruster -->
      <g id="svg-thruster-top" data-comp="thruster-pack" class="svg-comp-interactive">
        <rect x="425" y="72" width="70" height="22" rx="4" fill="rgba(0, 229, 255, 0.2)" stroke="var(--accent-cyan)" stroke-width="1.5" />
        <line x1="410" y1="83" x2="425" y2="83" stroke="var(--accent-cyan)" stroke-width="2" />
        <text x="460" y="87" fill="var(--text-bright)" font-family="var(--font-mono)" font-size="8" text-anchor="middle">VT-DOR</text>
      </g>

      <!-- Ventral Thruster -->
      <g id="svg-thruster-bottom" data-comp="thruster-pack" class="svg-comp-interactive">
        <rect x="425" y="386" width="70" height="22" rx="4" fill="rgba(0, 229, 255, 0.2)" stroke="var(--accent-cyan)" stroke-width="1.5" />
        <line x1="410" y1="397" x2="425" y2="397" stroke="var(--accent-cyan)" stroke-width="2" />
        <text x="460" y="401" fill="var(--text-bright)" font-family="var(--font-mono)" font-size="8" text-anchor="middle">VT-VEN</text>
      </g>

      <!-- Aft Main Thrusters -->
      <g id="svg-thruster-aft1" data-comp="thruster-pack" class="svg-comp-interactive">
        <rect x="80" y="180" width="35" height="45" rx="3" fill="rgba(0, 229, 255, 0.2)" stroke="var(--accent-cyan)" stroke-width="1.5" />
        <text x="97" y="206" fill="var(--text-bright)" font-family="var(--font-mono)" font-size="8" text-anchor="middle">VT-1</text>
      </g>
      <g id="svg-thruster-aft2" data-comp="thruster-pack" class="svg-comp-interactive">
        <rect x="80" y="255" width="35" height="45" rx="3" fill="rgba(0, 229, 255, 0.2)" stroke="var(--accent-cyan)" stroke-width="1.5" />
        <text x="97" y="281" fill="var(--text-bright)" font-family="var(--font-mono)" font-size="8" text-anchor="middle">VT-2</text>
      </g>
    `;
  };

  const bindEvents = () => {
    document.addEventListener('click', (e) => {
      const compEl = e.target.closest('.svg-comp-interactive');
      if (compEl) {
        const compKey = compEl.getAttribute('data-comp');
        if (compKey && COMPARTMENTS[compKey]) {
          selectCompartment(compKey);
          SoundEngine.playSolenoidClick();
        }
      }
    });
  };

  const selectCompartment = (compKey) => {
    activeCompartment = compKey;
    const data = COMPARTMENTS[compKey];
    if (!data) return;

    // Highlight selected in SVG
    document.querySelectorAll('.svg-comp-interactive').forEach(el => {
      el.classList.remove('active-selected');
      if (el.getAttribute('data-comp') === compKey) {
        el.classList.add('active-selected');
      }
    });

    // Update Inspector Pane
    const badgeEl = document.getElementById('insp-badge');
    const titleEl = document.getElementById('insp-title');
    const descEl = document.getElementById('insp-desc');
    const specsEl = document.getElementById('insp-specs');

    if (badgeEl) badgeEl.textContent = data.badge;
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;
    if (specsEl) {
      specsEl.innerHTML = data.specs.map(s => `
        <div class="spec-row">
          <span class="spec-k">${s.k}</span>
          <span class="spec-v">${s.v}</span>
        </div>
      `).join('');
    }

    Storage.logEvent('ENGINEERING', `Inspecting compartment: ${data.title}`);
  };

  return {
    init,
    selectCompartment
  };
})();

window.Engineering = Engineering;
