# 2026-08-12 · T-068 — `/operations` duplicate entry points, split-brain view toggle, dead KPI vocabulary

`task: T-068` · `status: partial (axe, 320px, 1024px overflow, keyboard, light theme owed)` · `duration: ~2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004 §1, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013`

---

## Goal

Owner-reported from a screenshot of the Operations Center: remove duplicated UI
without losing any function, hold the design system, and rank the findings P0/P1.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/operations/RevampOperationsCenter.tsx` | rebuilt summary + view gating | 166 → 171 |
| `app/(app)/operations/sections/labels.ts` | highlight shape + Arabic resources | 228 → 245 |
| `app/(app)/operations/sections/operations-overview.tsx` | prop plumbing | 85 → 85 |
| `app/(app)/operations/sections/export-section.tsx` | follows the highlight shape | 94 → 96 |
| `app/(app)/operations/sla.ts` | `SlaFlag` → discriminated union | 129 → 132 |
| `components/operations/operations-toolbar/operations-toolbar.tsx` | two route buttons deleted | 69 → 55 |
| `components/operations/operations-map-panel/operations-map-panel.tsx` | `action` slot, neutral count | 29 → 35 |
| `components/operations/operations-summary/operations-summary.tsx` | optional action, region cards | 75 → 81 |
| `components/operations/operations-exceptions/operations-exceptions.tsx` | kind / record / detail / time | 63 → 74 |
| `i18n/locales/{en,ar}/operations.json` | +`highlights` block, −4 dead keys | — |
| `e2e/web-admin-m3-operations.spec.ts` | three assertions re-pointed, one added | — |

## Decisions

**A toggle that owns half a screen owns all of it.** `activeView` (client state)
drove the map dataset while the regions section was gated on `view` — the URL
prop the toggle never updates. Selecting *National performance* swapped the pins
and rendered no national content at all; arriving at `?view=performance` and
clicking back stranded the section on screen. **The tell was that both branches
existed and read different variables**, which no type error and no gate can see.
Both now read `activeView`; `view` remains the seed so the deep link still works.

**Client state was kept deliberately, against the ladder's usual answer.** WEB-004
§1 ranks URL state above `useState`, and `/planning` (T-055) moved filters up that
rung. It is the wrong trade here: **both datasets are already on the client** —
`mapEntries`, `regionalMapEntries` and `regions` are all props — so navigating
would re-run ten server reads and a signed-URL round trip to render data the
browser already holds. The ladder ranks *sources of truth*, and after this change
there is exactly one.

**Three entry points to one destination is the duplication, not the button.** The
exception board was reachable from a toolbar button, a KPI card CTA, and the
section that lists the actual rows. `saqeel-revamp.html`'s ops-center toolbar
carries **one** button — the map/list toggle — and no route buttons. *Live
positions* and *Exception board* were both additions. **Neither was deleted; each
moved onto the surface it describes**: live positions into the map card header,
the board onto the exceptions section header. Top-level controls 4 → 2,
destinations lost: 0.

**An em-dash is not an absence vocabulary, and a card that cannot hold a value
must not offer an action.** `Submitted today` and `Active operational alerts` were
literal `value: "—"` carrying live drill-throughs — and the alerts card drilled to
the exception board while the exception rows render on the same screen. Both now
render `common.state.notConfigured` with no action. **Owner ruling taken before
the edit** — the em-dashes were asserted three times.

**One statement of absence, not one per row.** `OperationsRegions` stamped a
**pinging** `warning` pill reading "Compliance unavailable" on every region card.
This is verbatim the defect `DashboardView.tsx:426` recorded and T-060 restored:
*repeated warning pills made disciplined absence read as a broken product*. The
pill moved to the section header, unpinged. Each card recovered its value slot for
its **active-visit count** — a real figure where a fake alarm had been.

**A list sorted by a key it never shows is unreadable.** `buildHighlights` computed
`at` for every row, sorted descending by it, and `ExceptionRow` had no field for
it — the approved design's highlight row carries `h.time` as a third line. Added
via `ListRow`'s existing `meta` slot. **Every leading pill also read the same word,
"Open"** — a status that never varies carries no information. The pill now carries
the row's *kind*, which was previously the title, and the title is the record. No
new copy: it is a slot re-assignment.

**Promoting a string makes its translation gap conspicuous, and that makes it
yours.** The five highlight kinds and three deadline kinds were `t(key, "English")`
against `ui_strings` rows that do not exist, so they rendered English on the Arabic
screen. Pre-existing — but moving them from a run-on description into a prominent
pill is what made it visible, so they moved into `operations.highlights` in both
locales rather than being parked.

**`SlaFlag` became a discriminated union rather than taking a `?? 0`.** `pct` is
optional on the type and always present on a reminder. Defaulting it to `0` for the
formatter would have printed a fabricated percentage; three single-literal members
make the reachable branch provable instead. (Two-literal members do not narrow —
`kind: "overdue_start" | "overdue_submit"` as one member keeps the whole member
alive in the else branch.)

## Inventory taken before writing code

- **State:** `activeView` and `showList` (`useState`) plus `view` (URL). One source
  of truth after the change; `showList` stays a leaf toggle.
- **Effects:** none added, none present.
- **Literals:** none introduced. No hex, px, rem, font or shadow value written.
- **`<svg>`:** none. No icon added.
- **Dead copy found:** `exceptions.open`, `stat.showOnMap`, `stat.openReviews`,
  `stat.reviewExceptions` — deleted from **both** locales.
- **Specs read first (WEB-006):** `web-admin-m3-operations.spec.ts` pins the two
  em-dash cards three times, the `useState` seed, and `aria-pressed` /
  `role="status"` inside `OperationsMapWorkspace`'s dead branch.
- **Accessibility failures found:** the map count pill animated a static number;
  eight pinging pills competed for attention on one view; the exceptions list
  announced five identical "Open" statuses.

## Numbers

```
Route: /operations
top-level toolbar controls   4 → 2
entry points to /operations/exceptions   3 → 1
navigation destinations lost   0
KPI CTAs   5 → 1  (one per distinct destination)
pinging pills on National performance   8 → 1
i18n keys deleted (both locales)   4
i18n keys added (both locales)   8
client islands   unchanged (RevampOperationsCenter, OperationsMapWorkspace)
first-load JS / CSS / LCP / INP / CLS   MEASUREMENT REQUEST — see below
```

## Accessibility

- **axe: not run.** Owed.
- Manual checklist (WEB-003 §10): **keyboard — owed** · screen reader — owed ·
  200% zoom — owed · **320 px — owed** · **Arabic/RTL — done** (`dir=rtl`,
  `lang=ar`, mirrored toolbar, Arabic-Indic timestamps, Arabic exception kinds) ·
  **dark — done** · light — owed · reduced motion — owed · greyscale — owed
- Fixed in passing: nothing now communicates by animation alone; the exception
  rows carry a varying text status instead of five identical ones.

## Verification

- [x] `npm run typecheck` — clean for every file in this task. **Three errors
      remain in `app/(app)/field/factory-360/page.tsx` (`Icon`, `Heading` not
      found) — they belong to the concurrent T-067 typography pass sharing this
      working tree, not to this task.**
- [ ] `npm run lint` — **no `lint` script exists** in `apps/web/package.json`
- [x] `npm run gates` — typography gate PASSED, zero new violations, **not
      re-baselined** (the reported "5 removed" is T-067's delta, per the standing
      rule in `01-PROJECT-STATUS.md`). `check:design-system-v5` reports 60
      pre-existing violations, **none in any file this task touched**.
- [ ] `npm run test:e2e` — needs the seeded personas
- [ ] Definition of Done (WEB-006 §5) — not fully ticked; see Accessibility

Exercised by hand in the running dev server, signed in, EN and AR: toolbar
controls, tab toggle (section appears and withdraws with no navigation), five KPI
cards with two `Not configured` and one CTA, map header count plus live-positions
action, exception rows with kind / record / detail / timestamp. Zero console
errors.

## Retirement

Nothing marked or deleted. **`OperationsMapWorkspace`'s `!mapOnly` branch is dead
and could not be removed**: `mapOnly` is `true` at the only call site, so ~50 lines
of frozen legacy classes (`panel`, `panel-row`, `badge badge-info`, `tl-meta`,
`btn btn-secondary`) are unreachable — but `web-admin-m3-operations.spec.ts:84-85`
asserts `aria-pressed` and `role="status" aria-live="polite"`, both of which live
only inside it. Raised, not cut.

## Parked

- `Highlight.evidenceUrl` is computed, **signed with a storage round trip per
  row**, and rendered nowhere. Removing it touches `features/operations/queries.ts`.
- `OperationsMapWorkspace`'s dead list branch (above) — needs the spec re-pointed
  at `OperationsEntryTable`, which is the real accessible equivalent.
- `/operations/live` re-implements this screen's map in 412 lines with its own
  reads, strings and filters. Two implementations of one claim.
- `regions.detail` still prints the active-visit count that is now also the card's
  hero value.

## Blocked / open questions

- **8 newly authored Arabic strings need a native review** — `operations.highlights`
  in `ar/operations.json`.
- No page title was added. `Shell title=""` is the **convention** on every
  redesigned route (`/dashboard`, `/factories`, `/planning`, `/execution`); the
  shell topbar carries the route name. Verified before concluding it was a defect.

## Proposed commit

```
refactor(operations): one view switch, one entry point per destination
```

## Next

axe on `/operations` in both themes, the 320 px and 1024 px passes, a keyboard-only
run over the toggle and the two relocated buttons, and the e2e suite once the
seeded personas are available.

## Measurement request (WEB-005 §8 — for the human)

`/operations`, before and after this change: first-load JS, route CSS, LCP, INP,
CLS. Requires a production build, which is not the agent's to run.
