# Claude Design Prompt — CD-030 / SCR-WEB-320 Version Comparison

Paste into a fresh Claude Design account. This is design-only; do not implement application code.

## Identity and boundary

- Saqeel MVP1; `CD-030` / `TASK-DESIGN-CD030`
- `SCR-WEB-320`, logical compare mode `/reviews/:id/compare` consolidated into current `/reviews/:id`
- P11; Reviewer and Auditor; engines `ENG-07`, `ENG-09`, `ENG-12`
- Acceptance: `DSG-025`, `DSG-A11Y-001`; requirements `MVP1-M06-040..048,050,053` plus relevant foundation/RBAC/audit contracts

`implementation_authorized: false`

Every Claude Code-facing file begins:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit code, migrations, data, tests, contract files or Git history. Do not commit, push, merge, deploy, modify main, reset, clean, stash or discard the dirty worktree.

## Read before designing

Read `AGENTS.md`; product-contract start/state/gate/slice/router/decisions; design start/manifest/baseline; quality ratchet; source authority and route reconciliation; screen/atomic scope/state/RBAC/acceptance sources; filtered traceability ledgers; and the frozen shell files. Then inspect `apps/web/src/app/reviews/[id]/page.tsx`, DecisionPanel/actions, field return/correction files, review/audit migrations and version/submission tables.

Record branch/commit/dirty state. When a route, selector, data field, policy, comparison type or action cannot be verified, write `HANDOFF_BLOCKED` with missing evidence—never guess.

## Binding runtime truth

- Current `/reviews/:id` selects submission versions, sorts them, and compares only stored answer snapshots by union of keys. It can show changed answer cells between latest and prior version.
- Evidence/media, acknowledgement, package semantic, metadata, section-order and locked-section change diffs are **not** currently proven as comparison derivations. Do not render them as computed facts; mark them unavailable or `HANDOFF_BLOCKED`.
- Current catalogue target `/reviews/:id/compare` is consolidated into `/reviews/:id`; do not invent a route or claim it exists. Design a route-neutral comparison mode only.
- Submission versions and audit trail are immutable. Return scope is stored on reviews; returned/reopened scope must not be inferred from merely changed answers.
- Opening the review workspace is read-only. `StartReview.tsx` explicitly invokes `startReview`, which inserts a review and then separately moves the inspection to `under_review`; that start sequence is non-atomic and remains `HANDOFF_BLOCKED_START_REVIEW_ATOMIC`. Decision writes remain non-transactional (`HANDOFF_BLOCKED_ATOMIC`). CD-030 must not hide or resolve either gap.
- No raw database/provider errors, no color-only diff, no policy threshold, and no claim that media/package differences are verified unless a source proves them.

## Design problem

Enable a reviewer/auditor to understand what changed between returned and resubmitted immutable versions, distinguish expected returned-scope changes from unexpected locked-content changes, and navigate the actual changed answer safely.

One signature interaction: **Tamper-evident Scope Rail**. It separates:

1. expected returned-scope change;
2. unexpected locked-section answer change;
3. unchanged locked content;
4. unavailable comparison categories.

It must be keyboard-operable, list-equivalent, source/version-labelled and non-color-only. Never call a missing semantic comparison “unchanged.”

Create three complete, equal-fidelity hypotheses: scope-rail-first (selected only if evidence supports it), side-by-side answer-first, and chronological-version-first. Use identical data/hard states; show a visual counterfactual without the scope rail and explain the decision loss without self-scoring.

## Required content and states

- version selectors and immutable identity/timestamps/package label only where actually queried;
- returned-scope summary and source review comment;
- changed-section navigation, answer-level side-by-side diff, and exact audit/version provenance;
- comparison categories for evidence/media/package/metadata/reordered sections: only data-backed results; otherwise explicit unavailable/HANDOFF_BLOCKED;
- no prior version, compatible answer comparison, unexpected locked answer change, missing evidence, incompatible/unknown package semantics, service degradation, stale/unauthorized/read-only, loading and empty diff;
- no “accept changes” action unless a real action/authorization path is inspected; navigation only is safe by default.

## Arabic, theme and accessibility

Full Arabic RTL with mixed-direction IDs/dates; dark/light parity; 1440, 1024 and 412px; WCAG AA; visible focus; semantic comparison table/list; defined keyboard order/version-selector focus transfer; status/alert wording; reduced-motion static equivalent. Do not make users rely on red/green, hover, drag or a code-diff aesthetic.

## Wiring map requirements

Return `WIRING_MAP_CD-030.csv` for: RLS version read; version selection; stored-answer diff; returned-scope read; scope classification; unexpected locked answer change; evidence/media comparison unavailable; package/metadata/order comparison unavailable; audit read; logical route reconciliation; navigation to changed answer; no-prior/incompatible/degraded/stale/unauthorized; theme/RTL/a11y. Unsupported semantic diff/action legs are `HANDOFF_BLOCKED`.

## Deliverables

Create only `outputs/cd-030-r1/`: editable `.dc.html`, standalone, `cd30-stage.js`, `cd30-annot.js`, `support.js`, Saqeel token/CSS/brand assets, manifest, component/wiring/state maps, acceptance/research records, future handoff/prompt, inventory and evidence PNGs. Provide complete A/B/C frames, selected Arabic RTL and 412 proof, answer-diff, locked-change, unavailable-comparison, no-prior and counterfactual evidence.

## Mandatory package preflight — do this before returning

Do **not** submit if any check fails. Create `PACKAGE_PREFLIGHT_CD-030.md` recording each check and result.

1. Archive root contains only `outputs/cd-030-r1/`.
2. No CD-001–029 file, root duplicate, upload folder, stale prompt or historical screenshot exists in the archive.
3. Every manifest/inventory path resolves inside `outputs/cd-030-r1/`; `support.js` is included if referenced.
4. Every governed artifact says CD-030, SCR-WEB-320 and R1; no stale CD/R revision/path remains.
5. A/B/C PNGs are complete, visibly different full compositions and have distinct file hashes.
6. Counterfactual is a populated UI frame, not annotation prose.
7. Implementation prompt/handoff have the execution prohibition and `implementation_authorized: false`.

Only on all-pass return `PACKAGE_PREFLIGHT_PASS` and `READY_FOR_DESIGN_REVIEW_R1`. Otherwise return `PACKAGE_PREFLIGHT_FAIL` with the missing item. Do not implement.
