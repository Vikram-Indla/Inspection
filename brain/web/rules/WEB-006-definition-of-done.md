# WEB-006 — Working Protocol, Retirement & Definition of Done

> Status: **BINDING**. This is how a task starts, how it ends, and what must be
> true before anyone says the word "done".

---

## 1. One task at a time

- Work the single active item in `brain/web/03-REDESIGN-TRACKER.md` to full
  completion — zero errors, zero warnings, all gates green — before starting
  anything else. No parallel work, no "while I'm in here".
- A non-blocking idea discovered mid-task is written to the tracker's **Parked**
  section and left alone. A genuine blocker is resolved first and recorded.
- Never expand scope for an idea that does not belong to the current task.
- No work without a tracker task. Set `status: in-progress` when starting.

---

## 2. The task lifecycle

**1 — Read.** `brain/web/README.md`, then `01-PROJECT-STATUS.md`, then the
tracker task, then the rule documents the task names. Then, and only then, the
target source files.

**2 — Inventory.** Before writing anything, produce and record:

- every file the task touches, with its current line count
- every piece of state and every effect in those files, with the ladder rung
  (WEB-004 §1) each one should occupy
- every literal colour, size, radius, shadow, font, and z-index, mapped to its
  token
- every `<svg>`, mapped to its semantic icon name
- every accessibility failure visible in the current markup
- every Saqeel primitive the replacement needs, marked *exists* or *to build*

**3 — Confirm.** Present the inventory and the intended component breakdown.
**Stop for confirmation** before writing code. This is not optional on a screen
migration.

**4 — Build.** Primitives first (if any are missing), then domain components,
then wire the route. Server components until proven otherwise.

**5 — Verify.** The full Definition of Done in §5 below.

**6 — Retire.** Apply the retirement protocol in §4 to whatever this task
superseded, and update the ledger.

**7 — Record.** Write the task record, update the tracker, refresh the status,
propose the commit line. Full law in
[`WEB-007-session-record-and-commits.md`](./WEB-007-session-record-and-commits.md).

---

## 3. CI gates

Each gate is a script under `apps/web/scripts/gates/`, wired into
`npm run gates` and into the GitHub workflow. A task is not done until all are
green locally, so the first CI run holds no surprises.

| Gate | Enforces | Rule |
| --- | --- | --- |
| `gate:no-comments` | zero `//`, `/* */`, `{/* */}` outside the sanctioned exceptions | WEB-000 §2 |
| `gate:file-size` | line ceilings per file kind | WEB-000 §1 |
| `gate:complexity` | function length, cyclomatic complexity | WEB-000 §1 |
| `gate:no-any` | `any`, `as any`, `as unknown as`, `!`, ts-ignore | WEB-000 §3 |
| `gate:no-let` | `let`/`var` in `.tsx`, `let` in exported `.ts` functions | WEB-000 §4 |
| `gate:layers` | import direction, no cycles, no forbidden imports | WEB-000 §6 |
| `gate:directory` | ≤ 12 files per directory, banned directory names | WEB-000 §7 |
| `gate:page-purity` | route files: no `"use client"`, no hooks, no handlers, ≤ 40 lines | WEB-001 §2 |
| `gate:no-literals` | hex, rgb, px/rem literals, font-family, shadows, z-index outside `tokens.css` | WEB-002 §2 |
| `gate:no-svg` | `<svg`, `<path`, `<use` in `src/**` | WEB-002 §5 |
| `gate:icon-registry` | `lucide-react` imported only by the registry | WEB-002 §5 |
| `gate:no-astryx` | any `ax-` token, `ax-` class, or astryx import | WEB-002 |
| `gate:a11y-static` | `alt=""`, missing alt, `div` with `onClick`, `tabIndex>0`, `outline:none`, physical direction properties | WEB-003 |
| `gate:a11y-axe` | axe-core zero violations on changed routes | WEB-003 §10 |
| `gate:budgets` | per-route JS and CSS budgets | WEB-005 §1 |
| `gate:retirement` | every `@retiring` banner has a ledger row and vice versa | §4 |
| `gate:session-record` | every tracker task marked `done` has a record file and a session-log row | WEB-007 §3 |

`npm run verify` runs: `typecheck` → `lint` → `gates` → `test:unit` →
`test:e2e` → `gate:budgets`.

### Commands an agent must never run

| Command | Why | Who runs it |
| --- | --- | --- |
| `npm run build` · `next build` | minutes long, contends with the dev server over `.next`, a half-finished build leaves a corrupted cache | the human |
| `git add` · `commit` · `push` · `checkout` · `branch` · `merge` · `rebase` · `reset` · `stash` | the commit is the last human checkpoint before code becomes history (WEB-007 §4) | the human |

An agent verifies with `typecheck`, `lint`, `gates`, and the feature exercised by hand in
the running dev server. Anything requiring a production compile becomes a **measurement
request** handed back to the human (WEB-005 §8) — never a command the agent runs itself.

---

## 4. Retirement protocol

Legacy components are not deleted the moment a replacement exists — half the
app still imports them. They are **marked, tracked, and then removed**.

### The banner

The moment a component is superseded anywhere, line 1 of its file becomes
exactly one banner in exactly this form:

```
/* @retiring 2026-08-06 · replaced-by components/saqeel/surface/Card · pending /operations,/factories,/reviews · delete-when 0-imports */
```

Regex (enforced by `gate:retirement`):

```
^/\* @retiring \d{4}-\d{2}-\d{2} · replaced-by [\w/.\-@]+ · pending [^·]+ · delete-when [\w-]+ \*/$
```

This is the **only** comment permitted outside the TSDoc exception in WEB-000
§2. It is machine-readable, it cannot be used for narration, and it carries a
deletion condition rather than a wish.

- `replaced-by` — the path of the component that supersedes it.
- `pending` — the routes still importing it. Every task that migrates one of
  those routes removes it from this list.
- `delete-when` — the condition, normally `0-imports`.

### Safe-to-delete gate

A file may be deleted only when **all** hold:

- [ ] `pending` is empty and a repo-wide search returns zero imports
- [ ] no dynamic import, no string-referenced path, no test fixture references it
- [ ] its exclusive CSS has been removed from the legacy global sheets
- [ ] the full e2e suite is green on the replacement routes
- [ ] the replacement has survived one demo/review cycle

Then: delete the file, delete its ledger row (moving it to *Retired*), and
record the byte savings in the session neuron.

Every marked file has a row in `brain/web/05-RETIREMENT-LEDGER.md`. A banner
without a row, or a row without a banner, fails `gate:retirement`.

---

## 5. Definition of Done

A task is done when **every** box is ticked. Not "mostly".

**Correctness**

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors, zero warnings
- [ ] `npm run gates` — every gate green
- [ ] `npm run test:e2e` — green on affected routes
- [ ] The feature works in the browser, exercised by hand, not assumed
- [ ] No production build was run; the measurement request was handed back instead

**Code law (WEB-000)**

- [ ] Zero comments, zero suppressions, zero `any`, zero `let` in `.tsx`
- [ ] Every file within budget; no directory over 12 files
- [ ] Imports flow downward only
- [ ] Nothing duplicated; nothing that needs a comment to be understood

**Architecture (WEB-001)**

- [ ] Route files are composition only, under 40 lines, no client code
- [ ] Every `"use client"` justified in writing and placed at the leaf
- [ ] All reads in `queries.ts`, all writes in `actions.ts`
- [ ] Cache posture declared for every query; tags revalidated on every mutation
- [ ] `loading.tsx` / `<Suspense>` present with layout-matching skeletons

**Design system (WEB-002)**

- [ ] No literal colour, size, radius, shadow, font, or z-index outside `tokens.css`
- [ ] No `<svg>`; every icon through the registry with a semantic name
- [ ] No Astryx reference
- [ ] Every new primitive has no domain knowledge, no `className` escape hatch,
      a closed variant API, and a ledger row
- [ ] Status renders as text plus shape

**Accessibility (WEB-003)**

- [ ] axe-core: zero violations on every changed route
- [ ] No `alt=""` anywhere; decorative graphics are not `<img>`
- [ ] The full manual checklist in WEB-003 §10 completed and its results recorded
- [ ] Keyboard, screen reader, 200% zoom, 320 px, Arabic/RTL, dark, reduced
      motion, greyscale — all pass

**State (WEB-004)**

- [ ] Every `useState` answers the four questions
- [ ] Every `useEffect` falls in the permitted list and cleans up
- [ ] No state duplicates a server or URL source of truth

**Performance (WEB-005)**

- [ ] Before/after numbers recorded for JS, CSS, LCP, INP, CLS
- [ ] Every route within budget
- [ ] Heavy libraries dynamically imported
- [ ] Bytes deleted from the legacy global sheets recorded

**Evidence**

- [ ] Before and after screenshots: light, dark, Arabic, mobile width
- [ ] The four closing steps of WEB-007 §3 completed
- [ ] Retirement ledger updated
- [ ] Zero git write commands run; one commit line proposed

---

## 6. Closing the task

Every completed task closes through
[`WEB-007-session-record-and-commits.md`](./WEB-007-session-record-and-commits.md):
a record of its own at
`brain/web/sessions/<YYYY-MM>/<YYYY-MM-DD>-<TASK-ID>-<slug>.md`, indexed in the
session log, with the tracker and status refreshed — followed by a changed-file
list and exactly one proposed Conventional Commit line.

The record is not paperwork. This app is transformed file by file by agents with
no memory between sessions. The record **is** the memory. A task that is not
written did not happen.

---

## 7. When a rule blocks the work

Stop. Write the conflict into the tracker task: which rule, what the work needs,
what the options are, and what it costs. Then ask.

Never resolve a rule conflict by breaking the rule quietly. The rules are the
only thing standing between this codebase and the state it is in today.
