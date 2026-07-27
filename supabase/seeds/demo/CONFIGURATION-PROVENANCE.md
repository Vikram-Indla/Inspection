# Demo configuration — provenance ledger

**Status: SYNTHETIC DEMO DATA. NOT APPROVED POLICY.**

This document is the auditable register of every governed value invented by
`supabase/seeds/demo/05-configuration.sql`. Seeding it was **explicitly authorised by
the Product Owner** for the demo branch, as a deliberate exception to the repository
rule (CLAUDE.md §10, `.claude/rules/governance.md`) that an absent governed value must
render as *Not configured* / *Unavailable* / *Insufficient evidence* rather than being
invented.

Nothing below has been through a governance decision, a committee, a legal review, or
the maker-checker publication route. Every row it describes exists **only** to stop
demo surfaces rendering empty states.

| Field | Value |
| --- | --- |
| Applied to | Supabase project `iiozvqntawxfwbgffzqu` (staging) |
| Applied on | 2026-07-27 |
| Version stamp | `demo-2026-07` |
| Demo time anchor | `2026-07-27 12:00:00+03` (fixed; never `now()`) |
| Authorisation | Product Owner, demo branch only |
| Re-runnable | Yes — deterministic md5 UUIDs + `ON CONFLICT DO NOTHING` / `NOT EXISTS` |
| Destructive | No — nothing is deleted, truncated, or overwritten except the single guarded `engine_settings` risk row |

## How to spot demo data at a glance

| Signal | Where |
| --- | --- |
| `version_label = 'demo-2026-07'` | `sla_calendars`, `notification_rules`, `risk_models`, `engine_settings` |
| `model_version = 'demo-2026-07'` | `factory_risk_snapshots` |
| `'Demo · '` / `'تجريبي · '` prefix | every `name`, `label`, `title`, `template`, `reason` |
| `"demo": true` + `"provenance": "…"` | every JSONB payload, definition, snapshot and result |
| `code LIKE 'PKG-DEMO-%'` | demo inspection packages |
| `layer_key LIKE 'demo_%'` | demo GIS layers |
| `idempotency_key LIKE 'demo-risk-run-%'` | demo risk runs |

---

## 1 · SLA — working calendars

Nothing in `sla_calendars` existed before this seed, which is why `/admin/workflows`
reported *"No SLA calendar is configured … (DEC-003)"* and every timer stayed
`pending_activation`.

**Invented: the working week, the working hours, and the holiday set.**

| Calendar | `activation_authorized` | Working days | Hours | Holidays (invented set) |
| --- | --- | --- | --- | --- |
| Demo · Ministry standard working calendar (Sun–Thu) | **true** | Sun, Mon, Tue, Wed, Thu (`{0,1,2,3,4}`) | 08:00–16:00 Asia/Riyadh | 2026-02-22 (Founding Day); 2026-03-19 → 2026-03-23 (Eid al-Fitr); 2026-05-26 → 2026-05-30 (Eid al-Adha); 2026-09-23 (National Day) |
| Demo · Extended enforcement-surge calendar (Sat–Thu) | **true** | Sat–Thu (`{6,0,1,2,3,4}`) | 07:00–19:00 Asia/Riyadh | 2026-02-22; 2026-03-19/20; 2026-05-26/27; 2026-09-23 |
| Demo · Ramadan reduced-hours calendar | **false** | Sun–Thu | 09:00–14:00 Asia/Riyadh | 2026-02-22; 2026-03-19 → 2026-03-21 |

Notes on what is invented vs. inherited:

- The Sun–Thu working week and the Asia/Riyadh timezone match the pre-existing
  `engine_settings.sla.calendar` row (`"days":"Sun-Thu"`, `"tz":"Asia/Riyadh"`) and are
  therefore consistent with existing configuration, not new.
- **The 08:00–16:00 day length is invented.** The pre-existing `engine_settings.sla`
  row says `08:00-17:00`. The demo calendar deliberately uses a clean 8-hour day so the
  working-minute arithmetic below is legible. **These two disagree.** Reconcile before
  promoting anything.
- **The Islamic-calendar holiday dates are approximations** derived from ordinary
  Gregorian projections of Ramadan/Eid in 2026. They are not the official Council of
  Ministers holiday schedule.
- The third calendar is intentionally left unauthorised so the
  *"Not authorised (DEC-003)"* badge remains demonstrable.

## 2 · SLA — timer durations and thresholds

**Invented: every duration, the warning fraction, and the breach grace period.**

| `sla_key` | Object | Duration (working minutes) | = working days @8h | Escalation role |
| --- | --- | ---: | ---: | --- |
| `review.level2_decision` | review | 1 440 | 3 | `reviewer` |
| `review.resubmission_window` | review | 2 400 | 5 | `reviewer` |
| `visit.execution_submit` | visit | 960 | 2 | `ops` |
| `visit.plan_acknowledgement` | visit | 480 | 1 | `ops` |
| `correction.closure` | correction | 4 800 | 10 | `compliance_admin` |

Derived thresholds (also invented):

| Threshold | Rule |
| --- | --- |
| `warn_at` | `started_at + 80 %` of the duration |
| `breach_at` | `due_at + 1 working day` (24 h elapsed) |
| working-minute → elapsed-minute factor | **×3** (an 8-hour working day inside a 24-hour calendar day) |

Two of these numbers are *echoes* of existing configuration rather than fresh
inventions: `review.level2_decision` = 3 working days matches the pre-existing
`engine_settings.sla.review_business_days = 3`, and `review.resubmission_window` =
5 working days matches `resubmission_business_days = 5`. The remaining three durations,
the 80 % warning fraction and the one-working-day breach grace are entirely invented.

**Important honesty caveat:** the ×3 factor is a demo approximation. The seeded
`due_at`/`warn_at`/`breach_at` values do **not** skip weekends or the holiday array —
they are plain elapsed-time arithmetic. Do not present these timers as evidence that a
working-calendar SLA engine exists.

## 3 · Notification rules — SLA-to-escalation pairs

30 published rules across all 14 live `event_key` values. **Invented: every
`sla_minutes` value and every escalation-role pairing.** Templates are demo copy.

| Event | Channel | Recipient | SLA (min) | Escalates to |
| --- | --- | --- | ---: | --- |
| `assignment` | push | inspector | 240 | `ops` |
| `submission_received` | inapp | reviewer | 1 440 | `ops` |
| `submission_received` | push | reviewer | 720 | `ops` |
| `review_decision` | email | ops | 480 | `leadership` |
| `resubmission` | inapp | inspector | 2 400 | `reviewer` |
| `resubmission` | email | ops | 2 400 | `leadership` |
| `visit_returned` | inapp | planner | 480 | `ops` |
| `visit_expired` | email | ops | 1 440 | `leadership` |
| `geo_override_requested` | inapp | ops | 120 | `gis_admin` |
| `compliance_request_submitted` | inapp | compliance_admin | 960 | `leadership` |
| `compliance_request_partially_approved` | inapp | compliance_admin | 480 | `compliance_admin` |

The other 19 rules carry `sla_minutes = NULL` and `escalation_role = NULL` (the table's
`notification_rules_sla_consistent` CHECK requires the two to be null together).

> Runtime note carried by the app itself: SLA timers and escalation roles on this screen
> are **stored configuration only**. No scheduled process fires escalations. Seeding these
> values does not make automatic escalation real.

## 4 · Risk model — factors, weights and bands

`engine_settings(engine='risk')` was replaced with an eight-factor demo model
(previously five factors, `v-edit-2026-07-16`). **Invented: every weight.**

| Factor | Demo weight | Previous weight |
| --- | ---: | ---: |
| `violation_history_24mo` | 0.22 | 0.30 |
| `last_outcome_recency_severity` | 0.16 | 0.20 |
| `activity_hazard_class` | 0.15 | 0.20 |
| `license_status` | 0.12 | 0.15 |
| `open_corrective_actions` | 0.11 | 0.15 |
| `repeat_violation_rate_12mo` | 0.10 | — (new) |
| `checklist_noncompliance_rate` | 0.08 | — (new) |
| `inspection_recency_days` | 0.06 | — (new) |
| **Σ** | **1.00** | 1.00 |

Bands are **unchanged** from the pre-existing configuration and are therefore *not*
invented: low `[0, 39]`, medium `[40, 69]`, high `[70, 100]`.

Additional invented model settings:

| Setting | Value |
| --- | --- |
| `recalculation.cadence` | `nightly` |
| `recalculation.window` | `02:00 Asia/Riyadh` |
| `recalculation.trigger_on_new_violation` | `true` |
| `normalisation.method` / `clamp` | `min_max` / `[0, 100]` |

Two `risk_models` rows were added: `demo-2026-07` (published, mirrors the settings above)
and `demo-2026-06` (retired, mirrors the previous five-factor weights).

## 5 · Risk variables

20 rows in `risk_variables`. These are **catalogue entries, not values** — each row
declares a variable key, a data type and a `source_ref` pointing at the table that
would supply it. No scoring coefficient is attached to any of them. The five keys that
match the model factors above are the only ones actually weighted; the remaining 15 are
declared but unused, and `production_line_count` is seeded `active = false`.

The `source_ref` strings are **descriptive intent, not verified lineage** — several
reference columns (e.g. `factories.activity_class`, `factories.headcount_band`,
`factories.established_on`) that may not exist in the current schema. Do not treat them
as a data-contract.

## 6 · Risk runs / simulations / overrides

| Table | Rows | What is invented |
| --- | ---: | --- |
| `risk_runs` | 24 | Run cadence (every 18 h back from 2026-07-27 02:00+03), status mix, and the run reasons. No run produced any score. |
| `risk_simulations` | 12 | **All result numbers are fabricated**: `factories_scored`, `band_distribution`, `mean_score` (41.5 + 1.25·n) and `band_shift_vs_current`. No simulation was executed. |
| `risk_overrides` | 12 | Override rationales, sensitivity classes and decision outcomes for 12 real `F-%` factories. **No override changes any factory's stored score or band** — these rows are decision records only. |

## 7 · Dashboard KPI thresholds

`dashboard_config_versions.kpi_parameters` v1 carries a target/warn/critical triple for
**all 28** `mvp3_kpi_definitions` metric keys. **Every one of the 84 numbers below is
invented.** None derives from `dashboard.xlsx`, a baseline, or a governance decision.

| Metric key | Unit | Direction | Target | Warn | Critical |
| --- | --- | --- | ---: | ---: | ---: |
| `active_executions` | count | up | 40 | 25 | 10 |
| `approval_outcomes` | percent | up | 80 | 70 | 60 |
| `cancellation_rate` | percent | down | 5 | 8 | 12 |
| `checklist_compliance` | percent | up | 92 | 85 | 75 |
| `checklist_items_by_authority` | count | up | 120 | 80 | 40 |
| `compliance_rate_trend` | percent | up | 90 | 82 | 72 |
| `daily_progress` | percent | up | 85 | 70 | 55 |
| `expiring_soon` | count | down | 10 | 20 | 35 |
| `gps_overrides_today` | count | down | 3 | 6 | 10 |
| `health_score_distribution` | percent | up | 70 | 60 | 50 |
| `inspection_coverage` | percent | up | 88 | 78 | 65 |
| `level2_decision_mix` | percent | up | 75 | 65 | 55 |
| `licence_exposure` | count | down | 15 | 30 | 50 |
| `live_activity_feed` | count | up | 20 | 10 | 4 |
| `operational_nudges` | count | down | 5 | 12 | 20 |
| `pending_approvals` | count | down | 12 | 25 | 40 |
| `pending_attention` | count | down | 15 | 30 | 50 |
| `pending_publish` | count | down | 5 | 10 | 18 |
| `personal_trends` | percent | up | 80 | 70 | 60 |
| `remaining_visits` | count | down | 25 | 45 | 70 |
| `repeat_violation_rate` | percent | down | 8 | 14 | 22 |
| `risk_to_attention_mismatch` | percent | down | 10 | 18 | 28 |
| `strategic_summary` | percent | up | 85 | 75 | 65 |
| `today_schedule_load` | percent | up | 90 | 75 | 60 |
| `today_visits` | count | up | 30 | 18 | 8 |
| `uninspected_by_segment` | percent | down | 12 | 22 | 35 |
| `violation_trend_regulation_severity` | count | down | 20 | 35 | 55 |
| `visit_pipeline` | count | up | 60 | 40 | 20 |

Policy-level keys in the same payload (also invented): `period = rolling_30d`,
`timezone = Asia/Riyadh`, `scope_precedence = [user_scope, region, sector, national]`,
`refresh.realtime_seconds = 60`, `refresh.on_demand_seconds = 900`.

`publication_audit_reference` is deliberately left `NULL` on all 14 versions: the real
publish RPC writes an immutable audit row first and links it, and a seed script cannot
forge that audit entry. **These versions are therefore NOT audit-anchored publications.**

## 8 · Other dashboard configuration domains

All 13 remaining domains carry small invented demo payloads.

| Domain | Invented values |
| --- | --- |
| `factory_eligibility` | `require_active_licence = true`; exclude statuses `closed`, `suspended`; `min_days_since_last_visit = 30` |
| `inspection_cycle_policy` | cycle days by band — high **90**, medium **180**, low **365**; `grace_days = 14` |
| `sla_urgency_policy` | `warn_at_fraction = 0.8`; `breach_grace_working_days = 1` |
| `health_risk_presentation` | bands mirror the risk engine (not new); `show_score_numeric = true` |
| `health_risk_engine_refs` | `health_score_provider = null`, `health_score_status = unavailable` — deliberately left honest; no Health Score provider exists |
| `layout_visibility` | role → view mapping (leadership/auditor → strategic; ops/planner/reviewer → operational; inspector → field) |
| `map_profile` | `default_zoom = 5`; centre 24.7136 / 46.6753 (Riyadh); `cluster_threshold = 25` |
| `strategic_summary_policy` | `comparison_window = previous_30d`; `min_denominator = 10` |
| `operational_nudge_policy` | `max_nudges_per_session = 5`; `suppress_after_dismiss_hours = 24` |
| `freshness_offline_policy` | `stale_after_minutes = 30`; `offline_banner_after_minutes = 5` |
| `localization` | `default_locale = ar`; locales `[ar, en]`; latin numerals; gregorian calendar |
| `masking_export` | mask personal names for `auditor`; export `csv` only; `watermark = true` |
| `pre_inspection_pack` | `include_last_visits = 3`; `include_open_violations = true`; `max_pack_mb = 25` |

## 9 · Operations KPI definitions

`rpc operations_kpi_contract()` hard-codes seven required metric families and reports
`source_status = 'not_configured'` for any without a **published** definition. None of
the seven existed. Seven published demo definitions were added to
`mvp3_kpi_definitions`: `visits_planned`, `visits_completed`, `visits_cancelled`,
`visits_overdue`, `active_inspectors`, `average_duration`, `sla_breach_rate`.

**Invented: the formula text of all seven.** These are plain-language descriptions of a
plausible calculation; they are not executable and no code evaluates them. The 28
pre-existing KPI definitions were **not modified** — they remain `draft`.

## 10 · Inspection packages

Six demo packages, each with two published versions (`v2026.06-demo` superseded by
`v2026.07-demo`). **Invented: the package/section composition and the effective-date
windows** (2026-06-15 → 2026-07-14, then 2026-07-15 → open).

Nothing about the *contents* is invented:

- Item codes are restricted to the five that are genuinely anchored to published,
  currently-effective regulations (`FS-101`, `FS-102`, `FS-107`, `EG-201`, `HZ-310`).
  The DB trigger `guard_package_regulation_dependencies()` would have rejected anything else.
- Item and violation snapshots are copied verbatim from the real `inspection_items`,
  `regulation_clauses` and `violation_codes` rows.
- **No penalty amount, penalty schedule or violation severity was invented.**

## 11 · GIS layers

Seven demo layers added alongside the five pre-existing throwaway `e2e-layer-…` rows
(which were left in place). **Invented: the layer catalogue and the sensitivity-class
assignments** (`internal` / `restricted` / `confidential`). No geometry, tile source or
credential is seeded — `source_ref` is a descriptive pointer only.

## 12 · Factory risk snapshots

All 24 `F-%` factories **already had** a snapshot inside 2026-06-28 → 2026-07-27, so no
top-up was needed and **no score was invented**. One additional snapshot per factory was
added, dated 2026-07-26 02:00+03, carrying each factory's **latest existing score and
band forward verbatim** and restamping it with `model_version = 'demo-2026-07'` so the
current demo model is represented in the history. `drivers` records
`"carried_forward": true`.

---

## Deliberately NOT seeded

| Table | Why |
| --- | --- |
| `workflow_outbox` | A live dispatch queue. Seeding `pending` rows could cause a real dispatcher to fire synthetic side effects. |
| `push_subscriptions` | Requires real browser push endpoints and VAPID key material. Fabricated endpoints would fail at send time and teach nothing. |
| `user_capability_grants` | Grants real authority. Seeding capabilities would silently widen RBAC. |
| `audit_event_semantic_mappings` | Derived from real audit ingestion; fabricating mappings would corrupt the audit lineage. |
| `config_versions` | Already holds the published `visit-lifecycle-v4` workflow row with valid `states[]`/`transitions[]` — the `/admin/planning/status` fallback banner is already inactive. Nothing was added. |
| `planning_expiry_rules` (13) / `planning_lookups` (30) | Already populated with real configuration. Left untouched. |

## Known gaps this seed does NOT close

1. **`/dashboard` KPI targets still render as unconfigured.** `lib/dashboard-kpi/projection.ts`
   and `inspector-projection.ts` hard-code `target: { value: null, configured: false }`.
   That is a code path, not a data gap — no amount of seeding changes it. Closing it
   requires wiring the projection builders to read the published `kpi_parameters`
   payload.
2. **SLA due dates are elapsed-time arithmetic, not working-calendar arithmetic** (see §2).
3. **`engine_settings.sla` still says 08:00–17:00 while the demo calendar says 08:00–16:00** (see §1).
4. **Dashboard config versions are not audit-anchored** (see §7).

## Removing this seed

Every demo row is identifiable by the markers in *How to spot demo data at a glance*.
Note that `notification_rules` rows in status `published` are protected by
`guard_published_notification_rule()` (UPDATE and DELETE both raise), and
`dashboard_config_versions` is append-only via `dash_block_version_mutation()` — both
must be dropped with elevated privileges or by restoring a pre-seed snapshot.
The one non-additive change is `engine_settings(engine='risk')`, whose previous value was
`v-edit-2026-07-16` with the five factors listed in §4.
