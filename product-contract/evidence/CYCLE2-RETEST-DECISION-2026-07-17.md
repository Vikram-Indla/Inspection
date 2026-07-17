# Cycle 2 Retest — Production-Readiness Decision

Date: 2026-07-17
Task: TASK-QA-CYCLE2-RETEST-001 (read-only)
Branch: `fix/mvp1-cycle2-production-hardening` @ `0b3e0db` (governance commit atop `8759e81`; app code unchanged)

## Method (sponsor time-box)

Sponsor directed: **act only on an open P0/P1; otherwise record the decision and move forward** (no fresh full retest run). This is therefore a **grounded evidence review** of the existing authoritative Cycle 2 records — NOT an independent re-execution of the regression suite. All facts below are cited from artifacts already in the repo / delivery handoff; no new test run, DB write, or source edit was performed. Working tree confirmed clean (no source/migration edits).

## P0/P1 disposition

No open P0/P1 defect is actionable under this slice. From `DEFECT_FIX_RESULTS.csv`:

| Defect | Severity intent | Status (existing evidence) |
|---|---|---|
| DEF-WF-006 approved-requires-submission trigger | P1 (integrity) | FIXED — deferred constraint trigger + honest report render |
| DEF-DATA-005 plausible-date bounds | P1 (data) | FIXED (app + DB CHECK). 503 legacy bad rows KNOWN, out of scope, untouched |
| DEF-ADM-080 notification-rules admin | P1 | FIXED — screen built end-to-end |
| DEF-PRF-003 profile notification prefs | P2 | FIXED (own-row RLS) |
| DEF-UI-001 / DEF-UX-002 | P2 | FIXED (concrete instances) |
| DEF-UI-004 | P2 | DOES NOT REPRODUCE — recommend close |
| GOLDEN-JOURNEY-P2 release blocker | P1 | FIXED — stale test selectors, not an app bug; 3/3 isolated stable |
| BLK-P2-008 secret redaction | Blocker | PARTIAL — recurrence prevented; **existing exposure + rotation OPEN, separately owned (out of this slice's authority)** |

Regression (authoritative prior run, `FULL_REGRESSION_RESULTS.md`, HEAD `8759e81`): 305 passed / 11 failed of ~324; **2 real regressions found and fixed + re-verified**; remaining 9 = shared-live-staging concurrency flake (pass on isolated re-run), obsolete tests (behaviour changed on main), or an unrelated unmerged-branch gap — **none an un-investigated Cycle 2 defect**. Typecheck + production build clean at HEAD; all 7 Cycle 2 migrations applied live (object-existence probed).

## Open items (NOT P0/P1 blockers I can close here — separately owned)

- **DEC-008** — runtime maps/routing provider: Mapbox has a real HTTP client (`RealMapboxProvider`) but **zero runtime verification, no token** → provider certification pending.
- **BLK-P2-008** — existing secret exposure + credential rotation + any Git-history purge: explicitly OUT of this task's authority.
- **DEC-002** — GIS/geofence numeric governance: separately owned.
- **Live migration-history reconciliation** for the shared project: tracked separately.
- **503 legacy implausible-date `visits` rows** — data-repair decision separately owned; not mutated.

## Decision

**APPLICATION READY — PROVIDER CERTIFICATION PENDING.**

The application layer is production-grade on this branch: all Cycle 2 defects fixed or no-repro, both branch-introduced regressions fixed and re-verified, static gates clean, migrations live, and every regression non-pass has a documented non-defect cause. It is **not** an unconditional PRODUCTION READY because external-provider certification (DEC-008 Mapbox runtime, notification delivery) is unverified/stub-backed and the BLK-P2-008 exposure + rotation remain open under separate ownership.

This decision does **not** authorize merge to `main` or deployment — those stay separately gated.
