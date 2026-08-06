# brain/web — Read this before you touch `apps/web`

This is the memory and the law for the Next.js application at `apps/web`.
It exists because this app is being redesigned **file by file, page by page,
component by component**, across many sessions, by agents that remember nothing
between them. What is not written here did not happen.

---

## Read order — every session, no exceptions

1. **`01-PROJECT-STATUS.md`** — where the redesign stands right now.
2. **`03-REDESIGN-TRACKER.md`** — the work board. Take the top unblocked item in
   NOW unless told otherwise.
3. **The rule documents your task names** — `rules/WEB-000` … `WEB-006`.
   Read them before writing a line of code, not after review rejects the diff.
4. **`04-COMPONENT-LEDGER.md`** — what the design system already provides. Never
   build something that exists.
5. **`05-RETIREMENT-LEDGER.md`** — what is being deleted and what still blocks it.
6. **`02-SESSION-LOG.md`** — recent sessions, if context is unclear.

---

## The rulebook

| Doc | Governs |
| --- | --- |
| [`rules/WEB-000-code-law.md`](rules/WEB-000-code-law.md) | file budgets, zero comments, no `any`, no `let`, naming, layers, directory discipline |
| [`rules/WEB-001-architecture-and-nextjs.md`](rules/WEB-001-architecture-and-nextjs.md) | server-first, pure route files, data layer, caching, streaming, i18n/RTL, security |
| [`rules/WEB-002-design-system.md`](rules/WEB-002-design-system.md) | SAQEEL tokens, primitive contract, CSS Modules, the icon layer |
| [`rules/WEB-003-accessibility.md`](rules/WEB-003-accessibility.md) | WCAG 2.2 AA, alt text law, keyboard, forms, verification checklist |
| [`rules/WEB-004-state-and-data.md`](rules/WEB-004-state-and-data.md) | the state ladder, the `useEffect` ban list, forms, offline |
| [`rules/WEB-005-performance.md`](rules/WEB-005-performance.md) | budgets, bundle discipline, CSS deletion, measurement |
| [`rules/WEB-006-definition-of-done.md`](rules/WEB-006-definition-of-done.md) | task lifecycle, CI gates, retirement protocol, Definition of Done |
| [`rules/WEB-007-session-record-and-commits.md`](rules/WEB-007-session-record-and-commits.md) | the per-task record, the four closing steps, never commit, the one-line commit message |
| [`rules/WEB-008-standing-task-contract.md`](rules/WEB-008-standing-task-contract.md) | **what every task prompt implies.** Read this first — prompts state only what is task-specific |
| [`rules/WEB-009-component-design-language.md`](rules/WEB-009-component-design-language.md) | the visual grammar: control heights, borders, rim light, focus, radii, icon sizing, spacing, motion, the gradient budget |

**Task prompts are deliberately short.** Everything a prompt does not say is in
`WEB-008` and `WEB-009`. If a prompt seems to be missing the rules, it is not —
it is refusing to repeat them.

---

## The fourteen non-negotiables

If you read nothing else, these are the ones that get a diff rejected on sight.

1. **Zero comments.** No `//`, no `/* */`, no `{/* */}`. If code needs a
   sentence to be understood it is not finished. Two narrow exceptions only:
   TSDoc on design-system public API, and the machine-readable `@retiring`
   banner (WEB-006 §4).
2. **Components ≤ 200 lines, hard ceiling 400.** Route files ≤ 40 lines.
3. **Route files contain no client code.** `page.tsx` composes named components
   and awaits queries. Nothing else. Only `error.tsx` may be a client component.
4. **Server Components by default.** `"use client"` at the leaf, justified in
   writing, never on a page.
5. **No `any`.** No `as any`, no `as unknown as`, no `!`, no `@ts-ignore`, no
   `eslint-disable`.
6. **No `let` in `.tsx`.** Ever.
7. **No literal visual values.** No hex, px, rem, font-family, font-size,
   shadow, radius, or z-index outside the primitives block of
   `apps/web/src/saqeel.css`. Only `var(--sqx-*)`. `saqeel.css` is core tokens
   only — component styles are colocated CSS Modules, and **a missing token
   stops the work** rather than being added inline.
8. **No `<svg>` in application code.** Icons come from `lucide-react` through
   the icon registry, by semantic name.
9. **No `alt=""`.** Every image carries alt text that conveys purpose. A
   decorative graphic is not an `<img>` at all — it is CSS or an `aria-hidden`
   icon.
10. **No useless state or effects.** Walk the state ladder (WEB-004 §1).
    `useEffect` is banned except for the listed external-synchronisation cases.
11. **No dumping grounds.** Max 12 files per directory, grouped by domain. No
    `utils`, `helpers`, `common`, `misc`, `v2`, `final`.
12. **No Astryx.** No `ax-` class, `ax-` token, or astryx import. The design
    system is SAQEEL.
13. **Record every task, commit nothing.** Every completed task gets its own
    record at `sessions/<YYYY-MM>/<YYYY-MM-DD>-<TASK-ID>-<slug>.md`. Never run
    `git add`, `git commit`, `git push`, or any other git write command —
    finish by listing the changed files and proposing **one** Conventional
    Commit line, ≤ 72 characters, for the human to run.
14. **Never run the production build.** `npm run build` and `next build` belong
    to the human — they take minutes, fight the dev server over `.next`, and a
    half-finished one corrupts the cache. Verify with `typecheck`, `lint`,
    `gates`, and the running dev server. Anything needing a production compile
    becomes a measurement request handed back (WEB-005 §8), never a command the
    agent runs.

---

## What this programme is

The app already works. It is not being rebuilt — it is being **redesigned and
disciplined**. Every task takes one screen or one component family, replaces it
with something built from Saqeel primitives under the rules above, proves it
with numbers and an accessibility pass, marks what it superseded for
retirement, and writes down what happened.

The goal is an application that is still safely extensible in twenty years:
one token file behind every colour, one registry behind every icon, one query
module behind every read, one primitive behind every button, and not one line
of code that needs a comment to explain itself.

---

## Closing ritual — mandatory after **every completed task**

Not batched at session end. One task, one record. Full law in
[`rules/WEB-007`](rules/WEB-007-session-record-and-commits.md).

1. **Tracker** — set the task `done`, move the next item into NOW, copy
   discoveries into PARKED.
2. **Record** — copy `sessions/_TEMPLATE-session.md` to
   `sessions/<YYYY-MM>/<YYYY-MM-DD>-<TASK-ID>-<slug>.md` and fill every
   section: file table with line counts, before/after performance numbers,
   axe result plus the manual accessibility checklist, decisions, parked,
   blocked.
3. **Index** — one row in `02-SESSION-LOG.md`, newest first.
4. **Status** — refresh `01-PROJECT-STATUS.md`, plus the component and
   retirement ledgers if the task touched them.

Then, and only then: **never commit.** No `git add`, `commit`, `push`,
`checkout`, `branch`, `merge`, `rebase`, `reset`, `stash`. Read-only git is
fine. Finish by printing the changed files grouped by action and **one**
Conventional Commit line — `<type>(<scope>): <subject>`, imperative, ≤ 72
characters, no body, no emoji, no attribution — for the human to run.
