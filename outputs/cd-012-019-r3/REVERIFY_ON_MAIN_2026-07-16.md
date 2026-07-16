# CD-012→019 re-verify against `main` (release baseline) — 2026-07-16

`origin/main = 5812c7fa` ("certify G10 and record open release gates"), which
Codex promoted from `codex/g11-g12-integration`. **main already contains the
CD-012-019 frontend** (Codex reconciled it in via `e61cf47 merge: reconcile full
MVP1 release candidate`) — including the risk-500 fix. So this is a re-verify of
the shipped baseline, not a rebase.

Worktree `Inspection-reverify`, branch `reverify/cd012-019-on-main` (local, unpushed).

## Results

- **Static:** `tsc --noEmit` PASS; `next build` PASS (all 6 admin routes compile).
- **Authenticated drive (admin seed):** all 6 routes render 200.
- **CD-018 localization `saveTranslation` round-trip:** PASS (save→restore).
- **CD-014 risk `saveRiskSettings` round-trip:** **FAIL — real, reproduced twice.**

## Finding — risk save silently reports success without persisting (release regression)

On `main`, editing risk weights as `admin@mim.gov.sa` (`compliance_admin`):
- The UI shows success; **no error is surfaced**.
- But the value does **not** persist: `afterSave` == original `[0.3,0.2,0.2,0.15,0.15]`
  (expected `[0.25,0.25,0.2,0.15,0.15]`), reproduced on two consecutive runs.

Root cause (two-part):
1. **RLS tightened in the release.** The identical `saveRiskSettings` update
   logic persisted for this same admin earlier this session (savedOk=true on the
   feature branch and on the `a6f0989` dry-run). The only delta is DB-side, so the
   release hardened `engine_settings` write access — `compliance_admin` no longer
   has the risk-write scope (`risk_owner` / RBAC-004).
2. **The action reports false success.** `saveRiskSettings` does
   `.update(...).eq("engine","risk")` and returns `{ ok: true }` **without checking
   the affected-row count**. An RLS-filtered write returns `error=null, data=[]`, so
   the action reports success and the CD-014 UI shows "saved — effective
   immediately" though nothing was written.
   Contrast: `saveTranslation` guards this (`if (!data || data.length === 0) return
   { error: "…RLS denied…" }`). The risk action lacks the guard.

## Impact & ownership

- User-facing: a risk-config editor is told a save succeeded when it was silently
  denied — a trust/correctness defect (P1-class) in the release baseline.
- **Not fixed here.** `saveRiskSettings` is shared backend (Codex's lane, not the
  CD-012-019 frontend slice), and the underlying RBAC question — *should*
  `compliance_admin` write the risk engine, or is `risk_owner`-only correct? — is a
  policy decision that must not be invented.

## Recommended fix (backend / release lane)

1. Add an affected-row guard to `saveRiskSettings` mirroring `saveTranslation`:
   select the updated `engine` and return an RLS-denied error when zero rows change,
   so the UI stops showing false success.
2. Resolve the RBAC question: confirm which role(s) may write `engine_settings`
   for the risk engine, and align the seed admin / test persona accordingly.

Everything else in CD-012-019 verifies green on the release baseline; this single
risk-save trust defect is the one finding.
