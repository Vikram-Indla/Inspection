-- CC-ENFORCEMENT-DECISION-ENABLE-20260805 (amended) / third invented-role-pair fix
--
-- decide_enforcement_recommendation() gated real enforcement decisions
-- (financial fines, committee referrals, factory closures) on 'ops' and
-- 'compliance_admin'. Neither role exists in public.roles (admin, inspector,
-- planner, supervisor are the only four registered) and no account holds
-- either name, so the function was unsatisfiable for every principal,
-- including a legitimate decider. This is the third occurrence of the same
-- pattern found in one night, after ccr_is_writer (compliance_admin,
-- form_admin) and ccr_is_reviewer (compliance_admin, reviewer).
--
-- Product Owner ruling (2026-08-05): supervisors decide enforcement.
-- Administrators are excluded — consistent with the compliance ruling
-- (CC-CCR-REVIEWER-SUPERVISOR-20260805): administrators configure the
-- platform, supervisors decide. admin is deliberately NOT added here.
--
-- ops and compliance_admin stay in the array deliberately, matching how the
-- other two role-pair fixes were handled: they resolve false while
-- unregistered, costs nothing, preserves a distinction that may later be
-- created. Only supervisor is added.
--
-- Every other control in this function is untouched: SECURITY DEFINER,
-- maker-checker (old_row.recommended_by = actor -> ENF_MAKER_CHECKER),
-- mandatory reason, idempotency. Only the role array in the authorization
-- check changes.

create or replace function public.decide_enforcement_recommendation(
  p_recommendation uuid,
  p_decision enforcement_recommendation_decision,
  p_reason text,
  p_idempotency_key uuid,
  p_correlation_id uuid default null::uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare actor uuid:=auth.uid(); old_row public.enforcement_recommendations%rowtype;
 existing public.enforcement_recommendations%rowtype; next_status text;
 corr uuid:=coalesce(p_correlation_id,gen_random_uuid()); receipt jsonb;
begin
  if actor is null or not public.has_any_role(array['supervisor','ops','compliance_admin']) then
    raise exception using errcode='42501',message='ENF_DECISION_NOT_AUTHORIZED'; end if;
  if p_idempotency_key is null then raise exception using errcode='23514',message='ENF_DECISION_IDEMPOTENCY_REQUIRED'; end if;
  if nullif(btrim(p_reason),'') is null then raise exception using errcode='23514',message='ENF_DECISION_REASON_REQUIRED'; end if;
  next_status:=case p_decision when 'approve' then 'approved' else 'rejected' end;
  select * into existing from public.enforcement_recommendations where decision_idempotency_key=p_idempotency_key;
  if found then
    if existing.id<>p_recommendation or existing.status<>next_status or existing.decision_reason is distinct from btrim(p_reason) then
      raise exception using errcode='23505',message='ENF_DECISION_IDEMPOTENCY_CONFLICT'; end if;
    return existing.decision_receipt||jsonb_build_object('replayed',true);
  end if;
  select * into old_row from public.enforcement_recommendations where id=p_recommendation for update;
  if not found then raise no_data_found using message='ENF_RECOMMENDATION_NOT_FOUND'; end if;
  if old_row.decision_idempotency_key=p_idempotency_key then
    if old_row.status<>next_status or old_row.decision_reason is distinct from btrim(p_reason) then
      raise exception using errcode='23505',message='ENF_DECISION_IDEMPOTENCY_CONFLICT'; end if;
    return old_row.decision_receipt||jsonb_build_object('replayed',true);
  end if;
  if old_row.recommended_by=actor then raise exception using errcode='42501',message='ENF_MAKER_CHECKER'; end if;
  if old_row.status<>'pending' or old_row.decided_at is not null then raise exception using errcode='23514',message='ENF_DECISION_CONFLICT'; end if;
  receipt:=jsonb_build_object('recommendation_id',p_recommendation,'status',next_status,'decided_by',actor,
    'correlation_id',corr,'idempotency_key',p_idempotency_key,'replayed',false);
  update public.enforcement_recommendations set status=next_status,decided_by=actor,decided_at=now(),
    decision_reason=btrim(p_reason),decision_idempotency_key=p_idempotency_key,
    correlation_id=corr,decision_receipt=receipt
  where id=p_recommendation and status='pending' and decided_at is null;
  if not found then raise exception using errcode='23514',message='ENF_DECISION_CONFLICT'; end if;
  insert into public.audit_events(actor,object_type,object_id,action,before_state,after_state,requirement_refs,config_versions)
  values(actor,'enforcement_recommendation',p_recommendation,'decision',jsonb_build_object('status',old_row.status),
    jsonb_build_object('status',next_status,'reason',btrim(p_reason)),array['DEC-F','CR-463'],
    jsonb_build_object('correlation_id',corr,'idempotency_key',p_idempotency_key));
  return receipt;
end $$;
