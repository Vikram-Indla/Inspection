# Biometric/WebAuthn re-entry — split out, deferred to its own round

Split from the main PLAN.md per sponsor decision (round 3) — this item kept ballooning in required
net-new infrastructure across every round and was blocking 7 otherwise-converged items. Sponsor
confirms biometric stays a real MVP1 requirement — this is a deferral of sequencing, not scope.

## What's locked so far
- Model: **re-entry unlock on an existing Supabase session**, not passwordless login (round 2 decision).
- **Lock trigger (round-3 follow-up, now resolved):** the locked state activates on **app
  resume-from-background** (`visibilitychange`/focus-regain) **while a biometric credential is
  enrolled for the current user** — no invented idle-timeout duration; the trigger is structural
  (backgrounded → foregrounded), not time-based.

## What's still open (real work before this can go to Sol again)
1. **New app state that doesn't exist anywhere today**: a "locked" route guard sitting in front of
   the field shell, engaged on resume-from-background, cleared only by successful WebAuthn
   verification (or password fallback). Needs a design pass — where does it render, what's visible
   underneath, does it block navigation entirely.
2. **Durable, multi-instance-safe challenge storage** — Next.js is not guaranteed single-instance;
   an in-memory challenge won't survive registration/verification landing on different instances.
   Needs a real store (DB table with short TTL + single-use, or signed/encrypted cookie) — to be
   designed, not the in-memory approach v3 proposed.
3. **RP ID / origin**: needs an approved allowlist per environment (not derived from request `Host`
   alone, per Sol's finding — proxy headers can't be trusted blindly).
4. **Audit contract extension**: `log_auth_event`/`logAuthEvent` only accept the two password-reset
   event types today. `webauthn.enrolled/authenticated/revoked` need an approved extension to that
   contract (new allowed action values + review of the SECURITY DEFINER function), not silent reuse.
5. **Trusted-device enrollment semantics**: `mvp3_devices` requires Ops/Security to mark a device
   `trusted`. Inspector self-enrollment (needed for a device to even hold a WebAuthn credential) can
   only create a `pending` device row — confirm whether a `pending` device may still enroll a
   biometric credential, or whether biometric requires `trusted` status first (blocks self-service
   until Ops approves). This is a real product-policy fork, not a technical detail.
6. `@simplewebauthn/server` + `@simplewebauthn/browser` — pin exact versions, confirm Next.js
   App Router server-action compatibility before adding to `package.json`.

## Next step
Once items 1–6 have real answers (some need a short design pass, item 5 needs a sponsor call), redraft
as its own PLAN-BIOMETRIC.md and run it through the same Fable/Sol adversarial loop independently —
don't bundle it back into the field-channel build.
