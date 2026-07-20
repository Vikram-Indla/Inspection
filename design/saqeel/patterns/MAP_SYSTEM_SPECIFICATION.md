# MAP_SYSTEM_SPECIFICATION — Geospatial Command Workspace
The map is a PRIMARY workspace. Rules:
- Never tint or wash the basemap; dark mode = dark basemap style from the engine. Preserve the existing zone-hover elevation behaviour (functional guardrail).
- Composition (signature/GeoWorkspace): centered floating toolbar (search+filters) · layers+legend panel inline-end · selected-zone/inspection panel inline-start-bottom · zoom/locate stack inline-end-bottom · optional operational Drawer.
- Panels float on --map-control-surface (96% opaque + 4px blur), 1px border, shadow-sm — legibility without hiding geography.
- Markers: 26px status-toned circles with white keylines (surface-raised keyline in dark), Lucide glyph per kind (facility/vehicle/inspector/zone); clusters = graphite pills with counts; selected = focus ring. Marker tones use the SAME 10 status semantics.
- Zones: --map-zone-fill (10–12% accent) + dashed --map-zone-stroke.
- States: loading (centered panel), empty (bottom notice, map stays live), restricted (overlay + explanation), error (Alert in panel).
- RTL: panels mirror via logical insets; basemap and coordinates do not mirror.
- Vehicles/inspection markers must remain visible at operational zoom — no fading below cluster threshold.
- Reference: map-command.html / -dark / -ar; components/map/* + components/signature/GeoWorkspace.jsx.
