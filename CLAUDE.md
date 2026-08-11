# Inspection Platform — session onboarding (read this first)

This repository is the MIM Inspection Platform. Active work is the **redesign of
the Next.js application at `apps/web`**, carried out file by file, page by page,
component by component.

## Before doing any work, read in this order

1. **`brain/web/README.md`** — the law and the memory for `apps/web`.
2. **`brain/web/01-PROJECT-STATUS.md`** — where the redesign stands.
3. **`brain/web/03-REDESIGN-TRACKER.md`** — the work board. Take the top
   unblocked item in NOW unless told otherwise.
4. **`brain/web/rules/WEB-008-standing-task-contract.md`** — what every task
   prompt implies but does not repeat. Then the rule documents your task names,
   `WEB-000` … `WEB-013`. Read them before writing code, not after review
   rejects the diff.
5. **`brain/web/04-COMPONENT-LEDGER.md`** — never build what already exists.

`AGENTS.md` covers repository-wide governance (product contract, database,
release gates). `brain/web/` is authoritative for everything inside `apps/web`.

---

## Binding rules — non-negotiable

Full text in `brain/web/rules/`. The ones that reject a diff on sight:

1. **Zero comments.** No `//`, no `/* */`, no `{/* */}`. Code that needs a
   sentence to be understood is not finished — the fix is better names, smaller
   functions, clearer structure. Two narrow exceptions only: TSDoc on
   design-system public API, and the regex-locked `@retiring` banner
   (WEB-006 §4). No `@ts-ignore`, no `eslint-disable`.
2. **Components ≤ 200 lines, hard ceiling 400. Route files ≤ 40 lines.**
3. **Route files contain no client code.** `page.tsx` composes named components
   and awaits queries from `features/*/queries.ts`. Only `error.tsx` may carry
   `"use client"`.
4. **Server Components by default.** `"use client"` at the leaf, smallest
   possible subtree, justified in writing in the tracker task.
5. **No `any`.** No `as any`, no `as unknown as`, no `!`. Unknown input is
   `unknown`, narrowed once at the boundary. Illegal states unrepresentable.
6. **No `let` in `.tsx`.** Ever.
7. **No literal visual values.** No hex, rgb, px, rem, font-family, font-size,
   shadow, radius, or z-index outside `apps/web/src/app/saqeel.css`. Only
   `var(--token)`.
7b. **No typography in feature code — ever.** `font-size`, `font-weight`,
   `font-family`, `font-style`, `line-height` and `letter-spacing` may not appear
   in any `.css` outside `src/components/saqeel/`, and `font: var(--sqx-text-*)`
   may not be consumed outside it either. Text is rendered through `Text`,
   `Heading`, `Overline`, `Mono` and `Metric` from `components/saqeel`. Nine
   roles exist and no more; `caption`, `body-lg`, `title` and `code` are retired
   aliases you must never write. **If it is a sentence, it is `body` — there is
   no smaller prose size.** Cards are `Card`/`CardHeader`, whose slot order
   (eyebrow → title → description) is structural. Enforced by
   `npm run gates:typography`, which is a ratchet: the violation count may only
   go down. **Read `brain/web/rules/WEB-014-typography-contract.md` in full
   before writing or editing any user-visible text** — it is binding law, and §9
   is a review gate you must answer in the session record.
8. **No `<svg>` in application code.** Icons come from `lucide-react` through
   `components/saqeel/media/icon-registry.ts`, by semantic name.
9. **No `alt=""`.** Every image carries alt text conveying purpose. A decorative
   graphic is never an `<img>` — it is CSS or an `aria-hidden` icon.
   WCAG 2.2 Level AA throughout.
10. **No useless state or effects.** Walk the state ladder (WEB-004 §1):
    server data → URL state → derived → uncontrolled DOM → `useState` →
    context. `useEffect` is banned except for external synchronisation.
11. **No dumping grounds.** Max 12 files per directory, grouped by domain. No
    `utils`, `helpers`, `common`, `misc`, `v2`, `final`.
12. **No Astryx.** No `ax-` class, `ax-` token, or `astryx.css` import. The
    design system is **SAQEEL**.
13. **Record every task, commit nothing.** Every completed task gets its own
    record at `brain/web/sessions/<YYYY-MM>/<YYYY-MM-DD>-<TASK-ID>-<slug>.md`.
    Never run a git write command — finish with the changed-file list and
    **one** Conventional Commit line for the human to run.
14. **Never modify the DOM directly.** The rendered DOM is a pure function of
    state — the only way it changes is by changing what render returns. No
    `innerHTML`/`textContent` writes, no `createElement`/`appendChild`/`remove`,
    no `setAttribute`/`classList`/`dataset`/`style` writes on rendered nodes, no
    node reordering, in any case. A value that would drive one is state; put it on
    the ladder and let render express it. Reads, `focus()`, and imperative library
    handoff are not mutation; the `<html>` theme/direction flags are the one
    exception, through their owning module (WEB-012).
15. **No hardcoded copy — ever.** Every user-visible word lives in
    `apps/web/src/i18n/locales/{en,ar}/<namespace>.json` and is read by key
    through `getMessages(locale)`. No English or Arabic literal in a `.ts`,
    `.tsx` or `.css` file — headings, labels, placeholders, `alt`, `aria-label`,
    empty/error/blocker copy and enum labels all count, and a "default" is still
    a literal. `t("key", "English")`, `locale === "ar" ? … : …` and in-code
    `*_AR_FALLBACK` maps are retiring legacy: never add one. **No namespace file
    for the page? Create it in both `en` and `ar`, register it in
    `i18n/messages.ts`, and load by key** — never inline the text because the
    file does not exist yet.

    **Before writing or editing a single user-visible string, read both of
    these in full — they are the binding law for translations, not background
    reading:**
    - **`brain/web/rules/WEB-013-translation-resources.md`** — the rule itself:
      what counts as copy and what does not, the banned patterns, how to create
      and register a new `en`/`ar` namespace, interpolation and plurals, the
      legacy debt you inherit and exactly how much of it your task owes, the
      detection greps, and the review gate you must answer.
    - **`brain/web/README.md`** — the rulebook index and standing rules; rule 18
      is the short form of the above and links every other rule your task is
      also bound by.

---

## Design authority

The approved design is `design/final-cut/saqeel-revamp.html`. Open it in a
browser and inspect it. Do not work from screenshots or from prose descriptions
of it.

1. **`apps/web/src/saqeel.css` is the single source of visual truth.** Raw colour
   and size values appear only in its primitives block. Everything else consumes
   `var(--sqx-*)`. The prefix is `--sqx-` / `.sqx-` — never `--sq-`, `.sq-`, or
   `.saqeel-`, all of which collide with the frozen legacy sheets.
2. **`saqeel.css` is core tokens only.** No component classes. Adding a token is
   a change request, not a task step: if a component appears to need a new one,
   it almost always needs an existing one. A genuine gap **stops the work** and
   is raised — never filled inline. New tokens carry their measured contrast ratio.
3. **Component styles are colocated CSS Modules** — `shell/shell.tsx` +
   `shell/shell.module.css` — consuming `var(--sqx-*)` only. The legacy sheets
   `tokens.css`, `saqeel-components.css`, `saqeel-runtime.css` and
   `v2-components.css` are **frozen**; each migrated screen deletes the rules it
   exclusively owned. No CSS-in-JS, no Tailwind, no `style={{ }}` except a
   token-valued custom property.
4. **Copy the markup structure of the approved design.** Element order, nesting
   depth, and semantics are the contract.
5. **Status is text plus shape, never colour alone.** Every status renders as a
   `StatusPill` with a text label. A coloured dot never stands alone.
6. **RTL via logical properties only** — `padding-inline`,
   `margin-inline-start`, `inset-inline-start`, `border-inline-end`. Never
   `left`/`right`. Never a `[dir="rtl"]` override that flips a value.
7. **Arabic and English both live in i18n resources**, never inside a component.
   No user-visible string literal in any component, in either language, in any
   form — including a `t()` default or a `locale === "ar"` ternary. Missing
   namespace file? Create it in both locales (WEB-013).
8. **Routes are fixed.** `/dashboard` `/operations` `/factories` `/planning`
   `/execution` `/reviews` `/compliance` `/compliance/approvals`
   `/enforcement-library` `/analytics` `/admin/*` `/field/*`. Do not rename,
   add, or nest. Tabs and filters are query state, never subroutes.
9. **Never invent a governed value.** No risk weight, penalty amount, SLA,
   threshold, or approval rule. Absent data renders as a state: *Not
   configured* / *Unavailable* / *Insufficient evidence*.

---

## Working protocol

- **One task at a time.** Work the single active tracker item to full
  completion — zero errors, zero warnings, every gate green — before starting
  anything else. No parallel work.
- **Inventory before code.** For a screen migration, list every file, every
  piece of state, every effect, every literal, every `<svg>`, and every
  accessibility failure, present that list, and **stop for confirmation** before
  writing anything.
- **New ideas are parked, not chased.** A non-blocking idea goes to the tracker's
  PARKED section and work continues. Pull one in only if it is genuinely part of
  doing the active task well.
- **Run every gate locally before calling anything done.** `npm run verify`
  covers typecheck, lint, gates, unit, e2e, and budgets. The first CI run should
  hold no surprises.
- **Definition of Done is a checklist, not a feeling** —
  `brain/web/rules/WEB-006-definition-of-done.md` §5. Before/after performance
  numbers and the manual accessibility checklist are part of it.
- **Retire, do not orphan.** When a component is superseded, mark it with the
  `@retiring` banner and add its ledger row. Delete only when zero imports
  remain and the gate in WEB-006 §4 clears.
- **Record every task the moment it completes** — not batched at session end.
  One task, one record. Four steps, in order: update the tracker → write the
  record from `brain/web/sessions/_TEMPLATE-session.md` to
  `brain/web/sessions/<YYYY-MM>/<YYYY-MM-DD>-<TASK-ID>-<slug>.md` → index it in
  `brain/web/02-SESSION-LOG.md` → refresh `brain/web/01-PROJECT-STATUS.md` (plus
  the component and retirement ledgers if touched). Every section of the
  template is filled: file table with line counts, before/after performance
  numbers, axe result and the manual accessibility checklist, decisions taken,
  parked ideas, blockers. This app is transformed by agents with no memory
  between sessions. The record is the memory. A task that is not written did not
  happen.
- **Never run the production build.** `npm run build` and `next build` belong to the human:
  they take minutes, contend with the running dev server over `.next`, and a half-finished
  build leaves a corrupted cache. Verify with `npm run typecheck`, `npm run lint`,
  `npm run gates`, and the feature exercised by hand in the dev server. Anything needing a
  production compile becomes a **measurement request** handed back for the human to run
  (WEB-005 §8) — never a command you run yourself.
- **Never commit.** No `git add`, `commit`, `push`, `checkout`, `switch`,
  `branch`, `merge`, `rebase`, `reset`, `revert`, `stash`, `tag`, `clean`, or
  `gh pr create`. Read-only git (`status`, `diff`, `log`, `show`) is fine and
  encouraged. If the tree needs cleaning, reverting, or branching — **ask**.
- **Finish with a changed-file list and one line.** A single Conventional Commit
  subject: `<type>(<scope>): <subject>`, imperative mood, lowercase, ≤ 72
  characters, no body, no emoji, no ticket number, no attribution. If the change
  cannot be described in one line, the task was too big — say so.
  Full law: `brain/web/rules/WEB-007-session-record-and-commits.md`.

  ```
  perf(operations): rebuild board server-first, -316 KB first-load JS
  ```

---

## Layout

`apps/web/` the Next.js application (the active work) · `brain/web/` the rulebook
and session memory for it · `design/` approved design authority ·
`product-contract/` product law · `docs/` architecture, handoff and UAT records ·
`supabase/` migrations · `scripts/`, `tools/` operational tooling.
