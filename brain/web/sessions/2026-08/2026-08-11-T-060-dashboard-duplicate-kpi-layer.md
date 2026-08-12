# 2026-08-11 · T-060 — `/dashboard` duplicate KPI layer and the AI brief strip

`task: T-060` · `status: partial (axe and 320px owed)` · `duration: 2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014`

---

## Goal

Remove the duplicated KPI layer the owner reported as clutter, and compact the
executive AI brief to the single-row strip `/planning` already uses.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `features/dashboard/strip.ts` | added `STRATEGIC_CARD_IDS`, `OPERATIONAL_CARD_IDS`, `unrepresented()` | 76 → 100 |
| `components/dashboard/strategic-view/strategic-view.tsx` | strip de-duplicated, trend reordered, placeholder pill → description | 187 → 189 |
| `components/dashboard/operational-view/operational-view.tsx` | strip de-duplicated | 134 → 143 |
| `components/dashboard/dashboard-sections/dashboard-sections.tsx` | passes `ROLE_DASHBOARD_METRICS[persona]` to both views | 203 → 203 |
| `components/dashboard/executive-brief/executive-brief.tsx` | accent `Card` → one-row strip; disclaimers moved behind a result | 67 → 74 |
| `components/dashboard/executive-brief/executive-brief.module.css` | rebuilt as the strip | 6 → 34 |
| `components/dashboard/role-summary/role-summary.tsx` | description key corrected; eyebrow to `trailing` | 36 → 39 |
| `components/dashboard/metric-strip/metric-strip.tsx` | blocked tiles ordered last; disclosure names its metric | 66 → 69 |
| `i18n/locales/{en,ar}/dashboard.json` | 2 strings replaced per locale, 0 keys added | unchanged |

## Decisions

**The clutter was a regression, not an original sin.** The retired
`DashboardView.tsx:513` passed `excluded={representedIds}` into its coverage
grid, and `:426` records why the blocked states were consolidated: *"repeated
warning pills made disciplined absence read as a broken product."* The rebuilt
`strategic-view` passed the full 12-id list with no exclusion. Both lessons are
restored in code rather than re-derived.

**One governed measure renders once per view.** `STR-KPI-001` was rendering as
"Compliance rate trend" in the strip and "National compliance rate" as a card —
identical numerator and denominator, two names, two places. Same for `004`,
`006`, `007`, `008` and `012`. On a ministry surface a reader cannot tell whether
those are two measures that happen to agree, so this is a governance defect and
not a layout one. Traceability is not lost: an excluded measure still renders
somewhere on the view, carrying the same lineage drawer.

**`STR-KPI-003` stays in the strip, against the first plan.** The "Top violated
regulation" card renders the by-regulation breakdown, which is *available*;
`STR-KPI-003`'s blocked status is about the **time series**, which is not. Two
different facts about one metric, so excluding it would have hidden a governed
absence rather than a duplicate. It is also the only source of "Decision
required" on the strategic view, which `web-admin-m1-dashboard.spec.ts:212`
asserts.

**"Operational priorities" was NOT deleted** even though it holds no control and
its two numbers are already two of the seven cards below it.
`web-admin-m1-dashboard.spec.ts:217` and `dashboard-business.spec.ts:124` assert
it as a **canonical panel**. Deleting it is a contract change, which needs an
owner ruling plus a spec update, not a design cleanup. Raised, not taken.

**The "Your work" header swap in the critique was wrong and was backed out
before it was written.** Three specs assert the persona as an exact heading —
`dashboard-business.spec.ts:200`, `:212`, `persona-tours.spec.ts:41` — so
promoting "Your work" to the title would have broken all three. The real defect
was narrower and in the opposite direction: the description rendered
`yourWork.eyebrow` where `web-admin-m1-dashboard.spec.ts:166` asserts
"Scoped to your access" is visible, and **nothing in the app rendered
`yourWork.scoped` at all**. Fixing it repairs a red assertion instead of
creating one. `eyebrow` moved to `trailing` as a muted `Text role="label"`,
because `dashboard-walkthrough-repair.spec.ts:62` needs an element whose exact
text is "Your work", and adding a 25th `CardHeader.eyebrow` call site is barred
by WEB-014 §5.1.

**The brief keeps its position at the top of the view.** `7c9fd7d3` lifted it
above Your Work deliberately; the approved design puts it last. The placement
is not re-litigated here — only its idle mass. The strip copies the *layout* of
`components/planning/planning-assistant`, not its CSS: that file declares
`font: var(--sqx-text-overline)` and `--sqx-text-caption` in feature CSS, which
rule 7b forbids and which is part of the 1,104-violation ratchet. The dashboard
strip declares no typography and routes every string through `Heading`/`Text`.

**Blocked tiles sort last inside `MetricStrip`, once, for every consumer.**
`Array.prototype.sort` is stable, so live tiles keep their governed order and
only the blocked ones move to the end.

## Inventory taken before writing code

- **State and effects:** none added. `ExecutiveBrief` keeps its single
  `useActionState`; the ordering in `MetricStrip` is derived at render from
  props, so no rung on the WEB-004 ladder was climbed.
- **Literals mapped to tokens:** the strip's 12 declarations are all
  `var(--sqx-*)` — `--sqx-space-2/3/4`, `--sqx-surface-default`,
  `--sqx-border-subtle`, `--sqx-border-width-hair`, `--sqx-border-width-thick`,
  `--sqx-accent-ai`, `--sqx-radius-card`. Every one already exists; no token was
  added and none was needed.
- **`<svg>`:** none introduced. The strip keeps `Icon name="ai"`.
- **Duplication found:** `STR-KPI-001/004/006/007/008/012` and
  `OPS-KPI-001/002/003/004/006` each rendered twice on their view; `OPS-KPI-006`
  rendered **three times** (role tile, requirement tile, Inspector capacity
  table).
- **Accessibility failures found in the existing markup:**
  1. 16 disclosure buttons shared the accessible name "How is this calculated?"
     and the identical `title` tooltip, because `Button` maps `label` to both.
     Now `"<label> — <metric title>"`, the pattern `compliance-explorer`
     already uses.
  2. `dashboard.requirement.description` — *"Decision required: approved
     description pending."* — shipped in both locales as a **pinging warning
     `StatusPill`** in a section header. Unapproved internal text presented to
     the reader as a status.
  3. `yourWork.scoped` was defined in both locales and rendered nowhere.

## Numbers

Measured signed-in as `Synthetic planner1` (persona `planner`) at 1440×900,
`/dashboard` EN dark and AR RTL.

```
Route: /dashboard?view=strategic
KPI tiles + cards        22 → 16
requirement strip tiles  12 → 6
governed-absence badges  14 → 11
executive brief height  ~182 px (owner screenshot) → 44 px LTR / 47 px RTL
section order            national → explorer → intervention → trend (design order restored)

Route: /dashboard?view=operational
KPI tiles + cards        20 → 15
requirement strip tiles   9 → 4
console errors            0 → 0

typography violations  1104 → 1104 (none new; ratchet held)
design-system-v5         91 → 91 (pre-existing failure, none in dashboard files)
first-load JS / LCP / INP / CLS: measurement request (WEB-005 §8) — needs a
production build, which is the human's to run.
```

Strip contents after the change, read from the rendered DOM:

- strategic (planner): checklist items by authority **8** · risk distribution ·
  violation trend by regulation and severity · licence exposure ·
  risk-to-attention mismatch · repeat violation rate
- operational (planner): GPS overrides today **0** · live activity feed **12** ·
  pending publish · operational nudges

## Accessibility

- axe: **not run** — owed.
- Manual checklist (WEB-003 §10): **Arabic/RTL passed** — `dir="rtl"`,
  `lang="ar"`, and the strip's `border-inline-start` resolves to the **right**
  edge (computed `border-right-width: 2px`, `border-left-width: 1px`), so the AI
  accent mirrors without a `[dir="rtl"]` override. Dark verified. **Keyboard,
  screen reader, 200% zoom, 320 px, reduced motion and greyscale are owed.**
- Fixed here: the 16 identical accessible names, and the placeholder status
  badge.
- `h2#dashboard-role-summary` is preserved as the readiness selector used by
  `performance-navigation.spec.ts:39` and `performance-visual-evidence.spec.ts:32`.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **the script does not exist in this repo** (recorded in
      T-053 and still true)
- [x] `npm run gates` — typography PASSED, none new;
      `check:design-system-v5` fails on **91 pre-existing findings**, verified
      identical before and after by stashing this diff and re-running. None of
      the 91 is in a file this task touched.
- [ ] `npm run test:e2e` — not run (needs the full seeded suite). **Two specs
      that were already red are unaffected**: `web-admin-m1-dashboard.spec.ts:206`
      asserts a heading "Provider output withheld" and the text
      "No generated claim is shown until a configured provider…", **neither of
      which exists anywhere in the live component tree** — they belong to the
      retired `RevampStrategicView`. **One already-red assertion is repaired**:
      `:166` "Scoped to your access".
- [ ] Definition of Done (WEB-006 §5) — not fully ticked; axe, 320 px and e2e
      are owed.

## Retirement

Nothing marked, nothing deleted. `ExecutiveBrief` stopped being a `Card`
consumer, which does not move any ledger row.

## Parked

1. **`ROLE_DASHBOARD_METRICS` overlaps the views it sits above.** The planner
   strip gives slot 2 of 4 to a permanently blocked measure (`OPS-KPI-002`,
   Not configured) and the supervisor strip repeats `OPS-KPI-003`/`004` against
   "Today's operations". The metric set mirrors the governed KPI matrix, so this
   is a product decision. Presentation-only mitigation shipped: blocked tiles
   now sort last.
2. **`OPS-KPI-006` still renders twice** — role tile and Inspector capacity
   table. The table is the richer surface; whether the tile survives is the same
   matrix decision as above.
3. **Card-in-card nesting.** Every KPI section is a `Card` whose body is a
   `CardGrid` of `Card`s. The owner ruled to keep the wrapper this pass. Removing
   it later needs a token-clean way to render a section heading outside a `Card`,
   which the design system does not offer — a WEB-002 §2 gap when it is taken up.
4. **The toolbar shows `Updated 20:33` and no period.** Every number is scoped by
   `from`/`to`/`region` held in the URL, and the reader cannot see that scope
   without looking at the shell. Shell is out of scope by instruction.
5. **`operational.priorities.footnote`** — "Based on current records only. No
   AI-generated recommendation." — stays on the panel that must not be deleted
   yet. If the panel goes, this string moves to the "Today's operations" footer.

## Blocked / open questions

1. **May "Operational priorities" be deleted?** It is an asserted canonical
   panel in two specs. Answer needed before the operational view can lose its
   last redundant card, and the answer must come with permission to update
   `web-admin-m1-dashboard.spec.ts:217` and `dashboard-business.spec.ts:124`.
2. **`web-admin-m1-dashboard.spec.ts:200-215` asserts a screen that no longer
   exists.** Those two strings live only in the retired `RevampStrategicView`.
   The spec needs re-pointing at the shipped surface; that is its own task, not
   a silent edit inside this one.
3. **2 Arabic strings authored here need a native review** —
   `dashboard.requirement.description` and
   `dashboard.operational.requirement.description`.

## Proposed commit

```
refactor(dashboard): drop the duplicate kpi layer and shrink the ai brief
```

## Next

Answer question 1 above, then take the parked matrix overlap (items 1 and 2) as
the second part of the owner's declutter pass.
