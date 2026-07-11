# Wave D3 Release — Web Portal: Planning · Visit Management · Factory 360

**Status: READY_FOR_REVIEW.** Not self-approved. **Mobbin: never called, cited or used.** Requirements folder confirmed = `MIM_Inspection_MVP1_Historical_Archives_v3/` (CONF-001 RESOLVED_BY_HUMAN, register updated). New pack zip verified byte-identical to repo pack — no directive delta. No unresolved decision value invented.

## Machine-audited coverage (script output verbatim)

- HTML: 7/7 frames tag-balanced — ALL OK
- **M01: 52/52 · missing: NONE**
- **M02: 46/46 · missing: NONE**
- **M07: 20/20 · missing: NONE**
- **Screens: 9/9** — SCR-WEB-100, 110, 120, 130, 140, 150, 200, 210, 400 · missing: NONE

## Frame locations

| Frame | File | Screens · role |
|---|---|---|
| D3-F01 | `design/astryx/d3/D3-01_planning-home.html` | SCR-WEB-100 — three method cards, drafts, recent plans, no-package / no-permission states |
| D3-F02 | `design/astryx/d3/D3-02_bulk-planning.html` | SCR-WEB-110 — AND/OR criteria builder (unlimited combinations), retrieval count, eligibility/duplicate flags, selection bulk bar, invalid-condition & source-unavailable states |
| D3-F03 | `design/astryx/d3/D3-03_single-planning-wizard.html` | **GOLDEN SCREEN #2** — SCR-WEB-120+140+150 as one wired 5-stage wizard (Find → Verify location → Configure → Assign → Review/Publish) with clickable rail, conflict panel, publish-readiness aside, Factory-360 snapshot, atomic-publish semantics |
| D3-F04 | `design/astryx/d3/D3-04_immediate-planning.html` | SCR-WEB-130 — urgent dispatch, unregistered-factory minimum capture, mandatory location pin, planner vs inspector-created rules |
| D3-F05 | `design/astryx/d3/D3-05_visit-management.html` | SCR-WEB-200 — planning-status KPIs (execution excluded by rule), saved views, list/calendar/map toggle, bulk bar with per-row failure reporting, stale-row state, state-guarded row menu |
| D3-F06 | `design/astryx/d3/D3-06_visit-detail.html` | SCR-WEB-210 — dual-domain status header, immutable timeline, audit drawer, live journey map (policy-gated inspector pin), locked-after-start & concurrent-edit-conflict states |
| D3-F07 | `design/astryx/d3/D3-07_factory-360.html` | **GOLDEN #6 (dossier half)** — SCR-WEB-400 full-page longitudinal dossier: Senaei identity (read-only, freshness), 3-source location provenance, history, violation→penalty→action chains, unified immutable timeline, per-section fault isolation, DEC-001-honest risk section |
| Shared | `web.css`, `web.js` | Method cards, wizard rail + stage machine, factory card, conflict/inspector rows, Factory-360 dossier grid |

All frames: live state switchers per catalogue-mandated states; contract-traceability footers; interlinked navigation (planning home → wizards → management → detail → Factory 360 → back), plus cross-links into D2 Admin (no-package state links to Package Designer).

## Completed IDs

- **Requirements:** MVP1-M01-001..052 (52), MVP1-M02-001..046 (46), MVP1-M07-001..020 (20) = **118 rows design-covered**. Load-bearing behaviors designed, not just cited: three-methods-per-role; one-method-per-session; unlimited AND/OR; CR/IL-only single search; multi-license selection; official-vs-planner location provenance; one-plan-one-visit; auto/manual assignment with capacity conflict + alternatives; publish validation gate + atomic publish; immediate unregistered path with mandatory location and bypass-plan creation; KPI planning-statuses-only; edit-before-start lock; Returned-managed-as-Single; republish-same-IDs; cancel-reason-final; duplicate prevention; system expiry; immutable timeline/audit; Factory 360 read-only source, role-gated sections, partial-failure isolation.
- **Acceptance rows addressed at design level:** AC-0001..AC-0098 (M01+M02) + AC-0359..AC-0378 (M07) = 118.
- **Storyboards:** SB04 (8/8 steps), SB05 (11/11 steps), SB11 (10/10 steps) + SB19 navigation steps 1–4.
- **Journey:** P01→P02→P03 designed end-to-end (golden wizard); P12 read-side (dossier).
- **Golden screens:** #2 delivered; #6 dossier half delivered (Operations Center half lands in D6).

## Missing IDs

None in D3 scope. AI sub-capabilities of M01-002..010/016/026 remain Phase-2 deferred per classification (parent flows fully designed; noted inline on D3-F02).

## Blocked IDs (labeled placeholders, nothing invented)

DEC-001 risk band/health score (Factory 360 + wizard snapshot show "— DEC-001"), DEC-002 (geofence values on detail map), DEC-005 (unregistered-entity reconciliation boundary noted on D3-F04), DEC-008 (map provider watermark, all maps), REF-005 priority list.

## Open questions

1. Golden #2 combines SCR-WEB-120/140/150 into one wizard — confirm the combined-wizard IA (catalogue lists them as separate routes; the wizard preserves per-route traceability and can split cleanly).
2. Visit-detail concurrent-edit conflict UX (preserve form + show server change) — confirm as the standard web conflict pattern (mirrors offline conflict-resolver philosophy).
3. Standing: FABLE_OPEN_QUESTIONS.yaml (CONF-001 now resolved; others unchanged).

## Acceptance coverage statement

118/118 in-scope acceptance rows have designed UI-result + failure-result surfaces; backend/audit/evidence obligations annotated per frame (EV-003 transitions, EV-004 risk reproducibility, EV-011 visual). No Passed status claimed — runtime evidence remains a build-gate obligation.

**Next wave on approval:** D4 iPad — assignments, startup pack, journey/GPS/geofence, inspection workspace, evidence, findings/actions, immutable submit, returned correction (SCR-IPAD-600..670; MVP1-M03-001..015 + M04-001..223; AC-0099..0336; SB06/SB07/SB08/SB14/SB15/SB16/SB17) — golden screens #3 and #4.

— READY_FOR_REVIEW
