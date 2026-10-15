// ============================================================
// find-dead-code.mjs
//
// Hybrid dead code detector:
//   - Uses knip as the detection engine (Vite/React-aware)
//   - Wraps it with git safety, phased reporting, and --write mode
//
// REQUIRED: npm install -D knip
//
// Usage:
//   node scripts/find-dead-code.mjs            <- dry-run (report only)
//   node scripts/find-dead-code.mjs --write    <- delete files + uninstall deps
//
// Flags:
//   --write           Apply changes (delete dead files, uninstall unused deps)
//   --skip-git-check  Skip the git safety check (not recommended)
//
// Phases:
//   [1] Git safety check + auto-commit snapshot
//   [2] Run knip --reporter json
//   [3] Parse & display structured report
//   [4] --write: delete dead files + npm uninstall unused deps
//   [5] Git diff + next-steps instructions
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir   = path.resolve(scriptDir, "..");

const writeChanges = process.argv.includes("--write");
const skipGitCheck = process.argv.includes("--skip-git-check");

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  red:     "\x1b[31m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  blue:    "\x1b[34m",
  magenta: "\x1b[35m",
  cyan:    "\x1b[36m",
  gray:    "\x1b[90m",
};

const c = (code, text) => code + text + C.reset;

function banner(title) {
  const line = "═".repeat(62);
  console.log("\n" + c(C.cyan + C.bold, line));
  console.log(c(C.cyan + C.bold, "  " + title));
  console.log(c(C.cyan + C.bold, line));
}

function section(num, title) {
  const pad = "-".repeat(Math.max(2, 46 - title.length));
  console.log("\n" + c(C.bold, `--- Phase ${num}: ${title} ${pad}`));
}

// =============================================================
// PHASE 1 — GIT SAFETY CHECK
// =============================================================
// Auto-commits any uncommitted work so you always have a
// restore point: `git reset HEAD~1 --hard`
// =============================================================

function checkGitStatus() {
  section(1, "Git safety check");

  if (skipGitCheck) {
    console.warn(c(C.yellow, "  WARNING: --skip-git-check flag detected. Skipping."));
    return;
  }

  // 1-a. git must be available
  try {
    execSync("git --version", { stdio: "pipe" });
  } catch {
    console.error(c(C.red, "  ERROR: git is not available in PATH."));
    console.error("         Install git or pass --skip-git-check to override.");
    process.exit(1);
  }

  // 1-b. must be inside a git repository
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "pipe" });
  } catch {
    console.error(c(C.red, "  ERROR: Not inside a git repository."));
    console.error("         Run: git init  — or navigate to your project root.");
    process.exit(1);
  }

  // 1-c. auto-commit uncommitted changes
  const status = execSync("git status --porcelain", { encoding: "utf8" }).trim();

  if (status) {
    console.log("  Uncommitted changes detected:");
    console.log("");
    for (const line of status.split("\n")) {
      console.log(c(C.gray, "    " + line));
    }
    console.log("");
    console.log("  Auto-committing a snapshot before cleanup...");

    try {
      execSync("git add -A", { stdio: "pipe" });
      const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
      const message   = "wip: snapshot before dead code cleanup (" + timestamp + ")";
      execSync('git commit -m "' + message + '"', { stdio: "pipe" });
      console.log(c(C.green, '  ✔ Auto-commit: "' + message + '"'));
      console.log("");
      console.log(c(C.gray, "  To undo (soft — keeps files):    git reset HEAD~1 --soft"));
      console.log(c(C.gray, "  To undo (hard — discards all):   git reset HEAD~1 --hard"));
    } catch (err) {
      console.error(c(C.red, "  ERROR: Auto-commit failed."));
      console.error("         " + err.message);
      console.error("\n  Commit manually, then rerun the script:");
      console.error("    git add -A && git commit -m 'wip: before dead code cleanup'");
      process.exit(1);
    }
  }

  // 1-d. show current HEAD
  const head = execSync("git log -1 --oneline", { encoding: "utf8" }).trim();
  console.log(c(C.green, "  OK: Working tree is clean."));
  console.log(c(C.gray,  "    HEAD -> " + head));
  console.log(c(C.gray,  "    Recovery: git checkout -- ."));
}

// =============================================================
// PHASE 2 — RUN KNIP
// =============================================================
// Runs knip with --reporter json and returns the parsed report.
// knip exits with code 1 when it finds issues — that is expected
// and NOT treated as an error here.
// =============================================================

function runKnip() {
  section(2, "Running knip analysis");
  console.log(c(C.gray, "  Command: npx knip --reporter json"));
  console.log(c(C.gray, "  This may take a few seconds...\n"));

  const result = spawnSync(
    "npx knip --reporter json",
    {
      cwd:       rootDir,
      encoding:  "utf8",
      shell:     true,                 // required on Windows for npx
      maxBuffer: 20 * 1024 * 1024,    // 20MB — handles large projects
    }
  );

  // Spawn-level error (e.g. npx itself not found)
  if (result.error) {
    console.error(c(C.red, "  ERROR: Failed to spawn knip."));
    console.error("         " + result.error.message);
    console.error("  Make sure knip is installed: npm install -D knip");
    process.exit(1);
  }

  const stdout = (result.stdout || "").trim();

  // No stdout and exit 0 -> clean project
  if (!stdout && result.status === 0) {
    console.log(c(C.green, "  OK: knip reports no issues — project is clean!"));
    return null;
  }

  // No stdout but non-zero exit -> likely a knip config/setup error
  if (!stdout) {
    const stderr = (result.stderr || "").trim();
    console.error(c(C.red, "  ERROR: knip produced no JSON output."));
    if (stderr) {
      console.error("\n  knip stderr output:");
      console.error(stderr.split("\n").slice(0, 20).map(function(l) { return "    " + l; }).join("\n"));
    }
    console.error("\n  Troubleshooting tips:");
    console.error("    * Run manually: npx knip --reporter json");
    console.error("    * Make sure knip is installed: npm install -D knip");
    process.exit(1);
  }

  // Parse JSON — knip may prefix stdout with non-JSON on some versions,
  // so we try a fallback if the first parse fails.
  let report;
  try {
    report = JSON.parse(stdout);
  } catch (parseErr) {
    const jsonStart = Math.min(
      stdout.indexOf("{") === -1 ? Infinity : stdout.indexOf("{"),
      stdout.indexOf("[") === -1 ? Infinity : stdout.indexOf("[")
    );

    if (jsonStart !== Infinity) {
      try {
        report = JSON.parse(stdout.slice(jsonStart));
      } catch {
        // fall through to hard error
      }
    }

    if (!report) {
      console.error(c(C.red, "  ERROR: Could not parse knip JSON output."));
      console.error("  First 500 chars of output:\n" + stdout.slice(0, 500));
      if (result.stderr) console.error("  knip stderr:\n" + result.stderr.slice(0, 500));
      console.error("  Parse error: " + parseErr.message);
      process.exit(1);
    }
  }

  // Print any knip warnings from stderr
  const stderr = (result.stderr || "").trim();
  if (stderr) {
    console.log(c(C.yellow, "  knip warnings:"));
    for (const line of stderr.split("\n").slice(0, 15)) {
      console.log(c(C.gray, "    " + line));
    }
    console.log("");
  }

  console.log(c(C.green, "  OK: knip analysis complete."));
  return report;
}

// ── Normalize Knip Report (supports modern Knip v5+ issues array & older formats) ──
function normalizeKnipReport(raw) {
  if (!raw) return null;

  // Modern Knip (v5+): report is { issues: [ { file, files, dependencies, exports, ... } ] }
  if (Array.isArray(raw.issues)) {
    var files = [];
    var exportsMap = {};
    var typesMap = {};
    var dependencies = [];
    var devDependencies = [];
    var unlistedMap = {};
    var unresolvedMap = {};
    var binaries = [];
    var duplicatesMap = {};

    for (var i = 0; i < raw.issues.length; i++) {
      var issue = raw.issues[i];
      var file = issue.file;

      // 1. Unused files
      if (Array.isArray(issue.files) && issue.files.length > 0) {
        for (var fi = 0; fi < issue.files.length; fi++) {
          var f = issue.files[fi];
          var fname = typeof f === "string" ? f : (f.name || file);
          if (fname && files.indexOf(fname) === -1) {
            files.push(fname);
          }
        }
      }

      // 2. Unused dependencies
      if (Array.isArray(issue.dependencies) && issue.dependencies.length > 0) {
        for (var di = 0; di < issue.dependencies.length; di++) {
          dependencies.push(issue.dependencies[di]);
        }
      }

      // 3. Unused devDependencies
      if (Array.isArray(issue.devDependencies) && issue.devDependencies.length > 0) {
        for (var ddi = 0; ddi < issue.devDependencies.length; ddi++) {
          devDependencies.push(issue.devDependencies[ddi]);
        }
      }

      // 4. Unused exports
      if (Array.isArray(issue.exports) && issue.exports.length > 0) {
        exportsMap[file] = issue.exports;
      }

      // 5. Unused types
      if (Array.isArray(issue.types) && issue.types.length > 0) {
        typesMap[file] = issue.types;
      }

      // 6. Unlisted dependencies
      if (Array.isArray(issue.unlisted) && issue.unlisted.length > 0) {
        unlistedMap[file] = issue.unlisted;
      }

      // 7. Unresolved imports
      if (Array.isArray(issue.unresolved) && issue.unresolved.length > 0) {
        unresolvedMap[file] = issue.unresolved;
      }

      // 8. Binaries
      if (Array.isArray(issue.binaries) && issue.binaries.length > 0) {
        for (var bi = 0; bi < issue.binaries.length; bi++) {
          var b = issue.binaries[bi];
          var bname = typeof b === "string" ? b : (b.name || JSON.stringify(b));
          if (bname && binaries.indexOf(bname) === -1) {
            binaries.push(bname);
          }
        }
      }

      // 9. Duplicates
      if (Array.isArray(issue.duplicates) && issue.duplicates.length > 0) {
        duplicatesMap[file] = issue.duplicates;
      }
    }

    return {
      files: files,
      exports: exportsMap,
      types: typesMap,
      dependencies: dependencies,
      devDependencies: devDependencies,
      unlisted: unlistedMap,
      unresolved: unresolvedMap,
      binaries: binaries,
      duplicates: duplicatesMap,
    };
  }

  // Fallback for older Knip formats
  return {
    files: Array.isArray(raw.files) ? raw.files : [],
    exports: (raw.exports && typeof raw.exports === "object") ? raw.exports : {},
    types: (raw.types && typeof raw.types === "object") ? raw.types : {},
    dependencies: Array.isArray(raw.dependencies) ? raw.dependencies : [],
    devDependencies: Array.isArray(raw.devDependencies) ? raw.devDependencies : [],
    unlisted: (raw.unlisted && typeof raw.unlisted === "object") ? raw.unlisted : {},
    unresolved: (raw.unresolved && typeof raw.unresolved === "object") ? raw.unresolved : {},
    binaries: Array.isArray(raw.binaries) ? raw.binaries : [],
    duplicates: (raw.duplicates && typeof raw.duplicates === "object") ? raw.duplicates : {},
  };
}

// =============================================================
// PHASE 3 — PARSE & DISPLAY REPORT
// =============================================================

function displayReport(rawReport) {
  section(3, "Dead code report");

  if (!rawReport) {
    console.log(c(C.green + C.bold, "\n  No dead code found. Project is clean!"));
    return { files: [], exports: {}, types: {}, dependencies: [], devDependencies: [], unlisted: {}, unresolved: {}, binaries: [], duplicates: {} };
  }

  var report = normalizeKnipReport(rawReport);

  // ── Unused Files ──────────────────────────────────────────
  var unusedFiles = Array.isArray(report.files) ? report.files : [];

  console.log("\n" + c(C.bold + C.red, "  UNUSED FILES (" + unusedFiles.length + ")"));
  console.log(c(C.gray, "  " + "─".repeat(58)));
  if (unusedFiles.length === 0) {
    console.log(c(C.green, "    OK: None found."));
  } else {
    for (var i = 0; i < unusedFiles.length; i++) {
      console.log(c(C.red, "    x ") + unusedFiles[i]);
    }
  }

  // ── Unused Exports ────────────────────────────────────────
  var exportsMap  = (report.exports && typeof report.exports === "object") ? report.exports : {};
  var exportFiles = Object.keys(exportsMap);
  var totalExports = exportFiles.reduce(function(acc, f) {
    return acc + (Array.isArray(exportsMap[f]) ? exportsMap[f].length : 0);
  }, 0);

  console.log("\n" + c(C.bold + C.yellow, "  UNUSED EXPORTS (" + totalExports + " across " + exportFiles.length + " file(s))"));
  console.log(c(C.gray, "  " + "─".repeat(58)));
  if (exportFiles.length === 0) {
    console.log(c(C.green, "    OK: None found."));
  } else {
    for (var f in exportsMap) {
      console.log(c(C.yellow, "    " + f));
      var items = Array.isArray(exportsMap[f]) ? exportsMap[f] : [];
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var name = typeof item === "string" ? item : (item.name || JSON.stringify(item));
        var line = item.line ? c(C.gray, ":" + item.line) : "";
        console.log("      -> " + name + line);
      }
    }
  }

  // ── Unused Types / Interfaces ─────────────────────────────
  var typesMap   = (report.types && typeof report.types === "object") ? report.types : {};
  var typeFiles  = Object.keys(typesMap);
  var totalTypes = typeFiles.reduce(function(acc, f) {
    return acc + (Array.isArray(typesMap[f]) ? typesMap[f].length : 0);
  }, 0);

  if (totalTypes > 0) {
    console.log("\n" + c(C.bold + C.magenta, "  UNUSED TYPES / INTERFACES (" + totalTypes + ")"));
    console.log(c(C.gray, "  " + "─".repeat(58)));
    for (var tf in typesMap) {
      console.log(c(C.magenta, "    " + tf));
      var titems = Array.isArray(typesMap[tf]) ? typesMap[tf] : [];
      for (var ti = 0; ti < titems.length; ti++) {
        var tname = typeof titems[ti] === "string" ? titems[ti] : (titems[ti].name || "");
        var tline = titems[ti].line ? c(C.gray, ":" + titems[ti].line) : "";
        console.log("      -> " + tname + tline);
      }
    }
  }

  // ── Unused Dependencies ───────────────────────────────────
  var unusedDeps    = Array.isArray(report.dependencies)    ? report.dependencies    : [];
  var unusedDevDeps = Array.isArray(report.devDependencies) ? report.devDependencies : [];
  var totalDeps     = unusedDeps.length + unusedDevDeps.length;

  console.log("\n" + c(C.bold + C.blue, "  UNUSED DEPENDENCIES (" + totalDeps + ")"));
  console.log(c(C.gray, "  " + "─".repeat(58)));
  if (totalDeps === 0) {
    console.log(c(C.green, "    OK: None found."));
  } else {
    for (var di = 0; di < unusedDeps.length; di++) {
      var dname = typeof unusedDeps[di] === "string" ? unusedDeps[di] : (unusedDeps[di].name || JSON.stringify(unusedDeps[di]));
      console.log(c(C.blue, "    x " + dname) + c(C.gray, "  (dependency)"));
    }
    for (var ddi = 0; ddi < unusedDevDeps.length; ddi++) {
      var ddname = typeof unusedDevDeps[ddi] === "string" ? unusedDevDeps[ddi] : (unusedDevDeps[ddi].name || JSON.stringify(unusedDevDeps[ddi]));
      console.log(c(C.blue, "    x " + ddname) + c(C.gray, "  (devDependency)"));
    }
  }

  // ── Unlisted (used in code but NOT in package.json) ───────
  var unlistedMap   = (report.unlisted && typeof report.unlisted === "object") ? report.unlisted : {};
  var unlistedFiles = Object.keys(unlistedMap);
  var totalUnlisted = unlistedFiles.reduce(function(acc, f) {
    return acc + (Array.isArray(unlistedMap[f]) ? unlistedMap[f].length : 0);
  }, 0);

  if (totalUnlisted > 0) {
    console.log("\n" + c(C.bold + C.red, "  UNLISTED DEPENDENCIES — used in code but NOT in package.json (" + totalUnlisted + ")"));
    console.log(c(C.gray, "  " + "─".repeat(58)));
    console.log(c(C.yellow, "  Fix these FIRST before deleting anything else!"));
    for (var uf in unlistedMap) {
      console.log(c(C.red, "    " + uf));
      var uitems = Array.isArray(unlistedMap[uf]) ? unlistedMap[uf] : [];
      for (var ui = 0; ui < uitems.length; ui++) {
        var uname = typeof uitems[ui] === "string" ? uitems[ui] : (uitems[ui].name || JSON.stringify(uitems[ui]));
        console.log(c(C.gray, "      -> " + uname));
      }
    }
  }

  // ── Unlisted Binaries ─────────────────────────────────────
  var binaries = Array.isArray(report.binaries) ? report.binaries : [];
  if (binaries.length > 0) {
    console.log("\n" + c(C.bold + C.magenta, "  UNLISTED BINARIES (" + binaries.length + ")"));
    console.log(c(C.gray, "  " + "─".repeat(58)));
    for (var bi = 0; bi < binaries.length; bi++) {
      console.log(c(C.magenta, "    ! ") + binaries[bi]);
    }
  }

  // ── Duplicate Exports ─────────────────────────────────────
  var dupMap = (report.duplicates && typeof report.duplicates === "object") ? report.duplicates : {};
  var dupFiles = Object.keys(dupMap);
  var totalDups = dupFiles.reduce(function(acc, f) {
    return acc + (Array.isArray(dupMap[f]) ? dupMap[f].length : 0);
  }, 0);
  if (totalDups > 0) {
    console.log("\n" + c(C.bold + C.yellow, "  DUPLICATE EXPORTS (" + totalDups + " across " + dupFiles.length + " file(s))"));
    console.log(c(C.gray, "  " + "─".repeat(58)));
    for (var df in dupMap) {
      console.log(c(C.yellow, "    " + df));
      var groups = Array.isArray(dupMap[df]) ? dupMap[df] : [];
      for (var gi = 0; gi < groups.length; gi++) {
        var group = groups[gi];
        if (Array.isArray(group)) {
          var names = group.map(function(item) {
            return (item.name || JSON.stringify(item)) + (item.line ? ":" + item.line : "");
          }).join(" | ");
          console.log(c(C.gray, "      -> " + names));
        }
      }
    }
  }

  // ── Unresolved Imports ────────────────────────────────────
  var unresolvedMap   = (report.unresolved && typeof report.unresolved === "object") ? report.unresolved : {};
  var unresolvedFiles = Object.keys(unresolvedMap);
  var totalUnresolved = unresolvedFiles.reduce(function(acc, f) {
    return acc + (Array.isArray(unresolvedMap[f]) ? unresolvedMap[f].length : 0);
  }, 0);

  if (totalUnresolved > 0) {
    console.log("\n" + c(C.bold + C.red, "  UNRESOLVED IMPORTS (" + totalUnresolved + ")"));
    console.log(c(C.gray, "  " + "─".repeat(58)));
    for (var urf in unresolvedMap) {
      console.log(c(C.red, "    " + urf));
      var uritems = Array.isArray(unresolvedMap[urf]) ? unresolvedMap[urf] : [];
      for (var uri = 0; uri < uritems.length; uri++) {
        var urname = typeof uritems[uri] === "string" ? uritems[uri] : (uritems[uri].name || JSON.stringify(uritems[uri]));
        console.log(c(C.gray, "      -> " + urname));
      }
    }
  }

  // ── Totals Summary ────────────────────────────────────────
  console.log("\n" + c(C.cyan, "═".repeat(62)));
  console.log(c(C.bold, "  TOTALS"));
  console.log(c(C.cyan, "─".repeat(62)));
  console.log("    Unused files:       " + c(unusedFiles.length > 0 ? C.red     : C.green, String(unusedFiles.length).padStart(4)));
  console.log("    Unused exports:     " + c(totalExports      > 0 ? C.yellow  : C.green, String(totalExports).padStart(4)));
  console.log("    Unused types:       " + c(totalTypes        > 0 ? C.magenta : C.green, String(totalTypes).padStart(4)));
  console.log("    Unused deps:        " + c(totalDeps         > 0 ? C.blue    : C.green, String(totalDeps).padStart(4)));
  if (binaries.length > 0) {
    console.log("    Unlisted binaries:  " + c(C.magenta, String(binaries.length).padStart(4)));
  }
  if (totalDups > 0) {
    console.log("    Duplicate exports:  " + c(C.yellow, String(totalDups).padStart(4)));
  }
  if (totalUnlisted > 0) {
    console.log("    Unlisted deps:      " + c(C.red, String(totalUnlisted).padStart(4)) + "  <- fix these first!");
  }
  if (totalUnresolved > 0) {
    console.log("    Unresolved imports: " + c(C.red, String(totalUnresolved).padStart(4)));
  }
  console.log(c(C.cyan, "═".repeat(62)));

  return {
    files:           unusedFiles,
    exports:         exportsMap,
    types:           typesMap,
    dependencies:    unusedDeps,
    devDependencies: unusedDevDeps,
    unlisted:        unlistedMap,
    unresolved:      unresolvedMap,
    binaries:        binaries,
    duplicates:      dupMap,
  };
}

// =============================================================
// PHASE 4 — WRITE MODE (delete files + uninstall deps)
// =============================================================
// Only runs when --write flag is passed.
// Unused exports are NOT auto-removed — too risky without
// knowing local vs re-exported usage. Review them manually.
// =============================================================

function applyChanges(findings) {
  var files           = findings.files;
  var dependencies    = findings.dependencies;
  var devDependencies = findings.devDependencies;

  section(4, "Applying changes (--write mode)");

  // 4a: Delete dead files
  if (files.length > 0) {
    console.log("\n  Deleting unused files... (" + files.length + ")");
    for (var i = 0; i < files.length; i++) {
      var relPath = files[i];
      var absPath = path.resolve(rootDir, relPath);
      try {
        if (fs.existsSync(absPath)) {
          fs.rmSync(absPath, { recursive: true, force: true });
          console.log(c(C.red, "    x deleted: ") + relPath);
        } else {
          console.log(c(C.gray, "    ~ skipped (not found): " + relPath));
        }
      } catch (err) {
        console.error(c(C.red, "    ERROR deleting " + relPath + ": " + err.message));
      }
    }
  } else {
    console.log(c(C.green, "\n  OK: No unused files to delete."));
  }

  // 4b: Uninstall unused dependencies
  var allUnused = [];
  for (var di = 0; di < dependencies.length; di++) {
    var d = dependencies[di];
    var dname = typeof d === "string" ? d : d.name;
    if (dname) allUnused.push(dname);
  }
  for (var ddi = 0; ddi < devDependencies.length; ddi++) {
    var dd = devDependencies[ddi];
    var ddname = typeof dd === "string" ? dd : dd.name;
    if (ddname) allUnused.push(ddname);
  }

  if (allUnused.length > 0) {
    console.log("\n  Uninstalling unused dependencies... (" + allUnused.length + ")");
    console.log(c(C.gray, "    " + allUnused.join(", ")));
    try {
      execSync("npm uninstall " + allUnused.join(" "), {
        cwd: rootDir,
        stdio: "inherit",
      });
      console.log(c(C.green, "\n  OK: Uninstall complete."));
    } catch (err) {
      console.error(c(C.red, "  ERROR during npm uninstall: " + err.message));
    }
  } else {
    console.log(c(C.green, "\n  OK: No unused dependencies to uninstall."));
  }

  // 4c: Note about unused exports
  console.log("\n" + c(C.yellow, "  NOTE: Unused exports are not auto-removed."));
  console.log(c(C.gray, "        Auto-removing exports can break re-exports and barrel files."));
  console.log(c(C.gray, "        Review the list from Phase 3 and remove them manually."));
}

// =============================================================
// PHASE 5 — GIT DIFF + NEXT STEPS
// =============================================================
// Shows what changed. No build step — you test it yourself.
// =============================================================

function postWriteSummary() {
  section(5, "Git diff + next steps");
  console.log("");

  try {
    var diff = execSync("git diff HEAD", { encoding: "utf8" });
    if (!diff.trim()) {
      console.log(c(C.gray, "  (No diff yet — deleted files may be untracked.)"));
      console.log(c(C.gray, "  Run: git status  to see all changes."));
    } else {
      console.log(diff);
    }
  } catch (err) {
    console.warn(c(C.yellow, "  Could not run git diff: " + err.message));
  }

  console.log(c(C.bold, "\n--- Next steps " + "─".repeat(47)));
  console.log("");
  console.log("  1. Review the report and diff above carefully.");
  console.log("  2. Manually remove unused exports listed in Phase 3.");
  console.log("");
  console.log("  Commit the cleanup:");
  console.log(c(C.cyan, "    git add -A && git commit -m 'chore: remove dead code and unused deps'"));
  console.log("");
  console.log("  Verify the app still works:");
  console.log(c(C.cyan, "    npm run dev"));
  console.log("");
  console.log("  If something broke, restore everything:");
  console.log(c(C.cyan, "    git checkout -- ."));
  console.log("  Or undo the Phase 1 auto-commit entirely:");
  console.log(c(C.cyan, "    git reset HEAD~1 --hard"));
  console.log("─".repeat(62));
}

// =============================================================
// ENTRY POINT
// =============================================================

function main() {
  banner(
    writeChanges
      ? "DEAD CODE CLEANUP  -  WRITE MODE  (changes will be applied)"
      : "DEAD CODE CLEANUP  -  DRY RUN    (no changes will be made)"
  );

  console.log(c(C.gray, "  Mode: " + (writeChanges ? c(C.red + C.bold, "WRITE") : c(C.green + C.bold, "DRY RUN"))));
  console.log(c(C.gray, "  Root: " + rootDir));

  checkGitStatus();      // Phase 1
  var rawReport = runKnip();     // Phase 2
  var findings  = displayReport(rawReport); // Phase 3

  var hasIssues =
    findings.files.length > 0 ||
    Object.keys(findings.exports).length > 0 ||
    Object.keys(findings.types).length > 0 ||
    findings.dependencies.length > 0 ||
    findings.devDependencies.length > 0 ||
    findings.binaries.length > 0 ||
    Object.keys(findings.duplicates).length > 0;

  if (!hasIssues) {
    console.log("\n" + c(C.green + C.bold, "  Nothing to clean up. Project is clean!"));
    return;
  }

  if (writeChanges) {
    applyChanges(findings);   // Phase 4
    postWriteSummary();        // Phase 5
  } else {
    console.log("\n" + c(C.cyan, "─".repeat(62)));
    console.log(c(C.bold, "  DRY RUN — No files were changed."));
    console.log("  Review the report above, then apply changes with:");
    console.log(c(C.cyan, "    node scripts/find-dead-code.mjs --write"));
    console.log(c(C.cyan, "─".repeat(62)));
  }
}

main();
