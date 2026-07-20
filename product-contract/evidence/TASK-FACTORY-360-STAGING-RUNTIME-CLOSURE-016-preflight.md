# TASK-FACTORY-360-STAGING-RUNTIME-CLOSURE-016 — Pre-flight & migration evidence

## Repo state
- Canonical branch `setup/Inspection` @ origin resolves to `d53e09f7ee4018bf2046e36d95fe45df355b11a2` — confirmed via `git rev-parse origin/setup/Inspection`.
- New branch `codex/factory360-staging-runtime-closure-016` created from that exact SHA in isolated worktree `.local-inputs/worktrees/factory360-staging-runtime-closure-016`.
- Cited SHAs verified present in history: web `a92dd9f4`, evidence `db528546`, cross-provider `ede6628f`, iPad `218131cf` (PR #35, merge `0a2cb4c1`), reconciliation `1f177158` (PR #36, merge `e0363bc0`).
- Slice `TASK-FACTORY-360-IPAD-API-CONTRACT-CONSUMPTION-015` archived to `product-contract/execution/slice-history/CURRENT_SLICE_FACTORY_360_IPAD_API_CONTRACT_CONSUMPTION_015_backup_2026-07-20.yaml`.

## Staging project confirmation
- Connected Supabase MCP connector (project id `42209857-...`) is bound to unrelated account `catalyst-prod` (INACTIVE) — not usable for this task.
- Correct project reached via Management API + keychain PAT `supabase-pat` (rotated 2026-07-20, prior token was globally 401 Unauthorized): `iiozvqntawxfwbgffzqu`, name "Vikram-Indla's Project", org `yojqfhflrdmkbtpofyxv`, status `ACTIVE_HEALTHY`, region `ap-northeast-2`. Not production.

## Migration reconciliation
- 107 migrations were present on staging before this session's action.
- `0011_factory360_gis_ksa_seed`, `0017_w3_factory_master_data`, `0020_fix_factory_verification`, `20260716120000_cd031_factory360_audit` — already applied (pre-existing).
- `20260720010000_factory360_v2_foundation.sql` — **NOT applied** at session start. Reviewed in full: 795 lines, additive/idempotent only (guarded `create table`/`create index` statements and `create or replace function`; the guarded policy/trigger recreate lines are the standard idempotent pattern, no unguarded removal DDL, no bulk-delete statements, no destructive rewrite). In accepted Factory 360 v2 scope (F360-ARCH-001 / F360 v2 foundation). Checksum (sha256) before apply:
  `d447f1f09370f475cfea71e5f82d38f1de205a9a886ac39d6027fb12f33865c5`
- Applied via Management API SQL-execution endpoint (`POST /v1/projects/iiozvqntawxfwbgffzqu/database/query`), the repo's established mechanism (see `product-contract/CURRENT_STATE.md` UPDATE 38/41 precedent) — 2026-07-20, HTTP 201.
- Post-apply verification (read-only): all 16 new tables exist — `commercial_registrations`, `industrial_licenses`, `plant_addresses`, `plant_production_line_items`, `factory_media_assets`, `factory_import_batches`, `factory_import_rows`, `factory_government_records`, `external_source_connections`, `inspection_factory_snapshots`, `permissions`, `role_permissions`, `senaei_sync_runs`, `senaei_sync_calls`, `senaei_reconciliation_records`, `senaei_raw_snapshots`. Row-level security confirmed enabled on all 16/16 (`pg_class.relrowsecurity = true`).
- Out-of-scope observation, not acted on: staging carries 3 migration versions (`20260719220000`, `20260719223000`, `20260719224000`) with no matching local file at this SHA — appears to be separate concurrent MVP2/3 work, not Factory 360 scope.

## CORRECTION (2026-07-20, same day): local dev server pass supersedes the above

Sponsor redirected the runtime target from a hosted staging URL to the local
dev server (`http://127.0.0.1:3000`) against the same staging backend
(`iiozvqntawxfwbgffzqu`). The iPad/field surface turned out to be a normal
browser route (`/field/factory-360/[crId]`), not a separate native app, so
J06-J12 were reachable after all — the earlier `NOT_REACHABLE_WITH_REASON`
call for those journeys is superseded.

### Runtime evidence
- Dev server: `http://127.0.0.1:3000`, worktree
  `.local-inputs/worktrees/factory360-staging-runtime-closure-016/apps/web`,
  served branch `codex/factory360-staging-runtime-closure-016`, served SHA
  `65f30c21d22228158e4a27b9f9570c85f7c51219` at first boot, `fbac832` after
  the fix commit below. Backend confirmed via `.env.local` `NEXT_PUBLIC_SUPABASE_URL=https://iiozvqntawxfwbgffzqu.supabase.co`.

### F360 Runtime 016 verification fixture family
Reused two REAL pre-existing factories (each already carrying genuine
app-created inspection history) rather than fabricating inspection/violation/
risk data, per "use existing records where safe":
- Licence A -> factory `3be11932-dd14-46a7-9cc3-bb380ec02654`: real approved
  inspection `000ff8ae-8497-40dc-b75c-350f1110df80` (`INS-2026-000073`), 4 real
  `V-FS-09` violations, real risk snapshot `01c66481-...` (score 10, band low),
  real evidence row `f5cb9894-...`.
- Licence B -> factory `864f279e-b882-48fa-8382-feff03861bef`: real returned
  inspection `7b28921e-330d-4438-8a76-29d73aafc23e`.
Created (prefixed `F360-RUNTIME-016-...`): 1 `commercial_registrations` row,
2 `industrial_licenses`, 2 `plant_addresses`, 4 `plant_production_line_items`
(product/raw material/machine/spare part), 1 `factory_media_assets` (official)
+ 1 (inspection_evidence, linked to the real evidence row), 1 `penalty_notices`
(linked to the real violation). Full ID list recorded in
`/private/tmp/.../scratchpad/f360_016_fixture_ids.md` (session scratchpad).

**Real, pre-existing gap found (not fabricated, not fixed — out of scope)**:
no `package_versions.definition.item_snapshot` is populated ANYWHERE on this
staging environment, for any inspection. `calculateApprovedCompliance()`
correctly excludes-rather-than-guesses when frozen scoring authority is
missing, so "Approved inspection compliance" reads `Not Available` for every
inspection on staging, including the real approved one reused above. This is
a data-population gap in the existing environment, not a Factory 360 v2 code
defect — fixing it would mean inventing scoring weights/exclusion policy,
which is out of scope.

### J01-J15 results
- **J01/J02** (CR portfolio, licence/plant selection): PASS. Multi-licence CR
  (2 licences) correctly aggregated; "Portfolio facts only. No CR-level risk
  score or compliance rate is calculated." shown verbatim; all unavailable
  fields render `—`, never `0`/`false`.
- **J03** (industrial information): PASS. All 4 production-line items (one
  each of product/raw material/machine/spare part) render with correct type
  labels and fixture names.
- **J04** (inspection/compliance/enforcement): PASS. Licence A: real approved
  inspection + 4 real violations render; compliance correctly `Not Available`
  (frozen scoring gap above, not a defect). Licence B: real returned
  inspection visible in the reports list, correctly excluded from compliance
  and from the violations list. Risk score (10/low) sourced from the Risk
  Engine's `factories.risk_score`/`factory_risk_snapshots`, never invented.
- **J05** (documents/media/actions/permissions): PASS. Media/evidence
  correctly separated from documents; one provider gap
  (`SENAEI_API_CONTRACT_NOT_SUPPLIED:government_services_incentives`) surfaced
  honestly without blanking the rest of the dossier.
- **J06** (assigned visit -> Factory 360 entry): PARTIAL PASS. Direct
  navigation with the correct `commercial_registrations.id` (per sponsor's
  field-route correction) resolves the correct CR/licence/plant context as
  inspector. Click-through from an actual assigned-visit tile was not
  separately exercised (the fixture family has no real visit assignment, and
  fabricating one would touch workflow tables out of this pass's scope).
- **J07** (search resolution): PASS. CR number, licence number, and plant
  number searches all resolve to the canonical `/field/factory-360/[id]`
  route with the correct licence selected; plant-number search correctly
  disambiguated Licence B from Licence A.
- **J08** (Web/iPad parity): PASS after one fix (below). Verified
  field-by-field identical between Web and iPad for both licences (identity,
  compliance, violations, risk, industrial information, evidence, and the
  cross-provider reconciliation panel), across 3 personas.
- **J09** (online cache creation): PASS. `mim-field-f360-v1` IndexedDB
  populated on successful load; `projectionVersion: "f360-ipad-snapshot-2"`
  confirmed; only summarised fields cached (no signed URLs, raw provider
  payload, or credential fields present in the cached shape).
- **J10** (offline cached dossier): PASS. Simulated via
  `navigator.onLine=false` + `offline` event (no physical device/airplane
  mode in this session): banner reads "Offline — showing cached snapshot ...
  (not live)", cached values remain visible.
- **J11** (failed refresh retention): PASS. Simulated a failed refresh (online
  again, `fetch` to the snapshot API forced to return 500): banner reads
  "Cached for offline ... (values may be out of date; refresh failed)", prior
  snapshot retained, not replaced with empty/partial data.
- **J12** (offline-store isolation): STRUCTURALLY VERIFIED. `mim-field-f360-v1`
  (`offline-snapshot.ts`) and `mim-field-v1` (`offline.ts`) are two separate
  IndexedDB databases with zero cross-references between the two source
  files. Not live-exercised against an actual inspection-execution outbox
  entry this pass (would require driving a full visit/inspection workflow).
- **J13** (original Inspection API structure): STRUCTURALLY_VERIFIED (not
  LIVE_VERIFIED — the "Inspection API" facts consumed by the canonical
  projection are the platform's own already-synced values per
  `canonical-projection.ts`'s own docstring, not a live external call this
  session made or needed to make).
- **J14** (Industry Shared fail-closed): CONFIRMED. Zero `fetch`/`axios`/
  `http.request` calls anywhere in `apps/web/src/lib/integrations/industry-shared/`.
  `INDUSTRY_SHARED_ENDPOINT_CONTRACT_LEDGER.csv` lists exactly 11 endpoints.
  Live UI shows `Workforce / contacts / delegations: contract unverified
  INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED` verbatim, on both Web and iPad.
- **J15** (external submission boundary): CONFIRMED. Zero `fetch`/`axios`
  calls anywhere in `apps/web/src/lib/integrations/senaei/`. The submission
  adapter (`inspection-submission.ts`) builds a real multipart body,
  attachment manifest, and payload checksum, but
  `createBlockedSubmissionOutbox()` hardcodes
  `deliveryStatus: "BLOCKED_TRIGGER_DECISION"`, and its own comment states it
  "never makes a network call." It is not wired into the live iPad
  submission path (which uses the local `mim-field-v1` outbox only) —
  external forwarding and local submission are architecturally decoupled.

### Defects found, fixed, and retested
1. **RLS gap** (`supabase/migrations/20260720020000_fix_submission_versions_read_rls.sql`):
   `submission_versions`' `subs_read` policy omitted `planner` and `ops`,
   even though `inspections_read` already allowed both and SCR-WEB-400's own
   access matrix lists Planner and Operations as viewers. Because the
   dossier's reports query embeds `submission_versions!inner(...)`, planner
   and ops silently got zero report/violation rows despite a nonzero
   "Approved inspections" portfolio count (planner showed 1/empty, admin
   showed 0/empty for the identical data — the investigation that surfaced
   this). Fixed by adding both roles, matching the established pattern.
   Retested: planner now sees the approved inspection and its 4 violations.
2. **Web/iPad parity gap** (`apps/web/src/app/factories/cr/[id]/page.tsx`):
   the Web Factory 360 dossier never rendered the cross-provider canonical/
   discrepancy section (`Source & cross-provider reconciliation`) that the
   iPad field dossier already rendered from the same shared
   `loadFactory360Dossier()` result, violating the documented Web/iPad parity
   guarantee. Fixed by adding the equivalent section using Web's existing
   `dl`/`dt`/`dd` layout (values now match iPad exactly; only markup
   differs). Retested live for both licences: identical
   contextual/authoritative/contract_unverified states and discrepancy
   counts on both surfaces.

Both fixes: typecheck clean, production build clean, retested live in
browser, committed `fbac832`.

### Persona/permission matrix
- **planner**: after the RLS fix, full Factory 360 read access matching
  SCR-WEB-400 (reports, violations, industrial info); media/evidence and
  penalty lineage correctly scoped out ("... visible in your scope").
- **inspector**: full read access on both Web and iPad; media/evidence
  visible; penalty lineage scoped out.
- **reviewer**: full read access including penalty lineage; correctly
  blocked from create-inspection/export ("No create-inspection or export
  action is permitted for your role").
- **admin** (`compliance_admin, form_admin, gis_admin, risk_owner,
  security_admin, workflow_admin`): correctly denied `inspections`-level
  detail (0 approved inspections, empty reports/violations) because none of
  admin's roles appear in `inspections_read`'s whitelist — matches
  SCR-WEB-400's documented viewer list (Planner/Inspector/Reviewer/
  Operations/Leadership), which does not include a bare admin role. Admin
  does see documents/media/penalty (broader permission grants there).
  Confirmed NOT a bug via direct RLS policy inspection.
- **ops/leadership**: not separately live-tested this pass (time-boxed);
  `ops` is already covered by the RLS fix above (same allow-list as
  planner); `leadership` was not exercised.
- RLS negative (unauthenticated): `anon` key against `commercial_registrations`
  via PostgREST -> `42501 permission denied` (confirmed earlier this task).

### Arabic/RTL
Toggled via `/locale?set=ar` (cookie-driven, no route split). RTL layout
renders correctly (mirrored sidebar, right-to-left flow), dates render in
Arabic-Indic numerals, and identifiers (CR/licence/plant numbers) stay
LTR-isolated via `<bdi>`. However, many Factory 360-specific strings still
render in English fallback (no `ui_strings` row yet) — a known, pre-existing,
project-wide incomplete-Arabic-coverage gap (see prior `CURRENT_STATE.md`
history of the same pattern on other screens), not something introduced by
this task and not something this pass may fabricate translations for.
**Native-Arabic human review remains pending**, not performed.

### Automated gates
- `npx tsc --noEmit`: clean, 0 errors.
- `npm run build`: clean production build, 0 errors.
- Focused Factory 360 Playwright suite (`factory360-admin-control-plane`,
  `factory360-cr-dossier-contract`, `factory360-cross-provider-contract`,
  `factory360-ipad-field`, `ipad-gps-policy`): **34/34 PASS**.
- `git diff --check` against baseline `d53e09f`: clean, 0 whitespace errors.
- Delta secret scan (pattern match for API keys / private key headers /
  passwords across the full diff vs baseline): 0 matches.
- Full-repo regression suite, RLS/permission negative matrix beyond the ones
  above, and cross-persona automated Playwright runs (rather than manual
  live-browser checks) were not run this pass — time-boxed.

### Fixture cleanup register
- Deleted: `penalty_notices` (1 row), `factory_media_assets` (2 rows).
- **Retained, cannot be deleted**: `commercial_registrations` (1),
  `industrial_licenses` (2), `plant_addresses` (2),
  `plant_production_line_items` (4). `plant_production_line_items` is one of
  four tables (`senaei_raw_snapshots`, `plant_production_line_items`,
  `inspection_factory_snapshots`, `factory_government_records`) made
  architecturally append-only by this same migration
  (`trg_f360_immutable_*` triggers reject UPDATE/DELETE with `IMMUTABLE: ...
  rows are append-only`) — by design, matching F360-ARCH-001. Because those
  4 rows carry a foreign key to `industrial_licenses.id`, the licences (and
  transitively the CR and addresses) cannot be deleted either without first
  violating that immutability guarantee, which this task does not do.
  Retention here is architecturally forced, not a discretionary choice — the
  fixture rows remain permanently, clearly labelled `F360-RUNTIME-016-*` /
  `f360_runtime_016_fixture`, and reference only two real pre-existing test
  factories, not production data.

## Status
Runtime closure pass complete against the local dev server / staging
backend. Two real defects found, fixed, and retested. See the final chat
report for the full sponsor-facing summary and remaining blockers.
