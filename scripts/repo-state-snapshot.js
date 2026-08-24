#!/usr/bin/env node
/**
 * repo-state-snapshot.js — drift-monitoring baseline for this repository
 *
 * Walks every top-level folder matching stargate_* / Stargate_*, plus
 * _sequestered/ and each folder inside it, and records for each:
 * folder name, file count, total size in bytes, most recent modification
 * time, and whether git tracks any files under it. It also scans the top
 * level for any *.presubtree-backup folders and records exactly which ones
 * exist (expected: none), so their presence or absence is an explicit,
 * diffable fact rather than an inference.
 *
 * Output: a timestamped JSON file under scripts/snapshots/ (gitignored).
 *
 * RE-RUN THIS after any future fold (subtree merge), folder deletion, or
 * large batch of changes, and diff the new snapshot against the most
 * recent prior one. This exists specifically because six
 * *.presubtree-backup folders once vanished from this repository with no
 * git trace at all — they were untracked, so git history recorded nothing —
 * and the project only found out by accident, well after the fact.
 * Untracked state has no other witness; these snapshots are it.
 *
 * Usage: node scripts/repo-state-snapshot.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');

function walkStats(dir) {
  // Returns { fileCount, totalBytes, latestMtimeMs } over everything under
  // dir, including dotfiles and nested .git directories — the snapshot
  // records raw on-disk state, not git's view of it.
  let fileCount = 0;
  let totalBytes = 0;
  let latestMtimeMs = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (err) {
      continue; // unreadable dir: skip rather than abort the whole snapshot
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        continue; // don't follow links out of the tree or double-count
      }
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        let st;
        try {
          st = fs.statSync(full);
        } catch (err) {
          continue;
        }
        fileCount += 1;
        totalBytes += st.size;
        if (st.mtimeMs > latestMtimeMs) latestMtimeMs = st.mtimeMs;
      }
    }
  }
  return { fileCount, totalBytes, latestMtimeMs };
}

function isTrackedByGit(relPath) {
  // True when git tracks at least one file under relPath in the parent repo.
  try {
    const out = execFileSync('git', ['-C', REPO_ROOT, 'ls-files', '--', relPath], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    return out.trim().length > 0;
  } catch (err) {
    return false;
  }
}

function describeFolder(relPath) {
  const abs = path.join(REPO_ROOT, relPath);
  const { fileCount, totalBytes, latestMtimeMs } = walkStats(abs);
  return {
    folder: relPath.replace(/\\/g, '/'),
    fileCount,
    totalBytes,
    latestMtime: latestMtimeMs > 0 ? new Date(latestMtimeMs).toISOString() : null,
    trackedByGit: isTrackedByGit(relPath),
  };
}

function main() {
  const topEntries = fs.readdirSync(REPO_ROOT, { withFileTypes: true });
  const topDirs = topEntries.filter((e) => e.isDirectory()).map((e) => e.name);

  // Build the target list: stargate_*/Stargate_* top-level folders, plus
  // _sequestered itself and each folder directly inside it.
  const targets = topDirs
    .filter((name) => /^stargate_/i.test(name))
    .sort();
  if (topDirs.includes('_sequestered')) {
    targets.push('_sequestered');
    const seqEntries = fs.readdirSync(path.join(REPO_ROOT, '_sequestered'), {
      withFileTypes: true,
    });
    for (const e of seqEntries.filter((x) => x.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      targets.push(path.join('_sequestered', e.name));
    }
  }

  const folders = targets.map(describeFolder);

  // Explicit presubtree-backup accounting: list every *.presubtree-backup
  // folder that exists at the top level right now. Expected to be empty
  // after the 2026-08-24 cleanup, but the check stays general so future
  // reappearances (or new backups from future folds) are recorded too.
  const presubtreeBackupsPresent = topDirs
    .filter((name) => name.endsWith('.presubtree-backup'))
    .sort();

  const snapshot = {
    generatedAt: new Date().toISOString(),
    repoRoot: REPO_ROOT.replace(/\\/g, '/'),
    folderCount: folders.length,
    totalBytesAllFolders: folders.reduce((sum, f) => sum + f.totalBytes, 0),
    presubtreeBackups: {
      present: presubtreeBackupsPresent,
      count: presubtreeBackupsPresent.length,
      note: 'Every top-level *.presubtree-backup folder existing at snapshot time. Expected [] after 2026-08-24.',
    },
    folders,
  };

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const stamp = snapshot.generatedAt.replace(/[:.]/g, '-');
  const outPath = path.join(SNAPSHOT_DIR, `repo-state-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');

  console.log(`Snapshot written: ${outPath}`);
  console.log(`Folders recorded: ${snapshot.folderCount}`);
  console.log(`Total size: ${snapshot.totalBytesAllFolders} bytes`);
  console.log(`presubtree-backup folders present: ${presubtreeBackupsPresent.length}`);
}

main();
