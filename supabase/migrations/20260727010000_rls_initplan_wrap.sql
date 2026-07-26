-- TASK-RLS-INITPLAN-WRAP-20260727
-- Wrap parameterless RLS predicates so Postgres evaluates them once per query
-- instead of once per row.
--
-- WHY
-- The field dashboard read (assignments + 4-level embed) exceeded the 8s
-- statement_timeout for `authenticated`. EXPLAIN showed the cost was not the
-- data: has_planning_capability() and has_any_role() take no row-dependent
-- argument, but written bare in a policy they are executed for every row.
-- On a 1230-row scan that is 1874ms of pure predicate evaluation, plus a
-- 1185-loop SubPlan on visits for another 1867ms.
--
-- Wrapping a parameterless call in (SELECT ...) makes it an InitPlan, which
-- Postgres evaluates once. Measured on the assignments scan alone:
--   bare calls          3192 ms
--   wrapped in (SELECT) 1534 ms   (residual = the policy's own bare copy)
--
-- Row-dependent calls are deliberately NOT wrapped -- is_assigned_inspector(visit_id),
-- inspects_same_factory(visit_id), can_read_semantic_audit_object(...) must stay
-- per-row or they would change meaning.
--
-- EQUIVALENCE PROOF (run before applying, on live data)
-- For every rewritten clause, `old IS DISTINCT FROM new` was evaluated over every
-- row of its table as superuser (RLS bypassed, so the whole table is covered),
-- for three identities: inspector, inspector+ops+reviewer, and a second inspector.
--   981 checks / 327 distinct clauses / 0 row mismatches / 0 errors
-- This changes evaluation count only. No role gains or loses a single row.
--
-- 275 policies. Generated from pg_policies, not hand-edited.

begin;

ALTER POLICY actions_rw ON public.action_forms
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = action_forms.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text])))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = action_forms.inspection_id) AND is_assigned_inspector(i.visit_id)))));

ALTER POLICY ai_events_read ON public.ai_events
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY ai_events_write ON public.ai_events
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY ai_suggestions_read ON public.ai_suggestions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY ai_suggestions_update ON public.ai_suggestions
  USING (((SELECT auth.uid()) IS NOT NULL))
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY ai_suggestions_write ON public.ai_suggestions
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY assignments_insert_immediate_inspector ON public.assignments
  WITH CHECK ((( SELECT (SELECT has_role('inspector'::text)) AS has_role) AND (inspector_id = ( SELECT auth.uid() AS uid)) AND private.is_owned_inspector_immediate(visit_id)));

ALTER POLICY assignments_read ON public.assignments
  USING (((inspector_id = (SELECT auth.uid())) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'auditor'::text]))));

ALTER POLICY assignments_read_capability ON public.assignments
  USING ((SELECT has_planning_capability('planning.view'::text)));

ALTER POLICY assignments_update ON public.assignments
  USING (((inspector_id = (SELECT auth.uid())) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text]))));

ALTER POLICY assignments_update_capability ON public.assignments
  USING (((SELECT has_planning_capability('planning.manage'::text)) OR (SELECT has_planning_capability('planning.publish'::text))));

ALTER POLICY assignments_write ON public.assignments
  WITH CHECK ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text])));

ALTER POLICY assignments_write_capability ON public.assignments
  WITH CHECK (((SELECT has_planning_capability('planning.manage'::text)) OR (SELECT has_planning_capability('planning.publish'::text))));

ALTER POLICY audit_ontology_entries_read ON public.audit_event_ontology_entries
  USING ((SELECT has_any_role(ARRAY['auditor'::text, 'ops'::text, 'security_admin'::text, 'leadership'::text, 'reviewer'::text, 'planner'::text, 'compliance_admin'::text])));

ALTER POLICY audit_ontology_versions_read ON public.audit_event_ontology_versions
  USING ((SELECT has_any_role(ARRAY['auditor'::text, 'ops'::text, 'security_admin'::text, 'leadership'::text, 'reviewer'::text, 'planner'::text, 'compliance_admin'::text])));

ALTER POLICY audit_order_constraints_read ON public.audit_event_order_constraints
  USING ((SELECT has_any_role(ARRAY['auditor'::text, 'ops'::text, 'security_admin'::text, 'leadership'::text, 'reviewer'::text, 'planner'::text, 'compliance_admin'::text])));

ALTER POLICY audit_registry_read ON public.audit_event_registry
  USING ((SELECT has_any_role(ARRAY['auditor'::text, 'ops'::text, 'security_admin'::text, 'leadership'::text, 'reviewer'::text, 'planner'::text, 'compliance_admin'::text])));

ALTER POLICY audit_semantic_mapping_read ON public.audit_event_semantic_mappings
  USING (((SELECT has_any_role(ARRAY['auditor'::text, 'ops'::text, 'security_admin'::text, 'leadership'::text, 'reviewer'::text, 'planner'::text, 'compliance_admin'::text])) AND (EXISTS ( SELECT 1
   FROM audit_events ae
  WHERE (ae.id = audit_event_semantic_mappings.audit_event_id)))));

ALTER POLICY audit_read ON public.audit_events
  USING ((SELECT has_any_role(ARRAY['auditor'::text, 'ops'::text, 'security_admin'::text, 'leadership'::text, 'reviewer'::text, 'planner'::text])));

ALTER POLICY audit_read_compliance ON public.audit_events
  USING ((SELECT has_role('compliance_admin'::text)));

ALTER POLICY audit_semantic_read ON public.audit_semantic_events
  USING (((SELECT has_any_role(ARRAY['auditor'::text, 'ops'::text, 'security_admin'::text, 'leadership'::text, 'reviewer'::text, 'planner'::text, 'compliance_admin'::text])) AND can_read_semantic_audit_object(aggregate_type, aggregate_id, source_audit_event_id)));

ALTER POLICY bulk_violation_batch_items_rw ON public.bulk_violation_batch_items
  USING ((SELECT has_any_role(ARRAY['ops'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['ops'::text, 'compliance_admin'::text])));

ALTER POLICY bulk_violation_batches_rw ON public.bulk_violation_batches
  USING ((SELECT has_any_role(ARRAY['ops'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['ops'::text, 'compliance_admin'::text])));

ALTER POLICY cancellation_requests_read ON public.cancellation_requests
  USING (((requested_by = ( SELECT auth.uid() AS uid)) OR (SELECT has_any_role(ARRAY['ops'::text, 'planner'::text, 'leadership'::text]))));

ALTER POLICY cases_read ON public.cases
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY cases_update ON public.cases
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'reviewer'::text, 'security_admin'::text, 'leadership'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'reviewer'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY cases_write ON public.cases
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'reviewer'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY responses_read_oversight ON public.checklist_responses
  USING ((SELECT has_any_role(ARRAY['ops'::text, 'leadership'::text])));

ALTER POLICY responses_rw ON public.checklist_responses
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = checklist_responses.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text])))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = checklist_responses.inspection_id) AND is_assigned_inspector(i.visit_id)))));

ALTER POLICY f360_commercial_registrations_admin ON public.commercial_registrations
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_commercial_registrations_read ON public.commercial_registrations
  USING ((SELECT has_permission('view_factory_360'::text)));

ALTER POLICY ccr_requests_read ON public.compliance_configuration_requests
  USING (((owner_id = (SELECT auth.uid())) OR (SELECT ccr_is_reviewer())));

ALTER POLICY ccr_heads_read ON public.compliance_entity_heads
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY ccr_versions_read ON public.compliance_entity_versions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY compliance_lookup_types_read ON public.compliance_lookup_types
  USING ((((SELECT auth.uid()) IS NOT NULL) AND active));

ALTER POLICY compliance_lookup_values_read ON public.compliance_lookup_values
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY config_read ON public.config_versions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY config_update ON public.config_versions
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text, 'workflow_admin'::text, 'risk_owner'::text, 'gis_admin'::text, 'security_admin'::text])));

ALTER POLICY config_write ON public.config_versions
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text, 'workflow_admin'::text, 'risk_owner'::text, 'gis_admin'::text, 'security_admin'::text])));

ALTER POLICY configuration_templates_read ON public.configuration_templates
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY configuration_templates_write ON public.configuration_templates
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY correction_evidence_internal_read ON public.correction_evidence
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY correction_evidence_internal_update ON public.correction_evidence
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY correction_evidence_internal_write ON public.correction_evidence
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY dash_config_heads_read ON public.dashboard_config_heads
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY dash_config_parameters_read ON public.dashboard_config_parameters
  USING (((owner_id = (SELECT auth.uid())) OR (SELECT dash_is_config_writer()) OR (SELECT dash_is_config_reviewer())));

ALTER POLICY dash_config_versions_read ON public.dashboard_config_versions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY enforcement_recommendations_decide ON public.enforcement_recommendations
  USING ((SELECT has_any_role(ARRAY['ops'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['ops'::text, 'compliance_admin'::text])));

ALTER POLICY enforcement_recommendations_insert ON public.enforcement_recommendations
  WITH CHECK (((SELECT has_any_role(ARRAY['inspector'::text])) AND (recommended_by = ( SELECT auth.uid() AS uid)) AND ((visit_id IS NULL) OR is_assigned_inspector(visit_id))));

ALTER POLICY enforcement_recommendations_read ON public.enforcement_recommendations
  USING ((SELECT has_any_role(ARRAY['inspector'::text, 'planner'::text, 'ops'::text, 'compliance_admin'::text, 'auditor'::text, 'reviewer'::text, 'leadership'::text])));

ALTER POLICY engine_read ON public.engine_settings
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY engine_write ON public.engine_settings
  USING ((SELECT has_any_role(ARRAY['risk_owner'::text, 'gis_admin'::text, 'compliance_admin'::text, 'workflow_admin'::text, 'security_admin'::text])));

ALTER POLICY evidence_rw ON public.evidence
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = evidence.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text])))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = evidence.inspection_id) AND is_assigned_inspector(i.visit_id)))));

ALTER POLICY evidence_visit_rw ON public.evidence
  USING (((visit_id IS NOT NULL) AND (is_assigned_inspector(visit_id) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'auditor'::text])))))
  WITH CHECK (((visit_id IS NOT NULL) AND is_assigned_inspector(visit_id)));

ALTER POLICY external_requests_internal_read ON public.external_requests
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY external_requests_internal_update ON public.external_requests
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY external_requests_internal_write ON public.external_requests
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY f360_external_source_connections_admin ON public.external_source_connections
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY factories_insert_immediate_inspector ON public.factories
  WITH CHECK ((( SELECT (SELECT has_role('inspector'::text)) AS has_role) AND is_temporary AND (source = 'immediate_manual'::text) AND (official_lat IS NULL) AND (official_lng IS NULL)));

ALTER POLICY factories_read ON public.factories
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY factories_update ON public.factories
  USING ((SELECT has_any_role(ARRAY['gis_admin'::text, 'planner'::text])))
  WITH CHECK (true);

ALTER POLICY factories_write_admin ON public.factories
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'planner'::text, 'compliance_admin'::text])));

ALTER POLICY fdocs_read ON public.factory_documents
  USING ((SELECT has_any_role(ARRAY['planner'::text, 'inspector'::text, 'reviewer'::text, 'ops'::text, 'auditor'::text, 'compliance_admin'::text, 'gis_admin'::text])));

ALTER POLICY fdocs_write ON public.factory_documents
  WITH CHECK ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'compliance_admin'::text, 'gis_admin'::text])));

ALTER POLICY f360_factory_government_records_admin ON public.factory_government_records
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_factory_government_records_read ON public.factory_government_records
  USING ((SELECT has_permission('view_factory_360'::text)));

ALTER POLICY f360_factory_import_batches_admin ON public.factory_import_batches
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_factory_import_rows_admin ON public.factory_import_rows
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY factory_locations_read ON public.factory_locations
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY factory_locations_update ON public.factory_locations
  USING ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY factory_locations_write ON public.factory_locations
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY fmat_read ON public.factory_materials
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY fmat_write ON public.factory_materials
  WITH CHECK ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'compliance_admin'::text])));

ALTER POLICY f360_media_admin ON public.factory_media_assets
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_media_read ON public.factory_media_assets
  USING ((((category = ANY (ARRAY['official_factory_image'::text, 'factory_profile_image'::text])) AND (SELECT has_permission('view_factory_documents'::text))) OR ((category <> ALL (ARRAY['official_factory_image'::text, 'factory_profile_image'::text])) AND (EXISTS ( SELECT 1
   FROM (evidence e
     LEFT JOIN inspections i ON ((i.id = e.inspection_id)))
  WHERE ((e.id = factory_media_assets.evidence_id) AND ((SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text])) OR ((i.id IS NOT NULL) AND is_assigned_inspector(i.visit_id)) OR ((e.visit_id IS NOT NULL) AND is_assigned_inspector(e.visit_id)))))))));

ALTER POLICY fprod_read ON public.factory_products
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY fprod_write ON public.factory_products
  WITH CHECK ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'compliance_admin'::text])));

ALTER POLICY freps_read ON public.factory_representatives
  USING ((SELECT has_any_role(ARRAY['planner'::text, 'inspector'::text, 'reviewer'::text, 'ops'::text, 'auditor'::text, 'compliance_admin'::text])));

ALTER POLICY freps_update ON public.factory_representatives
  USING ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'compliance_admin'::text])));

ALTER POLICY freps_write ON public.factory_representatives
  WITH CHECK ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'compliance_admin'::text])));

ALTER POLICY factory_risk_snapshots_read ON public.factory_risk_snapshots
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY feedback_inspector_insert ON public.feedback
  WITH CHECK ((is_assigned_inspector(visit_id) AND (submitted_by = (SELECT auth.uid()))));

ALTER POLICY feedback_read ON public.feedback
  USING ((is_assigned_inspector(visit_id) OR (SELECT has_any_role(ARRAY['admin'::text, 'exec'::text, 'reviewer'::text, 'ops'::text]))));

ALTER POLICY feedback_aspect_read ON public.feedback_aspect
  USING ((EXISTS ( SELECT 1
   FROM feedback f
  WHERE ((f.id = feedback_aspect.feedback_id) AND (is_assigned_inspector(f.visit_id) OR (SELECT has_any_role(ARRAY['admin'::text, 'exec'::text, 'reviewer'::text, 'ops'::text])))))));

ALTER POLICY findings_rw ON public.findings
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = findings.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text])))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = findings.inspection_id) AND is_assigned_inspector(i.visit_id)))));

ALTER POLICY geo_insert ON public.geo_events
  WITH CHECK ((is_assigned_inspector(visit_id) OR (SELECT has_role('ops'::text))));

ALTER POLICY geo_read ON public.geo_events
  USING (((SELECT has_any_role(ARRAY['ops'::text, 'auditor'::text, 'reviewer'::text, 'planner'::text, 'leadership'::text])) OR is_assigned_inspector(visit_id)));

ALTER POLICY geo_override_requests_read ON public.geo_override_requests
  USING (((requested_by = ( SELECT auth.uid() AS uid)) OR (SELECT has_role('ops'::text))));

ALTER POLICY gis_layers_read ON public.gis_layers
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY gis_layers_update ON public.gis_layers
  USING ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY gis_layers_write ON public.gis_layers
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY incident_reports_insert ON public.incident_reports
  WITH CHECK (((SELECT has_any_role(ARRAY['inspector'::text])) AND (created_by = (SELECT auth.uid())) AND ((visit_id IS NULL) OR is_assigned_inspector(visit_id))));

ALTER POLICY incident_reports_read ON public.incident_reports
  USING ((SELECT has_any_role(ARRAY['inspector'::text, 'planner'::text, 'ops'::text, 'compliance_admin'::text, 'auditor'::text, 'reviewer'::text, 'leadership'::text])));

ALTER POLICY f360_industrial_licenses_admin ON public.industrial_licenses
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_industrial_licenses_read ON public.industrial_licenses
  USING ((SELECT has_permission('view_factory_360'::text)));

ALTER POLICY ifc_read ON public.inspection_factory_checks
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = inspection_factory_checks.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'ops'::text, 'auditor'::text, 'leadership'::text])))))));

ALTER POLICY f360_inspection_snapshots_insert ON public.inspection_factory_snapshots
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (submission_versions sv
     JOIN inspections i ON ((i.id = sv.inspection_id)))
  WHERE ((sv.id = inspection_factory_snapshots.submission_version_id) AND (sv.submitted_by = (SELECT auth.uid())) AND is_assigned_inspector(i.visit_id)))));

ALTER POLICY f360_inspection_snapshots_read ON public.inspection_factory_snapshots
  USING (((SELECT has_permission('view_factory_360'::text)) AND (EXISTS ( SELECT 1
   FROM (submission_versions sv
     JOIN inspections i ON ((i.id = sv.inspection_id)))
  WHERE ((sv.id = inspection_factory_snapshots.submission_version_id) AND ((SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text, 'planner'::text, 'leadership'::text])) OR is_assigned_inspector(i.visit_id)))))));

ALTER POLICY inspection_item_states_read ON public.inspection_item_states
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = inspection_item_states.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text, 'planner'::text, 'leadership'::text])))))));

ALTER POLICY inspection_item_versions_read ON public.inspection_item_versions
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY inspection_items_admin ON public.inspection_items
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY inspection_items_read ON public.inspection_items
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY inspection_penalties_read ON public.inspection_penalties
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY inspections_read ON public.inspections
  USING ((is_assigned_inspector(visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text, 'planner'::text, 'leadership'::text]))));

ALTER POLICY inspections_update ON public.inspections
  USING ((is_assigned_inspector(visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'ops'::text]))));

ALTER POLICY inspector_briefing_cache_insert ON public.inspector_briefing_cache
  WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY inspector_briefing_cache_read ON public.inspector_briefing_cache
  USING (((SELECT auth.uid()) = user_id));

ALTER POLICY inspector_briefing_cache_update ON public.inspector_briefing_cache
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY journeys_select ON public.journey_sessions
  USING (((inspector_id = (SELECT auth.uid())) OR (SELECT has_any_role(ARRAY['ops'::text, 'auditor'::text, 'reviewer'::text, 'planner'::text, 'leadership'::text]))));

ALTER POLICY journeys_update ON public.journey_sessions
  USING (((inspector_id = (SELECT auth.uid())) OR (SELECT has_role('ops'::text))));

ALTER POLICY journeys_write ON public.journey_sessions
  WITH CHECK ((inspector_id = (SELECT auth.uid())));

ALTER POLICY location_visibility_matrix_read ON public.location_visibility_matrix
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY location_visibility_matrix_update ON public.location_visibility_matrix
  USING ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY location_visibility_matrix_write ON public.location_visibility_matrix
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY map_packs_read ON public.map_packs
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY map_packs_update ON public.map_packs
  USING ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY map_packs_write ON public.map_packs
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY mvp3_access_reviews_insert ON public.mvp3_access_reviews
  WITH CHECK ((( SELECT (SELECT has_role('security_admin'::text)) AS has_role) AND (opened_by = ( SELECT auth.uid() AS uid)) AND (status = 'open'::text) AND (reviewed_by IS NULL)));

ALTER POLICY mvp3_access_reviews_read ON public.mvp3_access_reviews
  USING (((subject_user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role)));

ALTER POLICY mvp3_api_events_insert ON public.mvp3_api_events
  WITH CHECK (((actor_id = ( SELECT auth.uid() AS uid)) AND (( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('workflow_admin'::text)) AS has_role))));

ALTER POLICY mvp3_api_events_read ON public.mvp3_api_events
  USING ((( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role)));

ALTER POLICY mvp3_device_commands_insert ON public.mvp3_device_commands
  WITH CHECK (((requested_by = ( SELECT auth.uid() AS uid)) AND (( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role))));

ALTER POLICY mvp3_device_commands_read ON public.mvp3_device_commands
  USING ((( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role)));

ALTER POLICY mvp3_devices_insert ON public.mvp3_devices
  WITH CHECK (((( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role)) AND (enrolled_by = ( SELECT auth.uid() AS uid)) AND (trust_status = 'pending'::text)));

ALTER POLICY mvp3_devices_read ON public.mvp3_devices
  USING (((assigned_user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role)));

ALTER POLICY mvp3_errors_insert ON public.mvp3_error_queue
  WITH CHECK ((( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role)));

ALTER POLICY mvp3_errors_read ON public.mvp3_error_queue
  USING ((( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role)));

ALTER POLICY mvp3_evidence_grants_insert ON public.mvp3_evidence_access_grants
  WITH CHECK ((( SELECT (SELECT has_role('security_admin'::text)) AS has_role) AND (granted_by = ( SELECT auth.uid() AS uid))));

ALTER POLICY mvp3_evidence_grants_read ON public.mvp3_evidence_access_grants
  USING (((grantee_user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role)));

ALTER POLICY mvp3_evidence_grants_update ON public.mvp3_evidence_access_grants
  USING (( SELECT (SELECT has_role('security_admin'::text)) AS has_role))
  WITH CHECK ((( SELECT (SELECT has_role('security_admin'::text)) AS has_role) AND (granted_by = ( SELECT auth.uid() AS uid))));

ALTER POLICY mvp3_exports_read ON public.mvp3_export_jobs
  USING (((requested_by = ( SELECT auth.uid() AS uid)) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role) OR ( SELECT (SELECT has_role('leadership'::text)) AS has_role)));

ALTER POLICY mvp3_flags_insert ON public.mvp3_feature_flags
  WITH CHECK ((( SELECT (SELECT has_role('security_admin'::text)) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid)) AND (status = 'draft'::text) AND (approved_by IS NULL)));

ALTER POLICY mvp3_package_manifests_read ON public.mvp3_inspection_package_manifests
  USING ((( SELECT (SELECT has_role('form_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('planner'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR (EXISTS ( SELECT 1
   FROM (inspections i
     JOIN assignments a ON ((a.visit_id = i.visit_id)))
  WHERE ((i.id = mvp3_inspection_package_manifests.inspection_id) AND (a.inspector_id = ( SELECT auth.uid() AS uid)))))));

ALTER POLICY mvp3_integrations_insert ON public.mvp3_integration_endpoints
  WITH CHECK (( SELECT (SELECT has_role('security_admin'::text)) AS has_role));

ALTER POLICY mvp3_integrations_read ON public.mvp3_integration_endpoints
  USING ((( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('workflow_admin'::text)) AS has_role)));

ALTER POLICY mvp3_integrations_update ON public.mvp3_integration_endpoints
  USING (( SELECT (SELECT has_role('security_admin'::text)) AS has_role))
  WITH CHECK (( SELECT (SELECT has_role('security_admin'::text)) AS has_role));

ALTER POLICY mvp3_kpis_insert ON public.mvp3_kpi_definitions
  WITH CHECK (((( SELECT (SELECT has_role('leadership'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role)) AND (created_by = ( SELECT auth.uid() AS uid)) AND (status = 'draft'::text) AND (approved_by IS NULL)));

ALTER POLICY mvp3_package_access_events_read ON public.mvp3_package_access_events
  USING (((actor_id = ( SELECT auth.uid() AS uid)) OR ( SELECT (SELECT has_role('ops'::text)) AS has_role) OR ( SELECT (SELECT has_role('security_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role)));

ALTER POLICY mvp3_signature_refusals_read ON public.mvp3_signature_refusals
  USING (((recorded_by = ( SELECT auth.uid() AS uid)) OR ( SELECT (SELECT has_role('reviewer'::text)) AS has_role) OR ( SELECT (SELECT has_role('compliance_admin'::text)) AS has_role) OR ( SELECT (SELECT has_role('auditor'::text)) AS has_role)));

ALTER POLICY notification_preferences_own ON public.notification_preferences
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

ALTER POLICY notification_rules_admin ON public.notification_rules
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text, 'workflow_admin'::text, 'risk_owner'::text, 'gis_admin'::text, 'security_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text, 'workflow_admin'::text, 'risk_owner'::text, 'gis_admin'::text, 'security_admin'::text])));

ALTER POLICY notification_rules_read ON public.notification_rules
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY notif_insert_authed ON public.notifications
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY notif_own ON public.notifications
  USING (((recipient = (SELECT auth.uid())) OR (SELECT has_role('ops'::text))));

ALTER POLICY notif_update_recipient ON public.notifications
  USING (((recipient = (SELECT auth.uid())) OR (SELECT has_role('ops'::text))))
  WITH CHECK (((recipient = (SELECT auth.uid())) OR (SELECT has_role('ops'::text))));

ALTER POLICY objections_internal_read ON public.objections
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY objections_internal_update ON public.objections
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY objections_internal_write ON public.objections
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY ocr_extractions_read ON public.ocr_extractions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY ocr_extractions_write ON public.ocr_extractions
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY package_version_dependency_snapshots_read ON public.package_version_dependency_snapshots
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY package_version_item_snapshots_read ON public.package_version_item_snapshots
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY package_versions_admin ON public.package_versions
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY package_versions_read ON public.package_versions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY packages_admin ON public.packages
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY packages_read ON public.packages
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY penalty_mappings_admin ON public.penalty_mappings
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY penalty_mappings_read ON public.penalty_mappings
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY penalty_notices_insert ON public.penalty_notices
  WITH CHECK (((SELECT has_any_role(ARRAY['compliance_admin'::text, 'ops'::text])) AND (issued_by = (SELECT auth.uid()))));

ALTER POLICY penalty_notices_read ON public.penalty_notices
  USING ((SELECT has_any_role(ARRAY['reviewer'::text, 'ops'::text, 'auditor'::text, 'compliance_admin'::text, 'leadership'::text])));

ALTER POLICY f360_permissions_read ON public.permissions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY planning_expiry_rules_read ON public.planning_expiry_rules
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY planning_expiry_rules_update ON public.planning_expiry_rules
  USING ((SELECT has_planning_capability('planning.configure_expiry'::text)));

ALTER POLICY planning_expiry_rules_write ON public.planning_expiry_rules
  WITH CHECK ((SELECT has_planning_capability('planning.configure_expiry'::text)));

ALTER POLICY planning_lookups_read ON public.planning_lookups
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY planning_lookups_update ON public.planning_lookups
  USING ((SELECT has_planning_capability('planning.configure_lookups'::text)));

ALTER POLICY planning_lookups_write ON public.planning_lookups
  WITH CHECK ((SELECT has_planning_capability('planning.configure_lookups'::text)));

ALTER POLICY f360_plant_addresses_admin ON public.plant_addresses
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_plant_addresses_gis_admin ON public.plant_addresses
  USING ((SELECT has_role('gis_admin'::text)))
  WITH CHECK ((SELECT has_role('gis_admin'::text)));

ALTER POLICY f360_plant_addresses_read ON public.plant_addresses
  USING ((SELECT has_permission('view_factory_360'::text)));

ALTER POLICY f360_plant_production_line_items_admin ON public.plant_production_line_items
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_plant_production_line_items_read ON public.plant_production_line_items
  USING ((SELECT has_permission('view_factory_360'::text)));

ALTER POLICY profiles_self ON public.profiles
  USING ((((SELECT auth.uid()) = user_id) OR (SELECT has_role('security_admin'::text)) OR (SELECT has_role('ops'::text)) OR (SELECT has_role('planner'::text))));

ALTER POLICY push_subscriptions_own_delete ON public.push_subscriptions
  USING (((SELECT auth.uid()) = user_id));

ALTER POLICY push_subscriptions_own_insert ON public.push_subscriptions
  WITH CHECK (((SELECT auth.uid()) = user_id));

ALTER POLICY push_subscriptions_own_select ON public.push_subscriptions
  USING (((SELECT auth.uid()) = user_id));

ALTER POLICY regulation_attachments_admin ON public.regulation_attachments
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK (((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])) AND (uploaded_by = (SELECT auth.uid()))));

ALTER POLICY regulation_attachments_read ON public.regulation_attachments
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY regulation_clauses_admin ON public.regulation_clauses
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY regulation_clauses_read ON public.regulation_clauses
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY regulations_admin ON public.regulations
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY regulations_read ON public.regulations
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY reopening_notice_lines_write ON public.reopening_notice_lines
  USING ((EXISTS ( SELECT 1
   FROM reopening_notices n
  WHERE ((n.id = reopening_notice_lines.notice_id) AND (n.created_by = (SELECT auth.uid())) AND (n.status = 'draft'::text) AND is_assigned_inspector(n.visit_id)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM reopening_notices n
  WHERE ((n.id = reopening_notice_lines.notice_id) AND (n.created_by = (SELECT auth.uid())) AND (n.status = 'draft'::text) AND is_assigned_inspector(n.visit_id)))));

ALTER POLICY reopening_notices_insert ON public.reopening_notices
  WITH CHECK (((SELECT has_any_role(ARRAY['inspector'::text])) AND (created_by = (SELECT auth.uid())) AND is_assigned_inspector(visit_id)));

ALTER POLICY reopening_notices_read ON public.reopening_notices
  USING ((SELECT has_any_role(ARRAY['inspector'::text, 'planner'::text, 'ops'::text, 'compliance_admin'::text, 'auditor'::text, 'reviewer'::text, 'leadership'::text])));

ALTER POLICY reopening_notices_update ON public.reopening_notices
  USING (((SELECT has_any_role(ARRAY['inspector'::text])) AND (created_by = (SELECT auth.uid())) AND is_assigned_inspector(visit_id) AND (status = 'draft'::text)))
  WITH CHECK (((created_by = (SELECT auth.uid())) AND is_assigned_inspector(visit_id)));

ALTER POLICY report_verifications_read ON public.report_verifications
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY report_verifications_write ON public.report_verifications
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY reviews_insert ON public.reviews
  WITH CHECK ((SELECT has_any_role(ARRAY['reviewer'::text, 'ops'::text])));

ALTER POLICY reviews_read ON public.reviews
  USING (((reviewer_id = (SELECT auth.uid())) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text, 'leadership'::text])) OR (EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = reviews.inspection_id) AND is_assigned_inspector(i.visit_id))))));

ALTER POLICY reviews_update ON public.reviews
  USING ((reviewer_id = (SELECT auth.uid())));

ALTER POLICY risk_exceptions_read ON public.risk_exceptions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY risk_exceptions_update ON public.risk_exceptions
  USING ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_exceptions_write ON public.risk_exceptions
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_models_read ON public.risk_models
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY risk_models_update ON public.risk_models
  USING ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_models_write ON public.risk_models
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_overrides_read ON public.risk_overrides
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY risk_overrides_update ON public.risk_overrides
  USING ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_overrides_write ON public.risk_overrides
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_runs_read ON public.risk_runs
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY risk_runs_update ON public.risk_runs
  USING ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_runs_write ON public.risk_runs
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_simulations_read ON public.risk_simulations
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY risk_simulations_update ON public.risk_simulations
  USING ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_simulations_write ON public.risk_simulations
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_variables_read ON public.risk_variables
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY risk_variables_update ON public.risk_variables
  USING ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY risk_variables_write ON public.risk_variables
  WITH CHECK ((SELECT has_any_role(ARRAY['risk_owner'::text, 'compliance_admin'::text, 'security_admin'::text])));

ALTER POLICY f360_role_permissions_admin ON public.role_permissions
  USING ((SELECT has_role('security_admin'::text)))
  WITH CHECK ((SELECT has_role('security_admin'::text)));

ALTER POLICY f360_role_permissions_read ON public.role_permissions
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY roles_read ON public.roles
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY route_snapshots_read ON public.route_snapshots
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY route_snapshots_update ON public.route_snapshots
  USING ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY route_snapshots_write ON public.route_snapshots
  WITH CHECK ((SELECT has_any_role(ARRAY['gis_admin'::text, 'security_admin'::text, 'compliance_admin'::text])));

ALTER POLICY self_assessments_internal_read ON public.self_assessments
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY self_assessments_internal_update ON public.self_assessments
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY self_assessments_internal_write ON public.self_assessments
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'leadership'::text])));

ALTER POLICY f360_senaei_raw_snapshots_admin ON public.senaei_raw_snapshots
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_senaei_reconciliation_records_admin ON public.senaei_reconciliation_records
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_senaei_sync_calls_admin ON public.senaei_sync_calls
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY f360_senaei_sync_runs_admin ON public.senaei_sync_runs
  USING ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['security_admin'::text, 'workflow_admin'::text, 'compliance_admin'::text])));

ALTER POLICY signature_acts_read ON public.signature_acts
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY signature_acts_write ON public.signature_acts
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY sla_calendars_read ON public.sla_calendars
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY sla_calendars_update ON public.sla_calendars
  USING ((SELECT has_any_role(ARRAY['workflow_admin'::text, 'compliance_admin'::text, 'ops'::text, 'leadership'::text])));

ALTER POLICY sla_calendars_write ON public.sla_calendars
  WITH CHECK ((SELECT has_any_role(ARRAY['workflow_admin'::text, 'compliance_admin'::text, 'ops'::text, 'leadership'::text])));

ALTER POLICY sla_timers_read ON public.sla_timers
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY sla_timers_update ON public.sla_timers
  USING ((SELECT has_any_role(ARRAY['workflow_admin'::text, 'compliance_admin'::text, 'ops'::text, 'leadership'::text])));

ALTER POLICY sla_timers_write ON public.sla_timers
  WITH CHECK ((SELECT has_any_role(ARRAY['workflow_admin'::text, 'compliance_admin'::text, 'ops'::text, 'leadership'::text])));

ALTER POLICY subs_read ON public.submission_versions
  USING (((SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'leadership'::text, 'planner'::text, 'ops'::text])) OR (EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = submission_versions.inspection_id) AND is_assigned_inspector(i.visit_id))))));

ALTER POLICY ui_strings_update ON public.ui_strings
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'workflow_admin'::text])));

ALTER POLICY ui_strings_write ON public.ui_strings
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'security_admin'::text, 'workflow_admin'::text])));

ALTER POLICY user_capability_grants_read_admin ON public.user_capability_grants
  USING ((SELECT has_role('security_admin'::text)));

ALTER POLICY user_roles_admin ON public.user_roles
  WITH CHECK ((SELECT has_role('security_admin'::text)));

ALTER POLICY user_roles_read ON public.user_roles
  USING (((user_id = (SELECT auth.uid())) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'security_admin'::text, 'reviewer'::text, 'auditor'::text, 'compliance_admin'::text]))));

ALTER POLICY violation_codes_admin ON public.violation_codes
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])))
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text])));

ALTER POLICY violation_codes_read ON public.violation_codes
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY violations_read ON public.violations
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY vs_write ON public.virtual_sessions
  USING (((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text])) OR is_assigned_inspector(visit_id)))
  WITH CHECK (true);

ALTER POLICY va_insert ON public.visit_attachments
  WITH CHECK (((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text])) AND (uploaded_by = (SELECT auth.uid()))));

ALTER POLICY va_read ON public.visit_attachments
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY va_update ON public.visit_attachments
  USING ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text])));

ALTER POLICY visit_lifecycle_events_insert ON public.visit_lifecycle_events
  WITH CHECK (((SELECT has_planning_capability('planning.manage'::text)) OR (SELECT has_planning_capability('planning.cancel'::text)) OR (SELECT has_planning_capability('planning.reassign'::text)) OR (SELECT has_planning_capability('planning.reschedule'::text)) OR (SELECT has_planning_capability('planning.edit_draft'::text))));

ALTER POLICY visit_lifecycle_events_read ON public.visit_lifecycle_events
  USING (((SELECT has_planning_capability('planning.view'::text)) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'auditor'::text, 'leadership'::text, 'compliance_admin'::text])) OR (EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.visit_id = visit_lifecycle_events.visit_id) AND (a.inspector_id = (SELECT auth.uid())))))));

ALTER POLICY visit_location_corrections_read ON public.visit_location_corrections
  USING ((is_assigned_inspector(visit_id) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'leadership'::text]))));

ALTER POLICY visit_location_events_insert ON public.visit_location_events
  WITH CHECK (((SELECT has_planning_capability('planning.correct_location'::text)) OR (SELECT has_planning_capability('planning.manage'::text))));

ALTER POLICY visit_location_events_read ON public.visit_location_events
  USING (((SELECT has_planning_capability('planning.view'::text)) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'auditor'::text, 'leadership'::text, 'compliance_admin'::text])) OR (EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.visit_id = visit_location_events.visit_id) AND (a.inspector_id = (SELECT auth.uid())))))));

ALTER POLICY visit_package_snapshots_read ON public.visit_package_snapshots
  USING ((is_assigned_inspector(visit_id) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'leadership'::text]))));

ALTER POLICY visit_packages_read ON public.visit_packages
  USING (((SELECT has_planning_capability('planning.view'::text)) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'auditor'::text, 'leadership'::text, 'compliance_admin'::text])) OR (EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.visit_id = visit_packages.visit_id) AND (a.inspector_id = (SELECT auth.uid())))))));

ALTER POLICY visit_packages_update ON public.visit_packages
  USING (((SELECT has_planning_capability('planning.create'::text)) OR (SELECT has_planning_capability('planning.edit_draft'::text))));

ALTER POLICY visit_packages_write ON public.visit_packages
  WITH CHECK (((SELECT has_planning_capability('planning.create'::text)) OR (SELECT has_planning_capability('planning.edit_draft'::text))));

ALTER POLICY plans_read ON public.visit_plans
  USING ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'auditor'::text, 'leadership'::text])));

ALTER POLICY plans_read_capability ON public.visit_plans
  USING ((SELECT has_planning_capability('planning.view'::text)));

ALTER POLICY plans_update ON public.visit_plans
  USING ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text])));

ALTER POLICY plans_update_capability ON public.visit_plans
  USING ((SELECT has_planning_capability('planning.edit_draft'::text)));

ALTER POLICY plans_write ON public.visit_plans
  WITH CHECK ((SELECT has_role('planner'::text)));

ALTER POLICY plans_write_capability ON public.visit_plans
  WITH CHECK ((SELECT has_planning_capability('planning.create'::text)));

ALTER POLICY visit_preparations_read ON public.visit_preparations
  USING ((is_assigned_inspector(visit_id) OR (SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text]))));

ALTER POLICY visit_result_reports_read ON public.visit_result_reports
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = visit_result_reports.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text, 'planner'::text, 'leadership'::text])))))));

ALTER POLICY visit_result_samples_read ON public.visit_result_samples
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = visit_result_samples.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text, 'planner'::text, 'leadership'::text])))))));

ALTER POLICY visit_result_seized_products_read ON public.visit_result_seized_products
  USING ((EXISTS ( SELECT 1
   FROM inspections i
  WHERE ((i.id = visit_result_seized_products.inspection_id) AND (is_assigned_inspector(i.visit_id) OR (SELECT has_any_role(ARRAY['reviewer'::text, 'auditor'::text, 'ops'::text, 'planner'::text, 'leadership'::text])))))));

ALTER POLICY inspector_own_visits ON public.visits
  USING (((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text, 'reviewer'::text, 'auditor'::text, 'leadership'::text, 'compliance_admin'::text])) OR (EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.visit_id = visits.id) AND (a.inspector_id = (SELECT auth.uid())))))));

ALTER POLICY visits_insert_immediate_inspector ON public.visits
  WITH CHECK ((( SELECT (SELECT has_role('inspector'::text)) AS has_role) AND (visit_plan_id IS NULL) AND (created_by = ( SELECT auth.uid() AS uid)) AND (immediate_creator_role = 'inspector'::text) AND (creation_request_id IS NOT NULL) AND (planning_status = 'published'::planning_status) AND (operational_state = 'new'::operational_state) AND (execution_mode = 'physical'::execution_mode) AND (window_start = window_end) AND (planner_lat IS NOT NULL) AND ((planner_lat >= ('-90'::integer)::numeric) AND (planner_lat <= (90)::numeric)) AND (planner_lng IS NOT NULL) AND ((planner_lng >= ('-180'::integer)::numeric) AND (planner_lng <= (180)::numeric)) AND (visit_location_source = ANY (ARRAY['official'::text, 'manual'::text])) AND (NULLIF(btrim(immediate_reason), ''::text) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM package_versions pv
  WHERE ((pv.id = visits.package_version_id) AND (pv.status = ANY (ARRAY['published'::config_status, 'locked'::config_status])))))));

ALTER POLICY visits_read_capability ON public.visits
  USING ((SELECT has_planning_capability('planning.view'::text)));

ALTER POLICY visits_update ON public.visits
  USING ((SELECT has_any_role(ARRAY['planner'::text, 'ops'::text])));

ALTER POLICY visits_update_capability ON public.visits
  USING (((SELECT has_planning_capability('planning.manage'::text)) OR (SELECT has_planning_capability('planning.publish'::text)) OR (SELECT has_planning_capability('planning.cancel'::text)) OR (SELECT has_planning_capability('planning.reassign'::text)) OR (SELECT has_planning_capability('planning.reschedule'::text)) OR (SELECT has_planning_capability('planning.edit_draft'::text))));

ALTER POLICY visits_write ON public.visits
  WITH CHECK ((SELECT has_role('planner'::text)));

ALTER POLICY visits_write_capability ON public.visits
  WITH CHECK ((SELECT has_planning_capability('planning.create'::text)));

ALTER POLICY workflow_outbox_read ON public.workflow_outbox
  USING (((SELECT auth.uid()) IS NOT NULL));

ALTER POLICY workflow_outbox_update ON public.workflow_outbox
  USING ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text, 'workflow_admin'::text, 'risk_owner'::text, 'gis_admin'::text, 'security_admin'::text])));

ALTER POLICY workflow_outbox_write ON public.workflow_outbox
  WITH CHECK ((SELECT has_any_role(ARRAY['compliance_admin'::text, 'form_admin'::text, 'workflow_admin'::text, 'risk_owner'::text, 'gis_admin'::text, 'security_admin'::text])));

ALTER POLICY workflow_task_read ON public.workflow_task_assignments
  USING (((assignee = (SELECT auth.uid())) OR ((SELECT has_any_role(ARRAY['ops'::text, 'planner'::text, 'leadership'::text])) AND ((branch = ( SELECT profiles.region
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid())))) OR (sector = ( SELECT profiles.org_scope
   FROM profiles
  WHERE (profiles.user_id = (SELECT auth.uid()))))))));

ALTER POLICY workflow_task_update ON public.workflow_task_assignments
  USING ((SELECT has_any_role(ARRAY['ops'::text, 'planner'::text, 'leadership'::text, 'workflow_admin'::text])));

ALTER POLICY workflow_task_write ON public.workflow_task_assignments
  WITH CHECK ((SELECT has_any_role(ARRAY['ops'::text, 'planner'::text, 'leadership'::text, 'workflow_admin'::text])));

commit;
