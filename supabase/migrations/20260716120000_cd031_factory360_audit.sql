-- TASK-G11-G12-RELEASE-001 · CD-031 · MVP1-M07-006/007/013/014 · ENG-12
-- Factory 360 mutations were already protected by RLS but were absent from the
-- canonical append-only audit trigger set. Attach the existing audit function;
-- no new event model, role, retention rule or policy value is introduced.

do $$
declare
  t text;
  trigger_name text;
begin
  foreach t in array array[
    'factory_documents',
    'factory_representatives',
    'factory_products',
    'factory_materials'
  ] loop
    trigger_name := 'trg_audit_' || t;
    if exists (
      select 1
        from pg_trigger
       where tgrelid = format('public.%I', t)::regclass
         and tgname = trigger_name
         and not tgisinternal
    ) then
      if not exists (
        select 1
          from pg_trigger
         where tgrelid = format('public.%I', t)::regclass
           and tgname = trigger_name
           and not tgisinternal
           and tgfoid = 'public.audit_row_change()'::regprocedure
           and tgtype = 29 -- AFTER ROW for INSERT (4), DELETE (8), UPDATE (16)
      ) then
        raise exception 'CD031_AUDIT_TRIGGER_CONFLICT: %.% is not canonical', t, trigger_name;
      end if;
    else
      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
        trigger_name,
        t
      );
    end if;
  end loop;
end
$$;
