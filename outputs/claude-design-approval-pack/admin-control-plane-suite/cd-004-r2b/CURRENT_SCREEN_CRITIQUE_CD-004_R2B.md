# CURRENT_SCREEN_CRITIQUE_CD-004_R2B.md
Three highest-cost decision failures of the current /admin (apps/web/src/app/admin/page.tsx, read 2026-07-14):

1. Failure is rendered as health. Each of the six Supabase result objects carries its own error/null state, but the route never inspects them: a failed count renders as 0 (count ?? 0) beneath a static "live database" success lozenge. The one screen meant to answer "is tomorrow's configuration safe?" can assert safety while blind. Cost: false confidence at the governance gateway.
2. Counts without lifecycle answer no admin question. "412 inspection items" carries no draft/published identity, no owner-role, no door; the KPI caption is a raw internal screen ID (e.g. "SCR-ADM-010") shown to users. Cost: every real decision requires opening each module anyway — the 30-second decision is unanswerable.
3. The gateway hides six of its eight doors and flattens roles. Only regulations and audit are linked; packages, violations, workflows, risk, GIS, access exist as governed routes reachable only via the sidebar; all six admin roles see identical, unscoped content. Cost: the control plane reads as a static report, not a place to act safely.
