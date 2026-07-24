# F0 Web/Admin Shell Correction — Implementation Lease

## Sponsor authority

- Sponsor decision: **APPROVED — bounded F0 correction lease**
- Decision evidence: 2026-07-24 sponsor direction, “I think it's approved … get into more implementation without shortcutting”
- Branch: `codex/f0-shell-authority-correction`
- Worktree: `/Users/vikramindla/Developer/Inspection-codex-f0-shell`
- Baseline: `3323a8ef3d788c1c157a9bf0d63e32a3d9334e42`

## Contract scope

- Task: `TASK-WEB-ADMIN-PHASE1-F0-CORR-002`
- Process: authenticated Web/Admin shell under `CC-WEB-ADMIN-PHASE1-001`
- Requirements: `CR-001..CR-478` preservation; no requirement disposition changes
- Shell acceptance: `WA-SHELL-AC-001..003`, `WA-SHELL-AC-014..018`
- F0 acceptance: `WA-F0-AC-001..006`
- Preservation: `WA-SP-001..009`
- Authority: `WA-SHELL-SRC-001`
- Engines preserved: authenticated SSR, RLS-scoped search, RBAC route guards,
  notifications, theme, locale/RTL, fail-closed AI entry, account and sign-out.

## File lease

- `apps/web/src/lib/shell-navigation.ts`
- `apps/web/src/components/ShellClient.tsx`
- `apps/web/src/components/NotificationBell.tsx`
- `apps/web/src/app/saqeel-components-legacy.css`
- Focused F0 shell tests under `apps/web/e2e/`
- F0 review/evidence records under `.codex-review/`

`Shell.tsx` is read-only unless a proven prop/translation defect requires it.

## Transitional wiring decisions

- The fixed Web/Admin `Execution` destination is represented by its authority
  target `/planning/visits?view=execution`, but the runtime continues to the
  retained real `/visits` oversight route until the M2 preview gate is certified
  and explicit `APPROVED FOR CUTOVER` is received.
- Field-only Inspector sessions continue to `/field`; `/field/**` is never
  exposed to a Web/Admin persona.
- `Analytics` is present in the fixed hierarchy with authority target
  `/dashboard?view=analytics`, but remains visibly disabled with an honest
  not-yet-wired reason until M1 provides a real Analytics view. It must not
  silently render Strategic content.
- Existing detailed Administration, Compliance, and Insights routes are
  retained as governed module children; none is deleted or redirected.

## Do not touch

- `/field/**`, PWA, iPad, offline execution, manifests, or service worker
- APIs, database, migrations, RLS/RBAC policy, workflow, audit, or providers
- current/target route cutovers or compatibility redirects
- `main`, `setup/Inspection`, existing stashes, remote systems, or deployment
- user-owned dirty files in the canonical checkout

## Exit evidence

- exact authority/manifest contract tests
- role and Field-isolation negative tests
- typecheck and production build
- EN/LTR and AR/RTL, light/dark, desktop/tablet/mobile runtime checks
- keyboard, drawer, collapse, notification/account, and accessibility checks
- 478/478 validator
- visible Chrome proof of the real application
