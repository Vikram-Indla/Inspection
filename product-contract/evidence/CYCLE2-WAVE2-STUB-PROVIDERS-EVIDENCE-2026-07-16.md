# Cycle 2 Wave 2 — Precise Stubs and Provider Adapters Evidence

Branch: `fix/mvp1-cycle2-production-hardening`. Survey done first (Explore
agent) to avoid duplicating existing real code — findings below note what was
already real vs. genuinely missing.

## Shared safety architecture (`apps/web/src/lib/providers/env-gate.ts`)

Every stub in this wave shares:

- `assertNonProduction(name)` — every stub constructor calls this; it throws
  if `NODE_ENV === "production"`, regardless of the feature flag's value.
  Verified by `e2e/cycle2-wave2-providers.spec.ts` ("no-production-stub
  guard" — 6/6 constructors throw under forced `NODE_ENV=production`).
- `resolveFeatureFlag(envVar, allowed, fallback)` — an unknown/typo'd env
  value fails closed to the fallback, never silently selects an unintended
  provider.
- `seededFraction(seed)` — every stub is deterministic (FNV-1a hash → [0,1)),
  never `Math.random()`. Verified by determinism tests (same seed → same
  output) for video, map, location and risk.
- Every stub result carries `provider: "stub"` and a `fixtureId` (or the
  DB-level `notification_rule_id`/`rule_version_label` for SCR-ADM-080,
  landed in Wave 0) so audit/test evidence can prove which leg ran.

## A. Video Inspection — `providers/video.ts`

Interface: `joinRoom`/`endSession` covering waiting_room → connecting →
connected/degraded/reconnecting → provider_unavailable → ended, plus
camera/mic permission state. Identity/OTP verification during join was
**already real** (`vp_request_otp`/`vp_verify_otp`, unaffected).

**Wired into a live UI surface**: `/virtual/[id]` `Room.tsx` — opt-in only via
`NEXT_PUBLIC_FEATURE_VIDEO_PROVIDER=stub` (default OFF, so the existing
honest "provider adapter pending" box is unchanged for everyone who hasn't
opted in). When enabled and the session reaches `in_progress`, an additive
panel renders a `SIMULATED VIDEO SESSION` lozenge plus the deterministic
connection/camera/mic state and fixture id — never presented as a real
connection.

## B. Mapbox / maps / routing — `providers/map.ts`

A Mapbox MCP was named in the task prompt but was **not discoverable** in
this session's tool registry (checked via ToolSearch before writing any
code) — no Mapbox integration is fabricated and no token is hardcoded.
Survey confirmed zero existing Mapbox code repo-wide; real map rendering
(Leaflet + CARTO tiles: `StoryMapInner.tsx`, `LiveMapInner.tsx`, `GeoMap.tsx`)
is untouched.

`FEATURE_MAP_PROVIDER=mapbox|stub|off`. `mapbox` mode fails closed: without
`MAPBOX_ACCESS_TOKEN` it falls back to the stub; **with** a token set it
throws rather than silently claiming a real connection, because no real
Mapbox client exists in this codebase yet — verified by test. `certified`
is hardcoded `false` on the stub; nothing marks Mapbox real-provider
certification complete.

Not wired into live UI (no safe integration point without a real
credential/contract test to certify against, per the task's own limit).

## C. Location/GPS/Geofence — `providers/location.ts`

`FEATURE_LOCATION_SOURCE` simulator covering accurate / weak-accuracy /
stale-timestamp / permission-denied / no-signal samples, plus a
`checkGeofence()` helper (distance, inside-fence, route-deviation, arrived)
that deliberately does **not** decide overrides itself — the real governed
`geo_override_requests` workflow
(`20260716161605_ipad_geo_override_approval_workflow.sql`, already live)
remains the sole authority for override decisions. Default `device` (off) —
the real browser Geolocation path is unchanged.

Not wired into the iPad `Startup.tsx` UI — that surface is governed
production workflow under active, separately-authorized development
(`TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003`); wiring a simulator into it
was judged too risky to do safely in this task's remaining scope. Adapter is
complete and tested standalone.

## D. Media/Evidence — `providers/media.ts`

Fixture capture (photo/video/audio/document) with deterministic bytes +
sha256 checksum, invalid-type/oversize/interrupted-capture rejection, a
deterministic scan (pass/fail/timeout) with a retry helper, and an
append-only chain-of-custody trail builder (captured → queued_local →
uploaded → scanned → signed_url_issued). All covered by
`e2e/cycle2-wave2-providers.spec.ts`. Not wired into the real
`Workspace.tsx` capture path — that path is real device capture in
production and this fixture generator is for test/staging data only.

## E. OTP and Notifications — `providers/notification-stubs.ts`

Real OTP verification is untouched (already live, DB-backed). This module
registers deterministic **push/sms/email** `DeliveryAdapter`s into the
*existing* `notify.ts` registry (opt-in via `FEATURE_NOTIFICATION_STUBS`),
simulating success / provider-down / retry-limit-exceeded / duplicate
suppression — every "send" lands in an in-memory sink only, never a real
external message. `simulateOtpTransmission()` covers the OTP-over-SMS/push
*transmission* leg specifically (the code itself stays server-generated and
real).

## F. Factory Master and Risk — `providers/factory-risk.ts`

Synthetic factory fixtures (multi-licence, products, machines, approvals
count, freshness incl. `partial_source_failure`) and a versioned,
per-factor-explainable risk score (`syn-risk-v1`), matching the shape of the
real `factories`/`risk_score`/`risk_band` columns
(`0011_factory360_gis_ksa_seed.sql`) without touching that table. Not wired
into Factory 360 UI — mixing synthetic and real rows on a production,
tested page was judged too risky to do safely in this task's remaining
scope; the SYNTHETIC SOURCE DATA / SIMULATED RISK RESULT UI labels the
prompt requires are therefore **not yet rendered anywhere** — this is an
honest gap, not a completed requirement.

## G. Offline/Network harness — `e2e/network-harness.ts`

Extracted and generalized from the ad hoc patterns already in
`offline-drill.spec.ts`: offline/online (real `context.setOffline`), latency,
timeout (never-resolving route), dropped request (`route.abort`), reordered
requests, ambiguous retry (client sees failure, server-side write still
lands), server conflict (409), app restart (fresh navigation), and a
duplicate-prevention request-counting helper. Lives under `e2e/` (not
`src/`) so it is structurally impossible to end up in the production
bundle — no flag needed, no import path exists from app code.

## Testing

`e2e/cycle2-wave2-providers.spec.ts` — 24/24 pass:
adapter-contract + determinism + stub/real-parity (fail-closed mapbox
selection) + no-production-stub-guard (6 constructors) + media
capture/scan/custody + notification dedup. `npx tsc --noEmit` and
`npm run build` both clean (`/virtual/[id]` bundle grew 4.97kB → 5.77kB,
confirming the new code is actually included, not dead).

## Known limitations (see also KNOWN_LIMITATIONS.md in the final handoff)

Only Wave 2.A (video) has a live UI wiring. B/C/D/E/F/G are complete,
tested adapter layers with no UI surface yet — do not report them as
UI-complete. G is deliberately UI-less by design (it's a test harness, not a
product feature).
