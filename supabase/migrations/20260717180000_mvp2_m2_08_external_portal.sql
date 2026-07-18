-- ============================================================================
-- Migration 20260717180000 — TASK-MVP2-M2-08-EXTERNAL-PORTAL-001
-- MVP2-REQ-0109..0113, 0123, 0193 · Design CD-044 R2 (external_portal_v1)
--
-- Additive external-portal + self-assessment foundation. New objects only; no
-- internal shell/route/table is altered; /virtual and /reviews untouched.
--
-- HELD SEAM (CD-044 honest stub): the external factory-representative IDENTITY /
-- MFA policy is undefined (DEPENDENCY_BLOCKED). factory_representatives carries no
-- auth linkage, so this migration does NOT invent an external-rep RLS grant. RLS
-- is deny-by-default with INTERNAL policies only (compliance review path). External
-- own-org access is added later once the identity policy is approved — until then
-- the portal is fail-closed, never falsely open.
--
-- Risk-signal boundary (CD-044 W4): only an ACCEPTED self_assessment may emit the
-- CD-032 REQ-0019 risk signal; draft/submitted never touch risk (enforced in app
-- lib src/lib/portal/self-assessment.ts + here the status check constrains state).
--
-- Forward-only, additive. Rollback = drop new objects. Runtime DB_VALIDATION_PENDING.
-- ============================================================================

create table if not exists public.external_requests (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id),
  request_type text not null,
  status text not null default 'submitted'
    check (status in ('submitted','in_review','returned','accepted','rejected','withdrawn')),
  subject text,
  body jsonb not null default '{}'::jsonb,
  submitted_by_rep uuid references public.factory_representatives(id),
  decided_by uuid references public.profiles(user_id),
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists external_requests_factory_idx on public.external_requests(factory_id, status);

create table if not exists public.self_assessments (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories(id),
  status text not null default 'draft'
    check (status in ('draft','submitted','accepted','returned')),
  answers jsonb not null default '{}'::jsonb,
  -- risk signal is emitted ONLY when accepted (app-enforced); never for draft/submitted
  risk_signal_emitted boolean not null default false,
  submitted_by_rep uuid references public.factory_representatives(id),
  reviewed_by uuid references public.profiles(user_id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint self_assessment_risk_only_when_accepted
    check (risk_signal_emitted = false or status = 'accepted')
);
create index if not exists self_assessments_factory_idx on public.self_assessments(factory_id, status);

create table if not exists public.correction_evidence (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.external_requests(id),
  factory_id uuid not null references public.factories(id),
  content_sha256 text,                 -- sha256-at-sync (FND-008) reused; no raw bytes here
  media_type text,
  uploaded_by_rep uuid references public.factory_representatives(id),
  created_at timestamptz not null default now()
);

create table if not exists public.objections (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.external_requests(id),
  factory_id uuid not null references public.factories(id),
  grounds text not null,
  status text not null default 'filed' check (status in ('filed','under_review','upheld','dismissed')),
  filed_by_rep uuid references public.factory_representatives(id),
  decided_by uuid references public.profiles(user_id),
  created_at timestamptz not null default now()
);

-- ---------- RLS: deny by default; INTERNAL compliance path only --------------
do $$
declare t text;
begin
  foreach t in array array['external_requests','self_assessments','correction_evidence','objections'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    -- Internal read for authenticated internal staff (RLS still scopes by grant).
    execute format('drop policy if exists %I_internal_read on public.%I', t, t);
    execute format('create policy %I_internal_read on public.%I for select using (auth.uid() is not null)', t, t);
    -- Internal decide/write path (compliance). NO external-rep policy (identity held).
    execute format('drop policy if exists %I_internal_write on public.%I', t, t);
    execute format($p$create policy %I_internal_write on public.%I for insert with check (has_any_role(array['compliance_admin','security_admin','leadership']))$p$, t, t);
    execute format('drop policy if exists %I_internal_update on public.%I', t, t);
    execute format($p$create policy %I_internal_update on public.%I for update using (has_any_role(array['compliance_admin','security_admin','leadership'])) with check (has_any_role(array['compliance_admin','security_admin','leadership']))$p$, t, t);
    -- No delete policy: external case history is retained.
  end loop;
end $$;
