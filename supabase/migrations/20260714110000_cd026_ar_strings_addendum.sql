-- CD-026 addendum — Arabic for the neutralised load-error strings introduced by
-- the DEC-012 CODEX_AUDIT_CD-026 F1/F2 remediation (raw provider text removed
-- from the /visits, /visits/calendar and /visits/workload load-error banners).
-- Guarded upsert, status='draft'; never clobbers a human-reviewed row. Paste-safe.

insert into ui_strings (key, en, ar, status, context) values
  ('visit.list.loadErrorNeutral', 'Visits are temporarily unavailable. Please try again.', 'الزيارات غير متاحة مؤقتًا. حاول مرة أخرى.', 'draft', 'CD-026 query-degraded'),
  ('visit.load.loadErrorNeutral', 'Assignments are temporarily unavailable. Please try again.', 'الإسنادات غير متاحة مؤقتًا. حاول مرة أخرى.', 'draft', 'CD-026 query-degraded')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';
