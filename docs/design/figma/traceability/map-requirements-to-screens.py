#!/usr/bin/env python3
"""
Requirement -> screen coverage, computed rather than asserted.

The repo has 2,263 atomic requirements (REQUIREMENT_INDEX.csv) and 38 governed
screens (screen_route_catalogue.csv), and *nothing joins them*. Without that join
"Figma covers 30/30 screens" says nothing about how much of the product is actually
designed — a screen with 400 requirements behind it counts the same as one with 3.

This builds the join deterministically, from two signals that already exist:

  1. `source_coordinate` — for spreadsheet sources it starts with the workbook sheet
     ("Visit Planning-Planning!A2:M2"), which names the module the requirement came
     from. That maps to a process family.
  2. `normalized_requirement` + `acceptance_criteria` text, scored against each
     screen's `screen`, `purpose`, `mandatory_regions` and `primary_actions`.

Signal 1 is authoritative where present and narrows the candidate set to one process
family; signal 2 picks the screen within it. Requirements that match neither are
reported as UNMAPPED rather than being forced onto a screen — an honest gap is worth
more than a tidy number.

Jira is the Product Owner's canonical requirement source but is unreachable from this
environment (no Atlassian MCP auth in a non-interactive session, no acli/jira CLI, no
token in env; `INSP-1` is the only issue key anywhere in the repo). This corpus is the
approved substitute. Every count below is repo-derived and re-runnable; none of it is
a Jira story count and it must not be reported as one.

  python3 docs/design/figma/traceability/map-requirements-to-screens.py
"""
import csv, json, pathlib, re, collections

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
RC = ROOT / "product-contract/requirements-control"

reqs = list(csv.DictReader(open(RC / "REQUIREMENT_INDEX.csv", encoding="utf-8")))
screens = list(csv.DictReader(open(ROOT / "product-contract/screens/screen_route_catalogue.csv",
                                  encoding="utf-8")))

# Sheet-name fragment -> the process families it feeds. Lower-cased substring match, so
# "Inspection excution-Start jou" and "Inspection Excution-Level2Flow" both resolve.
MODULE_TO_PROCESS = {
    "visit planning": {"G2-P01", "G2-P02", "G2-P03"},
    "mangment": {"G2-P03"},
    "inspection excution-start": {"G2-P04", "G2-P06A", "G2-P07", "G2-P08", "G2-P09"},
    "inspection execution - prestart": {"G2-P04", "G2-P06A"},
    "inspection excution-level2": {"G2-P10", "G2-P11"},
    "inspection excution - virtual": {"G2-P06B", "G2-P07"},
    "complince": {"G2-P10", "G2-P11", "G2-P00"},
    "factory 360": {"G2-P12"},
    "ops center": {"G2-P12"},
    "ops view": {"G2-P12"},
    "stratgic view": {"G2-P12"},
    "dashboard req": {"G2-P12"},
    "ipad scope": {"G2-P04", "G2-P06A", "G2-P07", "G2-P08", "G2-P09", "G2-P11"},
}

STOP = set("the a an and or of to for in on at by with is are be as that this it from "
           "shall must can will when then if not no any all each per via into onto".split())


def words(s):
    return {w for w in re.findall(r"[a-z]+", s.lower()) if len(w) > 2 and w not in STOP}


# Screen fingerprint: its own vocabulary, weighted so the screen name counts most.
fingerprint = {}
for s in screens:
    fp = collections.Counter()
    for field, weight in (("screen", 4), ("purpose", 2), ("mandatory_regions", 2),
                          ("primary_actions", 2), ("personas", 1)):
        for w in words(s[field]):
            fp[w] += weight
    fingerprint[s["screen_id"]] = fp

by_id = {s["screen_id"]: s for s in screens}
OUT_OF_SCOPE = {"iPad"}

# What Figma actually holds, by screen_id (see COVERAGE-MATRIX.md).
BUILT = {
    "SCR-ADM-001", "SCR-ADM-010", "SCR-ADM-011", "SCR-ADM-020", "SCR-ADM-030",
    "SCR-ADM-031", "SCR-ADM-040", "SCR-ADM-041", "SCR-ADM-050", "SCR-ADM-051",
    "SCR-ADM-060", "SCR-ADM-070", "SCR-ADM-080", "SCR-ADM-090",
    "SCR-WEB-100", "SCR-WEB-110", "SCR-WEB-120", "SCR-WEB-130", "SCR-WEB-140",
    "SCR-WEB-150", "SCR-WEB-200", "SCR-WEB-210", "SCR-WEB-300", "SCR-WEB-310",
    "SCR-WEB-320", "SCR-WEB-400", "SCR-WEB-500",
    "SCR-VIR-700", "SCR-VIR-710", "SCR-VIR-720",
}

rows, unmapped = [], []
for r in reqs:
    coord = r["source_coordinate"].split("!")[0].strip().lower()
    procs = set()
    for frag, ps in MODULE_TO_PROCESS.items():
        if frag in coord:
            procs |= ps

    candidates = [s for s in screens
                  if (not procs or s["process"] in procs)
                  and s["channel"] not in OUT_OF_SCOPE]
    if not candidates:
        candidates = [s for s in screens if s["channel"] not in OUT_OF_SCOPE]

    text = words(r["normalized_requirement"] + " " + r["acceptance_criteria"])
    best, score = None, 0
    for s in candidates:
        fp = fingerprint[s["screen_id"]]
        sc = sum(fp[w] for w in text if w in fp)
        if sc > score:
            best, score = s["screen_id"], sc

    # Tiered, because a single flat threshold hides which way it is wrong. STRONG is
    # safe to act on; WEAK is a real attribution that a human should confirm; NONE means
    # the text shares no vocabulary with any screen and is a genuine attribution gap.
    tier = "STRONG" if score >= 6 else ("WEAK" if score >= 2 else "NONE")
    if tier != "NONE" and best:
        rows.append({"requirement_id": r["requirement_id"], "screen_id": best,
                     "score": score, "tier": tier, "classification": r["classification"],
                     "module": coord[:40], "had_module_signal": bool(procs)})
    else:
        unmapped.append({"requirement_id": r["requirement_id"], "module": coord[:40],
                         "classification": r["classification"],
                         "had_module_signal": bool(procs),
                         "text": r["normalized_requirement"][:70]})

per_screen = collections.Counter(x["screen_id"] for x in rows)
in_scope = [s for s in screens if s["channel"] not in OUT_OF_SCOPE]

mapped_built = sum(v for k, v in per_screen.items() if k in BUILT)
mapped_unbuilt = sum(v for k, v in per_screen.items() if k not in BUILT)

(HERE / "requirement-screen-map.csv").write_text(
    "requirement_id,screen_id,score,tier,classification,module,had_module_signal\n" +
    "\n".join(f'{x["requirement_id"]},{x["screen_id"]},{x["score"]},{x["tier"]},{x["classification"]},'
              f'"{x["module"]}",{x["had_module_signal"]}' for x in rows) + "\n",
    encoding="utf-8")

summary = {
    "requirements_total": len(reqs),
    "mapped": len(rows),
    "by_tier": dict(collections.Counter(x["tier"] for x in rows)),
    "strong_per_screen": dict(collections.Counter(
        x["screen_id"] for x in rows if x["tier"] == "STRONG").most_common()),
    "unmapped": len(unmapped),
    "mapped_to_a_built_screen": mapped_built,
    "mapped_to_an_unbuilt_screen": mapped_unbuilt,
    "screens_total": len(screens),
    "screens_in_scope": len(in_scope),
    "screens_with_requirements": len(per_screen),
    "screens_in_scope_with_no_requirement": sorted(
        s["screen_id"] for s in in_scope if s["screen_id"] not in per_screen),
    "per_screen": dict(per_screen.most_common()),
    "unmapped_by_module": dict(collections.Counter(u["module"] for u in unmapped).most_common(12)),
    "unmapped_by_classification": dict(collections.Counter(u["classification"] for u in unmapped)),
}
(HERE / "requirement-coverage.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

print(f"requirements            : {len(reqs)}")
strong = [x for x in rows if x["tier"] == "STRONG"]
weak = [x for x in rows if x["tier"] == "WEAK"]
print(f"  mapped to a screen    : {len(rows)}  ({len(rows)*100//len(reqs)}%)")
print(f"    STRONG              : {len(strong)}")
print(f"    WEAK (confirm)      : {len(weak)}")
print(f"    -> screen built     : {mapped_built}")
print(f"    -> screen NOT built : {mapped_unbuilt}")
print(f"  unmapped              : {len(unmapped)}  ({len(unmapped)*100//len(reqs)}%)")
print(f"screens in scope        : {len(in_scope)}")
print(f"  carrying requirements : {len(per_screen)}")
print(f"  with none             : {len(summary['screens_in_scope_with_no_requirement'])}")
print("\ntop screens by requirement weight:")
for sid, n in per_screen.most_common(12):
    mark = "built" if sid in BUILT else "MISSING"
    print(f"   {sid:14} {n:5}  {by_id[sid]['screen'][:34]:36} {mark}")
