# 05 — Retirement Ledger

Every file scheduled for deletion. A file is **marked** the moment it is
superseded anywhere, **tracked** while imports remain, and **deleted** only when
its gate clears.

Protocol: `rules/WEB-006-definition-of-done.md` §4.

The banner on line 1 of a marked file, exact form:

```
/* @retiring 2026-08-06 · replaced-by components/saqeel/surface/Card · pending /operations,/factories · delete-when 0-imports */
```

`gate:retirement` fails if a banner has no row here, or a row has no banner.

---

## Marked — awaiting deletion

| File | Replaced by | Marked | Pending routes | Gate |
| --- | --- | --- | --- | --- |
| `app/(app)/visits/[id]/DualStateRibbon.tsx` (97 lines) | `components/visits/visit-detail/visit-lifecycle-ribbon` | 2026-08-12 | none | 0-imports **reached** — awaiting one e2e run |
| `app/(app)/visits/[id]/FocusScroll.tsx` (12 lines) | `components/visits/visit-detail/visit-detail` — the return reason is now a governed notice above the fold, so nothing needs scrolling to | 2026-08-12 | none | 0-imports **reached** — awaiting one e2e run |
| `app/(app)/planning/immediate/AuthorityBar.tsx` (95 lines) — **DELETED 2026-08-11 (T-054)** | `components/sections/planning-immediate/dispatch-protections` | 2026-08-11 | none | 0-imports **cleared** — its only importer was rewired in the same change, so it was deleted rather than banner-marked |
| `app/(app)/visits/calendar/CalendarBoard.tsx` (203 lines) | `components/sections/visits/visit-calendar/visit-calendar` | 2026-08-12 | **none — zero importers** | 0-imports **reached** — awaiting one e2e run |
| `components/ShellClient.tsx` (46 KB, 840 lines) | `components/app-shell/app-shell` | 2026-08-07 | `/admin/execution`, `/admin/dashboard-config` | 0-imports |
| `components/Shell.tsx` (16 KB, 251 lines) | `components/app-shell/shell-page-frame/shell-page-frame` | 2026-08-07 | `/admin/execution`, `/admin/dashboard-config`, plus 55 route files still importing the default `Shell` page-frame export | 0-imports |
| `components/ShellNavIcon.tsx` (3 KB, 36 lines) | `components/saqeel/icon/icon` | 2026-08-07 | `/field` (`components/field/FieldShellDrawer.tsx`) | 0-imports |
| `app/(app)/operations/sections/operations-details.tsx` (29 lines) | `design/final-cut/saqeel-revamp.html` | 2026-08-08 | `e2e/web-admin-m3-operations.spec.ts` (readFileSync composition assertion) | 0-imports |
| `app/(app)/visits/VisitsBoard.tsx` (707 lines) | `components/sections/visits/visit-board/visit-board` | 2026-08-09 | **none — zero importers** | 0-imports |
| `app/(app)/admin/compliance-approvals/**` (page, layout, loading, error) | `app/(app)/compliance/approvals` | 2026-08-10 | **none — `middleware.ts` rewrites this path unconditionally, so the segment never runs** | 0-imports |
| `app/(app)/admin/_components/AdminDestinationFrame.tsx` | `components/app-shell/shell-page-frame/shell-page-frame` | 2026-08-16 | `/admin/integrations`, `/admin/risk` — **`/admin/access` (T-122), `/admin/localization` (T-123) and `/admin/packages` (T-124) migrated** | 0-imports |
| `components/ContextualAiPanel.tsx` (76 lines) | `components/sections/ai/ai-advisory/ai-advisory` | 2026-08-10 | `/factories/[id]`, `/factories/cr/[id]`, `/field/factory-360/[id]`, `/field/inspection/[id]`, `/field/[visitId]`, `sections/visits/visit-ai-summary` — **6 of 7 consumers remain**; `/planning/bulk` migrated | 0-imports |

`VisitsBoard.tsx` is the **only** row whose `pending` list is empty. It is still
not deletable: WEB-006 §4's gate also requires a green e2e suite on the
replacement route and one demo cycle, and `cd-026-visit-management.spec.ts` /
`ai-user-journey.spec.ts` still assert against its DOM (`table.sq-table`, the
view-switcher `role="group"`). Update those specs, run them green, then delete —
that removes ~707 lines and the last `sq-table`/`sq-lozenge` use on the list
route.

**Read the `pending` lists before assuming T-004 finished the job.** None of the
three shell files is close to deletion:

- `ShellClient` is off every `(app)` route but still renders the chrome on the
  two `/admin/*` layouts that sit **outside** the `(app)` route group
  (`app/admin/execution/layout.tsx`, `app/admin/dashboard-config/layout.tsx`).
  They import the named `AppShell` export from `Shell.tsx`, which renders
  `ShellClient`. Migrating those two layouts is what empties this row.
- `Shell.tsx` has **two** exports with different fates. The named `AppShell` is
  superseded by `components/app-shell/app-shell`. The **default** `Shell` export
  is the per-route page-header/content frame and is imported by 55 files under
  `app/(app)/**`; it is superseded by `shell-page-frame`, and T-004 was
  explicitly forbidden from touching those pages. Each future screen migration
  swaps one `Shell` for one `ShellPageFrame`.
- `ShellNavIcon` is untouched by T-004 and stays until the field shell migrates.

---

## Queued for marking

These are known duplicates or violations. They get their banner the moment the
task that supersedes them lands.

| File | Size | Superseded by | Task |
| --- | --- | --- | --- |
| `app/icons.tsx` | 11 KB | `components/saqeel/media/Icon` + registry | T-001 |
| `components/ShellClient.tsx` | 46 KB | server-first shell | T-010 |
| `components/Shell.tsx` | — | server-first shell | T-010 |
| `components/ShellNavIcon.tsx` | — | `Icon` | T-001 |
| `components/Accordion.tsx` | — | `saqeel/data/Accordion` | T-002 |
| `components/Modal.tsx` | — | `saqeel/feedback/Modal` | T-002 |
| `components/Skeleton.tsx` | — | `saqeel/feedback/Skeleton` | T-002 |
| `components/Spinner.tsx` | — | `saqeel/feedback/Skeleton` (skeletons, not spinners) | T-002 |
| `components/Tabs.tsx` | — | `saqeel/navigation/Breadcrumb`→`Tabs` | T-002 |
| `components/Toast.tsx` | — | `saqeel/feedback/Toast` | T-002 |
| `components/EmptyState.tsx` | — | `saqeel/feedback/EmptyState` | T-002 |
| `components/Pagination.tsx` | — | `saqeel/navigation/Pagination` | T-002 |
| `components/CreatedToast.tsx` | — | `saqeel/feedback/Toast` | T-002 |
| `components/FieldTabs.tsx` | — | `Tabs` driven by `searchParams` | T-023 |
| `app/(app)/field/inspection/[id]/Workspace.tsx` | 136 KB | composition of Saqeel + inspection components | T-024 |
| `app/(app)/field/[visitId]/Startup.tsx` | 85 KB | server-first field startup | T-023 |
| `app/(app)/dashboard/DashboardView.tsx` | 45 KB | server-first dashboard | T-011 |
| `app/(app)/planning/bulk/review/ReviewClient.tsx` | 53 KB | server-first bulk review | T-021 |
| `app/saqeel-runtime.css` | 170 KB | per-component CSS Modules | T-032 (progressive) |
| `app/saqeel-components.css` | 50 KB | per-component CSS Modules | T-032 (progressive) |
| `app/v2-components.css` | — | superseded sheet | T-032 |

---

## Retired — deleted, kept here as history

| File | Deleted | Replaced by | Bytes removed |
| --- | --- | --- | --- |
| `components/sections/planning/planning-filter-bar` (11.4 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~11.4 KB |
| `components/sections/planning/planning-quick-actions` (2 files, 6.8 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~6.8 KB |
| `components/sections/planning/planning-visit-table` (5.2 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~5.2 KB |
| `features/planning/assistant-view.ts` (4.4 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~4.4 KB |
| `components/sections/planning/planning-recommendations` (3.9 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~3.9 KB |
| `components/sections/planning/planning-ai-advisory` (2.7 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~2.7 KB |
| `components/sections/planning/planning-insights` (2.1 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~2.1 KB |
| `components/sections/planning/planning-assistant` (1.4 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~1.4 KB |
| `components/sections/planning/planning-stat-cards` (1.0 KB) | 2026-08-12 | nothing — dead parallel tree, zero importers (T-077) | ~1.0 KB |
| `app/(app)/admin/regulations/RouteContract.tsx` (121 lines) | 2026-08-09 | nothing — never imported by any route | ~4.6 KB |
| `app/(app)/admin/regulations/m6-library.module.css` (67 lines) | 2026-08-09 | colocated SAQEEL modules under `sections/regulations/**` | ~1.7 KB |
| `app/(app)/admin/regulations/Controls.tsx` (71 lines, was 314) | 2026-08-10 | `regulations/record/regulation-lifecycle` | ~2.6 KB |
| `app/(app)/compliance/LibraryTabs.tsx` (39 lines) | 2026-08-10 | `SegmentedControl` + `tab` in `searchParams` | ~1.3 KB |
| `features/regulations/dossier-source.ts` (100 lines) | 2026-08-10 | `features/regulations/record-source.ts` | ~3.4 KB |
| `components/sections/regulations/regulation-workspace` (116 lines) | 2026-08-10 | `regulations/workspace/**` | ~5.2 KB |
| `components/sections/regulations/regulation-dossier` (193 lines) | 2026-08-10 | `regulations/record/regulation-record` | ~9.1 KB |
| `app/(app)/admin/violations/Controls.tsx` (190 lines) | 2026-08-10 | nothing — every form sat behind `canConfigure = false` | ~7.8 KB |
| `app/(app)/admin/violations/Controls.module.css` (40 lines) | 2026-08-10 | colocated modules under `sections/enforcement/**` | ~0.9 KB |
| `app/(app)/admin/violations/actions.ts` (45 lines) | 2026-08-10 | nothing — only `Controls` called it | ~1.8 KB |
| `components/planning/planning-buckets/planning-buckets.module.css` (72 lines) | 2026-08-11 | `saqeel/stat-card` + `saqeel/card`'s `CardGrid` | ~1.4 KB |
| `components/sections/planning-bulk/bulk-ai-advisory` (39 lines) | 2026-08-14 | nothing — owner-directed removal of the AI planning summary from `/planning/bulk` | ~1.2 KB |
| `app/(app)/execution/RevampExecutionWorkspace.tsx` (397 lines) | 2026-08-14 | `components/sections/execution/**` — workspace · calendar · toolbar · table · dialog · two dialog bodies | ~17 KB |

**`bulk-ai-advisory` removes a contracted capability, not just a widget.** It
rendered `MVP1-M01-016` / `MVP1-M01-026` ("AI Planning Summary", **MVP1
Mandatory** in `domain/atomic_scope.csv` rows 17 and 27), accepted as `AC-0016` /
`AC-0026`. Those rows sit under change ticket
`CC-AC-0016-0026-AI-PLANNING-SUMMARY-DEFERRAL-001` (`DEC-026`), whose status is
**OPEN** and whose `scope_forbidden` states that no code change is authorized by
that ticket alone. The removal was directed by the owner in session and executed;
the change record is owed. `AC_LEDGER.csv` still marks both rows `implemented`
and now overstates the build.

Deleted with it: `buildAdvisoryStrings` (`features/planning-bulk/strings.ts`),
`planningAiContext` (`features/planning-bulk/targeting.ts`), and the `bulk.ai`
block from `i18n/locales/{en,ar}/planning.json` — all had this component as their
only consumer. `components/ai/advisory-strip` **survives**: `executive-brief` and
`factory-ai-advisory` still compose it.

**Contract coverage lost.** Two spec blocks were deleted rather than re-pointed,
because the behaviour they assert no longer exists:
`e2e/ai-user-journey.spec.ts` (the planner journey: `planning_summary-panel`, the
generate button, the "never selects, ranks or publishes anything" governance
line) and the first test in `e2e/ai-delta-contract.spec.ts`. **The second was
already failing** — it asserted `ContextualAiPanel` and `AC-0016` inside
`bulk/page.tsx`, strings that moved to `bulk-screen.tsx` in an earlier refactor.

---

## Running total

| | |
| --- | --- |
| Files marked | 8 (4 shell/visits pre-dating this work, 4 in the unreachable `/admin/compliance-approvals` segment) |
| Files deleted | 13 |
| Source bytes removed | ~37 KB deleted outright; ~2,870 source lines rewritten out of the compliance and enforcement screens (T-036…T-041); 243 net lines off `/planning` (T-053) |
| CSS bytes removed from legacy sheets | ~4.0 KB (`m6-library.module.css` T-036, `violations/Controls.module.css` T-041, `planning-buckets.module.css` T-053) |

Update this table in every session that deletes anything. It is the clearest
single measure of whether the redesign is actually reducing the surface area or
merely adding to it.
