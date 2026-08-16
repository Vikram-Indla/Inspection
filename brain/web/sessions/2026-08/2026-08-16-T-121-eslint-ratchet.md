# 2026-08-16 · T-121 — `npm run lint` exists, runs, and is a ratchet rather than a wall

`task: T-121` · `status: done` · `duration: 1h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-006, WEB-007, WEB-014`

---

## Goal

Replace T-118's failing `lint` stub with a real ESLint toolchain expressing the
WEB-000 rules, configured so that it can actually be kept green.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/eslint.config.mjs` | created | 0 → 137 |
| `apps/web/scripts/check-eslint.mjs` | created | 0 → 97 |
| `apps/web/scripts/eslint-baseline.json` | created | 0 → 937 entries |
| `apps/web/package.json` | `lint` stub → real; `lint:update`, `lint:raw` added; `lint` added to `verify` | 23 → 25 scripts |
| `apps/web/package-lock.json` | 7 devDependencies added | — |

Installed: `eslint@9`, `@eslint/js@9`, `typescript-eslint@8`,
`eslint-plugin-react-hooks@5`, `eslint-plugin-jsx-a11y@6`,
`@next/eslint-plugin-next@15`, `globals@15`.

## Decisions

**It is a ratchet, not a threshold, and that was the whole design problem.** A
fresh ESLint over this codebase reports **8,114 errors**. A gate that is red on
day one is a gate nobody reads — which is exactly what
`01-PROJECT-STATUS.md` already records about `npm run gates` sitting at 77
findings that nobody can clear. Shipping a second permanently-red gate would
have repeated the defect this session was called in to fix.

`check-eslint.mjs` therefore mirrors `check-typography.mjs` **exactly** — same
`file::rule` count keys, same `--update` flag, same failure output, same
"violation(s) removed since the baseline" message. An agent that understands one
understands the other, and WEB-014 §8's rule carries over verbatim: **the
baseline may only go down, and a task that raises it is rejected on sight.**

**Four rules are enforced as `no-restricted-syntax` with the rule citation in
the message**, so a failure tells the reader which law it broke:

```
WEB-000 §4  no let in .tsx
WEB-000 §3  no `as unknown as`
WEB-002 §5  no <svg> in application code
WEB-001 §2  no "use client" in a route file
```

**Zero-comments needed a custom rule and got one, inline.** WEB-000 §2 has no
ESLint equivalent — core rules cannot see comments as findings. `web/no-comments`
is defined as an inline flat-config plugin (no new dependency) and honours both
sanctioned exceptions: the regex-locked `@retiring` banner from WEB-006 §4, and
TSDoc block comments **only** under `components/saqeel/`. It reports
`eslint-disable` and `@ts-ignore` separately, as WEB-000 §3 suppressions.

**Two rules were demoted, and both demotions are findings about the codebase,
not concessions.** The first ESLint run reported 8,439 errors; 325 of them were
artifacts, and the diagnosis is the useful part:

```
189  jsx-a11y/aria-role            <Text role="bodyStrong"> — SAQEEL's typography
                                   `role` prop collides with the ARIA attribute
124  react-hooks/rules-of-hooks    useT() is an async SERVER helper named like a hook
 12  jsx-a11y/role-supports-aria-props   same collision
```

`aria-role` is fixed correctly with `ignoreNonDOM: true`, which keeps every real
ARIA check and drops the collision. `rules-of-hooks` is demoted to `warn` rather
than disabled, because **the rule is right that `useT` reads as a hook** — the
name is the defect, and renaming it across 81+ call sites is its own task. The
genuine hook violations stay visible underneath.

**`verify` now includes `lint`**, which it could not before.

## Inventory taken before writing code

Measured per area before choosing any severity, because the answer depended on
whether migrated code was already clean. It very nearly is:

```
                     no-comments  restricted-syntax  non-null  max-lines
design system                 66                 18         2          0
features/*                    76                 10         0          0
migrated sections            103                  5         2          0
i18n + lib                 1,847                 20        29          0
/admin                       656                 42         7         29
/field                     2,270                195        60         36
other src                  2,316                123        23         32
```

**`max-lines` is already 0 across the design system, `features/*`, `i18n`,
`lib` and every migrated section** — the file-budget rule costs nothing to
enforce today and every one of the 97 findings is in unmigrated code.

**`jsx-a11y/alt-text` reports 0.** WEB-003's alt-text law is already fully held
across all 814 `.tsx` files.

## Numbers

```
first run            8,439 errors ·   29 warnings
after two fixes      8,114 errors ·  153 warnings      (−325, all false positives)
baseline entries       937
gate result          PASSED — 8,114 known, none new

errors by rule   web/no-comments 7,334 · no-restricted-syntax 413
                 no-non-null-assertion 123 · max-lines 97 · no-unused-vars 70
```

No route was touched, so there are no first-load JS, CSS or Web Vitals numbers.

## Accessibility

No rendered surface changed. The config **adds** standing accessibility
enforcement that did not exist: `jsx-a11y` recommended, with `alt-text` explicit
per WEB-003 — currently at 0 violations, so it is a guard rather than a backlog.

## Verification

```
typecheck               PASS
gates:typography        PASS
lint                    PASS   (8,114 known, none new)
verify:dates            PASS   (17 assertions)
check:design-system-v5  FAIL   77 findings, pre-existing, untouched by this task
```

**The ratchet was tested by injecting a defect, per T-107.** A probe component
carrying a `let`, an `as unknown as` and an unnecessary mutable binding was
written into `components/saqeel/`, and the gate **failed with exit 1 and named
all three with their WEB-000 citations**. The probe was then deleted and the
gate returned to PASSED. The injection was confirmed to have landed rather than
the exit code being read on faith — the T-090 / T-107 failure shape.

- [x] `npm run typecheck`
- [x] `npm run lint`
- [ ] `npm run gates` — exit 1 on the pre-existing 77 (see Blocked)
- [ ] `npm run test:e2e` — blocked on credentials (T-119)
- [ ] Definition of Done — blocked by `gates`, not by this task

## A process note worth recording

**The install landed in the wrong `package.json` and had to be undone.** The
repository root and `apps/web` are separate npm projects with **no workspaces
field**, and a shell whose working directory had reset installed all seven
packages at the root. Caught by `eslint --format=json` failing to find the
config, corrected with `npm uninstall` at the root and `npm install --prefix
apps/web`; the root `package.json` and `package-lock.json` were verified
unmodified against git afterwards.

**Use `--prefix` for every npm command in this repository.** There are two
package manifests and nothing links them.

## Retirement

Nothing marked or deleted. T-118's `lint` stub is superseded and was replaced
outright rather than banner-marked, since it was a JSON string, not a file.

## Parked

- **Rename `useT`.** It is an async server helper whose name claims it is a
  React hook, which costs 124 suppressed warnings and misleads every reader.
  `getTranslator` or `readMessages` would be honest. 81+ call sites.
- **`web/no-comments` is 90% of the debt** — 7,334 of 8,114. The two densest
  areas are `/field` (2,270) and `i18n + lib` (1,847). Nothing needs doing at
  once; the ratchet means each migrated file lands at zero and the number falls
  with the programme.
- **16 `eslint-disable` directives in `src/` are already unused** — they suppress
  rules that report nothing. They surfaced as parse-level warnings and are free
  deletions.
- **`e2e/m9-challenger.js:317` does not parse** — a `.js` file containing
  TypeScript syntax. It is in `e2e/`, so nothing runs it as source; it is dead
  or misnamed.
- **Type-aware linting was deliberately not enabled.** `typescript-eslint`'s
  type-checked configs would catch far more (floating promises, unsafe member
  access on `any`), but they need a `project` reference and are several times
  slower on 1,198 files. Worth doing once the baseline is falling rather than
  growing.

## Blocked / open questions

**`npm run gates` is still red for everyone**, unchanged by this task: 77
`check:design-system-v5` findings — `raw-input-radius-12px` 30,
`emoji-as-icon` 28, `utc-slice-date-format` 19 — none in a file any recent task
touched. Because `verify` runs `gates` first, **`lint` is never reached by
`verify` until that is resolved**, even though it passes on its own.

The 77 need either clearing or an explicit baseline of their own, exactly as
typography and now ESLint have. That is the last thing standing between this
programme and a Definition of Done anyone can satisfy.
