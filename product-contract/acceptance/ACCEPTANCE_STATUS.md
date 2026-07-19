# Acceptance Status

## TASK-WEB-COMPLIANCE-SHARED-SHELL-001 — 2026-07-19

- CMP-ACC-013, 016..019, 024 and 030..038: **PASS_IMPLEMENTED_VERIFIED**.
- Five exact shell groups, ten unified business destinations, accessible locked
  Administration visibility, role-composed admin enablement and the full shared topbar are verified.
- Route guards and RLS remain authoritative; the live non-admin regulation publish negative passes.
- Sponsor runtime/visual acceptance: **PENDING**.
- Exact map: `CMP_SHARED_SHELL_001.csv`; evidence:
  `../evidence/TASK-WEB-COMPLIANCE-SHARED-SHELL-001.md`.

## 2026-07-18 — Platform foundation promotion 003

- PDS-AC-001..024: PASS_SOURCE.
- PDS-AC-025: CONDITIONAL_RELEASE — WCAG, DGA/Platforms Code, native Arabic/RTL and observed inspector endurance remain open.
- Exact ledger: `acceptance/PDS_PLATFORM_FOUNDATION_PROMOTION_003.csv`.

## TASK-DESIGN-INSPECTOR-SHELL-UPLIFT-002 — 2026-07-18

- UIU-ISP-AC-001..020: **PASS_LOCAL** — source, compile, static contracts and component
  visual/geometry evidence cover Shell A default, optional Shell B, inspector-first order,
  modern field task bar, task-first composition, theme/RTL/focus/target size, frozen inputs,
  Atlas isolation and the no-behavior-change boundary.
- UIU-ISP-AC-021..024: **OPEN_RELEASE_GATE** — product-wide WCAG, DGA/Platforms Code,
  native Arabic/RTL and observed inspector endurance are not certified or claimed.
- Authenticated `/field` and full browser regression remain pending a controlled environment;
  the current route performs a state-changing expiry transition and no shared-data mutation
  was authorized.
- Exact map: `UIU_INSPECTOR_SHELL_UPLIFT_002.csv`; evidence:
  `../evidence/TASK-DESIGN-INSPECTOR-SHELL-UPLIFT-002.md`.

## TASK-MVP3-RETROFIT-REGRESSION-001 — 2026-07-18

- MVP3 engineering retrofit over MVP1/MVP2: **PASS**.
- Exact MVP3 scope: **84/84 rows dispositioned** across twelve design modules plus assurance.
- Database/RLS: **PASS** — live additive migration, 13/13 RLS tables, 25 policies, zero anonymous
  grants and rollback-only governed RPC probe with zero residuals.
- Application regression: **PASS** — typecheck/build pass; 510 browser tests pass, nine explicit
  provider/destructive-replay tests skip, zero tests fail (98.27% passing inventory).
- External providers and production release: **HELD FAIL-CLOSED** and not counted as delivered.
- Exact evidence: `../evidence/TASK-MVP3-RETROFIT-REGRESSION-001.md`.

## TASK-DESIGN-FOUNDATION-SHELL-RESET-001 — 2026-07-18

- DSF-AC-001..030: **PASS** for the shared foundation and authenticated shell.
- WCAG token contrast, focus visibility, bilingual type, responsive shell, transparent
  prism, notification and account contracts are verified.
- Inputs are frozen and Cinematic Atlas v0.8 is isolated.
- Page-specific redesign and complete authenticated regression are separate follow-on
  work. Exact map: `DSF_FOUNDATION_SHELL_RESET_001.csv`.

## TASK-IPAD-MAPBOX-RUNTIME-004 — 2026-07-16

- Shared map migration across web, Admin and iPad: **SOURCE PASS** — Mapbox GL
  JS replaces Leaflet/React Leaflet; Mapbox Directions replaces the in-app ETA
  provider; no access token is committed.
- Geofence presentation and field safety: **SOURCE PASS** — metre-based
  geodesic fence geometry, server-authoritative decisioning, existing GPS
  checks, audit and offline rules are preserved.
- Compile and source-contract verification: **PASS** — typecheck, production
  build, no-Leaflet/no-Google runtime scan, diff check and focused Playwright
  5/5.
- Runtime provider acceptance: **AWAITING INSPECTION STAGING APPLICATION
  CONFIGURATION** — the sponsor-confirmed Inspection staging database
  (`iiozvqntawxfwbgffzqu`) passed read-only migration/schema preflight, but no
  staging application target or `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` /
  `MAPBOX_ACCESS_TOKEN` values are configured. This is not a Catalyst target
  and this status is not production acceptance.
- Exact evidence: `../evidence/TASK-IPAD-MAPBOX-RUNTIME-004.md`.

## TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003 — 2026-07-16

- Source acceptance for `AC-0152..AC-0156`: **PASS** — requester ownership,
  Operations-only decision, self-decision refusal, evidence/safety exception,
  expiry/visit-close guards, durable offline ordering and the guarded arrival
  transition are present in the database and UI contracts.
- Compile and source-contract verification: **PASS** — typecheck, production
  build, diff check and focused Playwright 3/3.
- Runtime acceptance: **AWAITING CONTROLLED DATABASE RUNTIME** — no local
  Supabase/Docker configuration and no authenticated clean-worktree runtime
  credentials; remote migration history/access remains unreconciled. This
  status must not be promoted to live verified until the forward migrations and
  inspector/Operations acceptance journey pass in a controlled environment.
- Exact evidence: `../evidence/TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003.md`.

## TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001 — 2026-07-16

- AC-0091, AC-0125, AC-0130, AC-0137, AC-0156, AC-0158, AC-0412,
  AC-0413, AC-0414, AC-0423, AC-0424, AC-0426, AC-0428, AC-0449,
  AC-0453, AC-0466, AC-0469, AC-0470 and AC-0472: **PASS**.
- Live-verified rows: M02-039, M04-012, M04-043 and M04-045. The other
  historically partial rows are implemented and runtime-verified without
  overstating unavailable provider delivery or unavailable legacy driver data.
- Ledger reconciliation: **493 total = 18 verified_live / 475 implemented /
  0 partial / 0 missing**.
- Typecheck and production build pass. Complete browser inventory: **283 passed /
  3 intentional skips / 0 product failures**; live arrival and outside-fence
  negative replays pass separately through ordinary RLS paths. Exact evidence:
  `../evidence/TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001.md`.
- This closes the 19-row requirement task. It does not declare G11 hardening or
  G12 release complete, and it does not claim Google Routes delivery while the
  deployment credential is absent.

## CD-006 through CD-011 backend completion — 2026-07-15

- Superseded by the sponsor-approved 2026-07-16 closure above: the six rows are
  **PASS**, their authoritative forward migrations are live, and authenticated
  browser verification is complete.
- Exact evidence: `../evidence/CD006_CD011_BACKEND_COMPLETION_2026-07-15.md`.

G4 acceptance: **PASS** (cloud-verifiable) — 2026-07-11.

Pass criteria (all satisfied):
1. One canonical repository is used by Git, Obsidian and Claude. — PASS
2. No duplicate Obsidian copy exists. — PASS
3. Root CLAUDE.md is loaded in a fresh and resumed session. — PASS (validate + session_start hook)
4. Current slice is injected at SessionStart. — PASS (G4-EV-005)
5. Prohibited destructive actions are blocked by hook. — PASS (G4-EV-006)
6. Session ledger is append-only and usable for fresh-session resumption. — PASS (G4-EV-007)
7. Auto memory is confirmed advisory and cannot override the contract. — PASS (G4-EV-004)

Non-blocking post-check: Obsidian desktop screenshot (G4-EV-003 `.png`).

G5 acceptance: not opened. Requires resolution of open decisions and live-schema
reconciliation (see docs/G5_ARCHITECTURE_AND_READINESS.md).

## TASK-G11-REMEDIATION-001 disposition — 2026-07-16

- Sponsor authorization: **RECORDED** for CD-005..011, CD-025, CD-028, CD-030
  and TASK-WEB-DASHBOARD-002; CD-006..011 R2 frontend designs accepted for this
  remediation slice.
- Historical baseline: **252 passed / 20 failed / 1 skipped / 2 not run** from
  the then-current 275-test inventory.
- Current inventory: **276/276 PASS** — three real-login persona setup tests and
  273 application tests; **0 failed / 0 skipped / 0 excluded**.
- Static acceptance: **PASS** — typecheck, production build, diff/static safety
  checks and audit reconciliation.
- Behavior acceptance: **PASS for the approved engineering slice** — Admin
  maker-checker/audit/immutability truth, exact CD-025 semantics, continuous
  CD-028 Start Review, CD-030 changed-row/Arabic navigation, bounded dashboard
  reads, JWT-claim authenticated reads, negative paths, RTL/theme/responsive and
  the complete cross-persona golden journey are verified.
- No acceptance inflation: the AC ledger stays at 14 `verified_live`, 460
  `implemented`, 19 `partial`; unavailable provider/policy/schema legs remain
  blocked.
- Overall status: **REMEDIATION VERIFIED COMPLETE**. This is not sponsor runtime
  acceptance, G11/G12 release certification, production deployment, live-DDL
  approval or branch/main promotion.
- Evidence: `../evidence/TASK-G11-REMEDIATION-001.md`.

## CD-001 V7 login design disposition — 2026-07-13

- Sponsor status: **ACCEPTED FOR NOW; DESIGN ITERATION CLOSED**.
- Runtime status: implemented on `feat/cd-001-v7-atlas`; typecheck/build and CD-001 interaction/visual suites pass.
- Coverage: English/Arabic, RTL, dark/light, desktop/laptop/mobile evidence captured.
- Reopen rule: demonstrated P0/P1 regression, accessibility/security failure, protected-behavior break, or recorded release blocker only.
- Production is not approved: asset rights, official geographic verification, Arabic-only raster option and public-coverage communication remain P1 release items.
- CD-002 update: manually sponsor-approved; Claude Code implementation outcome requires independent wiring and runtime verification.

## TASK-WEB-SHELL-001 disposition — 2026-07-13

- Design direction: **SPONSOR APPROVED** from the reconciled business reference.
- Implementation verification: **PASS** — typecheck, production build, targeted Playwright 10/10, visual evidence 4/4 including persona setup, complete regression 41/41.
- Contract coverage: role-scoped real routes; Arabic-first RTL; dark/light; desktop collapse; mobile drawer/focus/Escape; account/language/theme/notification/sign-out; unsupported tabs omitted.
- Documentation: repository shell authority plus V3 43-screen pack; 43/43 prompts carry shell-family rules and 22/22 supplied business tabs are dispositioned.
- Runtime sponsor status: **SPONSOR ACCEPTED 2026-07-13**. TASK-WEB-SHELL-001 is complete and the shared Web/Admin shell is frozen for CD-020..CD-031; reopen only for a demonstrated P0/P1 regression, security/accessibility failure, protected-behavior failure or approved change control.

## TASK-DASH-KPI-SEED-001 disposition — 2026-07-13

- KPI-SEED-AC-001 idempotent, clearly labelled fixture family: **PASS** — fixed UUIDs; repeat run inserts zero duplicates; Region `Verification Fixtures`, City `Dashboard KPI`.
- KPI-SEED-AC-002 every operational state traceable to a visit: **PASS** — exactly one fixture in `new`, `prepared`, `on_the_way`, `arrived`, `executing` and `submitted`, all independently queried.
- KPI-SEED-AC-003 panel coverage: **PASS** — monitoring, SLA, high-risk, geo, corrective-action, notification and live-map evidence present.
- KPI-SEED-AC-004 protected data access: **PASS** — planner, inspector and operations JWTs exercise existing RLS; no service key, schema/policy mutation or engine-setting change.
- KPI-SEED-AC-005 runtime verification: **PASS** — typecheck/build, focused Playwright 6/6, complete regression 44/44 and visually reviewed captures.
- Overall status: **IMPLEMENTED_VERIFIED_COMPLETE** for the configured verification project. This does not authorize production seeding or deployment.

## TASK-WEB-DASHBOARD-002 disposition — 2026-07-13

- DASH-AC-001..016: **PASS** — dedicated two-view dashboard, functional entity/date/region topbar, live formulas/denominators, truthful unavailable states, RTL/theme/responsive/accessibility/failure behavior and explicit Operations/Leadership route guard.
- AC-0430..AC-0448 dashboard-visible reconciliation: **PASS** — implemented or explicitly unavailable only where the governed runtime has no source, field, threshold or policy; see `../evidence/TASK-WEB-DASHBOARD-002-REQUIREMENT-MATRIX.md`.
- Security/data posture: **PASS** — caller-session Supabase access, RLS, no service role, no schema/policy/engine/workflow changes, no copied sample KPI values and no AI/prescriptive claims.
- Automated verification: **PASS** — typecheck, production build, focused dashboard/shell Playwright 16/16 and complete regression 50/50.
- Visual verification: **PASS** — English dark/light desktop and Arabic RTL narrow/mobile evidence reviewed.
- Overall status: **IMPLEMENTED AND VERIFIED; SPONSOR RUNTIME ACCEPTANCE PENDING**. Unsupported Analytics/Lookup/Notification Configuration/Integration products remain intentionally hidden under the accepted shell disposition; they are not claimed as built.

## CD-025 R3 and CD-026 design disposition — 2026-07-14

- CD-025 R3 page composition: **PRESERVE PENDING CORRECTION** — root design corrects the shared Planner shell and drawer model.
- CD-025 R3 submitted archive: **BLOCKED — P1** — hybrid R2/R3 deliverables, missing R3 standalone/evidence and stale unsafe Claude Code prompt. No sponsor approval and no implementation authorization.
- CD-025 next acceptance input: one clean synchronized R4 archive produced from `CD-025_PROGRESSIVE_CORRECTION_PROMPT_R3.md`, followed by fresh Codex review.
- CD-026: **PROMPT READY ONLY** — no Claude Design output, sponsor approval, wiring audit or implementation authorization exists yet.
- CD-027: superseded by the disposition below.

## CD-027 / SCR-WEB-210 / P03 — Visit Detail disposition — 2026-07-14 (CLOSED-WAIVED 2026-07-15)

- **Closure: CLOSED (SPONSOR-WAIVED) — 2026-07-15 (Vikram Indla).** Runtime acceptance granted; DEC-012 independent (non-implementer) audit **waived, not satisfied**; the three blocked legs **deferred to change-control, not done**. Recorded in `governance/HUMAN_APPROVALS.yaml` (gate `CD-027-closure-waiver`). Reopen on any P0/P1 regression, a later independent-audit finding, or a blocked-leg decision landing.
- Sponsor status: **APPROVED (Vikram Indla, 2026-07-14)** for Track 1 + safe Track 2 wiring closures; recorded in `outputs/claude-design-approval-pack/CD-027_WIRING_AUDIT_R1.md` (DEC-012).
- Baseline: `BASELINE_REVERIFY_REQUIRED` cleared — reverified against local `HEAD 8af0185` (`9360fc9` in history); `setup/Inspection` not used; dirty tree preserved.
- Design source: imported CD-027 r2 (`READY_FOR_DESIGN_REVIEW_R2`) from Claude Design project `Plan Review and Publish`.
- **DSG-022** (integrated Visit Detail): **IMPLEMENTED AND VERIFIED** — Dual-State Ribbon (five never-collapsed domains: planning/operational/assignment/inspection/review), identity header, evidence chapters, available/disabled-with-why/unavailable action zones. 16/16 e2e pass on the local production build.
- **DSG-A11Y-001** (semantic, RTL, responsive, non-color): **IMPLEMENTED AND VERIFIED** — ribbon as keyboard `tablist` (APG roving tabindex, Arrow/Home/End); glyph+label status (FND-011); `role=status` completion / single `role=alert` failure; 412 narrow reflow to ordered ledger. RTL/theme parity carried by unchanged tokens/astryx.
- Wiring (14 legs, DEC-012): all wired. Track 2 closed **ERRORMAP** (neutral errors, no raw provider text), **ORPHAN** (compensating storage cleanup), **NOTIFY_PREV** (previous-inspector notify via existing REF-014 `assignment` event).
- Still blocked (not closed — hard-rule protected): **MAP** (never invent provider/geofence), **ASSIGNMENT_RELEASE** (open product/state-machine decision), **ATOMIC** (would weaken accepted best-effort-notify contract). Each needs its own change-control.
- Preserved: RLS reads + joins, five state machines, field/journey ownership of operational state, state-guarded actions + guards, append-only audit (limit 30), immutable submissions, private attachments + soft delete, signed URLs, queued-not-delivered notifications, system-only expiry, the grouped shell.
- Reopen rule: demonstrated P0/P1 regression, a11y/security failure, protected-behavior break, or recorded release blocker only.

## Independent Codex remediation rollup — CD-021 through CD-030 — 2026-07-15

- Safe, code-authorized findings from the prior audits are closed and independently re-verified: CD-021 (criteria/focus/select-all/role guard/map reconciliation), CD-022 (registry/duplicate/authorization), CD-023 (immediate-create contract and Startup error sinks), CD-026 (neutral load errors and expiry-refresh observability), and CD-029's four P1 findings.
- CD-022 follow-up acceptance detail: selection-time duplicate warnings now show the conflicting visit ID, lifecycle status and deep link; the fresh live identity-lens suite is **13/13 PASS**.
- CD-021 follow-up acceptance detail: mixed valid/blank untrusted criteria URLs now fail closed as invalid, and staged review now distinguishes out-of-scope selections from empty/source-failure states; the fresh live bulk-targeting suite is **24/24 PASS**.
- Continuation verification: typecheck PASS, production build PASS, CD-021 + CD-026 focused suites **32/32 PASS**; prior stable review-flow regression **31 PASS / 1 skip**.
- This is not sponsor acceptance or release approval. CD-024/CD-025 lifecycle ownership, CD-026/CD-027 policy/provider handoffs, CD-028 live race-migration/claim policy, and CD-029 authorization/provider/atomic semantics remain explicitly blocked or conditional.
- Cross-cutting runtime remediation: empty-session sign-in now fails with neutral `ERR-AUTH-001` copy and stale offline replay completions cannot overwrite the offline badge; focused auth-negative + offline verification is **7/7 PASS**. The expanded neutral-error sweep also covers Admin Items/Violations/GIS, Package/Workflow actions, Notification Bell, field factory verification, offline replay, and virtual-session actions: **25/25 PASS**. Evidence: `../evidence/CODEX_AUDIT_NEUTRAL_ERROR_SWEEP_2026-07-15.md`.
- Final runtime reconciliation: nullable Factory 360 identity fields render an explicit unavailable marker, the KPI fixture is refreshed through the canonical idempotent seed, and the virtual-room readiness string contract is complete. Golden journey **9/9 PASS**; final CD-031 + KPI **18/18 PASS**; typecheck/build PASS. Full-run environmental failures remain separately documented, not treated as product wiring defects.
- Final neutral-error follow-up: virtual-session timeline and notification failures no longer interpolate raw RPC/provider text into successful reschedule/wait/join messages; focused virtual + CD-027 + CD-023 regression is **33/33 PASS**. Evidence: `../evidence/CODEX_AUDIT_NEUTRAL_ERROR_SWEEP_2026-07-15.md`.

### CD-030 Version Comparison remediation — 2026-07-15

- Fixable R3 findings are closed in code: submission-version read scope now matches the admitted workspace roles without widening writes; no-row/outside-scope is distinct from degraded fetch; stale comparison copy is localized; and `returned_sections` has a forward JSON-array shape guard while package-defined section membership remains server-validated.
- Verification: typecheck/build PASS; `cd-030-version-comparison.spec.ts` **17 passed / 1 data-dependent skip**. Live application of the forward migration is not yet proven because the Management API returned 403 and the prior local PAT is unavailable. Provider/media/package/metadata diff sources remain intentionally blocked.
- Follow-up hardening: review-action provider/read failures now fail closed, notification lookup failures are explicit after a recorded decision, and the stored returned-scope authority is sorted by `decided_at`; typecheck/build PASS. Combined isolated CD-029/CD-030 rerun is **26 passed / 1 data-dependent skip**.

## Independent Codex wiring audit CD-022..CD-029 — 2026-07-15

- Audit record: `../evidence/CODEX_AUDIT_CD-022_TO_CD-029_2026-07-15.md`.
- This audit is independent of the Claude Code implementation audits and does not grant sponsor acceptance or implementation authorization.
- Verdicts: CD-022 **PASS** for delivered scope; CD-023 **PASS** for delivered scope; CD-024 **BLOCKED**; CD-025 **CONDITIONAL PASS** for the staged bulk-review subset only; CD-026 **CONDITIONAL PASS** for Track 1; CD-027 **CONDITIONAL PASS** for implemented tracks (MAP/ASSIGNMENT_RELEASE/ATOMIC remain blocked); CD-028 **CONDITIONAL PASS** for queue scope (CLAIM/REASSIGN and CD-029 decision atomicity remain blocked); CD-029 **BLOCKED** because implementation is unauthorized and its media/claim/linked-source/atomic decision legs are not closed.
- Focused evidence at audit time: typecheck/build PASS; 67/67 focused Playwright cases PASS across CD-022/023/025/026/027/028, including auth setup. Current remediation evidence adds the dedicated CD-029 suite and is recorded in the remediation rollup.
- Production not approved: provider/policy/atomic boundaries remain open, but the independent CD-029 re-audit is captured and its downstream golden journey now passes 9/9.

### CD-029 focused independent re-audit and remediation — 2026-07-15

- **Verdict: BLOCKED overall; delivered P1 remediation verified.** The 18-leg audit and closure record are in `../evidence/CODEX_AUDIT_CD-029_2026-07-15.md`.
- Current verification: typecheck/build PASS; combined CD-028/CD-029/CD-030 regression **31 PASS / 1 skipped** on an isolated production server; CD-029 focused suite **10/10 PASS**.
- Responsive follow-up: Arabic/RTL 412px review workspace leg 18 is now **4/4 PASS** after containing the closed drawer's off-canvas overflow and validating visible workspace bounds; the CD-030 navigation/source follow-up is **5 PASS / 1 data-dependent skip**.
- Closed findings: start-review now binds submission version to inspection/latest version; decisions and returned sections are server-allow-listed; decision errors have alert/focus recovery; the linked source/version-labelled Finding Trace Chain is rendered.
- Remaining release blockers are intentional: package `implementation_authorized: false`, provider-backed media, claim/reassign policy, atomic decision→inspection→notification semantics, and governed linked-source/provider behavior. No sponsor acceptance or implementation certification is granted. The formerly open downstream golden review is now **9/9 PASS** on a fresh isolated server; the earlier CD-022 timeout did not reproduce.

## CD-028 / SCR-WEB-300 / P03 — Level 2 Review Queue disposition — 2026-07-15

- **Status: IMPLEMENTED AND LANDED ON CANONICAL (`setup/Inspection`, PR #11, commit `b9b3a5c`). NOT CLOSED.** Sponsor design approval + backend authorization granted in-session (Vikram Indla, 2026-07-15), overriding the R2 pack's `implementation_authorized:false` for this slice. Runtime acceptance **pending**; DEC-012 status revised below — the scan-first-queue scope IS independently confirmed, the follow-up discoverability fix is NOT yet.
- Design source: imported CD-028 r2 from Claude Design project `20cb0dce-94f1-4423-b923-00d6fd0d2c24` (`CD-028 Level 2 Review Queue.dc.html`, `outputs/cd-028-r2/*`).
- **Scan-first queue (leg 10): IMPLEMENTED AND VERIFIED** — the `/reviews` list renders zero decision controls; inline decision panels removed; a row opens `/reviews/:id` (read-only navigation).
- **Scan-only open (leg 5, HANDOFF_BLOCKED_QUEUE_OPEN_MUTATION): RESOLVED** — opening `/reviews/:id` no longer creates the review or transitions to `under_review` as a render side-effect; that moved to an explicit reviewer-intentful `startReview` server action + `StartReview.tsx`. Preserves the M06 decision flow (started reviews reach `decideReview` unchanged).
- **Readiness derivation (leg 3b, HANDOFF_BLOCKED_QUEUE_READINESS): RESOLVED** — checklist/evidence/acknowledgement/factory-verify derived from RLS-scoped joins + batched `inspection_factory_checks`; unreadable source → `unavailable`, never invented. Fingerprint = labelled facts (SLA/risk/critical/priority + four readiness facts), non-colour (FND-011).
- **DSG-A11Y-001** (semantic, RTL, responsive, non-color): **IMPLEMENTED** — `role=status/alert` empty/degraded/unauthorized blocks, keyboard focus, glyph+label status, Arabic/RTL + dark/light + 1024/412; strings via `t()` (Arabic seed deferred, EN fallback per i18n design).
- Negative states: unauthorized (distinct from queue-clear via `user_roles` read), missing-SLA, degraded (linked source unreadable), unreadable-row flag, no-match.
- Still blocked (not closed — no policy to invent): **CLAIM / REASSIGN** (leg 11/12) shown `unavailable` only; **ATOMIC** decision notification (leg 13, CD-029) untouched. Each needs its own change-control.
- Preserved: RLS reviews scope, Level 2 role boundary, immutable decided reviews + append-only audit + `trg_guard_review`, config-derived SLA (null → unavailable), queued-not-delivered notifications, decision atomicity/copy, the grouped shell.
- Verified: `next build` 0 errors; `tsc --noEmit` 0 errors; color-law 0 violations; e2e `cd-028-review-queue` 12/12, `golden-journey` 9/9 (P3/P5 exercise the explicit Start flow), `persona-tours`+`cd-025` 17/17.
- **DEC-012 status (revised 2026-07-15, later same day):** the independent Codex audit `../evidence/CODEX_AUDIT_CD-022_TO_CD-029_2026-07-15.md` (run at `setup/Inspection`/`2f24a7b`) gives CD-028 **CONDITIONAL PASS for queue scope** — scan-first queue, explicit `startReview`, RLS-joined readiness facts, and no decision controls in the queue are confirmed wired by a reviewer independent of this implementation. The later discoverability/race follow-up is also independently exercised by the current focused rerun (CD-028 **4/4** including auth setup) and the fresh golden journey (9/9); the remaining unique-index live-application boundary is recorded separately.
- **Follow-up fix:** a fresh-context adversarial subagent review found `reviews_read` RLS (`0002_rbac_audit.sql:71-73`) omitted the `reviewer` role from its broad-access grant, and that no `reviews` row is created at inspection-submit time. Fixed: migration `20260715120000_cd028_reviewer_read_fix.sql` (applied live by sponsor) + the submitted-inspection discovery query in `reviews/page.tsx` + migration `20260715130000_cd028_one_open_review_per_version.sql` (partial unique index; live application remains pending) + `startReview`'s clear unique-violation response. The unique-index migration is drafted but **not yet applied live** (pending sponsor SQL Editor run, same non-interactive-auth constraint as the read-fix).
- Reopen rule: demonstrated P0/P1 regression, a11y/security failure, protected-behavior break, or recorded release blocker only.

## CD-031 / SCR-WEB-400 / P12 — Factory 360 provenance-led dossier — 2026-07-15

- **Status: IMPLEMENTED, INDEPENDENT CODEX AUDIT RECORDED, BLOCKED UPSTREAM. NOT CLOSED.** Sponsor explicitly overrode two stops in-chat, recorded as DEC-014: (1) CD-031 sits outside TASK-BASELINE-WIRING-AUDIT-001's authorized slice; (2) the design package (`outputs/cd-031-r3/`, project `20cb0dce-94f1-4423-b923-00d6fd0d2c24`) is itself marked `implementation_authorized:false` / DO-NOT-EXECUTE / BASELINE_REVERIFY_REQUIRED. Verified before implementing: no risk-driver/coordinate-conflict/boundary-polygon columns exist in this repo's migrations — the design's HANDOFF_BLOCKED premises hold against the actual schema, not just its stale claimed baseline.
- Restructured the existing 7-tab `/factories/[id]` dossier into a two-column provenance-led layout: sticky aside (identity, source/freshness, risk summary, location/geofence facts) + main column with a sticky section strip (`.cd-secitem`, plain anchor links, ≥48×48px) and the **Spatial Case Timeline** signature — a source-labelled, list-equivalent (`<ol>`), keyboard-operable narrative built only from already-fetched visit/inspection/violation/action/review data.
- **HANDOFF_BLOCKED, none fabricated:** risk-driver breakdown/recalculation, risk-version history (only current `risk_version` is ever read), evidence timeline (no evidence query on this route), map/boundary/coordinate-conflict (no provider or polygon), document preview (metadata + `storage_path` only, no signed URL/viewer). Each renders an explicit unavailable line, never omitted or coerced into "none".
- **HANDOFF_BLOCKED_ROLE:** representative contact fields (phone/email) are masked with an explicit `cd-masked` notice only when the current user's roles are exactly `["leadership"]` — the one persona the design's own research/handoff text ties to unproven contact privacy. Every other role sees contact fields unchanged.
- **No invented staleness threshold:** source + `source_synced_at` are always shown as a plain fact; no computed "stale" rule was added, matching the state matrix's own "no invented staleness threshold" note.
- Preserved unchanged: every existing query shape, per-section error isolation (`dErr`/`rErr`/`pErr`/`mErr` stay independent banners, never a whole-record failure), all `AddDocumentForm`/`AddRepresentativeForm`/`AddProductForm`/`AddMaterialForm`/`ToggleRepActive` controls and their RLS-restricted (0017) server actions, the not-found-on-RLS-null access boundary, and the frozen shared shell.
- Verified: `tsc --noEmit` 0 errors; `next build` 0 errors, 2 pre-existing warnings unrelated to this change; new `apps/web/e2e/cd-031-factory-360.spec.ts` **15/15 PASS** (6 source-truth + 6 live planner-persona + 1 loading-state + Arabic/RTL). Full no-exclusion regression: **178 PASS / 4 FAIL / 3 skipped** — all 4 failures are in files this change never touched (`cd-004-admin-control-plane-home.spec.ts` Arabic spine caption on `/admin`, `cd-025-plan-review-publish.spec.ts` Arabic RTL on `/planning/bulk/review`, `dashboard-kpi-seed.spec.ts`, `golden-journey.spec.ts` P5 review-approve timing). Re-running each in isolation: `cd-025` and its RTL case passed cleanly (flaky under full-suite load); `cd-004`'s Arabic spine-caption case failed the same way in isolation too, on a page this change does not modify — a pre-existing gap, not a regression; `golden-journey` P5's start-review→approve race matches the already-documented CD-028/CD-029 review-claim timing history in this repo. None reference `astryx.css`, `factories/[id]/*`, or the new CD-031 spec.
- **DEC-012 status:** **BLOCKED_UPSTREAM.** The independent Codex audit is recorded in `../evidence/CODEX_AUDIT_CD-031_2026-07-15.md`, but the authoritative `WIRING_MAP_CD-031.csv` is absent from the checkout, so a row-level certification cannot be issued. The raw provider/database error exposure found by the audit is remediated with server-side logging plus neutral user copy and reverified by typecheck/build and CD-031 15/15; the leadership contact-privacy decision and design-package preflight remain unresolved. CD-031 remains `IMPLEMENTED_CODEX_AUDIT_BLOCKED_UPSTREAM`, not sponsor-runtime-accepted.
- No commit, push, merge, deploy, or `main` modification occurred.

### CD-041 verified-transition live gate — 2026-07-15

CD-041's verified-transition gate is now **LIVE-VERIFIED**. The server action
calls the versioned `vs_mark_session_verified` RPC, and the focused source,
RBAC-negative, closed-session and driven live checks pass. The earlier
`PGRST202` missing-function finding is closed by the current shared schema. The
deterministic fixture-window collision is also fixed. Evidence:
`evidence/CODEX_AUDIT_CD041_LIVE_GATE_2026-07-15.md`.
### M02 republish notification follow-up — 2026-07-15

AC-0061 / MVP1-M02-009 and AC-0082 / MVP1-M02-030 are implemented in the
current working tree. Republish now queues the assigned-inspector notification
through the shared adapter and surfaces queue failure without claiming delivery.
Focused CD-027 source checks pass 5/5; the historical partial rows are reconciled
in `evidence/AC_LEDGER.csv`.

### Field-handoff wiring follow-up — 2026-07-15

MVP1-M03-005, M03-006, M04-050..054 and M04-056..058 are implemented and
source-verified in `evidence/CODEX_AUDIT_FIELD_HANDOFF_REMEDIATION_2026-07-15.md`.
M04-045 has the capture/outbox code and a forward migration draft, but remains
partial until live migration and replay verification are complete.

Arrival completion is fail-closed on the immutable arrival-event insert, and
the inspection workspace now reads additive visit-linked evidence after an
inspection is created. Focused CD-023 field-handoff checks are 7/7 PASS; the
live migration/replay boundary remains explicitly open.

## CD-043 / SCR-VIR-720 disposition — 2026-07-15

- Slice: TASK-BASELINE-WIRING-AUDIT-001 · CD-043 · SCR-VIR-720 · P06B (provider-neutral virtual inspection session boundary, inspector-operated, `/virtual/:id`).
- Status: **ACCEPTED** (sponsor-directed, 2026-07-15).
- Scope delivered: **S12** closed/read-only immutable affordance; **S15** offline (begin/reschedule/close disabled, nothing queued, no reconnection promised); **S13** stale/concurrent optimistic-concurrency rev token (`state:timelineLength`) refused before any write in begin/close/reschedule; **S08** loading skeleton; **S20** route reconciliation (catalogue → canonical `/virtual/:id`). Proven boundary (`beginRemote`/`closeSession`/CD-042 gate/bounded provider-pending room) preserved; no policy invented.
- DEC-012: **satisfied** — independent adversarial wiring audit (`evidence/CD-043_DEC-012_INDEPENDENT_WIRING_AUDIT_2026-07-15.md`), verdict ACCEPT-WITH-FIXES; Finding 1 (reschedule STM-VIR TOCTOU) fixed with a state CAS; Finding 2 (e2e) closed.
- Runtime evidence: `cd-043-virtual-boundary-states.spec.ts` **6 passed** (persona setup + S12/S13/S15) against the configured live project over the production build; S13 asserts the concurrent-change close never lands (`state != closed` on re-read). `evidence/CD-043_D2L_WIRING_CLOSURE_2026-07-15.md`.
- Blocked seams remain surfaced-only and out of scope: provider adapter/selection, remote evidence capture, media custody, embedded live continuity preview, physical follow-up write, close state-vs-notification distinction.
- Reopen rule: demonstrated P0/P1 regression, security/accessibility failure, protected-behavior break, or approved change control only.
- Commits on `feat/admin-control-plane`: `81ba156` → `503a56c` → `b4061cc`.

### G11 remaining-requirements closure — M09 slice (2026-07-16)

`AC-0449`, `AC-0453`, `AC-0466`, `AC-0469`, `AC-0470` and `AC-0472` now have
complete governed authoring/runtime paths and a focused production-browser
inventory of **49/49 PASS**. The previous THIN findings predated the
CD-006..CD-011 backend/frontend completion and are superseded. Evidence:
`evidence/TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001.md`.
## MVP2 M2-05 Audit Replay — 2026-07-17

- Scope: `MVP2-AC-0137..0172` (36 rows), task `TASK-MVP2-M2-05-AUDIT-REPLAY-001`.
- Local implementation contract: **36/36 mapped**, with source-available rows
  implemented and provider/policy/MVP3 rows retained as `MISSING`, `PARTIAL` or
  `NEEDS_CONTRACT` in `product-contract/mvp2/m2-05/REQUIREMENT_WIRING_MAP.csv`.
- Local verification: typecheck PASS; production build PASS; M2-05 contract
  suite 9/9 PASS; static regression inventory 12/12 PASS.
- Runtime acceptance: **0/36 upgraded to PASS in the MVP2 workbook**. Fresh DB,
  RLS, authenticated UI, responsive/RTL browser and full regression execution
  remain unrun/blocked; no row is upgraded by source inspection alone.
- Independent source audit: **PASS after remediation**, with no remaining
  implementation P0/P1; this is not substituted for any runtime acceptance row.
