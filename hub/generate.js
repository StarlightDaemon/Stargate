// ============================================================
// generate.js — scans the repo for qualifying gallery entries and
// writes hub/index.json. No dependencies beyond the Node built-ins
// `fs` and `path`. Run with:
//
//   node hub/generate.js
//
// A folder qualifies only if it has both README.md and index.html
// committed at its root. Title comes from the README's first H1;
// blurb from the first real body paragraph after it (paragraphs
// that are entirely bold/italic "subtitle" lines are skipped in
// favor of the next real paragraph). Everything is re-derived from
// disk on every run — this script holds no hand-maintained entry list.
//
// Status model: three values — live (default), known-issue, retired.
// Every folder is "live" unless explicitly overridden below; overrides
// are hand-verified against that folder's own CHANGELOG.md/README.md,
// never inferred from folder name or content.
//
// _sequestered/<folder> entries are scanned the same way as top-level
// folders (one level deep) and get their status from SEQUESTERED_STATUS,
// decided per-folder from that folder's OWN documentation — not from
// _sequestered/README.md's summary index, which does not always agree
// with what a folder's own CHANGELOG/README documents (see the
// generation report for specifics).
//
// Stargate_OG is excluded from the regular entries scan — its index.html
// loads /src/main.tsx (a Vite/React dev entry with a node_modules/build
// step), which isn't a static entry point in the no-build-step sense
// every other build in this family follows, and it is separately
// off-limits to touch. It is instead extracted into a distinct
// top-level "featured" field (see scanFeatured).
// ============================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HUB_DIR = __dirname;
const SEQUESTERED_DIR = path.join(ROOT, "_sequestered");
const OG_DIR = path.join(ROOT, "Stargate_OG");

const EXCLUDE_NAMES = new Set(["hub", "Stargate_OG", "_sequestered"]);
const EXCLUDE_PATTERNS = [/presubtree-backup/i, /archive/i];

// Explicit top-level status overrides. Every other folder defaults to
// "live" — do not infer status from folder content or guess at defects
// that aren't explicitly documented.
const STATUS_OVERRIDES = {
  // Verified against stargate_high_magic/CHANGELOG.md's [1.1.0] entry:
  // it documents exactly ONE item under "Fixed" (the aperture-mask bug —
  // the stonework's filled circles were opaque and blotted out the veil
  // canvas underneath). The other three v1.1.0 changes (directional
  // lighting pass, mounting hardware/tarnish, fit-to-viewport scaling)
  // are filed under "Added"/"Changed" as enhancements, not as documented
  // defect fixes. So the "four documented defects...independently
  // verified resolved" framing does not match what the CHANGELOG itself
  // shows — only one defect fix is documented there. Status is "live"
  // regardless, because "live" is also this folder's default; the
  // four-defect claim is flagged, not silently accepted.
  stargate_high_magic: "live",
  // Verified against stargate_blueprint_alpha/README.md: a [!WARNING]
  // block reports manual dialing is non-functional, contradicting an
  // earlier automated pass, root cause undetermined.
  stargate_blueprint_alpha: "known-issue",
  // Verified against stargate_blueprint_drafting/README.md: a
  // [!WARNING] block reports manual dialing is STILL non-functional
  // after a dedicated fix attempt; root cause unresolved, build closed.
  stargate_blueprint_drafting: "known-issue",
  // Verified against stargate_bathyscaphe_pilot/CHANGELOG.md's
  // "Issues found (documented, NOT fixed in this session)" section:
  // three real content defects remain open (depth telemetry lags the
  // stage narrative, hard-coded archive sidebar counts, saved-dives
  // counter never updates). Interaction mechanics themselves work.
  stargate_bathyscaphe_pilot: "known-issue",
  // Verified against stargate_ukiyo_waystation_fable/README.md's own
  // opening status-note blockquote: closed as a single, one-off attempt,
  // no further iteration planned; operator review found it underperformed
  // its sibling build (stargate_ukiyo_waystation) on a specific documented
  // behavior (quick-dial auto-dial did not read as present/working during
  // real use, despite the build's own automated verification reporting it).
  stargate_ukiyo_waystation_fable: "known-issue",
  // Verified against stargate_atompunk_fable/CHANGELOG.md's [1.0.0]
  // "Verified" section and README "Status" blockquote: direct operator
  // hands-on testing (2026-09-02) confirmed the build works as intended,
  // end to end, and "Known issues" records none found by either the
  // harness or the operator. "live" is also this folder's default; the
  // explicit entry records that the status is hand-verified, not merely
  // defaulted.
  stargate_atompunk_fable: "live",
};

// Short caveat lines surfaced on the card itself, so entries with an
// honest asterisk don't present as uniformly polished. Each is
// hand-verified against that folder's OWN CHANGELOG.md/README.md
// (quoting its documented operator evaluation or verification state),
// never inferred. Folders absent from this map get no note.
const NOTES = {
  // CHANGELOG [1.0.0] operator evaluation: core loop functional but
  // "rough and not clear or polished enough to warrant further
  // development"; closed as a single one-off attempt.
  stargate_apiculture_telemetry:
    "Operator evaluation: functional but rough — closed as a one-off attempt, no further iteration planned.",
  // CHANGELOG [1.0.0] operator review: complete and fully functional,
  // but "operator review found the overall result underwhelming";
  // session closed with no further iteration planned.
  stargate_futurist_dynamism:
    "Operator review: complete and functional but underwhelming as an execution of the Futurist register — closed without further iteration.",
  // CHANGELOG [1.0.0] "Operator Review & Thematic Finding": the
  // card-catalog archival theme "does not translate as naturally into
  // the project's digital-forward, glowing-schematic visual mandate".
  stargate_bibliographic_depository:
    "Operator finding: fully functional, but the archival theme fits this project's digital-forward visual identity less naturally than other builds.",
  // CHANGELOG [1.1.2] note: the final 16:9 viewport-fill fix "has not
  // yet been independently confirmed by the operator's own direct
  // testing" — self-verified by the building session only.
  stargate_dark_matter_array:
    "Solid build; the final 16:9 viewport-fill fix (v1.1.2) is session-verified only, not yet confirmed by direct operator testing.",
  // CHANGELOG [1.0.0]: "Status of operator testing: NONE" plus three
  // documented, unfixed content defects (see STATUS_OVERRIDES comment).
  stargate_bathyscaphe_pilot:
    "Session-verified only. Three documented unfixed content defects: depth readout contradicts stage text after activation, hardcoded archive counts, saved-dives counter never updates.",
  // CHANGELOG close-out: zero defects across 185/185 + 24/24 checks,
  // but "the operator has NOT yet personally clicked through this
  // build" — automated verification only.
  stargate_bathyscaphe_pilot_fable:
    "Zero defects found across all automated verification checks — operator confirmation still pending.",
  // README.md status-note blockquote: closed as a single, one-off
  // attempt, no further iteration planned; underperformed its sibling
  // build on the quick-dial auto-dial behavior, which didn't read as
  // present or working during real use despite the build's own automated
  // verification reporting it — a discrepancy left unresolved.
  stargate_ukiyo_waystation_fable:
    "Closed as a single, one-off attempt: underperformed its sibling build on the quick-dial auto-dial behavior, which didn't read as present or working during real use despite the build's own automated verification reporting it — unresolved.",
};

// Thematic series groupings. Members render a series tag and are
// clustered together in the grid (see the sort in scan()). The five
// artistic-register builds were built as one connected sub-series
// exploring aesthetics beyond the default digital-glow HUD register;
// each build's own CHANGELOG self-numbers its departure consistently
// (ukiyo=first, cathedral=second, konstrukt=third, ...).
const SERIES = {
  stargate_ukiyo_waystation: "Artistic Register",
  stargate_cathedral_oculus: "Artistic Register",
  stargate_konstrukt_transit: "Artistic Register",
  stargate_nouveau_nimbus: "Artistic Register",
  stargate_futurist_dynamism: "Artistic Register",
};

// _sequestered/<folder> dispositions, decided from each folder's OWN
// CHANGELOG.md/README.md. All folders here are "retired"; the note on
// each explains what, if anything, its own docs name as the reason —
// a real documented defect where one exists, or plainly no defect
// recorded where none does (never inferred or invented).
const SEQUESTERED_STATUS = {
  // Own CHANGELOG.md "Known Issues (Post-1.1.0 Operator Testing)":
  // portal/aperture visual effect confirmed by operator testing to not
  // render perceptibly; root cause not investigated, closed as-is.
  stargate_cyanotype_geodetic: "retired",
  // Own CHANGELOG.md "Known Issues (retroactively documented)": operator
  // review found the build cartoonish/non-physical, root-caused to
  // machine-perfect uniform repeated elements; fixes attempted, did not
  // resolve it.
  Stargate_low_magic: "retired",
  // Own CHANGELOG.md documents only a [1.0.0] "Added" section — no
  // Known Issues/Fixed section, no defect named.
  stargate_low_magicv2: "retired",
  // No CHANGELOG.md exists; own README.md documents features only, no
  // defect named.
  stargate_dieselpunk: "retired",
  // Own CHANGELOG.md "Known Issues (retroactively documented)": same
  // cartoonish/non-physical defect as Stargate_low_magic, same root
  // cause, confirmed unresolved by the retirement commit itself.
  stargate_steampunk: "retired",
  // Own CHANGELOG.md "Known Issues (retroactively documented)": second
  // dieselpunk attempt, retired for the same unresolved physical-material
  // rendering defect as stargate_dieselpunk.
  stargate_dieselpunkv2: "retired",
  // Own CHANGELOG.md documents features/compliance passes only, no
  // defect named.
  stargate_atompunk: "retired",
  // Own CHANGELOG.md documents features/compliance/polish passes only,
  // no defect named.
  stargate_cyberpunk: "retired",
  // Own CHANGELOG.md's [Unreleased] "Fixed" section lists items already
  // resolved during a cleanup pass, not an open defect.
  stargate_low_scifi_maintenance: "retired",
};

const BLURB_MAX_CHARS = 220;

function isExcluded(name) {
  if (EXCLUDE_NAMES.has(name)) return true;
  if (name.startsWith(".")) return true;
  return EXCLUDE_PATTERNS.some((re) => re.test(name));
}

function findEntryPoint(dir) {
  const candidates = ["index.html", "index.htm"];
  for (const c of candidates) {
    if (fs.existsSync(path.join(dir, c))) return c;
  }
  return null;
}

function findPreview(dir) {
  const candidates = ["preview.png", "preview.jpg", "preview.jpeg"];
  for (const c of candidates) {
    if (fs.existsSync(path.join(dir, c))) return c;
  }
  return null;
}

function cleanMarkdownInline(text) {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // common named/numeric HTML entities some READMEs carry (blurbs are
    // rendered via textContent, so entities would otherwise show raw)
    .replace(/&rarr;/g, "→")
    .replace(/&larr;/g, "←")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();
}

function isSubtitleParagraph(paraLines) {
  // A paragraph made entirely of lines that are themselves one single
  // bold or italic span reads as a subtitle/byline, not a description
  // — skip it and keep looking for the first real body paragraph.
  return paraLines.every((l) => /^(\*\*[^*]+\*\*|\*[^*]+\*)$/.test(l));
}

function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 0 ? lastSpace : max).trim() + "…";
}

function extractTitleAndBlurb(readmePath) {
  const raw = fs.readFileSync(readmePath, "utf8");
  const lines = raw.split(/\r?\n/);

  let headingIdx = -1;
  let title = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*#*\s*$/);
    if (m) {
      headingIdx = i;
      title = m[1].trim();
      break;
    }
  }
  // No genuine level-one heading — this folder does not qualify as a gallery entry.
  if (title === null) return null;

  let blurb = "";
  let i = headingIdx + 1;
  const n = lines.length;
  while (i < n) {
    while (i < n && lines[i].trim() === "") i++;
    if (i >= n) break;

    if (lines[i].trim().startsWith("```")) {
      i++;
      while (i < n && !lines[i].trim().startsWith("```")) i++;
      i++;
      continue;
    }
    if (/^#{1,6}\s/.test(lines[i])) break; // next heading, no paragraph found

    const paraLines = [];
    while (
      i < n &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !lines[i].trim().startsWith("```")
    ) {
      // Strip leading blockquote markers (">", "> >", etc.) so a README
      // paragraph formatted as a `>` blockquote doesn't leak literal ">"
      // (HTML-escaped as &gt;) into the rendered blurb.
      paraLines.push(lines[i].trim().replace(/^(?:>\s?)+/, ""));
      i++;
    }
    if (paraLines.length === 0) continue;
    if (isSubtitleParagraph(paraLines)) continue;

    blurb = truncate(cleanMarkdownInline(paraLines.join(" ")), BLURB_MAX_CHARS);
    break;
  }

  // Heading found but no real body paragraph followed it — does not qualify.
  if (!blurb) return null;

  return { title, blurb };
}

function readVersion(dir) {
  const p = path.join(dir, "version.json");
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}

function scanOne(dir, name, { linkPrefix, status }) {
  const hasReadme = fs.existsSync(path.join(dir, "README.md"));
  const entryFile = findEntryPoint(dir);

  if (!hasReadme || !entryFile) {
    return {
      skip: {
        folder: name,
        reason: !hasReadme && !entryFile
          ? "missing README.md and index.html"
          : !hasReadme
          ? "missing README.md"
          : "missing index.html",
      },
    };
  }

  const extracted = extractTitleAndBlurb(path.join(dir, "README.md"));
  if (!extracted) {
    return {
      skip: {
        folder: name,
        reason: "README.md lacks a genuine level-one heading with a following body paragraph",
      },
    };
  }
  const { title, blurb } = extracted;
  const preview = findPreview(dir);
  const version = readVersion(dir);

  return {
    entry: {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      folder: name,
      title,
      blurb,
      link: `${linkPrefix}${name}/${entryFile}`,
      preview: preview ? `${linkPrefix}${name}/${preview}` : null,
      status,
      version,
      series: SERIES[name] || null,
      note: NOTES[name] || null,
    },
  };
}

function scan() {
  const included = [];
  const skipped = [];

  const dirents = fs.readdirSync(ROOT, { withFileTypes: true });
  for (const d of dirents) {
    if (!d.isDirectory()) continue;
    const name = d.name;

    if (isExcluded(name)) {
      skipped.push({ folder: name, reason: "excluded (hub/OG/sequestered/backup/archive/hidden pattern)" });
      continue;
    }

    const dir = path.join(ROOT, name);
    const result = scanOne(dir, name, {
      linkPrefix: "../",
      status: STATUS_OVERRIDES[name] || "live",
    });
    if (result.entry) included.push(result.entry);
    else skipped.push(result.skip);
  }

  if (fs.existsSync(SEQUESTERED_DIR)) {
    const seqDirents = fs.readdirSync(SEQUESTERED_DIR, { withFileTypes: true });
    for (const d of seqDirents) {
      if (!d.isDirectory()) continue;
      const name = d.name;
      const dir = path.join(SEQUESTERED_DIR, name);
      const hasDetermination = Object.prototype.hasOwnProperty.call(SEQUESTERED_STATUS, name);

      const result = scanOne(dir, name, {
        linkPrefix: "../_sequestered/",
        status: hasDetermination ? SEQUESTERED_STATUS[name] : "live",
      });

      if (result.entry) {
        included.push(result.entry);
      } else {
        skipped.push(result.skip);
      }
    }
  }

  // Alphabetical by folder, except that members of a series cluster
  // together at the position of their alphabetically-first member
  // (internally still alphabetical) — grouping without a separate
  // grid section.
  const seriesAnchor = {};
  for (const e of included) {
    if (!e.series) continue;
    const f = e.folder.toLowerCase();
    if (!(e.series in seriesAnchor) || f < seriesAnchor[e.series]) seriesAnchor[e.series] = f;
  }
  const sortKey = (e) =>
    e.series ? `${seriesAnchor[e.series]}~${e.folder.toLowerCase()}` : e.folder.toLowerCase();
  // Plain ordinal compare — locale collation can treat the "~" cluster
  // separator as ignorable punctuation and break the grouping.
  included.sort((a, b) => {
    const ka = sortKey(a), kb = sortKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  return { included, skipped };
}

function scanFeatured() {
  if (!fs.existsSync(OG_DIR)) return null;
  const readmePath = path.join(OG_DIR, "README.md");
  if (!fs.existsSync(readmePath)) return null;

  const extracted = extractTitleAndBlurb(readmePath);
  if (!extracted) return null;

  const pkgPath = path.join(OG_DIR, "package.json");
  let hasTestScript = false;
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      hasTestScript = !!(pkg.scripts && pkg.scripts.test);
    } catch {
      hasTestScript = false;
    }
  }

  // Hero preview: Stargate_OG/preview.png is tracked in this monorepo,
  // and so are stargate_blueprint_alpha/preview.png and
  // stargate_blueprint_drafting/preview.png. All three arrive in a clean
  // clone; none of them is an on-disk-only screenshot, and Stargate_OG
  // has no nested .git of its own — it is an ordinary folder here.
  // That became true with the 2026-08-24 subtree merges (9bb1e05 for
  // Stargate_OG, 73110cd and a7f1863 for the two blueprint folders),
  // which folded each of those histories in with their previews. This
  // comment previously described all three as untracked files living in
  // separate repos; that was true when it was written on 2026-08-23 and
  // stopped being true the following day.
  const preview = findPreview(OG_DIR);

  // Not fabricating a pass count here: package.json's `test` script
  // (`vitest run`) is directly verifiable, but no run count for it is
  // recorded anywhere in this session's history or in the repo's own
  // documentation — so no count is claimed. See the generation report.
  return {
    title: extracted.title,
    blurb: extracted.blurb,
    link: "../Stargate_OG/index.html",
    preview: preview ? `../Stargate_OG/${preview}` : null,
    testStatus: hasTestScript
      ? "Test script present (npm test -> vitest run); no independently verifiable pass count found in this session or repo docs"
      : "No test script found in package.json",
  };
}

function main() {
  const { included, skipped } = scan();
  const featured = scanFeatured();
  const output = { featured, entries: included };
  const outPath = path.join(HUB_DIR, "index.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(`Wrote ${included.length} entries to ${path.relative(ROOT, outPath)}`);
  for (const e of included) {
    console.log(`  [${e.status}] ${e.folder} -> ${e.title}${e.version ? ` (v${e.version})` : ""}`);
  }
  console.log(`Skipped ${skipped.length} folders:`);
  for (const s of skipped) console.log(`  ${s.folder}: ${s.reason}`);
  console.log(`Featured: ${featured ? featured.title : "(none)"}`);
}

main();
