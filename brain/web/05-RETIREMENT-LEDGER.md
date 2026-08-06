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
| _(none yet — T-001 adds the first)_ | | | | |

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
