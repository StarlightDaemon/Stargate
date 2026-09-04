/**
 * destinations.js — 50 Humble Domestic & Pastoral Destinations
 * Part of Stargate Low Magic ("RUSHLIGHT")
 * Includes all 16 canonical seed destinations plus 34 newly invented hearths,
 * all strictly in the humble folk-magic and cottage register.
 */

window.FOLK_DESTINATIONS = [
  // --- 16 SEED DESTINATIONS ---
  {
    id: "salt-line-hearth",
    name: "The Salt-Line Hearth",
    region: "The Warm Hearthside",
    season: "Winter Solstice",
    lore: "Where coarse bay salt is swept along the flagstone sill each sundown to bar bitter frost.",
    symbols: ["salt", "ember", "cricket", "bellows", "knot", "ash", "kettle"]
  },
  {
    id: "bramblehollow-well",
    name: "Bramblehollow Well",
    region: "Herb Garden & Hedgerows",
    season: "Autumn Equinox",
    lore: "A deep stone cistern shadowed by thick blackberry vines where bent copper pins buy sweet water.",
    symbols: ["well", "bramble", "knot", "shears", "mugwort", "elder", "yarrow"]
  },
  {
    id: "tallow-chandlery",
    name: "The Tallow Chandlery",
    region: "Lofts & Workshops",
    season: "Late Candlemas",
    lore: "Racks of peeled meadow rushes hanging over iron vats of mutton suet and beeswax.",
    symbols: ["rushlight", "kettle", "shears", "honeycomb", "ember", "spindle", "ash"]
  },
  {
    id: "nine-knot-hedge",
    name: "Nine-Knot Hedge",
    region: "Herb Garden & Hedgerows",
    season: "Midsummer Eve",
    lore: "An ancient hawthorn hedgerow tied with nine plaited linen cords to turn away stray tempests.",
    symbols: ["knot", "bramble", "rowan", "vervain", "shears", "elder", "spindle"]
  },
  {
    id: "mothlight-meadow",
    name: "Mothlight Meadow",
    region: "Out-Pastures & Byres",
    season: "Dusk at Lammas",
    lore: "A damp hayfield where pale ghost-moths flutter among flowering wild carrot and yarrow heads.",
    symbols: ["yarrow", "borage", "cricket", "rushlight", "thistle", "knot", "mugwort"]
  },
  {
    id: "drystone-larder",
    name: "The Drystone Larder",
    region: "Pantry & Cellars",
    season: "First Frost",
    lore: "A cool north-facing outbuilding built of mortarless fieldstone, smelling of winter apples and salt rind.",
    symbols: ["drystone", "salt", "mortar", "ferment", "churn", "whetstone", "ash"]
  },
  {
    id: "cellar-pressed-herbs",
    name: "Cellar of Pressed Herbs",
    region: "Pantry & Cellars",
    season: "Late Harvest",
    lore: "Heavy oak boards weighted with slate flags, pressing dried sage, mint, and wormwood into aromatic cakes.",
    symbols: ["mugwort", "yarrow", "vervain", "drystone", "mortar", "borage", "elder"]
  },
  {
    id: "darning-room",
    name: "The Darning Room",
    region: "Lofts & Workshops",
    season: "Martinmas Eve",
    lore: "A low-ceilinged gable where woolen socks are mended upon turned birch darning eggs before a peat fire.",
    symbols: ["spindle", "shears", "quilt", "shuttle", "ember", "cricket", "loom"]
  },
  {
    id: "kettle-black-kitchen",
    name: "Kettle-Black Kitchen",
    region: "The Warm Hearthside",
    season: "All Hallows",
    lore: "Sooted rafters hung with dried onion braids, a cauldron murmuring above white birch coals.",
    symbols: ["kettle", "ember", "bellows", "ash", "salt", "ferment", "cricket"]
  },
  {
    id: "apothecarys-nook",
    name: "The Apothecary's Nook",
    region: "Pantry & Cellars",
    season: "Spring Thaw",
    lore: "Row upon row of earthenware jars holding dried comfrey root, elderberry syrup, and powdered calamus.",
    symbols: ["mortar", "elder", "rowan", "vervain", "borage", "rushlight", "well"]
  },
  {
    id: "rushlight-row",
    name: "Rushlight Row",
    region: "The Warm Hearthside",
    season: "Deep Winter",
    lore: "A lane of stone cottars' porches, each window lit with the humble spark of a tallow-dipped rush.",
    symbols: ["rushlight", "salt", "knot", "ember", "drystone", "ash", "bellows"]
  },
  {
    id: "butter-churn-croft",
    name: "The Butter Churn Croft",
    region: "Out-Pastures & Byres",
    season: "May Morning",
    lore: "Where wooden plunge-churns turn rich clover cream into golden pats stamped with rowan-leaves.",
    symbols: ["churn", "rowan", "salt", "honeycomb", "borage", "knot", "spindle"]
  },
  {
    id: "hollybough-gate",
    name: "Hollybough Gate",
    region: "Herb Garden & Hedgerows",
    season: "Yule Morning",
    lore: "A creaking picket gate crowned with prickly holly to snare the coat-tails of spiteful night-wanderers.",
    symbols: ["thistle", "rowan", "bramble", "elder", "knot", "shears", "drystone"]
  },
  {
    id: "quilted-attic",
    name: "The Quilted Attic",
    region: "Lofts & Workshops",
    season: "Snowbound",
    lore: "Cedar chests piled high with patched goose-down coverlets pieced from Sunday calico scraps.",
    symbols: ["quilt", "shuttle", "loom", "spindle", "shears", "cricket", "rushlight"]
  },
  {
    id: "whetstone-threshold",
    name: "Whetstone Threshold",
    region: "The Warm Hearthside",
    season: "Haying Moon",
    lore: "A doorstep worn smooth by scythe-hones, where blades are oiled before entering the dwelling.",
    symbols: ["whetstone", "shears", "salt", "drystone", "ash", "ember", "bellows"]
  },
  {
    id: "beeswax-pantry",
    name: "The Beeswax Pantry",
    region: "Pantry & Cellars",
    season: "Summer Solstice",
    lore: "Cakes of clarified golden comb wax wrapped in linen, smelling of clover pollen and sun-warm pine.",
    symbols: ["honeycomb", "rushlight", "ferment", "churn", "borage", "knot", "spindle"]
  },

  // --- 34 NEWLY INVENTED DESTINATIONS (ALL IN HUMBLE FOLK-CRAFT REGISTER) ---
  {
    id: "thimble-menders-loft",
    name: "The Thimble-Mender's Loft",
    region: "Lofts & Workshops",
    season: "Late Winter",
    lore: "Dim attic bench with brass punches and leather palms, reshaping pitted silver thimbles.",
    symbols: ["shears", "spindle", "shuttle", "quilt", "knot", "whetstone", "rushlight"]
  },
  {
    id: "ash-grange-bread-oven",
    name: "Ash-Grange Bread Oven",
    region: "The Warm Hearthside",
    season: "Baking Morn",
    lore: "A domed clay bakehouse where round barley loaves bake on flagstones swept with rowan twigs.",
    symbols: ["ferment", "ember", "bellows", "ash", "rowan", "salt", "kettle"]
  },
  {
    id: "willow-basket-weir",
    name: "Willow-Basket Weir",
    region: "Herb Garden & Hedgerows",
    season: "Spring Spate",
    lore: "Coppiced osier withies woven into fish-traps where the mill stream murmurs over slate beds.",
    symbols: ["well", "knot", "bramble", "shears", "drystone", "spindle", "elder"]
  },
  {
    id: "cobblers-awl-bench",
    name: "The Cobbler's Awl Bench",
    region: "Lofts & Workshops",
    season: "Autumn Rains",
    lore: "Currier's oil and birch pegs, resoling heavy field clogs with iron studs and grease.",
    symbols: ["whetstone", "shears", "honeycomb", "knot", "drystone", "rushlight", "ash"]
  },
  {
    id: "elderberry-wash-house",
    name: "Elderberry Wash-House",
    region: "The Warm Hearthside",
    season: "Michaelmas",
    lore: "Vats of wood-ash lye and deep purple elderberry dye steaming under whitewashed rafters.",
    symbols: ["elder", "kettle", "ash", "well", "bellows", "spindle", "mortar"]
  },
  {
    id: "spinning-mule-shed",
    name: "The Spinning-Mule Shed",
    region: "Lofts & Workshops",
    season: "Fleece-Washing Tide",
    lore: "Flocks of washed wool carded with teasels and spun onto willow spools by oil lamp light.",
    symbols: ["spindle", "thistle", "shuttle", "loom", "shears", "knot", "cricket"]
  },
  {
    id: "copper-kettle-scullery",
    name: "Copper-Kettle Scullery",
    region: "The Warm Hearthside",
    season: "Harvest Twilight",
    lore: "A low drain-stone where heavy copper pots are scoured with vinegar and fine river sand.",
    symbols: ["kettle", "salt", "whetstone", "ash", "well", "mortar", "bellows"]
  },
  {
    id: "wool-carders-gable",
    name: "Wool-Carder's Gable",
    region: "Lofts & Workshops",
    season: "First Frost",
    lore: "Racks of dried teasel heads combing tangled fleeces into soft, cloud-white rolags.",
    symbols: ["thistle", "spindle", "shears", "quilt", "cricket", "rushlight", "loom"]
  },
  {
    id: "goose-quill-scriptorium",
    name: "The Goose-Quill Scriptorium",
    region: "Lofts & Workshops",
    season: "Martinmas",
    lore: "Paring knives shaping goose feathers over iron gall ink brewed from oak apples and copperas.",
    symbols: ["shears", "mortar", "rushlight", "ash", "elder", "whetstone", "knot"]
  },
  {
    id: "rowan-twig-byre",
    name: "Rowan-Twig Byre",
    region: "Out-Pastures & Byres",
    season: "Beltane Eve",
    lore: "A low stone cowhouse with rowan crosses bound in red sheep-thread tucked above every lintel.",
    symbols: ["rowan", "knot", "drystone", "churn", "salt", "elder", "thistle"]
  },
  {
    id: "cider-press-yard",
    name: "The Cider-Press Yard",
    region: "Out-Pastures & Byres",
    season: "Late Autumn",
    lore: "Heavy wooden screw-press crushing sour russet apples through straw mats into oak barrels.",
    symbols: ["drystone", "mortar", "ferment", "kettle", "shears", "churn", "whetstone"]
  },
  {
    id: "hearth-cricket-chimney",
    name: "Hearth-Cricket Chimney",
    region: "The Warm Hearthside",
    season: "Deep Winter",
    lore: "Warm mortar crevices beside the chimney breast where black field crickets chirp behind the kettle.",
    symbols: ["cricket", "ember", "ash", "kettle", "bellows", "rushlight", "salt"]
  },
  {
    id: "sourdough-crock-cellar",
    name: "Sourdough Crock Cellar",
    region: "Pantry & Cellars",
    season: "All Seasons",
    lore: "Heavy glazed stoneware pots bubbling with living rye culture that has fed four generations.",
    symbols: ["ferment", "salt", "well", "mortar", "drystone", "ash", "ember"]
  },
  {
    id: "brier-rose-porch",
    name: "The Brier-Rose Porch",
    region: "Herb Garden & Hedgerows",
    season: "Midsummer",
    lore: "An open timber entryway draped with sweetbrier and scarlet rose-hips drying for winter tisanes.",
    symbols: ["bramble", "thistle", "yarrow", "borage", "knot", "well", "shears"]
  },
  {
    id: "flint-steel-shieling",
    name: "Flint-and-Steel Shieling",
    region: "Out-Pastures & Byres",
    season: "High Summer",
    lore: "A summer turf shelter high on the fell, kept dry with charred tinder fungus and struck flint sparks.",
    symbols: ["whetstone", "ember", "bellows", "ash", "drystone", "rushlight", "knot"]
  },
  {
    id: "lavender-drying-beam",
    name: "The Lavender Drying-Beam",
    region: "Lofts & Workshops",
    season: "Harvest Moon",
    lore: "High ceiling tie-beams hung with fragrant blue bundles tied in bleached linen thread.",
    symbols: ["spindle", "shears", "vervain", "borage", "quilt", "knot", "rushlight"]
  },
  {
    id: "pitch-pot-cooperage",
    name: "Pitch-Pot Cooperage",
    region: "Lofts & Workshops",
    season: "Early Spring",
    lore: "Hooping tight oak firkins and sealing the chimes with hot spruce resin and charcoal dust.",
    symbols: ["kettle", "ember", "whetstone", "ash", "shears", "drystone", "bellows"]
  },
  {
    id: "thatch-rafter-roost",
    name: "The Thatch-Rafter Roost",
    region: "Lofts & Workshops",
    season: "Candlemas",
    lore: "Under bundled river reeds and hazel spars where barn swallows nest and dry herbs hang in shadows.",
    symbols: ["rushlight", "spindle", "cricket", "thistle", "knot", "drystone", "quilt"]
  },
  {
    id: "curd-and-whey-dairy",
    name: "Curd-and-Whey Dairy",
    region: "Pantry & Cellars",
    season: "Spring Flush",
    lore: "Cool slate slabs where sheep-milk curds drain in clean muslin cloths into earthen pans.",
    symbols: ["churn", "salt", "ferment", "well", "drystone", "honeycomb", "quilt"]
  },
  {
    id: "herb-wifes-lean-to",
    name: "The Herb-Wife's Lean-To",
    region: "Herb Garden & Hedgerows",
    season: "Late Lammas",
    lore: "A potting shed smelling of damp loam, filled with wicker seed-sieves and drying mugwort bundles.",
    symbols: ["mugwort", "yarrow", "mortar", "shears", "bramble", "vervain", "elder"]
  },
  {
    id: "black-pottery-kiln",
    name: "Black-Pottery Kiln",
    region: "Lofts & Workshops",
    season: "First Frost",
    lore: "A pit-kiln smothered in damp straw and pine needles, turning red clay crocks soot-black and watertight.",
    symbols: ["kettle", "ash", "ember", "bellows", "drystone", "whetstone", "ferment"]
  },
  {
    id: "tallow-dip-shed",
    name: "The Tallow-Dip Shed",
    region: "The Warm Hearthside",
    season: "Martinmas",
    lore: "A lean-to with a long dipping trough where cotton cords are lowered again and again into molten wax.",
    symbols: ["rushlight", "honeycomb", "kettle", "shears", "knot", "ember", "ash"]
  },
  {
    id: "reed-cutters-bothy",
    name: "Reed-Cutter's Bothy",
    region: "Out-Pastures & Byres",
    season: "Winter Freeze",
    lore: "A sod-walled shelter at the marsh edge smelling of drying fen reeds and hot chicory tea.",
    symbols: ["rushlight", "shears", "well", "whetstone", "ember", "drystone", "cricket"]
  },
  {
    id: "braid-makers-parlor",
    name: "The Braid-Maker's Parlor",
    region: "The Warm Hearthside",
    season: "Midwinter",
    lore: "Eight-strand linen braids worked on wooden bobbins weighted with lead sinkers.",
    symbols: ["knot", "spindle", "shuttle", "shears", "loom", "quilt", "cricket"]
  },
  {
    id: "honey-warm-skep-yard",
    name: "Honey-Warm Skep-Yard",
    region: "Herb Garden & Hedgerows",
    season: "Clover Tide",
    lore: "Woven straw bee-skeps sheltered under a stone wall, murmuring peacefully among blue borage blooms.",
    symbols: ["honeycomb", "borage", "yarrow", "drystone", "rushlight", "knot", "cricket"]
  },
  {
    id: "iron-kettle-boathouse",
    name: "The Iron-Kettle Boathouse",
    region: "Out-Pastures & Byres",
    season: "Autumn Mist",
    lore: "Tarred clinker rowing punts pulled onto the shingle, with an iron kettle boiling on stones.",
    symbols: ["kettle", "well", "whetstone", "ember", "knot", "drystone", "ash"]
  },
  {
    id: "clover-hay-loft",
    name: "Clover-Hay Loft",
    region: "Out-Pastures & Byres",
    season: "High Summer",
    lore: "Deep sweet-smelling red clover hay curing beneath shake shingles, warm with afternoon heat.",
    symbols: ["thistle", "cricket", "spindle", "borage", "quilt", "rushlight", "shears"]
  },
  {
    id: "charcoal-burners-hearth",
    name: "The Charcoal-Burner's Hearth",
    region: "The Warm Hearthside",
    season: "Dark of the Moon",
    lore: "A turf-banked mound smoking in the deep woods, distilling hard birch wood into ringing charcoal.",
    symbols: ["ash", "ember", "bellows", "drystone", "kettle", "whetstone", "salt"]
  },
  {
    id: "linen-bleach-green",
    name: "Linen-Bleach Green",
    region: "Out-Pastures & Byres",
    season: "May Dew",
    lore: "Lengths of coarse unbleached flax cloth stretched across dewy grass under the cleansing morning sun.",
    symbols: ["spindle", "loom", "well", "yarrow", "borage", "shuttle", "knot"]
  },
  {
    id: "apple-strig-loft",
    name: "The Apple-Strig Loft",
    region: "Pantry & Cellars",
    season: "Michaelmas Eve",
    lore: "Rows of slatted apple-trays bearing russets, codlins, and pearmains on beds of clean straw.",
    symbols: ["drystone", "honeycomb", "ferment", "mortar", "churn", "shears", "cricket"]
  },
  {
    id: "cobblestone-wash-trough",
    name: "Cobblestone Wash-Trough",
    region: "The Warm Hearthside",
    season: "Monday Morn",
    lore: "A deep stone trough fed by a hillside spout, where heavy bed-linen is beaten with wooden bats.",
    symbols: ["well", "whetstone", "salt", "ash", "shears", "kettle", "drystone"]
  },
  {
    id: "mortar-pestle-niche",
    name: "The Mortar-and-Pestle Niche",
    region: "The Warm Hearthside",
    season: "St. John's Eve",
    lore: "A hollowed granite boulder worn concave, used to powder dry mustard seed and dried nettle leaves.",
    symbols: ["mortar", "thistle", "yarrow", "salt", "drystone", "vervain", "bellows"]
  },
  {
    id: "dried-chanterelle-pantry",
    name: "Dried-Chanterelle Pantry",
    region: "Pantry & Cellars",
    season: "Late Autumn",
    lore: "Hanks of golden wood-mushrooms strung on linen cord drying over the hearth-heat.",
    symbols: ["knot", "spindle", "shears", "ferment", "drystone", "salt", "ember"]
  },
  {
    id: "night-latch-threshold",
    name: "The Night-Latch Threshold",
    region: "The Warm Hearthside",
    season: "Midnight at Midwinter",
    lore: "Heavy oak door dropped into an iron keeper, barred with a rowan peg and a sprinkle of hearth-ash.",
    symbols: ["salt", "ash", "rowan", "knot", "drystone", "whetstone", "ember"]
  }
];
