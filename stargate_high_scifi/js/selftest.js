// Engineering diagnostic routine. NEVER runs for a normal visitor: it is
// triggered only by an explicit ?diag URL parameter (or by calling
// window.__meridian.diag() from the devtools console). Idle visitors get
// ambient drift only — no automatic dialing, ever.

import { byId } from './destinations.js';

export function maybeRunDiagnostics({ dialer, telemetry, cache }) {
  const params = new URLSearchParams(location.search);
  const run = async () => {
    document.getElementById('diagBadge').hidden = false;
    telemetry.log('DIAGNOSTIC ROUTINE ENGAGED — engineering use only', 'recall');
    const target = byId('halcyon');
    cache.purge();
    dialer.dispatchEvent(new Event('cachechange'));
    telemetry.log('diag: cache purged; exercising COLD SOLVE', 'recall');
    await pause(800);
    await dialer.dial(target);           // cold solve → open
    await pause(2500);
    await dialer.close();
    telemetry.log('diag: cold solve cycle complete; exercising LATTICE RECALL', 'recall');
    await pause(1200);
    await dialer.dial(target);           // now cached → recall
    await pause(2500);
    await dialer.close();
    telemetry.log('DIAGNOSTIC ROUTINE COMPLETE — both dial modes exercised', 'ok');
    document.getElementById('diagBadge').hidden = true;
  };

  // exposed for manual testing from the console
  window.__meridian = window.__meridian || {};
  window.__meridian.diag = run;

  if (params.has('diag')) setTimeout(run, 1200);
}

const pause = (ms) => new Promise(r => setTimeout(r, ms));
