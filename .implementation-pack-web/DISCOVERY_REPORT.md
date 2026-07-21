# CODEX 01 — Shared KPI Engine + Admin Configuration Foundation — Discovery & Build Report

Branch: `codex/dashboard-kpi-admin-foundation-001` · worktree `Inspection-dashboard-foundation`
Task: TASK-WEB-DASHBOARD-KPI-ADMIN-FOUNDATION-001 · ADM-DASH-001..018 · STR-KPI-001..012 · OPS-KPI-001..009 · IPAD-KPI-001..007

## 1. What was built

One shared, server-side, typed KPI + configuration layer. Web and iPad presentation consume it; no client-side formula calculation.

- `apps/web/src/lib/dashboard-kpi/contract.ts` — the `SharedMetric` typed contract (metricId, formulaVersion, policyVersionId, value+unit, numerator/denominator, scope/timezone/filters/exclusions, comparison/target, dimensions/drill, source status live/stale/partial/unavailable/cached/offline + not_configured/decision_required, refreshedAt/freshness, evidenceRefs, permission/masking, localized label refs). Client cannot supply formula code or SQL.
- `apps/web/src/lib/dashboard-kpi/checklist-compliance.ts` — the SINGLE canonical checklist-compliance calc used by Web and iPad. `compliant / (compliant + non_compliant)`, excludes na/unknown/incomplete, zero-denominator → null.
- `apps/web/src/lib/dashboard-kpi/registry.ts` — traceable definition for all 28 metrics (12 strategic + 9 operational + 7 inspector) with formula text, unit, owner role, matrix ref, and honest implementation status.
- `apps/web/src/lib/dashboard-kpi/projection.ts` — pure builder mapping the existing web `buildDashboardMetrics` output into `SharedMetric[]` (strategic + operational), honest non-live status for blocked metrics.
- `apps/web/src/lib/dashboard-kpi/inspector-projection.ts` — pure builder implementing the iPad inspector formulas (fixes the P0 compliance mislabel).
- `apps/web/src/lib/dashboard-kpi/loader.ts` — server-only resolver for the published dashboard policy version.
- `apps/web/src/app/dashboard/metrics.ts` — refactored to consume the shared `countChecklistCompliance` (behaviour-preserving; real proof the web dashboard now consumes the shared engine).

## 2. Formula coverage (28 metrics)

REAL live formula (implemented + verified by pure tests):
- STR-KPI-001 Compliance rate trend, STR-KPI-004 Level-2 decision mix, STR-KPI-006 Cancellation rate.
- OPS-KPI-001 Visit pipeline, OPS-003 Active executions, OPS-004 Pending approvals, OPS-006 Today schedule load, OPS-007 GPS overrides today, OPS-008 Live activity feed.
- IPAD-KPI-001 Today's visits, 002 Remaining, 003 Pending attention, 004 Daily progress (N/A on zero visits), 005 Approval outcomes (correctly named, separate from compliance), 006 Checklist compliance (shared calc — the P0 fix).

Honestly blocked (no fabricated value emitted):
- STR-KPI-002 Health Score distribution — `unavailable`: no Health Score snapshot/history table (factories only carries Risk fields; Risk ≠ Health).
- STR-KPI-003 Violation trend by issue time — `decision_required`: `violations` has no issue-time column; by-regulation breakdown is provided, the time-series is not (submission time must not be silently substituted).
- STR-KPI-005 Licence exposure — `unavailable`: no confirmed licence source table.
- STR-KPI-007 Coverage / STR-KPI-008 Uninspected — `not_configured`: no inspection-cycle/eligibility policy table.
- STR-KPI-009 Checklist items by authority — `decision_required`: reuse counting (once global vs per package) undecided.
- STR-KPI-010 Risk-to-attention mismatch — `decision_required`: snapshot-at-visit rule + min-denominator unconfigured.
- STR-KPI-011 Repeat violation rate — `unavailable`: needs stable item lineage + official violation issue time.
- STR-KPI-012 Strategic Summary / OPS-009 Nudges — `not_configured`: AI/rules policy not enabled (Phase-2 AI sub-capability defers only the generation).
- OPS-KPI-002 Expiring soon — `not_configured`: lead time is an SLA policy parameter, not hard-coded (48h is illustrative).
- OPS-KPI-005 Pending publish / IPAD-007 Personal trends — `deferred`: definitions seeded; projection wiring is a small follow-on.

## 3. Live schema ground truth (key facts driving the above)

- No `tenant_id`/`org_id` anywhere — scoping is role + `factories.region`. Regional KPI cuts use `factories.region`.
- `checklist_responses.response = {"value": "compliant"|"non_compliant"|"na"}`, gated by `is_complete`. Confirms the compliance encoding.
- `reviews.status` ∈ pending_review/under_review/approved/returned/rejected; `reviews.decision` ∈ approve/return (reject absent in live data but enum-valid).
- `violations` has NO timestamp and NO status column (STOP-LINE for issue-time metrics).
- `mvp3_kpi_definitions` exists and was EMPTY — used as the governed catalogue seed target.
- Config/versioning precedent: `compliance_*` request engine (maker-checker, append-only versions + head pointer) and `config_versions` / `risk_models`. New tables mirror this pattern.
- `audit_events(actor uuid, object_type, object_id uuid, action, before/after jsonb, requirement_refs[], config_versions jsonb, occurred_at)`.

## 4. Migration (written as a file, NOT applied)

`supabase/migrations/20260721010000_dashboard_kpi_admin_foundation.sql` — additive, forward-only, RLS-protected, effective-dated. Contains:
1. Seed of `mvp3_kpi_definitions` — 28 governed metric DEFINITIONS (formula text mirrors the registry), seeded as `draft` awaiting maker-checker publish. No production metric VALUES seeded.
2. `dashboard_config_parameters` (draft workspace), `dashboard_config_versions` (append-only, effective-dated), `dashboard_config_heads` (active pointer).
3. RLS: SELECT-only policies + `revoke insert/update/delete` on all three tables; every write flows through a guarded security-definer RPC (`dash_create_config_draft`, `dash_update_config_draft`, `dash_submit_config`, `dash_return_config`, `dash_publish_config`) with an explicit role gate — UI hiding can never become authorization.
4. DB-enforced maker-checker (`DASH_MAKER_CHECKER`: publisher ≠ owner), append-only guard trigger on versions, immutable published history.

RLS-touching: yes — enables RLS + policies on the 3 NEW tables only. It NARROWS (read gated to owner/writer/reviewer for drafts; authenticated for published policy); it does not widen any existing table's RLS. Dependencies verified present in live DB: `public.has_any_role(text[])`, `public.has_role(text)`, `profiles.created_at`, empty `mvp3_kpi_definitions`.

## 5. Admin route

`/admin/dashboard-config` (`apps/web/src/app/admin/dashboard-config/`): server component + `actions.ts` (RPC wrappers) + `ActionForm.tsx` (client). Renders:
- KPI catalogue table (all 28 metrics, delivery status, decision refs, seed status).
- Configuration domains table (14 domains, active version + effective date, in-flight draft).
- Draft workspace: create draft (writers), submit (owner), publish/return (independent reviewer only — maker-checker enforced in UI and DB).
Graceful "migration not yet applied" state when the tables are unreadable.

## 6. Validation

- `tsc --noEmit`: PASS (local tsc, deps installed).
- `next build`: PASS. `/admin/dashboard-config` and `/dashboard` both compile.
- Pure tests: `apps/web/e2e/dashboard-kpi-contract.spec.ts` added (Playwright-import convention). Core + projection logic executed directly (Node type-stripping): 22/22 assertions pass — compliance formula, exclusions, zero-denominator null, registry 28-metric completeness, iPad compliance-vs-approval separation, honest not_configured/unavailable statuses.
- The full Playwright suite was NOT run here (its webServer boots a prod server against the live DB + auth setup); it should run in the normal CI/verify path.

## 7. Needs live-DB apply + verification before Lanes B/C

1. Apply `20260721010000_dashboard_kpi_admin_foundation.sql` and confirm: 28 catalogue rows seeded; the 3 config tables + RPCs exist; RLS advisors clean.
2. Verify maker-checker end to end (create → submit → publish as an independent reviewer; confirm `DASH_MAKER_CHECKER` blocks self-publish).
3. Confirm `resolveDashboardPolicyVersion` reads a published head after the first publish.
4. Run the Playwright suite (including the new spec) against the built app.

## 8. Stop-line decisions (recorded, NOT guessed)

These are logged here rather than in the frozen `OPEN_DECISIONS.yaml` (no change-control task). Each blocks only its metric.

- DEC-DASH-001 Compliance formula wording: Excel formula TEXT ("non-compliant / total") contradicts its own worked example ("850/1000 → 85% compliant"). Implemented as Compliant/(C+NC) per title+example + current web; needs sponsor sign-off.
- DEC-DASH-002 Health Score distribution: no Health Score source table; must not substitute Risk.
- DEC-DASH-003 Violation trend: no official violation issue-time column.
- DEC-DASH-005 Licence exposure: no licence source table; expiring-soon lead days unconfigured.
- DEC-DASH-007 Coverage/Uninspected: require a published inspection-cycle/eligibility policy.
- DEC-DASH-007b Expiring-soon lead time: needs an SLA policy value (not 48h hard-coded).
- DEC-DASH-009 Checklist items by authority: count reusable item once globally or per package?
- DEC-DASH-010 Risk-to-attention: risk snapshot-at-visit rule + minimum denominator.
- DEC-DASH-011 Repeat violation rate: stable item-version lineage + official violation date + lookback months.
- DEC-DASH-012 / 012b Strategic Summary + Operational Nudges: AI/rules policy + evidence-linkage rules unconfigured.
- DEC-DASH-013 iPad Remaining/Daily progress completion state: implemented as governed submitted state (not Level-2 approval); sponsor may override.
