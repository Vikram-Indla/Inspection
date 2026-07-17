-- ============================================================================
-- Migration 20260717010000 — TASK-MVP2-M2-02-WORKFLOW-STUDIO-001
-- M2-02 Workflow, SLA & Notification Studio — workflow version model
-- Requirements: MVP2-REQ-0025 (configurable families publish w/o deploy),
--   MVP2-REQ-0026 (Draft→Review→Approved→Published→Retired→Rolled Back),
--   MVP2-REQ-0042 (Risk model Scheduled activation).
-- Closes design GAP-06 (enum: review/retired/rolled_back), GAP-07 (scheduled
--   activation), GAP-08 (optimistic concurrency / CAS) at the schema layer.
--
-- FORWARD-ONLY. ADDITIVE + IDEMPOTENT. No data mutation. No remote apply during
-- parallel development (Supabase project iiozvqntawxfwbgffzqu is NOT touched by
-- this file; it lands only in the coordinated integration window with approval).
-- Published-row immutability (status filter + no-delete RLS) is preserved.
--
-- The R2 correction brief requires that Retired and Scheduled are explicit
-- contract deltas, never silently approximated by `deactivated` or a future
-- date. This migration makes them first-class enum values / columns.
-- Contract/negative test: supabase/tests/mvp2_m2_02_workflow_version_model_probe.sql
-- ============================================================================

-- ---------- GAP-06: config_status lifecycle values -------------------------
-- ALTER TYPE ... ADD VALUE is additive and non-reversible; run outside any
-- explicit transaction. `if not exists` keeps it idempotent on re-apply.
alter type config_status add value if not exists 'review'      after 'draft';
alter type config_status add value if not exists 'retired'     after 'deactivated';
alter type config_status add value if not exists 'rolled_back' after 'retired';

-- ---------- GAP-08: optimistic concurrency (CAS) on drafts -----------------
alter table public.config_versions
  add column if not exists updated_at  timestamptz not null default now();
alter table public.config_versions
  add column if not exists row_version integer     not null default 1;

-- ---------- GAP-07: explicit scheduled activation & rollback lineage -------
alter table public.config_versions
  add column if not exists scheduled_from timestamptz;              -- future effective activation (never approximated by effective_from now())
alter table public.config_versions
  add column if not exists rollback_of    uuid references public.config_versions(id);  -- explicit rollback target (0026 Rolled Back)
alter table public.config_versions
  add column if not exists retire_reason  text;                     -- governed reason on Retired transition

-- ---------- CAS trigger: bump row_version + updated_at on every update ------
create or replace function public.config_versions_bump_row_version()
returns trigger language plpgsql as $$
begin
  new.updated_at  := now();
  new.row_version := coalesce(old.row_version, 1) + 1;
  return new;
end;
$$;

drop trigger if exists trg_config_versions_bump on public.config_versions;
create trigger trg_config_versions_bump
  before update on public.config_versions
  for each row execute function public.config_versions_bump_row_version();

-- ---------- Guard: one active (published) version per engine+object+scope ---
-- effective activation uniqueness (0026 AC: one published version per
-- object/scope/effective date). Partial unique index over published rows only;
-- retired/rolled_back/deactivated rows are excluded so history is retained.
create unique index if not exists uq_config_versions_active_published
  on public.config_versions (engine, object_id, coalesce(scheduled_from, effective_from))
  where status = 'published';

comment on column public.config_versions.scheduled_from is
  'MVP2-REQ-0042 explicit scheduled activation. Runtime version selection uses coalesce(scheduled_from, effective_from); a future value is a scheduled (not yet active) version. Never approximate scheduling with effective_from = now().';
comment on column public.config_versions.row_version is
  'MVP2-M2-02 GAP-08 optimistic concurrency token. saveWorkflowDraft performs compare-and-set on this value to reject stale overwrites.';
