# ROUTE_RUNTIME_TRUTH_MEMO_CD-004.md
Verified 2026-07-14 against the working tree (design-only lane; no repo writes outside this pack).

Route: /admin (apps/web/src/app/admin/page.tsx), server-rendered force-dynamic inside the frozen shell. Shell nav (shell-navigation.ts) shows /admin to all six admin roles; sub-destinations role-filtered for visibility only.

Reads: one Promise.all of six queries — engine_settings(engine, version_label, updated_at) + exact head counts of regulations, inspection_items, package_versions(status=published), violation_codes, audit_events. Errors are NOT inspected; null count renders as `count ?? 0` (CD004-QG-02 evidence). Page context shows a static "live database" success lozenge (CD004-QG-01 evidence). KPI card small print is the internal screen ID (e.g. "SCR-ADM-010") in user-facing copy. Only /admin/regulations and /admin/audit are linked; /admin/packages, /admin/violations, /admin/workflows, /admin/risk, /admin/gis, /admin/access exist as routes but are not linked from the home.

Lifecycle heterogeneity (must not be normalized):
- package_versions: draft/published/locked, distinct-approver enforcement, published immutability — proven.
- config_versions: shared config_status maker-checker model — proven where used.
- regulations: status exposed; distinct-approver workflow NOT proven.
- engine_settings: direct audited update by authorized roles; no per-setting draft/approval cycle.
- /admin home: read-only; performs no validate/approve/publish action.

Not proven (never rendered as fact): engine-health verdicts; approval queue/age/SLA/overdue; cross-engine dependency or publish blockers; runtime-consumption counts; engine ownership; stale thresholds; provider reachability/delivery; per-query structured failure semantics; an Admin-family route guard (middleware authenticates only; tests permit cross-channel /admin rendering).

Design history: design/astryx/d2/D2-01_admin-home.html consulted as DESIGN_HISTORY_ONLY; its health verdicts, draft-age thresholds, approval counts and generalized maker-checker were rejected as unverified.
