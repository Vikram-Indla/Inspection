# SAQEEL Field Login — Current-State Analysis (Phase 12)

> **STATUS 2026-07-24: DEFERRED.** Per explicit sponsor scope reset, Field
> Login is not the active implementation task — this file is preserved as
> reference. Corrections below were applied in response to Codex's
> independent review even though the pilot itself is on hold, so the
> historical record stays accurate. See `design-map.yaml`'s superseded note
> for the full context.

Design source: `SAQEEL PWA-Field Login.dc.html`, project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`, etag `1784884213895548`.
Code: `apps/web/src/app/login/field/{page.tsx,FieldLoginClient.tsx,field-login.css}`, route `/login/field`.

**CORRECTED 2026-07-24:** provenance is `e31193b6`/`e2e9775e` (verified
ancestors of HEAD `3323a8ef` via `git merge-base --is-ancestor`), not
`75486695`/`68ee0a23` as originally stated — those two are NOT ancestors of
this branch's HEAD. The original claim came from running `git log` directly
against those refs, which shows their own history, not proof of reachability
from HEAD. Caught by Codex's independent review.

**CONFIRMED DEFECT (grep, 2026-07-24):** `page.tsx:9` and
`FieldLoginClient.tsx:11` both cite Claude Design project id
`5e8154ad-9a7d-4e3d-9b7a-c66ca020bd61` — a typo. The live project id is
`5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`. The comments also name the file
`SAQEEL Field Login.dc.html`, not the real `SAQEEL PWA-Field Login.dc.html`.
Both are code-comment defects (not behavior defects) — flagged for whichever
change control eventually touches this file.

**ADDITIONAL FINDING (2026-07-24):** the "Keep me signed in" checkbox in
`FieldLoginClient.tsx` changes local component state that is never read by
the sign-in call or any persistence logic — an unwired control. Also: the
repository contains virtual-session OTP RPCs and a historical accepted OTP
configuration (a separate capability from Field Login device enrollment);
`OPEN_DECISIONS.yaml` still lists `DEC-007` as open — this is an authority
conflict for any future Field Login OTP build and must be resolved
explicitly, not inferred from the virtual-session capability's existence.

## Classification of every design expectation named in the goal/handoff

| Design expectation | Classification | Evidence |
|---|---|---|
| Trusted-device biometric unlock | **Implemented differently (more conservative)** | Design: any "trusted device" shows Face ID immediately with a hardcoded `DVC-77120` pill. Code: Face ID unlock only renders when **all three** hold — (1) a persisted Supabase session exists, (2) the real backend device-trust register reports this exact device `trusted` (server action `readFieldDeviceEnrollment`, no client-side inference), (3) this browser holds a local WebAuthn opt-in credential (`readBiometricUnlock`). It is explicitly documented in code as an *unlock of an existing session*, never a fresh login or a trust-granting action. |
| Untrusted-device warning ("Unrecognized device") | **Missing, by design decision** | No such UI state exists in `FieldLoginClient.tsx`. Code comment: "There is no 'unrecognised device' warning — an unenrolled device is the normal, expected first-run state, not an anomaly worth alarming a user over." This is a documented product decision, not an omission. |
| Six-digit OTP challenge, resend timer, verify/back | **Missing entirely** | No OTP state, no OTP component, no resend logic anywhere in `FieldLoginClient.tsx`. Dead CSS classes (`.fl-otp-*`) remain in `field-login.css` from a reverted prior attempt (commit `1b86cad3` reverted `SCR-PWA-001`) — confirmed unused (no consuming JSX). |
| "Trust this device" opt-in | **Not present as a login-screen action** | Device trust is exclusively backend-established via Operations approval in the real device register, surfaced instead at Settings → Security → Trusted Devices (`apps/web/src/app/(app)/field/settings/devices/TrustedDevicesClient.tsx`, `selfEnrollFieldDevice`). The login screen cannot create trust — confirmed by explicit code comment. |
| OTP delivery channel (SMS/email/authenticator) "not wired" | **Confirmed true, and moot** | The design's own copy says this. Since the code never implements the OTP screen at all, there is no delivery channel to wire in the first place — the design's caveat and the code's omission are consistent, just at different points in the flow. |
| National ID / staff number identity field | **Explicitly blocked, honestly** | Code accepts only email-shaped identifiers; a non-email value produces `directoryBlocked`: "National ID / staff number sign-in is not enabled yet — the ministry directory contract has not been supplied." No silent coercion to email, no fabricated directory lookup. |
| Password sign-in | **Fully implemented** | `supabaseBrowser().auth.signInWithPassword({ email, password })`, real error handling (`authInvalid` vs `authNetwork` distinguished by message pattern). |
| Offline-first framing | **Implemented for connectivity display only** | `navigator.onLine` + `online`/`offline` event listeners drive the pill; the deeper offline-sync claims in the copy (visits/evidence sync) are a property of the post-login `/field` app, not this screen, and were not re-verified here (out of pilot scope). |
| Dark-only theme, no theme toggle on this screen | **Intentional divergence from design** | Design shows a theme-toggle button; code omits it with an explicit comment: the field channel is hard-locked dark (`ThemeScript`), so a toggle would have nothing to do. |
| Language toggle (AR/EN) | **Fully implemented**, differently | Design uses client `setState`; code uses a real navigable link (`/login/field?lang=en\|ar`) plus a `login_locale` cookie read server-side in `page.tsx` — functionally equivalent, more robust (works without JS, deep-linkable). |
| Prefilled credentials, fake device id, fake "Last sync 08:41" | **Deliberately not carried over** | Explicit code comment: a mockup may assert things a running system must not; none of these appear in production markup. |

## Net assessment

The design page describes an **untrusted-device OTP enrollment flow** that
the code **deliberately does not build**, replacing it with a narrower,
already-secure model (password login + backend-approved-only biometric
unlock of an existing session). This was not an oversight: the code's own
comments describe it as a *correction* of an earlier mental model. The two
artifacts are now out of sync in a specific, documented way — the design
still shows a flow the team decided not to ship as specified.

This is the delta the consent packet below addresses. It is **not** a
"missing feature to build" situation by default — one of the packet's
options is updating the *design* to match the shipped, more-secure
behavior instead of building OTP into the app.
