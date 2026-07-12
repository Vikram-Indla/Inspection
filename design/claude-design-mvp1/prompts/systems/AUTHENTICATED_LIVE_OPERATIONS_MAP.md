# System Prompt — Authenticated Live Operations Map

Inspect `/operations/live`, LiveOps.tsx, LiveMapInner.tsx, types, source queries, and DEC-011 SAQEEL-09.

Design two explicitly different modes:

1. Current MVP1 projection: factory and region data are real/RLS-scoped; inspector movement is projected from visit windows.
2. Future telemetry-ready mode: real location, accuracy, timestamp, freshness, privacy/consent, connection, and playback become available only after integration.

The current mode must always display `Projected route — not live GPS`. Design region posture, shape-coded factory risk, inspector state, route trail, counters, selection, side panel, drilldown, filters, legend, attribution, stale timestamp, RLS-empty, tile failure, no positions, reduced motion, and wallboard behavior. Do not use animation as proof of real time.

Acceptance IDs: SPC-LIVE-001 through SPC-LIVE-007.
