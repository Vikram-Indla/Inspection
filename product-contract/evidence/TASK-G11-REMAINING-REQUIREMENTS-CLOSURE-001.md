# TASK-G11-REMAINING-REQUIREMENTS-CLOSURE-001

Date: 2026-07-16
Branch: `codex/remaining-requirements-closure`
Baseline: `codex/g11-g12-integration@9e7c669`
Change control: `CC-G11-REMAINING-19-001` — sponsor approved

## Scope

Production-grade closure of the 19 acceptance rows recorded as partial on
2026-07-15. Each row requires source, backend/data, authorization, audit,
negative-path, runtime and evidence proof before its ledger status changes.

## Slice 1 — M09 administrative configuration

Requirements: `MVP1-M09-001`, `MVP1-M09-005`, `MVP1-M09-018`,
`MVP1-M09-021`, `MVP1-M09-022`, `MVP1-M09-024`.
Acceptance: `AC-0449`, `AC-0453`, `AC-0466`, `AC-0469`, `AC-0470`,
`AC-0472`.
Screens: `SCR-ADM-010`, `SCR-ADM-011`, `SCR-ADM-020`, `SCR-ADM-030`,
`SCR-ADM-031`.
Engines: `ENG-01`, `ENG-02`, `ENG-03`, `ENG-07`, `ENG-12`.

### Verified implementation

- Regulation drafts expose effective dates, governed private attachments,
  draft editing, validation, maker-checker publication, successor lineage,
  deactivation with reason, immutable governed versions and object-scoped audit.
- Package item rules author required, optional and conditional relationships;
  `visible_when` uses a validated `key=value` grammar and the publish gate
  rejects missing dependencies and circular chains.
- `mandatory_when_visible` is stored in the frozen package definition and is
  enforced by field runtime only while its condition is visible.
- Evidence rules support inherit, none, photo, video, document and comment;
  the publish gate validates shape and runtime projection consumes the rule.
- Scoring enable/disable, weights and excluded responses are explicit package
  authoring semantics and are consumed by field scoring without changing a
  published version.
- RLS/server authorization, maker-checker, published immutability, neutral
  degraded states, Arabic/RTL, responsive and keyboard/accessibility paths are
  retained.

### Evidence

- `npm run typecheck` — PASS.
- Environment-configured `npm run build` — PASS, all routes compiled.
- Focused production-browser inventory:
  `cd-005-006-regulations.spec.ts`, `cd-006-011-backend.spec.ts`,
  `cd-007-items.spec.ts`, `cd-008-009-packages.spec.ts` — **49/49 PASS**
  against the configured Supabase project using real persona authentication.
- Source/live contract migration:
  `20260715220000_m09_authoritative_contract_completion.sql`; the separately
  verified trigger-only RPC hardening is in
  `20260716200000_cd006_011_trigger_rpc_hardening.sql`.

### Disposition

The six historical THIN/partial development-audit verdicts are superseded by
the current implementation and focused runtime proof. They move to
`implemented`; this record does not relabel provider delivery or unexecuted
destructive production mutations as live-verified.

## Remaining work

Thirteen recorded partial rows remain after Slice 1. M04-045 has exact
forward migrations represented on this branch; live probing is pending a
restored Supabase credential because the clipboard is currently empty.

## Slice 2 — remaining backend and wiring checkpoint (2026-07-16)

Requirements: `MVP1-M02-039`, `MVP1-M04-012`, `MVP1-M04-017`,
`MVP1-M04-024`, `MVP1-M04-043`, `MVP1-M04-045`, `MVP1-M07-003`,
`MVP1-M07-004`, `MVP1-M07-005`, `MVP1-M07-014`, `MVP1-M07-015`,
`MVP1-M07-017`, `MVP1-M07-019`.

Implemented source contracts:

- RLS-scoped `/visits/map` route with region selection, factory/Visit pins,
  authorized latest inspector positions, list equivalent and dossier links.
- Persistent bounded device identity, OS version and package-derived app
  version on the journey session.
- Authenticated Google Routes adapter using traffic-aware road distance/ETA,
  neutral unavailable/no-route states, telemetry-cadence refresh and latest
  estimate persistence. The API key remains a deployment secret.
- Outside-geofence confirmation with mandatory reason, actual coordinates,
  immutable override event and guarded operational transition.
- Offline-safe arrival photo/comment evidence linked to the exact arrival
  event, private storage policy, SHA-256, replay-safe path and visit-level RLS.
- Source-owned license and CR detail fields with explicit unavailable values;
  official, observed and override map/history without master-coordinate writes.
- Append-only penalty-notice and reproducible risk-snapshot records; the
  `recalculate_factory_risk` RPC validates normalized drivers/weights, applies
  the accepted DEC-001 model and bands atomically, stores driver contributions,
  updates the current projection and audits both records.
- Factory 360 now renders risk/health history, driver traces, related
  violations, source sync, Visit/inspection/review, evidence, penalty and score
  events. Documents, contacts, evidence and penalty details are both UI- and
  RLS-scoped by role.

Verification:

- `npm run typecheck` — PASS.
- `npm run build` — PASS, including `/visits/map` and `/api/routing/eta`.
- `remaining-requirements-backend.spec.ts` — **3/3 PASS**.
- `git diff --check` — PASS.

### Live migration and reconciliation

- The authorized management path applied
  `20260716210000_remaining_requirements_backend.sql` to project
  `iiozvqntawxfwbgffzqu`. The project has no migration-history table, so the
  preflight and postflight used schema/object probes rather than fabricating
  migration ledger entries.
- Postflight proved: risk RPC present; 155 risk snapshot rows; penalty notices
  present; three scoped audit triggers; ten registry fields; three journey
  fields; private evidence bucket; and three evidence object policies.
- Least-privilege probes proved anon cannot execute the risk RPC, read risk
  snapshots or call the storage helper; authenticated users may read snapshots
  and call the helper but cannot insert snapshots directly. Authenticated RPC
  execution remains role-guarded inside the function.
- Existing scores were preserved as explicitly labelled legacy snapshots. The
  155 rows with unavailable historical drivers remain labelled as such; no
  driver history or calculation timestamp was invented.

### Live browser and durable-row evidence

- Production build and typecheck: PASS.
- Registered-factory Factory 360 map/risk focused run: **5/5 PASS** including
  authenticated setup. The old test assertions that expected those sections to
  be unavailable were removed because this approved slice implements them.
- Planner `/visits/map` and inspector migrated startup reads: **6/6 PASS**
  including persona setup.
- Arrival replay through the ordinary inspector session/RLS path: **5/5 PASS**
  including setup. Independent database reconciliation for Visit
  `b6b524c9-14f9-4b74-ae7c-ddb65580acad` proved `arrived` state, arrived journey,
  device keys `app_version/device_id/os_version`, 5m inside check-in, device
  timestamp, synced arrival-linked evidence, SHA-256, one private stored object
  and three Visit audit records.
- Outside-fence negative replay for Visit
  `e00f3359-61af-4eff-9aec-5e51fc195181` proved the confirmation action remains
  disabled without a reason; after the governed reason was supplied it stored
  the actual `25.0798000,45.5722000` observation, 5m accuracy, explicit
  `override` result, immutable reason, arrived journey/Visit state and three
  Visit audit records. The observed point was 1,112m from a 150m fence.
- Destructive live replays are retained as opt-in tests under
  `RUN_G11_LIVE_REPLAY=1`; ordinary full regression runs do not reuse consumed
  fixed Visit fixtures.
- The deployment does not expose `GOOGLE_MAPS_ROUTES_API_KEY`. The production
  adapter and persistence wiring are complete, and the live UI truthfully
  rendered `routing provider unavailable`; provider delivery is not claimed.

### Slice 2 disposition

All thirteen remaining historical partial rows now have complete source and
backend/data wiring. Four rows with exact live end-to-end evidence move to
`verified_live` (`M02-039`, `M04-012`, `M04-043`, `M04-045`); the provider-bound
ETA rows and Factory 360 breadth rows move to `implemented` without overstating
provider or legacy-data availability. The regenerated ledger is now **18
verified_live / 475 implemented / 0 partial / 0 missing** across all 493 rows.

## Final regression reconciliation

- Typecheck: PASS.
- Production build: PASS; `/visits/map` and `/api/routing/eta` compile as
  dynamic production routes.
- The original 286-test monolithic run reached **281 passed / 3 intentional
  skips** before the local Chromium headless process crashed (`SIGSEGV`). The
  two interrupted checks passed 2/2 in a fresh process.
- The same complete inventory was then split into bounded runner shards to
  avoid the Chromium lifetime crash. Shard 1 passed **90/90**. Shard 2 exposed
  and closed two test defects rather than product defects: a loading-skeleton
  race before measuring CD-010/011 targets, and a stale fixed count of ten
  high-risk factories after the live risk migration. Both corrected checks
  pass against current live data. Shard 3 exited successfully with **66 pass /
  1 intentional data-dependent skip / 1 infrastructure-flaky retry**.
- Shard 4 initially encountered a host DNS outage for
  `iiozvqntawxfwbgffzqu.supabase.co`; after resolution recovered, the complete
  shard passed **66/66** with the two intentionally opt-in destructive replays
  skipped because their live evidence had already been captured separately.
- Unique inventory reconciliation across the four bounded shards: **283 passed /
  3 intentional skips / 0 product failures** across all 286 discovered tests.
  The three skips are the pre-existing data-dependent Arabic comparison and the
  two already-certified destructive live replays.
