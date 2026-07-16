# CD-043 — Provider-Neutral Virtual Inspection Session: Fresh-Session Claude Design Prompt (R1)

## Assignment

Create the code-ready design evidence package for **CD-043 / SCR-VIR-720 / P06B — Virtual Inspection Session**. This is the execution surface after a verified virtual session. It must support governed remote inspection, evidence capture, checklist continuity, close/fallback truth, and the hand-off into the common P07/P08 engine—without pretending that a live-video provider exists.

This is a focused progressive build. Do not merge CD-041 appointment/readiness, CD-042 OTP identity verification, and CD-043 execution into one long page. CD-043 begins only after the server-cleared verification gate and owns remote execution, not a consumer call UI.

## Authority and required source receipt

Open these exact sources before designing. Record path, exact behavior relied on, and proof classification in `source-receipt.md`.

1. `design/claude-design-mvp1/00_START_HERE.md`
2. `design/claude-design-mvp1/prompts/journeys/P06B_VIRTUAL_SESSION_AND_VERIFICATION.md`
3. `design/claude-design-mvp1/acceptance/DESIGN_ACCEPTANCE_MATRIX.csv` — `DSG-038`
4. `design/claude-design-mvp1/acceptance/SCREEN_STATE_MATRIX.csv` — `SCR-VIR-720`
5. `design/astryx/d7/D7-03_session.html`
6. `product-contract/screens/screen_route_catalogue.csv` — `SCR-VIR-720`
7. `product-contract/domain/state_transitions.csv` — `STM-VIR-003`
8. `apps/web/src/app/virtual/[id]/Room.tsx`
9. `apps/web/src/app/virtual/[id]/actions.ts`
10. `supabase/migrations/0018_w4_notifications_reviews.sql`
11. `supabase/migrations/20260715170000_cd041_verified_transition_guard.sql`
12. `outputs/claude-design-approval-pack/CLAUDE_DESIGN_PROGRESSIVE_QUALITY_MEMORY_V1.md`
13. `outputs/claude-design-approval-pack/CD-042_DESIGN_REVIEW_R1.md`

Do not describe a source as opened if it was not. If source does not establish a required behavior, label it `HANDOFF_BLOCKED_<SHORT_REASON>` and state exactly what contract, API, data, RLS, or provider decision is missing.

## Runtime truth and scope boundaries

- Current virtual route: `/virtual/:id`; contract catalogue route: `/virtual/sessions/:id`. Preserve this route reconciliation as a hand-off—do not silently select or invent a third route.
- `beginRemote` permits only sessions in `verified` or `in_progress`, creates/reuses the inspection against its frozen package, advances `verified → in_progress` once, appends the begin timeline event, then redirects to `/field/inspection/:inspectionId` (the common execution engine).
- `closeSession` requires a reason; records closure and reason/comments on the session timeline; a closed session is immutable. It may report notification queue degradation truthfully.
- The current virtual room contains a bounded **provider-pending** placeholder. No video provider, live media feed, recording, frame/clip capture, device test, network-quality telemetry, remote evidence upload, participant-admission implementation, or adapter-ready runtime is proven.
- CD-042’s server gate is a hard predecessor. The session only reaches this scope after `vs_mark_session_verified` has independently proved all required factory representatives are OTP verified. No client flag, display name, or individual-only proof bypasses it.
- The established product intent still requires a provider-neutral session, evidence/checklist continuity, connectivity failure, insufficient-evidence fallback, and close/handoff. Where current runtime does not expose a seam, design it as an explicitly blocked contract—not as delivered functionality.
- CD-043 is primarily an **inspector/operator** execution surface. Do not repeat CD-042’s R1 error by creating an unproven authenticated factory-representative console.

## What the final design must make clear

At a glance, an inspector must see:

1. the virtual session reference, verified participant context, frozen inspection package, current session state, and the boundary between provider status and inspection truth;
2. the common inspection work in progress—agenda/checklist/evidence/notes/status—with the fact that the execution engine is shared with P07, not a parallel invented workflow;
3. which facts are live and which are provider-pending, without a fake camera feed, fake recording state, fake capture button, or fabricated delivery/policy claim;
4. whether evidence is adequate, incomplete, quarantined, or requires physical follow-up; and
5. the one governed closure/handoff path and immutable outcome.

Use the approved Saqeel design system. Create a high-trust operational workbench: calm, dense enough for inspection work, visibly auditable, accessible, and human. Avoid consumer video-call tropes, generic dashboards, live-feed theatre, gradients/glass, KPI cards, oversized empty panels, unnecessary pills, or any mock camera image that implies a working provider.

## Required exploration — prove visual work

Create **20 materially distinct low-fidelity visual thumbnails** before selecting a direction. Export each as a separately viewable asset—text lists or contact-sheet-only evidence are not thumbnails.

Explore real structural alternatives, including:

- checklist-first workbench with a bounded provider-status rail;
- evidence-first execution layout with a visible adequacy/follow-up decision;
- agenda/timeline-driven session workspace;
- narrow/tablet inspector flow that retains context and safe close;
- a provider-pending frame that remains useful without looking broken.

Develop **three genuinely different, equal-fidelity native 1440 px desktop candidates**. Each must resolve the full state model. Select one using explicit scoring for inspection comprehension, provider-truth discipline, evidence/exception clarity, operational density, accessibility, responsive integrity, and shared-engine continuity.

## Mandatory final frames and states

Export complete, native, lossless viewport images—not cropped harness screenshots—at these exact widths:

- selected 1440 px desktop in dark EN/LTR and light EN/LTR;
- selected 1024 px tablet;
- selected 412 px narrow;
- selected Arabic/RTL at desktop or narrow width, with real mirroring and no truncation;
- each unselected desktop candidate at 1440 px;
- all required state evidence below.

Required states:

- verified session ready to begin;
- **in progress, provider pending**—useful inspection workspace, no simulated live video;
- **adapter-ready** design contract frame, clearly labelled `HANDOFF_BLOCKED_PROVIDER_ADAPTER` unless the exact provider/runtime seam is proven;
- connectivity/provider unavailable with preserved inspection truth and no fictional reconnection policy;
- insufficient remote evidence on a checklist item, with an explicit no-fake-completion/follow-up outcome;
- evidence captured/linked only as a contract/provenance design, labelled `HANDOFF_BLOCKED_REMOTE_EVIDENCE_CAPTURE` until runtime supports it;
- evidence rejected/quarantined and physical-follow-up condition;
- loading, empty, validation, unauthorised/out-of-scope, read-only closed, stale/concurrent, degraded linked-read, offline/unavailable, and recovery states;
- closure confirmation with mandatory reason/comments, immutable final record, and common-engine/submission hand-off;
- close notification queue degradation—state changed versus follow-up delivery must remain visibly distinct;
- no participants / no verified gate / route reconciliation as appropriate hand-off evidence.

Each state must show: current status, allowed/disabled action, truthful recovery, audit/provenance consequence, and effect on the common execution/submission path. Do not convert unsupported recovery into fake controls.

## Provider-neutral and evidence rules

- A provider-pending frame must say exactly what remains available (session context, state/timeline, existing inspection work) and what is unavailable. It may not look like a broken media player.
- Do not depict a recording indicator, live camera tile, capture frame/clip action, screen-sharing, participant presence, bandwidth score, media retention, rejoin window, or provider adapter as live unless source proves it.
- Treat provider selection, remote evidence capture, recording/retention, and media metadata/chain-of-custody as separate unresolved contracts where applicable. No invented provider, SLA, retention period, evidence policy, or notification guarantee.
- “Insufficient evidence” must keep the checklist item unresolved and surface the governed physical-follow-up need; it must not silently turn into compliant/non-compliant.
- Preserve package version/context and shared P07 execution continuity. CD-043 must not duplicate a divergent checklist model.
- Closure is not submission approval. Show the precise post-close hand-off; do not claim the session creates a completed review outcome.

## Accessibility and responsive contract

- Visible focus, logical keyboard order, semantic labels/status/error announcements, 44 px+ touch targets, colour-independent state, reduced-motion parity, and readable hierarchy at 200% zoom.
- Arabic is a real RTL layout with logical mirroring, correct focus order, Arabic content, and no clipped controls.
- The narrow layout must preserve session status, active inspection context, evidence adequacy, and the close/fallback consequence. Do not reduce it to a scaled desktop panel.

## R2-quality package gate

Submit one ZIP whose root contains **only** `outputs/cd-043-r1/`. No historical CD packages, root source files, nested ZIPs, hidden prior outputs, or unrelated captures.

Required package contents:

- `README.md` — scope, selected direction, exclusions, and CD-041/CD-042/CD-043 boundary map;
- `source-receipt.md` and `runtime-truth-ledger.md` with exact proof classifications;
- `20-thumbnails/` — 20 separate real visual thumbnails;
- `candidates/` — three complete native 1440 candidate frames and decision matrix;
- `final/` — complete native final and state frames;
- `state-matrix.md`, `interaction-contract.md`, `accessibility-rtl.md`, and `implementation-handoff.md`;
- `PACKAGE_INVENTORY_CD-043.csv` and `PACKAGE_PREFLIGHT.md`.

`implementation-handoff.md` must identify route reconciliation, `beginRemote`, `closeSession`, transition/timeline seams, the `/field/inspection/:id` common-engine hand-off, and every provider/evidence/policy gap. It must never call a blocked capability implemented.

`PACKAGE_PREFLIGHT.md` may say PASS only after checking the final ZIP itself: single permitted root; no contamination; 20 actual individual thumbnails; three complete native 1440 candidates; exact measured native exports; all required states; readable full-frame assets; and every unsupported behavior explicitly blocked.

## Definition of done

The CD-043 R1 package is ready for review only when it demonstrates a visually strong, source-grounded remote-inspection execution surface that remains useful with the provider absent, makes evidence insufficiency and closure consequences unmistakable, preserves the shared execution engine, and presents no simulated provider or unproven runtime capability as fact.

Do not start frontend implementation. Produce only the CD-043 design evidence package and truthful final preflight.
