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

---

## M5 — Immediate/Manual Planning reconciliation (PLN-REQ-025..028) — 2026-07-21, on `main`, commit `7dc55062`

1. **Eligibility (PLN-REQ-025)** — `planning/immediate/page.tsx` now gates on
   `getPlanningAccess(sb, ["planning.create.immediate","planning.manual_factory"])` (fail-closed);
   `actorMode` from access class (inspector → inspector path). Manual entry requires all three
   legs, re-verified server-side in `actions.ts` before the RPC: (1) permission — inspector via
   `planning.create.immediate` (M01-045 exception), business staff via explicit high-impact
   `planning.manual_factory`; (2) `planning_lookups` visit_type `metadata.manual_entry_allowed=true`;
   (3) explicit not-found confirmation. Staging config applied via MCP: complaint type
   `manual_entry_allowed=true` (periodic/follow_up false); planner granted `planning.manual_factory`.
2. **Field contract (PLN-REQ-026)** — not-found checkbox gates all manual fields (disabled
   fieldset); establishment name / region / city (region-dependent city datalist) / map pin
   required; contact mobile required only when factory notification enabled (Saudi-format check,
   client + server). Neutral bilingual blocker copy for every new failure.
3. **Reason lookup + attachment (PLN-REQ-027)** — manual reason is a governed dropdown from
   `planning_lookups` `manual_entry_reason` (Other → mandatory comment); `attachment_required`
   type metadata surfaces an honest banner (no upload path exists pre-creation — see gap).
4. **Provenance / unverified marking (PLN-REQ-028)** — RPC unchanged (21 params); post-creation,
   best-effort + logged: `visits.source_channel='planning.immediate.manual'`,
   `visits.internal_reference=<reason key[: comment]>`, `visit_location_events` pin
   (source Planner|Inspector), `factory_representatives` mobile contact when notification enabled.
   Visit detail shows a bilingual "Unverified manual entry — pending reconciliation" badge
   (`is_temporary && source='immediate_manual'`) plus creator provenance (role, reason, channel).
5. **Tests** — `e2e/cd-023-immediate-authority-bar.spec.ts`: `fillManualCore` updated to the new
   contract; the obsolete "minimum manual identity may omit name/CR/license" test rewritten as the
   provenance/badge/location-event creation test; new tests for not-found gating, visit-type
   lock with honest reason, required name/region/city, Other-requires-comment, ops boundary
   (page opens, manual locked, creation RPC-gated), admin denied. Stale locator
   `.ax-sr-only` → `.sr-only` fixed (class renamed in `fe4cf0e2`, pre-existing).
   **23 passed, 1 pre-existing failure** (see blockers). Typecheck clean for M5 files.

### Gaps / deviations (M5)

- **RPC surface unchanged:** `create_immediate_visit` has no manual-reason/mobile parameter;
  provenance is recorded post-creation (additive, best-effort). A later phase may extend the RPC
  to carry reason/mobile inside the atomic transaction.
- **Inspector post-creation writes fail by RLS (expected):** `visit_location_events` insert needs
  `planning.correct_location`/`planning.manage`; `factory_representatives` insert needs
  planner/ops/compliance_admin. Inspector-created manual visits log + continue; documented.
- **Ops asymmetry (documented):** ops holds `planning.create.immediate` (page opens, planner-path
  UI) but the RPC enforces `has_role('planner')`/`has_role('inspector')`, so ops creation is
  blocked with neutral copy. Revisit when the RPC moves to capabilities.
- **Attachment enforcement:** when a visit type sets `metadata.attachment_required`, the form shows
  a banner directing post-creation upload on the visit record; creation is NOT hard-blocked (no
  upload path exists in this form; staging currently has `attachment_required=false` everywhere).

### Blockers (M5) — pre-existing on `main`, NOT caused by M5

- **Inspector web flow redirect loop:** `(app)/layout.tsx` channel gate (`3bc1acb0`,
  TASK-WEB-CHANNEL-ACCESS-GATE-001) redirects field-only personas (inspector) off every
  non-`/field` route, so the CD-023 Inspector-created Immediate Visit test
  (`/planning/immediate` as inspector) fails with ERR_TOO_MANY_REDIRECTS — verified identical on
  unmodified HEAD. The gate conflicts with the M01-043 inspector web path; needs a product
  decision (exempt `/planning/immediate` from the gate or move inspector immediate to `/field`).

## M6 — Bulk Planning criteria dictionary, persisted drafts, eligibility partition — 2026-07-21, on `main`, commits `c63d078d` + `c9363080` + `3a33a28b`

1. **Criteria dictionary (PLN-CON-019)** — `planning/bulk/criteria.ts` typed operator set per
   field; `CriteriaBuilder.tsx` rows are field → operator → value with per-field value editors.
   **CONTRACT_NOT_SUPPLIED fields are listed disabled with their honest explanation, never
   silently zero:** sector, licence stage/status, product/HS, land provider, employee count
   (only 4/1339 factories have it on staging), issuing authority. Bare `/planning/bulk` no
   longer match-alls — at least one criterion required; empty criteria = honest banner, no
   results. No unrestricted match-all capability exists this phase.
2. **Persisted drafts** — Review & continue saves a bulk draft (plan row, `draft` status);
   `review?plan=<id>` resumes it server-side without browser state; unknown id falls back
   honestly to the browser-held sessionStorage path with a `draftUnavailable` warning banner
   (rendered in the empty phase too — `c9363080`).
3. **Eligibility partition (CD-025)** — `validateBulkPlan` partitions the staged selection:
   duplicate-active-visit rows excluded from retained (ack-bypassable blocker), missing-location
   rows flagged, coverage = retained − manual vs pool minus busy; publish stays gated behind an
   explicit eligible-subset acknowledgement and proceeds with the eligible subset only.
4. **Middleware resurrection (root cause of the M5 redirect-loop blocker)** — the old
   `apps/web/middleware.ts` at package root NEVER ran (Next 15 + `src/` only loads
   `src/middleware.ts`; dead since `3bc1acb0`), so `x-pathname` was always "" and the layout
   channel gate redirect-looped `/field → /field`. Fix: new `src/middleware.ts` that ONLY sets
   `x-pathname` (deliberately narrower than the dead file — no auth redirect, no locale
   mirroring; Shell/pages own those and `/reset`, print, API routes must stay reachable) plus a
   layout exemption `if (pathname === "/planning/immediate") return;`. Verified via curl replay:
   `/field` 200, `/planning/immediate` 200, `/planning/bulk` → 307 `/field` for inspector.
   The M5 inspector redirect-loop blocker is resolved by this fix.
5. **Capability matrix (verified via `has_planning_capability` RPC)** — planner ✓ / reviewer ✓
   `planning.create.bulk` + `planning.edit_draft`; inspector ✗; admin ✗ (denied on both bulk
   routes). Inspector role-guard test asserts the channel redirect (RBAC-009/010 contract);
   admin test covers the denial copy.
6. **Tests** — `e2e/cd-021-bulk-targeting.spec.ts` **28/28 green**; `e2e/cd-025-plan-review-publish.spec.ts`
   **11/11 green** (both on staging, dev server port 3100, port verified clear after each run).
   Typecheck clean. The cd-025 ack test is self-contained via REST staging: 2 located factories
   WITH active periodic visits (duplicate rows) + 1 located factory verified visit-free, window
   2026-09-10 → 2026-09-20 (probe-verified free — staging pool is 1 inspector busy on recurring
   monthly windows, so multi-row auto selections hard-block on coverage).

### Gaps / deviations (M6)

- **RPC asymmetry (documented, not a bypass):** reviewer holds `planning.create.bulk` and reaches
  the publish UI, but `publish_bulk_plan` enforces `has_role('planner')` server-side. Revisit when
  the RPC moves to capabilities.
- **`validated` added to all active-status duplicate sets** (`draft, validated, published,
  returned`) — validated is an internal active state; a validated visit blocks a duplicate exactly
  like draft/published/returned.
- **Inspector cd-021 role-guard semantics changed** from on-page denial copy to the RBAC-009/010
  channel-redirect contract (307 → `/field`), plus two stale-locator fixes in cd-021.

### Blockers (M6) — pre-existing / NOT caused by M6

- **Staging migration drift (execution module):** staging DB is missing migration
  `20260721090000_execution_canonical_contracts.sql` (`visits.execution_date` 400s), so the
  cd-023 inspector test passes all planning-side assertions but fails at the field startup page
  ("Visit not found"). Execution-session/staging-drift territory — not planning files.
- **Supabase MCP down all session** — staging probes done via PostgREST through the
  `e2e/live-rest.ts` pattern instead. No MCP-applied config changes were needed for M6.
- **M7 boundary (next phase):** publish-time partition + atomic accepted-subset commit.

## M7 — Optional zero-many packages, accepted-subset publish, capability gate — 2026-07-22, on `main`, commits `adf67469` + `a9f936ae` + `73eb806d` + `118cc1ea` + `989e8ad4`

1. **Optional zero-many packages (PLN-CON-003)** — single + bulk flows both take zero-or-more
   `package_version_id` values; every selected package is linked to every created visit via
   `visit_packages` with an immutable snapshot (`{package_version_id, code, title, version_label,
   status, captured_at}`); `visits.package_version_id` keeps the FIRST package as primary for
   backward compat. Zero packages = non-blocking WARNING ("No inspection checklist selected") +
   preparation hint ("the inspector chooses an eligible checklist during preparation"); publish
   is never gated by it. `packageInvalid` (a selected package no longer active) stays a HARD
   blocker — a deliberate selection is never silently dropped.
2. **Publish RPC capability gate — migration `20260721180000_planning_publish_capability.sql`
   APPLIED to staging** (owner-applied after review; verified live: both publish RPCs reference
   `has_planning_capability`, and the reviewer + zero-package e2e tests pass against it).
   Two behavioural changes per function vs `20260714091727`: (a) role gate →
   `has_role('planner') OR has_planning_capability('planning.publish')`; (b) package guard →
   fires only when `p_package_version_id IS NOT NULL` (zero-package publish is otherwise
   impossible — the brief's "role-gate-only" wording was internally inconsistent with the
   canonical §10/§14 zero-package requirement).
3. **Accepted-subset commit (PLN-CON-007)** — `publishBulkPlan` re-computes the M6 eligibility
   partition at publish time (one busy-set read serves both conflict partition and coverage),
   drops+names ineligible rows in the outcome ledger, commits exactly the kept subset via the
   atomic RPC; 23505 / conflict messages map to named-conflict copy; an all-dropped publish
   returns the honest "nothing left to publish" blocker without touching the RPC.
4. **Null-profiles-join fix (`118cc1ea`)** — `loadBulkSelection`'s embedded
   `profiles!user_roles_user_id_fkey(full_name)` join is NULL under `profiles_self` RLS for
   capability personas without the planner role (the Reviewer), which 500'd the whole review
   load. Now falls back to the language-neutral id prefix. Without this the capability gate was
   unexercisable end-to-end from the UI.
5. **Lookups-driven config** — visit type / mode / priority selects are driven by
   `planning_lookups`; non-periodic types and non-physical modes render disabled with
   "— not yet available for bulk" (the bulk RPC remains periodic+physical-only); priority flows
   from the lookups and is recorded on visits post-commit.
6. **Tests** — `e2e/cd-025-plan-review-publish.spec.ts` **16/16 green** (11 pre-existing +
   5 new M7: zero-package warning/hint, per-package `visit_packages` snapshot assertions,
   authoritative re-check drop race, reviewer-persona publish, zero-package publish) and
   `e2e/cd-022-identity-lens.spec.ts` publish subset **3/3 green** (staging, dev server port
   3100, port verified clear after each run). Typecheck clean. Reviewer test signs in through
   the real `/login` UI — replaying `playwright/.auth/reviewer.json` intermittently lands on
   `/login` (refresh-token rotation), while the UI journey is what `auth.setup.ts` proves.

### Gaps / deviations (M7)

- **Migration package-guard relaxation beyond the brief** — the brief said role-gate-only, but
  zero-package publish is impossible without the NULL-package guard change; documented above and
  applied as one migration.
- **Accepted-subset race tested as a single-row race** — staging has exactly ONE Inspector, so a
  two-row plan in one shared window can never arm (`autoNeeded > freePool`). The same server
  path (publish-time partition → drop → named ledger/error) is exercised with one row; a mixed
  kept+dropped multi-row subset needs ≥2 Inspectors and remains a staging-data gap.
- **Immediate RPC package requirement UNCHANGED** — `create_immediate_visit` still requires a
  package (accepted reconciliation: the immediate authority flow is a different contract);
  flagged for sponsor decision.
- **Bulk RPC remains periodic + physical-only** — other lookups options are listed disabled as
  "not yet available for bulk"; widening the RPC is a later-phase gap.
- **Attempted-conflict audit gap** — `audit_events` is trigger/definer-only, so a conflict that
  appears between preview and commit is surfaced in the outcome ledger + server log but NOT
  persisted as an audit event; needs a definer RPC change.
- **Priority recorded post-commit, best-effort** — the publish RPC has no priority parameter, so
  `visits.priority` is updated after commit; a failed update leaves the default and is logged,
  never silently swallowed.
- **`visit_packages` snapshot writes are post-transaction best-effort** — they follow the atomic
  RPC rather than living inside it; a snapshot-insert failure is logged and the visits remain
  authoritative (gap: not inside the atomic boundary).

### Blockers (M7) — pre-existing / NOT caused by M7

- **Supabase MCP unavailable all session** — all staging verification (including the migration
  probe before apply) ran through PostgREST via the `e2e/live-rest.ts` pattern.
- **Staging data constraints** — exactly one Inspector (multi-row same-window plans cannot arm)
  and exactly one effective package version (multi-package assertions are DOM-driven and scale
  up automatically when more packages are seeded).

## M8 — Planning lifecycle: normalized return/cancel, duplicate, discard, expiry display, /visits reconciliation — 2026-07-22, on `main`, commits `c5d94be7` + `a4463ed5`

1. **Governed reasons + append-only lifecycle stream (PLN-CON-011)** — new
   `src/lib/planning/lifecycle.ts`: `getReasonOptions` (active `planning_lookups` of kind
   `return_reason` / `cancellation_reason`), `validateReason` (`other` or
   `metadata.comments_required` ⇒ comments mandatory), `recordLifecycleEvent` (never throws;
   caller surfaces the gap against the already-committed transition, exactly like the
   queued-notification pattern). Return no longer overwrites planner notes with the legacy
   `RETURNED: ` prefix — the transition only flips `planning_status` and appends a `return`
   event carrying `{planning_status, inspector_id, window_start, window_end}`. Cancel stores
   the governed key in `visits.cancellation_reason` (legacy free-text rows still render
   verbatim) and appends a `cancel` event. Republish / reschedule / reassign also append
   their events additively (prior-state snapshot on each).
2. **Canonical §15 guard widening** — cancel / reschedule / reassign now accept
   `returned + new` alongside `published + new` (`guardPublishedOrReturnedNew`); a returned
   visit also exposes **repackage** (swap primary `package_version_id` + insert any missing
   `visit_packages` link with a fresh immutable snapshot; links are never removed — the RLS
   grants no delete, documented gap). `updateVisitType` stays `published + new`; bulk verbs
   unchanged.
3. **Duplicate → new Draft (PLN-REQ-011)** — final visits (`cancelled` / `expired`) expose
   Duplicate on the detail page. It clones ONLY planning fields (factory target, type, mode,
   priority, window, packages, notes minus the legacy prefix) into a new draft `visit_plans`
   row with the canonical resume payload of its method (single/immediate →
   `/planning/single?plan=`; bulk → `/planning/bulk/review?plan=` with a one-factory working
   set — targeting criteria are not cloned) plus one linked DRAFT visit, and records a
   `duplicate` event on the SOURCE naming the new plan + visit. A failed draft-visit insert
   compensates by archiving the orphan plan (mirrors the ORPHAN pattern).
4. **Discard draft (PLN-CON-018)** — own, never-published (`draft`/`validated`),
   non-archived plans are retired by stamping `visit_plans.archived_at` — semantically
   distinct from cancelling a published visit in copy and mechanism. Each linked DRAFT child
   visit is cancelled (canonical §15 allows Draft cancellation; visits RLS grants no delete)
   with a `discard_draft` event naming the plan. Fails closed when any child is not draft.
   Surfaced on the `/planning` drafts list (own rows only) and the bulk-review resumed-draft
   banner.
5. **Visit-detail completion** — new sections on `/visits/[id]`: report packages (every
   `visit_packages` link + snapshot, primary lozenge, zero-package preparation hint),
   lifecycle history (the append-only event stream with governed reason labels), location &
   provenance (planned pin / first pin / `visit_location_events`). Banners: return (from the
   latest `return` event; legacy `RETURNED: ` notes prefix is a display fallback for
   historical rows only), cancel (key→label, raw fallback), expired (rule reason via
   `expired_by_rule_id` → `planning_expiry_rules`, expire-event fallback). Plan section shows
   `plan_reference` + sibling-visit count + open-plan link.
6. **Bulk cancel governed reason** — `/visits` bulk cancel takes a mandatory governed
   `reason_key` (+ conditional comments) validated once up front; every cancelled row appends
   a `cancel` event with its prior inspector/window snapshot; a committed cancel whose event
   write failed is reported as `applied_no_notification` (committed-with-a-gap), never a
   clean apply. New neutral form-error codes `reasons_unavailable` / `session`.
7. **/visits ↔ /planning reconciliation (canonical §5/§6)** — `/planning` links to `/visits`
   ("Visit management — bulk actions and lenses…") and `/visits` links to `/planning`
   ("Planning — drafts and plans →") — always-visible, since the pre-existing "Create a plan"
   link only renders in the zero-row empty state.
8. **Tests** — `e2e/cd-027-visit-detail.spec.ts` **19/19 green** (14 pre-existing + 5 new M8:
   governed return (notes untouched, event + banner), legacy prefix fallback, governed cancel
   (key stored, event, final zone + Duplicate), duplicate → single-wizard routing + payload /
   draft-visit / source-event REST assertions, expired fixture `b7000000-…-004` rule
   provenance + read-only zone) and `e2e/cd-026-visit-management.spec.ts` **14/14 green**
   (10 pre-existing + 4 new M8: bulk cancel per-row key + one event per visit via the real
   board, discard own draft, discard cancels linked draft child with `discard_draft` event,
   cross-links). `npx tsc --noEmit` clean. No new migration needed — all structures already
   existed on staging.

### Gaps / deviations (M8)

- **Repackage never removes links** — `visit_packages` RLS grants no delete, so a repackaged
  visit keeps superseded links as history with the primary marker carrying current truth;
  removal needs a delete policy or definer RPC (documented in code).
- **Discard cancels draft child visits instead of deleting** — visits RLS grants no delete;
  the cancelled child + `discard_draft` event is the canonical-allowed retirement.
- **Bulk duplicate routes to bulk review with a one-factory set** — targeting criteria trees
  are not cloned (a duplicate is by definition a single target); immediate duplicates become
  standard single drafts (the immediate flow's OTP + required-package contract differs).
- **`visit.list.scope` EN default restored to the seeded "RLS-scoped — showing …" copy** —
  the M8 page edit had drifted it to "Showing … (filtered to your access)", breaking the
  pre-existing cd-026 spine test (EN strings come from code defaults, not `ui_strings`);
  fixed inside the source commit.
- **/visits export remains /planning-only** — accepted; documented.

### Blockers (M8) — pre-existing / NOT caused by M8

- **Supabase MCP unavailable** — all staging verification ran through PostgREST via
  `e2e/live-rest.ts`.
- **Shared-tree dev-server contention** — a parallel session's dev/prod servers on the same
  `apps/web` directory clobber `.next` (webpack cache ENOENT, UnrecognizedActionError, 404s).
  The green runs above executed against the parallel session's healthy dev server on
  `127.0.0.1:3000` (`PLAYWRIGHT_PORT=3000`); my own port-3100 instance was stopped and the
  port verified clear. Two staging hiccups during the session (transient
  `permission denied for function has_planning_capability`) coincided with the parallel
  session's migration activity and cleared on re-run.
- **Single staging Inspector** — unchanged; fixtures use far-future windows (+6000–18000d),
  which also keeps them inside the `/visits` board's 1000-row `window_start ASC` page cap
  (staging leftovers already extend to year 2381).

## M9 — Admin control plane: audited grant/revoke, lookups governance, expiry rules, status view, nav — 2026-07-22, on `main`, commits `cd68e3f7` + `34c73325` + `76a860cb` + `2bc30c2e`

### Built

- **Role/capability grant-revoke with self-escalation guard (PLN-REQ-004, `cd68e3f7`)** —
  `admin/access/role-capability-actions.ts` (gates `admin.access.manage` via
  `has_planning_capability`; grant validates role+permission, blocks granting
  `admin.access.manage` to a role the actor holds and any capability the actor lacks
  to a role the actor holds; revoke blocks removing `admin.access.manage` from an
  actor-held role; 23505 → idempotent ok; delete-.select() no-op detection) and
  `RoleCapabilityPanel.tsx` (role select, permission lozenges with revoke confirms,
  grant select, SoD confirm for `admin.access.manage`). `admin/access/page.tsx`
  gained a separate `canManageRoleCaps` gate; the execution module's AccessManager
  (user_roles + user_capability_grants, `has_role('security_admin')`-gated) is
  untouched — the two capability systems stay parallel, no duplicate user_roles UI.
- **role_permissions audit trigger (`34c73325`)** — migration
  `20260722120000_planning_role_permissions_audit.sql`
  (`trg_audit_role_permissions` after i/u/d → `audit_row_change()`). **APPLIED to
  staging 2026-07-22** (authored in M9, applied by parent).
- **Lookups governance UI (PLN-CON-012, `76a860cb`)** — `/admin/planning/lookups`:
  kind tabs over the 7 governed kinds, add-new + per-row inline edit (labels EN/AR,
  sort order, guided metadata flags — checked sets true, unchecked removes the key,
  unknown keys preserved, raw-JSON escape hatch validated as a plain object replaces
  all), activate/deactivate (never delete — no delete policy exists). Gate
  `planning.configure_lookups`; read-only with reason banner otherwise.
- **Expiry rules governance UI (PLN-CON-013, `76a860cb`)** — `/admin/planning/expiry`:
  one section per rule type, version table (offset, reason, notify flags, guided
  exact-match scope, effective window), enable/disable with the single-enabled
  invariant (enabling retires siblings first; honest partial-failure copy), inline
  edit, new-version form — **new versions are created DISABLED** (the admin enables
  one explicitly; nothing changes silently). Scheduler honesty note: pg_cron
  `expire_lapsed_visits_scheduled` evaluates every 15 minutes. Gate
  `planning.configure_expiry`.
- **Planning status view (PLN-CON-014, `76a860cb`)** — `/admin/planning/status`:
  read-only; renders the published `config_versions` (engine=workflow) payload as a
  data-driven state/transition table (STM-PLAN-002, STM-VIS-001..003, republish),
  with a labelled static fallback (canonical visit-lifecycle-v4) when the payload is
  unreadable; "governed by workflow configuration" banner + `/admin/workflows` link;
  planning capability map note.
- **Nav (`76a860cb`)** — three `primaryAdmin` entries (roles: `adminRoles`) in the
  Administration group: Planning Lookups (`library`), Planning Expiry Rules
  (`workflow`), Planning Status Rules (`workflow`).
- **Contract spec (`2bc30c2e`)** — `e2e/cd-044-admin-planning.spec.ts`, 10 tests:
  REST self-escalation guard (`EXE-ACCESS-SELF` on own-user grant); UI self-target
  notice + disabled controls; REST role grant/revoke on the ops user with
  `audit_events` grant→revoke pair assertion (latest-two-by-`occurred_at`);
  role-capability UI grant+revoke of `planning.export` on `inspector` with REST
  verification (audit rows NOT asserted — trigger landed after the spec);
  ops read-only roster (no management panels); lookups deactivate flow (REST-stage →
  UI deactivate → REST verify `is_active=false` and absence from active reads);
  expiry disable→re-enable of the seeded rule (restored) and new-version-created-
  disabled with the enabled version untouched; status page payload + governance
  banner + workflow link; the three nav entries.

### Test counts (M9)

- `npx tsc --noEmit` clean at every commit and after the spec edits.
- `cd-044-admin-planning.spec.ts`: **10/10 passed** (58.5s final full run; 10/10
  again in the combined final run).
- `shell-navigation.spec.ts`: **11/12 passed** — the two assertions made stale BY
  M9 (locked-admin count 7→10; "Planning" strict-mode collision) were fixed in the
  spec commit; the remaining failure ("admin primary and advanced options compose
  from existing role families") is **pre-existing** — its expected advanced list
  lacks 6 advancedAdmin entries (`execution`, `admin-home`, `inspection-items`,
  `enforcement-recommendations`, `bulk-violations`, `localization`) that exist in
  `shell-navigation.ts` since before M9 (verified at `34c73325`). Left for the
  owning module.
- Regression spot-check `cd-004-admin-control-plane-home.spec.ts`: **pre-existing
  failures** on the `/admin` evidence-spine home (table renders 0 rows) — the page
  is untouched by M9 (no M9 commit paths intersect it); left for the owning session.

### Gaps / deviations (M9)

- **Expiry new versions created disabled** — settled design: enabling is the
  deliberate, audited act that retires the previous version.
- **Lookup raw-JSON override replaces ALL metadata**; guided checkboxes remove
  unchecked known flags (absence == false for every consumer, e.g. the M8 reason
  validator).
- **role_permissions grants are per-role only** — there is no per-user planning
  capability table; execution's `user_capability_grants` is the separate execution
  system and stays AccessManager-owned.
- **Staging leftovers from the contract spec** (documented, inert):
  `return_reason.m9_test_reason` stays DEACTIVATED (rows are never deleted);
  one extra DISABLED `not_completed_at_window_end` version per spec run (the sweep
  only reads enabled versions; no delete policy exists).
- **Spec feedback-loop note** — RuleForm's ok lozenge unmounts with the form on
  success (`onDone`), so the spec asserts form detachment + REST state, not the
  success banner, for version creation.

### Blockers (M9) — pre-existing / NOT caused by M9

- **Supabase MCP unavailable** — all staging verification ran through PostgREST via
  `e2e/live-rest.ts`.
- **Stale persona storage states mid-session** — `Invalid Refresh Token` (refresh
  family revoked by parallel-session `auth.setup` activity) failed every admin UI
  test; re-running `e2e/auth.setup.ts` (5/5) and re-running immediately fixed it.
- **Shared-tree dev-server contention** — unchanged from M8; my port-3100 instance
  was stopped after the runs and the port verified clear.

## M10 — Dashboard/downstream reconciliation + notification deep-links — 2026-07-22, on `main`, commits `ac523e31` + `4a916af0`

### Built

- **Canonical counts verified, no reconciliation needed (PLN-CON-020)** — every
  counting surface derives from the canonical RLS-scoped `visits` records with
  `planning_status` filters: `/dashboard` (metrics.ts `planned`/`cancelled`/
  `todayVisits`), `/operations` + `/operations/live` (KPI strips),
  `/planning` + `/visits` (shared `lib/planning/visit-list.ts` tab counts),
  dashboard-kpi registry. No duplicate or page-specific counters exist; nothing
  to reconcile. Drafts fold into the Draft tab; `validated` displays/counts as
  Draft (never its own label).
- **Notification deep-links (PLN-REQ-009, `ac523e31`)** — NotificationBell rows
  for planning events now carry an Open link (`notificationHref`): every
  planning event's payload already includes `visit_id` (emission:
  `visits/[id]/actions.ts`, `expire_lapsed_visits` 0025/0030).
  `visit_returned` → `/visits/<id>?focus=return` (the return banner is now
  `#return-block`, outlined + scrolled into view via the new `FocusScroll`
  client component); `visit_cancelled`/`visit_expired`/`visit_republished`/
  `visit_rescheduled`/`assignment` → `/visits/<id>`. Opening a row records its
  read receipt. Shell gained the `bell.view` string and the four missing
  planning event labels (previously raw-key fallback).
- **Draft continuation** — no draft-notification concept exists; the /planning
  drafts list (M6/M7, continue + own-draft discard) is the canonical entry
  point. Documented, nothing wired.
- **Isolated widget failure (canonical §19)** — new `WidgetBoundary` class
  error boundary; the `ContextualAiPanel` on `/visits` and `/planning/bulk`
  now fails into its own honest banner instead of blanking the page. (Its
  action errors were already inline; render throws were not contained.)
- **External API posture verified (canonical §18)** — grep: no browser module
  fetches an external host; the only external fetches are server-side
  (`api/routing/eta`, Mapbox token check, DocuSign provider). Planning reads
  canonical tables only. CONTRACT_NOT_SUPPLIED lozenges render in the bulk
  criteria UI (asserted live).

### Test counts (M10)

- `npx tsc --noEmit` clean at both commits.
- New `e2e/cd-045-downstream-contract.spec.ts`: **9/9 passed** (44.8s) —
  focused return deep-link (URL + `#return-block` + lifecycle/audit integrity
  of the same record), plain expired deep-link, dashboard "Planned" == canonical
  PostgREST count for the same persona (same Riyadh scope math), inspector pool
  draft exclusion (live pool path + surface filter), CONTRACT_NOT_SUPPLIED
  lozenge, plus four source-contract assertions (deep-link map, notification
  legs per verb, boundary wiring, no browser-external fetch).
- Regression: `cd-027` **19/19**, `cd-021` **28/28**, `cd-026` **18/18**,
  `shell-navigation` 11/12 (the 1 failure is the M9-documented pre-existing
  stale advanced-admin list). Dev server stopped; ports verified clear.

### Deviations / findings (M10)

- **cd-020 "inspector class is denied the planning workspace" fails —
  pre-existing, NOT caused by M10.** The `(app)/layout.tsx` channel gate
  (`3bc1acb0`, TASK-WEB-CHANNEL-ACCESS-GATE-001) redirects field-only personas
  off every non-/field route, so the inspector never sees /planning's in-page
  "Authorized role required" EmptyState the test expects — same family as the
  documented M5 blocker. The inspector persona holds only `inspector` since
  2026-07-11 (verified). Needs a product decision: assert the redirect instead,
  or exempt /planning from the gate.
- **Inspector pool spot-check found stale seed data (absorbed, documented):**
  one seeded creator-less draft visit is RLS-readable by the inspector, and one
  stale assignment→draft link exists. Neither reaches the pool surface — the
  assignment-driven query plus `["published","expired"]` filter drops them;
  cd-045 exercises exactly that path against live data.
- **Deep-link staged notifications persist marked-read** (no delete policy on
  notifications); each run stages fresh rows with unique markers.
- Expired/cancelled deep-links land on the plain detail (only the return block
  has a focus anchor, per the task).

### Blockers (M10)

- None new. Supabase MCP still down (PostgREST via `e2e/live-rest.ts` for all
  staging checks); no migrations authored this phase.

---

## M11 — Full planning regression, publish-RPC convergence, RLS negatives

### Totals table (M11)

| Spec | Pass/Fail | Classification |
| --- | --- | --- |
| cd-020-role-advanced-management | green | inspector-denial test FIXED (channel-gate redirect precedent) — `bc99e163` |
| cd-021-bulk-targeting | 28/28 | green, no change |
| cd-022-identity-lens | 17/17 | green (re-run post-convergence-migration) |
| cd-023-immediate-authority-bar | 24/24 | notification assertion FIXED for multi-inspector pool — `3d686c35` |
| cd-025-plan-review-publish | 16/16 | zero-package publish FIXED by applied convergence migration `20260723090000` (`c7a385c9`); reviewer-publish FIXED by applied capacity-read gate migration `20260723090100` (`920fb6eb`) — applied and verified green 16/16 at M11 closure |
| cd-026-visit-management | 14/14 | green (one transient flake on discard-draft leg; green on every re-run) |
| cd-027-visit-detail | 19/19 | green, no change |
| cd-044-pre-planning-wizard | 10/10 | green, no change |
| cd-045-downstream-contract | 9/9 | green, no change |
| persona-tours | 6/6 | inspector cross-channel test FIXED (channel gate) — `0cfa757b` |
| shell-navigation | 11/12 | 1 PRE-EXISTING (stale advanced-admin list; M9-documented, `34c73325` tree) |
| shell-visual-evidence | 2/2 | disabled-nav count FIXED 7→10 (planning-caused by `76a860cb`) — `e764aadf` |
| mvp3-retrofit-regression | 3/7 | inspector containment FIXED (channel gate) — `b9117904`; 4 PRE-EXISTING external (below) |
| golden-journey | 6/6 | green (execution-line spec), no change |
| RLS negatives | 3/3 | inspector `SELECT visit_plans` → `[]`; admin `INSERT visits` → 42501; anonymous `SELECT planning_lookups` → `[]` |

Build: `npm run build` green; `npx tsc --noEmit` clean. Dev server stopped, port verified clear.

### Fixes committed (M11)

- `bc99e163` test(planning): cd-020 channel-gate denial reconciliation.
- `3d686c35` test(planning): cd-023 notification assertion robust to
  multi-inspector pool (staging now has two inspectors — persona + G10 Journey
  Inspector; assert via ops JWT that recipient == assignment.inspector_id).
- `c7a385c9` feat(planning): publish RPC convergence migration
  `20260723090000_planning_publish_capability_convergence.sql` — converges
  `20260721121000` (D-009 EXE-CAPACITY-WINDOW-FULL hook) with the two M7 edits
  from `20260721180000` (capability OR role gate; NULL-package guard).
  Root cause: 180000 was authored verbatim from 14091727 and DROPS the D-009
  hook; whichever of 121000/180000 is applied last wins wholesale. Staging ran
  121000 (probe: reviewer with planning.publish=true got
  'bulk publish unauthorized' 42501). APPLIED by owner during M11.
- `920fb6eb` feat(planning): capacity-read gate convergence migration
  `20260723090100_planning_capacity_read_gate_convergence.sql` —
  `inspector_window_capacity` caller gate also admits
  `has_planning_capability('planning.publish')`. Root cause: converged publish
  RPC died in-transaction at the D-009 capacity read for capability-gated
  publishers (dev-log: 'Window capacity is visible to Planning, Operations,
  or the inspector themself' 42501). AUTHORED, NOT YET APPLIED — until applied,
  cd-025 "reviewer persona … publishes" stays red (verified: reviewer probe
  still 42501). Byte-identical to 121000 except the one gate clause.
- `0cfa757b` test(planning): persona-tours inspector cross-channel denial via
  channel gate.
- `e764aadf` test(planning): shell-visual-evidence disabled-nav count 7→10
  (three planning admin entries from `76a860cb` are admin-gated for planner).
- `b9117904` test(planning): mvp3 inspector containment denial via channel
  gate (dropped the "Field dashboard" heading assertion — renamed by the
  consolidation merges, execution-line naming, not the security property).

### Pre-existing failures documented (M11) — NOT planning-caused

- `shell-navigation.spec.ts` "admin primary and advanced options compose from
  existing role families" — stale advancedAdmin list missing 6 entries added
  by other sessions; first verified at M9 (`34c73325` tree). Unchanged.
- `mvp3-retrofit-regression.spec.ts`:
  - "live MVP3 schema renders through all four additive control-plane routes" —
    /admin/integrations heading renamed "System Connections" → "Integration
    trust console" by the execution/G11 consolidation merges (`b825bfc6`,
    `fe4cf0e2`). Owning area: execution admin module.
  - "one shell composes MVP1/MVP2/MVP3 destinations without route loss" —
    strict-mode duplicate `nav a[href="/admin/regulations"]`: the /admin home
    quick-link button (`btn btn-primary`, execution/owner admin module) also
    matches. Owning area: execution admin home.
  - "inspector retains its canonical MVP1 workspace" — /field main heading
    renamed "Field dashboard" → "My assignments" by the dashboard-replacement
    consolidation. Owning area: execution field module.
  - "reviewer retains its canonical MVP1 workspace" — /reviews "Level 2 review
    queue" heading likewise renamed by consolidation. Owning area: execution
    review module.
- `cd-004` /admin home evidence-spine failures (carried from earlier phases):
  /admin renders a 0-row table; execution/owner module, untouched by planning.

### Blockers / requests (M11)

- ~~Owner action required: apply 20260723090100~~ RESOLVED at M11 closure —
  owner applied the capacity-read gate migration; cd-025 re-run green 16/16
  (reviewer persona publishes through the capability gate + D-009 hook).
- Supabase MCP still down; all staging checks via PostgREST
  (`e2e/live-rest.ts` patterns).
