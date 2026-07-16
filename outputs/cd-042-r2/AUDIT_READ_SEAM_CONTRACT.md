# CD-042 / SCR-VIR-710 — Audit-Read Display Seam Contract (CD42-R1-06)

The exact query / RLS / data contract the **accepted** design must bind to for the
"audit timeline" on the virtual room. Event **creation** (OTP_SENT/VERIFIED/FAILED,
session state events) is unchanged and separate; this is the **read** seam only.

## RPC
```
vs_audit_trail(p_session uuid) returns jsonb   -- security definer, search_path=public
grant execute to authenticated
```
Applied live 2026-07-15 (project `iiozvqntawxfwbgffzqu`); migration
`supabase/migrations/20260715190000_cd042_audit_read_seam.sql`.

## Authorization (RBAC-014)
Identical predicate to `vp_request_otp` / `vp_verify_otp` / `vp_otp_status`:
`has_any_role(['ops','reviewer','auditor','compliance_admin','planner'])` **OR**
`is_assigned_inspector(session.visit_id)`. Unauthorized → `raise 'not authorized for
this virtual session (RBAC-014)'`. Unknown session → `raise 'virtual session not found'`.

Why an RPC and not a table read: `audit_events` RLS (0002/0019) grants SELECT to
auditor/ops/security_admin/leadership/reviewer/planner/compliance_admin only —
**not** `inspector`. The assigned inspector operates the room but cannot read the
table. The security-definer RPC returns just this session's trail without widening
table access.

## Scope
Rows where `object_type='virtual_sessions' AND object_id=p_session`, OR
`object_type='virtual_participants' AND object_id IN (participants of the session)`.
Ordered by `at`. Never returns rows outside the session's own objects.

## Returned shape (jsonb array; `[]` when empty)
```
[{ "at": timestamptz, "action": text, "object_type": text,
   "object_id": uuid,  "actor": uuid,  "detail": jsonb /* after_state */ }]
```

## Proven
`apps/web/e2e/cd-042-audit-read-seam.spec.ts` (live, 2/2): an authorized caller sees
a real `OTP_SENT` event scoped to the session; an unassigned non-staff caller is
denied. Read-only — the RPC creates no audit events.

## Not built here (waits for design acceptance — DSG-037)
The **UI** that renders this trail. This deliverable is only the data contract, so
the accepted CD-042 design has a truthful, tested seam to bind to. No screen scope,
no invented policy.
