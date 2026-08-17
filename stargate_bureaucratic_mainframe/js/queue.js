/**
 * D.S.T.C.L. TERMINAL OS/88-V - MUNICIPAL QUEUE CONTROLLER
 * Manages the procedural list of pending and prior transit dockets,
 * queue inspections, and pre-loading dockets into the main console.
 */

class MunicipalQueueController {
  constructor() {
    this.queueListEl = document.getElementById('docket-queue-list');
    this.queueBadge = document.getElementById('queue-badge');
    this.dockets = window.INITIAL_QUEUE_DOCKETS ? [...window.INITIAL_QUEUE_DOCKETS] : [];
    this.currentActiveDocketId = null;

    this.init();
  }

  init() {
    this.renderQueue();
  }

  renderQueue() {
    if (!this.queueListEl) return;
    this.queueListEl.innerHTML = '';

    this.dockets.forEach(docket => {
      const itemEl = document.createElement('div');
      itemEl.className = 'queue-item';
      itemEl.id = `queue-item-${docket.id}`;
      if (docket.id === this.currentActiveDocketId) {
        itemEl.classList.add('current-active');
      }

      itemEl.innerHTML = `
        <span class="q-id">${docket.id}</span>
        <span class="q-dest" title="${docket.dest}">${docket.dest}</span>
        <span class="q-status ${docket.status}">${docket.statusLabel}</span>
      `;

      itemEl.addEventListener('click', () => {
        this.selectDocket(docket);
      });

      this.queueListEl.appendChild(itemEl);
    });

    if (this.queueBadge) {
      const activeCount = this.dockets.filter(d => d.status === 'active' || d.status === 'pending').length;
      this.queueBadge.textContent = `${activeCount} ACTIVE`;
    }
  }

  selectDocket(docket) {
    window.terminalAudio.playKeyClick();
    this.currentActiveDocketId = docket.id;
    this.renderQueue();

    window.terminalLogger.logInfo(`Queue inspection: Loaded ${docket.id} [${docket.dest}] into Form 44-A buffer.`);

    if (window.formController) {
      window.formController.currentSlots = [...docket.coords];
      window.formController.activeSlotIndex = 0;
      window.formController.selectedDestination = {
        id: docket.id,
        name: docket.dest,
        code: docket.id,
        coords: [...docket.coords],
        tariffClass: docket.cargo,
        fee: '5.00 CREDITS'
      };

      if (window.formController.cargoSelect) {
        window.formController.cargoSelect.value = docket.cargo;
      }
      window.formController.updateSlotsDisplay();
    }

    if (window.ringVisualizer && docket.coords.length > 0) {
      window.ringVisualizer.rotateToSector(docket.coords[0]);
    }
  }

  addDocket(destName, coords, cargoClass, isPriority = false) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const docketId = `DKT-${randomNum}${isPriority ? '-EX' : ''}`;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newDocket = {
      id: docketId,
      dest: destName,
      coords: [...coords],
      cargo: cargoClass,
      status: 'active',
      statusLabel: isPriority ? 'EXPEDITED [EX-1]' : 'ACTIVE [FILING]',
      timestamp: timeStr
    };

    // Prepend to list
    this.dockets.unshift(newDocket);
    this.currentActiveDocketId = docketId;
    this.renderQueue();

    return newDocket;
  }

  markDocketStatus(docketId, status, statusLabel) {
    const doc = this.dockets.find(d => d.id === docketId);
    if (doc) {
      doc.status = status;
      doc.statusLabel = statusLabel;
      this.renderQueue();
    }
  }
}

window.MunicipalQueueController = MunicipalQueueController;
