# CLAUDE-M3-OVERRIDE-EXPIRY-IMPLEMENTATION-PREFLIGHT-004

Read-only preparation. No product code, tests, migrations, or live Claude Design modified in this branch/worktree this session.

## 0. Critical finding first: Part A1 is already implemented on an existing branch — real ownership conflict

Before recommending a base commit, checked the two branches already cited as LANE-01-M3-CERTIFICATION inputs (`BATCH-WEB-ADMIN-ORCHESTRATION-001.yaml`): `codex/m3-operations-reconciliation@c48f71cc` and `codex/shared-brand-regression@2f795773`.

**`codex/m3-operations-reconciliation` (c48f71cc) already contains, on `apps/web/src/app/(app)/operations/page.tsx`:**
```ts
// A page GET is read-only. Use one request-start timestamp to exclude elapsed
// requests from the actionable queue without materializing workflow state.
// decide_geo_override remains the database-authoritative race guard.
const now = Date.now();
const nowIso = new Date(now).toISOString();
// ...
sb.from("geo_override_requests").select(...).eq("status", "pending").gt("expires_at", nowIso).order(...)
```
Confirmed by `git show c48f71cc:...page.tsx | grep -c "\.rpc("` → **0** — the mutating `expire_stale_geo_override_requests` RPC call is already fully removed on this branch, and the fix reuses a single `now`/`nowIso` declared before the `Promise.all` (a cleaner variant of my Part A1 proposal — one shared timestamp instead of a dedicated second one). This branch's `operations/page.tsx` is a 479-line diff overall — it also already implements DSG-CMD-020 direct-route authorization (via `buildShellNavigation`/`operationsDestination.enabled`, matching `01_OPERATIONS_CENTER_CORRECTION_SPEC.md` §8) and a `view` param that looks like the map/performance two-view split (`01_...` §1).

**This same branch does NOT touch `apps/web/src/app/(app)/field/`** (confirmed: `git diff ...c48f71cc --stat -- apps/web/src/app/(app)/field/` → empty). Part A2 (the field visit page) is genuinely unimplemented anywhere.

**Consequence — this is a real ownership conflict, not a clean slate:** issuing a fresh isolated lease that re-implements Part A1 on `operations/page.tsx` risks either (a) silently duplicating work already done on `c48f71cc`, or (b) actively conflicting with that branch's other 479 lines of unrelated changes when it eventually merges. **Recommendation: Codex confirms whether `codex/m3-operations-reconciliation` is the intended landing branch for M3 Operations (it is cited as a LANE-01-M3-CERTIFICATION input, suggesting yes).** If confirmed:
- **Part A1 needs no new lease** — it is done, on that branch, and should simply be verified against `08_CLAUDE-M3-SEED-ACCEPTANCE-PLAN.md`'s unauthorized/collision/transition-rejection checks when that branch is reviewed.
- **This preflight packet's scope narrows to Part A2 only** (field page), applied either directly on `codex/m3-operations-reconciliation` (extending it) or on a fresh branch based on it — not on stale `setup/Inspection`, to avoid the same file later conflicting on merge.

The remainder of this packet is written to cover **both** possibilities explicitly (A1+A2 fresh, or A2-only extending the existing branch) so Codex can pick without a second preflight round.

## 1. Base commit — exact, with the known main/setup divergence flagged

- `origin/setup/Inspection` = `3323a8ef3d788c1c157a9bf0d63e32a3d9334e42` (canonical branch per `AGENTS.md`/`CLAUDE.md`).
- `origin/main` = `9d8c414258a5e04244fdf9ce350e5f25f952dfc1` — confirmed `setup/Inspection` is an ancestor of `main` (`git merge-base --is-ancestor` → true): `main` is currently **ahead** of `setup/Inspection` (the M1 Dashboard promotion landed on `main` directly via the GitHub-merge-endpoint fallback recorded in `CURRENT_STATE.md` UPDATE 129, bypassing the normal PR path). This is a **pre-existing, already-documented divergence**, not something this packet causes — `CLAUDE.md` calls any main/setup difference "a bug to reconcile immediately, not a normal state," so it is worth Codex separately fast-forwarding `setup/Inspection` to `main`'s tip, but that reconciliation is out of scope here.
- Diffed the two SHAs directly (`git diff 3323a8ef...9d8c4142 --stat`): the M1 promotion touches only Dashboard files, `saqeel-components-legacy.css`, and `GeoMap.tsx` (14 lines — a `ready`/`data-map-ready` state addition). **`operations/page.tsx` only imports the `GeoTone` *type* from `GeoMap.tsx`** (confirmed by grep), not the changed runtime code — **zero functional overlap** with this packet's target files.
- **Recommendation:** base the new work on **`codex/m3-operations-reconciliation @ c48f71cc`** (not bare `setup/Inspection`), since that branch already contains the Part A1 change this packet would otherwise duplicate, and basing there means Part A2's diff applies cleanly on top of the real current state of `operations/page.tsx` rather than reintroducing a since-fixed defect pattern into a merge conflict. If Codex instead wants this fully independent of that branch's fate, base on `setup/Inspection @ 3323a8ef` and expect a real merge/rebase conflict on `operations/page.tsx` later — flagged, not hidden.

## 2. Isolated worktree / branch naming — collision-checked against every existing branch

Enumerated all local + remote branches this session (`git branch -a`, `git ls-remote --heads origin`). Existing names that must NOT be reused: `codex/m3-operations-reconciliation`, `codex/shared-brand-regression`, `codex/orchestration-control-plane`, `codex/m1-dashboard-reconciliation`, `catalyst/m3-operations-design-0f2c11` (this design worktree), `catalyst/m3-operations-design-18299a`, `codex/m3-browser-preview`, `codex/f0-shell-authority-correction`, `codex/planning-m2-saqeel-correction`, `codex/admin-localization-lookups`, `codex/saqeel-web-admin-convergence-discovery`, `design-sync/discovery`, `docs/saqeel-inspector-inventory`, `feat/revamp-wa-p1-m2-batch-001`, `backup/ipad-field-pre-rebase`, `main`.

**Recommended name:** `codex/m3-override-expiry-fix` (new worktree at a fresh path, e.g. `/Users/vikramindla/Developer/Inspection-codex-override-expiry`, mirroring the existing `Inspection-codex-m1-dashboard` convention) — confirmed unused in the enumeration above.

## 3. Exact owned files (unchanged from `06_CLAUDE-M3-OVERRIDE-EXPIRY-FIX-001.md`, re-confirmed against the live branch this session)

| File | Status against `c48f71cc` | Change needed |
|---|---|---|
| `apps/web/src/app/(app)/operations/page.tsx` | **Already fixed on `c48f71cc`** — no change needed if basing there; if basing on bare `setup/Inspection`, apply Part A1 exactly as specified in `06_...` §"Exact files and change" A1 | None (if based on `c48f71cc`) / A1 patch (if based on `setup/Inspection`) |
| `apps/web/src/app/(app)/field/[visitId]/page.tsx` | Untouched by `c48f71cc` — Part A2 still needed regardless of base | Apply A2 exactly as specified in `06_...` |
| `apps/web/src/app/(app)/field/[visitId]/Startup.tsx` | Untouched, confirmed no change needed (traced in `06_...`) | **No change** |
| `apps/web/e2e/ipad-gps-policy.spec.ts` | 74-line unit-style logic spec (confirmed this session: 3 `test()` blocks, no browser/page-load assertions currently) — does not yet cover the mutating-GET behavior at all | Add the Part A2 negative tests from `08_CLAUDE-M3-SEED-ACCEPTANCE-PLAN.md` §5 (terminal-history regression) plus the unauthorized/transition-rejection cases already named there |

**Do-not-touch files** (explicit, per `PACKAGE_MANIFEST.csv` M3 row and this packet's own bounded scope): `/field/**` other than the one named page, `apps/web/src/lib/offline.ts`, any G11 performance-branch file, `main`, `setup/Inspection` directly, any Claude Design project, any other file in `codex/m3-operations-reconciliation`'s existing 479-line diff beyond the one already-fixed block confirmed in §0.

## 4. Imports / types — re-traced this session, no new import needed

`field/[visitId]/page.tsx`'s only relevant import is `Startup, { type StartupStrings } from "./Startup"` (confirmed, line 6) — the `InitialOverride` type lives inside `Startup.tsx` itself (not exported, not imported elsewhere per this session's grep of `initialOverride` usages: only `page.tsx` and `Startup.tsx` reference it). No new import, no new exported type needed — the effective-status derivation in `page.tsx` produces a plain object literal matching the existing inline shape Startup already destructures.

## 5. Downstream field UI behavior — unchanged from `06_...`, re-confirmed

`Startup.tsx` lines 121/152/154/217-225 already bucket any non-`approved`/non-`pending` status (including `rejected` and `expired`) identically as `"closed"` — the A2 fix's in-memory `pending`-past-TTL → `expired` relabel lands in that existing bucket with zero `Startup.tsx` changes. Re-confirmed this session by re-reading the exact line numbers cited in `06_...` — no drift found (Field page/Startup.tsx untouched by any of the branches checked in §0).

## 6. Test commands

- `cd apps/web && npx playwright test ipad-gps-policy.spec.ts` — the one existing spec file this fix extends (per `package.json:12`, `"test:e2e": "playwright test"`).
- `npm run typecheck && npm run build` (standard pre-PR gate per every prior M-series packet's convention in this repo).
- New assertions per `08_CLAUDE-M3-SEED-ACCEPTANCE-PLAN.md` §2 (unauthorized), §5 (transition-rejection/idempotent-replay), and the A2-specific terminal-history-preservation case — these need real seeded fixtures (from `07_CLAUDE-M3-SEED-IMPLEMENTATION-READINESS-002.md`, a separate, already-prepared lease) or in-test fixture creation local to the spec file, Codex's choice.

## 7. Regressions to run

- **Unauthorized**: non-assigned-inspector call to `set_operational_state`/`request_geo_override` still raises `RBAC-009` (§2 of `08_...`) — proves nothing in this fix touches that guard.
- **Expired (A1, if not already covered by `c48f71cc`'s own tests)**: GET `/operations` with a pending-but-past-TTL request → row absent from queue, database status unchanged.
- **History (A2)**: seed one `approved`, one `rejected`, one already-`expired` request → all three still load via the *unfiltered* field-page query with their original status intact (proves A2 never erases terminal rows — the single most important regression for this specific fix, per Codex's own prior RETURNED).
- **Empty**: no pending requests at all → both pages render their existing empty-queue states unchanged (not touched by this fix).
- **Error**: existing `loadErrors` banner behavior on `operations/page.tsx` (line ~591-595 in the pre-`c48f71cc` version) — confirm the removed-RPC change doesn't alter this unrelated error-aggregation path.

## 8. Browser routes / personas

- `/operations` as `ops` persona — confirm the KPI/queue render unaffected by the RPC removal (visual parity check against the pre-fix screenshot if one exists from `c48f71cc`'s own PR evidence).
- `/field/<visitId>` as the assigned `inspector` persona, for each of: a fresh visit with no override history, a visit with an active pending-and-valid override, a visit with a pending-but-expired override (A2's core fix), and a visit with terminal (approved/rejected/expired) override history.
- Both routes also checked as a non-assigned/unauthorized persona (regression §7).

## 9. Rollback

- **If based on `c48f71cc`**: this packet's own diff is A2-only — revert is a single-file `git revert`/checkout of `field/[visitId]/page.tsx`, independent of anything else on that branch.
- **If based on bare `setup/Inspection`**: revert both `operations/page.tsx` (A1) and `field/[visitId]/page.tsx` (A2) diffs; `Startup.tsx` untouched throughout either way. No database object involved in Part A (Part B's `pg_cron` schedule remains separately blocked on the cadence decision, per `06_...`, and is not part of this lease).

## 10. PR evidence expected

- Diff scoped to exactly the files in §3 (plus the new/updated spec file).
- Playwright run output for `ipad-gps-policy.spec.ts` including the new regression cases (§7).
- Screenshot or DOM-read evidence for the browser checks in §8, both personas, both routes.
- Explicit note in the PR description of which base this was built on (§1) and, if `c48f71cc`, an explicit statement that Part A1 is inherited from that branch and not re-implemented here (avoids a reviewer mistakenly thinking A1 was reinvented).

## 11. Disposition

Preflight complete. **Ownership conflict identified and surfaced (§0) rather than silently worked around.** No product code, tests, migrations, or live Claude Design modified. Ready for Codex to decide the base (§1) and issue the isolated lease scoped accordingly.
