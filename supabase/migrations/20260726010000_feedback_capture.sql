-- SAQEEL Feedback module (WA-M11, card "feedback") — schema for post-visit
-- establishment feedback captured on the inspector's device (same in-person
-- device-handoff pattern already accepted for factory-representative
-- acknowledgement, DEC-009/M04-197). No public unauthenticated route: the
-- representative interacts on the assigned inspector's authenticated session,
-- same as SignaturePad's existing acknowledgement flow. The QR-driven
-- external self-serve scan destination (O-15) remains undecided and out of
-- scope for this migration.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null unique references public.visits(id),
  inspector_id uuid not null references public.profiles(user_id),
  overall_rating smallint not null check (overall_rating between 1 and 5),
  notes text,
  signed_name text not null,
  signature_data_url text not null,
  signed_at timestamptz not null,
  submitted_by uuid not null references public.profiles(user_id),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.feedback_aspect (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  aspect_key text not null,
  rating smallint not null check (rating between 1 and 5),
  unique (feedback_id, aspect_key)
);

alter table public.feedback enable row level security;
alter table public.feedback_aspect enable row level security;

create policy feedback_read on public.feedback
  for select to authenticated
  using (
    public.is_assigned_inspector(visit_id)
    or public.has_any_role(array['admin', 'exec', 'reviewer', 'ops'])
  );

create policy feedback_inspector_insert on public.feedback
  for insert to authenticated
  with check (public.is_assigned_inspector(visit_id) and submitted_by = auth.uid());

create policy feedback_aspect_read on public.feedback_aspect
  for select to authenticated
  using (exists (
    select 1 from public.feedback f
    where f.id = feedback_id
      and (public.is_assigned_inspector(f.visit_id) or public.has_any_role(array['admin', 'exec', 'reviewer', 'ops']))
  ));

create policy feedback_aspect_inspector_insert on public.feedback_aspect
  for insert to authenticated
  with check (exists (
    select 1 from public.feedback f
    where f.id = feedback_id and public.is_assigned_inspector(f.visit_id)
  ));

-- Atomic submit: one feedback row + its per-aspect ratings in one transaction,
-- gated on the visit actually being in the terminal completed state
-- (operational_state = 'submitted') and the caller being its assigned inspector.
create or replace function public.submit_visit_feedback(
  p_visit_id uuid,
  p_overall_rating smallint,
  p_notes text,
  p_signed_name text,
  p_signature_data_url text,
  p_aspects jsonb -- [{"aspect_key": "...", "rating": 1..5}, ...]
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_feedback_id uuid;
  v_state public.operational_state;
  v_aspect jsonb;
begin
  if not public.is_assigned_inspector(p_visit_id) then
    raise exception 'not the assigned inspector for this visit' using errcode = '42501';
  end if;

  select operational_state into v_state from public.visits where id = p_visit_id;
  if v_state is distinct from 'submitted' then
    raise exception 'visit is not in a completed state' using errcode = 'check_violation';
  end if;

  insert into public.feedback (
    visit_id, inspector_id, overall_rating, notes,
    signed_name, signature_data_url, signed_at, submitted_by
  ) values (
    p_visit_id, auth.uid(), p_overall_rating, p_notes,
    p_signed_name, p_signature_data_url, now(), auth.uid()
  ) returning id into v_feedback_id;

  for v_aspect in select * from jsonb_array_elements(coalesce(p_aspects, '[]'::jsonb))
  loop
    insert into public.feedback_aspect (feedback_id, aspect_key, rating)
    values (v_feedback_id, v_aspect->>'aspect_key', (v_aspect->>'rating')::smallint);
  end loop;

  return v_feedback_id;
end;
$$;

grant execute on function public.submit_visit_feedback(uuid, smallint, text, text, text, jsonb) to authenticated;
