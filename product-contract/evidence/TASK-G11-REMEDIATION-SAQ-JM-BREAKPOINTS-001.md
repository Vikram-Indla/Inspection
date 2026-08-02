# TASK-G11-REMEDIATION-SAQ-JM-BREAKPOINTS-001

## Build identity

- Repository: `github.com/Vikram-Indla/Inspection`
- Worktree: `/Users/vikramindla/Developer/Inspection-saq-jm-breakpoints-001`
- Branch: `codex/saq-jm-breakpoints-001`
- Base and tested source revision: `ada62124c5f8c8066cec397dc70fab31be9b0c7d`
- Commit/push/deploy/remote DDL: not performed

## SAQ-JM-VIS-SLICE-001 — Bulk prerequisite repair verification

The current source already contains both required repairs:

1. `20260729025000_bulk_supervision_request_cardinality.sql` removes the
   invalid one-request-per-plan constraint and retains one request per visit.
2. `20260729027000_bulk_supervision_plan_status.sql` derives aggregate plan
   status from every child supervision request.

No duplicate product migration was created.

### Evidence

| Evidence | Result | Classification |
|---|---|---|
| `apps/web/e2e/saq-jm-visit-breakpoints.spec.ts` | 4/4 PASS | TEST VERIFIED |
| `supabase/tests/saq_jm_visit_breakpoints_slice1.sql` against PostgreSQL 17 | PASS; all assertions followed by `ROLLBACK` | ISOLATED RUNTIME VERIFIED |
| Two requests under one plan | PASS | SCHEMA/RUNTIME VERIFIED |
| First approved/returned/rejected child while sibling pending | Plan remains `pending_supervision` | RUNTIME VERIFIED |
| Approved + rejected final result | `published` | RUNTIME VERIFIED |
| Returned + rejected final result | `returned` | RUNTIME VERIFIED |
| All rejected final result | `cancelled` | RUNTIME VERIFIED |
| Injected duplicate visit request | Whole test subtransaction leaves no plan or request | TRANSACTION VERIFIED |
| Authorization/RLS non-weakening source contract | Permission checks, self-decision denial and fixed `search_path` preserved | CODE VERIFIED |
| `npm run typecheck` | PASS | BUILD VERIFIED |
| `npm run build` | PASS; 58 static pages generated | BUILD VERIFIED |

### Runtime boundary

The contract was exercised in an isolated disposable PostgreSQL 17 container
against the actual repository migration files. The test transaction rolled
back, and the container was stopped and removed. No shared or remote data was
read or mutated.

The linked non-production or production target was not inspected or changed.
Therefore the migrations are verified as executable and correct at the pinned
source revision, but target deployment/application remains **UNVERIFIED**. The
Bulk Visit journey is not declared end-to-end fixed until target-bound
Planner/Supervisor browser evidence exists.

## DEC-SAQ-JM-URGENT-ADMISSION-001

Resolved by the Product Owner on 2026-07-30:

- an authorized Inspector may create an Urgent Visit;
- an unregistered factory is permitted;
- Inspector-created Urgent Visits are direct, self-assigned and have no Visit
  Plan;
- Planner/Supervisor creation retains supervised final assignment;
- manual targets remain capability-gated with validated identity/location,
  duplicate protection, provenance, audit and RLS.

The implementation slice remains subject to the repository design-region/class
confirmation before screen code changes.
