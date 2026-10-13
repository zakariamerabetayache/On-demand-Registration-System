import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(scriptDir, "..", "src");
const writeChanges = process.argv.includes("--write");

function findSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return findSourceFiles(fullPath);
    }

    return entry.isFile() && /\.(js|jsx)$/i.test(entry.name)
      ? [fullPath]
      : [];
  });
}

function isConsoleLog(node) {
  if (
    !node ||
    !["CallExpression", "OptionalCallExpression"].includes(node.type)
  ) {
    return false;
  }

  const callee = node.callee;

  if (
    !callee ||
    !["MemberExpression", "OptionalMemberExpression"].includes(callee.type) ||
    callee.object?.type !== "Identifier" ||
    callee.object.name !== "console"
  ) {
    return false;
  }

  return callee.computed
    ? callee.property?.type === "StringLiteral" &&
        callee.property.value === "log"
    : callee.property?.name === "log";
}

function findStandaloneLogs(node, matches = []) {
  if (!node || typeof node !== "object") return matches;

  if (Array.isArray(node)) {
    for (const child of node) findStandaloneLogs(child, matches);
    return matches;
  }

  // Only remove statements whose entire expression is console.log(...).
  if (
    node.type === "ExpressionStatement" &&
    isConsoleLog(node.expression)
  ) {
    matches.push({ start: node.start, end: node.end });
    return matches;
  }

  for (const [key, value] of Object.entries(node)) {
    if (
      [
        "loc",
        "start",
        "end",
        "extra",
        "leadingComments",
        "trailingComments",
        "innerComments",
        "tokens",
        "comments",
      ].includes(key)
    ) {
      continue;
    }

    findStandaloneLogs(value, matches);
  }

  return matches;
}

function removeWholeLineWhenPossible(source, start, end) {
  const lineStart = source.lastIndexOf("\n", start - 1) + 1;
  const newline = source.indexOf("\n", end);
  const lineEnd = newline === -1 ? source.length : newline;

  const onlyIndentBefore = source.slice(lineStart, start).trim() === "";
  const onlyWhitespaceAfter = source.slice(end, lineEnd).trim() === "";

  if (onlyIndentBefore && onlyWhitespaceAfter) {
    return {
      start: lineStart,
      end: newline === -1 ? lineEnd : lineEnd + 1,
    };
  }

  return { start, end };
}

function processFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(srcDir, filePath);

  let ast;

  try {
    ast = parse(source, {
      sourceType: "unambiguous",
      plugins: ["jsx"],
    });
  } catch (error) {
    console.error(`Could not parse ${relativePath}: ${error.message}`);
    return { count: 0, failed: true };
  }

  const matches = findStandaloneLogs(ast);

  if (matches.length === 0) return { count: 0, failed: false };

  console.log(
    `${writeChanges ? "Removing" : "Found"} ${matches.length} console.log statement(s): ${relativePath}`
  );

  if (writeChanges) {
    const ranges = matches
      .map(({ start, end }) =>
        removeWholeLineWhenPossible(source, start, end)
      )
      .sort((a, b) => b.start - a.start);

    let cleaned = source;

    // Work backwards so earlier source positions remain valid.
    for (const range of ranges) {
      cleaned =
        cleaned.slice(0, range.start) + cleaned.slice(range.end);
    }

    fs.writeFileSync(filePath, cleaned, "utf8");
  }

  return { count: matches.length, failed: false };
}

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory not found: ${srcDir}`);
  process.exitCode = 1;
} else {
  const files = findSourceFiles(srcDir);
  let total = 0;
  let failed = false;

  for (const file of files) {
    const result = processFile(file);
    total += result.count;
    failed ||= result.failed;
  }

  console.log(`\nTotal standalone console.log statements: ${total}`);

  if (!writeChanges) {
    console.log("Preview only. No files were changed.");
    console.log("Review the matches, then rerun with --write to remove them.");
  } else {
    console.log("Cleanup finished. Review the changes and test your app.");
  }

  if (failed) process.exitCode = 1;
}
