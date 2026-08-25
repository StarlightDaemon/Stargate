/* Kagerō Road Waystation Registry — glyphs, stations, palette.
   All names, glyphs, stations and lore are original fiction. */

const PALETTE = {
  paper:   '#f0e6d2',
  paperDim:'#e6d9bf',
  sumi:    '#221c16',
  indigo:  '#2b4a6f',
  deep:    '#1e3350',
  vermil:  '#c03a29',
  ochre:   '#c9962e',
  paleOchre:'#e3c983',
  grass:   '#5b7d54',
  grey:    '#8d8677',
  paleGrey:'#c9c2b0',
  dusk:    '#d9a695',
  wood:    '#a97e42',
  woodDark:'#7c5a2e'
};

/* The ten travel-glyphs carved into the Registry Dial.
   Each is drawn in a 100x100 box, stroke-based, flat. */
const GLYPHS = [
  { id:'nami',    name:'Nami',    gloss:'the wave',
    svg:'<path d="M10 70 Q30 68 40 55 Q50 42 42 32 Q60 30 66 45 Q71 58 60 68 Q80 62 84 44"/><path d="M8 80 H92"/><circle cx="24" cy="36" r="3" fill="currentColor" stroke="none"/><circle cx="88" cy="38" r="3" fill="currentColor" stroke="none"/>' },
  { id:'kumo',    name:'Kumo',    gloss:'the cloud',
    svg:'<path d="M20 62 Q18 46 34 46 Q37 32 52 35 Q67 30 69 46 Q84 46 80 62 Z"/><path d="M28 74 H72"/>' },
  { id:'mine',    name:'Mine',    gloss:'the peak',
    svg:'<path d="M18 78 L50 24 L82 78 Z"/><path d="M40 50 L46 57 L52 48 L58 55"/>' },
  { id:'tsuki',   name:'Tsuki',   gloss:'the moon',
    svg:'<circle cx="52" cy="46" r="26"/><path d="M14 68 H52"/><path d="M30 80 H70"/>' },
  { id:'matsu',   name:'Matsu',   gloss:'the pine',
    svg:'<path d="M50 82 V46"/><circle cx="34" cy="42" r="12"/><circle cx="66" cy="42" r="12"/><circle cx="50" cy="24" r="11"/><path d="M32 82 H68"/>' },
  { id:'sagi',    name:'Sagi',    gloss:'the heron',
    svg:'<path d="M28 64 Q48 74 62 63 Q73 55 69 45"/><path d="M69 45 Q59 41 61 31 Q62 22 71 21"/><path d="M71 21 L86 26"/><path d="M46 70 V84"/><path d="M56 70 V84"/>' },
  { id:'tomoshi', name:'Tomoshi', gloss:'the lantern flame',
    svg:'<path d="M50 22 Q65 42 61 57 Q58 70 50 70 Q42 70 39 57 Q35 42 50 22 Z"/><path d="M46 52 Q50 44 54 52"/><path d="M34 80 H66"/>' },
  { id:'yuki',    name:'Yuki',    gloss:'the snow bloom',
    svg:'<path d="M50 20 V80"/><path d="M25 35 L75 65"/><path d="M75 35 L25 65"/><circle cx="50" cy="50" r="8"/>' },
  { id:'kaze',    name:'Kaze',    gloss:'the wind',
    svg:'<path d="M22 56 Q22 36 42 34 Q60 32 62 47 Q63 60 50 60 Q41 60 41 51 Q41 45 48 45"/><path d="M62 47 Q78 50 88 40"/>' },
  { id:'se',      name:'Se',      gloss:'the shallows',
    svg:'<path d="M14 36 Q26 28 38 36 Q50 44 62 36 Q74 28 86 36"/><path d="M14 54 Q26 46 38 54 Q50 62 62 54 Q74 46 86 54"/><path d="M14 72 Q26 64 38 72 Q50 80 62 72 Q74 64 86 72"/>' }
];

const GLYPH_BY_ID = Object.fromEntries(GLYPHS.map(g => [g.id, g]));

/* The ten waystations of the Kagerō-kaidō.
   address[0] is the station's own emblem glyph — "the key-block names the
   province" — so the first impression always identifies the destination.
   Every address is seven impressions long: one key-block plus six color
   blocks, the full gamut of a classic pull. */
const STATIONS = [
  { id:'yanagibashi', name:'Yanagibashi', gloss:'Willow Bridge',
    tier:'post', emblem:'kaze',
    address:['kaze','se','kumo','tsuki','matsu','sagi','nami'],
    print:{ sky:'#e7d7ae', land:'#5b7d54', water:'#2b4a6f',
            disk:{x:300,y:92,r:40,fill:'#e3c983'}, dots:null, mountain:0 } },
  { id:'kumogaeshi', name:'Kumogaeshi', gloss:"Cloud's Return",
    tier:'post', emblem:'kumo',
    address:['kumo','nami','mine','se','tsuki','sagi','yuki'],
    print:{ sky:'#c9c2b0', land:'#8d8677', water:'#35597f',
            disk:null, dots:null, mountain:1 } },
  { id:'shirasagihama', name:'Shirasagihama', gloss:'White Heron Shore',
    tier:'post', emblem:'sagi',
    address:['sagi','kaze','se','kumo','tsuki','nami','tomoshi'],
    print:{ sky:'#d9a695', land:'#c9962e', water:'#1e3350',
            disk:{x:96,y:96,r:34,fill:'#c03a29'}, dots:null, mountain:2 } },
  { id:'okuyama', name:'Okuyama Pass', gloss:'the Deep Mountain Gate',
    tier:'hidden', emblem:'mine',
    address:['mine','se','nami','kumo','sagi','yuki','tomoshi'],
    print:{ sky:'#e3c983', land:'#4a5a4e', water:'#2b4a6f',
            disk:null, dots:null, mountain:1 } },
  { id:'hoshiotoshi', name:'Hoshiotoshi', gloss:'Star-Fall Ford',
    tier:'hidden', emblem:'tomoshi',
    address:['tomoshi','mine','kumo','sagi','nami','kaze','tsuki'],
    print:{ sky:'#1e3350', land:'#223041', water:'#2b4a6f',
            disk:{x:290,y:86,r:36,fill:'#f0e6d2'}, dots:'stars', mountain:0 } },
  { id:'kawabue', name:'Kawabue', gloss:'River-Flute Landing',
    tier:'post', emblem:'se',
    address:['se','kumo','tsuki','yuki','matsu','sagi','nami'],
    print:{ sky:'#e7d7ae', land:'#5b7d54', water:'#2b4a6f',
            disk:null, dots:null, mountain:2 } },
  { id:'akatsuhara', name:'Akatsuhara', gloss:'Vermillion Moor',
    tier:'hidden', emblem:'nami',
    address:['nami','kaze','mine','kumo','tomoshi','se','tsuki'],
    print:{ sky:'#e3b489', land:'#b5543b', water:'#2b4a6f',
            disk:{x:110,y:88,r:38,fill:'#c03a29'}, dots:null, mountain:0 } },
  { id:'tsukinoto', name:'Tsukinoto', gloss:'Moon Gate Hollow',
    tier:'hidden', emblem:'tsuki',
    address:['tsuki','sagi','kumo','se','yuki','kaze','tomoshi'],
    print:{ sky:'#2b4a6f', land:'#3a4a3f', water:'#1e3350',
            disk:{x:190,y:120,r:64,fill:'#f0e6d2'}, dots:null, mountain:2 } },
  { id:'matsukaze', name:'Matsukaze', gloss:'Pine-Wind Rest',
    tier:'post', emblem:'matsu',
    address:['matsu','kaze','kumo','mine','se','tsuki','sagi'],
    print:{ sky:'#e7d7ae', land:'#5b7d54', water:'#2b4a6f',
            disk:null, dots:null, mountain:1 } },
  { id:'yukishiro', name:'Yukishiro', gloss:'the Snow Keep',
    tier:'hidden', emblem:'yuki',
    address:['yuki','kumo','mine','tsuki','matsu','kaze','sagi'],
    print:{ sky:'#c9c2b0', land:'#e9dfc8', water:'#35597f',
            disk:{x:296,y:90,r:34,fill:'#e3c983'}, dots:'snow', mountain:0 } }
];

const STATION_BY_ID = Object.fromEntries(STATIONS.map(s => [s.id, s]));
const STATION_BY_EMBLEM = Object.fromEntries(STATIONS.map(s => [s.emblem, s]));

/* The seven traveler's tokens kept ready at the warden's post.
   Post Road tokens are the busy stations of the open road; Hidden Way
   tokens are the rarer passes, cut and blessed less often. */
const QUICK_TOKENS = [
  { station:'yanagibashi',   tier:'post'   },
  { station:'shirasagihama', tier:'post'   },
  { station:'kawabue',       tier:'post'   },
  { station:'matsukaze',     tier:'post'   },
  { station:'tsukinoto',     tier:'hidden' },
  { station:'hoshiotoshi',   tier:'hidden' },
  { station:'yukishiro',     tier:'hidden' }
];

/* Names of the seven impressions, in printing order. */
const IMPRESSION_NAMES = [
  'sumi key-block', 'sky block', 'water block', 'earth block',
  'light block', 'accent block', 'title & seal'
];
