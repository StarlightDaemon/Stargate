import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createActor, type Actor } from 'xstate';
import { gateMachine } from './gateMachine';
import { ADDRESS_BOOK } from './addresses';
import {
  ABORT_COOLDOWN_MS,
  ADDRESS_LENGTH,
  ALIGNMENT_SETTLE_TIME_MS,
  ATTRACT_COOLDOWN_MS,
  ATTRACT_DELAY_MS,
  ATTRACT_STEADY_MS,
  CHEVRON_LOCK_DURATION_MS,
  COOLDOWN_MS,
  DISCONNECT_DECAY_MS,
  IGNITION_DURATION_MS,
  IRIS_TRANSIT_MS,
  KAWOOSH_DURATION_MS,
  SHIELDED_IGNITION_DURATION_MS,
  STABILIZATION_DURATION_MS,
  STEADY_MAX_DURATION_MS,
  TOTAL_GLYPHS,
} from './constants';

type GateActor = Actor<typeof gateMachine>;

// Seven distinct, valid, in-range glyphs that don't match any ADDRESS_BOOK entry.
const UNKNOWN_ADDRESS = [1, 2, 3, 4, 5, 6, 8];

function makeActor(): GateActor {
  return createActor(gateMachine).start();
}

function fillAddress(actor: GateActor, glyphs: readonly number[]) {
  glyphs.forEach((glyph) => actor.send({ type: 'INPUT_SYMBOL', glyph }));
}

/** Drives the current symbol through aligning -> settling -> lockVerify -> symbolComplete. */
function runSymbolCycle(actor: GateActor) {
  actor.send({ type: 'ROTATION_COMPLETE' });
  vi.advanceTimersByTime(ALIGNMENT_SETTLE_TIME_MS + CHEVRON_LOCK_DURATION_MS);
}

/** Fills the buffer, dials, and walks every symbol cycle to reach connecting.ignition. */
function dialFullAddress(actor: GateActor, glyphs: readonly number[]) {
  fillAddress(actor, glyphs);
  actor.send({ type: 'DIAL' });
  glyphs.forEach(() => runSymbolCycle(actor));
}

/** From connecting.ignition, walks ignition -> (kawoosh | shieldedIgnition) -> stabilization -> steady. */
function driveIgnitionToSteady(actor: GateActor) {
  vi.advanceTimersByTime(IGNITION_DURATION_MS);
  const snap = actor.getSnapshot();
  if (snap.matches({ gate: { connecting: 'kawoosh' } })) {
    vi.advanceTimersByTime(KAWOOSH_DURATION_MS);
  } else {
    vi.advanceTimersByTime(SHIELDED_IGNITION_DURATION_MS);
  }
  vi.advanceTimersByTime(STABILIZATION_DURATION_MS);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('initial state', () => {
  it('starts idle with the iris open and an empty buffer', () => {
    const actor = makeActor();
    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: 'idle', iris: 'open' })).toBe(true);
    expect(snap.context.addressBuffer).toEqual([]);
  });
});

describe('address buffer editing', () => {
  it('appends glyphs in order', () => {
    const actor = makeActor();
    fillAddress(actor, [1, 2, 3]);
    expect(actor.getSnapshot().context.addressBuffer).toEqual([1, 2, 3]);
  });

  it('rejects duplicate glyphs', () => {
    const actor = makeActor();
    fillAddress(actor, [1, 1]);
    expect(actor.getSnapshot().context.addressBuffer).toEqual([1]);
  });

  it('rejects out-of-range and non-integer glyphs', () => {
    const actor = makeActor();
    fillAddress(actor, [-1, TOTAL_GLYPHS, 1.5]);
    expect(actor.getSnapshot().context.addressBuffer).toEqual([]);
  });

  it('rejects input beyond ADDRESS_LENGTH', () => {
    const actor = makeActor();
    fillAddress(actor, [1, 2, 3, 4, 5, 6, 7, 8]);
    expect(actor.getSnapshot().context.addressBuffer).toHaveLength(ADDRESS_LENGTH);
    expect(actor.getSnapshot().context.addressBuffer).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('REMOVE_SYMBOL pops the last glyph', () => {
    const actor = makeActor();
    fillAddress(actor, [1, 2, 3]);
    actor.send({ type: 'REMOVE_SYMBOL' });
    expect(actor.getSnapshot().context.addressBuffer).toEqual([1, 2]);
  });

  it('CLEAR_ADDRESS empties the buffer', () => {
    const actor = makeActor();
    fillAddress(actor, [1, 2, 3]);
    actor.send({ type: 'CLEAR_ADDRESS' });
    expect(actor.getSnapshot().context.addressBuffer).toEqual([]);
  });

  it('LOAD_ADDRESS loads a book entry', () => {
    const actor = makeActor();
    actor.send({ type: 'LOAD_ADDRESS', glyphs: ADDRESS_BOOK[2].glyphs });
    expect(actor.getSnapshot().context.addressBuffer).toEqual([...ADDRESS_BOOK[2].glyphs]);
  });
});

describe('DIAL guard', () => {
  it('does not transition with a short buffer', () => {
    const actor = makeActor();
    fillAddress(actor, [1, 2, 3]);
    actor.send({ type: 'DIAL' });
    expect(actor.getSnapshot().matches({ gate: 'idle' })).toBe(true);
  });

  it('transitions to dialing with a full 7-glyph address', () => {
    const actor = makeActor();
    fillAddress(actor, UNKNOWN_ADDRESS);
    actor.send({ type: 'DIAL' });
    expect(actor.getSnapshot().matches({ gate: { dialing: 'aligning' } })).toBe(true);
  });

  it('sets activeAddress when the buffer matches a book entry', () => {
    const actor = makeActor();
    fillAddress(actor, ADDRESS_BOOK[0].glyphs);
    actor.send({ type: 'DIAL' });
    expect(actor.getSnapshot().context.activeAddress).toEqual(ADDRESS_BOOK[0]);
  });

  it('leaves activeAddress null for an unrecognized address', () => {
    const actor = makeActor();
    fillAddress(actor, UNKNOWN_ADDRESS);
    actor.send({ type: 'DIAL' });
    expect(actor.getSnapshot().context.activeAddress).toBeNull();
  });
});

describe('per-symbol dialing loop', () => {
  it('begins symbol 1 aligning with chevron 0 active and the first glyph targeted', () => {
    const actor = makeActor();
    fillAddress(actor, UNKNOWN_ADDRESS);
    actor.send({ type: 'DIAL' });
    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: { dialing: 'aligning' } })).toBe(true);
    expect(snap.context.chevrons[0]).toBe('active');
    expect(snap.context.targetGlyph).toBe(UNKNOWN_ADDRESS[0]);
  });

  it('locks then energizes the chevron across settling and lockVerify', () => {
    const actor = makeActor();
    fillAddress(actor, UNKNOWN_ADDRESS);
    actor.send({ type: 'DIAL' });
    actor.send({ type: 'ROTATION_COMPLETE' });
    expect(actor.getSnapshot().matches({ gate: { dialing: 'settling' } })).toBe(true);

    vi.advanceTimersByTime(ALIGNMENT_SETTLE_TIME_MS);
    expect(actor.getSnapshot().matches({ gate: { dialing: 'lockVerify' } })).toBe(true);
    expect(actor.getSnapshot().context.chevrons[0]).toBe('locked');

    vi.advanceTimersByTime(CHEVRON_LOCK_DURATION_MS);
    expect(actor.getSnapshot().context.chevrons[0]).toBe('energized');
  });

  it('re-enters aligning for symbol 2 with chevron 1 active', () => {
    const actor = makeActor();
    fillAddress(actor, UNKNOWN_ADDRESS);
    actor.send({ type: 'DIAL' });
    runSymbolCycle(actor);

    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: { dialing: 'aligning' } })).toBe(true);
    expect(snap.context.currentSymbolIndex).toBe(1);
    expect(snap.context.chevrons[1]).toBe('active');
    expect(snap.context.targetGlyph).toBe(UNKNOWN_ADDRESS[1]);
  });
});

describe('full dial sequence', () => {
  it('reaches connecting.ignition once all 7 symbols lock', () => {
    const actor = makeActor();
    dialFullAddress(actor, UNKNOWN_ADDRESS);
    expect(actor.getSnapshot().matches({ gate: { connecting: 'ignition' } })).toBe(true);
  });

  it('erupts into kawoosh and stabilizes to steady when the iris is open', () => {
    const actor = makeActor();
    dialFullAddress(actor, UNKNOWN_ADDRESS);

    vi.advanceTimersByTime(IGNITION_DURATION_MS);
    expect(actor.getSnapshot().matches({ gate: { connecting: 'kawoosh' } })).toBe(true);

    vi.advanceTimersByTime(KAWOOSH_DURATION_MS);
    expect(actor.getSnapshot().matches({ gate: { connecting: 'stabilization' } })).toBe(true);

    vi.advanceTimersByTime(STABILIZATION_DURATION_MS);
    expect(actor.getSnapshot().matches({ gate: { connecting: 'steady' } })).toBe(true);
  });
});

describe('wired iris guards', () => {
  it('produces a shielded ignition, not kawoosh, when the iris is closed', () => {
    const actor = makeActor();
    actor.send({ type: 'TOGGLE_IRIS' });
    vi.advanceTimersByTime(IRIS_TRANSIT_MS);
    expect(actor.getSnapshot().matches({ iris: 'closed' })).toBe(true);

    dialFullAddress(actor, UNKNOWN_ADDRESS);
    vi.advanceTimersByTime(IGNITION_DURATION_MS);

    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: { connecting: 'shieldedIgnition' } })).toBe(true);
    expect(snap.matches({ gate: { connecting: 'kawoosh' } })).toBe(false);
  });
});

describe('iris region', () => {
  it('TOGGLE_IRIS moves open -> closing -> closed', () => {
    const actor = makeActor();
    actor.send({ type: 'TOGGLE_IRIS' });
    expect(actor.getSnapshot().matches({ iris: 'closing' })).toBe(true);

    vi.advanceTimersByTime(IRIS_TRANSIT_MS);
    expect(actor.getSnapshot().matches({ iris: 'closed' })).toBe(true);
  });

  it('TOGGLE_IRIS mid-closing reverses to opening', () => {
    const actor = makeActor();
    actor.send({ type: 'TOGGLE_IRIS' });
    actor.send({ type: 'TOGGLE_IRIS' });
    expect(actor.getSnapshot().matches({ iris: 'opening' })).toBe(true);
  });

  it('toggles independently while the gate is connected', () => {
    const actor = makeActor();
    dialFullAddress(actor, UNKNOWN_ADDRESS);
    driveIgnitionToSteady(actor);
    expect(actor.getSnapshot().matches({ gate: { connecting: 'steady' } })).toBe(true);

    actor.send({ type: 'TOGGLE_IRIS' });
    expect(actor.getSnapshot().matches({ iris: 'closing' })).toBe(true);
    expect(actor.getSnapshot().matches({ gate: { connecting: 'steady' } })).toBe(true);
  });
});

describe('steady auto-disconnect', () => {
  it('disconnects, cools down, and returns to idle after STEADY_MAX_DURATION_MS', () => {
    const actor = makeActor();
    dialFullAddress(actor, UNKNOWN_ADDRESS);
    driveIgnitionToSteady(actor);

    vi.advanceTimersByTime(STEADY_MAX_DURATION_MS);
    expect(actor.getSnapshot().matches({ gate: 'disconnecting' })).toBe(true);

    vi.advanceTimersByTime(DISCONNECT_DECAY_MS);
    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: 'cooldown' })).toBe(true);
    expect(snap.context.addressBuffer).toEqual([]);
    expect(snap.context.chevrons.every((c) => c === 'inactive')).toBe(true);

    vi.advanceTimersByTime(COOLDOWN_MS);
    expect(actor.getSnapshot().matches({ gate: 'idle' })).toBe(true);
  });
});

describe('attract mode', () => {
  it('starts attract dialing ADDRESS_BOOK[0] after ATTRACT_DELAY_MS of empty idle', () => {
    const actor = makeActor();
    vi.advanceTimersByTime(ATTRACT_DELAY_MS);

    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: { dialing: 'aligning' } })).toBe(true);
    expect(snap.context.attract).toBe(true);
    expect(snap.context.addressBuffer).toEqual([...ADDRESS_BOOK[0].glyphs]);
  });

  it('does not start attract when a partial address is parked on the DHD', () => {
    const actor = makeActor();
    fillAddress(actor, [1, 2]);
    vi.advanceTimersByTime(ATTRACT_DELAY_MS);

    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: 'idle' })).toBe(true);
    expect(snap.context.attract).toBe(false);
  });
});

describe('attract loop cycling', () => {
  it('completes a connection and re-enters dialing with ADDRESS_BOOK[1]', () => {
    const actor = makeActor();
    vi.advanceTimersByTime(ATTRACT_DELAY_MS);
    expect(actor.getSnapshot().context.addressBuffer).toEqual([...ADDRESS_BOOK[0].glyphs]);

    ADDRESS_BOOK[0].glyphs.forEach(() => runSymbolCycle(actor));
    expect(actor.getSnapshot().matches({ gate: { connecting: 'ignition' } })).toBe(true);

    driveIgnitionToSteady(actor);
    vi.advanceTimersByTime(ATTRACT_STEADY_MS);
    expect(actor.getSnapshot().matches({ gate: 'disconnecting' })).toBe(true);

    vi.advanceTimersByTime(DISCONNECT_DECAY_MS);
    expect(actor.getSnapshot().matches({ gate: 'cooldown' })).toBe(true);

    vi.advanceTimersByTime(ATTRACT_COOLDOWN_MS);
    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: { dialing: 'aligning' } })).toBe(true);
    expect(snap.context.addressBuffer).toEqual([...ADDRESS_BOOK[1].glyphs]);
  });
});

describe('WAKE during attract', () => {
  it('aborts attract dialing and returns to idle', () => {
    const actor = makeActor();
    vi.advanceTimersByTime(ATTRACT_DELAY_MS);
    expect(actor.getSnapshot().context.attract).toBe(true);

    actor.send({ type: 'WAKE' });
    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: 'aborting' })).toBe(true);
    expect(snap.context.attract).toBe(false);
    expect(snap.context.addressBuffer).toEqual([]);

    vi.advanceTimersByTime(ABORT_COOLDOWN_MS);
    expect(actor.getSnapshot().matches({ gate: 'idle' })).toBe(true);
  });

  it('aborts attract even mid-connection (connecting.steady)', () => {
    const actor = makeActor();
    vi.advanceTimersByTime(ATTRACT_DELAY_MS);
    ADDRESS_BOOK[0].glyphs.forEach(() => runSymbolCycle(actor));
    driveIgnitionToSteady(actor);
    expect(actor.getSnapshot().matches({ gate: { connecting: 'steady' } })).toBe(true);

    actor.send({ type: 'WAKE' });
    expect(actor.getSnapshot().matches({ gate: 'aborting' })).toBe(true);
    expect(actor.getSnapshot().context.attract).toBe(false);
  });

  it('is a no-op when the gate is not in attract', () => {
    const actor = makeActor();
    actor.send({ type: 'WAKE' });
    expect(actor.getSnapshot().matches({ gate: 'idle' })).toBe(true);
    expect(actor.getSnapshot().context.attract).toBe(false);
  });
});

describe('ABORT during a user dial', () => {
  it('resets chevrons and buffer, then returns to idle after ABORT_COOLDOWN_MS', () => {
    const actor = makeActor();
    fillAddress(actor, UNKNOWN_ADDRESS);
    actor.send({ type: 'DIAL' });
    actor.send({ type: 'ABORT' });

    const snap = actor.getSnapshot();
    expect(snap.matches({ gate: 'aborting' })).toBe(true);
    expect(snap.context.chevrons.every((c) => c === 'inactive')).toBe(true);
    expect(snap.context.addressBuffer).toEqual([]);

    vi.advanceTimersByTime(ABORT_COOLDOWN_MS);
    expect(actor.getSnapshot().matches({ gate: 'idle' })).toBe(true);
  });
});
