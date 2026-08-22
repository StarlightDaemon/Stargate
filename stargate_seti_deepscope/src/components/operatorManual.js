// Operator Reference Manual Modal Component

import { soundEngine } from '../audio/soundEngine.js';

export class OperatorManual {
  constructor() {
    this.modal = document.getElementById('modal-manual');
    this.bindEvents();
  }

  bindEvents() {
    const openBtn = document.getElementById('btn-open-manual');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.modal.classList.add('is-open');
        this.modal.setAttribute('aria-hidden', 'false');
      });
    }

    document.querySelectorAll('[data-close="modal-manual"]').forEach(btn => {
      btn.addEventListener('click', () => {
        soundEngine.playUiClick();
        this.modal.classList.remove('is-open');
        this.modal.setAttribute('aria-hidden', 'true');
      });
    });
  }
}
