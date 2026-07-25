# CLAUDE-M3-OVERRIDE-EXPIRY-FIX-001 (Revision 3)

Direction: M3-SPONSOR-DIRECTION-20260725, item (3) BUG.
This is a design-only specification for Codex to review and issue as an isolated implementation lease. No product code touched in this design-only worktree/branch.

**Revision 2 correction (per first Codex RETURNED):** Revision 1 proposed a 5-minute cron cadence and presented it as a reasonable inference from the visits precedent — that was an invented number, not a governed one. Corrected: cadence marked `DECISION_REQUIRED`, split into Part A (no-mutation read filter) / Part B (scheduled sweep).

**Revision 3 correction (per second Codex RETURNED):** Revision 2's Part A proposed the identical `gt(expires_at, nowIso)` filter for both pages — unsafe as written for two independently traced reasons, both confirmed by re-reading the exact code this session:
1. In `operations/page.tsx`, `nowIso` is declared at line 395, **after** the `Promise.all` block that contains the override-requests query (lines 174-225) — the filter as written would not compile/would reference an undeclared variable. Fixed below by declaring a dedicated, immutable request-scoped timestamp *before* the `Promise.all`.
2. In `field/[visitId]/page.tsx`, the query (`.order("requested_at", { ascending: false }).limit(1)`, lines 104-108) intentionally loads the **single latest request regardless of terminal status** (pending/approved/rejected/expired) to drive `Startup.tsx`'s UI state, including showing terminal history. Adding an `expires_at` filter there would silently erase approved/rejected/expired rows from view whenever their `expires_at` (which is always in the past for any terminal row) is checked — exactly the "erase history" defect flagged. Fixed below by deriving an **effective status** in memory after the fetch, never filtering the query and never mutating the row.

## Confirmed defect (read-only, this session)

`apps/web/src/app/(app)/operations/page.tsx:172-173` and `apps/web/src/app/(app)/field/[visitId]/page.tsx` both call `sb.rpc("expire_stale_geo_override_requests")` unconditionally on every server-rendered GET. Confirmed exact callers by grep this session — no other caller exists (`apps/web/e2e/ipad-gps-policy.spec.ts` only tests behavior, doesn't call it directly).

`supabase/migrations/20260716161605_ipad_geo_override_approval_workflow.sql` comment at the function (lines ~93-95) confirms this was a deliberate but incomplete design: *"A scheduled worker is not assumed. Any authenticated field or Operations read materializes elapsed requests as expired, while the decision guard independently enforces the same cutoff to remain race-safe."*

## Why the fix is safe — decision-time race-safety already exists independent of this call

Read `decide_geo_override()` (same migration, lines ~249-296) this session: it already does its own atomic check under `for update` lock —
```sql
if now() >= v_request.expires_at ... then
  update geo_override_requests set status = 'expired', decided_at = now() where id = p_request returning * into v_request;
  return v_request;
end if;
```
This means removing the page-load mutation call does **not** create a race condition: an expired-but-not-yet-swept request is still caught and correctly rejected at decision time, atomically. The page-load call was only ever a display-freshness convenience (so the queue count looked current), not the source of decision-time safety.

## Exact precedent already in this codebase — reuse it

`supabase/migrations/0025_scheduled_visit_expiry.sql` solved the identical problem for `visits`/`expire_lapsed_visits()` one migration cycle ago: it added `pg_cron`, split the per-page-load (auth-scoped) entry point from a new unscoped scheduled entry point, and registered `select cron.schedule('expire-lapsed-visits', '*/15 * * * *', ...)`.

**`expire_stale_geo_override_requests()` needs less work than that precedent required**, because it is already globally unscoped (no `auth.uid()` filter in its `WHERE` clause — confirmed by reading the function body this session) — there is no per-caller scoping to split apart. The fix is: stop calling it from page loads, and instead call it from a `pg_cron` schedule, exactly like `0025`'s pattern.

## Governed cadence check (this session) — none exists

Grepped `supabase/migrations/*.sql` and `product-contract/` for any authorized sweep interval for `geo_override_requests`. Found: `0025_scheduled_visit_expiry.sql` uses `*/15 * * * *` for **visits** — a different domain, different TTL (visit windows are hours/days; override requests are a 30-minute TTL per the existing UI copy `overrideQueueStrings.caption`, confirmed in `page.tsx` this session). No `engine_settings` row, no product-contract requirement, and no other migration authorizes any specific sweep interval for `geo_override_requests`. **The exact cron cadence is therefore `DECISION_REQUIRED`** — this spec does not propose a number, and Codex/sponsor must set one (or approve reusing 15 minutes, or any other value) before the cron migration is written. Proposing a number here would repeat exactly the invented-value defect this fix exists to prevent.

## Two-part fix — the cadence decision blocks only the second part

**Part A — no-mutation fix, traced separately per page (they have different query semantics):**

*A1 — `operations/page.tsx` (Ops override queue, shows only pending/actionable rows, safe to filter):*
Today (lines 172-173, 218-221):
```ts
const { error: overrideExpiryError } = await sb.rpc("expire_stale_geo_override_requests");
// ...later, inside Promise.all...
sb.from("geo_override_requests").select(...).eq("status", "pending").order("expires_at", { ascending: true })
```
`nowIso` (line 395) is declared *after* this query runs — it cannot be reused here. Fix: delete the `rpc` call (lines 172-173), and declare a dedicated immutable timestamp for this one query, captured before the `Promise.all` (i.e. right after `const sb = await supabaseServer();`, line 169):
```ts
const overrideQueryNowIso = new Date().toISOString();
```
then add the read-only filter to the existing query:
```ts
.eq("status", "pending").gt("expires_at", overrideQueryNowIso)
```
This is a pure `WHERE` clause addition — zero mutation, zero new function, zero migration, no interaction with the existing `now`/`nowIso` declared later for SLA computation. An expired-but-unswept row simply stops appearing in this actionable queue the moment its TTL passes — correct here because this query only ever showed `status = 'pending'` rows to begin with (no history to lose).

*A2 — `field/[visitId]/page.tsx` (Startup screen, shows the latest request regardless of terminal status — must NOT filter):*
Today (lines 100, 104-109):
```ts
const { error: expiryError } = await sb.rpc("expire_stale_geo_override_requests");
// ...
const { data: overrideRows } = await sb.from("geo_override_requests")
  .select("id, status, expires_at, decision_event_id")
  .eq("visit_id", visitId).order("requested_at", { ascending: false }).limit(1);
const initialOverride = overrideRows?.[0] ?? null;
```
Traced downstream: `initialOverride` is passed as a prop typed `InitialOverride` (`Startup.tsx:84-87` — `{ id, status: "pending"|"approved"|"rejected"|"expired", expires_at, decision_event_id }`) to the `Startup` component (`Startup.tsx:113`), which branches on `.status` at lines 121, 152, 154, 217-225. Line 152 already treats any status other than `"approved"`/`"pending"` as `"closed"` — i.e. `"rejected"` and `"expired"` are already handled identically today. This means the fix needs **no change to `Startup.tsx` or the `InitialOverride` type** — only `page.tsx` needs to stop reporting a stale `"pending"` when the row is effectively expired. Fix: delete the `rpc` call (line 100), keep the query exactly as-is (unfiltered, still `limit(1)` on `requested_at desc` — terminal history stays intact for every other status), and derive the effective status in memory, immediately after the fetch:
```ts
const rawOverride = overrideRows?.[0] ?? null;
const fieldOverrideNowIso = new Date().toISOString();
const initialOverride = rawOverride && rawOverride.status === "pending" && rawOverride.expires_at <= fieldOverrideNowIso
  ? { ...rawOverride, status: "expired" as const }
  : rawOverride;
```
This never writes to the database, never drops the row, and never touches an already-terminal (`approved`/`rejected`/`expired`) row — it only relabels a `pending` row as `expired` in memory when its own `expires_at` has already passed, so `Startup.tsx`'s existing `"closed"`-bucket branching (already correct for `rejected`/`expired`) applies to it too, instead of the stale `"pending"` branch treating it as still actionable.

**Part B — scheduled sweep (persistence/audit correctness, cadence `DECISION_REQUIRED`):**
Part A alone leaves rows sitting at `status = 'pending'` in the database forever after their TTL (just invisible to the two pages) — the sponsor's requirement "persistence/audit move to a scheduled or explicit governed mechanism" still needs the actual `status` write to happen somewhere. Reuse the exact `0025_scheduled_visit_expiry.sql` pattern: `create extension if not exists pg_cron with schema extensions;` (idempotent) then `select cron.schedule('expire-geo-overrides', '<CADENCE_DECISION_REQUIRED>', $$select expire_stale_geo_override_requests();$$);` — the interval literal is a placeholder pending the decision above, not a proposal.

## Exact files and change (traced downstream, no unnamed files)

| File | Change |
|---|---|
| `apps/web/src/app/(app)/operations/page.tsx` | Delete lines 172-173. Add `const overrideQueryNowIso = new Date().toISOString();` before the `Promise.all` (near line 169). Add `.gt("expires_at", overrideQueryNowIso)` to the pending-override query (line ~221). No other line touched — `now`/`nowIso` (lines 394-395, used for SLA computation and `MonitoringTable`) are untouched and unrelated. |
| `apps/web/src/app/(app)/field/[visitId]/page.tsx` | Delete line 100 (the `rpc` call) and its error-log line 101. Keep the `overrideRows` query (lines 104-108) exactly unfiltered. Replace line 109's `const initialOverride = overrideRows?.[0] ?? null;` with the effective-status derivation shown above (raw fetch → in-memory `pending`-past-`expires_at` → `expired` relabel only). |
| `apps/web/src/app/(app)/field/[visitId]/Startup.tsx` | **No change required** — confirmed by tracing `initialOverride.status` usage (lines 121, 152, 154, 217-225): the existing `"closed"` bucket (line 152) already handles `"rejected"` and `"expired"` identically, so relabeling an effectively-expired `"pending"` row to `"expired"` upstream is sufficient. The `InitialOverride` type (`Startup.tsx:84-87`) already includes `"expired"` as a valid member — no type change needed either. |
| New migration, e.g. `supabase/migrations/2026072XXXXXXX_scheduled_geo_override_expiry.sql` | Part B — written only after the cadence decision lands; placeholder interval, not a number this spec asserts |
| `apps/web/e2e/ipad-gps-policy.spec.ts` | Update/add negative tests (see below) — this is the only test file referencing `expire_stale_geo_override_requests` (confirmed by grep this session); no other spec file touches this behavior |

## RLS/RBAC and requester/decider separation — unchanged

No policy, grant, or role-check in `geo_override_requests_read`, `decide_geo_override`, or the `expire_stale_geo_override_requests` function itself changes. The function's existing `revoke all ... from public, anon; grant execute ... to authenticated;` stays as-is for any other legitimate authenticated caller; the cron entry point calls it directly as the database owner (same trust model as `0025`'s scheduled sweep), no new grant needed since it's already ownerless-safe (`security definer`, no `auth.uid()` dependency).

## Negative tests required (per sponsor's "expired override requests are not actionable")

1. **Ops queue (A1)**: seed a pending request past `expires_at` → GET `/operations` → assert `geo_override_requests.status` is unchanged in the database immediately after (no mutation from the read) AND the row does not appear in the rendered override queue (the `gt` filter excludes it).
2. **Field Startup (A2)**: seed a pending request past `expires_at` → GET the field visit page → assert `geo_override_requests.status` is unchanged in the database (no mutation) AND `Startup` receives `initialOverride.status === "expired"` (not `"pending"`), landing in its existing `"closed"` UI branch — not the actionable `"pending"` branch.
3. **Field Startup terminal-history regression (A2)**: seed one `approved`, one `rejected`, and one already-`expired` request (all with `expires_at` in the past, as any terminal row naturally has) → assert all three still load via the unfiltered query and are passed through to `Startup` with their **original** status unchanged — proves the effective-status derivation never touches non-`pending` rows and never erases history.
4. Decision-time guard test: call `decide_geo_override` against an expired-but-unswept **pending** request → assert it returns `status = 'expired'` (the function's own atomic check fires), never an `approved`/`rejected` result — proves race-safety is unaffected by removing the page-load `rpc` calls.
5. Cron sweep test (integration, not unit, Part B only): after the scheduled interval elapses, assert the row's status is `expired` via the scheduled function, independent of any page load.
6. Requester/decider separation regression: existing test that an inspector cannot decide their own request — must still pass unchanged (no code path here touches that check).

## Rollback

Part A: revert the `operations/page.tsx` diff (restore the `rpc` call, drop `overrideQueryNowIso`/`gt` filter) and the `field/[visitId]/page.tsx` diff (restore the `rpc` call, drop the effective-status derivation, restore the plain `overrideRows?.[0] ?? null`) — no database object involved in either, plain code revert, `Startup.tsx` untouched throughout. Part B (once written): additive-only (`pg_cron` schedule entry, no column/table change) — rollback is `select cron.unschedule('expire-geo-overrides');`. No destructive database action at any point in either part.

## Clean-worktree lease request

This design-only worktree/branch (`catalyst/m3-operations-design-0f2c11`) has no application-code lease and should not receive one — per the operating system's role separation, Codex should issue this as an **isolated implementation lease in a fresh worktree** (mirroring how M1's dashboard fix and M3's own PR #60/#61 were leased separately from design work), scoped to exactly the 2 code files (`operations/page.tsx`, `field/[visitId]/page.tsx`) + the test file + the new migration once Part B's cadence is decided — `Startup.tsx` is explicitly out of scope (no change needed) — with the same "no merge/deploy without explicit approval" constraint as every other packet.

## Disposition

Specification complete and grounded in code/migration read this session (not invented). Ready for Codex review and lease issuance — no implementation performed here.
