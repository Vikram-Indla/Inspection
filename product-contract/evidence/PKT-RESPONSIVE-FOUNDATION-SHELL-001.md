# PKT-RESPONSIVE-FOUNDATION-SHELL-001 Evidence

- Task: `TASK-SAQEEL-RESPONSIVE-REVAMP-001`
- Change control: `CC-SAQEEL-RESPONSIVE-REVAMP-001`
- Branch: `revamp/foundation-shell`
- Baseline: `0fac821b0c5966b351d9eba3ad2cacea8a29ecba`
- Authorization: Product Owner instruction, “You got all the approvals. You must just go and do the job and continue.”

## Implemented contract

- Every authenticated application route renders through the persistent parent `AppShell`.
- Field routes retain verified-user, Inspector-role, locale/direction, field density, and session/offline boundaries without mounting a second drawer or bottom-navigation shell.
- Admin routes use the shared shell and a root `AdminRouteBoundary`.
- Planner and Inspector can discover `/admin` but receive the localized unauthorized state before configuration content is rendered.
- Legacy administration capability profiles retain authorized deep-link discovery; nested module boundaries remain authoritative.
- Business catalogue visibility is presentation only. Route guards, server actions, RLS, workflow guards, and audit controls were not weakened or modified.

## Verification

1. `npm run typecheck`
   - Result: PASS.
2. `npx playwright test e2e/shell-navigation.spec.ts e2e/compliance-shared-shell.spec.ts e2e/responsive-foundation-shell.spec.ts --config=playwright.static.config.ts --grep-invert="responsive and language behavior" --reporter=line`
   - Result: PASS, 23/23.
   - Covers shared catalogue equality, Administrator discovery, unauthorized admin boundary, common shell ownership, Arabic/RTL/theme/responsive source contracts, authenticated/RLS-scoped global search, and retained route guards.
3. `npm run build`
   - Result: PASS. Next.js compiled, type-checked, generated 58 static pages, and emitted the complete dynamic route manifest.
   - Non-blocking existing warning: Supabase browser package references a Node API in the Edge-runtime import trace.
4. `git diff --check`
   - Result: PASS.

## Negative-path evidence

- The root admin layout does not include `planner` or `inspector` in its allowed capability roles.
- `AdminRouteBoundary` performs the allowed-role check before rendering its shell-owned unauthorized state and states that no configuration data has loaded.
- No migration, RLS, RPC, service-worker, offline-outbox, submission, or business-feature implementation was changed.

## Deferred evidence

Authenticated EN/AR screenshots were not fabricated. The isolated worktree has no `playwright/.auth/planner.json` persona state; browser capture remains a later runtime evidence step and is not represented as complete here.
