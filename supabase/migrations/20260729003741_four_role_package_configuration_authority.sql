-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Four-role model: Admin owns the configuration lane.  This is deliberately
-- scoped to the governed regulation → item → package chain required to create
-- a frozen execution package.  It does not resurrect a specialist role or
-- grant any execution/review authority to Admin.

do $$
declare
  t text;
begin
  foreach t in array array[
    'regulations',
    'regulation_clauses',
    'inspection_items'
  ] loop
    execute format('drop policy if exists %I_admin on public.%I', t, t);
    execute format('drop policy if exists %I_admin_insert on public.%I', t, t);
    execute format('drop policy if exists %I_admin_update on public.%I', t, t);
    execute format('drop policy if exists %I_admin_delete on public.%I', t, t);
    execute format(
      'create policy %I_admin on public.%I for all to authenticated using (public.has_internal_role(''admin'')) with check (public.has_internal_role(''admin''))',
      t, t
    );
  end loop;
end
$$;

drop policy if exists packages_admin on public.packages;
create policy packages_admin on public.packages
  for all to authenticated
  using (public.has_internal_role('admin'))
  with check (public.has_internal_role('admin'));

drop policy if exists package_versions_admin on public.package_versions;
create policy package_versions_admin on public.package_versions
  for all to authenticated
  using (public.has_internal_role('admin'))
  with check (public.has_internal_role('admin'));

create or replace function public.publish_regulation(p_regulation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new public.regulations%rowtype;
  v_old public.regulations%rowtype;
  v_invalid integer;
begin
  if not public.has_internal_role('admin') then
    raise exception 'not authorized';
  end if;
  select * into v_new from public.regulations where id = p_regulation_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'regulation draft not found'; end if;
  if v_new.created_by = auth.uid() then raise exception 'maker-checker requires a distinct approver'; end if;
  if v_new.effective_from is null then raise exception 'effective_from is required'; end if;
  select count(*) into v_invalid from public.regulation_clauses c
    where c.regulation_id = v_new.id and not exists (
      select 1 from public.inspection_items i where i.clause_id = c.id
    );
  if not exists (select 1 from public.regulation_clauses where regulation_id = v_new.id) or v_invalid > 0 then
    raise exception 'every regulation clause must map to an inspection item';
  end if;
  select * into v_old from public.regulations
    where code = v_new.code and status in ('published','locked') and effective_to is null
    limit 1 for update;
  if found then
    if v_old.effective_from is not null and v_new.effective_from <= v_old.effective_from then
      raise exception 'successor effective date must follow active version';
    end if;
    update public.regulations set status = 'deactivated', effective_to = v_new.effective_from - 1,
      deactivated_at = now(), deactivated_by = auth.uid(), deactivation_reason = 'Superseded by governed successor'
      where id = v_old.id;
    update public.regulations set supersedes_id = v_old.id where id = v_new.id;
  end if;
  update public.regulations set status = 'published', approved_by = auth.uid(), published_at = now()
    where id = v_new.id;
  return v_new.id;
end
$$;

revoke all on function public.publish_regulation(uuid) from public, anon;
grant execute on function public.publish_regulation(uuid) to authenticated;

create or replace function public.publish_package_version(
  p_version_id uuid,
  p_definition jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new public.package_versions%rowtype;
  v_old public.package_versions%rowtype;
begin
  if not public.has_internal_role('admin') then
    raise exception 'not authorized to publish package versions';
  end if;
  select * into v_new from public.package_versions where id = p_version_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'package draft not found'; end if;
  if v_new.created_by is null or v_new.created_by = auth.uid() then
    raise exception 'maker-checker requires a distinct approver';
  end if;
  if v_new.effective_from is null then raise exception 'effective_from is required'; end if;

  select * into v_old from public.package_versions
    where package_id = v_new.package_id
      and status in ('published','locked')
      and effective_to is null
    order by effective_from desc nulls last, published_at desc nulls last
    limit 1 for update;
  if found then
    if v_old.effective_from is not null and v_new.effective_from <= v_old.effective_from then
      raise exception 'successor effective date must follow the active package version';
    end if;
    update public.package_versions set effective_to = v_new.effective_from - 1 where id = v_old.id;
    update public.package_versions set supersedes_id = v_old.id where id = v_new.id;
  end if;

  update public.package_versions
    set definition = p_definition, status = 'published', approved_by = auth.uid(), published_at = now()
    where id = v_new.id;
  return v_new.id;
end
$$;

revoke all on function public.publish_package_version(uuid, jsonb) from public, anon;
grant execute on function public.publish_package_version(uuid, jsonb) to authenticated;
