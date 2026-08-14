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
| `package.json` | edited — `typecheck` prepended to the `gates` chain | 1 line |

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
- [x] `npm run gates` — now typechecks first; verified it exits **2** when this
      defect is present and short-circuits before the style gates
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

**Resolved in this task, on the owner's direction.** `typecheck` now runs
**first** in the gates chain:

```
"gates": "npm run typecheck && npm run gates:typography && npm run check:design-system-v5"
```

First is deliberate — the chain short-circuits, so the style gates never run
against code that does not compile.

**Proved by re-introducing this exact defect, not by assuming.** With the import
removed, `npm run gates` exits **2** on the `tsc` errors and the typography and
v5 gates do not run; restored, the file is byte-identical to committed
(`git diff` empty) and gates behaves as before.

**The first attempt at that proof was worthless and looked fine.** The injection
used a `\n`-terminated pattern against a **CRLF** file, matched nothing, and left
the file untouched — so "typecheck passed" meant only that the unmodified file
still compiled. **This is T-090's zero-match shape, hit while building the
control meant to catch this class of defect.** What caught it was asserting
`grep -c` on the file afterwards rather than trusting the script's exit code; the
second attempt aborts if the line count does not actually drop.

**Still open:** `verify`, `lint`, `test`, `unit` and `budgets` remain absent from
`package.json` while `CLAUDE.md` and the session template require them. With
`typecheck` folded in, `verify` could now be a thin alias over `gates` plus
`test:e2e` — but what gates a task is an owner decision, not an agent one.

**Note on the v5 number.** This session quoted **103** findings in progress
reports; the script's own figure is **77**. 103 was a count of bracketed tag
occurrences in the output and over-counted multi-line entries. **77 is
authoritative** — the trend reported elsewhere (down 2 across the session, zero
owned by `/execution`) is unaffected.

## Proposed commit

Two changes, two subjects:

```
fix(dashboard): import the type primitives explain-panel renders
build(gates): typecheck before the design-system gates
```

## Next

Decide whether `verify` should exist as `gates` + `test:e2e`, which would make
`CLAUDE.md`'s standing instruction runnable for the first time.
