-- Recovered from live schema_migrations.statements — file was missing from this repo; this is the exact applied SQL, added 2026-08-02 during migration reconciliation.

-- Align the four-role model with the review authority actually enforced at
-- the database boundary.  Do not alias Supervisor to a retired role: that
-- would accidentally restore unrelated legacy access.  The review lane is
-- capability-based and retains the independent-review ownership checks.

create or replace function public.start_review(
  p_inspection uuid,
  p_submission_version uuid
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_ins public.inspections%rowtype;
  v_latest uuid;
  v_review uuid;
begin
  if v_actor is null or not public.has_capability('review.decide') then
    raise insufficient_privilege using message = 'REVIEW-START-DENIED';
  end if;

  select * into v_ins from public.inspections
   where id = p_inspection for update;
  if not found or v_ins.status <> 'submitted' then
    raise check_violation using message = 'REVIEW-START-STATE';
  end if;

  select id into v_latest from public.submission_versions
   where inspection_id = p_inspection
   order by version_number desc limit 1;
  if v_latest is null or v_latest <> p_submission_version then
    raise check_violation using message = 'REVIEW-START-VERSION';
  end if;

  select id into v_review from public.reviews
   where submission_version_id = p_submission_version and decided_at is null
   for update;
  if v_review is not null then
    if exists (
      select 1 from public.reviews
       where id = v_review and reviewer_id = v_actor
    ) then
      return v_review;
    end if;
    raise unique_violation using message = 'REVIEW-START-CLAIMED';
  end if;

  insert into public.reviews(
    inspection_id, submission_version_id, reviewer_id, status
  ) values (
    p_inspection, p_submission_version, v_actor, 'under_review'
  ) returning id into v_review;

  update public.inspections
     set status = 'under_review'
   where id = p_inspection and status = 'submitted';
  if not found then
    raise serialization_failure using message = 'REVIEW-START-RACE';
  end if;

  insert into public.audit_events(
    actor, object_type, object_id, action, after_state, requirement_refs
  ) values (
    v_actor, 'reviews', v_review, 'start_review',
    jsonb_build_object(
      'inspection_id', p_inspection,
      'submission_version_id', p_submission_version,
      'status', 'under_review'
    ),
    array['STM-REV-001','RBAC-011','CANONICAL-ROLE-001']
  );
  return v_review;
end $$;

revoke all on function public.start_review(uuid, uuid) from public, anon;
grant execute on function public.start_review(uuid, uuid) to authenticated;

create or replace function public.decide_review(
  p_review uuid,
  p_decision text,
  p_reason text default null,
  p_returned_sections jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_review public.reviews%rowtype;
  v_status public.review_status;
  v_definition jsonb;
  v_invalid text[];
  v_inspector uuid;
begin
  if v_actor is null or not public.has_capability('review.decide') then
    raise insufficient_privilege using message = 'REVIEW-DECIDE-DENIED';
  end if;
  if p_decision not in ('approve','return','reject') then
    raise check_violation using message = 'REVIEW-DECIDE-VALUE';
  end if;
  if p_decision in ('return','reject') and nullif(btrim(p_reason), '') is null then
    raise check_violation using message = 'REVIEW-DECIDE-REASON';
  end if;
  if p_decision = 'return'
     and (p_returned_sections is null
          or jsonb_typeof(p_returned_sections) <> 'array'
          or jsonb_array_length(p_returned_sections) = 0) then
    raise check_violation using message = 'REVIEW-DECIDE-SECTIONS';
  end if;
  if p_decision <> 'return' and p_returned_sections is not null then
    raise check_violation using message = 'REVIEW-DECIDE-SECTIONS';
  end if;

  select * into v_review from public.reviews
   where id = p_review for update;
  if not found or v_review.status <> 'under_review'
     or v_review.decided_at is not null then
    raise check_violation using message = 'REVIEW-DECIDE-STATE';
  end if;
  if v_review.reviewer_id <> v_actor then
    raise insufficient_privilege using message = 'REVIEW-DECIDE-OWNER';
  end if;

  perform 1 from public.inspections
   where id = v_review.inspection_id and status = 'under_review'
   for update;
  if not found then
    raise check_violation using message = 'REVIEW-DECIDE-INSPECTION-STATE';
  end if;

  if p_decision = 'approve' and not exists (
    select 1 from public.submission_versions
     where id = v_review.submission_version_id
       and inspection_id = v_review.inspection_id
  ) then
    raise check_violation using message = 'REVIEW-DECIDE-SUBMISSION';
  end if;

  if p_decision = 'return' then
    select pv.definition into v_definition
      from public.inspections i
      join public.package_versions pv on pv.id = i.package_version_id
     where i.id = v_review.inspection_id;
    select array_agg(s.key) into v_invalid
      from jsonb_array_elements_text(p_returned_sections) s(key)
     where not exists (
       select 1
         from jsonb_array_elements(coalesce(v_definition->'sections','[]'::jsonb)) d
        where d->>'key' = s.key
     );
    if coalesce(array_length(v_invalid, 1), 0) > 0 then
      raise check_violation using message = 'REVIEW-DECIDE-SECTIONS';
    end if;
  end if;

  v_status := case p_decision
    when 'approve' then 'approved'::public.review_status
    when 'return' then 'returned'::public.review_status
    else 'rejected'::public.review_status
  end;

  update public.reviews set
    status = v_status,
    decision = p_decision,
    decision_reason = nullif(btrim(p_reason), ''),
    returned_sections = case when p_decision = 'return'
      then p_returned_sections else null end,
    decided_at = now()
  where id = p_review and status = 'under_review' and decided_at is null;
  if not found then
    raise serialization_failure using message = 'REVIEW-DECIDE-RACE';
  end if;

  update public.inspections
     set status = v_status::text
   where id = v_review.inspection_id and status = 'under_review';
  if not found then
    raise serialization_failure using message = 'REVIEW-DECIDE-RACE';
  end if;

  select a.inspector_id into v_inspector
    from public.inspections i
    join public.assignments a on a.visit_id = i.visit_id
   where i.id = v_review.inspection_id
   order by a.created_at desc limit 1;
  if v_inspector is not null then
    insert into public.notifications(
      event_key, recipient, payload, channel, delivery_state, delivered_at
    ) values (
      'review_decision', v_inspector,
      jsonb_build_object(
        'inspection_id', v_review.inspection_id,
        'decision', p_decision,
        'reason', nullif(btrim(p_reason), ''),
        'returned_sections', case when p_decision = 'return'
          then p_returned_sections else null end
      ),
      'inapp', 'delivered', now()
    );
  end if;

  insert into public.audit_events(
    actor, object_type, object_id, action, before_state, after_state,
    requirement_refs
  ) values (
    v_actor, 'reviews', p_review, 'decide_review',
    jsonb_build_object('status','under_review'),
    jsonb_build_object(
      'status', v_status,
      'decision', p_decision,
      'returned_sections', case when p_decision = 'return'
        then p_returned_sections else null end
    ),
    array[
      case p_decision
        when 'approve' then 'STM-REV-002'
        when 'return' then 'STM-REV-003'
        else 'STM-REV-004'
      end,
      'RBAC-011',
      'CANONICAL-ROLE-001'
    ]
  );
  return jsonb_build_object(
    'review_id', p_review,
    'inspection_id', v_review.inspection_id,
    'status', v_status,
    'decision', p_decision
  );
end $$;

revoke all on function public.decide_review(uuid, text, text, jsonb)
  from public, anon;
grant execute on function public.decide_review(uuid, text, text, jsonb)
  to authenticated;

-- The review pages need their nested rows after the four-role cleanup.  The
-- actor may view a review only via review/operations capability or their own
-- assigned inspection.  Writes remain RPC-owned above.
alter policy inspections_read on public.inspections
  using (
    public.is_assigned_inspector(visit_id)
    or public.has_capability('review.view')
    or public.has_capability('operations.view')
  );

alter policy subs_read on public.submission_versions
  using (
    public.has_capability('review.view')
    or public.has_capability('operations.view')
    or exists (
      select 1 from public.inspections i
      where i.id = submission_versions.inspection_id
        and public.is_assigned_inspector(i.visit_id)
    )
  );

alter policy reviews_read on public.reviews
  using (
    reviewer_id = (select auth.uid())
    or public.has_capability('review.view')
    or exists (
      select 1 from public.inspections i
      where i.id = reviews.inspection_id
        and public.is_assigned_inspector(i.visit_id)
    )
  );
