# Saqeel MVP1 iPad Field Suite — One Consolidated Claude Design Prompt (R1)

## Assignment

Design the complete, coherent **iPad field-inspection experience** for Saqeel MVP1 as one connected suite. Produce code-ready design evidence for all eight governed iPad screens:

| Screen | Journey | Acceptance | Purpose |
|---|---|---|---|
| `SCR-IPAD-600` | P04 | DSG-028 | Assigned visits |
| `SCR-IPAD-610` | P04/P05 | DSG-029 | Inspector startup pack |
| `SCR-IPAD-620` | P06A | DSG-030 | Journey and check-in |
| `SCR-IPAD-630` | P07 | DSG-031 | Inspection workspace |
| `SCR-IPAD-640` | P08 | DSG-032 | Evidence capture |
| `SCR-IPAD-650` | P08 | DSG-033 | Findings, violations and actions |
| `SCR-IPAD-660` | P09 | DSG-034 | Pre-submit and immutable submission |
| `SCR-IPAD-670` | P11 | DSG-035 | Returned correction and resubmission |

This is a field application, not a responsive desktop portal. It must feel one level above a checklist app: controlled, calm, touch-first, auditable, usable in sunlight, and resilient to weak or absent connectivity. Do not produce eight disconnected dashboards or recreate the global admin shell.

## Non-negotiable truth boundary

The backend and core workflow already exist. Your role is **design evidence only**. Do not invent or request a new backend, policy, provider, threshold, SLA, geofence, retention period, risk weight, Arabic scope, or workflow transition merely to make a screen look complete.

Read the repository before designing. The current code and product contract are authoritative. If a desired behavior is absent or unclear, label it `HANDOFF_BLOCKED_<SHORT_REASON>` in the design evidence and show an honest unavailable/recovery state—never a fake working control, fake metric, fake map, fake media capability, or fake delivery success.

Never make fixture values look live. Every rendered design asset must visibly carry **`DESIGN FIXTURE — NOT LIVE DATA`** in a non-obstructive location. Do not use green “proven” badges unless the exact source was opened and cited.

## Mandatory discovery and source receipt

Before design, open and cite exact paths, symbols, guards, RLS boundaries, state transitions, audit events, data writes, error behavior, and offline behavior from:

1. `AGENTS.md`, `product-contract/00_START_HERE.md`, `CURRENT_STATE.md`, `GATE_STATUS.md`, current decisions, state transitions, RBAC, field dictionary, error catalogue, and acceptance/evidence ledgers.
2. `design/claude-design-mvp1/00_START_HERE.md`, `CURRENT_UI_BASELINE.md`, source authority, design decisions, master constitution, screen state matrix, design acceptance matrix, and special-component acceptance.
3. `design/claude-design-mvp1/prompts/journeys/P04_INSPECTOR_STARTUP_PACK.md`
4. `design/claude-design-mvp1/prompts/journeys/P05_EXECUTION_MODE_GATE.md`
5. `design/claude-design-mvp1/prompts/journeys/P06A_PHYSICAL_JOURNEY_AND_CHECKIN.md`
6. `design/claude-design-mvp1/prompts/journeys/P07_INSPECTION_EXECUTION.md`
7. `design/claude-design-mvp1/prompts/journeys/P08_EVIDENCE_FINDINGS_VIOLATIONS_ACTIONS.md`
8. `design/claude-design-mvp1/prompts/journeys/P09_IMMUTABLE_SUBMISSION.md`
9. `design/claude-design-mvp1/prompts/journeys/P11_RETURN_CORRECTION_RESUBMISSION.md`
10. Offline/sync, evidence/media, GIS/geofence, Arabic/RTL/accessibility, review/version, and notification system prompts.
11. `apps/web/src/app/field/**`, `apps/web/src/components/field/**`, `apps/web/src/components/ImageAnnotator.tsx`, offline/PWA/runtime modules, map components, evidence/finding/action forms, and field E2E tests.

Create `source-receipt.md` with a row for every source: path, exact behavior used, proof class, and design consequence. Record branch, commit, and dirty working tree. A source not opened is not proven.

## One shared field grammar

Build and reuse one iPad field grammar across the complete flow:

- persistent compact visit identity: factory, visit, package version, inspection/return version, lifecycle state, and current offline/sync truth;
- touch-first section rail, contextual work area, and always-available safe exit/back path;
- one non-colour-only sync model: synced, offline-ready, local change, queued, syncing, retrying, conflict, failed, and recovered;
- one evidence provenance model: item/finding link, capture metadata, lifecycle, local/queued/synced/error state, replacement/archive/deletion truth;
- one map language: official versus observed location, GPS accuracy/freshness, geofence result, privacy scope, route/arrival context, provider-unavailable fallback;
- one immutable/version grammar for submitted/returned/locked work;
- one consistent error/recovery pattern that preserves data and never silently overwrites a conflict.

The fixed field navigation must not consume the work area. Avoid desktop-style dense data grids, floating KPI card walls, consumer map/video tropes, decorative gradients, generic “AI” panels, and repeating raw technical seam IDs throughout primary work areas. A blocked capability belongs in a concise plain-language boundary card; the full identifier belongs in annotations/evidence.

## Field journey and screen contracts

### 1. SCR-IPAD-600 — Assigned visits

Design an inspector’s field queue that makes the next visit obvious: today, active, returned, urgency, appointment, route context, assignment state, and offline readiness. Include assigned/returned/expired/unauthorised/empty/loading/offline/stale/degraded/recovery states. Do not invent prioritisation scores or travel estimates. Show what visit data is locally available versus server-only.

### 2. SCR-IPAD-610 — Startup pack and P05 handoff

Combine exact factory/visit identity, frozen package version/hash, Factory 360 context, prior findings, contacts/documents, appointment/execution mode, map context, eligibility, and readiness diagnostics. Required states include not downloaded, downloading, verified, corrupt, outdated, insufficient storage, low battery guidance, offline-ready, weak/no GPS, network unavailable, wrong mode, returned assignment, expired assignment, and ready.

Show exact package readiness and why start is blocked. Never make a download, device diagnostic, map provider, or physical/virtual mode decision appear live without source proof.

### 3. SCR-IPAD-620 — Journey and check-in

Design the lawful physical journey: start, navigation handoff, ETA/distance only where source-backed, GPS accuracy/freshness, connectivity, route deviation, arrival, geofence result, official/observed coordinates, accessibility, and override request. Show tracking privacy scope and explicit start/stop. Required states: permission denied, locating, accurate, weak, stale, offline, route deviation, inside/outside fence, factory unavailable, access denied, override requested/approved/rejected, interruption recovery, map unavailable, and queued offline geo events.

Do not invent a geofence threshold, legal boundary, override policy, route provider, or location telemetry.

### 4. SCR-IPAD-630 — Inspection workspace

Create the touch-first execution workspace: package/visit identity, section navigation, current progress, conditional questions, required/optional meaning, guidance, notes, previous-answer comparison, autosave/sync, blockers, and fast entry points into evidence/findings. Required states: package loading/resolved/mismatch, mandatory unanswered, conditional shown/hidden, submitted read-only, returned-section mode, offline, queued, syncing, conflict, failed save, recovered draft, and unable-to-execute exception.

Locked sections must be visibly and functionally non-interactive. A returned mode may unlock only the server-authorised scope. Never show a save success until source-backed persistence succeeds.

### 5. SCR-IPAD-640 — Evidence capture

Design capture/linking for photo, video, document, scan, and note; annotation/compression; item/finding target; capture metadata; allowed location/time; local/queued/uploading/synced/retry lifecycle; replacement, archive, and deletion reason. Required states: permission denied, format/size failure, corrupt file, compression, annotate, queued offline, upload progress, synced, failed, retrying, replaced, archived, deletion pending, deleted, inaccessible, and interrupted upload recovery.

Do not claim malware scan, hash, watermark, chain of custody, device metadata, media retention, or upload capability unless current runtime exposes it.

### 6. SCR-IPAD-650 — Findings, violations and actions

Design finding creation and draft editing: severity, clause, linked evidence, configured violation trigger, penalty context, corrective action owner/due date, and submission-blocking action status. Required states: rule available, rule unavailable, missing evidence, action incomplete, unauthorised lifecycle action, draft, validation error, saved/queued, conflict, and recovery. Preserve single-penalty semantics and never show a violation rule or penalty decision as available without the actual configured source.

### 7. SCR-IPAD-660 — Pre-submit and immutable submission

Create a dedicated pre-submit review—not a generic confirmation modal. Group completion, mandatory gaps, evidence manifest, incomplete action forms, sync status, exact package/config version, acknowledgement/signature only where supported, and immutable consequences. Required states: not ready, navigable blockers, ready, signing, submitting, submitted online, queued offline, recoverable retry, duplicate retry recognised safely, server conflict, and immutable success.

No failed submit may leave ambiguous partial completion. Make the post-submit lock and P10 review handoff unmistakable.

### 8. SCR-IPAD-670 — Returned correction and resubmission

Design the complete governed loop: exact reviewer return reason/comments, immutable original context, only returned sections unlocked, evidence changes, resubmission creates N+1, original version remains locked, and reviewer comparison handoff. Required states: one/multiple returned sections, locked-edit attempt, offline correction, conflict, resubmission blocker, queued resubmission, new version, missing comparison version, package incompatibility, field/evidence/action differences, no-change warning, and repeated return.

Use focused changed-section navigation and non-colour-only selective locking. Never permit a returned inspector to edit an unreturned section.

## Exploration and quality ratchet

Do not claim exploration without visual proof. Create **20 actual low-fidelity cross-flow architecture thumbnails** for the field suite, each separately viewable. They must explore field navigation, context persistence, sync visibility, evidence entry, journey/map treatment, submission review, and returned correction—not merely colours or card placement.

Then produce **three genuinely different equal-fidelity iPad field-suite architectures** at native 1024×1366 portrait and landscape. Select one using explicit criteria: inspection speed, touch ergonomics, offline comprehension, error recovery, context retention, evidence integrity, sunlight readability, Arabic/RTL integrity, and scope truth.

Use no more than one justified signature interaction per screen. It must reduce inspection cognitive work or prevent an irreversible error—not decorate the UI.

## Mandatory final evidence

For every screen, export complete native lossless frames—never fit-scaled harness captures—at:

- iPad 1024×1366 portrait dark EN/LTR;
- iPad 1024×1366 landscape dark EN/LTR;
- iPad 1024×1366 portrait light EN/LTR suitable for sunlight;
- iPad 1024×1366 portrait dark AR/RTL;
- all screen-specific high-risk states and all required state-matrix categories: populated, loading, empty, validation, unauthorised, read-only, stale, degraded, offline, sync conflict, recovery;
- the three equal-fidelity candidate suites.

Every final state frame must visibly include its current status, enabled/disabled action, recovery, data/audit consequence, sync truth, and next journey handoff. Do not submit a screenshot where the relevant state sits below the fold or outside the crop. Include native dimensions and SHA-256 in `CAPTURE_MANIFEST_IPAD_FIELD_SUITE.csv`.

## Accessibility, field ergonomics, and themes

- Use 16 px+ field text, 48 px+ touch targets, visible focus, logical keyboard order, semantic headings/regions, meaningful labels, error summary/association, and screen-reader announcements.
- Design portrait and landscape independently; landscape is not a stretched portrait, and portrait is not a scaled desktop.
- Test in bright light and dark mode. Light mode must be field-usable, not simply inverted dark mode; verify contrast for muted text, disabled controls, errors, map legends, evidence metadata, and status surfaces.
- Arabic is first-class RTL: real Arabic strings, logical mirroring, bidi isolation for codes/coordinates/dates, correct map/list/timeline focus order, and no clipping.
- Include reduced-motion equivalents and interruption/restart recovery for journey, sync, evidence, and submission.

## Clean package and hand-off contract

Return one ZIP whose root contains **only** `outputs/ipad-field-suite-r1/`.

Required contents:

- `README.md` with journey map and explicit scope boundaries;
- `source-receipt.md` and `runtime-truth-ledger.md`;
- `20-thumbnails/` with 20 individual visual concepts;
- `candidates/` with three full native iPad suites and decision matrix;
- `final/` with all native frames and required states;
- `state-matrix.md`, `interaction-contract.md`, `offline-conflict-contract.md`, `evidence-contract.md`, `gis-contract.md`, and `accessibility-rtl.md`;
- `implementation-handoff.md`, `COMPONENT_MAP_IPAD_FIELD_SUITE.csv`, `WIRING_MAP_IPAD_FIELD_SUITE.csv`, and `BACKEND_DEPENDENCY_REGISTER.csv`;
- `CAPTURE_MANIFEST_IPAD_FIELD_SUITE.csv`, package inventory, and `PACKAGE_PREFLIGHT.md`.

The implementation hand-off must map to actual existing field components and backend seams. It must preserve state transitions, package/version immutability, RLS, audit events, outbox semantics, and conflict handling. It must never request a backend change as a workaround for an ungrounded design.

Preflight may say PASS only after inspecting the final ZIP itself: one permitted root, no contamination, 20 actual individual thumbnails, three complete native candidate suites, exact native exports, readable state evidence, all screens/acceptance rows covered, and no false live/provider/policy claim.

## Definition of done

Complete this single suite only when an inspector can move from assignment through startup, journey, check-in, inspection, evidence, findings/actions, submission, and returned correction without losing context or being misled about sync, location, evidence, permissions, version locks, or backend truth.

Do not edit the application. Return the iPad field-suite design evidence package and truthful preflight only.
