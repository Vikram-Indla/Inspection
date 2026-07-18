#!/usr/bin/env python3
"""i18n coverage loop — the acceptance criterion for localization.

Scans apps/web/src for raw English text in JSX that is NOT routed through
tr()/t(). Exits non-zero while any swept file still carries unlocalized
strings, so the loop's exit condition is computed, not claimed.

Sweep control: files listed in SWEPT are held to zero findings. Everything
else is reported as backlog (informational) until its sweep lands.
Exclusions: contract IDs (RBAC-009, SCR-IPAD-600, M02-006, SB11, ENG-12,
B10-EV-001...), code literals, class names, emails, URLs, units.
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1] / "apps/web/src"

# Whole-app enforcement (sweep 2 landed): every .tsx file is held to zero.
SWEPT_ALL = True
SWEPT: list[str] = []

CONTRACT_ID = re.compile(
    r"\b(RBAC|SCR|STM|FLD|ERR|ENG|REF|FND|DEC|EV|SB|CD|REQ|DASH|M\d+|MVP\d|B\d+-EV|P\d+|AC)-?[\w./,-]*\b")
ALLOW = re.compile(
    r"^[\s\d\W]*$"                      # punctuation/digits only
    r"|^[a-z_./:?=&-]+$"                # slugs, urls, params
    r"|@|\bhttp|\.example\b|\bpx\b|\bvar\(|—$"
    r"|^(English|العربية|OpenStreetMap|Leaflet|نفاذ · Nafath|Twitter / X|LinkedIn|YouTube|Saqeel|CARTO|OSM)$"  # proper nouns / brands / required map-tile attribution — never translated
    r"|^[\w./-]+\.(py|ts|tsx|css|json)$"  # file paths shown as code
    r"|[;{}=&\[\]]|\n|as Record|=>"     # code fragments caught by the JSX regex
    r"|^\)?\s*:\s*!?[\w.]+(\s*\?\.)?\s*\?\s*\(?$"  # ternary-chain continuation, e.g. ") : canWrite ? ("
    r"|^,?\s*patch:\s*Record$"          # TS generic type annotation fragment
    r"|^Promise(Like)?$"                # TS built-in type name (Promise<T> / PromiseLike<T>)
    r"|\|\||&&|\?\.|\.select\(|\.from\("   # boolean/optional-chain/query-builder code fragments
    r"|copy\(locale")                   # already-localized copy(locale, key, ar) helper call, caught via a `>`/`<` comparison operator pair on the same line
TEXT_IN_JSX = re.compile(r">([^<>{}]+)<")
ATTR_TEXT = re.compile(r'(?:placeholder|title|aria-label|alt)="([^"{]+)"')

def english_findings(src: str) -> list[str]:
    out = []
    for m in list(TEXT_IN_JSX.finditer(src)) + list(ATTR_TEXT.finditer(src)):
        s = m.group(1).strip()
        if len(s) < 3 or ALLOW.search(s): continue
        if CONTRACT_ID.sub("", s).strip(" ·—-·()") == "": continue   # pure contract IDs
        if not re.search(r"[A-Za-z]{3,}", s): continue
        out.append(s[:70])
    return out

def main() -> int:
    swept_fail, backlog = {}, {}
    for f in sorted(ROOT.rglob("*.tsx")):
        rel = str(f.relative_to(ROOT))
        if f.name == "loading.tsx": continue  # sync fallbacks render bilingual EN/AR by design
        hits = english_findings(f.read_text())
        if not hits: continue
        (swept_fail if (SWEPT_ALL or rel in SWEPT) else backlog)[rel] = hits
    print(f"SWEPT: {'ALL' if SWEPT_ALL else len(SWEPT)} · failing: {len(swept_fail)}")
    for rel, hits in swept_fail.items():
        print(f"  FAIL {rel} ({len(hits)}):")
        for h in hits: print(f"     · {h}")  # no cap — a silently truncated report would hide real findings
    total_backlog = sum(len(v) for v in backlog.values())
    print(f"BACKLOG (not yet swept): {len(backlog)} files · {total_backlog} strings")
    for rel, hits in sorted(backlog.items(), key=lambda kv: -len(kv[1]))[:12]:
        print(f"  {len(hits):3d}  {rel}")
    return 1 if swept_fail else 0

if __name__ == "__main__":
    sys.exit(main())
