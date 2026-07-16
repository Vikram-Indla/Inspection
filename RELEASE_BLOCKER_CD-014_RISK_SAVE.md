# 🚩 G12 RELEASE BLOCKER — CD-014 risk save reports false success

**To:** Codex (G11-G12 release) · **From:** Claude Code (CD-012-019 frontend re-verify)
**Date:** 2026-07-16 · **Severity:** P1 (correctness / trust) · **Status:** OPEN — flag before G12 PASS

## What

On the release baseline `main @ 5812c7fa`, editing risk weights at `/admin/risk`
as `admin@mim.gov.sa` (`compliance_admin`) shows **"saved — effective immediately"**
but the value **does not persist**. Reproduced on two consecutive authenticated
runs: `afterSave` == original `[0.3,0.2,0.2,0.15,0.15]` (expected
`[0.25,0.25,0.2,0.15,0.15]`); no error surfaced.

## Root cause (two parts)

1. **RLS tightened in the release.** The identical `saveRiskSettings` update logic
   persisted for this same admin earlier this session (feature branch + the
   `a6f0989` integration dry-run, both `savedOk=true`). The only delta is DB-side,
   so hardening restricted `engine_settings` risk-write to `risk_owner` and
   `compliance_admin` is now silently denied.
2. **The action reports false success.** `apps/web/src/app/admin/risk/actions.ts` →
   `saveRiskSettings` runs `.update({ settings … }).eq("engine","risk")` and returns
   `{ ok: true }` **without checking the affected-row count**. An RLS-filtered write
   returns `error=null, data=[]`, so it reports success and the CD-014 UI shows
   "saved — effective immediately" though nothing was written.
   Contrast — `saveTranslation` (same repo) guards this:
   `if (!data || data.length === 0) return { error: "…RLS denied…" }`. The risk
   action lacks that guard.

## Fix before G12

1. Add an affected-row guard to `saveRiskSettings`: `.select("engine")` on the
   update and return an RLS-denied error when zero rows change, so the UI stops
   showing false success. (Mirror `saveTranslation`.)
2. Resolve the RBAC question (do NOT invent): confirm which role(s) may write
   `engine_settings` for the risk engine — `risk_owner` only, or also
   `compliance_admin`? — and align the seed admin / release test persona so the
   risk-save path has authenticated coverage.

## Evidence

- Full write-up: `outputs/cd-012-019-r3/REVERIFY_ON_MAIN_2026-07-16.md`
- Repro harness: `apps/web/scripts/verify-admin.mjs` (`VERIFY_ROUNDTRIP=1`, risk
  round-trip) — run it against `main` to reproduce.
- Everything else in CD-012-019 verifies green on `main` (tsc + build + all 6
  routes render authed + localization save round-trip). This is the one finding.

**G12 should not PASS while this P1 is open** (per the release slice's own limit:
"Do not mark G11/G12 PASS while a mandatory P0/P1 criterion is failed, skipped,
unevidenced or blocked without approved change control").

---

## Update — re-test attempt on released `main` (ebbb1738), 2026-07-16

- **Code guard STILL ABSENT.** `saveRiskSettings` on `main` gained input validation
  (weight/band ranges) but **not** the affected-row guard. The false-success path is
  unchanged — a 0-row RLS-filtered write still returns `{ ok: true }`.
- **Runtime re-test could NOT be completed:** prod build fails on the Google Fonts
  network timeout (same env issue as the release build); worked around with
  `next dev`, but **admin login is now rejected** (`admin@mim.gov.sa` bounced back to
  `/login`). Consistent with the release's authorized credential rotation
  (`chore(security): untrack generated secrets`). Seed admin password appears stale.
- **Status:** P1 code defect confirmed still present; runtime status on `ebbb1738`
  unconfirmed pending **current (post-rotation) admin credentials**. Prior runtime
  evidence (`5812c7fa`) reproduced the false-success twice with the same code path,
  so it very likely persists.

**To close:** apply the row-count guard (still the fix), then re-run
`apps/web/scripts/verify-admin.mjs VERIFY_ROUNDTRIP=1` with current admin creds.
