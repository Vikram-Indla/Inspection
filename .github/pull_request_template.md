## Task and surface

- Task ID:
- Primary surface: iPad / web / admin / shared / governance
- Does this change a shared contract, database migration, role, workflow, or API? Yes / No

## Scope

- User-visible outcome:
- Paths intentionally changed:
- Paths deliberately not changed:

## Verification

- [ ] Typecheck passed.
- [ ] Relevant surface tests passed, or an explicit reason is recorded.
- [ ] Cross-surface regression was run when shared code, migrations, roles, workflows, or APIs changed.
- [ ] Negative paths were checked where behavior can fail closed.
- [ ] Product-contract evidence is updated when a product requirement changed.

## Data and release safety

- [ ] No secrets, customer data, or generated local artifacts are included.
- [ ] Any migration is forward-only, idempotent, and has an evidence/rollback probe.
- [ ] This pull request targets `setup/Inspection`.
