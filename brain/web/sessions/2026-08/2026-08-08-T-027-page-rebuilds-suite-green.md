# 2026-08-08 · T-027 — Five-route rebuild, Jira canon alignment, release-suite repair

`task: T-027` · `status: partial (final full-suite gate pending)` · `duration: ~8h (orchestrated)`
`rules applied: WEB-001..WEB-009, governance.md, tests.md`

---

## Goal

Rebuild every oversized route onto the current SAQEEL design system and tokens,
align all INSP Jira stories to the canonical Google Drive documentation, and
drive the Playwright release suite to green with no regressions.

## What changed

### Route rebuilds (all onto semantic tokens + saqeel primitives, thin routes)

| Route | Lines before → after | Logic destination |
| --- | --- | --- |
| /operations | 1361 → 21 | features/operations/queries.ts + operations/sections/* (12 files) |
| /planning | 555 → 39 | features/planning/{queries,links,view}.ts + components/planning/* |
| /enforcement-library | 410 → 25 | features/enforcement/* + components/enforcement/* |
| /reviews | 309 → 33 | features/reviews/{queries,types,queue-rows,strings,sla,access}.ts |
| /compliance (+approvals) | 303/499 → 25/25 | features/compliance/* + components/compliance/* (12 dirs) |

Deleted after zero-import checks: LibraryTabs.tsx, CreateVisitSection.tsx,
RefreshButton.tsx, ExportButton.tsx, SavedViewsButton.tsx (planning route dir).

### Shell / i18n

- shell-topbar: 8 missing date-scope strings added (en+ar common.json), locale
  prop wired — fixed the standing HEAD typecheck error.
- Admin ⌘K palette Arabic moved from inline `adminPaletteCopy` ternary into
  i18n resources (6 keys in i18n-keys.generated.ts + scripts/seed_arabic.py);
  admin-shell-i18n-source-contract slice now covers the palette region with no
  carve-out.
- WCAG fixes: `--sqx-text-disabled` contrast (2.73:1 → ≥4.88:1 both themes),
  my-tasks chip count contrast, topbar scope-control overlap ≤760px,
  EmptyState heading order, nested-main landmarks on reviews queue, planning
  bucket/toolbar contrast + target size.
- Restored governed removals silently reverted by the Aug-2 consolidation:
  execution workspace manual add-action-form removal, REQ-011/016 resume-target
  guards in planning/single, /admin/execution nav registration, field
  settings→readiness link, CD-002 OTP recovery request leg (new
  reset/RecoveryRequest.tsx — closes the AUTH-02 dead-end).

### Test infrastructure

- Dedicated e2e identities `e2e-{planner,supervisor,inspector,reviewer,admin,ops}
  @mim.gov.sa` (roles + profiles mirrored; ops = National scope). Cohort
  accounts (admin1-5/planner1-5/supervisor1-5/inspector1-30) re-aligned to the
  documented SAQEEL_CROSS_ROLE_PASSWORD reference (TEST_ACCOUNTS.md contract;
  DB had drifted). Secret lives only in apps/web/.env.local.
- auth.setup.ts: locale-prefix-aware URL waits, 30-minute storage-state reuse,
  one redirect retry (Supabase per-IP grant throttling).
- Staging reconciliation to canonical migrations: violation_codes ×3 +
  penalty_mappings ×3 (migration 0003 values), engine_settings `otp` row,
  KPI-VERIFY fixture dataset (region Riyadh / city "Dashboard KPI").
- seed-dashboard-kpis.mjs: env-sourced personas (no hardcoded credentials),
  planner-coordinate override removed (trigger-forbidden on bulk visits).

### Release suite

445 baseline failures across 119 spec files triaged in two waves by domain
agents. Stale source-contracts repointed to successor modules; runtime
assertions updated to the approved revamp UI; permission/negative/a11y
assertions never weakened (several strengthened). dashboard-kpi-seed
re-grounded to the fixture-exclusion contract (verification data readable at
record level, never surfaced in operational UI).

## Decisions

- Operations UI excludes `source="verification_fixture"` establishments by
  design; specs assert the exclusion, not fixture visibility.
- Review & Approval decisions are Approve/Return/Reject only (Execution BRD
  §15); invented Escalate/hierarchy content removed from INSP-27/28 and held
  on INSP-490/247 pending PO ruling (§1.3 left open).
- e2e ops persona is National-scope supervisor (Operations Manager posture).

## Jira alignment (Drive docs = canon)

44 story edits, 22 creates (INSP-793..814 range + 805/807/809/811), 24
[Doc-alignment] flags across INSP-1/2/3/4/5/6/7/8/9/10 epics. Dashboard/Ops
formulas, Planning list/lifecycle contract, Execution three-tier status model,
Compliance Release-Date semantics and F360 read-only contract now verbatim in
stories. Evidence-status lines repointed from retired ITM MIM-V0.2 / false
"expert judgement" claims to the canonical Drive documents.

## Known gaps (cannot close from this environment)

- SUPABASE_SERVICE_ROLE_KEY empty → golden-journey NEG leg,
  bau-6267 fixture guard, pln-browser-certification expiry leg.
- No Mapbox token → mvp2-mapbox-live, m04 device-ETA leg.
- field-offline-runtime needs the production standalone server (build is
  human-only per WEB-005 §8).
- planning-closure-p0 fails closed awaiting authority packet
  PLANNING-CLOSURE-P0-AUTHORITY-001 (AWAITING_PO_COUNCIL_REVIEW).
- insp-primary-cohort spec now unblocked by the cohort password reset.

## Verification

- `npx tsc --noEmit` — zero errors (was 1 at HEAD).
- check:design-system-v5 — 127 findings, all pre-existing (main: 128).
- Full-suite Playwright gate re-run pending at session close; per-file green
  confirmations recorded by each repair wave.

## Parked

- Frozen-sheet `.planning-*` rules in saqeel-runtime.css (a spec still asserts
  them); FieldTabs.tsx retirement; `sq-*` classes in approvals/loading.tsx;
  design-system-v5 127-finding backlog; admin `/operations/live` ruling
  extension; Compliance Library silent first-regulation fallback.
