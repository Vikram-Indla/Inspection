# Parked Items — Admin Control Plane vertical (CD-004…CD-011)

Recorded 2026-07-15. Implementation is code-complete, verified, and landed on
`origin/setup/Inspection` (contains commit `4e24096`). The items below are
deferred by sponsor direction ("park migrations and e2e, move on") and remain
open until credentials / a test environment are provided.

## PARK-1 — RESOLVED 2026-07-15 ✅ (Supabase token supplied)
The 4 admin AR migrations + the CD-024 AR migration were applied live to
`iiozvqntawxfwbgffzqu` via the Management API (guarded `ui_strings` upserts).
Verified live: admin.viol 101, admin.items 115, admin.reg 90, admin.pkg 79,
plan.review.e* 31 — 503+ admin strings now carry reviewed-pending Arabic. Arabic no
longer falls back to English at runtime. Original detail below (historical).

## PARK-1 (historical) — Apply the 4 admin `ui_strings` AR migrations to live Supabase
- Migrations (authored, NOT applied):
  - `supabase/migrations/20260715100000_cd005_cd006_ar_strings.sql`
  - `supabase/migrations/20260715101000_cd007_ar_strings.sql`
  - `supabase/migrations/20260715102000_cd010_cd011_ar_strings.sql`
  - `supabase/migrations/20260715103000_cd008_cd009_ar_strings.sql`
- Blocker: no `SUPABASE_ACCESS_TOKEN` / DB password in this session; `supabase login`
  is interactive. Project linked = `iiozvqntawxfwbgffzqu`.
- Effect until applied: Arabic admin labels fall back to English at runtime
  (guarded upserts seeded `status='draft'`; CD-005/006 machine-AR keys await human review).
- To unblock: provide a Supabase access token (or run `supabase db push` interactively),
  then re-verify with `supabase migration list`.

## PARK-2 — Execute the 4 admin Playwright e2e specs
- Specs (authored + parse-verified, NOT executed):
  - `apps/web/e2e/cd-005-006-regulations.spec.ts`
  - `apps/web/e2e/cd-007-items.spec.ts`
  - `apps/web/e2e/cd-008-009-packages.spec.ts`
  - `apps/web/e2e/cd-010-011-violations.spec.ts`
- Blocker: no local Supabase stack + no e2e test credentials/seed. The only DB is the
  live project — mutating admin specs would pollute production data.
- To unblock: a local `supabase start` stack (or a throwaway test project) + seed +
  test-user creds, then `npm run test:e2e`.

## Also still open (separate go)
- Cloud deploy — no deploy config (`vercel.json` absent), no platform creds.
- `main` baseline — gated on the incomplete `TASK-BASELINE-WIRING-AUDIT-001`
  reconciliation (`REMEDIATION_INCOMPLETE_EXTERNAL_BLOCKERS`).

Authorization context: `product-contract/governance/DEC-ADMIN-CONTROL-PLANE-AUTH.md`.
