# SAQEEL Planning — Database Schema Contract

**For frontend / server-action developers.** This is the API contract for the
Planning module database foundation. Everything here is additive: every
pre-existing table, column, enum value, policy, RPC and trigger is unchanged.

Introduced by migrations:

| File | Contents |
|---|---|
| `supabase/migrations/20260721030000_planning_capabilities.sql` | Capabilities, role grants, access-class helpers, new RLS policies |
| `supabase/migrations/20260721030100_planning_canonical_structures.sql` | Lookups, references, draft payload, packages, lifecycle/location events, expiry rules, rule-driven lapse engine |

---

## 1. Capability model

### Access classes — `planning_access_class() returns text`

SECURITY DEFINER, STABLE, executable by `authenticated`. Returns exactly one of:

| Class | Definition |
|---|---|
| `'admin'` | User holds any role with `roles.is_admin = true` (admin wins over inspector) |
| `'inspector'` | User holds the `inspector` role and is not admin |
| `'business_staff'` | **Default** — any other authenticated user, including users with no role rows |
| `'anonymous'` | No session (`auth.uid() is null`) |

### Capability check — `has_planning_capability(text) returns boolean`

SECURITY DEFINER, STABLE, executable by `authenticated`. `true` when:

1. the user has an **explicit grant** (`user_roles → role_permissions → permissions`,
   same resolution as the existing `has_permission(text)`), OR
2. the capability is in the user's **class default set**:

| Capability | business_staff | inspector | admin |
|---|:---:|:---:|:---:|
| `planning.view` | ✓ | — | — |
| `planning.create` | ✓ | — | — |
| `planning.create.single` | ✓ | — | — |
| `planning.create.bulk` | ✓ | — | — |
| `planning.create.immediate` | — (explicit only) | ✓ | — |
| `planning.edit_draft` | ✓ | — | — |
| `planning.publish` | ✓ | — | — |
| `planning.manage` | ✓ | — | — |
| `planning.cancel` | ✓ | — | — |
| `planning.reassign` | ✓ | — | — |
| `planning.reschedule` | ✓ | — | — |
| `planning.export` | ✓ | — | — |
| `planning.manual_factory` | **explicit grant only** | explicit only | explicit only |
| `planning.correct_location` | **explicit grant only** | explicit only | explicit only |
| `planning.override_assignment` | **explicit grant only** | explicit only | explicit only |
| `planning.configure_workflow` | — | — | ✓ |
| `planning.configure_lookups` | — | — | ✓ |
| `planning.configure_expiry` | — | — | ✓ |
| `admin.access.manage` | **explicit grant only** (seeded to `security_admin`) | — | — |

High-impact capabilities (`planning.manual_factory`, `planning.correct_location`,
`planning.override_assignment`) and `admin.access.manage` **never** resolve
through a class default — they require an explicit `role_permissions` row.

### Seeded grants (all additive; nothing revoked)

- `planner`, `reviewer`, `ops`, `leadership` → the full business set
  (`view`, `create`, `create.single`, `create.bulk`, `edit_draft`, `publish`,
  `manage`, `cancel`, `reassign`, `reschedule`, `export`).
- `planner`, `ops` → also `planning.create.immediate` (preserves the existing
  planner-mode `create_immediate_visit` path; the business-staff class default
  deliberately excludes it).
- `inspector` → `planning.create.immediate` only.
- All six admin roles (`compliance_admin`, `form_admin`, `workflow_admin`,
  `risk_owner`, `gis_admin`, `security_admin`) → `planning.configure_workflow`,
  `planning.configure_lookups`, `planning.configure_expiry`.
- `security_admin` → `admin.access.manage`.
- **No role is seeded** for the three high-impact capabilities.

### New RLS policies (existing policies untouched — legacy `planner`/`ops` paths keep working)

| Table | Policy | Cmd | Predicate |
|---|---|---|---|
| `visit_plans` | `plans_read_capability` | SELECT | `has_planning_capability('planning.view')` |
| `visit_plans` | `plans_write_capability` | INSERT | `has_planning_capability('planning.create')` |
| `visit_plans` | `plans_update_capability` | UPDATE | `has_planning_capability('planning.edit_draft')` |
| `visits` | `visits_read_capability` | SELECT | `has_planning_capability('planning.view')` |
| `visits` | `visits_write_capability` | INSERT | `has_planning_capability('planning.create')` |
| `assignments` | `assignments_read_capability` | SELECT | `has_planning_capability('planning.view')` |
| `assignments` | `assignments_write_capability` | INSERT | `planning.manage` OR `planning.publish` |
| `assignments` | `assignments_update_capability` | UPDATE | `planning.manage` OR `planning.publish` |

RLS policies are permissive and OR-ed: these widen access for business staff;
they never narrow anyone who had access before.

---

## 2. New/changed data structures

### `planning_lookups` — governed reference data

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `kind` | text NOT NULL | one of the kinds below |
| `key` | text NOT NULL | stable machine key |
| `label_en` | text NOT NULL | |
| `label_ar` | text | null = falls back to EN |
| `is_active` | boolean NOT NULL | default `true` |
| `sort_order` | int NOT NULL | default `0` |
| `metadata` | jsonb NOT NULL | default `{}` — eligibility flags, e.g. `{"manual_entry_allowed":true,"attachment_required":false,"location_required":true}` |
| `created_at` / `updated_at` | timestamptz NOT NULL | `updated_at` maintained by `trg_planning_lookups_touch` |

UNIQUE `(kind, key)`. Seeded kinds and keys:

- `visit_type`: `periodic`, `follow_up`, `complaint`
- `visit_mode`: `physical`, `virtual`, `administrative`
- `priority`: `low`, `medium`, `high`, `urgent`
- `return_reason`: `inspector_unavailable`, `factory_not_ready`, `wrong_scope`, `duplicate`, `other`
- `cancellation_reason`: seeded **from `engine_settings.field.cancellation_reasons`** (`factory_closed`, `access_denied`, `rep_unavailable`, `safety_risk`, `wrong_location`, `other`), EN/AR labels preserved
- `manual_entry_reason`: `not_found_in_registry`, `unlicensed_activity`, `new_establishment`, `other`
- `assignment_override_reason`: `workload_balance`, `regional_expertise`, `inspector_request`, `other`

RLS: read any authenticated; insert/update `has_planning_capability('planning.configure_lookups')`. Audited via `trg_audit_planning_lookups`.

### `visit_plans` — new columns

| Column | Type | Notes |
|---|---|---|
| `plan_reference` | text NOT NULL UNIQUE | default `'BP-' \|\| nextval('plan_reference_seq')`; existing rows backfilled |
| `draft_payload` | jsonb NOT NULL default `{}` | criteria tree, selection, per-row config/assignments, packages, notes, validation |
| `draft_version` | int NOT NULL default `0` | bump on every draft save |
| `source_channel` | text | e.g. `web`, `api` |
| `archived_at` | timestamptz | soft-delete / draft discard; NULL = active |

### `visits` — new columns

| Column | Type | Notes |
|---|---|---|
| `visit_reference` | text NOT NULL UNIQUE | default `'V-' \|\| nextval('visit_reference_seq')`; existing rows backfilled |
| `source_channel` | text | |
| `internal_reference` | text | free internal code |
| `original_lat` / `original_lng` | numeric(10,7) | first/authoritative pin; backfilled from `factories.official_lat/lng` where null |
| `expired_by_rule_id` | uuid NULL → `planning_expiry_rules(id)` | stamped by the lapse engine |

`visits.package_version_id` is **unchanged** and remains the first/primary package.

### `visit_packages` — packages attached to a visit

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `visit_id` | uuid NOT NULL → `visits(id)` | |
| `package_version_id` | uuid NOT NULL → `package_versions(id)` | |
| `snapshot` | jsonb | frozen package summary at link time |
| `added_by` | uuid → `profiles(user_id)` | |
| `added_at` | timestamptz NOT NULL | default `now()` |

UNIQUE `(visit_id, package_version_id)`. Backfilled from `visits.package_version_id`.
RLS: read = `planning.view` OR legacy planning roles OR own assignment;
insert/update = `planning.create` OR `planning.edit_draft`. Audited.

### `visit_lifecycle_events` — append-only lifecycle stream

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `visit_id` | uuid NOT NULL → `visits(id)` | |
| `event_type` | text NOT NULL | CHECK in `return`, `cancel`, `republish`, `expire`, `duplicate`, `reschedule`, `reassign`, `discard_draft` |
| `reason_key` | text | `planning_lookups` key where governed |
| `comments` | text | |
| `actor` | uuid | NULL = system (same convention as `audit_events`) |
| `previous` | jsonb NOT NULL default `{}` | prior-state snapshot |
| `created_at` | timestamptz NOT NULL | default `now()` |

Backfilled: `returned` visits with `notes LIKE 'RETURNED: %'` → `return` events
(`reason_key` = text after the prefix); `cancelled` visits with
`cancellation_reason` → `cancel` events.
RLS: read like `visits`; insert via `planning.manage`/`cancel`/`reassign`/
`reschedule`/`edit_draft` capabilities (or SECURITY DEFINER RPC paths).
**No update/delete policies** — append-only. Audited.

### `visit_location_events` — per-visit location provenance stream

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `visit_id` | uuid NOT NULL → `visits(id)` | |
| `lat` / `lng` | numeric(10,7) NOT NULL | |
| `source` | text NOT NULL | CHECK in `License`, `Planner`, `Inspector`, `Integration`, `Historical Inspection` |
| `actor` | uuid | |
| `note` | text | |
| `created_at` | timestamptz NOT NULL | default `now()` |

Backfilled from `visits.planner_lat/lng` (`visit_location_source` mapping:
`official`→`License`, `manual`→`Planner`). `visits.planner_lat/lng` stays the
current planned pin; `visits.original_lat/lng` preserves the first pin.
RLS: read like `visits`; insert via `planning.correct_location` OR
`planning.manage`. Audited.

### `planning_expiry_rules` — configurable expiry rule families

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `rule_type` | text NOT NULL | CHECK in `no_acknowledgement`, `no_execution_date`, `no_execution_start`, `not_completed_at_window_end` |
| `enabled` | boolean NOT NULL | default `true` |
| `scope` | jsonb NOT NULL default `{}` | optional exact-match filters: `visit_type`, `execution_mode`, `priority` |
| `offset_minutes` | int NOT NULL default `0` | grace period added to the rule's time basis |
| `reason` | text | recorded on the lifecycle `expire` event |
| `notify_plan_creator` / `notify_inspector` | boolean NOT NULL | default `true` |
| `version` | int NOT NULL default `1` | |
| `effective_from` / `effective_to` | timestamptz | `effective_from` default `now()` |
| `created_at` | timestamptz NOT NULL | |

UNIQUE `(rule_type, version)`. Seeded with ONE enabled rule reproducing the
pre-existing behavior: `not_completed_at_window_end`, offset `0`,
reason `'Window elapsed before inspection started'`, both notify flags on.
RLS: read any authenticated; insert/update `has_planning_capability('planning.configure_expiry')`. Audited.

---

## 3. The lapse engine (unchanged entry points, rule-driven core)

- **`expire_lapsed_visits()`** (auth-scoped, page-load) and
  **`expire_lapsed_visits_scheduled()`** (unscoped, pg_cron `*/15 * * * *`)
  keep their exact signatures, grants and behavior.
- **`_expire_lapsed_visits_core(text)`** is redefined to loop over **enabled**
  `planning_expiry_rules` (within effective dates):

  | Rule | Candidate semantics |
  |---|---|
  | `not_completed_at_window_end` | `published` AND `window_end + offset < now()` AND no started inspection — identical to the old single condition |
  | `no_execution_start` | `published` AND `operational_state = 'new'` AND `window_start + offset < now()` AND no started inspection |
  | `no_execution_date` | `published` AND no scheduled execution date — **dormant today** (`window_start` is NOT NULL in the current schema); predicate implemented literally |
  | `no_acknowledgement` | `published` AND assignment still `status='assigned'` AND `window_start + offset < now()` AND no started inspection |

- All rules preserve the 0030 exclusion: inspector-created immediate visits
  (`visit_plan_id IS NULL AND immediate_creator_role = 'inspector'`) never expire.
- For each newly expired visit: `planning_status → 'expired'`,
  `expired_by_rule_id` stamped, a `visit_lifecycle_events` row
  (`event_type='expire'`, `reason_key=rule_type`, `comments=rule.reason`,
  `actor=NULL`, `previous` carries rule id), and the **same notification shapes
  as before** (`visit_expired` inapp/delivered to the assigned inspector and to
  the plan creator with `'planner': true`), gated by the rule's notify flags.
- Idempotent: re-runs expire nothing already expired (they leave the
  `published` candidate set on the first pass). Row audit continues via the
  existing `trg_audit_visits` trigger.

---

## 4. Indexes added

`visits(planning_status)` · `visits(window_end) WHERE planning_status='published'` ·
`visit_plans(status) WHERE archived_at IS NULL` · `visit_packages(visit_id)` ·
`visit_lifecycle_events(visit_id)` · `visit_location_events(visit_id)` ·
`planning_lookups(kind) WHERE is_active` · unique `visit_plans(plan_reference)` ·
unique `visits(visit_reference)`.

## 5. Usage notes for later phases

- Read a plan/visit by its stable business key (`plan_reference` / `visit_reference`),
  never by display-only fields. Both are filled by column defaults — plain
  INSERTs (including the existing publish RPCs) need no change.
- Draft editing: write `draft_payload` and bump `draft_version`; discard =
  set `archived_at` (+ a `discard_draft` lifecycle event on related visits when
  the actions layer lands).
- Any lifecycle transition (return/cancel/republish/reschedule/reassign/
  duplicate/discard) must append a `visit_lifecycle_events` row with a governed
  `reason_key` from `planning_lookups`.
- Location changes append `visit_location_events` rows; update
  `visits.planner_lat/lng` as the current pin, never rewrite history.
- New expiry behavior is configuration: admins enable/version rows in
  `planning_expiry_rules`; no code change or new scheduler is needed.
