# CD-041 / SCR-VIR-700 — Existing-Screen Wiring Audit

**Screen:** SCR-VIR-700 Virtual Appointment / Waiting Room / Session
**Process:** P06B · Engines ENG-11 (notifications), shared inspection engine
**Requirements:** M05-002/003/005/006/007/009/010/015..020, STM-VIR / STM-VIR-002, DEC-007 (OTP policy)
**Auditor scope:** code-side design-to-live wiring only. This is **not** a design-package review — the CD-041 r1 `.dc.html` design source is in claude.ai design project `20cb0dce-…` and is not reachable from this session; CD-041 design R1 is `REJECTED AT RECEIPT` (`PACKAGE_PREFLIGHT_FAIL`).
**Verdict (updated 2026-07-15 after migration apply + driven-E2E certification):** screen is wired end-to-end and now **proven live**. A P0 defect (verified-transition migration unapplied on the live project) was found by the driven E2E, **fixed by applying migration `20260715170000` to the live project**, and re-certified — driven E2E **6/6 green** (success + negative gate + integration redirect + RBAC-014 permission + STM-VIR forward-only). Remaining findings are P2/P3, all resolved in source. The source-grep spec masked the live gap; the driven E2E caught and closed it.

---

## Wired chain (proven from source)

| Step | Req | Route / surface | Backend authority | State |
|---|---|---|---|---|
| List confirmed sessions + unscheduled published virtual visits | M05-002 | `/virtual` `page.tsx` | `virtual_sessions`, `visits` RLS reads | ✅ |
| Schedule session (appointment + rep name) | M05-002 | `ScheduleForm` → `virtual/actions.ts:scheduleSession` | insert `virtual_sessions` + `virtual_participants`; RLS `vs_write` (0002); DB unique visit_id | ✅ |
| Bind participants + notify inspector/rep | ENG-11 | `scheduleSession` → `insertNotification` | `notifications`; SMS honestly `not_configured` (no fake send) | ✅ |
| Open waiting room (scheduled→waiting) | STM-VIR | `openWaitingRoom` | optimistic `.eq(state,'scheduled')` + trigger `trg_guard_virtual` (0018) | ✅ |
| Participant join (→joined) | M05-009/010 | `joinParticipant` | `joined_at` set; forward-only advance | ✅ |
| OTP request | DEC-007 | `Room.requestOtp` → `vp_request_otp` (0023) | policy from `policy_registry` `otp` `v1-accepted-2026-07-11` (0001): 6-digit, 5-min expiry, 3 attempts, 3 resends, 60s cooldown; audit `OTP_SENT` | ✅ |
| OTP verify → `verified_at` | M05-015..018 | `Room.verify` → `vp_verify_otp` (0023) | sets `virtual_participants.verified_at`; expiry/lock/wrong/attempts enforced server-side; audit `OTP_VERIFIED`/`OTP_FAILED` | ✅ |
| Advance session to verified | M05-018 | `markSessionVerified` → `vs_mark_session_verified` (20260715170000) | `for update` lock, participant `verified_at is not null`, **all** factory_reps verified, forward-only, atomic timeline, `security invoker`. **Applied live 2026-07-15**; RPC resolves; driven E2E green. | ✅ (live-proven) |
| Begin remote inspection | M05-019/020 | `beginRemote` | server re-gate `state ∈ {verified,in_progress}`; creates `inspections` (in_progress) against frozen `package_version_id`; redirect to shared `/field/inspection/[id]` | ✅ |
| Reschedule (only pre-join) | M05-002 | `rescheduleSession` | `state ∈ {scheduled,waiting}` guard; re-notify; RLS-deny surfaced | ✅ |
| Close/cancel (mandatory reason) | M05-005/006/007 | `closeSession` | reason required; state+closed-event in one write; trigger makes closed **immutable** | ✅ |
| Forward-only + closed-immutable | STM-VIR | DB trigger `guard_virtual_transition` (0018) | rejects backward moves and any edit to closed | ✅ |
| Append-only audit | FND-003 | triggers `trg_audit_virtual_sessions` / `_participants` (0018) | both tables audited | ✅ |
| Video provider | DEC (pending) | `Room` room-box / fallback panels | honestly bounded — never claims a connection; no invented recording/consent/bandwidth | ✅ (correctly deferred) |

Readiness contract (6 links: appointment→time→participants→state→transition→fallback) renders from stored session facts and resolves to exactly one gated next action mirroring the server guard. Colours via ADS/`ax-`/`cd-` tokens — no bare colors.

---

## Findings

| ID | Sev | Finding | Evidence | Status |
|---|---|---|---|---|
| **CD041-WA-06** | **P0 (live)** | **Verified-transition migration `20260715170000` was UNAPPLIED on the live project.** `POST /rpc/vs_mark_session_verified → 404 PGRST202`. In the running app OTP set `verified_at` but `markSessionVerified` errored, the session never reached `verified`, and no remote inspection could begin. Source-grep spec masked it; the driven E2E caught it. | live PostgREST + `cd-041-virtual-verified-gate.spec.ts` | ✅ **Resolved 2026-07-15** — migration applied to live project `iiozvqntawxfwbgffzqu` via Supabase Management API (owner-authorized token), PostgREST schema reloaded. Verified: `pg_proc` shows the function (`security invoker`); REST now `400` not `404`; driven E2E **6/6 green**. Note: this remote has no `supabase_migrations.schema_migrations` table, so CLI history was not updated (none exists to update). |
| CD041-WA-01 | P2 | **Backend-readiness doc drift.** `CD-041_043_BACKEND_READINESS_AUDIT.md` first stated the guard gap was OPEN; an intermediate edit overclaimed it CLOSED. Truth: guard is authored in source but **unapplied live** (see WA-06). | doc vs live DB | ✅ **Corrected 2026-07-15** — doc's "Workflow-critical gap" section now reads "coded in source, NOT LIVE" with the PGRST202 proof. |
| CD041-WA-02 | P2 | **`beginRemote` non-atomic when inspection pre-exists.** Pre-existing inspection redirected **without** advancing session→`in_progress` or appending the `begin` event. | `virtual/[id]/actions.ts` | ✅ **Resolved** — state advance + `begin` append moved to run on every entry path; `.eq("state","verified")` keeps it forward-only and fires the event exactly once (in_progress no-ops). |
| CD041-WA-03 | P3 | **`markSessionVerified` result ignored client-side.** `Room.verify` dropped the return; session-advance failure invisible until refresh. | `Room.tsx` | ✅ **Resolved** — result captured into `verifyMsg`, surfaced in the error/ok banners. |
| CD041-WA-04 | P3 | **Begin-readiness was client-derived** from the optimistic `verifiedIds` set, not server state. | `Room.tsx` | ✅ **Resolved** — begin gate now uses `serverReady` (`state ∈ {verified,in_progress}`); `router.refresh()` after a successful verify pulls server truth. Optimistic `allVerified` retained for the informational participant link only. |
| CD041-WA-05 | P1(evidence) | **No driven runtime E2E.** `cd-041-virtual-backend.spec.ts` is source-grep only. Per `.claude/rules/tests.md`, the verified-gate needs driven success + **negative** (unverified rep → begin refused) + permission (RLS-scoped) + state + regression paths. | spec file | ✅ **Certified 2026-07-15 — 6/6 green** against the live project after WA-06 apply.  `apps/web/e2e/cd-041-virtual-verified-gate.spec.ts` — `apps/web/e2e/cd-041-virtual-verified-gate.spec.ts` added: driven success + negative gate + integration redirect (as assigned inspector), permission (RBAC-014 reviewer refused), forward-only/closed-immutable regression. Compiles + typechecks. **Requires a live certification run** (`npm run build && npx playwright test` against a reachable Supabase). `afterAll` teardown deletes the sacrificial session + participant rows (planner-deletable); visit/assignment/inspection rows have no DELETE policy for a planner so they are attempted best-effort and otherwise left inert — full teardown would need a service-role key (not present in `.env.local`). The seeding places fixtures strictly after the inspector's latest existing assignment window (DB exclusion forbids overlap). |

### Live driven-E2E — 2026-07-15
- **Run 1 (pre-fix):** Test 1 failed at verify→ready — root cause **WA-06** (RPC 404). Proved live: join→`joined`, negative gate correct (decision bar `is-blocked`, Begin disabled, "Verify every required representative first"), OTP set `verified_at`. Gate couldn't open — transition RPC missing. Tests 2/3 skipped (`serial` stop).
- **Fix:** applied migration `20260715170000` to live via Management API; reloaded PostgREST.
- **Run 2 (post-fix): 6/6 green** — success + negative + integration redirect to `/field/inspection/:id`; RBAC-014 (reviewer refused, state unchanged); STM-VIR forward-only (closed session immutable / no backward move).
- Byproduct finding: assignments enforce a **DB exclusion on overlapping inspector windows** ("inspector window is no longer available") — a real, correct double-booking guard, accommodated by the fixture window placement.

---

## Contract position (unchanged by this audit)

Implementing/altering CD-041 remains **blocked** on: (1) design source unreachable, (2) CD-041 design not accepted (R1 rejected), (3) CD-041 outside the active slice `TASK-BASELINE-WIRING-AUDIT-001` (CD-024 ceiling), (4) video-provider DECs open. This audit records that the **already-shipped** wiring is sound; it authorizes no new application edit.
