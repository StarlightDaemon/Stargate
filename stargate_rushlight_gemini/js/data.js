// data.js — Folk runes, herbal botanicals, and 50 low-magic destinations
// Codename: RUSHLIGHT

export const FOLK_RUNES = [
  {
    id: 1,
    name: "Hearth Fire",
    title: "The Kindled Ash",
    element: "Hearth",
    symbol: "M12 2C12 2 15 6 15 9C15 11.5 13.5 13 12 14C10.5 13 9 11.5 9 9C9 6 12 2 12 2ZM8 14C6 16 5 18 5 20C5 23 8 25 12 25C16 25 19 23 19 20C19 18 18 16 16 14C15 16 13.5 17 12 17C10.5 17 9 16 8 14Z",
    path: "M16 4C16 4 20 9 20 13C20 16.5 18 19 16 20C14 19 12 16.5 12 13C12 9 16 4 16 4ZM11 20C8 22.5 7 25 7 27C7 31 11 34 16 34C21 34 25 31 25 27C25 25 24 22.5 21 20C20 22.5 18 24 16 24C14 24 12 22.5 11 20Z",
    description: "Keeps the hearth ember alive through winter frost."
  },
  {
    id: 2,
    name: "Salt Line",
    title: "The Chalk Barrier",
    element: "Threshold",
    path: "M4 16H28M6 12H26M8 20H24M16 7V25M10 16L12 10M22 16L20 22",
    description: "Cold grain scattered across the doorway lintel."
  },
  {
    id: 3,
    name: "Rowan Bough",
    title: "The Warded Berry",
    element: "Hedgerow",
    path: "M6 26C12 22 20 18 26 8M14 21C16 17 21 16 23 18M10 23C8 20 9 17 12 17M20 13C20 10 23 9 25 11M22 23A2.5 2.5 0 1 1 22 18A2.5 2.5 0 1 1 22 23ZM11 15A2 2 0 1 1 11 11A2 2 0 1 1 11 15Z",
    description: "Tied with red wool thread above the barn latch."
  },
  {
    id: 4,
    name: "Needle & Thimble",
    title: "The Darning Stitch",
    element: "Loom",
    path: "M8 26L22 6M21 5L25 9M18 20L20 22M22 6C23 5 25 7 24 8L10 28C9 29 7 29 6 28C5 27 5 25 6 24L18 12M12 22C11 24 12 26 14 26C16 26 17 24 16 22Z",
    description: "Mending torn linen and binding stray wanderers."
  },
  {
    id: 5,
    name: "Whetstone",
    title: "The Honed Scythe",
    element: "Iron",
    path: "M6 22L18 6L26 12L14 28Z M10 21L20 11M9 16L19 22",
    description: "Coarse river grit turning dull iron keen."
  },
  {
    id: 6,
    name: "Woven Knot",
    title: "The Sailor's Hitch",
    element: "Loom",
    path: "M10 16C6 11 12 5 16 9C20 5 26 11 22 16C26 21 20 27 16 23C12 27 6 21 10 16ZM10 16L22 16M16 10L16 22",
    description: "Nine plaited strands holding fast against gales."
  },
  {
    id: 7,
    name: "Besom Broom",
    title: "The Birch Sweeper",
    element: "Hearth",
    path: "M24 6L14 18M14 18L7 27C10 28 15 28 17 23L14 18ZM11 21C14 23 15 25 15 25",
    description: "Sweeps ill-luck and foreign dust from the floorboards."
  },
  {
    id: 8,
    name: "Beeswax Taper",
    title: "The Quiet Flame",
    element: "Hearth",
    path: "M12 14H20V28H12ZM16 14V10M16 6C17.5 8 17.5 9 16 10C14.5 9 14.5 8 16 6ZM10 28H22",
    description: "Drawn sweet from summer clover combs."
  },
  {
    id: 9,
    name: "Cold Iron Nail",
    title: "The Anvil Clasp",
    element: "Iron",
    path: "M11 7H21V10H17V26L15 28L13 26V10H11ZM14 13H18M14 18H18",
    description: "Driven into the threshold oak to bar the uninvited."
  },
  {
    id: 10,
    name: "Kettle-Black",
    title: "The Cast Iron Cauldron",
    element: "Hearth",
    path: "M7 16C7 24 11 27 16 27C21 27 25 24 25 16H7ZM6 16H26M9 16C9 10 12 7 16 7C20 7 23 10 23 16M10 27L8 30M22 27L24 30",
    description: "Seething elderberry broth over peat embers."
  },
  {
    id: 11,
    name: "Barley Sheaf",
    title: "The Harvest Bound",
    element: "Field",
    path: "M16 29V15M16 15C13 11 11 7 11 5M16 15C19 11 21 7 21 5M16 20C12 18 9 15 9 13M16 20C20 18 23 15 23 13M12 21H20",
    description: "Golden ears stacked against the barn gable."
  },
  {
    id: 12,
    name: "Dried Chamomile",
    title: "The Soothing Blossom",
    element: "Herbal",
    path: "M16 16A3 3 0 1 1 16 10A3 3 0 1 1 16 16ZM16 7V3M16 19V23M7 13H3M25 13H29M9 7L6 4M23 7L26 4M9 19L6 22M23 19L26 22M16 23C14 27 11 29 11 29",
    description: "Calms restless babes and troubled wayfarers."
  },
  {
    id: 13,
    name: "Elderberry Umbel",
    title: "The Witch's Tree",
    element: "Hedgerow",
    path: "M16 28V18M16 18L9 12M16 18L23 12M9 12L6 8M9 12L12 8M23 12L20 8M23 12L26 8M6 7A1.5 1.5 0 1 1 6 4A1.5 1.5 0 1 1 6 7ZM12 7A1.5 1.5 0 1 1 12 4A1.5 1.5 0 1 1 12 7ZM20 7A1.5 1.5 0 1 1 20 4A1.5 1.5 0 1 1 20 7ZM26 7A1.5 1.5 0 1 1 26 4A1.5 1.5 0 1 1 26 7Z",
    description: "Never cut elder without asking the Mother's leave."
  },
  {
    id: 14,
    name: "Willow Withe",
    title: "The Flexible Branch",
    element: "Hedgerow",
    path: "M8 26C12 18 12 10 24 6M12 18C15 16 17 18 16 20C15 22 13 21 12 18ZM17 12C20 10 22 12 21 14C20 16 18 15 17 12ZM7 22C9 20 11 22 10 24",
    description: "Bends before winter gales without snapping."
  },
  {
    id: 15,
    name: "Hawthorn Spire",
    title: "The Fairy Thorn",
    element: "Hedgerow",
    path: "M16 28V4M16 10L10 8M16 16L22 14M16 22L11 20M13 5L16 4L19 5M10 7L16 10M22 13L16 16",
    description: "Boundary keeper between cattle ditch and old woods."
  },
  {
    id: 16,
    name: "Goose Quill",
    title: "The Lettered Plume",
    element: "Threshold",
    path: "M7 27C10 25 15 21 19 15C22 10 23 5 23 5C23 5 18 6 13 9C7 13 5 18 5 23L7 27ZM11 21L19 13",
    description: "Dipped in lampblack ink to write cattle receipts."
  },
  {
    id: 17,
    name: "Spindle Dowel",
    title: "The Wool Spindle",
    element: "Loom",
    path: "M16 3V29M10 16C10 13 22 13 22 16C22 19 10 19 10 16ZM12 12L20 20M12 20L20 12",
    description: "Weighted with clay whorl, spinning flax into gold."
  },
  {
    id: 18,
    name: "Clay Crock",
    title: "The Salt Glaze",
    element: "Larder",
    path: "M9 10H23V13H21V26C21 28 19 29 16 29C13 29 11 28 11 26V13H9ZM11 17H21M11 22H21",
    description: "Heavy stoneware keeping pickled eggs and cream cool."
  },
  {
    id: 19,
    name: "Flax Fiber",
    title: "The Unspun Tow",
    element: "Loom",
    path: "M8 27C10 20 14 12 16 5C18 12 22 20 24 27M12 24C14 18 18 18 20 24M10 18C13 14 19 14 22 18",
    description: "Retted in clear brook water and combed through hackles."
  },
  {
    id: 20,
    name: "Rosemary Sprig",
    title: "The Keepsake Herb",
    element: "Herbal",
    path: "M16 28V8M16 22L11 19M16 18L21 15M16 14L10 11M16 10L22 7M15 6L16 4L17 6",
    description: "For remembrance of old covenants and hearth paths."
  },
  {
    id: 21,
    name: "Bay Leaf",
    title: "The Hearth Crown",
    element: "Herbal",
    path: "M16 4C10 10 10 22 16 28C22 22 22 10 16 4ZM16 4V28M12 16L16 13L20 16",
    description: "Burned on tallow embers to sweeten smoke-damp rooms."
  },
  {
    id: 22,
    name: "Yarrow Stalk",
    title: "The Thousand-Leaf",
    element: "Herbal",
    path: "M16 28V12M16 12L9 8M16 12L23 8M7 7H11M21 7H25M16 18L10 15M16 18L22 15M8 14H12M20 14H24",
    description: "Held under pillow to dream of the destined crossing."
  },
  {
    id: 23,
    name: "Mugwort Wreath",
    title: "The Wayfarer's Girdle",
    element: "Herbal",
    path: "M16 5A11 11 0 1 1 15.9 5ZM16 8A8 8 0 1 0 16.1 8ZM12 8L16 5L20 8M12 24L16 27L20 24",
    description: "Tucked inside leather clogs so feet never weary."
  },
  {
    id: 24,
    name: "Chimney Swift",
    title: "The Soot Wing",
    element: "Threshold",
    path: "M16 14C11 9 5 9 3 11C8 14 12 18 16 26C20 18 24 14 29 11C27 9 21 9 16 14ZM16 14V21",
    description: "Nests high in the chimney flue above low hearth fire."
  },
  {
    id: 25,
    name: "Sourdough Starter",
    title: "The Living Sponge",
    element: "Larder",
    path: "M8 12C8 9 11 7 16 7C21 7 24 9 24 12V24C24 27 21 29 16 29C11 29 8 27 8 24ZM12 14A1.5 1.5 0 1 1 12 11A1.5 1.5 0 1 1 12 14ZM18 17A2 2 0 1 1 18 13A2 2 0 1 1 18 17ZM14 22A2.5 2.5 0 1 1 14 17A2.5 2.5 0 1 1 14 22Z",
    description: "Wild yeast fed three generations without failing."
  },
  {
    id: 26,
    name: "Well Bucket",
    title: "The Deep Rope",
    element: "Threshold",
    path: "M9 13H23L21 27H11ZM16 5C11 5 8 9 8 13H24C24 9 21 5 16 5ZM16 2V5M13 19H19",
    description: "Drawn up dripping from the cold limestone belly."
  },
  {
    id: 27,
    name: "Wool Fleece",
    title: "The Greasy Lock",
    element: "Loom",
    path: "M8 20C6 17 7 13 11 12C11 8 16 7 19 10C22 9 26 12 25 16C27 19 25 24 21 24C19 26 13 26 11 23C7 24 6 22 8 20Z",
    description: "Warm lanolin fleece clipped before shearing rains."
  },
  {
    id: 28,
    name: "Copper Token",
    title: "The Crooked Penny",
    element: "Iron",
    path: "M16 6A10 10 0 1 1 15.9 6ZM13 13H19M16 13V20M14 20H18",
    description: "Carried in pocket with hole drilled for cord."
  },
  {
    id: 29,
    name: "Oak Gall",
    title: "The Ink Apple",
    element: "Hedgerow",
    path: "M16 8C11 8 8 12 8 17C8 23 12 27 16 27C20 27 24 23 24 17C24 12 21 8 16 8ZM16 4V8M13 14C14 15 15 15 16 14C17 13 18 13 19 14",
    description: "Crushed with copperas to brew indelible black ink."
  },
  {
    id: 30,
    name: "Thistle Burr",
    title: "The Prickly Watch",
    element: "Field",
    path: "M16 28V18M11 18C11 14 21 14 21 18C21 22 11 22 11 18ZM16 14L16 6M13 9L19 11M19 9L13 11M8 18H24M10 24L16 18L22 24",
    description: "Clings to wool hems and guards pasture fence-posts."
  },
  {
    id: 31,
    name: "Lavender Wand",
    title: "The Ribboned Stalk",
    element: "Herbal",
    path: "M16 29V17M13 7C13 5 19 5 19 7C19 9 13 9 13 7ZM12 11C12 9 20 9 20 11C20 13 12 13 12 11ZM13 15C13 13 19 13 19 15C19 17 13 17 13 15ZM14 21L18 23M18 21L14 23",
    description: "Tucked into chest of drawers to keep moth caterpillars off."
  },
  {
    id: 32,
    name: "Butter Churn",
    title: "The Plunging Dash",
    element: "Larder",
    path: "M11 13H21L23 28H9ZM16 3V13M13 6H19M12 19H20M13 24H19",
    description: "Turn cream to gold when sweet charms are sung."
  },
  {
    id: 33,
    name: "Four-Leaf Clover",
    title: "The Meadow Boon",
    element: "Field",
    path: "M16 28C15 22 16 17 16 16M16 16C12 16 10 12 12 10C14 8 16 12 16 16ZM16 16C16 12 20 10 22 12C24 14 20 16 16 16ZM16 16C20 16 22 20 20 22C18 24 16 20 16 16ZM16 16C16 20 12 22 10 20C8 18 12 16 16 16Z",
    description: "Found beneath the dew on Midsummer morning."
  },
  {
    id: 34,
    name: "Moth Wing",
    title: "The Pale Flutter",
    element: "Threshold",
    path: "M16 17L9 8C6 11 7 17 12 19L16 17ZM16 17L23 8C26 11 25 17 20 19L16 17ZM16 17L10 23C12 26 16 24 16 20ZM16 17L22 23C20 26 16 24 16 20Z",
    description: "Drawn to the rushlight flame through open latches."
  },
  {
    id: 35,
    name: "Peat Clod",
    title: "The Bog Smolder",
    element: "Hearth",
    path: "M7 21L12 13H20L25 21L19 27H13ZM12 13L15 21L13 27M20 13L17 21L19 27",
    description: "Dug from ancient marsh to burn slow all evening."
  },
  {
    id: 36,
    name: "Rushlight Wick",
    title: "The Humble Pith",
    element: "Hearth",
    path: "M16 29C15 23 17 17 16 11M16 11C18 10 19 8 17 5C15 3 14 6 16 11ZM12 23L20 21M13 18L19 17",
    description: "Meadow rush stripped to pith, dipped in sheep tallow."
  }
];

// Complete catalog of 50 destinations:
// 16 seed destinations from prompt + 34 expanded destinations in exact same humble pastoral register
export const DESTINATIONS = [
  // SEED DESTINATIONS (16)
  {
    id: 1,
    name: "The Salt-Line Hearth",
    category: "Hearth & Loom",
    address: [2, 1, 9, 36, 7, 24, 10],
    herb: "Rock Salt & Rowan Bark",
    distance: "4 Paces Inside the Lintels",
    lore: "Where the hearthstones are swept white each dusk with dry salt to turn back wandering chill."
  },
  {
    id: 2,
    name: "Bramblehollow Well",
    category: "Field & Hedgerow",
    address: [26, 15, 30, 14, 2, 12, 13],
    herb: "Wild Briar & Deep Moss",
    distance: "12 Leagues West Along the Beck",
    lore: "An ancient field-well choked with blackberry thorns whose cold water tastes of iron and rain."
  },
  {
    id: 3,
    name: "The Tallow Chandlery",
    category: "Workshop",
    address: [36, 8, 1, 32, 18, 5, 28],
    herb: "Mutton Fat & Thyme Flower",
    distance: "3 Leagues Down Tanner's Lane",
    lore: "Racks of drying rushlights smelling faintly of sheep grease and sweet bay leaves."
  },
  {
    id: 4,
    name: "Nine-Knot Hedge",
    category: "Field & Hedgerow",
    address: [6, 15, 3, 14, 23, 30, 20],
    herb: "Entwined Hazel & Blackthorn",
    distance: "7 Leagues North by the Parish Ditch",
    lore: "A quickset boundary where nine hawthorn twigs were knotted together to keep stray cattle home."
  },
  {
    id: 5,
    name: "Mothlight Meadow",
    category: "Field & Hedgerow",
    address: [34, 33, 12, 31, 8, 16, 27],
    herb: "Evening Primrose & Clover",
    distance: "18 Leagues Southeast",
    lore: "A low haymeadow where hundreds of pale moths gather when the dusk church bells fall silent."
  },
  {
    id: 6,
    name: "The Drystone Larder",
    category: "Larder & Pantry",
    address: [18, 5, 2, 25, 35, 9, 1],
    herb: "Dried Sage & Saltpetre",
    distance: "Under the Northern Hill Bank",
    lore: "Built without mortar into damp slate; cheeses and cured hams hang safe from summer heat."
  },
  {
    id: 7,
    name: "Cellar of Pressed Herbs",
    category: "Larder & Pantry",
    address: [12, 20, 22, 31, 21, 16, 29],
    herb: "Yarrow Stalks & Chamomile Heads",
    distance: "Beneath the Vicar's Barn",
    lore: "Oak rafters strung dense with drying boughs of rosemary, feverfew, and marsh mallow."
  },
  {
    id: 8,
    name: "The Darning Room",
    category: "Hearth & Loom",
    address: [4, 19, 17, 27, 6, 8, 36],
    herb: "Spun Wool Oil & Lavender Sprig",
    distance: "Second Floor Attic Gable",
    lore: "Where worn socks and moth-eaten blankets are mended by the thin glow of an oil rushlight."
  },
  {
    id: 9,
    name: "Kettle-Black Kitchen",
    category: "Cottage",
    address: [10, 1, 7, 25, 18, 35, 9],
    herb: "Wood-Ash & Peppermint Leaves",
    distance: "Crossroads Past the Miller's Bridge",
    lore: "A soot-caked hearth where an iron kettle boils endlessly over slow-burning turf clods."
  },
  {
    id: 10,
    name: "The Apothecary's Nook",
    category: "Workshop",
    address: [22, 29, 16, 13, 21, 12, 28],
    herb: "Crushed Oak Gall & Wormwood",
    distance: "Corner of Market Garth",
    lore: "Rows of unlabelled green glass vials holding salves for sprains and tinctures for night coughs."
  },
  {
    id: 11,
    name: "Rushlight Row",
    category: "Cottage",
    address: [36, 1, 24, 7, 2, 8, 19],
    herb: "Meadow Rush & Mutton Tallow",
    distance: "Five Thatched Cottages by the Pond",
    lore: "A lane of humble dwellings where neither wax nor whale oil was ever burned."
  },
  {
    id: 12,
    name: "The Butter Churn Croft",
    category: "Larder & Pantry",
    address: [32, 25, 27, 18, 33, 11, 1],
    herb: "Sweet Clover & Marigold Petals",
    distance: "High Pasture Gate",
    lore: "Where the wooden dash goes up and down until buttermilk parts from yellow curd."
  },
  {
    id: 13,
    name: "Hollybough Gate",
    category: "Field & Hedgerow",
    address: [3, 15, 9, 2, 6, 24, 35],
    herb: "Prickly Holly & Red Ribbon",
    distance: "Edge of the Parish Forest",
    lore: "A low wooden stile crowned with winter greens to keep the wood-sprites from wandering in."
  },
  {
    id: 14,
    name: "The Quilted Attic",
    category: "Hearth & Loom",
    address: [4, 6, 27, 19, 17, 34, 8],
    herb: "Cedar Shavings & Dried Lavender",
    distance: "Under the Rye-Straw Thatch",
    lore: "Piled high with pieced calico quilts stitched together by three generations of sisters."
  },
  {
    id: 15,
    name: "Whetstone Threshold",
    category: "Cottage",
    address: [5, 9, 2, 1, 10, 28, 7],
    herb: "Cold Iron Slag & Ground Flint",
    distance: "Front Flagstones of the Smithy",
    lore: "A sandstone sill grooved hollow by fifty years of scythes sharpened on the way to mowing."
  },
  {
    id: 16,
    name: "The Beeswax Pantry",
    category: "Larder & Pantry",
    address: [8, 33, 18, 11, 21, 3, 25],
    herb: "Honeycomb & Dried Lemon Thyme",
    distance: "North Window of the Dairy",
    lore: "Jars of clover honey sealed with beeswax discs, catching the low morning light."
  },

  // EXPANDED FOLK-CRAFT DESTINATIONS (34)
  {
    id: 17,
    name: "Elderberry Scarp",
    category: "Field & Hedgerow",
    address: [13, 22, 14, 30, 3, 35, 26],
    herb: "Ripe Elderberry & Woodfern",
    distance: "8 Leagues Above the Chalk Quarry",
    lore: "A steep bank of elder bushes whose dark clusters stain the sheep trails purple in autumn."
  },
  {
    id: 18,
    name: "Thimble & Thistle Fold",
    category: "Field & Hedgerow",
    address: [4, 30, 27, 11, 6, 17, 28],
    herb: "Carded Wool & Purple Thistle",
    distance: "High Moor Sheep Pen",
    lore: "Where shepherds mend their woollen smocks while counting yearling ewes into the hurdles."
  },
  {
    id: 19,
    name: "The Copper Washhouse",
    category: "Workshop",
    address: [28, 10, 1, 26, 7, 18, 19],
    herb: "Lye Soap & Rosemary Rinse",
    distance: "Behind the Village Bakehouse",
    lore: "Steam rises from the great copper vat as heavy linen sheets are beaten with wooden paddles."
  },
  {
    id: 20,
    name: "Willow-Withe Byre",
    category: "Cottage",
    address: [14, 27, 11, 6, 2, 9, 1],
    herb: "Green Willow & Sweet Hay",
    distance: "Water-Meadow Cow Shed",
    lore: "Cattle pens woven from supple river withies, keeping the milk cows sheltered from damp mist."
  },
  {
    id: 21,
    name: "Goose-Feather Loft",
    category: "Hearth & Loom",
    address: [16, 27, 4, 34, 8, 19, 6],
    herb: "Goose Down & Dried Rue",
    distance: "Above the Wagon Shed",
    lore: "Bags of plucked goose down curing in drafty rafters before being sewn into bridal ticks."
  },
  {
    id: 22,
    name: "The Chimney-Sweep's Hearth",
    category: "Cottage",
    address: [24, 7, 1, 9, 35, 10, 36],
    herb: "Soot & Dried Birch Twigs",
    distance: "Dead-End Lane Behind the Smithy",
    lore: "Where birch besoms and scrapers lean against soot-darkened brick walls."
  },
  {
    id: 23,
    name: "Cobblestone Bakehouse",
    category: "Cottage",
    address: [25, 1, 18, 11, 5, 26, 32],
    herb: "Rye Crust & Roasted Caraway",
    distance: "Opposite the Parish Cross",
    lore: "The village brick oven where sourdough loaves are baked on hot flat tiles every dawn."
  },
  {
    id: 24,
    name: "Rowan-Branch Stile",
    category: "Field & Hedgerow",
    address: [3, 2, 15, 6, 23, 20, 9],
    herb: "Rowan Bark & Red Yarn",
    distance: "Footpath to Nethercote",
    lore: "Two stone steps over a mossy wall, shaded by a rowan tree whose berries protect walkers."
  },
  {
    id: 25,
    name: "The Flax-Break Shed",
    category: "Workshop",
    address: [19, 17, 4, 5, 27, 11, 36],
    herb: "Dry Flax Straw & Linseed Oil",
    distance: "Beside the Retting Brook",
    lore: "Heavy oak mallets crushing dry flax stems to release the fine linen fibers within."
  },
  {
    id: 26,
    name: "Hazel-Wand Orchard",
    category: "Field & Hedgerow",
    address: [14, 22, 33, 13, 3, 26, 6],
    herb: "Green Hazel & Lichen",
    distance: "10 Leagues East Along the Ridge",
    lore: "Coppiced hazel poles cut for basket ribs and divining rods when the sap is quiet."
  },
  {
    id: 27,
    name: "The Porridge-Pot Inglenook",
    category: "Cottage",
    address: [10, 1, 11, 18, 2, 7, 36],
    herb: "Oatmeal & Bay Leaf",
    distance: "Inside the Keeper's Lodge",
    lore: "A deep hearth bench carved into chimney stone where oatmeal simmers in the dark."
  },
  {
    id: 28,
    name: "Sheep-Fleece Drying Yard",
    category: "Field & Hedgerow",
    address: [27, 19, 17, 33, 4, 30, 2],
    herb: "Raw Wool & Sweet Gale",
    distance: "River Bank Below the Mill",
    lore: "Scoured sheep fleeces spread over gorse bushes to dry in the afternoon wind."
  },
  {
    id: 29,
    name: "The Spindle-Tree Bower",
    category: "Field & Hedgerow",
    address: [17, 4, 6, 14, 13, 20, 8],
    herb: "Spindle Wood & Pink Calyx",
    distance: "Sunny Copse Above the Wash",
    lore: "Hard white spindle-wood trees whose wood is turned into fine smooth drop-spindles."
  },
  {
    id: 30,
    name: "Patchwork Quilt Hayrick",
    category: "Field & Hedgerow",
    address: [4, 11, 6, 27, 33, 34, 1],
    herb: "Meadow Grass & Calico Scrap",
    distance: "South End of Lower Meadow",
    lore: "A thatched stack covered with oiled canvas, smelling of dry clover and sun-cured fescue."
  },
  {
    id: 31,
    name: "The Iron-Kettle Wellhead",
    category: "Threshold",
    address: [26, 10, 9, 2, 5, 18, 1],
    herb: "Cold Iron & Water Mint",
    distance: "Center of the Commons",
    lore: "A cracked iron cauldron sits inverted over the well curb to catch morning condensation."
  },
  {
    id: 32,
    name: "Rosemary Border Garth",
    category: "Field & Hedgerow",
    address: [20, 12, 31, 21, 33, 8, 2],
    herb: "Stiff Rosemary & Woodruff",
    distance: "Garden Path to the Croft",
    lore: "A dense hedge of blue-flowered rosemary that brushing skirts release into fragrant clouds."
  },
  {
    id: 33,
    name: "Ash-Heap Turnip Cellar",
    category: "Larder & Pantry",
    address: [35, 18, 1, 2, 9, 7, 25],
    herb: "Hard Turnip & Sifted Wood-Ash",
    distance: "Dug into the Kitchen Embankment",
    lore: "Winter roots buried in dry wood-ash so they neither rot nor sprout before Candlemas."
  },
  {
    id: 34,
    name: "Lavender Linen Press",
    category: "Larder & Pantry",
    address: [31, 19, 4, 8, 27, 16, 21],
    herb: "Lavender Buds & Orris Root",
    distance: "Hallway Oak Cupboard",
    lore: "Heavy carved press holding folded sheets smoothed with river-stone flatirons."
  },
  {
    id: 35,
    name: "The Curd-Press Dairy",
    category: "Larder & Pantry",
    address: [32, 18, 27, 25, 2, 5, 28],
    herb: "Rennet & Nettle Tops",
    distance: "Cold Stone Annex by the Spring",
    lore: "Where weighted oak screws squeeze whey from cheese curds wrapped in bleached muslin."
  },
  {
    id: 36,
    name: "Thistle-Down Weaver",
    category: "Hearth & Loom",
    address: [30, 4, 19, 17, 34, 14, 8],
    herb: "Thistle Fluff & Spun Flax",
    distance: "Cottage Under the Crag",
    lore: "A loom that weaves gossamer shawls light as thistle seed adrift on autumn breezes."
  },
  {
    id: 37,
    name: "Apple-Wood Smokehouse",
    category: "Workshop",
    address: [35, 1, 10, 18, 21, 7, 29],
    herb: "Applewood Chips & Rosemary Smoke",
    distance: "Behind the Cider Mill",
    lore: "A low stone chimney where sides of bacon cure in sweet smoldering orchard trimmings."
  },
  {
    id: 38,
    name: "The Straw-Boss Hive",
    category: "Field & Hedgerow",
    address: [8, 11, 33, 12, 23, 20, 28],
    herb: "Beeswax & Borage Blossoms",
    distance: "Sheltered Orchard Nook",
    lore: "Six straw skeps buzzing softly in the summer heat, their honey redolent of apple blossom."
  },
  {
    id: 39,
    name: "Clover-Knot Pasture",
    category: "Field & Hedgerow",
    address: [33, 6, 27, 11, 14, 3, 2],
    herb: "Red Clover & Eyebright",
    distance: "Pasture Above the Weir",
    lore: "Where milk calves lie in deep clover braided together by wandering hedgerow spirits."
  },
  {
    id: 40,
    name: "Hawthorn Ditch",
    category: "Field & Hedgerow",
    address: [15, 30, 13, 2, 9, 26, 35],
    herb: "Hawthorn May & Stagnant Sedge",
    distance: "Boundary Line of Old Manor",
    lore: "A deep sunken lane lined with gnarled thorns whose white May blossoms smell of old secrets."
  },
  {
    id: 41,
    name: "The Broom-Tier's Lean-to",
    category: "Workshop",
    address: [7, 14, 19, 6, 5, 27, 36],
    herb: "Birch Twigs & Split Willow",
    distance: "Edge of the Peat Common",
    lore: "Bunches of stiff birch twigs bound around ash staves with supple willow bark."
  },
  {
    id: 42,
    name: "Sourdough Crock Larder",
    category: "Larder & Pantry",
    address: [25, 18, 11, 1, 10, 2, 28],
    herb: "Fermented Sponge & Bran Flour",
    distance: "Damp Corner of Pantry Shelf",
    lore: "A brown salt-glaze crock bubbling steadily with sour dough brought from the old country."
  },
  {
    id: 43,
    name: "The Clay-Pipe Kiln",
    category: "Workshop",
    address: [18, 1, 35, 5, 9, 29, 24],
    herb: "White Ball Clay & Bog Peat",
    distance: "Down the Marsh Cut",
    lore: "Where long-stemmed tavern pipes are fired white inside small charcoal clamps."
  },
  {
    id: 44,
    name: "Blackberry Briar Copse",
    category: "Field & Hedgerow",
    address: [30, 15, 13, 26, 6, 22, 14],
    herb: "Blackberry Canes & Bracken",
    distance: "Hollow Way to the Ford",
    lore: "An impenetrable tangle where late autumn berries soften after the first frost."
  },
  {
    id: 45,
    name: "Burlap Sack Mill",
    category: "Workshop",
    address: [19, 11, 4, 17, 28, 5, 36],
    herb: "Coarse Hemp & Tar Twine",
    distance: "Beside the Lower Sluice",
    lore: "The steady clatter of wooden shuttles weaving heavy sacks for grain and seed potatoes."
  },
  {
    id: 46,
    name: "The Herb-Hanging Rafters",
    category: "Larder & Pantry",
    address: [12, 20, 21, 22, 31, 23, 3],
    herb: "Mullein Leaves & St. John's Wort",
    distance: "Kitchen Ceiling Above Range",
    lore: "So dense with dried herbs that anyone entering bows their head under sweet sage boughs."
  },
  {
    id: 47,
    name: "Oak-Galls Tannery",
    category: "Workshop",
    address: [29, 26, 5, 9, 18, 16, 35],
    herb: "Oak Bark & Tan-Yard Brine",
    distance: "Downwind Below the Millpond",
    lore: "Deep pits lined with oak boards where cowhides soak in dark brown gall liquor."
  },
  {
    id: 48,
    name: "Peat-Fire Ingle",
    category: "Cottage",
    address: [35, 1, 10, 7, 2, 24, 36],
    herb: "Black Bog Peat & Dry Heather",
    distance: "Highland Herd Cottage",
    lore: "A hearth that hasn't gone cold in eighty years, banked each night with damp turf."
  },
  {
    id: 49,
    name: "Willow-Basket Weir",
    category: "Field & Hedgerow",
    address: [14, 26, 6, 28, 5, 2, 33],
    herb: "Peeled Osier & River Silt",
    distance: "Bendy Reach of the Trout Beck",
    lore: "Conical fish traps woven of yellow osier anchored into the river gravel with ash stakes."
  },
  {
    id: 50,
    name: "The Chamomile Threshold",
    category: "Cottage",
    address: [12, 2, 1, 20, 9, 36, 8],
    herb: "Sweet Chamomile & White Chalk",
    distance: "Front Steps of the Herb Wife's Cottage",
    lore: "Chamomile planted between flagstones so every footstep releases sweet calming apple scent."
  }
];
