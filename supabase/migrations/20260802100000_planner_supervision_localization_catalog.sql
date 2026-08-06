-- Planner closure: register the supervision and task-journey source strings in
-- the governed localization catalogue. Arabic remains NULL unless an approved
-- translation already exists; the application honestly falls back to English
-- instead of inventing Arabic in a component or migration.
set app.l10n_source = 'sync';

insert into public.ui_strings (key, en, ar, status, context) values
  ('plan.home.tasksLink', 'Task workspace — assigned, in progress and completed', null, 'draft', 'Planning landing — governed task-board entry point'),
  ('plan.supervision.title', 'Supervision queue', null, 'draft', 'Planning supervision page title'),
  ('plan.supervision.unavailable.title', 'Supervision data not available', null, 'draft', 'Planning supervision dependency failure title'),
  ('plan.supervision.unavailable.body', 'We couldn''t load the queue. Nothing was changed.', null, 'draft', 'Planning supervision dependency failure body'),
  ('plan.supervision.denied.title', 'Supervisor access required', null, 'draft', 'Planning supervision unauthorized title'),
  ('plan.supervision.denied.body', 'Only Supervisors can approve, return, or reject submitted visits.', null, 'draft', 'Planning supervision unauthorized body'),
  ('plan.supervision.empty', 'No visit is awaiting supervision.', null, 'draft', 'Planning supervision empty state'),
  ('plan.supervision.requestLabel', 'Supervision request {ref}', null, 'draft', 'Planning supervision card accessible name'),
  ('plan.supervision.awaiting', 'Awaiting Supervisor', null, 'draft', 'Planning supervision card eyebrow'),
  ('plan.supervision.newVisit', 'New visit', null, 'draft', 'Planning supervision missing-reference fallback'),
  ('plan.supervision.pending', 'Pending supervision', null, 'draft', 'Planning supervision status badge'),
  ('plan.supervision.factory', 'Factory', null, 'draft', 'Planning supervision factory label'),
  ('plan.supervision.visitType', 'Visit type', null, 'draft', 'Planning supervision visit-type label'),
  ('plan.supervision.window', 'Window', null, 'draft', 'Planning supervision window label'),
  ('plan.supervision.submitted', 'Submitted', null, 'draft', 'Planning supervision submitted label'),
  ('plan.supervision.finalInspector', 'Final Inspector', null, 'draft', 'Planning supervision assignment label'),
  ('plan.supervision.selectInspector', '— select Inspector', null, 'draft', 'Planning supervision inspector placeholder'),
  ('plan.supervision.noteOptional', 'Decision note (optional)', null, 'draft', 'Planning supervision optional note label'),
  ('plan.supervision.noteRequired', 'Decision note (required)', null, 'draft', 'Planning supervision required note label'),
  ('plan.supervision.approve', 'Approve & release', null, 'draft', 'Planning supervision approve action'),
  ('plan.supervision.releasing', 'Releasing…', null, 'draft', 'Planning supervision approve pending state'),
  ('plan.supervision.return', 'Return to Planner', null, 'draft', 'Planning supervision return action'),
  ('plan.supervision.reject', 'Reject', null, 'draft', 'Planning supervision reject action'),
  ('plan.supervision.actionRequired', 'Supervisor action required', null, 'draft', 'Planning supervision page context')
on conflict (key) do update set
  en = excluded.en,
  context = excluded.context,
  orphaned = false,
  updated_at = now()
where public.ui_strings.status = 'draft'
  and (
    public.ui_strings.en is distinct from excluded.en
    or public.ui_strings.context is distinct from excluded.context
    or public.ui_strings.orphaned is distinct from false
  );
