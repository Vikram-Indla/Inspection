-- CC-CCR-WRITER-ADMIN-20260805 / INSP-740 / INSP-745
--
-- ccr_is_writer() gated compliance configuration-request authoring on
-- compliance_admin and form_admin only. Neither role exists in public.roles
-- (admin, inspector, planner, supervisor are the only registered roles) and
-- no account holds either name, so the function was unsatisfiable for every
-- principal in the system. admin was absent from the list entirely.
--
-- requireConfigurationWriter() (apps/web/src/lib/admin-configuration.ts)
-- already admits admin alongside compliance_admin/form_admin — the database
-- and the application layer disagreed. An admin passed the page gate, saw
-- the create-request controls, and was refused by the database on submit.
--
-- Product Owner ruling (Option A, 2026-08-05): admin is a persona within MIM
-- who may also act as planner or supervisor; administrators author
-- compliance content, no separate compliance-authoring role is intended.
--
-- compliance_admin and form_admin stay in the array deliberately. They
-- resolve to false while unregistered, so retaining them costs nothing and
-- preserves a distinction that may later be created. Only admin is added.
--
-- No change to approval, maker-checker, publication or lifecycle rules.
-- No new role created. No role granted to any account.

create or replace function public.ccr_is_writer()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.has_any_role(array['admin','compliance_admin','form_admin']);
$$;
