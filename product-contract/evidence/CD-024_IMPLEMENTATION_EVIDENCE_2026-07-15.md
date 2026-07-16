# CD-024 — implementation evidence (implemented-pending-audit)

- **Date:** 2026-07-15 · **Commit:** `16a55d4` on `feat/admin-control-plane`
- **Screen:** SCR-WEB-140 Visit Configuration & Assignment (P02), route-neutral per DEC-024.
- **Authorization:** CD-024 R2 sponsor approval + impl auth (`governance/CD-024_R2_APPROVAL_AND_IMPL_AUTH.md`).
- **Status:** IMPLEMENTED_PENDING_DEC012_AUDIT — NOT sponsor-runtime-accepted / closed.

## Files (manifest file_changes)
- UPDATE `apps/web/src/app/planning/bulk/actions.ts`
- UPDATE `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
- UPDATE `apps/web/src/app/planning/bulk/review/page.tsx`
- CREATE `apps/web/src/app/planning/bulk/review/EvidenceLedger.tsx`

## Verification
- `npx tsc --noEmit` → No errors. `npx next build` → 0 errors (2 pre-existing warnings).
- Color-law scan (4 files) → clean (ax/ds tokens only).
- No new live route (`configure`/`:id/review` absent); `/planning/plans/:id` untouched (read-only preserved).
- Frozen files untouched; atomic `publish_bulk_plan` RPC + RLS/RBAC unchanged.

## Proven net-new legs
- `readOverlappingAssignments()` — ONE helper, called by BOTH `loadBulkSelection`
  (selection-time evidence) and `publishBulkPlan` (pre-RPC check). **Overlap-query
  parity is a test point** (verified: single definition, two call sites).
- `loadBulkSelection(ids, window?)` returns structured per-source fail-closed
  `sources`; a failed duplicate/overlap read blocks readiness — never renders as
  "no conflict"/0 (fixes the prior error-ignoring defect, R1-2).
- `EvidenceLedger.tsx` — four-class ledger (Verified now / Not evaluated / Blocks
  assignment / Checked again before publish). No score/rank/confidence anywhere.
- Per-row evidence cells (pool membership, overlap count + exact visit/window,
  explicit not-evaluated); row focus / "Review evidence" drive the ledger.

## HANDOFF_BLOCKED (rendered as annotated gaps, never controls)
auto overlap protection (`publish_bulk_plan` round-robin), authoritative submit
revalidation, attempted-conflict audit, notification delivery truth, stale
concurrency token, virtual mode, dedicated route ownership. No in-transaction
recheck is claimed; execution mode is fixed physical.

## Divergence to reconcile in the DEC-012 audit
`IMPLEMENTATION_MANIFEST_CD-024.file_changes.before` was authored against the
**CD-021** baseline, but the live `/planning/bulk/review` code is the evolved
**CD-025 (SCR-WEB-150, P03) Plan Review & Publish** workspace. Manifest items
already satisfied by CD-025 (machine-readable blockers, scope-decision panel,
fixed physical mode, Planner route guard + distinct unauthorized state) were left
intact; CD-024's genuinely-new deliverables were layered additively per
"never weaken accepted behavior." The independent Codex audit should confirm the
additive reconciliation against `WIRING_MAP_CD-024.csv`.

## Parked
- Arabic `ui_strings` rows for the new `plan.review.ev.*` / `plan.review.ec.*` keys
  (EN fallback safe until seeded) — same Supabase-token block as the admin AR
  migrations.
- DEC-012 independent Codex wiring audit against `WIRING_MAP_CD-024.csv`.
