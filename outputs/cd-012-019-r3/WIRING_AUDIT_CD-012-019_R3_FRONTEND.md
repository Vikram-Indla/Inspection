# CD-012 → CD-019 — design-of-record retarget R2 → R3

## Finding: R3 product design is byte-identical to R2

Every runtime file in `outputs/cd-012-019-r3/` is an exact copy of its
`outputs/cd-012-019-r2/` counterpart (MD5-verified):

`cd12.js … cd19.js`, `cd12-register.js`, `cdm-common.js`, `cdm-stage.js`,
`cdm-frame.css`, `support.js`, `saqeel-astryx.css`, `saqeel-tokens.css`,
`export.html` — all IDENTICAL. The only difference in the R3 `.dc.html` shell is
a stale `R2` label in the harness brand line; it loads the same screen modules.

**Consequence:** the delivered R3 bundle renders the same eight screens, same
states, same DOM/markup as R2. The frontend implementation on this branch is
therefore already the R3 implementation — no screen-level reimplementation is
possible without inventing changes the design does not contain.

## R3 correction items vs what shipped

The repo's `CD-012_019_R2_REVIEW_AND_R3_CORRECTION.md` required for R3:
1–6. Package hygiene — native-size PNG exports, source discovery/receipts, three
rendered candidates per screen, clean single-root archive. These are
design-package deliverables, not product-UI changes, and do not affect app code.
7. Visual refinements — reduce technical microcopy on the main surface (move full
prerequisite lists to a detail/evidence panel), strengthen dark-theme hierarchy,
verify light-theme border/muted contrast, rebuild the 412 view as a true narrow
composition.

**Item 7 is NOT present in the delivered R3 runtime files** — they are identical
to R2, so none of those visual refinements were applied in the design source.

### Item-7 intent applied (sponsor-authorized, authored-by-implementer)

Commit `7f849f6`:
- **#1 reduce technical microcopy → detail panel — DONE.** `NotYetBoundary` main
  surface now shows only the plain-language consequence; the technical seam id +
  full prerequisite list moved behind a collapsible "Why / prerequisites"
  disclosure. Applied to every boundary (audit ×2, access ×2, risk, workflows).
- **#2 dark-theme hierarchy / #3 light contrast — SCOPED OUT.** These require
  retuning the global Astryx/DEC-011 tokens, which are frozen and shared
  app-wide; changing them here risks other screens. Only the added components
  (`.lz-*`, `.nya`, `.rk-*`) establish local hierarchy with existing tokens.
- **#4 true-412 narrow — already handled.** `.lz-row` collapses to one column
  <900px; boundary grids use `auto-fit minmax(280px,1fr)` → single column narrow.

No rendered golden target existed for R3, so #1 is implementer design judgment,
reviewable per screen.

## Status

Design-of-record for this branch = **R3**. Implementation unchanged from the R2
pass (see `../cd-012-019-r2/WIRING_AUDIT_CD-012-019_R2_FRONTEND.md` for the
per-slice map).

## Runtime verification (2026-07-15, env available)

Env wired from the main checkout's `.env.local` (Supabase URL reachable, health
401 as expected without apikey).

- **`next build` — PASS (exit 0).** All routes compile; every touched admin
  route emits as dynamic server-rendered (`/admin/{localization,audit,risk,
  workflows,access,gis}`). Confirms client/server boundaries (`RiskForm`),
  `NotYetBoundary` imports, and client→server-action wiring resolve with no RSC
  violations. Only warning: benign workspace-root lockfile inference (pre-existing).
- **Live server (`next start`) route check — PASS.** All six admin routes load
  without a 500. Five 307-redirect to `/login` unauthenticated; `/admin/
  localization` returns 200 then client-redirects to `/login` (`Router`) — a
  redirect-mechanism quirk, **not** an auth bypass and **not a data leak**
  (unauth body carries 0 `lz-row`, 0 `visits.*` keys). Guard is `Shell.tsx:14`
  `if (!user) redirect("/login")`, unchanged by this branch — pre-existing.

### Still NOT verified
Authenticated behavioral driving of the admin surfaces (render the localization
`lz-row` grid, exercise live placeholder-diff / Save-disable, risk weights-sum,
workflow SoD guard, boundary disclosures). Seeded users are non-admin
(planner / inspector / ops) — they pass the login guard but hit RLS-empty data on
control-plane tables, so driving them proves little. **Admin-role credentials or a
seeded admin user are required** to complete the DEC-012 runtime audit.
