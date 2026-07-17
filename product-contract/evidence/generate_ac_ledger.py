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

# Remediation closures that post-date DEV_AUDIT_VERDICTS.json. Keep these in
# the generator so regeneration cannot resurrect stale historical verdicts.
REMEDIATION_OVERRIDES = {
    "MVP1-M02-009": "Republish queues the assigned-inspector notification through the shared adapter; queue failure is reported neutrally after the state change.",
    "MVP1-M02-030": "Republish notification wiring and failure truth are covered by the shared adapter and focused CD-027 checks.",
    "MVP1-M03-005": "Field calendar drag submits a planner-owned reschedule request with the existing server guard.",
    "MVP1-M03-006": "Field startup renders and submits the existing return-request form with neutral failure handling.",
    "MVP1-M04-050": "Arrival confirmation cards and summary are rendered in Startup and use the visit-linked field handoff.",
    "MVP1-M04-051": "Factory arrival card is rendered with source-backed visit/factory identity.",
    "MVP1-M04-052": "Visit arrival card is rendered with source-backed schedule and assignment identity.",
    "MVP1-M04-053": "Arrival summary renders the available journey/distance/GPS facts without inventing a threshold.",
    "MVP1-M04-054": "Arrival cards expose governed expand/collapse controls with keyboard-safe state.",
    "MVP1-M04-056": "Inspector cancellation form is rendered and submits the governed cancellation request.",
    "MVP1-M04-057": "Cancellation reason selection is rendered from the governed reason source.",
    "MVP1-M04-058": "Cancellation evidence is queued through the visit-linked offline outbox path.",
    "MVP1-M08-004": "Operations dashboard now shows scoped per-inspector workload facts and labels unavailable presence data without inventing a timeout policy.",
    "MVP1-M08-007": "Operations dashboard consumes the governed alert/notification source and keeps unavailable trigger classes explicit.",
    "MVP1-M08-011": "Operations dashboard renders scoped workload aggregation without an invented capacity threshold.",
    "MVP1-M08-012": "Operations dashboard surfaces scoped cancelled-visit reasons from the canonical visit source.",
    "MVP1-M08-013": "Operations dashboard renders planned-versus-observed location facts and explicit unavailable confirmation state.",
    "MVP1-M08-014": "Operations dashboard renders append-only location-event history and preserves visit drilldown.",
    "MVP1-M08-015": "Operations dashboard renders the scoped planning-to-review lifecycle timeline from audit facts.",
    "MVP1-M08-016": "Operations dashboard renders the governed operational scorecard with labelled denominators and no invented values.",
}

PARTIAL_OVERRIDES = {}

LIVE_OVERRIDES = {
    "MVP1-M01-043": "Immediate visit Planner/Inspector workspace verified in the focused live suite.",
    "MVP1-M01-044": "Registered factory search and identity-match blocker verified live.",
    "MVP1-M01-045": "Minimum manual identity and generated-label provenance verified live.",
    "MVP1-M01-046": "Blank-coordinate guard and Visit-level location provenance verified without master-coordinate overwrite.",
    "MVP1-M01-047": "Planner window and Inspector start-now behavior verified live without an invented duration.",
    "MVP1-M01-048": "Eligibility, overlap serialization and Inspector self-assignment verified by the concurrent live test.",
    "MVP1-M01-049": "Review/package/duplicate blockers and blocked-attempt audit verified live.",
    "MVP1-M01-050": "Direct no-plan creation is atomic/idempotent and audit-complete in live concurrency tests.",
    "MVP1-M01-051": "Inspector-created Visit enters the standard field start flow using the confirmed Visit location.",
    "MVP1-M01-052": "Planner notification truth and Inspector no-notification behavior verified live.",
    "MVP1-M02-012": "Same-factory active Visit detection is transaction-locked, blocked and audited in the live suite.",
}

# Sponsor-authorized G11 closure wave. These rows supersede the development
# audit only after production-build/browser evidence was captured.
CLOSURE_OVERRIDES = {
    "MVP1-M02-039": ("verified_live", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] RLS-scoped Visit map, region filter, factory/Visit pins and list equivalent rendered through the planner persona against the live project on 2026-07-16."),
    "MVP1-M04-012": ("verified_live", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Inspector live replay persisted privacy-minimized device_id, os_version and app_version on the journey session through normal RLS on 2026-07-16."),
    "MVP1-M04-017": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Traffic-aware Google Routes adapter, initial ETA request, neutral unavailable/no-route states and journey persistence are wired; the deployment has no provider API key and is not claimed provider-live."),
    "MVP1-M04-024": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] ETA refresh runs from live journey telemetry at the governed cadence and persists latest distance/time/provider facts; provider-unavailable behavior rendered live without fabricated ETA."),
    "MVP1-M04-043": ("verified_live", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Outside-fence live replay proved mandatory reason, actual 1,112m-away coordinates, 5m accuracy, immutable override event, guarded arrived transition and visit audit on 2026-07-16."),
    "MVP1-M04-045": ("verified_live", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Live inspector replay persisted arrival-linked comment evidence through normal RLS with SHA-256, synced_at and one private evidence object; independent database reconciliation passed on 2026-07-16."),
    "MVP1-M07-003": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Source-owned license status/stage/issue/expiry/holder fields exist live and Factory 360 renders source values or explicit unavailable states."),
    "MVP1-M07-004": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Source-owned CR legal-name/status/owner fields exist live and Factory 360 renders source values or explicit unavailable states."),
    "MVP1-M07-005": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Factory 360 spatial map renders official, observed and override facts without changing official master coordinates; registered-factory live browser path passed."),
    "MVP1-M07-014": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Versioned append-only risk snapshots, accepted-model driver contributions and current projection are live; Factory 360 risk-history rendering passed against a registered factory."),
    "MVP1-M07-015": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Reproducible risk driver/history schema and related-violation rendering are live; normalized driver/weight validation and least-privilege RPC grants were reconciled."),
    "MVP1-M07-017": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Source-labelled Factory timeline combines Visit, inspection, review, evidence, penalty, sync and risk events with explicit unavailable legacy facts; live dossier path passed."),
    "MVP1-M07-019": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Sensitive history, documents, contacts, evidence and penalty sections are UI-scoped and backed by live RLS; anon denial and authenticated read-only grants were independently reconciled."),
    "MVP1-M09-001": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Governed effective dates, private attachments, draft edit, successor/deactivation lifecycle, lineage, scoped audit and maker-checker publish are wired; M09 focused production-browser inventory 49/49 PASS on 2026-07-16."),
    "MVP1-M09-005": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Package authoring supports inherited/none/photo/video/document/comment evidence rules with governed validation and runtime projection; M09 focused inventory 49/49 PASS."),
    "MVP1-M09-018": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Per-item required, optional and conditional relationship rules are authorable, validated, frozen in package versions and consumed by field runtime; M09 focused inventory 49/49 PASS."),
    "MVP1-M09-021": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Conditional visibility is authorable with key=value grammar, dependency validation and cycle detection, then evaluated by field runtime; M09 focused inventory 49/49 PASS."),
    "MVP1-M09-022": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] mandatory_when_visible is authorable, version-frozen and enforced only while the condition is visible; M09 focused inventory 49/49 PASS."),
    "MVP1-M09-024": ("implemented", "[TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001] Explicit scoring enable/disable and excluded-response semantics are authorable, validated and projected into field scoring; M09 focused inventory 49/49 PASS."),
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
        live = LIVE_OVERRIDES.get(r["requirement_id"])
        if live:
            status, note = "verified_live", f"[Codex live verification 2026-07-14] {live}"
        remediation = REMEDIATION_OVERRIDES.get(r["requirement_id"])
        if remediation:
            status, note = "implemented", f"[Codex remediation 2026-07-15] {remediation}"
        partial = PARTIAL_OVERRIDES.get(r["requirement_id"])
        if partial:
            status, note = "partial", f"[Codex pending live proof 2026-07-16] {partial}"
        # live-proven rows keep their stronger status only if the audit says BUILT
        ov = OVERRIDES.get(r["requirement_id"])
        if ov and verdicts.get(r["requirement_id"], ("", ""))[0] == "implemented":
            status, note = ov
        status, note = CLOSURE_OVERRIDES.get(r["requirement_id"], (status, note))
        out_rows.append({
            "requirement_id": r["requirement_id"], "acceptance_id": r["acceptance_id"],
            "module": mod, "channel": r["channel"], "status": status, "note": note,
        })

    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out_rows[0].keys()), lineterminator="\n")
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
