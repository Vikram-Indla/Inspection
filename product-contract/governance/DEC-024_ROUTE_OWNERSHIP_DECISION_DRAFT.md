# DEC-024 (DRAFT) — CD-024 route & screen-ownership reconciliation

- **Status:** RESOLVED — sponsor (V. Indla) selected **Option C (logical-mode reconciliation)** on 2026-07-15. Recorded as DEC-024 in `decision_register.csv`; `screen_route_catalogue.csv` SCR-WEB-140 row updated. CD-024 implementation is now unblocked (subject to DEC-012 independent audit before closure).
- **Date drafted:** 2026-07-15
- **Decides:** which route owns "Visit Configuration & Assignment" and how the reused screen-IDs are resolved. No option invents policy, weakens accepted behaviour, or fabricates a route.

## The collision (facts)
- **Contract (`screen_route_catalogue.csv`):**
  - `SCR-WEB-120` → `/planning/single` — Single Visit Planning
  - `SCR-WEB-140` → `/planning/:id/configure` — **Visit Configuration & Assignment** (window, type, package, mode, team, conflict panel)
  - `SCR-WEB-150` → `/planning/:id/review` — Plan Review & Publish
- **Currently implemented:** `/planning`, `/planning/bulk` + `/planning/bulk/review`, `/planning/single`, `/planning/immediate`, `/planning/plans` + `/planning/plans/[id]` (read-only).
- **Gap:** `/planning/:id/configure` (SCR-WEB-140) and `/planning/:id/review` (SCR-WEB-150) are **not implemented as live routes**. Their configuration/review capability currently lives inside `/planning/bulk/review` and is echoed read-only in `/planning/plans/:id`. Screen-IDs SCR-WEB-120/140 were reused across the bulk/single flows — the "governed screen-ID collision."
- **Consequence:** CD-024 is `BLOCKED_UPSTREAM`; no route/lifecycle was invented pending this decision.

## Options

### Option A — Build the dedicated contract route `/planning/:id/configure` (SCR-WEB-140)
Implement the standalone per-plan configuration & assignment workspace exactly as the contract catalogue specifies; refactor `/planning/bulk/review` to hand off into it; keep `/planning/plans/:id` read-only; add `/planning/:id/review` (SCR-WEB-150) for publish.
- **Pros:** fully contract-faithful; clean per-plan URL; matches SCR-WEB-140/150 as written.
- **Cons:** most work; changes the accepted CD-021 bulk-review flow (regression risk to a PASSED slice); two new dynamic routes to wire + audit + test; must re-certify CD-021/022 handoffs.

### Option B — Route-neutral change control: adopt current routes as canonical
Amend `screen_route_catalogue.csv` so SCR-WEB-140/150 capability is **owned by the existing** `/planning/bulk/review` (+ `/planning/single` configure step) and read-only `/planning/plans/:id`; retire the standalone `/planning/:id/configure` and `/planning/:id/review` contract routes; re-map the reused screen-IDs to the live routes.
- **Pros:** least work; no new routes; preserves the PASSED CD-021/022 flows unchanged; **precedent exists** — CD-030 accepted a route-neutral CR (DEC-013).
- **Cons:** requires a frozen-artifact change-control edit to the route catalogue; per-plan deep-link (`/planning/:id/configure`) is lost; SCR-WEB-140 no longer a distinct screen.

### Option C — Logical-mode reconciliation (hybrid)
Keep the current live routes, but expose SCR-WEB-140 configuration as a **logical mode inside an existing route** (e.g. `/planning/plans/:id?mode=configure`) rather than a live `/planning/:id/configure` URL — mirroring the admin CD pattern (CD-006/009/011 logical modes). Assign SCR-WEB-140 to that mode; keep bulk/review + read-only plans; the standalone contract URL renders as a disabled/annotated target.
- **Pros:** consistent with the platform's established "logical mode inside consolidated route" pattern; no accepted-flow regression; preserves a per-plan entry point without a new top-level route; smaller change-control note than B.
- **Cons:** SCR-WEB-140 is a mode, not a dedicated route; still needs a recorded catalogue annotation; slightly more work than B.

## Recommendation
**Option C** — it reconciles the collision without regressing the PASSED CD-021/022 slices, reuses the platform's own logical-mode precedent (admin vertical) and the route-neutral CR precedent (DEC-013), and keeps a per-plan configuration entry point. Option B is the fallback if a change-control edit to the route catalogue is preferred over any per-plan mode. Option A only if the sponsor requires the literal SCR-WEB-140/150 dedicated routes despite the CD-021 regression cost.

## On selection
Record the chosen option as DEC-024 in `decision_register.csv`, update `screen_route_catalogue.csv` per the choice (B/C), then CD-024 implementation is unblocked within TASK-BASELINE-WIRING-AUDIT-001. No implementation proceeds until this is recorded.
