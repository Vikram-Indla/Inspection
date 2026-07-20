# Inspection performance remediation handover

- Task: TASK-G11-REMEDIATION-PERFORMANCE-001
- Gate: G11 hardening; acceptance remains FAIL due useful-content p75 and unapplied DB work.
- Branch: perf/p0-navigation-remediation--codex-pass
- Latest verified source commit: `496ed0c` (completed-navigation progress guard)
- Starting commit: 186c42e64c137c3404539c7a54dfd3b9bb60dc55
- Scope: shared navigation/Shell plus Dashboard, Operations, Factory registry, Planning, Reviews, AI Suggestions.
- Do not touch: main, factory setup slice, auth/RLS/RBAC/tenant semantics, workflow transitions, immutable submissions.

## Next operator

1. Link the governed Supabase project; inspect remote migration history.
2. Review the migration, run DB advisors, apply through the approved deployment path, and verify each index.
3. Capture EXPLAIN ANALYZE for the Reviews graph, open action forms, override evidence, Dashboard aggregates.
4. Rerun `apps/web/playwright.performance.config.ts` with 5 cold/10 warm; do not overwrite the committed baseline.
5. If Reviews/Dashboard still miss targets, propose governed pagination/summary projections with acceptance impact called out.
6. Resolve the Dashboard entity-search test timeout and run the full G10/G11 regression inventory before release certification.

The current Supabase connector identity cannot read the governed project; all
four read-only probes returned a permission denial. Obtain authorized project
access rather than retrying or bypassing that boundary.

## Truth boundary

No remote schema was changed. No branch was pushed at generation time. No claim is made that ≤500 ms useful-content acceptance passed.
