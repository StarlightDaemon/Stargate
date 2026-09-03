/* TRELLIS — Hollin Reach Canopy Commons · Sunspan Ring
 * Waymark catalogue and the routes the commons has already walked.
 * Every glyph here is original line-work drawn in a 40x40 box. */

window.TRELLIS_WAYMARKS = [
  { id: 'dawnline',   name: 'Dawnline',   gloss: 'first light over the ridge',
    path: 'M4 28 Q20 8 36 28 M20 6 V12 M9 12 L12 15 M31 12 L28 15 M6 32 H34' },
  { id: 'meridian',   name: 'Meridian',   gloss: 'the sun at its height',
    path: 'M20 4 V36 M8 20 A12 12 0 1 1 32 20 A12 12 0 1 1 8 20 M13 20 H27' },
  { id: 'rainbreak',  name: 'Rainbreak',  gloss: 'the shower that clears',
    path: 'M6 14 Q20 2 34 14 M12 20 Q10 26 12 30 M20 22 Q18 28 20 32 M28 20 Q26 26 28 30' },
  { id: 'seedfall',   name: 'Seedfall',   gloss: 'what scatters and takes',
    path: 'M20 20 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M20 20 Q28 20 28 12 Q28 4 18 5 Q8 6 8 18 Q8 32 22 34 M30 30 l2 2 M9 30 l-2 2 M32 9 l2 -2' },
  { id: 'rootward',   name: 'Rootward',   gloss: 'the way that runs down',
    path: 'M20 4 V16 M20 16 Q12 20 8 32 M20 16 Q28 20 32 32 M20 16 V34 M12 26 l-3 -1 M28 26 l3 -1' },
  { id: 'leafturn',   name: 'Leafturn',   gloss: 'a leaf turning to the light',
    path: 'M8 32 C8 14 20 6 34 6 C34 20 24 32 8 32 Z M8 32 C16 24 22 18 30 10' },
  { id: 'beeway',     name: 'Beeway',     gloss: 'the shared road of small workers',
    path: 'M20 5 L33 12.5 V27.5 L20 35 L7 27.5 V12.5 Z M12 24 Q20 14 28 24 M16 22 l-1 3 M24 22 l1 3' },
  { id: 'tidepool',   name: 'Tidepool',   gloss: 'still water that holds the sky',
    path: 'M20 20 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M20 20 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M6 20 A14 14 0 0 1 34 20' },
  { id: 'mossline',   name: 'Mossline',   gloss: 'the green edge of the stone',
    path: 'M4 26 Q10 18 16 26 T28 26 T40 26 M10 22 V17 M22 22 V16 M34 22 V18 M4 32 H36' },
  { id: 'emberkeep',  name: 'Emberkeep',  gloss: 'the hearth kept for neighbours',
    path: 'M8 34 H32 M10 34 V22 Q10 14 20 14 Q30 14 30 22 V34 M20 30 Q16 24 20 18 Q24 24 20 30' },
  { id: 'windrow',    name: 'Windrow',    gloss: 'what the wind lays in rows',
    path: 'M5 12 Q14 6 22 12 T35 12 M5 20 Q14 14 22 20 T35 20 M5 28 Q14 22 22 28 T35 28' },
  { id: 'stargap',    name: 'Stargap',    gloss: 'the gap where one star shows',
    path: 'M6 6 Q20 18 34 6 M6 34 Q20 22 34 34 M20 16 L21.5 19.5 L25 20 L22 22.5 L23 26 L20 24 L17 26 L18 22.5 L15 20 L18.5 19.5 Z' },
  { id: 'wellspring', name: 'Wellspring', gloss: 'water that rises on its own',
    path: 'M20 34 V18 M20 18 Q12 18 8 8 M20 18 Q28 18 32 8 M20 18 Q20 10 20 5 M12 34 H28' },
  { id: 'duskfold',   name: 'Duskfold',   gloss: 'the day folding itself away',
    path: 'M4 12 Q20 32 36 12 M4 18 Q20 34 36 18 M14 8 l-2 -3 M26 8 l2 -3 M20 6 V3' }
];

/* Routes the commons has walked before. The ledger keeps each share pledged,
 * which is why the ring can re-route them at ledger pace rather than by hand. */
window.TRELLIS_ROUTES = [
  { id: 'alder-ferry',  name: 'Alder Ferry Landing',     note: 'river commons · walked 212 times',
    marks: ['dawnline','rainbreak','rootward','beeway','tidepool','windrow','meridian'] },
  { id: 'kestrel',      name: 'Kestrel Terrace Growers', note: 'hillside allotments · walked 96 times',
    marks: ['leafturn','seedfall','mossline','dawnline','wellspring','stargap','emberkeep'] },
  { id: 'long-orchard', name: 'The Long Orchard',        note: 'cider pressing · walked 154 times',
    marks: ['seedfall','leafturn','beeway','rainbreak','duskfold','meridian','rootward'] },
  { id: 'saltmarsh',    name: 'Saltmarsh Weavers’ Hall', note: 'reed and wool · walked 41 times',
    marks: ['tidepool','windrow','mossline','wellspring','duskfold','dawnline','beeway'] },
  { id: 'nine-wells',   name: 'Nine Wells Bathhouse',    note: 'geothermal share · walked 73 times',
    marks: ['wellspring','emberkeep','tidepool','stargap','rootward','mossline','leafturn'] },
  { id: 'lantern-row',  name: 'Lantern Row Night School', note: 'newly pledged · first walk',
    marks: ['stargap','duskfold','emberkeep','windrow','seedfall','rainbreak','wellspring'] }
];
