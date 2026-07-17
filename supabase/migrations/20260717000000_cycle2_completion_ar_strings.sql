-- Cycle 2 completion pass — Arabic strings for the Profile Settings UX
-- correction (row-label layout replacing the old inline dt/dd markup;
-- profile.badge text changed from the developer-facing "PERSONAL, NOT
-- ORGANIZATIONAL" to a presentable "My account"). Guarded upsert never
-- clobbers a human-reviewed translation (status='draft' only).
insert into ui_strings (key, en, ar, status, context) values
  ('profile.badge', 'My account', 'حسابي', 'draft', 'Cycle 2 completion — profile badge (replaces debug-sounding label)'),
  ('profile.appearance.languageLabel', 'Language', 'اللغة', 'draft', 'Cycle 2 completion — profile row label'),
  ('profile.appearance.themeLabel', 'Theme', 'المظهر', 'draft', 'Cycle 2 completion — profile row label')
on conflict (key) do update
  set ar = excluded.ar, en = excluded.en, context = excluded.context
  where ui_strings.status = 'draft';
