# 2026-08-17 · T-138 — the `/field` home migrated off the parallel design system

`task: T-138` · `status: done` · `duration: ~4h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-009, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field` home — the largest remaining accessibility and design-language
gap in the application (T-137: zero headings, its own stylesheet, nine off-scale
sizes) — onto SAQEEL primitives and the approved Linear language, as the first
slice of the `/field` channel.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/field/page.tsx` | rebuilt as a route file | 677 → **12** |
| `features/field-home/queries.ts` | created — reads + derivation | — → 327 |
| `features/field-home/rows.ts` | created — narrowing from `unknown` | — → 119 |
| `features/field-home/labels.ts` | created — enum labels + tones | — → 39 |
| `components/sections/field-home/field-home-screen.tsx` | created — composition | — → 75 |
| `components/sections/field-home/field-home-header.tsx` | created | — → 54 |
| `components/sections/field-home/field-mission-metrics.tsx` | created (client) | — → 97 |
| `components/sections/field-home/field-daily-brief.tsx` | created (client) | — → 77 |
| `components/sections/field-home/field-operations-map.tsx` | created | — → 136 |
| `components/sections/field-home/field-map-canvas.tsx` | created (client) | — → 27 |
| `components/sections/field-home/field-schedule.tsx` | created | — → 65 |
| `components/sections/field-home/field-pending-attention.tsx` | created | — → 76 |
| `components/sections/field-home/field-insight-strip.tsx` | created | — → 58 |
| `components/sections/field-home/field-quick-actions.tsx` | created | — → 34 |
| `components/sections/field-home/field-home-unavailable.tsx` | created | — → 44 |
| `components/sections/field-home/field-home.module.css` | created — token-only | — → 310 |
| `i18n/locales/{en,ar}/field-home.json` | created — new namespace | — → 120 each |
| `i18n/messages.ts` | registered `fieldHome` | +4 |
| `saqeel/icon/icon-registry.ts` | added `create`, `elapsed` | +4 |
| `components/field/FieldMetricStrip.tsx` | **deleted** | 151 → 0 |
| `components/field/DailyBriefingCard.tsx` | **deleted** | 132 → 0 |
| `components/field/FieldHome.tsx` | **deleted** | 46 → 0 |
| `app/(app)/field/field-home.module.css` | **deleted** | 194 → 0 |
| `supabase/seeds/demo/01-identity.sql` | guarded fallback for inspector1–5 | +11 |
| 4 × `e2e/*.spec.ts` | contracts re-pointed | see below |

## Decisions

**The slice is what the home route exclusively owns, and nothing else.** An
import-graph check — not a filename grep, the lesson from T-136 — showed
`FieldHeader` has **34 importers** and `FieldHeaderSync` **4**. Rewriting either
would silently restyle 33 other field screens. So the home route stops importing
`FieldHeader` and renders its own header from primitives; `FieldHeader` stays
frozen for the unmigrated screens and comes out when they migrate.
`FieldHeaderSync` is **reused as-is** — it holds real offline/outbox logic, is
shared, and its 2 inline-font violations stay attributed to it in the baseline.

**`FieldHome`, `FieldMetricStrip` and `DailyBriefingCard` had exactly one
importer each — this route.** They were deleted rather than banner-marked: WEB-006
§4 permits deletion at zero imports, and that was already true the moment the
route stopped importing them.

**The decorative avatar was dropped.** The design carries an avatar letter because
its header has no name text; ours renders the name as the `h1` directly beside it.
The only avatar available (`data/Avatar`) is built on the frozen `avatar` classes,
so keeping it would have tied a migrated screen to a frozen sheet for a glyph that
repeats the adjacent heading.

**Enum labels come from the existing `visits.enum` namespace, not a new one.** The
governed `operational_state` enum is 7 values (`new, prepared, on_the_way, arrived,
executing, submitted, under_review`) and **all 7 were already translated there**,
as were `planning_status: expired`, the three risk bands and the three visit types.
No enum copy was added. The original's `CLOSED_STATES` list (`submitted, approved,
completed, closed`) contains three values `operational_state` cannot hold; that
list is also applied to `inspections.status`, which is untyped `text`, so the
predicate was carried across **unchanged** — narrowing it would have changed what
the page counts, which is a governed behaviour change, not a UI migration.

**`as unknown as` is gone.** The original cast the Supabase result
(`assignmentRead.data as unknown as Assignment[]`) — a banned pattern. `rows.ts`
narrows from `unknown` at the boundary with no cast at all.

## Inventory taken before writing code

- **State/effects:** the route was already a Server Component with zero hooks. The
  two client islands (`FieldScopeProvider` scope, the Mapbox canvas) are genuine
  and were kept at the leaf. Client subtree is now the mission card, the brief
  card and the map canvas — nothing else.
- **Literals → tokens:** 66 inline `style={{}}` objects removed; the only two that
  survive are the progress-bar width (a derived percentage) and
  `SegmentedControl`'s own custom properties.
- **`<svg>` → semantic icons:** all **15** mapped —
  calendar→`calendar`, search→`search`, bell→`notify`, sparkle→`ai`,
  chevron→`nextPage`, rotate-ccw/refresh→`refresh`, file→`forms`,
  clock→**`elapsed`**, triangle→`risk`, check-circle→`selected`,
  plus→**`create`**, calendar-days→`visits`. Two names (`create`, `elapsed`) did
  not exist and were added to the registry — the sanctioned mechanism under rule 8.
- **Copy:** a local helper at `page.tsx:87`,
  `const tr = (key, en, ar) => (locale === "ar" ? ar : t(key, en))`, inlined
  **both languages at every call site** — the banned pattern institutionalised as
  a function. 48 keys moved into a new `field-home` namespace; nearly all the
  Arabic already existed inside those `tr()` calls and was lifted rather than
  invented. Only `unavailable.alert` needed a new translation.
- **Accessibility failures found:** **zero headings on the page** — the greeting
  was a `<div>`, section titles were `<div class="t-label">` and
  `<span class="briefTitle">`; the unread indicator was a **bare coloured dot**
  with no text (rule 5); 86 comment lines; 33 legacy type classes.

## Numbers

```
Route: /field
route file            677 lines → 12 lines
components ≤ 200      max component now 136 lines
client islands        3 → 3   (scope card, brief card, map canvas)
raw <svg> in app      15 → 0
inline style={{}}     66 → 2  (derived %, DS custom properties)
legacy type classes   33 → 0
comment lines         86 → 0
hardcoded copy        48 keys inlined in both languages → 0
typography gate       55 owned violations → 0   (baseline 1542 → 1336)
eslint baseline       8114 → 7812
design-system-v5      76 → 75
source lines deleted  523 (3 components + 194-line stylesheet)
```

**Rendered text on the page, measured not read:**

```
before (T-137)   11.5 · 12 · 12.5 · 13 · 13.5 · 14 · 14.5 · 16 · 19   weight to 700
after            13 · 15 · 24 · 32                                    weight to 590
```

Nine ad-hoc sizes — five below the 13 px floor — became **four, all on the
approved scale**, with the weight cap respected. The three off-scale sizes still
present anywhere on the route (14 px, 13.33 px/Arial, 11.5 px) were each traced to
their element and **all three are outside this slice**: the shell's mobile-nav
drawer, the shell's notification-bell badge, and a legacy `t-caption` loader.

## Accessibility

- **axe violations: 0** — WCAG 2.0/2.1/2.2 A + AA, across **English/dark,
  Arabic/dark and Arabic/light**. Best-practice rules (`heading-order`,
  `page-has-heading-one`, `landmark-no-duplicate-main`, `landmark-unique`,
  `region`, `duplicate-id`, `listitem`, `aria-allowed-attr`) also **0**.
- **Heading structure created from nothing:**
  `1>2>2>3>2>3>3>2>2>2>2` — one `h1`, one `main`, no skips.
- Manual checklist: keyboard ✓ · 320 px ✓ (no document overflow; metric grid drops
  to 2 columns) · Arabic/RTL ✓ · dark ✓ · light ✓ · reduced motion — inherited.
  **200 % zoom still owed.**
- **Found and fixed:** the unread indicator was a bare red dot — it is now a
  `StatusPill` carrying text, per WEB-002 §5.
- **Found and fixed (Arabic):** the greeting separator was a hardcoded `", "`,
  so Arabic rendered a Latin comma. The whole greeting moved into the message
  template (`"صباح الخير، {name}"`), which removes the literal and puts the
  punctuation where a translator can own it. Verified: `مساء الخير، سلطان`.
- Latin text nodes inside the Arabic render were checked and are all **data**
  (factory names, `profiles.region`, CR numbers), not copy.
- The AI brief title measures **4.24:1** at 24 px/400. AA large-text needs 3:1, so
  it passes — but it is under 4.5:1 and would fail if the size ever dropped.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 302 removed, baseline relocked
- [x] `npm run gates:typography` — PASSED, 206 removed, baseline relocked
- [x] `npm run check:design-system-v5` — 75 (was 76)
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — **408 passed / 33 failed — exact T-137 baseline**
- [x] axe on 3 route/locale/theme combinations: 0 violations
- [ ] 200 % zoom, browser e2e — still owed

**Five spec regressions were introduced and all five were resolved.** Four were
source-scanning contracts asserting on the literal text of `field/page.tsx`; the
behaviour still holds, so each was re-pointed at the file that now owns the
concern rather than weakened:

| Spec | Re-pointed to |
| --- | --- |
| `ai-delta-contract` `getOrGenerateBriefing` | `features/field-home/queries.ts` |
| `ai-delta-contract` `DailyBriefingCard` | `<FieldDailyBrief` in the screen |
| `inspector-shell-uplift` section ordering | `field-home-screen.tsx` component order |
| `field-establishment-incidents` `/field/establishments` | `field-home-unavailable.tsx` |
| `field-notifications-contract` notification read | `features/field-home/queries.ts` |

**The fifth was a real defect of mine.** `performance-pass4-contract` (K-002)
asserts `/field` must **not** declare `export const dynamic = "force-dynamic"` —
the authenticated layout is meant to infer dynamic rendering. I had copied that
line from the expiry route's boilerplate. Removed.

`ai-user-journey.spec.ts` also depended on `data-testid="inspector-daily-briefing-panel"`,
and the design system has **no test-id surface at all** — deliberately. Rather
than add one, the brief card was given `aria-labelledby` against its own heading,
making it a named region, and the spec now asserts
`getByRole("region", { name: "AI Daily Brief" })` — a stronger assertion that also
proves the a11y contract. The copy kept its original casing so the spec's other
three exact-text assertions still hold.

## Retirement

Deleted at zero imports: `FieldMetricStrip.tsx` (151), `DailyBriefingCard.tsx`
(132), `FieldHome.tsx` (46), `app/(app)/field/field-home.module.css` (194) —
**523 lines**. `components/field/` drops from 22 files to 19.

`FieldHeader` (34 importers) and `FieldHeaderSync` (4) are explicitly **not**
retired; they belong to the rest of the channel.

## The seed defect, fixed

`01-identity.sql` names every persona in **two blocks**: a curated one and a
guarded one ending `and full_name like 'Synthetic %'`. `admin1–5`, `planner1–5`,
`supervisor1–5` and `inspector6–25` appear in **both**, so a provisioner run that
rewrites `full_name` to `Synthetic <alias>` is repaired by the next seed.
**`inspector1–5` were only in the curated, unguarded block**, which is exactly why
they alone were left reading "Synthetic inspector1" on the account chip. The five
guarded lines were added, using the same names and regions as the curated block so
the two cannot disagree.

## Parked

- **The field header duplicates the AppShell.** The route header renders Search
  and Notifications controls that the canonical AppShell already provides one row
  above — visible in the screenshots as two search affordances and two bells.
  This is pre-existing (the original `FieldHeader` predates the unified shell) and
  carrying it across was deliberate; collapsing it is an IA decision for the
  channel migration, not a step in this one.
- **`components/field/FieldScopeToggle.tsx` is orphaned** — zero importers, and it
  was already orphaned before this task.
- **The parallel `/saqeel-ds/saqeel/styles.css` is still linked** by
  `field/layout.tsx`. It comes out last, per the standing correction, because a
  CSS Module class beats its element selectors on specificity.
- `queries.ts` is 327 lines. Under the 400 hard ceiling, but it is the natural
  split point if the channel grows.
- 200 % zoom and browser e2e still owed for this route.
- The shell's mobile-nav drawer (14 px) and notification-bell badge
  (13.33 px, **Arial**) are off-scale and off-typeface — shell debt, now measured.

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild the field home on saqeel primitives
```

The seed fix (`01-identity.sql`) is separable and can go as its own
`fix(seed): guard the inspector1-5 names against the provisioner` if you prefer
the migration commit to stay purely `apps/web`.

## Next

The next `/field` slice. `my-tasks` is the strongest candidate: 611 lines, five
`h3`s and no `h1` (T-137), and it is the destination of this route's "View all"
and both Pending-Attention actions — so migrating it next keeps the journey
consistent rather than half-restyled.
