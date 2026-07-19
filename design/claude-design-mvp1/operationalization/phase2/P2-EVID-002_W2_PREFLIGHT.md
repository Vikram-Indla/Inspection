# P2-EVID-002 — Wave 2 Preflight

Commit `1422127`. Dev server confirmed live at `http://127.0.0.1:3000`
(matches the batch's `base_url`; a second instance also runs on `:4314` from
earlier waves — using `:3000` per assignment).

## Method

Read each route's `page.tsx` in full, traced every server call before
render, and checked any RPC's actual SQL definition in the migration that
creates it (not just its name) for `stable`/read-only vs. mutating
semantics — same method as Wave 1, which caught two real mutators
(`expire_lapsed_visits`, `expire_stale_geo_override_requests`) that a
name-only read would have missed.

## Per-screen route truth and verdict

| Screen | Route (contract) | Route (actual) | On-load calls | Verdict |
|---|---|---|---|---|
| SCR-ADM-010 | `/admin/regulations` | same | `admin_configuration_audit(text,uuid)` RPC, conditional on `isWriter && detailId` | **SAFE** — RPC is `stable` (`supabase/migrations/20260715200000_cd006_011_backend_completion.sql:516`), a pure `select ... from audit_events`, no write possible |
| SCR-ADM-011 | `/admin/regulations/:id` | `/admin/regulations?id=<uuid>` (query-string detail mode; a `regulations/[id]` route folder also exists but the page's own logic implements detail via `?id=`) | Same audit RPC as above, same stable guarantee | **SAFE** |
| SCR-ADM-020 | `/admin/items` | same | Same `admin_configuration_audit` RPC, same stable guarantee | **SAFE** |
| SCR-ADM-030 | `/admin/packages` | same | No RPC call found | **SAFE** |
| SCR-ADM-031 | `/admin/packages/:id/designer` | **no such route exists** — "Package designer" is a client-side editor rendered inline within `/admin/packages` after a user selects a package (not a distinct URL or query-string mode) | n/a | **BLOCKED — cannot reach via GET navigation alone; requires a client-side selection interaction, which this wave's capture rule (no interaction beyond navigation/locale/theme) does not authorize** |
| SCR-ADM-040 | `/admin/violations` | same | Same `admin_configuration_audit` RPC (twice: violation_codes + penalty_mappings), same stable guarantee | **SAFE** |
| SCR-ADM-041 | `/admin/penalties` | **no such route exists** — the code's own comment says penalty mapping "is a LOGICAL mode inside this route (`?mode=penalty`) — the contract route `/admin/penalties` is [consolidated]"; actual URL is `/admin/violations?mode=penalty` | Same as SCR-ADM-040 | **SAFE** (via the real query-string route) |
| SCR-WEB-110 | `/planning/bulk` | same | No RPC call found | **SAFE** |

## Real IDs sourced (read-only, bypassing no mutating page)

- Regulation detail (`SCR-ADM-011`): `a0000000-0000-4000-8000-000000000001`
  (code `SBC-801`), sourced via a direct PostgREST `GET
  /rest/v1/regulations?select=id,code&limit=1` — never navigated the list
  page's own detail-selection flow.

## Route-catalogue discrepancies found (worth flagging, not fixed here)

`product-contract/screens/screen_route_catalogue.csv` lists `/admin/packages/:id/designer`
and `/admin/penalties` as real routes. Neither exists as a literal URL in
the running app: the designer is a client-side view inside `/admin/packages`,
and penalty mapping is `/admin/violations?mode=penalty`. This is a catalogue
accuracy gap, not a product defect — flagging for Codex/catalogue-owner
correction, not editing the catalogue myself (out of this batch's authorized
scope).

## Capture plan (6 of 8 screens proceed; 1 blocked; 1 was reused/held from Wave 1's scope)

7 SAFE screens will be captured across the 6 named profiles (A-F, no G/H
wallboard this wave): SCR-ADM-010, SCR-ADM-011, SCR-ADM-020, SCR-ADM-030,
SCR-ADM-040, SCR-ADM-041, SCR-WEB-110. SCR-ADM-031 is BLOCKED as above.
