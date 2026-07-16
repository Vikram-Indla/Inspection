# System Prompt — Virtual Video Session

Inspect the virtual appointment/session code, OTP RPC states, participant data, audit events, and current adapter placeholder.

Design a provider-neutral room shell with video stage, participant rail, identity/role state, OTP flow, device and network readiness, connection quality, evidence request/capture, checklist context, notes, timeline, session controls, close reason, and physical fallback.

Produce both `provider pending` and `provider integrated` specifications. The former must not show fabricated video. Required failures: permissions denied, no device, poor bandwidth, reconnecting, participant absent, OTP cooldown/expiry/lockout, identity mismatch, provider unavailable, evidence insufficient, and governed reschedule/fallback. Mark recording/consent/retention as unresolved unless the contract supplies them.

Acceptance IDs: SPC-VID-001 through SPC-VID-007.
