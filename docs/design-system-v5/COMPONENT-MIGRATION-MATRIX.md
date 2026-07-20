# Component Migration Matrix — Saqeel V5.1

| Component | V5.1 spec status | Status this session | Notes |
|---|---|---|---|
| Button | tokens updated (action typography, loading-visible, radius) | Done at CSS level | `.ax-btn*` classes in `astryx.css`; no React wrapper existed or was added — usage stays class-based, which is the existing app convention. |
| Field / Input / Select / Textarea | tokens updated (label typography, radius 6px) | Done at CSS level | Same — class-based. |
| Search | canonical SVG icon | Done | `.ax-search::before` now mask-based, self-suppresses if `<Icon name="search">` already present. |
| Segmented / Tabs (CSS) | action typography | Done at CSS level | `.ax-segmented button`, `.ax-tabs [role=tab]` font updated. |
| Tabs (React, WAI-ARIA behavior) | roving tabindex, arrow keys, RTL-aware | **New** `components/Tabs.tsx` built | Not yet adopted by any existing page — the ~6 `role="tab"` call sites found (DashboardView, admin/violations, Workspace, StoryPanel, DualStateRibbon) were audited and found to already be in-page content toggles using `<a>`/`<button>` correctly, not route-nav misuse; migrating them to the new component is tracked, not done. |
| Modal | focus trap/restore, Escape, scroll lock | **New** `components/Modal.tsx` built | Not yet adopted. 4 existing raw `.ax-modal` call sites found (SignaturePad, Workspace, FactoryVerification, ImageAnnotator); migration deferred — SignaturePad is a governed signature-capture flow and wasn't touched under time pressure. |
| Drawer | same as Modal | Not started | No shared Drawer component exists; not built this session. |
| Pagination | action typography | Done at CSS level | An existing `components/Pagination.tsx` React wrapper already exists (not modified — only the CSS font token changed). |
| DataTable | sort button semantics, `aria-sort`, per-row labels | Not started | `.ax-table` CSS exists; sortable-header interactivity and row-selection labeling were not audited/fixed this session. |
| StatusRail / MetricStrip / TonalField / RecordRow / PageHeader / CommandHeader / DateRange / Signature / ReportHeader / ReportFooter / FieldActionBar / AdminFilterToolbar | new V5.1 patterns, no canonical component existed | Not started | None of these were built this session; the app's existing equivalents (`.ax-kpi`, `.ax-pagehead`, `.cd-*` slice-specific classes) were left as-is. |
| Date/DateTime/DateRange formatting (not strictly a "component" but named in the spec) | governed Riyadh service | **Done** | `lib/dates.ts`; see CHANGED-FILE-INVENTORY.md for adoption scope (8 files, ~34 sites; ~64 sites tracked remaining). |

## Why Modal/Tabs were built but not adopted everywhere
Building the primitive is a contained, verifiable, low-risk change (new file, typechecked, no existing behavior touched). Migrating each of the ~10 existing call sites is a page-by-page change with its own regression risk — several touch governed workflows (signature capture, factory verification, evidence annotation). Per CLAUDE.md's "never mark a page or component complete without runtime behavior, negative paths, tests, and evidence," those migrations need their own dedicated pass with real test coverage, not a rushed sweep. This is recorded as the intentional boundary of this session's Wave 2, not a silent gap.
