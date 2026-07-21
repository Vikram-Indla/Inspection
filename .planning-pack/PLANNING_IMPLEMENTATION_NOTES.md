# SAQEEL Planning — Implementation Notes

Running status log for the Planning module build. Newest entry last.

---

## 2026-07-21 — Single Planning reconciliation (CR → licence → plant + handoffs + draft resume)

**Branch:** `feat/planning-module` (worktree `.worktrees/planning-module`) · **Ledger rows:** PLN-REQ-007, PLN-REQ-008, PLN-REQ-010, PLN-REQ-020, PLN-REQ-021, PLN-REQ-022, PLN-REQ-023, PLN-REQ-024

### Built

1. **Canonical resolver completed** — `apps/web/src/lib/planning/factory-resolver.ts` (server-only):
   modes `cr | license | plant` (+ `auto`), exact case-insensitive identifier equality only,
   multi-licence CR returns a portfolio `{ cr, licences: [{ license, plant, factory, plantAddress }] }`,
   fail-closed reads, no fabricated fields. Added `factories.license_number` to the resolved factory
   (the value the publish RPC revalidates) and `resolveHandoffTarget(sb, { cr, license, plant })`
   for handoff prefill (licence+plant pairs must match the SAME licence row; CR-only handoff
   preselects only a single-licence CR).
2. **Single page rewrite** — `apps/web/src/app/planning/single/page.tsx` (route + CD-022 identity
   lens preserved):
   - Planner-only role check replaced with `getPlanningAccess(sb, ["planning.create.single"])`
     (PLN-REQ-007/008): business staff pass, inspector/admin classes denied, fail-closed,
     bilingual unauthorized state. Verified live: inspector + admin see the denial, ops passes.
   - Search runs the canonical resolver first; empty canonical result falls back to the legacy
     graded EXACT/SIMILAR factories search, now marked `source: "legacy"` (dossier UX unchanged).
   - Draft resume `?plan=<id>`: loads an own, active single-method draft (status draft/validated,
     `archived_at` null), re-resolves its target (canonical first, legacy fallback), maps
     `draft_payload.config` into wizard hydration.
   - Handoff prefill `?cr=&license=&plant=&factory=&source=`: canonical resolve + preselection;
     factory-only legacy fallback; unresolvable/disagreeing identifiers → explicit miss banner,
     never a best-effort pick.
3. **Wizard** — `apps/web/src/app/planning/single/Wizard.tsx`: canonical portfolio UI shows CR
   identity + EVERY licence/plant with mandatory radio selection; CR-level-only continuation is
   blocked by an explicit eligibility state whenever licences exist; a CR with no licences is not
   plannable (M01-036 note). Selected plant profile renders registered fields + source/freshness
   read-only. Target carries `cr_number / license_number (factories' own) / canonical_license_number
   / plant_number / factory_id / source` into publish via hidden fields. **Save draft** button calls
   the new `saveSingleDraft` action; the saved draft id feeds `resume_visit_plan_id` so publish
   consumes it. Location confirmation is deliberately NOT restored on resume (re-confirmed per
   M01-038); legacy licence confirmation IS restored (it was part of the saved target).
4. **Publish path** — `apps/web/src/app/planning/single/actions.ts`:
   - `publishSingleVisit` threads targeting identifiers; after the atomic RPC it records
     `visits.source_channel` + `visits.internal_reference` (`CR/licence/plant` compact code) and
     `visit_plans.criteria.target` + `source_channel`. RPC unchanged (see gap below).
     ERR-PUB-001 package-mandatory guard kept (optional packages remain a later phase).
   - `saveSingleDraft` (new): capability-checked (`planning.edit_draft`/`planning.create`),
     upserts `visit_plans` (method `single`, status `draft`, `draft_payload` target+config+handoff,
     `draft_version++` with optimistic version check, `criteria.target`, `source_channel`).
     No notifications, no publish, no status transition.
5. **Factory 360 handoffs** (PLN-REQ-024) — "Plan single visit" links added BESIDE the preserved
   Immediate links, all with `source=factory360`:
   `apps/web/src/app/field/factory-360/[id]/page.tsx`,
   `apps/web/src/app/factories/cr/[id]/page.tsx` (both pass cr/license/plant identifiers + factory),
   `apps/web/src/app/factories/[id]/page.tsx` (legacy: factory + cr/license).
   `source_channel` is recorded end-to-end (handoff → draft → plan/visit rows).
6. **Tests** — `apps/web/e2e/cd-022-identity-lens.spec.ts`: added canonical fixtures (admin-JWT
   writes; planner reads), licence search, plant search, multi-licence portfolio requiring
   selection (CR-level blocked), Factory 360 prefill, save-draft → `?plan=` resume → publish
   consuming the draft with source_channel/internal_reference/criteria assertions, capability
   boundary (inspector denied, admin denied, ops allowed). Existing assertions preserved; the
   file-contract assertion `.from("visit_plans").insert` was updated because `saveSingleDraft`
   now deliberately inserts draft plans (publish path still never writes outside the RPC).
   **17/17 passed against live staging** (dev server port 3100, stopped after the run).

### Gaps / deviations

- **PLN-REQ-023:** `publish_single_visit` (migration 20260714091727) has NO plant/CR parameter.
  Per instructions the RPC was NOT altered; CR/licence/plant targeting is recorded post-publish on
  `visit_plans.criteria.target` + `visits.internal_reference`/`source_channel`. A later phase may
  extend the RPC to carry targeting inside the atomic transaction.
- **publishSingleVisit authorization:** page guard is capability-based (`planning.create.single`),
  but the publish action keeps the legacy planner-role blocker (mirrors the RPC's
  `has_role('planner')` gate). A business-staff user without the planner role can draft but cannot
  publish (RPC raises → neutral error). Intentional; revisit when the RPC moves to capabilities.
- **Supabase MCP unreachable** during the phase (streamable HTTP error); live staging columns were
  verified via PostgREST with persona JWTs instead (`plan_reference`, `draft_payload`,
  `source_channel`, `internal_reference`, capability RPCs all confirmed live).
- `.planning-pack/SAQEEL_PLANNING_KIMI_PACK_2026-07-20/` (ledger CSV, PROMPT_04) and
  `CANONICAL_PLAN.md` were not present in this worktree; implementation followed the task brief +
  schema contract + live DB verification.
- Evidence-screenshot test needs `INSPECTION_DOCS_ROOT` set to a writable path when run from this
  worktree (default `~/Desktop/Inspection Documentation` is not writable from the sandbox — EPERM,
  environmental, unrelated to module behavior).
