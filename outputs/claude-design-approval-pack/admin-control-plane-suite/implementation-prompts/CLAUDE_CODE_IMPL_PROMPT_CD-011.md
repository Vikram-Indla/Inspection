# Claude Code MCP Implementation Prompt — CD-011 · Penalty Mapping

> **NOT EXECUTABLE ON PASTE.** Begin only after this CD has (1) sponsor design approval, (2) an independent wiring audit with no open P0/P1, and (3) an explicit implementation authorization flipping `implementation_authorized: true` in its manifest. If any is missing, STOP and report which gate is open.

## 0 · Session & working contract
- Operate through the repository **MCP server** (filesystem + git + tests) on Saqeel `apps/web` (Next.js + Supabase).
- Clean dedicated worktree on `feat/cd-011-penalty-mapping`; never touch `main`. Record `git rev-parse HEAD`, `git branch --show-current`, `git status --porcelain` at start and end.
- Observed baseline: branch `setup/Inspection`, commit `1b530afe06a620b3b85173d10cec1f12074e2c18`, **dirty worktree = true** — never stage/reset/stash/clean/absorb the concurrent unrelated work.
- No commit/push/merge/rebase/deploy/migration-apply unless separately authorized.
- **Read before write:** open every file in §2 via MCP, produce `SOURCE_DISCOVERY_LOG_CD-011.md`. If a file contradicts the truth below, preserve the safer behavior, mark the leg `HANDOFF_BLOCKED`, and STOP.
- **Truth over completion:** never render a fixture as runtime proof; a failed/denied read renders `unavailable`/`unknown`, never `0`/healthy/complete/success. Never invent a table, column, RPC, policy, transition, audit event, role, monetary value, legal rule, effective date, SLA, or threshold. A capability the schema lacks ships as a visibly disabled/annotated contract target, never a working control.

## 1 · Identity
- Screen SCR-ADM-041 · contract vs current route: /admin/penalties (contract, NOT implemented) → /admin/violations penalty logical mode
- Persona per §2. Design source of truth: `CD-011 Penalty Mapping.dc.html` + corrected pack `cd-011-r2/` (route/runtime memo, data-truth ledger, S01–S09 state matrix, wiring map, manifest, acceptance checklist, handoff).

## 1a · Frozen boundary (all CDs)
Do not modify/restyle/fork: `Shell.tsx`, `ShellClient.tsx`, `lib/shell-navigation.ts`, `tokens.css`, global rules in `astryx.css`; server-rendered role-scoped nav; topbar; theme/lang/notifications/account/sign-out; desktop collapse; mobile drawer focus/Escape; Arabic-first document direction. Navigation visibility is NOT authorization. Localization is data — add `ui_strings` EN+AR rows; `lib/i18n.ts` is an Arabic lookup over `ui_strings`, not a generated key store.

## 1b · Shared runtime truth
- Configuration RLS (`0002_rbac_audit.sql`): SELECT = any authenticated; all writes = `compliance_admin`/`form_admin`. **No Admin-family route guard is proven** → every unauthorized/route-guard leg is `HANDOFF_BLOCKED` (owner: platform). Show the contract persona; disclose any RLS-vs-persona mismatch; never broaden the contract.
- Audit: generic row-audit trigger covers **`package_versions` + `regulations` only** — NOT `regulation_clauses`, `inspection_items`, `violation_codes`, `penalty_mappings`. `audit_events` read grants `auditor, ops, security_admin, leadership, reviewer, planner` — NOT `compliance_admin`/`form_admin`.
- States every screen: S01_POPULATED, S02_LOADING, S03_EMPTY, S04_VALIDATION, S05_UNAUTHORIZED, S06_READ_ONLY, S07_STALE, S08_DEGRADED, S09_RECOVERY. Locales EN+AR; themes dark+light; desktop + native 1024×1366. No stale threshold exists (no invented duration/SLA). Degraded isolates one failing source. Recovery shows retry/focus/status without pre-success.

## 4 · Evidence before `VERTICAL_SLICE_PASS`
Every proven wiring row proven end-to-end: UI trigger → client component → server action → validation guard → canonical transition → table/RPC → RLS/role → audit (only where a trigger exists) → success + negative/partial-failure → automated test → runtime evidence. All S01–S09 demonstrated + mapped in `STATE_MATRIX_CD-011.csv`. EN+AR, dark+light for the same hard state; native 1024×1366; no horizontal overflow; 44px targets; 16px inputs; role=status vs role=alert; non-color cues; keyboard traversal + focus transfer to blockers/errors and back; reduced-motion. Regression suite green. Path-by-path diff.

## 5 · Return
`SOURCE_DISCOVERY_LOG`, updated `IMPLEMENTATION_MANIFEST_CD-011.yaml` (literal paths; before/after responsibility; disposition; tests; rollback), row-complete `WIRING_MAP_CD-011.csv`, diff summary, §4 evidence, and a status line: `VERTICAL_SLICE_PASS` only if every proven leg is wired/tested/evidenced and every unproven leg is `HANDOFF_BLOCKED` with an owner; else `HANDOFF_BLOCKED` with the exact finding, missing evidence, owner, next action. Never emit approved/build-complete/ready-to-ship or a numeric self-score.

## 2 · Read first
`apps/web/src/app/admin/violations/{page.tsx,Controls.tsx,actions.ts}`; migrations 0001/0002; the `cd-011-r2/` pack (full 13-file package incl. 8 PNGs + native 1024×1366). Personas: Compliance/Form Admin.

## 3 · Proven truth & scope
- Confirmed `penalty_mappings(id, UNIQUE violation_code_id, penalty_ref, penalty_range JSON preset, repeat_rule JSON preset, legal_basis, mapping_version)` → **one mapping per violation**. `createPenaltyMapping` requires violation + penalty_ref + legal_basis + mapping_version + range preset (`schedule_approved|none`) + repeat preset (`escalate_one_level|none`). Presets are **config tokens, never monetary/legal values**. FLD-PEN-001: `mapping_version` is an immutable **reference** for inspection results, not a row lock.
- Proven negatives: unmapped violation; duplicate one-to-one rejection (unique constraint); missing legal basis before create; missing/invalid preset.
- **Build:** three-column relationship workspace (violation | Mapping Validation Lens | penalty mapping record); the lens shows ONLY those four proven create-time validations. Legal basis is a mandatory create gate, prominent above preset controls; presets shown as tokens with no fabricated amount.
- **Blocked — disabled/annotated targets:** effective periods, overlap/gap engine, cardinality > 1:1, submit/approve/publish lifecycle, penalty maker-checker, mapping immutability, mapping audit trigger, route guard. `/admin/penalties` is contract-only.
