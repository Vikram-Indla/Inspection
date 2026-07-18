# TASK-MVP3-RETROFIT-REGRESSION-001 — retrofit regression certificate

Date: 2026-07-18

Project: Supabase `iiozvqntawxfwbgffzqu`

Candidate branch at certification: `codex/integrated-preprod-20260718`

## Verdict

**PASS — MVP3 is integrated as an additive layer over the canonical MVP1/MVP2 platform.**

The engineering retrofit gate is passed. The complete protected browser inventory achieved
510/519 passing tests (98.27%), with zero failures. The nine skips are explicit external-provider
or destructive-replay boundaries, not hidden product failures. No P0 or P1 integration defect
remains open from this iteration.

This is not a claim that an unconfigured external signature, SSO, EBDA, notification, AI, MDM or
production-hosting provider is live. Those seams remain disabled or fail-closed in
`MVP3_PROVIDER_POLICY_HOLDS.csv` and do not split or corrupt MVP1/MVP2 behavior.

## Scope and coexistence result

- 84/84 MVP3 register rows have an implementation or explicit external-hold disposition.
- 12/12 Claude Design modules (CD-050..CD-061) plus the M3-12 assurance module coexist with the
  existing MVP1/MVP2 identities, routes, workflow, audit, evidence, GIS, field, case and decision
  engines.
- MVP3 introduces no parallel user, factory, visit, inspection, evidence, workflow, case or audit
  source of truth.
- Exact relationship map: `../mvp3/MVP3_RETROFIT_INTEGRATION_MAP.csv`.

## Live Supabase proof

| Control | Result |
|---|---|
| MVP3 additive tables | 13 |
| MVP3 tables with RLS | 13/13 |
| MVP3 policies | 25 |
| MVP3 functions | 9 |
| MVP3 non-internal triggers | 6 |
| Anonymous table grants | 0 |
| Rollback-only RPC probe | PASS; seven governed RPC paths; zero residual flags/devices/events |
| OCR retrofit | `ocr_extractions` live; RLS enabled; two policies; zero anonymous grants |
| Geo override P0 repair | Live; canonical planner/factory coordinates; inspector request and Operations decision proven |
| Migration history | Versions 20260717250000, 20260718010000, 20260718020000, 20260718140105 and 20260718150000 recorded applied |

The geo-override defect was a real live P0: the RPC referenced nonexistent
`visits.dispatch_lat/dispatch_lng`. Migration
`20260718140105_fix_geo_override_dispatch_coordinates.sql` replaces that read with the canonical
visit-planner/factory coordinate fallback while preserving assignment, evidence, expiry,
maker/checker and audit controls.

## Application and regression proof

| Check | Result |
|---|---|
| TypeScript | PASS |
| Production build | PASS |
| Static/source inventory | 66 passed; four intentional live-provider skips; zero failed |
| Focused M04 device/ETA/override journey | 8/8 PASS including five persona setup tests |
| MVP3 live SQL probe | PASS with transaction rollback and zero residual rows |
| Complete protected browser inventory | **510 passed; 9 skipped; 0 failed (19.2 minutes)** |

The nine complete-inventory skips are seven credential-bound external-provider checks (DocuSign,
Resend, Web Push, Twilio and Gemini) and two explicitly destructive G11 replay checks. Equivalent
non-destructive integration evidence is present through the new governed M04 browser journey and
the rollback-only live SQL probe. Skips are not counted as passes.

## Defects closed in this iteration

1. Restored field-device compatibility metadata while preserving the newer device JSON contract.
2. Replaced stale Google-era ETA expectations with real Mapbox route provenance and an offline
   cached/stale estimate contract.
3. Replaced direct/self-approved geo override behavior with inspector request and separate
   Operations approval through RLS-governed UI and RPC paths.
4. Repaired the live geo-override function's invalid coordinate columns through a forward-only
   migration.
5. Removed the Operations decision UI hang after a committed decision without weakening server
   authorization.
6. Reconciled assistive-AI tests with mandatory evidence citation and human reject/fail-closed
   behavior.
7. Added the Operations persona to the protected auth project and hardened transient verified-claim
   retrieval without falling back to an unverified browser session.
8. Extended MVP3 route, Arabic/RTL, theme, responsive and source-contract regression coverage.

## Residual holds and release boundary

Open provider/policy holds are deliberate fail-closed dependencies: digital signature, external
identity/SSO, EBDA/data exchange, external notifications, retention/backup policy, AI provider,
MDM/device-provider administration and production release. They require sponsor/legal/security or
deployment inputs and were not self-approved. Mapbox is the selected map implementation, but its
deployment token/style/offline policy must still be supplied in the target environment.

These holds do not prevent the retrofit engineering PASS because deterministic MVP1/MVP2 paths,
data integrity, negative authorization, auditability and explicit unavailable states all passed.
They do prevent any claim of provider-complete production release.

## Certificate

MVP3 retrofit integration: **PASS**

MVP1/MVP2 regression: **PASS**

Database/RLS migration: **PASS**

Configured external-provider delivery: **HELD — fail-closed, not counted as PASS**

Production deployment: **NOT CERTIFIED BY THIS TASK**
