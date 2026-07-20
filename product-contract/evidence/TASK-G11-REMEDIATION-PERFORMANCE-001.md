# TASK-G11-REMEDIATION-PERFORMANCE-001 evidence

- Gate verdict: **FAIL** — app-side remediation is verified, but useful-content performance acceptance is not met.
- Source line integrates `f2b86c4` (measured remediation), `496ed0c`
  (completed-navigation progress guard), and the independent Phase-3 pass on
  the shared `perf/p0-navigation-remediation` branch.
- Requirements: G11 navigation hardening; no MVP1 functional, permission, workflow, audit, tenant or RLS contract weakened.
- Acceptance: `docs/performance/MASTER_PROMPT_P0_PERFORMANCE.md` §6/§9 and the user-mandated 140-check investigation.

## Verified evidence

- Production build and typecheck PASS; shared First Load JS remains 103 kB.
- Baseline and final performance suites each PASS 90/90 samples/destination assertions.
- Corrected focused protected regression PASS 23/23.
- Negative authentication paths PASS in the broader run.
- Visual capture PASS for desktop dark, iPad landscape light and iPad portrait light, before and after.
- Post-audit progress negative path: exact-current links no longer start a
  navigation that cannot complete; route changes clear `aria-busy`. Typecheck,
  production build and 16/16 protected shell/design contracts PASS. A reduced
  production benchmark passed 1/1 across all six warm transitions and confirmed
  no `.ax-route-progress` remained after useful content rendered.
- Raw JSON, CSV, route inventory, 60-P0/140-check register, post-mortem and regression record are under `docs/performance/`.
- Binary evidence is external under the approved documentation root and indexed in `docs/performance/evidence/INDEX.md`.
- The authorized live project `iiozvqntawxfwbgffzqu` was linked after a
  read-only history comparison. Because history is divergent, no broad
  `db push` was used. Only `20260720154210` and `20260721090000` were executed
  directly and recorded as applied. Verification returned all 13 expected
  indexes and all three RLS helpers with the `(select auth.uid())` initplan
  optimization.
- The post-index 90-transition suite PASS 90/90 in 5.3 minutes. Aggregate warm
  p75 improved from 7912 ms to 3838 ms (51.5%) and p95 from 11901 ms to
  4349 ms (63.5%). Operations emitted no statement-timeout errors after apply.

## Failed or blocked acceptance

- All six representative warm routes exceed the 500 ms useful-content p75 target.
- The live migration-history ledger remains divergent from the repository and
  must be reconciled as a separate governed task; broad push remains unsafe.
- No database query plan, React profiler, memory profile, Lighthouse result, full mutation-heavy suite or complete tenant-isolation journey is claimed.
- One Dashboard entity-search regression timed out in the broader focused run and requires reconciliation.

## Next allowed action

Complete the persistent-shell/server-waterfall remediation for Dashboard,
Factories and Reviews, then rerun the same 90-transition benchmark and the
full protected regression before any G11 PASS or canonical integration decision.
