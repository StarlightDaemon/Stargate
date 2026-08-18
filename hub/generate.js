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
// Status model: four values — live (default), known-issue, retired,
// deprioritized. Every folder is "live" unless explicitly overridden
// below; overrides are hand-verified against that folder's own
// CHANGELOG.md/README.md, never inferred from folder name or content.
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
};

// _sequestered/<folder> dispositions, decided from each folder's OWN
// CHANGELOG.md/README.md. "retired" = own docs name a real unresolved
// defect. "deprioritized" = folder was moved here with no defect
// documented in its own docs (ordering/scope reasons, not a bug).
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
  stargate_low_magicv2: "deprioritized",
  // Own README.md (no CHANGELOG.md exists) documents features only, no
  // defect named.
  stargate_dieselpunk: "deprioritized",
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
  stargate_atompunk: "deprioritized",
  stargate_cyberpunk: "deprioritized",
  // Own CHANGELOG.md's [Unreleased] "Fixed" section lists items already
  // resolved, not an open defect.
  stargate_low_scifi_maintenance: "deprioritized",
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
      paraLines.push(lines[i].trim());
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

  included.sort((a, b) => a.folder.localeCompare(b.folder, "en", { sensitivity: "base" }));

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

  // Not fabricating a pass count here: package.json's `test` script
  // (`vitest run`) is directly verifiable, but no run count for it is
  // recorded anywhere in this session's history or in the repo's own
  // documentation — so no count is claimed. See the generation report.
  return {
    title: extracted.title,
    blurb: extracted.blurb,
    link: "../Stargate_OG/index.html",
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
