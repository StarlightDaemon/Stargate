/**
 * TX-77 'AURA' Fast-Neutron Annular Resonator
 * Searchable & Filterable Configuration Archive
 */

class ConfigurationArchive {
  constructor() {
    this.records = [
      { id: 'CRIT-A01', tier: 'verified', tierLabel: 'TIER 1: VERIFIED', channels: 'α, γ, ε, ζ, θ, κ', power: '420.0 MWth', margin: '+2,200 pcm', operator: 'Dr. E. Lindholm', date: '2026-08-14' },
      { id: 'CRIT-B04', tier: 'verified', tierLabel: 'TIER 1: VERIFIED', channels: 'β, δ, ε, η, ι, κ', power: '385.0 MWth', margin: '+1,950 pcm', operator: 'Eng. K. Saarinen', date: '2026-08-12' },
      { id: 'CRIT-C09', tier: 'verified', tierLabel: 'TIER 1: VERIFIED', channels: 'α, β, ζ, η, θ, ι', power: '410.0 MWth', margin: '+2,100 pcm', operator: 'Dr. M. Rask', date: '2026-08-09' },
      { id: 'CRIT-D02', tier: 'verified', tierLabel: 'TIER 1: VERIFIED', channels: 'α, γ, δ, ζ, η, κ', power: '418.5 MWth', margin: '+2,180 pcm', operator: 'Dr. E. Lindholm', date: '2026-07-28' },
      { id: 'CRIT-E11', tier: 'verified', tierLabel: 'TIER 1: VERIFIED', channels: 'β, γ, ε, ζ, θ, ι', power: '405.2 MWth', margin: '+2,050 pcm', operator: 'Eng. H. Virta', date: '2026-07-15' },
      { id: 'CRIT-F06', tier: 'verified', tierLabel: 'TIER 1: VERIFIED', channels: 'α, δ, ε, η, θ, κ', power: '422.1 MWth', margin: '+2,250 pcm', operator: 'Dr. M. Rask', date: '2026-06-30' },
      
      { id: 'EXP-X12', tier: 'experimental', tierLabel: 'TIER 2: EXPERIMENTAL', channels: 'γ, δ, ζ, θ, ι, κ', power: '445.0 MWth', margin: '+1,450 pcm', operator: 'Dr. T. Kallio', date: '2026-08-18' },
      { id: 'EXP-Y07', tier: 'experimental', tierLabel: 'TIER 2: EXPERIMENTAL', channels: 'α, β, δ, ε, ζ, η', power: '395.0 MWth', margin: '+1,600 pcm', operator: 'Dr. A. Valo', date: '2026-08-05' },
      { id: 'EXP-Z99', tier: 'experimental', tierLabel: 'TIER 2: EXPERIMENTAL', channels: 'β, γ, ε, η, θ, κ', power: '430.0 MWth', margin: '+1,550 pcm', operator: 'Dr. T. Kallio', date: '2026-07-22' },
      { id: 'EXP-W44', tier: 'experimental', tierLabel: 'TIER 2: EXPERIMENTAL', channels: 'α, γ, ε, η, ι, κ', power: '438.2 MWth', margin: '+1,480 pcm', operator: 'Eng. K. Saarinen', date: '2026-07-10' },
      { id: 'EXP-V19', tier: 'experimental', tierLabel: 'TIER 2: EXPERIMENTAL', channels: 'β, δ, ζ, η, θ, ι', power: '412.0 MWth', margin: '+1,680 pcm', operator: 'Dr. A. Valo', date: '2026-06-18' },
      { id: 'EXP-U03', tier: 'experimental', tierLabel: 'TIER 2: EXPERIMENTAL', channels: 'α, β, γ, δ, ε, ζ', power: '380.5 MWth', margin: '+1,820 pcm', operator: 'Dr. T. Kallio', date: '2026-06-02' }
    ];

    this.tableBody = document.getElementById('archive-table-body');
    this.searchInput = document.getElementById('archive-search-input');
    this.tierFilter = document.getElementById('archive-tier-filter');

    this.setupListeners();
    this.renderTable();
  }

  setupListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.renderTable());
    }
    if (this.tierFilter) {
      this.tierFilter.addEventListener('change', () => this.renderTable());
    }
  }

  renderTable() {
    if (!this.tableBody) return;
    const query = (this.searchInput && this.searchInput.value ? this.searchInput.value.toLowerCase().trim() : '');
    const tier = (this.tierFilter && this.tierFilter.value ? this.tierFilter.value : 'all');

    const filtered = this.records.filter(r => {
      const matchTier = (tier === 'all' || r.tier === tier);
      const matchQuery = !query || 
        r.id.toLowerCase().includes(query) ||
        r.operator.toLowerCase().includes(query) ||
        r.channels.toLowerCase().includes(query) ||
        r.power.toLowerCase().includes(query);
      return matchTier && matchQuery;
    });

    this.tableBody.innerHTML = '';
    if (filtered.length === 0) {
      this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:12px; color:var(--text-dim);">No matching configurations found</td></tr>`;
      return;
    }

    filtered.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700; color:var(--accent-cyan);">${r.id}</td>
        <td><span style="font-size:9px; color:${r.tier === 'verified' ? 'var(--accent-green)' : 'var(--accent-amber)'}">${r.tier.toUpperCase()}</span></td>
        <td style="letter-spacing:1px;">${r.channels}</td>
        <td>${r.power}</td>
        <td>${r.margin}</td>
        <td>
          <button class="load-config-btn" data-config-id="${r.id}">LOAD</button>
        </td>
      `;

      const loadBtn = tr.querySelector('.load-config-btn');
      loadBtn.addEventListener('click', () => {
        const presetDropdown = document.getElementById('preset-dropdown');
        if (presetDropdown) {
          // Check if preset exists in dropdown
          for (let opt of presetDropdown.options) {
            if (opt.value === r.id) {
              presetDropdown.value = r.id;
              break;
            }
          }
        }
        if (window.hmiApp) {
          window.hmiApp.telemetry.addLog('CONFIG LOADED', `Loaded configuration ${r.id} (${r.channels}) from archive.`, 'info');
        }
      });

      this.tableBody.appendChild(tr);
    });
  }
}

window.ConfigurationArchive = ConfigurationArchive;
