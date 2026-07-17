-- ============================================================================
-- Migration 20260717050000 — TASK-MVP2-M2-02-WORKFLOW-STUDIO-001
-- M2-02 Workflow, SLA & Notification Studio — bilingual templates + delivery log
-- Requirement: MVP2-REQ-0034 — notification templates, channels, languages,
--   trigger events and delivery logs; correct recipient/channel/language used.
--   Design GAP-06 (template_en/ar split) + GAP-10 (provider truth).
--
-- Preserves the governed notification_rules foundation and its maker-checker
-- exactly (no policy/RPC change). Adds only:
--   • notification_rules.template_ar — the Arabic half of the bilingual pair
--     (existing `template` is the English half). No Arabic content is invented;
--     the column is nullable until an owner supplies the governed translation.
--   • notifications delivery-log columns — language, attempts, last_error,
--     provider, failure_class — so delivery attempts/retries/failure are
--     auditable. A row remains an enqueued/attempted record; delivery_state is
--     never 'delivered' without a registered provider actually delivering.
--
-- FORWARD-ONLY. ADDITIVE. IDEMPOTENT. No remote apply during parallel dev.
-- Contract/negative test: supabase/tests/mvp2_m2_02_notification_bilingual_probe.sql
-- ============================================================================

-- Bilingual template pair (English = existing `template`; Arabic = new column).
alter table public.notification_rules
  add column if not exists template_ar text;

comment on column public.notification_rules.template_ar is
  'MVP2-REQ-0034 Arabic half of the bilingual template pair. `template` is the English half. Nullable until the governed translation is supplied — never machine-invented.';

-- Delivery-log columns (provider truth). delivery_state stays the source of
-- truth; these record HOW it was attempted, never fabricate success.
alter table public.notifications add column if not exists language     text;      -- 'en' | 'ar' resolved from recipient
alter table public.notifications add column if not exists attempts     integer not null default 0;
alter table public.notifications add column if not exists last_error   text;
alter table public.notifications add column if not exists provider     text;      -- registered adapter name, when one exists
alter table public.notifications add column if not exists failure_class text;     -- transient|permanent|not_configured|suppressed

create index if not exists ix_notifications_state on public.notifications (delivery_state);
create index if not exists ix_notifications_event on public.notifications (event_key);

comment on column public.notifications.failure_class is
  'MVP2-REQ-0034 provider truth. not_configured = no registered adapter (never a delivered SMS); transient = retryable; permanent = do not retry; suppressed = recipient preference.';
