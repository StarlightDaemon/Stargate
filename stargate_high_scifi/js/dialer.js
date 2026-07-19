// The dialing state machine. Meridian does not look addresses up — it solves
// them. COLD SOLVE relaxes a fresh wormhole metric (nine invariant
// convergences, 15–20 s). LATTICE RECALL replays a solution already imprinted
// in the Artifact's lattice: one memory sweep, then the invariants lock in
// rapid playback — fast dialing with a reason, not a sped-up film.

import { GLYPHS, ERIDU } from './glyphs.js';
import { findBySignature } from './destinations.js';

function sleep(ms, signal) {
  return new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    if (signal) {
      if (signal.aborted) { clearTimeout(t); rej(new DOMException('aborted', 'AbortError')); return; }
      signal.addEventListener('abort', () => {
        clearTimeout(t);
        rej(new DOMException('aborted', 'AbortError'));
      }, { once: true });
    }
  });
}

export class Dialer extends EventTarget {
  constructor({ ring, portal, audio, telemetry, cache }) {
    super();
    this.ring = ring;
    this.portal = portal;
    this.audio = audio;
    this.tel = telemetry;
    this.cache = cache;
    this.phase = 'idle'; // idle | solve | recall | open | collapse
    this.dest = null;
    this.abortCtl = null;
  }

  emitState() {
    this.dispatchEvent(new CustomEvent('state', { detail: { phase: this.phase, dest: this.dest } }));
  }

  setPhase(phase) { this.phase = phase; this.emitState(); }

  say(text, cls = '') {
    this.dispatchEvent(new CustomEvent('phasetext', { detail: { text, cls } }));
  }

  glyphName(i) { return GLYPHS[i].name.toUpperCase(); }

  async dial(dest) {
    if (this.phase !== 'idle') return;
    if (dest.refuse) return this.refusalSequence(dest);
    const recall = this.cache.has(dest.id);
    this.dest = dest;
    this.abortCtl = new AbortController();
    const signal = this.abortCtl.signal;
    try {
      if (recall) await this.latticeRecall(dest, signal);
      else await this.coldSolve(dest, signal);
      await this.ignition(dest, signal, recall);
    } catch (e) {
      if (e.name === 'AbortError') this.handleAbort();
      else throw e;
    }
  }

  async coldSolve(dest, signal) {
    this.setPhase('solve');
    this.ring.setSolving(true);
    this.audio.setHum(0.5);
    this.tel.log(`COLD SOLVE initiated — target ${dest.name} (${dest.distanceLy} ly)`, 'ice');
    this.tel.log('relaxation pass begun; searching solution space');
    this.say('COLD SOLVE — RELAXATION PASS 1/9');

    let residual = 3.2;
    this.tel.setResidual(residual);

    const sig = [...dest.signature, ERIDU];
    for (let i = 0; i < 9; i++) {
      const dur = 950 + Math.random() * 650;
      const delta = (60 + Math.random() * 170) * (Math.random() > 0.5 ? 1 : -1);
      this.ring.seek(i % 3, delta, dur);
      this.say(`COLD SOLVE — RELAXATION PASS ${i + 1}/9 — SEEKING ${this.glyphName(sig[i])}`);
      // residual decays stepwise while the band seeks
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        await sleep(dur / steps, signal);
        residual *= 0.62 + Math.random() * 0.18;
        this.tel.setResidual(residual);
      }
      await sleep(220, signal);
      this.ring.lockAnchor(i, sig[i]);
      this.audio.chime(i);
      this.portal.setStrain(((i + 1) / 9) * 0.85);
      this.tel.log(`invariant ${i + 1}/9 converged — ${this.glyphName(sig[i])}`, 'ice');
      await sleep(160, signal);
    }

    this.say('BOUNDARY CHECK — VERIFYING TRAVERSABILITY');
    this.tel.log('boundary conditions verified; throat is traversable', 'ok');
    await sleep(900, signal);
    this.tel.setResidual(residual * 0.01);
  }

  async latticeRecall(dest, signal) {
    this.setPhase('recall');
    this.ring.setSolving(true);
    this.audio.setHum(0.5);
    this.tel.log(`LATTICE RECALL — imprint found for ${dest.name}`, 'recall');
    this.say('LATTICE RECALL — MEMORY SWEEP', 'recall');
    this.audio.sweep();
    this.ring.sweepAll(1100);
    await sleep(1150, signal);

    this.say('LATTICE RECALL — STREAMING CACHED SOLUTION', 'recall');
    this.tel.setResidual(1.1e-5);
    const sig = [...dest.signature, ERIDU];
    for (let i = 0; i < 9; i++) {
      this.ring.lockAnchor(i, sig[i], true);
      this.audio.chime(i, true);
      this.portal.setStrain(((i + 1) / 9) * 0.85);
      await sleep(150, signal);
    }
    this.tel.log('cached solution streamed — nine invariants in 1.4 s', 'recall');
    await sleep(250, signal);
  }

  async ignition(dest, signal, recalled) {
    this.say('IGNITION — NULL BLOOM', recalled ? 'recall' : '');
    this.audio.ignite();
    this.portal.setStrain(0);
    this.portal.ignite(dest.palette);
    await sleep(850, signal);

    this.ring.setSolving(false);
    this.ring.setOpen(true);
    this.audio.setHum(1);
    this.setPhase('open');
    this.say(`APERTURE OPEN — ${dest.name} · ${dest.epithet.toUpperCase()}`, 'open');
    this.tel.setResidual(3.1e-6);
    if (!this.cache.has(dest.id)) {
      this.cache.add(dest.id);
      this.tel.log('geodesic imprinted in lattice — LATTICE RECALL now available for this route', 'ok');
      this.dispatchEvent(new Event('cachechange'));
    }
    this.tel.log(`aperture open — ${dest.name}. hazard note: ${dest.hazard}`);
  }

  /** unknown manual signature: the metric has no solution */
  async divergeSequence(sig8) {
    if (this.phase !== 'idle') return;
    this.dest = null;
    this.abortCtl = new AbortController();
    const signal = this.abortCtl.signal;
    const sig = [...sig8, ERIDU];
    try {
      this.setPhase('solve');
      this.ring.setSolving(true);
      this.audio.setHum(0.5);
      this.tel.log('COLD SOLVE initiated — uncatalogued signature', 'ice');
      let residual = 3.2;
      for (let i = 0; i < 3; i++) {
        const dur = 900 + Math.random() * 400;
        this.ring.seek(i % 3, (80 + Math.random() * 140) * (i % 2 ? -1 : 1), dur);
        this.say(`COLD SOLVE — RELAXATION PASS ${i + 1}/9 — SEEKING ${this.glyphName(sig[i])}`);
        await sleep(dur + 180, signal);
        this.ring.lockAnchor(i, sig[i]);
        this.audio.chime(i);
        residual *= 0.7;
        this.tel.setResidual(residual);
        await sleep(140, signal);
      }
      // then the residual turns around and climbs
      this.say('WARNING — RESIDUAL DIVERGING', 'danger');
      for (let s = 0; s < 5; s++) {
        residual *= 4.2;
        this.tel.setResidual(residual);
        await sleep(170, signal);
      }
      this.audio.diverge();
      this.ring.wobble(1300);
      this.portal.setStrain(0);
      this.say('NO SOLUTION — METRIC DIVERGES', 'danger');
      this.tel.log('NO SOLUTION: signature does not describe a reachable manifold', 'warn');
      this.dispatchEvent(new Event('diverged'));
      await sleep(1500, signal);
    } catch (e) {
      if (e.name !== 'AbortError') throw e;
    } finally {
      this.cleanupToIdle();
      this.tel.log('solution space released; Artifact returns to drift');
    }
  }

  /** Aperture Prime: Meridian simply declines */
  async refusalSequence(dest) {
    this.abortCtl = new AbortController();
    const signal = this.abortCtl.signal;
    try {
      this.setPhase('solve');
      this.ring.setSolving(true);
      this.tel.log(`COLD SOLVE initiated — target ${dest.name}`, 'ice');
      const sig = [...dest.signature, ERIDU];
      for (let i = 0; i < 2; i++) {
        this.ring.seek(i, 90 * (i ? -1 : 1), 900);
        this.say(`COLD SOLVE — RELAXATION PASS ${i + 1}/9`);
        await sleep(1050, signal);
        this.ring.lockAnchor(i, sig[i]);
        this.audio.chime(i);
      }
      await sleep(700, signal);
      this.audio.refuse();
      this.say('SOLUTION REFUSED BY ARTIFACT', 'danger');
      this.tel.log('SOLUTION REFUSED — Meridian declines this route. refusal count: 215', 'warn');
      this.tel.log('the refusal is noted in the station log. again.', 'warn');
      await sleep(1600, signal);
    } catch (e) {
      if (e.name !== 'AbortError') throw e;
    } finally {
      this.cleanupToIdle();
    }
  }

  abort() {
    if (this.phase === 'solve' || this.phase === 'recall') this.abortCtl?.abort();
  }

  handleAbort() {
    this.tel.log('SOLVE ABORTED — partial solution released', 'warn');
    this.portal.collapse(); // no-op when nothing ever ignited
    this.cleanupToIdle();
  }

  cleanupToIdle() {
    this.ring.setSolving(false);
    this.ring.resetAnchors();
    this.portal.setStrain(0);
    this.audio.setHum(0);
    this.tel.setResidual(null);
    this.dest = null;
    this.setPhase('idle');
    this.say('ARTIFACT DORMANT — AMBIENT DRIFT 0.03 rad/s');
  }

  async close() {
    if (this.phase !== 'open') return;
    this.setPhase('collapse');
    this.say('APERTURE COLLAPSING');
    this.audio.collapse();
    this.portal.collapse();
    this.ring.setOpen(false);
    this.tel.log('aperture collapsed; throat released cleanly');
    await sleep(750);
    this.ring.resetAnchors();
    this.cleanupToIdle();
  }
}
