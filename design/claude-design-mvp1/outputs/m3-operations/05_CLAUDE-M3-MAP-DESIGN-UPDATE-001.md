# CLAUDE-M3-MAP-DESIGN-UPDATE-001

Direction: M3-SPONSOR-DIRECTION-20260725, item (2) LIVE MAP.
Supersedes: package Revision 3, `02_OPERATIONS_LIVE_CORRECTION_SPEC.md` §1 (single "Projected route — not live GPS" label) and the open route-trail-vs-no-route conflict recorded in `00_..._CORRECTION_PACKAGE.md` §0 item 6/§5.

## This sponsor decision resolves the open conflict

Revision 3 recorded an unresolved conflict: `AUTHENTICATED_LIVE_OPERATIONS_MAP.md` asked for a route trail; `SPC-CMD-005` requires no route/navigation in Phase 1. The sponsor's ruling here is explicit and final for M3: **do not draw a projected route or fabricate ETA in this phase.** This is compliant with SPC-CMD-005 and overrides the system prompt's route-trail request. The conflict is now **CLOSED** — no further sponsor input needed on this specific point.

## Corrected three-tier disposition (replaces the single "Projected route" label)

For each inspector/visit entity shown on `/operations/live` (and the Operations Map view of `/operations`), the map/list must resolve to exactly one of three states, in this priority order:

1. **Real observed position exists** — the latest permitted immutable `geo_events` row for the visit's journey (`kind = 'telemetry'|'arrival'|'checkin'`, real table confirmed this session: `supabase/migrations/0001_foundation.sql` lines 186-196 — `observed_lat`, `observed_lng`, `accuracy_m`, `occurred_at`, all real columns, RLS-enabled). Label: **"Last recorded GPS — not guaranteed live"**, showing the recorded timestamp (`occurred_at`), accuracy (`accuracy_m`) when present, and provenance (which `kind` of event, e.g. "from arrival check-in").
2. **No geo_event, but an assignment/schedule exists** — the visit has a real `assignments`/`visits.window_start` and a governed factory or dispatch location (`factories.official_lat/official_lng`, confirmed real columns per `page.tsx` lines 407-424). Label: **"Projected from assignment/schedule — not live GPS"**, showing source/provenance (factory's official location vs. a dispatch point, whichever is real) and the scheduled time (`window_start`).
3. **Neither exists** — the entity stays visible in the operational list (never silently dropped) and shows **"Location unavailable"** plus the specific missing-data reason (e.g. "no geo_event and no assignment window recorded").

No route line, path, or ETA is drawn in any of the three states — this applies uniformly to `/operations/live`'s full map and `/operations`' Operations Map view (both corrected the same way, since both currently reference the same map component/data pattern per the M3 package's shared-component analysis).

## Correction to Revision 3 files

- `02_OPERATIONS_LIVE_CORRECTION_SPEC.md` §1: replace the single mandatory label with the three-tier disposition above. The exact string `Projected route — not live GPS` is retired — replaced by `Projected from assignment/schedule — not live GPS` for tier 2 specifically (tier 1 and 3 have their own distinct labels; no single label covers all cases anymore).
- `02_OPERATIONS_LIVE_CORRECTION_SPEC.md` §2 "Reduced motion" row: the `lv-dash`/route animation concern is now moot — no route is ever drawn, so there is nothing to gate behind `prefers-reduced-motion` for a trail. The reduced-motion requirement still applies to any marker-ping/breathe animation (`lv-ping`, `lv-breathe`), unchanged.
- Package `00_M3_OPERATIONS_DESIGN_CORRECTION_PACKAGE.md` §0 item 6 and §5: mark the route/no-route conflict **RESOLVED by M3-SPONSOR-DIRECTION-20260725** — no longer an open decision.

## Seed requirement (three deterministic cases, per sponsor direction)

1. One visit with a real `geo_events` row → renders tier 1 ("Last recorded GPS").
2. One visit with a real assignment/schedule but zero `geo_events` rows → renders tier 2 ("Projected from assignment/schedule").
3. One visit with neither → renders tier 3 ("Location unavailable"), confirmed still present in the operational list, not hidden.

These three cases extend `CLAUDE-M3-SEED-SOURCE-MAP-001`'s seeding approach (same persona-authenticated, RLS-respecting, deterministic-UUID pattern) — not a separate seeding mechanism.

## Disposition

Design-update specification ready. No Claude Design page edited this session (no write access proven for a project hosting these exact pages beyond the already-verified WA-DES-033-C3/034-C3 read — applying this correction to those live pages is the next Claude Design action, pending Codex routing).
