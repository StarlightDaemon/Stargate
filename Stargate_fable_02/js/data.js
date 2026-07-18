/* Heliacal Ring — static data: glyph lexicon and destination registry.
   Every name, address and world here is invented for this piece. */

window.HG = window.HG || {};

HG.data = (function () {
  "use strict";

  // 38 glyphs. Index 0 is the point-of-origin glyph required as the
  // seventh lock of every address dialed from this terminal.
  const GLYPH_NAMES = [
    "Solyn",   "Vesk",    "Orath",   "Nimbra",  "Kaelis",  "Duvane",
    "Ferun",   "Ghest",   "Halyx",   "Irruna",  "Jorei",   "Krynn",
    "Lumet",   "Moraq",   "Nerith",  "Ossra",   "Pelune",  "Quorav",
    "Rhemis",  "Savrin",  "Talvek",  "Uskarn",  "Vothal",  "Wren-Ka",
    "Xilos",   "Ymbral",  "Zhenna",  "Ardyn",   "Brellith","Corvane",
    "Dessik",  "Ellorn",  "Fyshar",  "Gornath", "Hyleth",  "Ivvenn",
    "Jaskell", "Kovarr"
  ];

  const ORIGIN = 0;

  // Verified destinations. `address` is the six destination glyphs;
  // the origin glyph is appended automatically when dialing.
  // `hue` tints the open conduit; telemetry is what survey probes report.
  const DESTINATIONS = [
    {
      id: "thessa",
      name: "THESSA PRIME",
      desc: "Verdant refuge world · settled 214 cycles",
      address: [4, 11, 27, 8, 33, 19],
      hue: 165,
      telemetry: [
        "atmosphere: breathable · 22.4°C at ring plaza",
        "beacon THS-1 answering · settlement grid nominal",
        "flora index 0.93 — canopy overgrowing the dais again"
      ]
    },
    {
      id: "karmorath",
      name: "KAR MORATH",
      desc: "Volcanic forge colony · heavy industry",
      address: [13, 2, 30, 21, 6, 25],
      hue: 32,
      telemetry: [
        "surface temp 74°C · ashfall moderate",
        "foundry line 3 active · slag lighting the sky",
        "probe hull pitted by cinder — telemetry degrading"
      ]
    },
    {
      id: "veiled",
      name: "THE VEILED REACH",
      desc: "Deep-space relay platform · unmanned",
      address: [24, 9, 17, 35, 1, 28],
      hue: 275,
      telemetry: [
        "zero-g platform · station spin 0.4 rpm",
        "relay stack answering on all channels",
        "starfield unfamiliar — catalogue match 0 of 40,000"
      ]
    },
    {
      id: "oceanus",
      name: "OCEANUS YR",
      desc: "Abyssal ocean world · ring on tidal shelf",
      address: [7, 31, 14, 3, 22, 36],
      hue: 215,
      telemetry: [
        "ring half-submerged at high tide · seals holding",
        "bioluminescent shoal circling the event surface",
        "depth soundings: no floor within instrument range"
      ]
    },
    {
      id: "cindral",
      name: "CINDRAL WASTES",
      desc: "Ruined precursor site · caution advised",
      address: [29, 5, 37, 12, 20, 10],
      hue: 8,
      telemetry: [
        "background radiation 40× baseline",
        "structures fused to glass — orientation unknown",
        "…faint rhythmic signal below the ruins. source unresolved"
      ]
    },
    {
      id: "halcyon",
      name: "HALCYON VERGE",
      desc: "Orbital garden ring · diplomatic annex",
      address: [16, 26, 1, 34, 9, 23],
      hue: 95,
      telemetry: [
        "arrival hall lit and tended · gravity 0.9 g",
        "annex steward logged the probe and waved",
        "pollen count extreme — lenses require wiping"
      ]
    },
    {
      id: "nocturne",
      name: "NOCTURNE DEEP",
      desc: "Rogue planet · permanent night",
      address: [32, 18, 6, 27, 15, 2],
      hue: 245,
      telemetry: [
        "no star. sky is only other suns, far away",
        "surface −201°C · ring platform heaters active",
        "ice geysers on the horizon, backlit by the conduit"
      ]
    },
    {
      id: "anvil",
      name: "THE ANVIL BELT",
      desc: "Asteroid shipyard · drydock cluster",
      address: [10, 36, 24, 5, 31, 17],
      hue: 190,
      telemetry: [
        "docked frames: 3 hulls in assembly, 1 being broken",
        "traffic control pinged probe transponder — cleared",
        "micro-debris field dense · shield advised for return"
      ]
    }
  ];

  return { GLYPH_NAMES, DESTINATIONS, ORIGIN };
})();
