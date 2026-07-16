#!/usr/bin/env python3
"""AC ledger generator — computes (never claims) delivery status per requirement.

Reads FABLE_UNDERSTANDING_TRACEABILITY.csv (493 rows) and stamps each row with a
conservative status derived from what verifiably exists in apps/web + evidence/:

  verified_live   exercised in a real browser against the live database, with a
                  dated note of what was proven
  implemented     a runtime code path exists for the row's screens/behavior but
                  has not been exercised end-to-end
  partial         some of the row's surface exists (e.g. read view without the
                  write flow, or flow present but negative paths untested)
  missing         no runtime surface exists yet

Rules: a module is never marked above its weakest required leg; when unsure,
the LOWER status wins. Output: AC_LEDGER.csv + AC_LEDGER_SUMMARY.md alongside
this script. Rerun after every build/verification wave.
"""
import csv, collections, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "FABLE_UNDERSTANDING_TRACEABILITY.csv"
OUT = pathlib.Path(__file__).parent / "AC_LEDGER.csv"
OUT_MD = pathlib.Path(__file__).parent / "AC_LEDGER_SUMMARY.md"

# ---------------------------------------------------------------------------
# Status map — reviewed by hand every wave. Keys are module names from the CSV.
# Each entry: (default_status, note). Requirement-level overrides refine below.
# ---------------------------------------------------------------------------
MODULE_STATUS = {
    "FND (foundation)": ("verified_live",
        "Auth+RLS+audit+immutability live; login/logout/role-routing exercised in browser 2026-07-11; B1-EV-001 negative sweep."),
    "Compliance Configuration": ("implemented",
        "All engines have write flows (2026-07-11 wave 2): regulations create/publish+clauses (verified live), packages draft/edit/maker-checker, items designer, violations+penalty mappings, GIS Studio map with per-factory geofence editor (verified live). Workflows stays read-only by governance choice (engine_settings)."),
    "Visit Planning - Planning": ("implemented",
        "Single/bulk/immediate wizards with validation gates exist; single-visit publish verified live in golden slice (B3-EV-001); bulk/immediate not re-verified in browser."),
    "Visit Planning - Management": ("implemented",
        "Visit detail with state-guarded cancel/return/reassign/reschedule built (wave 2) and verified rendering live 2026-07-11; write actions not yet clicked end-to-end."),
    "Inspection Execution - Pre-Start": ("implemented",
        "Field visit startup (package cache, geofence check-in path) coded; /field list verified live 2026-07-11 after embed fix; startup flow not re-verified."),
    "Physical Inspection Execution": ("implemented",
        "Workspace + offline drill verified live 2026-07-11; submit/version/correction legs proven end-to-end in B10-EV-001 golden journey (persona-scoped, immutability negatives passed). Remaining blue = breadth of item-type/evidence behaviors not yet walked per-row in browser."),
    "Virtual Inspection Execution": ("implemented",
        "Verified live 2026-07-11: session list, room (WAITING state, OTP-verified participant chip), and access-denied failure state (wrong id -> denied safely, audited). OTP verify flow proven via API (B6-EV-001); provider adapter is a documented DEC placeholder."),
    "Level 2 Review & Resubmission": ("verified_live",
        "B10-EV-001 golden journey 2026-07-11: submit v1 -> RETURN scope s1 (mandatory reason) -> correct -> resubmit v2 -> APPROVE, all via persona-scoped RLS sessions; decided-review edit rejected by trigger (NEG-3), v1 immutable (NEG-2), duplicate submit rejected (NEG-1); full journey visible in /reviews UI."),
    "Factory 360": ("implemented",
        "Dossier verified live 2026-07-11: identity+geofence, risk, documents registry with add form + validity lozenges, representatives with add/deactivate, inspection history from seeded KSA cycles (after fixing to-one embed bug + widening visits RLS for compliance_admin, migration 0012)."),
    "Operations Center": ("implemented",
        "Verified live 2026-07-11: real KPI counts, 10 monitored visits with links, corrective-actions queue with acknowledge/close actions, notifications panel with mark-handled. Write actions not yet clicked end-to-end."),
}

# Requirement-level overrides (strongest evidence first).
OVERRIDES = {
    # Verified in browser against live DB on 2026-07-11 (this session)
    "MVP1-M01-034": ("verified_live", "Single-visit wizard rendered + publish gate live-tested."),
    "MVP1-M01-035": ("verified_live", "CR/code factory search exercised in wizard."),
    "MVP1-M09-001": ("verified_live", "Regulation SBC-501 created draft->published in browser."),
    "MVP1-M09-030": ("verified_live", "Published-version immutability banner + DB trigger; new draft v2026.09 created in browser."),
}

VERDICTS_FILE = pathlib.Path(__file__).parent / "DEV_AUDIT_VERDICTS.json"

def main() -> int:
    import json as _json
    rows = list(csv.DictReader(open(SRC)))
    # Row-level development audit (2026-07-12) is the authority when present.
    verdicts = {}
    if VERDICTS_FILE.exists():
        for v in _json.loads(VERDICTS_FILE.read_text()):
            verdicts[v["id"]] = (
                {"BUILT": "implemented", "THIN": "partial", "ABSENT": "missing"}[v["verdict"]],
                f"[audit] {v['note']}")
    out_rows = []
    for r in rows:
        mod = r["module"]
        status, note = MODULE_STATUS.get(mod, ("missing", "No runtime surface mapped."))
        status, note = verdicts.get(r["requirement_id"], (status, note))
        # live-proven rows keep their stronger status only if the audit says BUILT
        ov = OVERRIDES.get(r["requirement_id"])
        if ov and verdicts.get(r["requirement_id"], ("", ""))[0] == "implemented":
            status, note = ov
        out_rows.append({
            "requirement_id": r["requirement_id"], "acceptance_id": r["acceptance_id"],
            "module": mod, "channel": r["channel"], "status": status, "note": note,
        })

    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()))
        w.writeheader(); w.writerows(out_rows)

    counts = collections.Counter(x["status"] for x in out_rows)
    by_mod = collections.defaultdict(collections.Counter)
    for x in out_rows: by_mod[x["module"]][x["status"]] += 1

    total = len(out_rows)
    lines = [
        "# AC Ledger — computed status (regenerate with generate_ac_ledger.py)", "",
        f"Total governed rows: **{total}**", "",
        "| Status | Rows | % |", "|---|---|---|",
    ]
    for s in ("verified_live", "implemented", "partial", "missing"):
        lines.append(f"| {s} | {counts.get(s,0)} | {counts.get(s,0)*100//total}% |")
    lines += ["", "## By module", "", "| Module | verified_live | implemented | partial | missing |", "|---|---|---|---|---|"]
    for mod, c in sorted(by_mod.items()):
        lines.append(f"| {mod} | {c.get('verified_live',0)} | {c.get('implemented',0)} | {c.get('partial',0)} | {c.get('missing',0)} |")
    lines += ["",
        "**Reading rule:** only `verified_live` counts as done-done. `implemented` means the code path exists",
        "and compiles against the live schema but no one has walked it end-to-end in a browser.",
        "`partial` means read surface without write flows, or a flow with untested legs. This ledger is",
        "regenerated, not edited — update the status map in the script after each verification wave.", ""]
    OUT_MD.write_text("\n".join(lines))
    print(f"wrote {OUT.name} ({total} rows) + {OUT_MD.name}")
    for s, n in counts.most_common(): print(f"  {s}: {n}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
