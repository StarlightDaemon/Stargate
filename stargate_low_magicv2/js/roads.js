// The Hollowbeck Six — bells, roads, and the words on the board.
// All destinations are fictional. Changes are orders of bells 1–5;
// every change closes on the tenor (bell 6, "Grief").

export const BELLS = [
  { n: 1, name: 'Lark',    freq: 659.26, w: 10 }, // treble
  { n: 2, name: 'Tansy',   freq: 587.33, w: 11 },
  { n: 3, name: 'Dole',    freq: 523.25, w: 12 },
  { n: 4, name: 'Mattock', freq: 493.88, w: 13 },
  { n: 5, name: 'Hobb',    freq: 440.00, w: 14 },
  { n: 6, name: 'Grief',   freq: 329.63, w: 17 }, // tenor
];

export const ROADS = [
  { id: 'marrow-fen',  name: 'Marrow Fen',            change: [1, 3, 5, 2, 4], pinned: true },
  { id: 'under-ash',   name: 'Under-Ash',             change: [2, 1, 4, 3, 5], pinned: true },
  { id: 'cold-hutton', name: 'Cold Hutton',           change: [5, 4, 1, 2, 3], pinned: true },
  { id: 'bleaklow',    name: 'Bleaklow Chapelry',     change: [4, 2, 5, 1, 3], pinned: true },
  { id: 'maundy',      name: "St Maundy i' the Reeds", change: [3, 1, 2, 5, 4], pinned: false },
  { id: 'wrycross',    name: 'Wrycross',              change: [5, 3, 1, 4, 2], pinned: false, struck: true },
];

export const PINNED = ROADS.filter(r => r.pinned);

export function judgeChange(rung) {
  if (rung.length === 5 && rung.every((b, i) => b === i + 1)) return { kind: 'rounds' };
  const hit = ROADS.find(r => r.change.length === rung.length && r.change.every((b, i) => b === rung[i]));
  if (!hit) return { kind: 'false' };
  return { kind: hit.struck ? 'dark' : 'road', road: hit };
}

export const COPY = {
  latched:   'The stays are latched. Draw the stay-bolt first.',
  drawn:     'The stays are drawn. The six swing free.',
  relatch:   'The bolt goes home. The stays catch the six.',
  rounds:    'Rounds. Pretty — but rounds open nothing.',
  false:     'The change falls false. Grief swallows it. Chalk it away, begin again.',
  short:     'The change falls short. Grief swallows it.',
  open:      name => `The change holds. The door gives onto ${name}.`,
  chiming:   'The barrel turns. The old pins do the ringing.',
  chimeOpen: name => `The pins ring true. The door gives onto ${name}.`,
  toll:      'Grief tolls the way shut. The stays catch the six.',
  fade:      'The change wears thin. The way falls shut of itself.',
  dark:      'Wrycross answers. Nothing that kept that gate is worth the meeting.',
  darkShut:  'The door slams itself. Let Wrycross lie.',
};
