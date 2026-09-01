// PERPETUA — data.js
// All content is fictional flavor for a decorative novelty page.
'use strict';

// ---------------------------------------------------------------------------
// THE TWELVE CARDINAL INDICES
// Each index is one punched card in the working tray. Eight of the twelve,
// fed in order, constitute a traversal concordance. Glyphs are drawn as plain
// line-work in a 24x24 box (stroke only, no fills beyond dots).
// ---------------------------------------------------------------------------
const INDICES = [
  { id: 'QUOIN',   n: 1,  glyph: 'M4 20 L12 4 L20 20 M8 14 H16' },
  { id: 'TRIVET',  n: 2,  glyph: 'M12 4 V12 M5 20 L12 12 L19 20 M5 20 H19' },
  { id: 'LIMEN',   n: 3,  glyph: 'M5 20 V6 H19 V20 M9 20 V12 H15 V20' },
  { id: 'WARD',    n: 4,  glyph: 'M12 3 L21 8 V16 L12 21 L3 16 V8 Z M12 9 V15' },
  { id: 'FUSEE',   n: 5,  glyph: 'M4 19 Q12 17 12 12 Q12 7 20 5 M4 15 Q10 14 10 10 M8 21 Q14 19 14 13' },
  { id: 'LANTERN', n: 6,  glyph: 'M8 4 H16 M8 20 H16 M9 4 V20 M15 4 V20 M12 4 V20 M9 9 H15 M9 15 H15' },
  { id: 'DETENT',  n: 7,  glyph: 'M4 12 H14 M14 6 V18 M14 12 L20 8 M14 12 L20 16' },
  { id: 'ARBOR',   n: 8,  glyph: 'M12 3 V21 M6 7 H18 M8 12 H16 M10 17 H14' },
  { id: 'PALLET',  n: 9,  glyph: 'M4 18 L12 6 L20 18 M4 18 Q12 12 20 18' },
  { id: 'VERGE',   n: 10, glyph: 'M12 3 V21 M12 8 L5 14 M12 8 L19 14 M7 19 H17' },
  { id: 'SNAIL',   n: 11, glyph: 'M12 12 m0 -1 a1 1 0 1 1 -0.1 0 M12 12 Q17 12 17 8 Q17 4 12 4 Q5 4 5 11 Q5 19 13 20' },
  { id: 'QUERN',   n: 12, glyph: 'M12 12 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M12 4 V8 M12 16 V20 M4 12 H8 M16 12 H20' }
];

// Address length and store geometry — see README/report for reasoning.
const ADDRESS_LEN = 8;      // eight coordinate cards per concordance
const COLUMNS = 10;         // 8 coordinate wheels + carriage-check + residual

// ---------------------------------------------------------------------------
// THE FOLIO RACK — punched card trains kept ready at the engine.
// tier: 'attested' (proved by the Bureau, run at governor speed with the
// proving-pawl lifted) or 'provisional' (unproved hand workings).
// ---------------------------------------------------------------------------
const RACK = [
  { folio: 'F-217', name: 'THE GRANARY STAIR', tier: 'attested',
    seq: ['QUOIN','LANTERN','FUSEE','WARD','PALLET','LIMEN','ARBOR','VERGE'],
    note: 'First attested concordance. Struck 214 times without variance.' },
  { folio: 'F-224', name: 'LANTHORN DEEP', tier: 'attested',
    seq: ['TRIVET','DETENT','QUERN','ARBOR','LIMEN','SNAIL','QUOIN','FUSEE'],
    note: 'Attested 1871. Cold draught at the frame; wheels run dry.' },
  { folio: 'F-231', name: 'THE COUNTING ORCHARD', tier: 'attested',
    seq: ['VERGE','ARBOR','WARD','QUOIN','SNAIL','LANTERN','PALLET','TRIVET'],
    note: 'Attested 1874 after the carriage repair of F-229.' },
  { folio: 'F-240', name: 'NINE CHIMNEYS', tier: 'attested',
    seq: ['PALLET','QUERN','LIMEN','VERGE','DETENT','WARD','FUSEE','LANTERN'],
    note: 'The Bureau’s longest sustained opening: six hours, eleven minutes.' },
  { folio: 'F-252', name: 'THE PAPER MERIDIAN', tier: 'provisional',
    seq: ['SNAIL','QUOIN','VERGE','LIMEN','QUERN','PALLET','TRIVET','DETENT'],
    note: 'Hand working of Miss Ferris, unproved. Residual settles slow.' },
  { folio: 'F-255', name: 'WHITLOW BENCH', tier: 'provisional',
    seq: ['ARBOR','FUSEE','SNAIL','DETENT','WARD','TRIVET','LANTERN','QUERN'],
    note: 'Provisional; disputed by the Comptroller. Run at your own account.' },
  { folio: 'F-261', name: 'THE ORRERY YARD', tier: 'provisional',
    seq: ['LIMEN','WARD','TRIVET','SNAIL','FUSEE','VERGE','QUERN','ARBOR'],
    note: 'Fresh punching, once opened, never re-proved. Keep the hold handy.' }
];

// ---------------------------------------------------------------------------
// THE ARCHIVE — the Bureau's concordance workings, folio by folio.
// Cross-references are written [[F-xxx]] and rendered as links.
// ---------------------------------------------------------------------------
const ARCHIVE = [
  { folio: 'F-001', title: 'On the Correspondence Problem, first statement', date: '1859',
    by: 'Prof. I. Aldercroft', status: 'memorandum',
    body: 'The founding memorandum. States the Correspondence Problem: that an address of eight cardinal indices, carried through the store with anticipation, admits of exact proof when the residual wheel is driven to nought. All later workings descend from this sheet; see [[F-004]] for the first mechanical trial and [[F-019]] for the corrected carriage law.' },
  { folio: 'F-004', title: 'First trial of Engine No. 1 — no proof obtained', date: '1861',
    by: 'Prof. I. Aldercroft', status: 'withdrawn',
    body: 'Engine No. 1 stalled at the fifth column; the carriage anticipated wrongly and the residual diverged. Withdrawn. The fault is analysed in [[F-006]] and the remedy adopted in [[F-019]]. Preserved as a caution against running unproved trains at speed — the origin of the Proving Hold.' },
  { folio: 'F-006', title: 'Analysis of the fifth-column stall', date: '1861',
    by: 'J. Marlowe, mill-wright', status: 'memorandum',
    body: 'Traces the stall of [[F-004]] to a warped detent on wheel five. Marlowe’s tables of tooth engagement are still posted at the governor. Superseded in method by [[F-019]] but not in substance.' },
  { folio: 'F-011', title: 'The twelve cardinal indices settled', date: '1863',
    by: 'Bureau in committee', status: 'canonical',
    body: 'Fixes the working tray at twelve indices — QUOIN through QUERN — and the address at eight cards drawn without repetition. The committee minutes record Prof. Aldercroft’s remark that "eight wheels prove; nine flatter; seven guess." Cited by every attested folio; see [[F-217]].' },
  { folio: 'F-014', title: 'On punching and the Jacquard precedent', date: '1863',
    by: 'Miss C. Ferris, punch-room', status: 'memorandum',
    body: 'Adapts the loom-card precedent to the Bureau’s reader: five ranks of three stations, one card per index, the pattern read edgewise as the card feeds. The punch-room’s proofing rules descend from this sheet; see [[F-229]] for their revision after the carriage repair.' },
  { folio: 'F-019', title: 'The corrected law of anticipation', date: '1864',
    by: 'Prof. I. Aldercroft', status: 'canonical',
    body: 'Replaces the carriage law of [[F-001]] §4 after the failure recorded in [[F-004]]. The anticipating carriage now borrows before it carries, and the residual converges from above. Every proof since 1864 rests on this folio. Disputed once, unsuccessfully, in [[F-146]].' },
  { folio: 'F-023', title: 'First proved concordance (bench proof only)', date: '1865',
    by: 'J. Marlowe', status: 'memorandum',
    body: 'The residual reached nought on the bench engine, hand-cranked, in four hours. No aperture then existed to open; the frame was fitted two years later, see [[F-041]]. Derived from the law of [[F-019]].' },
  { folio: 'F-041', title: 'The Aperture frame fitted to Engine No. 2', date: '1867',
    by: 'Bureau of Works', status: 'canonical',
    body: 'Records the fitting of the first Aperture frame within the store wheel, and the observation — unlooked-for — that a proved concordance, executed under steam, opens it. The Bureau’s purpose changed in one afternoon. See [[F-044]] for the first opening and [[F-052]] for the closure protocol.' },
  { folio: 'F-044', title: 'First opening — THE GRANARY STAIR', date: '1867',
    by: 'Prof. I. Aldercroft', status: 'attested',
    body: 'The concordance later racked as [[F-217]] first proved under steam this day. The bell was struck by hand, there being then no proving bell; the automatic strike was fitted per [[F-048]]. Fourteen minutes open. Nothing came through but cold air and the smell of wet stone.' },
  { folio: 'F-048', title: 'On the proving bell', date: '1868',
    by: 'J. Marlowe', status: 'canonical',
    body: 'Specifies the bell struck by the mill at the instant of proof — one blow, low G, so that the whole Bureau knows the residual stands at nought. Ordered after the confusion of [[F-044]]. The strike is taken off the residual wheel’s own detent.' },
  { folio: 'F-052', title: 'Closure protocol — the disengage lever', date: '1868',
    by: 'Bureau in committee', status: 'canonical',
    body: 'Establishes that the disengage lever shall be answerable at every state of the engine — setting, run-up, or open frame — and shall spill steam, clear the store, and close the frame in one throw. Written after the six-hour opening of [[F-240]] outran the boiler watch.' },
  { folio: 'F-063', title: 'On the residual wheel and the meaning of nought', date: '1869',
    by: 'Prof. I. Aldercroft', status: 'memorandum',
    body: 'A quieter sheet. Argues the residual is not a remainder but a distance — the engine measures how far a place is from being named exactly, and the Aperture opens when that distance is spent. Much quoted, never disputed. See [[F-063a]] for Miss Ferris’s marginal reply.' },
  { folio: 'F-063a', title: 'Marginal reply to F-063', date: '1869',
    by: 'Miss C. Ferris', status: 'memorandum',
    body: 'Three lines in pencil on the verso of [[F-063]], preserved by order of the Comptroller: "Then the engine does not open doors. It finishes sentences." The Bureau has never improved on this.' },
  { folio: 'F-071', title: 'LANTHORN DEEP — proving working', date: '1871',
    by: 'A. Okonkwo, computer', status: 'attested',
    body: 'The full hand working for the train racked at [[F-224]]. Eighty-one sheets, checked twice. Notable for the cold draught at the frame, logged at every opening since; see the day-book extracts in [[F-118]].' },
  { folio: 'F-085', title: 'On running attested trains at governor speed', date: '1872',
    by: 'J. Marlowe', status: 'canonical',
    body: 'Authorises the folio rack: a train already proved by hand may be re-fed by the mechanism at governor speed, the proving-pawl lifted, each card still read in order. Speed is earned by proof, not granted by impatience. The rack’s discipline descends from [[F-004]]’s caution. Amended by [[F-229]].' },
  { folio: 'F-092', title: 'THE COUNTING ORCHARD — first working', date: '1873',
    by: 'A. Okonkwo', status: 'superseded',
    body: 'First working of the train later racked as [[F-231]]. Superseded by [[F-101]] after the carriage fault of 1874 was found to have shadowed three columns. Retained for the orchard survey pasted at sheet nine.' },
  { folio: 'F-101', title: 'THE COUNTING ORCHARD — corrected working', date: '1874',
    by: 'A. Okonkwo', status: 'attested',
    body: 'Supersedes [[F-092]]; incorporates the carriage repair of [[F-229]]. Proved and attested. The orchard is real, walled, and counts itself: the trees stand in difference rows. The Bureau declines to explain this further.' },
  { folio: 'F-118', title: 'Day-book extracts — the cold draught', date: '1871–1876',
    by: 'sundry hands', status: 'memorandum',
    body: 'Collected observations at openings of [[F-224]]: the draught is steady, northerly with respect to the frame, and smells of tallow. Referenced by [[F-071]]. Bound with the day-book rules that govern this very engine’s session log.' },
  { folio: 'F-131', title: 'NINE CHIMNEYS — proving working', date: '1877',
    by: 'Miss C. Ferris', status: 'attested',
    body: 'The working for [[F-240]]. Ferris’s short method — proving the check column first — halved the sheets of [[F-071]]. Adopted Bureau-wide by [[F-133]]. The six-hour opening that followed occasioned the closure protocol amendments in [[F-052]].' },
  { folio: 'F-133', title: 'Adoption of the Ferris short method', date: '1877',
    by: 'Bureau in committee', status: 'canonical',
    body: 'Adopts the check-column-first method of [[F-131]] for all future workings. Marlowe dissenting, on the ground that "a proof should be dull." Overruled. See [[F-146]] for the one serious challenge to the method.' },
  { folio: 'F-146', title: 'Challenge to the anticipation law — dismissed', date: '1879',
    by: 'Comptroller’s office', status: 'withdrawn',
    body: 'The Comptroller’s office argued the law of [[F-019]], joined to the method of [[F-133]], could prove a false concordance. Trial punchings failed to produce one in two hundred attempts. Withdrawn, with costs to the office’s dignity. Cited nonetheless by [[F-255]]’s dispute.' },
  { folio: 'F-160', title: 'On what the Aperture is not', date: '1880',
    by: 'Prof. I. Aldercroft', status: 'memorandum',
    body: 'The Professor’s last long sheet. The Aperture is not a door, not a lens, not a wound; it is "the place where an exact name and its place agree." Instructs the Bureau to keep the engine, keep the rack, and keep punching. See [[F-063]] and its margin [[F-063a]].' },
  { folio: 'F-217', title: 'RACK FOLIO — THE GRANARY STAIR', date: '1867, attested 1869',
    by: 'rack copy', status: 'attested',
    body: 'Rack copy of the Bureau’s first attested train; original working at [[F-044]]. Two hundred fourteen openings without variance. The stair beyond ascends; no party has reached its head and returned to say so. Racked at position one.' },
  { folio: 'F-224', title: 'RACK FOLIO — LANTHORN DEEP', date: '1871',
    by: 'rack copy', status: 'attested',
    body: 'Rack copy of [[F-071]]. The cold-draught folio; see [[F-118]]. Wheels are run dry for this train by standing order of the mill-wright.' },
  { folio: 'F-229', title: 'The carriage repair and the punch-room revision', date: '1874',
    by: 'J. Marlowe & Miss C. Ferris', status: 'canonical',
    body: 'Joint sheet. Marlowe’s repair of the anticipating carriage (a shadowing pawl, three columns affected) and Ferris’s consequent revision of the punch-room proofing rules of [[F-014]]. Compelled the re-working of [[F-092]] as [[F-101]]; amended the rack discipline of [[F-085]].' },
  { folio: 'F-231', title: 'RACK FOLIO — THE COUNTING ORCHARD', date: '1874',
    by: 'rack copy', status: 'attested',
    body: 'Rack copy of the corrected working [[F-101]]. Racked at position three. The Bureau’s standing joke — that the orchard audits us in return — is recorded here as neither confirmed nor denied.' },
  { folio: 'F-240', title: 'RACK FOLIO — NINE CHIMNEYS', date: '1877',
    by: 'rack copy', status: 'attested',
    body: 'Rack copy of [[F-131]]. The long-opening folio; closure amendments at [[F-052]] were written in its wake. Smoke from the nine chimneys beyond has never once been seen to move.' },
  { folio: 'F-252', title: 'RACK FOLIO — THE PAPER MERIDIAN (provisional)', date: '1885',
    by: 'Miss C. Ferris', status: 'provisional',
    body: 'Ferris’s late hand working, punched but never proved — the residual settles slowly, as if reluctant. Racked provisionally over Marlowe’s objection. Operators are directed to [[F-085]] on the meaning of "attested" and to keep the Proving Hold within reach.' },
  { folio: 'F-255', title: 'RACK FOLIO — WHITLOW BENCH (provisional, disputed)', date: '1886',
    by: 'A. Okonkwo', status: 'provisional',
    body: 'Punched from Okonkwo’s field notes; disputed by the Comptroller’s office on the authority they salvaged from [[F-146]]. The Bureau racks it anyway, marked. Whatever the bench beyond is for, it is the right height for punching.' },
  { folio: 'F-261', title: 'RACK FOLIO — THE ORRERY YARD (provisional)', date: '1887',
    by: 'punch-room', status: 'provisional',
    body: 'The newest punching in the rack. Opened once at hand pace; never re-proved. The yard beyond turns — slowly, all of it, paving and all — about a post that casts two shadows. Derived from a fragment in the Professor’s desk; see [[F-160]].' }
];

// Expose
window.PDATA = { INDICES, ADDRESS_LEN, COLUMNS, RACK, ARCHIVE };
