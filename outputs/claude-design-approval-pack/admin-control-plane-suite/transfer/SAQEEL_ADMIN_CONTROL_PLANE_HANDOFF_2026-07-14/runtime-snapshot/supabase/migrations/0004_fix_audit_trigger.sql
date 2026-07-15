-- Fix: audit trigger must tolerate tables without an `id` column (user_roles).
create or replace function audit_row_change() returns trigger language plpgsql security definer as $$
declare j jsonb; oid uuid;
begin
  j := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  begin oid := (j->>'id')::uuid; exception when others then oid := null; end;
  insert into audit_events(actor, object_type, object_id, action, before_state, after_state)
  values (auth.uid(), tg_table_name, oid, tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
