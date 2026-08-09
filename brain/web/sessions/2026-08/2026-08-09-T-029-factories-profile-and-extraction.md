# 2026-08-09 · T-029 — `/factories` view-model extraction + Factory profile card

`task: T-029` · `status: done (static verification only)` · `duration: ~2h`
`rules applied: WEB-000 §2, WEB-001, WEB-002, WEB-003, WEB-008, WEB-011`

---

## Goal

Add the reference's **Factory Profile** disclosure above Inspection history —
and, because the host component was one slice from breaching its hard ceiling,
do the extraction that T-028 recorded as blocking **first**.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `features/factories/view.ts` | created — the whole view-model layer | 285 |
| `features/factories/profile.ts` | created | 85 |
| `components/sections/factories/factory-profile/**` | created | 56 + 94 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | **361 → 202** | −159 |
| `app/(app)/factories/page.tsx` | modified — profile query | +3 |
| `i18n/locales/{en,ar}/factories.json` | +17 keys each | 144 keys, parity |

## The extraction came first, deliberately

T-028 left `RevampFactory360Portfolio.tsx` at **361 lines against a 200-line
limit, ceiling 400**, and recorded that the next task had to be the extraction.
Adding the profile card first would have breached it.

`features/factories/view.ts` now owns everything that was view-model
construction: condition and its derived reasons, snapshot metrics, disclosure
sections, source states, latest change, trend series and delta, the three
compliance row shapes, last-synchronised, the profile groups, and the four
string maps. The component is **202 lines of composition** — props in, JSX out.

The string maps are typed against the components that consume them
(`PortfolioStrings`, `FactoryContextStrings`, `FactoryOverviewStrings`,
`FactoryAiAdvisoryStrings`), not `Record<string, string>` — a bag of strings
would have compiled while silently dropping a key.

## The profile card, and the one thing it does not show

| Reference | Schema | Shipped |
| --- | --- | --- |
| Identity — Sector | **no sector column exists** | **"Not available"** |
| Identity — Activity | `factories.activity_class` | **real** |
| Location — Region / City | `factories.region` / `.city` | **real** |
| Contacts — Contact / Phone | `factory_representatives` (primary, active) | **real**, plus the role; "No active representative is recorded" when absent |
| Official factory images ×3 | `factory_media_assets` categories `official_factory_image` / `factory_profile_image` | **counts** |
| Inspection images ×3 | `factory_media_assets` category `inspection_evidence` | **counts** |

**Thumbnails are counts, not tiles.** `factory_media_assets.storage_path` needs a
signed retrieval surface that does not exist on this screen. An `<img>` with no
working source is a broken image, not a placeholder — and WEB-003 is explicit
that a decorative tile is not an `<img>` at all. The card reports what is
recorded ("3 official factory images"), states that previews come from the
factory profile where access is checked per asset, and links there.

The card reuses the disclosure chrome from `factory-sections` so it is visually
identical to the four beneath it, and sits **first** in the stack as asked.

## Corrected after owner review — the card was a single column

The facts stacked one per row, leaving the card half empty. Cause: the
disclosure chrome copied from `factory-sections` carries
`align-items: flex-start` on its content container, which **shrink-wraps every
child to its content width**. `DefinitionList`'s
`repeat(auto-fit, minmax(…, 1fr))` then had nothing to fill, so it resolved to
one column no matter how wide the card was.

Removing that one declaration was the fix; the layout is now:

- `.groups` — a grid of `repeat(auto-fit, minmax(--sqx-grid-min-sm, 1fr))`, so
  **Identity / Location / Contacts / Recorded media sit side by side** and
  reflow to fewer columns as the card narrows. Each group keeps its own
  `DefinitionList` at the default `auto`, which inside a group column is
  correctly one fact per row.
- The media note and the **full-width** button (`Button block`) sit below the
  grid, spanning it.

**The lesson is the copied chrome, not the card:** `align-items: flex-start` is
right for the four disclosure sections, whose content is a short note and a
button, and wrong the moment a disclosure holds a grid. Anything else reusing
`factory-sections`' styles inherits the same trap.

## Inventory taken before writing code

- **Client islands:** unchanged.
- **Literals:** none.
- **`<svg>` / `<img>`:** none — the only match in a rule sweep is the word
  `<img>` inside a TSDoc block explaining why there isn't one.
- **Accessibility:** native `<details>`, facts as `DefinitionList`, media counts
  as a list. No image element without a real source.

## Numbers

```
Route: /factories
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
component       361 → 202 lines (limit 200, ceiling 400)
new queries     2 (factory_representatives, factory_media_assets), batched into
                the existing portfolio round trip
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.**

## Verification

- [x] `npm run typecheck` — zero errors, whole repo.
- [x] `npm run check:design-system-v5` — zero findings in changed files.
- [x] i18n parity — 144 keys, `en` + `ar`.
- [ ] `npm run lint` / `npm run gates` — no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.

## Parked

- **`RevampFactory360Portfolio.tsx` is 202 lines — two over the limit.** It is
  now pure composition, so the remaining path is splitting the JSX by column
  (start / middle / end) rather than extracting more logic. Not urgent at
  202/400, but it will not shrink on its own.
- **`view.ts` is 285 lines.** It is a feature module, not a component, so the
  200-line component rule does not bind it — but if it keeps growing it should
  split by concern (snapshot / compliance / trends).
- **No sector column exists** on `factories`; the profile shows "Not available".
- **Media is counted, never previewed.** A real gallery needs a signed-URL
  retrieval surface and a per-asset access check — its own task, not a slice.
- **`/factories` now issues eight reads per page load** (scope, portfolio,
  counts×4, risk snapshots, compliance×4, profile×2). They are batched into
  three `Promise.all` groups and scoped to the visible portfolio, but the screen
  deserves a measurement pass once it can run.

## Blocked / open questions

None.

## Proposed commit

```
feat(factories): factory profile card and view-model extraction
```

## Next

`/factories/cr/[id]`, untouched legacy — or filling the four disclosure sections.
