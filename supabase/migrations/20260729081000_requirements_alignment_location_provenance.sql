-- REQ-007 · Location source and immutable history · sequence 20260729081000
-- Controlled visit corrections are append-only and never update Factory 360
-- official coordinates or the visit's original/planning pins. Mirror each
-- correction into the existing visit_location_events provenance stream so the
-- visit detail exposes original/current source, actor, reason and server time.

alter table public.visit_location_events
  add column if not exists correction_id uuid
    references public.visit_location_corrections(id) on delete restrict;

create unique index if not exists visit_location_events_correction_uq
  on public.visit_location_events(correction_id)
  where correction_id is not null;

create or replace function public.append_visit_location_correction_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
set row_security = off
as $$
begin
  insert into public.visit_location_events(
    visit_id,lat,lng,source,actor,note,created_at,correction_id
  ) values (
    new.visit_id,new.corrected_lat,new.corrected_lng,
    case new.source
      when 'inspector_field' then 'Inspector'
      else 'Integration'
    end,
    new.corrected_by,
    'Controlled correction (current effective location): ' || new.reason,
    new.corrected_at,
    new.id
  )
  on conflict (correction_id) where correction_id is not null do nothing;
  return new;
end;
$$;

revoke all on function public.append_visit_location_correction_event()
  from public,anon,authenticated,service_role;

drop trigger if exists trg_append_visit_location_correction_event
  on public.visit_location_corrections;
create trigger trg_append_visit_location_correction_event
after insert on public.visit_location_corrections
for each row execute function public.append_visit_location_correction_event();

-- Forward-only custody backfill. It adds provenance for existing corrections;
-- it never changes a correction, visit pin, Factory 360 master coordinate,
-- account, audit event or historical row.
insert into public.visit_location_events(
  visit_id,lat,lng,source,actor,note,created_at,correction_id
)
select
  c.visit_id,c.corrected_lat,c.corrected_lng,
  case c.source
    when 'inspector_field' then 'Inspector'
    else 'Integration'
  end,
  c.corrected_by,
  'Controlled correction (current effective location): ' || c.reason,
  c.corrected_at,
  c.id
from public.visit_location_corrections c
on conflict (correction_id) where correction_id is not null do nothing;
