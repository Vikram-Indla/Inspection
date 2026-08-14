# 2026-08-14 · T-107 — the typography gate went green on a file that did not compile

`task: T-107` · `status: done` · `duration: ~0.25h`
`rules applied: WEB-000, WEB-006, WEB-008, WEB-014`

---

## Goal

Restore `npm run typecheck` to green on `feat/ui-revamp`.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/dashboard/explain-panel/explain-panel.tsx` | edited — one import line | 148 → 149 |

## Decisions

**One import, not three.** `Heading`, `Mono` and `Text` all come from
`@/components/saqeel/type`, so the barrel import restores all nine call sites.

## Inventory taken before writing code

Ten `tsc` errors, all in one file, in two shapes:

```
TS2304  Cannot find name 'Heading'   ×2
TS2304  Cannot find name 'Mono'      ×2
TS2607 / TS2786  'Text' cannot be used as a JSX component  ×6
```

`Text` produced the loud pair because it **collides with the DOM lib's global
`Text` interface** — TypeScript resolved the name, then rejected it as a
component. `Heading` and `Mono` have no global, so they failed quietly as
unbound identifiers.

## Numbers

```
tsc errors     10 → 0
call sites restored   9 (Heading ×2, Mono ×2, Text ×5)
typography gate       PASSED before and after — it never saw this
```

## Accessibility

At runtime `Heading` and `Mono` were **unbound identifiers**, so any dashboard
metric that opened an explain popover threw a `ReferenceError`. The panel is
restored, not merely compiling.

## Verification

- [x] `npm run typecheck` — 10 errors → 0
- [ ] `npm run lint` — script does not exist
- [x] `npm run gates:typography` — PASSED
- [ ] Rendered — **not verified.** `/dashboard` is auth-gated and this session
      could not sign in. The route compiles (`✓ Compiled /dashboard in 24.7s,
      1545 modules`), which proves the module graph, **not the panel**.

## Retirement

Nothing.

## Parked

**This is a new instance of a recorded shape, and it is worse than the ones
before it.** T-102 established that the typography gate reads CSS and cannot see
a rendered defect. Commit `1bd7abdd refactor(typography): clear operations and
explain-panel to zero` moved text onto type primitives, **turned the gate green,
and shipped a file that does not compile.** The gate counts declarations removed;
it does not typecheck.

**`npm run verify` does not exist either.** `CLAUDE.md` requires it before any
task is called done, and the session template has checkboxes for `lint`, `unit`
and budgets. `package.json` has **none of `verify`, `lint`, `test`, `unit`,
`budgets`.** T-102 recorded the missing `lint`; it is actually all five. **This
defect shipped because the one command that would have caught it is the one no
rule names.**

## Blocked / open questions

Should `typecheck` be added to the gates chain? `npm run gates` currently runs
typography and v5 only, so a non-compiling file passes every gate this repo has.

## Proposed commit

```
fix(dashboard): import the type primitives explain-panel renders
```

## Next

Add `typecheck` to `npm run gates`, or create the missing `verify` script.
