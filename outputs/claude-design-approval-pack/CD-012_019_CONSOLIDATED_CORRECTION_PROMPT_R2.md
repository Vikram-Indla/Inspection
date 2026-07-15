# CD-012–019 R2 — Consolidated Correction Prompt

Correct the complete **CD-012 through CD-019 Saqeel Admin Control Plane** package. R1 is blocked. This is not a restyling exercise: rebuild the evidence and the implementation hand-off from the actual repository, eliminate placeholder theatre, and produce a package that allows backend work to be implemented safely in separate vertical slices.

## Governing outcome

The R2 package must make an administrator confident about what is true, what can be acted on now, what is only proposed, and what is blocked by an unresolved contract. It must not make fixture numbers, unresolved seams, or design intent look like live runtime.

The visual quality bar is premium operational software: deliberate hierarchy, legible tables, calm dark/light themes, real Arabic/RTL, accessible density, and one meaningful signature pattern per screen. It must not look like a generic dashboard, a developer console, or a page of raw `HANDOFF_BLOCKED_*` labels.

## 1. Mandatory source discovery before design

Open and cite all authority and route-specific sources before creating any frame. Record branch, commit, and dirty working tree. At minimum inspect:

- `AGENTS.md`, product contract start/current/gate/decision sources, screen catalogue, acceptance matrix, traceability and acceptance ledgers;
- design authority, current UI baseline, shared shell and token sources;
- `apps/web/src/app/admin/workflows/{page,actions,Controls}.tsx`;
- `apps/web/src/app/admin/risk/{page,actions}.ts(x)`;
- `apps/web/src/app/admin/gis/{page,GisStudio,actions}.ts(x)`;
- `apps/web/src/app/admin/access/page.tsx`;
- `apps/web/src/app/admin/localization/{page,Manager,actions}.ts(x)`;
- `apps/web/src/app/admin/audit/page.tsx`;
- relevant migrations/RLS policies and product decisions.

For every design claim, identify exact source path, symbol, current behavior, role/RLS boundary, data storage, audit event, failure behavior, and proof class:

- `PROVEN_SOURCE` — source opened and exact behavior cited;
- `COMPUTED_FROM_<SOURCE>` — algorithm/input is opened and named;
- `HANDOFF_BLOCKED_<SEAM>` — capability is not established.

Never label fixture data or prompt text as “Proven.” Never call a capability build-ready just because it is visually designed.

## 2. Correct the runtime model screen by screen

### CD-012 — Workflow library / SCR-ADM-050

Use the real route and actions: `proposeWorkflowDraft`, `saveWorkflowDraft`, and `approvePublishWorkflow`. Preserve draft creation, payload editing, maker-checker boundaries, and published immutability. Do **not** represent graph analysis, test-health storage, runtime-case counts, stale detection, or publish notifications as current runtime until their source and contracts are proven.

The lifecycle signature may show payload-derived transition structure only when its source is explicit. Any unreachable/cycle/test/case metric must be visibly blocked, with a plain-language consequence rather than an opaque red token in the main table.

### CD-013 — Workflow designer / SCR-ADM-051

The current implementation is a JSON draft payload editor. Canvas editing, graph validation, invalid-edge prevention, scenario replay, test store, SLA calendar, and publish notification are not established. Design them as a quarantined future-contract lane with clear input/output/algorithm/persistence/audit requirements; do not show them as executable tools or enforced guards.

Separate the present payload editor from the proposed designer. Do not let an unproven replay button appear active.

### CD-014 — Risk configuration / SCR-ADM-060

The current Risk Studio reads `engine_settings` and directly saves factors/bands after a weights-sum validation. It is not a draft/submitted/published maker-checker workflow. Remove the invented version approval lifecycle unless a governed backend change is separately specified and approved.

Design reproducibility from actual stored drivers, factors, bands, timestamp, version label, and RLS. “Why this factory?” is valid only where the score inputs and arithmetic are shown or explicitly blocked. Do not invent source freshness, external registry, recompute scheduler, or backtest results.

### CD-015 — GIS & geofence studio / SCR-ADM-070

Preserve the real model: engine settings plus official factory coordinates and `updateGeofenceRadius`. Official coordinates are GIS-owned; field observation does not overwrite them. Make geofence radius edit, RLS failure, missing coordinate, invalid input, loading, and provider-unavailable states truthful.

Map/geocoder/KSA boundary/evidence-sync capability is not a fact unless source proves it. Do not use a map visual to imply authoritative spatial confidence it cannot support.

### CD-016 — Notification & SLA rules / SCR-ADM-080

There is no dedicated approved route. The primary R2 frame must be a **blocked concept boundary**, not a functioning rule studio. Do not show active “Send test,” “Activate,” “Pause,” rule counts, provider counts, queue behavior, deduplication, recipients, SLA schedule, delivery, or retry actions as live.

Define the exact backend prerequisites before an implementation slice: approved route ownership, rule schema, recipient resolution, provider configuration, outbox contract, delivery-receipt model, deduplication, audit events, timing/calendar decision, RLS roles, and failure states. Until then, design only an unavailable/hand-off surface with non-actionable controls.

### CD-017 — Roles & permissions / SCR-ADM-090

The current route reads profiles, user roles, and role records. It is not an access-change approval workflow. Do not show enabled submit/approve/change actions, an active matrix editor, or specific RLS policy guarantees unless source proves each action and policy.

An effective-access explainer may be proposed only as a read-only explanation. It must never grant, simulate, or claim to conclusively evaluate permission without cited policy inputs. Treat role-change workflow, SoD, self-escalation prevention, RLS citation, and fallback authority as blocked backend contracts.

### CD-018 — Localization / ADM-LOCALIZATION

Use the real `ui_strings` workflow: load, save translation, mark reviewed, add key, sync from code, history, and restore revision. Preserve actual draft/review rules and RLS behavior. Do not invent a separate approval model, machine translation provider, or Arabic-review persona decision.

The R2 screen must visibly handle source drift, placeholders, missing Arabic, history, restore-as-draft, orphaned keys, sync errors, RLS denial, and source scan failure using real source behavior. This is a priority backend-ready slice after design signoff because its core actions exist.

### CD-019 — Audit trail / ADM-AUDIT

Use the real append-only `audit_events` reader: filters, pagination, RLS-scoped visibility, and before/after JSON detail. Do not display fake event totals, correlation totals, masked reveal, export, delivery receipt, hash-chain/tamper evidence, retention, or timezone policy as live facts.

If a proposed correlation/timeline/diff view is retained, it must be visibly fixture-only or backed by a specified read model. Sensitive reveal/export remains blocked until privacy, retention, audit, and RLS contracts are approved.

## 3. Visual system and placeholder correction

Apply one shared evidence grammar across all eight screens:

- Product-facing primary surfaces use plain-language state messages. Do not flood tables with raw seam IDs.
- A compact “Not available yet” boundary may show the human consequence and one traceable seam ID; the evidence/spec view contains the full technical identifier and dependency list.
- Green/proven labels are reserved for exact source-backed facts. Fixture data must be marked `DESIGN FIXTURE — NOT LIVE DATA` without appearing as real KPI telemetry.
- Do not use generic KPI strips by default. Show metrics only when they are actual source-backed decision inputs.
- Use semantic colour with text/icon shape. Re-check contrast in both themes; dark background, muted text, status tags, table dividers, focus ring, disabled action, and banner contrast must all pass WCAG AA.
- Light mode must be independently composed, not an inverted dark mode. Ensure borders, inactive controls, table headers, noncritical text, and long Arabic text retain hierarchy.
- Arabic is a true RTL layout with real Arabic strings, bidi isolation for codes/dates, correct control order, and no cut-off nav or table content.

## 4. Required native evidence

Do not export fit-scaled 924 px images. Render native, lossless files at their exact viewport dimensions:

- 1440 desktop dark EN/LTR, 1440 desktop light EN/LTR, and 1440 desktop Arabic/RTL for every screen;
- 1024 tablet and 412 narrow evidence for every screen;
- primary, critical outlier, loading, empty, validation, unauthorised, offline, stale/degraded, and all contract-specific states;
- three genuinely distinct, equal-fidelity candidate architectures per screen, with selection matrix and rejected-option rationale.

Every exported state must show the selected state after it is applied. The screenshot must visibly include its status, enabled/disabled action, recovery, audit/immutability consequence, and source truth tier. Include a capture manifest with state ID, viewport dimensions, actual raster dimensions, SHA-256, timestamp, and deterministic source/harness selector.

Every image must carry `DESIGN FIXTURE — NOT RUNTIME EVIDENCE` without obscuring content. A 412 export must be a true 412-pixel narrow composition, not a scaled desktop in blank canvas.

## 5. Package contract

Submit one ZIP whose root contains **only** `outputs/cd-012-019-r2/`. Do not include CD-012 R1/R2, historical packages, root project assets, `screens/`, uploads, nested ZIPs, or unrelated artefacts.

Required contents:

- source receipt with exact paths/symbols and proof classes;
- runtime truth ledger and dependency register;
- 20 real visual thumbnails and three full candidates **per screen**;
- full native final/state frames;
- state/interaction/accessibility/RTL matrices;
- implementation manifest and wiring map with exact existing action/component names;
- backend-readiness matrix separating `BUILDABLE_NOW`, `NEEDS_APPROVED_CONTRACT`, and `BLOCKED_BY_DECISION`;
- visual QA report for dark/light contrast, RTL, narrow reflow, focus, and state capture;
- capture manifest, package inventory, and final ZIP preflight.

The final preflight may say PASS only when it verifies the final ZIP itself: one permitted root, no contamination, native export dimensions, readable state evidence, source-grounded claims, and no placeholder/action/metric represented as live without proof.

## 6. Backend hand-off boundary

Do not ask Claude Code to build a broad consolidated backend. After human signoff, backend work must proceed in separate vertical slices:

1. source-backed read/action alignment for CD-012, CD-014, CD-015, CD-018, and CD-019;
2. approved contract design for CD-013 graph/replay, CD-016 notification/SLA route and providers, CD-017 permission-change workflow, and CD-019 privacy/export extensions;
3. one slice at a time with migration/RLS/audit/negative-path/regression evidence.

No code implementation begins during this design correction. Return only the corrected CD-012–019 R2 design evidence package and a truthful final preflight.
