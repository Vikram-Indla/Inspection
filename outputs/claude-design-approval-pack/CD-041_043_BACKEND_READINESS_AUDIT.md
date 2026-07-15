# CD-041–043 Backend Readiness Audit

**Scope:** CD-041 / SCR-VIR-700, CD-042 / SCR-VIR-710, CD-043 / SCR-VIR-720
**Status:** Existing backend is substantial; no new backend implementation performed in this session.

## Existing code-backed workflow

| Screen | Existing backend coverage | Primary sources |
|---|---|---|
| CD-041 Appointment / waiting | Session scheduling, session and participant records, RLS-scoped route read, waiting transition, join persistence, reschedule, close with reason, timeline/audit, notification queue attempts. | `apps/web/src/app/virtual/{page.tsx,actions.ts}`; `apps/web/src/app/virtual/[id]/{page.tsx,actions.ts}`; migrations 0001, 0018, 0021, 0023. |
| CD-042 OTP identity | OTP request, status, verification, expiry/cooldown/attempt/resend/lockout state, authorization checks, audit events, and safe client RPC status shape. | `Room.tsx`; `vp_request_otp`, `vp_verify_otp`, `vp_otp_status`; migrations 0009 and 0023. |
| CD-043 Governed session / inspection handoff | Forward-only session guard, append-only timeline, begin-inspection gate and redirect to the shared inspection engine, close immutability. | `actions.ts`; `guard_virtual_transition`, `vs_append_event`; migration 0018. |

## Required implementation boundary

The live-video provider remains pending. No backend work may fabricate video connection, device/media tests, bandwidth, recording, consent/retention, external invite/access-token policy, delivery receipt, or physical-fallback authority.

## Workflow-critical gap to resolve in a new approved slice

`markSessionVerified` in `apps/web/src/app/virtual/[id]/actions.ts` advances the session to `verified` using supplied `session_id` and a display-name string. It does **not** itself read and prove the corresponding participant’s `verified_at` record or verify that every required factory-representative participant is verified. The current UI calls it only after successful `vp_verify_otp`, but the transition guard is client-flow dependent rather than independently enforced at that action boundary.

An approved CD-042/043 backend slice should close this with a server-side/transactional verified-participant guard, preserve the current forward-only trigger, write the timeline atomically with the state transition where feasible, and add positive/negative/RLS/multi-participant tests. This must be designed and approved before code change; it cannot be safely inferred from a design package that currently ends in `PACKAGE_PREFLIGHT_FAIL`.

## Why implementation did not start

The active approved slice is `TASK-BASELINE-WIRING-AUDIT-001`, whose authorized screen/file scope ends at CD-024. CD-041–043 are outside that slice, and the CD-041 design return is not yet accepted—the submitted package explicitly reports `PACKAGE_PREFLIGHT_FAIL`. The project authority requires a current approved slice and design acceptance before application changes.
