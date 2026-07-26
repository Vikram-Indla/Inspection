# PKT-RESPONSIVE-ADMIN-RBAC-008 — acceptance evidence

Status: `TECHNICAL_PASS_READY_FOR_REVIEW`

## Scope and authority

- Task: `TASK-SAQEEL-RESPONSIVE-REVAMP-001`
- Change control: `CC-SAQEEL-RESPONSIVE-REVAMP-001`
- Process: `M8`
- Screen: `SCR-ADM-090`
- Acceptance: `WA-M8-AC-001..006`, `MVP2-AC-0192`,
  `MVP2-AC-0227`, `MVP2-AC-0241`, `MVP2-AC-0256`
- Design: canonical `Saqeel Revamp.dc.html` Users & Roles and unauthorized
  Administration states
- Baseline: `3278fb91466fbb85dc7c17caaa5d81f2e069d69b`
- Branch: `revamp/admin-rbac`

The implementation is a presentation and compatibility migration only. It did
not replace role storage, apply DDL, change RLS/RPC policy, mutate shared data,
alter the accepted Inspector field-home rule, invent a request-access workflow
or collapse the external factory representative into an internal role.

## Delivered contract

- The internal user-facing role vocabulary is exactly Planner, Inspector and
  Administrator.
- The approved thirteen-role workbook map is explicit in
  `apps/web/src/lib/admin-role-convergence.ts`.
- Planner and Inspector map directly. The eleven approved internal capability
  profiles map to the Administrator presentation while retaining their original
  role keys for route, action, RLS and audit enforcement.
- `factory_rep` remains explicitly unresolved/external and maps to no internal
  canonical role.
- The parent `/admin` layout evaluates the role boundary before rendering any
  protected child route.
- Planner direct URLs and refreshes render the canonical shell plus a localized
  refusal and return to `/planning`; the protected user roster and management
  controls do not render.
- The Users view displays RLS-visible accounts with canonical role labels. The
  Roles view displays exactly three canonical cards and discloses compatible
  capability profiles without treating the presentation title as blanket
  authority.
- Existing guarded grant/revoke RPCs, self-escalation refusal, last-security-
  administrator guard, role-permission gate, next-request timing, partial-source
  failures and audit wording are preserved.
- Missing Admin/RBAC Arabic UI has reviewed MSA fallbacks. Unique migration keys
  prevent earlier catalogue copy from overriding the approved unauthorized and
  three-role messages.
- User and capability tables become labelled records below 40 rem. The shared
  empty state accepts a backward-compatible heading level so the refusal has a
  valid h1/h2 hierarchy without changing any existing caller.

## Verification

Final commands:

```text
npm run typecheck
npm run build
PIXEL_HARNESS=1 PLAYWRIGHT_PORT=3418 npx playwright test \
  e2e/admin-access-route-aware.spec.ts \
  e2e/responsive-admin-rbac.spec.ts \
  e2e/execution-access-contract.spec.ts \
  e2e/shell-navigation.spec.ts \
  --project=e2e --no-deps
```

Results:

- TypeScript: PASS
- Next.js production build: PASS, 58 static-generation steps completed and
  `/admin/access` emitted as a dynamic route
- Focused and protected Playwright contracts: PASS, `39/39`
- Fresh authentication used for the required Planner and Administrator
  personas. Reviewer and Ops fixture authentication were not needed by this
  packet; their unrelated setup attempts returned the existing remote 400
  response and are not presented as packet evidence.
- Planner direct URL and refresh refusal: PASS
- Arabic refusal: PASS, RTL and zero Axe violations
- Administrator Users/Roles: PASS
- Canonical role mapping and external-persona hold: PASS
- Existing guarded access-action regression: PASS
- Shared shell, navigation, Inspector field-home constant and responsive
  interaction regression: PASS
- English and Arabic Administrator role views: PASS, keyboard reachable and
  zero Axe violations
- Responsive matrix: PASS for `320`, `375`, `390`, `768`, `1024`, `1280`,
  `1440` and `1920` in English/Arabic and light/dark (`32` combinations)
- Document horizontal overflow: zero (within the one-pixel browser rounding
  tolerance) in all 32 combinations
- Production DDL, RLS/RPC, applied migrations and shared data mutation: NONE

The production server used the isolated worktree's final standalone build on
`127.0.0.1:3418`; the run did not reuse the unrelated development server on
port 3000.

## Binary evidence

External approved evidence root:

`/Users/vikramindla/Desktop/Inspection Documentation/migration-evidence/admin-rbac/2026-07-26`

Contents: 35 PNG files, 22 MB.

- `access-{en|ar}-{light|dark}-{320|375|390|768|1024|1280|1440|1920}.png`
  — the complete 32-combination matrix
- `planner-unauthorized-en.png`
- `planner-unauthorized-ar.png`
- `access-ar-dark-390-viewport.png` — readable mobile viewport inspection

Human visual review confirmed the shared shell, breadcrumb, three source-backed
summary cards, four access tabs, canonical governance banner, canonical role
badges, responsive labelled records, Arabic reading order, dark theme and
unauthorized return action. No fixture count is presented as a global total:
the UI labels `69` as accounts visible through the current RLS session.

## Acceptance disposition

| Acceptance | Result | Evidence |
|---|---|---|
| WA-M8-AC-001 functional | PASS | Authenticated Administrator Users/Roles runtime plus preserved governed actions |
| WA-M8-AC-002 negative security | PASS | Planner direct URL/refresh refusal before child data; action guard regression |
| WA-M8-AC-003 visual | PASS | Canonical structure plus 35-file human-reviewed evidence set |
| WA-M8-AC-004 RTL/responsive/a11y | PASS | 32-combination matrix, zero overflow, EN/AR Axe and keyboard checks |
| WA-M8-AC-005 regression | PASS | 39/39 focused route, action, role, shell and navigation contracts |
| WA-M8-AC-006 evidence | PASS | Packet, IDs, test output and external binary evidence indexed here |

Safari and WebKit remain part of the final `revamp/cross-platform-qa` vertical;
this packet makes no real-Safari claim.

## Rollback

Revert this branch commit. No database, role-storage, policy, audit or shared
data rollback is required.
