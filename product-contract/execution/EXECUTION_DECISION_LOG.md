# Execution Module — Decision Log

- Task: TASK-EXECUTION-MODULE-001 (G11 Execution module canonical reconciliation)
- Authority: SAQEEL-EXE-CANONICAL-PLAN v1.0 (2026-07-21)
- Phase: 1 — shared contracts (migration `supabase/migrations/20260721090000_execution_canonical_contracts.sql`, `apps/web/src/lib/execution/*`)
- Phase: 2A — admin execution control plane (`apps/web/src/app/admin/execution/*`, migration `supabase/migrations/20260721100000_execution_admin_audit.sql`)
- Phase: 2B — governed role/capability grants (`apps/web/src/app/admin/access/*`, migration `supabase/migrations/20260721110000_execution_access_grants.sql`)

## D-001 — Daily-cap counting semantics

- A visit counts against an inspector's daily cap when ALL of the following hold:
  - the visit is assigned to that inspector (`assignments.inspector_id`);
  - `visits.planning_status = 'published'`;
  - the Execution Date matches: `coalesce(visits.execution_date, visits.window_start::date) = p_date` (Pre-Execution-selected Execution Date wins; the window start is the fallback until one is selected);
  - the linked inspection has NOT reached submitted-or-later: `coalesce(inspections.lifecycle_status, 'new') NOT IN ('submitted','under_review','approved','rejected','cancelled')` — submitted-or-later counts as completed and frees capacity.
- Cancelled visits never count: cancellation sets `planning_status = 'cancelled'`, excluding the row by the first predicate.
- Cap default is 10 (business-supplied), Admin-configurable via `engine_settings.execution.settings.daily_visit_cap`; the RPC falls back to 10 when the setting is absent.
- One shared server-side calculation (`public.inspector_daily_capacity` RPC); Planning publish and Pre-Execution wire to the same service in later phases. Callers must be planner, ops, or the inspector themself; anything else raises `insufficient_privilege`.

## D-002 — Stored 'prepared' ≡ canonical 'Ready for Execution'

- The canonical Operational State vocabulary is `new → ready_for_execution → on_the_way → arrived → executing → submitted → under_review`; virtual visits skip `on_the_way`/`arrived`.
- The persisted enum keeps its existing values; the stored value `'prepared'` remains the persisted Ready-for-Execution marker until writers migrate. Projection happens read-side via `projectOperationalState` (`apps/web/src/lib/execution/state-machine.ts`).
- No destructive rewrite of stored values. The enum was extended additively with `'under_review'` only.
- Inspection lifecycle is likewise a backward-compatible projection: new `inspections.lifecycle_status` column (backfilled and trigger-synced from the legacy free-text `status`); the legacy column and all existing read paths are untouched. Planning visit status NEVER gains `approved`.

## D-003 — Capability model (capabilities, not new roles)

- Implemented as `capabilities` + `role_capabilities` seed tables (22 capability keys; default role mapping) plus the `public.has_capability` RPC (security definer, `set search_path = ''`).
- Legacy roles are untouched and act as compatibility aliases: guards evaluate capabilities; role→capability resolution goes through `role_capabilities`.
- Catalogue tables are RLS-enabled, SELECT-only for authenticated; no write policies for app roles in Phase 1 — the governed grant/revoke UI is a later phase.
- `apps/web/src/lib/execution/capabilities.ts` mirrors the seed mapping for UI affordance only; the server RPC + RLS remain authoritative, and menu visibility is never authorization.

## D-004 — engine_settings writes stay direct-but-audited (no maker-checker)

- Phase 2A (`/admin/execution`) writes governed engine keys directly from capability-gated server actions: caller verified, `has_capability` RPC per section, payload validation, read-modify-write of only the governed keys, `version_label` bump + `updated_by`, and an `audit_events` row (`object_type 'engine_settings'`, `action 'execution_config_update'`, `requirement_refs ['EXE-ADMIN']`, before/after of the governed keys only).
- Maker-checker is deliberately NOT added to `engine_settings`: the platform precedent (`/admin/risk`, SCR-ADM-060) is a direct audited write, and the `engine_write` RLS policy (0002_rbac_audit.sql) already scopes updates to the admin role set. Layering a request/approval flow on top would change existing RLS and lifecycle semantics for every engine row, not just execution. Revisit if the sponsor requires dual control on configuration.
- Row-level audit: `engine_settings` already carries `trg_audit_engine_settings` from 0002_rbac_audit.sql; migration `20260721100000_execution_admin_audit.sql` verifies and idempotently re-attaches it if drifted. The `capabilities`/`role_capabilities` catalogues get NO row trigger: the original `audit_row_change` (0002) dereferences `new.id`, which fails on id-less tables; only the later hardened redefinition tolerates them. Catalogue grant/revoke is a later-phase governed flow; app-level `audit_events` rows are the record for this phase. (`audit_events.object_id` is `uuid`, so engine names travel inside before/after state rather than a fabricated uuid.)

## D-005 — offline retry/autosave values left unset (platform default)

- `engine_settings.execution.offline.max_sync_attempts` and `offline.autosave_interval_s` are NOT business-supplied, so Phase 2A ships them unset. Unset is an honest state: the current platform behavior applies and no number is invented.
- The control plane presents them as optional governed overrides — labelled "platform default" while unset, editable with validated bounds (1–100 attempts; 5–600 seconds) once the business supplies values. When every value is cleared the governed key is removed so absence stays truthful.
- This is the permitted configurable boundary of SAQEEL-EXE-CANONICAL-PLAN v1.0 §2: administration may govern the values, but their absence must fail closed rather than be fabricated.

## D-006 — grant-only capability overrides; guarded single-authority access changes

- Phase: 2B — governed role/capability grant-revoke (migration `supabase/migrations/20260721110000_execution_access_grants.sql`, `apps/web/src/app/admin/access/*`).
- **Grant-only overrides in Release 1.** `user_capability_grants` layers positive per-user grants ON TOP of role defaults; `has_capability` is the UNION of `user_roles → role_capabilities` and direct grants. There are deliberately NO negative grants (revoke-override semantics): a user keeps every capability their roles provide, and an override can only add. Revoking role-derived access happens by revoking the role, never by masking it. Negative grants would make the effective-access explainer non-conclusive (a capability could be present-yet-denied) and are deferred until a sponsor-approved contract defines their semantics.
- **Guards.** Every access RPC carries the self-escalation guard (`p_user` may never equal `auth.uid()` — no granting to or revoking from yourself, stable token `EXE-ACCESS-SELF`) and `admin_revoke_role` additionally carries the sole-security_admin guard (revoking `security_admin` is refused, token `EXE-ACCESS-LAST-SECURITY-ADMIN`, when the target is the last remaining holder of the role). All four RPCs are idempotent: granting an existing grant or revoking an absent one is a no-op success and writes no audit row.
- **security_admin remains the grant authority.** No new top-level role was created (D-003: capabilities instead of new roles); the four RPCs require `has_role('security_admin')` and both grant tables keep zero direct write policies — the security-definer RPCs are the only write path, so RLS stays authoritative and menu visibility is never authorization.
- **Audit.** Every actual change appends `audit_events` (`object_type 'user_roles'/'user_capability_grants'`, `object_id null` — the grant key is a composite pair, not a uuid, so it travels in before/after state per the D-004 precedent — `requirement_refs ['EXE-ACCESS']`). `user_roles` row writes are additionally covered by the pre-existing `trg_audit_user_roles` trigger; the app-level rows carry the governed action and requirement traceability.
- **Maker-checker deferred as a sponsor decision.** An approval workflow beyond the single-security_admin action (dual control for access changes) is a policy decision, not an engineering default — consistent with D-004 for configuration writes. The seams the page previously declared (separation-of-duties, self-escalation guard, approval + audit path) are now realized except the approval step, which stays a disclosed boundary until the sponsor requires it.

