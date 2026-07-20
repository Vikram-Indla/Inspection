#!/usr/bin/env node
// Saqeel V5 design-system guardrails (CC-SAQEEL-V5-IMPLEMENTATION-001, Wave 1 §5.3).
// Fails CI on reintroduced V1 regressions. Run: node scripts/check-design-system-v5.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = join(import.meta.dirname, "..", "src");
const SKIP_DIRS = new Set(["node_modules", ".next"]);
const TEXT_EXT = new Set([".ts", ".tsx", ".css", ".module.css"]);

/** @type {{id: string, pattern: RegExp, exts: Set<string>, message: string, exclude?: RegExp}[]} */
const RULES = [
  {
    id: "raw-input-radius-12px",
    pattern: /border-radius:\s*12px/,
    exts: new Set([".css"]),
    message: "12px generic input radius reintroduced — use var(--ax-radius-input) (6px, V2).",
  },
  {
    id: "transparent-loading-label",
    pattern: /\.is-loading\s*\{[^}]*color:\s*transparent/,
    exts: new Set([".css"]),
    message: "Loading buttons must keep their label visible (V2) — do not set color:transparent on .is-loading text.",
    // Icon-only buttons have no label to hide — .ax-btn--icon.is-loading intentionally stays transparent (spinner replaces the icon).
    exclude: /--icon/,
  },
  {
    id: "utc-slice-date-format",
    pattern: /toISOString\(\)\.slice\(/,
    exts: new Set([".tsx", ".ts"]),
    message: "Raw toISOString().slice() for a user-facing date — use lib/dates.ts (Asia/Riyadh) for display text. (OK for <input type=date> value wiring — audit call site.)",
  },
  {
    // Narrow to true pictographic emoji (camera/shield/map/eye/etc). Deliberately
    // excludes the U+2600-27BF dingbat range (✓ ✕ ● ▲ ◆ ⟳ →) — those are the
    // FND-011 glyph+label status system astryx.css itself defines, not V1 bugs.
    id: "emoji-as-icon",
    pattern: /[\u{1F300}-\u{1FAFF}⛔]/u,
    exts: new Set([".tsx"]),
    message: "Pictographic emoji used as a product icon — use components/icons Icon (SVG), per V2.",
  },
];

let violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) { walk(full); continue; }
    const ext = extname(entry);
    if (!TEXT_EXT.has(ext)) continue;
    const text = readFileSync(full, "utf8");
    for (const rule of RULES) {
      if (!rule.exts.has(ext)) continue;
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        if (rule.exclude && rule.exclude.test(line)) return;
        if (rule.pattern.test(line)) {
          violations.push({ file: full.replace(process.cwd() + "/", ""), line: i + 1, rule: rule.id, message: rule.message, code: line.trim().slice(0, 120) });
        }
      });
    }
  }
}

walk(ROOT);

if (violations.length) {
  console.error(`\nSaqeel V5 design-system guardrail: ${violations.length} finding(s)\n`);
  for (const v of violations) {
    console.error(`${v.file}:${v.line}  [${v.rule}]\n  ${v.message}\n  > ${v.code}\n`);
  }
  console.error("Fix or explicitly allowlist (edit scripts/check-design-system-v5.mjs) before merge.");
  process.exit(1);
} else {
  console.log("Saqeel V5 design-system guardrail: clean.");
}
