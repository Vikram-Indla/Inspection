# Schema Domain Map

Section A discovery output. 142 public base tables from the live staging project `iiozvqntawxfwbgffzqu` (Supabase Management API, read-only SQL against `information_schema` / `pg_catalog` / `pg_policies`), grouped into the domains from the seeding blueprint mindmap (`MIM_Inspection_Supabase_Data_Seeding_Blueprint.md`). Domain assignment is this session's static classification by table name/purpose (grep of `supabase/migrations/*.sql` comments plus naming convention), not a column stored on the tables themselves — treat borderline calls (noted per table) as provisional.

Total base tables classified: 142. Cross-domain foreign keys: 188. Same-domain foreign keys: 154.


## Identity & Organisation (10 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `capabilities` | 2 | enabled | 1 |  |
| `notification_preferences` | 5 | enabled | 1 |  |
| `permissions` | 4 | enabled | 1 |  |
| `profiles` | 7 | enabled | 1 |  |
| `push_subscriptions` | 8 | enabled | 3 |  |
| `role_capabilities` | 2 | enabled | 1 |  |
| `role_permissions` | 3 | enabled | 2 |  |
| `roles` | 3 | enabled | 1 |  |
| `user_capability_grants` | 4 | enabled | 2 |  |
| `user_roles` | 4 | enabled | 2 |  |

## Geography & Master Data (18 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `commercial_registrations` | 15 | enabled | 2 |  |
| `factories` | 33 | enabled | 4 |  |
| `factory_documents` | 17 | enabled | 2 |  |
| `factory_government_records` | 16 | enabled | 2 |  |
| `factory_import_batches` | 9 | enabled | 1 |  |
| `factory_import_rows` | 8 | enabled | 1 |  |
| `factory_locations` | 8 | enabled | 3 |  |
| `factory_materials` | 7 | enabled | 2 |  |
| `factory_media_assets` | 14 | enabled | 2 |  |
| `factory_products` | 9 | enabled | 2 |  |
| `factory_representatives` | 9 | enabled | 3 |  |
| `factory_risk_snapshots` | 8 | enabled | 1 |  |
| `gis_layers` | 9 | enabled | 3 |  |
| `industrial_licenses` | 18 | enabled | 2 |  |
| `location_visibility_matrix` | 4 | enabled | 3 |  |
| `map_packs` | 8 | enabled | 3 |  |
| `plant_addresses` | 27 | enabled | 3 |  |
| `plant_production_line_items` | 38 | enabled | 2 |  |

## Compliance Configuration (32 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `compliance_configuration_requests` | 16 | enabled | 1 | Maker-checker request wrapper around compliance config changes — grouped with Compliance Configuration though it is itself a governance/workflow object. |
| `compliance_entity_heads` | 5 | enabled | 1 |  |
| `compliance_entity_versions` | 13 | enabled | 1 |  |
| `compliance_lookup_types` | 6 | enabled | 1 |  |
| `compliance_lookup_values` | 16 | enabled | 1 |  |
| `compliance_request_component_dependencies` | 6 | enabled | 1 |  |
| `compliance_request_components` | 14 | enabled | 1 |  |
| `compliance_request_decisions` | 9 | enabled | 1 |  |
| `compliance_request_publications` | 8 | enabled | 1 |  |
| `compliance_request_revisions` | 8 | enabled | 1 |  |
| `config_versions` | 15 | enabled | 3 |  |
| `configuration_templates` | 16 | enabled | 2 |  |
| `enforcement_recommendations` | 11 | enabled | 3 |  |
| `engine_settings` | 5 | enabled | 2 |  |
| `inspection_item_versions` | 5 | enabled | 1 |  |
| `inspection_items` | 15 | enabled | 2 |  |
| `objections` | 8 | enabled | 3 | Post-decision appeal path; grouped under Compliance Configuration as governed workflow config, but is arguably closer to Submission & Review. |
| `package_version_dependency_snapshots` | 5 | enabled | 1 |  |
| `package_version_item_snapshots` | 4 | enabled | 1 |  |
| `package_versions` | 12 | enabled | 2 |  |
| `packages` | 5 | enabled | 2 |  |
| `penalty_mappings` | 27 | enabled | 2 |  |
| `penalty_notices` | 10 | enabled | 2 |  |
| `planning_expiry_rules` | 12 | enabled | 3 |  |
| `planning_lookups` | 10 | enabled | 3 |  |
| `regulation_attachments` | 8 | enabled | 2 |  |
| `regulation_clauses` | 6 | enabled | 2 |  |
| `regulations` | 16 | enabled | 2 |  |
| `self_assessments` | 10 | enabled | 3 | Could be Planning or Compliance Configuration depending on whether it is inspector-facing pre-work or a configured form; placed in Compliance Configuration. |
| `ui_string_revisions` | 9 | enabled | 1 |  |
| `ui_strings` | 8 | enabled | 3 |  |
| `violation_codes` | 30 | enabled | 2 |  |

## Planning (6 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `assignments` | 8 | enabled | 7 |  |
| `bulk_violation_batch_items` | 7 | enabled | 1 |  |
| `bulk_violation_batches` | 7 | enabled | 1 |  |
| `visit_attachments` | 9 | enabled | 3 |  |
| `visit_plans` | 12 | enabled | 6 |  |
| `visits` | 31 | enabled | 7 |  |

## Preparation (3 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `visit_package_snapshots` | 8 | enabled | 1 |  |
| `visit_packages` | 6 | enabled | 3 |  |
| `visit_preparations` | 10 | enabled | 3 |  |

## Journey & Arrival (8 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `cancellation_requests` | 14 | enabled | 1 |  |
| `geo_events` | 21 | enabled | 2 |  |
| `geo_override_requests` | 21 | enabled | 1 |  |
| `journey_sessions` | 19 | enabled | 3 |  |
| `route_snapshots` | 5 | enabled | 3 |  |
| `visit_lifecycle_events` | 8 | enabled | 2 |  |
| `visit_location_corrections` | 11 | enabled | 1 |  |
| `visit_location_events` | 8 | enabled | 2 |  |

## Inspection Execution (16 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `action_forms` | 11 | enabled | 1 | Execution-time record, but is itself a governed/configured object family (Action Forms in blueprint section C) — could equally sit in Compliance Configuration. |
| `checklist_responses` | 6 | enabled | 2 |  |
| `correction_evidence` | 7 | enabled | 3 |  |
| `evidence` | 20 | enabled | 3 |  |
| `findings` | 5 | enabled | 1 |  |
| `incident_reports` | 16 | enabled | 2 |  |
| `inspection_factory_checks` | 10 | enabled | 3 |  |
| `inspection_factory_snapshots` | 8 | enabled | 2 |  |
| `inspection_item_states` | 7 | enabled | 3 |  |
| `inspection_penalties` | 9 | enabled | 1 |  |
| `inspections` | 9 | enabled | 4 |  |
| `ocr_extractions` | 7 | enabled | 2 |  |
| `signature_acts` | 10 | enabled | 2 |  |
| `violations` | 9 | enabled | 3 |  |
| `virtual_participants` | 8 | enabled | 1 |  |
| `virtual_sessions` | 5 | enabled | 2 |  |

## Submission & Review (3 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `report_verifications` | 7 | enabled | 2 |  |
| `reviews` | 9 | enabled | 3 |  |
| `submission_versions` | 8 | enabled | 2 |  |

## Operations & Analytics (17 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `cases` | 12 | enabled | 3 | MVP2 case-spine table; grouped under Operations & Analytics as a cross-cutting case aggregator, but touches almost every domain. |
| `dashboard_config_heads` | 3 | enabled | 1 |  |
| `dashboard_config_parameters` | 15 | enabled | 1 |  |
| `dashboard_config_versions` | 10 | enabled | 1 |  |
| `external_requests` | 11 | enabled | 3 | Generic external-facing request queue; grouped under Operations & Analytics pending confirmation of its exact consumers. |
| `notification_rules` | 17 | enabled | 2 |  |
| `notifications` | 16 | enabled | 3 |  |
| `risk_exceptions` | 9 | enabled | 3 |  |
| `risk_models` | 13 | enabled | 3 |  |
| `risk_overrides` | 10 | enabled | 3 |  |
| `risk_runs` | 9 | enabled | 3 |  |
| `risk_simulations` | 6 | enabled | 3 |  |
| `risk_variables` | 8 | enabled | 3 |  |
| `sla_calendars` | 11 | enabled | 3 |  |
| `sla_timers` | 17 | enabled | 3 |  |
| `workflow_outbox` | 13 | enabled | 3 |  |
| `workflow_task_assignments` | 13 | enabled | 3 |  |

## Integrations (21 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `ai_events` | 6 | enabled | 2 |  |
| `ai_suggestions` | 11 | enabled | 3 |  |
| `external_source_connections` | 11 | enabled | 1 |  |
| `inspector_briefing_cache` | 9 | enabled | 3 | Applied from the uncommitted feature/ipad-field-channel-delivery worktree (see MIGRATION_STATE_MATRIX.csv); grouped under Integrations as a read-cache/adapter-shaped object pending confirmation of its true owning domain. |
| `mvp3_access_reviews` | 11 | enabled | 2 |  |
| `mvp3_api_events` | 12 | enabled | 2 |  |
| `mvp3_device_commands` | 9 | enabled | 2 |  |
| `mvp3_devices` | 12 | enabled | 2 |  |
| `mvp3_error_queue` | 13 | enabled | 2 |  |
| `mvp3_evidence_access_grants` | 8 | enabled | 3 |  |
| `mvp3_export_jobs` | 11 | enabled | 2 |  |
| `mvp3_feature_flags` | 10 | enabled | 2 |  |
| `mvp3_inspection_package_manifests` | 9 | enabled | 1 |  |
| `mvp3_integration_endpoints` | 11 | enabled | 3 |  |
| `mvp3_kpi_definitions` | 15 | enabled | 2 |  |
| `mvp3_package_access_events` | 8 | enabled | 1 |  |
| `mvp3_signature_refusals` | 10 | enabled | 1 |  |
| `senaei_raw_snapshots` | 8 | enabled | 1 |  |
| `senaei_reconciliation_records` | 12 | enabled | 1 |  |
| `senaei_sync_calls` | 10 | enabled | 1 |  |
| `senaei_sync_runs` | 15 | enabled | 1 |  |

## Governance & Audit (8 tables)

| Table | Columns | RLS | Policies | Notes |
|---|---|---|---|---|
| `audit_event_ontology_entries` | 12 | enabled | 1 |  |
| `audit_event_ontology_versions` | 8 | enabled | 1 |  |
| `audit_event_order_constraints` | 5 | enabled | 1 |  |
| `audit_event_registry` | 10 | enabled | 1 |  |
| `audit_event_semantic_mappings` | 6 | enabled | 1 |  |
| `audit_event_source_contracts` | 4 | enabled | 0 |  |
| `audit_events` | 10 | enabled | 2 |  |
| `audit_semantic_events` | 32 | enabled | 1 |  |

## Cross-domain foreign key edges

FKs that cross a domain boundary (source table -> referenced table), deduplicated by table pair:

| From domain | From table | To domain | To table |
|---|---|---|---|
| Compliance Configuration | `compliance_configuration_requests` | Governance & Audit | `audit_events` |
| Compliance Configuration | `compliance_configuration_requests` | Identity & Organisation | `profiles` |
| Compliance Configuration | `compliance_entity_versions` | Identity & Organisation | `profiles` |
| Compliance Configuration | `compliance_lookup_values` | Identity & Organisation | `profiles` |
| Compliance Configuration | `compliance_request_components` | Identity & Organisation | `profiles` |
| Compliance Configuration | `compliance_request_decisions` | Identity & Organisation | `profiles` |
| Compliance Configuration | `compliance_request_publications` | Identity & Organisation | `profiles` |
| Compliance Configuration | `compliance_request_revisions` | Identity & Organisation | `profiles` |
| Compliance Configuration | `config_versions` | Identity & Organisation | `profiles` |
| Compliance Configuration | `configuration_templates` | Identity & Organisation | `profiles` |
| Compliance Configuration | `enforcement_recommendations` | Geography & Master Data | `factories` |
| Compliance Configuration | `enforcement_recommendations` | Identity & Organisation | `profiles` |
| Compliance Configuration | `enforcement_recommendations` | Planning | `visits` |
| Compliance Configuration | `engine_settings` | Identity & Organisation | `profiles` |
| Compliance Configuration | `inspection_item_versions` | Identity & Organisation | `profiles` |
| Compliance Configuration | `inspection_items` | Identity & Organisation | `profiles` |
| Compliance Configuration | `objections` | Geography & Master Data | `factories` |
| Compliance Configuration | `objections` | Geography & Master Data | `factory_representatives` |
| Compliance Configuration | `objections` | Identity & Organisation | `profiles` |
| Compliance Configuration | `objections` | Operations & Analytics | `external_requests` |
| Compliance Configuration | `package_versions` | Identity & Organisation | `profiles` |
| Compliance Configuration | `penalty_mappings` | Identity & Organisation | `profiles` |
| Compliance Configuration | `penalty_notices` | Geography & Master Data | `factories` |
| Compliance Configuration | `penalty_notices` | Identity & Organisation | `profiles` |
| Compliance Configuration | `penalty_notices` | Inspection Execution | `inspections` |
| Compliance Configuration | `penalty_notices` | Inspection Execution | `violations` |
| Compliance Configuration | `regulation_attachments` | Identity & Organisation | `profiles` |
| Compliance Configuration | `regulations` | Identity & Organisation | `profiles` |
| Compliance Configuration | `self_assessments` | Geography & Master Data | `factories` |
| Compliance Configuration | `self_assessments` | Geography & Master Data | `factory_representatives` |
| Compliance Configuration | `self_assessments` | Identity & Organisation | `profiles` |
| Compliance Configuration | `ui_string_revisions` | Identity & Organisation | `profiles` |
| Compliance Configuration | `ui_strings` | Identity & Organisation | `profiles` |
| Compliance Configuration | `violation_codes` | Identity & Organisation | `profiles` |
| Geography & Master Data | `commercial_registrations` | Integrations | `senaei_raw_snapshots` |
| Geography & Master Data | `factory_documents` | Identity & Organisation | `profiles` |
| Geography & Master Data | `factory_documents` | Integrations | `senaei_raw_snapshots` |
| Geography & Master Data | `factory_government_records` | Integrations | `senaei_raw_snapshots` |
| Geography & Master Data | `factory_import_batches` | Identity & Organisation | `profiles` |
| Geography & Master Data | `factory_import_batches` | Integrations | `senaei_sync_runs` |
| Geography & Master Data | `factory_import_rows` | Integrations | `senaei_raw_snapshots` |
| Geography & Master Data | `factory_locations` | Identity & Organisation | `profiles` |
| Geography & Master Data | `factory_materials` | Identity & Organisation | `profiles` |
| Geography & Master Data | `factory_media_assets` | Inspection Execution | `evidence` |
| Geography & Master Data | `factory_media_assets` | Inspection Execution | `inspections` |
| Geography & Master Data | `factory_media_assets` | Inspection Execution | `violations` |
| Geography & Master Data | `factory_media_assets` | Integrations | `senaei_raw_snapshots` |
| Geography & Master Data | `factory_products` | Identity & Organisation | `profiles` |
| Geography & Master Data | `factory_risk_snapshots` | Identity & Organisation | `profiles` |
| Geography & Master Data | `gis_layers` | Identity & Organisation | `profiles` |
| Geography & Master Data | `industrial_licenses` | Integrations | `senaei_raw_snapshots` |
| Geography & Master Data | `map_packs` | Identity & Organisation | `profiles` |
| Geography & Master Data | `plant_addresses` | Integrations | `senaei_raw_snapshots` |
| Geography & Master Data | `plant_production_line_items` | Integrations | `senaei_raw_snapshots` |
| Governance & Audit | `audit_event_ontology_versions` | Identity & Organisation | `profiles` |
| Inspection Execution | `action_forms` | Compliance Configuration | `inspection_items` |
| Inspection Execution | `checklist_responses` | Compliance Configuration | `inspection_items` |
| Inspection Execution | `correction_evidence` | Geography & Master Data | `factories` |
| Inspection Execution | `correction_evidence` | Geography & Master Data | `factory_representatives` |
| Inspection Execution | `correction_evidence` | Operations & Analytics | `external_requests` |
| Inspection Execution | `evidence` | Identity & Organisation | `profiles` |
| Inspection Execution | `evidence` | Planning | `visits` |
| Inspection Execution | `findings` | Compliance Configuration | `inspection_items` |
| Inspection Execution | `incident_reports` | Geography & Master Data | `factories` |
| Inspection Execution | `incident_reports` | Identity & Organisation | `profiles` |
| Inspection Execution | `incident_reports` | Planning | `visits` |
| Inspection Execution | `inspection_factory_checks` | Identity & Organisation | `profiles` |
| Inspection Execution | `inspection_factory_snapshots` | Geography & Master Data | `commercial_registrations` |
| Inspection Execution | `inspection_factory_snapshots` | Geography & Master Data | `factories` |
| Inspection Execution | `inspection_factory_snapshots` | Geography & Master Data | `industrial_licenses` |
| Inspection Execution | `inspection_factory_snapshots` | Submission & Review | `submission_versions` |
| Inspection Execution | `inspection_item_states` | Compliance Configuration | `inspection_items` |
| Inspection Execution | `inspection_penalties` | Compliance Configuration | `penalty_mappings` |
| Inspection Execution | `inspection_penalties` | Identity & Organisation | `profiles` |
| Inspection Execution | `inspections` | Compliance Configuration | `package_versions` |
| Inspection Execution | `inspections` | Planning | `visits` |
| Inspection Execution | `ocr_extractions` | Identity & Organisation | `profiles` |
| Inspection Execution | `signature_acts` | Geography & Master Data | `factory_representatives` |
| Inspection Execution | `signature_acts` | Identity & Organisation | `profiles` |
| Inspection Execution | `violations` | Compliance Configuration | `violation_codes` |
| Inspection Execution | `virtual_sessions` | Planning | `visits` |
| Integrations | `ai_events` | Identity & Organisation | `profiles` |
| Integrations | `ai_suggestions` | Identity & Organisation | `profiles` |
| Integrations | `inspector_briefing_cache` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_access_reviews` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_api_events` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_device_commands` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_devices` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_evidence_access_grants` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_export_jobs` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_feature_flags` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_inspection_package_manifests` | Compliance Configuration | `config_versions` |
| Integrations | `mvp3_inspection_package_manifests` | Compliance Configuration | `package_versions` |
| Integrations | `mvp3_inspection_package_manifests` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_inspection_package_manifests` | Inspection Execution | `inspections` |
| Integrations | `mvp3_integration_endpoints` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_kpi_definitions` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_kpi_definitions` | Identity & Organisation | `roles` |
| Integrations | `mvp3_package_access_events` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_signature_refusals` | Identity & Organisation | `profiles` |
| Integrations | `mvp3_signature_refusals` | Inspection Execution | `signature_acts` |
| Integrations | `senaei_reconciliation_records` | Geography & Master Data | `commercial_registrations` |
| Integrations | `senaei_reconciliation_records` | Geography & Master Data | `factories` |
| Integrations | `senaei_reconciliation_records` | Geography & Master Data | `industrial_licenses` |
| Integrations | `senaei_reconciliation_records` | Identity & Organisation | `profiles` |
| Integrations | `senaei_sync_runs` | Identity & Organisation | `profiles` |
| Journey & Arrival | `cancellation_requests` | Inspection Execution | `evidence` |
| Journey & Arrival | `cancellation_requests` | Inspection Execution | `inspections` |
| Journey & Arrival | `cancellation_requests` | Planning | `visits` |
| Journey & Arrival | `geo_events` | Planning | `visits` |
| Journey & Arrival | `geo_override_requests` | Identity & Organisation | `profiles` |
| Journey & Arrival | `geo_override_requests` | Planning | `visits` |
| Journey & Arrival | `journey_sessions` | Identity & Organisation | `profiles` |
| Journey & Arrival | `journey_sessions` | Planning | `visits` |
| Journey & Arrival | `visit_lifecycle_events` | Planning | `visits` |
| Journey & Arrival | `visit_location_corrections` | Inspection Execution | `evidence` |
| Journey & Arrival | `visit_location_corrections` | Planning | `visits` |
| Journey & Arrival | `visit_location_events` | Planning | `visits` |
| Operations & Analytics | `cases` | Geography & Master Data | `factories` |
| Operations & Analytics | `cases` | Identity & Organisation | `profiles` |
| Operations & Analytics | `dashboard_config_parameters` | Identity & Organisation | `profiles` |
| Operations & Analytics | `dashboard_config_versions` | Governance & Audit | `audit_events` |
| Operations & Analytics | `dashboard_config_versions` | Identity & Organisation | `profiles` |
| Operations & Analytics | `external_requests` | Geography & Master Data | `factories` |
| Operations & Analytics | `external_requests` | Geography & Master Data | `factory_representatives` |
| Operations & Analytics | `external_requests` | Identity & Organisation | `profiles` |
| Operations & Analytics | `notification_rules` | Identity & Organisation | `profiles` |
| Operations & Analytics | `notification_rules` | Identity & Organisation | `roles` |
| Operations & Analytics | `notifications` | Identity & Organisation | `profiles` |
| Operations & Analytics | `risk_exceptions` | Identity & Organisation | `profiles` |
| Operations & Analytics | `risk_models` | Identity & Organisation | `profiles` |
| Operations & Analytics | `risk_overrides` | Identity & Organisation | `profiles` |
| Operations & Analytics | `risk_runs` | Identity & Organisation | `profiles` |
| Operations & Analytics | `risk_simulations` | Identity & Organisation | `profiles` |
| Operations & Analytics | `risk_variables` | Identity & Organisation | `profiles` |
| Operations & Analytics | `sla_calendars` | Identity & Organisation | `profiles` |
| Operations & Analytics | `sla_timers` | Identity & Organisation | `profiles` |
| Operations & Analytics | `workflow_outbox` | Identity & Organisation | `profiles` |
| Operations & Analytics | `workflow_task_assignments` | Identity & Organisation | `profiles` |
| Planning | `assignments` | Identity & Organisation | `profiles` |
| Planning | `bulk_violation_batch_items` | Geography & Master Data | `factories` |
| Planning | `bulk_violation_batch_items` | Inspection Execution | `inspections` |
| Planning | `bulk_violation_batch_items` | Inspection Execution | `violations` |
| Planning | `bulk_violation_batches` | Compliance Configuration | `violation_codes` |
| Planning | `bulk_violation_batches` | Identity & Organisation | `profiles` |
| Planning | `visit_attachments` | Identity & Organisation | `profiles` |
| Planning | `visit_plans` | Identity & Organisation | `profiles` |
| Planning | `visits` | Compliance Configuration | `package_versions` |
| Planning | `visits` | Compliance Configuration | `planning_expiry_rules` |
| Planning | `visits` | Geography & Master Data | `factories` |
| Planning | `visits` | Identity & Organisation | `profiles` |
| Preparation | `visit_package_snapshots` | Compliance Configuration | `package_versions` |
| Preparation | `visit_package_snapshots` | Planning | `visits` |
| Preparation | `visit_packages` | Compliance Configuration | `package_versions` |
| Preparation | `visit_packages` | Identity & Organisation | `profiles` |
| Preparation | `visit_packages` | Planning | `visits` |
| Preparation | `visit_preparations` | Compliance Configuration | `package_versions` |
| Preparation | `visit_preparations` | Planning | `visits` |
| Submission & Review | `reviews` | Identity & Organisation | `profiles` |
| Submission & Review | `reviews` | Inspection Execution | `inspections` |
| Submission & Review | `submission_versions` | Identity & Organisation | `profiles` |
| Submission & Review | `submission_versions` | Inspection Execution | `inspections` |
