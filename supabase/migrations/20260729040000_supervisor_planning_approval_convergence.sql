-- REQ-002 / ACT-004
-- Planning approval remains catalogue-only. The approved four-role matrix
-- blocks Supervisor approval of Planner work until a Planning approval
-- lifecycle and separation-of-duties contract are approved.
--
-- Preserve the permission catalogue, every account/role assignment, all
-- history, and the approved L2 inspection-review capabilities.

delete from public.role_permissions
where role_key = 'supervisor'
  and permission_key in (
    'planning.approve',
    'planning.return',
    'planning.reject'
  );

do $$
begin
  if exists (
    select 1
    from public.role_permissions
    where role_key = 'supervisor'
      and permission_key in (
        'planning.approve',
        'planning.return',
        'planning.reject'
      )
  ) then
    raise exception using errcode = '23514',
      message = 'SUPERVISOR-PLANNING-APPROVAL-MUST-REMAIN-BLOCKED';
  end if;
end
$$;
