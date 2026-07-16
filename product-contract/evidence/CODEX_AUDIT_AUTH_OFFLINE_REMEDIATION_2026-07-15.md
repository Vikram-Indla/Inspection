# Codex wiring remediation — auth-safe error and offline sync state — 2026-07-15

## Scope

The complete no-exclusion run exposed two reproducible runtime wiring defects:

1. The login client treated an empty Supabase session with no transport error as
   success, then navigated to `/launch`; the unauthenticated redirect returned to
   `/login` without the required neutral `ERR-AUTH-001` alert.
2. An in-flight offline replay could finish after the browser's `offline` event and
   overwrite the visible sync state back to `synced`.

## Remediation

- `LoginClient` now requires a non-null session before `/launch`; an empty session
  is mapped to the same safe neutral copy as invalid credentials.
- Field `Workspace` now gives the offline event a stable cleanup handler and prevents
  stale replay completions from overwriting an active offline state.

## Verification

- `npm run typecheck` — PASS
- `npm run build` — PASS
- Focused auth-negative + offline drill: **7/7 PASS** (3 auth setup + 3 negative-auth + 1 offline)
- Isolated CD-031 + shell regression: **24/24 PASS**
- Complete no-exclusion regression before this remediation: **170 passed / 11 failed / 1 skipped / 5 not run**.
  The reproduced auth/offline failures are closed here; remaining full-run failures were
  shared-live golden-journey/package state and were not changed by this remediation.

## Boundaries

This closes client/runtime wiring only. It does not authorize a migration, provider,
policy, design-gate, merge, push, deployment, or `main` modification.
