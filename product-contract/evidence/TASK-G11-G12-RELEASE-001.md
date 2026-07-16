# TASK-G11-G12-RELEASE-001 — audited release subset evidence

Date: 2026-07-16
Sponsor authority: `governance/HUMAN_APPROVALS.yaml#G11-G12-live-promotion-release`
Release branch: `codex/g11-g12-integration`
Application release commit: `01e4226` (includes the final RTL comparison repair)
Overall disposition: **AUTHORIZED SUBSET COMPLETE; G11/G12 REMAIN OPEN**

## Scope and provenance

The release candidate reconciles the current application baseline, the
CD-006..011 backend/frontend integration and TASK-G11-REMEDIATION-001 without
absorbing unrelated generated screenshots, logs, stashes or user-owned dirty
files. Important integration points are:

- `e61cf47` — reconciled full MVP1 release-candidate merge;
- `14596f7` — stable full-Chromium headless release harness;
- `01e4226` — 412 px Arabic/RTL Version Comparison containment repair found by
  the first regression iteration and proven by the second.

The release-record commit is promoted by immutable release tag
`g11-g12-release-2026-07-16`; its exact SHA and the matching remote-main SHA are
verified after the commit exists and are reported in the final handoff. This
avoids the impossible and misleading practice of making a Git commit contain
its own hash.

## Live database reconciliation

A read-only object-state probe was completed before any DDL decision. The live
database already contained the versioned arrival-evidence, one-open-review,
CD-006..011 Admin and OTP-authorization objects required by this candidate:

- `evidence.evidence_note` exists and `evidence_link` accepts `arrival`;
- `reviews_one_open_per_version` exists and there were no duplicate open
  reviews;
- item snapshots, regulation attachments, configuration templates, item
  versions, dependency snapshots and inspection-penalty tables exist;
- the regulation/template/violation publish routines and scoped Admin audit
  routine exist;
- OTP-status authorization and trigger-only RPC grants are hardened as
  versioned.

Because the required objects were already present, **no DDL was reapplied**.
The remote database does not expose Supabase migration-history rows, so a blind
`db push` would have been unsafe and was not used. The release records
object-state reconciliation truthfully; reconstructing migration history remains
a G11 process-hardening boundary.

Live negative/runtime proofs:

- `supabase/tests/0028_cd028_live_release_probe.sql` inserted one open review in
  a transaction, proved that a second open review is rejected by the exact
  unique index, then rolled back. Result: PASS; no fixture remained.
- The golden journey queued arrival photo/comment metadata through the real
  visit-linked IndexedDB outbox, replayed it to live storage and read it back.
  Result: one arrival row, visit-linked before inspection, `inspection_id` null,
  exact note persisted. This closes MVP1-M04-045 / AC-0158.

## Defect iterations and complete verification

The first production regression exposed two test-environment issues and one
real product defect:

1. the standalone macOS headless shell intermittently crashed; the suite now
   uses full Chromium headless mode;
2. a stale production bundle was initially exercised after a source-only CSS
   change; the production bundle was rebuilt before retest;
3. the five-column Version Comparison table retained a 596 px RTL min-content
   width at a 412 px viewport. The release repair preserves the semantic table,
   constrains its grid/flex ancestors and uses a wrapping fixed-layout table only
   at the field breakpoint.

Final exact-candidate verification:

- TypeScript validation: PASS;
- optimized production build: PASS;
- authenticated setup: **4/4 PASS** (Planner, Inspector, Reviewer, Admin);
- application inventory: **287/287 PASS** across all 12 shards;
- total current inventory: **291/291 PASS**, zero failed, zero skipped, zero
  excluded;
- corrected CD-029 shard: **25/25 PASS**;
- full planner → inspector → arrival/outbox → submit → return → scoped
  correction → resubmit → approval journey: PASS;
- read-only Admin sweep: Risk, Workflows, Audit, Access and GIS passed directly;
  Localization initially exceeded the sweep script's timing window, then a
  focused authenticated wait completed in 3.1 seconds with 1,000 rows and no
  load error. No mutation round-trip was run, avoiding permanent audit/revision
  noise in the live store;
- `git diff --check`: PASS.

## Security and artifact hygiene

Generated stale builds and Supabase CLI link/temp state are no longer tracked.
The final optimized bundle scan covered 379 files and found:

- 0 files containing known demo-persona passwords;
- 0 database URLs;
- 0 Supabase personal-access-token values;
- 0 Supabase secret-key values;
- one distinct JWT value, exactly the configured public anonymous client key;
  0 non-public JWT values.

Previously committed history still contains superseded generated artifacts and
credential material. Rotation cannot be completed safely until replacement
values and every dependent configured target are available for an atomic
update. Credential rotation therefore remains a G11 blocker; the release does
not print, copy or claim to rotate those values.

## Acceptance reconciliation

The regenerated ledger is **493 rows = 15 verified_live / 460 implemented / 18
partial / 0 missing**. Only MVP1-M04-045 moved from partial to verified_live.
The remaining 18 rows retain their provider, schema, policy, RBAC or
configuration blockers in
`CODEX_AUDIT_REMAINING_PARTIALS_2026-07-15.md`. The integrated CD-006..011 code
and live objects do not silently upgrade the six M09 rows without an independent
requirement-level write-flow audit.

## Promotion, deployment and remaining gates

The sponsor authorized main promotion. The release-record commit is pushed to
`codex/g11-g12-integration`, tagged `g11-g12-release-2026-07-16`, then promoted
to remote `main`; the final handoff reports the verified matching SHA.

No production hosting target or deployment/rollback configuration exists in the
repository or connected environment (`.openai/hosting.json`, Vercel, Netlify,
Fly, container and equivalent target configuration are absent). Selecting a
provider or destination would exceed the approval and invent production
authority. Consequently no deployment was attempted and G12 remains OPEN.

G11 also remains OPEN for credential rotation, region disposition, provider
adapters, migration-history hardening, CD-031 privacy/provider runtime authority,
the 18 acceptance partials, asset/geographic confirmations and outstanding
sponsor runtime acceptance. G10 may close because its exact exit suite is now
291/291 with no skips; neither that result nor main promotion is a G11/G12 PASS.

## 2026-07-16 CD-031 continuation

After release promotion, the exact CD-031 R3 authority package was recovered,
imported and hash-verified. A fresh independent row audit of wiring rows 1–18
plus 4b/4c returned **PASS** and is recorded in
`CODEX_AUDIT_CD-031_R3_2026-07-16.md`. The audit found five correctable defects:
missing canonical audit triggers on all four Factory 360 write tables;
representative activation not constrained to the submitted factory; nullable
facts rendered as implied low/zero values; degraded section actions that stayed
available; and incomplete status/reload semantics. All five were remediated.

The idempotent forward migration
`20260716120000_cd031_factory360_audit.sql` is applied to live object state. A
local rollback contract and a separate authenticated live rollback probe prove
Planner writes across documents, representatives, products and materials,
representative activation, five append-only audit events and Inspector write
denials. The live probe left zero residual rows. Focused browser coverage is
18/18 across source truth, live Planner runtime, English/Arabic RTL, themes and
1440/1024/412 widths. The rebuilt continuation candidate passes the complete
inventory at **293/293** (4 authenticated setup + 289 application checks in 12
shards), with zero failed, skipped or excluded. This evidence removes only the
stale missing-map/preflight
blocker; it does not supply the still-missing privacy/provider decisions, repair
remote migration history, configure deployment or close G11/G12.
