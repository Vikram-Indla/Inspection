# 2026-08-08 · T-020c Pass 2 — `/factories` end panel + all pills ping

`task: T-020c (sliced, pass 2 of 2 — end panel only)` · `status: done` · `duration: ~45m`
`rules applied: WEB-000, WEB-002, WEB-009 §5, WEB-011, WEB-012`

---

## Goal

Migrate the legacy `.sq-f360__context` end (right-column) panel of `/factories`
onto Saqeel primitives, and — per owner direction — make **every `StatusPill`
on the screen show its ping dot**, including the middle "Source provenance
unavailable" pill.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/sections/factories/factory-context/factory-context.tsx` | created | 62 |
| `components/sections/factories/factory-context/factory-context.module.css` | created | 11 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | modified | end panel → `<FactoryContext>`; removed the `.sq-f360__context` markup and the temporary `provenanceBadge` tone→`sq-lozenge` map; added `contextStrings` |
| `components/sections/factories/factory-overview/factory-overview.tsx` | modified | dropped `ping={false}` on the condition and provenance pills |
| `components/sections/factories/factories-portfolio/factories-portfolio.tsx` | modified | dropped `ping={false}` on the risk-band pill |
| `i18n/locales/en/factories.json` | modified | +`ai` group (title, withheld, body, action) |
| `i18n/locales/ar/factories.json` | modified | same, Arabic |

The end panel is now three `Card`s: a **Selected context** card (name +
CR/Licence/Plant via `DefinitionList`), a **Source status** card (provenance
`StatusPill` + body + freshness), and a **Contextual AI** card ("Provider output
withheld" as a `StatusPill`, evidence link as a `Button`). Context labels reuse
existing keys (`workspace.context`, `snapshot.commercialRegistration`,
`hero.industrialLicence`, `portfolio.plantNumber`); only the `ai` group is new.

## Decisions

- **Every pill pings — applied to `/factories` only for now.** Removed the three
  `ping={false}` overrides on the screen; the new end-panel pills ping by
  default. The provenance "Source provenance unavailable" pill now pings as
  asked. Whether to make this a global rule (delete the `ping` rung from the
  `StatusPill` primitive, T-030 style) is **left open** — it would also pulse a
  dot on every row of the dense operations/risk tables, so it needs an explicit
  owner call before sweeping app-wide.
- **AI "withheld" state is a `StatusPill` (tone `info`)** — a governed
  insufficient-evidence state rendered as text + shape, not invented content
  (WEB-002 §7, §9). The evidence link is a real `Button` to the dossier.
- End panel `Card`s inherit the page-level `data-sqx-cards="flush"` context, so
  in dark they follow the same two-tone scheme as the rest of the screen.

## Verification

- [x] Static: no comments/`let`/`any`/`svg`; en/ar keys identical; `ai` group
  present; zero `ping={false}` left on the screen; no `.sq-f360__context` /
  `sq-lozenge` / `provenanceBadge` references remain; no CSS literals; imports
  resolve.
- [ ] `npm run typecheck` / browser / Arabic-in-browser — not run (SWC/env
  blocker). Owner check requested.

## Parked / remaining for full T-020c

- **Route-file slim** — `app/(app)/factories/page.tsx` still ~121 lines with
  legacy `//` comments and a `let portfolioQuery`; move the Supabase reads into
  `features/factories/queries.ts` (clears both). Not done this pass.
- **Orphaned CSS** — the `.sq-f360__*` rules in `saqeel-runtime.css` (incl.
  `__context`) are now unused by the migrated screen; delete once confirmed no
  other consumer. Not done this pass.
- `e2e/factory360-provenance-contract.spec.ts` — still likely needs updating
  (flagged in Pass 1).

## Proposed commit

```
refactor(factories): migrate end panel to saqeel primitives; ping all pills
```

## Next

Finish T-020c: route-file slim + orphaned-CSS deletion. And the owner's call on
global pill-ping.
