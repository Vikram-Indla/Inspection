-- Product Owner approved terminology parity with Web Figma master
-- ML2PNwfShlQM2k44MvSEw5 (Cover 6:10, Planning 29:528).
-- Key identifiers remain stable for compatibility; only visible copy changes.
insert into public.ui_strings (key, en, ar, status, context) values
  ('landing.nav.ipad', 'Inspector', 'المفتش', 'draft', 'Landing quick-switch link to Inspector sign-in'),
  ('landing.cta.workspace', 'Open dashboard', 'افتح لوحة المعلومات', 'draft', 'Landing navigation action when signed in'),
  ('landing.hero.ctaWorkspace', 'Open dashboard', 'افتح لوحة المعلومات', 'draft', 'Landing primary action when signed in'),
  ('landing.persona.inspector.title', 'Inspector', 'المفتش', 'draft', 'Landing Inspector persona card title'),
  ('login.inspector.title', 'Inspector', 'المفتش', 'draft', 'Inspector sign-in title'),
  ('login.inspector.short', 'Inspector', 'المفتش', 'draft', 'Inspector sign-in cross-link label'),
  ('plan.home.tasksLink', 'Tasks — assigned, in progress and completed', null, 'draft', 'Planning landing task-board entry point')
on conflict (key) do update set
  en = excluded.en,
  ar = coalesce(excluded.ar, public.ui_strings.ar),
  context = excluded.context,
  orphaned = false,
  updated_at = now();
