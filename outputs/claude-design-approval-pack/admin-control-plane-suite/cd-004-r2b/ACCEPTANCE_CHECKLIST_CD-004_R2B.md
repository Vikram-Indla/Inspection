# ACCEPTANCE_CHECKLIST_CD-004_R2B.md
Status: READY_FOR_MANDATORY_R2B_REVIEW. Verdicts limited to PASS / FAIL / BLOCKED / NOT_APPLICABLE with evidence refs. Nothing self-waived; the independent reviewer, not this file, determines gate outcomes.

| Gate | Verdict | Evidence |
|---|---|---|
| ADM-QG-01 exact IDs/scope | PASS | header block; traceability retained from R1 (P00, SB03/13/18, SCR-ADM-001, MVP1-M09-001..030, FND, RBAC-001..006, ERR-PUB-001/ERR-AUTH-001, AC-0449..0478, DSG-001/SHELL/A11Y/CODE, EV-DESIGN-001) |
| ADM-QG-02 runtime inspected, facts match | PASS | ROUTE_RUNTIME_TRUTH_MEMO_R2 + DATA_TRUTH_LEDGER; all P0-01 overclaims removed from frames r2e-r2j |
| ADM-QG-03 unsupported legs blocked | PASS (legs remain BLOCKED) | wiring W03/W10/W12-W20 blocker_reason column; manifest blocked items; no leg presented as verified |
| ADM-QG-04 control plane not CRUD/KPI | PASS | r2d + r2k counterfactual |
| ADM-QG-05 three materially different hypotheses | PASS | r2a/r2b/r2c — same role/dataset/hard case/shell, models A/B/C as specified |
| ADM-QG-06 decision superiority | PASS | r2d + HYPOTHESIS_COMPARISON |
| ADM-QG-07 one signature | PASS | Configuration Evidence Spine only; r2k deletion test |
| ADM-QG-08 frozen inheritance | PASS | shells in r2e-r2j unchanged; COMPONENT_INHERITANCE |
| ADM-QG-09 data truth / fixtures | PASS | in-frame watermark on every exported frame (r2e..r2l); DATA_TRUTH_LEDGER fixture column |
| ADM-QG-10 states first-class | PASS | STATE_MATRIX_R2 + r2l frames incl. AR+EN critical path; offline/sync NOT_APPLICABLE with reason |
| ADM-QG-11 failure isolation | PASS | r2e row3, r2l-3/3AR/5 — unknown-not-zero, no platform verdict |
| ADM-QG-12 Arabic-first | PASS | r2e/r2f full 1440x1024 AR, r2i AR 1024 desktop, bidi bdi isolation, copy rewritten (P1-04) |
| ADM-QG-13 dark/light equivalence | PASS | r2e vs r2f and r2g vs r2h — identical state full pages |
| ADM-QG-14 a11y deterministic | PASS | ACCESSIBILITY_KEYBOARD_SPEC (exact landmarks/table semantics/names/focus/regions/44px); repeated in COMPONENT_MAP |
| ADM-QG-15 research ledger | PASS | RESEARCH_LEDGER_R2.csv — R01, R02, R09, R11, R12, R16, R18, R19 |
| ADM-QG-16 path-level manifest | PASS | manifest file_changes[] with path/disposition/exact_change/tests/rollback/authorization; forbidden list |
| ADM-QG-17 row-complete wiring | PASS (with BLOCKED rows) | WIRING_MAP_R2 W01-W21, 20 columns; W03/W10 + per-destination behavior remain BLOCKED |
| ADM-QG-18 handoff non-executable | PASS | CLAUDE_CODE_HANDOFF_R2 opening banner |
| CD004-QG-01 no health inference | PASS | timestamp labelled source-fact; no verdict lozenge (r2e/r2g headers) |
| CD004-QG-02 null never zero, independent sources | PASS | r2e row3; per-source modelling contract in memo + wiring |
| CD004-QG-03 nothing invented | PASS | P0-01 removals; proposed reads live only in ledger as BLOCKED |
| CD004-QG-04 route-guard mismatch visible | PASS (leg BLOCKED) | r2l-6 truth text; memo authorization section; W03 |
| CD004-QG-05 role composition | PASS | ROLE_ROUTE_VISIBILITY_MATRIX + r2l-7 restricted-role frame; no unauthorized affordance |
| CD004-QG-06 real routes only | PASS | link targets = existing routes only (memo route list) |
| CD004-QG-07 module ownership | PASS | no approve/publish/edit on home; link-only band |
| CD004-QG-08 screen-level evidence complete | PASS | full-frame PNG set per EVIDENCE_MANIFEST (uncropped, watermarked, hashed) |

Rows that remain BLOCKED regardless of design quality (repeated for the reviewer): admin-family route guard (W03); per-destination read-only vs deny behavior (W12-W20); per-source retry handler mechanism (W10); proposed provenance/draft-queue reads (ledger). These stay BLOCKED until governance/wiring-audit decisions exist.

## R2B addendum (per CD-004_DESIGN_REVIEW_R2)
| Finding | Verdict | Evidence |
|---|---|---|
| Evidence exported per-frame at native dimensions | PASS | R2B PNG set: measured = declared (1440x1024 x4; 1024-wide x2; close-up; counterfactual; 1600-wide hard-state sheet incl. populated + AR/EN critical path); calibration-verified 1 CSS px = 1 px; sha256 + measured dims in EVIDENCE_MANIFEST_CD-004_R2B.csv |
| Proposed data-truth rows schema-exact | PASS | DATA_TRUTH_LEDGER_CD-004_R2B.csv — audit_events(object_type, object_id, occurred_at); package_versions(package_id, version_label, status, published_at) join packages.code |
| Path-level deterministic handoff | PASS | manifest file_changes with literal paths; inline-in-page.tsx shape decision recorded in manifest + component map; i18n.ts corrected to ui_strings lookup truth (localization vehicle BLOCKED); Retry owner candidate named, mechanism BLOCKED |
| Research ledger binding IDs | PASS | RESEARCH_LEDGER_CD-004_R2B.csv — R01/R02/R09/R11/R12/R16/R18/R19 binding; GOV.UK/PostgreSQL/NN-g moved to S01-S03 supplementary; WCAG 2.5.8 corrected to 24x24 minimum, 44x44 retained as Saqeel baseline under R02 |
