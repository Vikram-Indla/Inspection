# 2026-08-09 · T-035 — dashboard enforcement trend + executive AI brief

`task: T-035` · `status: partial (static verification only)` · `duration: 1.5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011`

---

## Goal

Replace the two placeholder cards at the end of `/dashboard?view=strategic` —
"Enforcement action trend / Trend unavailable" and "Executive AI brief /
Provider output withheld" — with a real trend computed from recorded data and a
real governed advisory.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `features/dashboard/enforcement-trend.ts` | created | 0 → 125 |
| `features/dashboard/executive-brief.ts` | created | 0 → 35 |
| `components/saqeel/trend-bars/trend-bars.tsx` | created (primitive) | 0 → 45 |
| `components/saqeel/trend-bars/trend-bars.module.css` | created | 0 → 33 |
| `components/sections/dashboard/enforcement-trend/enforcement-trend.tsx` | created | 0 → 58 |
| `components/sections/dashboard/enforcement-trend/enforcement-trend.module.css` | created | 0 → 19 |
| `components/sections/dashboard/executive-brief/executive-brief.tsx` | created (client island) | 0 → 65 |
| `components/sections/dashboard/executive-brief/executive-brief.module.css` | created | 0 → 27 |
| `components/sections/dashboard/strategic-view/strategic-view.tsx` | rebuilt tail | 210 → 201 |
| `components/sections/dashboard/strategic-view/strategic-view.module.css` | pruned `.text` | 51 → 46 |
| `components/sections/dashboard/dashboard-sections/dashboard-sections.tsx` | threads the trend query | 177 → 186 |
| `components/sections/factories/factory-trends/factory-trends.tsx` | rewired to `TrendBars` | 84 → 62 |
| `components/sections/factories/factory-trends/factory-trends.module.css` | duplicate chart rules deleted | 72 → 51 |
| `lib/providers/ai-gemini.ts` | `executive_brief` surface + no-cause rule | +6 |
| `lib/ai/contextual-actions.ts` | `executive_brief` surface, RLS re-read, `target_type` | 149 → 183 |
| `i18n/locales/en/dashboard.json` | `trend.*` + `executive.*` in, `enforcement.*` + `aiBrief.*` out | 149 keys |
| `i18n/locales/ar/dashboard.json` | same, authored Arabic | 149 keys, exact parity |

## Decisions

**Trend source is `penalty_notices.issued_at` (owner ruling).** The old card was
correct that no *violation* carries a governed official issue date. A penalty
notice does. The card counts notices issued in the scoped period against the
**immediately preceding period of equal length** — not a fixed quarter — so the
comparison follows whatever range the officer chose and no reporting cadence is
invented.

**An empty read is never rendered as zero.** `penalty_notices` is readable only
by reviewer / ops / auditor / compliance_admin / leadership. Every other role
gets an empty set, not an error. `queryEnforcementTrend` returns `readable`, and
the card renders a `restricted` `EmptyState` instead of a chart of zeros. Same
treatment inside the AI context, which states "not readable by this role"
rather than sending a `0` the model would summarise as "no enforcement".

**A rise in enforcement is `warning`, a fall is `success`.** Not because more
enforcement is failure, but because a rise is the signal that wants reading.
Zero change and no baseline are both `neutral` — a first period has nothing to
compare against and says so ("No baseline in the previous period"), it does not
show `+0%`.

**Bars scale against the taller of the two periods, not a target.** The ministry
publishes no enforcement target; scaling to one would invent a governed value.

**The brief is generated on demand (owner ruling), never on page load.** No
generation happens until an officer presses the button, so no dashboard render
spends a provider call, and an unconfigured provider costs nothing.

**The brief's facts are re-read server-side under the caller's RLS.** The hidden
`context` field is a convenience, never a source of truth — the action re-counts
penalty notices, submitted inspections and factories itself. The only thing
taken from the client is the reporting *period*, validated against
`^\d{4}-\d{2}-\d{2}$` with `from <= to`. A filter is not a fact.

**The prompt forbids causation.** These counts can show that enforcement moved.
They cannot show why. `ai-gemini.ts` now carries an explicit rule that the brief
must never assert or imply a cause, a responsible party, a regulation or a
policy behind a movement, and the card repeats that to the reader.

**`TrendBars` was promoted to a primitive under the Rule of Two.** The bar chart
existed once in `factory-trends`; the dashboard is the second caller. Callers
pass a pre-scaled `percent` because the scale choice is a truth question — what
a bar is measured against — and belongs to the caller, not to a layout
component. Documented in TSDoc on the primitive.

**The "Open Enforcement Library" action survived the placeholder.** It moved to
the trend card's `CardFooter` rather than being dropped with the card it was on.

## Inventory taken before writing code

- **State:** the trend card has none — server data, rung 1. The brief has one
  `useActionState`, the lowest rung that can hold a server-action result; no
  `useEffect` anywhere.
- **Effects:** zero added.
- **Literals:** none. Both modules consume `var(--sqx-*)` only; the bar height
  is `calc(var(--sqx-trend-value) * 1%)` off a bare number custom property, the
  same shape `SegmentedControl` already uses for its index.
- **`<svg>`:** none. `Icon name="ai"` (Sparkles) and `EmptyState icon="restricted"`
  (Lock), both already in the registry.
- **Accessibility failures in the replaced markup:** the placeholder AI card had
  an `<h2>` reading "Provider output withheld" — a status sentence occupying the
  section's accessible name. Both new cards carry a stable heading with
  `titleId` and an `aria-labelledby` section, and the status is a `StatusPill`
  with a text label. The chart is an `<ol>` of labelled items with an
  `aria-label` on the list, so the series is readable without the bars.

## Numbers

```
Route: /dashboard
first-load JS   not measured — measurement request, WEB-005 §8
route CSS       not measured
LCP (4G, mid)   not measured
INP             not measured
CLS             not measured
client islands  n → n+1 (executive-brief; the trend card is a Server Component)
legacy CSS deleted: 21 lines (factory-trends chart rules, now in the primitive)
source lines removed: 31 (placeholder cards + duplicated chart)
```

Two counted server round-trips added on the strategic view (previous period and
current period, issued in parallel), both `count`-shaped `head` reads in the AI
path and `id`-only selects in the render path.

## Accessibility

- axe violations: **not run** — the dev server is behind a login the agent may
  not authenticate through.
- Manual checklist (WEB-003 §10): **not performed** for the same reason.
  Keyboard · screen reader · 200% zoom · 320 px · Arabic/RTL · dark · reduced
  motion · greyscale all owed to the human.
- Fixed by construction: heading is a heading and not a status; status is text
  plus shape; the chart carries a text alternative per bar; the generate button
  is a real `<button type="submit">` inside a form, so it is reachable and
  announces its pending label.

## Verification

- [x] `npm run typecheck` — clean, whole repo
- [ ] `npm run lint` — **no `lint` script exists in `apps/web`**; the available
      scripts are `typecheck`, `check:design-system-v5`, `test:e2e`,
      `verify:dates`
- [x] `npm run check:design-system-v5` — zero findings in every file touched
      here (the pre-existing findings on un-migrated routes are unchanged)
- [x] i18n parity — 149 keys, `en` and `ar` identical key sets
- [ ] `npm run test:e2e` — not run
- [ ] Definition of Done (WEB-006 §5) — not fully ticked; see above

## Retirement

Nothing newly marked. `app/(app)/dashboard/RevampStrategicView.tsx` still holds
the same two placeholders in legacy `.panel`/`.badge` markup, but it is already
dead code behind an unreachable `return` in `DashboardView.tsx` — it belongs to
a retirement sweep, not to this task.

## Parked

- **`RevampStrategicView.tsx` / `DashboardView.tsx` are unreachable.**
  `DashboardView.StrategicView` returns before its remaining 100+ lines, and
  neither file is imported by the live `page.tsx`. Candidates for T-034.
- **`inspections.submitted_at` is the brief's inspection clock.** It matches the
  strategic metrics, but it is asserted here rather than proven against the
  metrics builder. Worth one reconciliation pass.
- **The brief has no disposition control on this screen.** It writes an
  `ai_suggestions` row with `disposition: "proposed"`, as every other contextual
  surface does, but the dashboard offers no accept/reject affordance. Consistent
  with the other surfaces; still a gap in the docket loop.

## Blocked / open questions

- **Arabic needs a native reviewer.** 15 new strings authored here, on top of
  the ~120 already outstanding from earlier tasks.
- **Runtime verification is owed.** The agent cannot sign in; every browser,
  axe and bundle check on this screen is a measurement request for the human.

## Proposed commit

```
feat(dashboard): add enforcement trend and executive AI brief
```

## Next

Exercise `/dashboard?view=strategic` in the dev server as a role that can read
`penalty_notices` and as one that cannot, confirm the restricted state and the
generate button, then return to T-023 (`/planning/page.tsx` is 569 lines against
a 40-line cap).
