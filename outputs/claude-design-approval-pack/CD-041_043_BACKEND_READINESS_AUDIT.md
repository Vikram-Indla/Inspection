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

## Workflow-critical gap — RESOLVED LIVE (2026-07-15)

**Status: CLOSED — migration authored AND applied to the live project; driven E2E 6/6 green.** (History: authored in source, then found unapplied on the live project by the driven E2E, then applied and re-certified. Detail below retained for the audit trail.)

The correct guard was authored: migration `supabase/migrations/20260715170000_cd041_verified_transition_guard.sql` defines a `security invoker`, RLS-scoped `vs_mark_session_verified(p_session, p_participant)` that, in one transaction, locks the session `for update`, requires the named participant to be a `factory_rep` with `verified_at is not null`, requires that **no** factory-representative participant is left unverified, advances `state → verified` forward-only, and appends the `verified` timeline event atomically. `apps/web/src/app/virtual/[id]/actions.ts:markSessionVerified` calls it with `p_participant`; `Room.tsx` passes `participant_id`, never a display name. The forward-only trigger `guard_virtual_transition` (0018) is preserved.

**However, the migration is not applied to the configured live Supabase project.** Proven by the driven E2E `apps/web/e2e/cd-041-virtual-verified-gate.spec.ts` and a direct PostgREST call:

```
POST /rest/v1/rpc/vs_mark_session_verified  → 404 PGRST202
  "Could not find the function public.vs_mark_session_verified(...) in the schema cache"
POST /rest/v1/rpc/vp_otp_status             → 200   (an applied 0018 function, for contrast)
```

Consequence in the running system: OTP verification sets `virtual_participants.verified_at`, but `markSessionVerified` hits the missing RPC, errors, and the session **never advances to `verified`** — so **no remote inspection can begin**. The earlier source-grep test `cd-041-virtual-backend.spec.ts` passes because it only reads the migration file; it cannot see that the function is absent from the database.

**Closure (2026-07-15):** migration `20260715170000` applied to live project `iiozvqntawxfwbgffzqu` via the Supabase Management API using an owner-provided access token; PostgREST schema cache reloaded. Verified: `pg_proc` shows `vs_mark_session_verified(p_session uuid, p_participant uuid)` as `security invoker`; `POST /rpc/vs_mark_session_verified` now returns `400` (was `404 PGRST202`); driven E2E `cd-041-virtual-verified-gate.spec.ts` is **6/6 green**. The provided token is owner-flagged for rotation.

Other follow-ups recorded in `outputs/cd-041-r1/WIRING_AUDIT_CD-041.md`: WA-02 `beginRemote` atomicity + WA-03/04 client eventual-consistency (addressed in source 2026-07-15); WA-05 driven E2E authored and now blocked on this unapplied migration (WA-06).

## Why implementation did not start

The active approved slice is `TASK-BASELINE-WIRING-AUDIT-001`, whose authorized screen/file scope ends at CD-024. CD-041–043 are outside that slice, and the CD-041 design return is not yet accepted—the submitted package explicitly reports `PACKAGE_PREFLIGHT_FAIL`. The project authority requires a current approved slice and design acceptance before application changes.
