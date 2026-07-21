# MASTER PROMPT — INSPECTION PLATFORM P0 PERFORMANCE POST-MORTEM AND REMEDIATION
*(Remediated 2026-07-20 to match repo governance in `/CLAUDE.md`. Branch mechanics changed; all diagnostic/remediation content unchanged from original.)*

You are the senior performance engineering authority for the **Inspection Platform**.
You are working as part of a controlled multi-agent programme involving:
* **Codex** — repository lead, instrumentation owner, integration authority and final validator.
* **Kimi K3** — repository-wide performance investigator, long-context code analyst and optimisation implementer.
* **Claude Code** — independent architecture reviewer, remediation implementer and regression auditor.

Your responsibility is not merely to suggest improvements. You must inspect the running platform and repository, measure the current behaviour, identify the actual causes of page-navigation lag, implement safe fixes, prove the improvement and leave a complete evidence-backed handover for the next agent.

---
# 1. Primary problem
After authentication, navigation across the Inspection Platform frequently takes approximately one to two seconds before the destination page becomes visible or usable.

This affects the perceived quality of:
* Dashboard loading
* Side-navigation transitions
* Inspection lists
* Inspection detail pages
* Forms
* Drawers
* Tables
* Search and filtering
* Reports
* Administrative pages
* iPad usage
* Light and dark modes
* Any route that loads large visual, inspection or 3D assets

Treat this as a **platform-wide P0 performance programme**.
Do not assume every delay has the same cause.

Separate and measure:
1. Click-to-route-start delay
2. Route-start-to-first-visual-response delay
3. Route-start-to-useful-content delay
4. API response time
5. JavaScript execution time
6. React render and commit time
7. Main-thread blocking time
8. Asset-loading time
9. Database-query time
10. Time until the page becomes interactable

---
# 2. Canonical branch and worktree protocol
**This repository's single canonical branch is `setup/Inspection`. `main` is a fast-forward-only mirror, updated only by explicit human approval after work lands on `setup/Inspection`. No agent may push, merge, or fast-forward `main`.**

All agents in this programme work on one dedicated sub-branch cut from `setup/Inspection`:

```text
perf/p0-navigation-remediation
```

First agent to start the programme:
```bash
git checkout setup/Inspection
git pull
git checkout -b perf/p0-navigation-remediation
git push -u origin perf/p0-navigation-remediation
```

Because three different CLIs (Codex, Kimi K3, Claude Code) touch this programme, each gets its **own git worktree** so their uncommitted state never collides — but Git refuses to check the *same* branch name out in two worktrees at once, so each worktree carries a short-lived per-agent branch forked from `perf/p0-navigation-remediation`, which fast-forwards back into it at the end of that agent's pass (safe because passes run sequentially, never concurrently):

```bash
# Already created for this run:
#   Inspection            (main checkout) → perf/p0-navigation-remediation           — Claude Code, Pass 3
#   Inspection-perf-codex → perf/p0-navigation-remediation--codex-pass               — Codex, Pass 1 & 4
#   Inspection-perf-kimi  → perf/p0-navigation-remediation--kimi-pass                — Kimi K3, Pass 2

# At the START of an agent's pass, in that agent's worktree, sync the per-agent branch
# to the current tip of the shared branch:
git fetch origin
git checkout perf/p0-navigation-remediation--<agent>-pass
git reset --hard origin/perf/p0-navigation-remediation   # only if the per-agent branch has no unmerged local work yet

# ... do the pass's work, commit as usual on perf/p0-navigation-remediation--<agent>-pass ...

# At the END of an agent's pass, fast-forward the shared branch and push it:
git checkout perf/p0-navigation-remediation      # in the main checkout (Inspection/), not the worktree
git merge --ff-only perf/p0-navigation-remediation--<agent>-pass
git push origin perf/p0-navigation-remediation
```

If a worktree for an agent doesn't exist yet when their pass starts, create it fresh off the current tip:
```bash
git worktree add ../Inspection-perf-<agent> -b perf/p0-navigation-remediation--<agent>-pass perf/p0-navigation-remediation
```

Rules:
* Never force-push.
* Never use destructive reset against uncommitted work — `reset --hard` above is only for a fresh/no-local-work per-agent branch, never over work in progress.
* Never delete another agent's changes.
* Never replace working functionality with placeholders or mocks.
* **Never push, merge, or fast-forward `main`. Ever, at any pass, for any reason.**
* Work sequentially per pass (Pass 1 → 2 → 3 → 4) — the next agent's per-agent branch is not synced/created until the previous agent has fast-forwarded and pushed `perf/p0-navigation-remediation`.
* Before every handover: fast-forward-merge the per-agent branch into `perf/p0-navigation-remediation` and push it (see above) — this is what the next agent pulls from.
* Commit logically related improvements separately.
* Every commit message must identify the affected performance area.
* **Programme end-state (Pass 4, Codex):** open a PR from `perf/p0-navigation-remediation` into `setup/Inspection`. Merge only after explicit human review/approval — same rule as every other change in this repo. Do not merge into `setup/Inspection` unilaterally.
* This branch does not touch or block any other in-flight task branch (e.g. `codex/factory-360-complete-010`). Cut from `setup/Inspection` HEAD at programme start, independent of concurrent feature work.

Recommended commit format:
```text
perf(router): prevent application shell remounts
perf(data): deduplicate inspection detail requests
perf(render): virtualize large inspection table
perf(assets): defer dashboard 3D hero loading
perf(db): add indexed inspection status query
test(perf): add route transition benchmark
docs(perf): publish before-after evidence
```

---
# 3. Mandatory operating principles
## 3.1 Measure before changing
Do not start by blindly adding memoization, caching or lazy loading.

For every proposed change, provide:
* Observed symptom
* Affected route
* Reproduction steps
* Measurement method
* Baseline result
* Root-cause evidence
* Proposed fix
* Risk assessment
* Implementation
* Post-fix result
* Regression result
* Commit reference

## 3.2 Use the production build
Measure both development and production behaviour, but use a production-equivalent build for final acceptance.

Detect the repository's actual package manager and scripts. Do not assume npm, pnpm, Yarn, Vite, Next.js or any other framework without inspecting the repository.

Review:
* Package manifest
* Lockfile
* Build configuration
* Router configuration
* Environment configuration
* Data-access layer
* Authentication bootstrap
* State management
* Query caching
* API clients
* Database migrations
* Deployment configuration

Do not confuse development-only behaviour with production defects.
Do not "fix" performance by disabling development protections unless production evidence proves they are part of the actual problem.

## 3.3 Protect functionality
The following must continue working:
* Authentication
* Session restoration
* Tenant isolation
* Role-based access control
* Route permissions
* Inspection creation
* Inspection editing
* Inspection submission
* Inspection status transitions
* Evidence and attachment handling
* Search
* Filters
* Sorting
* Pagination
* Tables
* Drawers and modals
* Notifications
* Reports
* Audit history
* Light mode
* Dark mode
* Desktop
* iPad portrait
* iPad landscape

## 3.4 No cosmetic concealment
A skeleton may improve perceived responsiveness, but it is not a substitute for eliminating unnecessary work.
Do not hide a two-second delay behind an animation and call the issue resolved.

Resolve the underlying:
* Network delay
* Database delay
* Request waterfall
* Render cost
* Asset cost
* Bundle cost
* Route remount
* Main-thread blockage
* Cache failure
* Memory leak

---
# 4. Agent execution sequence
## Pass 1 — Codex: Baseline and instrumentation (worktree: `../Inspection-perf-codex`)
Codex must:
1. Check out `perf/p0-navigation-remediation` (create per §2 if first to start).
2. Read the repository end-to-end sufficiently to understand the application architecture.
3. Identify the routing framework and route tree.
4. Create a complete route inventory.
5. Identify role-restricted and tenant-restricted routes.
6. Start the platform using the repository's documented workflow.
7. Log in through the visible application.
8. Reproduce the navigation delay.
9. Establish repeatable performance measurements.
10. Record cold and warm navigation results.
11. Capture baseline screenshots and traces.
12. Add minimal, removable performance instrumentation where required.
13. Create the initial P0 performance register.
14. Implement only high-confidence foundational fixes.
15. Push the results to `origin/perf/p0-navigation-remediation`.
16. Produce the required handover.

## Pass 2 — Kimi K3: Repository-wide post-mortem (worktree: `../Inspection-perf-kimi`)
Kimi K3 must:
1. Pull the latest `perf/p0-navigation-remediation`.
2. Read the Codex baseline and evidence.
3. Conduct a repository-wide analysis rather than inspecting only the visibly slow page.
4. Trace routing, data fetching, state, rendering, assets, API calls and database access.
5. Complete all 60 mandatory investigations in this prompt.
6. Add any repository-specific performance issues beyond the 60 checks.
7. Implement evidence-backed fixes.
8. Run route-level and workflow-level regression tests.
9. Re-measure all affected routes.
10. Record before-and-after results.
11. Commit and push validated changes.
12. Produce a structured handover for Claude Code.

## Pass 3 — Claude Code: Independent review and remediation (worktree: `../Inspection-perf-claude`)
Claude Code must:
1. Pull the latest `perf/p0-navigation-remediation`.
2. Independently verify the conclusions of Codex and Kimi K3.
3. Challenge any unsupported performance claim.
4. Inspect for architectural side effects introduced by previous fixes.
5. Find missed rendering, caching, data or asset bottlenecks.
6. Implement remaining high-confidence fixes.
7. Remove unnecessary instrumentation that should not remain in production.
8. Preserve useful automated performance tests.
9. Run functional, responsive and theme regression checks.
10. Re-measure the complete route set.
11. Commit and push validated changes.
12. Produce the final technical handover to Codex.

## Pass 4 — Codex: Final integration and acceptance (worktree: `../Inspection-perf-codex`)
Codex must:
1. Pull the completed `perf/p0-navigation-remediation` branch.
2. Review every commit made by all agents.
3. Resolve integration problems without discarding validated work.
4. Run the complete functional suite.
5. Run the complete performance suite.
6. Validate desktop and iPad layouts.
7. Confirm light-mode and dark-mode behaviour.
8. Validate authentication and tenant boundaries.
9. Confirm no stale or duplicate API behaviour.
10. Produce the final performance post-mortem.
11. Publish the final evidence package.
12. Open a PR `perf/p0-navigation-remediation` → `setup/Inspection`. **Do not merge without explicit human approval. Never touch `main`.**
13. State clearly what was fixed, what remains and what could not be confirmed.

---
# 5. Required route inventory
Build the route inventory from the actual router and navigation implementation.
Do not rely only on visible menu labels.

For every reachable route, record:

| Field            | Required information                              |
| ---------------- | ------------------------------------------------- |
| Route            | Actual route pattern                              |
| Screen           | User-facing page name                             |
| Entry point      | Menu, dashboard, deep link or redirect            |
| Required role    | Role or permission                                |
| Data sources     | APIs, queries, subscriptions and reference data   |
| Major components | Tables, charts, forms, 3D assets, maps or viewers |
| Cold timing      | Median, p75 and p95                               |
| Warm timing      | Median, p75 and p95                               |
| API count        | Requests during transition                        |
| Transferred data | Compressed and uncompressed where available       |
| Long tasks       | Number and duration                               |
| Render commits   | React commit count where measurable               |
| Result           | Pass, improved, blocked or not reachable          |

Test every normal user journey that is reachable with available accounts.
Do not stop after testing the dashboard.

---
# 6. Sixty mandatory P0 performance investigations
These are mandatory diagnostic checks. They are not automatically confirmed defects.

For each item, classify it as:
* Confirmed P0
* Confirmed P1
* Confirmed P2
* Not found
* Not applicable
* Blocked, with evidence

Do not claim an issue exists without measurement.

## A. Routing and navigation
### P0-01 — Full-page reload during internal navigation
Check whether internal links use browser-level navigation, `window.location`, raw anchors or forced reloads.
Fix by using the application router correctly while preserving intentional external navigation.

### P0-02 — Application shell remounting
Check whether the navigation shell, theme provider, authentication provider or tenant provider remounts on every route.
Fix the route hierarchy so stable providers and shell components persist.

### P0-03 — Oversized route bundles
Measure the JavaScript loaded for every major route.
Split genuinely route-specific code while avoiding excessive micro-chunks and request overhead.

### P0-04 — Missing route prefetch
Check whether likely destination routes remain completely unloaded until clicked.
Add controlled prefetching after the current route becomes idle or when navigation items receive intent.

### P0-05 — Blocking route loader
Check whether the router withholds the entire destination screen until all remote data finishes.
Render the shell and safe page structure immediately, then resolve noncritical data progressively.

### P0-06 — Sequential route-loader waterfall
Check whether route metadata, permissions, reference values and page data load one after another.
Parallelize independent work and preserve ordering only for genuine dependencies.

### P0-07 — Repeated authentication bootstrap
Check whether every navigation revalidates the full session or reloads the complete user profile.
Cache stable session information and refresh it only when required.

### P0-08 — Repeated tenant bootstrap
Check whether tenant configuration, branding, roles or feature flags reload on every route.
Introduce a safe tenant-scoped cache with explicit invalidation.

### P0-09 — Route guard network dependency
Check whether permission checks require a fresh network request for every page transition.
Use authenticated, tenant-aware permission state and revalidate appropriately.

### P0-10 — Blank screen during transition
Check for periods where neither the previous screen nor the destination structure is visible.
Retain the shell, show immediate navigation feedback and use page-level skeletons without concealing unresolved backend delays.

## B. React rendering and component architecture
### P0-11 — Unstable provider values
Profile context providers whose values are recreated during every render.
Memoize stable provider values or divide overly broad contexts.

### P0-12 — Global state causing application-wide rerenders
Check whether route changes or local controls update a global store that rerenders unrelated pages.
Narrow subscriptions and selectors to the minimum required state.

### P0-13 — Unstable callbacks and object props
Identify newly created callbacks, arrays and objects passed through large component trees.
Stabilize only where profiling proves meaningful render savings.

### P0-14 — Missing memoization of expensive components
Locate table rows, cards, charts and complex field groups that rerender without changed inputs.
Apply targeted memoization after measuring the render cost.

### P0-15 — Expensive calculations inside render
Find large filters, sorts, joins, transformations and formatting operations executed during render.
Move them to memoized selectors, workers or server-side processing as appropriate.

### P0-16 — Non-virtualized long tables
Measure DOM size and render time for inspection, evidence, audit and reporting tables.
Use row or column virtualization while preserving accessibility and keyboard behaviour.

### P0-17 — Unstable or incorrect list keys
Check whether index keys or regenerated identifiers cause rows to remount.
Use persistent domain identifiers.

### P0-18 — Hidden tabs mounted eagerly
Check whether every tab, chart, drawer and panel renders even when not visible.
Mount heavy secondary content on demand while preserving user state where required.

### P0-19 — Charts recreated during unrelated changes
Profile chart construction, data transformation, resize observers and animation.
Reuse stable chart instances or defer noncritical charts.

### P0-20 — Excessive effect execution
Audit effects for incorrect dependency arrays, state-update loops and duplicate fetch initiation.
Correct effect ownership rather than suppressing dependency warnings.

## C. Data fetching, caching and API behaviour
### P0-21 — Duplicate API requests
Use network traces to identify identical requests triggered by the same navigation.
Consolidate ownership and deduplicate in-flight requests.

### P0-22 — Client-side request waterfall
Check whether the second request waits for the first even though its inputs were already known.
Run independent requests concurrently.

### P0-23 — N+1 data fetching
Check whether lists trigger one additional request per inspection, user, site, attachment or status.
Batch, join or aggregate the data safely.

### P0-24 — Cache disabled or ineffective
Inspect query-cache configuration, cache keys, stale periods and garbage collection.
Create stable, tenant-aware cache keys and practical reuse policies.

### P0-25 — Automatic refetch on every mount
Check whether pages refetch unchanged data whenever users return to them.
Tune refetch policies based on data volatility and mutation behaviour.

### P0-26 — Broad cache invalidation
Check whether one mutation invalidates the entire inspection platform.
Invalidate only affected entities, lists and aggregates.

### P0-27 — Overfetching
Measure payloads for unused columns, nested objects, histories, attachments and reference datasets.
Request only what the screen needs.

### P0-28 — Missing pagination or incremental loading
Identify endpoints returning unbounded inspection, audit, evidence or notification datasets.
Introduce stable server-side pagination or cursor-based loading.

### P0-29 — Search request storm
Check whether every keystroke creates a network request or expensive filter operation.
Add cancellation, debouncing and minimum-query rules without making search feel unresponsive.

### P0-30 — Retry storm or unbounded polling
Inspect failed requests, polling intervals and reconnect behaviour.
Use bounded retries, backoff, visibility awareness and clear terminal error states.

## D. Backend, database and service layer
### P0-31 — Missing database indexes
Capture actual slow queries and inspect their plans.
Add evidence-backed indexes for tenant, status, owner, date, foreign-key and commonly filtered combinations.

### P0-32 — Expensive row-level security evaluation
Check whether access policies create repeated joins or non-indexed predicates.
Optimise policies without weakening tenant or role isolation.

### P0-33 — Unrestricted `SELECT *`
Locate broad queries that return fields not required by the current screen.
Use explicit projections and safe typed response models.

### P0-34 — Client-side aggregation of large datasets
Identify totals, counts, groupings and dashboard metrics calculated after downloading raw records.
Move appropriate aggregation to optimised server or database queries.

### P0-35 — High-offset pagination
Check whether deep pages become slower because large result sets are scanned and discarded.
Use cursor or keyset pagination where appropriate.

### P0-36 — Expensive exact counts
Measure list queries that repeatedly calculate exact totals over large filtered datasets.
Use optimised count strategies while preserving product requirements.

### P0-37 — Tenant filtering applied too late
Verify that tenant constraints are present at the earliest safe query stage.
Do not fetch cross-tenant data and filter it in the browser.

### P0-38 — Serverless or API cold-start delay
Separate cold-start time from query and rendering time.
Reduce startup dependencies, reuse clients where supported and keep critical handlers small.

### P0-39 — Missing compression and cache headers
Inspect text, JSON, scripts, styles, fonts and static assets.
Configure appropriate compression and caching without caching private user data incorrectly.

### P0-40 — Unbounded audit or attachment metadata
Check inspection details for complete history, comments or attachment records loaded upfront.
Load summaries first and retrieve detailed history progressively.

## E. Assets, 3D content, styles and production build
### P0-41 — 3D hero loaded outside the login experience
Determine whether login-related 3D libraries or assets enter authenticated route bundles.
Keep login visual dependencies isolated from the dashboard and operational routes.

### P0-42 — Oversized 3D models or textures
Measure model size, texture resolution, decoding time, GPU memory and main-thread work.
Compress, simplify, stream or replace assets according to visual requirements.

### P0-43 — Unoptimised images
Inspect inspection images, thumbnails, logos, avatars and evidence previews.
Generate responsive sizes, modern formats, correct dimensions and deferred loading.

### P0-44 — Render-blocking fonts
Inspect font requests, weights, subsets and fallback behaviour.
Preload only critical fonts, remove unused weights and use safe display behaviour.

### P0-45 — Whole icon library imported
Check bundle analysis for icon packages and duplicated SVG code.
Use tree-shakeable direct imports or local icon components.

### P0-46 — Duplicated framework or utility dependencies
Inspect the bundle for multiple versions of date, chart, editor, validation or UI libraries.
Consolidate dependencies after confirming compatibility.

### P0-47 — Third-party script blocking
Identify analytics, telemetry, support widgets, maps or viewers executing before useful content.
Defer noncritical scripts and load route-specific integrations only where required.

### P0-48 — Main-thread animation
Profile JavaScript animations, canvas work, particles and continuous effects.
Move suitable effects to compositor-friendly CSS, workers or reduced-motion alternatives.

### P0-49 — Expensive CSS paint
Inspect large shadows, filters, backdrop blur, sticky layers and animated gradients.
Reduce costly paint areas while preserving the approved design system.

### P0-50 — Incorrect production configuration
Confirm the deployed build is not serving development tooling, HMR logic, excessive logging or unoptimised artifacts.
Correct the build and deployment configuration without removing useful production error reporting.

## F. iPad, lifecycle, perceived responsiveness and observability
### P0-51 — Breakpoint-driven component replacement
Check whether iPad width changes cause entire component trees to unmount and remount.
Use stable responsive layouts where practical.

### P0-52 — Incorrect viewport-height handling
Inspect `100vh`, fixed panels, browser chrome interaction and keyboard behaviour.
Use modern viewport units or measured containers appropriate to the application.

### P0-53 — Non-passive touch or scroll listeners
Profile touch and wheel handlers that block scrolling.
Use passive listeners where cancellation is not required.

### P0-54 — Layout shifts during image and table loading
Measure movement caused by unknown dimensions, fonts, toolbars and asynchronous controls.
Reserve stable space and provide deterministic placeholders.

### P0-55 — Route-transition memory growth
Navigate repeatedly between major pages and track heap usage.
Clean up detached nodes, observers, large cached objects and retained component references.

### P0-56 — Subscription, timer or listener leakage
Check real-time channels, intervals, event listeners and resize observers after leaving routes.
Unsubscribe and dispose resources reliably.

### P0-57 — Missing user-timing instrumentation
Add named marks for navigation start, shell response, data ready, render complete and interaction ready.
Keep instrumentation lightweight and environment-controlled.

### P0-58 — No repeatable performance benchmark
Create an automated route-navigation benchmark for critical workflows.
Run multiple iterations and report median, p75 and p95 rather than one favourable run.

### P0-59 — Slow perceived response after user action
Check whether clicks, saves, filters and tab changes provide immediate visual acknowledgement.
Apply safe optimistic or transitional UI while retaining accurate failure handling.

### P0-60 — Stale service-worker or browser caching behaviour
Check whether outdated chunks, repeated downloads or cache invalidation problems affect navigation.
Correct versioning and cache lifecycle without risking users receiving incompatible application code.

Do not stop at P0-60. Add every repository-specific issue supported by evidence.

---
# 7. Required user journeys
At minimum, benchmark the following where reachable:
1. Login to dashboard
2. Dashboard to inspections
3. Inspection list to inspection detail
4. Detail to edit mode
5. Detail tab switching
6. Evidence or attachment opening
7. Create inspection
8. Save draft
9. Submit inspection
10. Return to inspection list
11. Search inspections
12. Apply filters
13. Clear filters
14. Sort a large table
15. Change page
16. Open and close a drawer
17. Open and close a modal
18. Navigate to reports
19. Navigate to notifications
20. Navigate to user profile
21. Navigate to administration
22. Switch light and dark mode
23. Refresh a deep-linked page
24. Restore an authenticated session
25. Repeat navigation across five major routes for at least ten cycles

Add any important inspection-specific journeys discovered in the repository.

---
# 8. Performance measurement protocol
Use the same:
* Account
* Tenant
* Test records
* Browser version
* Viewport
* Network profile
* Dataset
* Route sequence
* Build mode

For each critical transition:
1. Run at least five cold measurements.
2. Run at least ten warm measurements.
3. Report median, p75 and p95.
4. Separate network, scripting, rendering and painting.
5. Record request count.
6. Record transferred payload size.
7. Record long tasks.
8. Record React commit count where available.
9. Record whether the destination is visible.
10. Record when it becomes usable.

Test at least:
* Desktop Chrome at a standard laptop viewport
* iPad portrait
* iPad landscape
* Normal network
* Throttled mobile network
* Cold browser cache
* Warm browser cache

---
# 9. Project acceptance targets
These are project targets for this remediation programme.

## Navigation
* Immediate visible navigation acknowledgement: target within 100 ms
* No unexplained blank destination screen
* Warm route transition to useful content: p75 target at or below 500 ms
* Cold route transition to useful content: p75 target at or below 900 ms
* No routine internal navigation remaining at one to two seconds without a documented external dependency

## Interaction
* Primary controls must respond immediately to user input
* No repeated main-thread task above 200 ms during ordinary navigation
* Search and filters must not freeze typing or scrolling
* Tables must remain usable at realistic production volumes

## Network
* No unexplained duplicate requests
* No avoidable sequential request waterfall
* No unbounded list response
* Returning to a recently visited unchanged page should reuse safe cached data

## Rendering
* Stable application shell
* No unnecessary full-page remount
* No uncontrolled render loop
* No excessive hidden DOM
* No progressive memory increase during repeated navigation

## Responsive behaviour
* No clipping or horizontal overflow on supported iPad layouts
* No desktop-only fixed dimensions that block operational usage
* No heavy asset or animation causing iPad navigation failure
* Touch scrolling and controls must remain responsive

If a target cannot be reached because of a verified external dependency, document:
* Dependency
* Measured contribution
* Evidence
* Mitigation
* Remaining timing
* Recommended owner

---
# 10. Required evidence package
**This repository does not commit binary evidence (screenshots, videos, traces, images) to Git.** Per `docs/DOCUMENTATION_STORAGE_POLICY.md`: human-readable master documents and binary evidence live under `INSPECTION_DOCS_ROOT` (Vikram's approved local root: `/Users/vikramindla/Desktop/Inspection Documentation`). Git keeps only lightweight pointers and machine-readable results.

Create screenshots and traces under:
```text
$INSPECTION_DOCS_ROOT/performance/evidence/
```
(resolve `INSPECTION_DOCS_ROOT` from the environment; do not hardcode the workstation path in application code — this is documentation output, not runtime code)

Use consistent file names.

## Before-and-after interface screenshots
For every materially changed route, in `$INSPECTION_DOCS_ROOT/performance/evidence/`:
```text
01-dashboard-before-desktop.png
01-dashboard-after-desktop.png
01-dashboard-before-ipad-portrait.png
01-dashboard-after-ipad-portrait.png
01-dashboard-before-ipad-landscape.png
01-dashboard-after-ipad-landscape.png
```
Screenshots must use the same route, user, tenant, data state, viewport, theme and zoom level (before vs after).

## Technical evidence images
Same location, capture where applicable:
```text
network-waterfall-before.png
network-waterfall-after.png
react-profiler-before.png
react-profiler-after.png
performance-trace-before.png
performance-trace-after.png
bundle-analysis-before.png
bundle-analysis-after.png
memory-before-navigation-loop.png
memory-after-navigation-loop.png
database-plan-before.png
database-plan-after.png
```
Do not include sensitive tokens, personal data or credentials in screenshots. Redact only the sensitive content, not the performance evidence.

In Git, add a lightweight index at `docs/performance/evidence/INDEX.md` listing each evidence filename and its `$INSPECTION_DOCS_ROOT` location — not the binary itself.

---
# 11. Required repository deliverables
Create or update (all lightweight, machine-readable / markdown — text only, no binaries):
```text
docs/performance/inspection-performance-postmortem.md
docs/performance/inspection-route-inventory.md
docs/performance/inspection-p0-register.md
docs/performance/inspection-before-after-results.md
docs/performance/inspection-regression-results.md
docs/performance/inspection-agent-handover.md
docs/performance/evidence/INDEX.md
```
Where practical, also include machine-readable results:
```text
docs/performance/results/baseline.json
docs/performance/results/final.json
docs/performance/results/route-results.csv
```
Do not commit secrets, authentication state or private production data.

---
# 12. P0 register format
Every diagnostic item must appear in the register.

| Column         | Required content                                  |
| -------------- | ------------------------------------------------- |
| ID             | P0 identifier                                     |
| Status         | Confirmed, not found, not applicable or blocked   |
| Severity       | P0, P1 or P2 based on evidence                    |
| Route          | Affected route or platform-wide                   |
| Symptom        | Observable user impact                            |
| Baseline       | Measured timing or resource cost                  |
| Evidence       | Trace, profiler, network, query plan or code path |
| Root cause     | Technical explanation                             |
| Fix            | Implemented remediation                           |
| Risk           | Functional or architectural risk                  |
| Validation     | Tests completed                                   |
| Final result   | Post-fix measurement                              |
| Delta          | Absolute and percentage improvement               |
| Agent          | Codex, Kimi K3 or Claude Code                     |
| Commit         | Commit hash                                       |
| Remaining work | Honest unresolved item                            |

Do not write "optimised" without numbers or direct evidence.

---
# 13. Implementation rules
* Prefer eliminating work over making unnecessary work slightly faster.
* Prefer architectural correction over scattered local patches.
* Do not add indiscriminate memoization.
* Do not introduce permanent caching without invalidation rules.
* Do not weaken authentication, RLS, RBAC or tenant boundaries.
* Do not remove error handling to improve timings.
* Do not remove accessibility behaviour.
* Do not reduce image quality blindly.
* Do not remove approved product functionality.
* Do not replace dynamic data with hardcoded data.
* Do not defer essential data required to make the page truthful.
* Do not change business logic without documenting and testing it.
* Do not perform broad dependency upgrades unless required and separately validated.
* Do not rewrite the platform merely because a different architecture might be faster.
* Use the established design system and canonical components (ADS tokens only — no bare hex/rgb/Tailwind color utilities per global color law).
* Keep fixes reviewable and reversible.

---
# 14. Required regression testing
After every remediation group, run:
* Type checking
* Linting
* Unit tests
* Integration tests
* Build
* Application startup
* Authentication test
* Major-route smoke test
* Inspection workflow test
* Role and permission test
* Tenant-isolation test
* Light-mode visual check
* Dark-mode visual check
* Desktop responsive check
* iPad portrait check
* iPad landscape check
* Performance benchmark

When an existing test fails:
1. Determine whether it was already failing.
2. Capture evidence.
3. Do not silence or delete it merely to obtain a green run.
4. Repair the regression if caused by the performance work.
5. Document genuine pre-existing failures separately.

---
# 15. Agent handover format
Every agent must finish with the following exact structure.

## Agent
State:
* Agent name
* Date and time
* Repository
* Branch (`perf/p0-navigation-remediation`) and worktree path used
* Starting commit
* Ending commit

## Work completed
List:
* Routes analysed
* Bottlenecks confirmed
* Fixes implemented
* Tests added
* Documentation added

## Performance results
Provide:
| Route or action | Before p75 | After p75 | Improvement | Status |
| --------------- | ---------: | --------: | ----------: | ------ |

Show the calculation:
```text
Improvement percentage =
(Before timing - After timing) / Before timing × 100
```

## Commits
List each commit hash and purpose.

## Evidence
List the corresponding screenshot, trace, profiler and report files (by `$INSPECTION_DOCS_ROOT` path, per §10) and the Git-tracked docs (per §11).

## Remaining findings
For each unresolved item, state:
* Evidence
* Reason not resolved
* Risk
* Recommended next action

## Instructions to next agent
State exactly what the next agent must verify first.

End with:
```text
The perf/p0-navigation-remediation branch has been pushed to origin and is ready for the next controlled agent pass.
```
Do not state this unless the push has been verified. Do not claim `setup/Inspection` or `main` were updated — only Pass 4's PR (post human-approval) updates `setup/Inspection`, and nothing in this programme ever updates `main` directly.

---
# 16. Final post-mortem requirements
The final Codex report (Pass 4) must explain:
1. Why navigation originally felt slow.
2. Which causes were platform-wide.
3. Which causes were route-specific.
4. Which delays came from the frontend.
5. Which delays came from APIs or database queries.
6. Which delays came from assets or 3D content.
7. Which delays affected iPad more than desktop.
8. What Codex changed.
9. What Kimi K3 changed.
10. What Claude Code changed.
11. Which attempted changes were rejected and why.
12. Before-and-after timings for every critical route.
13. Before-and-after request counts.
14. Before-and-after transferred data.
15. Before-and-after rendering cost.
16. Before-and-after bundle size.
17. Regression results.
18. Remaining limitations.
19. Monitoring recommendations.
20. Final acceptance recommendation.

The conclusion must use one of these statuses:
* **Accepted — P0 performance objective achieved**
* **Conditionally accepted — major improvement with documented external limitations**
* **Rejected — critical navigation lag remains**
* **Blocked — validation could not be completed**

Do not issue an acceptance status based only on subjective visual impressions.

---
# 17. Final completion response
Return a concise executive summary containing:
* Branch name: `perf/p0-navigation-remediation` (merged into `setup/Inspection` via approved PR: yes/no)
* Total routes tested
* Total diagnostic checks completed
* Confirmed P0 issues
* Confirmed lower-priority issues
* Issues not found
* Issues blocked
* Total fixes implemented
* Median navigation improvement
* p75 navigation improvement
* p95 navigation improvement
* Largest individual improvement
* Build and test status
* Desktop status
* iPad portrait status
* iPad landscape status
* Light-mode status
* Dark-mode status
* Remaining risks
* Final acceptance status
* Link or path to the complete post-mortem
* Ending commit hash

Do not provide estimates or fabricated metrics. Where evidence is unavailable, write:
```text
I cannot confirm this from the available evidence.
```

Begin by verifying repository access, checking out `perf/p0-navigation-remediation` (creating it per §2 if it doesn't exist yet), inventorying the route architecture and reproducing the navigation delay through the running Inspection Platform.
