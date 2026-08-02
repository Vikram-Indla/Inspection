-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- ============================================================================
-- SAQEEL Planning Module — Migration 1 of 2: Planning capabilities + access
-- classes (PLANNING_ROLE_ACCESS_ADMIN_MODEL contract, 2026-07-20 pack).
--
-- INTENT
--   Introduce the fine-grained planning capability model on top of the
--   existing role system: new `permissions` rows, new `role_permissions`
--   grants, two SECURITY DEFINER helpers (planning_access_class,
--   has_planning_capability), and NEW permissive RLS policies that open
--   planning tables to the business-staff access class.
--
-- PRESERVATION GUARANTEES
--   - No existing permission, role, grant, policy, function or trigger is
--     dropped, altered or revoked. All inserts use ON CONFLICT DO NOTHING.
--   - Existing role rows and the has_role/has_any_role/has_permission
--     predicates keep working unchanged; legacy planner/ops/reviewer/
--     leadership policies (0002/0027) remain the compatibility boundary.
--   - High-impact capabilities (planning.manual_factory,
--     planning.correct_location, planning.override_assignment,
--     admin.access.manage) receive NO class default and no automatic grant
--     beyond the explicit security_admin seed for admin.access.manage.
-- ============================================================================

-- ---------- 1 · Capability registry (permissions, 20260720010000 shape) -----
insert into public.permissions (permission_key, title, description) values
  ('planning.view',               'View Planning',                    'Read visit plans, visits and assignments in the Planning module.'),
  ('planning.create',             'Create Planning Objects',          'Create visit plans and visits (base capability shared by all planning methods).'),
  ('planning.create.single',      'Create Single Visit',              'Plan and publish a single-factory visit.'),
  ('planning.create.bulk',        'Create Bulk Plan',                 'Plan and publish a multi-factory bulk visit plan.'),
  ('planning.create.immediate',   'Create Immediate Visit',           'Create an unplanned immediate visit (inspector self-assigned path by default).'),
  ('planning.edit_draft',         'Edit Planning Draft',              'Edit draft visit plans and their draft payload before publish.'),
  ('planning.publish',            'Publish Plan',                     'Transition a validated plan and its visits to published.'),
  ('planning.manage',             'Manage Planning',                  'Operational management of published plans, visits and assignments.'),
  ('planning.manual_factory',     'Manual Factory Entry',             'Register a factory manually during planning (high-impact, explicit grant only).'),
  ('planning.correct_location',   'Correct Visit Location',           'Override or correct the planned visit location pin (high-impact, explicit grant only).'),
  ('planning.override_assignment','Override Assignment',              'Override the assignment engine outcome (high-impact, explicit grant only).'),
  ('planning.cancel',             'Cancel Visit',                     'Cancel a visit or plan before its cut-off with a governed reason.'),
  ('planning.reassign',           'Reassign Visit',                   'Move a visit to a different inspector.'),
  ('planning.reschedule',         'Reschedule Visit',                 'Change a published visit window.'),
  ('planning.export',             'Export Planning Data',             'Export planning lists and schedules.'),
  ('planning.configure_workflow', 'Configure Planning Workflow',      'Admin: govern planning workflow configuration.'),
  ('planning.configure_lookups',  'Configure Planning Lookups',       'Admin: govern planning lookup/reference data.'),
  ('planning.configure_expiry',   'Configure Planning Expiry Rules',  'Admin: govern scheduled visit-expiry rules.'),
  ('admin.access.manage',         'Manage Access Grants',             'Admin: grant/revoke roles and capabilities (separation-of-duties protected).')
on conflict (permission_key) do nothing;

-- ---------- 2 · Role grants (additive only; nothing revoked) ----------------
insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.permission_key
  from public.roles r
  join (values ('planner'), ('reviewer'), ('ops'), ('leadership')) allowed(role_key)
    on allowed.role_key = r.role_key
  cross join (values
    ('planning.view'),
    ('planning.create'),
    ('planning.create.single'),
    ('planning.create.bulk'),
    ('planning.edit_draft'),
    ('planning.publish'),
    ('planning.manage'),
    ('planning.cancel'),
    ('planning.reassign'),
    ('planning.reschedule'),
    ('planning.export')
  ) p(permission_key)
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select r.role_key, 'planning.create.immediate'
  from public.roles r
  join (values ('planner'), ('ops')) allowed(role_key) on allowed.role_key = r.role_key
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select r.role_key, 'planning.create.immediate'
  from public.roles r
 where r.role_key = 'inspector'
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.permission_key
  from public.roles r
  join (values
    ('compliance_admin'), ('form_admin'), ('workflow_admin'),
    ('risk_owner'), ('gis_admin'), ('security_admin')
  ) allowed(role_key) on allowed.role_key = r.role_key
  cross join (values
    ('planning.configure_workflow'),
    ('planning.configure_lookups'),
    ('planning.configure_expiry')
  ) p(permission_key)
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key)
select r.role_key, 'admin.access.manage'
  from public.roles r
 where r.role_key = 'security_admin'
on conflict do nothing;

-- ---------- 3 · Access class resolver ---------------------------------------
create or replace function public.planning_access_class()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then 'anonymous'
    when exists (
      select 1
        from public.user_roles ur
        join public.roles r on r.role_key = ur.role_key
       where ur.user_id = auth.uid()
         and r.is_admin
    ) then 'admin'
    when exists (
      select 1
        from public.user_roles ur
       where ur.user_id = auth.uid()
         and ur.role_key = 'inspector'
    ) then 'inspector'
    else 'business_staff'
  end
$$;
revoke all on function public.planning_access_class() from public, anon;
grant execute on function public.planning_access_class() to authenticated;

comment on function public.planning_access_class() is
  'SAQEEL planning access class: admin | inspector | business_staff (default for any other authenticated user) | anonymous.';

-- ---------- 4 · Capability predicate ----------------------------------------
create or replace function public.has_planning_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.has_permission(p_capability) then true
    when p_capability in (
      'planning.manual_factory',
      'planning.correct_location',
      'planning.override_assignment',
      'admin.access.manage'
    ) then false
    when public.planning_access_class() = 'business_staff' then p_capability in (
      'planning.view',
      'planning.create',
      'planning.create.single',
      'planning.create.bulk',
      'planning.edit_draft',
      'planning.publish',
      'planning.manage',
      'planning.cancel',
      'planning.reassign',
      'planning.reschedule',
      'planning.export'
    )
    when public.planning_access_class() = 'inspector' then
      p_capability = 'planning.create.immediate'
    when public.planning_access_class() = 'admin' then p_capability in (
      'planning.configure_workflow',
      'planning.configure_lookups',
      'planning.configure_expiry'
    )
    else false
  end
$$;
revoke all on function public.has_planning_capability(text) from public, anon;
grant execute on function public.has_planning_capability(text) to authenticated;

comment on function public.has_planning_capability(text) is
  'Planning capability check: explicit role_permissions grant OR access-class default. High-impact capabilities (manual_factory, correct_location, override_assignment) and admin.access.manage never default-grant.';

-- ---------- 5 · NEW permissive RLS policies (existing policies untouched) ---
create policy plans_read_capability on visit_plans for select
  using (has_planning_capability('planning.view'));
create policy plans_write_capability on visit_plans for insert
  with check (has_planning_capability('planning.create'));
create policy plans_update_capability on visit_plans for update
  using (has_planning_capability('planning.edit_draft'));

create policy visits_read_capability on visits for select
  using (has_planning_capability('planning.view'));
create policy visits_write_capability on visits for insert
  with check (has_planning_capability('planning.create'));

create policy assignments_read_capability on assignments for select
  using (has_planning_capability('planning.view'));
create policy assignments_write_capability on assignments for insert
  with check (
    has_planning_capability('planning.manage')
    or has_planning_capability('planning.publish')
  );
create policy assignments_update_capability on assignments for update
  using (
    has_planning_capability('planning.manage')
    or has_planning_capability('planning.publish')
  );
