# 2026-08-08 · T-020 (detail page) slice 2 — identity/header + provenance

`task: T-020 /factories/[id] transform (sliced, slice 2 of ~6)` · `status: done` · `duration: ~1h`
`rules applied: WEB-002, WEB-009, WEB-012`

---

## Goal

Migrate the `/factories/[id]` dossier header (action bar), the side-rail identity
card, and the provenance/freshness card off legacy `sq-*`/`cd-*` markup onto
Saqeel primitives. Strings on this page already flow through `t()`, so this is a
markup/visual transform, not i18n.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/sections/factories/factory-identity/factory-identity.tsx` | created | 42 |
| `components/sections/factories/factory-identity/factory-identity.module.css` | created | 11 |
| `components/sections/factories/factory-actions/factory-actions.tsx` | created | 24 |
| `components/sections/factories/factory-actions/factory-actions.module.css` | created | 17 |
| `app/(app)/factories/[id]/page.tsx` | modified | 3 markup regions swapped; `identityFacts`/tones computed; unused `bandTone` removed; 2 legacy JSX comments dropped |

- **Action bar** (`sq-row` + `sq-btn` anchors) → `FactoryActions` (Saqeel
  `Button`s in a colocated flex module + the supervision note). Still gated on
  `permissions["create_inspection"]` in the page.
- **Identity card** (`cd-idcard` with eight `cd-idrow` `<p>`s) → `FactoryIdentity`:
  a `Card` (eyebrow heading + `<bdi>` code title) with a `DefinitionList` of the
  seven identity facts and a context line.
- **Freshness/provenance card** (`cd-fresh`) → a `Card` with the source as a
  **`StatusPill`** (test → warning, senaei → success, else → danger) plus the
  synced timestamp — the provenance is now text + shape, not a bare line.
- **Topbar context**: the risk `sq-lozenge` became a `StatusPill`
  (high → danger, medium → warning, low → success).

## Decisions

- **Kept the `cd-w3` / `cd-side3` / `cd-main3` layout** for now — restructuring
  the 3-column grid touches the whole page and belongs to a later slice. The new
  cards render inside the existing aside, mixing with the still-legacy risk card
  and map lens (slice 3).
- **Server components.** Both new pieces are presentational, no hooks/handlers/
  DOM writes (WEB-012), usable directly in this async server page.
- `data-screen-id="F360-S03"` on `cd-w3` preserved (kept the wrapper).

## Verification

- [x] Static: new files have no comments/`let`/`any`/`svg`/CSS-literals; every
  `--sqx-*` used exists; imports resolve; braces/parens balanced; `bandTone`
  fully removed (no unused const); no leftover `cd-idcard`/`cd-fresh`/`sq-row`
  (header) / context `sq-lozenge`.
- [ ] `npm run typecheck` / browser / Arabic — not run (SWC/env blocker).

## Parked / remaining slices

3. Risk/condition card (`cd-riskcard`, colour-only `cd-risk-*` → `StatusPill`) +
   map-lens heading/coords.
4. Main-column sections: location table, risk history (+ `ContextualAiPanel`,
   itself a legacy component), case timeline, inspection history.
5. Documents / representatives / products / materials / workforce sections.
6. `cd-w3` layout → grid primitive; `Controls.tsx`; route-file slim
   (reads → `features/factories/`); delete orphaned `cd-*`/`sq-f360__*` CSS.

The many remaining `{/* … */}` JSX comments live in those un-migrated sections
and come off as each is migrated.

## Proposed commit

```
refactor(factories): migrate detail-page identity/header to saqeel primitives
```

## Next

Slice 3 — risk/condition card + map-lens heading.
