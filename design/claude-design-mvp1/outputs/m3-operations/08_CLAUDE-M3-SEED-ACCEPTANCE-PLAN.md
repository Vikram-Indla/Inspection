# M3 seed-lease implementation acceptance plan (read-only, no code/DB/migration/design writes)

Companion to `07_CLAUDE-M3-SEED-IMPLEMENTATION-READINESS-002.md`. Defines the exact checks the eventual implementation lease must pass before this seed packet is treated as evidence-complete. Nothing in this file is executed by this session.

## 1. Positive path

- Run `npm run seed:m3-ops` once against the approved non-production project. Assert exit code 0 and the script's own stdout validation block (§6 of `07_...`) reports the expected counts: 3 governed KPI visits at their 3 target `operational_state` values (via `set_operational_state`, not direct write), 1 SLA-breach visit, 1 overdue `action_forms` row, 1 failed `notifications` row, 1 pending `geo_override_requests` row (or a genuine `0` if §4's runtime reason-key check fails closed — both are pass conditions, an exception is not), 3 map-provenance-tier fixtures.
- Re-run `npm run seed:m3-ops` a second time immediately. Assert every row's fingerprint-match branch (§2 of `07_...`) fires — no hard-fail, no duplicate rows created, counts unchanged from the first run (idempotent re-run, not accumulation).

## 2. Unauthorized path

- Attempt `set_operational_state(<fixture visit id>, 'on_the_way')` as the `planner` or `ops` persona (not the assigned `inspector`) → assert `RBAC-009` exception ("Not the assigned inspector for this visit"), zero row change.
- Attempt `request_geo_override(...)` as a persona other than the visit's assigned inspector → assert the same class of `RBAC-009` rejection, zero row created.
- Attempt a direct `POST geo_override_requests` (bypassing the RPC) as any of the three personas → assert HTTP 403/RLS denial (no insert grant exists — confirmed `07_...` §1/§4 of the original packet), proving the "no direct insert" finding is not just a reading of migration text but an observed runtime rejection.

## 3. Collision path

- Before running the real script, manually insert one row at a reserved `f8...`-block ID with a **mismatched** fingerprint field (simulating an unrelated pre-existing row). Run the seeder → assert it hard-fails immediately naming the exact table/ID/field (per `07_...` §2), and assert **zero** rows were written for the rest of that run (all-or-nothing failure, not partial silent completion).
- Separately, pre-run the seeder once normally, then re-run it → assert every row's fingerprint **matches** and the idempotent-refresh branch fires (distinguishing this from the mismatch case above) — proves the fingerprint check discriminates correctly in both directions, not just fails safe in one.

## 4. Missing-reason path

- Before running the seeder, temporarily note (do not alter) the live `engine_settings.field.geo_override_reasons` shape. If `safety_security` is present: run normally, confirm the override-pending fixture is created. If a test project has it removed/renamed: run the seeder → assert it skips only the override-pending fixture, logs the exact reason (`07_...` §4), completes every other fixture successfully, and the Active Alerts breakdown shows a genuine `0` for "Overrides pending" — never an invented fallback reason key, never a script-level failure of the whole run over this one missing config entry.

## 5. Transition-rejection path

- Attempt `set_operational_state(<fixture visit id>, 'executing')` while the visit is still at `new` (skipping `on_the_way`/`arrived`) → assert the `STM-OPS` "Illegal operational transition" exception fires, zero state change — proves the seeder's sequential-call design (§5 of `07_...`) is necessary, not optional, and that the RPC itself (not just the seeder's discipline) is the actual enforcement point.
- Attempt to replay `set_operational_state(<visit>, 'on_the_way')` a second time after the visit is already at `on_the_way` → assert idempotent no-op return (per the function's own `if cur = p_next then return cur` branch), not an exception — confirms safe retry behavior the seeder's re-run logic depends on.

## 6. Empty/unavailable path

- Confirm the "location unavailable" map-provenance tier 3 fixture (null `official_lat`/`official_lng` factory, no `geo_events`) renders the exact "Location unavailable" state from `05_CLAUDE-M3-MAP-DESIGN-UPDATE-001` §2 tier 3 — not a blank map pin, not a silently dropped entity, not a `0,0` coordinate default.
- Confirm Submitted Today remains `unavailable / decision required` after seeding (must NOT flip to a number just because other fixtures exist) — this is the single most important negative assertion in this whole plan, since it is the one KPI this packet must never accidentally make appear governed.
- Confirm the Active Alerts card itself still renders `unavailable / decision required` as its own value (not a sum) even though its four supporting counts are now non-zero — the card value and the supporting breakdown must remain visually and semantically distinct (per package Revision 3 §3).

## 7. Browser-result checks (the actual delivery gate, per `SAQEEL_OPERATING_SYSTEM.md` §6)

Whoever holds the eventual implementation/browser-review lease must independently confirm, in the real running app, not just via the script's own stdout:
- `/operations` (ops/leadership persona): 5 KPI cards render — 3 real non-zero counts reflecting the fixtures, 2 still `unavailable / decision required`; Active Alerts context line shows the 4 incremented supporting counts.
- `/operations/live`: the 3 provenance-tier fixtures each render their exact required label (tier 1 "Last recorded GPS — not guaranteed live", tier 2 "Projected from assignment/schedule — not live GPS", tier 3 "Location unavailable" + reason) — no route line, no ETA, anywhere.
- Re-run this same browser check in EN/LTR and AR/RTL, light and dark, at the 6 named viewports from the M3 design package's required-state matrix — the fixture data itself does not need re-seeding per locale/viewport, only the rendering does.
- Console/network health: zero unhandled errors from the new fixture rows specifically (distinguish from any pre-existing, unrelated console noise).

## 8. Disposition

Acceptance plan complete, read-only, no execution performed. Ready to gate the eventual implementation lease for `07_CLAUDE-M3-SEED-IMPLEMENTATION-READINESS-002.md`.
