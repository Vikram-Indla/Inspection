# CLAUDE-M3-MAP-PROVENANCE-CORRECTION-008

Read-only correction lease packet. Bootstrap re-confirmed this session: `SAQEEL_OPERATING_SYSTEM.md` v2.0, `SAQEEL_REQUIREMENT_SCORECARD.yaml`, `ACTIVE_WORKTREE_LEASES.csv` — read fresh. No application code, PR, branch, live design, or product-contract file modified.

## 0. Coordinate source for tier 2 — real column names, confirmed against the schema

Re-read `05_CLAUDE-M3-MAP-DESIGN-UPDATE-001` this session: it does **not** cite `visits.dispatch_lat`/`dispatch_lng` — it names factory official coordinates, and its planner/factory framing is consistent with the real schema. No correction to that packet is needed on this point, and none is claimed here. The exact real column pair this implementation contract uses is `coalesce(visits.planner_lat, factories.official_lat)` / `coalesce(visits.planner_lng, factories.official_lng)`, confirmed this session in `supabase/migrations/20260718140105_fix_geo_override_dispatch_coordinates.sql`'s own `request_geo_override` fix (`select ... coalesce(v.planner_lat, f.official_lat), coalesce(v.planner_lng, f.official_lng) ...` and its header comment naming `visits.planner_lat`/`planner_lng` as the accepted Immediate Visit dispatch point). This is stated here as the exact column pair to implement against — a specification detail, not a correction of prior authority.

## 1. Ownership reconciliation — PR #60 is frozen for review; use a dependent branch

`ACTIVE_WORKTREE_LEASES.csv` (read fresh): `codex/m3-operations-reconciliation` row — `mode: REVIEW_ONLY`, `shared_exclusions: "all source writes"`, `status: PENDING_REVIEW`. `gh pr view 60` (fresh): still `OPEN`/`DRAFT`, `reviews: []`, unchanged since the last check. **This branch is under an active review-only lock — it is not open for a second actor's writes without an explicit lease transfer Codex has not granted.** Recommendation: **do not amend `c48f71cc` directly.** Use a **dependent branch** forked from `c48f71cc` itself (not from bare `main`, since the correction target files — `operations/live/page.tsx`, `types.ts`, `LiveOps.tsx`, `LiveMapInner.tsx` — only exist in their corrected WA-DES-034-C3 shape on that branch; forking from `main` would mean re-doing PR #60's other work first). If Codex prefers to fold this correction directly into PR #60 instead of a separate dependent PR, that requires an explicit lease-transfer record in `ACTIVE_WORKTREE_LEASES.csv` before any write — not assumed here.

## 2. Real schema verified this session (not invented, not assumed from `05_...`)

| Fact | Source, re-read this session |
|---|---|
| `geo_events(id, journey_id nullable→journey_sessions, visit_id not null→visits, kind text, observed_lat/lng numeric(10,7) not null, accuracy_m, geofence_result, occurred_at timestamptz not null default now())` | `0001_foundation.sql:186-196` |
| `kind` values: `telemetry\|arrival\|checkin\|override\|deviation` (comment-documented, not a DB enum/check constraint — confirmed no `check (kind in (...))` found). **Only `telemetry`/`arrival`/`checkin` are permitted for tier 1** per the accepted `05_...` packet — `override`/`deviation` excluded, no exception. | `0001_foundation.sql:190` |
| `geo_events` RLS read (current, widened): `has_any_role(['ops','auditor','reviewer','planner','leadership']) or is_assigned_inspector(visit_id)` | `0008_visibility_widen.sql:4-5` (supersedes the narrower `0002_rbac_audit.sql:34` version) |
| `journey_sessions(id, visit_id, inspector_id, started_at, status)` — the actor linkage: `geo_events.journey_id → journey_sessions.inspector_id` | `0001_foundation.sql:178-185` |
| `journey_sessions` RLS read: `inspector_id = auth.uid() or has_any_role(['ops','auditor','reviewer','planner','leadership'])` | `0008_visibility_widen.sql:6-7` |
| Real dispatch coordinate: `coalesce(visits.planner_lat, factories.official_lat)` / `coalesce(visits.planner_lng, factories.official_lng)` | `20260718140105_fix_geo_override_dispatch_coordinates.sql` (header comment + live query) |
| Existing "latest per visit" precedent already in production code: `operations/page.tsx`'s `latestGeofence` map — `geo` array pre-sorted `occurred_at desc`, first-seen-per-`visit_id` wins | `operations/page.tsx` (confirmed this session, same file reviewed for A1) |

**No BLOCK.** The backend can safely and deterministically identify the latest authorized observation per visit today: `geo_events` rows carry `visit_id` + `occurred_at` + RLS that already scopes to the correct actor set; the exact same precedence pattern (sort desc, first-per-key wins) is already live in `operations/page.tsx`. Nothing needs inventing.

## 3. Exact bounded implementation contract — three states, deterministic precedence

For each visit/inspector shown on `/operations/live` (and the Operations Map view):

1. **Last recorded GPS** — condition: at least one **permitted-kind** `geo_events` row exists for the visit. **Permitted kinds, per the accepted `05_CLAUDE-M3-MAP-DESIGN-UPDATE-001` packet: `telemetry`, `arrival`, `checkin` only. `override` and `deviation` rows are excluded from this tier and must never be selected as the tier-1 position, with no exception, unless a sponsor change-control decision states otherwise.** Query: `select observed_lat, observed_lng, accuracy_m, occurred_at, kind from geo_events where visit_id = $1 and kind in ('telemetry','arrival','checkin') order by occurred_at desc, id desc limit 1`. Label: `Last recorded GPS — not guaranteed live`, showing `occurred_at` and `accuracy_m` when present.
2. **Projected from assignment/schedule** — condition: **no *permitted-kind* `geo_events` row exists for the visit** (a `geo_events` row of kind `override`/`deviation` may still exist and does not disqualify this tier — it simply isn't tier-1-eligible), the visit has a real `assignments` row and `window_start`, and `coalesce(visits.planner_lat, factories.official_lat)` / `coalesce(visits.planner_lng, factories.official_lng)` resolves non-null. Label: `Projected from assignment/schedule — not live GPS`, showing which source resolved (planner-set dispatch point vs. factory's official location) and the scheduled `window_start`. **Every occurrence of "no geo_events row" for this tier means no *permitted-kind* row — never "no row of any kind"** (an override/deviation-only visit is tier 2, not tier 1).
3. **Location unavailable** — condition: neither of the above resolves (no permitted-kind `geo_events` row AND the coalesced coordinate is null). The visit/entity **stays in the operational list** with an explicit reason (e.g. "No location recorded and no assignment/factory coordinate available") — **never dropped from the query**. This is the change from PR #60's current behavior, which applies `.not("official_lat", "is", null)` (`/operations/live`) or a `continue`-on-null-coordinate guard (`/operations`, §4) at the data-construction level and silently excludes these rows.

**"Missing-coordinate entities must remain visible... only mapped features may require coordinates"** — concretely: the list/table read for `/operations/live` must **not** filter on `official_lat is not null` at the SQL level (drop that `.not()` clause); the **map-rendering step only** (client-side, after the full list is fetched) skips pin placement for entities with no resolvable coordinate — the list still shows them with the tier-3 reason.

## 4. Exact files and query/derivation changes — both surfaces inspected directly this session, nothing guessed

### `/operations/live` (`operations/live/page.tsx`)

Confirmed: `sb.from("factories").select(...).not("official_lat", "is", null)`; `sb.from("visits").select(...factories(...official_lat, official_lng))`; inspectors skipped at `f.official_lat == null` (lines ~71-72, ~112); **no `geo_events` read anywhere in this file** (confirmed by grep, zero hits). `types.ts` (`LiveInspector`/`LiveFactory`) carries only `lat`/`lng`, always assumed resolvable.

**Corrected:** add a `geo_events` fetch scoped to the monitored visit set, `kind in ('telemetry','arrival','checkin')` (§9's query plan); remove the `.not("official_lat", ...)` filter from the list-level factories/visits query; keep coordinate-presence as a map-pin-only gate; derive each entity's tier per §3 using `coalesce(v.planner_lat, f.official_lat)`. `types.ts` gains a `provenance: "recorded" | "projected" | "unavailable"` field, `lat`/`lng` become nullable for the unavailable case, plus `observedAt`/`accuracyM` (tier 1) and `scheduledAt`/`coordinateSource` (tier 2). `LiveOps.tsx`'s single generic label (`page.tsx:149`, `"Projected route — not live GPS"`) becomes three distinct per-entity labels matching §3's exact wording. `LiveMapInner.tsx` skips pin placement only for `provenance === "unavailable"` — its confirmed-correct no-route/no-path/no-animation behavior is otherwise unchanged.

### `/operations` Map view — inspected this session, not assumed identical; two implementation regressions from the first revision corrected below

**Regression 1 fixed — do not filter the existing `geoRes` query.** The first revision proposed adding `kind in ('telemetry','arrival','checkin')` to `/operations`'s existing `geoRes` fetch (line ~218). **That query already backs the `latestGeofence` monitoring-table badge, which legitimately needs to see `override`/`deviation`-kind rows** (a geofence/override event is exactly what that badge exists to surface) — filtering the shared query at the source would regress geofence/override monitoring, an unrelated and already-working feature. **Corrected: `geoRes`/`geo` stay exactly as they are today, full ledger, no kind filter.** A **separate, in-memory-only** derivation, e.g. `const positionGeo = geo.filter(g => ["telemetry","arrival","checkin"].includes(g.kind))`, is computed from the same already-fetched `geo` array and used **only** for tier-1 provenance selection (§5's first-per-visit reduction runs over `positionGeo`, not `geo`). No new query, no query-level filter — a client-side subset of data already in memory.

**Regression 2 fixed — component/type change, not a one-line `continue` removal.** `OperationsMapEntry` is currently defined as `OpsPin & OperationsPreviewEntry` (`OperationsMapWorkspace.tsx:14`), and `OpsPin.lat`/`OpsPin.lng` are **mandatory `number`** (`OpsMap.tsx:12-22`, confirmed this session — not optional). `OperationsMapWorkspace` builds `markers: GeoMarkerData[]` by mapping **every** entry in the single `entries` array directly into a `GeoMap` marker (`entries.map(entry => ({..., lat: entry.lat, lng: entry.lng, ...}))`), and the same `entries` array feeds the synchronized list. **Making `OperationsMapEntry.lat`/`lng` nullable without touching this component would either fail to typecheck against `GeoMarkerData` or, if cast around, hand `GeoMap` a `null`/`NaN` coordinate — merely removing the two `continue` lines in `page.tsx` cannot make tier-3 entities visible on its own.** Exact bounded fix:
- **Type**: redefine `OperationsMapEntry` as a list-capable shape — `Omit<OpsPin, "lat" | "lng"> & OperationsPreviewEntry & { lat: number | null; lng: number | null; provenance: "recorded" | "projected" | "unavailable"; observedAt?: string; accuracyM?: number; scheduledAt?: string; coordinateSource?: "planner" | "factory" }` — coordinates and provenance now travel with every list entry, mandatory-`number` `OpsPin` shape is preserved only for the map-bound subset (below).
- **Component**: inside `OperationsMapWorkspace.tsx`, derive a second, narrower array for the map only: `const mappedEntries = entries.filter((e): e is OperationsMapEntry & { lat: number; lng: number } => e.lat != null && e.lng != null);` then build `markers` from `mappedEntries` (not `entries`). The synchronized **list** section continues to render the **full, unfiltered `entries` array** (list rows never needed coordinates to begin with — they already render `label`/`state`/preview fields text). **Shared `GeoMap` is unchanged** — it still receives a plain `GeoMarkerData[]`, just a possibly-shorter one; no prop/contract change to that shared component.
- **`page.tsx`**: `mapEntries` must be built from **all relevant visit/factory entities** (the same source `monitored`/`scopedFactories` iteration that builds `pins` today), **not from the already-coordinate-filtered `pins` array** (confirmed this session, `page.tsx:613`, `mapEntries = pins.map(...)` — since `pins` already dropped null-coordinate rows via the two `continue` statements at lines ~449/459, building `mapEntries` from `pins` can never surface a tier-3 row no matter what else changes). Corrected: `page.tsx` builds one full `mapEntries: OperationsMapEntry[]` by iterating `monitored`/`scopedFactories` directly, computing each entity's tier via `positionGeo` (above) + `coalesce(planner_lat, official_lat)`, and including entities with `lat: null, lng: null, provenance: "unavailable"` rather than skipping them — `OperationsMapWorkspace`'s internal filter (above) is what keeps them off the map while the list still renders them.
- **`regionalMapEntries`** (`page.tsx:625-634`, the regional/national-performance drill view) has the **same third occurrence** of this pattern (`scopedFactories.filter(factory => factory.official_lat != null && ...)`) — flagged here as the same defect, same fix (build from all `scopedFactories`, tier-derive, let the component filter for the map), though not explicitly named in this task's scope; Codex may choose to defer this one specifically if the drill view is considered lower-priority, but it should not be silently left inconsistent with the primary map view's now-corrected behavior.

## 5. Bounded, non-N+1 query plan, deterministic ordering, explicit error isolation

**One query per page, not one per visit.** Both surfaces fetch `geo_events` for the full monitored/visible visit-ID set in a single call:

```sql
select id, visit_id, kind, observed_lat, observed_lng, accuracy_m, occurred_at
from geo_events
where visit_id = any($1::uuid[])   -- the exact monitored/scoped visit-id array, not a per-visit loop
  and kind in ('telemetry','arrival','checkin')
order by occurred_at desc, id desc   -- id is the stable tiebreak when occurred_at ties
```

- **`/operations` — do NOT filter the existing query.** `geoRes` already pages the *whole* `geo_events` table via `collectPostgrestPages`, then filters client-side to `monitoredVisitIds` (confirmed this session — already non-N+1). This query also backs the `latestGeofence` monitoring-table badge, which needs `override`/`deviation` rows too. **Corrected: `geoRes`/`geo` are left exactly as-is, unfiltered. A separate in-memory derivation, `positionGeo = geo.filter(g => monitoredVisitIds.has(g.visit_id) && ["telemetry","arrival","checkin"].includes(g.kind))`, is computed from the already-fetched array and used only for tier-1 selection.** No new query, no query-level kind filter, on this surface.
- **`/operations/live` has no such query today** — this is the one surface where a genuinely new, bounded query is appropriate: one call, `visit_id = any(...)` (or the same page-then-filter pattern for consistency), with the `kind in ('telemetry','arrival','checkin')` filter applied **at the query level** here specifically, since there is no pre-existing shared consumer of an unfiltered `geo_events` fetch on this page to protect — never a per-visit `.eq("visit_id", v.id)` call inside a loop.
- **Deterministic first-per-visit selection**: on `/operations`, reduce `positionGeo` (not `geo`) to one row per `visit_id` by taking the first-seen row in the pre-sorted (`occurred_at desc, id desc`) array — the same "first-seen-per-key wins" pattern already used by the existing `latestGeofence` map (which itself still runs over the full, unfiltered `geo`, unchanged), extended with the `id` tiebreak that map currently lacks. On `/operations/live`, the same reduction runs over the new query's already-kind-filtered result set directly.
- **Explicit error isolation**: if the `geo_events` fetch itself errors (network/RLS/timeout) on either surface, that failure must be captured in the existing `loadErrors`-style array and surfaced as its own distinct banner/state — **it must never be silently interpreted as "no rows found," which would incorrectly downgrade every entity to tier 2/3 as if confirmed absent.** A failed fetch is a fourth, error state, kept separate from the three provenance tiers, and — on `/operations` specifically — a `geoRes` failure already affects `latestGeofence` too, so this is not a new failure mode to design, only a new consumer of an existing one that must not be conflated with "confirmed no permitted-kind observation."

## 6. Loading / empty / error / RLS-degraded behavior

- **Loading**: unchanged skeleton pattern already in `operations/live/loading.tsx` (PR #60 file, not touched by this correction).
- **Empty** (zero monitored visits): unchanged existing empty state.
- **Error**: on `/operations`, `geoRes`'s existing error path (already aggregated into `loadErrors`) now also affects `positionGeo`/tier derivation — unchanged mechanism, new consumer. On `/operations/live`, the new bounded query's failure is added to that page's own `loadErrors`-equivalent. Neither surface may silently downgrade every entity to tier 2/3 on a query failure — it must surface as a distinct error banner.
- **RLS-degraded** (authorized actor, zero RLS-visible permitted-kind rows): if an authorized caller's `geo_events`/`positionGeo` read legitimately returns zero permitted-kind rows for a visit (not because of an error, but because none exist within their visibility), that visit resolves to tier 2 or tier 3 as appropriate — the honest, safe default, not a defect.

## 7. List/map selection behavior

Unchanged from PR #60's existing selection/preview pattern (confirmed in the prior review: "map and list selections open dismissible inspector and factory previews," `web-admin-m3-operations.spec.ts` line ~173) — the tier-3 (unavailable) entities are selectable from the **list** (they remain listed) but have no map pin to select from the map side; the preview panel for a tier-3 entity states the same "location unavailable" reason instead of any coordinate-derived content.

## 8. Responsive / RTL / light-dark / accessibility impact

No new breakpoint or layout change — the three tiers reuse existing list-row and map-pin components, only their label/data content differs. The accessible-list-alternative already required by the design package now doubles as the tier-3 disclosure surface (an entity with no pin is only visible via that list) — this makes the existing "keep the accessible list synchronized with the map" requirement **more load-bearing**, not less: if that list ever silently omitted an entity the map also can't show, tier 3 would have no visible representation at all. No RTL/theme-specific impact beyond ensuring the three new label strings go through the same i18n (`t(...)`) pattern already used for the existing single label.

## 9. Tests — positive / negative / RLS / race

1. **Positive tier 1**: seed a visit with a real `geo_events` row of a **permitted kind** (`telemetry`/`arrival`/`checkin`) → assert the entity renders "Last recorded GPS — not guaranteed live" with the correct timestamp/accuracy, and a map pin at the observed coordinate.
2. **Positive tier 1 exclusion**: seed a visit whose **only** `geo_events` row is `kind = 'override'` or `'deviation'` → assert it does **not** render as tier 1 (falls through to tier 2/3 as appropriate) — proves the kind restriction is enforced, not just documented.
3. **Positive tier 2**: seed a visit with an assignment/schedule and a resolvable `coalesce(planner_lat, official_lat)` but zero permitted-kind `geo_events` rows → assert "Projected from assignment/schedule — not live GPS" and a pin at the coalesced coordinate.
4. **Positive tier 3**: seed a visit with neither → assert the entity **still appears in the list** with the honest reason, and **no** map pin is rendered for it, and the overall entity count in the list matches the query's full result set (not silently reduced).
5. **Negative — no route/ETA regression**: re-run PR #60's existing "renders bounded markers and states without route, ETA, GPS or refresh invention" assertion against the corrected code — must still pass; this correction adds distinct labels, it does not reintroduce a route line.
6. **RLS case A — unauthorized route actor**: a caller whose role fails the existing DSG-CMD-020 route-guard check (§ prior review, `buildShellNavigation`/`operationsDestination.enabled`) hits the existing unauthorized frame **before any operational read runs** — assert zero `visits`/`factories`/`geo_events` queries are issued for that request, exactly the current guard behavior, unaffected by this correction.
7. **RLS case B — authorized actor, zero RLS-visible permitted-kind rows**: an authorized caller whose `geo_read` visibility (re-verify against `0008_visibility_widen.sql`'s exact predicate) legitimately returns zero permitted-kind rows for a visit → assert that visit falls safely to tier 2 or tier 3 (per whatever coordinate data is available) — never an error, never a fabricated tier 1, and distinct from case A (this caller *can* reach the page; they simply see no qualifying position data for this one visit).
8. **`geoRes` non-regression (Regression 1)**: seed an `override`-kind `geo_events` row for a visit → assert the existing `latestGeofence` monitoring-table badge on `/operations` still reflects it correctly (unfiltered `geo` untouched), while that same visit's map/list tier correctly excludes that row from tier-1 eligibility (uses `positionGeo` instead) — proves the two consumers of the same fetched data diverge correctly without a second query.
9. **Component-type fix (Regression 2)**: seed one tier-3 visit alongside tier-1/2 visits on `/operations` → assert (a) `OperationsMapWorkspace` renders exactly the tier-1/2 entries as map markers (via `mappedEntries`), (b) the synchronized list renders **all** entries including the tier-3 one, (c) `GeoMap` never receives a `null`/`NaN` coordinate for any marker, (d) no TypeScript error at the `OperationsMapEntry`/`GeoMarkerData` boundary.
10. **Race/consistency**: two visits sharing the same factory but different `geo_events` recency must each independently resolve their own tier — the derivation must be per-visit, never accidentally shared/cached across visits at the same factory location.
11. **Error isolation (§5)**: simulate a `geo_events` fetch failure → assert every affected entity surfaces the distinct error state, not a false tier-2/3 downgrade.
12. **Query-plan regression (§5)**: assert `/operations` issues its existing single `geoRes` fetch unchanged (no new query added), and `/operations/live` issues its one new bounded, kind-filtered fetch exactly once per page render regardless of monitored-visit count (no per-visit loop).

## 10. Real-browser evidence required (not yet captured)

Screenshot/DOM-read of `/operations/live` (and the Operations Map view) showing all three tiers simultaneously present in one seeded scene, plus the list-view proof that a tier-3 entity is visible there even with no map pin.

## 11. Rollback

Additive/corrective code-only change across the files in §4 — no migration, no schema change (both `geo_events` and the `planner_lat`/`official_lat` coalesce already exist and are unchanged by this packet). Rollback is a plain revert of those files' diff.

## 12. Integration order

This correction depends on PR #60's existing route-guard/no-mutation/five-KPI work already being in place (it corrects one part of that same branch's scope, not a standalone feature) — it should land as a follow-up commit/PR **on top of** wherever PR #60 ends up (same branch after explicit lease transfer, or a dependent branch merged after PR #60, per §1's ownership recommendation), not merged independently of it, since `operations/page.tsx` and `operations/live/page.tsx` are files PR #60 already substantially rewrote.

## 13. Independent-review criteria

Re-verify: (a) the `.not("official_lat", "is", null)` filter is removed from `/operations/live`'s list-level query, and `page.tsx`'s `mapEntries` on `/operations` is built from the full `monitored`/`scopedFactories` source (not from `pins`), in both cases specifically at the list level, not just relaxed for the map; (b) all three tier labels appear verbatim as specified in §3; (c) tier 1 never selects an `override`/`deviation`-kind row (test 2); (d) a tier-3 entity is provably present in the DOM list even with zero pins on the map, on **both** `/operations` and `/operations/live`; (e) `visits.planner_lat`/`planner_lng` are the exact columns referenced; (f) no route/path/animation regression (test 5); (g) `/operations`'s existing `geoRes` query has zero diff (test 8) and `/operations/live`'s new query runs exactly once (test 12); (h) `OperationsMapEntry`'s type change compiles cleanly against `GeoMarkerData` with no `null`/`NaN` leaking into `GeoMap` (test 9); (i) shared `GeoMap` component itself has zero diff.

## 14. Exact file lease

| File | In scope | Change |
|---|---|---|
| `apps/web/src/app/(app)/operations/page.tsx` | Yes | `positionGeo` in-memory derivation; `mapEntries` (and, if included, `regionalMapEntries`) built from full source entities, not from `pins`; tier derivation per §3 |
| `apps/web/src/app/(app)/operations/OperationsMapWorkspace.tsx` | Yes | `OperationsMapEntry` type redefinition (nullable `lat`/`lng` + `provenance`); `mappedEntries` derivation feeding `GeoMap`; list section renders full `entries` unchanged otherwise |
| `apps/web/src/app/(app)/operations/live/page.tsx` | Yes | New bounded, kind-filtered `geo_events` query; remove `.not("official_lat", ...)`; tier derivation |
| `apps/web/src/app/(app)/operations/live/types.ts` | Yes | `LiveInspector`/`LiveFactory` gain `provenance`/nullable coordinates/`observedAt`/`accuracyM`/`scheduledAt`/`coordinateSource` |
| `apps/web/src/app/(app)/operations/live/LiveOps.tsx` | Yes | Three distinct per-entity labels replacing the single generic string |
| `apps/web/src/app/(app)/operations/live/LiveMapInner.tsx` | Yes | Skip pin placement only for `provenance === "unavailable"` entries |
| `apps/web/e2e/web-admin-m3-operations.spec.ts` (or a new M3-scoped spec file, Codex's choice) | Yes | New test cases per §9 |
| **`apps/web/src/components/GeoMap.tsx`** | **Explicitly excluded** | Shared component — no prop/contract change; still receives a plain `GeoMarkerData[]` |
| Any Supabase migration, RLS policy, RPC, or schema | **Explicitly excluded** | No backend change — `geo_events`/`visits.planner_lat`/`factories.official_lat` all already exist as read |
| Any `product-contract/**` file | **Explicitly excluded** | No contract edit performed by this correction |
| `OpsMap.tsx` (`OpsPin` type itself) | **Excluded — unchanged** | `OpsPin` stays exactly as-is (mandatory `lat`/`lng`); `OperationsMapEntry` no longer extends it directly, per §4 |

## 15. Scorecard — authoritative source only

`SAQEEL_REQUIREMENT_SCORECARD.yaml`, re-read fresh this session: `evidence_verified_complete: 0`, `active_evaluation: 39`, `completion_percentage: 0.0`, `confidence: PROVISIONAL`, `last_reconciled_utc: 2026-07-24T23:00:00Z` (unchanged). This packet does not alter any of these numbers.

## 16. Disposition

No application code, PR, branch, live design, database, or product-contract file modified. Correction packet ready, contingent on Codex's ownership decision in §1 (lease transfer vs. dependent branch) before any implementation begins.
