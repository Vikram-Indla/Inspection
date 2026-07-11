# Wave D4 Release — iPad / Inspector Workspace (offline-first field software)

**Status: READY_FOR_REVIEW.** Not self-approved. Mobbin: never used. No decision value invented — DEC-002/003/006/008/009/010 all rendered as labeled, configuration-driven placeholders.

## Machine-audited coverage (script output verbatim)

- HTML: 8/8 frames tag-balanced — ALL OK
- **M03+M04 rows: 238 · covered: 238 · uncovered: NONE** (audited against `FABLE_UNDERSTANDING_TRACEABILITY.csv`: a requirement counts as covered only when every SCR-IPAD screen it maps to is designed)
- **Screens: 8/8** — SCR-IPAD-600, 610, 620, 630, 640, 650, 660, 670 · missing: NONE

## Frame locations

| Frame | File | Screen · role |
|---|---|---|
| D4-F01 | `design/astryx/d4/D4-01_assignments.html` | **GOLDEN #3a** — SCR-IPAD-600 Assigned Visits: persistent field chrome (sync/GPS/battery/storage/package chips), today/upcoming/returned tiles, offline-everything-works state, expired-assignment handling |
| D4-F02 | `design/astryx/d4/D4-02_startup-pack.html` | **GOLDEN #3b** — SCR-IPAD-610 Startup Pack: pre-start checklist, package integrity/lock, Factory 360 snapshot, route preview, readiness failures (battery/storage/GPS), corrupt-package quarantine, wrong-mode gate |
| D4-F03 | `design/astryx/d4/D4-03_journey.html` | SCR-IPAD-620 Journey & Check-in: live map + geofence ring, telemetry metrics, weak-GPS retry, outside-geofence two-sided override flow (reason catalogue + mandatory evidence + Ops approval), unable-to-execute reasons, offline buffering |
| D4-F04 | `design/astryx/d4/D4-04_inspection-workspace.html` | **GOLDEN #4** — SCR-IPAD-630 Inspection Workspace: section rail with per-section progress/blockers/locks, big-target response cards (required/conditional/answered/blocked), live rule chain on Non-compliant (violation→penalty-info→blocking action form→mandatory photo), cycling sync chip, offline/crash-recovery/conflict/blocker states, blockers surfaced continuously |
| D4-F05 | `design/astryx/d4/D4-05_evidence.html` | SCR-IPAD-640 Evidence: capture tiles (REF-007), mandatory link targets, metadata stamps, unsynced/rejected/quarantined cards, permission-denied and policy-rejection states, draft-only deletion |
| D4-F06 | `design/astryx/d4/D4-06_findings-actions.html` | SCR-IPAD-650 Findings/Violations/Actions: finding card with 5-step enforcement lineage, blocking corrective-action form (owner/due/required correction), rule-service-offline behavior, observation-without-violation case |
| D4-F07 | `design/astryx/d4/D4-07_submit.html` | SCR-IPAD-660 Pre-Submit & Submission: completion checklist, acknowledgement/refusal area (DEC-009-honest), what-submission-creates timeline, offline-queued submit, idempotent-retry state, submitted-locked state |
| D4-F08 | `design/astryx/d4/D4-08_returned-correction.html` | SCR-IPAD-670 Returned Correction: return package with per-section lock map, immutable reviewer comments, unlocked vs locked question cards side by side, locked-edit-attempt block, reviewer-scope conflict, resubmitted-v2 state |
| Shared | `ipad.css`, `ipad.js` | Field shell (status strip + bottom action bar), 48px/16px field metrics, visit tiles, section rail, response cards, readiness rows, capture tiles, journey metrics, **portrait/landscape toggle on every frame** |

## Completed IDs

- **Requirements: 238/238** — MVP1-M03-001..015 + MVP1-M04-001..223, CSV-audited. Distinctive behaviors designed: assigned-only visibility; window-bound schedule drag; return-assignment with reason; execution-mode gate; package version freeze at download + integrity quarantine; offline cache completeness; journey start validations (assignee/status/window/destination); telemetry + arrival + geofence check-in with governed override; unable-to-execute exceptions; dynamic package-rendered report; required/optional/conditional semantics; autosave + crash recovery; auto-violation with penalty-as-information; blocking action forms; evidence linkage/custody/policy rejection; atomic immutable submission + idempotent retry; selective-unlock correction + Version N+1.
- **Acceptance rows:** all M03/M04-mapped ACs (AC-0099..AC-0336 by module order) design-addressed; UI + failure results on frames; runtime proofs remain build-gate obligations (EV-005/006/007).
- **Storyboards:** SB06 (10/10), SB07 (10/10), SB08 (10/10), SB14 (10/10), SB15 (10/10), SB16 (10/10), SB17 (10/10) — every step table row from the iPad functional spec has a designed surface.
- **Journey:** P04→P05→P06A→P07→P08→P09→(P11) wired via frame-to-frame navigation.
- **Golden screens: #3 ✓ (F01+F02) · #4 ✓ (F04).** Scoreboard: #1 ✓ · #2 ✓ · #3 ✓ · #4 ✓ · #6 half ✓ — remaining: #5 (D5 Review), #6 Ops half (D6).

## Missing IDs

None in D4 scope. Virtual-side execution (M05) = D7; reviewer-side return creation (M06) = D5.

## Blocked IDs (placeholders, nothing invented)

DEC-002 (GPS accuracy threshold, geofence radius, telemetry retention), DEC-003 (correction/overdue SLA, action due-date policy), DEC-006 (evidence formats/sizes/hash), DEC-008 (map provider), DEC-009 (signature vs acknowledgement — acknowledgement/refusal only), DEC-010 (package size/storage thresholds), REF-005 (priority values).

## Open questions

1. Offline UX tone: designed as calm-neutral ("work continues") rather than warning-yellow — confirm this is the intended field psychology.
2. Reviewer-scope conflict on returned work: designed with "server scope is authoritative" single action — confirm (alternative: full two-sided resolver like data conflicts).
3. Portrait layouts collapse the section rail above the canvas — confirm acceptable or require persistent mini-rail.
4. Standing FABLE_OPEN_QUESTIONS items unchanged.

## Acceptance coverage statement

238/238 in-scope rows design-covered with UI + failure results; offline/idempotency/conflict behaviors (EV-006), location evidence (EV-005) and custody chain (EV-007) are designed exactly as the evidence contracts demand — Passed status still requires runtime proof at build gates.

**Next wave on approval:** D5 Review — queue, read-only workspace, approve/return/reject, exact return scope, version comparison (SCR-WEB-300/310/320; MVP1-M06-001..053; SB10/SB17 reviewer side) — **golden screen #5**.

— READY_FOR_REVIEW
