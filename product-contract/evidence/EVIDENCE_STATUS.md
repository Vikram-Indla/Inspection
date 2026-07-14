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
