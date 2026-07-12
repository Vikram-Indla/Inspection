// Localization sync core (SB19) — scans the codebase for t("key","English")
// pairs and reconciles them into ui_strings:
//   new key      -> insert (ar null, status draft)  => shows under "Missing Arabic"
//   changed EN   -> update en (DB trigger snapshots history + downgrades reviewed->draft)
//   removed key  -> flag orphaned=true (never delete; history preserved)
//   reappearing  -> orphaned=false
// Used by the /admin/localization "Sync from code" action (self-hosted: the
// server can read its own source tree) and by scripts/i18n_sync.py in CI.
import fs from "node:fs";
import path from "node:path";

export type SyncPair = { key: string; en: string };
export type SyncReport = { scanned: number; added: string[]; enChanged: string[]; orphaned: string[]; revived: string[] };

const T_CALL = /t\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"/g;

export function scanCodeForKeys(srcRoot?: string): SyncPair[] {
  const root = srcRoot ?? path.join(process.cwd(), "src");
  const pairs = new Map<string, string>();
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "node_modules") walk(p); continue; }
      if (!entry.name.endsWith(".tsx") && !entry.name.endsWith(".ts")) continue;
      const srcText = fs.readFileSync(p, "utf8");
      for (const m of srcText.matchAll(T_CALL)) pairs.set(m[1], m[2].replace(/\\"/g, '"'));
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
