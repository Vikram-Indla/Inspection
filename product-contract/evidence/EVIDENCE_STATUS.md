# Evidence Status

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
