-- ACT-004 / MVP2-REQ-0056..0066
-- The advisory and inspector-briefing tables have authenticated RLS policies,
-- but their base table privileges were never granted. Restore only the
-- operations already bounded by those policies; no anonymous or delete access.
grant select,insert,update on public.ai_suggestions to authenticated;
grant select,insert on public.ai_events to authenticated;
grant select,insert,update on public.inspector_briefing_cache to authenticated;

revoke delete on public.ai_suggestions from authenticated;
revoke update,delete on public.ai_events from authenticated;
revoke delete on public.inspector_briefing_cache from authenticated;
