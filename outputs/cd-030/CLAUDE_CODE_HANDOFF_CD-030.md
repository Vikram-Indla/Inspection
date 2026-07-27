# CLAUDE_CODE_HANDOFF_CD-030.md — R1
DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
implementation_authorized: false

## Package
Single synchronized package at outputs/cd-030-r1/ : editable source (CD-030 Version Comparison.dc.html), standalone, cd30-stage.js, cd30-annot.js, support.js, saqeel-tokens.css, saqeel-retired-predecessor.css, saqeel-prism.svg, manifest, component/wiring/state maps, acceptance checklist, research provenance, this handoff, the implementation prompt, inventory, preflight, and evidence PNGs.

## Signature (binding)
Tamper-evident Scope Rail: classify every changed answer against the review's STORED returned scope (reviews.returned_sections) — expected / unexpected (locked-section) / unchanged / comparison-unavailable. Never infer scope from the diff; never label an uncomputed category 'unchanged'. Keyboard-operable, list-equivalent, non-color-only, navigation-only.

## Binding HANDOFF_BLOCKED (design surfaces; does not resolve)
- HANDOFF_BLOCKED_MEDIADIFF / _PKGSEMANTIC / _METADIFF — evidence/media, package-semantic and metadata/section-order comparisons are not derived in the runtime; render them unavailable, never 'unchanged'.
- HANDOFF_BLOCKED_ACCEPT — no accept/merge action or authorization path exists; comparison stays navigation-only.
- HANDOFF_BLOCKED_LINKED — a degraded comparison source shows affected rows unavailable, not an empty diff.
- HANDOFF_BLOCKED_START_REVIEW_ATOMIC / HANDOFF_BLOCKED_ATOMIC — opening the review is read-only, but CD-029's explicit startReview sequence (insert review, then separately set inspection under_review) is non-atomic and its decision write is non-transactional; CD-030 neither hides nor resolves either.

## Preserve
Diff = stored answer snapshots, union of keys, latest vs prior; returned scope authoritative from reviews.returned_sections; immutable versions + audit; route-neutral compare mode (/reviews/:id/compare consolidated into /reviews/:id); the grouped shell. CD-028 queue and CD-029 decision workspace not redesigned.

## Baseline
BASELINE_REVERIFY_REQUIRED — /reviews/:id version-diff sources read at main this session; re-verify locally before editing. setup/Inspection is obsolete.
