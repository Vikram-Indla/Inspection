# Inspection Platform performance post-mortem

## Pass-4 integration update (2026-07-20)

Pass 4 unioned both remediation lines, made the authenticated shell genuinely persistent, added short-lived user-keyed role caching, narrowed/streamed the Dashboard and inspection workspace, and prepared RLS-invoker grouped/search RPCs. The corrected production harness completed 90/90 desktop transitions plus 30/30 responsive/throttled transitions with zero failed samples. Same-harness overlap improved materially (Dashboard warm p75 74.5%, Factories 32.6%, Planning 47.6%), but every representative route still misses §9 useful-content targets. G11 remains FAIL.

Remaining dependency: authorized staging database access. Pass 4 could not capture `EXPLAIN (ANALYZE, BUFFERS)` for already-applied Tier-A indexes/RLS helpers, and the new Tier-C migration remains source-only. Required evidence is the migration state, before/after plans, measured database contribution, identical benchmark rerun and owner acceptance. Application fallback paths preserve current behavior until the migration is applied. Recommended owner: governed Supabase operator with G11 QA.

## Outcome

The platform’s perceived “full page load” was a combination of document-style internal anchors, route RSC responses withheld until server data completed, and a shared Shell that began its own auth/RBAC/reference waterfall only after page work. The remediation makes every shell-contained same-origin navigation client-routed, adds truthful immediate progress, overlaps Shell/page work, deduplicates request-local auth/locale/client creation, and removes three route-specific sequential reads.

The app is materially faster but not acceptance-ready. The live database is not linked to this checkout, so the measured statement timeouts and missing-index hypotheses could not be verified with EXPLAIN or corrected remotely. No RLS, RBAC, tenant, workflow, audit, or data-accuracy rule was weakened.

## Root-cause tree

1. Navigation lifecycle: raw anchors and location assignment caused document navigation; useful content waited for dynamic server components.
2. Shared Shell: repeated auth claims, user roles, locale/client construction, and up to 1,000 factory regions per route; reads were serial relative to page work.
3. Route data: Reviews nested submission/inspection/evidence/violation data; Dashboard aggregates full RLS-visible sets; Operations pages full ledgers and mutates expiry before reads.
4. Database: measured statement timeouts on `action_forms` and geo-override evidence; source schema lacks indexes matching several filters/joins/sorts.

## Remediation

- Same-origin raw anchors inside Shell are intercepted to `router.push`; genuine Next Links retain native prefetch and routing. Sign-out/login/reset, downloads, external targets, modifier clicks and hash-only links remain native.
- Accessible route progress is rendered immediately, uses existing tokens, and honors reduced motion.
- `preloadShell(current)` starts shared reads alongside page reads; region reference data is skipped where the route cannot use it.
- React request caches deduplicate `supabaseServer`, `getServerUser`, and `useT` within a render.
- Reviews’ independent submitted-inspection discovery read is in the initial parallel group.
- Strategic Dashboard does not fetch the Operational-only audit timeline.
- Factory registry joins its unique industrial license relationship in the initial read.
- A forward migration adds indexes aligned to measured Reviews/Operations joins and filters. It is not represented as applied.

## Residual causes and next action

Apply and validate `supabase/migrations/20260720154210_g11_navigation_performance_indexes.sql` through the governed linked environment, run query advisors/EXPLAIN ANALYZE, then rerun the same 90-transition benchmark. Reviews and Dashboard likely need governed server-side projections/pagination or summary tables; that is a product/data-contract change and was not invented in this pass.
