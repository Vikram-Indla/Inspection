# CD-004 R2 — imported design pack (provenance)

**Source:** Claude Design project `90d4620c-118f-4359-8b3e-767d37d3cabd`
("Admin Control Plane Home"), file `CD-004 Admin Control Plane Home R2.dc.html`.
**Imported:** 2026-07-15 — design MCP (DesignSync) auth for this session was bound to the
JK account, which could not reach the project; after the project was shared to JK the MCP
auth token expired mid-session and `/design-login` is unavailable non-interactively, so the
pack was delivered to disk (Option A) and worked from `outputs/cd-004/`.

## What this folder holds
The full CD-004 R2 design pack (design `.dc.html`, frame PNGs, data-truth ledger, wiring map,
state matrix, a11y spec, component/role matrices, localization inventory, acceptance checklist,
handoff, manifest, review notes), plus:
- `CD-004_WIRING_AUDIT.md` — **new**: independent DEC-012 wiring audit for the implemented slice.
- `README_IMPORT.md` — this provenance note.

## Implementation (branch `setup/Inspection`)
Route `/admin` (SCR-ADM-001) rebuilt from the KPI wall into the Configuration Evidence Spine:
per-source result modelling (verified-with-count / verified-zero / unavailable), a true
`<table>` evidence spine, link-only family band (existing routes only), server-roles scope band,
and a read timestamp fact — with no health verdict, no invented value, and no mutation affordance.
- `apps/web/src/app/admin/page.tsx` — modified.
- `supabase/migrations/20260715090000_cd004_ar_strings.sql` — Arabic `ui_strings` seed (guarded, draft).
- `apps/web/e2e/cd-004-admin-control-plane-home.spec.ts` — runtime + code-layer (DEC-012) suite.

BLOCKED legs (admin-family route guard W03, per-source retry W10, per-destination module
behavior W12–W20, proposed provenance/draft-queue reads) are preserved as BLOCKED — not built.
See `CD-004_WIRING_AUDIT.md` for the row-by-row status and the frozen-shell reconciliations.

`main` was not touched; nothing merged or pushed.
