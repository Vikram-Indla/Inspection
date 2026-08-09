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
| `components/ShellClient.tsx` (46 KB, 840 lines) | `components/app-shell/app-shell` | 2026-08-07 | `/admin/execution`, `/admin/dashboard-config` | 0-imports |
| `components/Shell.tsx` (16 KB, 251 lines) | `components/app-shell/shell-page-frame/shell-page-frame` | 2026-08-07 | `/admin/execution`, `/admin/dashboard-config`, plus 55 route files still importing the default `Shell` page-frame export | 0-imports |
| `components/ShellNavIcon.tsx` (3 KB, 36 lines) | `components/saqeel/icon/icon` | 2026-08-07 | `/field` (`components/field/FieldShellDrawer.tsx`) | 0-imports |
| `app/(app)/operations/sections/operations-details.tsx` (29 lines) | `design/final-cut/saqeel-revamp.html` | 2026-08-08 | `e2e/web-admin-m3-operations.spec.ts` (readFileSync composition assertion) | 0-imports |

**Read the `pending` lists before assuming T-004 finished the job.** None of the
three is close to deletion:

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
| _(none yet)_ | | | |

---

## Running total

| | |
| --- | --- |
| Files marked | 0 |
| Files deleted | 0 |
| Source bytes removed | 0 |
| CSS bytes removed from legacy sheets | 0 |

Update this table in every session that deletes anything. It is the clearest
single measure of whether the redesign is actually reducing the surface area or
merely adding to it.
