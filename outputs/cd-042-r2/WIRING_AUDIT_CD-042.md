# CD-042 / SCR-VIR-710 — OTP Identity Surface Wiring Audit

**Screen:** SCR-VIR-710 Identity & OTP Verification (staff/inspector-operated; embedded in the virtual room)
**Process:** P06B · DSG-037 · Engine: OTP (`engine_settings.otp`, `v1-accepted-2026-07-11`)
**Requirements:** M05-015..018, STM-VIR-002, RBAC-014, FND-003, DEC-007
**Auditor scope:** code-side + **live** wiring of the OTP capability. **Not** a design-package review — the CD-042 r2 `.dc.html` is in claude.ai project `20cb0dce-…`, unreachable from this session; CD-042 design R1 is **BLOCKED** (correction R2 pending, not accepted).
**Verdict:** OTP surface is **substantially wired and server-authoritative**. The one **P2 live authorization gap** (`vp_otp_status` missing the RBAC-014 caller check its siblings got in 0023) was **found, fixed, and verified live** on 2026-07-15. WA-02/WA-03 are a note + an already-correct item.

---

## Wired chain (source + live-verified)

| Step | Req | Surface | Backend authority | Live |
|---|---|---|---|---|
| Request OTP | DEC-007 | `Room.requestOtp` → `vp_request_otp` (0023) | policy from `engine_settings.otp` (6-digit, 5-min expiry, 3 attempts, 3 resends, 60s cooldown, `v1-accepted-2026-07-11`); SHA-256 `code_hash`; resend accounting; cooldown; audit `OTP_SENT`; DEV `dev_code` only (release: Unifonic) | ✅ security definer + **RBAC-014 gate present** |
| Verify OTP | M05-015..018 | `Room.verify` → `vp_verify_otp` (0023) | `no_code`/`expired`/`locked` guards; attempt increment; on match sets `verified_at` + `verified` record; audit `OTP_VERIFIED`/`OTP_FAILED` | ✅ security definer + **RBAC-014 gate present** |
| Status poll | — | `Room.refreshStatus` → `vp_otp_status` (0018 → 20260715180000) | safe metadata shape (verified bool, attempts/resends used+max, expires_at, locked, has_active_code) — **no code / no hash leaked** | ✅ security definer + **RBAC-014 gate added & applied live** (WA-01 resolved) |
| Policy source | DEC-007 | `engine_settings.otp` (0001 seed) | accepted `v1-accepted-2026-07-11`; not invented | ✅ |
| Authorization model | RBAC-014 | reps have **no** Supabase Auth account; assigned inspector/ops operate OTP for the rep (0023 architecture note) | staff-facing `Room.tsx`; request/verify gate = global staff role **or** assigned inspector | ✅ (matches R2 correction) |
| Audit | FND-003 | `audit_events` on SENT / VERIFIED / FAILED; `verified_at` also drives `vs_mark_session_verified` (CD-041) | append-only | ✅ |
| Crypto | — | `pgcrypto` `digest(...,'sha256')` for `code_hash` | code never stored plaintext | ✅ (see WA-02) |

Live definition check (Management API `pg_get_functiondef`): `vp_request_otp` / `vp_verify_otp` → `prosecdef=true, has RBAC-014 gate`. `vp_otp_status` → `prosecdef=true, has_rbac_check=false, has_role_gate=false`.

---

## Findings

| ID | Sev | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| **VIR710-WA-01** | **P2 (live)** | **`vp_otp_status` had no caller-authorization check.** 0023 added an RBAC-014 gate to `vp_request_otp`/`vp_verify_otp` but **left `vp_otp_status` unpatched** (0018). Being `security definer` it also bypassed `vp_rw` RLS — any authenticated user (incl. an unassigned inspector) with a participant UUID could read verification status/attempts/resends/`expires_at`/lock. | live `pg_get_functiondef` (`has_rbac_check:false`) + 0018 vs 0023 | ✅ **Resolved 2026-07-15** — migration `20260715180000_cd042_otp_status_authorization.sql` adds the identical `has_any_role([...]) OR is_assigned_inspector(visit_id)` gate. **Applied live** (`iiozvqntawxfwbgffzqu`, Management API, schema reloaded); live def now `has_rbac_check:true`. Driven test `apps/web/e2e/cd-042-otp-status-authz.spec.ts` **2/2 green**: unassigned inspector denied (RBAC-014), authorized staff still reads status. |
| VIR710-WA-02 | P3 | **OTP `code_hash` is unsalted SHA-256** of a 6-digit code — brute-forceable if the hash leaks. Mitigated: the hash is **not** exposed by `vp_otp_status`; only `vp_rw`-scoped staff can read `verification_record`; 5-min expiry + 3-attempt lockout bound the window. | 0023 `vp_request_otp` | Acceptable for MVP1; optionally salt (e.g. participant id + pepper) or store an HMAC at release hardening. Note, not a blocker. |
| VIR710-WA-03 | info | **Operator model in code is already correct.** Code implements the staff/inspector-operated model the CD-042 **R2 correction demands** (reps have no auth account; assigned inspector/ops drive OTP). The design R1 mis-portrayed the rep as a logged-in operator; the running code does not. | 0023 note + `Room.tsx` | No code change — the correction applies to the **design package**, not the implementation. |

---

## Contract position (unchanged)

Implementing/altering CD-042 remains **blocked** on: (1) design source unreachable, (2) design R1 BLOCKED / r2 not accepted, (3) CD-042 outside the active slice (CD-024 ceiling), (4) live-video-provider DECs open. This audit records existing OTP wiring only; it does **not** implement or approve the CD-042 screen. **WA-01 was closed as a contract-authorized RBAC-014 hardening** (no invented policy, no weakened behavior) under sponsor direction — same pattern as the CD-041 verified-guard fix: migration `20260715180000` applied live + driven test green. Migration file is in source, not yet committed.
