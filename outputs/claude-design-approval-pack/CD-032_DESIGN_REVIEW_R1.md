# CD-032 Design Review — R1

**Verdict: NOT READY FOR SPONSOR DESIGN REVIEW.** The package is rigorous in intent and correctly prevents fake live GPS. It nevertheless fails the delivery gate, misstates three current runtime capabilities, and does not visually demonstrate an operations workspace at the quality bar requested.

## Strengths to preserve

- The Truth-Layer Switch is the right page signature. Published facts, projected routes and future telemetry are a meaningful safety distinction.
- Provider/tile failure, privacy scope, notification delivery, map-boundary uncertainty and telemetry unavailability are explicitly handled.
- The state catalogue is complete, and the source/freshness language is materially better than generic dashboard copy.

## P1 — package integrity

1. The submitted ZIP contains **556 files**, including older CD packages, root duplicates and `uploads/`. `PACKAGE_PREFLIGHT_CD-032.md` claims a 41-file, CD-032-only archive. That statement is false. R2 must be a newly built archive containing only `outputs/cd-032-r2/`.
2. Every evidence PNG named `*_1440.png` is actually **909×540px**. The package supplies no 1440px desktop proof. Do not name a screenshot after a viewport it does not represent. Export actual 1440px-wide desktop evidence and record width/height plus SHA-256 in preflight.

## P1 — runtime truth

1. **Corrective actions are not unavailable.** `operations/actions.ts` exposes `updateActionFormStatus`: acknowledge or close an `action_forms` row; closed is terminal; the database/RLS verdict is authoritative. Replace `HANDOFF_BLOCKED_OPS_ACTION` for this exact action with a proven wiring leg and show offered → server/RLS recheck → acknowledged/closed → negative result. Supervisor override remains blocked.
2. **CSV export exists.** `OpsExport.tsx` exports scoped monitoring, SLA and risk datasets locally. Replace `HANDOFF_BLOCKED_OPS_EXPORT` with a proven export leg. If export auditing is not proven, block only the audit claim (`HANDOFF_BLOCKED_EXPORT_AUDIT`).
3. **Notification mark-handled exists.** `markNotificationHandled` updates `notifications.delivery_state` to `handled` under RLS. Surface that control as a real, scoped state change; preserve the separate rule that handled/queued never means delivered or received.
4. **“Alert resolved” is not proven.** `/operations` does not load an alerts source or a resolved-alert field. The R1 claim that an inspection finding closes an alert has no route evidence. Remove the resolved-alert state or make it `HANDOFF_BLOCKED_ALERT_SOURCE`; keep alert acknowledgment/resolution unavailable until a source/action is verified.

## P1 — visual and interaction quality

1. All three hypothesis frames devote the visible desktop area to the same header, scope pills and oversized Truth-Layer Switch. The attention queue, map, selected record and concrete action are below the captured fold. This fails the 30-second operating objective and makes A/B/C appear like minor ordering variations, not different task architectures.
2. The selected direction is visually sparse and panel-led. It lacks a decisive attention hierarchy: the user cannot see the most costly issue, why it is first, its current truth layer, and the verified next action in one view.
3. The projected, telemetry and tile-failure state captures do not visibly demonstrate a materially different map/list/drawer outcome above the fold. The layer selection changes a radio outline, not a sufficiently legible operational scene.

## Required visual standard for R2

- At true 1440 desktop, show in the first viewport: compact source/scope strip, compact Truth-Layer Switch, three decision KPIs, at least three ranked attention rows, selected-record detail, and map/list equivalent.
- Make the switch 64–80px high, with a terse truth statement per option; it must control the map/legend/list state visibly, not consume the page.
- Use an industrial operations composition: a ranked attention spine with reason/source/freshness, an active geography canvas, and a verified action/result rail. Avoid a wall of equal cards.
- Make hypotheses structurally distinct: A attention-spine-first, B truth-atlas-first, C workload-timeband-first. A label change or swapping two stacked panels is not sufficient.
- In projected mode, use static dashed routes and centroid posture with an explicit not-live label. In genuine telemetry mode, replace the canvas with an unavailable state and retain queue/list. In tile failure, preserve the map-object list and selected record with no blank dead zone.
- On 412px Arabic RTL, show the Truth-Layer options as a readable vertical radio group; do not compress them into an ambiguous horizontal strip.

No implementation is authorized.
