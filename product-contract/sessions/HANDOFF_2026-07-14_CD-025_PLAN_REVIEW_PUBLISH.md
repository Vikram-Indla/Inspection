# Session handoff — CD-025 Plan Review & Publish (SCR-WEB-150 / P03)

**Date:** 2026-07-14 · **Branch:** `feat/cd-025-plan-review-publish` (off `main 9360fc9`) · **main untouched, nothing pushed/merged.**
**Authorization:** sponsor (Vikram Indla) directed implementation on a branch in-session; pack's `implementation_authorized:false` superseded for this task only. No blocked policy invented.

## What shipped
Upgraded the governed `/planning/bulk/review` route from the basic CD-021 review step into the
CD-025 staged **Plan Review & Publish** workspace, imported from Claude Design project
`20cb0dce-94f1-4423-b923-00d6fd0d2c24`.

- **Signature pattern — Publish Consequence Ledger** (4 groups: created / referenced / recorded-or-queued / will-not-happen), bound to retained scope, live recalculation.
- **ReadinessRail** (`role=alert`) — blocker-first error summary; each blocker's Fix acts on its object (remove duplicates / focus row / focus window).
- **ScopeReductionControl** — explicit named duplicate removal, recalculated counts.
- **PublishActionBar** — single native publish, `disabled` with `aria-describedby` → stable reason.
- **Truthful copy fixes:** killed the stale "Auto (round-robin)" label (RPC is first-available-in-window) and the invented "contact support" destination; neutral retry only.
- **Plan-id capture:** `publishBulkPlan` now returns `{ ok, planId }` (no hard redirect); success state (S26) shows counts + "Go to visits" + optional read-only `/planning/plans/:id` link only when a plan id is returned.
- **`validateBulkPlan`** readiness preview (sequence-guarded) — `publish_bulk_plan` stays authoritative.

## Files
- `apps/web/src/app/planning/bulk/review/{page.tsx,ReviewClient.tsx,review.css}`
- `apps/web/src/app/planning/bulk/actions.ts` (validate + publish result + copy fixes)
- `apps/web/e2e/cd-025-plan-review-publish.spec.ts` (new, 11 read-only) · `cd-021-bulk-targeting.spec.ts` (updated)
- `outputs/claude-design-approval-pack/cd-025-r2/` (imported manifest, state matrix, wiring audit, README)
- `product-contract/evidence/screens/cd-025-plan-review-v1/` (primary, AR-RTL, narrow-412)

## Verification
- `tsc --noEmit` PASS · `next build` PASS.
- Playwright vs live Supabase: **30/30 PASS** (CD-025 11 + CD-021 19). Read-only — publish never clicked.
- DEC-012 wiring audit: all 14 legs of the publish action CLOSED — `outputs/claude-design-approval-pack/cd-025-r2/CD-025_WIRING_AUDIT.md`.
- A bug found + fixed during evidence: stale out-of-order `validateBulkPlan` responses could paint a **false "ready"**; added a sequence guard so only the latest preview applies.

## Still HANDOFF_BLOCKED (deferred, not invented)
Planning maker-checker/approver; provider delivery/receipt; durable receipt; freshness threshold; lost-review recovery / durable return-to-edit context restore.

## Arabic localization
Seed migration `supabase/migrations/20260714093000_cd025_ar_strings.sql` — 126 `plan.review.*`
keys, Arabic from the design's own D.ar dictionary, `status='draft'` (human review pending),
guarded upsert (never clobbers a `reviewed` row). **Not yet applied to the live DB** — no write
creds in this session; applies on the next credentialed `supabase db push`. RTL layout already
verified; until push, AR copy falls back to English (by design, migration 0013).

## Next
1. Apply the AR seed migration (`supabase db push`) → AR copy renders.
2. Sponsor review of the branch → decision to merge to `main` (requires explicit human approval per CLAUDE.md).
