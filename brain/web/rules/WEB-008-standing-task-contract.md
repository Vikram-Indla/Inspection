# WEB-008 — Standing Task Contract

> Status: **BINDING**.
> Every task prompt in this programme implies this document. A prompt states only
> what is specific to its task; everything here applies whether or not the prompt
> mentions it. A prompt that repeats these rules is badly written; a task that
> ignores them is rejected.

---

## 1 · Before writing code

Read `brain/web/README.md`, the tracker task, and the rule documents the task
touches. Read every file you are going to change, before you change it.

**Never invent.** A value, name, colour, size, threshold, or behaviour the spec
does not give you is a gap to report, not a blank to fill. Governed values —
risk weights, penalties, SLAs, approval rules — are never invented under any
circumstances; absent data renders as a state.

---

## 2 · Always true

**System**

- The design system is **SAQEEL**. No Astryx: no `ax-` class, no `ax-` token, no
  `astryx.css` import, zero references.
- Tokens are `--sqx-*`, classes `.sqx-*`. Never `--sq-`, `.sq-`, or `.saqeel-` —
  all three collide with the frozen legacy sheets (WEB-002 §2).
- `saqeel.css` is core tokens only. Component styles are colocated CSS Modules.
  A missing token stops the work and is raised — never added inline.

**Code**

- Zero comments. No `//`, no `/* */`, no `{/* */}`. No `@ts-ignore`,
  `@ts-expect-error`, `eslint-disable`.
- No `any`, `as any`, `as unknown as`, or non-null `!`.
- No `let` or `var` in `.tsx`.
- Components ≤ 200 lines, hard ceiling 400. Route files ≤ 40 lines.
- One folder per component, file named after it, module beside it. No
  `index.tsx` containing a component.
- Design-system primitives accept no `className` and no `style` prop.
- Max 12 files per directory. No `utils`, `helpers`, `common`, `misc`, `v2`.

**Architecture**

- Server Components by default. `"use client"` at the leaf, on the smallest
  possible subtree, justified in the task record.
- Route files are composition only — no client code, no hooks, no handlers, no
  data logic. Only `error.tsx` may carry `"use client"`.
- All reads in `features/<domain>/queries.ts`, all writes in `actions.ts`. Every
  query declares a cache posture; every mutation revalidates its tags.
- Walk the state ladder before any `useState`. `useEffect` only for external
  synchronisation, always with cleanup.
- **Never mutate the DOM directly** — no `innerHTML`, `createElement`/`appendChild`,
  `setAttribute`, `classList`, `dataset` or `style` writes on rendered nodes, no
  node reordering, in any case. The DOM is render output; a value that changes it
  is state. Reads, `focus()`, and imperative library handoff are not mutation;
  the `<html>` root's theme/direction flags are the one exception, through their
  owning module (WEB-012).

**Visual**

- No literal colour, size, radius, shadow, font, or z-index outside the
  `saqeel.css` primitives block. Only `var(--sqx-*)`.
- Logical properties only. The **only** `dir()` rule in the application is the
  direction token block in `saqeel.css`.
- No `<svg>`. Icons only through `components/saqeel/icon`; that file is the only
  importer of `lucide-react`.
- WEB-009 governs the visual grammar of every component.

**Accessibility**

- WCAG 2.2 Level AA. No `alt=""` — a decorative graphic is not an `<img>`.
- `<button>` for actions, `<a>` for navigation. Never a `div` with `onClick`.
- Every control labelled, every overlay focus-trapped and Escape-closable,
  focus always visible and never obscured.
- Nothing communicated by colour alone.

---

## 3 · Always verify

- `npm run typecheck` — zero errors
- `npm run lint` and `npm run gates` — zero errors, zero warnings
- **Never** `npm run build` or `next build`. That belongs to the human
  (WEB-005 §8).
- Exercise the change by hand in the running dev server
- Keyboard-only pass over everything touched
- Arabic / RTL
- Light and dark
- `prefers-reduced-motion: reduce`
- axe-core: zero violations on every changed route, both themes

**State the results.** "Looks fine" is not a result. A checkbox ticked without
the check having been run is a false report, and it is worse than an admitted gap.

---

## 4 · Always close

In order: ledgers → tracker → session record → `02-SESSION-LOG.md` →
`01-PROJECT-STATUS.md` (WEB-007 §3).

**Never** run `git add`, `commit`, `push`, `checkout`, `switch`, `branch`,
`merge`, `rebase`, `reset`, `revert`, `stash`, `tag`, `clean`, or
`gh pr create`. Read-only git is fine and encouraged.

Finish with, in this order:

1. Changed files, grouped by action: `created` / `modified` / `marked` / `deleted`
2. **One** Conventional Commit line, `<type>(<scope>): <subject>`, imperative,
   ≤ 72 characters, no body, no emoji, no attribution
3. A **measurement request** naming the routes and numbers for the human to run
4. Line count of every file created or rebuilt
5. Client island count, and what each one is for
6. Anything ambiguous in the spec — **as a note, not a question**

---

## 5 · Never stop, never wait

Do not pause mid-task to ask. Do not produce a plan for approval unless the
prompt explicitly asks for one. Do not wait for a reply before closing out.
Work the task to completion, record what was ambiguous, and hand back a finished
piece of work with its open questions attached.

If a rule genuinely blocks the task, do the most of the work that the rules
permit, write the conflict into the task record — which rule, what the task
needed, what the options cost — and stop there. Never resolve a rule conflict by
breaking the rule quietly.
