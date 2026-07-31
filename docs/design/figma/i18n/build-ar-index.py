#!/usr/bin/env python3
"""
One English -> Arabic index across every approved source in the repo.

Arabic lives in three places that never got joined:

  1. `docs/design/saqeel-ar-strings.json` — 648 pairs lifted from the approved
     design bundles, keyed by the English string.
  2. The runtime fallbacks — `MVP3_AR_FALLBACK` in `apps/web/src/lib/i18n.ts` and
     `FACTORY360_AR_FALLBACK` in `apps/web/src/lib/factory360/arabic.ts` — keyed by
     i18n key, not by English. Their English lives at the `t("key", "English")`
     call sites.

  3. The `ui_strings` seeds under `supabase/` — 27 migrations and demo seeds whose
     INSERT rows are (key, en, ar, status, context). This is the largest source by far
     and the one the runtime actually reads at request time; the fallbacks in (2) exist
     only until these are promoted in an environment.

Joining (2) through its call sites adds ~240 pairs; (3) adds ~1,300 more. Anything
reachable this way is already-authored Arabic and must be reused rather than
re-translated.

Rows carrying `'draft'` are recorded with a `draft:` marker so a reviewer can tell
promoted copy from copy still under review — reuse is still better than re-inventing,
but the distinction has to survive.

  python3 docs/design/figma/i18n/build-ar-index.py  ->  docs/design/figma/i18n/ar-index.json
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SRC = ROOT / "apps/web/src"

# --- key -> English, from t("key", "English") / tr(dict, "key", "English") call sites
CALL = re.compile(
    r'\bt\(\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"'
    r'|\btr\(\s*\w+\s*,\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"'
)
key_en = {}
for path in SRC.rglob("*.ts*"):
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        continue
    for m in CALL.finditer(text):
        key, en = m.group(1) or m.group(3), m.group(2) or m.group(4)
        if key and en:
            key_en.setdefault(key, en)

# the generated manifest carries the same shape declaratively
manifest = (SRC / "lib/i18n-keys.generated.ts").read_text(encoding="utf-8")
for key, en in re.findall(r'key:\s*"([^"]+)",\s*en:\s*"((?:[^"\\]|\\.)*)"', manifest):
    key_en.setdefault(key, en)

# --- key -> Arabic, from the two runtime fallback dicts
ARABIC = re.compile(r"[؀-ۿ]")
key_ar = {}
for rel in ("lib/i18n.ts", "lib/factory360/arabic.ts"):
    text = (SRC / rel).read_text(encoding="utf-8")
    for key, val in re.findall(r'"([^"]+)":\s*"((?:[^"\\]|\\.)*)"', text):
        if ARABIC.search(val):
            key_ar[key] = val

runtime = {key_en[k]: v for k, v in key_ar.items() if k in key_en}

# --- English -> Arabic, straight out of the ui_strings INSERT rows
ROW = re.compile(r"\(\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'"
                 r"(?:\s*,\s*'((?:[^']|'')*)')?", re.S)
seeds, drafts = {}, set()
sql_files = 0
for path in sorted((ROOT / "supabase").rglob("*.sql")):
    text = path.read_text(encoding="utf-8", errors="ignore")
    if "ui_strings" not in text:
        continue
    sql_files += 1
    for _key, en, ar_val, status in ROW.findall(text):
        if not ARABIC.search(ar_val) or ARABIC.search(en) or len(en) < 2:
            continue
        en, ar_val = en.replace("''", "'"), ar_val.replace("''", "'")
        seeds.setdefault(en, ar_val)
        if status == "draft":
            drafts.add(en)

catalogue = json.loads((ROOT / "docs/design/saqeel-ar-strings.json").read_text(encoding="utf-8"))

# Precedence, weakest first: seeds < runtime fallback < design catalogue. The catalogue is
# the approved design copy; the fallbacks are a stopgap until the seeds are promoted; the
# seeds themselves include draft rows.
merged = dict(seeds)
merged.update(runtime)
merged.update(catalogue)

(HERE / "ar-index-draft-rows.json").write_text(
    json.dumps(sorted(d for d in drafts if merged.get(d) == seeds.get(d)),
               ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

(HERE / "ar-index.json").write_text(
    json.dumps(merged, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")

print(f"ui_strings sql files        : {sql_files}")
print(f"  pairs from seeds          : {len(seeds)} ({len(drafts)} draft)")
print(f"call-site keys with English : {len(key_en)}")
print(f"runtime keys with Arabic    : {len(key_ar)}")
print(f"  joined to English         : {len(runtime)}")
print(f"design catalogue pairs      : {len(catalogue)}")
print(f"merged index                : {len(merged)}")
print(f"wrote {HERE / 'ar-index.json'}")
