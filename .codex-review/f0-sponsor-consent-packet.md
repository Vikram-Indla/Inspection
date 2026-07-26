# F0 Shared Shell — Sponsor Consent Packet

Date: 2026-07-24  
Design revision: `WA-SHELL-r4`  
Authority: `WA-SHELL-SRC-001`  
Authority SHA-256:
`b870e06820feb5784687dcb62289aa24a0070635cbc7b606157ec2128bab9bc2`

## Decision requested

Authorize one bounded frontend/test implementation lease for F0 Shared
Web/Admin Shell.

This decision does **not** authorize Dashboard, Operations Center, Factory 360,
Planning, Field/PWA/iPad, backend, API, schema, RLS/RBAC, workflow, provider,
deployment, merge or release work.

## Design evidence passed

Codex independently exercised `WA-SHELL-r4`:

- 1440×900;
- 1024×768;
- 768–899 drawer;
- 412×915;
- 390×844;
- 320×568;
- English/LTR and Arabic/RTL;
- light and dark;
- expanded navigation and compact drawer;
- compact More shell-actions sheet;
- Loading;
- Unauthorized;
- Provider unavailable.

Verified outcomes:

- exact fixed labels, grouping and order;
- Execution target documented as `/planning/visits?view=execution`;
- `/field/**` excluded from the Web/Admin rail;
- approved bilingual `SAQEEL صقيل` asset;
- no overlapping labels or route annotations in the sponsor-facing rail;
- all named frames scale to fit the evidence canvas;
- mobile access to search, date/region, AI, theme and language;
- truthful state evidence without fabricated data.

## Current runtime failures

- Execution currently links to `/field`.
- Compliance uses three non-authoritative labels.
- Insights exposes AI Insights instead of Analytics.
- Administration exposes a flat/crowded structure instead of six fixed hubs.
- The runtime rail renders generated Arabic-only text.
- Some shell tests assert current implementation behavior rather than the
  authority.
- Current shared-shell styling includes legacy/unloaded Astryx selectors and
  cannot be certified from the existing focused pass.

The real shell's working search, notifications, theme, account, RLS/RBAC,
responsive drawer, focus, RTL and fail-closed AI behavior must be preserved.

## Proposed implementation boundary

Frontend/navigation lease:

- `apps/web/src/lib/shell-navigation.ts`;
- `apps/web/src/components/ShellClient.tsx`;
- one co-located native-SA​​QEEL shell stylesheet/module if required to replace
  unloaded legacy shell styling;
- `apps/web/src/components/Shell.tsx` only if the approved six-hub rendering
  cannot be represented by the current server mapping without a bounded change.

Test lease:

- `apps/web/e2e/shell-navigation.spec.ts`;
- `apps/web/e2e/compliance-shared-shell.spec.ts`;
- `apps/web/e2e/web-admin-f0-foundation.spec.ts`;
- `apps/web/e2e/inspector-shell-uplift.spec.ts`;
- bounded visual/responsive shell coverage needed to prove authority parity.

No route page, business action, query, RPC, database, migration, permission
policy or backend service is in the lease.

The final exact file list must be frozen in a new isolated worktree before the
first edit. The dirty canonical checkout and existing stashes remain untouched.

## Acceptance tests

1. Exact manifest-derived labels, order, parents and targets.
2. `/field/**` absent from every Web/Admin navigation result.
3. Field-only persona remains isolated from Web/Admin.
4. Six Administration hubs preserve all existing detailed routes as governed
   children/subtabs.
5. Approved wordmark assets render in EN/AR and light/dark.
6. Search, notifications, date/region scope, AI, account, language and theme
   preserve current service and permission behavior.
7. Desktop, tablet and mobile navigation/actions work at all six named widths.
8. Loading, empty, error, unauthorized, degraded and provider-unavailable
   behavior is truthful.
9. Keyboard/focus and accessibility checks pass.
10. Mutation tests fail for a wrong label, wrong `/field` target, wrong asset
    and stale authority evidence.
11. Production build and the relevant protected regression suite pass.
12. The exact reviewed build is shown in Chrome before sponsor acceptance.

## Ownership

- Codex: implementation lease owner and orchestrator.
- Claude Code: read-only reviewer during implementation.
- Claude Design: design revision owner; no product-code writes.
- ChatGPT: challenge/advisory only.
- Sponsor: implementation consent and final visible acceptance.

## Current recommendation

**APPROVE F0 FOR A BOUNDED FRONTEND/TEST LEASE.**

Design is ready. Runtime is not. M1 Dashboard remains held until the corrected
real F0 shell is tested and accepted in Chrome.
