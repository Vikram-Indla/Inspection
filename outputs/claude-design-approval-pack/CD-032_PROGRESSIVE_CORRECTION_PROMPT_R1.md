# Claude Design — CD-032 R1 Premier-quality Correction Prompt

Paste this complete prompt into Claude Design. Correct CD-032 only. This is a design correction, not application implementation.

`implementation_authorized: false`

Every Claude Code-facing file starts exactly:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, migrations, data, tests, contract files, Git history, branches or the dirty worktree.

## Read first

Read `CD-032_DESIGN_REVIEW_R1.md`, then re-read these actual sources before changing the design:

- `apps/web/src/app/operations/page.tsx`
- `apps/web/src/app/operations/actions.ts`
- `apps/web/src/app/operations/Controls.tsx`
- `apps/web/src/app/operations/Monitoring.tsx`
- `apps/web/src/app/operations/OpsExport.tsx`
- `apps/web/src/app/operations/OpsMap.tsx`
- `apps/web/src/app/operations/live/page.tsx`, `LiveOps.tsx`, `LiveMapInner.tsx`, `types.ts`

## Binding truth corrections

1. `updateActionFormStatus` is real. It permits a scoped user to **acknowledge** or **close** a corrective action; closed is terminal; server/RLS rejection and already-closed results are real negatives. Design this exact action ladder. Do not invent supervisor override or other mutations.
2. `OpsExport.tsx` is real. It produces local, current-scope CSV exports for monitoring, SLA watch and high-risk factories. Show it as available. Export audit is unproven: label only that `HANDOFF_BLOCKED_EXPORT_AUDIT`.
3. `markNotificationHandled` is real. It transitions a scoped notification to `handled`. Show it as a local handling state, never delivery, receipt or escalation.
4. There is no loaded alerts source or resolved-alert field in `/operations`. Remove the claimed “alert resolved from source” state. If retained for scenario coverage, render an explicit `HANDOFF_BLOCKED_ALERT_SOURCE` state with no action or source claim.
5. Preserve the existing truth boundaries: map pins are operational context, `/operations/live` routes/ETAs are deterministic projections from visit windows, centroid circles are approximate posture—not boundaries—and genuine live telemetry is unavailable/future.

## Rebuild the visual composition

This must look like a premium industrial operations workstation, not a stack of generic dashboard panels.

### Selected direction: A — Attention-spine-first

At a true 1440px-wide desktop viewport, the first visible workspace must contain all of the following without requiring a scroll:

1. A compact command strip: scope, exact refreshed time/source and compact Truth-Layer Switch. The switch occupies no more than 80px height and each choice has a label, icon/pattern and one short truth statement.
2. A thin decision KPI belt: **SLA at risk**, **blocking actions**, **published visits in scope**. Each is source/freshness-labelled; do not invent target thresholds.
3. A left attention spine (about 42% width): three ranked, 64px-minimum rows. Every row shows severity, object ID/factory, one plain-language reason, source/freshness, truth-layer relevance and the verified next action or `unavailable`.
4. A right operational context area (about 58% width): a bounded map/layer canvas with a visible list-equivalent immediately adjacent or directly below it, plus a selected-record rail showing only verified factory, visit, operational state, window, geofence fact and action consequences.
5. The selected queue row, map/list object and context rail must visibly stay synchronized.

The visual hierarchy must make the first ranked item unmistakable, without turning the page into an alarm wall. Use the Saqeel indigo/violet system sparingly; reserve coral/amber/emerald for governed meaning with labels and patterns.

### Make the Truth-Layer Switch operational, not decorative

- **Published plan:** map/list show official factory coordinates plus active-visit/scheduled facts. Banner: `Published facts — not a real-time position feed.`
- **Projected & approximate posture:** visibly replace map content with static dashed projected paths and approximate centroid-posture circles. Banner: `Projected from visit window — not live GPS · posture is not an official boundary.` No motion in the captured state.
- **Genuine telemetry:** replace the map canvas with a deliberately designed unavailable panel. Queue, list-equivalent and selected record remain usable. State: `Genuine telemetry unavailable — no device provider is connected.`

The switch must be a semantic radiogroup and preserve a static list-equivalent in every layer. On 412px Arabic RTL it becomes three full-width, vertically stacked **48×48px minimum** options with readable labels—never a squeezed horizontal card.

### Rebuild the other two hypotheses so they are genuinely different

- **B — Truth-atlas-first:** map/layer/list is the dominant center; queue becomes a persistent narrow action rail. The selected layer makes the geography visibly change.
- **C — Workload-timeband-first:** a time-ordered visit/workload band is dominant, grouping the same verified visits by operational state/window/SLA posture. The map becomes linked evidence, not a duplicate panel.

Each must make a different 30-second decision easier. Do not merely swap stacked panels, change the selected radio, or change labels.

## State-quality requirements

- **Tile failure:** replace map imagery with a clear rendering-only failure block; retain map-object list, selected record and queue with no blank/dead space.
- **Widget failure:** show only the failed SLA widget in error; the attention spine recalculates/presents remaining verified priorities without a fake SLA result.
- **No visits:** zero the appropriate verified summaries and retain factory/risk scope, not a generic blank dashboard.
- **Privacy/RLS:** mask fields/objects rather than fabricating absent values; distinguish scope limitation from a service failure.
- **Notification queued/handled:** show queued-not-delivered and the proven Mark handled control/result distinctly.
- **Corrective actions:** show acknowledge/close offered → server/RLS check → result; show closed as terminal and a neutral RLS/already-closed negative. Do not claim atomicity, delivery, override or reassignment.

## Evidence and package gate

Create only `outputs/cd-032-r2/` containing the complete corrected package, including `support.js`, `cd32.css`, all maps, handoff, state matrix and evidence.

Build a new archive whose sole root is `outputs/cd-032-r2/`. It must contain no other CD package, root duplicate, `screens/` or `uploads/` artifact.

In `PACKAGE_PREFLIGHT_CD-032.md`, record:

1. the exact archive listing;
2. local reference resolution for every HTML/CSS/JS/SVG asset;
3. actual SHA-256 values for A/B/C;
4. actual image pixel dimensions for each desktop, 1024 and 412 PNG;
5. a state-matrix-row → PNG-path inventory;
6. proof that all interactive targets are at least 48×48px;
7. proof that actions/export/notification handling now reflect current source, while alert source and unproven capabilities remain blocked.

Do not call a 909×540 export “1440.” Desktop evidence must actually be at least 1440px wide. Return `PACKAGE_PREFLIGHT_PASS` and `READY_FOR_DESIGN_REVIEW_R2` only when every recorded fact is true; otherwise return `PACKAGE_PREFLIGHT_FAIL` with the failing path. Do not implement.
