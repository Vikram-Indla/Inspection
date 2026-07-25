# CLAUDE-M3-PR60-INDEPENDENT-READINESS-006

Read-only independent review. No code, PR, branch, live design, or product-contract file modified. Bootstrap re-confirmed this session: `SAQEEL_OPERATING_SYSTEM.md` v2.0 (sponsor-accepted 2026-07-25) and `SAQEEL_REQUIREMENT_SCORECARD.yaml` re-read fresh, not from chat memory. Canonical repo confirmed: `/Users/vikramindla/Developer/Inspection`, this session's worktree `catalyst/m3-operations-design-0f2c11 @ bb7836c2`.

## Scope

PR #60 (`codex/m3-operations-reconciliation@c48f71cc` → `main@9d8c4142`), routes `/operations`+`/operations/live`, CR-430..448, WA-DES-033-C3/034-C3, WA-M3-AC-001..006.

## Findings, classified P0/P1/P2/P3

### Confirmed correct (no finding)
- **A1 no-mutation fix**: zero `.rpc(` calls in `operations/page.tsx`; timestamp declared before the query; `.gt("expires_at", nowIso)` filter present; `decide_geo_override` cited as the sole race authority in-code and covered by a dedicated regression test (`web-admin-m3-route-safety.spec.ts`) that verifies zero network calls to the old RPC across two real repeated GETs.
- **Five KPI cards**: `Active Visits`, `On the Way`, `Executing`, `Submitted Today`, `Active Alerts` all present (`operations/page.tsx:791-821`); both decision-blocked cards render exactly `"Unavailable — decision required"`, matching the accepted Revision 3 package.
- **DSG-CMD-020 route guard**: `buildShellNavigation(routeRoleKeys)` + `operationsDestination.enabled` check present on both `/operations` and `/operations/live`, unauthorized frame rendered otherwise.
- **No route/ETA/path drawn on the live map**: confirmed by grep — zero `path`/`polyline`/`animate` rendering in `LiveMapInner.tsx`; the per-inspector "fan out" hash is a static-position jitter helper, not a route animation.

### P1 — blocks CR-430..448 certification per the scorecard's own criteria

1. **Three-tier map provenance not implemented.** `SAQEEL_REQUIREMENT_SCORECARD.yaml` records `M3-DEC-PROJECTED-ROUTE-001` as `RESOLVED_BY_M3-MAP-PROVENANCE-001` (my own `05_CLAUDE-M3-MAP-DESIGN-UPDATE-001` packet) — the accepted resolution requires three distinct dispositions (real `geo_events`-backed "Last recorded GPS," schedule-projected "Projected from assignment/schedule," and an honest "Location unavailable" for entities with neither). PR #60's `operations/live/page.tsx` and `types.ts` read **only `visits`+`factories`, never `geo_events`** — every position is schedule-projected, none are real-telemetry-backed, and the single generic label `"Projected route — not live GPS"` (line 149) is used uniformly instead of the three distinct labels. **More materially: entities with a missing `official_lat`/`official_lng` are filtered out of the query entirely (`.not("official_lat", "is", null)`, line 71-72, and again skipped at line 112) — they do not stay visible in an operational list with an honest missing-data reason, they are silently dropped.** This directly contradicts the accepted spec's explicit requirement ("the entity stays visible in the operational list — never silently dropped").
2. **RTL/light-dark real evidence gap for WA-M3-AC-004.** The only RTL check in `web-admin-m3-operations.spec.ts` is a static string assertion (`expect(liveCssSource).toContain('[dir="rtl"]')`) — a CSS-source-contains check, not a rendered/toggled RTL browser proof. **No dark/light theme test exists anywhere in either new spec file** (confirmed by grep, zero hits for "dark"/"light"/"theme"). WA-M3-AC-004 explicitly requires EN/LTR and AR/RTL passes at named viewports plus light/dark — neither is demonstrated with real rendered evidence.

### P2 — worth fixing, does not by itself block this PR's own narrow scope
- The map-provenance gap above (finding 1) is filed as P1 for CR-430..448 overall certification; narrowly, PR #60 never claimed to implement `05_...`'s newer three-tier model (it predates that packet's sponsor direction in this session's timeline) — Codex may reasonably treat this as a known, tracked follow-up rather than a defect introduced by this PR, but it cannot be certified as *done* either way.

### P3 — none identified this pass.

## Real-browser proof status: NOT READY

`.codex-review/m3-baseline-test-results.md` (read this session): the full dependency-chain Playwright run hit the **already-known, unrelated** inspector-authentication-fixture HTTP 400 defect, blocking 19 dependent test cases; a dependency-bypassed diagnostic run was used instead as a partial baseline. `gh pr checks 60` reports **no CI configured on this branch at all** — evidence currently rests on a manually-run local log, not an automated, repeatable gate. **Real-browser proof for WA-M3-AC-003 (visual parity) and WA-M3-AC-004 (RTL/responsive/a11y) is not demonstrated as complete** — the spec files contain real `{ page }` Playwright interactions (not just string assertions) for several cases, but their actual pass/fail execution status against a live, unblocked browser session is not evidenced in what this session could read.

## Sponsor-language report

**Business functionality usable now:** None yet on the live product — this is an unreviewed, unmerged draft PR (#60, DRAFT state, no CI, no reviews). Operators cannot use anything from this work today; it exists as a reviewed-by-me-only candidate change.

**Requirement rows out of 478 — NOT RECONCILED, per the authoritative scorecard (`SAQEEL_REQUIREMENT_SCORECARD.yaml`, last reconciled 2026-07-24T23:00:00Z, read fresh this session, not from memory):**
- Evidence-verified complete: **0**
- Active evaluation: **39** (CR-410..429 + CR-430..448)
- Completion percentage: **0.0%**, confidence: **PROVISIONAL**
- I am not computing or asserting any other number — the scorecard's own reason is explicit: *"all rows are recorded as BASELINED_NOT_IMPLEMENTED while newer implementation evidence exists in separate branches... no row is counted complete until the full completion gate is reconciled per requirement."* This review's findings should feed that reconciliation, not substitute for it.

**Unresolved P0/P1 count: 2 (both P1, zero P0).** Per `SAQEEL_OPERATING_SYSTEM.md`'s own rule, no module advances with an unresolved P0/P1.

**Readiness decision: NOT READY to certify or merge.** The mutating-GET defect this whole thread started from is genuinely fixed and tested — that specific business risk (silent data mutation from a page view) is resolved in this PR. But the newer sponsor-directed map-provenance model and full RTL/light-dark evidence are not yet met, and real-browser proof is incomplete due to a known, separate test-infrastructure defect.

**Blockers:**
1. Map provenance three-tier model (P1) — needs implementation against `05_CLAUDE-M3-MAP-DESIGN-UPDATE-001`.
2. RTL/light-dark real rendered evidence (P1) — needs actual browser screenshots/DOM assertions, not string-contains checks.
3. Inspector-auth-fixture HTTP 400 (pre-existing, unrelated, tracked separately) — blocks a clean full-suite run for final sign-off regardless of this PR's own content.

**Queued task: `CLAUDE-M3-A2-FIELD-LEASE-007`** — the Field-side (`field/[visitId]/page.tsx`) expiry fix, independent of and non-conflicting with this PR, per the ownership reconciliation already completed (`10_...`).

## Disposition

No code, PR, branch, live design, or product-contract file modified. Review packet only, in this session's owned design-output lane.
