# Inspection Platform GIS Studio — Research Outcome and Claude Opus Brief

**Date:** 12 July 2026  
**Scope:** Replacement of the current picture-like Leaflet/OpenStreetMap GIS screen with an enterprise-grade, bilingual, interactive GIS operating model for inspectors and GIS administrators.

---

## 1. Current-state assessment from the supplied screen

The current `/admin/gis` screen shows a Leaflet/OpenStreetMap basemap with simple red, amber, and green point markers. It proves that geographic rendering and factory coordinates exist, but it does not yet behave as an operational GIS workspace.

Visible gaps include:

- No search, task query, region filter, or “zoom to result”.
- No visible layers catalogue, legend with counts, basemap switcher, or map style control.
- No marker clustering, density treatment, risk symbols, or zoom-dependent detail.
- No selected-factory card, linked inspection data, contextual actions, or route.
- No visible geofence geometry, vertex/radius editing, confidence ring, or rule simulation.
- No map/table linked selection.
- No offline-area, sync, GPS freshness, or horizontal-accuracy experience.
- No clear inspector workflow; the screen is an administrator configuration page with a mostly passive map.
- Arabic labels exist in the basemap, but the product does not visibly provide a governed Arabic/English cartographic and RTL interaction model.

Replacing only Leaflet will not solve this. The replacement must combine a modern renderer, spatial data architecture, inspector workflow, administrator authoring workspace, geofence decision engine, and bilingual cartographic design.

---

## 2. Research conclusion

### Recommended reference model

Do not clone a single product. Use a governed composite reference:

1. **Inspector functional reference — ArcGIS Field Maps**
   - Map-based assignments, asset discovery, smart forms, field capture, offline work, location awareness, and synchronization.

2. **Inspection form reference — ArcGIS Survey123**
   - Calculated values, conditional logic, multilingual forms, offline capture, evidence, reports, and geographic analysis.

3. **Administrator interaction reference — Felt**
   - Layer catalogue, legend, selection, spatial filters, styling, annotations, editing, and linked map/table patterns.

4. **Mobile map interaction reference — DoorDash Dasher and Careem**
   - Route-first map, task sequencing, selected-job bottom sheet, ETA, prominent next action, and readable Arabic labels.

5. **Renderer/architecture candidates**
   - **ArcGIS Maps SDK** when an Esri estate, licences, offline field operations, and enterprise GIS governance already exist.
   - **MapLibre GL JS** when the platform needs custom UX, self-hosting, data sovereignty, and reduced vendor dependency.
   - **Mapbox GL JS** when fastest premium hosted cartography, 3D, search, directions, and managed map services outweigh vendor dependency.
   - **deck.gl** as an optional analytical layer for high-volume points, heatmaps, trajectories, and GPU-based visual analysis.
   - **PMTiles** for low-maintenance distribution of read-only vector/raster tile archives; transactional operational data should remain in a spatial database.

### Provisional recommendation

For a custom inspection platform, the strongest provisional architecture is:

- **Web renderer:** MapLibre GL JS.
- **Operational spatial database:** PostgreSQL/PostGIS.
- **Vector-tile service:** select after repository and infrastructure discovery; do not introduce one by assumption.
- **Read-only basemap/large static layers:** PMTiles where appropriate.
- **Large analytical overlays:** deck.gl only where dataset size proves it is needed.
- **Drawing/editing:** a maintained geometry editor compatible with the selected renderer.
- **Mobile/offline:** either a native/mobile map SDK with supported offline packs or an existing ArcGIS Field Maps integration; a desktop PWA must not be assumed to provide reliable background geofencing.
- **Authoritative geofence decisions:** server-side spatial validation with a versioned rule record, not marker colour or client-only logic.

This recommendation must be confirmed against existing licences, hosting restrictions, mobile architecture, expected data volumes, navigation needs, Saudi data-residency requirements, and the current codebase.

---

## 3. Target product model

### Inspector experience

The map must open around the inspector’s assigned work, not at a national overview unless explicitly requested.

Required capabilities:

- Today / upcoming / overdue inspection layers.
- Current-location puck, heading, timestamp, and visible horizontal-accuracy ring.
- Assigned route, sequence, ETA, travel status, and navigation handoff.
- Clustered locations at regional zoom; semantic factory/inspection symbols at local zoom.
- Status, risk, priority, factory type, due date, region, inspector, and programme filters.
- Selected factory bottom sheet containing identity, licence, risk, appointment, previous findings, contacts, route, check-in eligibility, and primary next action.
- Visible geofence boundary and a clear state: **inside**, **near boundary / uncertain**, or **outside**.
- Offline-area download, storage size, last refresh, sync queue, conflict state, and retry.
- Start inspection, capture evidence, add geotagged issue, voice note, photo/video, annotation, and emergency/escalation actions.
- Map/list switch without losing selection or filters.
- Arabic and English labels, directions, dates, numbers, and mirrored RTL layout.
- One-handed mobile interaction and accessible touch targets.

### GIS administrator experience

Use a three-pane operating workspace:

- **Left:** search, saved views, filters, legend, layer catalogue, counts, and visibility.
- **Centre:** interactive map with zoom-dependent symbology.
- **Right:** selected factory/geofence/rule detail and edit panel.
- **Bottom drawer:** linked data table with sortable columns, bulk actions, export, and row-map synchronized selection.

Required capabilities:

- Search by factory, licence, CR, region, coordinates, inspector, visit, or issue.
- Layer visibility, ordering, opacity, legend, scale dependency, and basemap selection.
- Circle and polygon geofence authoring with radius input, draggable vertices, snapping, undo/redo, measurement, and validation.
- Bulk import and export of GeoJSON, KML, CSV, or approved enterprise formats.
- Geometry quality checks: invalid polygon, duplicate location, self-intersection, unexpected coordinate system, factory outside region, and overlapping fences.
- Effective dates, draft/approved/retired state, maker-checker approval, version history, comments, and rollback.
- Rule simulation using stored or synthetic GPS samples before publishing.
- Regional heatmaps, clusters, inspection density, overdue concentration, failed check-ins, and travel-time analysis.
- Time playback and before/after comparison.
- Role-based access by region, factory, layer, and action.
- Complete audit event showing who changed geometry or policy, old/new values, timestamp, reason, and affected inspections.
- Side-by-side English and Arabic preview before publishing a map style or label rule.

---

## 4. Geofence decision model

A coordinate is not exact. Store the full observation:

- Latitude and longitude.
- Horizontal accuracy in metres.
- Observation timestamp and age.
- Heading and speed when available.
- Device/platform and app version.
- Permission and GPS state.
- Mock-location/spoofing signal when the native platform provides one.
- Network/offline state.
- Geofence geometry version and rule version used for the decision.

Use three decision states:

1. **Definitely inside:** the location uncertainty area is fully within the accepted geofence.
2. **Definitely outside:** the uncertainty area does not intersect the accepted geofence or allowed tolerance.
3. **Uncertain / near boundary:** the uncertainty area intersects the boundary.

Do not silently pass an uncertain observation. Apply a configurable policy such as additional samples, dwell time, supervisor override, or supporting evidence. Every outcome must display and store the reason.

The engine must support:

- Circle and polygon fences.
- Configurable entry, check-in, arrival, and exit tolerances.
- Dwell time and repeated-sample rules.
- GPS freshness threshold.
- Accuracy threshold.
- Anti-jitter/hysteresis near boundaries.
- Approved exception and override workflow.
- Server-side PostGIS revalidation.
- Deterministic replay from the stored event and versioned policy.

---

## 5. Arabic/English cartographic requirements

- The UI locale and map-label locale must be governed separately.
- Arabic mode must use true RTL layout, not translated LTR positioning.
- Use Arabic-capable glyphs and verified shaping; do not rasterize labels into the basemap.
- Define whether the default map is Arabic-only, English-only, or primary Arabic with secondary English. Avoid uncontrolled mixed-label clutter.
- Place names, industrial zones, roads, factory names, legends, pop-ups, measurement units, dates, and numerals must be tested in both languages.
- Map controls must use logical start/end placement so they mirror correctly.
- The selected typography must come from the Inspection Platform design system after repository discovery. Do not introduce a new UI font merely because the map engine supports it.
- Test long Arabic factory names, diacritics, abbreviations, numbers, mixed Arabic/Latin licence values, and truncation.

---

## 6. Visual references to inspect

### Administrator GIS

- [Felt — operations map with legend, layer values, and selected-item card](https://mobbin.com/screens/38f0ca1d-f9c4-477b-b2fb-6c942e4b2bee)
- [Felt — layer and annotation management](https://mobbin.com/screens/078a2c38-8b59-46e3-b118-43b7c4b262e5)
- [Felt — map with linked attribute table](https://mobbin.com/screens/be5a21d5-76a5-4afa-8cba-e2300c7258c1)
- [Felt — editable point attributes on the map](https://mobbin.com/screens/3f2c2e3e-63b2-41df-b9cf-f67d210efac5)

### Inspector mobile interaction

- [DoorDash Dasher — route and ordered task list](https://mobbin.com/screens/5859ffb5-02a0-45ee-9065-2ea87eaf43fa)
- [DoorDash Dasher — map, job details, and primary arrival action](https://mobbin.com/screens/d1721ce9-9d29-420d-8817-20bd2cd18b5f)
- [Careem — route, ETA, bottom sheet, and Arabic map labels](https://mobbin.com/screens/21e5b6e4-cb98-484e-b71c-c7bf7d9e2799)
- [Snoonu — Arabic place labels with a focused map status experience](https://mobbin.com/screens/3bbdc680-dbcb-4948-a2a0-db37f4107245)

These are interaction references, not templates to copy. All final screens must use the Inspection Platform design system and domain language.

---

## 7. Official technical references

- [ArcGIS Field Maps](https://www.esri.com/en-us/arcgis/products/arcgis-field-maps/overview)
- [ArcGIS Survey123](https://www.esri.com/en-us/arcgis/products/arcgis-survey123/overview)
- [ArcGIS Maps SDK for JavaScript localization and RTL](https://developers.arcgis.com/javascript/latest/localization/)
- [Mapbox GL JS](https://www.mapbox.com/mapbox-gljs)
- [Mapbox right-to-left text support](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-rtl-text/)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [deck.gl](https://deck.gl/docs)
- [PMTiles](https://docs.protomaps.com/pmtiles/)
- [W3C Geolocation](https://www.w3.org/TR/geolocation/)
- [Android geofencing guidance](https://developer.android.com/develop/sensors-and-location/location/geofencing)

---

# 8. Copy-paste Claude Opus brief

```text
/goal

Act as a principal GIS product architect, field-inspection UX lead, geospatial engineer, and bilingual accessibility specialist. Your mission is to discover, benchmark, design, obtain approval for, and then safely replace the current picture-like map at `/admin/gis` with an enterprise-grade GIS operating model for the Inspection Platform. Do not assume that replacing Leaflet alone solves the problem.

PHASE 1 — DISCOVERY ONLY. DO NOT IMPLEMENT.

1. Prove the current state:
- Inspect the repository, route, components, packages, map renderer, styles, APIs, database tables, migrations, coordinate fields, geofence rules, event records, permissions, localization, design-system components, mobile/PWA/native surfaces, tests, and environment configuration.
- Run the application and capture evidence for English and Arabic.
- Inspect map network calls, tile source, marker source, data volumes, rendering performance, error states, and existing CRUD.
- Trace every current GIS and check-in capability from UI to service to database.
- Identify what is real, mock, partially wired, hidden, or missing.
- Do not rename, delete, refactor, migrate, install, or modify application code during discovery.

2. Benchmark verified references:
- Functional field model: ArcGIS Field Maps.
- Smart inspection forms: ArcGIS Survey123.
- GIS administrator workspace: Felt.
- Premium rendering candidates: ArcGIS Maps SDK, Mapbox GL JS, MapLibre GL JS.
- High-volume analysis: deck.gl only where justified.
- Mobile interaction patterns: DoorDash Dasher and Careem.
- Use Mobbin MCP for real screen references. If Mobbin MCP is unavailable, stop and ask me to connect it.
- Also inspect relevant industrial/public-sector field inspection references such as Fulcrum, Cityworks, Maximo Mobile/Spatial, or equivalent, but cite only evidence you actually verify.
- Do not copy branding. Extract interaction principles, information architecture, and proven workflows.

3. Evaluate technology without bias:
Create a decision matrix for keeping Leaflet, ArcGIS Maps SDK, Mapbox GL JS, and MapLibre GL JS. Compare:
- Existing architecture fit.
- Web and mobile/offline support.
- Arabic labels, shaping, and RTL controls.
- Self-hosting and data sovereignty.
- Licensing and recurring cost.
- Vector tiles, 3D, clustering, heatmaps, drawing, spatial selection, routing, search, and indoor mapping.
- Accessibility.
- Operational data volume and performance.
- Vendor lock-in and migration risk.
- Existing organisational licences and skills.
Do not recommend a vendor until the evidence is complete. State all unknowns.

4. Design two related products:
A. Inspector Map:
- Opens around assigned work, not a passive national view.
- Today/upcoming/overdue layers, current location, heading, accuracy ring, route, ETA, sequence, offline/sync state, semantic clusters, filters, selected-factory bottom sheet, geofence boundary and eligibility state, start inspection, navigation, evidence capture, issue capture, and escalation.
- Map/list switch must preserve filters and selection.

B. GIS Admin Studio:
- Three-pane workspace: left search/layers/legend, centre map, right selected-object editor, plus linked bottom data table.
- Search, saved views, layer catalogue, opacity/order, basemap switch, clustering, spatial filter, measure, circle/polygon drawing, snapping, validation, import/export, bulk actions, versioning, maker-checker approval, rollback, rule simulation, heatmaps, time playback, audit, and permissions.

5. Define the geofence engine:
- Store latitude, longitude, horizontal accuracy, timestamp/age, speed, heading, device/app version, permission/GPS state, network state, geometry version, and policy version.
- Implement a three-state model: definitely inside, definitely outside, and uncertain near boundary.
- Include accuracy threshold, freshness, repeated samples, dwell time, hysteresis, entry/exit tolerances, override workflow, spoof/mock signal where available, and deterministic server-side replay.
- Prove how PostGIS or the existing spatial backend will authoritatively validate each event.
- Never treat one coordinate as exact or let client colour alone decide compliance.

6. Bilingual requirements:
- Produce true EN/LTR and AR/RTL designs.
- Verify Arabic place labels, shaping, long names, mixed Arabic/Latin identifiers, controls, dates, numbers, units, legend, pop-ups, and table alignment.
- Use the existing Inspection Platform typography and canonical components unless discovery proves a formal change is required.
- The UI locale and map-label locale must be independently governed.

MANDATORY DELIVERABLES BEFORE APPROVAL:
1. `docs/gis/01-current-state-evidence.md`
2. `docs/gis/02-market-reference-catalogue.md` with source links and screenshots.
3. `docs/gis/03-capability-gap-matrix.md`
4. `docs/gis/04-technology-decision-record.md`
5. `docs/gis/05-target-product-model.md`
6. Inspector and GIS-admin end-to-end Mermaid journeys.
7. Target information architecture and feature inventory.
8. EN and AR high-fidelity mock screens for desktop and mobile, including empty/loading/error/offline/uncertain-GPS states.
9. Component mapping showing reuse of every canonical platform component.
10. Spatial data model, API contracts, permission model, geofence algorithm, audit model, and migration strategy.
11. Phased implementation plan with dependencies, rollback, feature flag, tests, performance targets, and acceptance criteria.
12. A decision packet that explicitly asks for approval of reference model, technology, architecture, and screens.

FAIL THE DISCOVERY if:
- Findings lack repository/runtime evidence.
- A technology is chosen because it “looks modern”.
- Arabic is treated as translation only.
- Inspector and administrator needs are merged into one generic map.
- The proposed map remains a basemap with coloured dots.
- Offline, GPS uncertainty, geofence auditability, or linked map/table interaction is omitted.
- Mock screens are not supplied.
- Existing functionality is removed or regression risk is not mapped.

AFTER MY WRITTEN APPROVAL ONLY:
Implement phase by phase behind a feature flag. Preserve existing routes, data, permissions, check-in rules, and audit history. Add automated unit, spatial, integration, localization, accessibility, performance, offline/sync, and visual-regression tests. Use seeded edge cases near boundaries and prove every acceptance criterion with runtime screenshots and test evidence. Do not mark complete until both English and Arabic inspector/admin journeys pass end to end.
```
