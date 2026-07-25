# CLAUDE-M3-SPONSOR-DECISION-PACKET-011

Read-only sponsor decision packet. No live Claude Design, application code, test, PR, branch, database, or product-contract file modified this session. Synthesizes packets `00`-`15` (`design/claude-design-mvp1/outputs/m3-operations/`), which remain the detailed record; this packet is the bounded sponsor-facing decision layer on top of them.

**Provenance note (corrected this pass):** the canonical repository for this session is `/Users/vikramindla/Developer/Inspection`. `SAQEEL_REQUIREMENT_SCORECARD.yaml` and `ACTIVE_WORKTREE_LEASES.csv` do **not** exist on this repo's `main` or on this session's own branch — confirmed this pass via `git show main:...` (fails, path not found). `/Users/vikramindla/Developer/Inspection-codex-orchestration` is not a separate repository: `git rev-parse --git-common-dir` inside it resolves to `/Users/vikramindla/Developer/Inspection/.git/worktrees/Inspection-codex-orchestration`, confirming it is a `git worktree` of this same Git-common repository, checked out on branch `codex/orchestration-control-plane`. Per `ACTIVE_WORKTREE_LEASES.csv`'s own row, that branch/worktree is the designated `CONTROL_WRITER` for exactly this scorecard/coordination path. So: the scorecard is **authoritative for this data because it is the only checkout of this repository where the file exists and the only branch leased to write it** — it is not yet merged to `main`, and this session's own branch cannot see it directly. Cited transparently as such, not as a separate or competing source of truth.

## 1. Executive verdict

**NOT READY.**

The one defect that triggered this whole workstream — a page view silently mutating GPS-override data — **is genuinely fixed and tested** in an unreviewed draft PR. Everything else the sponsor would need to call M3 Operations complete (real GPS-provenance disclosure, RTL/light-dark proof, the Field-side twin fix, seed data, and any real-browser evidence at all) is either not implemented, not started, or not evidenced. No CI exists on the PR. No human review has occurred. The authoritative 478-row scorecard shows **0 evidence-verified-complete** for this module.

## 2. Sponsor approvals already recognized — execution directions, not open questions

The sponsor has already granted the following; they are recorded here as **approved execution directions**, not re-asked:

- **Governance authority for this workstream** — `TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001`, `APPROVED_IN_PROGRESS`, approved 2026-07-24: "M3-local application files, focused tests, local/runtime evidence, commit, branch push and draft pull request." This covers the map-provenance correction and the A2 Field-side fix — both are within the already-approved M3/field-defect scope, not a new grant to seek.
- **The non-production Supabase project** `iiozvqntawxfwbgffzqu`, sponsor-confirmed non-production — approved as the seeding target.
- **Deterministic reversible seeding through the approved seeder lease** — "dry-run first; never seed displayed KPI totals or invent governed policy values" is the standing scope, already granted, not pending re-approval.
- **Fixing the confirmed bug** — the mutating-GET defect (both the already-fixed Operations side and the still-open Field side) is a confirmed defect under an active, sponsor-approved fix authorization; no further approval is needed to implement the Field-side twin (`12_...`).
- **Using real/logical map data rather than null where the contract permits** — the three-tier map-provenance model itself (Last recorded GPS / Projected from assignment-schedule / Location unavailable) is sponsor-directed (recorded in the scorecard as `M3-DEC-PROJECTED-ROUTE-001`, `RESOLVED_BY_M3-MAP-PROVENANCE-001`) and ready to implement (`13_...`) — this is approved execution, not an open decision.
- Design Revision 3 (WA-DES-033-C3/034-C3) — Codex's own review (`.codex-review/claude-revision-3-review.md`) records "APPROVE FOR SPONSOR CONSENT."

**Remaining narrow, genuinely unresolved contract details** — checked this pass against `product-contract/governance/OPEN_DECISIONS.yaml`/`decision_register.csv` (no DEC-### entry exists for any of the three below; they exist only as `blocking_findings` in the scorecard, not as formally filed open decisions) and against the accepted acceptance rows. These are narrow value/rule decisions, not implementation or lease authorizations, and none of them blocks starting the map-provenance or A2 work:
1. **Submitted Today metric grain** — exact record type (distinct visits vs. inspections vs. submission versions), first-submission-vs-latest-resubmission rule, Riyadh calendar-day boundary. Columns already exist; only this specific value-contract is open. Once set, no schema change is needed to go live.
2. **Active Alerts taxonomy** — what counts as an alert, severity ordering, and the deduplication rule for a record that trips more than one alert source at once.
3. **SPC-CMD-005 vs. system-prompt route/trail conflict** — `SPC-CMD-005` (accepted acceptance matrix, row itself `not_started`) requires no route/path/ETA on the live map; a separate system prompt (`AUTHENTICATED_LIVE_OPERATIONS_MAP.md`) asks for a projected route trail. Current code implements the no-route default, which is the safe disposition until this one rule is picked. This affects only the live-map trail rendering — it does not block the rest of the map-provenance tier-1/2/3 work.

**Operational item, not a sponsor decision:** PR #60 has no reviewer assigned yet — this is a review-assignment action for Codex/PO, not a sponsor approval gate.

## 3. Status table — A1 fix, 5 KPI cards/route guard, map provenance, RTL/light-dark, A2 Field expiry, seed data, auth-fixture isolation, real-browser proof

| Item | Status | Evidence | Open P0/P1 |
|---|---|---|---|
| A1 Operations mutation fix | **AMBER — code done, unreviewed** | `page.tsx` has zero `.rpc()` calls; timestamp-then-query ordering correct; dedicated regression test (`web-admin-m3-route-safety.spec.ts`) asserts two real repeated GETs produce zero network calls to the old RPC | None for this row alone |
| 5 KPI cards + DSG-CMD-020 route guard | **AMBER — code done, unreviewed** | All five cards present (`operations/page.tsx:791-821`); both decision-blocked cards render `"Unavailable — decision required"` (not a number, not zero, not hidden); route guard renders an explicit unauthorized frame on direct-URL access | None for this row alone |
| Map-provenance 3-tier disclosure | **AMBER — sponsor-directed, spec ready, unleased** | Only a single generic label exists today; entities with no coordinate are **silently dropped** from both the map and the accessible list, contradicting the accepted spec's explicit "never silently dropped" requirement. Full corrected, sponsor-directed implementation spec ready (`13_...`), no lease issued yet | **P1 — open, unassigned** |
| RTL / light-dark real evidence | **AMBER — spec ready, not executed** | Only check present is a static "CSS source contains `[dir=\"rtl\"]`" string assertion — not a rendered, toggled proof. Zero dark/light test anywhere in either new spec file. Full 80-target evidence matrix specified (`14_...`), not executed | **P1 — open** |
| A2 Field expiry lease | **GREY — not started** | Same-class defect confirmed still live in `field/[visitId]/page.tsx`; confirmed unowned across every open PR and branch this session. Fix is already sponsor-approved (§2); ready-to-issue lease packet exists (`12_...`, exact diff, exact tests, exact rollback) | Not P0/P1-classified itself (it is the fix); its **absence** perpetuates the same exposure the sponsor's bug report was about, for the Field-facing surface |
| Seed data | **GREY — not started** | No seed write lease issued yet against the already-approved non-production project. Readiness packet exists (`07_...`, Rev 2) but depends on the map-provenance correction landing first (seed cases assume the corrected query exists) | Blocked on map-provenance item above |
| Auth-fixture isolation | **AMBER — architectural cause proven, credential cause unconfirmed** | Proven: one shared `"setup"` Playwright project gates every spec; any one persona's login failure (here, `inspector`) blocks the entire `"e2e"` suite including M3 specs that never authenticate as `inspector`. **Not proven**: why the inspector login itself returns HTTP 400 — no live Auth response body or user-state check was captured by any read-only session. A test-isolation fix (split into per-persona setup projects) does not require knowing the root cause and is unleased | Blocks producing the RTL/light-dark evidence above; not P0/P1 in itself |
| Real-browser proof (overall) | **AMBER — sponsor-supplied observations exist, none certifying** | `.codex-review/m3-baseline-test-results.md` records a text pass/fail log from a dependency-bypassed diagnostic run only — explicitly not certification evidence. Zero accepted/certifying browser-evidence screenshots or DOM-verified evidence are referenced in the reviewed M3 evidence record (see §7 for the precise wording and what this does and does not claim) | 2 P1s above remain the blocking cause |

## 4. Exact branch/PR/file ownership boundary for each next lease

| Lease | Branch | Base | Files | Explicitly excluded |
|---|---|---|---|---|
| Map-provenance correction | Dependent branch forked from `c48f71cc` (PR #60's head) — **not** bare `main`, since the correction target files only exist in corrected shape on that branch. Do not amend `c48f71cc` directly; PR #60 is under an active `REVIEW_ONLY` lock (`ACTIVE_WORKTREE_LEASES.csv`) | `codex/m3-operations-reconciliation@c48f71cc` | `operations/page.tsx`, `OperationsMapWorkspace.tsx`, `operations/live/page.tsx`, `operations/live/types.ts`, `operations/live/LiveOps.tsx`, `operations/live/LiveMapInner.tsx`, plus new/extended M3 spec coverage | `GeoMap.tsx` (shared component, zero diff), any Supabase migration/RLS/RPC/schema, any `product-contract/**` file, `OpsMap.tsx`'s `OpsPin` type |
| A2 Field expiry fix | `codex/m3-field-expiry-fix` (new, confirmed unused name) | `main@9d8c414258a5e04244fdf9ce350e5f25f952dfc1` (same tip PR #60 targets — confirmed via `git ls-remote`) | `field/[visitId]/page.tsx`, `ipad-gps-policy.spec.ts` | `Startup.tsx`, any API route, any RPC/migration, any Supabase schema/policy/data, all of `operations/**` and `operations/live/**`, any shared shell component, every file already in PR #60's 23-file list |
| RTL/light-dark evidence capture | Execution against whichever branch holds the certifying, unblocked test run (PR #60's branch, or its map-provenance dependent branch once merged) | — | Test execution only, no source diff required beyond the auth-fixture isolation fix below | — |
| Auth-fixture per-persona isolation | `apps/web/e2e/auth.setup.ts`, `apps/web/playwright.config.ts` — test infrastructure, unleased by any current branch | current `main` tip | Split single `"setup"` project into per-persona projects; scope M3's own test project to `ops`+`planner` only (confirmed: M3 Operations specs never authenticate as `inspector`) | Any application source file |
| Seed data | Dedicated Supabase seeder agent, non-production project `iiozvqntawxfwbgffzqu` per prior slice convention | — | Deterministic reversible source-record seeding only | Displayed KPI totals, any governed policy value |

## 5. Backend/API/Supabase impact

**No new backend work is required for any item above.** Confirmed this session and in prior packets:
- `geo_events` (real telemetry table), `visits.planner_lat/lng`, `factories.official_lat/lng` — all already exist, already RLS-scoped, already readable. The map-provenance fix is a **read-query and rendering correction only**, using columns and tables that already exist in production migrations.
- The A1 fix already removed the only backend-mutating call from a page read (`sb.rpc("expire_stale_geo_override_requests")`); `decide_geo_override` remains the sole race-safe authority, unchanged.
- The A2 fix is the identical pattern applied to one more file — no RPC, migration, or schema change.
- Seed data is a data-only operation against an already-approved non-production project — no schema change.
- Auth-fixture isolation is a Playwright config change — zero backend impact.

## 6. Mandatory tests and negative paths

- **A1 (done):** zero `.rpc()` calls confirmed by direct code read; two-repeated-GET zero-network-call assertion in `web-admin-m3-route-safety.spec.ts`.
- **Map-provenance (spec'd, not built):** 12 test cases in `13_...` §9 — positive tier 1/2/3, tier-1 exclusion of `override`/`deviation`-kind rows, no-route-regression, two distinct RLS cases (unauthorized route actor vs. authorized-but-zero-visible-rows), the shared `geoRes` query non-regression (must not affect the existing `latestGeofence` monitoring badge), the `OperationsMapEntry` type-boundary compile check, race/consistency across co-located visits, error isolation (a failed fetch must never be misread as "confirmed no data"), and a query-plan regression check (no new query added to `/operations`, exactly one new bounded query on `/operations/live`).
- **A2 (spec'd, not built):** 5 test cases in `12_...` §6 — positive pending-unaffected, negative no-mutation-on-read, history-preservation for non-pending rows, the real `decide_geo_override` race path, repeated-GET zero-write.
- **RTL/light-dark (spec'd, not built):** 20 combinations (5 viewports × EN/AR × light/dark) per surface, driven through the real `ThemeToggle`/`localStorage["saqeel-theme"]` mechanism and the real `/locale` cookie mechanism — explicitly **not** a CSS-class injection shortcut.
- **Cross-cutting, every state:** keyboard-only navigation with visible focus ring, `prefers-reduced-motion`, WCAG AA contrast in both themes, no text clipping at any of the 5 widths, no shell-chrome overlap at 320/390/412, no horizontal page scroll.

## 7. Browser proof matrix and sponsor-visible screenshots still owed

**Precise claim:** zero accepted/certifying browser-evidence screenshots or DOM-verified evidence are referenced in the reviewed M3 evidence record (PR #60's files, `.codex-review/*`, and packets `00`-`15`). This does not erase or dispute that the sponsor has supplied screenshots directly in conversation — those are real, sponsor-supplied visual observations. What is missing is a **certifying** capture: one taken against a reviewed, reproducible run (real toggled theme/locale state, named viewport, tied to a specific commit/branch) and filed as accepted acceptance evidence per the matrix below. Sponsor-supplied conversational screenshots have not been reconciled into that record and cannot substitute for it without that reconciliation. The full matrix (`14_...`) specifies what a certifying capture requires:
- 5 viewports (1200/1024/412/390/320) × 2 directions (EN/AR) × 2 themes (light/dark) = 20 combinations × 4 surfaces (`/operations` Map, `/operations` National Performance, `/operations/live` normal, `/operations/live` wallboard) = **80 responsive targets**, before layering the 3 provenance-tier states on the two `/operations/live`-family targets.
- A separate 1440×900 (`/operations`) and 1200×800 (`/operations/live`) **design-parity reference capture**, diffed against the accepted `WA-DES-033-C3`/`034-C3` rendered revisions, required for `WA-M3-AC-003`.
- A regression pass on adjacent routes (`/dashboard`, `/factories`, `/visits`) confirming no shared-shell/GeoMap regression, required for `WA-M3-AC-005`.
- **None of this can be captured today** because (a) the map-provenance tiers don't exist to screenshot, and (b) the auth-fixture architectural blast radius currently fails the full dependency chain before any M3 spec runs (though the M3-specific fix — narrowing to `ops`/`planner` personas only — does not require the inspector credential root cause to be resolved first).

## 8. Merge/PR recommendation

**Do not merge PR #60 yet.** Confirmed fresh this session (`gh pr view 60`): `OPEN`, `DRAFT`, `MERGEABLE`/`mergeStateStatus: CLEAN`, **zero reviews**, **zero CI checks configured**. The A1 fix inside it is correct and tested, but:
1. No human has reviewed it.
2. It has no CI gate — evidence rests entirely on a manually-run local log.
3. Merging it now would ship the five KPI cards and route guard (both fine) while leaving the map's silent-drop behavior in production, which is the same class of defect (silently discarding data the operator needs to see) as the bug that started this workstream, just on a different surface.

**Recommended path:** keep PR #60 in review, land the map-provenance correction as a dependent branch on top of it (§4), get both reviewed together, add the certifying Playwright command as a required CI check before merge, then merge as one reviewed unit — rather than merging A1/KPI-cards now and the provenance fix later as a second pass on already-shipped code.

## 9. Next 2-hour work order — parallel, non-overlapping lanes

All four lanes below have zero file overlap (confirmed against `ACTIVE_WORKTREE_LEASES.csv` and each packet's own exclusion list) and can run concurrently:

| Lane | Owner | Task | Blocked by |
|---|---|---|---|
| 1 | Codex | Implement map-provenance correction (`13_...`, already sponsor-directed) on a dependent branch off `c48f71cc` | Nothing for tiers 1-3 generally; only the live-map **trail rendering specifically** waits on the narrow SPC-CMD-005 ruling (item 4) |
| 2 | Codex | Issue and implement the A2 Field expiry lease (`12_...`, already sponsor-approved as part of the confirmed-bug fix authorization) on `codex/m3-field-expiry-fix` | Nothing — ready to start immediately |
| 3 | Codex/test-infra owner | Split `auth.setup.ts`/`playwright.config.ts` into per-persona setup projects, scope M3's test project to `ops`+`planner` | Nothing — does not require the inspector credential root cause to be known |
| 4 | Product Owner / sponsor | Rule on the three remaining narrow contract details: Submitted Today metric grain, Active Alerts taxonomy, SPC-CMD-005 route/no-route conflict | Nothing — these are the sponsor's own decisions, not code-blocked |

**Sequenced after those four converge:** execute the RTL/light-dark/provenance screenshot matrix (`14_...`) once Lane 1 (provenance code) and Lane 3 (auth-fixture isolation) both land; only then can `WA-M3-AC-003/004` evidence actually be produced.

## 10. Plain-language scorecard statement

The authoritative scorecard (`SAQEEL_REQUIREMENT_SCORECARD.yaml`, re-read fresh this pass from the `codex/orchestration-control-plane` worktree of this same repository — the only checkout where the file currently exists, see provenance note above — `last_reconciled_utc: 2026-07-24T23:00:00Z`, unchanged) records, for the whole 478-row MVP1 baseline:

**0 rows evidence-verified-complete. 39 rows in active evaluation (CR-410..429, CR-430..448). 0.0% completion. Confidence: PROVISIONAL.**

This is provisional **because it has not changed since the last reconciliation** — it is not a claim that nothing has happened; real implementation and test work exists on unreviewed branches. But per the scorecard's own stated rule, **no row counts as complete until the full completion gate is reconciled per requirement**, and no board, packet, or session — including this one — may report a different number without that reconciliation actually having occurred. Anyone quoting "M3 Operations is X% done" today is quoting a number that does not exist in the authoritative source.

## 11. GREEN discipline

Status vocabulary is GREY / AMBER / GREEN only, per `15_CLAUDE-M3-DESIGN-STATUS-RECONCILIATION-010.md`'s established convention — no competing vocabulary is used in this packet. No row in §3 is marked GREEN. A1 fix and 5 KPI cards + route guard are AMBER because the code is genuinely correct and tested but unreviewed and uncertified by CI — real progress, not yet acceptance-complete. Map-provenance, RTL/light-dark evidence, auth-fixture isolation, and overall real-browser proof are AMBER — sponsor-directed/spec'd and in progress but not yet implemented, executed, or certified. A2 Field expiry and seed data are GREY — genuinely not started, though both are already sponsor-approved to proceed (§2) and blocked only on lease issuance, not on further approval.

## 12. Disposition

No live Claude Design, application code, tests, PRs, branches, database, or product-contract file modified. Read-only decision packet only, per this session's single authorized task (`CLAUDE-M3-SPONSOR-DECISION-PACKET-011`). Stop here — no follow-on task authorized until the orchestrator assigns one.
