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

## Branch and parallel-work audit (historical snapshot)

The CD-001, CD-003 and CD-021 branch tips are ancestors of the consolidation branch. CD-023's unique migrations, tests, localized UI and evidence are present in the candidate tree even though its branch tip is not an ancestor; its reconciliation is recorded before branch cleanup. Concurrent Claude worktree changes were preserved, including the CD-020 planning slice and `.next-stale-backup/`. Four stashes remain untouched because they are not stale branches and may contain user-owned recovery material; no stash was dropped.

Final disposition in that historical snapshot: local feature branches `feat/cd-001-v7-atlas`, `feat/cd-003-role-resolution`, `feat/cd-021-bulk-targeting`, `feat/cd-022-single-identity-lens`, `feat/cd-023-immediate-authority-bar`, and local `setup/Inspection` were reported as deleted after reconciliation; CD-002 had no separate branch and was included in the CD-001 baseline history. That snapshot is superseded by the current branch graph below; it is retained for provenance and is not current proof of branch cleanup.

## Current branch graph reconciliation — 2026-07-15

The current checkout is `setup/Inspection` at `4344225`, with a dirty worktree;
the branch is **ahead 1 / behind 1** relative to `origin/setup/Inspection`.
`origin/main` does not exist in the current remote, so no remote-main SHA can
be verified. The current local refs were inspected without deletion:

| Ref | Relation to `setup/Inspection` | Disposition |
|---|---|---|
| `main` (`9360fc9`) | Ancestor; local only, `origin/main` gone | Preserve until a clean, verified baseline is created and explicitly promoted. |
| `feat/cd-025-plan-review-publish` (`27448d6`) | No material tree delta from `setup/Inspection`; its merge is represented | Candidate for deletion only after clean-tree verification. |
| `fix/cd-041-verified-gate-live` (`6c7cd68`) | Ancestor of `setup/Inspection`; remote ref still exists | Candidate for deletion only after remote/default-branch protection is confirmed. |
| `docs/cd-028-records` (`1dc1b60`) | Ancestor of `setup/Inspection`; remote marked gone | Local cleanup is deferred until the dirty worktree is reconciled. |
| `feat/cd-006-regulation-detail-and-version` (`0c9c897`) | **One unique commit not represented by `setup/Inspection`**; changes include admin configuration code, test, approval record and forward migration. No matching CD-006 approval appears in `HUMAN_APPROVALS.yaml`, and the admin design lane remains `implementation_authorized: false`. | Do not delete or silently merge: it is outside the authorized CD-001..024 slice and requires explicit scope disposition. |
| Four stashes | Not branches; user-owned recovery material | Preserved; none dropped. |

No branch was deleted in this continuation. The unique CD-006 commit is a
real preservation boundary, not stale noise; the worktree must be cleaned and
that scope decision made before any merge/push or branch deletion can be
claimed.

## Continuation reconciliation — 2026-07-15

The historical evidence above is preserved. The current checkout supersedes its
intermediate counts and branch snapshot:

- AC ledger: **493 rows = 14 verified_live / 460 implemented / 19 partial / 0
  missing**. The 19 partials are listed in
  `CODEX_AUDIT_REMAINING_PARTIALS_2026-07-15.md` and remain explicit upstream
  provider/schema/policy/configuration or pending-migration boundaries.
- CD-027 republish notification, field return/reschedule/cancellation/arrival
  handoffs, fail-closed arrival persistence, visit-linked evidence readback,
  Operations active-state refresh, and CD-041 verified-transition wiring are
  implemented and source/runtime checked.
- The latest fresh no-exclusion Playwright regression completed **207 passed / 1
  skipped / 0 failed** across 208 discovered tests. The one skip is the expected
  data-dependent Arabic/RTL comparison case; no product or environmental failure
  was recorded. The complete CD-021 suite remains **24/24 PASS**.
- A read-only live probe confirms `vs_mark_session_verified` and the `arrival`
  enum, but `evidence.evidence_note` is absent. The forward repair migration
  `20260715193000_field_arrival_evidence_column_repair.sql` is ready but has not
  been applied or replay-verified.
- A fresh read-only re-probe on 2026-07-15 still returns HTTP 400 for
  `evidence?select=evidence_note&limit=1` (`column evidence.evidence_note does
  not exist`); `geo_events` arrival and `reviews` reads remain reachable. No
  shared DDL was applied by this continuation.
- CD-031 has an independent Codex audit record, but the authoritative
  `WIRING_MAP_CD-031.csv` is absent, so DEC-012 certification is withheld.

- The staged bulk-review handoff now records client-held factory IDs that are no
  longer readable in the caller's current scope and renders a distinct scope
  change state instead of silently dropping them. Production rebuild plus the
  focused CD-021 selection subset passed **5/5** including auth setup and the
  new out-of-scope assertion.
- The generated AC ledger note for M04-045 was corrected: capture/outbox code is
  present, while the live evidence column and replay proof remain partial. The
  regenerated ledger stays at **493 rows = 14 verified_live / 460 implemented /
  19 partial / 0 missing**.

Current disposition is **REMEDIATION_INCOMPLETE_EXTERNAL_BLOCKERS**. The worktree
is dirty on `setup/Inspection`; no commit, merge, push, deployment, or `main`
modification has been performed from this continuation. The baseline cannot be
called complete until the live repair/replay, remaining upstream decisions, map
handoff, and sponsor runtime acceptance are resolved.

## Exit conditions

Do not call G11/G12 released: provider adapters, credential rotation, region confirmation, image rights/geographic-source confirmation and sponsor runtime acceptance remain open. After the full regression and migration certification are complete, commit the audited tree, merge to `main`, verify the remote SHA, and delete only branches proven represented by this baseline.
