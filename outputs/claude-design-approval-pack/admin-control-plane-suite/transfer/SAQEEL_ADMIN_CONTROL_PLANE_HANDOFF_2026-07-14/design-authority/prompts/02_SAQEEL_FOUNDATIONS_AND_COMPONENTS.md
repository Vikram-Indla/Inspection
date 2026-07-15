# Prompt — Saqeel Foundations and Components

Use the master constitution and discovery output. Refine the existing design system without rebranding it.

## Foundation work

Audit and specify dark/light semantic colors, typography, spacing, radii, elevation, grids, motion, iconography, data visualization, maps, focus, disabled, validation, offline, stale, and privacy states. All values must resolve through `tokens.css`; proposed additions must be semantic and reusable.

## Component inventory

Define code-ready variants for:

- Application shell, page header, breadcrumbs, tabs, contextual panels, action bars, drawers, modals, banners, toasts, and notifications.
- Dense tables, filters, saved views, bulk actions, split panes, KPI cards, timelines, evidence galleries, diff viewers, audit trails, and status lozenges.
- Admin studio tree/canvas/inspector, draft/published banner, dependency validation, impact analysis, simulation, approval, and publish confirmation.
- Field assignment cards, startup checklist, map/route card, sync indicator, section navigator, evidence capture, blocker summary, signature, and recovery panel.
- Map legend, pin clusters, shape-coded risk markers, geofence rings, freshness, stale/provider-unavailable overlays, and list synchronization.
- Video stage, participant rail, device readiness, OTP verification, connection quality, evidence request, fallback, and provider-pending states.

## Required variants

Default, hover, focus, active, selected, disabled, loading, skeleton, empty, validation error, permission denied, read-only, stale, degraded, offline, queued, syncing, conflicted, failed, and recovered.

## Acceptance

- Minimum 48px field/iPad targets and 16px input text.
- Visible keyboard focus and complete keyboard order.
- WCAG AA text/control contrast.
- Reduced-motion alternative.
- Status never conveyed by color alone.
- Logical CSS and mirrored interaction order in RTL.
- Component names map to existing React components or a proposed shared component with affected routes listed.

Return a component-disposition matrix and representative high-fidelity specimens before journey screens.
