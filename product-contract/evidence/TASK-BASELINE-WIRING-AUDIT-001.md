# TASK-BASELINE-WIRING-AUDIT-001

Date: 2026-07-14  
Reviewer: Codex (independent wiring pass)  
Scope: CD-001, CD-002, CD-003, CD-020, CD-021, CD-022, CD-023, CD-024, plus cross-screen wiring and D2L handoffs.

## Authority and boundary

The audit used the product contract, current slice, task router, decision register, manifests and wiring maps as authority. CD-024/CD-025 route and lifecycle work remains blocked where the contract requires sponsor route/ownership/design authorization; this audit does not infer a route or implement an unapproved screen. Backend safety improvements are prepared as forward migrations, not applied to production by this task.

## Verdicts

| CD | Verdict | Evidence / remaining condition |
|---|---|---|
| CD-001 | PASS for wiring | Authenticated handoff, neutral auth errors, role route and public-safe atlas are wired. Targeted and negative-auth coverage is green. Release confirmations remain open for source-image rights, official geographic anchors and Arabic-only raster treatment. |
| CD-002 | PASS for wiring | Reset path preserves anti-enumeration and focus/error behavior; targeted reset suite is green. |
| CD-003 | PASS for wiring | `/launch` classifies missing session, auth transport and role-read failures separately; no-workspace is a guarded terminal state. Targeted launch suite is green. |
| CD-020 | PASS for implemented slice | Planning home is wired to real package/visit/factory sources, Planner guard, locked-field behavior and fail-closed reads. Dedicated planning-home contract tests are green. |
| CD-021 | PASS pending forward migration runtime certification | Bulk targeting and P02 review are connected through session storage, canonical publish action and real RLS reads. Publish is atomic in `20260714091727`; deploy that migration and rerun the live publish/rollback checks before sponsor acceptance. |
| CD-022 | PASS pending forward migration runtime certification | Single-visit validation, duplicate fail-closed reads, assignment overlap and retry are wired. `20260714091726` adds `validated`; `20260714091727` provides atomic single publish and replaces the sequential write path. Deploy and rerun the two live publish tests before final closure. |
| CD-023 | PASS for current live slice | Immediate create, urgency contract, location provenance, assignment overlap, notification truth and field handoff are wired. Focused runtime suite: 18/18. The prior ROUND3 PARTIAL record is superseded for the three Startup sibling error sinks, which now use stable localized copy; a fresh independent audit after migration certification is still required by DEC-012. |
| CD-024 | BLOCKED_UPSTREAM | `/planning/:id/configure` remains unimplemented and `/planning/bulk/review` has a governed screen-ID collision. No route, approval lifecycle, attempted-conflict audit or provider-delivery behavior was invented. |

## Cross-screen wiring confirmed

- Planner role and factory/package reads fail closed; RLS remains the authority at write time.
- Shared duplicate-active-visit lookup is used by bulk and single planning, with read errors treated as unavailable rather than safe-to-publish.
- Package, visit type, execution mode, window, inspector eligibility and overlap are revalidated server-side.
- Bulk and single publish use transaction-scoped RPCs; notifications are queued as durable records and are not represented as delivered provider messages.
- `source_synced_at` is the freshness provenance; no stale threshold was invented.
- Field start/check-in/exception, virtual OTP and review actions keep provider/RLS details in diagnostics and return stable user copy.
- Location confirmation remains visit-owned and provenance-aware; no fabricated GIS or geofence policy was introduced.

## Verification matrix

- `npm run typecheck` — PASS.
- `npm run build` — PASS.
- CD-001/CD-002/CD-003/CD-020/CD-021/CD-022 focused runtime sweep — 48/48 PASS (publish tests requiring the new migration were excluded pending runtime certification).
- CD-023 immediate authority suite — 18/18 PASS.
- Full no-exclusion Playwright regression — 92/99 passed. Two CD-022/golden-journey publish failures are the expected linked-schema absence of `publish_single_visit`; four dependent golden-journey tests were consequently skipped. The KPI seed panel assertion also fails because its fixture rows are now `expired` while Operations intentionally monitors `published` rows only; the seed test permits expiry but still expects those rows in a published-only panel. This is a fixture/test contract inconsistency, not a reason to broaden monitoring to expired visits.
- `supabase db lint --local` — unavailable: no local Postgres/Docker runtime in this environment. The generated migrations were created with `supabase migration new`; no live deployment was performed.

## Branch and parallel-work audit

The CD-001, CD-003 and CD-021 branch tips are ancestors of the consolidation branch. CD-023's unique migrations, tests, localized UI and evidence are present in the candidate tree even though its branch tip is not an ancestor; its reconciliation is recorded before branch cleanup. Concurrent Claude worktree changes were preserved, including the CD-020 planning slice and `.next-stale-backup/`. Four stashes remain untouched because they are not stale branches and may contain user-owned recovery material; no stash was dropped.

## Exit conditions

Do not call G11/G12 released: provider adapters, credential rotation, region confirmation, image rights/geographic-source confirmation and sponsor runtime acceptance remain open. After the full regression and migration certification are complete, commit the audited tree, merge to `main`, verify the remote SHA, and delete only branches proven represented by this baseline.
