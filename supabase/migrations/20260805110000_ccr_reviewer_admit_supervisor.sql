-- CC-CCR-REVIEWER-SUPERVISOR-20260805 / INSP-751
--
-- ccr_is_reviewer() gated compliance approval (ccr_can_read,
-- publish_compliance_request, reject_compliance_request,
-- return_compliance_request, decide_compliance_request_component) on
-- compliance_admin and reviewer only. Neither role exists in public.roles
-- (admin, inspector, planner, supervisor are the only four registered) and no
-- account holds either name, so the function was unsatisfiable for every
-- principal. Nobody could approve a compliance change, and reviewers could
-- not even see pending requests (ccr_can_read depends on the same check).
--
-- Product Owner ruling (2026-08-05): supervisors approve compliance changes.
-- admin is deliberately NOT added here — administrators author under
-- CC-CCR-WRITER-ADMIN-20260805, and granting them approval too would let the
-- same person author and approve a regulation with no second pair of eyes.
--
-- Self-approval prevention: publish_compliance_request,
-- reject_compliance_request, return_compliance_request and
-- decide_compliance_request_component already contain
-- `if r.owner_id = auth.uid() then raise exception 'CCR_MAKER_CHECKER'; end
-- if;` — verified directly against the live function bodies before writing
-- this migration. owner_id (set once, at create_compliance_request, to the
-- creator's auth.uid()) is the only author-identity column on
-- compliance_configuration_requests; there is no separate submitted_by to
-- also check. The control already exists and is complete — it was simply
-- unreachable, because ccr_is_reviewer() rejected every principal before the
-- owner_id check ever ran. Widening the role array is the only change this
-- migration makes; no self-approval logic is added because none was missing.
-- CCR_MAKER_CHECKER is already mapped in apps/web's compliance-requests/
-- actions.ts to "The request creator cannot review or publish their own
-- request." — no application change needed for it to render explanatorily.
--
-- compliance_admin and reviewer stay in the array deliberately. They resolve
-- to false while unregistered, costs nothing, preserves a distinction that
-- may later be created. Only supervisor is added.

create or replace function public.ccr_is_reviewer()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.has_any_role(array['supervisor','compliance_admin','reviewer']);
$$;
