# Claude Design Prompt — CD-028 / SCR-WEB-300 Level 2 Review Queue

Paste this entire document into a **new Claude Design project or fresh account**. This is a design-only task, not a Claude Code implementation prompt.

## Boundary

- Product: Saqeel MVP1 (`صقيل | صناعي`)
- Design/task: `CD-028` / `TASK-DESIGN-CD028`
- Screen/route: `SCR-WEB-300` Level 2 Review Queue / `/reviews`
- Process/persona: `P10` / Level 2 Reviewer
- Engines: `ENG-03`, `ENG-07`, `ENG-09`, `ENG-11`, `ENG-12`
- Requirements: `MVP1-M06-001..039,049,051,052`, plus relevant foundation, RBAC, audit, notification and accessibility contracts
- Acceptance: `DSG-023`, `DSG-A11Y-001`

`implementation_authorized: false`

Every Claude Code-facing deliverable must begin:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, migrations, database data, tests, product-contract files or Git history. Do not implement, commit, push, merge, deploy, modify `main`, switch branches, reset, clean, stash, discard, or overwrite the dirty worktree.

## Mandatory discovery order

Read and record actual branch, commit and dirty-worktree state:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`, `CURRENT_STATE.md`, `GATE_STATUS.md`, `execution/CURRENT_SLICE.yaml`, `execution/TASK_ROUTER.yaml`, `governance/OPEN_DECISIONS.yaml`
3. `design/claude-design-mvp1/00_START_HERE.md`, `MANIFEST.yaml`, `CURRENT_UI_BASELINE.md`
4. `design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`, `CODE_ROUTE_RECONCILIATION.csv`, `UX_BLIND_SPOT_REGISTER.csv`
5. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md` and the CD-028 row in `Saqeel_43_Screen_Claude_Design_Matrix.csv`
6. `product-contract/screens/screen_route_catalogue.csv`, `domain/atomic_scope.csv`, `domain/state_transitions.csv`, `domain/rbac_matrix.csv`, `governance/error_catalogue.csv`, `evidence/AC_LEDGER.csv`
7. filtered `FABLE_UNDERSTANDING_TRACEABILITY.csv`, `FABLE_ACCEPTANCE_UNDERSTANDING.csv`, and design acceptance/state matrices
8. `apps/web/src/components/Shell.tsx`, `ShellClient.tsx`, `lib/shell-navigation.ts`, `app/astryx.css`, `app/tokens.css`
9. `apps/web/src/app/reviews/page.tsx`, `DecisionPanel.tsx`, `actions.ts`, `apps/web/src/app/reviews/[id]/page.tsx`, `[id]/DecisionPanel.tsx`, `[id]/actions.ts`
10. review/inspection/audit/notification migrations and `apps/web/src/lib/notify.ts`.

If an exact route, action, table, RLS policy, audit event, provider, field or state transition cannot be verified, use `HANDOFF_BLOCKED` with the missing evidence. Never infer it from a screenshot.

## Binding runtime dossier

Reconcile these facts with inspected source; report any difference instead of guessing.

- `/reviews` presently queries RLS-scoped `reviews`, joined submission version, inspection, visit/factory, assignment and violation data. It derives SLA from `engine_settings` (`sla.review_business_days` and configured working days), factory risk band, L1 critical-violation count and visit priority.
- Search, status/risk and overdue-only filtering occur client-side over the loaded RLS page. SLA is unavailable when required config/timestamp is missing; never invent an SLA value, freshness threshold or risk formula.
- Current `/reviews` renders decision panels for every undecided review as well as the queue. CD-028 must make the queue a distinct mode: opening the queue must not silently start/claim/under-review a record or render decision controls for all rows. Full decision workspace is owned by CD-029 `/reviews/:id`.
- Current decision actions exist in both `reviews/actions.ts` and `reviews/[id]/actions.ts` and differ in validation/flow. Review row update, inspection transition and notification write are separate, non-transactional side effects. Do not claim atomic decision completion, delivery, or safe rollback.
- Immutable submission versions and append-only audit are protected behavior. A reviewer never edits inspector content.
- No dedicated claim/reassign action/ownership path is proven. Show any such control only as `HANDOFF_BLOCKED`, never as a working queue affordance.
- RLS is authorization; shell visibility is not an authorization substitute. Route/read behavior must be verified, including direct navigation and empty/out-of-scope results.

## Design problem and required hypotheses

User job: prioritize the right immutable submission by evidence readiness, configured SLA state, risk, critical violations and workload context—then open the correct workspace without mutating queue ownership.

Current critique must cover:

1. queue and decision workspace are conflated;
2. SLA/risk/evidence information does not create a safe, explainable scanning hierarchy;
3. claim/reassign, queue ownership and stale/concurrent behavior lack verified action paths.

Create three genuinely different, equal-fidelity compositions using the same RLS-scoped data and hard states:

| Hypothesis | Architecture |
| --- | --- |
| A — Evidence-readiness fingerprint (selected only if proven) | authoritative queue table with a compact non-score fingerprint beside each immutable submission version; selected row opens workspace only. |
| B — Decision evidence rail | priority scan table plus a persistent evidence/version rail; no automatic claim or review-state write. |
| C — Workload context first | reviewer workload context adjacent to the queue, with exact submission rows authoritative; no capacity target or SLA policy invented. |

Compare decision time, evidence visibility, irreversible-error prevention, Arabic/RTL density, keyboard burden, narrow operation and runtime truth. Do not self-score. Show the selected direction and a counterfactual without the fingerprint explaining the concrete scan/error cost. One page-specific signature interaction maximum.

## Required design contract

Preserve the frozen shared shell exactly. Design page content only.

Required objects:

- queue identity/title and RLS/role scope;
- search, filters and clear-state behavior;
- immutable submission version, factory, inspector, visit type/mode, submitted time;
- configured SLA state with source/unknown treatment; risk band, L1 critical count and priority only when actually queried;
- **Evidence-readiness and SLA-risk fingerprint**: explainable labelled facts, not a severity-only score or color-only signal;
- selected row/open-workspace affordance; no silent claim/state mutation;
- truthfully unavailable claim/reassign/saved-view controls where runtime is absent;
- queue clear, filtered empty, no evidence, stale/concurrent, unassigned, overdue, missing SLA configuration, unauthorized/read-only and partial linked-data states;
- explicit immutable/audit/version provenance and queued-not-delivered notification language.

Never turn missing evidence into a zero, missing SLA into on-time, or a risk band into a recommendation. Never expose raw Supabase/provider errors.

## Accessibility, RTL, theme and responsive contract

- Arabic-first full-document RTL, realistic long Arabic factory/inspector labels, mixed-direction IDs and dates; English remains LTR.
- Dark and light semantic parity; non-color status uses label/icon/pattern.
- Provide 1440 desktop, 1024 constrained and 390–430px narrow layouts. At narrow width, preserve queue scanning with a semantic list/card alternative; no hover, map or drag dependency.
- WCAG AA, 48px targets, 16px inputs, semantic table/list, visible focus, skip link, keyboard order from query controls → queue rows → selected/open action → unavailable explanations, `role=status` for refresh and one `role=alert` for blocking failure. Specify reduced-motion behavior.

## Required wiring-map legs

Return `WIRING_MAP_CD-028.csv` with UI trigger, component, route/action, guard, canonical transition, table/RPC/provider, RLS/role, audit, notification, success, negative/partial result, test, runtime evidence and status for at least:

1. RLS-scoped queue read/direct-route unauthorized or empty scope;
2. SLA settings/read/unknown/overdue derivation;
3. risk, critical violation, priority and evidence-read readiness display;
4. search/filter/clear/no-match behavior;
5. open the immutable submission workspace;
6. queue clear and filtered empty;
7. missing evidence/linked-data degradation;
8. stale/concurrent submission/decision status;
9. immutable audit/version chain read;
10. decision workspace ownership separation (no queue-load write);
11. claim review — `HANDOFF_BLOCKED` unless real action/guard appears;
12. reassign review — `HANDOFF_BLOCKED` unless real action/guard appears;
13. notification and audit truth after a later decision; no delivery claim;
14. Arabic/theme/responsive/keyboard/screen-reader proof.

## Required deliverables

Create a clean `outputs/cd-028-r1/` package only, with editable `.dc.html`, standalone export, companions/assets, manifest, component map, wiring map, state matrix, acceptance checklist, research provenance, future Claude Code handoff/prompt, inventory and evidence PNGs. Include:

- three complete hypothesis frames and counterfactual;
- populated, queue-clear, filtered-empty, overdue, missing-SLA/evidence, unassigned, stale, unauthorized, `HANDOFF_BLOCKED` claim/reassign, 1024, dark/light, Arabic RTL and 412px evidence;
- exact component dispositions and file-level before/after/protected behavior/rollback;
- a full role/action and state matrix;
- package inventory that resolves every manifest path.

Use primary-source research: one enterprise inspection/worklist source, one Saudi public-service source and one accessibility/RTL authority; record observed/adopted/rejected treatment and never copy brand grammar.

Return `READY_FOR_DESIGN_REVIEW_R1`, never sponsor-approved or implementation-complete. Do not implement.
