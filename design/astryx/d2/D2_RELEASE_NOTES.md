# Wave D2 Release — Admin Control Plane

**Status: READY_FOR_REVIEW.** Not self-approved. **Mobbin: not called, not cited, not used — and never will be.** Historical archives provenance only; Meta-Astryx direction only; no unresolved decision value invented (every gated field is a disabled, DEC-labeled placeholder).

## Frame locations (open in browser; frames interlink via left nav)

| Frame | File | Screens |
|---|---|---|
| D2-F01 | `design/astryx/d2/D2-01_admin-home.html` | SCR-ADM-001 (engine health, runtime-consumption proof view, maker-checker queue, dependency warnings) |
| D2-F02 | `design/astryx/d2/D2-02_regulations.html` | SCR-ADM-010 + SCR-ADM-011 (hierarchy tree, clause provenance, version lineage, dependency impact, maker-checker pipeline) |
| D2-F03 | `design/astryx/d2/D2-03_items.html` | SCR-ADM-020 (response models, runtime meaning, reuse counts, deactivation semantics) |
| D2-F04 | `design/astryx/d2/D2-04_package-designer.html` | SCR-ADM-030 + SCR-ADM-031 — **flagship**: 3-pane designer (tree · composition canvas · validation/impact/publish inspector), response→compliance→violation→evidence→action-form rule chain, publish pipeline with live demo, version history |
| D2-F05 | `design/astryx/d2/D2-05_violations-penalties.html` | SCR-ADM-040 + SCR-ADM-041 (one-violation-one-penalty cardinality, trigger lineage stepper, orphan/overlap failures, locked mapping version) |
| D2-F06 | `design/astryx/d2/D2-06_workflows.html` | SCR-ADM-050 + SCR-ADM-051 (state canvas with guard-labeled edges from frozen STM rows, graph validation, simulation results, unreachable-state / terminal-loop blockers) |
| D2-F07 | `design/astryx/d2/D2-07_risk-gis.html` | SCR-ADM-060 + SCR-ADM-070 (decision-blocked containers: drivers/weights/bands + geofence/accuracy/override/retention — all values DEC-gated) |
| D2-F08 | `design/astryx/d2/D2-08_notifications-access.html` | SCR-ADM-080 + SCR-ADM-090 (REF-014 event catalogue rules, provider-degraded state, RBAC matrix from frozen contract, privilege-conflict failure) |
| Shared | `admin.css`, `admin.js` | Control-plane 3-pane layout, tree, inspector, publish pipeline, dependency checks, impact rows, **screen-state switcher** |

**Every frame includes a live state switcher** covering its catalogue-mandated states: populated / loading / empty / validation / publish-blocked / locked-immutable / unauthorized / degraded (as applicable per `screen_route_catalogue.csv` states column). Wired interactions: tree selection, item selection → inspector, maker-checker pipeline advance, widget-failure simulation, RTL-ready markup (logical properties inherited from D1).

## Completed IDs (machine-audited this release)

- **Screens: 14/14** — SCR-ADM-001, 010, 011, 020, 030, 031, 040, 041, 050, 051, 060, 070, 080, 090. Zero missing (audit script output: `screens: 14/14 · missing: NONE`).
- **Requirements: MVP1-M09-001..030 — 30/30 cited and behaviorally represented** (audit: `M09 coverage: 30/30 · missing: NONE`). Key behaviors designed, not just cited: regulation parentage (M09-001/002), auto-violation no-override (M09-003/026), one-penalty cardinality (M09-004), evidence blocking (M09-005), package/item reuse (M09-006/007), template consumption (M09-008), action-form triggers (M09-009/027), immutable versioning (M09-010), draft/publish lifecycle (M09-011), dependency validation (M09-012/029), impact analysis (M09-013), deactivation with history (M09-014), audit trail (M09-015), sections/order (M09-016/017), mandatory/conditional logic (M09-018/021/022), response/compliance mapping (M09-019/020), weight/score/exclusion (M09-023/024), evidence override (M09-025), preview (M09-028), runtime locking (M09-030).
- **Acceptance rows addressed at design level: AC-0449..AC-0478** (30) — each frame footer maps its ACs; UI result + failure result designed; runtime/system results remain build-phase obligations (EV-002 proof chain annotated on every frame).
- **Storyboards:** SB03 (all 8 steps), SB13 (all 10 steps), SB18 (all 10 steps) fully represented; SB20 config-engine layer partially (completes in D9 audit).
- **Journey:** P00 complete — Draft→Validated→Approved→Published→Locked designed as maker-checker pipeline on every publishable object.

## Missing IDs

None within D2 scope. Remaining waves: D3 (SCR-WEB-100..210, 400 + M01/M02/M07), D4 (SCR-IPAD-*, M03/M04), D5 (SCR-WEB-300/310/320, M06), D6 (SCR-WEB-500, M08), D7 (SCR-VIR-*, M05), D8 journeys/RTL/responsive variants, D9 full audit + handoff.

## Blocked IDs (decision-gated placeholders — visible, labeled, disabled)

DEC-001 (risk drivers/weights/bands), DEC-002 (geofence radius/accuracy/retention), DEC-003 (SLA calendar/timers/grace windows), DEC-007 (SMS/OTP provider — degraded state designed), DEC-008 (map provider watermark), REF-005/006/008/011 decision-scoped value lists. Penalty amounts reference "approved schedule" — never shown as numbers.

## Open questions

1. Package designer is the strongest golden-screen candidate (Approval 2 list item 1) — confirm it advances as-is or with review corrections.
2. Workflow canvas: static-positioned nodes are design authority; is a drag-editable canvas prototype wanted in D8, or is edit-interaction spec (annotated) sufficient for engineering?
3. Approval queue on Admin Home assumes approver ≠ author across all object types (generalized from RBAC-001/002 maker-checker) — confirm this generalization is intended policy for workflows/penalties too, or scope it per object.
4. Standing: FABLE_OPEN_QUESTIONS.yaml unchanged.

## Acceptance coverage statement

30/30 M09 acceptance rows have designed UI-result and failure-result surfaces; visible-result wording on frames mirrors AC "Source Acceptance Criteria". System-result/audit/evidence obligations are annotated per frame (EV-002/EV-003 proof chains) and become claimable only with runtime evidence at build gates — design cannot and does not claim Passed status (workbook rule: no Passed without evidence reference).

## Audit against approved CSVs

- `FABLE_UNDERSTANDING_TRACEABILITY.csv` M09 rows: 30/30 design-covered (script-verified, zero unmapped).
- `FABLE_ACCEPTANCE_UNDERSTANDING.csv` AC-0449..0478: actor/input/UI-result/failure designed; backend/workflow/audit columns annotated on frames.
- HTML validation: 8/8 frames tag-balanced.

**Next wave on approval:** D3 Web — planning, assignment, publish, visit management, Factory 360 (SCR-WEB-100..210 + 400; MVP1-M01-001..052, M02-001..046, M07-001..020; AC-0001..0098, AC-0359..0378; SB04, SB05, SB11).

— READY_FOR_REVIEW
