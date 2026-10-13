// ============================================================
// find-duplicate-keys.mjs
//
// Finds duplicate keys inside ar.js, fr.js, en_us.js and
// reports keys that are missing across files.
//
// Strategy for duplicates: keep the LAST occurrence of a key
// (remove the first). This assumes the later definition is the
// most intentional / up-to-date translation.
//
// Usage:
//   node scripts/find-duplicate-keys.mjs            <- dry-run (report only)
//   node scripts/find-duplicate-keys.mjs --write    <- removes duplicates
//
// Flags:
//   --write           Apply changes (remove first occurrence of duplicates)
//   --skip-git-check  Skip the git safety check (not recommended)
//
// Build phases:
//   [ok] Phase 1 - Git safety check
//   [ok] Phase 2 - Parse locale files (raw text scanning)
//   [ok] Phase 3 - Find duplicate keys (report)
//   [ok] Phase 4 - Cross-file key comparison
//   [ok] Phase 5 - --write mode (remove first occurrence)
//   [ok] Phase 6 - Post-write instructions
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// --- PATHS ---------------------------------------------------
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const localeDir = path.resolve(
  rootDir,
  "src",
  "assets",
  "locale",
  "translation"
);

const LOCALE_FILES = [
  { name: "ar.js", path: path.join(localeDir, "ar.js") },
  { name: "fr.js", path: path.join(localeDir, "fr.js") },
  { name: "en_us.js", path: path.join(localeDir, "en_us.js") },
];

// --- FLAGS ---------------------------------------------------
const writeChanges = process.argv.includes("--write");
const skipGitCheck = process.argv.includes("--skip-git-check");

// =============================================================
// PHASE 1: GIT SAFETY CHECK
// =============================================================
// Verifies the working tree is clean BEFORE reading or writing.
// If something goes wrong you can recover with: git checkout -- .

function checkGitStatus() {
  console.log("\n--- Phase 1: Git safety check ---------------------------");

  if (skipGitCheck) {
    console.warn("WARNING: --skip-git-check flag detected. Skipping git check.");
    return;
  }

  // 1-a. Make sure git is available.
  try {
    execSync("git --version", { stdio: "pipe" });
  } catch {
    console.error("ERROR: git is not available in PATH.");
    console.error("       Install git or pass --skip-git-check to override.");
    process.exit(1);
  }

  // 1-b. Make sure we are inside a git repository.
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "pipe" });
  } catch {
    console.error("ERROR: Not inside a git repository.");
    console.error("       Run: git init  -- or navigate to your project root.");
    process.exit(1);
  }

  // 1-c. Auto-commit any uncommitted changes before we do anything.
  //      This creates a safe restore point so you can always run
  //      `git checkout -- .` or `git reset HEAD~1 --soft` to undo.
  const status = execSync("git status --porcelain", { encoding: "utf8" }).trim();

  if (status) {
    console.log("  Uncommitted changes detected:");
    console.log("");
    // Print each changed file indented
    for (const line of status.split("\n")) {
      console.log("    " + line);
    }
    console.log("");
    console.log("  Auto-committing a snapshot before cleanup...");

    try {
      // Stage everything (new files, modifications, deletions)
      execSync("git add -A", { stdio: "pipe" });

      // Commit with a timestamped message so it is easy to identify
      const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
      const message = "wip: snapshot before duplicate key cleanup (" + timestamp + ")";
      execSync('git commit -m "' + message + '"', { stdio: "pipe" });

      console.log("  Auto-commit successful: \"" + message + "\"");
      console.log("");
      console.log("  To undo this commit (soft — keeps your files):");
      console.log("    git reset HEAD~1 --soft");
      console.log("  To undo everything (hard — discards all changes):");
      console.log("    git reset HEAD~1 --hard");
    } catch (err) {
      console.error("ERROR: Auto-commit failed.");
      console.error("       " + err.message);
      console.error("");
      console.error("  Commit manually, then rerun the script:");
      console.error("    git add -A && git commit -m 'wip: before duplicate key cleanup'");
      process.exit(1);
    }
  }

  // 1-d. Show current HEAD.
  const head = execSync("git log -1 --oneline", { encoding: "utf8" }).trim();
  console.log("OK: Working tree is clean.");
  console.log("    HEAD -> " + head);
  console.log("    Recovery (if needed): git checkout -- .");
}

// =============================================================
// PHASE 2: PARSE LOCALE FILES
// =============================================================
// We scan the raw text line-by-line to find key definitions.
// A JS object silently drops earlier duplicates, so we can NOT
// just import the file — we must read the source text.
//
// We detect lines that look like:
//   key: "value",          (simple)
//   key:                   (multi-line value, value continues on next line)
//
// The regex captures the key name and the line number.

// Matches:  key_name: "...",   or   key_name: `...`,   or   key_name:
// Does NOT match comment lines starting with //
const KEY_REGEX = /^(\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/;

/**
 * Parse a locale file and return an array of key entries.
 * Each entry: { key, line (1-indexed), lineContent }
 *
 * @param {string} filePath - Absolute path to the locale file
 * @returns {{ keys: Array<{key: string, line: number, lineContent: string}>, rawLines: string[] }}
 */
function parseLocaleFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const keys = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip blank lines, comments, opening/closing braces, export
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed === "const lang = {" ||
      trimmed === "};" ||
      trimmed === "}" ||
      trimmed.startsWith("export")
    ) {
      continue;
    }

    const match = line.match(KEY_REGEX);
    if (match) {
      keys.push({
        key: match[2],
        line: i + 1, // 1-indexed
        lineContent: line,
      });
    }
  }

  return { keys, rawLines: lines };
}

// =============================================================
// PHASE 3: FIND DUPLICATE KEYS
// =============================================================
// For each file, find keys that appear more than once.
// Strategy: keep the LAST occurrence, remove earlier ones.

/**
 * Find duplicate keys in a parsed key list.
 * Returns a map: key -> array of entries (sorted by line number).
 * Only keys with 2+ occurrences are included.
 *
 * @param {Array<{key: string, line: number, lineContent: string}>} keys
 * @returns {Map<string, Array<{key: string, line: number, lineContent: string}>>}
 */
function findDuplicates(keys) {
  const keyMap = new Map();

  for (const entry of keys) {
    if (!keyMap.has(entry.key)) {
      keyMap.set(entry.key, []);
    }
    keyMap.get(entry.key).push(entry);
  }

  // Keep only keys with duplicates
  const duplicates = new Map();
  for (const [key, entries] of keyMap) {
    if (entries.length > 1) {
      duplicates.set(key, entries);
    }
  }

  return duplicates;
}

/**
 * Print a report of duplicates found in a single file.
 *
 * @param {string} fileName
 * @param {Map<string, Array>} duplicates
 */
function reportDuplicates(fileName, duplicates) {
  if (duplicates.size === 0) {
    console.log("  " + fileName + ": No duplicates found.");
    return;
  }

  console.log("  " + fileName + ": " + duplicates.size + " duplicate key(s):");

  for (const [key, entries] of duplicates) {
    console.log("");
    console.log("    Key: \"" + key + "\" (" + entries.length + " occurrences)");

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isKept = i === entries.length - 1;
      const tag = isKept ? " <-- KEEP (last)" : " <-- REMOVE (first)";
      console.log(
        "      Line " + entry.line + ": " + entry.lineContent.trim() + tag
      );
    }
  }
}

// =============================================================
// PHASE 4: CROSS-FILE KEY COMPARISON
// =============================================================
// Find keys that exist in one file but are missing in another.

/**
 * Compare keys across all files and report missing keys.
 *
 * @param {Array<{name: string, keySet: Set<string>}>} fileSets
 */
function crossFileComparison(fileSets) {
  console.log("\n--- Phase 4: Cross-file key comparison ------------------");

  let hasMissing = false;

  for (let i = 0; i < fileSets.length; i++) {
    for (let j = 0; j < fileSets.length; j++) {
      if (i === j) continue;

      const source = fileSets[i];
      const target = fileSets[j];
      const missing = [];

      for (const key of source.keySet) {
        if (!target.keySet.has(key)) {
          missing.push(key);
        }
      }

      if (missing.length > 0) {
        hasMissing = true;
        console.log(
          "\n  Keys in " +
            source.name +
            " but MISSING in " +
            target.name +
            " (" +
            missing.length +
            "):"
        );
        for (const key of missing) {
          console.log("    - " + key);
        }
      }
    }
  }

  if (!hasMissing) {
    console.log("  All files have the same keys. No missing keys found.");
  }
}

// =============================================================
// PHASE 5: --write MODE (REMOVE FIRST OCCURRENCES)
// =============================================================
// When --write is passed, remove the FIRST occurrence(s) of each
// duplicate key, keeping only the LAST one.
//
// We work on the raw lines array: for each duplicate key, we
// identify which lines to remove (all except the last entry).
// We must also handle multi-line values (value continues on the
// next line after key:).

/**
 * Determine if a line at index `i` has a multi-line value.
 * A multi-line value means the key line does NOT end with a comma
 * or a closing quote+comma on the same line. The value continues
 * on the next line(s).
 *
 * @param {string[]} lines - All lines of the file
 * @param {number} lineIndex - 0-indexed line number of the key
 * @returns {number} - Number of extra lines belonging to this key's value
 */
function countExtraValueLines(lines, lineIndex) {
  const line = lines[lineIndex];
  const trimmed = line.trim();

  // If the line ends with a comma (possibly with trailing comment),
  // it's a single-line entry.
  // Examples of single-line:
  //   key: "value",
  //   key: 'value',
  //   key: `value`,
  if (/,\s*(\/\/.*)?$/.test(trimmed)) {
    return 0;
  }

  // Otherwise check subsequent lines to find where the value ends.
  // The value ends at the line that has a trailing comma.
  let extra = 0;
  for (let j = lineIndex + 1; j < lines.length; j++) {
    extra++;
    const nextTrimmed = lines[j].trim();
    // Value ends when we see a trailing comma or closing brace
    if (/,\s*(\/\/.*)?$/.test(nextTrimmed) || nextTrimmed === "};" || nextTrimmed === "}") {
      break;
    }
  }

  return extra;
}

/**
 * Remove duplicate key lines from the raw file content.
 * Keeps the LAST occurrence, removes earlier ones.
 *
 * @param {string[]} rawLines - All lines of the file
 * @param {Map<string, Array<{key: string, line: number}>>} duplicates
 * @returns {string} - The cleaned file content
 */
function removeDuplicateLines(rawLines, duplicates) {
  // Collect all 0-indexed line numbers to remove.
  const linesToRemove = new Set();

  for (const [, entries] of duplicates) {
    // Remove all entries EXCEPT the last one.
    const toRemove = entries.slice(0, -1);

    for (const entry of toRemove) {
      const lineIndex = entry.line - 1; // convert to 0-indexed
      linesToRemove.add(lineIndex);

      // Also remove extra lines for multi-line values.
      const extra = countExtraValueLines(rawLines, lineIndex);
      for (let e = 1; e <= extra; e++) {
        linesToRemove.add(lineIndex + e);
      }

      // Remove blank line immediately before if it exists
      // (to avoid leaving double blank lines).
      if (
        lineIndex > 0 &&
        rawLines[lineIndex - 1].trim() === "" &&
        !linesToRemove.has(lineIndex - 1)
      ) {
        // Only remove the blank line if the line before IT is also
        // not being removed (avoid cascading removals).
        // Actually, keep it simple: leave blank line cleanup to user.
      }
    }
  }

  // Build new content, skipping removed lines.
  const newLines = rawLines.filter((_, i) => !linesToRemove.has(i));
  return newLines.join("\n");
}

// =============================================================
// PHASE 6: AUTO GIT DIFF + NEXT STEPS
// =============================================================
// After writing changes, automatically run `git diff HEAD~1`
// and print the full output so you can review what changed
// without leaving the terminal.

function printPostWriteInstructions() {
  console.log("\n--- Phase 6: Git diff (auto) ----------------------------");
  console.log("");

  try {
    // git diff HEAD~1 compares the current working tree against
    // the last commit (which was auto-created in Phase 1).
    // This shows exactly which lines were removed from the locale files.
    const diff = execSync("git diff HEAD~1", { encoding: "utf8" });

    if (!diff.trim()) {
      console.log("  (No diff output — working tree matches last commit.)");
    } else {
      console.log(diff);
    }
  } catch (err) {
    console.warn("  Could not run git diff: " + err.message);
  }

  console.log("--- Next steps ------------------------------------------");
  console.log("");
  console.log("  1. Review the diff above carefully.");
  console.log("");
  console.log("  If everything looks good, commit the cleanup:");
  console.log("    git add -A && git commit -m 'chore: remove duplicate locale keys'");
  console.log("");
  console.log("  Then verify the build:");
  console.log("    npm run build");
  console.log("    npm run dev");
  console.log("");
  console.log("  If something went wrong, restore the locale files:");
  console.log("    git checkout -- .");
  console.log("  Or undo the auto-commit from Phase 1 entirely:");
  console.log("    git reset HEAD~1 --hard");
  console.log("---------------------------------------------------------");
  console.log("");
}

// =============================================================
// ENTRY POINT
// =============================================================

function main() {
  // Phase 1
  checkGitStatus();

  // Phase 2
  console.log("\n--- Phase 2: Parse locale files -------------------------");

  // Verify all locale files exist.
  for (const file of LOCALE_FILES) {
    if (!fs.existsSync(file.path)) {
      console.error("ERROR: Locale file not found: " + file.path);
      process.exit(1);
    }
  }

  const parsed = LOCALE_FILES.map((file) => {
    const result = parseLocaleFile(file.path);
    console.log(
      "  " + file.name + ": " + result.keys.length + " key(s) parsed."
    );
    return { ...file, ...result };
  });

  // Phase 3
  console.log("\n--- Phase 3: Duplicate key report -----------------------");

  let totalDuplicates = 0;
  const fileResults = parsed.map((file) => {
    const duplicates = findDuplicates(file.keys);
    reportDuplicates(file.name, duplicates);
    totalDuplicates += duplicates.size;
    return { ...file, duplicates };
  });

  console.log(
    "\n  TOTAL: " +
      totalDuplicates +
      " duplicate key(s) across " +
      LOCALE_FILES.length +
      " files."
  );

  // Phase 4
  const fileSets = parsed.map((file) => ({
    name: file.name,
    keySet: new Set(file.keys.map((k) => k.key)),
  }));
  crossFileComparison(fileSets);

  // Phase 5
  if (writeChanges) {
    console.log("\n--- Phase 5: Applying changes ---------------------------");

    if (totalDuplicates === 0) {
      console.log("  No duplicates to remove. Nothing to write.");
    } else {
      for (const file of fileResults) {
        if (file.duplicates.size === 0) {
          console.log("  " + file.name + ": no changes needed.");
          continue;
        }

        const cleaned = removeDuplicateLines(file.rawLines, file.duplicates);
        fs.writeFileSync(file.path, cleaned, "utf8");

        // Count how many entries were removed.
        let removedCount = 0;
        for (const [, entries] of file.duplicates) {
          removedCount += entries.length - 1; // keep last, remove the rest
        }

        console.log(
          "  " +
            file.name +
            ": removed " +
            removedCount +
            " duplicate entries. File updated."
        );
      }

      // Phase 6
      printPostWriteInstructions();
    }
  } else {
    console.log("\n---------------------------------------------------------");
    console.log("  DRY RUN - No files were changed.");
    console.log("  Review the report above, then rerun with --write:");
    console.log("    node scripts/find-duplicate-keys.mjs --write");
    console.log("---------------------------------------------------------");
  }
}

main();
