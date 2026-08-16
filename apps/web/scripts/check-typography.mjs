#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const WEB_ROOT = join(import.meta.dirname, "..");
const SRC_ROOT = join(WEB_ROOT, "src");
const BASELINE_PATH = join(import.meta.dirname, "typography-baseline.json");
const UPDATE = process.argv.includes("--update");

const SKIP_DIRS = new Set(["node_modules", ".next", "coverage", "test-results"]);
const SCANNED_EXT = [".css", ".tsx", ".ts"];

const AUTHORING_ZONES = ["src/app/saqeel.css", "src/components/saqeel/"];

const FROZEN_SHEETS = [
  "src/app/tokens.css",
  "src/app/saqeel-components.css",
  "src/app/saqeel-runtime.css",
  "src/app/v2-components.css",
];

const TYPE_PRIMITIVE = "src/components/saqeel/type/";

const EXPERIMENTAL_TYPE_LAYER = "src/components/experimental/linear/";

const LEGACY_TYPE_CLASSES = [
  "t-display",
  "t-page-title",
  "t-section",
  "t-heading",
  "t-body-lg",
  "t-body",
  "t-compact",
  "t-label",
  "t-meta",
  "t-caption",
  "t-metric",
  "t-mono",
  "id-code",
  "sq-overline",
];

const LEGACY_CLASS_PATTERN = new RegExp(
  `(?<![\\w-])(${LEGACY_TYPE_CLASSES.join("|")})(?![\\w-])`,
);

const RULES = [
  {
    id: "raw-typography-property",
    appliesTo: (path) => path.endsWith(".css"),
    exempt: (path) => inZone(path, AUTHORING_ZONES) || inZone(path, FROZEN_SHEETS),
    pattern: /(?:^|[;{\s])(font-size|font-weight|font-family|font-style|line-height|letter-spacing)\s*:/,
    message:
      "Feature CSS may not declare typography. Render text through <Text>, <Heading>, <Overline>, <Mono> or <Metric> from components/saqeel.",
  },
  {
    id: "font-shorthand-outside-design-system",
    appliesTo: (path) => path.endsWith(".css"),
    exempt: (path) => inZone(path, AUTHORING_ZONES) || inZone(path, FROZEN_SHEETS),
    pattern: /(?:^|[;{\s])font\s*:\s*var\(--sqx-text-/,
    message:
      "A typography token may only be consumed inside components/saqeel. Feature CSS composes the type primitives instead.",
  },
  {
    id: "retired-typography-role",
    appliesTo: (path) => path.endsWith(".css"),
    exempt: (path) => path === "src/app/saqeel.css" || inZone(path, FROZEN_SHEETS),
    pattern: /--sqx-text-(caption|body-lg|title|code)\b/,
    message:
      "Retired role. caption and body-lg are now body; title is display; code is mono. Move the call site to a canonical role.",
  },
  {
    id: "literal-font-family",
    appliesTo: (path) => path.endsWith(".css"),
    exempt: (path) => path === "src/app/saqeel.css" || inZone(path, FROZEN_SHEETS),
    pattern: /font-family\s*:\s*[^;]*["'][A-Za-z]/,
    message:
      "A font family named as a string literal is a claim the font is loaded, and CSS fails silently when it is not. Only var(--sqx-font-sans) / var(--sqx-font-mono).",
  },
  {
    id: "card-eyebrow-above-title",
    appliesTo: (path) => path.endsWith(".tsx"),
    exempt: (path) => path.startsWith("src/components/saqeel/card/"),
    fileMust: /\bCardHeader\b/,
    pattern: /^\s*eyebrow=/,
    message:
      "CardHeader eyebrow renders an overline above the title, which the owner rejected (WEB-014 §5.1). Move the string to `description` so it renders below the title.",
  },
  {
    id: "inline-font-style",
    appliesTo: (path) => path.endsWith(".tsx"),
    exempt: () => false,
    multiline: true,
    pattern: /style=\{\{[^}]*(?:font|letterSpacing|lineHeight)/g,
    message: "Inline font styling is never permitted. Use a type primitive.",
  },
  {
    id: "legacy-type-class-in-jsx",
    appliesTo: (path) => path.endsWith(".tsx"),
    exempt: () => false,
    pattern: LEGACY_CLASS_PATTERN,
    message:
      "A legacy typography class renders off the SAQEEL scale from JSX, where no CSS rule can see it. Render the text through a type primitive instead.",
  },
  {
    id: "legacy-type-token",
    appliesTo: (path) => path.endsWith(".css") || path.endsWith(".tsx") || path.endsWith(".ts"),
    exempt: (path) => inZone(path, FROZEN_SHEETS),
    pattern: /--type-[a-z]/,
    message:
      "The pre-SAQEEL --type-* scale is frozen legacy. Its sizes are not the nine roles; move the call site to a type primitive.",
  },
];

function inZone(path, zones) {
  return zones.some((zone) => (zone.endsWith("/") ? path.startsWith(zone) : path === zone));
}

function walk(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, found);
      continue;
    }
    if (SCANNED_EXT.some((ext) => entry.endsWith(ext))) found.push(full);
  }
  return found;
}

function scan() {
  const violations = [];
  for (const file of walk(SRC_ROOT)) {
    const path = relative(WEB_ROOT, file).split(sep).join("/");
    if (path.startsWith(TYPE_PRIMITIVE) || path.startsWith(EXPERIMENTAL_TYPE_LAYER)) continue;
    const source = readFileSync(file, "utf8");
    const lines = source.split("\n");
    for (const rule of RULES) {
      if (!rule.appliesTo(path) || rule.exempt(path)) continue;
      if (rule.fileMust !== undefined && !rule.fileMust.test(source)) continue;
      if (rule.multiline === true) {
        for (const match of source.matchAll(rule.pattern)) {
          const line = source.slice(0, match.index).split("\n").length;
          violations.push({
            path,
            line,
            rule: rule.id,
            message: rule.message,
            text: match[0].split("\n")[0].trim(),
          });
        }
        continue;
      }
      lines.forEach((line, index) => {
        if (rule.pattern.test(line)) {
          violations.push({ path, line: index + 1, rule: rule.id, message: rule.message, text: line.trim() });
        }
      });
    }
  }
  return violations;
}

function tally(violations) {
  const counts = {};
  for (const violation of violations) {
    const key = `${violation.path}::${violation.rule}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

const violations = scan();
const counts = tally(violations);

if (UPDATE) {
  writeFileSync(BASELINE_PATH, `${JSON.stringify(counts, null, 2)}\n`, "utf8");
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  console.log(`typography baseline written: ${total} known violations across ${Object.keys(counts).length} entries.`);
  process.exit(0);
}

const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf8")) : {};

const improvements = [];
for (const [key, allowed] of Object.entries(baseline)) {
  const actual = counts[key] ?? 0;
  if (actual < allowed) improvements.push({ key, allowed, actual });
}

const totalNow = Object.values(counts).reduce((sum, n) => sum + n, 0);
const totalBaseline = Object.values(baseline).reduce((sum, n) => sum + n, 0);

const newViolations = [];
for (const [key, actual] of Object.entries(counts)) {
  const allowed = baseline[key] ?? 0;
  if (actual > allowed) {
    const [path, rule] = key.split("::");
    const offending = violations.filter((v) => v.path === path && v.rule === rule).slice(allowed);
    newViolations.push(...offending);
  }
}

if (newViolations.length > 0) {
  console.error(`\nTypography gate FAILED — ${newViolations.length} new violation(s).\n`);
  const byRule = {};
  for (const violation of newViolations) {
    byRule[violation.rule] = byRule[violation.rule] ?? [];
    byRule[violation.rule].push(violation);
  }
  for (const [rule, entries] of Object.entries(byRule)) {
    console.error(`  [${rule}] ${entries[0].message}`);
    for (const entry of entries) console.error(`    ${entry.path}:${entry.line}  ${entry.text}`);
    console.error("");
  }
  process.exit(1);
}

if (improvements.length > 0) {
  console.log(`Typography gate PASSED — ${totalBaseline - totalNow} violation(s) removed since the baseline.`);
  console.log("Run `npm run gates:typography:update` to lock the improvement in.");
} else {
  console.log(`Typography gate PASSED — ${totalNow} known violation(s) remaining, none new.`);
}
