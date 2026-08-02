import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Terminology regression guard — plain-language remediation project.
// Fails if a prohibited developer-facing or banned term reappears in
// genuinely user-visible production source. Scans JSX/TSX literal text,
// aria-label attributes, and t()-call fallback strings under apps/web/src.
// Deliberately excludes: internal symbol/type/component/prop/file names,
// comments (both // and JSX {/* */} styles), console.* developer logs,
// e2e/test files, and technical documentation.

const webRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(webRoot, "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function isCommentLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("{/*") || t.endsWith("*/}") || t === "*/";
}

function isDeveloperLogLine(line: string): boolean {
  return /console\.(error|warn|log|info|debug)\s*\(/.test(line);
}

// Known internal-only patterns that legitimately still contain "dossier" —
// symbol/type/component/prop/file/CSS-class names, never rendered as
// literal user text. Each of these is a deliberate architectural choice
// documented in docs/terminology/PLAIN_LANGUAGE_INVENTORY.csv (finding
// F0-048 and related) — do not remove an entry without re-verifying the
// underlying symbol is still internal-only.
const DOSSIER_ALLOW = [
  /loadFactory360Dossier/,
  /Factory360Dossier/,
  /\bdossierStrings\b/,
  /dossier_href/,
  /lib\/factory360\/dossier/,
  /lg-atlas3d__dossier/,
  /data-factory360-layout/,
  /FEATURE_DECISION_DOSSIER/, // protected env var name, reviewed in Wave 4 (W4-MANUAL-008)
  /SaudiAtlasDossier/, // login-page decorative Atlas component, internal name
  /DossierStrings/, // type name for the above component's props
  /IdentityDossier/, // planning single-visit-flow component, internal name
  /\bopenDossier\b/, // internal prop/key name on regulations page (renders "Open record")
  /reg-dossier-h/, // HTML id attribute, not visible text
  /^\s*(const|let)\s+\w+\s*=\s*dossier\b/, // `const cr = dossier.cr;` style destructuring
  /\bdossier\.(found|cr|crError|selected|factory|address|lines|reports|observedComparison|latestApprovedFactorySnapshot|governmentResult|docs|government)\b/, // canonical-projection.ts/route.ts/my-tasks internal field access
  /\bdossier\?\.\w+/, // optional-chaining property access on the internal dossier variable
  /[!?]\s*dossier\b(?!\.\w*Strings)/, // `if (!dossier)` / `dossier ?` truthiness checks on the internal variable
  /\bblankDossier\b/,
  /^\s*dossier:\s*(\{|string;|t\()/, // object-literal / type-field key named `dossier`
  /}\s*=\s*dossier;/, // `const { ... } = dossier;` destructure, single- or multi-line
  /lineNames\(dossier,/, // internal helper call passing the dossier var as an argument
  /ar-dossier/, // CSS class name
  /\bL\.dossier\b/, // property access on an internal EN/AR strings-lookup object
  /^\s*(en|ar):\s*\{.*\bdossier:/, // inline strings-object literal whose KEY is named `dossier` (value already remediated)
  /\bdossierHref\b/, // internal variable name (establishments list row link target)
  /"field\.establishments\.noDossier"|"field\.myTasks\.noDossier"/, // i18n key names; rendered values are already plain-language
  /styles\.dossier\b/, // CSS module class reference
  /"f360\.list\.dossier":/, // key name in the AR fallback map; value already "عرض المصنع"
  /There is no dossier and no locked site/, // JSX comment continuation line (opening {\/\* is on the prior line)
  /strings\.dossier\b/, // property access in FactoryList.tsx, a dead/unimported component (verified: not referenced anywhere)
  /FactoryDossierError|FactoryLicenseDossierError/, // error-boundary component function names, no rendered text
  /"f360\.list\.dossier",\s*"View factory"/, // key name; value is already the plain-language string
];

// Internal-only "workspace" occurrences — component/type/file/CSS-class
// names and console.error tags, never rendered as literal user text.
// Rule of law: "Never a Workspace label" (terminology programme, 2026-08).
const WORKSPACE_ALLOW = [
  /\bWorkspace\b/, // component name (./Workspace, WorkspaceStrings, WorkspacePanel, AuditReplayWorkspace)
  /ar-workspace/, // CSS class name
  /workspace\.module\.css/, // CSS module file path
  /styles\.workspace\b/, // CSS module class reference
  /data-workspace-state/, // DOM data-attribute name, not visible text
  /cd-review-workspace-grid/, // CSS class name
  /no-workspace/i, // route segment /launch/no-workspace
  /LEASE-SAQEEL-PWA-WORKSPACE/, // lease/task id
  /ComplianceRequestWorkspace/, // internal component function name
  /WorkspaceStrings/, // internal type/prop name
  /"ops\.map\.workspaceLabel"/, // i18n key name; rendered value is already "Operations map"
  /"access\.noWorkspace\.\w+"/, // i18n key names on /launch/no-workspace; rendered values already say "role", not "workspace"
];

// Prohibited literal phrases the task's plain-language remediation banned
// from user-visible production copy.
const BANNED_PHRASES = [
  "CR dossier",
  "Factory dossier",
  "factory registry",
  "plan register",
  "penalty lineage",
  "Evidence readiness & SLA-risk fingerprint",
  "scan-first queue",
  "contract-unverified",
  "RLS-scoped",
];

// A line only counts as "rendered to the user" if it's JSX text/attribute
// content or a t()-call fallback — not an internal payload string (e.g. an
// object passed to an AI provider) or a developer log tag.
function looksUserRendered(line: string): boolean {
  if (isDeveloperLogLine(line)) return false;
  if (/JSON\.stringify\(/.test(line)) return false; // internal serialized payload, not UI
  return /\bt\(\s*"[^"]*"\s*,\s*"/.test(line) || /aria-label=/.test(line) || /alt=/.test(line) || />[^<]*</.test(line);
}

test.describe("Terminology regression guard", () => {
  test("no bare 'dossier' outside known internal-symbol allowlist", () => {
    const offenders: string[] = [];
    for (const file of walk(srcRoot)) {
      const rel = path.relative(webRoot, file);
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!/dossier/i.test(line)) return;
        if (isCommentLine(line)) return;
        if (isDeveloperLogLine(line)) return;
        if (DOSSIER_ALLOW.some((re) => re.test(line))) return;
        offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 160)}`);
      });
    }
    expect(offenders, `Bare "dossier" found outside the internal-symbol allowlist:\n${offenders.join("\n")}`).toEqual([]);
  });

  test("no banned plain-language-remediation phrases in user-rendered production source", () => {
    const offenders: string[] = [];
    for (const file of walk(srcRoot)) {
      const rel = path.relative(webRoot, file);
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (isCommentLine(line)) return;
        if (!looksUserRendered(line)) return;
        for (const phrase of BANNED_PHRASES) {
          if (line.includes(phrase)) {
            offenders.push(`${rel}:${i + 1}: banned phrase "${phrase}" — ${line.trim().slice(0, 160)}`);
          }
        }
      });
    }
    expect(offenders, `Banned terminology found in user-rendered production source:\n${offenders.join("\n")}`).toEqual([]);
  });

  test("'server-side projection' and 'read model' do not leak into headings or banners", () => {
    // Legitimate architecture terms in comments/docs, but must never appear
    // as literal rendered heading/banner/caption text.
    const offenders: string[] = [];
    const jargon = ["server-side projection", "read model"];
    for (const file of walk(srcRoot)) {
      const rel = path.relative(webRoot, file);
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (isCommentLine(line)) return;
        if (!looksUserRendered(line)) return;
        for (const phrase of jargon) {
          if (line.toLowerCase().includes(phrase)) offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 160)}`);
        }
      });
    }
    expect(offenders, `Architecture jargon leaking into rendered text:\n${offenders.join("\n")}`).toEqual([]);
  });

  test("no bare 'workspace' in user-rendered production text outside the internal-symbol allowlist", () => {
    const offenders: string[] = [];
    for (const file of walk(srcRoot)) {
      const rel = path.relative(webRoot, file);
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!/workspace/i.test(line)) return;
        if (isCommentLine(line)) return;
        if (isDeveloperLogLine(line)) return;
        if (!looksUserRendered(line)) return;
        if (WORKSPACE_ALLOW.some((re) => re.test(line))) return;
        offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 160)}`);
      });
    }
    expect(offenders, `Banned "workspace" found in user-rendered production text:\n${offenders.join("\n")}`).toEqual([]);
  });
});
