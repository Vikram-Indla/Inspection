# DESIGN-OPS-001 — Code and Runtime Truth Inventory

Read-only discovery for the design-operationalization workstream. Produced per
`design/claude-design-mvp1/prompts/01_CODE_AND_RUNTIME_DISCOVERY.md`, using the
master constitution, `CURRENT_UI_BASELINE.md`, `SOURCE_AUTHORITY.md`, and
`DESIGN_DECISIONS.md` as authority context. No application code, migrations,
or config were changed to produce this document.

## Runtime precondition — branch, commit, worktree state

- Branch: `setup/Inspection`
- Commit: `1422127c2e113105b67a297f95398e3e91674e38`
- Working tree: **DIRTY**. `git status --porcelain` reported modified files
  (`.project-memory/audit/instructions_loaded.jsonl`,
  `.project-memory/audit/session_end.jsonl`,
  `.project-memory/audit/tool_events.jsonl`,
  `product-contract/governance/OPEN_DECISIONS.yaml`,
  `product-contract/governance/decision_register.csv`,
  `product-contract/sessions/LAST_SESSION.md`) and untracked files
  (`product-contract/governance/CC-AC-0001-PLANNING-METHOD-ROLE-ROUTING-001.yaml`,
  `product-contract/governance/CC-AC-0016-0026-AI-PLANNING-SUMMARY-DEFERRAL-001.yaml`,
  `product-contract/governance/CC-OPS-CONTROL-SYSTEM-001.yaml`,
  `product-contract/operationalization/`, `scripts/ops_loopback_supervisor.py`).
  This document does not touch, stage, or resolve any of that dirty state; it
  is reported here only as the precondition the discovery-prompt requires.
- No build was run as part of this discovery (this task is read-only source
  inspection, not a visual/browser audit — no `.next` output or dev server was
  invoked or relied upon).

## Gate/contract context read (in order)

`AGENTS.md` -> `product-contract/00_START_HERE.md` -> `CURRENT_STATE.md` ->
`GATE_STATUS.md` -> `execution/CURRENT_SLICE.yaml` ->
`design/claude-design-mvp1/00_START_HERE.md` -> `CURRENT_UI_BASELINE.md` ->
`authority/SOURCE_AUTHORITY.md` -> `authority/DESIGN_DECISIONS.md` ->
`prompts/00_MASTER_DESIGN_CONSTITUTION.md` ->
`prompts/01_CODE_AND_RUNTIME_DISCOVERY.md`.

Key facts carried forward from those files:
- `GATE_STATUS.md`: G0–G10 PASS/CONDITIONAL PASS as recorded; G11 Hardening and
  G12 Release remain OPEN (credential rotation, region decision, and
  provider delivery/adapters are the named blocking conditions).
- `execution/CURRENT_SLICE.yaml` currently points at
  `TASK-MVP3-COMPLETE-IMPLEMENTATION-001` (MVP3 slice), status
  `INTEGRATED_PREPRODUCTION_SOURCE_AND_REMOTE_SCHEMA_CERTIFIED`; its
  `do_not_touch` explicitly forbids additional remote DDL and rewriting
  accepted MVP1/MVP2 behavior.
- `CURRENT_UI_BASELINE.md` truth labels reused verbatim below: `/operations/live`
  shows **projected route movement, not real GPS telemetry**; the virtual room
  has **live OTP/state/audit** behavior but **no integrated video provider**;
  public map tiles are an external dependency requiring unavailable/offline
  states; demo access is non-production scaffolding.

## Actual routes present under `apps/web/src/app/`

Confirmed on disk (`page.tsx` / `layout.tsx` / `route.ts`), grouped by journey area:

**Admin control plane**
`apps/web/src/app/admin/page.tsx`, `admin/access/page.tsx`, `admin/audit/page.tsx`,
`admin/devices/page.tsx`, `admin/gis/page.tsx`, `admin/gis/spatial/page.tsx`,
`admin/integrations/page.tsx`, `admin/items/page.tsx` (+`layout.tsx`),
`admin/localization/page.tsx`, `admin/notifications/page.tsx`,
`admin/operations/page.tsx`, `admin/packages/page.tsx` (+`layout.tsx`),
`admin/regulations/page.tsx` (+`layout.tsx`, `admin/regulations/[id]/page.tsx`),
`admin/risk/page.tsx`, `admin/risk/models/page.tsx`,
`admin/security-access/page.tsx`, `admin/violations/page.tsx` (+`layout.tsx`),
`admin/workflows/page.tsx`.

**Planning**
`planning/page.tsx`, `planning/bulk/page.tsx`, `planning/bulk/review/page.tsx`,
`planning/immediate/page.tsx`, `planning/single/page.tsx`,
`planning/plans/page.tsx`, `planning/plans/[id]/page.tsx`.

**Field / iPad**
`field/page.tsx`, `field/[visitId]/page.tsx`, `field/inspection/[id]/page.tsx`.

**Operations**
`operations/page.tsx`, `operations/exceptions/page.tsx`, `operations/live/page.tsx`.

**Reviews, virtual, visits, reporting**
`reviews/page.tsx`, `reviews/[id]/page.tsx`, `reviews/[id]/started/page.tsx`,
`virtual/page.tsx`, `virtual/[id]/page.tsx`, `visits/page.tsx`,
`visits/[id]/page.tsx`, `visits/calendar/page.tsx`, `visits/map/page.tsx`,
`visits/workload/page.tsx`, `reports/inspection/[id]/page.tsx`.

**Other journeys**
`ai/suggestions/page.tsx`, `evidence-ocr/page.tsx`, `cases/page.tsx`,
`committee/page.tsx`, `dashboard/page.tsx`, `enforcement/page.tsx`,
`factories/page.tsx`, `factories/[id]/page.tsx`, `tasks/page.tsx`,
`portal/page.tsx`, `profile/page.tsx`.

**Auth/shell/entry**
`layout.tsx`, `page.tsx`, `login/page.tsx`, `reset/page.tsx`, `launch/page.tsx`,
`launch/no-workspace/page.tsx`, `signout/route.ts`, `locale/route.ts`,
`api/routing/eta/route.ts`.

Route-to-catalogue reconciliation is tracked in
`design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv` (columns:
`screen_id,catalogue_route,implemented_route,code_location,reconciliation,status,design_instruction`)
against `product-contract/screens/screen_route_catalogue.csv`. Spot-checked
first data row: `SCR-ADM-001` -> `/admin` -> `apps/web/src/app/admin/page.tsx`
(direct, implemented) — consistent with the file actually present on disk.

## Key reusable components (existing, per `CURRENT_UI_BASELINE.md` + verified on disk)

- `apps/web/src/components/GeoMap.tsx` — reusable Leaflet geofence map.
- `apps/web/src/app/operations/live/LiveMapInner.tsx`, `LiveOps.tsx`,
  `OpsMap.tsx`, `Controls.tsx`, `Monitoring.tsx`, `OverrideQueue.tsx`,
  `OpsExport.tsx`, `types.ts`, `sla.ts` — Operations Live journey.
- `apps/web/src/app/field/[visitId]/Startup.tsx` — field geolocation/journey.
- `apps/web/src/lib/offline.ts` — offline/outbox engine.
- `apps/web/src/app/field/inspection/[id]/Workspace.tsx`,
  `FactoryVerification.tsx`, `SignaturePad.tsx`, `runtime.ts` — inspection workspace.
- `apps/web/src/components/ImageAnnotator.tsx` — image compression/annotation.
- `apps/web/src/app/virtual/[id]/Room.tsx`, `apps/web/src/app/virtual/[id]/actions.ts`,
  `apps/web/src/app/virtual/[id]/loading.tsx` — virtual OTP/session orchestration.
- `apps/web/src/app/reviews/` (`page.tsx`, `[id]/page.tsx`, `[id]/started/page.tsx`) —
  review/immutable-decision controls.
- Shell: `apps/web/src/components/Shell.tsx` (98 lines), `ShellClient.tsx`
  (251 lines), `apps/web/src/lib/shell-navigation.ts` (119 lines).
- Tokens: `apps/web/src/app/tokens.css` (161 lines) — the file
  `CURRENT_UI_BASELINE.md` designates as the sole location for raw visual
  values; `apps/web/src/app/astryx.css` (93KB) is the isolated Cinematic Atlas
  exception per the 2026-07-18 foundation-reset decision in `DESIGN_DECISIONS.md`.

## Provider truth register — live vs. placeholder/deferred/simulated

All provider adapters live under `apps/web/src/lib/providers/`, gated through a
shared `env-gate.ts` (`assertNonProduction`, `resolveFeatureFlag`,
`seededFraction`) that fails closed when a real credential/env var is absent.
Verified directly from source (file path : status):

| Provider file | Capability | Status (as coded) |
|---|---|---|
| `apps/web/src/lib/providers/video.ts` | Virtual-inspection video/room connection | **PLACEHOLDER / DEFERRED.** No real vendor SDK integrated (comment: "no video vendor selected — DEC-pending"). `StagingVideoProvider` is a deterministic stub, disabled by default (`selectVideoProvider()` returns `null` unless `NEXT_PUBLIC_FEATURE_VIDEO_PROVIDER` is explicitly non-`"off"`); UI must render a `SIMULATED VIDEO SESSION` badge when active. Identity/OTP for the same room is separately real (see below). |
| `apps/web/src/lib/providers/map.ts` (server geocode/directions surface) | Geocoding + directions/ETA | **PLACEHOLDER / DEFERRED (fail-closed).** `StubMapProvider.certified = false` always; `RealMapboxProvider.certified = false` too — the comment states it "has NEVER been exercised against a live Mapbox account." `selectMapProvider()` silently falls back to the stub if `MAPBOX_ACCESS_TOKEN` is unset. This module is distinct from the client-side Operations Live map below. |
| `apps/web/src/app/operations/live/LiveMapInner.tsx` | Operations Live map rendering | **LIVE rendering, SIMULATED positions.** This component (not `providers/map.ts`) renders with `mapbox-gl` (`mapbox-gl: ^3.25.0` in `apps/web/package.json`) directly, gated on `process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`; if unset it renders an honest `data-map-provider="mapbox-unavailable"` state. Inspector positions are computed by a local `projected()` function labelled in-code as "explicitly projected from visit windows; this view never presents them as live GPS telemetry" — matching `CURRENT_UI_BASELINE.md`'s "projected route, not real GPS telemetry" label. **See authority-conflict note below.** |
| `apps/web/src/app/login/StoryMapInner.tsx`, `apps/web/src/components/GeoMap.tsx` | Login atlas / geofence map | **LIVE, static.** Leaflet + CARTO/OSM basemap tiles, no accuracy-critical claims. |
| `apps/web/src/lib/providers/sms-twilio.ts` | SMS transport (fallback channel) | **PLACEHOLDER / NOT CONFIGURED by default.** Fail-closed: registers only if `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` are all set; otherwise the `sms` channel stays `not_configured`. Documented as the accepted *fallback* (primary is Unifonic per `engine_settings.otp`, which has no adapter file in this tree). |
| `apps/web/src/lib/providers/email-resend.ts` | Email delivery | **PLACEHOLDER / NOT CONFIGURED by default.** Requires `RESEND_API_KEY`; fails closed to `not_configured` otherwise. |
| `apps/web/src/lib/providers/push-webpush.ts` | Web Push (VAPID) | **PLACEHOLDER / NOT CONFIGURED by default.** Requires `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`; iOS support explicitly noted as PWA-installed-only. |
| `apps/web/src/lib/providers/notification-stubs.ts` | Push/SMS/email delivery simulation, OTP-transmission simulation | **SIMULATED, staging-only.** In-memory sink only, `assertNonProduction` guarded, off by default (`FEATURE_NOTIFICATION_STUBS`). Explicitly does **not** touch the real OTP code generation (that stays in Postgres). |
| `apps/web/src/lib/providers/ai-gemini.ts` | Advisory AI suggestions (M2-11) | **CONDITIONAL / FAIL-CLOSED.** Real Gemini HTTP call, but `getGeminiProvider()` returns `null` without `GEMINI_API_KEY`; `geminiProviderState()` reports `"unavailable"` in that case. Advisory-only by contract — never writes a decision, refuses legal-source surfaces via `isSuggestionSurfaceAllowed`. |
| `apps/web/src/lib/providers/ocr-gemini.ts` | Evidence OCR text extraction | **CONDITIONAL / FAIL-CLOSED**, same `GEMINI_API_KEY` gate as above. Advisory only — extracted text is never auto-filled into an authoritative field per the file's own comment. |
| `apps/web/src/lib/providers/location.ts` | GPS/geofence sampling | **SIMULATED, opt-in only.** `selectLocationProvider()` returns `null` (i.e. use the real browser Geolocation API, unchanged) unless `NEXT_PUBLIC_FEATURE_LOCATION_SOURCE` is explicitly set to `"simulator"`. Real geofence tables (`geo_events`, `geo_override_requests`, migration `20260716161605_ipad_geo_override_approval_workflow.sql`) are untouched by this module. |
| `apps/web/src/lib/providers/media.ts` | Evidence capture fixtures + malware-scan stub | **SIMULATED, opt-in only** (`FEATURE_MEDIA_FIXTURES`, default off). Real capture path (`Workspace.tsx` `enqueueEvidence()`) and real Supabase Storage upload are untouched. |
| `apps/web/src/lib/providers/factory-risk.ts` | Synthetic factory/risk fixtures | **SIMULATED, opt-in only** (`FEATURE_FACTORY_RISK_FIXTURES`, default off). Does not touch the real `factories`/`factory_documents`/risk-score tables from migration `0011_factory360_gis_ksa_seed.sql`. |
| `apps/web/src/lib/providers/signature-docusign.ts` | Committee decision e-signature (M2-12) | **CONDITIONAL, short-term real provider.** Real DocuSign OAuth + eSignature REST calls, but the file's own comment states DocuSign is explicitly a **short-term/dev-sandbox** substitute for a KSA PKI provider ("emdha") and "production MUST rotate to the real KSA PKI/EBDA provider before go-live — never treat this as the production signer." Fails closed to `'unavailable'` without all `DOCUSIGN_*` env vars. |
| Virtual-room identity/OTP (`vp_request_otp`/`vp_verify_otp` RPCs called from `apps/web/src/app/virtual/[id]/Room.tsx`, backed by `supabase/migrations/0009_virtual_otp.sql`) | OTP verification during virtual-session join | **LIVE.** Confirmed real RPC calls (`sb.rpc("vp_request_otp", …)`, `sb.rpc("vp_verify_otp", …)`, `sb.rpc("vp_otp_status", …)`) with server-enforced attempt/resend counters and lock states. UI copy in `apps/web/src/app/virtual/[id]/page.tsx` itself discloses the current transport is a **"DEV provider [that] shows code (release: Unifonic)"** — i.e. the OTP *code lifecycle* is live/real, but the *SMS transmission* of that code to a real phone is not yet wired to the named production provider (Unifonic). |

### Authority-conflict flag (for the lead — not resolved here)

`apps/web/src/lib/providers/map.ts` (top-of-file comment) states: *"The repo's
real map rendering today is Leaflet + CARTO tiles (StoryMapInner.tsx,
LiveMapInner.tsx, GeoMap.tsx) and stays as-is."* This is **not accurate for
`LiveMapInner.tsx`**: that file's own header comment and import (`import
mapboxgl from "mapbox-gl"`) show it renders with **Mapbox GL JS** directly
(`apps/web/package.json` lists `"mapbox-gl": "^3.25.0"` alongside
`"leaflet": "^1.9.4"`), reading its token from
`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. Only `StoryMapInner.tsx` and `GeoMap.tsx`
are actually Leaflet+CARTO. The design/code truth is still consistent on the
higher-order claim both files agree on — inspector positions are **projected,
not live GPS** — but the map.ts comment misdescribes which rendering
technology is live where. Flagging for the lead's stop-condition review; not
adjudicated in this document.

## Supabase migrations (count and journey-relevant anchors)

97 `.sql` files under `supabase/migrations/` at this commit. Journey-relevant
anchors confirmed present: `0009_virtual_otp.sql` (virtual OTP),
`20260716161604_add_geo_override_evidence_link.sql` and
`20260716161605_ipad_geo_override_approval_workflow.sql` (field geofence
override workflow). Full migration-by-migration mapping was not re-derived
here; `product-contract/mvp3/MVP3_84_ROW_MASTER_REGISTER.csv` and the
per-module wiring maps referenced in `CURRENT_STATE.md`/`GATE_STATUS.md` remain
the authoritative row-level source.

## Catalogue/reconciliation artifacts confirmed present

- `product-contract/screens/screen_route_catalogue.csv` — exists, header:
  `screen_id,channel,route,screen,personas,purpose,process,source_scope,mandatory_regions,primary_actions,states,permission_rule,scope`.
- `design/claude-design-mvp1/authority/CODE_ROUTE_RECONCILIATION.csv` —
  exists, header:
  `screen_id,catalogue_route,implemented_route,code_location,reconciliation,status,design_instruction`.

## Scope note

This document is a code/runtime discovery inventory only, per the prompt's
explicit instruction ("Do not propose code changes yet"). It does not
constitute a design deliverable, does not certify G11/G12, and does not
resolve the map.ts/LiveMapInner.tsx discrepancy noted above — that is left for
the lead's stop-condition check.
