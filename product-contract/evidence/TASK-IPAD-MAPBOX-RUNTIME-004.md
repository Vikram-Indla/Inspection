# TASK-IPAD-MAPBOX-RUNTIME-004 — Cross-application Mapbox migration

**Date:** 2026-07-16
**Scope:** shared web maps, Admin GIS/Operations maps, iPad field map and
road-network ETA. This is a provider migration, not a change to geofence
authority, GPS policy, workflow state, audit history or offline approval rules.

## Sponsor decision

The sponsor supplied Mapbox credentials, directed use of the Mapbox MCP/server,
and clarified that Mapbox must operate across web, Admin and iPad. This is
recorded as the current resolution of `DEC-008` and in
`HUMAN_APPROVALS.yaml#MAPBOX-CROSS-APPLICATION-PROVIDER`.

## Delivered source boundary

- `apps/web/src/components/GeoMap.tsx` now uses Mapbox GL JS as the single
  shared web/Admin/iPad renderer. Its public token is read only from
  `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`; no token is committed.
- Circle fences are rendered as metre-based geodesic GeoJSON polygons rather
  than screen-pixel circles. Existing marker selection, popups, radius editing,
  map focus and server-side/geofence authority remain intact.
- `operations/live/LiveMapInner.tsx` is Mapbox-based, retaining the visibly
  labelled projected-route distinction; it does not claim live GPS telemetry.
- The login atlas’s asset-failure path now uses the shared Mapbox renderer.
  Leaflet and React Leaflet are removed from source and dependencies.
- `/api/routing/eta` uses Mapbox Directions with a server-only
  `MAPBOX_ACCESS_TOKEN`. The Google-specific external navigation link was
  removed; the iPad keeps the provider-neutral device `geo:` handoff.
- `apps/web/.env.example` documents the public browser and server-side token
  variables without containing credentials.

## Source verification

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| Focused static Playwright contracts | PASS — 5/5 |
| `npm run build` | PASS |
| Runtime source scan for Leaflet/React Leaflet | PASS — no matches |
| Runtime source scan for Google Maps/Routes | PASS — no matches |
| `git diff --check` | PASS |

## Honest runtime boundary

Actual Mapbox tile, label-language and Directions calls have **not** been
claimed here. The sponsor confirmed that `iiozvqntawxfwbgffzqu`
(Vikram-Indla's Project, Seoul) is the Inspection staging database. The CLI was
linked only to that project, and read-only migration-history/schema checks
passed: the local and remote history reconcile, `evidence.evidence_note` is
present, and `reviews_one_open_per_version` is present. No DDL, staging data,
workflow mutation, Catalyst target or production target was used.

The database confirmation does not configure the application runtime. This
worktree has neither a staging hosting configuration nor local ignored values
for `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` and `MAPBOX_ACCESS_TOKEN`. To complete
controlled provider evidence, configure those values in the actual Inspection
staging *application* environment (never Catalyst), then run authenticated
web/Admin/iPad map and ETA checks. Mapbox offline packs and formal licence or
data-residency confirmation are not delivered by this web migration.

The Mapbox MCP endpoint is configured for Codex, but it was not exposed as a
callable tool in this already-running session. The implementation used the
official Mapbox GL JS and Directions documentation; this does not affect the
runtime integration.
