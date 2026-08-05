-- TASK 1 (Admin Configuration and Versioning Journey) diagnosis: the four
-- role checks governing the Template Builder (write, publish, audit) were
-- written against 'compliance_admin' / 'form_admin', roles that were never
-- created in public.roles. The application-layer gate
-- (requireConfigurationWriter, apps/web/src/lib/admin-configuration.ts) has
-- always correctly checked for the real 'admin' role, so every admin user
-- who passed the UI gate was then rejected by the database with a bare
-- "not authorized" — reproduced live against admin2@mim.gov.sa this session.
--
-- Fix: add 'admin' to each affected check. This restores the behaviour the
-- application layer already assumes; it does not widen access beyond what
-- the UI already permits, since only 'admin' users ever reach these calls.

drop policy if exists configuration_templates_write on public.configuration_templates;
create policy configuration_templates_write on public.configuration_templates
  for all
  using (public.has_any_role(array['admin', 'compliance_admin', 'form_admin']))
  with check (public.has_any_role(array['admin', 'compliance_admin', 'form_admin']));

create or replace function public.publish_configuration_template(p_template_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_new public.configuration_templates%rowtype; v_old public.configuration_templates%rowtype;
begin
  if not public.has_any_role(array['admin', 'compliance_admin', 'form_admin']) then raise exception 'not authorized'; end if;
  select * into v_new from public.configuration_templates where id = p_template_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'template draft not found'; end if;
  if v_new.created_by = auth.uid() then raise exception 'maker-checker requires a distinct approver'; end if;
  if v_new.effective_from is null then raise exception 'effective_from is required'; end if;
  if v_new.schema is null or jsonb_typeof(v_new.schema) <> 'object' then raise exception 'template schema must be an object'; end if;
  select * into v_old from public.configuration_templates
    where template_key = v_new.template_key and status in ('published','locked') and effective_to is null
    limit 1 for update;
  if found then
    if v_old.effective_from is not null and v_new.effective_from <= v_old.effective_from then
      raise exception 'successor effective date must follow active version';
    end if;
    update public.configuration_templates set status='deactivated', effective_to=v_new.effective_from-1,
      deactivation_reason='Superseded by governed successor' where id=v_old.id;
    update public.configuration_templates set supersedes_id=v_old.id where id=v_new.id;
  end if;
  update public.configuration_templates set status='published', approved_by=auth.uid(), published_at=now() where id=v_new.id;
  return v_new.id;
end $$;
revoke all on function public.publish_configuration_template(uuid) from public, anon;
grant execute on function public.publish_configuration_template(uuid) to authenticated;

create or replace function public.admin_configuration_audit(p_object_type text, p_object_id uuid)
returns setof public.audit_events
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_any_role(array['admin', 'compliance_admin', 'form_admin']) then
    raise exception 'not authorized for configuration audit (RBAC-001)';
  end if;
  if p_object_type <> all(array[
    'regulations', 'regulation_clauses', 'regulation_attachments',
    'inspection_items', 'packages', 'package_versions',
    'violation_codes', 'penalty_mappings'
  ]) then
    raise exception 'unsupported configuration audit object type';
  end if;

  return query
    select ae.* from public.audit_events ae
    where ae.object_type = p_object_type and ae.object_id = p_object_id
    order by ae.occurred_at desc;
end $$;
revoke execute on function public.admin_configuration_audit(text, uuid) from public;
revoke execute on function public.admin_configuration_audit(text, uuid) from anon;
grant execute on function public.admin_configuration_audit(text, uuid) to authenticated;
