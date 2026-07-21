# Inspection performance issue register

Task: TASK-G11-REMEDIATION-PERFORMANCE-001
Classification reflects demonstrated evidence only. “Confirmed” is the pre-remediation finding; the disposition column says whether this pass remediated it.

## Pass-4 K-item closure

| K item | Pass-4 status | Evidence / remaining boundary |
|---|---|---|
| K-001 persistent shell | IMPLEMENTED_VERIFIED | `app/(app)/layout.tsx`; authenticated chrome persists; 6/6 Pass-4 contracts and protected suite pass. |
| K-002 blanket `force-dynamic` | REMOVED_WHERE_REDUNDANT | Route group contains no explicit force; cookie/auth dependencies still correctly make authenticated output dynamic in the production build. |
| K-003 dashboard full-data render | IMPLEMENTED_SOURCE / RUNTIME_PARTIAL | View-specific bounded reads, Suspense streaming and grouped RPC fallback. Final Dashboard warm p75 2701 ms: §9 FAIL; grouped RPC awaits migration. |
| K-004 repeated role reads | IMPLEMENTED_VERIFIED | `unstable_cache` is keyed by user id, 30-second TTL, user tag invalidator. Current Access UI is read-only; future role writers must call invalidation. RLS remains authoritative. |
| K-006/K-007 document navigation | IMPLEMENTED_VERIFIED | Next Link/router paths from both lines preserved; persistent route progress clears on destination commit. |
| K-009 expiry RPC on reads | IMPLEMENTED_VERIFIED | Removed from read paths; governed 15-minute pg_cron cadence retained. |
| K-011 global search fan-out | SOURCE_READY / DB_BLOCKED | One SECURITY INVOKER union RPC plus trigram indexes; authenticated RLS-preserving fallback remains until migration. No EXPLAIN available. |
| K-013 hot indexes | APPLIED_PRIOR_PASS / PLAN_EVIDENCE_BLOCKED | Both Tier-A migration families retained, including operational-state source reconciliation. Pass-4 database access/EXPLAIN unavailable. |
| K-014 RLS initplan | APPLIED_PRIOR_PASS / PLAN_EVIDENCE_BLOCKED | `(select auth.uid())` helpers retained; identical predicates. Pass-4 plan/result-set proof unavailable. |
| K-015/K-016 inspection catalogue/signed URLs | IMPLEMENTED_WITH_SECURITY_BOUNDARY | Items and violation codes are package/reference scoped; signed URLs are one batched request. Cross-user bearer-URL persistence is deliberately not introduced without a revocation contract. |
| K-017 route feedback | IMPLEMENTED_VERIFIED | Existing loading states and immediate progress preserved; prior measured visual acknowledgement 61–71 ms p75 passes. |
| Tier-C responsive evidence | MEASURED_FAIL_TIMING | iPad portrait/landscape overflow p75 0 px; warm p75 2073/2071 ms. Slow-4G portrait p75 2356 ms. |

Overall disposition: app/source gates pass; §9 useful-content and database-plan evidence fail. Status is `AWAITING_SPONSOR_G11_PERFORMANCE_ACCEPTANCE`, not G11 PASS.

## Contractual P0-01..60 crosswalk

| ID | Investigation | Classification | Disposition/evidence |
|---|---|---|---|
| P0-01 | Full-page reload during internal navigation | Confirmed P0 | App-side remediation implemented and benchmarked. |
| P0-02 | Application shell remounting | Confirmed P0 | App-side remediation implemented and benchmarked. |
| P0-03 | Oversized route bundles | Blocked with evidence | Cannot confirm from available evidence. |
| P0-04 | Missing route prefetch | Blocked with evidence | Cannot confirm from available evidence. |
| P0-05 | Blocking route loader | Blocked with evidence | Cannot confirm from available evidence. |
| P0-06 | Sequential route-loader waterfall | Blocked with evidence | Cannot confirm from available evidence. |
| P0-07 | Repeated authentication bootstrap | Confirmed P1 | No demonstrated P0 in inspected build. |
| P0-08 | Repeated tenant bootstrap | Confirmed P0 | App-side remediation implemented and benchmarked. |
| P0-09 | Route guard network dependency | Confirmed P0 | App-side remediation implemented and benchmarked. |
| P0-10 | Blank screen during transition | Not found | No demonstrated P0 in inspected build. |
| P0-11 | Unstable provider values | Blocked with evidence | Cannot confirm from available evidence. |
| P0-12 | Global state causing application-wide rerenders | Blocked with evidence | Cannot confirm from available evidence. |
| P0-13 | Unstable callbacks and object props | Blocked with evidence | Cannot confirm from available evidence. |
| P0-14 | Missing memoization of expensive components | Blocked with evidence | Cannot confirm from available evidence. |
| P0-15 | Expensive calculations inside render | Blocked with evidence | Cannot confirm from available evidence. |
| P0-16 | Non-virtualized long tables | Confirmed P1 | No demonstrated P0 in inspected build. |
| P0-17 | Unstable or incorrect list keys | Blocked with evidence | Cannot confirm from available evidence. |
| P0-18 | Hidden tabs mounted eagerly | Blocked with evidence | Cannot confirm from available evidence. |
| P0-19 | Charts recreated during unrelated changes | Blocked with evidence | Cannot confirm from available evidence. |
| P0-20 | Excessive effect execution | Blocked with evidence | Cannot confirm from available evidence. |
| P0-21 | Duplicate API requests | Confirmed P0 | App-side remediation implemented and benchmarked. |
| P0-22 | Client-side request waterfall | Confirmed P0 | App-side remediation implemented and benchmarked. |
| P0-23 | N+1 data fetching | Blocked with evidence | Cannot confirm from available evidence. |
| P0-24 | Cache disabled or ineffective | Confirmed P0 | Residual; database/data-shape follow-up required. |
| P0-25 | Automatic refetch on every mount | Confirmed P0 | Residual; database/data-shape follow-up required. |
| P0-26 | Broad cache invalidation | Confirmed P0 | Residual; database/data-shape follow-up required. |
| P0-27 | Overfetching | Confirmed P0 | Residual; database/data-shape follow-up required. |
| P0-28 | Missing pagination or incremental loading | Blocked with evidence | Cannot confirm from available evidence. |
| P0-29 | Search request storm | Blocked with evidence | Cannot confirm from available evidence. |
| P0-30 | Retry storm or unbounded polling | Blocked with evidence | Cannot confirm from available evidence. |
| P0-31 | Missing database indexes | Blocked with evidence | Cannot confirm from available evidence. |
| P0-32 | Expensive row-level security evaluation | Blocked with evidence | Cannot confirm from available evidence. |
| P0-33 | Unrestricted `SELECT *` | Confirmed P0 | Residual; database/data-shape follow-up required. |
| P0-34 | Client-side aggregation of large datasets | Confirmed P0 | Residual; database/data-shape follow-up required. |
| P0-35 | High-offset pagination | Confirmed P0 | Residual; database/data-shape follow-up required. |
| P0-36 | Expensive exact counts | Blocked with evidence | Cannot confirm from available evidence. |
| P0-37 | Tenant filtering applied too late | Blocked with evidence | Cannot confirm from available evidence. |
| P0-38 | Serverless or API cold-start delay | Blocked with evidence | Cannot confirm from available evidence. |
| P0-39 | Missing compression and cache headers | Confirmed P0 | Residual; database/data-shape follow-up required. |
| P0-40 | Unbounded audit or attachment metadata | Confirmed P1 | No demonstrated P0 in inspected build. |
| P0-41 | 3D hero loaded outside the login experience | Not found | No demonstrated P0 in inspected build. |
| P0-42 | Oversized 3D models or textures | Not found | No demonstrated P0 in inspected build. |
| P0-43 | Unoptimised images | Not found | No demonstrated P0 in inspected build. |
| P0-44 | Render-blocking fonts | Not found | No demonstrated P0 in inspected build. |
| P0-45 | Whole icon library imported | Not found | No demonstrated P0 in inspected build. |
| P0-46 | Duplicated framework or utility dependencies | Not found | No demonstrated P0 in inspected build. |
| P0-47 | Third-party script blocking | Not found | No demonstrated P0 in inspected build. |
| P0-48 | Main-thread animation | Not found | No demonstrated P0 in inspected build. |
| P0-49 | Expensive CSS paint | Not found | No demonstrated P0 in inspected build. |
| P0-50 | Incorrect production configuration | Not found | No demonstrated P0 in inspected build. |
| P0-51 | Breakpoint-driven component replacement | Not found | No demonstrated P0 in inspected build. |
| P0-52 | Incorrect viewport-height handling | Not found | No demonstrated P0 in inspected build. |
| P0-53 | Non-passive touch or scroll listeners | Not found | No demonstrated P0 in inspected build. |
| P0-54 | Layout shifts during image and table loading | Not found | No demonstrated P0 in inspected build. |
| P0-55 | Route-transition memory growth | Not found | No demonstrated P0 in inspected build. |
| P0-56 | Subscription, timer or listener leakage | Confirmed P0 | App-side remediation implemented and benchmarked. |
| P0-57 | Missing user-timing instrumentation | Blocked with evidence | Cannot confirm from available evidence. |
| P0-58 | No repeatable performance benchmark | Blocked with evidence | Cannot confirm from available evidence. |
| P0-59 | Slow perceived response after user action | Blocked with evidence | Cannot confirm from available evidence. |
| P0-60 | Stale service-worker or browser caching behaviour | Blocked with evidence | Cannot confirm from available evidence. |

## Mandatory 140-check classification

| Check | Investigation | Classification | Evidence |
|---:|---|---|---|
| 1 | Internal navigation causing full browser reloads | Confirmed P0 | 158 raw/internal anchor or location matches; shell fallback remediates same-origin navigation. |
| 2 | Use of raw anchors or `window.location` for internal routes | Confirmed P0 | 158 raw/internal anchor or location matches; shell fallback remediates same-origin navigation. |
| 3 | Application shell remounting between pages | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 4 | Authentication provider remounting | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 5 | Tenant provider remounting | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 6 | Theme provider remounting | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 7 | Permission provider remounting | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 8 | Route guards requiring fresh network calls | Confirmed P0 | Shell/page source audit; request-scoped React caches added for auth, locale and Supabase client. |
| 9 | Full authentication revalidation on every navigation | Confirmed P0 | Shell/page source audit; request-scoped React caches added for auth, locale and Supabase client. |
| 10 | Full user-profile reload on every navigation | Confirmed P1 | Shell/page source audit; request-scoped React caches added for auth, locale and Supabase client. |
| 11 | Tenant configuration reload on every navigation | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 12 | Feature-flag reload on every navigation | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 13 | Navigation waiting for all page data before showing anything | Confirmed P0 | 90-transition baseline/final JSON; first response and useful-content timing. |
| 14 | Sequential route-loader waterfalls | Confirmed P0 | 90-transition baseline/final JSON; first response and useful-content timing. |
| 15 | Missing route-level code splitting | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 16 | Excessively fragmented route chunks | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 17 | Missing controlled route prefetch | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 18 | Blank page during transitions | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 19 | Redirect loops or unnecessary intermediate redirects | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 20 | URL-state changes causing complete page reconstruction | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 21 | Global state changes rerendering the full application | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 22 | Broad context providers causing unrelated rerenders | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 23 | Unstable provider values | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 24 | Unstable callbacks and object props | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 25 | Expensive filtering inside render | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 26 | Expensive sorting inside render | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 27 | Expensive joins or transformations inside render | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 28 | Repeated date and number formatting in large tables | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 29 | Non-virtualized long tables | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 30 | Large DOM trees | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 31 | Incorrect list keys causing row remounts | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 32 | Heavy hidden tabs mounted eagerly | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 33 | Drawers and modals mounted before use | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 34 | Charts recreated on unrelated state changes | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 35 | Editors or viewers loaded on every route | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 36 | Unnecessary React effects | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 37 | Effect dependency loops | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 38 | Duplicate fetches caused by multiple effects | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 39 | Layout measurement loops | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 40 | Excessive resize-observer callbacks | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 41 | Uncontrolled form rerenders | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 42 | Large forms updating every field on each keystroke | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 43 | Main-thread-heavy validation | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 44 | Large data transformations not memoized | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 45 | Memory retained after leaving routes | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 46 | Duplicate API requests | Confirmed P0 | Shell/page source audit; request-scoped React caches added for auth, locale and Supabase client. |
| 47 | Identical in-flight requests not deduplicated | Confirmed P0 | Shell/page source audit; request-scoped React caches added for auth, locale and Supabase client. |
| 48 | Sequential client request waterfalls | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 49 | N+1 requests | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 50 | Overfetching unused fields | Confirmed P0 | Dashboard/Reviews/Operations query inspection and route timing. |
| 51 | Loading complete histories when only summaries are needed | Confirmed P0 | Dashboard/Reviews/Operations query inspection and route timing. |
| 52 | Loading complete attachment metadata upfront | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 53 | Missing pagination | Confirmed P0 | Dashboard/Reviews/Operations query inspection and route timing. |
| 54 | High initial page size | Confirmed P1 | Dashboard/Reviews/Operations query inspection and route timing. |
| 55 | Search request storm | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 56 | Missing request cancellation | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 57 | Automatic refetch on every mount | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 58 | Automatic refetch on every focus without business need | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 59 | Overly broad query invalidation | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 60 | Incorrect or unstable cache keys | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 61 | Cache keys missing tenant identifiers | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 62 | Cache keys missing filters or permission scope | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 63 | Query cache disabled | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 64 | Stale-time set to zero for stable reference data | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 65 | Polling too frequently | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 66 | Retry storms | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 67 | Real-time subscriptions duplicated | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 68 | Subscriptions not disposed after navigation | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 69 | Large JSON payload parsing | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 70 | Missing response compression | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 71 | Missing database indexes | Confirmed P0 | Migration/index audit; no linked database/query-plan access. |
| 72 | Non-indexed tenant predicates | Blocked with evidence | Migration/index audit; no linked database/query-plan access. |
| 73 | Non-indexed status filters | Confirmed P0 | Migration/index audit; no linked database/query-plan access. |
| 74 | Non-indexed ownership filters | Blocked with evidence | Migration/index audit; no linked database/query-plan access. |
| 75 | Non-indexed date sorting | Confirmed P0 | Migration/index audit; no linked database/query-plan access. |
| 76 | Non-indexed foreign keys | Confirmed P0 | Migration/index audit; no linked database/query-plan access. |
| 77 | Expensive row-level-security policies | Blocked with evidence | Migration/index audit; no linked database/query-plan access. |
| 78 | Repeated policy subqueries | Blocked with evidence | Migration/index audit; no linked database/query-plan access. |
| 79 | `SELECT *` usage | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 80 | Client-side aggregation of large datasets | Confirmed P0 | Dashboard/Reviews/Operations query inspection and route timing. |
| 81 | Repeated exact counts | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 82 | High-offset pagination | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 83 | Unbounded audit-history queries | Not found | Dashboard/Reviews/Operations query inspection and route timing. |
| 84 | Unbounded notification queries | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 85 | Unbounded attachment queries | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 86 | Slow joins | Confirmed P0 | Dashboard/Reviews/Operations query inspection and route timing. |
| 87 | Repeated reference-data queries | Confirmed P0 | Shell/page source audit; request-scoped React caches added for auth, locale and Supabase client. |
| 88 | Missing query batching | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 89 | Backend handlers with excessive cold-start dependencies | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 90 | Backend clients recreated per request | Confirmed P0 | Shell/page source audit; request-scoped React caches added for auth, locale and Supabase client. |
| 91 | Excessive serialisation | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 92 | Missing server-side caching where safe | Confirmed P0 | Shell/page source audit; request-scoped React caches added for auth, locale and Supabase client. |
| 93 | Cross-tenant data fetched before browser filtering | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 94 | Slow storage signed-URL generation | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 95 | Database connection or pool exhaustion | Blocked with evidence | Migration/index audit; no linked database/query-plan access. |
| 96 | Oversized initial JavaScript bundle | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 97 | Heavy route-specific libraries in the global bundle | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 98 | Duplicate library versions | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 99 | Whole icon-library imports | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 100 | Whole utility-library imports | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 101 | Unused chart libraries | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 102 | Unused editor libraries | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 103 | Heavy PDF, map or 3D libraries loaded globally | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 104 | Oversized images | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 105 | Missing thumbnails | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 106 | Missing responsive image sizes | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 107 | Images decoded before needed | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 108 | Fonts blocking rendering | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 109 | Unused font weights | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 110 | Third-party scripts blocking startup | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 111 | Excessive production logging | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 112 | Source maps or development code affecting production runtime | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 113 | Incorrect tree shaking | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 114 | Missing static-asset cache headers | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 115 | Service-worker cache invalidation problems | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 116 | Stale chunk errors | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 117 | Heavy JavaScript animation | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 118 | Expensive CSS filters, blur or shadows | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 119 | Large canvas or WebGL work on operational routes | Not applicable | No corresponding provider/library/subscription exists in this architecture or route set. |
| 120 | GPU or memory pressure on iPad | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 121 | Navigation click without immediate visual acknowledgement | Confirmed P0 | 90-transition baseline/final JSON; first response and useful-content timing. |
| 122 | Slow tab switching | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 123 | Slow drawer opening | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 124 | Slow modal opening | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 125 | Slow filter application | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 126 | Typing lag in search | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 127 | Typing lag in forms | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 128 | Sorting freezing the main thread | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 129 | Pagination freezing the main thread | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 130 | Slow save operations without user feedback | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 131 | Incorrect optimistic updates | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 132 | Full-list refetch after a small mutation | Confirmed P1 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 133 | iPad breakpoint causing component remounts | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 134 | `100vh` and mobile viewport issues | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 135 | Non-passive touch listeners | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 136 | Scroll handlers blocking rendering | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |
| 137 | Layout shifts while content loads | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 138 | Sticky headers causing expensive paint | Confirmed P2 | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 139 | Horizontal overflow on iPad | Not found | Static source/build audit plus targeted runtime checks; no demonstrated defect. |
| 140 | Repeated memory growth during route cycling | Blocked with evidence | Required profiler, query-plan, memory, device or production-header evidence was unavailable; no defect asserted. |

## Repository-specific findings

| ID | Finding | Classification | Status |
|---|---|---|---|
| PERF-X01 | Shared Shell performed auth, roles, locale and a 1,000-row region read after page data | Confirmed P0 | Parallelized; request-scoped dedupe; regions loaded only for region-capable routes. |
| PERF-X02 | Operations mutates override expiry on every view and two reads repeatedly hit statement timeout | Confirmed P0 | Residual. Forward index migration supplied; remote project not linked. |
| PERF-X03 | Reviews loads a deeply nested, non-paginated decision graph | Confirmed P0 | Initial independent reads parallelized; residual DB/query-shape P0 remains. |
| PERF-X04 | Strategic Dashboard loaded an Operational-only audit timeline | Confirmed P1 | Removed from Strategic view without changing Operational behavior. |
| PERF-X05 | Factory registry performed a dependent license lookup | Confirmed P1 | Replaced with the existing one-to-one PostgREST relationship in one read. |
