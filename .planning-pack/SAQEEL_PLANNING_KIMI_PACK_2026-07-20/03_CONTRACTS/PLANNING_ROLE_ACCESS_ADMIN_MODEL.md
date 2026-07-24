# Planning Role, Capability and Administration Contract

## Canonical access classification

| Class | Business navigation | Planning | Administration | Field execution |
|---|---|---|---|---|
| Admin | Dashboard only by default | No | Yes, capability-scoped | No |
| Inspector | Own Dashboard/Execution/Factory 360 | No general Planning; existing authorized Immediate exception only | No | Own assignments only |
| Internal business staff | Dashboard, Operations Center, Factory 360, Planning, Review, Compliance runtime and Insights | Yes | No | No inspector mutation |

The business-staff class is the default for internal authenticated users who are neither Admin nor Inspector. It does not require a permanent `ops` role. Existing roles remain compatibility aliases until safely migrated.

## Capability matrix

| Capability | Business staff | Inspector | Admin |
|---|---:|---:|---:|
| planning.view | Yes | No | No |
| planning.create.single/bulk | Yes | No | No |
| planning.create.immediate | Configurable | Yes, self-assigned path | No |
| planning.publish | Permission | No | No |
| planning.manage | Permission | No | No |
| planning.manual_factory | Permission | Immediate exception by policy | Configure only |
| planning.export | Permission | No | No |
| admin.planning.lookups | No | No | Permission |
| admin.planning.workflow | No | No | Permission |
| admin.access.manage | No | No | Security-admin capability inside Admin class |

## Migration rules

1. Add capabilities and class-resolution without deleting roles.
2. Map legacy `planner`, `reviewer`, `ops`, `leadership` to business capabilities.
3. Map existing six admin roles to Admin capabilities; navigation shows only dashboard and administration.
4. Inspector remains explicit and scope-bound.
5. Server actions/RPC/RLS use capability helpers; UI uses the same effective-access response.
6. No self-escalation. Grant/revoke is audited and separation-of-duties protected.
