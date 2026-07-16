# CD-041 — SCR-VIR-700 Virtual Appointment and Waiting Room

## Paste this entire prompt into a fresh Claude Design session

```text
You are producing a design-only approval package for Saqeel MVP1.

SCREEN: CD-041 / SCR-VIR-700 / P06B / SB09
ROUTE: /virtual/:id
ROLES: Inspector; Factory Representative (session-scoped external context only)
DESIGN ACCEPTANCE: DSG-036
ENGINES: ENG-03, ENG-07, ENG-11, ENG-12
DESIGN PACKAGE REVISION: r1

NON-NEGOTIABLE BOUNDARY
Do not edit application code, migrations, schema, product-contract artifacts, or the shared shell. Do not claim implementation is authorized.
Every implementation-oriented artifact must start with exactly:
DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
and contain: implementation_authorized: false

This is a Virtual-family appointment/readiness surface. It is not a Web/Admin dashboard and it must not be made to resemble Zoom, Teams, or a generic video lobby. The video provider adapter is pending. Never fabricate a live video feed, device test result, recording, consent, call controls, network indicator, provider join, notification delivery, or support destination.

READ BEFORE YOU DESIGN
1. outputs/claude-design-approval-pack/CLAUDE_DESIGN_PROGRESSIVE_QUALITY_MEMORY_V1.md
2. design/claude-design-mvp1/00_START_HERE.md and the applicable master constitution/foundations.
3. design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv (SCR-VIR-700..720), JOURNEY_SCREEN_MAP.csv, UX_BLIND_SPOT_REGISTER.csv, SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md, DESIGN_ACCEPTANCE_MATRIX.csv, SCREEN_STATE_MATRIX.csv.
4. design/claude-design-mvp1/prompts/journeys/P06B_VIRTUAL_SESSION_AND_VERIFICATION.md and prompts/systems/VIRTUAL_VIDEO_SESSION.md.
5. Exact runtime files and all imports/callees:
   - apps/web/src/app/virtual/[id]/page.tsx
   - apps/web/src/app/virtual/[id]/Room.tsx
   - apps/web/src/app/virtual/[id]/actions.ts
   - apps/web/src/app/virtual/page.tsx and its actions/components
   - the OTP RPC contracts (`vp_request_otp`, `vp_verify_otp`, `vp_otp_status`), virtual-session guard and timeline RPC, notification implementation, translations, Shell components/styles, and existing tests.

First produce RUNTIME_TRUTH_LEDGER_CD-041.md. It must label every claim as PROVEN_LIVE, DERIVED_NOT_PROVEN, or HANDOFF_BLOCKED and cite exact source path and symbol. Do not proceed to full-fidelity design until this ledger is complete.

CURRENT RUNTIME FACTS — VERIFY THEM, DO NOT MERELY REPEAT THEM
- The route reads one RLS-scoped virtual session: state, appointment_at, timeline, visit, factory name, package-version id, inspection id/status, and participants (display_name, role, joined_at, verified_at). Missing/out-of-scope data renders a safe “Wrong appointment or out of scope” state.
- Canonical session order is scheduled → waiting → joined → verified → in_progress → closed. The server guard rejects backward moves and edits after close.
- Open waiting room is a guarded scheduled → waiting transition followed by a timeline append. A timeline append can fail after the state update.
- Mark joined persists participant joined_at, attempts an advance to joined, then appends timeline. Those steps are not one atomic user-visible promise.
- OTP request/status/verification are server/RPC-backed. The interface exposes send/resend, cooldown, expiry, wrong-code attempts remaining, lockout, exhausted resends, and verified identity. The development code is a development/provider condition, not a release UI claim. A session can become verified after factory-rep verification.
- Begin remote inspection is blocked unless verified (or already in progress). It creates or finds an inspection, advances session state, appends a begin event, then goes to /field/inspection/:id. It must never be represented as joining a video call.
- Reschedule only applies before participants join (scheduled/waiting). It updates appointment time, then appends timeline and queues inspector and factory-representative notifications. Notification queue failure and timeline failure are truthful partial-success outcomes; delivery is not proven.
- Close/cancel requires a reason; it atomically records state plus closing event, then may queue an inspector notification. Closed sessions are immutable.
- Current source formats appointment time in ISO/UTC. Do not claim user timezone conversion. If no timezone contract is found, use HANDOFF_BLOCKED_TIMEZONE_PRESENTATION.
- Current source has a provider-pending session-room placeholder. Surrounding lifecycle, identity, state and audit are live; active video is not. Do not use a fake blank video rectangle as the hero.
- Device/media permissions, bandwidth measurement, external participant privacy/invite flow, appointment access token, evidence readiness data, recording/consent/retention, manual escalation route, and provider delivery must be individually verified. If absent, retain the relevant HANDOFF_BLOCKED token and design a bounded, honest fallback.

DESIGN JOB
Design the first decisive moment of a governed virtual appointment: “Can this exact appointment proceed, what is ready, what is missing, who must act, and what can safely happen next?”

The screen signature is an **Appointment Readiness Contract**: a compact, ordered evidence chain that makes appointment identity, timing, participant identity, session state, allowed next transition, and physical/reschedule fallback legible in one first viewport. It must feel like a purposeful industrial inspection control surface, not a card wall, SaaS dashboard, or video-call waiting room.

The selected desktop 1440 frame must place the full readiness contract and its primary gated action in the initial viewport. Shell/context may be compact; do not push the actual decision below the fold. Use the Saqeel dark launch-film palette, semantic tokens, Space Grotesk/IBM Plex Sans Arabic/JetBrains Mono conventions only where existing authority permits. Build an equally deliberate light theme; do not simply invert colours.

MANDATORY TWENTY-CONCEPT LAB
Before polished frames, create 20 low-fidelity, legible 320px-wide decision thumbnails. Each must have a different task architecture. For example, vary the governing structure (contract spine, readiness ledger, appointment dossier, temporal gate, role handshake, exception-first board, evidence ladder, state rail, etc.), not just colour or card position.
Deliver `CONCEPT_LAB_CD-041.md` with all 20 thumbnails, a concise table for each concept: primary decision, spatial hierarchy, signature mechanism, accessibility/reduced-motion implication, and reject/shortlist reason.
Select three materially different concepts and render all three at equal high fidelity as true 1440px-wide desktop frames. Deliver `CONCEPT_DECISION_CD-041.md` explaining why the selected direction wins on speed, truthfulness, visual quality, density, recovery, and RTL.

INFORMATION AND INTERACTION REQUIREMENTS
- Visible appointment identity: factory, session/visit identity where source permits, absolute stored appointment time, current state, and explicit scope/access outcome.
- The readiness contract must communicate exactly which transition is possible now and why. Use a visible state path with non-colour state labels.
- Participant register: name/role as source permits; joined/awaiting/verified status; identity action and OTP state where current code proves it. Never reveal a production OTP code.
- Provider-pending is a small, intelligible bounded integration status with a meaningful continuation/fallback. It must not dominate the screen or masquerade as a usable call surface.
- Show exact server-backed action paths: open waiting room, mark joined, send/resend/verify OTP, begin remote inspection only when verification is satisfied, reschedule only before join, close/cancel with mandatory reason. The interaction specification must distinguish current role authority and provide disabled reasons.
- Show partial completion with a durable recovery path: state succeeded/timeline failed; rescheduled/one or both notification queues failed; inspection created/timeline append failed; close succeeded/notification queue failed. Do not use a generic toast as the sole evidence.
- Provide grounded states: scheduled/early, ready/waiting, joined awaiting verification, verified, late/appointment passed (if source has no late guard, mark derived), wrong appointment/out of scope, OTP cooldown, wrong/expired/locked/exhausted OTP, provider pending/unavailable, reschedule permitted/not permitted, closed/read-only, loading, empty participants, validation, unauthorized, stale/degraded, offline/recovery. For every state that lacks runtime support, make a bounded handoff block rather than a false feature.
- The required physical fallback must be a governed choice. If no current runtime action/policy defines it, state `HANDOFF_BLOCKED_PHYSICAL_FALLBACK_POLICY`; do not invent its workflow.
- Include clear identity-verification purpose and data/audit explanation only to the degree source proves it. Do not invent consent/retention terms.
- Give the constrained external factory-representative experience no internal navigation. If a shared shell is used for internal roles, state the exact session-only treatment for external users.

VISUAL AND ACCESSIBILITY BAR
- First 1440 desktop viewport: primary contract + active guard/action visible, not a shell-only or header-only view.
- Render true source frames at 1440px minimum desktop width, 1024px tablet, and 412px narrow recovery. Include dark/light, English and Arabic RTL; Arabic must mirror hierarchy and keyboard direction appropriately.
- Provide explicit keyboard order, visible focus, escape/return semantics for overlays, semantic roles/status/alert/live-region rules, 48×48px targets, non-colour status cues, contrast annotations, long EN/AR wrap, and a same-data text/list alternative for each visual state rail/diagram.
- Do not make animation necessary. Provide reduced-motion equivalents for any temporal/state progression.
- Keep dense but calm industrial quality: strong alignment, deliberate whitespace, type hierarchy, restrained surfaces, and no clipped/colliding labels.

REQUIRED DESIGN-ONLY DELIVERABLES
All outputs must live under one new root: `outputs/cd-041-r1/`.
- `CD-041_SCR-VIR-700_r1.dc.html` — interactive design prototype with only self-contained local assets.
- `RUNTIME_TRUTH_LEDGER_CD-041.md`
- `QUALITY_MEMORY_ACK_CD-041.md`
- `CONCEPT_LAB_CD-041.md` plus its 20 thumbnails.
- `CONCEPT_DECISION_CD-041.md` plus the 3 equal-fidelity desktop alternatives.
- `SCREEN_SPEC_CD-041.md` — hierarchy, semantics, states, visual rules, AR/RTL, responsive/reduced-motion behaviour.
- `UI_RUNTIME_WIRING_MAP_CD-041.csv` — at least 20 precise legs: UI trigger → component → action/RPC → guard/RLS → state/timeline/audit → notification/redirect → success/failure/partial recovery → evidence. Mark unsupported legs HANDOFF_BLOCKED.
- `COMPONENT_MAP_CD-041.csv`, `IMPLEMENTATION_MANIFEST_CD-041.yaml`, `CLAUDE_CODE_HANDOFF_CD-041.md`, `ACCEPTANCE_CHECKLIST_CD-041.md`, `RESEARCH_AND_PROVENANCE_CD-041.md`.
- Screenshot evidence and `STATE_FRAME_INDEX_CD-041.csv`, mapping every required state to exact filename, measured PNG dimensions, locale, theme, viewport and runtime-truth classification.
- `PACKAGE_PREFLIGHT_CD-041.md` as described below.

PACKAGE PREFLIGHT — ACTUAL MEASUREMENTS ONLY
Create `Plan Review and Publish_CD-041_R1.zip` containing exactly one top-level root: `outputs/cd-041-r1/`.
The preflight must include:
1. The exact archive listing copied from the final ZIP. Fail if any item lies outside `outputs/cd-041-r1/`, including any old CD, `uploads/`, `screens/`, duplicate root, stale asset, or parent path.
2. An actual reference-resolution table for every local HTML/CSS/JS/SVG/image/font reference: source file, reference, resolved in-package path, result.
3. Measured PNG dimensions for every frame. Any frame called 1440 must be at least 1440px wide.
4. SHA-256 hashes for the three selected-concept desktop frames and the final chosen desktop frame.
5. A one-to-one state-matrix row → screenshot filename proof table.
6. A 48×48px minimum target measurement table for all interactive controls across desktop, RTL and 412.
7. Grep results proving only CD-041 and r1 paths/revision identifiers appear in final deliverables.
8. A checklist for every item in `CLAUDE_DESIGN_PROGRESSIVE_QUALITY_MEMORY_V1.md`.

The final line must be exactly `PACKAGE_PREFLIGHT_PASS` only if every item passes. Otherwise it must be exactly `PACKAGE_PREFLIGHT_FAIL`, name every failure, and do not present the package as complete.

FINAL RESPONSE FORMAT
Return only: the ZIP path, the output-root path, a concise truth-boundary summary, the twenty-concept selection rationale, and the exact preflight status. Do not claim sponsor approval, implementation readiness, or provider integration.
```

## Codex use note

This fresh-session prompt deliberately makes the twenty-concept exploration, runtime truth ledger, and measurable archive preflight mandatory. It prevents the repeat defects of fake provider capability, weak first-viewport hierarchy, stale/contaminated archives, and unsupported design claims.
