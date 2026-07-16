-- FIX WAVE 2 · Slice G3 · M09-013 — publish-impact analytics for the Package &
-- Form Designer. Before a checker approves a new package version (SCR-ADM-030/031),
-- they must see how many IN-FLIGHT visits and inspections are still pinned to
-- PRIOR published versions of the same package. Those in-flight items run on the
-- frozen definition they downloaded (M09-030 immutability); a new publish never
-- reaches back and re-versions them — the panel makes that blast radius explicit.
--
-- The counts read the operational tables (visits, inspections) which the config
-- admin family (compliance_admin/form_admin, RBAC-001..006) has no row-level
-- SELECT on. Rather than widen table RLS, this is an aggregate-only,
-- SECURITY DEFINER reader that returns COUNTS and version labels — never rows —
-- gated internally to the admin/checker roles. Read-only: no writes, STABLE.
--
-- The definition diff (added/removed/changed items) and the "which other
-- published packages reference these items" fan-out are computed in the server
-- component from package_versions, which every authenticated user may already
-- read (package_versions_read, 0002) — so they need no elevated path here.

create or replace function package_version_impact(p_version_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_package uuid;
  v_result  jsonb;
begin
  -- RBAC-001..006 — only the configuration/checker family may read impact.
  if not has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','security_admin','leadership']) then
    raise exception 'not authorized for package impact (RBAC-001)';
  end if;

  select package_id into v_package from package_versions where id = p_version_id;
  if v_package is null then
    return jsonb_build_object('error', 'version not found');
  end if;

  with prior as (
    -- Prior PUBLISHED (or locked) versions of the SAME package, excluding self.
    select id, version_label, published_at
    from package_versions
    where package_id = v_package
      and id <> p_version_id
      and status in ('published', 'locked')
  ),
  vcounts as (
    -- Active visit = live plan not yet finished (planning published, op-state pre-submit).
    select p.id, count(v.id) as n
    from prior p
    left join visits v
      on v.package_version_id = p.id
     and v.planning_status = 'published'
     and v.operational_state <> 'submitted'
    group by p.id
  ),
  icounts as (
    -- Active inspection = started/not yet submitted (immutable once submitted).
    select p.id, count(i.id) as n
    from prior p
    left join inspections i
      on i.package_version_id = p.id
     and i.status <> 'submitted'
    group by p.id
  )
  select jsonb_build_object(
    'active_visits',      coalesce((select sum(n) from vcounts), 0),
    'active_inspections', coalesce((select sum(n) from icounts), 0),
    'prior_count',        (select count(*) from prior),
    'prior', coalesce((
      select jsonb_agg(j order by ord desc nulls last)
      from (
        select jsonb_build_object(
                 'label',       p.version_label,
                 'visits',      coalesce(vc.n, 0),
                 'inspections', coalesce(ic.n, 0)
               ) as j,
               p.published_at as ord
        from prior p
        left join vcounts vc on vc.id = p.id
        left join icounts ic on ic.id = p.id
        where coalesce(vc.n, 0) + coalesce(ic.n, 0) > 0
      ) ranked
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;

grant execute on function package_version_impact(uuid) to authenticated;
