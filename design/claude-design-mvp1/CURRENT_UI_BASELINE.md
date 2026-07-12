# Current UI Baseline

## Product state

Saqeel is an implemented Next.js 15 and React 19 application backed by live Supabase. G9 build completion and G10 verification are recorded as passed in `product-contract/GATE_STATUS.md`. UX work therefore starts from functioning routes and accepted behavior, not from wireframes.

## Visual authority

- Brand: Saqeel — `صقيل | صناعي`.
- Default: near-black indigo dark theme with violet primary, emerald live/success, amber warning, and coral risk.
- Light mode is a first-class field-use theme.
- Type: Space Grotesk for English, IBM Plex Sans Arabic for Arabic, JetBrains Mono for identifiers and operational telemetry.
- Raw visual values are restricted to `apps/web/src/app/tokens.css`.
- Current shared shell: `apps/web/src/components/Shell.tsx`.
- Existing design prototypes: `design/astryx/` D1–D9.

## Existing special components

- Reusable Leaflet geofence map: `apps/web/src/components/GeoMap.tsx`.
- Authenticated operations map: `apps/web/src/app/operations/live/`.
- Field geolocation and journey logic: `apps/web/src/app/field/[visitId]/Startup.tsx`.
- Offline/outbox engine: `apps/web/src/lib/offline.ts`.
- Inspection workspace: `apps/web/src/app/field/inspection/[id]/Workspace.tsx`.
- Image compression and annotation: `apps/web/src/components/ImageAnnotator.tsx`.
- Virtual OTP/session orchestration: `apps/web/src/app/virtual/[id]/Room.tsx`.
- Review and immutable decision controls: `apps/web/src/app/reviews/`.

## Baseline risks to design around

1. The worktree contains uncommitted user work. Do not overwrite or normalize it.
2. A previously served production build was stale relative to source and produced a chunk-load error after login. Rebuild before any visual audit.
3. `product-contract/design/DESIGN_AUTHORITY_STATUS.md` is stale; `GATE_STATUS.md` and DEC-011 are current.
4. `CURRENT_SLICE.yaml` also contains stale G10 wording. Do not use it to downgrade the passed gate.
5. Older Fable/Astryx prompts conflict on Mobbin. Pattern research is permitted by DEC-011, but copying is prohibited.
6. The catalogue and code deliberately consolidate several logical screens into shared routes; this must remain visible in the reconciliation matrix.
7. Live Operations is a projection prototype. Real GPS, provider-backed video, and outbound notification delivery remain release integrations.

## Design approach

Use controlled evolution: retain Saqeel identity and behavior, improve information hierarchy, component consistency, workflow comprehension, density, field ergonomics, accessibility, responsive behavior, and failure recovery. Every proposal must state the exact existing component or route affected and why the change is safe.
