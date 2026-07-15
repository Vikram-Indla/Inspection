-- 0015_w1_workspace_runtime.sql — Slice E2 · M04 workspace runtime depth
-- (M04-119 conditional visibility context · M04-171..184 action-forms runtime)
-- NOT applied by the build agent; the orchestrator applies migrations.

-- 1 · Site-condition context (M04-119) ---------------------------------------
-- response_model.conditional.visible_when 'key=value' is evaluated against a
-- per-inspection context object. Least-invasive persistent home: one JSONB on
-- the inspection row itself — no new table, no offline-engine change, and the
-- existing RLS policy inspections_update (0002) already restricts writes to
-- the assigned inspector.
alter table inspections
  add column if not exists context jsonb not null default '{}'::jsonb;
comment on column inspections.context is
  'Site-condition flags (e.g. {"fire_pump_present":"yes"}) driving response_model.conditional.visible_when evaluation in the field workspace (M04-119, SCR-IPAD-620).';

-- 2 · Action-forms runtime instantiation (M04-171..184) -----------------------
-- A corrective_blocking form is instantiated per triggering checklist item.
-- item_id + a unique (inspection_id, item_id) key makes the client upsert
-- idempotent, so replays after reconnect can never duplicate a form.
-- RLS: actions_rw (0002) already scopes read/write to the assigned inspector
-- (+ reviewer/auditor/ops read) — no new policy needed.
alter table action_forms
  add column if not exists item_id uuid references inspection_items(id);
create unique index if not exists action_forms_inspection_item_uq
  on action_forms (inspection_id, item_id);
comment on column action_forms.item_id is
  'Checklist item whose mapped response instantiated this form (M04-172); unique per inspection for idempotent offline-replay upserts.';
