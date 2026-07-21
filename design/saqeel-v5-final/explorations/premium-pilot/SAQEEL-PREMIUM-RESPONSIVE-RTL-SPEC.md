# Saqeel Premium — Responsive & RTL specification
## Breakpoints (deterministic shell states)
- ≥1440 full: rail 248 + content ≤1440 grid + contextual panel 360.
- 1100–1439 compact: search 260px, account identity trims, panel 320.
- 900–1099 tablet: contextual panel folds to in-flow accordion/tabs; status rail wraps to 2-row ledger.
- <900 mobile: rail = modal drawer; command bar 56px (brand + search icon + action + menu); report = record rows; decision bar = bottom sheet 48px targets.
- 400% zoom / 320px: everything reflows one column; complex tables get accessible overflow (labeled, tabbable) — prose/metadata/nav/actions never 2-D scroll.

## Report responsive
KV grid 4→2→1; findings grid stacks (summary above table); checklist table → per-item record rows <720px (item, chip, note, violation link, evidence link); collapsed chapters stay disclosures; sticky chapter nav becomes top select <900px.

## Review workspace responsive
B2 3-pane → tabs (Issues / Report / Evidence) <1100px; issue prev/next persists in the sticky bar; note field moves into decision sheet.

## RTL rules (verified in RTL Reference canvas)
- True RTL composition: dir=rtl on html; ALL geometry via logical properties (already the codebase convention) — panels, rails, timelines, table alignment flip natively; grid inline axis flips column order (nav → right, evidence panel → left).
- Bidi isolation: wrap IDs, versions, dates, times, %, hashes, file paths, coordinates in <bdi> (or unicode-bidi:isolate + dir=ltr) — e.g. صدر <bdi>INS-9F2A41C7</bdi>.
- Date ranges in AR: labeled من / إلى (never a bare →); punctuation verified with Arabic comma "،"; numerals: Latin digits kept for governed identifiers, Eastern Arabic optional per org policy (documented, not assumed).
- Chevrons/steppers/breadcrumb separators flip via existing [dir=rtl] content rules.
- Arabic wrapping: allow longer line-height (24px body maintained), no letter-spacing on Arabic, headings may wrap 2 lines before truncation.
- Equivalent hierarchy: same type scale both languages; Arabic strings reviewed for length (labels avg +20%).

## Dates & calendar policy
Gregorian primary (approved). Asia/Riyadh for ALL user-facing times (approved). Hijri: optional org-controlled secondary suffix, OFF by default, pending legal review — no dual-calendar UI in pilots.