# SAQEEL four-internal-role capability matrix

Status: approved business policy, implementation phase 1.  This is the
authority for new internal role grants. Existing legacy assignments remain
historical compatibility data until a separate, audited reclassification.

| Capability family | Admin | Planner | Inspector | Supervisor |
| --- | --- | --- | --- | --- |
| Read SAQEEL business data | Yes | Yes | Yes | Yes |
| Configure platform, forms, workflows, master data, integrations and roles | Yes | No | No | No |
| Create, publish and manage visits | No | Yes | No | Yes |
| Manage inspector assignment/capacity and active operational exceptions | No | No | No | Yes |
| Execute an assigned inspection | No | No | Yes | No |
| L2 review: decide, approve, reject or return an inspection | No | No | No | Yes |
| Approve/reject Planner work | No new lifecycle yet | No | No | Capability reserved; blocked until a Planning approval state is approved |

## Invariants

- Business-data read excludes authentication records, credentials, tokens and
  secret-bearing provider configuration.
- Admin does not perform Planner, Supervisor or Inspector operational writes.
- Planner cannot approve/reject work. Supervisor cannot approve/reject work
  they created or materially edited; the server must enforce ownership when
  an approval command exists.
- Inspector execution remains assignment-scoped.
- Factory representatives are external virtual-session participants, not an
  internal canonical role.
- Menus may be visible; every write remains server/RLS/capability guarded.

## Deliberate phase-1 boundary

The repository still has legacy role predicates across existing RLS policies.
This matrix does not redefine `has_role` or `has_any_role`. Each policy family
must be converted to canonical capability checks and tested before a live
legacy-user reclassification.
