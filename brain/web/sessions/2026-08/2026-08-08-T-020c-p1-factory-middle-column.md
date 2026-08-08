# 2026-08-08 · T-020c Pass 1 — `/factories` middle column

`task: T-020c (sliced, pass 1 of 2)` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-009, WEB-011, WEB-012`

---

## Goal

Migrate the legacy middle column of `/factories` (the `FactoryWorkspace`
children) off `.sq-f360__*` markup onto Saqeel primitives, and move its
hard-coded English labels into the `factories` i18n namespace in both locales.
End panel and route-file slim are Pass 2.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/sections/factories/factory-overview/factory-overview.tsx` | created | 178 |
| `components/sections/factories/factory-overview/factory-overview.module.css` | created | 96 |
| `features/factories/portfolio.ts` | modified | +`conditionOf`, `provenanceDetail`, `ConditionStrings` (83 → 138) |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | rewritten | 194 → 172; legacy middle-column markup and the inline provenance ternary removed |
| `i18n/locales/en/factories.json` | modified | +`action`, `hero`, `condition`, `snapshot`, `sections` (32 → 84) |
| `i18n/locales/ar/factories.json` | modified | same keys, Arabic |

The five legacy blocks — `.sq-f360__hero`, the `.sq-banner` provenance banner,
`.sq-f360__condition`, `.sq-f360__snapshot`, and the four
`.sq-f360__section` `<details>` — are now one section component composing
`Card` + `CardHeader` + `CardBody`, `DefinitionList`, `StatusPill`, `Button`,
and native `<details>` styled by a colocated module (tokens only, custom `+`/`−`
marker, `::-webkit-details-marker` hidden). Provenance/condition mapping moved
into `features/factories/portfolio.ts` so the component stays presentational.

## Decisions

- **Risk is now text + shape.** The legacy `data-risk` colour-only band became a
  `StatusPill` in the condition card header (WEB-009 §5, WEB-002 §7).
- **Did not build on the legacy `Alert`/`Accordion`** in `saqeel/feedback` and
  `saqeel/data`: both carry inline `<svg>`, legacy class names and `style` props
  (violate WEB-002 §5 and WEB-012). The provenance banner is a `Card` +
  `StatusPill`; the accordions are native `<details>` + a module — accessible,
  zero-JS, no direct DOM (WEB-012 clean).
- **Selection stays client `useState`** (the T-020a/b model). The overview is
  presentational and re-renders on selection; no new client island, no effect,
  no DOM mutation.
- **i18n messages are typed from the en JSON** (`typeof enFactories`), so the new
  keys type automatically; `ar` mirrors `en` exactly (verified: identical key
  set) to satisfy `Record<Locale, Messages>`.

## Verification

- [x] Static: no comments, no `let`, no `any`, no `<svg>`, no CSS literals in the
  new files; en/ar keys identical; all imports resolve (paths + named exports)
  against the current tree.
- [ ] `npm run typecheck` / browser / axe / Arabic-in-browser — not run (SWC/env
  blocker). Owner measurement request below.

## Known risks / follow-ups

- **`e2e/factory360-provenance-contract.spec.ts`** asserts against raw source
  text and the provenance ternary (noted fragile in the T-020b record). This
  pass moved that ternary into `features/factories/portfolio.ts` and changed the
  markup, so that spec very likely needs updating to assert behaviour. Flag for
  the owner's e2e run.
- The hero previously carried `data-screen-id="F360-S02"`; it was not reproduced
  (Card exposes no data-attribute passthrough). If a test pins it, decide whether
  to reintroduce via a wrapper.
- Arabic strings are new MSA translations; a native reviewer should confirm tone
  for a ministry surface before release (WEB-011 Arabic-first review).

## Parked / Pass 2

- End panel (`.sq-f360__context`) still legacy — its `sq-lozenge` badge is fed a
  temporary tone→class map (`provenanceBadge`) in `RevampFactory360Portfolio`
  until Pass 2 migrates it.
- Route file `app/(app)/factories/page.tsx` still 121 lines with legacy `//`
  comments and a `let portfolioQuery` — Pass 2 slims it (reads → `features/
  factories/queries.ts`) and clears those.
- Orphaned `saqeel-runtime.css` `.sq-f360__*` rules to delete once Pass 2 removes
  the last legacy consumer.

## Proposed commit

```
refactor(factories): migrate middle column to saqeel primitives + i18n
```

## Next

T-020c Pass 2 — end panel + route-file slim + orphaned-CSS deletion.
