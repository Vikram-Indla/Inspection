// Localization sync core (SB19) — scans the codebase for t("key","English")
// pairs and reconciles them against the accepted ui_strings catalogue. Only
// existing governed keys cross the provenance boundary; local bilingual
// helpers and planned/unregistered keys never become registry mutations.
// Used by the /admin/localization "Sync from code" action (self-hosted: the
// server can read its own source tree) and by scripts/i18n_sync.py in CI.
import fs from "node:fs";
import path from "node:path";

export type SyncPair = { key: string; en: string };
export type SyncReport = { scanned: number; added: string[]; enChanged: string[]; orphaned: string[]; revived: string[] };

const T_CALL = /\bt\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"/g;
const T_COPY_CALL = /\bt\(\s*"([^"]+)"\s*,\s*copy\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"(?:[^"\\]|\\.)*"\s*\)\s*\)/gs;
const TR_CALL = /\btr\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"(?:[^"\\]|\\.)*"\s*\)/gs;

const unescapeString = (value: string) => value.replace(/\\"/g, '"').replace(/\\n/g, "\n");

export function extractAcceptedCalls(source: string, governedKeys: ReadonlySet<string>): SyncPair[] {
  const pairs = new Map<string, SyncPair>();
  for (const pattern of [T_CALL, T_COPY_CALL, TR_CALL]) {
    for (const match of source.matchAll(pattern)) {
      if (governedKeys.has(match[1])) {
        pairs.set(match[1], { key: match[1], en: unescapeString(match[2]) });
      }
    }
  }
  return [...pairs.values()];
}

export function scanCodeForKeys(
  governedRows: readonly { key: string; en: string }[],
  srcRoot?: string,
): SyncPair[] {
  const root = srcRoot ?? path.join(process.cwd(), "src");
  // Registry membership is the provenance boundary. A dotted-looking string
  // is not sufficient: local bilingual helpers and planned keys also call t().
  const governed = new Set(governedRows.map(row => row.key));
  const pairs = new Map(governedRows.map(row => [row.key, row.en]));
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "node_modules") walk(p); continue; }
      if (!entry.name.endsWith(".tsx") && !entry.name.endsWith(".ts")) continue;
      const srcText = fs.readFileSync(p, "utf8");
      // A matching call proves usage, not authority to rewrite reviewed
      // catalogue copy. English changes use the governed admin workflow.
      extractAcceptedCalls(srcText, governed);
    }
  };
  walk(root);
  return [...pairs.entries()].map(([key, en]) => ({ key, en }));
}

// Reconcile against DB rows; returns the mutations to apply + report.
export function planSync(code: SyncPair[], db: { key: string; en: string; orphaned: boolean }[]): {
  inserts: SyncPair[]; enUpdates: SyncPair[]; orphanKeys: string[]; reviveKeys: string[]; report: SyncReport;
} {
  const dbByKey = new Map(db.map(r => [r.key, r]));
  const codeKeys = new Set(code.map(p => p.key));
  const inserts: SyncPair[] = [], enUpdates: SyncPair[] = [];
  for (const p of code) {
    const row = dbByKey.get(p.key);
    if (!row) inserts.push(p);
    else if (row.en !== p.en) enUpdates.push(p);
  }
  const orphanKeys = db.filter(r => !codeKeys.has(r.key) && !r.orphaned).map(r => r.key);
  const reviveKeys = db.filter(r => codeKeys.has(r.key) && r.orphaned).map(r => r.key);
  return {
    inserts, enUpdates, orphanKeys, reviveKeys,
    report: {
      scanned: code.length,
      added: inserts.map(p => p.key),
      enChanged: enUpdates.map(p => p.key),
      orphaned: orphanKeys,
      revived: reviveKeys,
    },
  };
}
