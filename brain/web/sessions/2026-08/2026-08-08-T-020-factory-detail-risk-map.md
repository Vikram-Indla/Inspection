# 2026-08-08 · T-020 (detail page) slice 3 — risk/condition card + map lens

`task: T-020 /factories/[id] transform (sliced, slice 3 of ~6)` · `status: done` · `duration: ~45m`
`rules applied: WEB-002, WEB-009, WEB-012`

---

## Goal

Migrate the two remaining side-rail cards on `/factories/[id]` — the
risk/condition card (`cd-riskcard`, whose score colour was carried by the
colour-only `cd-risk-*` classes) and the map-lens card (`cd-maplens`, heading +
coords + geofence line + the `FactorySpatialMap`/placeholder) — off legacy
`sq-*`/`cd-*` markup onto Saqeel primitives. Strings already flow through `t()`,
so this is a markup/visual transform, not i18n.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/sections/factories/factory-risk/factory-risk.tsx` | created | 41 |
| `components/sections/factories/factory-risk/factory-risk.module.css` | created | 16 |
| `components/sections/factories/factory-location/factory-location.tsx` | created | 25 |
| `components/sections/factories/factory-location/factory-location.module.css` | created | 28 |
| `app/(app)/factories/[id]/page.tsx` | modified | 2 markup regions swapped; slice-3 view-model consts added; unused `riskTone` removed |

- **Risk card** (`cd-riskcard` + colour-only `cd-riskscore cd-risk-*`) →
  `FactoryRisk`: a `Card` whose header carries the band as a **`StatusPill`**
  (high → danger, medium → warning, low → success; a neutral "No risk score"
  pill when the band is absent), the score as a `CardValue kind="number"`, the
  version/last-recalculated pair as a `DefinitionList`, the reproducibility note
  as a caption, and the driver breakdown as a tokened list (or the explicit
  "no driver snapshot" caption when the legacy score has none). The score
  colour is now text **and** shape, never colour alone (WEB-009).
- **Map lens** (`cd-maplens` + `cd-coords` + `cd-mapph` placeholder) →
  `FactoryLocation`: a `Card` with the coordinates (`<bdi>`, GIS-owner note),
  the geofence line flattened to a string, and the `FactorySpatialMap` passed as
  children — rendered only when official coordinates exist, otherwise a tokened
  placeholder shows the "coordinates unavailable" note. The map engine
  (slice 1) is untouched.

## Decisions

- **Driver parsing stayed type-safe.** The legacy card narrowed
  `raw` (`{value?,weight?,contribution?} | string`) with `typeof raw ===
  "object" ? raw : {}` and then read `.value` off it. In the extracted
  `driverLines` view model I narrowed to `… : null` and used optional chaining
  (`d?.value ?? "—"`) instead — same output, no `{}`-property access, no `any`,
  no `!`.
- **Geofence line flattened to a string** in the page (`{n} m — per-factory
  override` / `engine default`) so `FactoryLocation` takes a plain
  `geofenceValue` string rather than JSX — the numeric span belonged to the
  legacy caption, not the value.
- **Kept the `cd-w3` / `cd-side3` layout** — the 3-column restructure is
  slice 6. The two new cards render inside the existing aside beside the
  already-migrated identity/provenance cards from slice 2.
- **Server components.** Both new pieces are presentational — no hooks,
  handlers or DOM writes (WEB-012) — usable directly in this async server page.

## Verification

- [x] Static: new files carry no comments/`let`/`any`/`svg`/CSS-literals; all
  11 `--sqx-*` tokens used are defined in `saqeel.css`; `Card`/`CardBody`/
  `CardHeader`/`CardValue`/`CardValueSlot`/`DefinitionList`/`StatusPill`
  imports resolve (checked exports + `CardValue kind` union from disk); braces/
  parens balanced; `riskTone` fully removed (0 refs) with `driverEntries` still
  consumed; no leftover `cd-riskcard`/`cd-maplens` markup.
- [ ] `npm run typecheck` / browser / Arabic — not run (SWC/env blocker).

## Parked / remaining slices

4. Main-column sections: location table, risk history (+ `ContextualAiPanel`,
   itself a legacy component), case timeline, inspection history.
5. Documents / representatives / products / materials / workforce sections.
6. `cd-w3` layout → grid primitive; `Controls.tsx`; route-file slim
   (reads → `features/factories/`); delete orphaned `cd-*`/`sq-f360__*` CSS.

The remaining `{/* … */}` JSX comments live in those un-migrated sections and
come off as each is migrated (route-file slim is slice 6).

## Proposed commit

```
refactor(factories): migrate detail-page risk card + map lens to saqeel primitives
```

## Next

Slice 4 — main-column narrative sections (location table, risk history +
`ContextualAiPanel`, case timeline, inspection history).
