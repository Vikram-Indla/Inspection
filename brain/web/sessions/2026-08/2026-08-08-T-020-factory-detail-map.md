# 2026-08-08 · T-020 (detail page) slice 1 — factory spatial map

`task: T-020 /factories/[id] transform (sliced, slice 1 of ~5)` · `status: done` · `duration: ~30m`
`rules applied: WEB-002, WEB-009, WEB-010 §3 (dynamic import), WEB-012`

---

## Goal

Beautify the map on the factory detail page `/factories/[id]` — first slice of
the larger dossier transform (owner chose to slice it; confirmed the URL stays on
`[id]`, not the `cr/[id]` redirect).

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/factories/[id]/FactorySpatialMap.tsx` | modified | legacy chrome → Saqeel |
| `app/(app)/factories/[id]/FactorySpatialMap.module.css` | created | 22 |

The `GeoMap` (Leaflet) engine is untouched and stays dynamic-imported
(`ssr:false`, WEB-010 §3). Only the chrome changed: the map frame is now a
tokened, rounded, bordered container via a colocated module; the legend's three
legacy `badge badge-*` chips became `StatusPill`s (official → `info`, observed
arrival → `success`, GPS override → `danger`), pinging per the standing
all-pills-ping rule; the empty note uses `text.caption`. Removed: `className`
`stack`/`row`/`badge`/`t-caption`, and every inline `style={{…}}` carrying raw
literals (`280`, `8`) and legacy tokens (`--radius-sm`, `--border-subtle`). The
hard-coded official-marker label `"Industrial-license official location"` now
reuses the `officialPin` string prop.

## Decisions

- **Legend uses `StatusPill`, not a bespoke dot legend** — reuses a hardened
  primitive, guarantees text + shape (not colour alone), and the info/success/
  danger tones mirror the old info/compliant/critical intent. They ping, which
  matches the owner's all-pills-ping direction.
- **Engine untouched.** Restyling Leaflet markers/tiles would mean editing the
  shared `GeoMap` (used by operations too) — out of scope for a chrome beautify
  and against the map-chrome/engine split. Marker tone→colour still comes from
  `GeoMap`.

## Verification

- [x] Static: no comments/`let`/`any`/`svg`/inline-style; no banned CSS literals
  or legacy tokens; every `--sqx-*` used is defined in `saqeel.css`; imports
  resolve.
- [ ] Browser/dark/Arabic — not run (SWC/env blocker). Owner check requested.

## Parked / remaining slices of the `/factories/[id]` transform

Still fully legacy in `[id]/page.tsx` (45 KB, 152 legacy hits): identity/header,
provenance-led case timeline, risk/condition + snapshot, documents/findings/
actions, and the `Controls.tsx` (11 KB) client piece. Route-file slim + reads →
`features/` also pending. Event-marker tooltip labels (`e.kind` raw) and the
`ContextualAiPanel` legacy component are follow-ups. Proposed next slice:
identity/header + provenance.

## Proposed commit

```
style(factories): beautify detail-page spatial map on saqeel primitives
```

## Next

Slice 2 — `/factories/[id]` identity/header + provenance.
