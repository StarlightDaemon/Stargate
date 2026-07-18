/* ═══════════════════════════════════════════════════════════════════
   glyphs.js — the chalk lexicon of the drove-road cunning folk.
   24 way-marks, each an original folk sign: things a walking
   practitioner would scratch on gates, stiles and byre doors.
   Paths are drawn in a 100×100 box, stroked like chalk.
   ═══════════════════════════════════════════════════════════════════ */

const GLYPHS = [
  { id: "wet-road",     name: "Wet Road",       whisper: "water on the way",
    d: "M18 55 Q 34 40, 50 55 T 82 55 M50 72 a4 4 0 1 0 0.1 0" },
  { id: "kind-door",    name: "Kind Door",      whisper: "they feed strangers here",
    d: "M30 80 L30 42 Q 50 22, 70 42 L70 80 M44 80 L44 62 L56 62 L56 80" },
  { id: "crows-eye",    name: "Crow's Eye",     whisper: "someone is watching",
    d: "M50 50 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0 M50 50 a5 5 0 1 0 0.1 0 M68 34 L82 22" },
  { id: "ash-knot",     name: "Ash Knot",       whisper: "a binding that holds",
    d: "M30 65 C 30 35, 70 35, 70 65 C 70 82, 46 82, 46 62 C 46 46, 66 46, 62 64" },
  { id: "three-pennies",name: "Three Pennies",  whisper: "paid in full",
    d: "M32 70 a8 8 0 1 0 0.1 0 M50 48 a8 8 0 1 0 0.1 0 M68 28 a8 8 0 1 0 0.1 0" },
  { id: "bent-nail",    name: "Bent Nail",      whisper: "mended, not new",
    d: "M38 24 L38 66 Q 38 80, 52 78 Q 64 76, 60 64 M30 28 L46 28" },
  { id: "milk-thistle", name: "Milk Thistle",   whisper: "bitter but wholesome",
    d: "M50 78 L50 44 M50 44 L34 28 M50 44 L66 28 M50 44 L28 44 M50 44 L72 44 M50 44 L40 22 M50 44 L60 22" },
  { id: "cold-stile",   name: "Cold Stile",     whisper: "a crossing, if you're quick",
    d: "M26 74 L74 30 M26 30 L74 74 M20 52 L36 52 M64 52 L80 52" },
  { id: "bee-skep",     name: "Bee Skep",       whisper: "industry and sweetness",
    d: "M28 74 Q 28 30, 50 28 Q 72 30, 72 74 M30 60 L70 60 M32 46 L68 46 M44 74 L56 74" },
  { id: "lantern-hook", name: "Lantern Hook",   whisper: "light left burning",
    d: "M50 20 L50 42 Q 50 52, 40 52 M50 42 Q 50 52, 60 52 M50 56 L38 68 L50 80 L62 68 Z" },
  { id: "ferry-mark",   name: "Ferry Mark",     whisper: "the water will bear you",
    d: "M24 62 Q 50 78, 76 62 M32 62 L32 40 M68 62 L68 40 M32 46 L68 46" },
  { id: "sisters-braid",name: "Sisters' Braid", whisper: "three keep the promise",
    d: "M28 26 Q 50 46, 28 66 M50 26 Q 28 46, 50 66 M50 26 Q 72 46, 50 66 M72 26 Q 50 46, 72 66" },
  { id: "salt-ring",    name: "Salt Ring",      whisper: "nothing crosses this",
    d: "M50 26 A24 24 0 0 1 71 38 M74 50 A24 24 0 0 1 62 71 M50 74 A24 24 0 0 1 29 62 M26 50 A24 24 0 0 1 38 29" },
  { id: "dogs-tooth",   name: "Dog's Tooth",    whisper: "beware the yard",
    d: "M22 66 L34 38 L46 66 L58 38 L70 66 L78 46" },
  { id: "marsh-light",  name: "Marsh Light",    whisper: "do not follow it",
    d: "M50 34 a9 9 0 1 0 0.1 0 M22 66 Q 36 56, 50 66 T 78 66" },
  { id: "broken-wheel", name: "Broken Wheel",   whisper: "the road ends here",
    d: "M50 50 m-24 0 a24 24 0 1 1 10 19 M50 50 L50 26 M50 50 L30 62 M50 50 L70 62" },
  { id: "tinkers-cross",name: "Tinker's Cross", whisper: "trade done fairly",
    d: "M30 30 L70 70 M70 30 L30 70 M50 24 a3 3 0 1 0 0.1 0 M50 70 a3 3 0 1 0 0.1 0 M24 50 a3 3 0 1 0 0.1 0 M70 50 a3 3 0 1 0 0.1 0" },
  { id: "rushlight",    name: "Rushlight",      whisper: "small flame, long night",
    d: "M50 80 L50 40 M50 40 Q 42 32, 50 20 Q 58 32, 50 40 M38 80 L62 80" },
  { id: "green-ford",   name: "Green Ford",     whisper: "shallow enough to wade",
    d: "M28 44 L50 26 L72 44 M22 60 Q 36 52, 50 60 T 78 60 M22 72 Q 36 64, 50 72 T 78 72" },
  { id: "widows-latch", name: "Widow's Latch",  whisper: "knock soft or not at all",
    d: "M36 24 L36 70 L70 70 M36 44 L58 44 M58 36 L58 52" },
  { id: "star-in-well", name: "Star-in-Well",   whisper: "wish spent, wish kept",
    d: "M30 30 L70 30 L70 70 L30 70 Z M50 38 L54 48 L64 48 L56 55 L59 66 L50 59 L41 66 L44 55 L36 48 L46 48 Z" },
  { id: "hares-run",    name: "Hare's Run",     whisper: "go now, quickly",
    d: "M22 66 Q 34 40, 48 62 Q 60 38, 78 58 M66 34 L78 26 M70 40 L82 36" },
  { id: "elder-gate",   name: "Elder Gate",     whisper: "ask the tree first",
    d: "M28 76 L28 34 Q 50 24, 72 34 L72 76 M28 48 L72 48 M50 48 L50 76" },
  { id: "moth-mark",    name: "Moth Mark",      whisper: "flies to remembered flame",
    d: "M50 30 L50 74 M50 40 L28 30 L34 52 L50 46 M50 40 L72 30 L66 52 L50 46 M46 74 L54 74 M44 26 L50 32 L56 26" },
];

/* Wren's own mark — the seventh chalking, never traded, never taught. */
const HEARTH_MARK = { id: "wrens-mark", name: "Wren's Mark", whisper: "home knows its own" };

/* ═══════════ The road-ledger: every destination is fiction, ═══════════
   places out of fen-country hearsay. Six way-marks each. */
const DESTINATIONS = [
  {
    id: "fen-market",
    name: "The Fen Market at Dusk",
    note: "Traders come by odd roads. Mind your purse and your name.",
    marks: ["wet-road", "three-pennies", "tinkers-cross", "lantern-hook", "kind-door", "bee-skep"],
    kind: "fair",
  },
  {
    id: "hessys-croft",
    name: "Aunt Hessy's Croft",
    note: "Warm hearth, strong tea, questions she already knows the answers to.",
    marks: ["kind-door", "bee-skep", "rushlight", "green-ford", "sisters-braid", "milk-thistle"],
    kind: "fair",
  },
  {
    id: "underhill",
    name: "The Underhill Waystation",
    note: "Draughty. Leave a penny on the shelf whether anyone's there or not.",
    marks: ["elder-gate", "cold-stile", "widows-latch", "salt-ring", "crows-eye", "three-pennies"],
    kind: "old",
  },
  {
    id: "chalk-chapel",
    name: "The Chalk Chapel",
    note: "Nobody preaches there now. Good acoustics, better silences.",
    marks: ["star-in-well", "elder-gate", "salt-ring", "rushlight", "ferry-mark", "ash-knot"],
    kind: "old",
  },
  {
    id: "hollow-tarn",
    name: "The Hollow Tarn",
    note: "DO NOT. — struck through twice in Wren's hand",
    marks: ["marsh-light", "dogs-tooth", "broken-wheel", "crows-eye", "marsh-light", "hares-run"],
    kind: "crossed",
  },
];

/* ═══════════ Journal copy — the wayband's small voice ═══════════ */
const COPY = {
  idle: [
    "The watch-flame is lit. The wheel hangs quiet.",
    "Damp in the boards tonight. The chalk holds anyway.",
    "The kettle's cold, the pin is home. All as it should be.",
  ],
  dialStart: (name) => `Chalking the road to ${name}. Six marks and the seventh.`,
  dialStartHand: "Chalking by hand, mark by mark. Hope you copied them right.",
  markSet: [
    "The catch took first try. Small mercies.",
    "Twine's cinched. The candle caught.",
    "That one sputtered — damp again — but it holds.",
    "Wheel creaks like Marsh's old dray. It always did.",
    "The wax took the mark. On to the next.",
    "Another catch closed. The rig hums a little now.",
  ],
  hearthSet: "Wren's own mark, last of seven. The wheel knows it's wanted.",
  primed: "All seven hold. Tip the ladle when you're ready — and not before.",
  opening: "The priming water finds the chalk. Hold your breath.",
  open: (name) => `The way stands open to ${name}. It won't wait forever.`,
  openMoth: (name) => `Moth-light to ${name}. See how it shivers? That's the bargain.`,
  mothStart: (name) => `A taper burnt. The moth flies the road to ${name} from the wax's memory.`,
  mothNoTaper: "No tapers dipped. The moth has nothing to burn — the patient way, then.",
  mothNoMemory: "The moth only flies roads the wax remembers. Hand-chalked ways go the patient way.",
  fizzle: [
    "The water hissed and the chalk went dark. The way didn't answer.",
    "Some doors want knowing first. This wasn't one of ours.",
  ],
  crossed: "The marks took. The candles took. And then something on the far side leaned close — and Wren's mark SLAMMED it shut. The ledger says DO NOT for a reason.",
  guttering: "The wax is going. Finish your business.",
  guttered: "The tallow gave out. The way fell shut on its own, as the rules say it must.",
  sealing: "Iron in the socket. The way closes clean.",
  sealed: "Sealed and snuffed. Scrape the drippings while they're warm.",
  drippings: "A dripping saved to the jar. Two makes a taper.",
  taperDipped: "A new taper, moth-dipped and set on the shelf.",
  wipe: "Slate wiped. Start your chalking over.",
  busy: "The wheel's mid-turn. Patience.",
  alreadyOpen: "One way at a time. Seal this one first.",
};
