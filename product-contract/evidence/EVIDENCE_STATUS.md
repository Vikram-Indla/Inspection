# Evidence Status

## TASK-G11-G12-RELEASE-001 — 2026-07-16

| ID | Item | File | Status |
|---|---|---|---|
| G11-G12-REL-EV-001 | Release provenance, defect iterations, exact verification and blocker disposition | `TASK-G11-G12-RELEASE-001.md` | Captured — authorized subset complete; G11/G12 remain open |
| G11-G12-REL-EV-002 | Exact production-candidate inventory | `../../apps/web/e2e/`; `../../apps/web/playwright.config.ts` | Captured — **291/291 PASS**: 4 setup + 287 application; 0 failed/skipped/excluded |
| G11-G12-REL-EV-003 | M04-045 arrival offline replay/readback | `../../apps/web/e2e/golden-journey.spec.ts`; `../../supabase/migrations/20260715193000_field_arrival_evidence_column_repair.sql` | Captured — visit-linked before inspection, exact note persisted; no DDL replay because live object already existed |
| G11-G12-REL-EV-004 | CD-028 one-open-review live negative | `../../supabase/tests/0028_cd028_live_release_probe.sql` | Captured — second open review rejected by exact index; transaction rolled back |
| G11-G12-REL-EV-005 | RTL 412 px release defect repair | `../../apps/web/src/app/reviews/[id]/VersionCompare.tsx`; `../../apps/web/src/app/astryx.css` | Captured — focused PASS and affected shard **25/25 PASS** |
| G11-G12-REL-EV-006 | Production bundle secret/artifact scan | `../../apps/web/.next/`; `../../.gitignore` | Captured — 379 files; 0 demo-password/database-URL/PAT/secret/non-public-JWT hits; historical rotation remains open |
| G11-G12-REL-EV-007 | Acceptance/audit reconciliation | `AC_LEDGER.csv`; `AC_LEDGER_SUMMARY.md`; `validate_audit_reconciliation.py` | Captured — 493 = 15 verified_live / 460 implemented / 18 partial / 0 missing |
| G11-G12-REL-EV-008 | Production deployment target discovery | repository and connected environment | BLOCKED — no configured hosting/deployment/rollback target; no provider invented |

## CD-031 R3 Factory 360 reconciliation — 2026-07-16

| ID | Item | File | Status |
|---|---|---|---|
| CD031-R3-EV-001 | Exact R3 authority package and row-level DEC-012 audit | `../../outputs/cd-031-r3/`; `CODEX_AUDIT_CD-031_R3_2026-07-16.md` | Captured — package hashes verified; wiring verdict **PASS**; slice remains upstream-blocked |
| CD031-R3-EV-002 | Factory 360 canonical append-only audit correction | `../../supabase/migrations/20260716120000_cd031_factory360_audit.sql` | Captured — four canonical triggers live-verified; hardened repeat is idempotent and rejects conflicting same-name definitions |
| CD031-R3-EV-003 | Local rollback database contract | `../../supabase/tests/0031_cd031_factory360_contract.sql` | Captured — four Planner writes + activation + five audit rows; Inspector writes denied; rollback PASS |
| CD031-R3-EV-004 | Authenticated live rollback probe | `../../supabase/tests/0031_cd031_live_release_probe.sql` | Captured — same positive/negative/audit contract PASS; rollback; zero residual rows |
| CD031-R3-EV-005 | Focused responsive/runtime regression | `../../apps/web/e2e/cd-031-factory-360.spec.ts` | Captured — **18/18 PASS** across source, live Planner, RTL, theme and 1440/1024/412 widths |
| CD031-R3-EV-006 | Complete rebuilt continuation inventory | `../../apps/web/e2e/`; `../../apps/web/playwright.config.ts` | Captured — **293/293 PASS**: 4 setup + 289 application in 12 shards; 0 failed/skipped/excluded |

## CD-006 through CD-011 backend completion — 2026-07-15

2026-07-16 reconciliation: live object state and the integrated candidate are
verified under G11-G12-REL-EV-001/002. This historical record is retained; its
old migration-pending boundary is superseded, while the six M09 acceptance
audits remain open.

| ID | Item | File | Status |
|---|---|---|---|
| CD006-011-BE-EV-001 | Requirement reconciliation, implementation, security boundaries, test results, live boundary and frontend handoff | `CD006_CD011_BACKEND_COMPLETION_2026-07-15.md` | Captured — source complete; typecheck/build PASS; focused 7/7; live migration approval/application pending |

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

## TASK-G11-REMEDIATION-001 — 2026-07-16

| ID | Item | File | Status |
|---|---|---|---|
| G11-REMED-EV-001 | End-to-end remediation, defect and boundary record | `TASK-G11-REMEDIATION-001.md` | Captured — engineering exit PASS |
| G11-REMED-EV-002 | Current complete automated inventory | `../../apps/web/e2e/`; `../../apps/web/playwright/.auth/` | Captured — **276/276 PASS**: 3 setup + 273 application; 0 failed/skipped/excluded |
| G11-REMED-EV-003 | Compile and static safety | `../../apps/web/` | Captured — typecheck PASS; production build PASS; runtime `auth.getUser()` scan 0 matches |
| G11-REMED-EV-004 | Golden cross-persona journey | `../../apps/web/e2e/golden-journey.spec.ts` | Captured — 6/6 PASS inside final shard; return/correct/resubmit/approve and v1 immutability verified |
| G11-REMED-EV-005 | Acceptance-ledger non-inflation | `AC_LEDGER.csv`; `AC_LEDGER_SUMMARY.md`; `validate_audit_reconciliation.py` | Captured — 493 rows = 14 verified_live / 460 implemented / 19 partial; validator PASS |
| G11-REMED-EV-006 | Runtime visual matrices refreshed by final Playwright run | `screens/` | Captured in dirty worktree; attribution required before staging |

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

## CD-024 / SCR-WEB-140 staged handoff — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD024-CODEX-EV-001 | Scope-loss guard for client-held factory IDs at staged review handoff | `../../apps/web/src/app/planning/bulk/actions.ts`; `../../apps/web/src/app/planning/bulk/review/ReviewClient.tsx`; `../../apps/web/e2e/cd-021-bulk-targeting.spec.ts`; `../../outputs/cd-024/WIRING_MAP_CD-024.csv` | Captured — missing/out-of-scope IDs render a distinct scope-change state; focused subset 5/5 and complete CD-021 suite 24/24 PASS; canonical route/ownership remains BLOCKED_UPSTREAM |

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
| CD004-EV-002 | Code-layer wiring self-check (per-source modelling, distinct verified-zero/unavailable, blocked legs, real routes, guarded migration) | `../../apps/web/e2e/cd-004-admin-control-plane-home.spec.ts` (DEC-012 block); `../../outputs/cd-004/WIRING_MAP_CD-004_R2.csv` | Captured — 25/25 PASS; current wiring map parses as 21 rows × 20 columns |
| CD004-EV-003 | Runtime e2e: populated spine, glyph+word states, action links, link-only band, scope band, heading hierarchy, 44px targets; Arabic RTL + dark/light × 1440/1024 screenshots | `screens/cd-004-admin-home-v1/` | Captured — **18/18 PASS** with live guarded Arabic seed applied via `20260715090000_cd004_ar_strings.sql` |
| CD004-EV-004 | Per-source **failure** / **verified-zero** runtime frames | — | **BLOCKED_UPSTREAM** — design-pack fixtures cannot be safely forced against live data; code-layer proof is captured in CD004-EV-002 |
| CD004-EV-005 | Populated **act-scope** band | `screens/cd-004-admin-home-v1/scope-admin-en-light.png`; `../../apps/web/e2e/cd-004-admin-control-plane-home.spec.ts` | Captured — authoritative `admin@mim.gov.sa` persona renders a populated act-scope band; focused runtime check **4/4 PASS** including auth setup |

Owner: CD004-EV-003 and CD004-EV-005 are closed. CD004-EV-004 remains blocked because per-source failure/verified-zero fixtures cannot be safely forced against the live backend; code-layer proof is retained in CD004-EV-002.

## Independent Codex wiring audit CD-022..CD-029 — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CODEX-WIRE-EV-001 | Independent current-branch wiring audit with per-screen verdicts, dependency chain, training disposition and blockers | `CODEX_AUDIT_CD-022_TO_CD-029_2026-07-15.md` | Captured — CD-022 PASS; CD-023 PASS; CD-024 BLOCKED; CD-025 CONDITIONAL PASS (staged subset); CD-026 CONDITIONAL PASS (Track 1); CD-027 CONDITIONAL PASS (implemented tracks); CD-028 CONDITIONAL PASS (queue scope); CD-029 BLOCKED |
| CODEX-WIRE-EV-002 | Independent build and focused runtime evidence | `apps/web/e2e/cd-022-identity-lens.spec.ts`, `cd-023-immediate-authority-bar.spec.ts`, `cd-025-plan-review-publish.spec.ts`, `cd-026-visit-management.spec.ts`, `cd-027-visit-detail.spec.ts`, `cd-028-review-queue.spec.ts` | Historical audit evidence captured — 67/67 at audit time; current remediation evidence is in the rollup below |
| CODEX-WIRE-EV-003 | CD-029 implementation authorization boundary and focused runtime suite | `../../outputs/cd-029/IMPLEMENTATION_MANIFEST_CD-029.yaml`; `../../apps/web/e2e/cd-029-review-workspace.spec.ts` | Captured — `implementation_authorized: false`; CD-029 focused suite 10/10; overall handoff boundaries remain blocked |
| CODEX-WIRE-EV-004 | Independent re-verification of CD-028 post-audit discoverability/race changes | `apps/web/e2e/cd-028-review-queue.spec.ts`; `CODEX_AUDIT_CD-022_TO_CD-029_2026-07-15.md` | Captured — **13/13 PASS**, including submitted-without-review discoverability; queue remains conditional on claim/reassign and downstream atomicity |
| CODEX-WIRE-EV-005 | CD-028 follow-up discoverability/race regression and live-index boundary | `../../apps/web/e2e/cd-028-review-queue.spec.ts`; `../../supabase/migrations/20260715130000_cd028_one_open_review_per_version.sql`; `CODEX_AUDIT_CD-029_2026-07-15.md` | Captured — focused rerun **4/4 PASS** including auth setup; unique-index migration remains versioned but not live-applied |

## CD-029 focused independent audit — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD029-CODEX-EV-001 | 18-leg current-source wiring audit, remediation closure and remaining handoff boundaries | `CODEX_AUDIT_CD-029_2026-07-15.md` | Captured — four P1 defects remediated; responsive leg 18 additionally verified; overall **BLOCKED** only on unauthorized/intentional handoff boundaries |
| CD029-CODEX-EV-002 | Current build and dependency regressions | `apps/web/e2e/cd-028-review-queue.spec.ts`; `apps/web/e2e/cd-029-review-workspace.spec.ts`; `apps/web/e2e/cd-030-version-comparison.spec.ts` | Captured — typecheck/build PASS; combined CD-028/CD-029/CD-030 **31 PASS / 1 skip**; focused responsive leg **4/4 PASS** and CD-030 navigation/source checks **5 PASS / 1 skip** |
| CD029-CODEX-EV-003 | Full downstream golden journey on exact dirty state | `apps/web/e2e/golden-journey.spec.ts` | Captured — isolated fresh-server run **9/9 PASS**, including CD-022 publish and downstream review return/correct/resubmit/approve chain |
| CD029-CODEX-EV-004 | Review-action read failures fail closed; notification lookup failure is explicit; stored return authority is deterministically ordered | `../../apps/web/src/app/reviews/[id]/actions.ts`; `../../apps/web/src/app/reviews/[id]/page.tsx`; `../../apps/web/e2e/cd-029-review-workspace.spec.ts`; `../../apps/web/e2e/cd-030-version-comparison.spec.ts` | Captured — typecheck/build PASS; combined isolated CD-029/CD-030 rerun **26 passed / 1 data-dependent skip**; final targeted source-contract rerun **15/15 PASS** |

## CD-022 duplicate-status follow-up — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD022-CODEX-EV-004 | Duplicate warning now exposes visit ID, lifecycle status and deep link | `apps/web/e2e/cd-022-identity-lens.spec.ts`; `outputs/cd-022/WIRING_MAP_CD-022.csv`; `evidence/screens/single-v2/CODEX_AUDIT_CD-022_REMEDIATION_VERIFICATION.md` | Captured — typecheck/build PASS; live CD-022 suite **13/13 PASS** |

| CD021-CODEX-EV-004 | Mixed valid/blank criteria URL fails closed instead of silently narrowing | `apps/web/e2e/cd-021-bulk-targeting.spec.ts`; `outputs/cd-021/WIRING_MAP_CD-021.csv`; `evidence/screens/cd-021-bulk-v1/CODEX_AUDIT_CD-021_REMEDIATION_VERIFICATION.md` | Captured — typecheck/build PASS; live CD-021 suite **24/24 PASS**, including explicit out-of-scope staged-review state |

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

| CD030-CODEX-EV-004 | NF-1/R3 remediation: role-aligned submission read scope, not-found/degraded distinction, localized stale banner, returned-scope JSON shape guard | `CODEX_AUDIT_CD-030_REMEDIATION_2026-07-15.md` | Captured — typecheck/build PASS; focused suite **17 passed / 1 data-dependent skip**; live migration application blocked by unavailable Management API credentials |
| CD030-CODEX-EV-005 | Post-fix rerun after access-regression and scope-shape changes | `apps/web/e2e/cd-030-version-comparison.spec.ts`; `CODEX_AUDIT_CD-030_REMEDIATION_2026-07-15.md` | Captured — **17/17 PASS plus 1 data-dependent skip**; no new runtime regression |
| CD030-CODEX-EV-006 | Deterministic latest-return scope authority and fail-closed review reads | `../../apps/web/src/app/reviews/[id]/page.tsx`; `../../apps/web/src/app/reviews/[id]/actions.ts`; `../../apps/web/e2e/cd-030-version-comparison.spec.ts` | Captured — typecheck/build PASS; combined isolated CD-029/CD-030 rerun **26 passed / 1 data-dependent skip** |

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

| CODEX-M02-REPUBLISH-EV-001 | M02-009/M02-030 republish notification closure: shared notification path plus explicit queue-failure handling | `../../apps/web/src/app/visits/[id]/actions.ts`; `../../apps/web/e2e/cd-027-visit-detail.spec.ts`; `CODEX_AUDIT_FULL_REGRESSION_RECONCILIATION_2026-07-15.md` | Captured — typecheck/build PASS; focused CD-027 checks **5/5 PASS** |

| CODEX-FIELD-HANDOFF-EV-001 | M03-005/M03-006 and M04-050..054/M04-056..058 field startup wiring remediation; M04-045 arrival evidence draft | `CODEX_AUDIT_FIELD_HANDOFF_REMEDIATION_2026-07-15.md` | Captured — typecheck/build PASS; focused CD-023 field-handoff checks **7/7 PASS**; M04-045 live migration/replay remains pending |

| CODEX-REMAINING-PARTIALS-EV-001 | Requirement-by-requirement disposition of the remaining 19 AC ledger partials | `CODEX_AUDIT_REMAINING_PARTIALS_2026-07-15.md` | Captured — each row classified as blocked by provider, schema, policy, configuration scope, or pending live migration; no unsupported completion claim |

| CODEX-LEDGER-RECON-EV-001 | Regenerated AC ledger and storyboard totals after dated remediation/live closures | `generate_ac_ledger.py`, `AC_LEDGER_SUMMARY.md`, `STORYBOARD_STATUS.md` | Captured — 493 rows reconcile to 14 verified_live / 460 implemented / 19 partial / 0 missing; generator preserves Codex closure overrides and the M04-045 partial live-proof note |

| CODEX-GATE-RECON-EV-001 | Reconciled authoritative gate counts and current hardening state against the dated ledger, regression and read-only live schema probe | `../GATE_STATUS.md`, `CODEX_AUDIT_FULL_REGRESSION_RECONCILIATION_2026-07-15.md`, `CODEX_AUDIT_REMAINING_PARTIALS_2026-07-15.md` | Captured — G7/G9/G10 no longer claim the superseded zero-partial/19-of-19 state; live arrival-column repair and external boundaries remain explicit |

| CODEX-AUDIT-RECON-EV-001 | Deterministic cross-file reconciliation of AC ledger counts, all 19 partial dispositions, wiring-map rectangularity and session-ledger continuity | `validate_audit_reconciliation.py` | Captured — read-only verifier PASS: 493 rows, 19 partials, 8 rectangular wiring maps |

| CODEX-CD041-LIVE-EV-001 | CD-041 verified-transition live gate and deterministic assignment-window fixture | `CODEX_AUDIT_CD041_LIVE_GATE_2026-07-15.md` | Captured — source, RBAC-negative, closed-session and driven live checks pass; the earlier missing-RPC finding is closed by current shared schema state |

## CD-030 NEW-1 access-regression fix — 2026-07-15

| ID | Item | File | Status |
|---|---|---|---|
| CD030-NEW1-EV-001 | Independent audit finding: page-level gate on `/reviews/:id` blocked auditor/planner/leadership despite RLS (`inspections_read`/`subs_read`/`reviews_read`) and the CD-030 design scope ("P11 · Reviewer/Auditor") granting them read | `CODEX_AUDIT_CD-030_2026-07-15_R2.md` (finding NEW-1) | Captured — flagged via cross-session message, independently re-verified against `0002_rbac_audit.sql:39-40,65-66,71-73` and `screen_route_catalogue.csv:26` before fixing |
| CD030-NEW1-EV-002 | Fix: `authorized` broadened to `reviewer/ops/auditor/planner/leadership` (view); new `canDecide` (`reviewer/ops` only) gates `DecisionPanel`/`StartReview`; a `{role} · read-only` lozenge renders for non-deciding viewers | `../../apps/web/src/app/reviews/[id]/page.tsx` | Captured — restores the accepted RLS/design-scoped read permission without widening who can submit a decision |
| CD030-NEW1-EV-003 | Regression check on the same fix | `../../apps/web/e2e/cd-030-version-comparison.spec.ts`; `cd-029-review-workspace.spec.ts`; `cd-028-review-queue.spec.ts` | Captured — typecheck/build clean; 30/31 PASS, 1 skip; the single failure (`cd-028` leg 5) is a pre-existing shared-live-data ordering fragility (the queue's first open workspace had already been advanced to `under_review` by earlier same-day test runs), reproduced identically regardless of this fix, not a new defect |
