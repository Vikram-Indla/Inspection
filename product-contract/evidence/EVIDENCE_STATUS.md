# Evidence Status

## TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001 — 2026-07-16

| ID | Item | File | Status |
|---|---|---|---|
| G11-RR-EV-001 | All 19 row source/live/runtime/negative reconciliation | `TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001.md` | Captured — PASS; 493 rows, 0 partial, 0 missing |
| G11-RR-EV-002 | Machine-generated acceptance ledger and summary | `AC_LEDGER.csv`; `AC_LEDGER_SUMMARY.md` | Captured — 18 verified_live / 475 implemented |
| G11-RR-EV-003 | Live arrival, device, private evidence, storage and audit replay | `TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001.md` | Captured — PASS; ordinary inspector/RLS path |
| G11-RR-EV-004 | Outside-geofence reason/coordinates/override negative replay | `TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001.md` | Captured — PASS; 1,112m outside 150m fence |
| G11-RR-EV-005 | Typecheck, production build and complete browser inventory | `TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001.md` | Captured — 283 pass / 3 intentional skips / 0 product failures |

## CD-006 through CD-011 backend completion — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD006-011-BE-EV-001 | Requirement reconciliation, implementation, security boundaries, test results, live boundary and frontend handoff | `CD006_CD011_BACKEND_COMPLETION_2026-07-15.md` | Superseded by G11-RR-EV-001 — live migration and authenticated verification complete |

G4 evidence: **CAPTURED** — 2026-07-11 (branch `setup/g4-memory-continuity`).

| ID | Item | File | Status |
|---|---|---|---|
| G4-EV-001 | Repository tree | G4-EV-001-overlay-tree.txt | Captured |
| G4-EV-002 | Git baseline commit | G4-EV-002-git-log.txt | Captured |
| G4-EV-003 | Obsidian vault | G4-EV-003-obsidian-vault.md | Captured (structure); `.png` non-blocking |
| G4-EV-004 | `/memory` loaded-file evidence | G4-EV-004-claude-memory.txt | Captured |
| G4-EV-005 | SessionStart context | G4-EV-005-session-start-hook.txt | Captured |
| G4-EV-006 | PreToolUse denial | G4-EV-006-pretool-guard.txt | Captured |
| G4-EV-007 | Fresh-session resume | G4-EV-007-resume-test.txt | Captured |
| — | Validation suite | G4-VALIDATION-SUITE.txt | Captured |

Non-blocking post-check owner = human: `G4-EV-003-obsidian-vault.png` under
`evidence/attachments/`.

## CD-001 V7 public-safe atlas — 2026-07-13

| ID | Item | File | Status |
|---|---|---|---|
| CD001-V7-EV-001 | Implementation, build and runtime regression | `CD001-V7-EV-001-public-safe-atlas.txt` | Captured — P0 PASS |
| CD001-V7-EV-002 | Dark/light, EN/AR, desktop/laptop/mobile runtime frames | `screens/login-v7-atlas/` | Captured |
| CD001-V7-EV-003 | Asset hashes, formats and rights state | `../../design/claude-design-mvp1/acceptance/SAUDI_ATLAS_ASSET_REGISTER_CD001.csv` | Captured — rights P1 pending |
| CD001-V7-EV-004 | Public geographic anchor register | `../../design/claude-design-mvp1/acceptance/SAUDI_ATLAS_REFERENCE_REGISTER_CD001.csv` | Captured — official verification P1 pending |
| CD001-V7-EV-005 | Sponsor lifecycle-rail correction and runtime proof | `CD001-V7-EV-005-lifecycle-rail.txt` | Captured — PASS |
| CD001-V7-EV-006 | Sponsor UX-003 stage/light-mode/favicon correction | `CD001-V7-EV-006-stage-theme-prism.txt` | Captured — PASS |
| CD001-V7-EV-007 | Arabic-first login, desktop/mobile RTL and map-label proof | `CD001-V7-EV-007-arabic-rtl.txt` | Captured — PASS; Arabic-only raster P1 pending |
| CD001-V7-EV-008 | Sponsor design closure and exact continuation handoff | `CD001-V7-EV-008-design-closure-handoff.txt` | Captured — CD-001 accepted for now |

## TASK-WEB-SHELL-001 — 2026-07-13

| ID | Item | File | Status |
|---|---|---|---|
| SHELL-EV-001 | Implementation and automated verification record | `TASK-WEB-SHELL-001-EV-001.txt` | Captured — typecheck/build PASS; targeted 10/10; complete regression 41/41; sponsor accepted |
| SHELL-EV-002 | Expanded desktop dark shell | `screens/shell-v1/planner-desktop-en-dark.png` | Captured and visually reviewed |
| SHELL-EV-003 | Collapsed desktop dark shell | `screens/shell-v1/planner-desktop-en-collapsed.png` | Captured and visually reviewed |
| SHELL-EV-004 | Arabic RTL light mobile drawer | `screens/shell-v1/planner-mobile-ar-light-drawer.png` | Captured and visually reviewed after RTL defect correction |
| SHELL-EV-005 | V3 43-screen approval pack verification | `../../outputs/claude-design-approval-pack/VERIFICATION_REPORT_V3.json` | Captured — 11 sheets; 43 prompts; 22 tabs; 0 formula errors |

## TASK-DASH-KPI-SEED-001 — 2026-07-13

| ID | Item | File | Status |
|---|---|---|---|
| KPI-SEED-EV-001 | Fixture manifest, idempotence, RLS posture and automated verification | `TASK-DASH-KPI-SEED-001-EV-001.txt` | Captured — PASS; repeat insert count 0; focused 6/6; regression 44/44 |
| KPI-SEED-EV-002 | Region/city-scoped SCR-WEB-500 dashboard | `screens/dashboard-kpi-seed/operations-scoped-en-light.png` | Captured and visually reviewed |
| KPI-SEED-EV-003 | Live Operations map consuming the fixture region/active visits | `screens/dashboard-kpi-seed/live-operations-en-light.png` | Captured and visually reviewed |

## TASK-WEB-DASHBOARD-002 — 2026-07-13

| ID | Item | File | Status |
|---|---|---|---|
| DASH-EV-001 | Implementation, data/security posture and automated verification | `TASK-WEB-DASHBOARD-002-EV-001.txt` | Captured — typecheck/build PASS; focused 16/16; regression 50/50 |
| DASH-EV-002 | DASH-001..016 and AC-0430..0448 closure matrix | `TASK-WEB-DASHBOARD-002-REQUIREMENT-MATRIX.md` | Captured — all visible legs pass or have a truthful unavailable boundary |
| DASH-EV-003 | Strategic English dark desktop | `screens/dashboard-business-v1/strategic-en-dark-desktop.png` | Captured and visually reviewed |
| DASH-EV-004 | Strategic English light desktop | `screens/dashboard-business-v1/strategic-en-light-desktop.png` | Captured and visually reviewed |
| DASH-EV-005 | Operational English dark desktop | `screens/dashboard-business-v1/operational-en-dark-desktop.png` | Captured and visually reviewed |
| DASH-EV-006 | Strategic Arabic RTL mobile | `screens/dashboard-business-v1/strategic-ar-mobile.png` | Captured and visually reviewed |

## CD-025 R3 review and CD-026 prompt — 2026-07-14

| ID | Item | File | Status |
|---|---|---|---|
| CD025-R3-EV-001 | P0/P1 review of `Plan Review and Publish (1).zip` | `../../outputs/claude-design-approval-pack/CD-025_DESIGN_REVIEW_R3.md` | Captured — P0 none; four P1; archive BLOCKED |
| CD025-R4-EV-001 | Focused package-synchronization correction prompt | `../../outputs/claude-design-approval-pack/CD-025_PROGRESSIVE_CORRECTION_PROMPT_R3.md` | Prepared — awaiting Claude Design R4 resubmission |

## CD-026 / SCR-WEB-200 Visit Management Workspace — Track 1 — 2026-07-14

Sponsor override recorded (Vikram Indla, "Track 1 now"). DEC-012 independent audit + sponsor runtime acceptance still outstanding.

| ID | Item | File | Status |
|---|---|---|---|
| CD026-EV-001 | Track 1 e2e suite (spine/eligibility/Map-unavailable/RTL/overflow + 3 code-layer wiring proofs) | `apps/web/e2e/cd-026-visit-management.spec.ts` | Captured — CD-026 spec 11/11 PASS; typecheck+build PASS; persona-tours+shell-navigation regression 17/17 |
| CD026-EV-002 | Primary workspace (EN dark desktop) — spine, KPI tiles, lens switcher with disabled Map, RLS scope | `screens/cd-026-visit-management-v1/primary.png` | Captured and visually reviewed |
| CD026-EV-003 | Bulk eligibility preview (verified-now / rechecked-at-submit) | `screens/cd-026-visit-management-v1/eligibility-preview.png` | Captured |
| CD026-EV-004 | Arabic document-level RTL with live `ui_strings` copy (not EN fallback) | `screens/cd-026-visit-management-v1/ar-rtl.png` | Captured — 52/52 AR keys live; asserted rendering |
| CD026-EV-005 | Narrow 412 — no horizontal overflow | `screens/cd-026-visit-management-v1/narrow-412.png` | Captured |
| CD026-EV-006 | AR seed migration + app-wide `getDict` 1000-row truncation fix | `../../supabase/migrations/20260714100000_cd026_ar_strings.sql` · `apps/web/src/lib/i18n.ts` | Applied live (guarded upsert) + paginated fetch; cd-025+shell-navigation regression 19/19 |
| CD026-EV-001 | Complete fresh-session Claude Design prompt | `../../outputs/claude-design-approval-pack/CD-026_CLAUDE_DESIGN_END_TO_END_R1_FRESH_SESSION_PROMPT.md` | Prepared — design not yet generated or approved |

## CD-027 / SCR-WEB-210 Visit Detail — Track 1 + safe Track 2 — 2026-07-14

Sponsor approval recorded (Vikram Indla, 2026-07-14): Track 1 + audit-first. DEC-012 independent Codex re-audit + sponsor runtime acceptance still outstanding.

| ID | Item | File | Status |
|---|---|---|---|
| CD027-EV-001 | Recorded 14-leg wiring audit + Track 2 closure log (DEC-012) | `../../outputs/claude-design-approval-pack/CD-027_WIRING_AUDIT_R1.md` | Captured — all 14 legs wired; ERRORMAP/ORPHAN/NOTIFY_PREV closed; MAP/ASSIGNMENT_RELEASE/ATOMIC held blocked |
| CD027-EV-002 | Track 1 + Track 2 e2e suite (ribbon tablist/APG keys/narrow reflow/action zones + 9 code-layer wiring proofs) | `../../apps/web/e2e/cd-027-visit-detail.spec.ts` | Captured — CD-027 spec 16/16 PASS on local production build; typecheck+build PASS |
| CD027-EV-003 | Dual-State Ribbon primary (planner, EN) — five never-collapsed domain tracks + tabpanel | `screens/cd-027-visit-detail-v1/ribbon-primary.png` | Captured |
| CD027-EV-004 | Narrow 412 — ribbon reflows to ordered accessible state ledger (S36) | `screens/cd-027-visit-detail-v1/ribbon-narrow-412.png` | Captured |
| CD027-EV-005 | DSG-A11Y-001 — keyboard `tablist` (roving tabindex, Arrow/Home/End), glyph+label status, role=status/alert | `../../apps/web/src/app/visits/[id]/DualStateRibbon.tsx` · `ActionBar.tsx` | Proven at runtime (spec tests 1–2, 4) + code layer |
| CD027-EV-006 | ERRORMAP neutral mapping helper (no raw provider text) | `../../apps/web/src/app/visits/[id]/neutral.ts` | Captured — applied across page.tsx + actions.ts |

## CD-004 Admin Control Plane Home (SCR-ADM-001) — 2026-07-15

Merged to `setup/Inspection` via PR #12 (commit `5f9a676`). Acceptance: DSG-A11Y-001,
DSG-CODE-001, CD004-QG-01..08, ADM-QG-01..18. Requirements: MVP1-M09-001..030 (gateway),
RBAC-001..006, FND-003. Wiring audit: `../../outputs/cd-004/CD-004_WIRING_AUDIT.md` (DEC-012).

| ID | Item | File | Status |
|---|---|---|---|
| CD004-EV-001 | Compile: `tsc --noEmit` + `next build` (`/admin` dynamic) | `../../outputs/cd-004/CD-004_WIRING_AUDIT.md` | Captured — PASS |
| CD004-EV-002 | Code-layer wiring self-check (per-source modelling, distinct verified-zero/unavailable, blocked legs, real routes, guarded migration) | `../../apps/web/e2e/cd-004-admin-control-plane-home.spec.ts` (DEC-012 block) | Captured — 25/25 PASS |
| CD004-EV-003 | Runtime e2e: populated spine, glyph+word states, action links, link-only band, scope band, heading hierarchy, 44px targets; Arabic RTL + dark/light × 1440/1024 screenshots | `screens/cd-004-admin-home-v1/` | Captured — **17/17 PASS** with live guarded Arabic seed applied via `20260715090000_cd004_ar_strings.sql` |
| CD004-EV-004 | Per-source **failure** / **verified-zero** runtime frames | — | **OPEN** — design-pack fixtures; not safely forcible against live data (proven at code layer in CD004-EV-002) |
| CD004-EV-005 | Populated **act-scope** band | `screens/cd-004-admin-home-v1/` | **OPEN** — needs a seeded admin persona (only planner/inspector/reviewer exist) |

Owner: CD004-EV-003 is closed. CD004-EV-004..005 remain open because failure/verified-zero and act-scope fixtures require an authoritative admin persona/data disposition.

## Independent Codex wiring audit CD-022..CD-029 — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CODEX-WIRE-EV-001 | Independent current-branch wiring audit with per-screen verdicts, dependency chain, training disposition and blockers | `CODEX_AUDIT_CD-022_TO_CD-029_2026-07-15.md` | Captured — CD-022 PASS; CD-023 PASS; CD-024 BLOCKED; CD-025 CONDITIONAL PASS (staged subset); CD-026 CONDITIONAL PASS (Track 1); CD-027 CONDITIONAL PASS (implemented tracks); CD-028 CONDITIONAL PASS (queue scope); CD-029 BLOCKED |
| CODEX-WIRE-EV-002 | Independent build and focused runtime evidence | `apps/web/e2e/cd-022-identity-lens.spec.ts`, `cd-023-immediate-authority-bar.spec.ts`, `cd-025-plan-review-publish.spec.ts`, `cd-026-visit-management.spec.ts`, `cd-027-visit-detail.spec.ts`, `cd-028-review-queue.spec.ts` | Historical audit evidence captured — 67/67 at audit time; current remediation evidence is in the rollup below |
| CODEX-WIRE-EV-003 | CD-029 implementation authorization boundary and focused runtime suite | `../../outputs/cd-029/IMPLEMENTATION_MANIFEST_CD-029.yaml`; `../../apps/web/e2e/cd-029-review-workspace.spec.ts` | Captured — `implementation_authorized: false`; CD-029 focused suite 10/10; overall handoff boundaries remain blocked |

## CD-029 focused independent audit — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD029-CODEX-EV-001 | 18-leg current-source wiring audit, remediation closure and remaining handoff boundaries | `CODEX_AUDIT_CD-029_2026-07-15.md` | Captured — four P1 defects remediated; responsive leg 18 additionally verified; overall **BLOCKED** only on unauthorized/intentional handoff boundaries |
| CD029-CODEX-EV-002 | Current build and dependency regressions | `apps/web/e2e/cd-028-review-queue.spec.ts`; `apps/web/e2e/cd-029-review-workspace.spec.ts`; `apps/web/e2e/cd-030-version-comparison.spec.ts` | Captured — typecheck/build PASS; combined CD-028/CD-029/CD-030 **31 PASS / 1 skip**; focused responsive leg **4/4 PASS** and CD-030 navigation/source checks **5 PASS / 1 skip** |
| CD029-CODEX-EV-003 | Full downstream golden journey on exact dirty state | `apps/web/e2e/golden-journey.spec.ts` | **OPEN** — upstream CD-022 publish timeout caused 1 failure; downstream review steps did not run |

## CD-022 duplicate-status follow-up — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD022-CODEX-EV-004 | Duplicate warning now exposes visit ID, lifecycle status and deep link | `apps/web/e2e/cd-022-identity-lens.spec.ts`; `outputs/cd-022/WIRING_MAP_CD-022.csv`; `evidence/screens/single-v2/CODEX_AUDIT_CD-022_REMEDIATION_VERIFICATION.md` | Captured — typecheck/build PASS; live CD-022 suite **13/13 PASS** |

## Independent Codex remediation rollup — CD-021 through CD-030 — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CODEX-REMED-EV-001 | Cross-slice remediation rollup and remaining policy/provider boundaries | `CODEX_AUDIT_CD-021_TO_CD-030_REMEDIATION_2026-07-15.md` | Captured — safe audit findings closed; explicit upstream/release boundaries remain |
| CODEX-REMED-EV-002 | CD-021/CD-026 focused continuation verification | `../../apps/web/e2e/cd-021-bulk-targeting.spec.ts`; `../../apps/web/e2e/cd-026-visit-management.spec.ts` | Captured — **32/32 PASS** (29 product + 3 auth setup) |
| CODEX-REMED-EV-003 | CD-026 expiry-refresh observability closure | `../../apps/web/src/app/visits/page.tsx`; `../../apps/web/src/app/visits/calendar/page.tsx`; `../../apps/web/src/app/visits/workload/page.tsx` | Captured — failures logged server-side; rendered-state contract preserved |

## CD-031 Factory 360 dossier implementation — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD031-EV-001 | Two-column provenance-led dossier restructure (astryx.css + page.tsx + loading.tsx) | `../../apps/web/src/app/astryx.css`; `../../apps/web/src/app/factories/[id]/page.tsx`; `../../apps/web/src/app/factories/[id]/loading.tsx` | Captured — typecheck clean, production build clean (0 errors) |
| CD031-EV-002 | New focused e2e suite — source-truth HANDOFF_BLOCKED discipline + live planner persona + Arabic/RTL | `../../apps/web/e2e/cd-031-factory-360.spec.ts` | Captured — **15/15 PASS** |
| CD031-EV-003 | Sponsor override of task-slice scope and design-package DO-NOT-EXECUTE gate | `../governance/decision_register.csv` (DEC-014) | Captured — resolved in-chat 2026-07-15 (Vikram Indla) |
| CD031-EV-004 | Independent Codex wiring audit against WIRING_MAP_CD-031.csv (18 legs + 4b/4c) | `CODEX_AUDIT_CD-031_2026-07-15.md` | **BLOCKED_UPSTREAM** — authoritative map absent; raw-error finding remediated and reverified, supplemental leg review recorded, DEC-012 certification withheld |

## CD-030 Version Comparison remediation — 2026-07-15

| CD030-CODEX-EV-004 | NF-1/R3 remediation: role-aligned submission read scope, not-found/degraded distinction, localized stale banner, returned-scope JSON shape guard | `CODEX_AUDIT_CD-030_REMEDIATION_2026-07-15.md` | Captured — typecheck/build PASS; focused suite **16 passed / 1 data-dependent skip**; live migration application blocked by unavailable Management API credentials |

## Cross-cutting neutral-error sweep — 2026-07-15

| CODEX-NEUTRAL-EV-001 | Admin, Operations, Factory Registry/360, Inspection Report, notification, field/offline, and virtual-session raw-provider-error paths | `CODEX_AUDIT_NEUTRAL_ERROR_SWEEP_2026-07-15.md` | Captured — typecheck/build PASS; expanded neutral sweep + admin/dashboard regression **25/25 PASS**; delivered surfaces render neutral copy and retain diagnostics server-side |

## Auth-safe error and offline-state remediation — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CODEX-AUTH-OFFLINE-EV-001 | Empty-session authentication denial and stale offline replay-state guard | `CODEX_AUDIT_AUTH_OFFLINE_REMEDIATION_2026-07-15.md` | Captured — typecheck/build PASS; focused auth-negative + offline drill **7/7 PASS** |

## Virtual-session neutral error follow-up — 2026-07-15

| CODEX-NEUTRAL-EV-002 | Timeline/notification provider failures no longer leak through virtual-session success messages | `CODEX_AUDIT_NEUTRAL_ERROR_SWEEP_2026-07-15.md` | Captured — typecheck/build PASS; focused virtual + CD-027 + CD-023 regression **33/33 PASS** |

## Full regression reconciliation and final runtime hardening — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CODEX-FULL-REG-EV-001 | CD-031 nullable identity placeholders, KPI fixture refresh, virtual-room string contract, and affected-suite reconciliation | `CODEX_AUDIT_FULL_REGRESSION_RECONCILIATION_2026-07-15.md` | Captured — typecheck/build PASS; golden **9/9**, affected CD-027/CD-030 **26/26** (1 skip), final CD-031/KPI **18/18** |

## CD-030 NEW-1 access-regression fix — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD030-NEW1-EV-001 | Independent audit finding: page-level gate on `/reviews/:id` blocked auditor/planner/leadership despite RLS (`inspections_read`/`subs_read`/`reviews_read`) and the CD-030 design scope ("P11 · Reviewer/Auditor") granting them read | `CODEX_AUDIT_CD-030_2026-07-15_R2.md` (finding NEW-1) | Captured — flagged via cross-session message, independently re-verified against `0002_rbac_audit.sql:39-40,65-66,71-73` and `screen_route_catalogue.csv:26` before fixing |
| CD030-NEW1-EV-002 | Fix: `authorized` broadened to `reviewer/ops/auditor/planner/leadership` (view); new `canDecide` (`reviewer/ops` only) gates `DecisionPanel`/`StartReview`; a `{role} · read-only` lozenge renders for non-deciding viewers | `../../apps/web/src/app/reviews/[id]/page.tsx` | Captured — restores the accepted RLS/design-scoped read permission without widening who can submit a decision |
| CD030-NEW1-EV-003 | Regression check on the same fix | `../../apps/web/e2e/cd-030-version-comparison.spec.ts`; `cd-029-review-workspace.spec.ts`; `cd-028-review-queue.spec.ts` | Captured — typecheck/build clean; 30/31 PASS, 1 skip; the single failure (`cd-028` leg 5) is a pre-existing shared-live-data ordering fragility (the queue's first open workspace had already been advanced to `under_review` by earlier same-day test runs), reproduced identically regardless of this fix, not a new defect |

## G11 remaining-requirements closure — M09 slice (2026-07-16)

| ID | Scope | Evidence | Status |
|---|---|---|---|
| G11-R19-M09-EV-001 | M09-001/005/018/021/022/024 source, backend, runtime, RLS, audit, RTL and degraded-state reconciliation | `TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001.md`; focused M09 production-browser inventory | Captured — 49/49 PASS; six historical partial rows superseded to implemented |
