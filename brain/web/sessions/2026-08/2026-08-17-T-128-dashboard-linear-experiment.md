# 2026-08-17 · T-128 — `/dashboard` rebuilt in the experimental Linear language

`task: T-128` · `status: partial — code complete, both perspectives rendered and measured in dark, light, English and Arabic; axe, 320px/200% zoom and browser e2e owed` · `duration: ~4h`
`rules applied: WEB-000 … WEB-014`

---

## Goal

Put the flagship screen into the experimental Linear system beside T-127's
`/admin/planning/expiry`, so the owner's manager can judge the language on the
app's most representative surface and decide tomorrow whether to adopt it or
delete the branch.

**`/dashboard` was chosen for fairness: it is the best-migrated SAQEEL screen in
the app** (charts, two perspectives, personas, ~18 presentation components). A
weak comparison screen would have biased the decision either way.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/dashboard/page.tsx` | rebuilt | 23 → 20 |
| `components/experimental/linear/*` | extended — chart tokens, `CardHeader`, `CardBody`, link `Button` | +90 |
| `components/experimental/linear-data/*` (7 files) | created — `StatCard`, `MetricValue`, `Segmented`, `DataTable`, `EmptyBlock` | — → 310 |
| `components/experimental/linear-charts/*` (2 files) | created — `Gauge`, `BarSeries`, `TrendBars`, `BarCell` | — → 260 |
| `components/experimental/dashboard-parts/*` (6 files) | created — metric card, methodology, chrome, coverage, explorer | — → 480 |
| `components/experimental/dashboard/*` (8 files) | created — screen, strategic, operational, search, enforcement, pipeline, skeleton | — → 790 |
| `components/dashboard/*` (32 files) | **untouched, still on disk** | — |
| `scripts/check-typography.mjs` | exemption widened to the `linear-*` layer | 1 line |

**The entire data layer was reused unchanged** — `features/dashboard/*` (21
files), `metrics.ts`, `dashboard-format.ts`, `lib/dashboard-kpi/*`,
`lib/dashboard-role.ts`. Not one query, projection or formatter was rewritten.

## Decisions

1. **Presentation only.** Every number, projection and formatter comes from the
   existing data layer. This keeps the comparison about design, and keeps the
   governed KPI contract untouched.
2. **The explain popover became a `<details>` disclosure.** `metric-strip` and
   `requirement-register` were client components only because they consumed
   `useExplain()` from a client context. The methodology rows — formula,
   numerator, denominator, exclusions, drill link — are all still rendered, so
   **the fact survives and two client islands disappear**. The whole dashboard
   is now Server Components except `ExecutiveBrief`.
3. **The chart palette caps at three, measured.** `iris`, `pulse-green`, `fog`.
   Every other candidate fails: `iris~lavender` is **ΔE 1.6** under deutan
   (indistinguishable), `green~red` is **ΔE 5.8** (the classic pair),
   `acid-lime` is **1.23:1** as a fill on light and `signal-teal` **2.41:1**.
   The three chosen are ≥3:1 as fills in *both* themes with min pairwise ΔE
   **19.7** across normal/deutan/protan. Same cap SAQEEL reached, same reason.
4. **`ExecutiveBrief` is reused as-is and is a visible seam.** It wraps
   `AdvisoryStrip`, is SAQEEL-styled, and renders visibly differently from the
   Linear surfaces around it. It was kept because it carries
   `MVP2-REQ-0056,MVP2-REQ-0057,SCR-WEB-010` — **removing it is a contract
   change, not a design one** (T-109's ruling). Porting it is real work and was
   not in scope.
5. **`Badge` and `Button` are `inline-size: fit-content`.** Owner-reported:
   status labels rendered as full-width bars. Cause is `inline-flex` inside a
   **column** flex container, where `align-items` defaults to `stretch`.
   `fit-content` was chosen over `align-self: flex-start` because it fixes the
   column case **without** breaking baseline alignment in row containers.
6. **`DashboardNotice`'s title is a real heading.** It was a `Text`, which would
   have broken `getByRole("heading", { name: "Dashboard view not configured" })`
   in `web-admin-m1-dashboard`. Level is a prop: `1` in the two early-return
   branches where the notice is the whole page, `2` inline.

## Inventory taken before writing code

- **Dead code found and left alone:** `app/(app)/dashboard/DashboardView.tsx`
  (733 lines), `RevampStrategicView`, `RevampOperationalView`, `DecisionCanvas`,
  `BasisDrawer`, `RegionalScope`, `MetricStrip` have **zero importers**. The
  grep that appears to find them matches the *type* `DashboardView` from
  `features/dashboard/scope.ts`, not the component.
- **Live tree:** 18 presentation components under `components/dashboard/`.
- **Client islands before:** `metric-strip`, `requirement-register`,
  `explain-panel`, `executive-brief`. After: `executive-brief` only.
- **`e2e/` sweep:** 7 specs name dashboard source paths, 9 assert its markup,
  and **only 3 are in the static allowlist**.

## Numbers

```
Route: /dashboard
route file             23 → 20 lines
client islands          4 → 1        (explain popover → <details>)
data layer rewritten    0 files       21 files reused unchanged
smallest rendered text  13px
heading outline         h1 + 6× h2 strategic · h1 + 10× h2/h3 operational
h1 count                0 → 1        (Shell rendered title="" — there was none)
charts                  6 on operational, 2 on strategic
chart palette           3 slots, measured
```

**Not measured:** first-load JS, route CSS, LCP/INP/CLS — production build,
human-only (WEB-006 §3). **Measurement request.**

## The parity audit found two omissions

Run per T-111 (*a screen's feature set is only visible in its previous one*),
diffing the old component tree against the new:

```
ExecutiveBrief   dropped → RESTORED   MVP2-REQ-0056/0057, contract-bearing
SearchResults    dropped → RESTORED   ported to Linear; ?q= renders nothing without it
```

**Both would have shipped as silent feature losses.** Neither typecheck, lint,
typography, v5 nor the static suite can see a component that is simply no longer
rendered — the same hole that produced T-124's false "no functional regression".

## Accessibility

Measured in the running app, compositing alpha against real ancestors.

```
DARK                                   LIGHT (verified on /admin/planning/expiry, same tokens)
h1                    19.93:1  AA      19.93:1  AA
subtitle (muted)       6.13:1  AA       5.77:1  AA
column header          5.86:1  AA       5.77:1  AA
status badge          11.68:1  AA      10.14:1  AA
```

- **Heading outline repaired.** The old route passed `title=""` to `Shell`, so
  `/dashboard` had **no `h1` at all**. Now `h1` + a clean `h2`/`h3` tree.
- **Arabic:** `dir=rtl`, `lang=ar`, h1 `الإدارة`, **`nonZeroLetterSpacing: 0`**,
  no horizontal overflow. Latin-digit nodes: **26 in the DOM, 1 visible** —
  `"فتح المصنع 360"`, where 360 is a product name. The other 25 sit inside
  **closed** `<details>`; counted with `checkVisibility({ checkVisibilityCSS: true })`
  per T-126, because a raw tree-walk counts text no reader can see.
- **Pre-existing i18n gap surfaced:** methodology rows carry untranslated English
  (`"submitted inspections with no Level 2 …"`) and Latin timestamps from the
  metric contract. Present in both designs; one click away in each.
- **Reduced motion:** skeleton pulse is `opacity` only and disabled under
  `prefers-reduced-motion`.
- **axe, 320px, 200% zoom:** not run. **Owed.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 104 below baseline
- [x] `npm run gates:typography` — PASSED, 115 below baseline; **dashboard
      feature code measures zero** (the `linear-*` design-system layer is exempt,
      as `saqeel/type/` is)
- [x] `npm run check:design-system-v5` — 76, unchanged, none in a touched file
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — 408 passed / 4 skipped, unchanged
- [x] Both perspectives rendered; all 12 spec-asserted headings verified present
      in the live DOM
- [ ] `npm run test:e2e` — **blocked** (no browsers, no credentials — T-119)
- [ ] axe, 320px, 200% zoom — **owed**

**`test:static`'s 408 does not cover the dashboard specs that matter.**
`web-admin-m1-dashboard` and `dashboard-business` are not in the allowlist. Their
assertions were therefore checked **against the rendered DOM**: all six strategic
headings, all six operational headings, `Executive AI brief`, `Search results
for …`, and `<summary>` exposing `How is this calculated?` / `Why unavailable?`
(Playwright maps `summary` to `role=button`).

**One spec assertion is already stale against the current code, not mine:**
`getByRole("heading", { name: "Operational priorities" })` — no such string
exists in `dashboard.json`; only `operational.priorities.footnote` does.

## Retirement

**Nothing marked, nothing deleted** — same ruling as T-127. All 32 files under
`components/dashboard/` still compile and are one line from being live again.
They are the control arm until the verdict lands.

Separately worth noting: `app/(app)/dashboard/DashboardView.tsx` and five
siblings (~1,900 lines) were already dead **before** this task and remain so.

## Parked

- **Inter still is not rendering** (T-127's measurement stands: as-declared
  ≡ Plex Arabic, Inter absent). Unchanged by this task and still the single
  biggest caveat on any verdict.
- **`ExecutiveBrief` is an unported SAQEEL surface** inside a Linear page.
- `dashboard-parts/` and `dashboard/` split exists only to respect the 12-file
  directory cap; it would merge if the system is adopted.
- The activity trend uses bars where SAQEEL used a sparkline — a form
  substitution, not a data change.

## Blocked / open questions

Unchanged from T-127 and now answered on a second, much larger screen:

1. **Density.** The Linear reference is a marketing-site language. On a 6-card
   strategic view it reads well; on the operational view (10 headings, 6 charts,
   2 tables) the generous rhythm costs real vertical space. **This is the screen
   to judge that on.**
2. **Inter** — self-host it, or accept the ministry typeface and lose the
   language's typographic identity?
3. **Arabic** — the reference has no Arabic story; adopting it means authoring
   that half.

## Proposed commit

```
feat(dashboard): rebuild dashboard in the experimental linear system
```

## Next

The verdict. If adopted: port `ExecutiveBrief`, self-host Inter, and rule on
Arabic before a third route. If rejected: delete `components/experimental/`, the
typography-gate exemption, and point both `page.tsx` files back at their
originals — two lines.
