# CD-012 → CD-019 — design-of-record retarget R2 → R3

## Finding: R3 product design is byte-identical to R2

Every runtime file in `outputs/cd-012-019-r3/` is an exact copy of its
`outputs/cd-012-019-r2/` counterpart (MD5-verified):

`cd12.js … cd19.js`, `cd12-register.js`, `cdm-common.js`, `cdm-stage.js`,
`cdm-frame.css`, `support.js`, `saqeel-astryx.css`, `saqeel-tokens.css`,
`export.html` — all IDENTICAL. The only difference in the R3 `.dc.html` shell is
a stale `R2` label in the harness brand line; it loads the same screen modules.

**Consequence:** the delivered R3 bundle renders the same eight screens, same
states, same DOM/markup as R2. The frontend implementation on this branch is
therefore already the R3 implementation — no screen-level reimplementation is
possible without inventing changes the design does not contain.

## R3 correction items vs what shipped

The repo's `CD-012_019_R2_REVIEW_AND_R3_CORRECTION.md` required for R3:
1–6. Package hygiene — native-size PNG exports, source discovery/receipts, three
rendered candidates per screen, clean single-root archive. These are
design-package deliverables, not product-UI changes, and do not affect app code.
7. Visual refinements — reduce technical microcopy on the main surface (move full
prerequisite lists to a detail/evidence panel), strengthen dark-theme hierarchy,
verify light-theme border/muted contrast, rebuild the 412 view as a true narrow
composition.

**Item 7 is NOT present in the delivered R3 runtime files** — they are identical
to R2, so none of those visual refinements were applied in the design source.
Applying them now would be authored-by-implementer design, not implementation of
an approved golden screen, and is left as an explicit follow-up decision rather
than silently invented.

## Status

Design-of-record for this branch = **R3**. Implementation unchanged from the R2
pass (see `../cd-012-019-r2/WIRING_AUDIT_CD-012-019_R2_FRONTEND.md` for the
per-slice map). Verification level unchanged: `tsc` + color-law clean; runtime
unverified (no test DB in this worktree); independent DEC-012 runtime audit still
required.
