-- TASK-DEMO-SEED-EXPANSION-20260726-001
-- Forward authority for realistic demo journeys. This migration does not seed
-- data. It closes three pre-existing seams: review atomicity, authenticated
-- factory-representative ownership, and virtual scheduling atomicity.

alter table public.virtual_participants
  add column if not exists user_id uuid references public.profiles(user_id);

create unique index if not exists virtual_participants_session_user_uq
  on public.virtual_participants(session_id, user_id)
  where user_id is not null;

comment on column public.virtual_participants.user_id is
  'Authenticated participant owner. Required for factory_rep demo identities; NULL preserves legacy external participants.';

create or replace function public.can_manage_virtual_session(p_visit uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    public.has_any_role(array['ops','reviewer','auditor','compliance_admin','planner'])
    or public.is_assigned_inspector(p_visit)
  )
$$;
revoke all on function public.can_manage_virtual_session(uuid) from public, anon;
grant execute on function public.can_manage_virtual_session(uuid) to authenticated;

create or replace function public.can_access_virtual_session(
  p_session uuid,
  p_visit uuid
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_manage_virtual_session(p_visit)
    or exists (
      select 1 from public.virtual_participants vp
       where vp.session_id = p_session
         and vp.user_id = (select auth.uid())
    )
$$;
revoke all on function public.can_access_virtual_session(uuid, uuid)
  from public, anon;
grant execute on function public.can_access_virtual_session(uuid, uuid)
  to authenticated;

-- Factory representatives can read only the session/participant row explicitly
-- linked to their authenticated profile. Staff and assigned-inspector behavior
-- remains compatible with migration 0021.
drop policy if exists vs_read on public.virtual_sessions;
create policy vs_read on public.virtual_sessions for select to authenticated using (
  public.can_access_virtual_session(id, visit_id)
);

drop policy if exists vp_rw on public.virtual_participants;
drop policy if exists vp_select on public.virtual_participants;
drop policy if exists vp_insert on public.virtual_participants;
drop policy if exists vp_update on public.virtual_participants;
drop policy if exists vp_delete on public.virtual_participants;

create policy vp_select on public.virtual_participants for select to authenticated using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.virtual_sessions vs
     where vs.id = virtual_participants.session_id
       and public.can_manage_virtual_session(vs.visit_id)
  )
);
create policy vp_insert on public.virtual_participants for insert to authenticated with check (
  exists (
    select 1 from public.virtual_sessions vs
     where vs.id = virtual_participants.session_id
       and public.can_manage_virtual_session(vs.visit_id)
  )
);
create policy vp_update on public.virtual_participants for update to authenticated using (
  exists (
    select 1 from public.virtual_sessions vs
     where vs.id = virtual_participants.session_id
       and public.can_manage_virtual_session(vs.visit_id)
  )
) with check (
  exists (
    select 1 from public.virtual_sessions vs
     where vs.id = virtual_participants.session_id
       and public.can_manage_virtual_session(vs.visit_id)
  )
);
create policy vp_delete on public.virtual_participants for delete to authenticated using (
  exists (
    select 1 from public.virtual_sessions vs
     where vs.id = virtual_participants.session_id
       and public.can_manage_virtual_session(vs.visit_id)
  )
);

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
  if v_actor is null or not public.has_any_role(array['reviewer','ops']) then
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
    array['STM-REV-001','RBAC-011']
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
  if v_actor is null or not public.has_any_role(array['reviewer','ops']) then
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
      'RBAC-011'
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

create or replace function public.schedule_virtual_session(
  p_visit uuid,
  p_appointment_at timestamptz,
  p_factory_rep_user uuid,
  p_rep_display_name text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_visit public.visits%rowtype;
  v_inspector uuid;
  v_inspector_name text;
  v_rep_name text;
  v_session uuid;
  v_rep_participant uuid;
begin
  if v_actor is null then
    raise insufficient_privilege using message = 'VIRTUAL-SCHEDULE-DENIED';
  end if;
  select * into v_visit from public.visits
   where id = p_visit for update;
  if not found or v_visit.execution_mode <> 'virtual'
     or v_visit.planning_status <> 'published' then
    raise check_violation using message = 'VIRTUAL-SCHEDULE-VISIT';
  end if;
  if not (
    public.has_any_role(array['planner','ops'])
    or public.is_assigned_inspector(p_visit)
  ) then
    raise insufficient_privilege using message = 'VIRTUAL-SCHEDULE-DENIED';
  end if;
  if p_appointment_at is null then
    raise check_violation using message = 'VIRTUAL-SCHEDULE-APPOINTMENT';
  end if;
  if exists (select 1 from public.virtual_sessions where visit_id = p_visit) then
    raise unique_violation using message = 'VIRTUAL-SCHEDULE-EXISTS';
  end if;
  if p_factory_rep_user is null
     or not exists (
       select 1 from public.user_roles
        where user_id = p_factory_rep_user and role_key = 'factory_rep'
     ) then
    raise check_violation using message = 'VIRTUAL-SCHEDULE-REP';
  end if;
  select full_name into v_rep_name from public.profiles
   where user_id = p_factory_rep_user;
  v_rep_name := coalesce(nullif(btrim(p_rep_display_name), ''), v_rep_name);
  if v_rep_name is null then
    raise check_violation using message = 'VIRTUAL-SCHEDULE-REP';
  end if;
  select a.inspector_id, p.full_name into v_inspector, v_inspector_name
    from public.assignments a
    join public.profiles p on p.user_id = a.inspector_id
   where a.visit_id = p_visit
   order by a.created_at desc limit 1;
  if v_inspector is null then
    raise check_violation using message = 'VIRTUAL-SCHEDULE-INSPECTOR';
  end if;

  insert into public.virtual_sessions(
    visit_id, appointment_at, timeline
  ) values (
    p_visit, p_appointment_at,
    jsonb_build_array(jsonb_build_object(
      'event','scheduled', 'at',now(), 'actor',v_actor,
      'detail',jsonb_build_object('appointment_at',p_appointment_at)
    ))
  ) returning id into v_session;

  insert into public.virtual_participants(
    session_id, display_name, role, user_id
  ) values (
    v_session, v_rep_name, 'factory_rep', p_factory_rep_user
  ) returning id into v_rep_participant;
  insert into public.virtual_participants(
    session_id, display_name, role, user_id
  ) values (
    v_session, v_inspector_name, 'inspector', v_inspector
  );

  insert into public.notifications(
    event_key, recipient, payload, channel, delivery_state, delivered_at
  ) values
    (
      'virtual_scheduled', v_inspector,
      jsonb_build_object(
        'session_id',v_session, 'visit_id',p_visit,
        'appointment_at',p_appointment_at
      ),
      'inapp','delivered',now()
    ),
    (
      'virtual_scheduled', p_factory_rep_user,
      jsonb_build_object(
        'session_id',v_session, 'visit_id',p_visit,
        'appointment_at',p_appointment_at
      ),
      'inapp','delivered',now()
    );

  insert into public.audit_events(
    actor, object_type, object_id, action, after_state, requirement_refs
  ) values (
    v_actor, 'virtual_sessions', v_session, 'schedule_virtual_session',
    jsonb_build_object(
      'visit_id',p_visit,
      'appointment_at',p_appointment_at,
      'factory_rep_user',p_factory_rep_user
    ),
    array['M05-002','RBAC-014']
  );

  return jsonb_build_object(
    'session_id',v_session,
    'factory_rep_participant_id',v_rep_participant,
    'state','scheduled'
  );
end $$;

revoke all on function public.schedule_virtual_session(
  uuid, timestamptz, uuid, text
) from public, anon;
grant execute on function public.schedule_virtual_session(
  uuid, timestamptz, uuid, text
) to authenticated;
