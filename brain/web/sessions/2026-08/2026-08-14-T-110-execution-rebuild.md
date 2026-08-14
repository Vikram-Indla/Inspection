# 2026-08-14 · T-110 — `/execution` leaves the legacy sheets

`task: T-110` · `status: partial — code complete, every static gate green; axe, e2e and the rendered pass are owed` · `duration: ~4h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011, WEB-012, WEB-013, WEB-014`

---

## Goal

Rebuild `/execution` on Saqeel primitives: delete the hardcoded banner, give the
screen its own skeleton, replace the empty state that leaked the database layer,
and take the 397-line client workspace off the frozen sheets.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/execution/RevampExecutionWorkspace.tsx` | deleted | 397 → 0 |
| `app/(app)/execution/page.tsx` | rebuilt | 80 → 34 |
| `app/(app)/execution/loading.tsx` | rebuilt | 11 → 14 |
| `app/(app)/execution/error.tsx` | rebuilt | 16 → 37 |
| `app/(app)/execution/read-model.ts` | edited — fallback copy moved to the namespace | 130 → 131 |
| `components/sections/execution/execution-workspace` | created | 0 → 165 |
| `components/sections/execution/execution-table` | created | 0 → 99 |
| `components/sections/execution/execution-visit-dialog` | created | 0 → 94 |
| `components/sections/execution/execution-calendar` | created | 0 → 88 |
| `components/sections/execution/execution-toolbar` | created | 0 → 69 |
| `components/sections/execution/execution-reschedule-dialog` | created | 0 → 53 |
| `components/sections/execution/execution-access-state` | created | 0 → 47 |
| `components/sections/execution/execution-dialog` | created | 0 → 38 |
| `components/sections/execution/execution-empty-state` | created | 0 → 36 |
| `components/sections/execution/execution-skeleton` | created | 0 → 35 |
| `features/execution/view.ts` | created | 0 → 108 |
| `features/execution/queries.ts` | created | 0 → 52 |
| `features/execution/types.ts` | created | 0 → 47 |
| `features/execution/labels.ts` | created | 0 → 37 |
| `features/execution/strings.ts` | created | 0 → 36 |
| `i18n/locales/{en,ar}/execution.json` | created | 0 → 137 keys each |
| `i18n/messages.ts` | edited — namespace registered | 57 → 59 |
| `e2e/execution-revamp-accessibility-contract.spec.ts` | re-pointed | 36 → 66 |

## Decisions

**The permanently-hardcoded banner was deleted, not wired up.** `RevampExecutionWorkspace.tsx:212`
rendered *"Submission service unavailable"* **unconditionally** — no query, no
prop, no data source. Every user saw it on every load, forever, styled critical
and announced `role="status"`. Under WEB-002 §9 (*never invent a governed value*)
an unsourced claim is not a degraded state, it is a fabrication. The owner
directed deletion. **If a real submission-health signal exists, this is the place
it should be read** — but inventing one was never the fix.

**A native `<dialog>` replaced the hand-rolled focus trap.** The owner's ruling
was *"if we can do it without directly manipulating the DOM then it's better."*
`showModal()` via a ref callback deletes 35 lines of `useEffect`,
`document.addEventListener`, `querySelectorAll` traversal, first/last focus
arithmetic and `origin?.focus()` bookkeeping. Focus containment, Escape,
background inertness and focus restoration become platform guarantees. **A native
`<dialog>` does not receive an accessible name on its own** — `aria-labelledby`
is wired explicitly to the heading id.

**`showModal()` is the library-handoff exception, not a WEB-012 breach.** There is
no React API for opening a modal dialog; everything the reader sees remains
render output driven by state. Same category as T-081's file-input case.

**The empty state was split by cause, because one message could not serve both.**
The old copy said *"No inspections are available in your scope"* in English and,
in Arabic, *"لا توجد تفتيشات متاحة في هذا العرض المقيّد بسياسات أمان الصفوف"* —
which names **row-security policies**, an implementation detail, and is not a
translation of the English. It is now *nothing is scheduled* (routes to Planning)
versus *nothing matches these filters* (carries the scope count and a clear
action).

**`locale === "ar" ? "ar-SA" : "en-SA"` in `labels.ts:35` is not a rule-18
violation.** It is a BCP-47 tag for `Intl.NumberFormat`, not user-visible copy,
and `lib/dates.ts:21` does the identical thing internally. Recorded so a future
grep does not "fix" it into a bug.

## Inventory taken before writing code

- **State**: six `useState` in one component (view, query, calendarMode, filters,
  reschedule, selected, selectedDetail) plus five refs. Kept as `useState` — all
  are ephemeral view state on rung 5; filters were considered for URL state and
  left local because no spec or link depends on them.
- **Effects**: one — `useDialogFocus`, external synchronisation. **Deleted
  entirely** by moving to native `<dialog>`.
- **Literals**: ~120 `copy(locale, en, ar)` call sites, the banned
  `locale === "ar" ? …` pattern in helper form. All moved to a new namespace.
- **`<svg>`**: none in the workspace; one emoji-as-icon (`🔒`) in `page.tsx`,
  replaced by `EmptyState icon="restricted"`.
- **Dates**: three hand-rolled `Intl.DateTimeFormat` helpers hardcoding `en-GB`,
  plus `.slice(0, 10)` day-key arithmetic on ISO strings. All replaced by
  `lib/dates.ts`; day keys now go through `riyadhDateParts`, which is DST- and
  timezone-safe where the slice was not.
- **Accessibility failures found**: drag-only reschedule (WCAG 2.2 AA 2.5.7);
  `role="status"` on a critical alert; `Shell title=""` leaving the page
  unnamed; filter chips that cycled values with no visible list; `badge badge-*`
  carrying status.

## Numbers

```
Route: /execution
source lines removed     397 (RevampExecutionWorkspace.tsx) + 46 (page.tsx)
source lines added       ~870 across 15 files, none over 165
largest component        397 → 165 lines
route file               80 → 34 lines   (cap 40)
copy() call sites        ~120 → 0
i18n keys                0 → 137 × 2 locales
non-null assertions      6 → 0
as never casts           2 → 0
useEffect                1 → 0
coordinates fact         5 renderings → 1
always-on banners        2 → 0
v5 gate (repo)           105 → 103
v5 findings owned        1 (emoji) → 0
typography gate          PASSED, baseline unchanged
```

**first-load JS, route CSS, LCP, INP, CLS: not measured.** These need a
production compile, which WEB-008 §15 forbids the agent from running. **Handed
back as a measurement request** (WEB-005 §8).

## Accessibility

- **axe: not run.** The route is auth-gated and the session has no seeded
  supervisor login. **Owed.**
- **Manual checklist (WEB-003 §10): not performed** — keyboard · screen reader ·
  200% zoom · 320px · Arabic/RTL · dark · reduced motion · greyscale. **All owed.**
- **Found and fixed by construction:**
  - **WCAG 2.2 AA 2.5.7 Dragging Movements** — every calendar entry now carries a
    Reschedule button, so the drag is no longer the only path.
  - The page had **no accessible name until hydration** (`Shell title=""`); it now
    receives the real title, in both `page.tsx` and `loading.tsx`.
  - Both dialogs are named via `aria-labelledby`.
  - Status moved from `badge badge-*` to `StatusPill` — text plus shape, never
    colour alone (WEB-002 §5).
  - The skeleton announces once through `SkeletonRegion`'s `aria-live`, with the
    bones `aria-hidden`.

## Verification

- [x] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — **the script does not exist** (`package.json` has no
      `lint`, `verify`, `test`, `unit` or `budgets`; recorded in T-102 and still
      open)
- [x] `npm run gates` — typography PASSED; `check:design-system-v5` fails on 103
      pre-existing findings, **none owned by this route**
- [ ] `npm run test:e2e` — **not run**, needs `SAQEEL_TEST_PASSWORD`
- [ ] Definition of Done (WEB-006 §5) — **not fully ticked**; axe, manual
      checklist, e2e and performance numbers outstanding

**Rule sweep over all new code, measured not read:** non-null `!` 0 · `any`/`as
never` 0 · comments 0 · `let` in `.tsx` 0 · `<svg>` 0 · px or hex in CSS 0 ·
typography in feature CSS 0 · physical `left`/`right` 0 · legacy classes in JSX 0.

**Locale purity, scripted:** 137 keys, both locales, no Arabic script in the
English file, no Latin prose in the Arabic file, identical key sets.

## Retirement

`app/(app)/execution/RevampExecutionWorkspace.tsx` (397 lines, ~17 KB)
**deleted** — zero importers after the rebuild, verified in `src/`, `e2e/` and
`scripts/`. Ledger row added; running total 12 → 13.

**It could not be deleted until the spec was re-pointed.**
`execution-revamp-accessibility-contract.spec.ts` `readFileSync`s it at module
scope, so deleting first would have thrown before any assertion ran — T-078's
lesson, avoided by checking rather than by luck.

## Parked

- **No `LocaleProvider` exists.** `error.tsx` must be a client component and
  cannot await `getLocale()`, so it reads `documentElement.lang` through
  `useSyncExternalStore` — effect-free and read-only, but its **server snapshot
  returns `en`**, so a server-rendered error boundary shows one English frame to
  an Arabic user. Every `error.tsx` in the repo has this shape or worse
  (hardcoded English). A provider rendered by `AppShell` would fix **~25 error
  boundaries at once**.
- **`nowMs` is now passed from the server** rather than computed client-side,
  which removes a hydration inconsistency but pins the calendar week to render
  time. A long-lived tab will not roll over.
- The `<dialog>` carries `z-index: var(--sqx-z-modal)`, which the top layer
  ignores. Harmless, but the token is doing nothing.
- `app/(app)/execution/actions.ts` and `read-model.ts` still live under the route
  rather than in `features/execution/`. Left in place because e2e specs reference
  their paths.

## Blocked / open questions

**Nothing blocks the next slice.** Two decisions belong to the owner:

1. **Was the "Submission service unavailable" banner meant to read a real
   signal?** It never did. If such a signal exists, wiring it is a new task.
2. **Does `/execution` keep the legacy `Shell`?** It composes `Shell` inside
   `AppShell`, like 66 other routes. Migrating to `shell-page-frame` is the
   app-wide decision recorded in T-104 and `04-COMPONENT-LEDGER.md:180`.

## Proposed commit

```
refactor(execution): rebuild the workspace on saqeel primitives
```

## Next

Run the re-pointed accessibility spec with a seeded supervisor session, then axe
and the manual checklist. That closes T-110 from `partial` to `done`.
