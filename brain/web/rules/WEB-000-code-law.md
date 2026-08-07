# WEB-000 — Code Law

> Status: **BINDING**. Applies to every file under `apps/web/src/**`.
> A change that violates any rule here is rejected. There is no "just this once".

---

## 0. Precedence

1. `brain/web/rules/WEB-000..006` — this rulebook. Highest authority for code.
2. `design/final-cut/saqeel-revamp.html` — visual authority for approved screens.
3. `apps/web/src/app/tokens.css` — the only place raw visual values may exist.

If two rules appear to conflict, the stricter one wins. If a rule genuinely
cannot be met, the work stops and the conflict is written into the tracker task.
It is never resolved by silently breaking the rule.

---

## 1. Size budgets (CI-enforced)

| Artefact | Target | Hard ceiling | Gate |
| --- | --- | --- | --- |
| `page.tsx`, `layout.tsx`, `template.tsx`, `default.tsx` | 25 lines | **40 lines** | `gate:file-size` |
| Any `.tsx` component | **200 lines** | **400 lines** | `gate:file-size` |
| Any `.ts` module | 200 lines | 300 lines | `gate:file-size` |
| Exported function / component body | 40 lines | 60 lines | `gate:complexity` |
| Cyclomatic complexity per function | 6 | 10 | `gate:complexity` |
| JSX nesting depth in one component | 3 | 4 | review |
| Props on one component | 6 | 8 | review |
| Files in one directory | 8 | 12 | `gate:directory` |

400 is a ceiling, not a licence. A file that reaches 250 lines is already
telling you it holds more than one responsibility. Split it then, not at 401.

**Splitting is not chopping.** A 900-line component is not fixed by producing
`PartOne.tsx` and `PartTwo.tsx`. Each extracted unit must have a name that
describes a thing a person would ask for by that name.

---

## 2. Comments — zero

No `//`, no `/* */`, no `{/* */}` anywhere in `apps/web/src/**`.

The reasoning is not stylistic. A comment explaining what code does is a
confession the code does not say it itself. It is a second source of truth the
compiler never checks, so it rots into a lie. And the moment comments are
"allowed when helpful", they breed. The fix for unclear code is always better
names, smaller functions, clearer structure — never a sentence apologising for
it.

The replacements, in order of preference:

- an intention-revealing name
- a function that does one nameable thing
- a type that makes the illegal state unrepresentable
- a test that demonstrates the usage
- an entry in the tracker task or session neuron, if the reader needs history

### The two things that are not comments

1. **Directives.** `"use client"`, `"use server"`, `"use cache"` are language
   directives. They are required where the rules permit them.
2. **The retirement banner.** Exactly one machine-readable banner, on line 1 of
   a legacy file scheduled for deletion, in the exact form defined in
   [WEB-006 §4](./WEB-006-definition-of-done.md). Any deviation from that
   regex is a comment and fails the gate.

### The one narrow exception

TSDoc (`/** ... */`) is permitted **only** on symbols exported from
`apps/web/src/components/saqeel/**`, and only to describe the contract of a
public design-system API: what a prop means, what a variant is for, what the
accessibility obligation on the caller is. It documents the *interface*, never
the *implementation*.

Banned even there: restating the signature, narrating the body, TODO, FIXME,
changelog notes, author names, dates, ticket numbers, ASCII art, section
divider banners.

Banned everywhere, no exception: `@ts-ignore`, `@ts-expect-error`,
`eslint-disable`, `eslint-disable-next-line`, `biome-ignore`, `prettier-ignore`.
A suppression is a comment that also disables the only tool that could have
caught the problem.

---

## 3. Types

- **`any` is banned.** No `any`, no implicit `any`, no `as any`, no
  `as unknown as T`, no `Function`, no `object`, no non-null assertion `!`.
- Unknown input is typed `unknown` and narrowed by a type guard or a schema
  parse. Narrowing happens once, at the boundary, and everything inward is typed.
- **Make illegal states unrepresentable.** A discriminated union beats a bag of
  optional fields.

  ```ts
  type VisitState =
    | { kind: "scheduled"; scheduledFor: Date }
    | { kind: "inProgress"; startedAt: Date; inspectorId: InspectorId }
    | { kind: "submitted"; submittedAt: Date; findingCount: number };
  ```

  not `{ scheduledFor?: Date; startedAt?: Date; submittedAt?: Date; ... }`.
- Variants are string-literal unions, never `string`. `variant: "primary" |
  "danger"`, never `variant: string`.
- Identifiers are branded, not bare strings, wherever confusing two would be a
  bug: `type VisitId = string & { readonly __brand: "VisitId" }`.
- `satisfies` for config objects; `as const` for literal tables.
- `readonly` on every prop array and object that the component does not mutate.
- Types live in the feature's `types.ts` and are exported. A type used by two
  features moves to `lib/<domain>/types.ts`.
- Every exported function has an explicit return type. Inference is fine
  internally; it is not fine across a module boundary.
- `React.FC` is banned. Declare the props type and the function.

---

## 4. Bindings and mutation

- **`let` and `var` are banned in every `.tsx` file.** Without exception.
- In `.ts` files, `let` is banned in exported functions. It is permitted only
  inside a private local helper where a single accumulator is genuinely
  unavoidable, and that helper must be under 20 lines. Reach for `map`,
  `filter`, `flatMap`, `reduce`, `Object.fromEntries` first — they almost always
  win.
- No mutation of parameters. No `push`/`splice`/`sort` on an array you did not
  create in that function (`toSorted`, `toReversed`, spread).
- No reassignment of imports. No module-level mutable state.

---

## 5. Naming

- Names say **what** and **why**, never **how**. `overdueVisits`, not
  `filteredArr`. `canSubmitFinding`, not `flag2`.
- Booleans read as assertions: `is…`, `has…`, `can…`, `should…`, `was…`.
- Event props are `on<Thing><Event>`; internal handlers are `handle<Thing><Event>`.
- Async functions that fetch are `get…` / `list…` / `find…`; ones that change
  state are `create…` / `update…` / `archive…`. Never `doStuff`, `process`,
  `handleData`, `manager`, `service`, `helper`.
- No abbreviations except the repo's established domain terms (`CR`, `KPI`,
  `SLA`, `OCR`, `PWA`, `RTL`). Never `usr`, `btn`, `cfg`, `tmp`, `val`, `e` for
  anything but a caught error, `i` outside a two-line loop.
- Files are named for their default export. One component per file. A file
  named `index.tsx` that contains a component is banned.
- **Banned directory and file names**: `utils`, `util`, `helpers`, `common`,
  `shared` (as a dumping ground), `misc`, `stuff`, `temp`, `new`, `old`, `v2`,
  `final`, `Component.tsx`, `Wrapper.tsx`, `Container.tsx`, `Manager.ts`.

---

## 6. Separation of concerns — the layer map

Every file belongs to exactly one layer. Imports flow **downward only**.

```
app/**                routing, composition, metadata            ← may import features, components, lib
features/<domain>/**  server data access + mutations            ← may import lib
components/<domain>/  domain-aware presentation                 ← may import saqeel, lib
components/saqeel/**  design-system primitives                  ← may import lib/types only
lib/**                pure cross-cutting modules                ← imports nothing above it
```

Hard consequences:

- `components/saqeel/**` knows nothing about inspections, visits, factories,
  Supabase, routing, or i18n dictionaries. It takes props. That is the whole
  reason it will still be usable in twenty years.
- `components/<domain>/**` never imports `@supabase/*`, never calls `fetch`,
  never reads `cookies()`. It receives already-shaped data.
- `features/<domain>/queries.ts` is the only place a read query is written.
  `features/<domain>/actions.ts` is the only place a write is written.
- `lib/**` never imports React. If it needs React it is not `lib`.
- No upward imports. No cycles. `gate:layers` enforces both.

Per feature, the fixed file set:

```
features/<domain>/
  queries.ts     server reads, cache posture declared per query
  actions.ts     "use server" mutations, input parsed, tags revalidated
  mappers.ts     database row  →  view model
  types.ts       the domain's exported types
  keys.ts        cache tag builders
```

Nothing else lives there. No components, no CSS, no constants file that is
really a junk drawer.

---

## 7. Directory discipline

- A directory holds files that share one nameable responsibility. If you cannot
  name it in three words without "and", it is two directories.
- Maximum 12 files per directory. At 9, plan the split; at 13, CI fails.
- Subdivide by **domain**, never by technical type. `features/planning/` beats
  `hooks/`, `types/`, `constants/` sprawl.
- No file is created without a directory that already deserves it. "I'll put it
  here for now" is how the current state happened.
- `index.ts` barrels are permitted at exactly one path:
  `components/saqeel/index.ts`. Barrels elsewhere create import cycles and
  defeat tree-shaking.

---

## 8. Duplication — the Rule of Two

The first time a pattern appears, write it inline. The **second** time it
appears, extract it and delete both copies. Do not extract on the first use
(premature abstraction is its own debt) and never tolerate a third.

Copy-pasted JSX blocks, repeated conditional class strings, and two components
that differ only by a label are all the same failure.

---

## 9. Errors

- No swallowed errors. No empty `catch {}`.
- No `throw new Error("something went wrong")`. The message names the operation
  and the input class.
- User-facing failure is a rendered **state**, never a blank screen: `Not
  configured` / `Unavailable` / `Insufficient evidence` / `Nothing yet`. Use
  `StateSurface`.
- Never invent a governed value to fill a gap — no risk weight, penalty amount,
  SLA, threshold, or approval rule. Absent data renders as a state.
- `error.tsx` per route segment that can fail; it renders one named component.

---

## 10. Dependencies

New runtime dependencies require an entry in the tracker task and a stated
reason. Sanctioned for this programme:

| Package | Purpose |
| --- | --- |
| `lucide-react` | the icon layer (WEB-002 §5) |
| `zod` | boundary validation for server actions and env |

**Banned**: Tailwind, styled-components/emotion or any CSS-in-JS, TanStack
Query, Redux/MobX/Zustand (server state is the server's job; local state is
local), moment.js, lodash, any AGPL dependency, any `ax-` / Astryx import
(carried forward from the existing repo law), any package whose purpose is
"utilities".

---

## 11. The self-check before proposing a diff

- [ ] Zero comments; zero suppressions; zero `any`; zero `let` in `.tsx`
- [ ] Every file within budget; every directory within 12
- [ ] Every name would survive being read aloud to the manager
- [ ] Imports flow downward only; no cycles
- [ ] No second copy of anything introduced in this change
- [ ] Nothing in this diff needs a comment to be understood
