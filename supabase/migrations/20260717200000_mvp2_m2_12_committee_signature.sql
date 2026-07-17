-- ============================================================================
-- Migration 20260717200000 — TASK-MVP2-M2-12-COMMITTEE-SIGNATURE-001
-- MVP2-REQ-0128..0136, 0123, 0193 · Design CD-049 R2 (decision_dossier_v1)
--
-- Additive committee decision + signature/verification foundation. Append-only:
-- signature_acts and report_verifications reject UPDATE/DELETE. TWO signature
-- kinds are distinct facts (signature vs refusal) and FOUR outcomes stay separate
-- (captured / refused / failed / queued) — queued is never delivery.
--
-- POLICY BOUNDARY: PKI / EBDA trust is a HELD dependency. verification.status may
-- be unavailable/pending/failed/unverified but is NEVER set to 'verified' without
-- real provider evidence. DEC-009 acknowledgement stays acknowledgement — it is
-- NOT promoted to a digital signature or PKI verification. No value is invented.
--
-- decide()/submit paths untouched; post-sign corrections go through the CD-046
-- case spine only. Forward-only, additive. Runtime DB_VALIDATION_PENDING.
-- ============================================================================

create table if not exists public.signature_acts (
  id uuid primary key default gen_random_uuid(),
  submission_version_id uuid,
  kind text not null check (kind in ('signature','refusal')),
  method text,                            -- e.g. acknowledgement | drawn | pki (labelled honestly)
  outcome text not null check (outcome in ('captured','refused','failed','queued')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unavailable','pending','failed','unverified','verified')),
  report_hash text,
  actor_rep uuid references public.factory_representatives(id),
  actor_user uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);
create index if not exists signature_acts_submission_idx on public.signature_acts(submission_version_id, created_at desc);

create table if not exists public.report_verifications (
  id uuid primary key default gen_random_uuid(),
  report_hash text not null,
  provider text,
  status text not null default 'unavailable'
    check (status in ('unavailable','pending','failed','unverified','verified')),
  detail jsonb not null default '{}'::jsonb,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists report_verifications_hash_idx on public.report_verifications(report_hash, created_at desc);

-- append-only immutability on both stores
create or replace function public.block_signature_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'signature/verification records are append-only' using errcode = '42501';
end $$;

do $$
declare t text;
begin
  foreach t in array array['signature_acts','report_verifications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.uid() is not null)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format($p$create policy %I_write on public.%I for insert with check (auth.uid() is not null)$p$, t, t);
    -- no update/delete policy + trigger below = append-only
    execute format('drop trigger if exists trg_%I_append_only on public.%I', t, t);
    execute format('create trigger trg_%I_append_only before update or delete on public.%I for each row execute function public.block_signature_mutation()', t, t);
  end loop;
end $$;
