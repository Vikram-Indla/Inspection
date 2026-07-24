# Current Data Quality Report — Live Inspection Staging Database

## Scope and method

- Read-only discovery only. Every query below was a `SELECT`; no DDL/DML, no truncate/reset/seed/migrate was run against this project in this pass.
- Target: Supabase project ref `iiozvqntawxfwbgffzqu` ("Vikram-Indla's Project"), status `ACTIVE_HEALTHY`, region `ap-northeast-2`, Postgres 17.6.1. Confirmed as the environment repo docs (`product-contract/evidence/EVIDENCE_STATUS.md` and related evidence files) already reference as Inspection staging; this is **not** a production project and not the Catalyst project.
- Access path: `https://api.supabase.com/v1/projects/iiozvqntawxfwbgffzqu/database/query` using the read-only Management API PAT from macOS keychain (`supabase-pat`), never printed in this report.
- Method: enumerated all 143 `public` schema tables, took a full row-count pass across all of them, then ran targeted profiling queries per the required checklist (row counts, null rates, duplicate natural keys, impossible dates, broken foreign keys, generic display names, placeholder text, fixture/test markers, factory/product coherence, coordinates, empty dashboard sources, orphaned visits/inspections/reviews, submitted-without-version, approved-without-review, evidence-without-linked-object, users-without-profile/role, role-labels-as-names).
- Every numbered finding below has a matching row in `CURRENT_DATA_QUALITY_FINDINGS.csv` (finding IDs `DQ-001` … `DQ-020`).

## Headline numbers

| Metric | Value |
|---|---|
| Public schema tables enumerated | 143 |
| Tables with ≥1 row | 88 |
| Tables with 0 rows | 55 |
| Profiles (personas) | 8 |
| auth.users | 8 (1:1 with profiles; no orphans either direction) |
| Factories | 1,946 |
| Industrial licenses | 1,071 |
| Commercial registrations | 1,340 |
| Visits | 1,460 |
| Visit plans | 648 |
| Assignments | 1,207 |
| Inspections | 274 |
| Submission versions | 281 |
| Reviews | 197 |
| Evidence | 142 |
| Findings | 3 |
| Violations | 263 |
| Audit events | 22,524 |
| Notifications | 1,301 |
| Distinct real data-quality defects logged | 17 (`DQ-001`…`DQ-017`) |
| Positive/clean-baseline findings logged | 3 (`DQ-018`…`DQ-020`, informational) |

## Findings by required category

### 1. Role labels used as person names (severity: HIGH — `DQ-001`, `DQ-002`)

Of the 8 live profiles, only **one** — عبدالله محمد القحطاني (`inspector@mim.gov.sa`) — is a genuine bilingual person name. The other seven are role-derived labels:

- `A. Planner` — `planner@mim.gov.sa`
- `B. Business Approver` — `approver@mim.gov.sa`
- `C. Compliance Admin` — `admin@mim.gov.sa`
- `O. Operations` — `ops@mim.gov.sa`
- `R. Al-Otaibi` — `reviewer@mim.gov.sa` (surname present but the account/email is role-scoped)
- `G10 Journey Inspector` (×2, different `user_id`s, emails carrying a Unix-millisecond timestamp suffix — `g10-inspector-1784679710389@mim.gov.sa` and `g10-inspector-1784690981694@mim.gov.sa`)

This is the exact anti-pattern the seeding blueprint (Section E) flags as unacceptable for QA acceptance ("no role label is used as a person name"). The two `G10 Journey Inspector` rows are duplicate test-run artifacts from an automated journey/G10 verification run, left live with `region`/`org_scope` both null.

### 2. Fixture/test markers left in production-shaped tables (severity: HIGH/MEDIUM — `DQ-003`–`DQ-006`)

Task-ID-prefixed verification fixtures from prior development/E2E work remain live and commingled with the senaei-sourced factory population:

- 26 `factories.name` values match test/fixture patterns, e.g. `CD-023 Registered Fixture CD023-CR-1783971905154`, `CD-023 Booking Fixture 1783971927151` (repeated ~12 times each), `F360 Runtime 016 - J12 outbox isolation fixture`, `Print Fixture Verification Factory`, `PLN-J expiry fixture <timestamp>` (×6).
- 8 `visits.notes` values are explicit fixture markers, e.g. `TASK-DASH-KPI-SEED-001 · <state> · deterministic verification fixture` (6 rows on hand-authored sequential IDs `b7000000-0000-4000-8000-00000000000{1..6}`) and `DEC-028 print-fixture verification — many-violations/long-notes evidence`.
- `factories.source` carries the literal value `verification_fixture` for 7 rows, sitting in the same enum-like column as production provenance values `senaei` (1,644), `immediate_manual` (289) and `manual` (6) — there is no separate `is_synthetic`/`seed_batch_id` flag to segregate or clean these up, exactly the gap the blueprint's provenance-field recommendation (Section H) is meant to close.
- 11 factories, 7 visits and 3 inspections use a hand-authored sequential-ID pattern (`^[0-9a-f]{8}-0000-4000-8000-…`) rather than random UUIDs, marking them as manually seeded verification rows indistinguishable from real records without this pattern search.

### 3. Broken foreign keys / orphans (severity: HIGH for 2 concrete rows, otherwise clean — `DQ-011`, `DQ-012`, `DQ-013`, `DQ-018`)

Referential integrity is **largely intact**: zero orphans were found across visit→factory, inspection→visit, assignment→visit/inspector, evidence→inspection, finding/violation/checklist-response→inspection, review→inspection/submission_version, and submission_version→inspection (15 FK relationships checked, `DQ-018`).

Two concrete workflow-integrity violations were found on the same record:

- **`DQ-011`** — inspection `97000000-0000-4000-8000-000000000002` has `status=approved`, `submitted_at=2026-07-04`, but **zero** rows in `submission_versions`. The immutable-version-before-approval contract was bypassed.
- **`DQ-012`** — the same inspection has **zero** rows in `reviews` at all, meaning the `approved` status was set without a governing review decision — a direct violation of "never mutate workflow status directly; use canonical transitions and guards."

`DQ-013` — `evidence.linked_type='arrival'` rows (32 total) all correctly carry a populated `visit_id`, but only 20 of the 32 resolve `linked_id` to a `geo_events` row; the other 12 don't resolve against `geo_events` or `journey_sessions` either, leaving ambiguous secondary linkage (not a hard orphan since `visit_id` anchors the row, but worth a business decision on what `linked_id` should mean for `arrival` evidence).

### 4. Factory/product/material coherence (severity: HIGH — `DQ-007`, `DQ-008`, `DQ-009`, `DQ-010`)

- Only **4 of 1,946 factories** (0.2%) have any row in `factory_products` or `factory_materials`. The blueprint's "products that match the sector / raw materials that match the products" coherence requirement is untestable at scale because the linking data essentially doesn't exist yet.
- **100% of factories** have `legal_name`, `license_status`, `cr_status` and `license_holder` all null, and 1,941/1,946 have `employees_total` null — despite 1,071 `industrial_licenses` and 1,340 `commercial_registrations` rows existing that could supply these fields. These columns exist on `factories` but were never backfilled/joined.
- `factory_code` is null for 295/1,946 (15%), `license_number` null for 764/1,946 (39%), `cr_number` null for 253/1,946 (13%). No duplicate `factory_code`/`cr_number`/`license_number` values were found among populated rows (0 duplicates each) — the identifier space itself is clean, just sparsely populated.
- 410/1,946 factories (21%) have null `official_lat`/`official_lng`. No suspicious `(0,0)` or out-of-KSA-bounding-box coordinates were found among the populated rows.

### 5. Empty dashboard sources (severity: HIGH — `DQ-014`, `DQ-015`)

`dashboard_config_heads`, `dashboard_config_parameters` and `dashboard_config_versions` are all **0 rows**, even though `mvp3_kpi_definitions` (28 rows) and the underlying fact tables (22,524 audit events, 1,460 visits, 274 inspections, 197 reviews) exist. There is currently no governed, published dashboard configuration for the KPI engine to calculate from — a direct violation of the blueprint's "seed source facts and let the existing KPI engine calculate them" model, because the engine has nothing published to calculate against.

More broadly, 55 of 143 public tables (38%) are at 0 rows, including several the blueprint's scenario catalogue (Section G) requires populated: `cancellation_requests`, `incident_reports`, `objections`, `risk_runs`/`risk_simulations`/`risk_variables`, `sla_calendars`/`sla_timers`, `self_assessments`, `penalty_notices`, `factory_locations`, `visit_attachments`, `correction_evidence`, `bulk_violation_batches`/`bulk_violation_batch_items`. See `MIGRATION_STATE_MATRIX.csv`/`SCHEMA_CATALOG.csv` (already produced in the earlier discovery pass) for the full canonical+applied-but-empty classification.

### 6. Users without profiles/roles (severity: clean — informational)

0 orphans in either direction: every `auth.users` row has a matching `public.profiles` row and vice versa (8 = 8). Every profile has at least one `user_roles` row.

### 7. Generic display names / placeholder text elsewhere

No placeholder text (`asdf`, `lorem`, `xxx`, `tbd`, `dummy`, `placeholder`, generic `test`) was found in `findings.description`, `evidence.evidence_note`, or `reviews.decision_reason` — the placeholder/fixture problem is concentrated in `profiles.full_name`, `factories.name`, `factories.source` and `visits.notes` (see above), not spread through execution/review free-text fields.

### 8. Dates, coordinates and other integrity checks (severity: clean — `DQ-019`, `DQ-020`)

No impossible dates were found: zero `visits` with `window_end < window_start`, zero `industrial_licenses`/`commercial_registrations` with `expiry_date < issue_date`, zero `inspections` with `started_at > submitted_at`. No coordinates outside a Saudi Arabia bounding box (~16–32.5°N, 34–56°E) or at exactly `(0,0)` were found across `factories`, `geo_events`, `visits.planner_lat/lng`, or `evidence.captured_lat/lng`.

### 9. Coverage gaps worth flagging for seed design (severity: MEDIUM/LOW — `DQ-016`, `DQ-017`)

- `notification_preferences` has only 1 row against 8 profiles — 7 of 8 personas have no explicit preference row, meaning per-persona notification-suppression scenarios can't be exercised as distinct cases today.
- 394 of 648 `visit_plans` (61%) remain `status=draft`; plan-level status is limited to `draft`/`published` with no distinct archived/expired state observed at the plan level, and stale test drafts are not currently distinguishable from genuine in-progress drafts without a seed registry tag.

## What this means for seeding (non-binding cross-reference to Section I/J of the blueprint)

This pass did not fix, remove, or reclassify any of the above — per instructions, findings are reported only. The concrete implications for the seeder design (already scoped in the separately-produced `SEEDER_IMPLEMENTATION_PLAN.md`/`SEED_VALIDATION_PLAN.md`) are:

1. A seed-registry/`seed_batch_id` mechanism is necessary before any new seeding, specifically because existing ad-hoc fixtures (`DQ-002`–`DQ-006`) have no such tag today and cannot be safely cleaned up as a batch.
2. The two workflow-integrity violations (`DQ-011`, `DQ-012`) should be treated as a pre-existing defect to resolve or explicitly quarantine, not as a pattern to replicate when seeding new approved inspections.
3. Factory/product/material seeding (Section F of the blueprint) has essentially a green field to work with — real coverage is 0.2%, so any new seeded coherence rules will not conflict with existing data at meaningful scale.
4. Dashboard config seeding (Section I module `12-operations-and-dashboard-history.ts`) must include `dashboard_config_parameters`/`versions`/`heads` rows, not just fact-table history, or the KPI engine will remain unable to render anything regardless of how much history is seeded underneath it.

## Full finding list

See `CURRENT_DATA_QUALITY_FINDINGS.csv` for all 20 rows (`DQ-001`…`DQ-020`) with exact query basis, counts/samples, severity and evidence notes.
