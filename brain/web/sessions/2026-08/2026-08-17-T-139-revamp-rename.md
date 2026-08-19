# 2026-08-17 · T-139 — "Revamp" out of the component names

`task: T-139` · `status: done` · `duration: ~30m`
`rules applied: WEB-000, WEB-007`

---

## Goal

Take the project codename "Revamp" out of the four component filenames that carry
it, and establish which of the remaining occurrences must *not* be renamed.

## Why they were named that in the first place

`git log --diff-filter=A` gives the answer in one line:

```
b91b8905 feat(web): migrate Saqeel revamp shell and core workspaces
```

They were created during a project phase called "the Saqeel revamp" and **named
after the project that produced them rather than what they render**.
`RevampStrategicView` tells a reader *when* the file was written, not what it
does — and once the revamp is the current state of the app, the word carries no
information at all. Worse, it dates the file: a second revamp would have had
nowhere to go.

There was also a mechanical reason, and it is the more interesting one.
`DashboardView.tsx` **already exports its own `StrategicView` and
`OperationalView`**, so the prefix was doing real disambiguation work. That is
why the straight rename collided on the first attempt — see below.

## What changed

| File | Action |
| --- | --- |
| `dashboard/RevampStrategicView.tsx` → `dashboard/StrategicBoard.tsx` | renamed |
| `dashboard/RevampOperationalView.tsx` → `dashboard/OperationalBoard.tsx` | renamed |
| `factories/RevampFactory360Portfolio.tsx` → `factories/Factory360Portfolio.tsx` | renamed |
| `operations/RevampOperationsCenter.tsx` → `operations/OperationsCenter.tsx` | renamed |
| `dashboard/DashboardView.tsx` | imports + 2 delegating returns |
| `factories/page.tsx` | import; `RevampFactoryRow` alias dropped |
| `operations/sections/operations-overview.tsx` | import |
| `e2e/factory360-provenance-contract.spec.ts` | path re-pointed |
| `e2e/responsive-dashboard-operations.spec.ts` | path re-pointed |
| `e2e/web-admin-m3-operations.spec.ts` | path re-pointed |
| `e2e/web-admin-m1-dashboard.spec.ts` | comment re-pointed |

**`Board`, not `View`.** The obvious names — `StrategicView`, `OperationalView` —
collide with the wrappers already exported from `DashboardView.tsx`, and typecheck
caught it immediately (`TS2440: Import declaration conflicts with local
declaration`). `Board` says what they are (the dashboard's strategic and
operational boards) without re-introducing an ambiguity the prefix had been
papering over.

**`RevampFactoryRow` was deleted, not renamed.** It was
`export type RevampFactoryRow = FactoryRow;` — a pure re-export of a type
`@/features/factories/portfolio` already exports. `factories/page.tsx` now imports
`FactoryRow` from the feature module directly, so the indirection went with the
keyword.

## What was deliberately left alone

Removing the word everywhere would have broken three different contracts:

- **`admin.revamp.*` i18n keys** (~40, on `/admin/integrations` and `/admin/risk`)
  are **DB-backed**. Three migrations insert their Arabic — `20260727130000_admin_revamp_title_ar_strings.sql`,
  `20260808100000_admin_revamp_missing_ar_strings.sql`, and the terminology redo.
  Renaming the keys in code alone would silently drop the Arabic on both screens.
  That is a migration, not a rename, and it belongs with the `t()` retirement those
  routes already owe.
- **`product-contract/**`** — `SLR_SAQEEL_LOGIN_REVAMP_001.csv`,
  `TASK_SAQEEL_RESPONSIVE_REVAMP_001.yaml`, `CC-SAQEEL-RESPONSIVE-REVAMP-001.yaml`
  and the evidence files carry **stable contract IDs**, which
  `.claude/rules/governance.md` requires to stay stable across plans, code, tests,
  evidence and handoffs.
- **`supabase/migrations/*_admin_revamp_*.sql`** — applied migrations. The filename
  is the ledger entry.
- **`design/final-cut/saqeel-revamp.html`** — named as the structural design
  authority in `CLAUDE.md`.
- **Comments and test titles saying "the supplied Revamp"** — they refer to that
  design artefact by its actual name. Renaming them would make the reference wrong.
- `e2e/saqeel-login-revamp*.spec.ts` and
  `e2e/execution-revamp-accessibility-contract.spec.ts` map to those contract IDs.

The rule the four renamed files broke and these do not: **a filename should say
what the thing is.** A governance artefact's name *is* its identifier, so there
the codename is the content.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED
- [x] `npm run lint` — PASSED
- [x] `npm run check:design-system-v5` — 75, unchanged
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**

**Both ratchet baselines are keyed by file path, so a rename reads as
"N new violations".** Relocked, and the totals prove it was neutral: typography
**1336 across 278 entries** and eslint **7812 across 906 entries** — identical
counts before and after, the same violations under new keys. A rename that had
actually added anything would have moved those numbers.

## Parked

- **`DashboardView.tsx` has two large blocks of unreachable code.** Its exported
  `StrategicView` (line 261) and `OperationalView` (line 527) compute a
  requirement strip, `return` the delegating element — and then continue with the
  entire pre-revamp implementation below the `return`: marker projections,
  compliance breakdowns, headline id lists. It is dead and it typechecks, which is
  why nothing has caught it. Found while resolving the name collision; deleting it
  is its own task with its own measurement.
- The `admin.revamp.*` key rename, as a migration paired with the `t()` retirement
  on `/admin/integrations` and `/admin/risk`.

## Proposed commit

```
refactor(web): name the dashboard, factories and operations views for what they render
```

## Next

T-140 — the `/field/my-tasks` migration.
