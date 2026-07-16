# CD-030 remediation verification — current worktree

Date: 2026-07-15  
Reviewer: Codex continuation audit  
Scope: NF-1 role/read mismatch, not-found/degraded distinction, stale-banner localization, and returned-scope database shape.

## Result

**Code and focused verification PASS. Live migration application remains BLOCKED by missing Management API/DB credentials.**

The current implementation now:

- aligns `submission_versions` SELECT RLS with the roles admitted by the review workspace (`reviewer`, `auditor`, `ops`, `planner`, `leadership`, plus assigned inspectors); no write permission is added;
- uses `maybeSingle()` for the inspection read, so a zero-row/outside-scope result is distinct from an actual provider error and receives explicit outside-scope copy;
- wires localized `staleTitle`, `staleBody`, and `staleRefresh` strings into the comparison component;
- adds a forward database check that `reviews.returned_sections` is either null or a JSON array. Dynamic package-section membership remains server-validated in `decide()` because it is package-defined, not a static policy value.

## Verification

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `cd-030-version-comparison.spec.ts` | **16 passed, 1 skipped** (3 auth setup + 13 product; the only skip is data-dependent Arabic/RTL workspace availability) |
| Source assertions | PASS for scope-RLS migration, DB-shape constraint, `maybeSingle()`/outside-scope copy, and localized stale strings |
| Live migration preflight | **BLOCKED** — Management API returned HTTP 403 and the local keychain no longer contains the previously used PAT; no live DDL was attempted |

The migration is intentionally forward-only at `supabase/migrations/20260715160000_cd030_review_scope_rbac.sql`. It must be applied through the authorized Supabase SQL path and then independently checked against `pg_policies`/`pg_constraint`; this report does not claim live schema application.

## Remaining CD-030 boundaries

Provider/media, package-semantic and metadata diff sources remain explicitly unavailable by design. No stale threshold or provider was invented. Sponsor/runtime acceptance and live migration proof remain separate release conditions.

Historical R1–R3 reports retain the findings as originally observed; the current
worktree remediation and verification above supersede their pre-fix not-found,
role-gating, stale-localization, and database-shape observations. They are preserved
for audit traceability and are not current-state failure claims.
