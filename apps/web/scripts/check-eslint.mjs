#!/usr/bin/env node
// ESLint ratchet, the same shape as check-typography.mjs.
//
// A fresh ESLint over 814 legacy .tsx files reports thousands of findings, and
// a gate that is red on day one is a gate nobody reads — the failure mode
// 01-PROJECT-STATUS.md records for `npm run gates`. So this is a ratchet, not a
// threshold: every finding is counted per file::rule, compared against
// eslint-baseline.json, and the run fails only on a count that went UP.
//
// The baseline may only shrink. WEB-014 §8's rule for the typography gate
// applies here verbatim: a task that raises it is rejected on sight. The one
// exception is a change that improves DETECTION rather than adding violations
// — a new rule, or a fixed false negative — which is a deliberate re-baseline
// and is recorded in the session record that makes it.
//
// Run:  node scripts/check-eslint.mjs
//       node scripts/check-eslint.mjs --update    (lock in an improvement)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { ESLint } from "eslint";

const ROOT = join(import.meta.dirname, "..");
const BASELINE_PATH = join(import.meta.dirname, "eslint-baseline.json");
const UPDATE = process.argv.includes("--update");

const eslint = new ESLint({ cwd: ROOT });
const results = await eslint.lintFiles(["."]);

const violations = [];
for (const result of results) {
  const path = relative(ROOT, result.filePath).split("\\").join("/");
  for (const message of result.messages) {
    if (message.severity !== 2) continue;
    violations.push({
      path,
      rule: message.ruleId ?? "parse-error",
      line: message.line ?? 0,
      message: message.message,
    });
  }
}

const counts = {};
for (const violation of violations) {
  const key = `${violation.path}::${violation.rule}`;
  counts[key] = (counts[key] ?? 0) + 1;
}

if (UPDATE) {
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(BASELINE_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  console.log(`ESLint baseline written: ${total} known violations across ${Object.keys(counts).length} entries.`);
  process.exit(0);
}

const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")) : {};

const improvements = [];
for (const [key, allowed] of Object.entries(baseline)) {
  if ((counts[key] ?? 0) < allowed) improvements.push(key);
}

const totalNow = Object.values(counts).reduce((sum, n) => sum + n, 0);
const totalBaseline = Object.values(baseline).reduce((sum, n) => sum + n, 0);

const newViolations = [];
for (const [key, actual] of Object.entries(counts)) {
  const allowed = baseline[key] ?? 0;
  if (actual <= allowed) continue;
  const [path, rule] = key.split("::");
  newViolations.push(...violations.filter(v => v.path === path && v.rule === rule).slice(allowed));
}

if (newViolations.length > 0) {
  console.error(`\nESLint gate FAILED — ${newViolations.length} new violation(s).\n`);
  const byRule = {};
  for (const violation of newViolations) {
    byRule[violation.rule] = byRule[violation.rule] ?? [];
    byRule[violation.rule].push(violation);
  }
  for (const [rule, entries] of Object.entries(byRule)) {
    console.error(`  [${rule}]`);
    for (const entry of entries) console.error(`    ${entry.path}:${entry.line}  ${entry.message}`);
    console.error("");
  }
  process.exit(1);
}

if (improvements.length > 0) {
  console.log(`ESLint gate PASSED — ${totalBaseline - totalNow} violation(s) removed since the baseline.`);
  console.log("Run `npm run lint:update` to lock the improvement in.");
} else {
  console.log(`ESLint gate PASSED — ${totalNow} known violation(s) remaining, none new.`);
}
