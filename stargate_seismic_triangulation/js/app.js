/**
 * app.js - Main Application Coordinator & Responsive Viewport Scaler
 * Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Viewport Scaling Manager
  initViewportScaler();

  // 2. Initialize Seismological Visual Canvas Engine
  const visualEngine = new window.SeismicVisualEngine(
    'seismic-triangulation-canvas',
    'waterfall-canvas'
  );

  // 3. Initialize Control System & State Machine
  const controlSystem = new window.SeismicControlSystem();
  controlSystem.init(visualEngine);
  window.controlSystem = controlSystem;

  // 4. Initialize Operator Reference Modal
  initOperatorModal();

  // 5. Initialize Real-Time UTC Seismology Clock
  initUtcClock();

  // 6. Global Audio Context Unlock on first interaction
  const unlockAudio = () => {
    window.seismicAudio.ensureContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
});

/**
 * Robust JS Viewport Scale Manager (1080p Native -> 4K Clean Scaling)
 * Fixes the CSS scale unitless pitfall by computing pure number ratio in JS.
 */
function initViewportScaler() {
  const updateScale = () => {
    const targetWidth = 1920;
    const targetHeight = 1080;
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    const scaleX = currentWidth / targetWidth;
    const scaleY = currentHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY);

    // Plain unitless number assigned to CSS custom property
    document.documentElement.style.setProperty('--viewport-scale', scale.toString());

    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.style.transform = `scale(${scale})`;
    }

    window.__computedScale = scale;
    window.__viewportWidth = currentWidth;
    window.__viewportHeight = currentHeight;
  };

  window.addEventListener('resize', updateScale);
  updateScale();
}

/**
 * Operator Reference Modal Handler
 */
function initOperatorModal() {
  const openBtn = document.getElementById('operator-help-btn');
  const closeBtn = document.getElementById('modal-close-btn');
  const modalBackdrop = document.getElementById('operator-modal-backdrop');

  if (!openBtn || !closeBtn || !modalBackdrop) return;

  const openModal = () => {
    window.seismicAudio.ensureContext();
    modalBackdrop.classList.add('open');
  };

  const closeModal = () => {
    modalBackdrop.classList.remove('open');
  };

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });
}

/**
 * UTC Real-Time Seismological Clock
 */
function initUtcClock() {
  const clockEl = document.getElementById('telemetry-clock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    const iso = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    clockEl.textContent = iso;
  };

  setInterval(updateClock, 1000);
  updateClock();
}
