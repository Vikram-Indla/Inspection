# CD-025 Design Review R1 — P0/P1 Only

- Review date: 2026-07-14
- Submission: `/Users/vikramindla/Downloads/CD-025 Plan Review and Publish (standalone).html`
- Task: `TASK-DESIGN-CD025-REVIEW`
- Process/screen: `P03 / SCR-WEB-150`
- Requirements: `MVP1-M01-006..010; MVP1-M01-027..031; MVP1-M02-012; MVP1-FND-001..004; MVP1-FND-011; MVP1-FND-013`
- Acceptance: `DSG-020; DSG-A11Y-001; DSG-CODE-001`
- Runtime baseline reviewed: `main @ 9360fc9`; guarded bulk/single publisher migrations live; no-exclusion Playwright regression `99/99`
- Verdict: **ACCEPT THE DIRECTION WITH SPECIFIED P1 CORRECTIONS — no P0 found**
- Implementation: **NOT AUTHORIZED; route/lifecycle/handoff ownership remains HANDOFF_BLOCKED**

## What must be preserved

Preserve the blocker-first pre-flight, the route-neutral staged-workspace position, the score-free Publish Consequence Ledger, explicit named scope reduction, one-plan/one-visit/one-assignment review grammar, neutral failure treatment, queued-not-delivered notification truth, direct Planner publish, protected read-only `/planning/plans/:id`, Arabic-first RTL, both themes, and the 28-state coverage. These are strong and should not be redesigned.

## P1 findings

1. **The repository handoff is stale and unsafe to execute.** The downloaded standalone design correctly reflects the newer guarded atomic publishers, but `outputs/cd-025/IMPLEMENTATION_MANIFEST_CD-025.yaml`, `CLAUDE_CODE_HANDOFF_CD-025.md`, `WIRING_MAP_CD-025.csv`, `STATE_MATRIX_CD-025.csv`, `ACCEPTANCE_CHECKLIST_CD-025.md`, `RESEARCH_PROVENANCE_CD-025.md`, and the repository `.dc.html` still describe migration 0026, pre-RPC-only checks, round-robin bulk allocation and sequential single publication. Current runtime uses `20260714091726_plan_validated_state.sql` and `20260714091727_planning_publish_guards.sql`: both publishers are atomic; mutable guards are repeated in-transaction; auto assignment is server-derived first-available-in-window; STM-PLAN-001/002 are persisted; notifications and table-trigger audit effects share the transaction. The current handoff would direct Claude Code to reintroduce already-fixed defects.
2. **The frozen shared shell is claimed but not inherited exactly.** Full frames replace the role-scoped grouped navigation with three placeholder rows, replace real SVG icons with squares, omit the collapse control, relocate account identity to the sidebar, and omit the actual topbar account menu. The accepted shell places search, theme, notification and own-account controls in the topbar; language and sign-out are in the account menu. The narrow frame shows only a hamburger and does not prove the real drawer, focus containment, Escape close and focus return.
3. **The central consequence counts contradict each other.** The same pre-decision state says seven automatic visits in readiness and assignment evidence, but the ledger says three manual plus nine automatic and promises 12 assignments/notifications even though two duplicate-blocked factories have no assignment. Use one authoritative model: before resolution, 12 selected; two duplicate-blocked/unassigned; three manual (two verified, one blocked); seven automatic. After explicit removal, every effect becomes 10 visits, 10 assignments and 10 queued notifications, split three manual/seven automatic; after the assignment fix the plan may become ready.
4. **The design invents a time-based freshness rule.** S17 labels checks from “40 minutes ago” stale and mandates revalidation although no age threshold or expiry policy exists. An exact last-checked timestamp may be displayed as provenance, but age alone must not become policy. Use a proven change/event, an explicit user recheck, or an unavailable verification source to trigger the blocking state.
5. **The failure state invents support and overstates recovery.** S24 says “contact support” without an approved support route, and promises the staged review is “exactly as you left it” while staged ownership/recoverability is still HANDOFF_BLOCKED. Use neutral retry/return copy and make preservation claims only to the extent proven by the selected route/handoff model.
6. **The read-only destination breaks lifecycle continuity.** Completion says 10 visits were created and published together, then the direct destination shows `7 published · 1 completed · 2 draft` as if it were the same immediate result. The immediate post-publish destination must initially show all 10 in their persisted published state, or the alternative distribution must be explicitly labelled as a later historical example rather than the success continuation.
7. **The optional “Open the published plan” action is not wired in the handoff.** Bulk publication currently redirects to `/visits` and discards the returned plan ID. Either retain only the truthful `/visits` action, or add a specific implementation leg that captures the returned plan ID and opens the existing read-only `/planning/plans/:id` route. Do not present the action as already available.
8. **Accessibility prose is stronger than the artifact semantics.** The design claims a semantic table but uses custom `sc-raw-table/sc-raw-th/sc-raw-td` elements without table roles. The blocked publish button lacks the promised `aria-describedby` association, and the completion “heading” is rendered as generic strong text. Use native table elements with `scope`, associate disabled reasons programmatically, and provide a real focusable heading/summary target. The real shell controls must remain native interactive controls.
9. **Internal design-process copy leaks into the product surface.** `SIGNATURE — one per screen` is rendered inside the consequence rail. Remove it from product UI and keep novelty/ratchet commentary in external annotations only.

## State-by-state decision and repository mapping

| State | Verdict | Required correction / repository mapping |
|---|---|---|
| S1 Initial validation/loading | Pass | Preserve context and staged values. `apps/web/src/app/planning/bulk/review/ReviewClient.tsx`; `bulk/actions.ts`. |
| S2 Populated ready | Correct | Reconcile the live 3-manual/7-auto/10-retained counts before showing ready. `ReviewClient.tsx`; guarded bulk RPC. |
| S3 Multiple blockers | Correct | Linked summary is strong; counts and native focus targets must agree. `ReviewClient.tsx`. |
| S4 Mandatory configuration missing | Pass | Preserve entries and exact correction link. `ReviewClient.tsx`; `bulk/actions.ts`. |
| S5 No published package | Pass | Keep distinct from source failure. `bulk/actions.ts`; `package_versions`. |
| S6 Package invalidated | Pass | The guarded RPC rechecks package status. `20260714091727_planning_publish_guards.sql`. |
| S7 No inspectors in role pool | Pass | Keep distinct from inspector-source failure. `user_roles`; guarded RPC. |
| S8 Partial assignment coverage | Pass | Name each unresolved visit and return focus. `ReviewClient.tsx`. |
| S9 Duplicate active visit | Correct | Decision is strong; ledger/counts must not count blocked factories as assigned. `bulk/actions.ts`; guarded RPC factory locks. |
| S10 Scope reduction after-state | Correct | Show a complete 12→10 recomputation across visits, assignments, auto/manual split and notifications. `ReviewClient.tsx`. |
| S11 Manual overlap exact | Pass | Exact conflicting visit/window and in-transaction recheck are truthful. `bulk/actions.ts`; guarded RPC; assignment trigger 0031. |
| S12 Automatic assignment | Pass | Updated first-available-in-window truth is correct; suitability/capacity remain unclaimed. Guarded RPC. |
| S13 Factory source failure | Pass | Fail closed with neutral retry. `bulk/actions.ts`; review page. |
| S14 Package source failure | Pass | Distinct from legitimate no-package state. `bulk/actions.ts`. |
| S15 Inspector source failure | Pass | Distinct from legitimate empty role pool. `bulk/actions.ts`. |
| S16 Duplicate/overlap query failure | Pass | Never render as zero conflicts. `bulk/actions.ts`. |
| S17 Stale data/revalidation | Correct | Remove invented 40-minute policy; use exact provenance or a proven change trigger. `MVP1-FND-013`; no configured threshold. |
| S18 Concurrent change at submit | Pass | Guarded transaction truth and full rollback are correct. `20260714091727_planning_publish_guards.sql`; migration 0031. |
| S19 Approval required | Pass | Correctly annotation-only and HANDOFF_BLOCKED. `rbac_matrix.csv`; no planning maker-checker runtime. |
| S20 Direct Planner publish | Pass | Role is rechecked by the SECURITY INVOKER publisher; audit mutations remain attributable. `user_roles`; guarded RPC; audit triggers. |
| S21 Unauthorized/not in scope | Pass | Preserve the distinct direct-route state; RLS remains authoritative. `review/page.tsx`; `Shell.tsx`; RLS. |
| S22 Lost/expired staged review | Block | Recoverability depends on unresolved CD-024→025 route/lifecycle ownership. Do not invent persistence. `CURRENT_SLICE.yaml`; route reconciliation; session storage. |
| S23 Publish in progress | Pass | Disabled double-submit and status copy are strong. `ReviewClient.tsx`; server action. |
| S24 Bulk transaction failure | Correct | Remove invented support; qualify preservation until handoff model is governed. `bulk/actions.ts`; guarded RPC. |
| S25 Single publish failure | Pass | Revised atomic single-publisher truth is correct; keep conservative neutral copy. `single/actions.ts`; guarded single RPC. |
| S26 Bulk publication complete | Correct | `/visits` is truthful. Map plan-ID capture before retaining the optional read-only-plan action. `bulk/actions.ts`; `/visits`; `/planning/plans/[id]`. |
| S27 Read-only destination | Correct | Preserve read-only responsibility; fix immediate result counts or label the distribution as later history. `planning/plans/[id]/page.tsx`. |
| S28 Return-to-edit focus landing | Block | Interaction design is sound, but route/context restoration remains HANDOFF_BLOCKED. `ReviewClient.tsx`; upstream CD-024 route decision. |
| Dark theme | Correct | Strong visual treatment; apply the exact shell and semantic fixes. `tokens.css`; `astryx.css`; `ShellClient.tsx`. |
| Light theme | Correct | Same issue as dark; retain full-state equivalence after shell/count correction. |
| Arabic RTL | Correct | Physical RTL and bidi isolation are strong; apply the exact shell and count correction in both themes. |
| Tablet/narrow | Correct | Content order is good; add exact collapsed shell and an open mobile-drawer/focus-return proof. |
| Keyboard/focus/status | Correct | Replace custom table elements, wire `aria-describedby`, and make completion focus land on a real heading. |

## Protected behaviors and regression risks

- Preserve RLS/RBAC, SECURITY INVOKER behavior, factory-level concurrency locks, assignment overlap serialization, canonical Draft→Validated→Published transitions, full transaction rollback, append-only audit triggers, queued-not-delivered notification truth, neutral errors and no optimistic Published state.
- Do not restore stale migration-0026-only behavior, caller-trusted pools, round-robin allocation, sequential single writes or pre-RPC-only validation.
- Do not invent maker-checker, support contact, freshness threshold, SLA, capacity/skills/territory scoring, delivery/acceptance, receipt persistence or a final route.
- Keep `/planning/plans/:id` read-only. Immediate planning remains outside CD-025.
- Do not let failed reads become legitimate empty/zero states.
- Do not execute the current `CLAUDE_CODE_HANDOFF_CD-025.md`; it is materially stale.

## Sponsor recommendation

**Accept the design direction with the specified P1 corrections.** Run one progressive R2 correction in Claude Design, then review only the corrected full frames, hard-state deltas and regenerated handoff assets. Do not send the current Claude Code prompt for implementation. Route/lifecycle/handoff ownership still requires governance even after visual approval.

## P2 register for the final Big Bang critique

- Test whether the persistent 430px consequence rail outperforms a contextual rail at 1024–1280px.
- Reduce repeated 11–13px operational prose after comprehension testing, without removing consequence truth.
- Test whether `STAGED — NOT SAVED` reassures planners or creates unnecessary loss anxiety.
- Consider moving “first available in the window” to secondary disclosure while keeping “assigned at publish” primary.
- Validate long Arabic factory names and account identities with real localization data, not only the supplied samples.
