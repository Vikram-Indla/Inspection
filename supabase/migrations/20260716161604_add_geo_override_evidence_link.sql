-- TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003
-- PostgreSQL requires a newly added enum value to commit before a later
-- migration can safely use it in RLS expressions and guarded functions.
alter type evidence_link add value if not exists 'geo_override';
