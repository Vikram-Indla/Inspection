# CD-031 / SCR-WEB-400 · DEC-012 independent R3 wiring audit

Date: 2026-07-16

Task: `TASK-G11-G12-RELEASE-001`

Journey/process: `P12` / Factory 360

Requirements: `MVP1-M07-001..020`; `FND-001/003/007/011`; `RBAC-013`

Engines: `ENG-04/06/07/08/09/12`

Acceptance: `DSG-026`, `DSG-A11Y-001`

Screen: `SCR-WEB-400`

Audit baseline: `codex/g11-g12-integration` at release parent `5812c7f`, plus the remediation identified and verified in this audit
Reviewer: Codex, independent of the 2026-07-15 CD-031 implementation session

## Verdict

**DEC-012 WIRING VERDICT: PASS.** All 20 authoritative map rows (1-18 plus
4b/4c) are either wired as claimed or are truthfully surfaced as
`HANDOFF_BLOCKED_*` without fabricated behavior. The prior missing-map and
package-preflight blockers are closed by the exact R3 artifacts and hash checks
below.

**SLICE-CLOSURE POSITION: BLOCKED_UPSTREAM.** This PASS certifies claim accuracy;
it does not resolve the remaining policy/provider capabilities: the exact
leadership contact-privacy rule, risk drivers/history, evidence timeline,
document viewer/custody, map/boundary/coordinate-conflict authority, and sponsor
runtime acceptance. CD-031 must not be marked closed or sponsor-accepted while
those boundaries remain.

## Authority and package provenance

- DEC-014 is the recorded sponsor override for CD-031 R3's
  `implementation_authorized:false` and `BASELINE_REVERIFY_REQUIRED` flags. It
  explicitly leaves DEC-012 independent audit mandatory.
- Recovered source:
  `/Users/vikramindla/Downloads/Plan Review and Publish (14)/outputs/cd-031-r3/`.
- The authoritative files are now preserved unchanged under
  `outputs/cd-031-r3/`. Exact SHA-256:
  - `WIRING_MAP_CD-031.csv`:
    `d9aa3635f87139e3398f0bda10b34d8b2f87d456b53361368e5c2395f058ce74`
  - `PACKAGE_PREFLIGHT_CD-031.md`:
    `6c948104d01eb81f6332a628a0acb83c731e899677c525c91487c57f4a218309`
  - `IMPLEMENTATION_MANIFEST_CD-031.yaml`:
    `0d787b114f46822bded8872ed612d1fa80ea47bfad9329a36537c63eed1e6105`
- The three preflight hypothesis PNGs were independently hashed at source and
  exactly match the literal R3 preflight record:
  - A: `00d32713425974720eda5ee0abd8fad44f1da33e47008d2675f1f89c4762dafc`
  - B: `cfa8c16a76788abd93cdc798ac6ac4b698724ef9baaa1473ab97c3b727520ceb`
  - C: `66ef0ea8397246d44f867a0a6dc188afbe884ab50cfc28045edd001d5108e23e`
- A, B and C are different; the R3 48 px navigation correction and literal
  preflight hashes are therefore evidenced, not inferred.

## Defects found and remediated before verdict

1. **Missing append-only audit coverage:** the four Factory 360 write tables
   were protected by RLS but absent from the canonical audit-trigger set.
   `20260716120000_cd031_factory360_audit.sql:1-45` now attaches the existing
   `audit_row_change()` function idempotently and fails closed if a same-named
   trigger is not the canonical after-row INSERT/UPDATE/DELETE definition. A pre-application live inventory
   returned zero triggers; post-application readback returned exactly four,
   all canonical.
2. **Representative/factory binding:** the activation action previously updated
   by representative ID while trusting a separate factory ID only for page
   refresh. `actions.ts:145-154` now binds both IDs and fails neutrally if no
   scoped row is updated.
3. **Unproven UI claims:** risk copy claimed recomputation from inputs not read
   by the route, and a missing per-factory geofence override was displayed as if
   the engine default had been read. `page.tsx:229-243` now labels only stored
   source facts and explicitly says the engine default is not read.
4. **Partial-failure safety/accessibility:** section failures now expose real
   reload links and `role=alert`; mutation controls are withheld while their
   source section failed (`page.tsx:347-463`). The loading skeleton now has
   `role=status`, `aria-live=polite`, and `aria-busy=true` (`loading.tsx:1-20`).
5. **Nullable-fact truth:** nullable identity, source, risk, activity and
   coordinate fields now render an explicit unavailable marker rather than a
   blank value or misleading low/success tone (`page.tsx:98-110, 206-243`).

## Row-by-row audit

| Map row | Verdict | Independent evidence |
|---|---|---|
| 1 — factory identity | PASS | RLS-scoped factory read and neutral not-found boundary: `page.tsx:45-55,77-83,206-221`; live Planner dossier: `cd-031-factory-360.spec.ts:118-123`. |
| 2 — provenance/freshness | PASS | Source and exact sync fact render without a computed threshold: `page.tsx:210,224-227`; negative assertion: spec `102-106`. |
| 3 — risk summary/version | PASS | Stored score/band/version only: `page.tsx:45-49,229-234`; nullable states are explicit, not styled low. |
| 4 — risk drivers | BLOCKED_UPSTREAM (truthful) | Explicit unavailable copy; no driver query/recalculation: `page.tsx:234`; spec `42-49,137-142`. |
| 5 — visits/inspection history | PASS | Joined visits/inspection data, newest-first, timeline plus table: `page.tsx:50-55,97,265-297,312-345`; live ordered-list assertion: spec `144-149`. |
| 6 — submission versions | PASS | Version rows are source-joined and rendered per inspection: `page.tsx:51,277-280,332-335`. |
| 7 — violations | PASS | Stored violation codes render from the joined relation: `page.tsx:52,281-283,336`. |
| 8 — corrective actions | PASS | Stored status/owner/due facts render with no invented action: `page.tsx:53,284-286,337`. |
| 9 — reviews | PASS | Only stored non-null decisions render: `page.tsx:54,287-289,338`. |
| 10 — document metadata | PASS | Independent metadata query, validity states, isolated error and safe retry: `page.tsx:56-58,347-381`. |
| 11 — document preview | BLOCKED_UPSTREAM (truthful) | Metadata-only action writes `storage_path:null`; no signed URL/viewer: `actions.ts:11-40`; `page.tsx:374-380`; spec `60-64`. |
| 12 — representative read/add/activation | PASS for mapped runtime; exact privacy role BLOCKED_UPSTREAM | Read/render/actions: `page.tsx:59-61,383-413`; `actions.ts:43-69,134-154`; RLS: `0011_factory360_gis_ksa_seed.sql:30-36`; audit: migration `1-33`; live positive/negative/rollback proof: `0031_cd031_live_release_probe.sql:1-119`. Leadership masking remains explicitly blocked: `page.tsx:85-88,392-403`. |
| 13 — product read/add | PASS | Read/render/action: `page.tsx:62-64,415-439`; `actions.ts:71-104`; RLS: `0017_w3_factory_master_data.sql:43-48`; live Planner success, Inspector denial, audit and rollback: live probe `27-40,47-80,100-119`. |
| 14 — material read/add | PASS | Read/render/action: `page.tsx:65-67,441-463`; `actions.ts:106-132`; RLS: `0017_w3_factory_master_data.sql:43-48`; same live proof as row 13. |
| 15 — map/boundary | BLOCKED_UPSTREAM (truthful) | Coordinates/override facts render; provider and polygon are explicitly unavailable: `page.tsx:237-244`; spec `51-58,137-142`. |
| 16 — coordinate conflict | BLOCKED_UPSTREAM (truthful) | UI explicitly says conflict handling is unavailable; no resolution/provider code exists: `page.tsx:243`; spec `51-58`. |
| 17 — section-specific service failure | PASS | Five reads retain independent errors; four dependent controls are fail-closed; raw provider text is neutralized: `page.tsx:37-76,347-463`; `neutral.ts:1-25`; spec `74-88`. |
| 18 — role/access/RTL/theme/responsive/a11y | PASS for implemented behavior; exact privacy role BLOCKED_UPSTREAM | Neutral RLS ambiguity and field-level masking: `page.tsx:77-88,392-403`; keyboard anchors: `250-252`; 48 px CSS: `astryx.css:909-914`; loading status: `loading.tsx:1-20`; live RTL + light/dark at 1440/1024/412 with zero overflow: spec `125-135,155-176`. |
| 4b — risk-version history | BLOCKED_UPSTREAM (truthful) | Only current `risk_version` is read; an explicit unavailable timeline row is rendered: `page.tsx:48,298-303`; spec `42-49`. |
| 4c — evidence timeline | BLOCKED_UPSTREAM (truthful) | No evidence query exists; explicit unavailable timeline row: `page.tsx:304-308`; spec `42-49`. |

## Cross-cutting contract checks

- **State transitions:** CD-031 does not mutate workflow status; its master-data
  writes have no canonical workflow transition. No direct workflow-state write
  was introduced.
- **RBAC/RLS:** live Planner positive and Inspector negative paths use the actual
  `authenticated` role and seeded personas. No client-only permission claim is
  accepted as enforcement.
- **Audit:** four live trigger definitions resolve to the existing canonical
  audit function. The live transaction observed four insert audits and one
  representative update audit with the Planner actor.
- **Error truth:** raw provider/database detail stays server-side; visible copy
  is neutral and claims no completed write after an error.
- **Immutability/offline:** no submitted inspection version is touched; this
  web master-data surface has no offline claim and introduces no mock adapter.
- **Unavailable integrations:** map, boundary, coordinate conflict, document
  viewer, risk history/drivers and evidence timeline stay explicit blockers.

## Verification evidence

| Check | Result |
|---|---|
| Exact R3 governance-file hashes after import | PASS — match source hashes |
| A/B/C hypothesis PNG source hashes vs preflight | PASS — all three exact and different |
| TypeScript | PASS |
| Optimized production build | PASS |
| Focused authenticated Playwright | **18/18 PASS** = 4 auth setup + 14 CD-031; no skip |
| Complete rebuilt Playwright inventory | **293/293 PASS** = 4 auth setup + 289 application in 12 shards; 0 failed/skipped/excluded |
| Isolated PostgreSQL contract | `CD031_DATABASE_CONTRACT_PASS`; transaction rolled back |
| Live trigger preflight | PASS — zero pre-existing Factory 360 audit triggers, so no blind replay |
| Live migration application | PASS — four canonical triggers installed |
| Hardened migration repeat | PASS local and live — existing canonical triggers accepted idempotently; conflicts fail closed by contract |
| Live Planner/Inspector write/RLS/audit probe | PASS; transaction rolled back |
| Live residual-fixture readback | PASS — `residual_rows=0` |

## Remaining upstream decisions and evidence

1. Resolve the exact representative contact-privacy rule for Leadership and
   multi-role users; do not infer it from the current restrictive placeholder.
2. Provide/approve the map provider, authoritative boundary and coordinate
   conflict path before implementing spatial behavior.
3. Provide risk-driver/history and evidence/document-custody sources before
   implementing those rows.
4. Obtain sponsor runtime acceptance for CD-031 after those governed boundaries
   are dispositioned, or explicitly accept their continued blocked status.

This audit neither self-approves the open policy/provider rows nor closes G11 or
G12.
