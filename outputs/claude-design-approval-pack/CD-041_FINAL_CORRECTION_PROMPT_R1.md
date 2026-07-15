# CD-041 Final Correction Prompt R1

## Paste into Claude Design — one final corrective return only

```text
Correct CD-041 / SCR-VIR-700 / P06B / Virtual Appointment and Waiting Room as one final design-only return.

DO NOT edit application code, database migrations, product-contract artifacts, or the shared shell. Every implementation-facing artifact must begin:
DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
and must declare: implementation_authorized: false

You are correcting `outputs/cd-041-r1/`, not creating a new product scope. The final ZIP must contain exactly one root: `outputs/cd-041-r2/`. Do not include CD-025–032, CD-041 r1, loose source files, `screens/`, `uploads/`, thumbnails, or any parent directory.

THE CURRENT R1 IS NOT ACCEPTABLE AS A FINAL SUBMISSION
1. Its own `PACKAGE_PREFLIGHT_CD-041.md` ends `PACKAGE_PREFLIGHT_FAIL`: it has no state images, no pixel proof, no A/B/C hashes, no state-to-frame proof, and no per-control 48px measurements.
2. The only available `screens/cd41-*.png` are outside the package and measure 909px wide, not 1440px. They are invalid evidence and must not be reused or renamed.
3. The R1 truth ledger falsely treats all runtime information as unavailable. Codex has verified the actual source is available and must be used:
   - `apps/web/src/app/virtual/[id]/page.tsx`
   - `apps/web/src/app/virtual/[id]/Room.tsx`
   - `apps/web/src/app/virtual/[id]/actions.ts`
   - `apps/web/src/app/virtual/page.tsx`, `apps/web/src/app/virtual/actions.ts`
   - `supabase/migrations/0009_virtual_otp.sql`, `0018_w4_notifications_reviews.sql`, `0021_fix_broad_rls.sql`, `0023_fix_otp_rpc_authorization.sql`
4. The R1 wiring map uses action names that do not exist: use `beginRemote`, `rescheduleSession`, and `closeSession`; never `beginRemoteInspection`, `rescheduleAppointment`, or `closeAppointment`.
5. The twenty concepts are only prose rows. Render 20 actual legible low-fidelity thumbnails and include them in the package.

FIRST: REBUILD THE RUNTIME TRUTH LEDGER
Open the exact files above. Label only source-backed claims `PROVEN_LIVE`, with path and exact exported symbol/RPC/trigger. Label absent capabilities `HANDOFF_BLOCKED`.

The following facts must be verified and then represented exactly if still true:
- The route reads one RLS-scoped session with state, appointment_at, timeline, visit/factory/package/inspection, and participant join/verification fields. Missing scope is a safe wrong-appointment/out-of-scope outcome.
- Canonical sequence is scheduled → waiting → joined → verified → in_progress → closed; `trg_guard_virtual` rejects backward transitions and edits after close.
- `openWaitingRoom`, `joinParticipant`, `markSessionVerified`, `beginRemote`, `rescheduleSession`, and `closeSession` are the actual server actions. Respect their exact preconditions and their non-atomic timeline/notification outcomes.
- OTP is `vp_request_otp`, `vp_verify_otp`, and `vp_otp_status`. Never show/log a release OTP code. Show only source-backed cooldown/expiry/wrong/lockout/exhausted/verified semantics.
- `beginRemote` begins/continues the inspection flow and redirects to `/field/inspection/:id`; it does not join a video call.
- Notifications are queued or queue-failed; delivery is not proven.
- The active video provider is pending. No fabricated video, device test, bandwidth, recording, consent, invite/access-token workflow, ETA, or provider join.

DESIGN DIRECTION — KEEP, BUT PROVE IT
Keep the Appointment Readiness Contract as the selected direction: appointment identity → stored time truth → participant identity → state → allowed next transition → bounded fallback. It is not a call lobby and must place the real primary decision plus permitted action in the first desktop viewport.

Execute a real 20-concept lab before finalising. The twenty thumbnail concepts must differ in decision architecture, not colour/card order. Include all thumbnails in `CONCEPT_LAB_CD-041.md`, then build three visibly different 1440px-high-fidelity finalists:
- HYP-A: Contract spine.
- HYP-B: Readiness ledger.
- HYP-C: Temporal gate.
Their first viewports must visibly differ in hierarchy and task sequence. Write the selection decision in `CONCEPT_DECISION_CD-041.md`.

VISUAL REQUIREMENTS
- At desktop width ≥1440px, the first viewport shows the active readiness contract, ranked/active participant state, current allowed action with guard/reason, and linked context. Do not spend it on shell/header/controls.
- Use compact, premium industrial hierarchy—no generic card wall and no empty video hero.
- Re-render all state evidence in true browsers at: 1440px desktop, 1024px tablet, 412px narrow; dark/light; EN/AR RTL; focus/keyboard; long text/wrap; reduced motion.
- Every state in the state matrix needs an actual PNG inside the package. Include: scheduled, waiting, joined-awaiting-verify, verified, in-progress, safe out-of-scope, cooldown/wrong/expired/locked/exhausted OTP, provider pending, reschedule allowed/blocked, closed/read-only, validation, loading, empty, unauthorized, stale/degraded/offline only where source supports a truthful state, and all server-known partial outcomes.
- Any file called `1440` must measure at least 1440 pixels wide. No renamed 909px images.
- Measure every interactive control at desktop, AR RTL desktop, and 412. Every required control must be ≥48×48px; do not merely cite token defaults.

FINAL PACKAGE CONTENTS
Under `outputs/cd-041-r2/` include the prototype, standalone, all local assets, refreshed truth ledger, quality-memory acknowledgement, 20-thumbnail concept lab, concept decision, screen spec, component map, UI/runtime wiring map, acceptance checklist, implementation manifest, handoff, research/provenance, state-frame index, package inventory, and package preflight.

The wiring map must use actual symbols and distinguish:
- state update succeeded / timeline append failed;
- reschedule succeeded / one or both notification queues failed;
- inspection began / timeline append failed;
- close succeeded / notification queue failed;
- RLS denial/already-joined/already-closed without pretending success.

FINAL PREFLIGHT — MEASURE THE FINAL ZIP, NOT A FOLDER
`PACKAGE_PREFLIGHT_CD-041.md` must reproduce the exact final archive listing, reference-resolution table, measured PNG width/height table, literal SHA-256 for HYP-A/B/C plus selected final, state-row-to-PNG mapping, per-control target measurements, and grep proof of only CD-041/r2 paths.

The final line may be exactly `PACKAGE_PREFLIGHT_PASS` only when every listed check is true. Otherwise write `PACKAGE_PREFLIGHT_FAIL`, list each failed check, and do not claim readiness.
```

## Implementation boundary after correction

The current repository already has a substantial code-backed virtual backend: canonical session guard/timeline, virtual session/participant tables, OTP RPCs, RLS tightening, audit triggers, scheduling, notifications, and the common inspection handoff. The next backend work must be an approved CD-041–043 implementation slice, and must not invent the pending video provider or other policy/provider boundaries.
