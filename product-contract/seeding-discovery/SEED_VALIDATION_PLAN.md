# Seed Validation Plan

Mode: design/plan only. No validation was executed against a live database. This plan defines what module `14-validation` (per `SEED_DEPENDENCY_DAG.md`) must check, all read-only, after a seed run completes.

## 1. Referential integrity

- Every foreign key on every seeded row resolves to an existing row (assignments→visits→visit_plans→factories/personas; inspections→assignments; checklist_responses/evidence/findings/violations→inspections; submission_versions/reviews→inspections; notifications.recipient→profiles.user_id).
- No orphaned `evidence` without a linked `inspection`/`checklist_response`.
- No `submission_versions` row without a corresponding `inspections` row in a post-execution status.
- No `reviews` row without a `submission_versions` row it reviews.

## 2. Business invariants

- No approved `inspections` without at least one linked `reviews` row recording the approval (per the blueprint's "approved inspections without reviews" quality check, applied here as a POSITIVE assertion the seeder must satisfy, not merely a quality-report finding).
- No `submission_versions` marked submitted without an immutable version row existing before any correction/resubmission (v1 exists before v2).
- Every `visit_plans`/`visits` in `published` status has at least one `assignments` row for an eligible factory, and any bulk plan scenario includes at least one INELIGIBLE factory correctly excluded (per the blueprint's "bulk plan with eligible/ineligible factories" scenario).
- Every "Daily capacity full" scenario row genuinely reflects the accepted `engine_settings` capacity value — never a fabricated capacity number (this cross-checks against `SEEDER_IMPLEMENTATION_PLAN.md` §2's reference-data verify-only rule).
- Products/raw materials seeded under `05-factories-licenses-production` match the seeded factory's sector (per the blueprint's Factory/Product/Raw-Material coherence rule) — this validation must actively re-check the coherence rule, not just trust module 05 got it right.
- Every immutable `submission_versions`/published `package_versions` row is confirmed byte-identical to its first-written state (no seed run, including a second identical-anchor rerun, ever mutates it) — directly tests `SEEDER_IMPLEMENTATION_PLAN.md` §6's skip-only rule for immutable tables.

## 3. RLS by persona

For each of the 15–20 seeded personas (Section E, not part of this deliverable), log in for real via `/auth/v1/token` and, using ONLY that persona's JWT, attempt:
- Reads that SHOULD succeed (own assignments, own region's factories, own submitted versions).
- Reads that SHOULD be denied or filtered to zero rows (another inspector's draft evidence, another region's plans where scope-restricted, an unpublished package version for a non-admin role).
- At least one write attempt outside the persona's authorized scope, asserting rejection (e.g., an inspector attempting to publish a plan, a planner attempting to approve their own submitted review).

This directly implements the blueprint's "verify RLS using real persona sessions after service-role creation" rule and produces the acceptance rows in `RLS_SEED_ACCEPTANCE_MATRIX.csv`.

## 4. Endpoint smoke tests

For every route/endpoint class enumerated in `ENDPOINT_SMOKE_TEST_MATRIX.csv`, confirm the seeded data makes that endpoint return real, non-empty, RLS-correct results for at least one seeded persona — not merely that the endpoint returns 200. Endpoints already classed `FRONTEND_MOCK` in a prior discovery pass (Section B, not part of this deliverable) are explicitly EXCLUDED from "must show real seeded data" and instead must appear on the "no frontend mocks in accepted routes" exception list (§14) pending their own remediation.

## 5. Write/read round trips

For a representative sample (not every row — see Data-volume profile `qa` in `SEEDER_IMPLEMENTATION_PLAN.md` §17 for the intended full-coverage profile), re-fetch a just-written row through the SAME endpoint a real screen uses (not a raw table query) and diff against what was written, catching any transform/trigger/view discrepancy the write path didn't originally flag.

## 6. Workflow transitions

Exercise the full submitted→returned→resubmitted→under review→approved/rejected chain via canonical RPCs/governed transitions (per `apps/web/src/lib/workflow/governed-transition.ts`, confirmed present in this repo) for at least one seeded inspection per scenario, confirming each transition is REJECTED when attempted out of the accepted state machine order (e.g., attempting to approve a submission still in draft).

## 7. Immutable submission versions

Attempt a direct mutation of an already-submitted `submission_versions` row (as a seed-run persona, not service-role) and confirm the database/RLS layer rejects it — this is a negative-path test, not merely "the seeder chose not to mutate it."

## 8. Audit events

For every canonical-RPC-driven write in modules 08–13, confirm a corresponding `audit_events` row exists with a plausible actor/action/timestamp — confirming §16 of `SEEDER_IMPLEMENTATION_PLAN.md`'s claim that audit is genuinely trigger-generated, not seeder-fabricated. Explicitly confirm zero direct inserts into `audit_events` occurred (row count reconciliation: audit row count should correspond to real RPC/write call count, not to a seeder-authored constant).

## 9. Notification sink

Read `notification-stubs.ts`'s `readSink()` (per `ADAPTER_REPLACEMENT_PLAN.md` §2.7) and confirm: (a) every notification-triggering scenario (assignment created, submission returned, review approved, outside-geofence request raised) produced a corresponding sink entry when staging adapters were registered; (b) `notifications.delivery_state` for push/sms/email channels reads `not_configured` or `staging:<channel>` — NEVER `delivered` via a real provider unless real credentials were genuinely configured and a real message was genuinely sent (which a seed run should not do by default); (c) zero sink entries reached a real, non-test recipient address (cross-check every recipient against the reserved test-domain convention from Section E).

## 10. Dashboard calculations

Confirm dashboard KPI values are NOT stored/seeded directly — only their source facts are — by re-running the existing KPI engine against the seeded facts and confirming the displayed number matches an independently-computed expectation from the raw rows (mirrors the existing precedent and spec pattern in `apps/web/e2e/dashboard-kpi-seed.spec.ts` and `apps/web/e2e/dashboard-kpi-contract.spec.ts`, both already present in this repo).

## 11. Cross-channel receiving queues

For every downstream handoff listed in the blueprint (outside-geofence request→Operations queue; cancellation/reschedule→Planning/Operations queue; submission→Review queue; returned decision→Inspector correction workspace; approved result→Factory 360/compliance history/dashboard; data discrepancy→post-approval correction queue), confirm the RECEIVING side's endpoint/screen shows the seeded item — not just that the SENDING side's insert succeeded. This produces `CROSS_CHANNEL_DATA_HANDOFF_MATRIX.csv` acceptance evidence (Section B, not part of this deliverable, but validated here).

## 12. Offline fixtures/replay

For each seeded "Offline draft/pending outbox/conflict" and "Evidence retry" scenario (per the blueprint's scenario catalogue), confirm the offline replay logic in `apps/web/src/lib/offline.ts` (confirmed present in this repo) correctly resolves the seeded conflict/retry state when replayed — i.e., seed the PRE-replay state realistically, then actually invoke the real replay code path rather than asserting only that the pre-state rows exist.

## 13. Idempotent second run

Re-run the FULL forward chain (`00` through `14`) a second time with the identical `seed_batch_id`/`SEED_ANCHOR_DATE` and confirm: zero net new rows in domain tables beyond permitted freshness-refresh updates (§6 of `SEEDER_IMPLEMENTATION_PLAN.md`); zero errors; identical manifest row counts (per `SEED_MANIFEST_SCHEMA.md` §4) except for updated `completed_at`/freshness timestamps.

## 14. No frontend mocks in accepted routes

Cross-reference the seeded dataset's endpoint coverage against the `FRONTEND_MOCK_AND_FIXTURE_REGISTER.csv` (Section B, not part of this deliverable). Any route still classed `FRONTEND_MOCK` after seeding is a genuine remaining gap to report, not something this validation pass can silently accept — it must appear as an explicit, named exception in the final validation report, never omitted.

## 15. Reporting

`14-validation` writes its results into the same `product-contract/evidence/seed-runs/<seed_batch_id>.json` manifest (`SEED_MANIFEST_SCHEMA.md` §4) under a `validation_summary` key, plus a human-readable companion `product-contract/evidence/seed-runs/<seed_batch_id>-validation.md` listing every check in §1–14 with pass/fail/exception. A seed run is never reported "complete" if any check here fails — this directly enforces `CLAUDE.md`'s "Do not declare completion while any required P0/P1 criterion is failed or unevidenced."
