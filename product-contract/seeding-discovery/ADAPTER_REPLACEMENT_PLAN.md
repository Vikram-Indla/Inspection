# Adapter Replacement Plan — External Integration Seeding Strategy

Mode: design/plan only. No adapter code, DDL, or seeding was executed to produce this document.

Repository: `/Users/vikramindla/Developer/Inspection`
Branch at time of writing: `docs/saqeel-inspector-inventory`
Commit: `6fc27d3f654a79d2aa6ef659b0879b35b9eb5b6d`

Companion document: `EXTERNAL_SOURCE_CONTRACT_REGISTER.csv` (per-provider detail). This document is the narrative replacement strategy — how each provider's seam is used at seed time without inventing a contract.

## 0. Method

This plan is grounded entirely in repository grep/read evidence gathered in this session:
- `apps/web/src/lib/integrations/senaei/*`
- `apps/web/src/lib/integrations/industry-shared/*`
- `apps/web/src/lib/providers/*` (map, video, location, media, notification-stubs, sms-twilio, email-resend, push-webpush, ai-gemini, signature-docusign, env-gate)
- `apps/web/src/lib/field-integrations.ts`
- `apps/web/src/lib/factory-verification.ts`, `apps/web/src/lib/notify.ts`
- `product-contract/factory-360/industry-shared/{F360_INDUSTRY_SHARED_ACCEPTANCE_LEDGER.csv,FACTORY360_STUB_RETIREMENT_MATRIX.csv}`
- `supabase/migrations/0001_foundation.sql` (engine_settings otp row), `0009_virtual_otp.sql`, `0023_fix_otp_rpc_authorization.sql`

No provider contract was invented. Where a real contract could not be found, this plan says so and stops — it does not propose values, endpoints, schemas, or credentials.

## 1. Providers found, at a glance

| Provider domain | Contract reality | Seeding posture |
|---|---|---|
| Senaei (`/api/inspection/*`) | Real, partially observed wire contract; server-only fail-closed client | Build a seed-time fixture server behind the SAME `requestJson`/`KNOWN_ENDPOINTS` interface |
| Industry Shared (`beta-backoffice.industry.sa/shared/api/v2/*`, 11 leads incl. HRSD) | `DISCOVERY_REQUIRED` for every lead; `BLOCKED_EXTERNAL` on the acceptance ledger | Seed only the honest `not_configured` state via `unavailableIndustrySharedEndpoint()` — never fabricate a payload |
| HRSD | Not a separate adapter — folded into Industry Shared (`hrsd_labors`, `job_workforce_info`, `plant_with_labors`) | Same as Industry Shared |
| MODON | **Not found anywhere in the codebase as a data provider.** Sole repo hit is an unrelated casting/location aesthetic reference ("MODON-style estate") | No seeding action possible or appropriate; flag as an open business decision if MVP1 truly requires it |
| Maps (Mapbox geocode/directions) | Real REST contract called correctly, never certified live; deterministic `StubMapProvider` already exists | Reuse the existing stub unmodified |
| Map tile rendering (Leaflet+CARTO) | Already live, unrelated to the geocoding provider | No seeding action needed |
| Video Inspection | No vendor selected (DEC-pending); `StagingVideoProvider` already exists | Reuse the existing stub; enforce the "SIMULATED VIDEO SESSION" badge rule |
| OTP transmission (Unifonic primary / Twilio fallback) | Unifonic has **no adapter code at all**; Twilio adapter is real but uncredentialed | Do not seed a "Unifonic delivered" outcome — it would misrepresent an unimplemented provider as working |
| Email (Resend), SMS (Twilio), Push (VAPID) | Real adapters, all fail-closed without credentials | Use existing `notification-stubs.ts` staging registry for seed-time delivery outcomes |
| Assistive AI (Gemini) | Real adapter, advisory-only, legal surfaces hard-refused | No seed action needed — unset key already yields correct behavior |
| Digital signature (DocuSign sandbox) | Real but explicitly a temporary sandbox stand-in for a future KSA PKI provider | Treat cautiously; do not seed a fabricated "verified" signature |
| Location/GPS, Media/evidence capture, Field ETA/override | Not third-party contracts — internal dev/test simulators with real production paths already live and untouched | Reuse existing simulators directly |

## 2. Per-domain replacement seam design

### 2.1 Senaei

The client (`createSenaeiClient`) is a single `requestJson(path, options)` function bound to a `fetchImpl`. This is already testable-by-construction: the seeder never needs to touch `client.ts`. Instead:

- Add a seed-only fixture HTTP responder (not part of this plan's file output — a future implementation task) that answers exactly the `KNOWN_ENDPOINTS` regex set with response bodies shaped like the real `types.ts` unions (`SenaeiUserProfile`, `InspectionTaskDetail`, `Regulation`, `ProductionLinePage`, etc).
- Bind it via the existing `fetchImpl` parameter of `createSenaeiClient`/`senaeiClientFromEnvironment` — this is the one seam the code already exposes for exactly this purpose (test injection), so no source file changes are needed.
- Any negative-path seed scenario (timeout, 5xx, oversize body, invalid JSON) must reuse the existing `SenaeiErrorCode` taxonomy from `errors.ts` rather than inventing new codes.
- Because `factory-verification.ts` never writes back to `factories` (only to `inspection_factory_checks`, per FND-007 and the M04-112 comment), seeded "Senaei-observed" values must be treated the same way: they populate `inspection_factory_checks.source_value`, never mutate `factories` directly.
- Open gap: no `source_system`/`source_synced_at`/`sync_status` columns exist yet on canonical tables. This is a schema gap, not something the seeder can silently invent — raise as an open decision before Section I execution.

### 2.2 Industry Shared / HRSD

All 11 endpoint keys are `DISCOVERY_REQUIRED`. The client module (`client.ts`) enforces this by **throwing** if a lead's `state` is ever anything but `DISCOVERY_REQUIRED` and a caller tries to treat it as verified:

```
if (contract.state !== "DISCOVERY_REQUIRED") {
  throw new Error("Verified Industry Shared contracts require a schema-validating adapter before use.");
}
```

This means the correct — and only legal — seed-time behavior is to exercise `unavailableIndustrySharedEndpoint(endpoint, domain)` and assert the resulting `IndustrySharedResult` is `{ status: "not_configured", code: "INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED", ... }`. A seeder must NOT invent `license_info`/`job_workforce_info`/`hrsd_labors` payloads — doing so would fabricate a provider contract the codebase deliberately refuses to assume. Where Factory 360 screens need workforce/license/contact data for realistic demo scenarios, that data must come from the REALISTIC_SYNTHETIC canonical tables (`factories`, `industrial_licenses`, `plant_production_line_items`) with clear synthetic provenance — never routed through the Industry Shared client pretending to be live.

The existing `apps/web/e2e/industry-shared-integration-contract.spec.ts` (4/4 passing per the F360-ISH ledger) is the correct regression gate to re-run after any seed run touching Factory 360 — it already proves isolation from `/api/inspection` and that unknown sensitive fields never leak into fixtures/logs.

### 2.3 MODON

No seam exists because no adapter exists. If a future task needs MODON, that is an open decision requiring: (a) an actual accepted contract document, (b) explicit sponsor/product authorization to add a new external domain, (c) a new `INTEGRATIONS` mindmap node and product-contract requirement IDs. This plan takes no position on whether MODON integration is in-scope for MVP1 — it only reports it does not exist today.

### 2.4 Maps

`StubMapProvider` in `map.ts` is already a complete, deterministic, KSA-bounded geocode/directions simulator with three named failure modes (`no_route`, `tile_failure`, `token_failure`) driven by `seededFraction()`. Seeding action: none beyond leaving `MAPBOX_ACCESS_TOKEN` unset and `FEATURE_MAP_PROVIDER` at its `stub` default so `selectMapProvider()` returns the stub. Do not attempt to "seed" Mapbox credentials — that is a real vendor account decision outside seeding scope.

### 2.5 Video Inspection

`StagingVideoProvider` already reproduces the full state machine (`waiting_room → connecting → connected → degraded → reconnecting → provider_unavailable → ended`) deterministically per `sessionId:participantId` hash. Seed scenarios for "Virtual provider blocked/degraded" (per the blueprint's scenario catalogue) should pick `sessionId`/`participantId` seed values known in advance to land in the desired probability bucket (`f < 0.08` → `provider_unavailable`; `f < 0.2` → permission denied; `f < 0.35` → degraded; else connected) — computed offline from `seededFraction()`'s FNV-1a hash, not guessed. The identity/OTP layer underneath (`vp_request_otp`/`vp_verify_otp`) is real and must be exercised through its real RPCs, not stubbed.

### 2.6 OTP transmission / Unifonic

The accepted `engine_settings` row (migration `0001_foundation.sql` line 123) names `provider_primary: "unifonic"`. No Unifonic adapter exists in the codebase — confirmed by an exhaustive grep across `apps/web/src`, `apps/web/supabase`, and `supabase/migrations`. The only provider-labeled behavior is a `DEV-CONSOLE (release: <provider_primary>)` string in the RPC's own return payload (migrations `0009` and `0023`). A seeder must not seed a delivered-via-Unifonic outcome — that would misrepresent an unimplemented provider as functioning. The correct seeded state is: OTP codes are generated and verified for real through the live RPCs; their *transmission* is recorded via `simulateOtpTransmission()` in `notification-stubs.ts`, which already labels its channel honestly (`sms`/`push`) without claiming a specific vendor.

### 2.7 Email / SMS / Push

All three already have real adapters (Resend, Twilio, Web Push) registered through `notify.ts`'s `Map`-backed `DeliveryAdapter` registry, all fail-closed to `not_configured` without credentials. For a staging seed run, `registerStagingNotificationAdapters()` in `notification-stubs.ts` should be invoked once at seed-runner bootstrap (never in application/browser code — `assertNonProduction()` already throws under `NODE_ENV=production`) so that push/sms/email report a deterministic `staging:<channel>` outcome instead of a blanket `not_configured`, letting the seeded dataset exercise the full delivery/escalation/dedup UI. Push additionally requires a real `PushSubscription` row created via a real browser subscribing (`subscribePush.ts`/`PushOptIn.tsx`) — this cannot be end-to-end seeded without a live browser and should be documented as a seeding limitation, not "fixed" by fabricating a subscription row.

### 2.8 Assistive AI (Gemini)

No seed action required. An unset `GEMINI_API_KEY` already yields the correct `unavailable` state via the existing fail-closed constructor gate. If a demo dataset needs to show a populated advisory-suggestion, that requires a real key and a real call — this must never be synthesized as if the model produced it, since the suggestion text itself would then be fabricated content misattributed to a real AI provider.

### 2.9 Digital signature (DocuSign sandbox)

Treat with extra caution: this adapter calls the REAL DocuSign sandbox API, which is explicitly documented as a temporary stand-in for a future KSA PKI/EBDA-class provider, never the production signer. Do not seed a fabricated `"verified"` signature status — any seeded committee/decision-dossier scenario needing a signature state should either (a) exercise the real DocuSign sandbox with real sandbox credentials if available, or (b) seed only the honest `"unavailable"` state absent credentials. `lib/committee/signature.ts` was not fully read in this pass and should be reviewed before any Section I task attempts to seed M2-12 scenarios.

### 2.10 Location, Media capture, Field ETA/override

None of these are third-party contracts; they are internal dev/test simulators sitting alongside already-live real production paths (browser Geolocation + `geo_events`/`geo_override_requests`; `Workspace.tsx enqueueEvidence()` + real Supabase Storage; and a `DEC-008`-pending production ETA/approval integration). Reuse the existing simulators (`LocationProvider`, media fixture generator, `estimateFieldRoute({mode:"test_stub"})`) directly for seed scenarios; no new adapter code is needed, and every one of them already carries the honesty labels (`mode`, `provider`, `TEST_STUB_LABEL`) the blueprint requires.

## 3. Cross-cutting rules for the seeder (binding on Section I design)

1. Every seeded record touching an external-provider seam must carry a real, inspectable "how did this get here" marker consistent with the existing type unions above (`provider`, `mode`, `source`, `state`, `fixtureId`, `code`) — never a bare boolean "is this real".
2. No seed script may write a payload shape for Industry Shared/HRSD/MODON that does not already exist as a verified TypeScript type in this repository, because none of those payload shapes have been observed from a real endpoint.
3. Wherever a real fail-closed adapter exists (Senaei, Industry Shared, Resend, Twilio, Web Push, Gemini, DocuSign), the seeder must exercise the SAME code path a real request would use (`fetchImpl` injection, feature flags, env vars) rather than writing directly to the `notifications`/`inspection_factory_checks`/etc. tables and skipping the adapter layer — otherwise the seeded dataset would not prove the real contract works.
4. `assertNonProduction()` is already a hard guard on every Cycle-2 Wave-2 stub (video/map/location/media/notification-stubs). The seed runner must run under the same guard, and must itself refuse to execute if `NODE_ENV=production` or if the resolved Supabase project cannot be proven non-production (see `SEEDER_IMPLEMENTATION_PLAN.md` §Production guard).
5. Do not "complete" the MODON, Unifonic, DocuSign-production, or Industry Shared/HRSD contracts as part of seeding work. Seeding must represent their current, real, blocked/not-configured state faithfully.
