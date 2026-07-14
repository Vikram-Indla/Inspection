# ACCEPTANCE_CHECKLIST_CD-024 (ratchet V4, DSG-019 / DSG-A11Y-001 / DSG-CODE-001) - R2
Design file: "CD-024 Visit Configuration and Assignment.dc.html" (dedicated; frames 4route, 4log, 4a-4i).
Status: READY_FOR_DESIGN_REVIEW_R2. Each item carries a reviewer-verifiable evidence reference (frame id / file / node); nothing is self-marked complete - the reviewer checks the box, not the author.

## Ratchet gates
- [ ] ROUTE_AND_OWNERSHIP_DECISION states all four facts (canvas #4route); no editing controls on /planning/plans/:id; route manifest HANDOFF_BLOCKED
- [ ] Every displayed fact maps to a verified read OR renders as Unavailable / Not evaluated / HANDOFF_BLOCKED (4a evidence cells + ledger; truth-matrix panel)
- [ ] No score, rank, badge, freshness label or provider result without a verified source
- [ ] Three hypotheses differ at the decision zone at equal fidelity (4a vs 4b vs 4c); selection argued against named criteria (rationale panel)
- [ ] Counterfactual frame shows measurable loss without the ledger (4d right)
- [ ] One new signature pattern only (Assignment Evidence Ledger)

## Decision zone
- [ ] Candidate table shows pool membership + overlap evidence (exact visit/time when present) + explicit not-evaluated note per row
- [ ] Auto method's unchecked-overlap gap visible on every auto row and in readiness; never called conflict-free (4a row 3; readiness "? auto schedule unchecked"); no in-transaction re-check claim anywhere (R1-1)
- [ ] Manual conflict blocks with exact visit/window and resolution actions (alternative pick / auto / open visit)
- [ ] Ledger classes: Verified now (cites query) / Not evaluated (named absences) / Blocks assignment / Checked again before publish
- [ ] Selection-time overlap evidence uses the identical pre-RPC query as submit (parity test; WIRING row 2)

## Scope, readiness, submit
- [ ] Duplicate handling is an explicit scope decision: named factories, recalculated totals, restorable, recorded in readiness
- [ ] Readiness separates blockers / warnings / unknowns / prospective effects; publish button names its blocking reason
- [ ] Future effects labelled prospective; notifications 'queued', never delivered; atomic one-outcome semantics stated
- [ ] Submit failure: linked error summary, focus transfer to first blocker, ALL input and picks preserved
- [ ] Per-source failures designed separately and fail closed - factory / package / inspector / duplicate-conflict check (4e mini-frames), each distinct from NO INSPECTORS, LEGITIMATE ZERO and EMPTY SELECTION
- [ ] Empty selection / direct-URL state distinct from unauthorized and from source failure (4e EMPTY SELECTION card)
- [ ] Restored-factory after-state recalculates totals and reopens the scope decision (4e RESTORED card)
- [ ] Read-only published-plan destination frame carries no editing controls (4e READ-ONLY PUBLISHED PLAN card)
- [ ] Stale/concurrent revalidation failure returns named blockers with input preserved

## A11y/RTL/responsive
- [ ] Arabic fresh-session default; same hard state as EN (4f); bdi-isolated IDs/windows
- [ ] Keyboard: plain semantic table, native controls in tab sequence; ledger on row focusin / Review-evidence activation; NO roving/grid claim (spec panel + 4i)
- [ ] Status vs alert semantics per spec; conflicts never color-only; reduced motion preserves context
- [ ] Narrow 390-430: operable screen with real controls in mandated order (4h); no horizontal overflow; >=48px targets

- [ ] Focused error summary -> linked target -> restoration evidence (4i)
- [ ] Unauthorized/not-in-scope distinct from empty selection + page.tsx guard (4e; COMPONENT_MAP row)
- [ ] Light theme full-parity frame + PNG (4g; CD-024_SCR-WEB-140_light.png)

## Codex audit legs (DEC-012)
- [ ] Overlap-parity claim verified against actions.ts
- [ ] Auto-gap claim verified against migration 0026
- [ ] HANDOFF_BLOCKED register complete: route; concurrency-safe overlap enforcement; fail-closed reads; auto overlap; submit recheck; virtual mode; attempted-conflict audit; delivery
