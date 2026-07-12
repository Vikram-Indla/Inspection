-- ============================================================================
-- Migration 0020 — Factory-information verification module
-- (M04-095..114 · M04-190 · M06-017 · M06-034 · SCR-IPAD-630/640/650)
--
-- Source Value (Senaei) vs Observed Value per source-owned factory field.
-- HARD RULE (FND-007 / M04-112): this module NEVER writes back to factories —
-- there is no update path to the factories row anywhere in it; observations
-- live exclusively in inspection_factory_checks.
-- ============================================================================

-- M04-108 — evidence may link to a specific factory field. The linked_id is a
-- deterministic client-computed UUID (sha256 of inspection_id:factory_field:key)
-- that equals inspection_factory_checks.id, so evidence↔check joins are stable
-- even when the evidence op syncs before the check row exists.
alter type evidence_link add value if not exists 'factory_field';

-- ---------- M04-102..107/110/111 — per-field verification checks -------------
create table if not exists inspection_factory_checks (
  id uuid primary key,                                   -- deterministic (== evidence.linked_id, M04-108)
  inspection_id uuid not null references inspections(id),
  field_key text not null,                               -- factories column key (name, cr_number, license_number, ...)
  source_value text,                                     -- Senaei value snapshot at verification time (M04-102)
  observed_value text,                                   -- inspector observation, stored separately (M04-103)
  status text not null check (status in ('verified','updated')),  -- M04-104/105
  evidence_note text,                                    -- per-field comment leg (M04-108/113)
  updated_by uuid references profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inspection_id, field_key)                      -- offline replay upserts on this key (idempotent)
);
comment on table inspection_factory_checks is
  'M04-095..114 — factory-information verification: Source Value (Senaei) vs Observed Value per field, status verified|updated. Never written back to factories (FND-007/M04-112).';
comment on column inspection_factory_checks.id is
  'Deterministic client UUID (sha256 of inspection:factory_field:key) — equals evidence.linked_id for linked_type ''factory_field'' (M04-108).';

create index if not exists ifc_inspection_idx on inspection_factory_checks (inspection_id);

-- ---------- RLS — assigned inspector writes; reviewer/ops+ read --------------
alter table inspection_factory_checks enable row level security;
create policy ifc_read on inspection_factory_checks for select using (
  exists (select 1 from inspections i where i.id = inspection_id
          and (is_assigned_inspector(i.visit_id)
               or has_any_role(array['reviewer','ops','auditor','leadership']))));
create policy ifc_insert on inspection_factory_checks for insert with check (
  exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));
create policy ifc_update on inspection_factory_checks for update using (
  exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));
-- no delete policy: checks are corrected by upsert, removed never (audit trail).

-- ---------- Immutability + audit (M04-113) -----------------------------------
-- Post-submit content lock — same guard as checklist_responses/evidence.
create trigger trg_guard_ifc before update or delete on inspection_factory_checks
  for each row execute function guard_submitted_inspection();
-- Append-only audit log: Verified / Updated / note changes with before/after
-- state ride in audit_events (ENG-12 / FND-003).
create trigger trg_audit_inspection_factory_checks after insert or update or delete on inspection_factory_checks
  for each row execute function audit_row_change();
