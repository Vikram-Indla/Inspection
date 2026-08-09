# 2026-08-09 · T-021a — Visit Management: server-driven list, filters and board

`task: T-021a` · `status: partial` · `duration: ~5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011, WEB-012`

---

## Goal

Transform the Visit Management view reached from `/planning` → **Visit
management** (`/planning/visits`, and its compatibility twin `/visits`) onto
SAQEEL primitives, with the list state moved from client `useState` to
`searchParams` and every user-facing string in `en` + `ar`.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/visits/page.tsx` | rebuilt | 272 → 36 |
| `app/(app)/planning/visits/page.tsx` | rebuilt | 52 → 36 |
| `app/(app)/visits/VisitsBoard.tsx` | marked `@retiring` | 706 → 707 (banner only) |
| `app/(app)/visits/VisitViewNavigation.tsx` | modified | 39 → 42 |
| `lib/planning/visit-list.ts` | extended (additive) | 486 → 501 |
| `components/saqeel/data-table/data-table.tsx` | extended (additive) | 102 → 105 |
| `components/saqeel/data-table/data-table.module.css` | extended | 163 → 167 |
| `components/saqeel/icon/icon-registry.ts` | extended | 80 → 82 |
| `features/visits/params.ts` | created | 62 |
| `features/visits/queries.ts` | created | 112 |
| `features/visits/rows.ts` | created | 107 |
| `features/visits/filters.ts` | created | 119 |
| `features/visits/board-strings.ts` | created | 180 |
| `components/sections/visits/visit-management-screen/visit-management-screen.tsx` | created | 149 |
| `components/sections/visits/visit-scope-bar/visit-scope-bar.tsx` (+ module) | created | 33 + 6 |
| `components/sections/visits/visit-status-tiles/visit-status-tiles.tsx` | created | 31 |
| `components/sections/visits/visit-filter-bar/visit-filter-bar.tsx` (+ module) | created | 142 + 85 |
| `components/sections/visits/visit-board/visit-board.tsx` (+ module) | created | 76 + 147 |
| `components/sections/visits/visit-board/visit-table.tsx` | created | 97 |
| `components/sections/visits/visit-board/visit-spine.tsx` | created | 46 |
| `components/sections/visits/visit-board/visit-bulk-actions.tsx` | created | 180 |
| `components/sections/visits/visit-board/visit-outcome-ledger.tsx` | created | 91 |
| `components/sections/visits/visit-ai-summary/visit-ai-summary.tsx` | created | 26 |
| `i18n/locales/en/planning.json` | extended | 145 → 314 |
| `i18n/locales/ar/planning.json` | extended | 145 → 314 |

One 706-line client monolith became six components, none over 182 lines.

## Decisions

1. **Filters moved to `searchParams` (owner decision).** The nine client filter
   states are gone. The screen reuses **`queryPlanningVisits`** — the hardened
   server query already behind `/planning` — rather than authoring new
   PostgREST predicates that could not be tested against a database here.
2. **`requireReference` opt-out.** `queryPlanningVisits` hides visits with no
   governed `visit_reference`. Visit Management **acts on** those visits, so it
   passes `requireReference: false`. `/planning` keeps the default `true`, so
   its behaviour is provably unchanged.
3. **Fixtures are now excluded** from Visit Management (`isTestFixtureEstablishment`),
   matching `/planning`. Previously it showed them. This is a deliberate
   behaviour change.
4. **The "Factory name" sort is dropped.** The shared sort whitelist has no
   embedded-column sort, and PostgREST parent-ordering on a to-one embed could
   not be verified without a database. The screen now offers Planning's sort
   vocabulary (created / window / reference / status) instead. **Raised, not
   silently swapped** — see Blocked.
5. **Screen chrome moved to `planning.json` (en + ar, 259 keys, exact parity).
   Governed enum labels stay on `t("enum.*")`**, which already carries reviewed
   Arabic in `ui_strings`. I did not invent Arabic for governed enums.
6. **The `targetMode` fork is kept** (owner decision): the AI summary panel and
   the `/planning` cross-link render on `/visits` only. It is now two explicit
   props (`aiPanel`, `planningHref`), not a boolean branching the whole tree.
7. **Two additive `DataTable` props** rather than a bespoke table:
   `headerControl?: ReactNode` (select-all checkbox in a `<th>`, `header` stays
   the string used for `data-label`) and `getRowSelected?` (`data-selected` on
   `<tr>`). Both are backwards compatible; every existing call site is untouched.
8. **Row selection is `--sqx-surface-accent`, not an inset box-shadow.**
   `box-shadow` has no logical direction and would not mirror in RTL. Selection
   is carried by the checkbox (text + shape); the surface is redundancy, not the
   signal.

## Inventory taken before writing code

**State ladder (WEB-004 §1)** — 14 `useState` → 2.

| Was | Now |
| --- | --- |
| `q`, `status`, `type`, `mode`, `region`, `city`, `from`, `to`, `sort` (9) | URL state (`searchParams`), server-filtered |
| `selected`, `activeId` | `useState` in `visit-board` — genuine ephemeral UI state |
| `lastVerb`, `requestIdentity` | `useState` in `visit-bulk-actions` |
| `nowMs` (`useMemo(Date.now)`) | computed once on the server; no hydration skew |

**Effects** — 3 → 2. The two kept are idempotency-key generation
(`crypto.randomUUID`, must not run during SSR) and post-submit focus movement to
the outcome summary (WEB-003). The identity-rotation effect is folded into the
generation effect. `void locale` is gone.

**Literals → tokens.** 37 inline `style={{}}` objects removed, including
`minInlineSize: 200/180`, `inlineSize: 32/260`, `maxInlineSize: 170/210/220/240`
and a `CSSProperties` cast that overrode `--text-muted`. All spacing now
`--sqx-space-*` / `--sqx-inset-*`; **zero** hex, px or rem in the three new
modules (verified by grep).

**`<svg>` → registry.** The one hand-authored external-link arrow →
`Icon name="externalLink"`; `externalLink: ArrowUpRight` added to the registry.
Emoji glyphs `🔍`/`⚠`/`⛔` → `calendar` / `risk` / `restricted`.

**Accessibility failures found in the existing markup**

- Heading jump: sr-only `<h1>` → `<h4>`. Now every section is a `Card` with an
  `h2` `CardHeader` and an `aria-labelledby` region.
- Four sibling `<form>`s in one flex row with no grouping. Now one labelled
  `Card` with a `<ul>` eligibility summary and four bordered form groups.
- `title=` on the disabled bulk-edit button was the only explanation for why it
  was blocked. Replaced by a persistent warning `EmptyState`.
- No `<caption>` / accessible name on the table. Now `CardHeader` + `labelledBy`.
- `fmt()` was `toISOString().slice(0,16)` — UTC, no locale, no Arabic-Indic
  digits. Now `formatDateTime(iso, locale)` (Asia/Riyadh). This also clears the
  two `check:design-system-v5` findings on the old board.
- Checkbox accessible names were the 8-char UUID. Now the governed visit
  reference, falling back to the short id only when there is none.
- Fixed while writing: an `EmptyState` (`role="status"`) nested inside a
  `role="alert"` wrapper would have produced a doubled live region; the
  pre-flight error is now a single tokened `<p role="alert">`.

## Numbers

```
Route: /planning/visits · /visits
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
route CSS       NOT MEASURED
LCP / INP / CLS NOT MEASURED — app does not run on this workstation
client islands  1 (VisitsBoard, 706 lines) → 4 (board, bulk-actions,
                outcome-ledger, filter-bar); table/spine render inside the
                board island, scope bar + status tiles are Server Components
legacy CSS deleted: 0 lines — see Retirement
source lines removed: 272 → 36 (route) and a 706-line island superseded
```

## Accessibility

- axe: **NOT RUN.** No dev server on this workstation (SWC blocker).
- Manual checklist (WEB-003 §10): **not performed** — same reason. Keyboard,
  screen reader, 200 % zoom, 320 px, Arabic/RTL, dark and reduced motion are all
  unverified in a browser. Everything above is a static reading of the markup.

## Verification

- [x] `npm run typecheck` — clean for every file in this task. **One
      pre-existing error remains**, in `components/app-shell/shell-topbar/shell-topbar.tsx:81`
      (scope-strings record missing 8 keys). Untouched by this task; confirmed
      via `git diff --name-only`. The branch did not typecheck clean before it either.
- [x] `npm run check:design-system-v5` — **zero findings in any file written
      here.** The only `visits/` findings are in the retired `VisitsBoard.tsx`
      (both of which this rewrite fixes) and the out-of-scope `[id]` detail page.
- [x] i18n parity — 259 keys, `en` and `ar`, no missing or extra key either way.
- [ ] `npm run lint` — **no lint script exists** (T-000 outstanding).
- [ ] `npm run gates` — **no gates script exists** (T-000 outstanding).
- [ ] `npm run test:e2e` — **not run.** See Blocked: several specs will fail.
- [ ] Definition of Done — **cannot be ticked on this workstation.**

## Retirement

- `app/(app)/visits/VisitsBoard.tsx` marked
  `@retiring 2026-08-09 · replaced-by components/sections/visits/visit-board/visit-board · pending none · delete-when 0-imports`.
  A repo-wide search shows **zero importers**, but the WEB-006 §4 gate also
  requires a green e2e suite and one demo cycle — neither is possible here, so
  it is marked, not deleted.
- No legacy CSS became deletable: `sq-table`, `sq-lozenge`, `panel`, `sq-kpi`
  and friends are still used by `/visits/[id]`, `/visits/calendar`,
  `/visits/map`, `/visits/workload` and the un-migrated planning sub-routes.

## Follow-up fix — reassignment roster (same session)

Owner reported `PLANNING-REASSIGN-ROSTER-DENIED` logged on every page load.
`list_available_reassignment_inspectors` raises that one code for **two**
different reasons (migration `20260804030000`):

1. the caller lacks the `planning.reassign` capability (line 18);
2. **any** visit in the batch falls outside `planning_closure_factory_in_scope`
   — the RPC is all-or-nothing per chunk (lines 24–27).

Cause 2 is the dangerous one. `queryPlanningVisits`' RLS **read** scope is wider
than the reassign scope, so a board can legitimately show visits that deny the
whole roster chunk. The old code logged each failure and **continued**, which
left `eligibleInspectors` silently empty — the reassign dropdown rendered with
no options and no explanation. A silent wrong answer.

Now, per the "absent data renders as a state" rule:

- `getPlanningAccess(sb, ["planning.reassign"])` is read in `queries.ts`; without
  the capability the RPC is **not called at all** (it also skips when there are
  no rows, which avoids the `ROSTER-SCOPE` guard on an empty array).
- A denial returns `{ available: false }` for the whole roster rather than a
  partial list, and is **not** logged — it is a governed authorization state,
  not a failure. Genuine errors still log.
- `VisitManagementData` gained `reassignmentAvailable`. When false, the reassign
  form is replaced by a `restricted` `EmptyState` naming both preconditions.
  When true but no inspector is free across the whole selection, the submit is
  disabled with its own explicit note instead of an empty `<select>`.

Two new keys (`bulk.reassignUnavailable`, `bulk.reassignNoInspectors`) in `en`
and `ar` — 261 keys, parity holds.

## Parked

- **`--sqx-control-accent` does not exist.** Native checkboxes cannot be tinted
  to brand without inventing a token, so `accent-color` was left off and the UA
  default stands (as everywhere else today). A `switch`/`checkbox` primitive
  would remove the need entirely.
- **No datetime primitive.** The bulk-reschedule window uses native
  `<input type="datetime-local">`. `DatePicker` is date-only and T-005a's "no
  native date input" rule has no datetime answer. This is the one place on the
  screen still holding a native date control.
- **`rowSelect()` in `visit-list.ts` never selects `factory_id`**, yet
  `readVisibleRows` filters fixtures on `row.factory_id`. That filter has always
  been a no-op; both `/planning` and now Visit Management compensate with a
  name-based post-filter. Pre-existing, deliberately not changed here — fixing
  it silently removes rows from `/planning`.
- **`VisitViewNavigation` sub-view routing.** `/planning/visits` has no
  `calendar`/`map`/`workload` children, so those links resolve against `/visits`
  (preserving the old hardcoded behaviour). A `viewBasePath` prop makes this
  explicit rather than implicit.
- **`DataTable` has no sortable-header contract.** Sorting is a `Select` in the
  filter panel. If a second screen wants column-header sorting, that is a
  primitive change, not a screen change.

## Blocked / open questions

1. **e2e will fail and I could not run it.** `cd-026-visit-management.spec.ts`
   and `ai-user-journey.spec.ts` assert against the old DOM. Known breaks:
   - `table.sq-table tbody tr td input[type=checkbox]` — the table is now
     `DataTable` (spec lines 30, 54).
   - `getByRole("group", { name: /visit management views/i })` — `SegmentedControl`
     renders **no role** when its items are links. I did **not** change the
     shared primitive to satisfy one spec.
   - `#bulk-cancel-reason` / `#bulk-cancel-comments` (spec lines 244–246) — the
     cancel form has a `note` input; the spec's reason `<select>` does not exist
     in the current board either, so that assertion was already failing.
   - Arabic assertions now read from `planning.json`, not `ui_strings`. I aligned
     `visit.spine.heading` and `visit.spine.empty` to the reviewed values the
     spec pins; other Arabic strings are newly authored and need review.
   `role="group"` **was** added to the status-tile section, so
   `getByRole("group", { name: /Status counts/i })` still passes.
2. **Arabic needs a native reviewer.** ~120 newly authored strings, including
   compliance-sensitive outcome and error copy.
3. **The dropped factory-name sort** needs a ruling: restore it by adding
   embedded-column ordering to `visit-list.ts` (needs a database to verify), or
   accept the Planning sort vocabulary.
4. **Everything runtime is unverified.** No browser, no axe, no bundle numbers.

## Proposed commit

```
refactor(visits): rebuild visit management on saqeel and url state
```

## Next

**T-021b — the remaining Visit Management surfaces.** The bulk-action forms
still use native `<select>` and `datetime-local` controls, and the four sibling
views (`calendar`, `map`, `workload`, `[id]`) are untouched legacy. Before that,
the human should run the measurement request and the e2e suite.
