# Claude Design — CD-031 R1 Correction Prompt

Paste this complete prompt into Claude Design. Correct CD-031 only; do not implement application code.

`implementation_authorized: false`

Every Claude Code-facing file starts exactly:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not alter code, migrations, data, tests, contracts, Git history, branches or the dirty worktree.

## Binding runtime correction

Read `CD-031_DESIGN_REVIEW_R1.md` and re-read `apps/web/src/app/factories/[id]/page.tsx` and `actions.ts`.

Current source proves:

- one current `risk_version`, not a historical risk-observation feed;
- joined visits/inspections/submission versions/violations/actions/reviews;
- factory document metadata only; documents created by this surface have `storage_path: null` and no inspection-evidence query, signed URL or viewer;
- no map provider, boundary, coordinate-resolution or evidence-timeline provider.

Therefore the Spatial Case Timeline may use verified factory identity, current risk version, visits/inspections, findings/actions, review status and document-metadata availability. It must not show evidence events or a risk-version history as live sourced facts.

Where those concepts are useful, render them as explicit unavailable rows:

- `HANDOFF_BLOCKED_EVIDENCE_TIMELINE` — no evidence query/derivation is available on this route.
- `HANDOFF_BLOCKED_RISK_HISTORY` — only the current risk version is read; no historic observations are available.

Never create a fabricated causal or spatial link.

## Apply these corrections

1. Preserve all three equal-fidelity hypotheses and the populated counterfactual.
2. Repair section navigation in every composition. Each item must have a separated label, clear boundary, selected state, 48px target and visible keyboard focus; labels must never concatenate. Prove Arabic RTL and 412px behavior.
3. Keep all existing populated states and add the evidence-timeline-unavailable/risk-history-unavailable treatment to the state matrix and visual evidence.
4. Preserve per-section service failure isolation, source/freshness labels, unavailable map/boundary/coordinate handling, risk-driver block, document-viewer block, role masking and neutral not-found/RLS ambiguity.

## Deliver one clean R2 package

Create only `outputs/cd-031-r2/` with both HTML files, `cd31-stage.js`, `cd31-annot.js`, `support.js`, token/CSS/brand assets, all maps/checklists/handoffs/inventory, `PACKAGE_PREFLIGHT_CD-031.md` and all evidence PNGs.

Every governed path and file must identify CD-031, SCR-WEB-400 and R2 only. Build a new archive whose only root content is `outputs/cd-031-r2/`; it must contain no other CD package, root duplicate, `screens/` or `uploads/` file.

## Mandatory preflight

Do not submit unless `PACKAGE_PREFLIGHT_CD-031.md` records:

1. exact archive listing proving the sole root is `outputs/cd-031-r2/`;
2. local-reference resolution for each HTML/CSS/JS/SVG asset, including `support.js`;
3. actual SHA-256 hashes for complete A/B/C frames, all different;
4. exact state-matrix-row → PNG-path inventory;
5. timeline verification showing evidence and risk history either absent or accurately `HANDOFF_BLOCKED`;
6. execution prohibition and `implementation_authorized: false` in every future Claude Code file.

Return `PACKAGE_PREFLIGHT_PASS` and `READY_FOR_DESIGN_REVIEW_R2` only when every recorded fact is true; otherwise return `PACKAGE_PREFLIGHT_FAIL` with the failing path. Do not implement.
