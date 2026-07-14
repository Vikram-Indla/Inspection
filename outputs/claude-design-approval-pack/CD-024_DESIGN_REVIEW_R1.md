# CD-024 Design Review R1 — P0/P1 Only

- Review date: 2026-07-14
- Submission: `/Users/vikramindla/Downloads/MVP1 UXUI refinement program.zip`
- Task: `TASK-DESIGN-CD024-QUALITY-RATCHET`
- Process/screen: `P02 / SCR-WEB-140`
- Requirements: `MVP1-M01-006; MVP1-M01-007; MVP1-M01-028; MVP1-M01-029; MVP1-M02-012; MVP1-FND-001; MVP1-FND-003; MVP1-FND-011; MVP1-FND-013`
- Acceptance: `DSG-019; DSG-A11Y-001; DSG-CODE-001`
- Verdict: **BLOCK — progressive P1 correction required; no P0 found**
- Implementation: **HANDOFF_BLOCKED**

## What is worth preserving

Preserve the candidate-first direction, the score-free Assignment Evidence Ledger, explicit scope reduction, truthful auto-round-robin warning, fixed physical-only mode, read-only `/planning/plans/:id`, and the seven recorded `HANDOFF_BLOCKED` backend legs. These are sound foundations and do not require a restart.

## P1 findings

1. **Transaction truth is overstated.** The design says manual overlap is rechecked inside the atomic publish transaction. Current code checks overlaps in `publishBulkPlan` before calling `publish_bulk_plan`; the RPC does not recheck manual or automatic overlap. A concurrent assignment can land between the check and insert. Replace the claim with truthful pre-RPC validation and keep concurrency-safe overlap enforcement `HANDOFF_BLOCKED`.
2. **Read/query failures can masquerade as safe emptiness.** `loadBulkSelection` and the duplicate/inspector/overlap reads ignore Supabase errors. A failed duplicate or overlap query can be interpreted as no conflict. The handoff must require structured per-source results and fail-closed neutral blockers with preserved input; no raw provider error.
3. **The visual proof does not meet the V4 ratchet.** The alternative hypotheses are sketches, not equal-fidelity decision zones. The hard-state sheet is prose, not designed states. The narrow frame is an outline of intended sections, not an operable 390–430px screen.
4. **Theme and Arabic evidence are reduced fidelity.** Light and Arabic frames omit substantial configuration, readiness and shell content. No light PNG was exported. They do not prove the same full hard state.
5. **The frozen shared shell is not inherited exactly.** Full-page frames use a simplified sidebar/topbar and omit the accepted grouped navigation, navigation search, account treatment and responsive shell behavior. Use the actual shell or explicitly crop to content-only.
6. **Internal traceability is rendered as user copy.** `SCR-WEB-140`, `HANDOFF_BLOCKED`, requirement IDs, `P03`, migration numbers and `SECURITY INVOKER` appear inside the planner-facing frame. Move them to external annotations. User copy must describe operational consequence only. Replace “10 publishable” while the plan is blocked with a truthful count such as “10 without active duplicates.”
7. **The keyboard model contradicts the chosen semantics.** A plain semantic table places native controls in the tab sequence. A one-tab-stop, roving-row, Enter/Escape interaction is composite-grid behavior and requires managed focus. Prefer a plain table with native tabbable controls and update the ledger on row focus/selection; otherwise specify and test a real ARIA grid.
8. **Unauthorized handling is not wired.** Shell visibility plus RLS is not an explicit direct-route Planner guard, and the current component can collapse missing data into “No factories selected.” Add `page.tsx` to the handoff, design a distinct unauthorized/not-in-scope state, and keep RLS authoritative.
9. **Research provenance is not review-grade.** The Microsoft `schedule-work-order` link is not a stable supporting page, and the DGA homepage does not support the claimed Arabic-first principle. Replace them with exact official pages. Product Arabic-first behavior comes from the Saqeel baseline, not from an inferred DGA policy.
10. **The acceptance checklist is unevidenced.** Every checkbox is blank while the self-audit declares Pass. Replace self-claims with reviewer-verifiable frame/node references and keep status `READY_FOR_DESIGN_REVIEW`, never approved.

## State matrix and repository mapping

| State | Verdict | Required correction / repository mapping |
|---|---|---|
| Route and ownership | Block | Correctly recorded but unresolved. `authority/CODE_ROUTE_RECONCILIATION.csv`; `/planning/bulk/review`; `/planning/plans/[id]` remains read-only. |
| Populated / ready | Correct | Only a blocked populated state exists. Add a true ready state without calling blocked factories publishable. `ReviewClient.tsx`. |
| No published package | Correct | Prose only. Render a real state and link to the governed package destination only if authorized. `actions.ts`; `ReviewClient.tsx`. |
| No inspectors | Correct | Separate visually from query failure. `loadBulkSelection`; `user_roles`. |
| Legitimate zero candidates | Correct | Must be a distinct designed state with cause. `loadBulkSelection`. |
| Candidate/factory/package service failure | Block | Current reads ignore errors. Return structured source failures and block safely. `actions.ts:20-36`; `ReviewClient.tsx:33-50`. |
| Manual overlap | Correct | Visual exists; remove the false inside-transaction claim. `actions.ts:87-111`; migration 0026. |
| Automatic overlap gap | Pass | Honest warning is present; implementation remains blocked because RPC round-robin ignores schedules. Migration 0026. |
| Stale/concurrent revalidation | Block | No version token or atomic overlap guard. Design as preserved-input failure; do not call it transaction-safe. `actions.ts`; migration 0026. |
| Invalid/tampered package or visit type | Block | Correctly named as unproven; keep implementation blocked until authoritative guard exists. `actions.ts`; migration 0026. |
| Submit in progress | Correct | Prose only; render disabled controls, retained context and status announcement. `ReviewClient.tsx`. |
| Neutral transaction failure | Correct | Render the actual failure-with-input-preserved frame and linked summary. `ReviewClient.tsx:122`; `actions.ts:131-135`. |
| Explicit scope reduction | Correct | Decision is shown, but render the post-removal/restorable state and recalculated effects. `ReviewClient.tsx:105-110`. |
| Unauthorized / not in scope | Block | Add direct-route Planner guard and distinct frame; RLS remains authoritative. `review/page.tsx`; shell navigation; RLS. |
| Read-only published plan | Pass | Preserve `/planning/plans/[id]`; no editing controls. |
| Success | Correct | Prose only. Render committed success/redirect outcome without claiming notification delivery. `publishBulkPlan`; `/visits`. |
| Dark | Correct | Primary exists but shell and internal-copy defects remain. |
| Light | Correct | Reduced-fidelity HTML only; export the same full hard state as a PNG. |
| Arabic RTL | Correct | RTL is structurally sound, but the frame is reduced and omits shell/configuration parity. |
| Narrow/mobile | Correct | Replace the section-outline sketch with a full operable 390–430px frame. |
| Keyboard/focus | Correct | Choose table or grid semantics consistently; show focus/error-summary evidence. |
| Screen-reader status/alert | Correct | Specification exists only as prose; map each announcement to the actual state and trigger. |

## Protected behaviors and regression risks

- Preserve RLS/RBAC, atomic all-or-nothing writes, append-only audit triggers, neutral errors, current sessionStorage selection handoff, input preservation, physical-only execution mode, queued-not-delivered notification truth, and read-only published-plan drill-down.
- Do not claim automatic overlap safety, availability, capacity, skills, territory, location, proximity, travel time, virtual readiness, attempted-conflict audit, provider delivery or stale-version protection.
- Query failures must fail closed; they must never become zero duplicates, zero conflicts or a safe readiness state.
- Do not implement or mount the route until the `SCR-WEB-120/140` ownership conflict is governed.

## Sponsor recommendation

**Block the current CD-024 package.** Preserve its core concept and run the progressive correction prompt. Re-review only the corrected frames and handoff deltas. Do not authorize Claude Code implementation.

## P2 register for the final Big Bang critique

- Reduce persistent 11–13px technical density and confirm the accepted type scale at runtime.
- Reconsider whether factory risk belongs in the assignment decision zone; it may bias inspector choice without adding verified assignment evidence.
- Test whether the always-open 430px ledger improves scan time for 12+ factories or should become a contextual side panel at intermediate widths.
