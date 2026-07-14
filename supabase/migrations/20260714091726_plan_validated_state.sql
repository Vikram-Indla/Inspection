-- TASK-BASELINE-WIRING-AUDIT-001 · STM-PLAN-001 / STM-PLAN-002
--
-- The frozen state-transition contract requires Visit Plan
-- Draft -> Validated -> Published. The foundation enum omitted Validated,
-- which forced every planning publisher to skip STM-PLAN-001. Add the
-- contract state in its canonical order. Publisher functions are replaced in
-- the following migration, after this enum change has committed.

alter type planning_status add value if not exists 'validated' after 'draft';

