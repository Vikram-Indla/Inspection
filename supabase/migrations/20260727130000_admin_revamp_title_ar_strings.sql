-- RTL-I18N-P1-001 / CR-449..CR-478 / WA-M9-AC-004 / WA-M10-AC-004
-- Exact Administration destination titles from design/final-cut/saqeel-revamp.html.
-- Additive draft resources only; never overwrite an approved human translation.
insert into public.ui_strings (key, en, ar, status, context) values
  ('admin.revamp.access.title', 'Users & Roles', 'المستخدمون والأدوار', 'draft', 'WA-DES-020 frame-19-admin-users-roles'),
  ('admin.revamp.lookup.title', 'Lookup Management', 'إدارة القوائم المرجعية', 'draft', 'WA-DES-020 frame-20-admin-lookup-management'),
  ('admin.revamp.risk.title', 'Risk Configuration', 'تهيئة المخاطر', 'draft', 'WA-DES-020 frame-21-admin-risk-configuration'),
  ('admin.revamp.survey.title', 'Survey Configuration', 'تهيئة النماذج', 'draft', 'WA-DES-020 frame-22-admin-survey-configuration'),
  ('admin.revamp.integration.title', 'Integration Management', 'إدارة التكاملات', 'draft', 'WA-DES-020 frame-24-admin-integration-management')
on conflict (key) do update
  set en = excluded.en,
      ar = excluded.ar,
      context = excluded.context
  where public.ui_strings.status = 'draft';
