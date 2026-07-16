# CD-001 V7 — Public-Safe PNG Amendment

## Decision

The stakeholder-supplied 3D Saudi industrial atlas is preserved as the visual foundation of CD-001. Only a sanitized derivative may appear on the public sign-in surface. This amendment supersedes any instruction in `# Saqeel MVP1 UIUX Revamp (1).zip` that permits the unsanitized `inspection-hero-render.png` or its operational statistics to be displayed publicly.

Claude Design has exhausted its context window. The design session is closed. Claude Code must continue from the repository, this amendment, the implementation prompt, and the ZIP artifacts without relying on Claude Design conversation memory.

## Preserve from the approved PNG

- Overall KSA 3D terrain, coastline, relief, lighting, depth, and premium dark cinematic quality.
- Recognizable central, eastern, western, northern, and southern spatial orientation.
- Industrial structures around Jubail, Ras Al-Khair, Dammam, Riyadh, Yanbu, Jeddah, Qassim, Ha'il, and Jazan.
- Inspectors in credible PPE, inspection vehicles, routes, geofence halos, and lifecycle cues.
- Kingdom Centre as a restrained Riyadh orientation landmark, never an inspection target.
- City and zone orientation where accurate and legible.
- Strong visual impression that Saqeel coordinates industrial inspection activity across Saudi Arabia.

## Remove from the public-safe derivative

- Left-side legend and all zone metric cards.
- Eastern Zone risk panel and every count or percentage.
- `High Risk`, `Medium Risk`, `Low Risk`, compliance percentages, completed/pending/overdue counts, open violations, risk drivers, SLA statements, and staffing recommendations.
- Bottom `Today` operational totals and `Updated 08:45` or any freshness implication.
- Violation callouts and red non-compliance/alarm halos.
- The baked inspection lifecycle panel if its wording implies an actual operational result.
- Any real-time, live-inspector, actual-customer, actual-factory, enforcement, workload, or decision implication.

Replace red enforcement states with restrained violet, amber, cyan, or green illustrative lifecycle treatments. The derivative itself should contain no essential metrics or interaction text.

## Runtime composition

Target asset path:

`apps/web/public/brand/saudi-atlas/inspection-atlas-public-safe-v1.png`

The derivative is an opaque visual foundation, not the interaction layer. Claude Code must add:

- persistent localized `SAMPLE INSPECTION JOURNEY — NO LIVE OPERATIONAL DATA` truth text in HTML;
- localized city/zone labels in HTML/SVG where needed;
- keyboard, pointer, and touch hotspots;
- accessible dossier content and list alternative;
- routes, stage state, hover/focus/tap behavior, and motion as code overlays;
- reduced-motion, image-failure, responsive/mobile, and no-JavaScript fallbacks.

The unsanitized source is retained only as design provenance and must never be served by the public application.

## Acceptance

P0 fails if any operational number, risk/compliance/violation/SLA/workload claim, red enforcement implication, update time, or live-data suggestion remains visible publicly. P0 also fails if the raster is the sole interaction or accessibility layer.

P1 remains open until source/derivative rights and hashes are recorded. That blocks production release but does not block controlled runtime review on `feat/cd-001-v7-atlas`.
