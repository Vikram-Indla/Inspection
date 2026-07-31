#!/usr/bin/env python3
"""
One English -> Arabic index across every approved source in the repo.

Arabic lives in two places that never got joined:

  1. `docs/design/saqeel-ar-strings.json` — 648 pairs lifted from the approved
     design bundles, keyed by the English string.
  2. The runtime fallbacks — `MVP3_AR_FALLBACK` in `apps/web/src/lib/i18n.ts` and
     `FACTORY360_AR_FALLBACK` in `apps/web/src/lib/factory360/arabic.ts` — keyed by
     i18n key, not by English. Their English lives at the `t("key", "English")`
     call sites.

Joining (2) through its call sites adds ~240 approved pairs that the design
catalogue alone does not see. Anything reachable this way is already reviewed
Arabic and must be reused rather than re-translated.

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
catalogue = json.loads((ROOT / "docs/design/saqeel-ar-strings.json").read_text(encoding="utf-8"))

# Catalogue wins on conflict: it is the approved design copy, the runtime fallback is
# a stopgap until ui_strings is promoted.
merged = dict(runtime)
merged.update(catalogue)

(HERE / "ar-index.json").write_text(
    json.dumps(merged, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")

print(f"call-site keys with English : {len(key_en)}")
print(f"runtime keys with Arabic    : {len(key_ar)}")
print(f"  joined to English         : {len(runtime)}")
print(f"design catalogue pairs      : {len(catalogue)}")
print(f"merged index                : {len(merged)}")
print(f"wrote {HERE / 'ar-index.json'}")
