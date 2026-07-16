# CD-024 — sponsor R2 design approval + implementation authorization

- **Date:** 2026-07-15
- **Approver / sponsor:** Vikram Indla (v.babuindla.c@mim.gov.sa)

## Approval
The sponsor granted, in-session, **design approval of CD-024 R2** (SCR-WEB-140 Visit
Configuration & Assignment, `READY_FOR_DESIGN_REVIEW_R2`) and **explicit implementation
authorization** to build it per `outputs/cd-024/IMPLEMENTATION_MANIFEST_CD-024.yaml`.
Precedent: DEC-014 (sponsor in-session design-gate override).

## Route resolution (binding)
DEC-024 (revised): the route-neutral workspace is the **existing `/planning/bulk/review`**
surface. `/planning/:id/configure` stays contract-only (no live URL); `/planning/plans/:id`
stays read-only post-publish. No new route is created.

## Scope (manifest file_changes — ONLY these)
- UPDATE `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
- UPDATE `apps/web/src/app/planning/bulk/actions.ts`
- UPDATE `apps/web/src/app/planning/bulk/review/page.tsx`
- CREATE `apps/web/src/app/planning/bulk/review/EvidenceLedger.tsx`

## DEC-012 handling
The independent Codex wiring audit is **deferred to after implementation**. CD-024 will be
recorded **implemented-pending-audit** — NOT sponsor-runtime-accepted / closed — until an
independent DEC-012 audit against `WIRING_MAP_CD-024.csv` is recorded.

## Non-negotiable truths carried from the design (HANDOFF "Hard truths")
- Atomic publish exists (migration 0026); UI states one-outcome semantics; no step ledger.
- Auto round-robin does NOT check overlaps; only manual picks get the pre-RPC overlap query,
  which can go stale — **never claim in-transaction re-checking**.
- Selection-time evidence must use the SAME overlap query publish uses (parity is a test).
- Fail-closed structured reads: a failed duplicate/overlap read must NEVER render as
  "no conflict" / zero.
- Execution mode is hard-coded physical — no mode choice rendered.
- Assignment Evidence Ledger has four classes (Verified now / Not evaluated / Blocks
  assignment / Checked again before publish) — **no confidence score, ever**.
- HANDOFF_BLOCKED legs stay disabled/annotated: route ownership (now resolved to bulk/review),
  auto overlap protection, authoritative submit recheck, attempted-conflict audit, delivery
  truth, concurrency token, virtual mode.
