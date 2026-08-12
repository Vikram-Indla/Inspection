# 2026-08-12 · T-089 — `/factories` declutter: one AI strip, one identity, one provenance card

`task: T-089` · `status: done (axe, Arabic, light theme, e2e owed)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013`

---

## Goal

Remove the duplicated UI on `/factories`, and rebuild its AI panel on the strip the
dashboard already uses — without changing a query, a permission check or a link
destination.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/ai/advisory-strip/advisory-strip.tsx` | created (shared strip, owns the action) | — → 58 |
| `components/ai/advisory-strip/advisory-strip.module.css` | created | — → 39 |
| `components/dashboard/executive-brief/executive-brief.tsx` | rebuilt on the strip | 73 → 44 |
| `components/dashboard/executive-brief/executive-brief.module.css` | **deleted** (moved to the strip) | 34 → 0 |
| `components/sections/factories/factory-ai-advisory/factory-ai-advisory.tsx` | rebuilt on the strip | 69 → 39 |
| `components/sections/factories/factory-ai-advisory/factory-ai-advisory.module.css` | **deleted** | 5 → 0 |
| `components/sections/factories/factory-context/factory-context.tsx` | identity + source cards removed; advisory moved out | 62 → 13 |
| `components/sections/factories/factory-workspace/factory-workspace.tsx` | `top` slot | 15 → 20 |
| `components/sections/factories/factory-workspace/factory-workspace.module.css` | `.top` spanning all columns | +5 |
| `components/sections/factories/factory-trust/factory-trust.tsx` | absorbs provenance | 43 → 58 |
| `components/sections/factories/factory-risk-outlook/factory-risk-outlook.tsx` | score, band pill and profile link removed | 78 → 55 |
| `components/sections/factories/factory-sections/factory-sections.tsx` | availability sentence hoisted | 38 → 37 |
| `features/factories/view.ts` | `latestChange` nullable; dead context strings dropped | −12 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | call sites updated | −10 |
| `i18n/locales/{en,ar}/factories.json` | 4 dead keys deleted, 140 each at parity | — |

## Decisions

**Extract the strip; do not copy it.** The dashboard fixed this exact defect in
T-060 — provenance lines rendering above an *empty* advisory — and `/factories`
never received it. Copying `executive-brief.module.css` into the factories folder
would have produced the second implementation this repo keeps paying for
(T-071's live map, T-076's hand-rolled table). `AdvisoryStrip` now owns the
`useActionState`, the layout and the render rule; each surface supplies only its
hidden fields, its strings and its provenance notes.

**The strip belongs at the top of the workspace, not in the rail.** Owner ruling,
and it matches `/dashboard`, where the brief spans the top rather than sitting
beside the content. `FactoryWorkspace` gained a `top` slot rather than the call
site rendering the strip above `<FactoryWorkspace>` — the workspace owns its own
grid, and a sibling placed above it would not share the grid's gap or its
alignment. `grid-column: 1 / -1` spans **every** column at all three breakpoints
(1 / 2 / 3 columns) by construction, so no per-breakpoint rule was added.
Measured: first child of the grid, 1137px wide, above both rails.

**The dashboard's brief grew 44 → 74px, and that is a real cost of the owner's
layout ruling.** The action moved below the paragraph because
`margin-inline-start: auto` was what created the gap the owner objected to.
Applying it in the shared strip changes both surfaces. **Stated rather than
hidden — if the dashboard should keep the inline action, the strip needs a
variant.**

**Heading visual left untouched deliberately.** The first cut set
`visual="bodyStrong"` on the strip's heading, which would have shrunk the
dashboard's brief title 20px → 14px and changed a route T-059 closed out at four
sizes. Reverted to the default before it shipped; measured at 20px afterwards.

**A governed figure belongs in one place.** `81.5` and `Critical attention
required` rendered in both the snapshot and Risk outlook — the same defect T-060
recorded on `/dashboard` as *"two names for one governed figure"*. The snapshot
owns the value and the band because that is where the metric strip lives; the
outlook owns the explanation. The outlook's `Open factory profile` button was the
**third** route to `dossier_href` (hero, outlook, sections) and went with it —
T-068's duplicate-entry-point rule.

**`latestChange` is `string | null`, not a sentence meaning "none".** Its fallback
copy was word-for-word the Risk trend card's empty state, so the same fact
rendered twice whenever no calculation existed. Returning `null` deletes the
duplication *by construction* rather than by a string comparison, and the line
still renders when there is real movement.

**Two provenance cards became one.** *Source trust* and *Source status &
freshness* both answered "where did this come from and when". Merged into
`FactoryTrust`, with the provenance pill in the card header where the tone belongs
and the recorded-at line at the foot.

**The identity card was deleted, not merged.** Name, CR, licence and plant all
already render in the hero `DefinitionList` and the left rail row, and the rail's
check mark already shows which factory is selected. Nothing moved because nothing
was unique to it.

**`availableLabel` was hoisted, not deleted.** `FactorySections` rendered it inside
each `<details>`, so one sentence appeared four times. It is a fact about the group,
so it now sits above the group once.

## The skeleton had to follow, and measuring it found a primitive mismatch

Moving the strip and halving the right rail made `FactoriesSkeleton` wrong in
exactly the way T-059 warned about — it still drew **five** right-rail panels and
no top strip, so the page would have jumped when data landed. It now draws the
strip in the `top` slot and **two** panels, with `PanelCardSkeleton` gaining
`pill` and `description` flags because Risk outlook no longer has a trailing pill
or a description.

**Measured rather than eyeballed, and the first measurement was wrong.** A harness
that omitted `--sqx-space-6/9` and `--sqx-control-h-sm` reported the skeleton strip
at 50px against the live 74px — a 24px shift that did not exist. The bones had
collapsed because their size tokens were undefined in the harness, not in the app.
**An under-specified harness reports a defect in the thing being measured.**

With the full token set: **skeleton 82px vs live 74px — 8px, and the cause is a
shared primitive.** `StatusPill` is `min-block-size: var(--sqx-space-6)` and renders
24px; `Skeleton shape="pill"` is `block-size: var(--sqx-control-h-sm)` — **32px**.
Every skeleton in the app that draws a pill is 8px tall per pill row.

Left alone deliberately. Correcting the bone would change every skeleton on every
route, and this task's own lesson is that a shared-component edit must be verified
against each consumer — which cannot be done from here. The alternatives were
worse: a `line`/`lg` bone drops the row to 20px and makes the shift 20px, and no
size in the scale renders the 26px the heading's line box occupies. **The
semantically correct bone stays; the 8px is recorded and parked.**

## Two skeleton defects the owner caught, and one was not mine

**The factories skeleton had no page frame at all, and it never had.**
`/dashboard`, `/planning` and `/visits/[id]` all wrap their skeleton in `Shell`;
`factories/loading.tsx` returned `<FactoriesSkeleton />` bare, so it rendered
outside the frame and ran flush to the viewport edges while the loaded page sits
at a 268px inset (measured at 1440px earlier this session). **A skeleton that is
not inside the same frame as its page cannot match it, no matter how well its
bones are sized** — this predates T-089 and is the more important of the two
fixes. Now composed exactly as the other three routes do.

The same edit retired a legacy `t("f360.loading", "Loading factories")` — a `t()`
with an English default, which WEB-013 bans — for a real `factories.loading` key
in both locales (141 each, parity asserted).

**The AI accent border was wrong on a skeleton.** The strip skeleton copied the
live strip's `border-inline-start: var(--sqx-border-width-thick) solid
var(--sqx-accent-ai)`. A skeleton is an absence of content, not a preview of
branding — a saturated accent on a loading placeholder reads as a real, loaded
element. Removed; the plain hairline border stays so the block still occupies the
right shape.

**Not re-rendered.** The Browser pane's session expired to `/en/login` before the
skeleton could be measured again, so the framing fix is verified from source
(identical `Shell` composition to three other routes) and the accent removal by
grep, **not** by a screenshot. The 268px inset figure is from the loaded page
earlier in this session, not from the skeleton.

## Inventory taken before writing code

Measured in the rendered workspace at 1440px, shell excluded:

- **11 sections, 8 `h2`, 21 status pills, 131 leaf text nodes, 3,039px.**
- **14 distinct strings rendered more than once** — name ×3, `Plant number` ×3,
  `Petrochemical` ×3, `Open violations` ×3, *"This section is available in the full
  factory profile."* ×4, `81.5` ×2, `Critical attention required` ×2,
  `4030-201101` ×2, `Active penalties` ×2, `Stage` ×2, `Open factory profile` ×2,
  `Source provenance unavailable` ×2, `Not available` ×2, `Issued` ×2.
- **State:** none added. `AdvisoryStrip` holds the one `useActionState` that the
  two old components each held separately — net **−1** client hook.
- **Effects:** none.
- **Literals:** none; the strip's CSS moved verbatim.
- **`<svg>`:** none.
- **Spec pins checked before touching anything:** zero on any factories card;
  the dashboard brief is pinned only by heading name in
  `dashboard-business.spec.ts:92` and `web-admin-m1-dashboard.spec.ts:215`, both
  of which still resolve.

## Numbers

```
Route: /factories  (rendered workspace at 1440px, shell excluded)

cards                11 → 9
status pills         21 → 19
leaf text nodes     131 → 116
workspace height  3,039 → 2,512px   (−527)
AI panel            226 → 74px      (was a Card, now the shared strip)
risk outlook        390 → 268px
provenance      217+165 → 278px     (two cards → one)
duplicated strings   14 → 9
"available in the full factory profile"  4× → 1×
locale keys         144 → 140 per locale, parity asserted
stylesheets deleted   2
```

## Accessibility

- **axe:** not run — owed.
- Manual checklist (WEB-003 §10):
  - **keyboard** — no control removed except the duplicate profile link; the strip
    keeps a real `<form>` + submit.
  - **screen reader** — the strip is a `<section aria-labelledby>` with a real
    `h2`; verified on both routes. Errors keep `live="alert"`.
  - **200% zoom / 320px** — not run.
  - **Arabic/RTL** — **owed, still blocked** on the locale toggle. The strip's CSS
    is logical-property-only (`padding-inline`, `border-inline-start`,
    `margin-inline-start`), and `factories` parity is 140/140.
  - **dark** — verified. **Light theme owed.**
  - **reduced motion / greyscale** — nothing animated; every state is text + shape.

## Verification

- [x] `npx tsc --noEmit` — clean
- [ ] `npm run lint` — script does not exist (parked since T-053)
- [x] `gates:typography` — PASSED, 843 known, **none new** (8 fewer after the two
      stylesheet deletions)
- [ ] `npm run gates` — `check:design-system-v5` fails on pre-existing findings,
      none in a file this task touched (parked since T-057)
- [ ] `npm run test:e2e` — cannot run here; Playwright browsers are not installed
- [ ] Definition of Done — axe, Arabic, light theme, 320px, e2e owed

**Verified on both live routes.** `/factories`: 9 sections, AI strip 74px with the
action on its own row **below** the paragraph and all five hidden fields
(`surface`, `target_ref`, `context`, `evidence_refs`, `locale`) intact; identity and
source cards gone; the availability sentence renders once. `/dashboard`: the brief
is still an `h2` reading *"Executive AI brief"* at 20px, so both spec pins resolve
and no typography changed.

## Retirement

`executive-brief.module.css` and `factory-ai-advisory.module.css` deleted — both
had zero importers once the strip owned the layout.

## Parked

- The 9 remaining repeats are the left-rail-versus-hero overlap (`Petrochemical`,
  `Plant number`, `Stage`, `Open violations`, `Active penalties`, the factory
  name). The rail is for scanning a portfolio, the hero for reading one factory;
  collapsing them is a product decision, not a cleanup.
- **`Source provenance unavailable` still renders twice** — once as the portfolio
  notice in the left rail, once in the merged trust card. They are different
  scopes (portfolio vs selected factory) and were left alone.
- If the dashboard should keep its inline action, `AdvisoryStrip` needs an
  `actionPlacement` variant rather than a second component.
- **`Skeleton shape="pill"` is 8px taller than the `StatusPill` it stands in for**
  — `--sqx-control-h-sm` (32px) against `--sqx-space-6` (20px, rendering 24px).
  Measured on the advisory strip: skeleton 82px, live 74px. This is app-wide, not
  route-specific: every skeleton drawing a pill overshoots by 8px per row.
  Correcting the bone is a one-line change to `skeleton.module.css` and a
  re-measure of every route that has a skeleton — it needs its own task.

## Blocked / open questions

- The locale toggle still does not switch the app, which blocks the Arabic pass on
  this route as on every other.

## Proposed commit

```
refactor(factories): share the advisory strip and remove duplicated panels
```

## Next

Axe and a light-theme pass on `/factories`; both are quick once a browser session
that can hold focus is available.
