# M09 requirement-level write-flow audit — 2026-07-16

## Verdict

**PASS** for the six retained M09 implementation rows:

- MVP1-M09-001 / AC-0449
- MVP1-M09-005 / AC-0453
- MVP1-M09-018 / AC-0466
- MVP1-M09-021 / AC-0469
- MVP1-M09-022 / AC-0470
- MVP1-M09-024 / AC-0472

This verdict upgrades those rows from `partial` to `implemented`. It is not
sponsor runtime acceptance and does not close G11 or G12.

## Contract and slice identity

- Task: `TASK-CD006-011-BACKEND-COMPLETION` under
  `TASK-G11-G12-RELEASE-001`
- Process: P09 Admin Control Plane
- Screens: CD-006 through CD-011 / SCR-ADM-010..060
- Engines: ENG-08 configuration and ENG-12 audit
- Roles: compliance_admin and form_admin maker/checker; Inspector negative
- Source rows: `FABLE_UNDERSTANDING_TRACEABILITY.csv` and
  `FABLE_ACCEPTANCE_UNDERSTANDING.csv`
- Do not touch: immutable published versions, canonical workflow guards,
  provider/privacy boundaries, remote main, generated screenshots and the
  user-owned dependency link

The source contract itself supplies the required vocabulary and behavior. No
provider, policy value, threshold, risk weight, route, geofence, retention rule
or Arabic content was invented.

## Reconciliation result

| Row | Proven implementation |
|---|---|
| M09-001 / AC-0449 | Regulation create/edit/deactivate/view, effective date, attachment metadata and private-storage flow, issuing authority, parentage/version history, maker-checker publication and audit are implemented. |
| M09-005 / AC-0453 | Photo, video, document and comment evidence are authorable; exact allow-list and minimum-count rules are validated in the application and database contract and consumed by runtime blockers. |
| M09-018 / AC-0466 | Required, optional and conditional item modes are authorable, stored in the immutable package definition and enforced at runtime. |
| M09-021 / AC-0469 | Visibility conditions are authorable with accepted grammar, stored in the versioned package and evaluated for show/hide at runtime. |
| M09-022 / AC-0470 | `mandatory_when_visible` is authorable and enforced only while its condition is active. |
| M09-024 / AC-0472 | Scoring has an explicit enabled/disabled setting; disabled items require null weight and exclusion of every response from scoring. |

## Defects found and repaired

1. Direct package-definition writes could bypass the authoring UI and persist
   malformed evidence rules, types, scores or conditions.
2. A direct publish caller could provide valid item rules with a contradictory
   frozen `item_snapshot`, creating validation/runtime divergence.
3. Direct item writes lacked the same evidence and scoring contract enforced by
   the package authoring flow.
4. The canonical audit trigger used an unqualified table name while publish
   routines deliberately run with an empty search path, so valid publication
   could fail inside audit insertion.
5. Operations, its 30-second refresh, national live view and bulk planning
   trusted the provider's first 1,000 rows and could report false empty filters,
   maps and criteria results at real verification volume.
6. One streamed App Router target-size check measured the loading boundary, and
   the relative-time dashboard fixture could expire between release runs.

The forward migration
`supabase/migrations/20260716210000_m09_relationship_contract_hardening.sql`
adds the fail-closed database contract, exact frozen-snapshot validation,
circular-condition rejection, direct-item guards and search-path-safe audit
function. Application actions mirror those rules. Complete provider paging now
fails closed on any page error rather than returning partial business truth.

## Local database proof

The full available migration history was replayed in a temporary PostgreSQL
cluster (the scheduled `pg_cron` migration was excluded because that extension
is unavailable locally). The new migration applied cleanly after only temporary
historical-fixture repair inside that disposable cluster.

`supabase/tests/0032_m09_live_release_probe.sql` then proved, inside one rolled
back transaction:

- maker creates regulation, clause, two items and attachment metadata;
- checker publishes the regulation and package;
- the immutable runtime snapshot matches catalogue and accepted overrides;
- malformed direct item writes are rejected for unknown evidence, invalid
  boolean shape, missing scoring exclusions and negative weight;
- malformed direct package publication is rejected for evidence, boolean,
  numeric, grammar, cycle and snapshot-divergence violations;
- Inspector writes are denied by RLS;
- canonical audit rows are created;
- post-rollback synthetic profiles and packages both equal zero.

## Live object-state proof

Project: `iiozvqntawxfwbgffzqu`.

Preflight showed the old package guard present, no direct-item guard, and the
audit trigger function without the hardened empty-search-path qualification.
The forward migration was applied through the authenticated Management API.
Readback then proved:

- direct-item guard present;
- hardened package guard present;
- audit function configuration is `search_path=""`;
- the audit table reference is schema-qualified;
- authenticated users cannot execute the trigger function directly;
- exactly two M09 contract triggers are installed.

Reapplying the migration produced the same object state, proving idempotency.
The live rollback probe returned:

```text
result=PASS
residual_profile_rows=0
residual_package_rows=0
```

The remote migration-history table remains absent/misaligned. This audit proves
live object state; it does not claim migration-history governance is repaired.

The rollback probe creates attachment metadata and verifies its audit path. It
does not upload a new binary object. The actual private-storage upload,
checksum and compensating-cleanup paths remain supported by existing source and
browser evidence and are not overstated as part of this SQL probe.

## Application and regression proof

- TypeScript validation: PASS
- Optimized production build: PASS
- Focused CD-006..011: 15/15 PASS
- Focused Operations/dashboard scale checks: 15/15 PASS
- Complete CD-021 bulk-planning suite after the full-run defect: 25/25 PASS
- Final enumerated production inventory: **294/294 PASS**
  - authenticated setup: 4/4
  - application checks: 290/290
  - failed/skipped/excluded: 0/0/0

The final clean inventory followed two full-suite iterations. The first exposed
the bulk-planning 1,000-row truncation; the second passed after the complete,
stable-order paging repair.

## Remaining boundaries

The acceptance ledger is now 493 rows: 15 `verified_live`, 466 `implemented`,
12 `partial`, 0 `missing`. The twelve retained partials are the independent
provider/schema/policy/RBAC rows documented in
`CODEX_AUDIT_REMAINING_PARTIALS_2026-07-15.md`.

G11/G12 remain blocked by those upstream boundaries, credential rotation and
historical-secret response, migration-history hardening, region/provider/asset
authority, sponsor runtime acceptance and the absence of a configured
production hosting/deployment/rollback target.
