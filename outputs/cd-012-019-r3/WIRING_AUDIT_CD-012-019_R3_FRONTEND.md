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

### Authenticated driving — DONE (admin seed account, `scripts/verify-admin.mjs`)

Logged in through the real `/login` UI as `admin@mim.gov.sa` (role
`compliance_admin`), drove all six surfaces headless (Chromium), asserted R2/R3
DOM markers, captured full-page screenshots.

| Screen | Route | Result |
|---|---|---|
| CD-018 | `/admin/localization` | **PASS** — 1000 `.lz-row` rendered with live `ui_strings`; KPIs 1000/958/0/96 %; AR input + Save + status lozenge + Mark reviewed + history per row; **AR-length risk hint fires** ("Arabic runs long — check narrow layouts") |
| CD-014 | `/admin/risk` | **PASS after fix** — 5 `.rk-driver`, live `.rk-sum`, `.rk-band` strip |
| CD-012/013 | `/admin/workflows` | PASS — renders, no error |
| CD-019 | `/admin/audit` | PASS — `.nya` ×2 boundaries render |
| CD-017 | `/admin/access` | PASS — `.ax-table` + `.nya` ×2 |
| CD-015 | `/admin/gis` | PASS — renders |

**Bug found + fixed by this pass:** `/admin/risk` threw a 500 (Server Components
render error) — `labels.factorName` was a function prop crossing the server→client
boundary. `tsc` and `next build` both passed; only the authenticated live render
exposed it. Fixed in `fix(cd-014)` (resolve names server-side). Re-verified green.

### Save round-trip — DONE (CD-018, `VERIFY_ROUNDTRIP=1`)

Non-destructive end-to-end mutation test through the real UI:
- Edited `admin.access.banner.body` Arabic via the row's input + Save →
  `saveTranslation` server action → `ui_strings` write (RLS, `compliance_admin`)
  → reload confirms the edited value **persisted** (`savedOk: true`).
- Status correctly flipped to **DRAFT** on the Arabic edit (contract behavior:
  any AR change returns the string to draft).
- Original value **restored** afterwards (`restoredOk: true`) — the store is left
  exactly as before the test.

Save-wait was hardened to wait for the row's "saved" success lozenge /
networkidle rather than a fixed timeout (an initial fixed-timeout version flaked
under load); re-verified green on repeated runs.

### Workflow maker-checker SoD — DONE (CD-012, `VERIFY_WF_SOD=1`)

Publish is irreversible (immutable published version, changes live config, no
delete), so — with sponsor sign-off — the negative path was verified instead:
- Admin proposes a draft (`proposeWorkflowDraft` write) → `proposed: true`,
  `statusIsDraft: true`.
- The CD-012 separation-of-duties guard renders on the admin's own draft
  (`sodGuardShown: true`) and the "Approve & publish" button is **absent**
  (`selfApproveBlocked: true`) — RBAC-002 maker-checker enforced in UI ahead of
  the DB constraint.
- **Side effect cleaned:** the one DRAFT row it created (`RT-SOD-2026-07-15T20-45-07-385Z`,
  id `3d4b95c2-bdeb-4c31-a239-e520560ac3dc`) was deleted by the DB owner via the
  Supabase SQL editor (scoped `delete … where version_label = '…' and status='draft'
  and engine='workflow'`; re-select returned 0 rows). Store left clean.

### Risk-weights save — DONE (CD-014, `VERIFY_ROUNDTRIP=1`)

Reversible end-to-end write: moved 0.05 between two factors keeping Σ = 1.00 →
`saveRiskSettings` → `engine_settings` write → reload confirms persisted
(`savedOk`) → restored exact original weights (`restoredOk`), store unchanged.
`rlsDenied: false` — the `compliance_admin` session can write the risk engine.
Original `[0.3,0.2,0.2,0.15,0.15]` → saved `[0.25,0.25,0.2,0.15,0.15]` → restored
`[0.3,0.2,0.2,0.15,0.15]`.

### Write-path coverage summary
- CD-018 localization `saveTranslation` — round-trip PASS (persist→draft→restore)
- CD-014 risk `saveRiskSettings` — round-trip PASS (persist→restore, Σ-guard live)
- CD-012 workflow maker-checker — SoD negative path PASS (propose→self-approve blocked)

Still not E2E-exercised (by design / risk): a successful workflow *publish*
(irreversible; needs a second user as maker).
