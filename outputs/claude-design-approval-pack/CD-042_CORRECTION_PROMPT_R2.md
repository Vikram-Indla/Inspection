# CD-042 R2 — Required Correction Prompt

Correct **CD-042 / SCR-VIR-710 / P06B — Identity & OTP Verification**. R1 is blocked. Do not make an incremental cosmetic patch and do not reuse its false preflight. Rebuild the design evidence from the actual repository contract.

## Non-negotiable corrections

1. **Correct the operator model.** `apps/web/src/app/virtual/[id]/Room.tsx` is a staff-facing surface. `supabase/migrations/0023_fix_otp_rpc_authorization.sql` states factory representatives have no Supabase Auth account and do not call OTP RPCs directly; the assigned inspector or authorised staff operates the OTP actions for the representative. Design a staff/inspector-operated verification workspace. The representative may be identified and receive/provide the code during the supervised interaction, but must not be portrayed as a logged-in session-only operator unless a new approved identity/auth contract exists.

2. **Read the sources before design.** Open and cite exact behavior from:
   - `design/claude-design-mvp1/00_START_HERE.md`
   - `design/claude-design-mvp1/SCREEN_CATALOG.md` / acceptance rows for `SCR-VIR-710`, `DSG-037`, and the state matrix
   - `design/astryx/d7/D7-02_verify.html`
   - `apps/web/src/app/virtual/[id]/Room.tsx`
   - `apps/web/src/app/virtual/[id]/actions.ts`
   - `supabase/migrations/0009_virtual_otp.sql`
   - `supabase/migrations/0023_fix_otp_rpc_authorization.sql`
   - `supabase/migrations/20260715170000_cd041_verified_transition_guard.sql`
   - `outputs/claude-design-approval-pack/CLAUDE_DESIGN_PROGRESSIVE_QUALITY_MEMORY_V1.md`

3. **Preserve server authority.** `vp_request_otp` and `vp_verify_otp` are staff-authorized operations. `vs_mark_session_verified(session_id, participant_id)` is the only server transition that can move the session to `verified`; it requires a verified factory representative, every factory representative verified, and a non-closed session. Individual OTP success, a client flag, or a display name never unlocks CD-043.

4. **Correct the scope evidence.** `Room.tsx` calls `vp_otp_status` for its participant rows, while migration 0023 hardens request/verify authorization but not status. Do not claim a participant-owned status scope or cross-participant privacy model that source does not prove. Record this precisely as `HANDOFF_BLOCKED_OTP_STATUS_SCOPE` and design only authorised staff-visible content until it is resolved.

5. **Do not claim audit display is live.** OTP audit events are written, but the present room screen does not load an audit timeline. If the R2 visual includes an audit region, classify the display seam as `HANDOFF_BLOCKED_AUDIT_READ_SEAM` and specify the exact query/RLS/data contract required. Do not call it implemented.

6. **Include all mandatory failure states.** In addition to no-code, sent, cooldown, wrong-attempts-left, expired, locked, exhausted, loading/busy, validation, unauthorised, read-only closed, stale, degraded and offline:
   - explicit **identity mismatch**: progression blocked; outcome audited; no bypass; only truthful next routes;
   - explicit **OTP provider unavailable**: no fake delivery/retry promise; existing proof retained; bounded recovery/handoff;
   - explicit blocked manual-verification exception (`HANDOFF_BLOCKED_MANUAL_VERIFICATION_WORKFLOW`), without an invented approval action.

7. **No OTP secret.** Never render, annotate, log, or include a `dev_code` in any release-quality frame. Keep `HANDOFF_BLOCKED_DEV_CODE_EXPOSURE` explicit.

## Visual standard

Make it a restrained, high-trust staff workspace—not a consumer 2FA login and not a dashboard. The chosen architecture must make these three truths readable at a glance:

- the representative being verified and the authorised operator acting;
- the current OTP/counter/expiry/lockout truth and only allowed next action;
- the difference between individual proof and the server-cleared all-representatives session gate.

Explore 20 **actual visual** low-fidelity thumbnails. Supply 20 separately viewable thumbnail assets; text descriptions/contact sheets do not qualify. Render three genuinely different, equal-fidelity desktop candidates at **native 1440 px**, then select one using visual comprehension, recovery clarity, truthful authority, density, accessibility, and responsive integrity.

For the selected direction, export full native viewport images at:

- 1440 px desktop: dark EN/LTR and light EN/LTR;
- 1024 px tablet;
- 412 px narrow;
- Arabic/RTL at a native desktop or narrow viewport;
- all mandatory states above, each fully visible and legible.

Do not use 909 px cropped harness screenshots or a width label as evidence of a responsive export. Every final candidate and state frame must contain the whole relevant design, including the proof/gate/workspace relationship.

## Package gate

Submit a new ZIP whose root contains **only** `outputs/cd-042-r2/`. It must contain no prior CD packages, root source files, historical archives, nested ZIPs, or unrelated screen captures.

Include:

- exact source receipt and runtime truth ledger;
- 20 separate visual thumbnails;
- three native 1440 candidates and explicit decision matrix;
- full native final/state frames;
- state matrix, interaction contract, accessibility/RTL evidence, implementation hand-off, package inventory;
- `PACKAGE_PREFLIGHT.md` measured against the **final ZIP itself**.

`PACKAGE_PREFLIGHT.md` may say PASS only when it proves: one permitted archive root; no contamination; 20 distinct actual thumbnails; three complete 1440 candidates; native exported dimensions; all required state frames; readable assets; and all unproven runtime seams labelled `HANDOFF_BLOCKED_*`.

Do not start frontend implementation. Return only the corrected CD-042 design evidence package and a truthful final preflight.
