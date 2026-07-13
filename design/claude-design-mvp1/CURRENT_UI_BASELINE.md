# Current UI Baseline

## Product state

Saqeel is an implemented Next.js 15 and React 19 application backed by live Supabase. G9 build completion and G10 verification are recorded as passed in `product-contract/GATE_STATUS.md`. UX work therefore starts from functioning routes and accepted behavior, not from wireframes.

## Visual authority

- Brand: Saqeel — `صقيل | صناعي`.
- Default: near-black indigo dark theme with violet primary, emerald live/success, amber warning, and coral risk.
- Light mode is a first-class field-use theme.
- Type: Space Grotesk for English, IBM Plex Sans Arabic for Arabic, JetBrains Mono for identifiers and operational telemetry.
- Raw visual values are restricted to `apps/web/src/app/tokens.css`.
- Current shared shell: `apps/web/src/components/Shell.tsx`, `ShellClient.tsx`, and `lib/shell-navigation.ts` under `TASK-WEB-SHELL-001`.
- Shared-shell business-tab authority: `authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md`.
- Dashboard business authority: `authority/DASHBOARD_BUSINESS_REQUIREMENT_CONTRACT_V1.md`; runtime at `/dashboard` with distinct Strategic and Operational views.
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
4. `CURRENT_SLICE.yaml` now records the sponsor-directed CD-021 bulk-targeting slice; the dashboard is parked awaiting sponsor runtime acceptance and CD-020 remains external/concurrent. Do not overwrite another slice's files or evidence.
5. Older Fable/Astryx prompts conflict on Mobbin. Pattern research is permitted by DEC-011, but copying is prohibited.
6. The catalogue and code deliberately consolidate several logical screens into shared routes; this must remain visible in the reconciliation matrix.
7. Live Operations is a projection prototype. Real GPS, provider-backed video, and outbound notification delivery remain release integrations.
8. The business reference shell supplied on 2026-07-13 is reconciled, not copied. Analytics, lookups, notification configuration, integration management and AI tabs remain hidden until governed routes and behavior exist.
9. The business reference's sample KPI values, annual target, AI brief and prescriptive inspector recommendation are not data authority. Runtime values are RLS-scoped; ungoverned metrics are explicitly unavailable.
10. CD-021 added `/planning/bulk/review` as a real pre-publish P02 configuration/assignment step and labelled it `SCR-WEB-120`; the governed catalogue already assigns `SCR-WEB-120` to Single Visit Planning. This identifier collision requires reconciliation.
11. `/planning/plans/:id` remains a read-only/post-publish drill-down. CD-024 must not add editing controls there. The contract target `/planning/:id/configure` remains a logical, unimplemented route pending change control.
12. Current bulk automatic assignment is deterministic round-robin over inspector-role users. It does not prove skill, capacity, proximity, travel time or overlap avoidance. These signals must not appear as verified recommendations.

## Implemented shared-shell baseline — 2026-07-13

- Grouped, collapsible desktop navigation with no clipped labels.
- Server-rendered role-to-route visibility using the current authenticated user and RLS-scoped `user_roles`.
- Sticky topbar with navigation search, theme, notifications, language, own-account identity and sign-out.
- Arabic-first full-document RTL, including a physical right-side mobile drawer.
- Accessible drawer backdrop, close, focus entry/containment, Escape and focus restoration.
- Real destinations only; unsupported business tabs are omitted and recorded in the shell contract.
- Targeted Playwright 10/10 and visual evidence under `product-contract/evidence/screens/shell-v1/`.

## Implemented dashboard baseline — 2026-07-13

- Dedicated `/dashboard` route for Operations and Leadership, with an explicit route-level role guard in addition to RLS and shell visibility.
- URL-backed Strategic/Operational tabs, RLS-scoped entity search, last-30-days/default and custom date range, region scope, visible freshness and partial-source states.
- Source-backed national performance, compliance explorer, operational scorecard, deterministic alerts, workload, cancellations, GPS override detail and planning-to-review audit timeline.
- Truthful unavailable states for absent annual target, inspection-year boundary, presence/timeout, absolute capacity, stuck-duration policy and GPS confirmation field; no AI assistant or fabricated recommendation.
- Arabic-first RTL, English, dark/light, desktop/narrow reflow, keyboard focus and status/alert semantics verified under `product-contract/evidence/screens/dashboard-business-v1/`.

## Design approach

Use controlled evolution: retain Saqeel identity and behavior, improve information hierarchy, component consistency, workflow comprehension, density, field ergonomics, accessibility, responsive behavior, and failure recovery. Every proposal must state the exact existing component or route affected and why the change is safe.

For CD-024 and later, apply `outputs/claude-design-approval-pack/DESIGN_QUALITY_RATCHET_V4.md`: equal-fidelity decision-zone hypotheses, route truth before composition, one-pattern novelty limit, counterfactual proof, realistic Arabic data, hard-state evidence and a blocked handoff for every unsupported runtime leg.
