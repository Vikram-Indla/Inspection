# TASK-M3-FIELD-EXPIRY-A2 — implementation evidence (REVIEW READY, unmerged, unpushed)

Revised after independent review return. Corrects: (1) the dynamic-route test now targets `/field/<visitId>`, not `/field`, and skips explicitly with a named blocker when no fixture is available; (2) the false "real-browser zero-write proof" claim is withdrawn — a browser request listener cannot observe a server component's own Supabase calls; (3) the timestamp comparison is now numeric (`Date.parse` + `Number.isFinite` guard), not lexicographic string comparison; (4) the static test now explicitly proves the relabel predicate requires `status === "pending"` and the fallback returns `rawOverride` unchanged; (5) this file states the corrected evidence/blocker distinction plainly.

Revised again after a second independent review return, closing two false-pass gaps in the test itself (not the production code): (6) the DB-state read-before/after query now explicitly selects `id,status,expires_at,decision_event_id` and asserts exactly one row exists both before and after the two renders (`toHaveLength(1)`) — previously, an invalid/non-existent `FIELD_TEST_VISIT_ID` would have compared `undefined` to `undefined` four times and falsely passed; (7) the static no-write assertion, which previously checked only `.rpc(`, now also asserts zero `.insert(`, `.update(`, `.upsert(`, and `.delete(` calls in the route — matching the evidence's own "no server-side write call of any kind" claim.

Packet: `design/claude-design-mvp1/outputs/m3-operations/12_CLAUDE-M3-A2-FIELD-LEASE-007.md` (Claude Design worktree, read-only source of the diff intent).
Branch: `codex/m3-field-expiry-fix`. Base: `main@9d8c414258a5e04244fdf9ce350e5f25f952dfc1`. Worktree: `/Users/vikramindla/Developer/Inspection-codex-m3-field-expiry`.
Requirements: `CR-430..CR-448` (twin of the Operations-side mutating-GET defect fixed in PR #60). Acceptance: `WA-M3-AC-002` (negative/security — fail safely), `WA-M3-AC-005` (regression — protected backend/workflow/audit).

## What changed — exactly two files, per lease

1. `apps/web/src/app/(app)/field/[visitId]/page.tsx` — removed `sb.rpc("expire_stale_geo_override_requests")` from the page-load path. The unfiltered `geo_override_requests` history query is unchanged. A past-due `pending` row is relabeled `"expired"` **in memory only** using a **numeric** comparison (`Date.parse(rawOverride.expires_at)` against `Date.now()`, guarded by `Number.isFinite` so an unparseable or missing `expires_at` cannot trigger the relabel — the row stays exactly as stored, i.e. `pending`). Every other status (`approved`/`rejected`/`cancelled`/already-`expired`) fails the `status === "pending"` clause and passes through completely unchanged via the ternary's `: rawOverride` branch. No database write occurs on this route.
2. `apps/web/e2e/ipad-gps-policy.spec.ts` — `TASK-M3-FIELD-EXPIRY-A2 no-mutation-on-read` (static code-assertion, corrected to check the numeric-comparison code, to explicitly prove the `status === "pending"` predicate gate and the unchanged-fallback structure, and to assert zero `.insert(`/`.update(`/`.upsert(`/`.delete(` calls in the route in addition to the existing `.rpc(` check) and `TASK-M3-FIELD-EXPIRY-A2 dynamic route + DB-state proof` (real-browser, targets `/field/<visitId>` via `FIELD_TEST_VISIT_ID`, reads the same `geo_override_requests` row before/after two renders via the existing read-only `live-rest` authenticated-REST helper with an explicit `select=id,status,expires_at,decision_event_id` and `toHaveLength(1)` row-count assertion on both reads — no browser network-listener claim, no seeding, no false pass on a missing fixture).

`Startup.tsx` untouched — confirmed by `git diff --stat` showing only the two leased files.

## Exact diff (production file)

```diff
   const rawOverride = overrideRows?.[0] ?? null;
-  const fieldOverrideNowIso = new Date().toISOString();
-  const initialOverride = rawOverride && rawOverride.status === "pending" && rawOverride.expires_at <= fieldOverrideNowIso
-    ? { ...rawOverride, status: "expired" as const }
-    : rawOverride;
+  // Numeric comparison, not string ordering: expires_at is compared as epoch
+  // milliseconds so the relabel is correct regardless of timestamp precision
+  // or format. An unparseable/missing expires_at fails Number.isFinite and
+  // the row is left exactly as stored (pending), never falsely expired.
+  const fieldOverrideExpiresAtMs = rawOverride?.expires_at ? Date.parse(rawOverride.expires_at) : NaN;
+  const initialOverride = rawOverride && rawOverride.status === "pending"
+    && Number.isFinite(fieldOverrideExpiresAtMs) && fieldOverrideExpiresAtMs <= Date.now()
+    ? { ...rawOverride, status: "expired" as const }
+    : rawOverride;
```

(Test-file diff: 107 lines added/changed across two `test.describe` blocks. `git diff --stat`: 2 files changed, 121 insertions, 6 deletions.)

## Commands and results

- `npx tsc --noEmit -p tsconfig.json` — **clean, exit 0**.
- `npm run build` — **clean production build**, `/field/[visitId]` route compiles.
- `npx playwright test e2e/ipad-gps-policy.spec.ts --project=e2e --no-deps --reporter=line` — **PASS (5) FAIL (0) skipped (1)**. The 5 passing: original 3 GIS-policy regression tests, the corrected static no-mutation/relabel-predicate proof (now also asserting zero `.insert(`/`.update(`/`.upsert(`/`.delete(` calls in the route, confirmed truthful by direct grep against the file — zero matches), and the `decide_geo_override` guard-unchanged proof. The 1 skipped: the dynamic-route/DB-state test, correctly self-skipping via `test.skip(!visitId, ...)` because `FIELD_TEST_VISIT_ID` is unset in this environment — this is the explicit external-evidence blocker, not a failure or a silently-omitted case.
- `git diff --check` — clean, no whitespace errors. `git diff --stat` / `git status --short` — exactly the two leased files plus this evidence file.

## Corrected claim: what real-browser evidence can and cannot prove here

**Withdrawn**: the prior evidence file claimed a Playwright browser `page.on("request", ...)` listener proved "zero server-side writes." That claim was false and is removed. A Next.js server component's own `await sb.rpc(...)`/`await sb.from(...)` calls execute server-side and never cross the browser's network layer — a browser-side request listener cannot observe them, so it cannot prove or disprove a server-side write occurred.

**What the corrected test proves instead, when it can run**: reading the same `geo_override_requests` row via the existing, already-in-repo `live-rest.ts` helper (`login`/`rest`/`must`, same pattern already used and reviewed in `dashboard-kpi-seed.spec.ts`), authenticated as the `ops` persona (RLS-permitted to read this table per `0008_visibility_widen.sql`), **before** and **after** two real `/field/<visitId>` page renders — with an explicit `select=id,status,expires_at,decision_event_id` on the query, an explicit `expect(before).toHaveLength(1)` / `expect(after).toHaveLength(1)` assertion on each read (so a missing or wrong `FIELD_TEST_VISIT_ID` fails loudly instead of silently comparing `undefined` to `undefined` and false-passing), and finally asserting `id`, `status`, `expires_at`, and `decision_event_id` are byte-identical across both reads. This is read-only: no row is created, updated, or deleted by the test.

**Why it did not run this session — confirmed, not assumed:**
1. `FIELD_TEST_VISIT_ID` is unset in this environment, and **no existing fixture visit with a `geo_override_requests` row exists to point it at** — confirmed by grep: no migration or seed script anywhere in this repository inserts into `geo_override_requests` (the only two migrations referencing the table are the ones that *create* it and the later dispatch-coordinate fix; the one other spec that exercises this table, `m04-device-eta-override.spec.ts`, creates its own visit and override request live via authenticated POST calls under the `inspector` persona — i.e., seeding, which this lease does not hold authority to do).
2. Independently of (1), the page render itself requires the `inspector` persona's UI login, which — re-verified this session on the corrected worktree — reproduces the exact same pre-existing, unrelated boundary already on record: `planner`/`reviewer`/`admin`/`ops` authenticate successfully; `inspector` times out (`TimeoutError: page.waitForURL: Timeout 40000ms exceeded`) with a captured browser console line `[browser:inspector] Failed to load resource: the server responded with a status of 400 ()`. No credential, password, or auth code was touched to investigate this — it is reported as observed, cause unconfirmed, exactly as the design worktree's `14_CLAUDE-M3-VISUAL-EVIDENCE-MATRIX-009.md` §1 already records it.

Either blocker alone would prevent this test from running; both are present. **This is recorded as an unresolved external P1 evidence blocker, not as a pass, not as a skip that quietly implies coverage.**

One infrastructure-only, non-scope, git-ignored action was needed before any test could execute at all: this fresh worktree was missing the `apps/web/.env.local` symlink that every sibling lease worktree (`Inspection-codex-m1-dashboard`, `Inspection-codex-m3-operations`, `Inspection-codex-f0-shell`) already holds pointing at the canonical repo's own `.env.local` — created identically here (`ln -s /Users/vikramindla/Developer/Inspection/apps/web/.env.local .env.local`), matching the existing convention (same as the pre-existing `node_modules` symlink). No credential value was read, copied, or changed; the file is git-ignored and does not appear in `git status` or `git diff`.

## Negative-path coverage — what is and is not executed

Packet `12_...` §6 specifies 5 test cases. Status, unchanged from the honest accounting in the prior evidence pass and restated per this review's point 4:
- **Achievable and executed this session**: static no-mutation/relabel-predicate proof (numeric comparison, `pending`-only gate, unchanged fallback) — **passing**.
- **Not executed — requires a seed-data lease this task does not hold**: the 3 cases needing specific seeded `geo_override_requests` rows (fresh pending-not-expired, pending-past-expiry, and one row each of `approved`/`rejected`/already-`expired`). **These are not claimed as passing** — packet 12 itself correctly records them as unexecuted without a seed-data lease, and this evidence file does not contradict that.
- **Specified, not executed — blocked by two independent, external, pre-existing conditions** (§ above): the dynamic-route/DB-state proof (packet 12 §6 case 5's intent, generalized to a read-before/after check rather than a network-listener check). The test is written, wired to `FIELD_TEST_VISIT_ID`, and will run correctly the moment a fixture visit + working inspector auth exist — today it self-skips with an explicit, named reason.

## P0/P1 status

**Zero P0/P1 in the diffed code itself.** The fix (no-mutation-on-read, numeric-safe in-memory-only relabel gated strictly on `pending`, unfiltered history preserved, `decide_geo_override` untouched) is complete, typechecked, and statically proven by test.

**One open P1, carried as an evidence blocker, not a code defect**: dynamic-route/DB-state real-browser proof cannot be produced in this environment today, for two independent, external, pre-existing reasons — (a) no fixture visit with an existing `geo_override_requests` row, and (b) the inspector-auth HTTP 400 boundary, independently reproduced this session, already on record and unrelated to this diff. This P1 remains open until either a seed-data lease supplies a fixture row or the inspector-auth boundary is independently resolved — it does not block this task's own two-file code correctness, but it does mean full acceptance evidence (`WA-M3-AC-005` real-wiring proof) for this specific behavior is not yet closed.

## Rollback

Single-file, code-only revert (`git checkout main -- 'apps/web/src/app/(app)/field/[visitId]/page.tsx'`), plus dropping the added test blocks. No migration, RPC, schema, or Supabase data object touched by this lease — nothing else to roll back.

## Scope-clean check

`git diff --stat`: exactly `apps/web/e2e/ipad-gps-policy.spec.ts` and `apps/web/src/app/(app)/field/[visitId]/page.tsx`. `git diff --check`: no whitespace errors. `git status --short`: no other tracked file modified (`.env.local` symlink is git-ignored, does not appear). `Startup.tsx`, `operations/**`, any migration, any `product-contract/**` file: zero diff.

## Disposition

**REVIEW READY. Not committed, not pushed, no PR opened.** Awaiting orchestrator's independent review of the two-file diff, with the one open P1 evidence blocker stated above, before any commit/push/draft-PR authorization.
