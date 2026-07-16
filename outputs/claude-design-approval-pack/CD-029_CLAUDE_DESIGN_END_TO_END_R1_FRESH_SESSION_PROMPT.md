# Claude Design Prompt — CD-029 / SCR-WEB-310 Level 2 Review Workspace

Paste into a fresh Claude Design account. This is design-only; do not implement code.

## Identity and boundary

- Saqeel MVP1; `CD-029` / `TASK-DESIGN-CD029`
- `SCR-WEB-310`, `/reviews/:id`, P10, Level 2 Reviewer
- Engines: `ENG-03`, `ENG-07`, `ENG-08`, `ENG-09`, `ENG-12`
- Requirements: `MVP1-M06-001..039,049,051,052` plus foundation/RBAC/audit/accessibility contracts
- Acceptance: `DSG-024`, `DSG-A11Y-001`

`implementation_authorized: false`

Every Claude Code-facing deliverable begins:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit code, migrations, data, tests, contract files or Git history. Do not commit, push, merge, deploy, modify main, reset, clean, stash or discard the dirty worktree.

## Mandatory repository discovery

Read the repository authority files, design baseline/ratchet, routes/state/RBAC/error/acceptance sources, traceability matrices, frozen shared shell files, then inspect:

- `apps/web/src/app/reviews/[id]/page.tsx`, `DecisionPanel.tsx`, `actions.ts`;
- `apps/web/src/app/reviews/page.tsx`, `DecisionPanel.tsx`, `actions.ts`;
- review/inspection/audit/notification migrations and `lib/notify.ts`.

Record branch, commit and dirty status. If an exact action, RLS policy, transition, audit, side effect or provider cannot be proven, mark it `HANDOFF_BLOCKED`.

## Binding runtime truth

- The workspace reads immutable submitted versions, checklist answers, violations, action forms, evidence metadata, factory-verification checks, acknowledgement, version diff and append-only audit trail.
- On opening a submitted inspection with no open review, current `reviews/[id]/page.tsx` inserts a review and changes inspection status to `under_review`. This is a real state mutation on page load. Do not hide it, call it a harmless read, or redesign it as a silent claim. Its ownership/atomicity is `HANDOFF_BLOCKED` pending a recorded workflow decision.
- Current decision action writes review decision, then inspection status, then notification separately. It is non-transactional: a decision can commit before inspection transition or notification queueing fails. Never claim atomic completion, rollback or delivery.
- Decision validation is inconsistent between the route-level and queue-level action files. Return requires exact sections and reason; rejection requires reason in the detail action; immutable decided review edits are DB-rejected. Preserve canonical state/audit truth.
- Reviewers cannot edit inspector content or immutable submitted versions. No raw Supabase/provider error reaches user copy.
- No claim/reassign action is proven. No provider-backed media viewer is proven; evidence degradation must remain explicit.

## Design challenge

Create an evidence-led three-zone workspace: section navigation, immutable content/evidence, and a persistent governed decision rail. The single signature interaction is the **Finding Trace Chain**:

`question → response → evidence → clause → violation → corrective action → decision comment`

It must be keyboard-operable, list-equivalent, source/version-labelled, and never a decorative graph. A chain link unavailable in runtime is visibly unavailable, not fabricated.

Before final design, create three equal-fidelity, complete hypotheses using the same data/hard state:

1. trace-chain-first workspace (selected only with evidence);
2. evidence-viewer-first workspace;
3. decision-rail-first workspace.

Compare decision safety, evidence traceability, keyboard/Arabic density, narrow behavior and runtime truth. Include a visual counterfactual without the trace chain. No numeric self-scoring.

## Required content and hard states

- immutable version header, factory/visit/package provenance and read-only rule;
- section navigation, checklist responses, findings, clauses, violations, action forms, evidence metadata, acknowledgement, version comparison and audit timeline;
- decision rail: approve, return exact sections, reject, mandatory reason/return scope and immutable result;
- `HANDOFF_BLOCKED` page-load review creation/under-review transition, decision atomicity, claim/reassign, provider media and neutral error mapping where source cannot prove safe behavior;
- pending, under review, decided locked, return missing scope, reject missing reason, stale/concurrent decision, unauthorized, missing evidence, provider-degraded media, multiple critical findings, linked-source failure, loading, Arabic RTL, 1024 and 412px.

The action rail must distinguish: action may be offered; server/RLS guard rechecks at submit; primary decision recorded but inspection/notification did not complete; notification queued versus delivered. Do not invent support/escalation paths.

## Accessibility/theme/RTL

Arabic-first full-document RTL, realistic long Arabic strings and mixed-direction IDs/dates; dark/light semantic parity; 1440, 1024, 390–430px layouts; WCAG AA; 48px targets; 16px inputs; semantic regions/headings/tables; visible focus; defined keyboard order; focus moves to invalid return scope/reason or neutral outcome; `role=status` and one blocking `role=alert`; reduced-motion static trace-chain equivalent.

## Wiring map

Return `WIRING_MAP_CD-029.csv` covering at least: RLS detail read; submitted version selection; page-load review creation/under-review mutation; trace-chain data legs; evidence/provider degradation; return validation; approve/reject; review→inspection transition; notification queue; append-only audit; immutable decided state; stale/concurrent/RLS denial; no claim/reassign; Arabic/theme/a11y. Every unproven/partial/non-atomic leg is `HANDOFF_BLOCKED`.

## Deliverables

Create a clean `outputs/cd-029-r1/` only: editable `.dc.html`, standalone, companions, manifest, component/wiring/state maps, acceptance checklist, research provenance, future handoff/prompt, inventory and evidence PNGs. Provide three complete hypothesis frames, populated dark/light EN/AR, return validation, partial decision side-effect, evidence/media degraded, stale/locked/unauthorized, 1024/412 and counterfactual evidence.

Use three primary sources (enterprise inspection, Saudi public service, accessibility/RTL) and record observed/adopted/rejected treatments. Preserve the frozen shared shell. Return `READY_FOR_DESIGN_REVIEW_R1`, never implementation-complete.
