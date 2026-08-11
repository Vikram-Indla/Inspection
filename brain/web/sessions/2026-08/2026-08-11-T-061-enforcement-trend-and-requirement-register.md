# 2026-08-11 · T-061 — enforcement trend honesty, requirement register, dead CTAs

`task: T-061` · `status: partial (axe, 320px, screenshots owed)` · `duration: 2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013`

---

## Goal

Clean the lower half of the strategic dashboard: stop the enforcement trend
asserting a judgement the ministry has not published, make its chart readable,
collapse the wall of blocked coverage tiles into a register, and drop the
call-to-action from cards that have nothing to open.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/trend-bars/trend-bars.tsx` | optional visible `caption` + `value` per bar; zero renders as a baseline | 45 → 57 |
| `components/saqeel/trend-bars/trend-bars.module.css` | column restructured around a `.track`; zero rule added | 31 → 45 |
| `features/dashboard/enforcement-trend.ts` | tone forced neutral; per-bar caption and value; `currentLabel` removed | 125 → 130 |
| `components/dashboard/enforcement-trend/enforcement-trend.tsx` | footnote into the header, summary count dropped | 59 → 44 |
| `components/dashboard/enforcement-trend/enforcement-trend.module.css` | **deleted** — its only class went with the summary row | 8 → 0 |
| `components/dashboard/requirement-register/requirement-register.tsx` | created — the coverage register on `DataTable` | 0 → 74 |
| `components/dashboard/strategic-view/strategic-view.tsx` | register replaces the tile strip | 189 → 189 |
| `components/dashboard/operational-view/operational-view.tsx` | register replaces the tile strip | 143 → 143 |
| `components/dashboard/metric-card/metric-card.tsx` | footer renders only when the metric has a value | 67 → 69 |
| `features/dashboard/strip.ts` | `requirementRegisterStrings()` | 100 → 110 |
| `i18n/locales/{en,ar}/dashboard.json` | +3 keys (`metric.measure/state/emptyTitle`), −1 dead key (`trend.current`) | net +2 each |

## Decisions

**The trend was scoring the data.** `enforcementTrendView` mapped a fall in
penalty notices to `success` and a rise to `warning`, and its own comment
claimed the movement "is a signal to read, not a score" in the line above the
code that scored it. Fewer penalty notices can mean improved compliance **or**
reduced enforcement coverage; this screen cannot know which, and the executive
brief two sections up promises in as many words that it "does not attribute a
cause". **The tone is now neutral, permanently, and the reason is written into
the function's doc comment so the next agent does not restore the colour as a
"nice touch".**

The judgement was also applied to the wrong thing. `tone` paints **every** bar
in the series, so a decline rendered the *previous* period — the one with more
enforcement — in success green, with the current period as a thin green line
beside it. The single loudest element on the route was a green block meaning
"six penalty notices happened, before now".

**The chart was missing what the approved design requires.**
`design/final-cut/saqeel-revamp.html` renders each bar column as bar → visible
period label → visible value with `font-variant-numeric: tabular-nums`. Shipped,
the dates existed only inside `sqx-visually-hidden`, so a sighted reader could
not tell which bar was which period while a screen-reader user could. Restoring
the labels is design compliance, not a new idea, and it is also what makes the
zero legible.

**Zero is no longer drawn as a quantity.** `.bar` floored every bar at
`--sqx-space-2` (4px) in the value colour, so an absence rendered as a small
amount. A point at `percent === 0` now renders as a 2px dashed baseline with no
fill. **This changes `factory-trends` too** — a recorded risk score of 0 gets the
same treatment — which is correct for the same reason and is why the fix went
into the primitive rather than the call site (owner ruling).

**`TrendBars` gained two optional props, not a new component.** `caption` and
`value` are additive, so `factory-trends` renders exactly as before. The chart
height moved `--sqx-space-11` → `--sqx-space-13` (4rem → 6rem) toward the
design's 120px, and columns took `max-inline-size: var(--sqx-space-13)` so a
two-point series stops rendering as two half-width slabs. **No token was added**
— a space token as a size has precedent in this same file, which already used
`--sqx-space-11` as `block-size`.

**The register keeps every lineage drawer.** Each row carries the same
`Why unavailable?` / `How is this calculated?` control opening the same
`ExplainProvider` entry, with the metric's name in the accessible label. Nothing
became unreachable; six card surfaces became six rows.

**No "Live" pill was invented.** `statusLabel("live")` returns a hardcoded
string from `dashboard-format.ts` and adding a second consumer of it would spread
legacy. A live row shows its **value** in the State column and no pill, so the
column reads as "state or number" without new copy.

**`trend.current` was deleted from both locales.** With the count printed under
its own bar, "0 this period" restated a number sitting 40px below it. A key whose
only consumer is gone is dead copy, not a spare.

**A blocked card no longer offers a way in.** `MetricCard` rendered `CardFooter`
unconditionally, so "Top violated regulation → Unavailable" offered
**Open the regulation** and "Factories pending annual inspection → Not
configured" offered **Open Planning** — both dead ends, each costing a divider,
a padding band and a tab stop. The footer now renders only when
`model.value !== null`. Verified in the DOM: the two blocked intervention cards
have no `<footer>`, "Critical factories requiring intervention: 9" keeps its own.

## Inventory taken before writing code

- **State and effects:** none added. `RequirementRegister` is a client leaf only
  because it consumes `useExplain`, exactly as `MetricStrip` does; its ordering
  is derived at render.
- **Literals mapped to tokens:** every declaration in the two touched CSS
  modules is `var(--sqx-*)`. New uses: `--sqx-space-13` (chart height, column
  max), `--sqx-space-5` (column gap), `--sqx-border-width-thick` and
  `--sqx-border-default` (the zero baseline). **No token added, none needed.**
- **`<svg>`:** none introduced.
- **Accessibility failures found in the existing markup:**
  1. The chart's only period identification was `sqx-visually-hidden`, so the
     sighted reading and the announced reading disagreed about which bar is now.
  2. Colour was carrying a judgement (green = a fall) with no text equivalent —
     the pill said `−100%`, which is a magnitude, not a verdict.
  3. Two blocked cards exposed focusable links to destinations with nothing to
     show.
- **Contradiction checked and deliberately kept:** "Top violated regulation"
  (Unavailable — no linked violations in scope) and `STR-KPI-003`
  (Decision required — the schema stores no violation issue date) look like one
  measure twice. They are two different facts with two different remedies, each
  reachable from its own disclosure, so both stay.

## Numbers

Verified signed-in as persona `planner`, EN dark and AR RTL, from the DOM and
computed styles. **Screenshots could not be captured — the Browser pane was not
displayed, so the page stopped compositing frames and every `getBoundingClientRect`
returned 0.** Computed styles and DOM structure are unaffected by that and are
what the claims below rest on.

```
Route: /dashboard?view=strategic
enforcement bar colour     --sqx-status-compliant (green) → --sqx-status-pending (grey)
comparison pill            success → neutral  (rgb(40,47,55) bg / rgb(196,205,213) text)
visible period labels      0 → 2
visible per-bar values     0 → 2
zero bar                   4px filled, value colour → 0px, transparent, 2px dashed
bar column max-inline-size  none (≈50% of card) → 96px
chart height               64px → 96px
requirement coverage       6 card surfaces → 6 table rows
trend card chrome          4 pieces → 2 (pill + footer button)
blocked cards with a footer  2 → 0   (live cards keep theirs)

Route: /dashboard?view=operational
requirement coverage       4 card surfaces → 4 table rows
blocked cards with a footer  1 → 0   (Today's visit completion rate)

console errors             0 → 0
typography violations   1104 → 1104 (none new; ratchet held)
design-system-v5           91 → 91  (pre-existing failure, none in touched files)
first-load JS / LCP / INP / CLS: measurement request (WEB-005 §8).
```

Register contents read from the rendered DOM — EN strategic: checklist items by
issuing authority **8** · violation trend by regulation and severity
*Decision required* · risk distribution · licence exposure · risk-to-attention
mismatch · repeat violation rate *Unavailable*. AR: columns render
**المؤشر / الحالة**, the live value renders **٨** through `ar-SA`, and the zero
baseline keeps its dashed border under `dir="rtl"`.

## Accessibility

- axe: **not run** — owed.
- Manual checklist (WEB-003 §10): **Arabic/RTL verified** — `dir="rtl"`, register
  row headers `text-align: start`, Arabic-Indic numerals in the value column,
  dashed zero baseline intact. Dark verified. **Keyboard, screen reader, 200%
  zoom, 320 px, reduced motion and greyscale owed**, and the register needs a
  narrow-viewport pass specifically: `DataTable` carries `data-label` per cell
  for its stacked mode and that has not been seen here.
- Fixed here: the sighted/announced mismatch on the chart, colour carrying an
  unstated verdict, and two focusable dead-end links.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist in this repo
- [x] `npm run gates` — typography PASSED at 1104, none new;
      `check:design-system-v5` fails on the same **91 pre-existing** findings,
      none in a file this task touched
- [ ] `npm run test:e2e` — not run. Checked by hand that nothing asserted breaks:
      the only trend assertion is the heading
      (`web-admin-m1-dashboard.spec.ts:205`), no spec asserts an "Open …" button
      or the chart internals, and `:212` "Decision required" plus `:222-223`
      "Not configured"/"Unavailable" still render — now as register rows.
- [ ] Definition of Done (WEB-006 §5) — not fully ticked.

## Retirement

`components/dashboard/enforcement-trend/enforcement-trend.module.css` **deleted**
outright (8 lines, its single `.summary` class went with the summary row). No
ledger row needed — it was never a shared component.

## Parked

1. **Visible period captions are raw ISO dates.** `2026-06-13 — 2026-07-12` now
   renders to the reader in both locales. `lib/dates.ts` owns user-facing date
   text (Asia/Riyadh); these come straight from the scope, so the pattern is
   pre-existing and the gate does not flag it, but a *visible* date should be
   formatted. Small, and its own task.
2. **`factory-trends` does not pass `caption`/`value` yet.** Its risk-score
   series would read better with them; the props are ready and the screen is
   another owner's surface.
3. **"Critical factories requiring intervention: 9" drills unfiltered** to
   `/factories`, so the reader must re-find the nine. The design's own trend
   footnote specifies a drill "filtered to the selected quarter" — filtered
   drills are the intended contract and no card on this screen has one.
4. **The trend is two points and the design shows four quarters.** T-035 chose
   scoped-vs-preceding deliberately and that is not re-litigated here, but a
   two-point series scaled to its own peak still exaggerates small counts: 2 vs 1
   renders as a full bar against a half bar.
5. **Card-in-card nesting** still stands (carried from T-060).
6. **Operational priorities** still stands, blocked on the ruling in T-060.

## Blocked / open questions

1. Everything blocked in T-060 remains blocked: may "Operational priorities" be
   deleted, and who re-points `web-admin-m1-dashboard.spec.ts:200-215` at the
   shipped surface.
2. **3 Arabic strings authored here need a native review** — `metric.measure`,
   `metric.state`, `metric.emptyTitle`.
3. Screenshots for the record are owed and need the Browser pane displayed.

## Proposed commit

```
fix(dashboard): stop the enforcement trend scoring its own data
```

## Next

Take the parked filtered-drill contract (item 3) or answer T-060's open ruling —
both belong to the owner's declutter sequence.
