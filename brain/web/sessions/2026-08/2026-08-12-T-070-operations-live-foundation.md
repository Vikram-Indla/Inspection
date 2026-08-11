# 2026-08-12 · T-070 — `/operations/live` foundation: route, data layer, bilingual resources, skeleton (slice 1 of 2)

`task: T-070` · `status: partial (visible screen is slice 2; axe, 320px, keyboard, browser placement owed)` · `duration: ~2h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-005, WEB-006, WEB-008, WEB-011, WEB-013`

---

## Goal

Owner-reported: the Live Operations screen is legacy, its loading state is legacy,
and it duplicates UI. Slice 1 takes the foundation — route file, reads, resources
and skeleton — leaving the visible rebuild to slice 2.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/operations/live/page.tsx` | rebuilt as composition | **412 → 32** |
| `features/operations/live/queries.ts` | created | 124 |
| `features/operations/live/view.ts` | created | 222 |
| `features/operations/live/shapes.ts` | created | 41 |
| `features/operations/live/types.ts` | created | 35 |
| `features/operations/live/geography.ts` | created | 13 |
| `components/operations/operations-live-skeleton/**` | created | 68 + 25 |
| `app/(app)/operations/live/loading.tsx` | rebuilt on the skeleton primitives | 17 → 8 |
| `app/(app)/operations/live/LiveOps.tsx` | journey nav + dead string fields removed | 297 → 287 |
| `app/(app)/operations/sections/access-notice.tsx` | parameterised, now serves both routes | 23 → 27 |
| `app/(app)/operations/page.tsx` | passes the notice its own copy | 19 → 31 |
| `app/(app)/operations/live/live.module.css` | **deleted** | 467 → 0 |
| `i18n/locales/{en,ar}/operations.json` | `live` namespace, 62 keys each | — |
| `e2e/web-admin-m3-operations.spec.ts` | re-pointed | — |

## Decisions

**The Arabic language was living in a route file.** All ~90 strings were
`t(key, locale === "ar" ? ar : en)` — every pattern WEB-013 bans, in one place.
They are now 62 keys under `operations.live` in both locales at **asserted
parity (121/121)**, and this screen no longer depends on `ui_strings` for a single
word. Three strings (`unauthorized.*`) had **no Arabic anywhere** — not in code,
not in the locale files — so an Arabic reader got English and nothing ever failed.

**`live.module.css` was 467 lines with zero importers**, and the only thing
keeping it alive was a spec that `read()`s it from disk. Owner ruled: delete and
re-point. Its responsive and direction claims moved onto the CSS that actually
paints the loading state — and **inverted**: the old file carried a `[dir="rtl"]`
override, which WEB-002 §6 forbids, so the replacement is asserted to reflow with
logical properties and to contain **no** direction override and no physical
`left`/`right`. That removed the 6 baselined typography violations it held.

**A spec asserting which file holds a behaviour rots when the behaviour moves.**
The entire "Live composition contract" block asserted against `live/page.tsx` as
one file — access ordering, integrity filters, geography scoping, position
provenance. Moving them into `features/` would have broken twenty assertions that
are all still true. `livePageSource` is now the route **plus its feature modules**,
exactly how `pageSource` was already built for `/operations` in the same file. The
precedent was three hundred lines up.

**Five `as unknown as` casts went with the move.** The route used
`collectPostgrestPages` with hand-written casts on every read — the exact debt
T-042 cleared everywhere else and left here as "unmigrated legacy". The reads now
go through `readPages` + a `Shape<T>` per row, so a renamed column fails the read
into the screen's existing unavailable state instead of reaching a component.

**Two constants were being maintained in two places.** `CLEAN_FACTORY_CODES` and
`isCleanFactory` were copied into the live route from `features/operations/
factory-codes.ts`, and the authorized-geography filter was a third copy of the
same closure. Both now come from one place; the geography filter is
`features/operations/live/geography.ts` and `/operations` should adopt it next
(parked — its own spec pins the inline text).

**The journey nav was the same defect T-068 removed from `/operations`.** Three
buttons — Operations Center, Exceptions, Execution — duplicating the shell rail
that renders every one of them two centimetres away. Deleted; the wallboard exit,
which is a genuine mode toggle with nowhere else to live, stays.

**Three string fields were dead on arrival.** `executing`, `completed` and
`projected` were declared on `LiveOpsStrings`, built by the route, and read by
nothing. Found by enumerating `s.*` against the type rather than by reading.

**The skeleton must not drop the claim.** The legacy loading state rendered
"Recorded positions — not live GPS" above the bones. My first cut lost it, which
would have let the screen assert nothing about GPS for the whole load. It is back
as real text through `Text`, from the resource, and the spec now asserts the
skeleton renders a `disclosure` rather than asserting an English literal.

**`Card` cannot be an `aside`, and the spec pins one.** `CardElement` is
`article | section | div`; the runtime test selects
`aside[aria-labelledby="live-inspector-list-title"]`. Slice 2 needs either a
primitive change (raised, not taken) or that selector re-pointed to the
`aria-labelledby` alone — which is the better assertion anyway, since it stops
coupling a contract to a tag name.

## Inventory taken before writing code

- **State:** `selectedId`, `providerFailed`, `providerAttempt` — all correctly at
  the leaf; nothing moved on the ladder. **Effects:** 3, all Mapbox lifecycle,
  all with cleanup. Untouched.
- **Literals:** the map's inline `style` object reads `--surface-canvas`, a
  **legacy** token rather than `--sqx-*` — parked for slice 2.
- **`<svg>`:** none. **Four glyph-as-icon** (`!`, `⌖`, `…`, `×`) — slice 2.
- **Accessibility failures found:** a `div` with `aria-label` and no role (the
  legend rail and the map container are both invisible to assistive tech); the
  provenance legend renders all three states unconditionally, including a
  critical-red one, with zero inspectors on screen; the empty-scope sentence
  renders twice. **All slice 2.**

## Numbers

```
Route: /operations/live
route file            412 → 32 lines   (cap 40)
dead CSS deleted      467 lines
`as unknown as`       5 → 0
duplicated constants  2 → 0
i18n keys in code     ~90 → 0
i18n keys in resources 0 → 62 per locale (parity asserted 121/121)
dead string fields    3 → 0
duplicate nav entry points 3 → 0
typography violations 6 removed (the deleted stylesheet)
first-load JS / CSS / LCP   MEASUREMENT REQUEST
```

## Accessibility

- **axe: not run.** Owed.
- Manual checklist (WEB-003 §10): keyboard — owed · screen reader — owed ·
  200% zoom — owed · 320 px — owed · Arabic/RTL — **resources verified, render
  owed** · dark — owed · reduced motion — the skeleton's shimmer is disabled
  under `prefers-reduced-motion`, now asserted · greyscale — owed
- No accessibility defect was fixed in this slice and none was introduced. The
  four listed above are slice 2's scope.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **no `lint` script exists** in `apps/web/package.json`
- [x] `npm run gates` — typography PASSED, **6 violations removed** (the deleted
      stylesheet), zero new. `check:design-system-v5` flags **none** of this
      task's files. **Not re-baselined** — the concurrent T-069 pass shares this
      tree.
- [x] **52 re-pointed spec assertions verified by script** against the real files
      — every substring, both ordering checks, the no-writes check, en and ar
      needles, and the `/operations` assertions that must survive the
      `AccessNotice` change.
- [ ] `npm run test:e2e` — needs the seeded personas
- [ ] Definition of Done — not fully ticked

**Browser: content verified, placement not.** Signed in, `/operations/live`
renders with the correct KPI counts, list heading, snapshot timestamp and **zero
journey links**, and the console is clean. The rendered DOM shows each route's
loading fallback still occupying `<main>` with the resolved subtree in a
body-level div — **this is the hidden-pane artifact, not a defect**: the same
state appears on `/en/factories`, which this task never touched. Streaming's
fallback-swap does not complete while the Browser pane is undisplayed, the same
limitation `01-PROJECT-STATUS.md` already records for screenshots and layout
rects.

## Retirement

`live/live.module.css` **deleted** (467 lines, zero importers). Nothing else
marked. `LiveOps.tsx`, `LiveMapInner.tsx` and `live/types.ts` are slice 2's
subject and stay as they are.

## Parked

- `/operations`'s inline geography filter should adopt `live/geography.ts` — its
  own spec pins the inline text, so it needs a re-point of its own.
- `LiveMapInner`'s inline `style` uses `--surface-canvas`, a legacy token.
- `operations-skeleton` (for `/operations`) still draws two table cards and a
  two-column list section that T-068's route no longer renders.
- Three near-identical notice components exist (`dashboard-notice`,
  `planning-notice`, `regulation-governance-notice`) with **no shared primitive** —
  slice 2 needs one and must not add a fourth.

## Blocked / open questions

- **3 newly authored Arabic strings need a native review** —
  `operations.live.unauthorized.*`, which had no Arabic in any source before.
  The other 59 keys are the existing reviewed Arabic, moved verbatim.
- `Card` has no `aside` element (see Decisions). Slice 2 needs a ruling or a
  spec re-point.

## Proposed commit

```
refactor(operations): move live ops onto a data layer and resources
```

## Next

**Slice 2 — the visible screen.** The map's hardcoded `lightPreset: "day"` (it
ignores the app theme; `GeoMap` already tracks `data-theme`), 48 legacy class uses
to zero, the duplicated empty state, the permanent three-state alarm rail and its
duplicate footer legend, the four glyph icons, `ListRow` for the inspector rows
and `DefinitionList` for the details panel.

## Measurement request (WEB-005 §8 — for the human)

`/operations/live`, before and after: first-load JS, route CSS, LCP, INP, CLS.
Requires a production build.
