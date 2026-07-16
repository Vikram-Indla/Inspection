-- CD-023 advisor remediation — keep privileged helpers out of the exposed API
-- schema while preserving SECURITY INVOKER + RLS for the public transaction.
--
-- Supabase's security advisor correctly flags SECURITY DEFINER functions that
-- authenticated users can call in `public`. These two helpers are implementation
-- details: one is referenced by an RLS policy and one is called only by the
-- governed create_immediate_visit transaction. Moving them retains their OIDs
-- (and therefore the compiled policy dependency) but removes PostgREST RPC
-- exposure because `private` is not an exposed API schema.

create schema if not exists private;
revoke all on schema private from public;

alter function public.is_owned_inspector_immediate(uuid) set schema private;
alter function public.audit_immediate_attempt(uuid, text, jsonb) set schema private;

revoke all on function private.is_owned_inspector_immediate(uuid) from public;
revoke all on function private.audit_immediate_attempt(uuid, text, jsonb) from public;

-- RLS evaluation and the SECURITY INVOKER RPC still execute as the signed-in
-- caller, so they need only schema USAGE plus the exact helper EXECUTE grants.
grant usage on schema private to authenticated;
grant execute on function private.is_owned_inspector_immediate(uuid) to authenticated;
grant execute on function private.audit_immediate_attempt(uuid, text, jsonb) to authenticated;

-- The function body uses an unqualified helper name. Keep resolution explicit
-- and fixed; no caller-controlled schema enters the path.
alter function public.create_immediate_visit(
  uuid,text,uuid,text,text,text,text,text,text,numeric,numeric,text,text,uuid,text,
  text,text,timestamptz,timestamptz,uuid,boolean
) set search_path = public, private;
