# CD-042 — Identity and OTP Verification: Fresh-Session Claude Design Prompt (R1)

## Assignment

Create the code-ready design evidence package for **CD-042 / SCR-VIR-710 / P06B — Virtual inspection identity and OTP verification**. This is a focused progressive build: make the identity-proof, OTP-counter, failure-recovery, and server-gated transition legible and calm. It is not a generic dashboard, a video-call screen, or a redesigned CD-041/CD-043 surface.

The final result must be visually premier, operationally credible, accessible, and directly grounded in the repository truth below. Do not claim runtime capability that the supplied code and migrations do not establish.

## Authority and scope

- Product process: `P06B`; screen: `SCR-VIR-710`; design acceptance: `DSG-037`.
- Required outcome: **OTP verification exposes identity, counters, cooldown expiry, lockout, and audit.**
- Route and live implementation seam: `/virtual/:id`.
- CD-041 owns appointment/readiness, rescheduling, and fallback handling.
- CD-042 owns the identity-verification moment and its explicit hand-off into the session gate.
- CD-043 owns the provider-neutral remote-session, evidence, and close-out experience.
- Do not merge these three scopes into one long page or one oversized card.

Read before designing:

1. `design/claude-design-mvp1/00_START_HERE.md`
2. `design/claude-design-mvp1/SCREEN_CATALOG.md` entries for `SCR-VIR-710`, `SCR-VIR-700`, `SCR-VIR-720`
3. `design/claude-design-mvp1/DESIGN_ACCEPTANCE_MATRIX.md` row `DSG-037`
4. `apps/web/src/app/virtual/[id]/Room.tsx`
5. `apps/web/src/app/virtual/[id]/actions.ts`
6. `supabase/migrations/0009_virtual_otp.sql`
7. `supabase/migrations/0018_w4_notifications_reviews.sql`
8. `supabase/migrations/0023_fix_otp_rpc_authorization.sql`
9. `supabase/migrations/20260715170000_cd041_verified_transition_guard.sql`
10. `outputs/claude-design-approval-pack/CLAUDE_DESIGN_PROGRESSIVE_QUALITY_MEMORY_V1.md`

If any cited source is unavailable, contradictory, or does not establish a proposed behavior, label it `HANDOFF_BLOCKED_<SHORT_REASON>` in the evidence. Do not invent a policy, provider capability, manual approval flow, offline queue, timeout, or recovery rule.

## Runtime truth that the design must preserve

The existing UI calls these database RPCs for each factory representative:

- `vp_otp_status(participant_id)` — current status/counters.
- `vp_request_otp(participant_id)` — request or resend, returning `sent`, `cooldown`, or `exhausted` semantics.
- `vp_verify_otp(participant_id, code)` — returns verified, wrong-attempts-left, expired, locked, no-code, and related result semantics.

The design must treat server responses as authoritative. Verification is not complete merely because a code-entry UI says it is. When a participant verifies, the UI calls the server action, which invokes `vs_mark_session_verified(session_id, participant_id)`. That guard independently verifies the passed participant is an OTP-verified factory representative, rejects closed sessions, requires **every** factory representative to be verified, and atomically moves the session to `verified` with its timeline event. Never represent a display name, a client-side flag, or one representative’s success as a bypass around this gate.

The source also establishes these constraints:

- A session with zero factory representatives must not become eligible by vacuous success.
- OTP request status includes cooldown/retry timing and a resend limit; verification includes attempts remaining, expiry, and lockout.
- The development implementation may return a `dev_code`; it is not a release UX. **Never show an OTP value in any release-quality frame, annotation, or prototype.** Record this as `HANDOFF_BLOCKED_DEV_CODE_EXPOSURE` if the implementation cannot be safely separated by environment.
- `exhausted` currently refers to a supervisor-approved, audited exception in backend messaging, but no complete manual-verification workflow is proven here. Show a truthful blocked recovery state, not an invented approval button: `HANDOFF_BLOCKED_MANUAL_VERIFICATION_WORKFLOW`.
- No supported offline OTP queue, delivery provider availability, device binding, identity-document capture, biometric proof, or live support escalation is established. Do not fabricate them.
- Inspect and explicitly classify the authorization/scoping behavior of every displayed OTP status/error. Do not state that a caller may see another participant’s identity or counters unless the source proves it.

## Design direction

Build a high-trust operational verification surface, not a consumer two-factor-login screen. It should feel like controlled entry into a regulated inspection: precise, spare, human-readable, and visibly auditable.

Use the approved Saqeel visual language and tokens from the design authority. Give the page a clear hierarchy:

1. Small session identity and state context: reference, participant, role, and clearly scoped privacy/verification purpose.
2. A single purposeful verification work area with code entry, action, current outcome, and next permissible action.
3. A compact but unmistakable proof ledger: request/retry status, cooldown/expiry/attempts, and audit-timeline evidence.
4. A session-gate status that distinguishes “this person verified” from “all required representatives verified — ready to enter CD-043.”

Avoid decorative trust badges, false security theatre, generic KPI tiles, huge empty panels, gradients, glass effects, excessive pills, or a provider/video hero. Use meaningful spatial rhythm, semantic color only for state, clear status language, and adequate contrast in both themes. The primary interaction must remain obvious at 412 px and at 200% zoom.

## Required exploration — actual work, not assertions

Create **20 materially different low-fidelity thumbnails** before selecting a direction. They must be present as viewable assets in the package; a list of claimed concepts does not count.

Explore at least these distinct architectures:

- proof rail beside a focused code-entry pane;
- vertical identity-to-gate progression with an embedded audit trail;
- attempt-ledger-first layout that keeps the code action compact;
- compact multi-representative verification roster where each person’s state is clearly scoped;
- narrow-screen sequence that preserves the difference between individual proof and session readiness.

Then develop **three genuinely distinct, equal-fidelity 1440 px desktop candidates**. Each must resolve the complete state model, not just its happy path. Select one using explicit criteria: operational comprehension, error recovery, auditable truth, density, accessibility, responsive integrity, and scope discipline. Do not select by personal preference alone.

## Mandatory final frames and state evidence

Provide exact rendered images, not placeholders, with readable text and component states:

- selected desktop, 1440 px, dark EN/LTR;
- same selected desktop, 1440 px, light EN/LTR;
- selected tablet, 1024 px;
- selected narrow mobile, 412 px;
- selected RTL Arabic layout at an appropriate desktop or narrow width, with correct mirroring, focus order, numerals, and no truncation;
- the two unselected desktop candidates at 1440 px;
- state frames for: initial/no-code; request sent; cooldown; wrong code with attempts remaining; expired; locked; resend exhausted; individual verified but session gate still blocked; all required representatives verified and server gate cleared; loading/busy; validation error; unauthorized or out-of-scope; read-only closed session; stale/degraded/error; offline/unavailable recovery; and an audit record.

For every state frame, show the user-visible message, the enabled/disabled action, the next truthful recovery path, and the effect on session entry. Do not convert unsupported recovery paths into fake controls.

The `SCR-VIR-710` state matrix requires populated, loading, empty/no-code, validation, unauthorized, read-only, stale, degraded, offline, and recovery coverage. If a state cannot be backed by the current runtime, make the lack explicit and frame it as a hand-off—not as completed behavior.

## Interaction and accessibility contract

- Explicit labels, error association, keyboard flow, visible focus, logical screen-reader order, and 44 px minimum touch targets.
- Paste, digit grouping, deletion, resend, cooldown, and busy behavior must be designed deliberately.
- Never expose raw backend internals, participant identifiers, OTPs, or sensitive audit data unnecessarily.
- One representative’s verified state must be distinguishable from the all-representatives session gate.
- No visual state may rely on color alone.
- Arabic is a real RTL layout, not translated Latin placeholder text.

## Package contract — final preflight is a release gate

Submit one ZIP whose root contains **only** `outputs/cd-042-r1/`. Do not include prior CD archives, nested ZIPs, historical review packages, or unrelated source folders.

Required contents:

- `README.md` — scope, exact source receipt, selected-direction rationale, implementation hand-off, and explicit exclusions.
- `source-receipt.md` — each required source opened, path, relevant exact behavior, and proof classification.
- `20-thumbnails/` — all 20 actual viewable thumbnails.
- `candidates/` — three full 1440 px candidates plus decision matrix.
- `final/` — all required final frames and state evidence.
- `interaction-contract.md` — triggers, server responses, busy/disabled states, recovery, audit events, and CD-043 hand-off conditions.
- `state-matrix.md` — required state coverage with frame links and `HANDOFF_BLOCKED_*` entries where needed.
- `accessibility-rtl.md` — keyboard, focus, semantic, contrast, touch-target, EN/LTR and AR/RTL evidence.
- `implementation-handoff.md` — component inventory, responsive rules, tokens, route/component seams, RPC/action seams, and exact server-gate dependency.
- `PACKAGE_INVENTORY_CD-042.csv` — every package file and its purpose.
- `PACKAGE_PREFLIGHT.md` — measured counts, dimensions, links, archive-root check, contamination check, and PASS/FAIL verdict.

Preflight may say PASS only after verifying the final ZIP itself: one permitted root, all required files present, 20 actual thumbnails, three full candidates, exact exported dimensions, all required state frames, readable assets, and no contamination. If any item is absent, mark FAIL and correct it before submission.

## Definition of done

This is complete only when a reviewer can see, without inference:

1. who is being verified and why;
2. the current OTP/counter/lockout truth and the next allowed action;
3. the difference between individual proof and the server-enforced session gate;
4. a realistic, auditable recovery path for every failure state;
5. responsive, accessible, dark/light, and RTL integrity; and
6. clean, measurable, source-grounded package evidence.

Do not begin application implementation. Produce the CD-042 design evidence package and its final preflight only.
