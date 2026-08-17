/* The Trust's certified correspondents. Entirely fictitious.
   Codes are six columns, values 1..8, punched by the computing office. */

export const CORRESPONDENTS = [
  { name: 'AURELIAN CONCOURSE',   code: [3, 7, 2, 5, 1, 6],
    advisory: 'Grand exchange beneath a gilt sky. Mind the porters.' },
  { name: 'FOGBOUND ANCHORAGE',   code: [7, 1, 4, 2, 8, 3],
    advisory: 'Harbour of the grey fleets. Lanterns are answered.' },
  { name: 'CANDLEWICK TERMINUS',  code: [2, 5, 7, 1, 4, 8],
    advisory: 'End of the waxen line. Last post before the dark.' },
  { name: 'THE VITREOUS STEPPE',  code: [5, 3, 8, 6, 2, 1],
    advisory: 'Glass grasslands. Travellers must wear felt soles.' },
  { name: 'LANTERN DEEP',         code: [8, 4, 1, 7, 3, 5],
    advisory: 'Submerged gallery lit by patient fish.' },
  { name: 'HOLLOWMERE OBSERVATORY', code: [4, 8, 5, 3, 6, 2],
    advisory: 'Dry lake, wet stars. Astronomers in residence.' },
];

export function matchCorrespondent(code) {
  return CORRESPONDENTS.find(c => c.code.every((v, i) => v === code[i])) || null;
}

export const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
