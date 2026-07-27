# Component Migration Matrix — Saqeel V5.1

| Component | V5.1 spec status | Status this session | Notes |
|---|---|---|---|
| Button | tokens updated (action typography, loading-visible, radius) | Done at CSS level | `.legacy-btn*` classes in `retired-predecessor.css`; no React wrapper existed or was added — usage stays class-based, which is the existing app convention. |
| Field / Input / Select / Textarea | tokens updated (label typography, radius 6px) | Done at CSS level | Same — class-based. |
| Search | canonical SVG icon | Done | `.legacy-search::before` now mask-based, self-suppresses if `<Icon name="search">` already present. |
| Segmented / Tabs (CSS) | action typography | Done at CSS level | `.legacy-segmented button`, `.legacy-tabs [role=tab]` font updated. |
| Tabs (React, WAI-ARIA behavior) | roving tabindex, arrow keys, RTL-aware | **New** `components/Tabs.tsx` built | Not yet adopted by any existing page — the ~6 `role="tab"` call sites found (DashboardView, admin/violations, Workspace, StoryPanel, DualStateRibbon) were audited and found to already be in-page content toggles using `<a>`/`<button>` correctly, not route-nav misuse; migrating them to the new component is tracked, not done. |
| Modal | focus trap/restore, Escape, scroll lock | **Adopted at all 4 known call sites** | `ImageAnnotator.tsx`, `FactoryVerification.tsx`'s `AnnotateModal`, `Workspace.tsx`'s exit-confirm + evidence-delete-confirm dialogs, and `SignaturePad.tsx` all now render through `components/Modal.tsx` — typechecked, guardrail clean, full build clean, `npm run check:design-system-v5` and axe a11y audit both clean afterward. Added an optional `maxWidth` prop to `Modal` to preserve each call site's original width (700/720/560/420/480px). `SignaturePad.tsx` was initially deferred out of caution, then migrated once inspection confirmed Modal's Escape/backdrop-close both route to the same `onCancel` its existing Cancel button always called — not new untested behavior, just new ways to reach an already-correct path. |
| Drawer | same as Modal | Not started | No shared Drawer component exists; not built this session. |
| Pagination | action typography | Done at CSS level | An existing `components/Pagination.tsx` React wrapper already exists (not modified — only the CSS font token changed). |
| DataTable | sort button semantics, `aria-sort`, per-row labels | Not started | `.legacy-table` CSS exists; sortable-header interactivity and row-selection labeling were not audited/fixed this session. |
| StatusRail / MetricStrip / TonalField / RecordRow / PageHeader / CommandHeader / DateRange / Signature / ReportHeader / ReportFooter / FieldActionBar / AdminFilterToolbar | new V5.1 patterns, no canonical component existed | Not started | None of these were built this session; the app's existing equivalents (`.legacy-kpi`, `.legacy-pagehead`, `.cd-*` slice-specific classes) were left as-is. |
| Date/DateTime/DateRange formatting (not strictly a "component" but named in the spec) | governed Riyadh service | **Done** | `lib/dates.ts`; see CHANGED-FILE-INVENTORY.md for adoption scope (8 files, ~34 sites; ~64 sites tracked remaining). |

## Why Tabs wasn't adopted
Modal is now adopted at all 4 known raw-modal call sites. Tabs remains unadopted because the ~6 `role="tab"` usages found were individually audited and are already correct as `<a>`/`<button>` in-page toggles, not a `Tabs.tsx` gap — there is currently no known page that would benefit from adopting it. It stays built and typechecked, ready for the next component that needs real WAI-ARIA tab behavior.
