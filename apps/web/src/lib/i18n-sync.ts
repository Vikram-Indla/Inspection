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

export type SyncPair = { key: string; en: string; ar?: string };
export type SyncReport = { scanned: number; added: string[]; enChanged: string[]; arChanged: string[]; orphaned: string[]; revived: string[] };

const T_CALL = /\bt\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"/g;
const T_COPY_CALL = /\bt\(\s*"([^"]+)"\s*,\s*copy\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)\s*\)/gs;
const TR_CALL = /\btr\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/gs;
const MANIFEST_ENTRY = /\{\s*key:\s*"([^"]+)"\s*,\s*en:\s*"((?:[^"\\]|\\.)*)"/g;

const unescapeString = (value: string) => value.replace(/\\"/g, '"').replace(/\\n/g, "\n");

export function scanCodeForKeys(srcRoot?: string): SyncPair[] {
  const root = srcRoot ?? path.join(process.cwd(), "src");
  const pairs = new Map<string, SyncPair>();
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "node_modules") walk(p); continue; }
      if (!entry.name.endsWith(".tsx") && !entry.name.endsWith(".ts")) continue;
      const srcText = fs.readFileSync(p, "utf8");
      for (const m of srcText.matchAll(T_CALL)) pairs.set(m[1], { key: m[1], en: unescapeString(m[2]) });
      if (entry.name === "i18n-keys.generated.ts") {
        for (const m of srcText.matchAll(MANIFEST_ENTRY)) {
          if (!pairs.has(m[1])) pairs.set(m[1], { key: m[1], en: unescapeString(m[2]) });
        }
      }
      for (const pattern of [T_COPY_CALL, TR_CALL]) {
        for (const m of srcText.matchAll(pattern)) {
          pairs.set(m[1], { key: m[1], en: unescapeString(m[2]), ar: unescapeString(m[3]) });
        }
      }
    }
  };
  walk(root);
  return [...pairs.values()];
}

// Reconcile against DB rows; returns the mutations to apply + report.
export function planSync(code: SyncPair[], db: { key: string; en: string; ar?: string | null; status?: string; orphaned: boolean }[]): {
  inserts: SyncPair[]; enUpdates: SyncPair[]; arUpdates: SyncPair[]; orphanKeys: string[]; reviveKeys: string[]; report: SyncReport;
} {
  const dbByKey = new Map(db.map(r => [r.key, r]));
  const codeKeys = new Set(code.map(p => p.key));
  const inserts: SyncPair[] = [], enUpdates: SyncPair[] = [], arUpdates: SyncPair[] = [];
  for (const p of code) {
    const row = dbByKey.get(p.key);
    if (!row) inserts.push(p);
    else {
      if (row.en !== p.en) enUpdates.push(p);
      // Inline Arabic is governed source copy. Never overwrite a translation
      // that a localization reviewer has already approved.
      if (p.ar && row.status !== "reviewed" && row.ar !== p.ar) arUpdates.push(p);
    }
  }
  const orphanKeys = db.filter(r => !codeKeys.has(r.key) && !r.orphaned).map(r => r.key);
  const reviveKeys = db.filter(r => codeKeys.has(r.key) && r.orphaned).map(r => r.key);
  return {
    inserts, enUpdates, arUpdates, orphanKeys, reviveKeys,
    report: {
      scanned: code.length,
      added: inserts.map(p => p.key),
      enChanged: enUpdates.map(p => p.key),
      arChanged: arUpdates.map(p => p.key),
      orphaned: orphanKeys,
      revived: reviveKeys,
    },
  };
}
