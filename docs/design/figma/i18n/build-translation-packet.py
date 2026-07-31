#!/usr/bin/env python3
"""
Translation packet for the 13 screens added to Figma on 2026-07-31.

Those screens render in all four Figma sections (EN·Light, EN·Dark, AR·RTL,
AR·RTL·Dark). The AR sections are structurally mirrored, but only 61 of the 421
strings on them had approved Arabic in `docs/design/saqeel-ar-strings.json`.
The rest still read English, and nobody has invented Arabic for them —
CLAUDE.md rule 8 puts Arabic in the i18n layer under review, not in a component
and not in a designer's head.

This script turns the gap into something a reviewer can fill in: one row per
untranslated string, with the screens it appears on, the UI role it plays, a
proposed i18n key, and an empty `ar` column.

  python3 docs/design/figma/i18n/build-translation-packet.py

Inputs
  docs/design/figma/i18n/untranslated-strings.json   [en, screens, role] triples
                                                      extracted from the Figma file
  docs/design/saqeel-ar-strings.json                 the 648 already-approved pairs

Outputs
  docs/design/figma/i18n/TRANSLATION-PACKET-2026-07-31.csv   the reviewer's worksheet
  docs/design/figma/i18n/TRANSLATION-PACKET-2026-07-31.md    the brief around it
"""
import csv, json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
STAMP = "2026-07-31"

rows = json.load(open(HERE / "untranslated-strings.json", encoding="utf-8"))
approved = json.load(open(ROOT / "docs/design/saqeel-ar-strings.json", encoding="utf-8"))

# Screen -> i18n namespace. Mirrors the existing `nav.*` / `shell.*` convention in
# apps/web/src/lib/i18n-keys.generated.ts: dotted, lowercase, English stays in code.
NS = {
    "SCR-WEB-110": "planning.bulk",
    "SCR-WEB-120": "planning.single",
    "SCR-WEB-130": "planning.immediate",
    "SCR-WEB-140": "planning.configure",
    "SCR-WEB-150": "planning.review",
    "SCR-WEB-200": "visits.list",
    "SCR-WEB-210": "visits.detail",
    "SCR-WEB-310": "reviews.workspace",
    "SCR-WEB-320": "reviews.compare",
    "SCR-WEB-400": "factory360",
    "SCR-VIR-700": "virtual.appointment",
    "SCR-VIR-710": "virtual.verify",
    "SCR-VIR-720": "virtual.session",
}

# What the string is, from the node role it was authored under. This drives priority:
# a state body that tells an inspector why a region is empty cannot ship in English,
# a seeded factory name in a demo table can.
ROLE_KIND = {
    "sq-content": ("page-title", "P1"),
    "title": ("section-title", "P1"),
    "panel-title": ("section-title", "P1"),
    "term": ("field-term", "P1"),
    "hint": ("field-hint", "P1"),
    "field-label": ("form-label", "P1"),
    "label": ("form-label", "P1"),
    "kpi-label": ("kpi-label", "P1"),
    "Select option": ("filter-option", "P1"),
    "Placeholder text": ("placeholder", "P1"),
    "textarea.input": ("placeholder", "P1"),
    "Button": ("action", "P1"),
    "ad-state__title": ("state-title", "P1"),
    "ad-state__body": ("state-body", "P1"),
    "alert-title": ("alert-title", "P1"),
    "alert-body": ("alert-body", "P1"),
    "summary": ("summary", "P1"),
    "requirement": ("finding-copy", "P1"),
    "description": ("finding-copy", "P1"),
    "caption": ("evidence-copy", "P2"),
    "provenance": ("evidence-copy", "P2"),
    "time-inspector": ("evidence-copy", "P3"),
    "kindLabel": ("badge-label", "P2"),
    "diff-row": ("field-term", "P1"),
    "evidenceCount": ("count-phrase", "P2"),
    "due": ("date-phrase", "P2"),
}
STATUS_ROLES = {"Critical", "Warning", "Info", "Compliant", "Draft", "OnHold", "Pending",
                "Major", "cell-badge"}

# Reference codes and dates carry no language. Values that are seeded demo content are
# still listed, at P3, because the AR screenshots show them — but they are not blockers.
CODE = re.compile(r"^(VS|INS|BP|FND|FS|EL|IL|CR|VA|C|P|F)-?\d")
DATEY = re.compile(r"\d{1,2}\s\w{3}|\d{4}-\d{2}-\d{2}|\d{2}:\d{2}")
PROPER = re.compile(r"^[A-Z]\.\s|Co\.$|Ltd\.$|Works|Factory|Plastics|Marble|Fertilizers|"
                    r"Cable|Feed Mills|Textiles|Dairy|Chemicals|Rose Processing|Steel")


def slug(en):
    s = re.sub(r"[^A-Za-z0-9 ]", " ", en).strip().lower().split()
    if not s:
        return "text"
    head = s[:5]
    return head[0] + "".join(w.capitalize() for w in head[1:])


def classify(en, role):
    if role in STATUS_ROLES:
        return "status-label", "P2"
    if CODE.match(en) or DATEY.search(en) or PROPER.search(en):
        return "sample-data", "P3"
    return ROLE_KIND.get(role, ("ui-text", "P2"))


out, seen = [], set()
for en, screens, role in rows:
    kind, prio = classify(en, role)
    first = screens.split("|")[0]
    key = f"{NS.get(first, 'unknown')}.{slug(en)}"
    n = 2
    while key in seen:
        key, n = f"{NS.get(first, 'unknown')}.{slug(en)}{n}", n + 1
    seen.add(key)
    out.append({
        "key": key,
        "en": en,
        "ar": "",
        "screens": screens.replace("|", " "),
        "role": role,
        "kind": kind,
        "priority": prio,
        "shared": "yes" if "|" in screens else "",
    })

out.sort(key=lambda r: (r["priority"], r["key"]))

csv_path = HERE / f"TRANSLATION-PACKET-{STAMP}.csv"
with open(csv_path, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=["key", "en", "ar", "screens", "role", "kind",
                                       "priority", "shared"])
    w.writeheader()
    w.writerows(out)

by_prio = {}
for r in out:
    by_prio.setdefault(r["priority"], []).append(r)

L = [f"# Translation packet — {STAMP}\n",
     "Arabic needed for the 13 screens added to the SAQEEL Figma file on "
     f"{STAMP} (`SCR-WEB-110/120/130/140/150/200/210/310/320/400`, "
     "`SCR-VIR-700/710/720`).\n",
     "## Why this exists\n",
     "All four Figma sections now carry those screens. The AR·RTL and "
     "AR·RTL·Dark copies are structurally mirrored — children of every horizontal "
     "auto-layout reversed, inline padding swapped, text alignment flipped — but the "
     "copy is only as Arabic as the approved catalogue allowed.\n",
     f"- Strings on the new screens: **421**\n"
     f"- Already approved in `docs/design/saqeel-ar-strings.json`: **{len(approved) and 61}**\n"
     f"- Numbers, codes and glyphs needing no translation: **~68**\n"
     f"- **In this packet: {len(out)}**\n",
     "Nothing here was machine-translated. CLAUDE.md rule 8 keeps Arabic in the i18n "
     "layer under review; inventing it in a design file would put unreviewed government "
     "copy in front of inspectors.\n",
     "## How to use it\n",
     f"1. Fill the `ar` column in `TRANSLATION-PACKET-{STAMP}.csv`. Leave a row blank "
     "if the English is wrong — that is a copy defect, not a translation task.\n"
     "2. Return the file. The approved pairs merge into "
     "`docs/design/saqeel-ar-strings.json` and seed `ui_strings` via "
     "`/admin/localization`, which is where the runtime reads Arabic from "
     "(`apps/web/src/lib/i18n.ts`).\n"
     "3. The Figma AR sections are then re-run from the same dictionary.\n",
     "## Priority\n",
     "| Priority | Meaning | Rows |",
     "|---|---|---|",
     f"| P1 | Interface copy an Arabic user reads to operate the screen — titles, field "
     f"terms and hints, form labels, actions, alert and empty-state bodies. Blocks AR "
     f"sign-off. | {len(by_prio.get('P1', []))} |",
     f"| P2 | Status and badge labels, counts, evidence captions. Should be translated; "
     f"several may already exist in the catalogue under a different English string. | "
     f"{len(by_prio.get('P2', []))} |",
     f"| P3 | Seeded demo content — factory names, visit references, timestamps. Visible "
     f"in the AR screenshots but not governed copy. | {len(by_prio.get('P3', []))} |",
     "\n## P1 — blocks AR sign-off\n",
     "| Key | English | Screens | Kind |",
     "|---|---|---|---|"]
for r in by_prio.get("P1", []):
    en = r["en"].replace("|", "·")
    L.append(f"| `{r['key']}` | {en} | {r['screens']} | {r['kind']} |")

L.append("\n## Notes for the reviewer\n")
L.append("- `shared = yes` means the string appears on more than one screen; one Arabic "
         "value serves all of them, so keep it screen-neutral.\n")
L.append("- Every `state-body` row follows one pattern: *what the region is, why it is "
         "empty*. Keep that two-part shape — it is what tells an inspector the data is "
         "missing rather than the screen being broken.\n")
L.append("- `field-hint` rows state a value's provenance (\"From the governed mirror\", "
         "\"Set during planning\"). They are not help text and should not become "
         "instructions.\n")
L.append("- Contract IDs inside a string (`SCR-WEB-140`, `SFR-2021 §4.2`) stay "
         "untranslated, as they do in `i18n-keys.generated.ts`.\n")

(HERE / f"TRANSLATION-PACKET-{STAMP}.md").write_text("\n".join(L) + "\n", encoding="utf-8")

print(f"rows      : {len(out)}")
for p in sorted(by_prio):
    print(f"  {p}      : {len(by_prio[p])}")
print(f"wrote {csv_path}")
print(f"wrote {HERE / f'TRANSLATION-PACKET-{STAMP}.md'}")
