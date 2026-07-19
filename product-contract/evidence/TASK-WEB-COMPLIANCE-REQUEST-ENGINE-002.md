# TASK-WEB-COMPLIANCE-REQUEST-ENGINE-002 evidence

Date: 2026-07-19 (Asia/Riyadh)
Branch: `codex/compliance-request-engine-002`
Base: accepted Prompt 01 commit `26a8b4363fab9b8d66811aae949b604e2e9b14b9`
Status: `IMPLEMENTED_VERIFIED_AWAITING_SPONSOR_ACCEPTANCE`

## Delivered contracts

The forward migration adds the governed request envelope, immutable revisions,
component snapshots, dependency graph, append-only decisions, append-only
published entity versions, atomic active-version heads and publication ledger.
The mutation surface is RPC-only. Direct authenticated table writes are revoked;
read policies scope owners to their own requests and reviewers to the review set.
Maker-checker is enforced by role checks and actor comparison inside SECURITY
DEFINER RPCs, not by the UI.

The working Web/Admin UI adds `/admin/compliance-requests`, `/new` and `/[id]`:
register, create, detail, component/dependency entry, draft save, submit, revise,
status/history/tree, current-versus-proposed comparison, component decisions,
request Return/Reject and transactional publication. Empty, loading, provider
error, RLS-hidden/not-found and read-only states state only observed truth.

## Lifecycle and negative execution

An isolated PostgreSQL 16 database under `/private/tmp` was initialized with only
the existing contract prerequisites. The migration compiled and executed twice;
the second execution passed, proving idempotent object/policy/trigger replacement.
The rollback-only lifecycle fixture then proved:

- a Form Admin maker created a request, three components and a dependency;
- a Reviewer rejected the Regulation parent and the dependent Inspection Item
  became `auto_rejected`;
- the independent Regulation was approved and the request became
  `partially_approved`;
- publication created exactly one immutable version for the approved independent
  branch;
- a Compliance Admin maker was denied self-approval with `CCR_MAKER_CHECKER`;
- an approved orphan Inspection Item was denied with `CCR_ORPHAN_COMPONENT` and
  version/head counts were unchanged;
- the fixture transaction rolled back, leaving no retained runtime test data.

The catalog probe confirms all eight tables exist with RLS, required RPCs and
immutable triggers exist, and `authenticated` has no direct Insert/Update/Delete
privilege on governed request/version tables.

## Publication and compatibility

All orphan/dependency preflight occurs before the first version insert. Approved
components are locked and processed in deterministic Regulation → Inspection Item
→ Violation → Penalty, created-at, UUID order. PostgreSQL executes one RPC call as
one transaction, so any insert/head/publication failure rolls back the affected
branch operation. Head pointers switch only after the new immutable version row
exists. Existing legacy Regulation, Inspection Item, Violation and Penalty tables
are unchanged. The security-invoker compatibility view exposes stable legacy IDs
beside CCR version heads for controlled cutover; it is not a second authoring path.

Cutover strategy: deploy the additive migration; validate catalog/RLS; begin new
governed changes through CCR; reconcile legacy IDs through the compatibility view;
move consumers to immutable CCR version IDs only under separate controlled slices;
retire direct legacy writes only after parity and rollback evidence. No remote DDL
or legacy cutover occurred in Prompt 02.

## Notifications and audit

RPCs append correlated events to the existing `audit_events` table and in-app
events to the existing `notifications` table. No parallel engines were created.
The server action uses the existing `insertNotification` delivery service for any
published push/SMS/email rule, retaining provider truth, preferences and failure
behavior. The shared bell labels submitted, returned, approved, partially
approved, rejected and published events in English and Arabic.

## Verification

| Check | Result |
|---|---|
| Migration compile | PASS |
| Migration second/idempotent execution | PASS |
| Rollback-only lifecycle/maker-checker/partial/publication/orphan probe | PASS |
| Read-only catalog/RLS privilege probe | PASS |
| Prompt 02 source contract | 8/8 PASS |
| TypeScript typecheck | PASS |
| Next.js production build | PASS; three new dynamic routes compiled |
| Complete non-mutating static inventory | 100 passed / 4 intentional live-provider skips / 0 failed |
| `git diff --check` | PASS |

No Inspector/iPad, Mapbox, digital-signature, offline-execution, inspection
navigation, historical inspection/report, unrelated Administration, or legacy
Compliance table source was modified.

## Holds

- Prompt 02 sponsor acceptance is pending.
- Applying the migration to a shared/remote Supabase project and executing the
  production cutover are separate controlled actions and are not claimed.
