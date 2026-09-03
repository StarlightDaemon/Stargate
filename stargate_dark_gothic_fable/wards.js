/* WIDDERSHINS — the thirteen wards of the Corvane fence, the roads beyond
 * it, and the five remembered hands (quick-dial keys).
 *
 * Every name and road here is invented for this piece. A ward is a sigil cut
 * into one finial plate of the fence-ring; an address is six wards brought
 * in turn to the keeper's lantern, always turning widdershins. */

/* Sigils are polylines on a 0–4 grid, rendered as stroked paths. */
const WARDS = [
  { id: 'Th', name: 'Thorn',  sigil: [[[2,0],[2,4]],[[2,1],[3.2,2],[2,3]]] },
  { id: 'As', name: 'Ash',    sigil: [[[2,0],[2,4]],[[0,3],[2,1],[4,3]]] },
  { id: 'Wk', name: 'Wick',   sigil: [[[2,4],[2,1.2]],[[1,1.2],[2,0],[3,1.2]]] },
  { id: 'Ho', name: 'Hollow', sigil: [[[1,1],[3,1],[3,3],[1,3],[1,1]]] },
  { id: 'Ow', name: 'Owl',    sigil: [[[0,0],[2,2],[4,0]],[[2,2],[2,4]]] },
  { id: 'Ne', name: 'Nettle', sigil: [[[2,0],[2,4]],[[0,1],[4,3]],[[4,1],[0,3]]] },
  { id: 'Ky', name: 'Key',    sigil: [[[2,0],[3,1],[2,2],[1,1],[2,0]],[[2,2],[2,4]],[[2,3.2],[3.2,3.2]]] },
  { id: 'He', name: 'Hearth', sigil: [[[0,4],[4,4]],[[1,4],[1,2],[3,2],[3,4]],[[2,2],[2,0]]] },
  { id: 'Ic', name: 'Ice',    sigil: [[[0,2],[4,2]],[[2,0],[2,4]],[[1,1],[3,3]],[[3,1],[1,3]]] },
  { id: 'Yw', name: 'Yew',    sigil: [[[2,4],[2,2]],[[0,0],[2,2],[4,0]]] },
  { id: 'Sg', name: 'Sigh',   sigil: [[[0,1],[1,0],[3,2],[4,1]],[[0,3],[1,2],[3,4],[4,3]]] },
  { id: 'Mo', name: 'Moth',   sigil: [[[2,0],[2,4]],[[0,1],[2,2],[0,3]],[[4,1],[2,2],[4,3]]] },
  { id: 'Du', name: 'Dusk',   sigil: [[[0,2],[2,0],[4,2]],[[0,2],[4,2]],[[1,3],[3,3]]] }
];

const ADDRESS_LENGTH = 6;

/* Roads the gate is known to open on. Key = ward ids in catching order. */
const ROADS = {
  'Th,Yw,Wk,Ow,He,Mo': { name: 'CANDLEMERE',          note: 'a lake that holds every candle ever drowned in it' },
  'As,Ne,Ic,Du,Ky,Ho': { name: 'THE DROWNED ORCHARD', note: 'apple trees standing in black water, still bearing' },
  'Sg,Du,Ho,Ic,Th,Mo': { name: "NOBODY'S PARISH",     note: 'no one has come back to say what is there', dark: true },
  'Ow,Ky,As,Yw,Wk,Ne': { name: 'HOLLOWMAS LANE',      note: 'a lane of unlit houses that are all, somehow, this house' },
  'Mo,He,Sg,Th,Du,As': { name: "THE WIDOW'S STAIR",   note: 'a stair that climbs the outside of a tower with no door' },
  'Th,As,Wk,Ho,Ow,Ne': { name: 'THE WAKE AT CORVANE', note: 'the long room, the night of the last keeper' },
  'Ic,Mo,Yw,Sg,Ky,He': { name: 'THE MOTH CHAPEL',     note: 'a chapel whose windows are wings' }
};

/* The remembered hands: turnings the iron has done before and can do again
 * without a living hand finding each ward. It still brings every finial to
 * the lantern in order — it cannot skip a ward — but it does not hesitate. */
const HANDS = [
  { id: '1', road: 'CANDLEMERE',          hand: "the keeper's hand, 1887",  wards: ['Th','Yw','Wk','Ow','He','Mo'] },
  { id: '2', road: 'THE DROWNED ORCHARD', hand: "the gardener's hand, 1891", wards: ['As','Ne','Ic','Du','Ky','Ho'] },
  { id: '3', road: "NOBODY'S PARISH",     hand: 'an unknown hand, undated',  wards: ['Sg','Du','Ho','Ic','Th','Mo'] },
  { id: '4', road: 'HOLLOWMAS LANE',      hand: "the child's hand, 1899",    wards: ['Ow','Ky','As','Yw','Wk','Ne'] },
  { id: '5', road: "THE WIDOW'S STAIR",   hand: "the widow's hand, 1902",    wards: ['Mo','He','Sg','Th','Du','As'] }
];

/* Build an SVG path "d" for a sigil in a box of the given size. */
function sigilPath(sigil, size, pad) {
  pad = pad === undefined ? size * 0.18 : pad;
  const k = (size - pad * 2) / 4;
  return sigil.map((seg) => seg.map((p, i) => (i ? 'L' : 'M') + (pad + p[0] * k).toFixed(1) + ' ' + (pad + p[1] * k).toFixed(1)).join(' ')).join(' ');
}

const WARD_BY_ID = Object.fromEntries(WARDS.map((w) => [w.id, w]));

window.WIDDERSHINS_DATA = { WARDS, WARD_BY_ID, ADDRESS_LENGTH, ROADS, HANDS, sigilPath };
