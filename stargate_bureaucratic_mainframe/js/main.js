/**
 * D.S.T.C.L. TERMINAL OS/88-V - MASTER APPLICATION ORCHESTRATOR
 * Coordinates Control Cluster 1 & 2 actions, dial routines, fast-dial expedited mode,
 * sound triggers, thermal docket printing, operator manual modal, and theme toggling.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Subsystems
  window.ringVisualizer = new ConduitRingVisualizer();
  window.formController = new Form44AController();
  window.queueController = new MunicipalQueueController();

  // Primary Action Controls (Cluster 2)
  const btnDialManual = document.getElementById('btn-dial-manual');
  const btnDialFast = document.getElementById('btn-dial-fast');
  const btnAbortDial = document.getElementById('btn-abort-dial');
  const btnPrintReceipt = document.getElementById('btn-print-receipt');

  // Modals & Triggers
  const btnOperatorRef = document.getElementById('btn-operator-ref');
  const modalOperatorRef = document.getElementById('modal-operator-ref');
  const btnCloseModalRef = document.getElementById('btn-close-modal-ref');
  const btnDismissModalRef = document.getElementById('btn-dismiss-modal-ref');

  const modalReceipt = document.getElementById('modal-docket-receipt');
  const btnCloseReceipt = document.getElementById('btn-close-receipt');
  const btnCloseModalReceipt = document.getElementById('btn-close-modal-receipt');
  const btnPrintSlip = document.getElementById('btn-print-slip');
  const receiptFieldsContent = document.getElementById('receipt-fields-content');
  const receiptBarcodeNum = document.getElementById('receipt-barcode-num');

  // Theme & Audio Controls
  const btnThemeAmber = document.getElementById('btn-theme-amber');
  const btnThemeGreen = document.getElementById('btn-theme-green');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const audioIcon = document.getElementById('audio-icon');

  let activeDialTimeoutIds = [];
  let isDialingInProgress = false;
  let currentActiveDocket = null;

  // =========================================================================
  // CLUSTER 2 ACTION 1: MANUAL DIAL ROUTINE (FORM 44-A COMMIT)
  // =========================================================================
  btnDialManual.addEventListener('click', () => {
    window.terminalAudio.playKeyClick();
    if (isDialingInProgress || window.ringVisualizer.state === 'OPEN') return;

    const validation = window.formController.validateForm();
    if (!validation.valid) {
      window.terminalAudio.playBuzzer();
      window.terminalLogger.logError(validation.error);
      window.terminalLogger.setBannerStatus(`ERROR: ${validation.error}`, 'error');
      return;
    }

    startDialingSequence(validation, false);
  });

  // =========================================================================
  // CLUSTER 2 ACTION 2: FAST-DIAL EXPEDITED BYPASS (PRIORITY STAMP EX-1)
  // =========================================================================
  btnDialFast.addEventListener('click', () => {
    if (isDialingInProgress || window.ringVisualizer.state === 'OPEN') return;

    window.terminalAudio.playFastDialStamp();
    window.terminalLogger.logWarn('>>> PRIORITY STAMP EX-1 ENGAGED: DIPLOMATIC / EXECUTIVE BYPASS <<<');
    window.terminalLogger.logInfo('Bypassing standard regulatory transit queue under Municipal Code § 88-EX.');

    // If form is incomplete, automatically load standard Priority Route
    let validation = window.formController.validateForm();
    if (!validation.valid) {
      const priorityRoute = window.REGISTERED_DESTINATIONS[2] || window.REGISTERED_DESTINATIONS[0];
      window.formController.loadDestination(priorityRoute);
      validation = window.formController.validateForm();
    }

    startDialingSequence(validation, true);
  });

  // Core Dialing Execution Function
  function startDialingSequence(formData, isFastDial = false) {
    isDialingInProgress = true;
    clearPendingTimeouts();

    btnDialManual.disabled = true;
    btnDialFast.disabled = true;
    btnAbortDial.disabled = false;

    window.ringVisualizer.resetRing('INITIALIZING BUFFER COMMUTATOR...');
    window.ringVisualizer.state = 'DIALING';

    const coords = formData.coords;
    const destName = formData.destinationName;
    const coordsStr = formData.coordsString;
    const cargoClass = formData.cargoClass;

    currentActiveDocket = window.queueController.addDocket(destName, coords, cargoClass, isFastDial);
    window.terminalLogger.setConduitIndicator(isFastDial ? 'EXPEDITING [EX-1]' : 'DIALING / COMMITTING', 'status-locked');
    window.terminalLogger.setBannerStatus(`LOCKING CONDUIT BUFFER [${destName}]...`, 'active');

    const stepInterval = isFastDial ? 200 : 650;

    coords.forEach((sectorId, index) => {
      const tid = setTimeout(() => {
        if (!isDialingInProgress) return;

        // Step ring & lock chevron
        window.ringVisualizer.rotateToSector(sectorId);
        window.ringVisualizer.lockChevron(index, sectorId);
        window.terminalAudio.playChevronLock(index);

        const sec = window.SECTOR_DEFINITIONS.find(s => s.id === sectorId);
        const secCode = sec ? sec.code : '0x' + sectorId.toString(16).toUpperCase();
        const secName = sec ? sec.name : `SECTOR-${sectorId}`;
        const slotLabels = ['ORIGIN', 'AXIS', 'NODE', 'FLUX', 'AZIMUTH', 'PARITY', 'LOCK'];

        window.terminalLogger.logLock(`[STAGE ${index + 1}/7 LOCKED] Chevron ${index + 1} Engaged -> Sector ${secCode} (${secName}) [${slotLabels[index]}]`);

        // Check if final lock reached
        if (index === 6) {
          const finalTid = setTimeout(() => {
            if (!isDialingInProgress) return;

            window.terminalAudio.playApertureOpen();
            window.ringVisualizer.openAperture(destName, coordsStr, 45);
            window.queueController.markDocketStatus(currentActiveDocket.id, 'cleared', 'CONDUIT OPEN');
            window.terminalLogger.setConduitIndicator('CONDUIT ACTIVE', 'status-active');
            window.terminalLogger.setBannerStatus(`CONDUIT ESTABLISHED // TRANSIT EN ROUTE [${destName}]`, 'active');
            window.terminalLogger.logSuccess(`>>> SUB-AETHERIC CONDUIT OPEN: ${destName} <<<`);
            window.terminalLogger.logInfo(`Harmonic resonance locked at 14.285 GHz. Permitted transit window: 45 SECONDS.`);

            isDialingInProgress = false;
            btnDialManual.disabled = false;
            btnDialFast.disabled = false;
          }, isFastDial ? 300 : 700);
          activeDialTimeoutIds.push(finalTid);
        }
      }, (index + 1) * stepInterval);

      activeDialTimeoutIds.push(tid);
    });
  }

  // =========================================================================
  // CLUSTER 2 ACTION 3: ABORT / EMERGENCY DISENGAGE
  // =========================================================================
  btnAbortDial.addEventListener('click', () => {
    window.terminalAudio.playKeyClick();
    abortDialSequence('OPERATOR OVERRIDE // CONDUIT PURGED');
  });

  function abortDialSequence(reason) {
    isDialingInProgress = false;
    clearPendingTimeouts();

    window.terminalAudio.stopVortexRumble();
    window.terminalAudio.playBuzzer();
    window.ringVisualizer.resetRing('STANDBY / BUFFER PURGED');

    btnDialManual.disabled = false;
    btnDialFast.disabled = false;
    btnAbortDial.disabled = true;

    if (currentActiveDocket) {
      window.queueController.markDocketStatus(currentActiveDocket.id, 'delayed', 'ABORTED / PURGED');
    }

    window.terminalLogger.setConduitIndicator('STANDBY / PURGED', 'status-idle');
    window.terminalLogger.setBannerStatus(reason, 'error');
    window.terminalLogger.logWarn(`EMERGENCY SHUTDOWN: ${reason}`);
    window.terminalLogger.logInfo('Conduit buffer capacitors vented to municipal heat sink.');
  }

  function clearPendingTimeouts() {
    activeDialTimeoutIds.forEach(id => clearTimeout(id));
    activeDialTimeoutIds = [];
  }

  // =========================================================================
  // CLUSTER 2 ACTION 4: PRINT MUNICIPAL TRANSIT DOCKET RECEIPT
  // =========================================================================
  btnPrintReceipt.addEventListener('click', () => {
    window.terminalAudio.playThermalPrint();
    populateReceiptSlip();
    openModal(modalReceipt);
    window.terminalLogger.logInfo('Generated official municipal transit docket slip.');
  });

  function populateReceiptSlip() {
    if (!receiptFieldsContent) return;

    const validation = window.formController.validateForm();
    const destName = validation.valid ? validation.destinationName : (window.formController.selectedDestination ? window.formController.selectedDestination.name : 'UNREGISTERED SECTOR');
    const coordsStr = window.formController.currentSlots.map(s => s ? '0x' + s.toString(16).toUpperCase().padStart(2, '0') : '--').join('-');
    const cargo = window.formController.cargoSelect ? window.formController.cargoSelect.value : 'CLASS_B_PASSENGER';
    const now = new Date();
    const timeStr = now.toUTCString();
    const docketNum = currentActiveDocket ? currentActiveDocket.id : 'DKT-' + Math.floor(1000 + Math.random() * 9000);

    receiptFieldsContent.innerHTML = `
      <div class="rcpt-row"><span class="rcpt-lbl">DOCKET ID:</span><span class="rcpt-val">${docketNum}</span></div>
      <div class="rcpt-row"><span class="rcpt-lbl">TIMESTAMP:</span><span class="rcpt-val">${timeStr}</span></div>
      <div class="rcpt-row"><span class="rcpt-lbl">ORIGIN:</span><span class="rcpt-val">CONDUIT-04E (TERRA SEC 0x01)</span></div>
      <div class="rcpt-row"><span class="rcpt-lbl">DESTINATION:</span><span class="rcpt-val">${destName}</span></div>
      <div class="rcpt-row"><span class="rcpt-lbl">COORDINATES:</span><span class="rcpt-val">[${coordsStr}]</span></div>
      <div class="rcpt-row"><span class="rcpt-lbl">CARGO CLASS:</span><span class="rcpt-val">${cargo}</span></div>
      <div class="rcpt-row"><span class="rcpt-lbl">PARITY CHECK:</span><span class="rcpt-val">0x4A2 (VERIFIED)</span></div>
      <div class="rcpt-row"><span class="rcpt-lbl">TARIFF ASSESSED:</span><span class="rcpt-val">4.50 CREDITS (PAID)</span></div>
    `;

    if (receiptBarcodeNum) {
      receiptBarcodeNum.textContent = `*${docketNum}-4419-ST*`;
    }
  }

  if (btnPrintSlip) {
    btnPrintSlip.addEventListener('click', () => {
      window.terminalAudio.playKeyClick();
      window.print();
    });
  }

  // =========================================================================
  // OPERATOR REFERENCE MODAL (CIRCULAR MEMORANDUM 88-A)
  // =========================================================================
  btnOperatorRef.addEventListener('click', () => {
    window.terminalAudio.playKeyClick();
    openModal(modalOperatorRef);
    window.terminalLogger.logInfo('Operator manual accessed: Circular Memorandum 88-Alpha.');
  });

  if (btnCloseModalRef) btnCloseModalRef.addEventListener('click', () => closeModal(modalOperatorRef));
  if (btnDismissModalRef) btnDismissModalRef.addEventListener('click', () => closeModal(modalOperatorRef));

  if (btnCloseReceipt) btnCloseReceipt.addEventListener('click', () => closeModal(modalReceipt));
  if (btnCloseModalReceipt) btnCloseModalReceipt.addEventListener('click', () => closeModal(modalReceipt));

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modal) {
    if (!modal) return;
    window.terminalAudio.playKeyClick();
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  // Close modals on Escape key or backdrop click
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(modalOperatorRef);
      closeModal(modalReceipt);
    }
  });

  [modalOperatorRef, modalReceipt].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    }
  });

  // =========================================================================
  // THEME SWITCHING (AMBER / GREEN MONOCHROME) & AUDIO TOGGLE
  // =========================================================================
  btnThemeAmber.addEventListener('click', () => {
    window.terminalAudio.playKeyClick();
    document.body.className = 'crt-amber theme-amber';
    btnThemeAmber.classList.add('active');
    btnThemeGreen.classList.remove('active');
    window.terminalLogger.logInfo('Terminal phosphor palette switched to AMBER MONOCHROME (590nm).');
  });

  btnThemeGreen.addEventListener('click', () => {
    window.terminalAudio.playKeyClick();
    document.body.className = 'crt-green theme-green';
    btnThemeGreen.classList.add('active');
    btnThemeAmber.classList.remove('active');
    window.terminalLogger.logInfo('Terminal phosphor palette switched to GREEN MONOCHROME (530nm P1).');
  });

  btnAudioToggle.addEventListener('click', () => {
    const isAudioOn = window.terminalAudio.toggleAudio();
    if (audioIcon) {
      audioIcon.textContent = isAudioOn ? '🔊 SOUND ON' : '🔇 SOUND OFF';
    }
    window.terminalLogger.logInfo(`Synthesized CRT & solenoid audio ${isAudioOn ? 'ENABLED' : 'MUTED'}.`);
  });

  // Preload default route on startup for instant visitor exploration
  if (window.REGISTERED_DESTINATIONS && window.REGISTERED_DESTINATIONS.length > 0) {
    window.formController.loadDestination(window.REGISTERED_DESTINATIONS[0]);
  }
});
