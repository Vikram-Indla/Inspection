-- Read-only Supervisor capability proof. The request claim exists only for
-- this query transaction; no data, account, session, or role assignment moves.
with actor as (
  select user_id::text as id from public.user_roles where role_key = 'supervisor' order by user_id limit 1
), claim as (
  select set_config('request.jwt.claim.sub', actor.id, true) from actor
)
select
  public.has_planning_capability('planning.create.single') as can_create_single,
  public.has_planning_capability('planning.create.bulk') as can_create_bulk,
  public.has_planning_capability('planning.create.immediate') as can_create_immediate,
  public.has_planning_capability('planning.submit_for_supervision') as can_submit,
  public.has_planning_capability('planning.approve') as can_approve,
  public.has_planning_capability('planning.publish') as can_publish,
  public.has_planning_capability('planning.return') as can_return,
  public.has_planning_capability('planning.reject') as can_reject,
  public.has_planning_capability('planning.reassign') as can_reassign
from claim;
