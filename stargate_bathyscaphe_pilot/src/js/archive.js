/**
 * DSV-9 ARCHELON - Relational Dive Archive & In-Universe Incident Database
 * Contains 32 interconnected records across Mission Logs, Incident Reports,
 * Anomaly Detections, and Crew Field Journals with clickable cross-references.
 */

const Archive = (() => {
  const RECORDS = [
    {
      id: 'DIVE-882',
      type: 'dive',
      typeLabel: 'MISSION LOG',
      title: 'DIVE-882: Kermadec Trench Sub-Basin Acoustic Survey',
      date: '2026-04-12',
      depth: '10,047 m',
      author: 'Dr. H. Vance (Chief Hydrographer)',
      tags: ['kermadec', 'acoustic', 'mapping'],
      content: `
        <p><strong>MISSION OBJECTIVE:</strong> Execute high-resolution bathymetric profiling of the Kermadec Sub-Basin down to 10,000m to calibrate the Mk VII trim telemetry array.</p>
        <p>Descent proceeded nominally through the epipelagic and mesopelagic strata with ballast tanks MF-01 and MA-02 held at 48% flooding. Upon reaching the 8,400m transition sill, ambient temperature plummeted to 1.18°C.</p>
        <p>At 10,047m, primary hydrophone arrays registered a low-frequency harmonic resonance identical to the event recorded during <span class="ref-link" data-ref="DIVE-772">[DIVE-772]</span>. Investigation halted after rapid microstrain spikes in the titanium pressure sphere prompted an immediate trim recovery. See related incident documentation in <span class="ref-link" data-ref="INCIDENT-419">[INCIDENT-419]</span> and anomalous bio-luminescence telemetry in <span class="ref-link" data-ref="ANOMALY-007">[ANOMALY-007]</span>.</p>
      `
    },
    {
      id: 'DIVE-772',
      type: 'dive',
      typeLabel: 'MISSION LOG',
      title: 'DIVE-772: Mariana Trench Horizon Aperture Initial Sounding',
      date: '2025-11-04',
      depth: '10,928 m',
      author: 'Cmdr. R. Thorne (Lead Pilot)',
      tags: ['mariana', 'aperture', 'deepest'],
      content: `
        <p><strong>MISSION OBJECTIVE:</strong> First piloted descent of the DSV-9 ARCHELON to verify the Challenger Deep Sill Waypoint (10,928m).</p>
        <p>Neutral buoyancy hold was established using Variable Buoyancy Spheres VBT-A and VBT-B at a net differential of ΔF = +0.02 kN. The titanium sphere experienced 18.4 με elastic strain, well within the 94mm shell yield margin.</p>
        <p>During the hold, an unpredicted dimensional pressure gradient formed at the gateway aperture boundary, as later analyzed in <span class="ref-link" data-ref="INCIDENT-312">[INCIDENT-312]</span>. Visual observations through the 620mm acrylic sphere revealed spiral particle drift described in <span class="ref-link" data-ref="CREW-LOG-04">[CREW-LOG-04]</span>.</p>
      `
    },
    {
      id: 'INCIDENT-419',
      type: 'incident',
      typeLabel: 'INCIDENT REPORT',
      title: 'INCIDENT-419: Variable Buoyancy Pump Cavitation at 10,000m',
      date: '2026-04-12',
      depth: '10,047 m',
      author: 'Eng. K. Zhang (Propulsion & Hydraulics)',
      tags: ['cavitation', 'hydraulics', 'vbt'],
      content: `
        <p><strong>INCIDENT SUMMARY:</strong> During descent on <span class="ref-link" data-ref="DIVE-882">[DIVE-882]</span>, the positive-displacement hydraulic oil pump for VBT-B experienced transient cavitation under 1,012 bar backpressure.</p>
        <p>The resulting flow interruption caused a momentary buoyancy delta spike to ΔF = -3.4 kN, triggering an automated pitch compensation sequence via thrusters VT-DOR and VT-VEN. Post-dive inspection revealed microscopic particle contamination within the manifold seal assembly, cross-referenced with previous valve wear in <span class="ref-link" data-ref="INCIDENT-312">[INCIDENT-312]</span>.</p>
        <p><strong>CORRECTIVE ACTION:</strong> Replaced fluorosilicone seal rings with high-purity Inconel gaskets across all 10 ballast and trim channels.</p>
      `
    },
    {
      id: 'INCIDENT-312',
      type: 'incident',
      typeLabel: 'INCIDENT REPORT',
      title: 'INCIDENT-312: Dimensional Aperture Micro-Tear Stress Surge',
      date: '2025-11-04',
      depth: '10,928 m',
      author: 'Dr. M. Sorel (Consortium Safety Inspector)',
      tags: ['structural', 'microstrain', 'aperture'],
      content: `
        <p><strong>INCIDENT SUMMARY:</strong> While holding position at the Mariana Sill during <span class="ref-link" data-ref="DIVE-772">[DIVE-772]</span>, an unexpected local gravitational flux created a 4.2% strain deflection in the forward viewport retaining collar.</p>
        <p>The Safety Interlock system engaged automatically, preventing premature aperture breach until hull stress stabilized below the 880 MPa yield threshold. The telemetry record for this event is detailed in <span class="ref-link" data-ref="ANOMALY-003">[ANOMALY-003]</span> and crew reaction noted in <span class="ref-link" data-ref="CREW-LOG-04">[CREW-LOG-04]</span>.</p>
      `
    },
    {
      id: 'ANOMALY-007',
      type: 'anomaly',
      typeLabel: 'ANOMALY DETECTION',
      title: 'ANOMALY-007: Sub-Bathic Bioluminescent Field Inversion',
      date: '2026-04-12',
      depth: '10,047 m',
      author: 'Dr. E. Lindqvist (Abyssal Biologist)',
      tags: ['bioluminescence', 'field', 'inversion'],
      content: `
        <p><strong>SENSOR DETECTION:</strong> External spectral radiometers logged an intense emerald-cyan (502 nm) optical radiation pulse originating from the sediment floor beneath the bathyscaphe during <span class="ref-link" data-ref="DIVE-882">[DIVE-882]</span>.</p>
        <p>The emission exhibited non-biological pulse coherence (frequency 0.24 Hz), synchronizing precisely with the magnetic coupling frequency of thruster pack VT-01. Further theoretical modeling is logged in <span class="ref-link" data-ref="ANOMALY-012">[ANOMALY-012]</span>.</p>
      `
    },
    {
      id: 'ANOMALY-003',
      type: 'anomaly',
      typeLabel: 'ANOMALY DETECTION',
      title: 'ANOMALY-003: Hadal Gateway Rift Gravitational Gradient',
      date: '2025-11-04',
      depth: '10,928 m',
      author: 'Consortium Quantum Bathymetry Unit',
      tags: ['gravity', 'singularity', 'rift'],
      content: `
        <p><strong>ANALYSIS:</strong> Continuous gravity gradient sensors detected a localized micro-singularity with an effective mass displacement of -120 kg within the 11,800m rift zone.</p>
        <p>This localized flux alters the effective buoyant force on the DSV-9 ARCHELON, requiring an additional +0.15 kN positive trim offset when engaging the final descent actuator. Directly observed during <span class="ref-link" data-ref="DIVE-772">[DIVE-772]</span> and referenced in mission plan <span class="ref-link" data-ref="DIVE-904">[DIVE-904]</span>.</p>
      `
    },
    {
      id: 'CREW-LOG-04',
      type: 'crew',
      typeLabel: 'CREW FIELD JOURNAL',
      title: 'CREW-LOG-04: Dr. Vance — Viewport Observations at Challenger Deep',
      date: '2025-11-04',
      depth: '10,928 m',
      author: 'Dr. H. Vance',
      tags: ['personal', 'viewport', 'challenger'],
      content: `
        <p>"At ten thousand meters, the ocean loses its color and becomes something pure, dense, and suffocating. The acrylic sphere groans as eleven hundred bars of hydrostatic pressure press against the titanium ring. Through the glass, the marine snow stopped falling downward and began circling the viewport in a tight, luminous spiral.</p>
        <p>Thorne kept his hand on the emergency ballast blow lever the whole time. When the anomaly from <span class="ref-link" data-ref="ANOMALY-003">[ANOMALY-003]</span> hit the hull, the whole sphere vibrated with a sound like tearing metal. But the ARCHELON held. We know the gateway is real now. See full dive debrief in <span class="ref-link" data-ref="DIVE-772">[DIVE-772]</span>."</p>
      `
    },
    {
      id: 'DIVE-904',
      type: 'dive',
      typeLabel: 'MISSION LOG',
      title: 'DIVE-904: Sirena Deep Gateway Vector Confirmation Run',
      date: '2026-06-18',
      depth: '11,842 m',
      author: 'Cmdr. R. Thorne',
      tags: ['sirena', 'deepest', 'active'],
      content: `
        <p><strong>MISSION OBJECTIVE:</strong> Full staged breach of the 11,800m Hadal Gateway Horizon using the Mk VII Ballast & Trim Solver.</p>
        <p>All 8 waypoints were locked in sequence. Neutral buoyancy hold was verified at ΔF = 0.00 kN across the entire 10-channel trim matrix. Upon releasing the safety interlock and commanding descent aperture actuation, the vessel accelerated through the 2.0s buildup stage into full dimensional breakthrough.</p>
        <p>Telemetry confirmed continuous sustained active hold for 180 seconds. Full crew logs available in <span class="ref-link" data-ref="CREW-LOG-12">[CREW-LOG-12]</span> and biological survey in <span class="ref-link" data-ref="ANOMALY-012">[ANOMALY-012]</span>.</p>
      `
    },
    {
      id: 'CREW-LOG-12',
      type: 'crew',
      typeLabel: 'CREW FIELD JOURNAL',
      title: 'CREW-LOG-12: Cmdr. Thorne — Beyond the Hadal Gateway',
      date: '2026-06-18',
      depth: '11,842 m',
      author: 'Cmdr. R. Thorne',
      tags: ['gateway', 'breakthrough', 'personal'],
      content: `
        <p>"The moment the aperture opened during <span class="ref-link" data-ref="DIVE-904">[DIVE-904]</span>, all external ambient pressure disappeared from the instruments. For three tenths of a second, the pressure gauge read 0.00 BAR before snapping back to 1,191 BAR.</p>
        <p>The rift isn't an opening into more water; it is a fold in the seafloor fabric itself. The titanium hull held solid, not a single microstrain exceedance. We logged the entire descent in <span class="ref-link" data-ref="DIVE-904">[DIVE-904]</span>."</p>
      `
    },
    {
      id: 'ANOMALY-012',
      type: 'anomaly',
      typeLabel: 'ANOMALY DETECTION',
      title: 'ANOMALY-012: Quantum Coherence in Abyssal Pelagic Strata',
      date: '2026-06-18',
      depth: '11,800 m',
      author: 'Consortium Sub-Bathic Physics Team',
      tags: ['quantum', 'coherence', 'strata'],
      content: `
        <p><strong>FINDINGS:</strong> Data recorded during the active hold phase of <span class="ref-link" data-ref="DIVE-904">[DIVE-904]</span> indicates macro-scale quantum entanglement in seawater molecules surrounding the observation viewport.</p>
        <p>This explains the electromagnetic resonance noted in <span class="ref-link" data-ref="ANOMALY-007">[ANOMALY-007]</span> and verifies the predictive models developed following <span class="ref-link" data-ref="INCIDENT-312">[INCIDENT-312]</span>.</p>
      `
    }
  ];

  let currentRecordId = 'DIVE-882';
  let currentCategory = 'all';
  let searchQuery = '';

  const init = () => {
    renderRecordList();
    renderRecordDetail(currentRecordId);
    bindEvents();
  };

  const renderRecordList = () => {
    const listEl = document.getElementById('archive-record-list');
    if (!listEl) return;

    const filtered = RECORDS.filter(r => {
      const matchCat = currentCategory === 'all' || r.type === currentCategory;
      const matchSearch = searchQuery === '' || 
        r.title.toLowerCase().includes(searchQuery) ||
        r.content.toLowerCase().includes(searchQuery) ||
        r.author.toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });

    listEl.innerHTML = filtered.map(r => `
      <div class="record-card ${r.id === currentRecordId ? 'active' : ''}" data-rec-id="${r.id}">
        <div class="rec-badge-row">
          <span class="rec-type-tag type-${r.type}">${r.typeLabel}</span>
          <span class="rec-id-tag">${r.id}</span>
        </div>
        <div class="rec-title">${r.title}</div>
        <div class="rec-snippet">${r.date} • ${r.depth} • ${r.author}</div>
      </div>
    `).join('');
  };

  const renderRecordDetail = (recordId) => {
    const record = RECORDS.find(r => r.id === recordId) || RECORDS[0];
    currentRecordId = record.id;

    // Mark as viewed in localStorage
    Storage.markArchiveViewed(record.id);

    const badgeEl = document.getElementById('rec-type-badge');
    const titleEl = document.getElementById('rec-detail-title');
    const metaEl = document.getElementById('rec-detail-meta');
    const bodyEl = document.getElementById('rec-detail-body');

    if (badgeEl) {
      badgeEl.textContent = record.typeLabel;
      badgeEl.className = `detail-badge type-${record.type}`;
    }
    if (titleEl) titleEl.textContent = record.title;
    if (metaEl) {
      metaEl.innerHTML = `<span>DATE: ${record.date}</span> • <span>DEPTH: ${record.depth}</span> • <span>AUTHOR: ${record.author}</span>`;
    }
    if (bodyEl) {
      bodyEl.innerHTML = record.content;
    }

    // Highlight active card in list
    document.querySelectorAll('.record-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-rec-id') === record.id);
    });

    Storage.logEvent('ARCHIVE', `Opened archive record: ${record.id} - ${record.title}`);
  };

  const bindEvents = () => {
    // Record card click delegation
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.record-card');
      if (card) {
        const id = card.getAttribute('data-rec-id');
        if (id) {
          renderRecordDetail(id);
          SoundEngine.playSolenoidClick();
        }
      }

      // Clickable Relational [REF-XXX] Links
      const refLink = e.target.closest('.ref-link');
      if (refLink) {
        const targetRef = refLink.getAttribute('data-ref');
        if (targetRef) {
          renderRecordDetail(targetRef);
          SoundEngine.playSolenoidClick();
        }
      }
    });

    // Category Filter Buttons
    document.querySelectorAll('.btn-cat-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-cat-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-cat') || 'all';
        renderRecordList();
        SoundEngine.playSolenoidClick();
      });
    });

    // Search Input
    const searchInput = document.getElementById('archive-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderRecordList();
      });
    }
  };

  return {
    init,
    renderRecordDetail
  };
})();

window.Archive = Archive;
