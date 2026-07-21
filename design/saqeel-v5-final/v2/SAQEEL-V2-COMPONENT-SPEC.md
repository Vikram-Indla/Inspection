# Saqeel V2 — component changes (APPLIED)
Global: sentence case; no raw enums; tabular numerals + <bdi> for technical values; logical properties (native RTL); focus ring + scroll-margin recipe; reduced motion honored.
## Applied CSS changes (tokens/astryx.css)
- **Button**: font 16/24 semibold → var(--ax-text-action) 14/20. Levels: principal (1 per action zone) / secondary / subtle (tertiary) / icon / danger-subtle (entry) / danger (confirmation dialogs & danger zones ONLY). **Loading keeps its label** ("Publishing version…" + trailing spinner) — transparent-label rule removed. Disabled must expose a reason (title/describedby). Duplicate/ambiguous actions prohibited.
- **Field/Input**: label → 14/20 (--ax-text-label); input radius 12→6px; height 40px web (52px via .ax-density-field on iPad); hints/errors 13–14/18–20; content-appropriate widths; error copy states recovery ("Visit date must be today or later."). Dates render governed ("1 Jul 2026"), never 01/07/2026.
- **Selection controls**: group via .ax-fieldset + legend (Planning mode / Factory scope / Notifications). Unselected radio = clear outline, not disabled-grey.
- **Segmented (view selector)**: 36px, 14/20, quiet primary-tint selected state (was dark raised block). Distinct from record navigation.
- **Tabs (record navigation)**: 14/20, reduced padding, underline only — link semantics for routes, full ARIA tabs for in-page panels.
- **Cards → record rows**: .ax-recordrow flat entries with start-edge selection rail replace bordered version cards (.ax-typecard deprecated for version lists).
- **NEW**: .ax-chip (+ok/warn/crit/info-tone/lock), .ax-statusrail, .ax-mstrip, .ax-field-tonal, .ax-density-compact/.ax-density-field, .ax-texture-chrome.
## Per-component contracts
Anatomy/variants/states/dimensions/typography/RTL/keyboard/dark/print for all 34 components: unchanged sections carried from explorations/premium-pilot/SAQEEL-PREMIUM-COMPONENT-SPEC.md, which remains the detailed contract source; this file records the deltas now canonical.
## Acceptance criteria (measurable)
1 principal action per zone · destructive gated · display ≤1×/page · labels ≠ headings · brand ≠ info color · ≥30% container reduction on redesigned specimen (17→9, see core.card.html) · every bounded surface classified · WCAG 2.2 AA targets (3:1 boundaries, 4.5:1 text, 24px targets, 48px field, 400% reflow) · full AR/RTL parity · Riyadh Gregorian dates.