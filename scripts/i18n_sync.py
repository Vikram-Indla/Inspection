#!/usr/bin/env python3
"""CI/pipeline i18n sync — same semantics as the panel's "Sync from code":
new keys insert as draft, EN drift updates (DB trigger snapshots history and
downgrades reviewed->draft), removed keys flag orphaned, reappearing revive.
Run before every build:
  PAT=$(security find-generic-password -a inspection -s supabase-pat -w) python3 scripts/i18n_sync.py
"""
import json, os, re, pathlib, urllib.request, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "apps/web/src"
PROJECT = "iiozvqntawxfwbgffzqu"

LITERAL_CALL = re.compile(r'\bt\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"')
BILINGUAL_CALLS = (
    re.compile(r'\bt\(\s*"([^"]+)"\s*,\s*copy\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"(?:[^"\\]|\\.)*"\s*\)\s*\)', re.S),
    re.compile(r'\btr\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"(?:[^"\\]|\\.)*"\s*\)', re.S),
)

def extract_source_pairs(source: str, governed_keys: set[str]) -> dict[str, str]:
    """Extract only calls whose first argument is an accepted registry key."""
    pairs: dict[str, str] = {}
    for pattern in (LITERAL_CALL, *BILINGUAL_CALLS):
        for match in pattern.finditer(source):
            if match.group(1) in governed_keys:
                pairs[match.group(1)] = match.group(2).replace('\\"', '"').replace('\\n', '\n')
    return pairs

def scan_source_tree(src: pathlib.Path, governed_rows: dict[str, str]) -> dict[str, str]:
    governed_keys = set(governed_rows)
    pairs = dict(governed_rows)
    for source_file in src.rglob("*.ts*"):
        # Calls establish that an accepted key is used. They do not authorize
        # fallback text to overwrite catalogue English or reviewed Arabic.
        extract_source_pairs(source_file.read_text(), governed_keys)
    return pairs

def q(pat: str, sql: str):
    req = urllib.request.Request(f"https://api.supabase.com/v1/projects/{PROJECT}/database/query",
        data=json.dumps({"query": sql}).encode(), method="POST",
        headers={"Authorization": f"Bearer {pat}", "Content-Type": "application/json", "User-Agent": "inspection-app/1.0"})
    return json.load(urllib.request.urlopen(req))

def esc(s: str) -> str:
    return s.replace("'", "''")

def main() -> int:
    pat = os.environ.get("PAT")
    if not pat:
        print("PAT env var required"); return 1
    db = {r["key"]: r for r in q(pat, "select key, en, orphaned from ui_strings")}
    code = scan_source_tree(SRC, {key: row["en"] for key, row in db.items()})

    inserts = {k: v for k, v in code.items() if k not in db}
    en_updates = {k: v for k, v in code.items() if k in db and db[k]["en"] != v}
    orphans = [k for k in db if k not in code and not db[k]["orphaned"]]
    revive = [k for k in db if k in code and db[k]["orphaned"]]

    stmts = []
    if inserts:
        vals = ",\n".join(f"('{esc(k)}','{esc(v)}','draft')" for k, v in sorted(inserts.items()))
        stmts.append(f"insert into ui_strings (key, en, status) values\n{vals} on conflict (key) do nothing;")
    for k, v in en_updates.items():
        stmts.append(f"update ui_strings set en = '{esc(v)}' where key = '{esc(k)}';")
    if orphans:
        keys = ",".join(f"'{esc(k)}'" for k in orphans)
        stmts.append(f"update ui_strings set orphaned = true where key in ({keys});")
    if revive:
        keys = ",".join(f"'{esc(k)}'" for k in revive)
        stmts.append(f"update ui_strings set orphaned = false where key in ({keys});")

    if stmts:
        q(pat, "set app.l10n_source = 'sync';\n" + "\n".join(stmts))
    print(f"scanned {len(code)} keys · added {len(inserts)} · EN changed {len(en_updates)} · orphaned {len(orphans)} · revived {len(revive)}")
    for k in sorted(inserts): print("  +", k)
    for k in sorted(en_updates): print("  Δ", k)
    for k in orphans: print("  ⌀", k)
    return 0

if __name__ == "__main__":
    sys.exit(main())
