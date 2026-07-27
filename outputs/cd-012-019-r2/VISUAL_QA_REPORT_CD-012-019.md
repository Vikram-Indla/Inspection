# VISUAL QA REPORT — CD-012→019 R2

Method: 144-render smoke test (ALL PASS); 48 captured frames reviewed; token-level checks against
saqeel-tokens.css (both themes are separately tuned palettes, not inversions).

## Dark theme
- Body text on panel surfaces uses --legacy-color-text on --legacy-color-surface (AA large+normal per token spec).
- Status lozenges pair glyph+text; RAG tints keep ≥3:1 against surface; focus ring is the 2px token ring.
- Disabled actions use aria-disabled + reduced opacity ≥ .55 with text ≥ 4.5:1 retained on labels.
## Light theme
- Independently composed: sunken table headers, border hierarchy and muted text use the light-tuned
  tokens (AA-adjusted RAG hues per DEC-011), verified on CD-012/13/14/15/16/17/18/19 light frames.
- Long Arabic strings reviewed on light CD-018/CD-012 — hierarchy retained, no contrast collapse.
## RTL
- Full-document dir=rtl; logical properties flip nav, breadcrumbs, provenance timeline connector,
  table alignment. Codes/dates/IDs (v8, FAC-08841, ISO timestamps, JSON) are bidi-isolated LTR runs
  (dir="ltr" on .jed__code, .au-ev__ts, .lz-key, coordinate spans).
- AR frames captured for every screen at 1440; no cut-off nav or table content observed.
## Narrow (412)
- True 412 compositions: m-split/m-split3 collapse to one column; lz-row stacks; au-ev drops the
  timestamp column into body; nav collapses to drawer trigger. Captured per screen.
## Focus & keyboard
- Skip link first; commandbar → content order; expanded/detail content follows its trigger in DOM;
  non-executable lanes remove buttons from tab order (tabindex=-1 + aria-disabled).
## Reduced motion
- Only motion is skeleton shimmer + sync pulse from retired predecessor tokens; both disabled under
  prefers-reduced-motion (token sheet rule).
## Known limitations (declared)
- Raster contrast measured against token definitions and visual review, not an automated axe run —
  recommend an axe/Lighthouse pass during the vertical slice.
- Capture rasters are scale-to-fit of true-width compositions (see CAPTURE_MANIFEST honesty note).