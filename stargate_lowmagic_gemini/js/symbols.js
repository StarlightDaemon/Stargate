/**
 * symbols.js — 28 Folk Charms, Hearth Tools, and Herbarium Motifs
 * Part of Stargate Low Magic ("RUSHLIGHT")
 * Each symbol is an original flat vector illustration reflecting everyday
 * domestic witchcraft, pantry charms, and field herbs.
 */

window.FOLK_SYMBOLS = [
  {
    id: "salt",
    name: "The Salt Line",
    lore: "Salt to bar the threshold, salt to keep the peace.",
    dyes: "iron",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 36c4-1 16-1 24 0"/>
      <path d="M10 40c6-1 22-1 28 0"/>
      <circle cx="16" cy="24" r="1.5" fill="currentColor"/>
      <circle cx="24" cy="22" r="1.5" fill="currentColor"/>
      <circle cx="32" cy="25" r="1.5" fill="currentColor"/>
      <circle cx="20" cy="29" r="1.5" fill="currentColor"/>
      <circle cx="28" cy="30" r="1.5" fill="currentColor"/>
      <path d="M22 8l4 10-6 4 8 2"/>
      <path d="M26 8c3 4 5 7 8 10"/>
    </svg>`
  },
  {
    id: "knot",
    name: "The Nine-Fold Knot",
    lore: "A cord once drawn holds firm against wind and weir.",
    dyes: "madder",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="24" cy="24" r="14" stroke-dasharray="3 3"/>
      <path d="M18 18c6-6 18 6 12 12s-18-6-12-12z"/>
      <path d="M30 18c-6-6-18 6-12 12s18-6 12-12z"/>
      <circle cx="24" cy="24" r="3" fill="currentColor"/>
    </svg>`
  },
  {
    id: "spindle",
    name: "The Drop Spindle",
    lore: "The thread turns smooth when the hearth is swept.",
    dyes: "woad",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <line x1="24" y1="6" x2="24" y2="42"/>
      <ellipse cx="24" cy="32" rx="10" ry="3"/>
      <path d="M18 20c3 4 9 4 12 0"/>
      <path d="M17 24c4 5 10 5 14 0"/>
      <path d="M24 6c-2 2-3 4-1 6"/>
    </svg>`
  },
  {
    id: "thistle",
    name: "The Carline Thistle",
    lore: "Prickly leaf to catch the wandering sprite.",
    dyes: "sage",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 42V22"/>
      <path d="M16 22c2-8 14-8 16 0-4 1-12 1-16 0z"/>
      <path d="M18 14l2-4 4 2 4-2 2 4"/>
      <path d="M20 18l-6-6m14 6l6-6"/>
      <path d="M24 34c-6-2-8-6-12-6 2 6 6 8 12 7"/>
      <path d="M24 30c6-2 8-6 12-6-2 6-6 8-12 7"/>
    </svg>`
  },
  {
    id: "rushlight",
    name: "The Dipped Rush",
    lore: "Pith of green rush, grease of Sunday roast.",
    dyes: "ochre",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 20v22"/>
      <path d="M16 42h16"/>
      <path d="M20 32c4-2 4-2 8 0"/>
      <path d="M24 18c-3-4-2-8 0-12 2 4 3 8 0 12z" fill="currentColor" fill-opacity="0.2"/>
      <circle cx="24" cy="12" r="1.5" fill="currentColor"/>
    </svg>`
  },
  {
    id: "kettle",
    name: "The Cast Kettle",
    lore: "Three times stirred widdershins for boiling well.",
    dyes: "iron",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 22c0 10 5 16 10 16s10-6 10-16H14z"/>
      <path d="M12 20h24"/>
      <path d="M16 20c0-8 16-8 16 0"/>
      <path d="M34 26l6-4"/>
      <path d="M18 38l-2 4m14-4l2 4"/>
    </svg>`
  },
  {
    id: "shears",
    name: "The Wool Shears",
    lore: "Steel to sever the stitch and loose the bind.",
    dyes: "iron",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="24" cy="10" r="4"/>
      <path d="M21 14l-8 22c2 1 5 1 7-3l4-15"/>
      <path d="M27 14l8 22c-2 1-5 1-7-3l-4-15"/>
    </svg>`
  },
  {
    id: "bramble",
    name: "The Bramble Arch",
    lore: "Under nine prickles nine ills creep away.",
    dyes: "sage",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 40c2-20 26-20 28 0"/>
      <path d="M14 30l-4-2m18-12l3-4m8 10l4-1"/>
      <circle cx="18" cy="22" r="2" fill="currentColor"/>
      <circle cx="28" cy="20" r="2" fill="currentColor"/>
      <circle cx="34" cy="30" r="2" fill="currentColor"/>
    </svg>`
  },
  {
    id: "elder",
    name: "The Elder Bough",
    lore: "Never burn elder wood lest the milk go sour.",
    dyes: "woad",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 42V18"/>
      <path d="M24 28l-8-6m8-2l8-6"/>
      <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
      <circle cx="20" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="24" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="28" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="32" cy="14" r="1.5" fill="currentColor"/>
    </svg>`
  },
  {
    id: "rowan",
    name: "The Rowan Branch",
    lore: "Rowan-tree and red thread put the witches to their speed.",
    dyes: "madder",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 42c0-14 4-26 12-32"/>
      <path d="M26 26c-6-4-10-2-14 2"/>
      <circle cx="12" cy="28" r="2.5" fill="currentColor"/>
      <circle cx="16" cy="32" r="2.5" fill="currentColor"/>
      <circle cx="18" cy="26" r="2.5" fill="currentColor"/>
      <path d="M28 16c-3-3-8-2-10 1"/>
    </svg>`
  },
  {
    id: "mugwort",
    name: "The Mugwort Leaf",
    lore: "Mugwort in the shoe keeps weary feet from blister.",
    dyes: "sage",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 42V8"/>
      <path d="M24 28c-6-2-10-8-12-6 2 6 8 8 12 6z"/>
      <path d="M24 28c6-2 10-8 12-6-2 6-8 8-12 6z"/>
      <path d="M24 18c-5-2-8-6-10-4 1 5 6 6 10 4z"/>
      <path d="M24 18c5-2 8-6 10-4-1 5-6 6-10 4z"/>
    </svg>`
  },
  {
    id: "bellows",
    name: "The Hearth Bellows",
    lore: "One breath for embers, two for rising dough.",
    dyes: "ochre",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 6v8"/>
      <path d="M16 14c-4 10-4 18 0 22l8-2 8 2c4-4 4-12 0-22H16z"/>
      <circle cx="24" cy="25" r="3"/>
      <path d="M18 36l-4 6m16-6l4 6"/>
    </svg>`
  },
  {
    id: "loom",
    name: "The Weaver's Heddle",
    lore: "Weft in the shadow, warp in the morning sun.",
    dyes: "woad",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="10" y="10" width="28" height="28" rx="2"/>
      <line x1="18" y1="10" x2="18" y2="38"/>
      <line x1="24" y1="10" x2="24" y2="38"/>
      <line x1="30" y1="10" x2="30" y2="38"/>
      <circle cx="24" cy="24" r="2" fill="currentColor"/>
    </svg>`
  },
  {
    id: "honeycomb",
    name: "The Straw Skep",
    lore: "Tell the bees your travels ere you bolt the sill.",
    dyes: "ochre",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 38h20"/>
      <path d="M14 38c-2-12 4-26 10-26s12 14 10 26"/>
      <path d="M15 32c4-2 14-2 18 0"/>
      <path d="M17 26c3-2 11-2 14 0"/>
      <path d="M19 20c2-1 8-1 10 0"/>
      <ellipse cx="24" cy="34" rx="2" ry="3" fill="currentColor"/>
    </svg>`
  },
  {
    id: "drystone",
    name: "The Field Dyke",
    lore: "Stone upon unmortared stone stands seven frosts.",
    dyes: "iron",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="32" width="16" height="8" rx="1"/>
      <rect x="24" y="32" width="16" height="8" rx="1"/>
      <rect x="12" y="24" width="14" height="8" rx="1"/>
      <rect x="26" y="24" width="12" height="8" rx="1"/>
      <rect x="16" y="16" width="16" height="8" rx="1"/>
    </svg>`
  },
  {
    id: "well",
    name: "The Mossy Curb",
    lore: "Drop a crooked pin for sweet spring water.",
    dyes: "woad",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="24" cy="34" rx="14" ry="6"/>
      <path d="M10 34V28c0-3.3 6.3-6 14-6s14 2.7 14 6v6"/>
      <path d="M16 24V12l8-4 8 4v12"/>
      <line x1="24" y1="10" x2="24" y2="22"/>
      <circle cx="24" cy="24" r="2"/>
    </svg>`
  },
  {
    id: "mortar",
    name: "The Stone Mortar",
    lore: "Crushed seed of caraway, crushed root of yellow dock.",
    dyes: "iron",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22c0 10 5 16 12 16s12-6 12-16H12z"/>
      <path d="M10 20h28"/>
      <path d="M16 38h16"/>
      <path d="M28 10l-6 16"/>
      <ellipse cx="28" cy="10" rx="3" ry="1.5"/>
    </svg>`
  },
  {
    id: "churn",
    name: "The Butter Churn",
    lore: "Turn and turn, come golden butter come.",
    dyes: "ochre",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <line x1="24" y1="6" x2="24" y2="24"/>
      <path d="M18 20l-3 20h18l-3-20H18z"/>
      <line x1="16" y1="28" x2="32" y2="28"/>
      <line x1="15.5" y1="34" x2="32.5" y2="34"/>
      <circle cx="24" cy="8" r="2"/>
    </svg>`
  },
  {
    id: "quilt",
    name: "The Linsey Quilt",
    lore: "Scraps of apron, ribbons of woven woolsey.",
    dyes: "madder",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="10" y="10" width="28" height="28"/>
      <path d="M10 10l28 28M38 10L10 38"/>
      <circle cx="24" cy="24" r="2" fill="currentColor"/>
      <path d="M24 10v28M10 24h28" stroke-dasharray="2 2"/>
    </svg>`
  },
  {
    id: "ash",
    name: "The White Ash",
    lore: "Scatter hearth-ash upon the doorstep at sundown.",
    dyes: "iron",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 36c6-2 18-2 24 0"/>
      <path d="M16 32c4-2 12-2 16 0"/>
      <path d="M24 14c-4 4-2 10 0 14 2-4 4-10 0-14z"/>
      <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
      <circle cx="30" cy="18" r="1.5" fill="currentColor"/>
      <circle cx="22" cy="10" r="1" fill="currentColor"/>
    </svg>`
  },
  {
    id: "yarrow",
    name: "The Thousand-Leaf",
    lore: "Seven sprigs under pillow for true dreaming.",
    dyes: "sage",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 42V18"/>
      <path d="M24 24l-8-6m8 4l8-6"/>
      <circle cx="14" cy="14" r="1.5" fill="currentColor"/>
      <circle cx="18" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="24" cy="11" r="1.5" fill="currentColor"/>
      <circle cx="30" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="34" cy="14" r="1.5" fill="currentColor"/>
      <path d="M24 32c-4 1-6 3-8 1m8 4c4 1 6 3 8 1"/>
    </svg>`
  },
  {
    id: "borage",
    name: "The Starflower",
    lore: "Borage brings always courage to the hearth.",
    dyes: "woad",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 8l3 10h10l-8 6 3 10-8-6-8 6 3-10-8-6h10z"/>
      <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
      <path d="M24 38v4"/>
    </svg>`
  },
  {
    id: "vervain",
    name: "The Enchanter's Herb",
    lore: "Gathered at the dew-fall without iron blade.",
    dyes: "sage",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 42V10"/>
      <path d="M24 30c-4-4-8-2-12 0 3-4 7-4 12 0z"/>
      <path d="M24 24c4-4 8-2 12 0-3-4-7-4-12 0z"/>
      <circle cx="24" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="22" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="26" cy="14" r="1.5" fill="currentColor"/>
    </svg>`
  },
  {
    id: "whetstone",
    name: "The River Hone",
    lore: "Water-smoothed slate to hone the sickle keen.",
    dyes: "iron",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 28L28 12c4-4 8-2 10 0s2 6 0 8L22 36c-4 4-8 2-10 0s-2-6 0-8z"/>
      <line x1="16" y1="28" x2="30" y2="14" stroke-dasharray="2 2"/>
    </svg>`
  },
  {
    id: "ferment",
    name: "The Mother Sponge",
    lore: "The crock that never cools while flour remains.",
    dyes: "ochre",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 20h20v18a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V20z"/>
      <path d="M12 18h24"/>
      <path d="M16 18c0-4 4-6 8-6s8 2 8 6"/>
      <circle cx="20" cy="28" r="1.5" fill="currentColor"/>
      <circle cx="27" cy="26" r="2" fill="currentColor"/>
      <circle cx="22" cy="34" r="1.5" fill="currentColor"/>
    </svg>`
  },
  {
    id: "cricket",
    name: "The Hearth Cricket",
    lore: "Singing on the mantel when good fortune nears.",
    dyes: "sage",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="24" cy="24" rx="8" ry="4" transform="rotate(-20 24 24)"/>
      <path d="M20 27l-6 11m12-9l6 11"/>
      <path d="M28 20l8-8m-10 6l12-4"/>
      <circle cx="28" cy="22" r="1.5" fill="currentColor"/>
    </svg>`
  },
  {
    id: "shuttle",
    name: "The Boxwood Shuttle",
    lore: "Flying swift through flaxen sheds.",
    dyes: "ochre",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 24c8-8 24-8 32 0-8 8-24 8-32 0z"/>
      <ellipse cx="24" cy="24" rx="4" ry="2"/>
      <line x1="24" y1="22" x2="24" y2="26"/>
      <circle cx="12" cy="24" r="1" fill="currentColor"/>
      <circle cx="36" cy="24" r="1" fill="currentColor"/>
    </svg>`
  },
  {
    id: "ember",
    name: "The Peat Ember",
    lore: "Banked in damp turf through the longest night.",
    dyes: "madder",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 34c4-12 12-14 16 0-5 2-11 2-16 0z"/>
      <path d="M20 30c2-6 6-8 8 0"/>
      <path d="M24 16c-2 2-1 4 0 6 1-2 2-4 0-6z" fill="currentColor"/>
      <circle cx="24" cy="26" r="2" fill="currentColor"/>
      <path d="M12 38h24"/>
    </svg>`
  }
];
