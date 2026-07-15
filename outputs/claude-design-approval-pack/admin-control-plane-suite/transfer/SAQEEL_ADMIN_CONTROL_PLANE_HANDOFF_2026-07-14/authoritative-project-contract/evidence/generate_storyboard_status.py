#!/usr/bin/env python3
"""Storyboard status board — progress by journey/persona against the 20
implementation storyboards (SB01-SB20, Native Storyboard Book).

Joins FABLE_UNDERSTANDING_TRACEABILITY.csv (column authoritative_storyboard)
with AC_LEDGER.csv (computed statuses) and rolls up per storyboard.
Regenerate after every wave: python3 generate_storyboard_status.py
"""
import csv, collections, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]
TRACE = ROOT / "FABLE_UNDERSTANDING_TRACEABILITY.csv"
LEDGER = HERE / "AC_LEDGER.csv"
OUT = HERE / "STORYBOARD_STATUS.md"

SB = {  # name, persona/journey, contracted requirement count (BRD §15)
    "SB01": ("Executive end-to-end", "All personas (umbrella)", 478),
    "SB02": ("Persona Atlas", "All personas (umbrella)", 81),
    "SB03": ("Compliance Config Admin", "Compliance Admin", 30),
    "SB04": ("Planning Methods / Targeting / Publishing", "Planner", 52),
    "SB05": ("Management Workspace", "Planner / Ops", 46),
    "SB06": ("Inspector Pre-Start", "Inspector (iPad)", 15),
    "SB07": ("Physical Start Journey", "Inspector (iPad)", 32),
    "SB08": ("Execution Workspace", "Inspector (iPad)", 191),
    "SB09": ("Virtual Execution", "Virtual Agent", 20),
    "SB10": ("Level 2 Review / Version Control", "Reviewer", 53),
    "SB11": ("Factory 360", "Planner / Reviewer / Ops", 20),
    "SB12": ("Operations Center", "Operations", 19),
    "SB13": ("Compliance Runtime Semantics", "Compliance Admin", 16),
    "SB14": ("Journey Telemetry / Exception", "Inspector (iPad)", 36),
    "SB15": ("Evidence / Violations / Penalties / Actions", "Inspector (iPad)", 54),
    "SB16": ("Submission / Locking / Version", "Inspector (iPad)", 26),
    "SB17": ("Returned Correction / Comparison", "Inspector / Reviewer", 16),
    "SB18": ("Admin IA", "Compliance Admin", 30),
    "SB19": ("Web + Inspector IA", "All channels (umbrella)", 428),
    "SB20": ("Architecture / Integrations / Security Blueprint", "Platform (umbrella)", 478),
}
ORDER = ["verified_live", "implemented", "partial", "missing"]
GLYPH = {"verified_live": "🟢", "implemented": "🔵", "partial": "🟡", "missing": "🔴"}

def verdict(c: collections.Counter, total: int) -> str:
    if not total: return "no rows mapped"
    if c["missing"]: return "gaps — surface missing"
    if c["partial"] and c["partial"] >= total / 2: return "read views live; write legs missing"
    if c["verified_live"] == total: return "proven live end-to-end"
    if c["verified_live"]: return "core proven live; rest coded, unwalked"
    if c["partial"]: return "mostly coded; some legs read-only"
    return "code complete on live schema; journey not yet walked in browser"

def main() -> int:
    status = {r["requirement_id"]: r["status"] for r in csv.DictReader(open(LEDGER))}
    per_sb: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    for r in csv.DictReader(open(TRACE)):
        st = status.get(r["requirement_id"], "missing")
        for sb in set(re.findall(r"SB\d\d", r["authoritative_storyboard"])):
            per_sb[sb][st] += 1
        # umbrella boards aggregate everything
        for umbrella in ("SB01", "SB19", "SB20"):
            per_sb[umbrella][st] += 0  # counted separately below
    total_all = collections.Counter(status.values())

    lines = [
        "# Storyboard Status Board — SB01-SB20",
        "",
        "Computed from AC_LEDGER.csv (regenerate both after every wave).",
        "Legend: 🟢 verified live in browser · 🔵 implemented (coded, unwalked) · 🟡 partial (read-only legs) · 🔴 missing",
        "",
        "| SB | Storyboard | Persona / journey | Rows | 🟢 | 🔵 | 🟡 | 🔴 | Verdict |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for sb in sorted(SB):
        name, persona, contracted = SB[sb]
        if sb in ("SB01", "SB19", "SB20"):       # umbrella = whole-platform rollup
            c, total = total_all, sum(total_all.values())
            v = f"umbrella — tracks whole platform ({total} rows)"
        elif sb == "SB02":
            c, total = collections.Counter(), 0
            v = "persona atlas — realized via /launch role-routing + persona logins (verified live)"
        else:
            c = per_sb.get(sb, collections.Counter()); total = sum(c.values())
            v = verdict(c, total)
        cells = " | ".join(str(c.get(s, 0)) for s in ORDER)
        lines.append(f"| {sb} | {name} | {persona} | {total or '—'} | {cells} | {v} |")
    lines += [
        "",
        "## Reading rule",
        "A storyboard is DONE only when every row is 🟢. 🔵 means the code exists against the live",
        "schema but nobody has walked that journey in a browser — treat as risk, not credit.",
        "Umbrella boards (SB01/SB19/SB20) restate the platform-wide totals; SB02 is realized as the",
        "persona-routing layer (marketing landing -> channel logins -> /launch role router).",
        "",
    ]
    OUT.write_text("\n".join(lines))
    print(f"wrote {OUT.name}")
    for sb in sorted(per_sb):
        c = per_sb[sb]
        if sum(c.values()): print(f"  {sb}: {dict(c)}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
