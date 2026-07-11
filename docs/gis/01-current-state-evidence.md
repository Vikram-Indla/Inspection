# GIS Studio — Current-State Qualification (SCR-ADM-070)

**Date:** 2026-07-12 · **Route:** `/admin/gis` · **Branch:** `setup/g4-memory-continuity`
**Method:** repository read + live runtime probe (localhost:3000, EN and AR locales, Chrome MCP).
**Companion:** requirements brief preserved at [`00-requirements-brief.md`](00-requirements-brief.md).

---

## 1. What exists (verified, not assumed)

### Code inventory (387 lines total)

| File | Lines | Role |
|---|---|---|
| `apps/web/src/app/admin/gis/page.tsx` | 60 | Server page — loads `engine_settings` (engine='gis') + `factories`; banner, error state, empty state, governed-settings table |
| `apps/web/src/app/admin/gis/GisStudio.tsx` | 150 | Client — map + side panel; selection, draft radius live-preview, save form |
| `apps/web/src/app/admin/gis/actions.ts` | 30 | Server action `updateGeofenceRadius` — validated, RLS-guarded (`factories_update`, gis_admin), errors surfaced verbatim |
| `apps/web/src/components/GeoMap.tsx` | 135 | Reusable Leaflet map — token-colored divIcon pins, dashed geofence Circles, FlyTo, click-to-set-radius editor (geodesic distance). Also used by `/field/[visitId]` |

### Stack
- **Renderer:** Leaflet 1.9.4 + react-leaflet 5 (ssr:false dynamic import), OSM raster tiles.
- **DB:** Supabase (`iiozvqntawxfwbgffzqu`). `factories.official_lat/lng numeric(10,7)`, `geofence_radius_m int` (0011), `engine_settings.gis` JSON (accuracy ≤25 m, arrival 200 m, default fence 150 m, telemetry 30 s, route deviation, retention), immutable `geo_events` (kind telemetry|arrival|checkin|override|deviation, accuracy_m, geofence_result, gis_version stamp, override_reason).
- **No PostGIS** — coordinates are plain numerics; geofence evaluation is not server-side spatial SQL.
- **i18n:** platform-level SB19 system exists — `ui_strings` table (0013), `useT()` server runtime, cookie locale, `html dir=rtl`, `scripts/seed_arabic.py` draft seeder, `/admin/localization` review UI.

### Working capabilities (runtime-proven)
1. KSA-wide map, risk-band tone pins (ax tokens only — high/medium/low/neutral), dashed geofence rings (override ?? 150 m default).
2. Pin click → fly-to (zoom 12) + side panel: name, code lozenge, risk band+score, region/city, official coordinates (GIS-Admin-owned, FND-007 messaging).
3. Radius governance: numeric input with live ring preview; **click-map-to-set-fence-edge** (radius = geodesic distance pin→click); save via server action; RLS errors surfaced.
4. Engine defaults read-only table + risk legend; governed settings table with contract IDs.
5. Error banner, empty state, map loading state all present.
6. `geo_events` schema already stores accuracy, geofence_result, gis_version per event — the audit spine the brief asks for partially exists at DB level.

## 2. Bilingual runtime evidence (the decisive finding)

- **Platform shell in AR: PASS.** `html dir=rtl lang=ar`, sidebar mirrors right, nav fully Arabic (نظرة عامة, التخطيط, الزيارات…), OSM basemap renders Arabic place labels natively.
- **GIS page content in AR: FAIL — 0 of ~35 strings localized.** Title, banner, side panel, engine defaults, legend, settings table all hardcoded English. Neither `page.tsx`, `GisStudio.tsx` nor `actions.ts` imports `useT`/dict. Mixed-direction artifacts appear ("≤ 25 m" renders "m 25 ≥").

## 3. Gaps vs brief (screen-scope subset)

| Brief requirement | Current state |
|---|---|
| Search + zoom to result | Missing |
| Region/risk filters | Missing |
| Legend with counts | Legend yes, counts no |
| Map↔table linked selection | No table at all |
| Factories without coordinates | **Silently dropped** from map; invisible to admin |
| AR/EN governed UI | Missing on this screen (platform i18n exists) |
| Clustering / density | Missing (21 seeded factories — not yet load-bearing) |
| Polygon fences, vertex edit, snapping, undo | Circle-only |
| Versioning, maker-checker, rollback, simulation | Missing (radius update is direct write; audit trigger stack exists platform-wide) |
| Offline, GPS uncertainty ring, 3-state geofence UX | Field-app scope, not this screen; `geo_events` stores accuracy but no uncertainty model in decisions |
| Import/export, heatmaps, time playback | Missing |

## 4. Verdict

The existing screen is **not** a throwaway: selection, live radius preview, geodesic click-to-set-edge, RLS-guarded governance and token-only styling are real and worth keeping. The renderer question (MapLibre vs Leaflet) is **not** the current bottleneck; the screen's poverty is workflow + bilingual coverage. Full brief (Phase 1 discovery packet, technology decision record, geofence engine redesign) remains open and gated on approval per the brief itself.

**Slice shipped alongside this doc (strictly additive, Leaflet kept):** full AR/EN localization of the screen (governed `ui_strings` keys, RTL-safe), factory search with zoom-to-result, region + risk-band filters, legend with live counts, linked map↔table selection, and explicit surfacing of factories without coordinates. Nothing existing was removed or weakened.

## 5. v1.1 verification (2026-07-12, Playwright, production build)

Files changed: `page.tsx`, `GisStudio.tsx`, `actions.ts` (localized errors), `scripts/seed_arabic.py` (+55 `gis.*` AR drafts, seeded to `ui_strings` as `draft`; `.ts` scan + regex word-boundary fix). `GeoMap.tsx` untouched. `tsc --noEmit` clean, `next build` clean.

**17/17 automated checks PASS** (session minted via Supabase admin magiclink for seed user `admin@mim.example`):
EN loads · dir=ltr · search present · 24/24 count · "Jubail" narrows to 2/24 · table rows track filter · Enter selects+flies first match · radius form · save round-trip ("saved" lozenge; test override reverted to NULL after) · region filter narrows · table-row click selects on map · legend counts · AR dir=rtl · AR title · AR placeholder · AR table headers · AR side panel labels.

Screenshots: `gis-v11-en-full.png`, `gis-v11-en-selected.png`, `gis-v11-ar-full.png`, `gis-v11-ar-selected.png` (session scratchpad; attach to acceptance record on approval).
Numeric cells forced `dir="ltr"` — fixes the pre-existing "m 25 ≥" mixed-direction artifact.

**Known limits of this slice (unchanged from brief):** circle fences only, no versioning/maker-checker on radius edits, no clustering (24 factories), no import/export, no time playback; server action errors localize on next submit, not retroactively. Arabic strings are machine drafts pending review in `/admin/localization`.
