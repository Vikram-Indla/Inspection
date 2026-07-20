# Inspection performance remediation regression results

## Passing

- Post-audit navigation-progress guard (`496ed0c`) — typecheck PASS; production
  build PASS; protected shell/design source contracts 16/16 PASS; reduced
  production benchmark 1/1 PASS across six warm route transitions. The reduced
  run validates that the accessible progress indicator clears after each
  destination renders; it does not replace the definitive 90-sample dataset.
- `npm --prefix apps/web run typecheck` — PASS.
- `npm --prefix apps/web run build` — PASS; 73 app routes emitted; shared First Load JS 103 kB.
- Performance benchmark — PASS: 90/90 route samples and destination assertions, 8.8 minutes final.
- Corrected focused suite from `apps/web` — PASS: 23/23 (auth setup, Planning, Reviews, shell/RBAC source contracts).
- Negative authentication — PASS in the broader run: wrong password, unknown account, unauthenticated protected route.
- Visual evidence capture — PASS after correction: desktop dark, iPad landscape light, iPad portrait light; before and after.

## Broader focused-run record

An earlier invocation from the repository worktree root produced 25 pass / 8 fail. Five failures were source-file ENOENT caused by the wrong process working directory and passed in the corrected app-root run. Two Dashboard failures were writes to the approved external evidence root being denied inside that particular runner. One Dashboard entity-search test timed out waiting for a label; it remains unresolved and is recorded, not silenced.

## Not run or not confirmable

The full mutation-heavy Playwright inventory was not run. Safe evidence did not establish tenant-isolation, inspection create/edit/save/submit, attachments, reports, notifications, sorting, pagination, React commit count, memory growth, Lighthouse, or database query plans for this pass. Existing behavior was not modified in those domains. I cannot confirm those items from the available evidence.

## Residual failures

Operations continues to log statement timeouts for corrective actions and geo-override evidence. Useful-content performance targets remain failed. The forward database migration is unapplied because `supabase migration list --linked` reports that no project ref is linked.

The Supabase connector was also probed read-only on 2026-07-20 for the governed
project. Project metadata, migration history, performance advisors and catalog
index reads all returned `You do not have permission to perform this action`.
No remote SQL or DDL was executed.
