# 2026-08-10 · T-041 — enforcement library and violation catalogue

`task: T-041` · `status: done (static verification only)` · `duration: 3.5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-005, WEB-006, WEB-008, WEB-009, WEB-011`

---

## Goal

Migrate `/admin/violations` onto SAQEEL. That path is two screens: without
`?mode=` it is rewritten to the enforcement library; with it, the violation and
penalty catalogue admin. Both were migrated (owner ruling).

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/enforcement-library/page.tsx` | rebuilt | **410 → 24** |
| `app/(app)/enforcement-library/loading.tsx` | mirroring skeleton | 5 → 8 |
| `app/(app)/enforcement-library/export/route.ts` | filename date fixed | +1 |
| `app/(app)/admin/violations/page.tsx` | rebuilt | **511 → 26** |
| `app/(app)/admin/violations/loading.tsx` | mirroring skeleton | 21 → 27 |
| **Deleted** `app/(app)/admin/violations/Controls.tsx` | unreachable behind `canConfigure = false` | 190 → 0 |
| **Deleted** `app/(app)/admin/violations/Controls.module.css` | its only consumer | 40 → 0 |
| **Deleted** `app/(app)/admin/violations/actions.ts` | only called by `Controls` | 45 → 0 |
| `features/enforcement/params.ts` | created | 0 → 58 |
| `features/enforcement/queries.ts` | created | 0 → 124 |
| `features/enforcement/rows.ts` | created | 0 → 174 |
| `features/enforcement/catalogue.ts` | created | 0 → 146 |
| `components/sections/enforcement/library/enforcement-screen/` | created | 0 → 138 + 4 |
| `components/sections/enforcement/library/enforcement-filter-bar/` | created (client) | 0 → 78 + 30 |
| `components/sections/enforcement/library/enforcement-table/` | created | 0 → 152 + 12 |
| `components/sections/enforcement/library/enforcement-record/` | created | 0 → 125 + 9 |
| `components/sections/enforcement/library/enforcement-skeleton/` | created | 0 → 43 + 6 |
| `components/sections/enforcement/catalogue/catalogue-screen/` | created | 0 → 118 + 7 |
| `components/sections/enforcement/catalogue/violation-code-card/` | created | 0 → 127 + 10 |
| `components/sections/enforcement/catalogue/penalty-mapping-card/` | created | 0 → 97 + 6 |
| `lib/dates.ts` | `riyadhToday` added | +12 |
| `components/saqeel/date-range-picker/date-range-presets.ts` | `PAST_DATE_RANGE_PRESETS` exposed | 28 → 40 |
| `components/sections/visits/visit-board/visit-bulk-actions.tsx` | two native selects → `SaqeelSelect` | +6 |
| `i18n/locales/{en,ar}/enforcement.json` | created | 0 → 163 keys each |
| `i18n/messages.ts` | namespace registered | +5 |

**One client island** — the library filter bar, which needs `SaqeelSelect`. The
catalogue is a Server Component end to end; its entire write layer was already
unreachable and is now deleted.

## The mock added almost nothing — the schema did

The mock's Enforcement view has the same nine columns we already rendered, and
its drawer holds **less** than ours (we also carry evidence-hash custody,
action-form completeness and the final mapping version). Its
"Timeline · Last Update: 2 days ago" has no column behind it.

What the migration actually gained was four defects found while reading the
schema:

**`inspections.inspection_no` exists and was never used.** The official
`INS-YYYY-NNNNNN` number (M04-209) is recorded on every inspection; the screen
printed `inspection.id.slice(0, 8)` — a UUID fragment — in a column headed
"Inspection". That is precisely the mock's `INS-88213`, and we already held it.
`visit_reference` is the fallback when no inspection number was stamped.

**`inspection_penalties.status` is `informational | issued`,** with `issued_at`
and `issued_by` bound to it by a check constraint. The old `statusLabel` map had
no entry for either, so it printed the raw lowercase word. That distinction is
the difference between a penalty that *was served* and one that is advisory, and
it now renders as such, with the issue date.

**The Status column was mislabelled (owner ruling: split it).** It showed the
*inspection's* workflow state on a *violation* row, under a header that implied
the violation was open or closed. It is now two columns: **Record** (the
inspection state, or Invalidated) and **Action** (the linked action form's open
or closed state — the mock's Open/Closed). Where no action form exists, Action
reads "No action form" rather than inventing a closed state.

**Penalty amount was in the snapshot and unread (owner ruling: show it).**
`mapping_snapshot` is a jsonb copy of the penalty mapping, which carries
`amount`. It is narrowed once in `readPenaltySnapshot` — every field may be
absent, and a missing amount reads "No amount recorded", never zero.

## Decisions

**`/admin/violations?mode=catalogue` unbreaks the tab bar.** The middleware
rewrites `/admin/violations` only when `mode` is absent, so the catalogue
admin's own "Violation catalogue" tab — which pointed at bare
`/admin/violations` — was rewritten away to the enforcement library. Its tab bar
could not return to itself. The mode is now always explicit.

**The catalogue's write layer is deleted, not migrated.** `canConfigure` was
hard-coded `false` pending the typed CCR validator, so every form in
`Controls.tsx` sat behind a condition that could never be true. 275 lines of
create/publish/deactivate forms and their server actions were unreachable. A
governance card now states where configuration actually happens.

**Lifecycle keeps its derivation, and gains a correct clock.** The catalogue
derives active / not-yet-active / deactivated from `active_from` and `active_to`
rather than reading a status enum, and states the derivation beside the result.
The comparison date was `new Date().toISOString().slice(0, 10)` — the **UTC**
day, which rolls over three hours early in Riyadh, so between 21:00 and midnight
local a code could be shown as active a day before it was. New `riyadhToday()`
in `lib/dates.ts`; the export filename had the same bug and is fixed too.

**Trigger traces are inverted server-side.** Which items raise a violation lives
in `response_model.mapping.<response>.violation`, so it is read from the item
side and inverted once into a map, rather than re-scanning every item per code
as the legacy did inside the render.

**An unreadable penalty is not an absent one.** `inspection_penalties` is
separately gated; `penaltiesReadable` keeps "your role cannot see this" apart
from "none was recorded".

## Inventory taken before writing code

- **State:** none in either screen; none added.
- **Effects:** none.
- **Literals:** legacy `.sq-state` / `.drawer` / `.panel` / `.table` / `.badge` /
  `.alert` throughout, plus inline `style={{ padding: "var(--space-6)" }}` and
  `minInlineSize: 200`. All replaced with colocated modules on `var(--sqx-*)`.
- **`<svg>` / emoji:** `🔒`, `∅`, `⚖️`, `✓`, `○`, `◷`, `⏻`, `⚠`, `↗` — all
  removed. None replaced by an icon: each sat beside text that already carried
  the meaning.
- **Accessibility failures found:** a **content-free `<a>`** used as the drawer
  scrim — a link that announces nothing and cannot be understood from the
  accessibility tree; `aria-modal="true"` on an `<aside>` with no focus trap and
  no focus management, so a dialog that traps nothing; `.slice(0, 10)` on raw
  timestamps as display dates; and the two mislabelled columns above. The record
  is now an ordinary card in the page flow with an explicit Close action —
  nothing claims to be a modal that is not one.
- **i18n:** every string was an inline `copy(en, ar)` pair. 163 keys now live in
  `en` and `ar` at exact parity.

## Numbers

```
Route: /enforcement-library (alias /admin/violations) + /admin/violations?mode=
first-load JS   not measured — measurement request, WEB-005 §8
route CSS       not measured
LCP (4G, mid)   not measured
INP             not measured
CLS             not measured
client islands  1 → 1 (catalogue island deleted as dead; library filter bar added)
legacy CSS deleted: 40 lines (Controls.module.css)
source lines removed: 1,196 across both routes
```

## Accessibility

- axe violations: **not run** — the dev server is behind a login the agent may
  not authenticate through.
- Manual checklist (WEB-003 §10): **not performed**, same reason.
- Fixed by construction: no empty link, no false modal, translated table
  caption, `<th scope>` row headers, every date through `formatDate(locale)`,
  status as pill plus text label, and the filter selects carry real `<label>`s
  through `Field` instead of `aria-label` alone.

## Verification

- [x] `npm run typecheck` — clean, whole repo
- [ ] `npm run lint` — **no `lint` script exists in `apps/web`**
- [x] `npm run check:design-system-v5` — zero findings in every file touched
      here, and one pre-existing finding in the export route fixed
- [x] i18n parity — 163 keys, `en` and `ar` identical key sets
- [x] Zero native `<select>` in `components/sections/**` (swept, not assumed)
- [x] Zero line comments; TSDoc only
- [x] WEB-011 — 5 / 3 component directories, 4 files in `features/enforcement`
- [x] Every component ≤ 200 lines; both route files ≤ 26
- [ ] `npm run test:e2e` — not run
- [ ] **Neither screen has been loaded.**
- [ ] Definition of Done (WEB-006 §5) — not fully ticked

## Retirement

Three files deleted outright, all with zero importers: `Controls.tsx`,
`Controls.module.css`, `actions.ts`. Nothing new marked.

## Correction — native selects, caught by the owner

The first pass of `enforcement-filter-bar` shipped **three native `<select>`
elements**. `SaqeelSelect` has been hardened since T-005a precisely so no screen
renders one, and the rule is explicit. Worse, the date filter invented its own
30 / 90 / 365 vocabulary when `date-range-presets` is **the** past-window
vocabulary — Today · Last 7 · Last 30 · Last 90 days · Last year, with labels
living once in `common.scope`. That module was written in T-021d to stop exactly
this drift, and its ledger row says so.

Fixed:

- The filter bar is now a client island on `SaqeelSelect`, following the
  `visit-filter-bar` pattern: selection in `useState`, hidden inputs mirroring
  it, one Apply submit.
- `date-range-presets` gained `PAST_DATE_RANGE_PRESETS` — the vocabulary as
  data — so a screen filtering by "last N days" without a calendar can reuse the
  same N and the same labels. `pastDateRangePresets()` now maps over it, so
  there is still one definition.
- `ENFORCEMENT_RANGES` is derived from that list rather than declared, and the
  bespoke `lastDays` / `lastYear` / `anyRegion` strings are deleted in favour of
  `common.scope`.

**A sweep found two more of mine**, shipped in T-021a: the inspector and
visit-type selects in `visit-bulk-actions`. Both replaced the same way. There
are now **zero native `<select>` elements in `components/sections/`**.

## Second correction — spacing

The owner reported the screen "has no spacings". The panel in the screenshot was
the **error boundary**, not the migrated screen — the page had thrown, and a
thrown page never renders its own `Shell`, so the boundary sat directly in the
app layout with **no page inset at all**. The throw was transient and did not
recur; the layout problem was real.

- New `components/saqeel/route-error` primitive: Card + `EmptyState` + retry,
  carrying the page inset itself rather than relying on a wrapper that is not
  there when it renders. The three boundaries on migrated routes
  (`enforcement-library`, `compliance`, `admin/violations`) now use it, replacing
  legacy `StateSurface` + `sq-btn` markup.
- **Doubled gaps removed.** `CardBody` already gaps its children, and four of my
  modules added a `margin-block` on top of it — the enforcement filter bar, the
  regulation workspace panel, and both skeletons. Reading a primitive before
  spacing around it would have caught all four.
- The enforcement filter bar gained a larger row gap for wrapped lines and
  pushes Apply/Export to the end edge, so they fall onto their own line rather
  than squeezing a select narrower than its label.
- **CSS comments removed.** WEB-000 bans `/* */` with only two exceptions, and
  neither is a CSS module. One had also slipped into `trend-bars.module.css`
  earlier in the session and is now gone.

## Parked

- **`ENFORCEMENT_ROWS` order in the export CSV** was not reviewed against the new
  columns. The export still carries the legacy column set; it reads the same
  filters, so it is consistent, but Record and Action are not in it.
- **The 100-row read limit** on `violations` is unchanged and unpaged. A library
  with more than 100 records silently shows the newest 100 — no pager and no
  statement that the list is truncated.
- **`/admin/violations` bare still resolves to the enforcement library.** That is
  the rail's link and is intended, but it means the catalogue admin has no
  entry point in the navigation at all — it is reachable only by typing
  `?mode=`.
- **`Field` renders a `<label>` with no `htmlFor` when wrapping `SaqeelSelect`.**
  The select names itself through its own `label` prop, so it is not unnamed,
  but the visible `<label>` element points at nothing. This is the established
  `visit-filter-bar` pattern and was followed for consistency; resolving it is a
  primitive-level decision about how `Field` and `SaqeelSelect` compose.
- **Route error boundaries are English-only.** `error.tsx` is client-only, so it
  cannot read the server locale, and reading `document` during render is the
  pattern that caused T-039. Needs its own decision.
- **Action-form closed statuses are inferred from a set** (`closed`,
  `completed`, `verified`, `resolved`). `action_forms.status` has no check
  constraint, so the vocabulary is not enforced by the database; a status
  outside that set counts as open.

## Blocked / open questions

- **Arabic needs a native reviewer.** 166 new strings, ~586 outstanding overall.
- **Runtime verification is owed** for both screens.

## Proposed commit

```
feat(enforcement): rebuild the enforcement library and violation catalogue
```

## Next

Load `/enforcement-library` and `/admin/violations?mode=penalty`, confirm the
inspection number renders and the Record/Action split reads correctly, then
decide whether the catalogue admin needs a navigation entry.
