# Claude Design — Complete Consolidated Prompt: CD-029 / SCR-WEB-310

Paste this entire prompt into a fresh Claude Design account. It replaces any earlier CD-029 prompt/correction prompt.

## 1. Task identity and non-negotiable boundary

- Product: Saqeel MVP1 (`صقيل | صناعي`)
- Task/design: `TASK-DESIGN-CD029` / `CD-029`
- Screen: `SCR-WEB-310` — Level 2 Review Workspace
- Route: `/reviews/:id`
- Journey: P10
- Persona: Level 2 Reviewer
- Engines: `ENG-03`, `ENG-07`, `ENG-08`, `ENG-09`, `ENG-12`
- Requirements: `MVP1-M06-001..039,049,051,052`, with relevant foundation, RBAC, audit, notification and accessibility contracts
- Acceptance: `DSG-024`, `DSG-A11Y-001`

This is a controlled design task for an existing product. It is not a greenfield concept and is not a Claude Code implementation task.

`implementation_authorized: false`

Every Claude Code-facing file must start with exactly:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, migrations, database data, tests, contract files or Git history. Do not implement, commit, push, merge, deploy, modify `main`, switch branches, reset, clean, stash, discard or overwrite the dirty worktree.

## 2. Mandatory discovery order

Read, in order:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`, `CURRENT_STATE.md`, `GATE_STATUS.md`, `execution/CURRENT_SLICE.yaml`, `execution/TASK_ROUTER.yaml`, `governance/OPEN_DECISIONS.yaml`
3. `design/claude-design-mvp1/00_START_HERE.md`, `MANIFEST.yaml`, `CURRENT_UI_BASELINE.md`
4. `design/claude-design-mvp1/authority/SOURCE_AUTHORITY.md`, `CODE_ROUTE_RECONCILIATION.csv`, `SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`, `UX_BLIND_SPOT_REGISTER.csv`
5. `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md` and CD-029 row in `Saqeel_43_Screen_Claude_Design_Matrix.csv`
6. `product-contract/screens/screen_route_catalogue.csv`, `domain/atomic_scope.csv`, `domain/state_transitions.csv`, `domain/rbac_matrix.csv`, `governance/error_catalogue.csv`, `evidence/AC_LEDGER.csv`
7. filtered `FABLE_UNDERSTANDING_TRACEABILITY.csv`, `FABLE_ACCEPTANCE_UNDERSTANDING.csv`, design acceptance/state/evidence matrices
8. frozen shell: `Shell.tsx`, `ShellClient.tsx`, `shell-navigation.ts`, `astryx.css`, `tokens.css`
9. `apps/web/src/app/reviews/[id]/page.tsx`, `DecisionPanel.tsx`, `actions.ts`, plus `/reviews/page.tsx`, `DecisionPanel.tsx`, `actions.ts`
10. `lib/factory-verification.ts`, `lib/notify.ts`, and review/inspection/audit/notification migrations.

Record actual branch, commit and dirty-worktree status. If a route, action, data field, RLS policy, audit event, provider, transition or side effect cannot be verified, mark the related design/wiring row `HANDOFF_BLOCKED`. Never infer it from screenshots.

## 3. Binding runtime truth

- `/reviews/:id` reads immutable submitted versions, package definition, checklist answer snapshot, violations and mapping version, corrective-action forms, evidence metadata, factory-verification checks, acknowledgement, prior-version answer diff and append-only audit trail.
- Submission versions are immutable. A reviewer must never edit inspector content or present a submitted value as editable.
- Opening the route for a submitted inspection with no open review currently inserts a review and updates the inspection to `under_review`. This is a real page-load mutation, not a harmless view. It is `HANDOFF_BLOCKED_PAGELOAD_MUTATION` until a separately recorded workflow/atomicity decision exists.
- Current `decide` writes review decision, then inspection status, then queues notification. These are separate writes: partial side effects are possible and no rollback is proven. Mark `HANDOFF_BLOCKED_ATOMIC`; never claim atomic decision completion or notification delivery.
- Return requires exact returned sections and a reason; reject requires a reason; approve has different current validation. Decided reviews are immutable at the database layer. Duplicate queue/detail decision actions differ; do not unify or weaken them by design claim.
- Evidence has metadata/integrity facts, but no provider-backed media viewer is proven. Use `HANDOFF_BLOCKED_MEDIA`, with honest unavailable preview state.
- No claim/reassign action or reviewer ownership path is proven: `HANDOFF_BLOCKED_CLAIM`.
- Factory-verification source may fail; do not call a failed source “no changes.” Raw provider/database errors and ungoverned “contact support” copy must not appear in the design.

## 4. Design objective

Let the reviewer trace an immutable finding from question to decision without losing source, version, returned scope or action context:

`question → response → evidence → clause → violation → corrective action → decision comment`

The selected page-specific signature interaction is the **Finding Trace Chain**. It must be keyboard-operable, list-equivalent, source-and-version-labelled, non-color-only and reduced-motion safe. A missing link must say unavailable; never fabricate it.

Explicitly reject a document viewer with a decision form appended at the bottom, generic ticket/CRM styling, code-diff aesthetics, and a decorative relationship graph.

## 5. Current-screen critique and hypotheses

Before designing, critique:

1. immutable evidence, finding, action and decision context are scattered;
2. decision actions are not visibly coupled to their guard/partial-side-effect truth;
3. page-load mutation and non-transactional decision chain are dangerous but easy to conceal.

Create three complete, same-size, equal-fidelity high-fidelity 1440px compositions using the same realistic visit/submission data and hard state:

| Hypothesis | Primary decision architecture |
| --- | --- |
| A — Trace-chain-first | Immutable header → Finding Trace Chain → evidence-led content → governed decision rail. Selected only if evidence supports it. |
| B — Evidence-viewer-first | Immutable evidence/findings lead; trace chain and decision rail stay persistent and complete. Media remains explicitly unavailable when unproven. |
| C — Decision-rail-first | Governed decision boundary leads; immutable evidence/trace chain remain persistent and complete; never hides current state/partial risk. |

Compare decision safety, traceability, irreversible-error prevention, Arabic/RTL density, keyboard burden, narrow behavior and implementation truth. Do not self-score. Include a populated visual counterfactual with the Finding Trace Chain removed, explaining the concrete loss without inventing research results.

## 6. Required composition and states

Use an evidence-led three-zone workspace:

1. section navigation;
2. immutable content/evidence/provenance;
3. persistent governed decision rail.

Show: immutable version header; factory/visit/package provenance; checklist answers; findings/clauses/violations; action forms; evidence metadata; acknowledgement; factory verification; version diff; audit timeline; decision comment; exact return-scope selector; mandatory reason and decision consequences.

Required states: pending; under review; decided locked; return without scope; return/reject missing reason; stale/concurrent; RLS denied/unauthorized; missing evidence; provider-degraded media; multiple critical findings; linked-source failure; factory verification unavailable; page-load mutation disclosure; partial decision side effect; loading; dark/light; Arabic RTL; 1024; 412px.

The decision rail must distinguish offered action, submit-time server/RLS recheck, decision recorded, inspection transitioned, notification queued, and partial failure. Never say queued means delivered, received or accepted.

## 7. Arabic, accessibility and responsive contract

- Arabic-first `lang=ar dir=rtl`, with realistic long Arabic content and mixed-direction IDs/dates.
- Dark/light semantic parity; label/icon/pattern rather than color-only status.
- 1440 desktop, 1024 constrained and 390–430px narrow layouts.
- WCAG AA, 48px targets, 16px inputs, semantic headings/regions/tables, visible focus and skip link.
- Define keyboard order: version/context → section navigation → trace-chain disclosures → immutable evidence → decision radios/scope/reason/submit. On validation failure focus the invalid return-scope/reason summary; on result announce status or one blocking alert.
- Reduced motion presents the same trace information as a static ordered list.

## 8. Wiring-map contract

Return `WIRING_MAP_CD-029.csv` with: UI trigger/state; component; route/action; guard; canonical transition; table/RPC/provider; RLS role; audit; notification; success; negative/partial result; test; runtime evidence; status.

Cover at least 18 legs: RLS detail read; version selection; page-load review creation; trace question/response; evidence metadata; clause/violation; corrective action; decision comment; media degradation; factory verification; stored-answer version diff; audit timeline; return validation; reject validation; decision write chain; decided/stale/RLS lock; claim/reassign unavailable; Arabic/theme/responsive/keyboard/screen-reader.

Every page-load mutation, non-atomic write, media, claim/reassign, error-map or linked-source uncertainty remains `HANDOFF_BLOCKED` unless exact runtime proof exists.

## 9. Required clean deliverable package

Create only `outputs/cd-029-r1/` containing:

- `CD-029 Level 2 Review Workspace.dc.html`
- `CD-029 Level 2 Review Workspace.standalone.html`
- `cd29-stage.js`, `cd29-annot.js`, `support.js`
- `saqeel-tokens.css`, `saqeel-astryx.css`, `saqeel-prism.svg`
- manifest, component map, wiring map, state matrix, acceptance checklist, research provenance, future handoff/prompt, package inventory and all evidence PNGs.

Provide complete A/B/C hypothesis frames, counterfactual, populated EN/AR dark/light, return validation, partial side effect, decided lock, degraded media, linked-source failure, 1024 and narrow evidence.

Research at least three primary sources: one enterprise/inspection pattern, one Saudi public-service source, and one accessibility/RTL authority. Record observed/adopted/rejected treatment; do not copy visual grammar.

## 10. Mandatory package preflight

Before returning, create `PACKAGE_PREFLIGHT_CD-029.md`. Do not submit unless all pass:

1. Archive root contains only `outputs/cd-029-r1/`.
2. Archive contains no CD-001–028 file, root duplicate, upload folder, stale prompt or historical screenshot.
3. Every manifest/inventory path resolves inside `outputs/cd-029-r1/`; include `support.js` if referenced.
4. Every governed file says CD-029, SCR-WEB-310 and R1; no stale CD/revision/path appears.
5. A/B/C frames are complete, visibly different full compositions and have distinct hashes.
6. Counterfactual is a populated UI frame, not annotation prose.
7. Future Claude Code files have the execution prohibition and `implementation_authorized: false`.

Only when all checks pass return `PACKAGE_PREFLIGHT_PASS` and `READY_FOR_DESIGN_REVIEW_R1`. Otherwise return `PACKAGE_PREFLIGHT_FAIL` and the exact missing item. Do not implement.
