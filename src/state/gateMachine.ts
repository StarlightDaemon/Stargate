/**
 * Gate state machine.
 *
 * Lifecycle shape follows the design-07 phase model: IDLE → DIALING with a
 * per-symbol aligning/settling/lockVerify loop → CONNECTING with
 * ignition/(kawoosh|shielded)/stabilization/steady → DISCONNECTING → COOLDOWN.
 *
 * Two things the archive never finished are first-class here:
 *  - The iris is a real parallel region (open/closing/closed/opening), and the
 *    isIrisOpen / isIrisClosed guards decide whether ignition produces a
 *    Kawoosh Burst or a suppressed, shielded ignition.
 *  - Attract mode is a reachable state: after ATTRACT_DELAY_MS of idle with an
 *    empty buffer, the gate dials real address-book entries in a deterministic
 *    cycle until any user interaction sends WAKE.
 *
 * Ring rotation is UI-driven (requestAnimationFrame controller sends
 * ROTATION_COMPLETE), with an alignment-timeout watchdog as a fallback.
 */

import { setup, assign, stateIn } from 'xstate';
import type { ChevronState, GateContext, GateEvent } from './types';
import { ADDRESS_BOOK, attractAddressAt } from './addresses';
import {
  ABORT_COOLDOWN_MS,
  ADDRESS_LENGTH,
  ALIGNMENT_SETTLE_TIME_MS,
  ALIGNMENT_TIMEOUT_MS,
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
  TOTAL_CHEVRONS,
  TOTAL_GLYPHS,
} from './constants';

const inactiveChevrons = (): ChevronState[] => Array(TOTAL_CHEVRONS).fill('inactive');

/**
 * Symbol → chevron mapping: symbols 1–6 light chevrons 1–6; the final symbol
 * of a 7-glyph address locks the master chevron (index 8, gate top).
 */
export function chevronIndexFor(symbolIndex: number, sequenceLength: number): number {
  return symbolIndex === sequenceLength - 1 ? TOTAL_CHEVRONS - 1 : symbolIndex;
}

const initialContext: GateContext = {
  addressBuffer: [],
  sequenceLength: ADDRESS_LENGTH,
  currentSymbolIndex: 0,
  targetGlyph: null,
  chevrons: inactiveChevrons(),
  attract: false,
  attractIndex: 0,
  activeAddress: null,
};

export const gateMachine = setup({
  types: {
    context: {} as GateContext,
    events: {} as GateEvent,
  },
  guards: {
    isValidAddress: ({ context }) => context.addressBuffer.length === ADDRESS_LENGTH,
    isBufferEmpty: ({ context }) => context.addressBuffer.length === 0,
    isFinalSymbol: ({ context }) => context.currentSymbolIndex === context.sequenceLength - 1,
    isAttract: ({ context }) => context.attract,
    // The design-07 archive defined these two but never wired them into a
    // transition. Here they gate the ignition branch for real.
    isIrisOpen: stateIn('#gate.iris.open'),
    isIrisClosed: stateIn('#gate.iris.closed'),
  },
  actions: {
    appendSymbol: assign({
      addressBuffer: ({ context, event }) => {
        if (event.type !== 'INPUT_SYMBOL') return context.addressBuffer;
        const { glyph } = event;
        if (
          !Number.isInteger(glyph) ||
          glyph < 0 ||
          glyph >= TOTAL_GLYPHS ||
          context.addressBuffer.length >= ADDRESS_LENGTH ||
          context.addressBuffer.includes(glyph)
        ) {
          return context.addressBuffer;
        }
        return [...context.addressBuffer, glyph];
      },
    }),
    removeSymbol: assign({
      addressBuffer: ({ context }) => context.addressBuffer.slice(0, -1),
    }),
    clearAddress: assign({ addressBuffer: [] }),
    loadAddress: assign({
      addressBuffer: ({ context, event }) =>
        event.type === 'LOAD_ADDRESS' ? [...event.glyphs] : context.addressBuffer,
    }),
    initializeDialing: assign(({ context }) => ({
      sequenceLength: context.addressBuffer.length,
      currentSymbolIndex: 0,
      targetGlyph: null,
      chevrons: inactiveChevrons(),
      activeAddress:
        ADDRESS_BOOK.find(
          (a) =>
            a.glyphs.length === context.addressBuffer.length &&
            a.glyphs.every((g, i) => g === context.addressBuffer[i]),
        ) ?? null,
    })),
    loadAttractAddress: assign(({ context }) => {
      const address = attractAddressAt(context.attractIndex);
      return {
        attract: true,
        attractIndex: context.attractIndex + 1,
        addressBuffer: [...address.glyphs],
      };
    }),
    clearAttract: assign({ attract: false }),
    beginSymbolAlignment: assign(({ context }) => {
      const chevrons = [...context.chevrons];
      chevrons[chevronIndexFor(context.currentSymbolIndex, context.sequenceLength)] = 'active';
      return {
        targetGlyph: context.addressBuffer[context.currentSymbolIndex],
        chevrons,
      };
    }),
    lockChevron: assign(({ context }) => {
      const chevrons = [...context.chevrons];
      chevrons[chevronIndexFor(context.currentSymbolIndex, context.sequenceLength)] = 'locked';
      return { chevrons };
    }),
    energizeChevron: assign(({ context }) => {
      const chevrons = [...context.chevrons];
      chevrons[chevronIndexFor(context.currentSymbolIndex, context.sequenceLength)] = 'energized';
      return { chevrons };
    }),
    advanceSymbol: assign({
      currentSymbolIndex: ({ context }) => context.currentSymbolIndex + 1,
    }),
    releaseAll: assign({
      chevrons: inactiveChevrons(),
      targetGlyph: null,
      currentSymbolIndex: 0,
    }),
    clearBuffer: assign({ addressBuffer: [] }),
    clearActiveAddress: assign({ activeAddress: null }),
  },
  delays: {
    steadyWindow: ({ context }) => (context.attract ? ATTRACT_STEADY_MS : STEADY_MAX_DURATION_MS),
    cooldownWindow: ({ context }) => (context.attract ? ATTRACT_COOLDOWN_MS : COOLDOWN_MS),
  },
}).createMachine({
  id: 'gate',
  type: 'parallel',
  context: initialContext,
  states: {
    gate: {
      initial: 'idle',
      on: {
        // Any user interaction ends the attract loop wherever it is.
        WAKE: {
          guard: 'isAttract',
          target: '.aborting',
          actions: 'clearAttract',
        },
      },
      states: {
        idle: {
          on: {
            // External self-transitions so each interaction re-arms the
            // attract timer.
            INPUT_SYMBOL: { target: 'idle', actions: 'appendSymbol' },
            REMOVE_SYMBOL: { target: 'idle', actions: 'removeSymbol' },
            CLEAR_ADDRESS: { target: 'idle', actions: 'clearAddress' },
            LOAD_ADDRESS: { target: 'idle', actions: 'loadAddress' },
            DIAL: {
              guard: 'isValidAddress',
              target: 'dialing',
            },
          },
          after: {
            [ATTRACT_DELAY_MS]: [
              { guard: 'isBufferEmpty', target: 'attract' },
              { target: 'idle', reenter: true }, // partial address parked on the DHD; re-arm
            ],
          },
        },

        attract: {
          entry: 'loadAttractAddress',
          always: { target: 'dialing' },
        },

        dialing: {
          entry: 'initializeDialing',
          initial: 'aligning',
          on: {
            ABORT: { target: 'aborting', actions: 'clearAttract' },
          },
          states: {
            aligning: {
              entry: 'beginSymbolAlignment',
              on: {
                ROTATION_COMPLETE: { target: 'settling' },
              },
              after: {
                // Watchdog: proceed even if the UI controller never reports.
                [ALIGNMENT_TIMEOUT_MS]: { target: 'settling' },
              },
            },
            settling: {
              after: {
                [ALIGNMENT_SETTLE_TIME_MS]: { target: 'lockVerify' },
              },
            },
            lockVerify: {
              entry: 'lockChevron',
              after: {
                [CHEVRON_LOCK_DURATION_MS]: {
                  target: 'symbolComplete',
                  actions: 'energizeChevron',
                },
              },
            },
            symbolComplete: {
              always: [
                { guard: 'isFinalSymbol', target: '#gate.gate.connecting' },
                { target: 'aligning', actions: 'advanceSymbol' },
              ],
            },
          },
        },

        connecting: {
          initial: 'ignition',
          on: {
            ABORT: { target: 'disconnecting', actions: 'clearAttract' },
            DISCONNECT: { target: 'disconnecting' },
          },
          states: {
            ignition: {
              after: {
                [IGNITION_DURATION_MS]: [
                  // The wired iris guards: an open iris lets the unstable
                  // vortex erupt; a closed (or transiting) iris suppresses it.
                  { guard: 'isIrisOpen', target: 'kawoosh' },
                  { guard: 'isIrisClosed', target: 'shieldedIgnition' },
                  { target: 'shieldedIgnition' },
                ],
              },
            },
            kawoosh: {
              // The named "Kawoosh Burst" — vortex eruption before settling
              // into a stable horizon.
              after: {
                [KAWOOSH_DURATION_MS]: { target: 'stabilization' },
              },
            },
            shieldedIgnition: {
              after: {
                [SHIELDED_IGNITION_DURATION_MS]: { target: 'stabilization' },
              },
            },
            stabilization: {
              after: {
                [STABILIZATION_DURATION_MS]: { target: 'steady' },
              },
            },
            steady: {
              after: {
                steadyWindow: { target: '#gate.gate.disconnecting' },
              },
            },
          },
        },

        disconnecting: {
          after: {
            [DISCONNECT_DECAY_MS]: { target: 'cooldown' },
          },
        },

        aborting: {
          entry: ['releaseAll', 'clearBuffer', 'clearActiveAddress'],
          after: {
            [ABORT_COOLDOWN_MS]: { target: 'idle' },
          },
        },

        cooldown: {
          entry: ['releaseAll', 'clearBuffer'],
          after: {
            cooldownWindow: [
              { guard: 'isAttract', target: 'attract' },
              { target: 'idle', actions: 'clearActiveAddress' },
            ],
          },
        },
      },
    },

    iris: {
      initial: 'open',
      states: {
        open: {
          on: { TOGGLE_IRIS: { target: 'closing' } },
        },
        closing: {
          on: { TOGGLE_IRIS: { target: 'opening' } },
          after: { [IRIS_TRANSIT_MS]: { target: 'closed' } },
        },
        closed: {
          on: { TOGGLE_IRIS: { target: 'opening' } },
        },
        opening: {
          on: { TOGGLE_IRIS: { target: 'closing' } },
          after: { [IRIS_TRANSIT_MS]: { target: 'open' } },
        },
      },
    },
  },
});

export type GateMachine = typeof gateMachine;
