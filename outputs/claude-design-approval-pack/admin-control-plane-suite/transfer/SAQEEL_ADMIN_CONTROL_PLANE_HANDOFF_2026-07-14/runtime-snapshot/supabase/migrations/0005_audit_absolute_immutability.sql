-- Audit events: absolutely immutable — block UPDATE/DELETE at trigger level
-- (stronger than RLS deny: applies to table owner and service_role too).
create or replace function block_audit_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'IMMUTABLE: audit_events are append-only (MVP1-FND-003) — % rejected', tg_op;
end $$;
create trigger trg_audit_immutable before update or delete on audit_events
  for each row execute function block_audit_mutation();
revoke update, delete on audit_events from anon, authenticated;
