-- ============================================================================
-- Migration 0002 — RBAC policy set (rbac_matrix.csv RBAC-001..014),
-- immutability guards (CLAUDE.md hard rules), append-only audit triggers.
-- ============================================================================

create or replace function has_any_role(rs text[]) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from user_roles where user_id = auth.uid() and role_key = any(rs)) $$;

create or replace function is_assigned_inspector(v uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from assignments a where a.visit_id = v and a.inspector_id = auth.uid()) $$;

-- ---------- factories (RBAC-005 gis coords · read wide) ----------
create policy factories_read on factories for select using (auth.uid() is not null);
create policy factories_write_admin on factories for insert with check (has_any_role(array['gis_admin','planner','compliance_admin']));
create policy factories_update on factories for update using (has_any_role(array['gis_admin','planner'])) with check (true);

-- ---------- planning (RBAC-007 planner · RBAC-008 ops) ----------
create policy plans_read on visit_plans for select using (has_any_role(array['planner','ops','reviewer','auditor','leadership']));
create policy plans_write on visit_plans for insert with check (has_role('planner'));
create policy plans_update on visit_plans for update using (has_any_role(array['planner','ops']));
create policy visits_write on visits for insert with check (has_role('planner'));
create policy visits_update on visits for update using (has_any_role(array['planner','ops']));
create policy assignments_read on assignments for select using (
  inspector_id = auth.uid() or has_any_role(array['planner','ops','reviewer','auditor']));
create policy assignments_write on assignments for insert with check (has_any_role(array['planner','ops']));
create policy assignments_update on assignments for update using (
  inspector_id = auth.uid() or has_any_role(array['planner','ops']));  -- inspector: accept/return only (guarded in API)

-- ---------- journey/geo (RBAC-009 own · ops visibility) ----------
create policy journeys_rw on journey_sessions for all using (
  inspector_id = auth.uid() or has_any_role(array['ops','auditor'])) with check (inspector_id = auth.uid());
create policy geo_read on geo_events for select using (has_any_role(array['ops','auditor','reviewer']) or is_assigned_inspector(visit_id));
create policy geo_insert on geo_events for insert with check (is_assigned_inspector(visit_id) or has_role('ops'));
-- geo events immutable: no update/delete policies (deny by default)

-- ---------- inspection runtime (RBAC-010 own draft · RBAC-011 reviewer read) ----------
create policy inspections_read on inspections for select using (
  is_assigned_inspector(visit_id) or has_any_role(array['reviewer','auditor','ops','planner','leadership']));
create policy inspections_write on inspections for insert with check (is_assigned_inspector(visit_id));
create policy inspections_update on inspections for update using (is_assigned_inspector(visit_id));

create policy responses_rw on checklist_responses for all using (
  exists (select 1 from inspections i where i.id = inspection_id and (is_assigned_inspector(i.visit_id) or has_any_role(array['reviewer','auditor'])))
) with check (
  exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));
create policy evidence_rw on evidence for all using (
  exists (select 1 from inspections i where i.id = inspection_id and (is_assigned_inspector(i.visit_id) or has_any_role(array['reviewer','auditor'])))
) with check (
  exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));
create policy findings_rw on findings for all using (
  exists (select 1 from inspections i where i.id = inspection_id and (is_assigned_inspector(i.visit_id) or has_any_role(array['reviewer','auditor'])))
) with check (
  exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));
create policy violations_read on violations for select using (auth.uid() is not null);
create policy violations_insert on violations for insert with check (
  exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));  -- system-generated via runtime
create policy actions_rw on action_forms for all using (
  exists (select 1 from inspections i where i.id = inspection_id and (is_assigned_inspector(i.visit_id) or has_any_role(array['reviewer','auditor','ops'])))
) with check (
  exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));

-- ---------- submissions & reviews (RBAC-011/012 · immutable) ----------
create policy subs_read on submission_versions for select using (
  has_any_role(array['reviewer','auditor','leadership']) or exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));
create policy subs_insert on submission_versions for insert with check (
  exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));
-- no update/delete policies: submitted versions immutable (hard rule)

create policy reviews_read on reviews for select using (
  reviewer_id = auth.uid() or has_any_role(array['auditor','ops','leadership'])
  or exists (select 1 from inspections i where i.id = inspection_id and is_assigned_inspector(i.visit_id)));
create policy reviews_update on reviews for update using (reviewer_id = auth.uid());
create policy reviews_insert on reviews for insert with check (has_any_role(array['reviewer','ops']) or auth.uid() is not null);

-- ---------- virtual (RBAC-014 own session only — participant scoping in API) --
create policy vs_read on virtual_sessions for select using (auth.uid() is not null);
create policy vs_write on virtual_sessions for all using (
  has_any_role(array['planner','ops']) or is_assigned_inspector(visit_id)) with check (true);
create policy vp_rw on virtual_participants for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------- config engines (RBAC-001..006 admin scopes, maker-checker) -------
create policy config_read on config_versions for select using (auth.uid() is not null);
create policy config_write on config_versions for insert with check (
  has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']));
create policy config_update on config_versions for update using (
  has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']));
do $$ declare t text;
begin
  foreach t in array array['regulations','regulation_clauses','inspection_items','packages','package_versions','violation_codes','penalty_mappings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I_read on %I for select using (auth.uid() is not null)', t, t);
    execute format('create policy %I_admin on %I for all using (has_any_role(array[''compliance_admin'',''form_admin''])) with check (has_any_role(array[''compliance_admin'',''form_admin'']))', t, t);
  end loop;
end $$;
alter table engine_settings enable row level security;
create policy engine_read on engine_settings for select using (auth.uid() is not null);
create policy engine_write on engine_settings for update using (
  has_any_role(array['risk_owner','gis_admin','compliance_admin','workflow_admin','security_admin']));

create policy notif_own on notifications for select using (recipient = auth.uid() or has_role('ops'));
create policy audit_read on audit_events for select using (has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner']));

-- ---------- Immutability guards (hard rules as triggers) ---------------------
-- Published package versions never change (M09-030)
create or replace function guard_published_package() returns trigger language plpgsql as $$
begin
  if old.status in ('published','locked') and (new.definition is distinct from old.definition or new.version_label is distinct from old.version_label) then
    raise exception 'IMMUTABLE: published package version % cannot be modified (M09-030)', old.version_label;
  end if;
  return new;
end $$;
create trigger trg_guard_pkg before update on package_versions for each row execute function guard_published_package();

-- Submitted inspection content locked except via review return scope (enforced at API; DB blocks post-submit edits)
create or replace function guard_submitted_inspection() returns trigger language plpgsql as $$
declare st text;
begin
  select status into st from inspections where id = coalesce(new.inspection_id, old.inspection_id);
  if st in ('submitted','under_review','approved','rejected') then
    raise exception 'IMMUTABLE: inspection % content is locked (status %) — corrections only via review return (STM-REV-003)',
      coalesce(new.inspection_id, old.inspection_id), st;
  end if;
  return coalesce(new, old);
end $$;
create trigger trg_guard_resp before update or delete on checklist_responses for each row execute function guard_submitted_inspection();
create trigger trg_guard_evd  before update or delete on evidence            for each row execute function guard_submitted_inspection();
create trigger trg_guard_fnd  before update or delete on findings            for each row execute function guard_submitted_inspection();

-- Review decisions immutable once made (M06-009)
create or replace function guard_decided_review() returns trigger language plpgsql as $$
begin
  if old.decided_at is not null then
    raise exception 'IMMUTABLE: review % already decided (%) — decisions cannot be edited (M06-009)', old.id, old.decision;
  end if;
  return new;
end $$;
create trigger trg_guard_review before update on reviews for each row execute function guard_decided_review();

-- ---------- Append-only audit trigger (ENG-12 / FND-003) ---------------------
create or replace function audit_row_change() returns trigger language plpgsql security definer as $$
begin
  insert into audit_events(actor, object_type, object_id, action, before_state, after_state)
  values (auth.uid(), tg_table_name,
          coalesce((case when tg_op='DELETE' then null else new.id end), old.id),
          tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
do $$ declare t text;
begin
  foreach t in array array['visit_plans','visits','assignments','inspections','submission_versions','reviews','violations','action_forms','package_versions','regulations','engine_settings','user_roles'] loop
    execute format('create trigger trg_audit_%s after insert or update or delete on %I for each row execute function audit_row_change()', t, t);
  end loop;
end $$;
