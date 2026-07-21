# Saqeel Premium — Token specification (proposed; NOT applied)
All values proposed. Current = tokens/tokens.css today. Nothing edited yet.

| Token | Current | Proposed | Reason | Light | Dark | Print | Affected |
|---|---|---|---|---|---|---|---|
| --ax-text-metric (NEW) | — (32/40 display misused for KPIs) | 500 28px/32px sans | Display reserved for one page-defining statement | as spec | as spec | 24/28 | KpiCard, metric strip, report counts |
| --ax-text-display | 500 32px/40px | unchanged, usage rule: ≤1 per page | Hierarchy discipline | — | — | 28/34 | report title, empty states |
| --ax-color-border-control (NEW) | — (#D6DDE2 used everywhere, 1.37:1) | #7A8894 (≈3.5:1 vs #FFF) | WCAG 1.4.11 non-text contrast for control boundaries | #7A8894 | #5C6670 (≈3.1:1 vs #191D22) | #555555 | Input, Select, Textarea, chips, pagination, search, decision bar |
| --ax-color-border | #D6DDE2 | unchanged — decorative rules/dividers only | Separators not needed for operation may stay light | — | #353C44 | #999 hairline | tables, rules, section dividers |
| --ax-color-surface-field (NEW) | — | color-mix(text-secondary 6%, surface) | Level-2 tonal field replaces bordered boxes | subtle grey-green | mix from dark surface | omit (white) | tonal sections, evidence thumbs, summary strips |
| Surface levels | ad-hoc | 3 levels: canvas / tonal field / bounded card+panel | Box reduction ("Xbox" fix) | — | — | canvas only | all screens |
| --ax-radius usage | 4/6/8/12/999 | unchanged values; rule: pills ONLY filters+status chips; fields/panels 6–8 | Shape semantics | — | — | 0 (print squares chips) | chips, inputs, cards |
| Spacing tiers (NEW rule) | flat 32px section gaps | chapter 36 / section 24 / item 12–16; report screen padding 32 (was 48) | Rhythm distinguishes legal chapters vs items | — | — | @page 12mm + 18mm running header | report, review |
| Status colors | success/warning/critical/info bases | unchanged; rule: glyph+word always; green reserved (brand band, principal action, verified) | Color-independence + brand scarcity | — | — | grayscale-safe glyph+word | chips, rails, rows |
| --ax-print-text / --ax-print-border (EXISTING print-*) | #111 / #555 | keep; add --ax-print-rule #999 | explicit grayscale ladder | — | — | as spec | print renderer |
| --ax-focus-ring | 2px canvas + 4px primary | unchanged; add scroll-margin recipe (top 72px / bottom 96px) | Focus never fully obscured by sticky chrome (2.4.11) | — | — | n/a | all anchors/controls |
| Texture (NEW policy token) | prohibited | --ax-texture-chrome: measurement ticks / prism line at 1.5% opacity | APPROVED experiment; chrome-only | ticks #1B242C @1.5% | ticks #F1F4F6 @2% | omitted entirely | command bar, brand band, nav chrome, empty canvas ONLY |
| Numeric typography | --ax-numeric-features exists | rule: mandatory on dates, times, IDs, versions, %, durations, coordinates, hashes; + bidi isolation in AR | Alignment + RTL correctness | — | — | same | tables, KV, timelines |

Contrast evidence: #7A8894 on #FFFFFF ≈ 3.5:1; #5C6670 on #191D22 ≈ 3.1:1; chip text uses existing *-strong mixes (≥4.5:1 both themes — verify at build with automated axe pass).