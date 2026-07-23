# Planning — Current Repository Baseline Map

Read this together with the canonical plan. Paths refer to the current `setup/Inspection` line inspected while preparing this pack. Kimi must fetch the latest line and re-verify each fact before editing.

| Area | Existing implementation to preserve | Current truth / gap to verify |
|---|---|---|
| Planning home | `apps/web/src/app/planning/page.tsx` | Planner-only; Bulk/Single/Immediate cards; blocks all methods when no published package; draft resume unavailable; plan register link. |
| Single | `apps/web/src/app/planning/single/*` | Planner-only; local factory-table search; CR/factory code/licence/name; no canonical plant-number search; one package; physical/virtual; can proceed without licence. |
| Bulk targeting | `apps/web/src/app/planning/bulk/*` | Nested criteria and selection exist; only region/risk/activity class/city; operators only is/is-not; all factories evaluated server-side in application memory. |
| Bulk review/config | `apps/web/src/app/planning/bulk/review/*` | Accepted DEC-024 route; staged selection in sessionStorage; no durable draft before publish; periodic + physical + one package; manual/auto assignment and evidence ledger. |
| Atomic publish | `publish_bulk_plan`, `publish_single_visit` migrations/actions | Existing atomic transactions and idempotency must remain. Recheck full guards and accepted eligible-subset semantics. |
| Immediate | `apps/web/src/app/planning/immediate/*` | Planner/Inspector; registered/manual; mandatory location; current manual fields and eligibility do not fully match detailed source; package currently required. |
| Plan register | `apps/web/src/app/planning/plans/*` | Read-only plan list/detail; existing route ownership must remain. List is not the complete Planning Visit List. |
| Visit management | `apps/web/src/app/visits/*` | Main lifecycle list/actions, bulk edit/reassign/reschedule/cancel, details, notes, attachments, audit; filters/columns/export/status contracts incomplete. |
| Return | visit actions/detail | Current detail derives return reason from a `RETURNED: ` notes prefix; normalize without breaking history. |
| Expiry | `0025_scheduled_visit_expiry.sql`, RPCs, cron | Real scheduled expiry exists; current rule is window elapsed + inspection not started. Extend via configuration; preserve scheduler/audit/notifications. |
| Workflow admin | `apps/web/src/app/admin/workflows/*` | Versioned workflow config, maker-checker, state graph/validation; raw payload editing and no persisted simulation. Extend with Planning-specific governed controls. |
| Roles admin | `apps/web/src/app/admin/access/*` | Read-only roster; role change workflow explicitly missing. |
| Navigation | `apps/web/src/lib/shell-navigation.ts` | Six admin role keys + planner/inspector/reviewer/ops/leadership; broad business menu. Reconcile to Admin, Inspector and default business-staff model without destructive deletion. |
| Factory 360 handoff | `/factories` and `/planning/immediate` links | Preserve existing handoffs; add required prefilled Single route for CR/licence/plant. |
| External data | `lib/integrations/senaei`, canonical Factory 360 tables | Server-only adapters exist for documented API. Planning should consume canonical data, never raw provider from browser. |
| Industry Shared | fail-closed provider family | Contracts incomplete; related workforce/contact filters remain honest unavailable states. |

## Known accepted route constraint

DEC-024 remains binding: `/planning/bulk/review` is the existing route-neutral configuration/assignment/pre-publish workspace. Do not build a replacement `/planning/:id/configure`; `/planning/plans/:id` stays read-only post-publish.
