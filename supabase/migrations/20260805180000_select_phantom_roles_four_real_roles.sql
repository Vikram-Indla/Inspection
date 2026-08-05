-- BOSS/Orchestrator job one — SELECT policies naming only phantom roles.
-- Product Owner visibility rule (PROGRAMME-BASELINE-20260805,
-- canonical_rule_visibility): everybody can see everything; only
-- administration is administrator-only. Verified live before writing this:
-- 19 SELECT policies name a role from {ops, compliance_admin, form_admin,
-- reviewer, auditor, leadership, security_admin, workflow_admin} and no
-- real role (admin/inspector/planner/supervisor) in that same clause.
--
-- Only the phantom-role clause in each policy changes. Every other
-- condition — self-scope (recipient/actor/requested_by = auth.uid()),
-- is_assigned_inspector(), has_permission() branches — is preserved
-- byte-for-byte. No write policy (INSERT/UPDATE/ALL/DELETE) is touched;
-- those decide who may change something and are separation-of-duties,
-- explicitly out of scope for this migration.
--
-- Two named exceptions, checked live before writing, not fixed here:
--   - notifications.notif_own: (recipient = auth.uid()) OR has_role('ops').
--     The role branch is NOT a second grant alongside self-scope in the same
--     sense as the others — widening it would let every inspector/planner/
--     supervisor read every other user's personal notification inbox. The
--     visibility rule covers operational data, not personal notification
--     streams. Left unchanged; flagged back rather than guessed.
--   - mvp3_inspection_package_manifests_read already names a real role
--     ('planner') alongside the phantom ones — mixed, not phantom-only,
--     left alone per the stated boundary.
--   - mvp3_feature_flags_read / mvp3_kpi_definitions_read: qual is already
--     `true` — nothing to fix.
--
-- user_capability_grants_read_admin is administration (who may grant
-- capabilities) and stays administrator-only per instruction — admits
-- 'admin' alone, not the four-role list.

alter policy audit_read_compliance on public.audit_events
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy bulk_violation_batch_items_read on public.bulk_violation_batch_items
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy bulk_violation_batches_read on public.bulk_violation_batches
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy f360_media_read on public.factory_media_assets
  using (
    ((category = any (array['official_factory_image'::text, 'factory_profile_image'::text]))
      and (select public.has_permission('view_factory_documents'::text)))
    or
    ((category <> all (array['official_factory_image'::text, 'factory_profile_image'::text]))
      and exists (
        select 1 from public.evidence e
          left join public.inspections i on i.id = e.inspection_id
        where e.id = factory_media_assets.evidence_id
          and (
            (select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]))
            or (i.id is not null and public.is_assigned_inspector(i.visit_id))
            or (e.visit_id is not null and public.is_assigned_inspector(e.visit_id))
          )
      ))
  );

alter policy geo_override_requests_read on public.geo_override_requests
  using (
    (requested_by = ( select auth.uid() ))
    or ( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) )
  );

alter policy ifc_read on public.inspection_factory_checks
  using (
    exists (
      select 1 from public.inspections i
      where i.id = inspection_factory_checks.inspection_id
        and (
          public.is_assigned_inspector(i.visit_id)
          or ( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) )
        )
    )
  );

alter policy inspection_item_versions_read on public.inspection_item_versions
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy penalty_notices_read on public.penalty_notices
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy user_capability_grants_read_admin on public.user_capability_grants
  using (( select public.has_role('admin'::text) ));

-- mvp3_* (10 of the 10 named — flags/kpis already `true`, package_manifests mixed)

alter policy mvp3_access_reviews_read on public.mvp3_access_reviews
  using (
    (subject_user_id = ( select auth.uid() ))
    or ( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) )
  );

alter policy mvp3_api_events_read on public.mvp3_api_events
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy mvp3_device_commands_read on public.mvp3_device_commands
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy mvp3_devices_read on public.mvp3_devices
  using (
    (assigned_user_id = ( select auth.uid() ))
    or ( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) )
  );

alter policy mvp3_errors_read on public.mvp3_error_queue
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy mvp3_evidence_grants_read on public.mvp3_evidence_access_grants
  using (
    (grantee_user_id = ( select auth.uid() ))
    or ( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) )
  );

alter policy mvp3_exports_read on public.mvp3_export_jobs
  using (
    (requested_by = ( select auth.uid() ))
    or ( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) )
  );

alter policy mvp3_integrations_read on public.mvp3_integration_endpoints
  using (( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) ));

alter policy mvp3_package_access_events_read on public.mvp3_package_access_events
  using (
    (actor_id = ( select auth.uid() ))
    or ( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) )
  );

alter policy mvp3_signature_refusals_read on public.mvp3_signature_refusals
  using (
    (recorded_by = ( select auth.uid() ))
    or ( select public.has_any_role(array['admin'::text,'inspector'::text,'planner'::text,'supervisor'::text]) )
  );
