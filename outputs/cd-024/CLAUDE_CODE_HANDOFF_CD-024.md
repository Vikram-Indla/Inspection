# CLAUDE_CODE_HANDOFF_CD-024 (R2)

Identity: CD-024 / SCR-WEB-140 / P02 - never CD-021. CD-021 is only the upstream targeting/runtime dependency (supplies /planning/bulk/review, loadBulkSelection, publishBulkPlan, migration 0026).

Design-only package for the route-neutral P02 Visit Configuration & Assignment workspace (logical SCR-WEB-140). Do NOT implement until: (1) recorded sponsor design approval, (2) recorded independent Codex wiring audit per DEC-012, (3) governance resolution of the route/screen-ID collision. Route work is additionally blocked by (3) regardless of (1)/(2).

## Read first
- "CD-024 Visit Configuration and Assignment.dc.html" (dedicated design file; 4route + 4log + frames 4a-4i) + 6 PNGs in outputs/cd-024/
- IMPLEMENTATION_MANIFEST_CD-024.yaml · WIRING_MAP_CD-024.csv · ACCEPTANCE_CHECKLIST_CD-024.md

## ROUTE_AND_OWNERSHIP_DECISION (restated)
Fact 1: the contract targets SCR-WEB-140 at /planning/:id/configure. Fact 2: that route is not implemented. Fact 3: /planning/plans/:id is the read-only post-publish drill-down and must remain non-editing. Fact 4: the implemented pre-publish P02 subset lives at /planning/bulk/review but is labelled SCR-WEB-120, colliding with the governed Single Visit Planning identity. Position: route-neutral workspace matching the existing loadBulkSelection/publishBulkPlan contract; route manifest HANDOFF_BLOCKED.

## Design thesis (selected: candidate-first evidence comparison)
Assignment becomes an evidence-led decision without pretending an optimization engine exists. The Assignment Evidence Ledger separates Verified now / Not evaluated / Blocks assignment / Checked again before publish for the focused candidate or method - no confidence score, ever. Verified facts cite their query; absences are named absences.

## CD-024_R1_CORRECTION_LOG (review 2026-07-14, BLOCK/P1 -> corrected)
1 Transaction-truth overstatement removed: validation is pre-RPC and stale-able; the RPC re-validates nothing. 2 Fail-closed structured reads required (new HANDOFF_BLOCKED; current reads ignore errors). 3 Equal-fidelity alternatives (4b/4c), visual hard states (4e), operable narrow (4h). 4 Light/Arabic full parity + light PNG. 5 Shell restored in 4a/4f; CONTENT_CROP labels on 4d/4g/4i. 6 Dev artefacts moved out of user copy; "10 without active duplicates". 7 Plain-table keyboard model; 4i focused-error evidence. 8 page.tsx route guard + distinct unauthorized state. 9 Exact mandated citations (schedule-board, scheduling-resource-types, APG grid, APG listbox, GOV.UK error-summary, DGA web-accessibility page); Arabic-first = Saqeel baseline (DEC-011). 10 Checklist now evidence-referenced.

## Hard truths this design encodes (verified in code 2026-07-14)
1. Atomic publish EXISTS (migration 0026, SECURITY INVOKER RPC) - the UI states one-outcome semantics; no step ledger needed here.
2. Auto round-robin does NOT check overlaps (publish_bulk_plan allocates by cursor); only manual picks get the overlap query, and that query runs in publishBulkPlan BEFORE the RPC - it can go stale before the assignment insert and the RPC re-validates nothing. Never claim in-transaction re-checking. Gap shown on every auto row and in readiness unknowns.
3. Selection-time evidence requires extending loadBulkSelection with the SAME overlap query publish uses (parity is a test).
4. No server-side recheck of tampered/stale package/visit-type at submit - HANDOFF_BLOCKED; UI constrains but never claims the guard.
5. Execution mode is hard-coded physical - no mode choice is rendered.
6. 'Skip conflicting factories' becomes an explicit scope decision: named removals, recalculated totals, restorable, recorded in readiness. Same action semantics, no silent partial success.
7. Notification rows are queued-only; audit/notification effects are labelled prospective until the transaction commits.
8. No stale-availability token exists; the pre-RPC recheck is the only concurrency behavior and it has a window. Failures return as a linked error summary (4i) with input preserved.
9. Every source read must return structured success-or-failure and fail closed - a failed duplicate/overlap read must never render as no conflict (current code ignores errors - HANDOFF_BLOCKED leg).

## Locked baselines
Frozen shell; RLS/RBAC; canonical transitions; append-only audit; atomic RPC contract; sessionStorage selection hand-off; empty-selection return; neutral catalogued copy; ax tokens only; read-only drill-down untouched; no Dashboard controls in Planning.

## A11y/RTL contract
Arabic fresh-session default, document RTL, same hard state proven (4f); plain semantic table - native controls in the normal tab order, ledger updates on row focusin or explicit "Review evidence" (no roving/grid claim); ledger classes as SR-navigable headings; linked error summary + focus transfer (GOV.UK pattern); polite status for loading/scope/submit progress, assertive alerts for conflicts/failures; >=48px targets, 16px inputs; glyph+text conflicts; narrow order context->configuration->blockers->evidence->readiness->action; reduced motion preserves context.

## Self-audit (Pass/Correct/Block - no scores)
Pass: runtime truth, family continuity, hard cases, Arabic-first, accessible operation, no editing on read-only routes. Corrected: mode toggle removed; timeline 'availability' language removed then hypothesis rejected. Block (HANDOFF_BLOCKED): route ownership; auto overlap protection; authoritative submit recheck; attempted-conflict audit; delivery truth; concurrency token.

READY_FOR_DESIGN_REVIEW_R2
