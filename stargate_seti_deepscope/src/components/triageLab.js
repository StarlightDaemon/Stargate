// Signal Classification & RFI Triage Lab Component

import { TRIAGE_CANDIDATES } from '../data/carriers.js';
import { soundEngine } from '../audio/soundEngine.js';

export class TriageLab {
  constructor() {
    this.candidates = JSON.parse(JSON.stringify(TRIAGE_CANDIDATES));
    this.selectedCandidate = null;
    this.stats = {
      classified: 0,
      rfi: 0,
      verified: 0
    };

    this.initElements();
    this.bindEvents();
    this.renderCandidateList();
  }

  initElements() {
    this.modal = document.getElementById('modal-triage');
    this.listEl = document.getElementById('triage-candidate-list');
    this.detailEl = document.getElementById('triage-detail-card');
    this.miniStreamList = document.getElementById('candidate-stream-list');
    
    this.statClassified = document.getElementById('stat-classified');
    this.statRfi = document.getElementById('stat-rfi');
    this.statVerified = document.getElementById('stat-verified');
  }

  bindEvents() {
    // Open Triggers
    const openBtn = document.getElementById('btn-open-triage');
    const quickOpenBtn = document.getElementById('btn-quick-triage-open');

    if (openBtn) openBtn.addEventListener('click', () => this.openModal());
    if (quickOpenBtn) quickOpenBtn.addEventListener('click', () => this.openModal());

    // Close Triggers
    document.querySelectorAll('[data-close="modal-triage"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
  }

  openModal() {
    soundEngine.playUiClick();
    this.modal.classList.add('is-open');
    this.modal.setAttribute('aria-hidden', 'false');
    if (!this.selectedCandidate && this.candidates.length > 0) {
      this.selectCandidate(this.candidates[0].id);
    }
  }

  closeModal() {
    soundEngine.playUiClick();
    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
  }

  renderCandidateList() {
    // 1. Render Modal List
    this.listEl.innerHTML = '';
    this.candidates.forEach(cand => {
      const card = document.createElement('div');
      card.className = `triage-card ${this.selectedCandidate?.id === cand.id ? 'selected' : ''}`;
      card.dataset.id = cand.id;

      let badgeClass = 'badge-unknown';
      if (cand.status === 'REJECTED_RFI') badgeClass = 'badge-rfi';
      if (cand.status === 'CONFIRMED_TECHNO') badgeClass = 'badge-verified';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-family: var(--font-mono); color: var(--text-bright);">${cand.id}: ${cand.name}</strong>
          <span class="cand-badge ${badgeClass}">${cand.status.replace('_', ' ')}</span>
        </div>
        <div style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">
          FREQ: ${cand.freq} &bull; SNR: ${cand.snr} &bull; DRIFT: ${cand.drift}
        </div>
      `;

      card.addEventListener('click', () => this.selectCandidate(cand.id));
      this.listEl.appendChild(card);
    });

    // 2. Render Mini Stream on Right Pillar
    if (this.miniStreamList) {
      this.miniStreamList.innerHTML = '';
      this.candidates.forEach(cand => {
        const item = document.createElement('div');
        item.className = 'candidate-stream-item';
        
        let badgeClass = 'badge-unknown';
        let badgeTxt = 'PENDING';
        if (cand.status === 'REJECTED_RFI') { badgeClass = 'badge-rfi'; badgeTxt = 'RFI'; }
        if (cand.status === 'CONFIRMED_TECHNO') { badgeClass = 'badge-verified'; badgeTxt = 'VERIFIED'; }

        item.innerHTML = `
          <div class="cand-left">
            <span class="cand-id">${cand.id} &bull; ${cand.name.substring(0, 24)}</span>
            <span class="cand-freq">${cand.freq} &bull; ${cand.drift}</span>
          </div>
          <span class="cand-badge ${badgeClass}">${badgeTxt}</span>
        `;

        item.addEventListener('click', () => {
          this.openModal();
          this.selectCandidate(cand.id);
        });

        this.miniStreamList.appendChild(item);
      });
    }
  }

  selectCandidate(id) {
    soundEngine.playUiClick();
    this.selectedCandidate = this.candidates.find(c => c.id === id);
    this.renderCandidateList();
    this.renderDetailView();
  }

  renderDetailView() {
    const cand = this.selectedCandidate;
    if (!cand) {
      this.detailEl.innerHTML = `<div class="empty-detail-state">SELECT A CANDIDATE TO INSPECT</div>`;
      return;
    }

    const isPending = cand.status === 'PENDING_REVIEW';

    this.detailEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--bg-panel-border); padding-bottom: 8px;">
        <div>
          <h3 style="font-family: var(--font-display); font-size: 16px; color: var(--text-bright);">${cand.name} (${cand.id})</h3>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--accent);">TARGET CARRIER: ${cand.freq} &bull; BANDWIDTH: ${cand.bandwidth}</span>
        </div>
        <span class="cand-badge ${cand.status === 'REJECTED_RFI' ? 'badge-rfi' : cand.status === 'CONFIRMED_TECHNO' ? 'badge-verified' : 'badge-unknown'}" style="font-size: 11px; padding: 4px 8px;">
          ${cand.status.replace('_', ' ')}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-family: var(--font-mono); font-size: 11px;">
        <div style="background: rgba(4,7,13,0.7); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="color: var(--text-muted); font-size: 9px;">DOPPLER DRIFT RATE (df/dt)</div>
          <div style="font-size: 13px; font-weight: 700; color: var(--text-bright); margin-top: 4px;">${cand.drift}</div>
        </div>
        <div style="background: rgba(4,7,13,0.7); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="color: var(--text-muted); font-size: 9px;">INTEGRATED SNR</div>
          <div style="font-size: 13px; font-weight: 700; color: var(--accent); margin-top: 4px;">${cand.snr}</div>
        </div>
        <div style="background: rgba(4,7,13,0.7); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="color: var(--text-muted); font-size: 9px;">DISPERSION MEASURE (DM)</div>
          <div style="font-size: 13px; font-weight: 700; color: var(--text-bright); margin-top: 4px;">${cand.dispersion}</div>
        </div>
        <div style="background: rgba(4,7,13,0.7); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="color: var(--text-muted); font-size: 9px;">10-DISH PARALLAX DELAY</div>
          <div style="font-size: 13px; font-weight: 700; color: ${cand.classification === 'RFI' ? 'var(--color-rose)' : 'var(--color-emerald)'}; margin-top: 4px;">${cand.parallaxDelay}</div>
        </div>
      </div>

      <div style="background: rgba(15, 25, 43, 0.7); border: 1px solid rgba(0, 240, 255, 0.15); border-radius: 4px; padding: 12px; font-family: var(--font-mono); font-size: 11px;">
        <div style="color: var(--accent); font-weight: 700; margin-bottom: 4px;">INTERFEROMETRIC ANALYSIS REPORT:</div>
        <p style="color: var(--text-main); line-height: 1.4;">${cand.notes}</p>
      </div>

      <div class="triage-action-row">
        <button class="btn-triage-reject" id="btn-reject-rfi" ${!isPending ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          <span>✕ DISMISS AS TERRESTRIAL RFI</span>
        </button>
        <button class="btn-triage-verify" id="btn-verify-techno" ${!isPending ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          <span>✓ CONFIRM AS TECHNOSIGNATURE</span>
        </button>
      </div>
    `;

    // Bind Reject / Verify actions
    const rejectBtn = document.getElementById('btn-reject-rfi');
    const verifyBtn = document.getElementById('btn-verify-techno');

    if (rejectBtn && isPending) {
      rejectBtn.addEventListener('click', () => this.handleRejectRfi(cand.id));
    }
    if (verifyBtn && isPending) {
      verifyBtn.addEventListener('click', () => this.handleVerifyTechno(cand.id));
    }
  }

  // Real Rejection Path for Terrestrial RFI
  handleRejectRfi(id) {
    const cand = this.candidates.find(c => c.id === id);
    if (!cand) return;

    soundEngine.playRfiRejection();
    cand.status = 'REJECTED_RFI';
    this.stats.classified++;
    this.stats.rfi++;
    this.updateStatsDisplay();
    this.renderCandidateList();
    this.renderDetailView();
  }

  handleVerifyTechno(id) {
    const cand = this.candidates.find(c => c.id === id);
    if (!cand) return;

    soundEngine.playLockChime(4);
    cand.status = 'CONFIRMED_TECHNO';
    this.stats.classified++;
    this.stats.verified++;
    this.updateStatsDisplay();
    this.renderCandidateList();
    this.renderDetailView();
  }

  updateStatsDisplay() {
    if (this.statClassified) this.statClassified.textContent = this.stats.classified;
    if (this.statRfi) this.statRfi.textContent = this.stats.rfi;
    if (this.statVerified) this.statVerified.textContent = this.stats.verified;
  }
}
