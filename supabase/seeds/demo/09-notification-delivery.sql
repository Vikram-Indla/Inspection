-- SAQEEL demo data pack — 09 · notification delivery backfill
--
-- Synthetic, non-production.
--
-- 460 notifications were persisted while no push or SMS provider was
-- configured, so they carry delivery_state = 'not_configured' forever and the
-- notification bell renders them as "provider pending" regardless of how the
-- environment is set up today. VAPID keys and Twilio credentials are now
-- present (see apps/web/.env.example), so those historical rows are settled to
-- 'delivered' against the provider that would own the channel.
--
-- This rewrites recorded delivery history. It is correct for a demo dataset
-- whose whole point is to show the platform behaving, and it is NOT something
-- to run against a real tenant, where an undelivered notification must stay
-- undelivered.
--
-- Idempotent: the predicates only match rows still in the old state.

begin;

update public.notifications
set delivery_state = 'delivered',
    delivered_at   = coalesce(delivered_at, created_at + interval '3 minutes'),
    provider       = case channel
                       when 'push'  then 'web-push'
                       when 'sms'   then 'twilio'
                       when 'email' then 'resend'
                       else provider
                     end,
    failure_class  = null,
    last_error     = null,
    attempts       = greatest(coalesce(attempts, 0), 1)
where delivery_state = 'not_configured';

-- Anything queued before today never had a dispatcher behind it. Leave today's
-- queue alone so the bell still shows live in-flight work.
update public.notifications
set delivery_state = 'delivered',
    delivered_at   = coalesce(delivered_at, created_at + interval '2 minutes'),
    provider       = case channel
                       when 'push'  then 'web-push'
                       when 'sms'   then 'twilio'
                       when 'email' then 'resend'
                       else provider
                     end,
    attempts       = greatest(coalesce(attempts, 0), 1)
where delivery_state = 'queued'
  and created_at < timestamptz '2026-07-27 00:00:00+00';

commit;
