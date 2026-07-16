# Claude Design — CD-030 R1 Correction Prompt

Paste this complete prompt into Claude Design. Correct CD-030 only. Do not implement application code.

`implementation_authorized: false`

Every Claude Code-facing file starts exactly:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not alter code, migrations, data, tests, contracts, Git history, branches or the dirty worktree.

## Binding correction: scope classification is not currently proven

Read `CD-030_DESIGN_REVIEW_R1.md` and re-read `apps/web/src/app/reviews/[id]/page.tsx`.

Current runtime facts:

- `returned_sections` stores selected **section keys** from a review.
- The current diff computes changed **answer keys** from the union of `snapshot.answers` keys.
- The route reads `package_versions.definition.sections`, but no verified runtime mapping proves an answer key belongs to a returned section.

Therefore remove all claims that the current runtime can classify a changed answer as expected-within-returned-scope or unexpected-locked-section. In `WIRING_MAP_CD-030.csv`, replace rows for scope classification and locked-change detection with `HANDOFF_BLOCKED_SCOPE_MAPPING` until an exact mapping is verified. Show this honestly in the UI:

`Returned section scope is recorded; answer-to-section mapping is unavailable for this comparison. No expected/tamper classification is claimed.`

Keep the Scope Rail as a useful provenance interface, but make its categories:

1. recorded returned sections;
2. changed stored answers;
3. answer-to-section classification unavailable;
4. other unavailable comparison categories.

Do not label a change tampered, expected, locked, unchanged, compatible or incompatible unless an exact data-backed derivation exists.

## Other corrections

1. Preserve the three genuinely different full-composition hypotheses and the populated counterfactual.
2. Repair layout rhythm so From/To metadata, version labels, package labels, IDs and navigation controls never concatenate. Every control needs clear spacing, boundary, visible focus and a 48px target where interactive.
3. Produce populated PNGs for every state-matrix row: scope clean/mapping unavailable, blocked classification, no prior, empty diff, media unavailable, package semantics unavailable, degraded source, stale, unauthorized, auditor read-only, loading and counterfactual. Include EN/AR, dark/light, 1440, 1024 and 412 proof.
4. Preserve immutable stored-answer diff, route-neutral `/reviews/:id` compare mode, no accept/merge action, non-colour signals, keyboard/SR behavior and the existing `HANDOFF_BLOCKED_START_REVIEW_ATOMIC` / `HANDOFF_BLOCKED_ATOMIC` context.

## Deliver one clean R2 package

Create only `outputs/cd-030-r2/` with both HTML files, `cd30-stage.js`, `cd30-annot.js`, `support.js`, token/CSS/brand assets, all maps/checklists/handoffs/inventory, `PACKAGE_PREFLIGHT_CD-030.md` and all evidence PNGs.

Every governed file and path must say CD-030, SCR-WEB-320 and R2 only. Create a new archive whose only root content is `outputs/cd-030-r2/`. It must contain no other CD package, root duplicate, `screens/` or `uploads/` artifact.

## Mandatory preflight

Do not submit unless `PACKAGE_PREFLIGHT_CD-030.md` includes:

1. exact archive listing proving the sole root is `outputs/cd-030-r2/`;
2. local-reference resolution for each HTML/CSS/JS/SVG asset, including `support.js`;
3. actual SHA-256 hashes for complete A/B/C frames, all different;
4. an exact state-matrix-row → PNG-path inventory;
5. confirmation that `HANDOFF_BLOCKED_SCOPE_MAPPING` is present and unsupported classifications are absent;
6. the execution prohibition and `implementation_authorized: false` in every future Claude Code file.

Return `PACKAGE_PREFLIGHT_PASS` and `READY_FOR_DESIGN_REVIEW_R2` only when every fact is true; otherwise return `PACKAGE_PREFLIGHT_FAIL` and the exact failing path. Do not implement.
