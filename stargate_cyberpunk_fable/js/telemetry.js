/* NIGHTGLASS — ambient telemetry of the near Lattice.
   The values are simulated but genuinely coupled: coherence follows the
   carrier and the current turbulence, throughput follows coherence AND
   carrier, and drift runs inverse to coherence. Nothing here measures
   anything real. */
'use strict';

const Tele = (() => {
  const HIST = 90;                       /* samples kept per series */
  const history = { carrier: [], coherence: [], throughput: [], drift: [], turbulence: [] };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* Sustained-link caps: how much the loom will move in each state. */
  const CAPS = { idle: 14, weaving: 34, autodial: 40, pending: 58, buildup: 120, breakthrough: 210, active: 240, cooldown: 30 };
  const BONUS = { idle: 0, weaving: 4, autodial: 6, pending: 10, buildup: 14, breakthrough: 22, active: 20, cooldown: 2 };

  function sample(state, wardEngaged, tideEvent) {
    const t = performance.now() / 1000;
    /* Carrier: the near sky's raw brightness — slow swells plus flicker. */
    const carrier = clamp(
      56 + 17 * Math.sin(t / 13.7) + 6 * Math.sin(t / 3.9 + 1.3) + (Math.random() * 6 - 3),
      8, 98);
    /* Turbulence: 0..1, slow weather plus optional drift-tide surge. */
    let turb = 0.22 + 0.16 * Math.sin(t / 29.3 + 0.6) + 0.05 * Math.sin(t / 7.1);
    if (tideEvent) turb += 0.3;
    turb = clamp(turb, 0, 1);
    /* Coherence leans on the carrier, is eroded by turbulence, and is
       steadied a little when the ward grips the loom. */
    const coherence = clamp(
      carrier * 0.82 + (BONUS[state] || 0) - turb * 38 + (wardEngaged ? 9 : 0) + (Math.random() * 4 - 2),
      4, 99);
    /* Throughput is the product of how bright and how steady, scaled by
       what the current state allows. */
    const throughput = +(((coherence / 100) * (carrier / 100)) * (CAPS[state] || 14)).toFixed(1);
    /* Drift is coherence's shadow: what the weave loses to the tide. */
    const drift = clamp((100 - coherence) * 0.72 + turb * 24 + (Math.random() * 5 - 2.5), 1, 99);

    const s = {
      carrier: Math.round(carrier),
      coherence: Math.round(coherence),
      throughput,
      drift: Math.round(drift),
      turbulence: +turb.toFixed(2)
    };
    for (const k of Object.keys(history)) {
      history[k].push(s[k]);
      if (history[k].length > HIST) history[k].shift();
    }
    return s;
  }

  return { sample, history, CAPS };
})();
