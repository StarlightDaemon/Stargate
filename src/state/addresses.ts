/**
 * Fictional in-universe gate addresses. Every destination, designation, and
 * description here is invented for this project — no real people, places, or
 * contacts, and nothing is transmitted anywhere. Addresses are seven glyph
 * indices (0–38); index 0 is the point of origin and always dials last.
 */

export interface GateAddress {
  designation: string;
  name: string;
  glyphs: readonly number[]; // 6 destination coordinates + origin (0)
  note: string;
}

export const ADDRESS_BOOK: readonly GateAddress[] = [
  {
    designation: 'PK4-881',
    name: 'Meridian Relay',
    glyphs: [27, 7, 15, 32, 12, 30, 0],
    note: 'Uninhabited waystation. Clear horizon, stable lock.',
  },
  {
    designation: 'PX9-260',
    name: 'Cinder Vale',
    glyphs: [9, 26, 34, 6, 14, 31, 0],
    note: 'Volcanic basin. Expect thermal shimmer on approach.',
  },
  {
    designation: 'PB3-115',
    name: 'Halcyon Deep',
    glyphs: [21, 3, 38, 11, 29, 17, 0],
    note: 'Ocean platform gate. Iris drill site.',
  },
  {
    designation: 'PR7-542',
    name: 'Vitrine Steppe',
    glyphs: [5, 33, 19, 24, 8, 36, 0],
    note: 'Glassed plains. Long-range survey anchor.',
  },
  {
    designation: 'PL2-909',
    name: 'Aster Hollow',
    glyphs: [13, 28, 2, 35, 22, 10, 0],
    note: 'Subterranean gate room. Low ambient light.',
  },
  {
    designation: 'PN6-773',
    name: 'Corvid Reach',
    glyphs: [16, 4, 25, 37, 1, 20, 0],
    note: 'High-altitude terrace. Strong crosswinds at horizon.',
  },
];

/** Deterministic attract-mode address cycle. */
export function attractAddressAt(index: number): GateAddress {
  return ADDRESS_BOOK[index % ADDRESS_BOOK.length];
}
