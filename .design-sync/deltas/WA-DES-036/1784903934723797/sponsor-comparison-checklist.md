# Sponsor Comparison Checklist — New "List" frame (WA-DES-036, revision `1784903934723797`)

Compare the design's new List frame against the real `/planning` runtime.

## Structural presence (must exist in runtime)
- [ ] Toolbar: search, date-range, region filter, notifications (with count), AI-assist icon — all present and functional (not just visually similar)
- [ ] KPI/status tab strip with 6 tabs and live counts, active tab highlighted
- [ ] Compact single-line package notice (not the old multi-sentence paragraph)
- [ ] Visit-plan table showing real row count (not padded or truncated to match the design's 10)
- [ ] "Planning methods" section visually secondary to the table (smaller, below-the-fold-appropriate, not the hero)
- [ ] "Visit management" link present and pointed at the real `/planning/visits` route

## Fidelity checks (design vs. runtime, note every deviation — deviation is not automatically wrong)
- [ ] Toolbar icon style/spacing vs. design's approximation
- [ ] KPI tab counts reflect real RLS-scoped data for the signed-in persona, not fixture numbers
- [ ] Table row density: does the real count still match ~10, or has live data grown/shrunk since 2026-07-24? (If materially different, that's expected drift, not a defect — flag as RESEARCH, not CODE CORRECTION.)
- [ ] Method-card icon treatment: design uses a plain colored square glyph background; compare against runtime's actual icon-chip style (the runtime screenshot already showed a more refined rounded-icon-chip treatment than my design attempt — expect and accept the runtime being the more premium reference here, not the design)

## Interaction
- [ ] KPI tabs are clickable and filter the table (real behavior, not just visual)
- [ ] Toolbar search actually searches (real behavior)
- [ ] Date-range and region controls actually filter (real behavior)
- [ ] Secondary method cards navigate to their real routes
- [ ] "Visit management" link navigates correctly

## EN/AR
- [ ] Toggling language flips every new string: toolbar labels, KPI tab labels, table headers, distinguish-block copy, density/breakpoint notes, all 4 state-chip texts
- [ ] RTL layout mirrors correctly (toolbar icon order, table column order, "Continue" position)

## Light/dark
- [ ] New toolbar/KPI-tab/distinguish-block elements adapt correctly in both themes, no hardcoded colors leaking through

## Responsive
- [ ] Method-card grid: 3-across ≥1024px, 2-across 768–1023px, 1-across <768px — confirm against the stated breakpoints, not just "looks responsive"

## Non-happy-path
- [ ] Empty state matches chip copy ("No visits match...")
- [ ] Loading state matches chip copy (skeleton, no layout shift)
- [ ] Unavailable/error state matches chip copy (ERR-OPS-001 reference)
- [ ] Unauthorized state matches chip copy (business_staff-only messaging)

## Explicitly out of scope for this comparison
- Pixel-perfect toolbar icon reproduction — the design used approximated icons from a screenshot, not a design-tool ruler measurement; minor style differences are expected, not defects.
- Exact table row count matching forever — the design's 10 rows reflect a point-in-time observation (2026-07-24); live data will drift.
