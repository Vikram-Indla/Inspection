-- CD-042 / SCR-VIR-710 · CD42-R1-06 — audit-READ display seam.
--
-- The design's "audit timeline" needs to show a virtual session's audit_events,
-- but audit_events RLS (0002/0019) grants SELECT only to
-- auditor/ops/security_admin/leadership/reviewer/planner/compliance_admin — NOT
-- to `inspector`. The assigned inspector operates the room but cannot read the
-- table, so the screen cannot query it directly. This RPC is that seam: a
-- security-definer, session-scoped read gated by the SAME RBAC-014 predicate as
-- vp_request_otp/vp_verify_otp/vp_otp_status (staff-with-session-visibility OR
-- the assigned inspector), returning ONLY this session's trail. It does not
-- widen table access and it creates no audit events — read only.

create or replace function vs_audit_trail(p_session uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_visit uuid;
begin
  select visit_id into v_visit from virtual_sessions where id = p_session;
  if v_visit is null then raise exception 'virtual session not found'; end if;

  -- RBAC-014: identical caller predicate to the OTP RPCs.
  if not (
    has_any_role(array['ops','reviewer','auditor','compliance_admin','planner'])
    or is_assigned_inspector(v_visit)
  ) then
    raise exception 'not authorized for this virtual session (RBAC-014)';
  end if;

  -- Scope: audit rows for THIS session's row and its participants only.
  return coalesce((
    select jsonb_agg(row order by (row->>'at'))
    from (
      select jsonb_build_object(
               'at', occurred_at,
               'action', action,
               'object_type', object_type,
               'object_id', object_id,
               'actor', actor,
               'detail', after_state
             ) as row
      from audit_events
      where (object_type = 'virtual_sessions' and object_id = p_session)
         or (object_type = 'virtual_participants'
             and object_id in (select id from virtual_participants where session_id = p_session))
    ) ordered
  ), '[]'::jsonb);
end $$;

grant execute on function vs_audit_trail(uuid) to authenticated;
