# 2026-08-11 · T-062 — delete the Operational priorities panel, update its two specs

`task: T-062` · `status: done (axe and 320px carried from T-061)` · `duration: 30m`
`rules applied: WEB-000, WEB-003, WEB-006, WEB-008, WEB-011, WEB-013`

---

## Goal

Act on the owner ruling that closed T-060's blocker: delete the Operational
priorities panel and update the two e2e specs that asserted it as a canonical
panel.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/dashboard/operational-view/operational-view.tsx` | panel deleted; its summary and footnote absorbed by Today's operations | 143 → 136 |
| `e2e/web-admin-m1-dashboard.spec.ts` | asserts the panel is gone **and** both strings survived | 1 line → 3 |
| `e2e/dashboard-business.spec.ts` | heading assertion → summary-content assertion | unchanged |
| `i18n/locales/{en,ar}/dashboard.json` | `operational.priorities.title` removed (dead) | −1 key each |

## Decisions

**The panel went, the information did not.** The card was a heading, a summary
sentence carrying two live numbers, and a governance footnote — no control, and
both numbers already rendered as two of the seven cards directly below it. The
summary is now the Today's operations header `description` and the footnote is
its `CardFooter`, so a reader loses one card surface and no sentence.

**`operational.priorities.title` was deleted from both locales.** Its only
consumer is gone; a key with no call site is dead copy, not a spare. Same call
as `trend.current` in T-061.

**The specs record the deletion rather than losing the coverage.** Dropping the
assertion would have left the contract silent about a panel that used to be
canonical. `web-admin-m1-dashboard.spec.ts` now asserts three things: the
heading has **count 0**, the priorities summary is visible, and the no-AI
footnote is visible. So the spec states what was removed *and* that the
governance statement survived the move — which is the part that actually
mattered. `dashboard-business.spec.ts` is a screenshot-evidence test, so its
heading assertion became the summary assertion in place.

**Regex, not exact text, for the summary** — it interpolates two counts, and
asserting the rendered numbers would tie a layout contract to seeded data.

## Inventory taken before writing code

- **State and effects:** none touched.
- **Literals mapped to tokens:** none — no CSS changed. `CardFooter` was already
  imported for Inspector capacity.
- **Accessibility:** one `<h2>` and one `aria-labelledby` target removed. Nothing
  else pointed at `#dashboard-operational-priorities` — grepped across
  `apps/web/src` and `apps/web/e2e` before deleting.

## Numbers

Verified signed-in, persona `planner`, EN and AR RTL, from the DOM.

```
Route: /dashboard?view=operational
sections                  5 → 4
card surfaces            25 → 24
h2 landmarks              5 → 4
priorities summary        own card → Today's operations header description
priorities footnote       own card body → Today's operations footer
Today's operations cards  7 → 7 (unchanged)
blocked cards with a footer  0 (unchanged from T-061)
i18n keys                −1 per locale
typecheck / console errors  clean / 0
```

Read from the rendered DOM after the change — the Today's operations card's own
children are exactly `HEADER` (title + summary), `DIV.card_body` (7 cards),
`FOOTER` (the no-AI footnote). AR renders both strings and
`#dashboard-operational-priorities` is absent in both locales.

## Accessibility

- axe: still owed (carried from T-060/T-061).
- Manual: **Arabic/RTL verified** — both moved strings render in `ar`, panel
  absent. Dark verified. Keyboard, screen reader, 200% zoom, 320 px, reduced
  motion, greyscale still owed for this route.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist in this repo
- [x] `npm run gates` — typography **PASSED**; `check:design-system-v5` unchanged
      at 91 pre-existing findings
- [ ] `npm run test:e2e` — not run; the two edited specs need the seeded suite
- [x] Both edited specs re-read after editing to confirm they assert the shipped
      DOM

**The 7 removed typography violations are NOT this task's.** The gate reported
"7 violation(s) removed since the baseline" and invited a re-baseline, but
`git status` shows **27 uncommitted files under `components/sections/factories/**`,
`components/saqeel/definition-list/` and `app/(app)/factories/**`** — another
agent's typography pass, in progress in this shared working tree. This diff adds
and removes no typography declaration anywhere: `trend-bars.module.css` (T-061)
declares no font property and `requirement-register` renders through `Text`. Do
not read the improvement as belonging to T-061 or T-062.

**`npm run gates:typography:update` was therefore deliberately NOT run.** It
would rewrite `scripts/typography-baseline.json` underneath that agent, and lock
in a count measured against a tree half-way through their pass. The ratchet only
fails on additions, so the gate is green either way. **Whoever finishes the
typography work owns the re-baseline.**

**Note for whoever reviews this diff:** the working tree is shared and dirty with
that concurrent work. Stage only the files listed in *What changed* above; T-060
is already committed as `fae14075`.

## Retirement

Nothing marked. One panel deleted outright with its i18n key.

## Parked

1. **The skeleton does not draw the executive brief strip, and the naive fix is
   wrong.** Real strategic first paint is toolbar → brief strip (44px) → role
   summary → national → explorer; `DashboardSkeleton` draws toolbar → role
   summary → national → explorer, so everything below shifts by the strip's
   height when data lands. The drift predates T-060 (`7c9fd7d3` lifted the brief
   and the skeleton never followed). **Do not key the skeleton on `scope.view`:**
   `effectiveView(scope, isAdmin)` means a non-admin with no `view` param renders
   **operational**, and the admin flag is only known after the fetch the Suspense
   boundary is waiting on. A correct fix needs the view resolved before the
   skeleton, which is a route-shape change.
2. **`MetricCardSkeleton` always draws a footer** while blocked cards no longer
   have one (T-061). Which cards are blocked is data-dependent and unknowable at
   first paint, so this may be unfixable rather than unfixed.
3. **"1 high-priority visits" — no plural rule.** `priorities.summary`
   interpolates a count into a fixed plural noun in both locales. WEB-013 covers
   plurals; this string predates the task and is now in a card header.
4. Everything parked in T-061 still stands, including the raw ISO period
   captions and the unfiltered "Critical factories" drill.

## Blocked / open questions

1. **`web-admin-m1-dashboard.spec.ts:200-215` still asserts a screen that does
   not exist** — heading "Provider output withheld" and "No generated claim is
   shown until a configured provider…" live only in the retired
   `RevampStrategicView`. Already red before any of this work. It needs
   re-pointing at the shipped surface, and I did not fold that into this task
   because it is a different contract than the one the owner ruled on.

## Proposed commit

```
refactor(dashboard): fold operational priorities into today's operations
```

## Next

Re-point `web-admin-m1-dashboard.spec.ts:200-215` at the shipped strategic
surface, or run the owed axe and 320px pass across T-060 – T-062 together.
