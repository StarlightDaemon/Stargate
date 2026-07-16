import type { GateAddress } from './addresses';

export type ChevronState = 'inactive' | 'active' | 'locked' | 'energized';

export interface GateContext {
  /** Glyph indices queued for dialing (0–38). */
  addressBuffer: number[];
  /** Length of the sequence being dialed (frozen at dial time). */
  sequenceLength: number;
  /** Which symbol of the sequence is currently encoding. */
  currentSymbolIndex: number;
  /** Glyph the ring is currently rotating toward, if any. */
  targetGlyph: number | null;
  /** Visual state of each of the 9 chevrons. */
  chevrons: ChevronState[];
  /** True while the gate is running its self-directed attract loop. */
  attract: boolean;
  /** Cursor into the address book for the attract cycle. */
  attractIndex: number;
  /** Address-book entry for the active/last connection, if recognized. */
  activeAddress: GateAddress | null;
}

export type GateEvent =
  | { type: 'INPUT_SYMBOL'; glyph: number }
  | { type: 'REMOVE_SYMBOL' }
  | { type: 'CLEAR_ADDRESS' }
  | { type: 'LOAD_ADDRESS'; glyphs: readonly number[] }
  | { type: 'DIAL' }
  | { type: 'ROTATION_COMPLETE' }
  | { type: 'ABORT' }
  | { type: 'DISCONNECT' }
  | { type: 'TOGGLE_IRIS' }
  | { type: 'WAKE' };
