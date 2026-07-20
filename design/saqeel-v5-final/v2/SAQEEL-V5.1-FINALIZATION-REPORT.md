# Saqeel Design System V5.1 — finalization report

Status: **FINAL DESIGN-SYSTEM BASELINE FOR APPLICATION IMPLEMENTATION**

This pass did not reopen the visual direction. It corrected residual source defects before repository migration.

## Corrections made

- Route navigation no longer renders `role="tab"` on links.
- SearchInput now uses one canonical SVG icon; the generated `⌕` glyph was removed.
- Field preserves custom control IDs and existing accessible descriptions.
- Button disabled reasons are connected with `aria-describedby`.
- Modal and Drawer expose localized close labels and stronger focus handling.
- Pagination exposes a localized navigation label.
- DataTable has focus-visible sortable buttons, unique selection labels and configurable captions.
- DateTime due-state calculations use Asia/Riyadh calendar-day boundaries and localized copy.
- DateRange uses localized From/To labels.
- EvidenceCard uses canonical SVG image/video icons rather than emoji.
- Information chips use information text, not brand-primary text.
- Shell scope and date controls use the governed control-boundary token.
- IBM Plex Sans Arabic is the single product and input voice.
- Stale dark-color, radius and control guideline specimens were corrected.
- V2 documentation and package entry points were aligned.

## Deliberate remaining boundary

Interactive authoring cards still use pinned CDN React/Babel scripts. Static patterns, tokens, CSS, assets and implementation specifications are offline-readable. Application engineering must not depend on the preview runtime.
