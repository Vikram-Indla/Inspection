# 2026-08-16 · T-118 — the five commands the rules require and nobody could run

`task: T-118` · `status: partial — verify/test/unit wired and green; lint and budgets exist but cannot pass` · `duration: 0.5h`
`rules applied: WEB-005, WEB-006, WEB-007, WEB-008`

---

## Goal

Make `npm run verify`, `lint`, `test`, `unit` and `budgets` exist, so that the
Definition of Done stops naming commands that were never in `package.json`.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/package.json` | scripts block extended | 15 → 23 scripts |

Added: `verify`, `lint`, `budgets`, `test`, `unit`, `test:unit`, `test:static`,
`verify:touch-targets`.

## Decisions

**`lint` is a failing stub, not a silent omission, and not an install.** ESLint
is not merely unwired — it is **absent**: no `eslint` dependency, no config file,
no binary, and `next lint` was removed in Next 15. Wiring a script cannot create
a toolchain. Three options were weighed:

```
install eslint + config      satisfies the rule, adds 4 devDeps + lockfile churn
omit lint, amend WEB-006     zero deps, but edits the law to match the code
stub that fails loudly       zero deps, gap stays visible          ← taken
```

The stub was taken because **amending the rule to match the gap is a larger
decision than installing a linter**, and installing four devDependencies into a
government platform repository is the owner's call, not an agent's. The stub
prints exactly what is missing and how to close it. **The install is one word
away and should be the next task.**

**`budgets` is a failing stub for a structural reason, not a tooling gap.**
WEB-005 §1's budgets are per-route first-load JS and CSS, which are read from a
production build. `npm run build` is a human-only command (WEB-006 §3). So
`budgets` cannot be an agent command in any form — it is a measurement request
(WEB-005 §8), and the script now says so instead of not existing.

**`verify` deliberately excludes `lint` and `budgets`.** Including two commands
that cannot pass would make `verify` permanently red and therefore ignored —
which is the exact failure mode this task exists to end. `verify` is
`gates → verify:dates → test`, all of which genuinely run.

**Three working scripts were already in `scripts/` with no npm entry point** and
are now reachable: `verify-dates.mjs` (17 assertions, passing), and
`verify-touch-targets.mjs`. Two Playwright configs — `playwright.static.config.ts`
and `playwright.unit.config.ts` — likewise had no entry point and are now
`test:static` and `test:unit`.

## Inventory taken before writing code

Not a screen migration; no state, effects, literals, `<svg>` or markup involved.
Inventory was of the script surface: `package.json` had `dev`, `build`,
`postbuild`, `start`, three `seed:*`/`geo:*`, `typecheck`, `test:e2e`, `gates`,
`gates:typography`, `gates:typography:update`, `check:design-system-v5`,
`verify:dates` — and none of `verify`, `lint`, `test`, `unit`, `budgets`.

## Numbers

```
npm scripts        15 → 23
runnable gates      5 →  8   (+test, +unit, +test:static, +verify:touch-targets, −0)
scripts/ files reachable from npm   2 of 5 → 4 of 5
npm run test:unit                   13 passed (1.1s)
npm run verify:dates                17 checks passed
```

No route was touched, so there are no first-load JS, CSS, LCP, INP or CLS
numbers to record.

## Accessibility

Not applicable — no rendered surface changed.

## Verification

- [x] `npm run typecheck` — exit 0
- [ ] `npm run lint` — exits 1 by design (ESLint absent; see Decisions)
- [ ] `npm run gates` — **exit 1, pre-existing**: `check:design-system-v5` at 77
      findings, unchanged by this task and naming no file it touched
- [x] `npm run test:unit` — 13 passed
- [ ] `npm run test:e2e` — blocked, see T-119
- [ ] Definition of Done — not fully tickable by anyone; see Blocked

## Retirement

Nothing marked or deleted.

## Parked

- **Install ESLint and replace the stub.** Needs owner sign-off on adding
  `eslint`, `@typescript-eslint`, `eslint-plugin-react-hooks` and
  `eslint-config-next` as devDependencies, plus an `eslint.config.mjs` that
  expresses the WEB-000 rules rather than a stock recommended set.
- **WEB-006 §3 lists seventeen gates under `scripts/gates/`. That directory does
  not exist.** Two real gate scripts exist (`check-typography.mjs`,
  `check-design-system-v5.mjs`) and live in `scripts/`, not `scripts/gates/`.
  The rule table describes an intended architecture as if it were current.

## Blocked / open questions

**`npm run gates` has been red for every session since before T-112** — 77
findings on `check:design-system-v5`, none in a file any recent task touched.
Until that is cleared or explicitly baselined the way typography was, **no task
can satisfy WEB-006 §5**, and every session reporting "gates green" is reading
past an exit code. This task makes the problem more visible, not smaller.

## Security finding, raised not acted on

Two files carry **plaintext seeded credentials**, which `e2e/personas.ts` was
deliberately rewritten to remove:

```
scripts/verify-admin.mjs:8       admin@mim.gov.sa    1 password
scripts/audit-v5-a11y.mjs:14-19  five personas       5 passwords
```

`personas.ts`'s own header explains why this matters — the values are already in
git history, so **rotation is required, not deletion**. Neither file was wired
into an npm script by this task for that reason. This is an owner action.
