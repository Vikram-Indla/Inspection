# TASK-G11-REMEDIATION-PERFORMANCE-001 evidence

- Gate verdict: **FAIL** — app-side remediation is verified, but useful-content performance acceptance is not met.
- Source commit: `f2b86c4` on `perf/p0-navigation-remediation--codex-pass`.
- Requirements: G11 navigation hardening; no MVP1 functional, permission, workflow, audit, tenant or RLS contract weakened.
- Acceptance: `docs/performance/MASTER_PROMPT_P0_PERFORMANCE.md` §6/§9 and the user-mandated 140-check investigation.

## Verified evidence

- Production build and typecheck PASS; shared First Load JS remains 103 kB.
- Baseline and final performance suites each PASS 90/90 samples/destination assertions.
- Corrected focused protected regression PASS 23/23.
- Negative authentication paths PASS in the broader run.
- Visual capture PASS for desktop dark, iPad landscape light and iPad portrait light, before and after.
- Raw JSON, CSV, route inventory, 60-P0/140-check register, post-mortem and regression record are under `docs/performance/`.
- Binary evidence is external under the approved documentation root and indexed in `docs/performance/evidence/INDEX.md`.

## Failed or blocked acceptance

- All six representative warm routes exceed the 500 ms useful-content p75 target.
- Operations repeatedly times out on corrective-action and geo-override-evidence reads.
- `supabase migration list --linked` reports no project ref; the forward migration is committed but unapplied and unverified remotely.
- No database query plan, React profiler, memory profile, Lighthouse result, full mutation-heavy suite or complete tenant-isolation journey is claimed.
- One Dashboard entity-search regression timed out in the broader focused run and requires reconciliation.

## Next allowed action

Link the approved Supabase environment, reconcile migration history, run advisors, apply and verify `20260720154210_g11_navigation_performance_indexes.sql`, capture query plans, then rerun the same 90-transition benchmark and the full protected regression before any G11 PASS decision.
