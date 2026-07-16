-- Cycle 2 Wave 0 · DEF-ADM-080 / SCR-ADM-080 — Notification & SLA Rules.
-- MVP1 screen-completeness gap: /admin/notifications did not exist (confirmed
-- by the 2026-07-16/17 readiness audit — no route/component, catalogue-only).
-- Governed maker-checker configuration table for notification events,
-- recipients, templates, channels and SLA/escalation timers, mirroring the
-- existing regulations draft->published->deactivated pattern (RBAC-001..006,
-- ENG-11). Forward-only, additive.
--
-- Personas per screen_route_catalogue.csv (Business Admin; Technical Admin)
-- do not map to distinct role_keys in this schema — the existing cross-cutting
-- admin config scope (config_write/engine_write: compliance_admin, form_admin,
-- workflow_admin, risk_owner, gis_admin, security_admin) is reused rather than
-- inventing new role keys.
--
-- SLA escalation EXECUTION (a scheduled process that fires when sla_minutes is
-- breached) is intentionally not built here — this migration and its app slice
-- close the "no configuration surface exists" gap only. Escalation timers are
-- stored as governed data; automatic breach-firing remains separate, unbuilt
-- runtime scope and must not be represented as complete.

create table notification_rules (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,                                 -- REF-014 event catalogue key
  channel text not null check (channel in ('inapp','push','sms','email')),
  recipient_role text not null references roles(role_key),
  template text not null,                                  -- message template; {placeholder} substituted from payload
  sla_minutes integer check (sla_minutes is null or sla_minutes > 0),
  escalation_role text references roles(role_key),
  status config_status not null default 'draft',
  version_label text not null default 'v1',
  created_by uuid references profiles(user_id),
  approved_by uuid references profiles(user_id),
  published_at timestamptz,
  deactivated_at timestamptz,
  deactivated_by uuid references profiles(user_id),
  deactivation_reason text,
  created_at timestamptz not null default now(),
  constraint notification_rules_maker_checker
    check (approved_by is null or created_by is null or approved_by <> created_by),
  constraint notification_rules_sla_consistent
    check ((sla_minutes is null) = (escalation_role is null))
);

-- Only one open (draft/validated/approved) governed row per event+channel at a
-- time, and only one published (active) row — mirrors regulations_one_open_governed.
create unique index notification_rules_one_open_governed
  on notification_rules(event_key, channel)
  where status in ('draft','validated','approved');
create unique index notification_rules_one_published
  on notification_rules(event_key, channel)
  where status = 'published';

alter table notification_rules enable row level security;
create policy notification_rules_read on notification_rules for select using (auth.uid() is not null);
create policy notification_rules_admin on notification_rules for all
  using (has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']))
  with check (has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']));

create trigger trg_audit_notification_rules
  after insert or update or delete on notification_rules
  for each row execute function audit_row_change();

create or replace function guard_published_notification_rule() returns trigger language plpgsql as $$
begin
  if old.status in ('published','locked') and new is distinct from old then
    raise exception 'IMMUTABLE: published notification rule % (%/%) cannot be modified; create a governed successor draft', old.id, old.event_key, old.channel;
  end if;
  return new;
end $$;
create trigger trg_guard_published_notification_rule
  before update or delete on notification_rules
  for each row execute function guard_published_notification_rule();

create or replace function public.publish_notification_rule(p_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_new public.notification_rules%rowtype; v_old public.notification_rules%rowtype;
begin
  if not public.has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']) then
    raise exception 'not authorized';
  end if;
  select * into v_new from public.notification_rules where id = p_id for update;
  if not found or v_new.status <> 'draft' then raise exception 'notification rule draft not found'; end if;
  if v_new.created_by = auth.uid() then raise exception 'maker-checker requires a distinct approver'; end if;
  if v_new.recipient_role is null or not exists (select 1 from public.roles where role_key = v_new.recipient_role) then
    raise exception 'missing recipient — recipient_role must be a governed role';
  end if;
  select * into v_old from public.notification_rules
    where event_key = v_new.event_key and channel = v_new.channel and status = 'published' for update;
  if found then
    update public.notification_rules set status = 'deactivated', deactivated_at = now(), deactivated_by = auth.uid(),
      deactivation_reason = 'Superseded by governed successor' where id = v_old.id;
  end if;
  update public.notification_rules set status = 'published', approved_by = auth.uid(), published_at = now() where id = v_new.id;
  return v_new.id;
end $$;
revoke all on function public.publish_notification_rule(uuid) from public, anon;
grant execute on function public.publish_notification_rule(uuid) to authenticated;

create or replace function public.deactivate_notification_rule(p_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_rule public.notification_rules%rowtype;
begin
  if not public.has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']) then
    raise exception 'not authorized';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then raise exception 'a deactivation reason is required'; end if;
  select * into v_rule from public.notification_rules where id = p_id and status = 'published' for update;
  if not found then raise exception 'only a published notification rule can be deactivated'; end if;
  update public.notification_rules set status = 'deactivated', deactivated_at = now(), deactivated_by = auth.uid(),
    deactivation_reason = p_reason where id = v_rule.id;
  return v_rule.id;
end $$;
revoke all on function public.deactivate_notification_rule(uuid, text) from public, anon;
grant execute on function public.deactivate_notification_rule(uuid, text) to authenticated;

-- notify.ts consumption + audit proof: when a notification is delivered under a
-- currently-published governed rule, record which rule/version handled it.
alter table notifications
  add column if not exists notification_rule_id uuid references notification_rules(id),
  add column if not exists rule_version_label text;

-- Extend the configuration-audit read seam so writers can see the governed
-- history for the object they are editing (same boundary as admin_configuration_audit).
create or replace function admin_notification_rule_audit(p_object_id uuid)
returns setof public.audit_events
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.has_any_role(array['compliance_admin','form_admin','workflow_admin','risk_owner','gis_admin','security_admin']) then
    raise exception 'not authorized for configuration audit (RBAC-001)';
  end if;
  return query
    select ae.* from public.audit_events ae
    where ae.object_type = 'notification_rules' and ae.object_id = p_object_id
    order by ae.occurred_at desc;
end $$;
revoke execute on function public.admin_notification_rule_audit(uuid) from public;
revoke execute on function public.admin_notification_rule_audit(uuid) from anon;
grant execute on function public.admin_notification_rule_audit(uuid) to authenticated;
