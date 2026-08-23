# Changelog

All notable changes to the DSV-9 ARCHELON Bathyscaphe Pilot Console & Abyssal Gateway Interface will be documented in this file.

## [1.0.0] - 2026-08-23

**Built by:** Gemini 3.7 Flash (High Reasoning)

### Overview
Initial release of the **DSV-9 ARCHELON Bathyscaphe Pilot Console** — a maximalist, high-depth interactive deep-ocean submersible piloting HUD and Abyssal Gateway rift navigation interface created for the **Hadal Exploration & Abyssal Research Consortium (HEARC)**.

### Features Added
- **Cockpit Viewport & Crush-Depth Gauge Ring**:
  - Dominant acrylic sphere observation viewport rendering live bathymetric strata, marine snow particle physics, and abyssal rift vortex.
  - Concentric Hydrostatic Pressure & Crush-Depth Gauge (0 to 11,850 m) with live waypoint chevrons, rated safety thresholds, and descent track visualization.
- **Ballast & Trim Neutral Buoyancy Hold Locking Mechanism**:
  - 10-Channel Ballast and Trim simulation (Forward Main, Aft Main, Port Trim, Starboard Trim, Variable Buoyancy Cylinders 1 & 2, Bow Thruster, Stern Thruster, Dorsal/Ventral Vectored Thrusters).
  - Realistic trim stabilization sequence converging to $\Delta F = 0.00\text{ kN}$ (Neutral Buoyancy Hold) for each locked depth waypoint.
- **Core Piloting Control Clusters (Strictly 2 Clusters)**:
  - Cluster 1: `#cluster-waypoint-selector` (8 Abyssal depth strata waypoints + 10-channel ballast bar monitors).
  - Cluster 2: `#cluster-actuation` (Safety Interlock toggle, Staged Aperture Descent Actuator, Emergency Blow All Ballast / Disengage).
- **Three-Stage Staged Descent Sequence**:
  - Stage 1 (Buildup): 2.0s descent acceleration, hydraulic pressure surge, ambient illumination dimming, hull creak audio.
  - Stage 2 (Breakthrough): 0.8s gateway aperture opening flash, acoustic crescendo, portal iris dilation.
  - Stage 3 (Sustained Active): Stable hold at 11,800m Hadal Rift Horizon with live telemetry stream and particle vortex.
- **Tiered Quick-Dial Computer Presets**:
  - Tier 1: Verified Consortium Descent Profiles (HEARC-Standard Alpha, Kermadec Survey, Sirena Deep Observation).
  - Tier 2: Experimental Hadal Anomaly Routes (Anomaly Omega-7, Sub-Bathic Rift Echo-9, Abyssal Rift Void Crossing).
  - Staged auto-dialing playback at dive-computer speeds, landing in PENDING/READY state without auto-firing.
- **Pure Web Audio API Soundscape**:
  - Synthesized ballast flood/vent hiss, thruster vectoring whine, titanium hull pressure creak/groan, deep hadal ambient drone, hydraulic solenoid clicks.
  - Zero external sound files; zero sonar or acoustic detection sounds.
- **Vessel Engineering Cross-Section**:
  - Interactive 2D schematic of *DSV-9 ARCHELON* displaying titanium sphere pressure hull, syntactic foam pack, 4 main ballast tanks, 2 variable buoyancy spheres, 4 vectored thrusters, and battery banks with real-time fluid/thrust animations.
- **Relational In-Universe Dive Archive**:
  - 30+ cross-referenced dive mission logs, incident reports, crew journals, and bathymetric surveys with clickable hyper-references (`[REF-INCIDENT-883]`, `[DIVE-772]`, `[BIO-ANOMALY-04]`).
- **Live Physical Hydrostatic Telemetry Matrix**:
  - Computed physical relationships for Hydrostatic Pressure ($P(z) = 1 + 0.1008 z\text{ bar}$), seawater density, thermal thermocline ($24.5^\circ\text{C} \to 1.2^\circ\text{C}$), hull microstrain ($\epsilon$), and net buoyancy force.
- **Session Persistence & Settings**:
  - `localStorage` persistence for completed dive records, viewed archive entries, and user preferences.
  - 4 instrument color themes (Abyssal Cyan, Deep Amber, Bioluminescent Emerald, Monolith High-Contrast), display density modes, and audio mixer.
  - Real-time timestamped session event log.
- **Operator Reference**:
  - Circular `?` button top-right opening full submersible operating manual and instrumentation reference overlay.
