# Web/Admin Phase 1 Implementation Handoff

## Decision requested

Approve or reject `CC-WEB-ADMIN-PHASE1-001`. Approval authorizes F0 source
implementation only. It does not authorize remote DDL, deployment, shared-data
mutation, provider enablement, merge to `main`, push, or M1–M11 implementation.

## Pinned baseline

- Repository baseline: `6fc27d3f654a79d2aa6ef659b0879b35b9eb5b6d`
- Planning branch: `revamp`
- Requirements: 478/478 uniquely dispositioned
- Current page routes: 76 total; 71 Phase 1 and five deferred `/field/**`
- Current APIs: three inventoried; field snapshot deferred, ETA and shell search
  assessed as shared services
- Designs: 46 supplied files, 45 unique payloads; Admin Lookups Copy is an
  identical alias
- Delivery: F0 plus M1–M11

## Scope lock

Phase 1 covers Web/Admin processes `G2-P00..P03`, `P06B`, and `P10..P12`, plus
separately contracted shared backend dependencies. Pure Inspector iPad,
`/field/**`, field PWA, offline client/outbox UX, and iPad certification are
Phase 2. Deferred rows remain deferred even when they reveal shared backend
needs.

The completed target-state blueprint is reusable analysis. Its iPad-inclusive
language is narrowed by this scope lock. The supplied Web/Admin package resolves
the blueprint's missing-design-input question, but does not resolve provider,
policy, provenance, or runtime-acceptance decisions.

## Execution order and ownership

F0 owns tokens/components, authenticated shell, navigation, breadcrumbs,
shared states, theme, i18n/RTL, reference renderer, visual harness, global CSS,
common components, and shared migrations. F0 runs alone and must be certified.
Afterward, dependency-ready M1–M11 may run in parallel using the exact ownership
and collision fields in `PACKAGE_MANIFEST.csv`.

Every package must preserve RLS/RBAC, governed transitions, immutable submitted
versions, maker-checker, audit, versioning, and fail-closed providers. Deep links
remain aliases or redirects unless no valid destination exists. A package may
consume F0 files but cannot edit them without an F0 follow-up.

Each implemented route must first have a complete row in
`CURRENT_TO_TARGET_MIGRATION.csv`. Direct replacement is preferred when parity,
certification, and rollback are unambiguous. When in doubt, use a
server-evaluated feature flag or guarded preview. The current implementation
must not be deleted and remains available until stabilization and explicit
Product Owner removal approval.

## Verification gate

Planning is valid only when the committed validator proves 478 requirements,
71 Phase 1 routes, five deferred field routes, 46/45 design status, complete
package ownership, and absence of binary sources/evidence. Implementation gates
are defined in each package prompt and include typecheck, production build,
focused positive/negative browser tests, accessibility/keyboard checks,
Arabic RTL and English LTR, light/dark, responsive overflow, permission/RLS
negatives, and protected regression.

The 478-row tree has 100% traceability and preservation coverage. That is not a
claim that all 478 rows are implemented in Phase 1: the baseline currently
contains 235 Phase 1 implementation rows, 238 Phase 2-deferred rows, and five
open-decision rows. No completion claim may collapse these statuses.

Reference capture uses each design's declared `$preview` viewport, or the
approved 1440×900 fallback. Also verify 1024×768, narrow 390/412, and 320-pixel
reflow where responsive. Default visual acceptance is zero unapproved difference
in the pinned Chromium/font environment; every pixel or behavioral difference
needs a delta record and Product Owner approval. Binary evidence belongs under
`INSPECTION_DOCS_ROOT`; Git stores manifests and textual results only.

## Rollback and merge

Merge order is F0, dependency-ready modules, then cross-module regression.
Rollback is package-level branch reversion. Database remediation is additive
and forward-only, never destructive rollback. No package may merge or deploy
without separate approval.

## Product Owner blockers

See `product-contract/web-admin-phase1/OPEN_DECISIONS_AND_BLOCKERS.yaml`.
Roles, terminal status, risk, GIS/geofence values, SLA calendar, video,
Industry Shared, external submission, notification delivery, native-Arabic
signoff, asset provenance, and G11 performance acceptance remain open and fail
closed.
