create or replace function public.notification_visit_context(p_visit_ids uuid[])
returns table (visit_id uuid, visit_reference text, factory_name text, region text, city text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct v.id, v.visit_reference, f.name, f.region, f.city
  from public.visits v
  join public.factories f on f.id = v.factory_id
  where v.id = any(p_visit_ids)
    and exists (
      select 1 from public.notifications n
      where n.recipient = auth.uid()
        and (n.payload ->> 'visit_id') = v.id::text
    )
$$;

grant execute on function public.notification_visit_context(uuid[]) to authenticated;
