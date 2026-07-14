# Claude Design Prompt V4 — CD-024 / SCR-WEB-140

## Task boundary

Design review and high-fidelity design only. Do not edit application code, migrations, policies, tests or runtime data. Do not claim implementation readiness where a backend or route leg is missing.

Design Saqeel's P02 Visit Configuration and Assignment workspace for a Planner. The user must configure an executable visit, understand exactly which assignment facts are verified, resolve genuine blockers and reach a truthful Ready to Publish state without weakening the accepted planning flow.

## Read first

Read, in order:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `design/claude-design-mvp1/00_START_HERE.md`
7. `design/claude-design-mvp1/CURRENT_UI_BASELINE.md`
8. `design/claude-design-mvp1/prompts/00_MASTER_DESIGN_CONSTITUTION.md`
9. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`
10. `design/claude-design-mvp1/prompts/journeys/P02_VISIT_DESIGN_AND_ASSIGNMENT.md`
11. `design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv`
12. `product-contract/screens/screen_route_catalogue.csv`
13. `product-contract/business/master_end_to_end_process.md` — P02
14. `product-contract/domain/field_dictionary.csv` — Visit, Plan and Assignment
15. `product-contract/governance/error_catalogue.csv` — `ERR-ASG-001`, `ERR-PUB-001`, `ERR-AUTH-001`
16. `apps/web/src/app/planning/bulk/review/page.tsx`
17. `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`
18. `apps/web/src/app/planning/bulk/actions.ts`
19. `supabase/migrations/0026_cd021_bulk_publish_atomic.sql`
20. `apps/web/src/app/planning/plans/[id]/page.tsx`

Record branch, commit and dirty-worktree state. Preserve all unrelated work.

## Route and ownership truth — mandatory first output

Begin with `ROUTE_AND_OWNERSHIP_DECISION` and state all four facts:

- The product contract targets logical screen `SCR-WEB-140` at `/planning/:id/configure`.
- The design reconciliation previously pointed it to `/planning/plans/:id`.
- The current `/planning/plans/:id` implementation is a read-only/post-publish plan drill-down and must remain non-editing.
- The current `/planning/bulk/review` implementation owns a real pre-publish P02 configuration/assignment step but is labelled `SCR-WEB-120`, which collides with the catalogue identity for Single Visit Planning.

Recommended design position: explore one route-neutral P02 draft configuration/assignment workspace that can inform a later governed route decision; preserve the read-only plan drill-down. Do not publish a code-ready route manifest until the route and screen-ID collision is resolved. Mark that manifest leg `HANDOFF_BLOCKED`.

## Runtime truth ledger

Use these facts, then verify them in code:

### Verified now

- Published/locked package choices expose code and version label.
- Factory identity, risk band/score and active-duplicate status are available for the bulk review selection.
- Inspector candidates currently come from users holding the `inspector` role.
- Manual assignment validates role-pool membership and queries overlapping active assignments at submit.
- Automatic assignment is deterministic round-robin, not AI and not an optimized recommendation.
- Plan, visits, assignments, draft-to-published updates and notification records are written in one `SECURITY INVOKER` transaction.
- RLS remains the authority and raw Supabase errors must not reach the UI.

### Unavailable, unproven or blocked

- Skill/certification match, work hours, capacity, territory, current location, proximity and travel time are not verified candidate signals.
- Automatic round-robin does not currently prove overlap avoidance; do not call it conflict-free.
- Selected package status/effective-date and visit-type validity are not proven as server-side submit guards against tampered/stale input.
- Execution mode is currently hard-coded `physical`; virtual eligibility and OTP/provider readiness are not implemented in this flow.
- Team/crew assignment, recommendation scoring, reasoned assignment override and override permission are not proven.
- An audit event for a blocked/attempted assignment is not proven.
- A notification row does not prove outbound delivery.
- There is no reliable stale-availability version token or concurrency contract for candidate changes.

Every unsupported signal must appear as `Unavailable`, `Not evaluated`, or `HANDOFF_BLOCKED`; never as a score, rank, badge or optimistic promise.

## P1 design and wiring risks to make visible

1. Auto round-robin may allocate an overlapping inspector because only manual choices receive the overlap query.
2. A stale or tampered package/visit type can cross the current UI boundary without a proven authoritative submit recheck.
3. “Skip conflicting factories at publish” can look like silent partial success. Convert it into an explicit pre-publish scope change with removed factories named and total scope recalculated.
4. Loading errors from factories/packages/inspectors can collapse into an empty state. Distinguish unavailable service from a legitimate zero-result state.
5. Conflict submission currently lacks defined focus transfer and a linked error summary; input and selections must be preserved.
6. The design must not show a physical/virtual choice until the runtime supports the chosen mode and its guards.

These findings do not authorize implementation. They determine truthful states and `HANDOFF_BLOCKED` entries.

## Primary design challenge

Turn assignment from a dropdown into an evidence-led planning decision without pretending Saqeel has an optimization engine it does not have.

Create three equal-fidelity decision-zone hypotheses:

1. **Constraint-first:** visit/package/window facts establish the rule set before candidates appear.
2. **Candidate-first:** a semantic candidate comparison foregrounds verified evidence, unknowns and blockers.
3. **Schedule-context:** candidate rows are paired with a compact, non-authoritative overlap timeline; the full decision remains operable as a table/list.

Compare them against time to a safe decision, hidden assumptions, conflict prevention, Arabic/RTL, keyboard burden, narrow-layout survival and implementation truth. Do not choose by visual novelty.

The single permitted signature interaction is an **Assignment Evidence Ledger**: for the currently selected candidate or automatic method, it separates `Verified now`, `Not evaluated`, `Blocks assignment`, and `Rechecked on submit`. It must not calculate a confidence score. Include a counterfactual without the ledger and explain what decision evidence becomes hidden.

## Required content and states

Show:

- Planning object and method context; selected factory/factories with stable IDs.
- Visit type, exact package version, visit window, notes and only supported execution mode.
- Automatic round-robin versus manual assignment with honest method consequences.
- Candidate comparison using only verified fields; overlap details with exact affected visit/time when available.
- Duplicate-target scope correction before publish.
- Readiness ledger separating blockers, warnings, unknowns and committed/prospective effects.
- Prospective audit/notification effects labelled as future effects until the transaction commits.

Individually design: populated/ready; no package; no inspectors; legitimate zero candidates; candidate service failure; manual overlap conflict; auto-method overlap gap; stale/concurrent revalidation failure; invalid/tampered package; submit in progress; neutral transaction failure with all input preserved; explicit scope reduction; unauthorized/read-only; successful commit and next destination.

## Arabic, responsive and accessibility proof

- Arabic is the fresh-session default with document-level RTL.
- Use realistic Arabic factory and inspector names, long labels, Hijri/Gregorian-neutral governed dates as currently implemented, and mixed-direction UUIDs/codes wrapped correctly.
- Provide desktop dark, desktop light, Arabic RTL and 390–430px narrow evidence for the same hard state.
- Narrow order: planning context → configuration → blockers/unknowns → candidate evidence → readiness → action.
- Candidate comparison must remain a semantic table/list; map or timeline is supplementary.
- Define keyboard entry, row/option navigation, selection, return to configuration, submit, error-summary focus and restoration.
- Use a linked error summary plus inline errors; announce loading/submit/success through status and blockers/failure through alert semantics.
- Conflict and selection must never rely on color alone. Reduced motion must preserve all context.

## Research adoption/rejection

Use primary sources and record adoption/rejection:

- Microsoft Field Service scheduling: separate requirement facts from resource facts and distinguish manual booking from constraint-aware scheduling. Reject any skill/location/travel feature Saqeel cannot source.
- W3C ARIA APG grid/listbox guidance: choose a keyboard model deliberately; prefer semantic HTML where an interactive grid would add focus complexity.
- GOV.UK validation/error-summary guidance: preserve entered values, link summary errors to fields and transfer focus after submit failure. Do not confuse permission/eligibility failures with field validation.

Add one Saudi government/public-service source relevant to Arabic service design or accessibility. Do not copy external product visuals.

## Required deliverables

Return:

1. `ROUTE_AND_OWNERSHIP_DECISION`
2. Current-screen critique with the three highest-cost failures
3. Research ledger with adopted and rejected treatments
4. Runtime truth and unsupported-data matrix
5. Three equal-fidelity decision-zone hypotheses and comparison
6. Selected high-fidelity full page and primary decision-zone close-up
7. Counterfactual without the Assignment Evidence Ledger
8. Full state contact sheet
9. Dark/light, Arabic RTL and narrow evidence
10. Keyboard, focus, status/alert and reduced-motion specification
11. Family inheritance ledger and one-pattern novelty declaration
12. P0/P1 Pass/Correct/Block self-audit without numerical self-scoring
13. `IMPLEMENTATION_MANIFEST_CD-024.yaml`, `COMPONENT_MAP_CD-024.csv`, `CLAUDE_CODE_HANDOFF_CD-024.md`, `ACCEPTANCE_CHECKLIST_CD-024.md` and `WIRING_MAP_CD-024.csv`

The manifest must mark route ownership, automatic overlap protection, authoritative package/visit-type revalidation, virtual-mode support, attempted-conflict audit, notification delivery and stale-concurrency handling `HANDOFF_BLOCKED` unless verified in the repository.

Use the frozen Saqeel shell and Planning tab exactly. Finish with `READY_FOR_DESIGN_REVIEW`. Never self-approve, implement, commit, push, merge or deploy.

