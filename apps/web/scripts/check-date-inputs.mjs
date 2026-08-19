#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const WEB_ROOT = join(import.meta.dirname, "..");
const SRC_ROOT = join(WEB_ROOT, "src");
const BASELINE_PATH = join(import.meta.dirname, "date-inputs-baseline.json");
const UPDATE = process.argv.includes("--update");

const SKIP_DIRS = new Set(["node_modules", ".next", "coverage", "test-results"]);
const SCANNED_EXT = [".tsx", ".ts"];

const RAW_DATE = /type\s*=\s*["']date["']/g;

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full, out);
    } else if (SCANNED_EXT.some(ext => entry.endsWith(ext))) {
      out.push(full);
    }
  }
}

const files = [];
walk(SRC_ROOT, files);

const findings = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const matches = source.match(RAW_DATE);
  if (matches) findings.push({ file: relative(WEB_ROOT, file).replaceAll("\\", "/"), count: matches.length });
}
const total = findings.reduce((sum, entry) => sum + entry.count, 0);

if (UPDATE) {
  writeFileSync(BASELINE_PATH, `${JSON.stringify({ total, files: findings.sort((a, b) => a.file.localeCompare(b.file)) }, null, 2)}\n`);
  console.log(`date-inputs baseline written: ${total} raw date input(s) across ${findings.length} file(s).`);
  process.exit(0);
}

const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")).total : 0;

if (total > baseline) {
  console.error(`\nWEB-015 date-input gate: ${total} raw \`type="date"\` input(s), baseline is ${baseline}.\n`);
  for (const entry of findings) console.error(`  ${entry.file}  (${entry.count})`);
  console.error(`\nUse DatePickerField / DatePicker from components/saqeel, never a raw date input (WEB-015).`);
  process.exit(1);
}

console.log(
  total < baseline
    ? `Date-input gate PASSED — ${baseline - total} raw date input(s) removed since the baseline. Run \`npm run gates:date-inputs -- --update\` to lock it in.`
    : `Date-input gate PASSED — ${total} known raw date input(s), none new.`,
);
