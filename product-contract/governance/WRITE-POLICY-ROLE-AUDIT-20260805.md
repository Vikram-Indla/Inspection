# Write-policy phantom-role audit — 20260805

Job two of the BOSS/Orchestrator systemic role audit. Table only — nothing in
this file has been applied. Every row below was pulled live from
`pg_policies` on `iiozvqntawxfwbgffzqu` (schema `public`, cmd in INSERT,
UPDATE, ALL, DELETE), not inferred from migration history. A row is
"phantom-only" when no real role (`admin`, `inspector`, `planner`,
`supervisor`) appears anywhere in its `qual`/`with_check`; those already
naming a real role are excluded here — they already function and are the
sender's "also names a real role" column, not this one.

These are all write policies — who may *change* something. Separation of
duties. No fix proposed for any of them; that is the Product Owner's call.

## Grouped by capability (same phantom roles, same real-world answer)

| Group | Tables (policy, cmd) | Phantom roles named | What it actually guards |
|---|---|---|---|
| A — Factory 360 record admin | commercial_registrations, external_source_connections, factory_government_records, factory_import_batches, factory_import_rows, factory_media_assets(ALL, write side), industrial_licenses, plant_addresses(`f360_plant_addresses_admin`), plant_production_line_items — all `ALL` | compliance_admin, security_admin, workflow_admin | Who may edit a factory's Factory 360 record data: commercial registration, government record, bulk-import batches/rows, media assets, licenses, plant address, declared production lines. |
| B — Plant address map correction | plant_addresses (`f360_plant_addresses_gis_admin`, ALL) | gis_admin | Who may correct a plant address's map location specifically (narrower than Group A). |
| C — SENAEI integration sync | senaei_raw_snapshots, senaei_reconciliation_records, senaei_sync_calls, senaei_sync_runs — all `ALL` | compliance_admin, security_admin, workflow_admin | Who may edit records from the government SENAEI integration sync. |
| D — Map/location config | gis_layers (write, update), location_visibility_matrix (write, update), map_packs (write, update), route_snapshots (write, update), factory_locations (write, update) | compliance_admin, gis_admin, security_admin | Who may configure map layers, per-role region visibility, offline map packs, factory location records, and travel-route snapshots. route_snapshots looks system-generated (see flag below), not a human action — check before ruling. |
| E — Risk-scoring engine config | risk_exceptions, risk_models, risk_overrides, risk_runs, risk_simulations, risk_variables — write + update (12 policies, 6 tables) | compliance_admin, risk_owner, security_admin | Who may configure the compliance risk-scoring engine: models, variables, overrides, exceptions, simulation runs. One PO ruling covers all 12. |
| F — SLA configuration | sla_calendars, sla_timers — write + update | compliance_admin, leadership, ops, workflow_admin | Who may configure SLA calendars and timers. |
| G — Governed config / engine settings | config_versions (write, update), engine_settings (`engine_write`, UPDATE), workflow_outbox (write, update) | compliance_admin, form_admin, gis_admin, risk_owner, security_admin, workflow_admin (engine_settings: same minus form_admin) | Who may publish/edit a governed configuration version, change an engine setting, or manually queue a workflow-outbox event. **engine_settings is the table INSP-757's arrival-radius default lives in — right now no real role can update it through the app; only a direct migration can.** Flag: high relevance. |
| H — Reference/lookup content maintenance | ui_strings (write, update), notification_rules (ALL), regulation_attachments (ALL), penalty_mappings (ALL), violation_codes (insert, update, delete), configuration_templates (ALL) | compliance_admin, form_admin (+ security_admin/workflow_admin/gis_admin/risk_owner on some) | Who may maintain reference data: UI translation strings, notification-trigger rules, regulation attachments, violation→penalty mappings, the violation-code catalogue, inspection package configuration templates. |
| I — Post-submission artifact edit/delete | action_forms (`actions_rw`, ALL), evidence (`evidence_rw`, ALL), findings (`findings_rw`, ALL), checklist_responses (update, delete), cases (write, update) | auditor, reviewer (+ leadership, security_admin on cases) | Who may edit or delete an inspection execution artifact (action form, evidence, finding, checklist answer) after the fact, and who may open/update a compliance case. Touches maker-checker territory — no weakening proposed, PO's call entirely. |
| J — MVP3 device/security admin | mvp3_access_reviews (insert), mvp3_api_events (insert), mvp3_device_commands (insert), mvp3_devices (insert), mvp3_error_queue (insert), mvp3_evidence_access_grants (insert, update), mvp3_feature_flags (insert), mvp3_integration_endpoints (insert, update), mvp3_kpi_definitions (insert) | security_admin (+ ops/leadership on some) | Who may administer the MVP3 device/security layer: register a device, issue a device command, grant evidence access, define a feature flag/KPI/integration endpoint, open an access review. `mvp3_api_events_insert` and `mvp3_errors_insert` look like system/service log writes, not a human action — may need no human-role ruling at all. |

## Standalone (capability doesn't obviously fold into a group)

| Table.policy (cmd) | Phantom roles | What it guards | Note |
|---|---|---|---|
| penalty_notices.penalty_notices_insert (INSERT) | compliance_admin, ops | Who may issue a penalty notice. | High-impact, enforcement-adjacent — kept separate from Group H on purpose. |
| reviews.reviews_insert (INSERT) | ops, reviewer | Who may open a review record for a submitted inspection. | `decide_review()` (verified earlier this session) is reached via `has_capability('review.decide')`, not this policy. Suspect this INSERT is only ever hit by a service path when an inspection is submitted, not a direct user action — check whether any client code inserts into `reviews` directly before ruling; may be dead. |
| geo_events.geo_insert (INSERT) | ops | Who/what may write a raw GPS/geofence event. | Almost certainly a field-device/system write path, not a named human role. Likely needs a service-role answer, not a human-role widening. |
| journey_sessions.journeys_update (UPDATE) | ops | Who may correct or close a live journey/GPS session outside automatic completion. | Same system-actor caution as geo_insert. |
| inspections.inspections_update (UPDATE) | ops, reviewer | Who may update an inspection record outside the normal submit/review flow. | Only token-scanned, not fully read — there may be another real-role or function-based condition in the full clause my scan didn't resolve. Read the full `qual` before ruling. |
| notifications.notif_update_recipient (UPDATE) | ops | Who may update another user's notification (e.g. mark as read/delivered). | Same caution as `notif_own` (SELECT, held back this session): check whether the role branch is a second grant or whether this is really self-scope-only before widening — do not fold into a blanket answer. |

## Excluded from this table (not part of this defect class)

- ~35 write policies have **no role literal at all** in their qual/with_check
  (e.g. `ai_events_write`, `checklist_responses.responses_insert`,
  `visits.visits_insert_explicit`) — these are gated by
  `has_capability()`/`has_permission()`/`is_assigned_inspector()` functions
  or pure `auth.uid()` self-scope, not a phantom role array. Not broken by
  this defect class. Full list available on request.
- A handful of regex hits are status/enum literals, not role names, and are
  already excluded from the table above: `reopening_notice_lines_write`
  (`'draft'` is a status check), `planning_process_commands_expiry_owner`
  (`'planning_expiry_scheduler'` is a system/service role, not human),
  `workflow_outbox_expiry_owner_insert` (`'notify'`/`'visit'` are
  event-key/table-name literals).
- Rows where a real role already appears alongside phantom ones
  (`evidence_visit_rw`, `factories_write_admin`, `assignments_write`,
  `visits_insert_immediate_inspector`, etc.) are the sender's "also names a
  real role" column — already functioning, not reproduced here.

## Dead-capability check — screen existence, verified live against `apps/web/src`

Grepped the full `apps/web/src` tree (not just `app/`) for every table name
in Groups C, D, E and `workflow_outbox`. A table with **zero** references
anywhere in app source has no screen calling it at all today — tightening
or loosening its write policy changes nothing observable, so it may need
no PO ruling right now, only a note for when a screen is eventually built:

| Table | References in apps/web/src | Verdict |
|---|---|---|
| senaei_raw_snapshots | 0 | No screen. May need no ruling now. |
| risk_overrides | 0 | No screen. May need no ruling now. |
| risk_runs | 0 | No screen. May need no ruling now. |
| risk_simulations | 0 | No screen. May need no ruling now. |
| risk_variables | 0 | No screen. May need no ruling now. |
| route_snapshots | 0 | No screen. May need no ruling now. |
| location_visibility_matrix | 0 | No screen. May need no ruling now. |
| workflow_outbox | 1 (`lib/workflow/outbox.ts`) | Written only by a server-side helper, never a user screen — confirms the system/service-actor flag already on this row in Group G, not a human-capability gap. |

Risk-engine Group E splits on this: `risk_models` and `risk_exceptions` do
have a screen and need a real ruling; `risk_overrides`/`risk_runs`/
`risk_simulations`/`risk_variables` do not — the PO can defer those four
without blocking the group.

Everything else in Groups A–J has at least one reference in `apps/web/src`
(a screen exists) — that confirms a screen exists, not that a write UI
exists behind it; distinguishing "read-only screen" from "has a write
form/action" for each would be the next level of rigor if wanted, not done
here.

## Totals

79 write policies (INSERT 30, UPDATE 25, ALL 22, DELETE 2) name only
phantom roles, per live measurement, matching the sender's count. Grouped
above into 10 capability clusters (A–J) covering the large majority, plus 6
standalone rows that need individual judgement rather than a blanket
answer, and one cross-cutting caution (notif_update_recipient / notif_own)
already flagged once this session.
