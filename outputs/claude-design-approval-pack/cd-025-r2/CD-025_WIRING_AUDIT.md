# CD-025_WIRING_AUDIT.md
**CD-025 / SCR-WEB-150 / P03 — Plan Review & Publish · independent wiring audit (DEC-012)**

Branch `feat/cd-025-plan-review-publish` @ base `main 9360fc9`. Audit performed after
implementation, against live repo/runtime truth (Supabase project `iiozvqntawxfwbgffzqu`).
Every runtime claim is backed by a passing read-only e2e assertion or a code/migration citation.
The guarded RPC `publish_bulk_plan` (migration `20260714091727`) is the authority; the
`validateBulkPlan` preview never substitutes for it.

## 14-leg matrix — Publish bulk plan (primary action)

| # | Leg | Status | Evidence |
|---|-----|--------|----------|
| 1 | UI trigger | CLOSED | Single native `<button>` in `PublishActionBar`; `disabled` until `committable`; `aria-describedby` → stable reason id. `ReviewClient.tsx`. |
| 2 | Client component | CLOSED | `ReviewClient` (`apps/web/src/app/planning/bulk/review/ReviewClient.tsx`) — blocker-first workspace. |
| 3 | Route / server action | CLOSED | `publishBulkPlan` server action (`actions.ts`); route `/planning/bulk/review`. |
| 4 | Validation guard | CLOSED | Server action re-checks role + targets + package + window + duplicates + eligibility + overlap; RPC re-runs all guards in-txn. |
| 5 | Canonical transition | CLOSED | Draft → **Validated** → Published inside RPC (`set status = 'validated'` then `'published'`), STM-PLAN-001/002. |
| 6 | Table / RPC / storage | CLOSED | `sb.rpc("publish_bulk_plan", …)`; inserts plan + visits + assignments in one `security invoker` txn. |
| 7 | RLS role scope | CLOSED | RPC runs as caller; `not has_role('planner')` denial; page + action independently gate Planner (RBAC-007). e2e: non-planner denied on `/planning/bulk/review`. |
| 8 | Audit effect | CLOSED | Append-only table triggers capture plan/visit/assignment inserts in-txn (FND-003). |
| 9 | Notification effect | CLOSED | RPC inserts notification rows **queued** only; UI never claims delivered/accepted (FND-004). e2e asserts "queued for sending only". |
| 10 | Success result | CLOSED | RPC returns `plan_id`; action returns `{ ok, planId }`; success state (S26) → primary "Go to visits" + optional read-only `/planning/plans/:id` **only when** plan id captured. |
| 11 | Negative result | CLOSED | Rollback → neutral catalogued copy, no raw error, **no invented support destination**; nothing published. e2e asserts no "contact support". |
| 12 | Retry / idempotency | CLOSED | Publish disabled while `pending` (no double-submit); failure state offers a fresh retry form; duplicate-active-visit guard blocks re-publish. |
| 13 | Automated test | CLOSED | `cd-025-plan-review-publish.spec.ts` (11 read-only) + updated `cd-021-bulk-targeting.spec.ts`; 30/30 PASS. |
| 14 | Runtime evidence | CLOSED | `product-contract/evidence/screens/cd-025-plan-review-v1/` (primary blocked-coverage, AR RTL, narrow 412). |

## Readiness preview — validateBulkPlan (supporting)

Recomputes duplicates, package validity, Inspector pool, manual eligibility/overlap,
same-plan double-booking, and coverage against live RLS-scoped data. **Preview only** —
guarded, sequence-ordered (stale responses discarded), and never authoritative. Drives the
ReadinessRail (role=alert), the ScopeReductionControl, and the live consequence-ledger marks.

## Read-only destination — /planning/plans/:id
UNCHANGED / PROTECTED. Never receives editing or publish controls. Linked only after a
successful commit and only when a plan id is returned.

## Legs that remain HANDOFF_BLOCKED (not implemented — no policy invented)
- **Planning maker-checker / approver** — no planning approval configuration exists; direct Planner publication is the supported path. Surfaced as annotation only (S19).
- **Provider delivery / receipt / acceptance** — out of scope; notifications stay queued (FND-004).
- **Durable success receipt / download** — not built.
- **Policy-based freshness / stale threshold** — none invented; freshness label is provenance (load time), not policy (FND-013). Revalidation is evidence-based.
- **Lost/expired staged-review recovery + guaranteed return-to-edit context restore** — selection is client-held (sessionStorage); "Back to targeting" preserves it, but durable recovery of a lost staged review depends on a persistence model governance has not selected. S22/S28 remain design annotations.

## Audit conclusion
All 14 legs of the primary publish action are **CLOSED** with evidence. Remaining blocked
legs are genuine ungoverned-policy items and are correctly deferred, not stubbed or invented.
No accepted behaviour was weakened; `main` untouched.
