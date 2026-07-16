# Saqeel Admin Control Plane — Consolidated Claude Code MCP Implementation Prompt (CD-004 → CD-011)

> **NOT EXECUTABLE ON PASTE.** This is the single governing implementation brief for the Admin Control Plane vertical (CD-004 through CD-011). Claude Code (Opus) may begin a given CD only after that CD has: (1) sponsor design approval, (2) an independent wiring audit with no open P0/P1, and (3) an explicit per-CD implementation authorization flipping `implementation_authorized: true` in its manifest. If any of the three is missing for the CD you are about to touch, **STOP and report which gate is open**. Preparing this prompt does not authorize anything.

---

## 0 · Role, model, and working contract

You are Claude Code operating through the repository **MCP server** (filesystem + git + test runners) against the Saqeel `apps/web` Next.js + Supabase codebase. Work as a careful senior engineer, not a demo generator.

Absolute rules for the whole vertical:

1. **One clean dedicated worktree per CD** on a non-`main` branch named `feat/<cd-id>-<slug>` (e.g. `feat/cd-008-package-library`). Never edit `main`. Record `git rev-parse HEAD`, `git branch --show-current`, and `git status --porcelain` at start and end of every CD. The observed baseline is branch `setup/Inspection`, commit `1b530afe06a620b3b85173d10cec1f12074e2c18`, **dirty worktree = true** — concurrent unrelated work exists; never stage, reset, stash, clean, or absorb it.
2. **No commit / push / merge / rebase / deploy / migration apply** unless a separate explicit instruction authorizes it for that CD. Design approval ≠ implementation authorization ≠ commit authorization.
3. **Read before write.** For each CD, open every source file named in its section and in `CD006_CD011_CORRECTION_SOURCE_TRUTH_2026-07-15.md` (and the CD-004/005 R2 packs) via MCP first. Produce a `SOURCE_DISCOVERY_LOG_<cd>.md` (files read, observed responsibility, functions/queries/guards, contradictions). If a file contradicts the memo, **preserve the safer behavior, mark the leg `HANDOFF_BLOCKED`, and STOP** rather than guess.
4. **Truth over completion.** Never render a fixture as runtime proof. A failed/denied read renders `unavailable`/`unknown` — never `0`, `healthy`, `mapped`, `delivered`, `complete`, or `success`. Report gaps as gaps. Never self-approve, never claim "done" for a leg you did not prove with a test + runtime evidence.
5. **Never invent** a table, column, RPC, policy, transition, audit event, provider, monetary value, legal rule, effective date, SLA, threshold, or role. If the design shows a capability the schema lacks, it is a **contract target** rendered as a visibly disabled/annotated element, not a working control.

## 1 · Frozen boundary (applies to every CD)

Do not modify, restyle, or fork:
- `apps/web/src/components/Shell.tsx`, `ShellClient.tsx`, `apps/web/src/lib/shell-navigation.ts`
- `apps/web/src/app/tokens.css`, and global rules in `apps/web/src/app/astryx.css`
- server-rendered role-scoped navigation; the grouped Control-plane nav; topbar; theme/lang/notifications/account/sign-out; desktop collapse; mobile drawer focus/Escape; Arabic-first document direction.

Navigation visibility is **not** authorization. RLS, grants, route guards, canonical transitions, immutability, and audit remain the enforcement/evidence layers. Localization is data: add `ui_strings` rows (EN + AR); never hard-code production copy and never describe `apps/web/src/lib/i18n.ts` as a generated key store (it is an Arabic lookup over `ui_strings`).

## 2 · Shared runtime truth (binding — from the source-truth memo)

**Routes (contract → current):** SCR-ADM-011 `/admin/regulations/:id` → `/admin/regulations` (logical detail mode); SCR-ADM-020 `/admin/items` (direct); SCR-ADM-030 `/admin/packages` (direct); SCR-ADM-031 `/admin/packages/:id/designer` → `/admin/packages` (logical designer mode); SCR-ADM-040 `/admin/violations` (direct); SCR-ADM-041 `/admin/penalties` → `/admin/violations` (logical penalty mode). **Do not create the contract routes as live URLs.** Keep each logical screen inside its consolidated route.

**Configuration RLS (`0002_rbac_audit.sql`)** applies the same base policy to `regulations`, `regulation_clauses`, `inspection_items`, `packages`, `package_versions`, `violation_codes`, `penalty_mappings`: SELECT = any authenticated user; all writes = `compliance_admin` or `form_admin`. **No Admin-family direct-route guard is proven** — every unauthorized/route-guard leg is `HANDOFF_BLOCKED` (owner: platform). Where the catalogue persona is narrower than RLS, show the contract persona and disclose the mismatch; never broaden the contract.

**Audit:** the generic row-audit trigger covers **`package_versions` and `regulations` only** — NOT `regulation_clauses`, `inspection_items`, `violation_codes`, or `penalty_mappings`. The `audit_events` read policy grants `auditor, ops, security_admin, leadership, reviewer, planner` — **not** `compliance_admin`/`form_admin`. So: no audit timeline for config-writer roles unless a permitted reader/source is proven; clause/item/violation-code/penalty-mapping changes must not be shown as audited.

**State model (every screen):** `S01_POPULATED, S02_LOADING, S03_EMPTY, S04_VALIDATION, S05_UNAUTHORIZED, S06_READ_ONLY, S07_STALE, S08_DEGRADED, S09_RECOVERY`. Offline/sync-conflict N/A. Locales EN + AR; themes dark + light; desktop governed viewport + native `1024×1366`. No stale threshold exists — a stale state may say "data may have changed / could not refresh" but must not invent a duration/SLA. Degraded isolates one failing source. Recovery shows retry/focus/status without implying success before the read returns.

## 3 · Per-CD implementation sections

For **each** CD below, the deliverable is a vertical slice wired end-to-end for the proven legs and explicitly blocked for the rest, with the wiring map row schema:
`wiring_id, state_or_action_id, ui_trigger, client_component, route_server_action, validation_guard, canonical_transition, table_rpc_provider, exact_columns_or_payload, rls_grant_role, audit_event, notification_side_effect, success_result, negative_partial_failure, keyboard_focus_announcement, automated_test, runtime_evidence, disposition, blocker_owner`. Use `none` only when the source proves no leg is required; use `HANDOFF_BLOCKED` with the exact missing handler/schema/policy/route/test otherwise. "Assumed/likely/unknown" are not acceptable dispositions.

### CD-004 — Admin Control Plane Home · SCR-ADM-001 · `/admin`
- Candidate file: `apps/web/src/app/admin/page.tsx`. Six parallel reads: engine-setting identity/timestamp + counts for regulations, checklist items, published packages, violations, audit events.
- Proven: config-domain `engine_settings(engine, version_label, updated_at)`; counts. **Do not** infer engine health, approval age, SLA, staleness, provider status, or runtime-consumption from counts/timestamps. Model each Supabase result's `error`/null **independently** — a failed source renders unavailable, never `0`; never infer platform-wide failure from one source.
- Signature retained: Configuration Evidence Spine. Home is overview-only — no approve/publish/module lifecycle controls.
- Blocked: Admin-family route guard; any audit timeline for compliance/form admin; any lifecycle claim beyond what a source proves.

### CD-005 — Regulation Library · SCR-ADM-010 · `/admin/regulations`
- Files: `apps/web/src/app/admin/regulations/{page.tsx,Controls.tsx,actions.ts}`.
- Proven: `regulations(id, code, title, issuing_authority, status, created_at)`; `regulation_clauses(id, regulation_id, clause_ref, title, applicability, legal_source)`; `inspection_items.clause_id`. Actions: create draft regulation, add clause, direct `draft → published`.
- Signature: Impact Footprint Rail (regulation → clauses → items; downstream unproven legs shown unavailable, unknown ≠ zero). CD-005 owns discovery/list; CD-006 owns detail/edit/publish.
- Blocked: owner, effective dates, version history, maker-checker, published immutability, archive/clone/compare, overlap/dependency validation, package/violation impact counts, route guard, structured server-action errors.

### CD-006 — Regulation Detail & Version · SCR-ADM-011 · `/admin/regulations` (detail mode)
- Files: same regulations trio + `0001`/`0002`.
- Proven: `page.tsx` reads regulation `(code,title,issuing_authority,status)` + nested `regulation_clauses(clause_ref,title)` + nested `inspection_items(code)`. `addClause` also accepts `legal_source` even though the list query doesn't read it back. `publishRegulation` **directly** updates `draft → published` with **no** mapped-clause validation. `regulations` row changes are audited; clause changes are NOT. Persona: Compliance Admin + Reviewer (no invented Approver).
- **Correction (AUD-P0-03A):** split the old "W05 current-after-modify" claim into (a) the **current** direct publish, and (b) a **blocked** contract-safe path (mapped-clause validation + maker-checker + published lock). The unmapped-clause hard case is a **blocker disclosure**, not a working button. Do not imply validate/submit/approve/compare/supersede/dependency-gate/audit-timeline/detail-route exist.

### CD-007 — Inspection Item Catalogue · SCR-ADM-020 · `/admin/items`
- Files: `apps/web/src/app/admin/items/{page.tsx,Controls.tsx,actions.ts}` + package consumers under `apps/web/src/app/admin/packages/`.
- **Correction (AUD-P0-03B):** remove all "schema unconfirmed". Confirmed fields: `id, code, title, active, score_weight, response_model, evidence_rule`, clause/regulation refs; schema also has `score_excluded_on, guidance_en, guidance_ar` (list query may not project all). Actions: `createItem` (governed response/evidence presets, clause link, score weight, guidance, response model, evidence rule, active), `toggleItemActive` (preserves history; no stored reason). Package publish validator rejects inactive/missing items + malformed dependent mappings. Duplicate `code` = DB unique constraint → provider error surfaced by the action.
- Blocked: item edit/version lifecycle, deactivation reason, item-row audit trigger, item-route package-usage count, conditional-rule authoring. A published-use warning may be a design target only when its count is `unavailable` and the query leg is `HANDOFF_BLOCKED` — never a fabricated count.

### CD-008 — Package Library · SCR-ADM-030 · `/admin/packages`
- Files: `apps/web/src/app/admin/packages/{page.tsx,ImpactPanel.tsx,PackagePreview.tsx,PublishControls.tsx,actions.ts}` + `0001,0002,0006_package_maker_checker.sql,0024_fix2_admin_package_impact.sql`.
- **Correction (AUD-P1-04):** bind concepts to real behavior. Reads packages + version rows `(id, version_label, status, published_at, definition JSON)` + live item bank. `getPinnedActiveImpact` → real `package_version_impact(uuid)` aggregate (active visit/inspection counts pinned to prior published/locked versions, grouped by prior version; internally limited to config/checker roles). `ImpactPanel` computes shared-item fan-out + definition diff vs current published. `createDraftVersion` clones latest definition, records `created_by`. `approveAndPublish` validates item existence/active, response-linked violations, penalty mappings, evidence rules, action-form refs before publishing. DB enforces **distinct package-version approver** + requires `approved_by` for published/locked; prevents definition/label edits on published/locked; `package_versions` changes are audit-triggered.
- RPC denied/error = `unavailable`, never `0`. Blocked/absent: effective dates, scheduled versions, supersede lifecycle (not in schema). "Superseded" is a **derived display** (older published than latest published), not a stored status.

### CD-009 — Package & Form Designer · SCR-ADM-031 · `/admin/packages` (designer mode)
- Files: packages set incl. `DraftEditor.tsx`; name the field-runtime comparison source if you claim preview equivalence.
- **Correction:** working controls limited to proven `DraftEditor` behavior: edit section title, set section mandatory flag, add/remove item code, add section, save draft definition (writes only while status = `draft`). Array order is consumed by preview/runtime but **there is no reorder control**. `PackagePreview` is a **read-only projection** (responses, evidence, conditional source text, guidance, clause, violation link, action-form shape) — **not a simulator**.
- Blocked (render as disabled `HANDOFF_BLOCKED` target panels, never active controls): item reorder, condition authoring, per-item required/optional/conditional rules, scoring enable/disable, full evidence-model editor, action-form authoring, simulation engine, circular-condition detector.

### CD-010 — Violation Catalogue · SCR-ADM-040 · `/admin/violations`
- Files: `apps/web/src/app/admin/violations/{page.tsx,Controls.tsx,actions.ts}` + `0001,0002`.
- **Correction (AUD-P0-03C):** confirmed `violation_codes(id, UNIQUE code, title, level, optional clause_id, active_from, active_to)`. `page.tsx` reads code, title, level, active-from, clause/regulation ref + nested penalty-mapping summary. `createViolationCode` requires code + title + one of `L1/L2/L3` + clause + active-from. **Legal basis belongs to the penalty mapping, not the violation-code row.** Do not confuse runtime `violations` with config `violation_codes`.
- active/future/deactivated must be **derived** from `active_from`/`active_to` + current date, explicitly — **not** a status enum. Severity is glyph + word + color, never color alone. Blocked: category, applicability, edit, version, deactivate action, usage count, trigger-trace query, and **`violation_codes` audit trigger** (does not exist — remove the audit claim). Orphan/duplicate use real clause/unique-code facts; historical/package-use counts must not be fabricated.

### CD-011 — Penalty Mapping · SCR-ADM-041 · `/admin/violations` (penalty mode) — **regenerated; reference `cd-011-r2/`**
- Files: `apps/web/src/app/admin/violations/{page.tsx,Controls.tsx,actions.ts}` + `0001,0002`.
- Confirmed `penalty_mappings(id, UNIQUE violation_code_id, penalty_ref, penalty_range JSON preset, repeat_rule JSON preset, legal_basis, mapping_version)` → **one mapping per violation**. `createPenaltyMapping` requires violation + penalty_ref + legal_basis + mapping_version + range preset (`schedule_approved|none`) + repeat preset (`escalate_one_level|none`). Presets are **config tokens, never monetary/legal values**. Proven negatives: unmapped violation; duplicate one-to-one rejection; missing legal basis before create; invalid/missing preset. FLD-PEN-001: `mapping_version` is an immutable **reference** for results, not a row lock.
- Signature: Mapping Validation Lens restricted to those four proven checks. Blocked: effective periods, overlap/gap engine, cardinality > 1:1, submit/approve/publish lifecycle, penalty maker-checker, mapping immutability, mapping audit trigger. `/admin/penalties` is contract-only.

## 4 · Evidence required before any CD may claim `VERTICAL_SLICE_PASS`

For every proven wiring row, prove the full chain: UI trigger → client component → server action → validation guard → canonical transition → table/RPC/provider → RLS/role → audit event (only where a trigger exists) → success + negative/partial-failure result → automated test → runtime evidence. Plus:
- All nine states S01–S09 demonstrated (screenshot or test), each mapped in `STATE_MATRIX_<cd>.csv`.
- EN + AR and dark + light for the same hard state; native `1024×1366`; no horizontal overflow; 44px targets; 16px inputs; `role=status` vs `role=alert` correct; non-color status cues; keyboard traversal + focus transfer to blockers/errors and back; reduced-motion.
- Regression suite green; new tests named per wiring `automated_test` ids.
- Path-by-path diff summary. Every fixture visibly marked `DESIGN FIXTURE — NOT RUNTIME EVIDENCE` in design artifacts; never in shipped UI as truth.

## 5 · Per-CD return format

End each CD with: the `SOURCE_DISCOVERY_LOG`, the updated `IMPLEMENTATION_MANIFEST_<cd>.yaml` (literal repo paths; before/after responsibility; disposition reuse|modify|create|remove|blocked; tests; rollback; `implementation_authorized` unchanged unless separately authorized), the row-complete `WIRING_MAP_<cd>.csv`, the diff summary, the Section 4 evidence, and a status line:
- `VERTICAL_SLICE_PASS` only if every proven leg is wired, tested, and evidenced and every unproven leg is `HANDOFF_BLOCKED` with an owner; otherwise
- `HANDOFF_BLOCKED` with the exact finding id, missing evidence, owner, and next allowed action.

Never emit `approved`, `build-complete`, `ready to ship`, or a numeric self-score.

## 6 · Suggested sequencing (each gated independently)

CD-004 → CD-005 → CD-006 (regulations family) → CD-007 (items) → CD-008 → CD-009 (packages family; CD-008 first, it establishes the RPC/impact/publish truth CD-009 depends on) → CD-010 → CD-011 (violations family; CD-010 first, it establishes `violation_codes` truth CD-011's left column depends on). Do not begin a later CD in a family before the earlier one's gate is closed.
