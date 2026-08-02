-- PLN-002 / PLN-REQ-017
-- The Planning list and CSV both read lifecycle timestamps through the same
-- RLS-protected relation. Expose only SELECT to authenticated callers so the
-- existing visit_lifecycle_events_read policy can decide row visibility.

revoke all on public.visit_lifecycle_events
  from public, anon, authenticated;

grant select on public.visit_lifecycle_events to authenticated;

