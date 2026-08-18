# 2026-08-18 · T-160 — `/admin/gis/spatial` rebuilt on SAQEEL + sidebar double-highlight fix

`task: T-160` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The feature-flagged spatial-canvas subroute of the GIS studio — a create-layer
form and a working-layers list (`FEATURE_SPATIAL_CANVAS`; Mapbox held →
`NotYetBoundary` when off). Owner's asks: **migrate off legacy (responsiveness
LTR/RTL, framed skeleton, permission gate, gaps, en/ar from files)** AND **fix the
sidebar double-highlight** — both "GIS Studio" and "Spatial Canvas" lit up on this
route.

## The sidebar double-highlight

`isShellRouteCurrent(current, href)` (`lib/shell-navigation.ts`) ended with a
prefix match: `current === hrefPath || current.startsWith(\`${hrefPath}/\`)`. On
`/admin/gis/spatial` the **GIS Studio** item (`/admin/gis`) matched via
`startsWith("/admin/gis/")` *and* **Spatial Canvas** matched exactly — both
active. The file already exact-matches `/dashboard` and `/admin` for the same
reason (their children are separate nav items). **Fix:** one line —
`if (hrefPath === "/admin/gis") return current === hrefPath;` — so only the most
specific item highlights. **Browser-verified:** only "Spatial Canvas" carries the
active state now; "GIS Studio" is plain. (`/admin/integrations` keeps the prefix
match — its senai-data/factory-data subroutes are tabs, not separate nav items.)

## What was wrong (spatial)

- `AdminShell` + `panel`/`sq-field`/`sq-input`/`badge`/`t-caption`/`btn`/`alert` +
  inline styles; **WEB-015** raw inputs (layer_key, label `<input>`, layer_type
  `<select>`); English-only `t(key,"English")`; flush `RouteLoading`; layer status
  as `badge badge-compliant/warning`; code comments.

## What changed

| File | Action |
| --- | --- |
| `lib/shell-navigation.ts` | **nav fix** — `/admin/gis` exact-match |
| `app/(app)/admin/gis/spatial/page.tsx` | rebuilt as a route file (52 → 9) |
| `app/(app)/admin/gis/spatial/loading.tsx` | **framed skeleton** |
| `app/(app)/admin/gis/spatial/actions.ts` | codes + `revalidatePath` (the legacy action never refreshed); RLS + logic intact |
| `features/admin-gis-spatial/{queries,types,strings}.ts` | created — flag gate + reads + **`gis_admin` resolution** + result localizer |
| `components/sections/admin-gis-spatial/` | screen · create-layer (client) · layers · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-gis.json` | **extended** with a `spatial` section (reused the `adminGis` namespace — no new registration) |
| Deleted | `spatial/CreateLayer.tsx` (rebuilt) |

## Decisions

**Reused the `adminGis` namespace.** Spatial is a subroute of GIS, so its copy is
a `spatial` section under `adminGis` rather than a new namespace — the screen
reads `adminGisMessages(locale).spatial` and the shared `breadcrumb`.

**Permission gate (owner-approved in-UI pattern).** `loadSpatial` resolves
`gis_admin` → `canCreate`. The create-layer form renders only when `canCreate`;
otherwise a **"View only — gis_admin required"** notice. RLS (`gis_admin` on
`gis_layers`) stays the authority — the action still gates on the flag + returns
neutral `NEUTRAL_WRITE_ERROR` on a DB refusal. `NotYetBoundary` preserved for the
flag-off path (the common case here). WEB-015: `TextInput`/`SaqeelSelect`, layer
status a `StatusPill`, framed skeleton.

## No regression

- **`shell-navigation`**: added `isShellRouteCurrent` assertions locking the fix
  (`/admin/gis/spatial` → `/admin/gis` is `false`; each route exact-matches
  itself). The "distinct active states" test passes.
- **`mvp2-modules-rls-negative` M2-06**: the in-UI gate hides the create form for
  a non-gis_admin, so the old fill-then-RLS-refuse path is unreachable. Re-pointed
  to the preserved (stronger) guarantee: a non-gis_admin **never gets a
  `layer_key` input** (route-denied, in-UI-gated, or feature-held) and no "layer
  created".
- **`mvp2-modules-live` M2-06**: guarded — if the create input isn't offered
  (feature held or non-gis_admin), it annotates and returns; otherwise it fills +
  asserts persist-or-RLS-refuse unchanged. `NEUTRAL_WRITE_ERROR` ("…could not be
  saved…") still matches the refused branch. The `input[name="layer_key"]`,
  `input[name="label"]`, and "Create layer" selectors are provided by `TextInput`/
  `Button`.
- `mvp2-m2-06-spatial` (static) reads the DB/migration, not the page — unaffected;
  the "Spatial Canvas" shell nav label and the `/Spatial canvas/i` heading assert
  unchanged.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new files — **0 problems** (`shell-navigation.ts`'s flagged
      comments are pre-existing baseline; the one-line fix adds none)
- [x] `npm run gates:typography` — PASSED
- [x] `npm run gates:date-inputs` — PASSED (none new)
- [x] `npm run check:design-system-v5` — **60** unchanged; spatial adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**; the
      `isShellRouteCurrent` nav-fix test passes
- [x] **sidebar** — browser-verified: only "Spatial Canvas" active, "GIS Studio" plain
- [x] **live (flag off)** — framed `ShellPageFrame` (was flush `AdminShell`),
      breadcrumb Administration / GIS studio / Spatial canvas, `NotYetBoundary` preserved
- [x] **Arabic / RTL** at 375 px — `dir=rtl`, all copy from `ar` JSON, single `<main>`, **0** overflow
- [x] **200% zoom** — **0** overflow

## Owed

- The **flag-on** UI (create-layer form + layers list + the `gis_admin` view-only
  gate) is built + typechecked + linted, but `FEATURE_SPATIAL_CANVAS` is off in
  this env → only the `NotYetBoundary` renders. The form/list + axe on the
  populated state need the flag on.

## Also this session

The GIS toolbar count `612 of 612 factories match` was reworded to
`{shown} factories match your filters` (`مطابق لعوامل التصفية`) so it stops
competing with the pager's `1–25 of 612` — the toolbar states the filter-match
count (map + table scope), the pager owns the table page range.

## Proposed commit

```
feat(admin): rebuild gis spatial canvas on saqeel, fix sidebar double-highlight
```

## Next

The remaining admin surfaces (audit, items, workflows, devices, notifications, …).
