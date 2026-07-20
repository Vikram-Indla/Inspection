# Inspection route inventory

Task: TASK-G11-REMEDIATION-PERFORMANCE-001  
Generated from the App Router source tree at starting commit `186c42e64c137c3404539c7a54dfd3b9bb60dc55`. This inventory includes routes not exposed in the visible menu. API routes are listed separately.

## Page routes (71)

| Route | Rendering | Access boundary | Direct page data sources | Source |
|---|---|---|---|---|
| `/admin/access` | dynamic SSR | guarded/RLS | `profiles`, `roles` | `apps/web/src/app/admin/access/page.tsx` |
| `/admin/audit` | dynamic SSR | guarded/RLS | `user_roles`, `audit_events`, `audit_semantic_events`, `audit_event_ontology_versions`, `audit_event_ontology_entries`, `audit_event_registry`, `audit_event_order_constraints` | `apps/web/src/app/admin/audit/page.tsx` |
| `/admin/bulk-violations` | dynamic SSR | guarded/RLS | `user_roles`, `factories`, `violation_codes` | `apps/web/src/app/admin/bulk-violations/page.tsx` |
| `/admin/compliance-approvals` | dynamic SSR | Shell + RLS | `compliance_configuration_requests`, `compliance_request_components`, `compliance_request_component_dependencies` | `apps/web/src/app/admin/compliance-approvals/page.tsx` |
| `/admin/compliance-requests/[id]` | dynamic SSR | guarded/RLS | `compliance_configuration_requests`, `compliance_request_revisions`, `compliance_request_components`, `compliance_request_component_dependencies`, `compliance_request_decisions`, `compliance_request_publications`, `user_roles` | `apps/web/src/app/admin/compliance-requests/[id]/page.tsx` |
| `/admin/compliance-requests/new` | server/static by Next | Shell + RLS | none in page | `apps/web/src/app/admin/compliance-requests/new/page.tsx` |
| `/admin/compliance-requests` | dynamic SSR | guarded/RLS | `compliance_configuration_requests`, `user_roles` | `apps/web/src/app/admin/compliance-requests/page.tsx` |
| `/admin/devices` | dynamic SSR | Shell + RLS | `mvp3_devices`, `mvp3_device_commands` | `apps/web/src/app/admin/devices/page.tsx` |
| `/admin/enforcement-recommendations` | dynamic SSR | guarded/RLS | `user_roles`, `enforcement_recommendations` | `apps/web/src/app/admin/enforcement-recommendations/page.tsx` |
| `/admin/gis` | dynamic SSR | Shell + RLS | `engine_settings`, `factories` | `apps/web/src/app/admin/gis/page.tsx` |
| `/admin/gis/spatial` | dynamic SSR | Shell + RLS | `gis_layers`, `factory_locations` | `apps/web/src/app/admin/gis/spatial/page.tsx` |
| `/admin/integrations/factory-data` | dynamic SSR | Shell + RLS | `factories`, `senaei_sync_runs`, `factory_import_batches`, `factory_import_rows`, `senaei_reconciliation_records`, `factory_representatives` | `apps/web/src/app/admin/integrations/factory-data/page.tsx` |
| `/admin/integrations` | dynamic SSR | Shell + RLS | `mvp3_integration_endpoints`, `mvp3_api_events`, `mvp3_export_jobs` | `apps/web/src/app/admin/integrations/page.tsx` |
| `/admin/items/[id]/runtime-preview` | dynamic SSR | Shell + RLS | `inspection_items`, `package_version_item_snapshots`, `inspection_item_versions`, `compliance_entity_versions`, `violation_codes` | `apps/web/src/app/admin/items/[id]/runtime-preview/page.tsx` |
| `/admin/items` | dynamic SSR | guarded/RLS | `inspection_items`, `regulation_clauses`, `user_roles` | `apps/web/src/app/admin/items/page.tsx` |
| `/admin/localization` | dynamic SSR | Shell + RLS | `ui_strings` | `apps/web/src/app/admin/localization/page.tsx` |
| `/admin/notifications` | dynamic SSR | guarded/RLS | `user_roles`, `notification_rules`, `roles` | `apps/web/src/app/admin/notifications/page.tsx` |
| `/admin/operations` | dynamic SSR | Shell + RLS | `mvp3_error_queue`, `mvp3_feature_flags`, `mvp3_integration_endpoints` | `apps/web/src/app/admin/operations/page.tsx` |
| `/admin/packages` | dynamic SSR | guarded/RLS | `packages`, `inspection_items`, `configuration_templates`, `violation_codes`, `user_roles` | `apps/web/src/app/admin/packages/page.tsx` |
| `/admin` | dynamic SSR | guarded/RLS | `engine_settings`, `regulations`, `inspection_items`, `package_versions`, `violation_codes`, `audit_events`, `user_roles` | `apps/web/src/app/admin/page.tsx` |
| `/admin/regulations/[id]` | dynamic SSR | route-specific | none in page | `apps/web/src/app/admin/regulations/[id]/page.tsx` |
| `/admin/regulations` | dynamic SSR | guarded/RLS | `user_roles`, `regulations`, `regulation-documents` | `apps/web/src/app/admin/regulations/page.tsx` |
| `/admin/risk/models` | dynamic SSR | Shell + RLS | `risk_models` | `apps/web/src/app/admin/risk/models/page.tsx` |
| `/admin/risk` | dynamic SSR | Shell + RLS | `engine_settings` | `apps/web/src/app/admin/risk/page.tsx` |
| `/admin/security-access` | dynamic SSR | guarded/RLS | `mvp3_access_reviews`, `mvp3_evidence_access_grants`, `user_roles` | `apps/web/src/app/admin/security-access/page.tsx` |
| `/admin/violations` | dynamic SSR | guarded/RLS | `violation_codes`, `regulation_clauses`, `configuration_templates`, `inspection_items`, `user_roles` | `apps/web/src/app/admin/violations/page.tsx` |
| `/admin/workflows` | dynamic SSR | Shell + RLS | `config_versions`, `profiles` | `apps/web/src/app/admin/workflows/page.tsx` |
| `/ai/suggestions` | dynamic SSR | Shell + RLS | `ai_suggestions` | `apps/web/src/app/ai/suggestions/page.tsx` |
| `/cases` | dynamic SSR | Shell + RLS | `cases`, `factories` | `apps/web/src/app/cases/page.tsx` |
| `/committee` | dynamic SSR | Shell + RLS | `signature_acts`, `report_verifications` | `apps/web/src/app/committee/page.tsx` |
| `/dashboard` | dynamic SSR | guarded/RLS | `user_roles`, `visits`, `inspections`, `reviews`, `checklist_responses`, `violations`, `geo_events`, `factories` | `apps/web/src/app/dashboard/page.tsx` |
| `/enforcement` | dynamic SSR | Shell + RLS | `cases`, `objections`, `violations` | `apps/web/src/app/enforcement/page.tsx` |
| `/evidence-ocr` | dynamic SSR | Shell + RLS | `evidence`, `ocr_extractions` | `apps/web/src/app/evidence-ocr/page.tsx` |
| `/factories/[id]` | dynamic SSR | guarded/RLS | `industrial_licenses`, `factories`, `factory_documents`, `factory_representatives`, `factory_products`, `factory_materials`, `user_roles`, `factory_risk_snapshots` | `apps/web/src/app/factories/[id]/page.tsx` |
| `/factories/cr/[id]` | dynamic SSR | guarded/RLS | none in page | `apps/web/src/app/factories/cr/[id]/page.tsx` |
| `/factories` | dynamic SSR | Shell + RLS | `factories` | `apps/web/src/app/factories/page.tsx` |
| `/field/[visitId]` | dynamic SSR | Shell + RLS | `visits`, `engine_settings`, `geo_override_requests` | `apps/web/src/app/field/[visitId]/page.tsx` |
| `/field/factory-360/[id]` | dynamic SSR | guarded/RLS | none in page | `apps/web/src/app/field/factory-360/[id]/page.tsx` |
| `/field/factory-360` | dynamic SSR | Shell + RLS | `industrial_licenses`, `commercial_registrations` | `apps/web/src/app/field/factory-360/page.tsx` |
| `/field/inspection/[id]` | dynamic SSR | Shell + RLS | `inspections`, `inspection_items`, `checklist_responses`, `evidence`, `violations`, `violation_codes`, `engine_settings`, `action_forms` | `apps/web/src/app/field/inspection/[id]/page.tsx` |
| `/field` | dynamic SSR | guarded/RLS | `assignments`, `notifications` | `apps/web/src/app/field/page.tsx` |
| `/incident-reports` | dynamic SSR | Shell + RLS | `incident_reports` | `apps/web/src/app/incident-reports/page.tsx` |
| `/launch/no-workspace` | dynamic SSR | guarded/RLS | none in page | `apps/web/src/app/launch/no-workspace/page.tsx` |
| `/launch` | dynamic SSR | guarded/RLS | `user_roles` | `apps/web/src/app/launch/page.tsx` |
| `/login` | dynamic SSR | route-specific | none in page | `apps/web/src/app/login/page.tsx` |
| `/operations/exceptions` | dynamic SSR | Shell + RLS | `cases`, `risk_exceptions` | `apps/web/src/app/operations/exceptions/page.tsx` |
| `/operations/live` | dynamic SSR | Shell + RLS | `factories`, `visits` | `apps/web/src/app/operations/live/page.tsx` |
| `/operations` | dynamic SSR | Shell + RLS | `visits`, `geo_events`, `action_forms`, `notifications`, `factories`, `engine_settings`, `geo_override_requests`, `evidence` | `apps/web/src/app/operations/page.tsx` |
| `/page.tsx` | server/static by Next | guarded/RLS | none in page | `apps/web/src/app/page.tsx` |
| `/planning/bulk` | dynamic SSR | guarded/RLS | `user_roles`, `factories` | `apps/web/src/app/planning/bulk/page.tsx` |
| `/planning/bulk/review` | dynamic SSR | guarded/RLS | `user_roles` | `apps/web/src/app/planning/bulk/review/page.tsx` |
| `/planning/immediate` | dynamic SSR | guarded/RLS | `user_roles`, `factories`, `package_versions`, `profiles` | `apps/web/src/app/planning/immediate/page.tsx` |
| `/planning` | dynamic SSR | guarded/RLS | `user_roles`, `package_versions`, `visit_plans` | `apps/web/src/app/planning/page.tsx` |
| `/planning/plans/[id]` | dynamic SSR | Shell + RLS | `visit_plans`, `visits` | `apps/web/src/app/planning/plans/[id]/page.tsx` |
| `/planning/plans` | dynamic SSR | Shell + RLS | `visit_plans` | `apps/web/src/app/planning/plans/page.tsx` |
| `/planning/single` | dynamic SSR | guarded/RLS | `user_roles`, `package_versions`, `engine_settings`, `factories` | `apps/web/src/app/planning/single/page.tsx` |
| `/portal` | dynamic SSR | Shell + RLS | `external_requests`, `self_assessments`, `factories` | `apps/web/src/app/portal/page.tsx` |
| `/profile` | dynamic SSR | guarded/RLS | `profiles`, `user_roles`, `notification_preferences` | `apps/web/src/app/profile/page.tsx` |
| `/reports/inspection/[id]` | dynamic SSR | route-specific | `inspections`, `inspection_items` | `apps/web/src/app/reports/inspection/[id]/page.tsx` |
| `/reset` | dynamic SSR | route-specific | none in page | `apps/web/src/app/reset/page.tsx` |
| `/reviews/[id]` | dynamic SSR | guarded/RLS | `user_roles`, `inspections`, `inspection_items`, `audit_events` | `apps/web/src/app/reviews/[id]/page.tsx` |
| `/reviews/[id]/started` | server/static by Next | route-specific | none in page | `apps/web/src/app/reviews/[id]/started/page.tsx` |
| `/reviews` | dynamic SSR | guarded/RLS | `user_roles`, `reviews`, `engine_settings`, `inspections`, `inspection_factory_checks` | `apps/web/src/app/reviews/page.tsx` |
| `/tasks` | dynamic SSR | guarded/RLS | `workflow_task_assignments`, `profiles`, `user_roles` | `apps/web/src/app/tasks/page.tsx` |
| `/virtual/[id]` | dynamic SSR | Shell + RLS | `virtual_sessions` | `apps/web/src/app/virtual/[id]/page.tsx` |
| `/virtual` | dynamic SSR | Shell + RLS | `virtual_sessions`, `visits` | `apps/web/src/app/virtual/page.tsx` |
| `/visits/[id]` | dynamic SSR | guarded/RLS | `profiles`, `visits`, `audit_events`, `visit_attachments`, `attachments` | `apps/web/src/app/visits/[id]/page.tsx` |
| `/visits/calendar` | dynamic SSR | Shell + RLS | `visits` | `apps/web/src/app/visits/calendar/page.tsx` |
| `/visits/map` | dynamic SSR | Shell + RLS | `visits`, `geo_events` | `apps/web/src/app/visits/map/page.tsx` |
| `/visits` | dynamic SSR | guarded/RLS | `visits`, `profiles` | `apps/web/src/app/visits/page.tsx` |
| `/visits/workload` | dynamic SSR | Shell + RLS | `assignments` | `apps/web/src/app/visits/workload/page.tsx` |

## API routes

| Route | Purpose |
|---|---|
| `/api/field/factory-360/snapshot` | RLS-scoped field snapshot |
| `/api/routing/eta` | routing/ETA provider boundary |
| `/api/shell/search` | authenticated global search |

## Measured representative route set

Five cold and ten warm samples were captured for each of `/dashboard`, `/operations`, `/factories`, `/planning`, `/reviews`, and `/ai/suggestions`. These cover the shared shell plus the highest-cost data/control-plane shapes. The complete route tree was inspected statically; it was not credible to claim 15-run runtime measurements for every dynamic/deep route without safe seed identities and mutation authorization.
