# 2026-08-17 · T-148 — `/field/reports` (submitted-report library) migrated off the parallel design system

`task: T-148` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/reports` surface — the submitted-report library list and its
inline immutable-document detail — onto SAQEEL primitives and the approved Linear
language. The library reads only immutable submission versions and shares the
offline submitted-report cache, so the list and the detail panel migrate as one
task. `[id]/page.tsx` stays the thin governed redirect to the canonical report
reader and is not a UI surface.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/reports/page.tsx` | rebuilt as a route file | 173 → **11** |
| `app/(app)/field/reports/loading.tsx` | rebuilt — SkeletonRegion, no `<main>` | 13 → **15** |
| `app/(app)/field/reports/[id]/page.tsx` | comment stripped; thin redirect kept | 12 → **9** |
| `features/field-reports/queries.ts` | created — list load, narrowing from `unknown` | 114 |
| `components/sections/field-reports/reports-screen.tsx` | created | 54 |
| `…/reports-library.tsx` | created (client) — tabs + list + offline cache | 150 |
| `…/report-document.tsx` | created (client) — the inline document detail | 120 |
| `…/reports-connectivity.tsx` | created (client) — token-clean connectivity leaf | 39 |
| `…/reports.module.css` | created — token-only | 139 |
| `i18n/locales/{en,ar}/field-reports.json` | created — new namespace | 40 each |
| `i18n/messages.ts` | registered `fieldReports` | +4 |
| `app/(app)/field/reports/ReportsLibrary.tsx` | **deleted** | 213 → 0 |
| `app/(app)/field/reports/ReportsConnectivity.tsx` | **deleted** | 13 → 0 |
| `app/(app)/field/reports/reports.module.css` | **deleted** | 305 → 0 |
| `e2e/pixel/manifest.ts` | files descriptor re-pointed to the new locations | — |

## Decisions

**The `as unknown as Visit` cast is gone; the flattening narrows from `unknown`.**
The old page mapped `row.visits as unknown as Visit` and reached through `!`
non-null chains (`visit.inspections!.submission_versions`). `queries.ts` now
narrows with `isRecord`/`unwrap`/`asArray`/`asString`/`asNumber` — one
`toReport(visitValue: unknown, cachedAt)` picks the latest submission version and
returns a validated `CachedSubmittedReport` or `null`. No `as unknown as`, no `!`.

**The duplicate `<main>` was fixed** — same bug as T-144/T-146. The old page
rendered `<main className={styles.wrap}>` inside the AppShell's `<main>`; the
rebuild is a Server-Component `header` + `<div className={styles.page}>`.
Browser-verified `main` count 1 on the empty state.

**The 213-line client was split under the 200-line ceiling.** `ReportsLibrary`
(state + tabs + records list + the full detail panel) became `reports-library`
(150 — state, `SegmentedControl` tabs, `ListRows`/`ListRow` records) plus
`report-document` (120 — the opened/unavailable document, its `dl`, answers and
notes sections, download/print actions).

**The `let active` unmount guard became a `useRef`.** `let` is banned in `.tsx`;
the async cache-merge effect now guards with `cancelled = useRef(false)`, set
`true` in cleanup. Same semantics, no `let`.

**Legacy `FieldConnectivityBanner` was dropped, not reused.** The shared banner is
frozen legacy — `sq-banner`, `var(--space-3)`, a literal `border-radius: 14`. It
is used by no migrated screen. `ReportsConnectivity` is a fresh token-clean leaf
that consumes the same `connectivityState(navigator.onLine, effectiveType)` util
and renders a `Text tone="warning"` on the `--sqx-status-warning-soft` surface,
so both the offline and weak states survive.

**Status is a `StatusPill`, never a bare badge.** The old `badge badge-completed`
/ `badge-warning` spans became a `StatusPill` (`success` = signed, `warning` =
submitted) with a text label — status by text + shape, WEB-002 §5.

**`force-dynamic` was dropped.** The old page declared `export const dynamic =
"force-dynamic"`; the authenticated layout already infers dynamic rendering from
the cookie-scoped auth (the K-002 lesson from T-138), so it was redundant.

**`[id]/page.tsx` kept as the thin governed redirect.** It validates the UUID and
`redirect`s to `/reports/inspection/[id]` — the one governed projection of the
immutable report. Only the zero-comment rule touched it (the governance note was
a `//` block); the delegation is unchanged, so snapshot / acknowledgement /
submitted_at can never drift into a second projection.

## Inventory taken before writing code

- **State/effects:** the list's client pieces are the offline-cache island and
  the connectivity island (both the sanctioned external-sync `useEffect`); the
  screen and both route pages are Server Components.
- **Copy:** a ~30-key `strings` object was built twice (error branch + normal
  branch) via a local `tr(key, en, ar)` helper, both languages inlined. All moved
  to a new `field-reports` namespace read once through `getMessages(locale)`.
- **`<svg>` → icons:** back chevron → `previousPage`; the row file glyph →
  `forms`; the `×` close → `dismiss` (`IconButton`); the download used a plain
  anchor + `export` icon. The `›` open affordance was dropped — `ListRow` carries
  its own affordance and the accent "Open document" label states the action.
- **Accessibility failures found:** no `h1` (FieldHeader title was a `<div>`); the
  detail `<h2>`/`<h3>` were plain tags; the version marker was a `badge` span; the
  close control was a `×` text button. Now `h1` on the screen, `1 > 2 > 3` in the
  document, `StatusPill` markers, and an `IconButton` close with a label.

## Numbers

```
Route: /field/reports  (+ /field/reports/[id] governed redirect, unchanged)
route files           173 + 13 → 11 + 15
components ≤ 200      max component 150 (reports-library); queries.ts 114 (feature, < 400)
client islands        1 → 2  (offline cache + connectivity; both external-sync)
raw <svg>             3 → 0
duplicate <main>      1 → 1 → 0 (shell owns it)
headings              0 → 1 (screen) / 1>2>3 (document)
rendered sizes        off-scale → 13·15·20
weight cap            700 → 590
hardcoded copy        ~30 tr() sites (×2 branches) → 0
typography gate       11 owned violations → 0   (baseline 1243 → 1232)
eslint baseline       7466 → 7450 (16 removed)
design-system-v5      67 → 64 (raw svgs / legacy classes removed with old files)
source lines deleted  531 (ReportsLibrary 213 + ReportsConnectivity 13 + stylesheet 305)
```

## Accessibility

- **Empty state browser-verified** (English / dark): `main` count 1, the header
  `h1` present, hairline `Card` empty state, no console errors, no hydration
  warning.
- **Found and fixed:** the missing `h1`; the duplicate `<main>`; the bare status
  badges; the `×` text close.
- Manual checklist: keyboard ✓ (empty state) · Arabic/RTL — namespace complete,
  logical properties throughout, `dir="auto"` on factory/inspector/answer text ·
  dark ✓. The seeded inspector has **no submitted reports**, so the populated
  `SegmentedControl` + `ListRow` records and the full `report-document` panel were
  verified by typecheck rather than live data. **Populated list + detail, axe,
  light theme, 200 % zoom, Arabic render, browser e2e still owed.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (relocked 7466 → 7450, 16 removed)
- [x] `npm run gates:typography` — PASSED (relocked 1243 → 1232, 11 removed)
- [x] `npm run check:design-system-v5` — **64** (was 67); field-reports adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] runtime: `/field/reports` renders the empty state, single `<main>`, no console errors
- [ ] populated list + document panel, axe, light theme, 200 % zoom, Arabic, browser e2e — still owed

## Retirement

Deleted at zero imports: `ReportsLibrary.tsx` (213), `ReportsConnectivity.tsx`
(13), the old route-level `reports.module.css` (305) — **531 lines**. The
`reports/` folder is now `page.tsx` + `loading.tsx` + `[id]/page.tsx`; all logic
lives in `features/field-reports/` and `components/sections/field-reports/`.

## Parked

- The seeded inspector has no submitted reports; a browser pass over a populated
  library (tabs, records, the inline document with answers/notes/download/print)
  is owed when a submitted record is available.
- The remaining `/field` surfaces: `settings` (+ devices, readiness, conflicts),
  `feedback`, the `*-reports` enforcement screens, then the two large execution
  screens (`[visitId]` startup, the 1,991-line `inspection/[id]/Workspace`).
- Cross-cutting: the `Button` mirror gap (T-052/T-140/T-141), field-pill
  pluralisation (T-141).

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild submitted-report library on saqeel primitives
```

## Next

`settings`, then the enforcement `*-reports` screens and the two large execution
screens — `[visitId]` startup and the 1,991-line `inspection/[id]/Workspace`.
