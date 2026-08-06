# WEB-007 — Task Record & Commit Law

> Status: **BINDING**.
> Two obligations that close every task: **write the record** and **never
> commit**. Both are absolute. A task that skips either is not finished, no
> matter how good the code is.

---

## 1. Why this is a rule and not a nicety

This application is being transformed file by file by agents that remember
nothing between sessions. The record is the only continuity that exists. An
undocumented task is a task the next agent will half-repeat, contradict, or
undo.

And the commit is the human's decision. An agent that commits removes the last
review checkpoint before code becomes history.

---

## 2. Record after **every task**, not only at session end

A record is written the moment a tracker task reaches `done` — not batched at
the end of the day, not deferred to "when I finish the next one too".

If one session completes three tasks, three records are written.
If one task spans three sessions, three records are written — the first two
marked `partial`, each stating exactly where it stopped and what the next
session must pick up.

**Path:**

```
brain/web/sessions/<YYYY-MM>/<YYYY-MM-DD>-<TASK-ID>-<slug>.md
```

```
brain/web/sessions/2026-08/2026-08-07-T-001-icon-layer.md
brain/web/sessions/2026-08/2026-08-07-T-002-core-primitives.md
brain/web/sessions/2026-08/2026-08-08-T-010-application-shell.md
```

- Month folder `<YYYY-MM>` — create it if it does not exist.
- Date `<YYYY-MM-DD>` — the date the task completed.
- `<TASK-ID>` — the tracker id, exactly as written in
  `03-REDESIGN-TRACKER.md`. One record, one task. Never merge two tasks into
  one file.
- `<slug>` — lowercase, hyphenated, three or four words.

**Content:** copy `brain/web/sessions/_TEMPLATE-session.md` and fill every
section. A section with nothing to say says "none" — it is never deleted,
because an empty section is itself information.

Non-negotiable inside the record:

- the file table: every file created, rebuilt, split, marked, or deleted, with
  line counts before and after
- the before/after performance numbers (WEB-005 §8)
- the accessibility result: axe count plus the manual checklist outcome
  (WEB-003 §10)
- decisions taken, so the next agent does not re-litigate them
- what was parked and what is blocked
- the proposed commit message (§4)

"Refactored the dashboard, looks good" is not a record.

---

## 3. The four closing steps, in order

Every completed task ends with all four. None is optional, and the order
matters — the tracker is the source, the record is the detail, the log is the
index, the status is the summary.

1. **Tracker** — `03-REDESIGN-TRACKER.md`: set the task to `done`, move the
   next item into NOW, copy anything discovered into PARKED.
2. **Record** — write the file at the path in §2.
3. **Index** — add one row to `02-SESSION-LOG.md`, newest first, linking the
   record.
4. **Status** — refresh `01-PROJECT-STATUS.md`: current phase, baseline numbers
   that moved, any new decision on record.

Plus, whenever the task touched them: `04-COMPONENT-LEDGER.md` and
`05-RETIREMENT-LEDGER.md`.

`gate:session-record` fails if a tracker task is marked `done` without a
matching record file and a matching row in the session log.

---

## 4. Never commit — propose one line instead

**Never run**, on any branch, for any reason:

```
git add · git commit · git push · git checkout · git switch · git branch
git merge · git rebase · git reset · git revert · git stash · git tag
git cherry-pick · git clean · gh pr create · gh pr merge
```

Read-only git is fine and encouraged: `git status`, `git diff`, `git log`,
`git show`, `git blame`. Use them to verify what you changed before you report
it.

If the working tree needs to be cleaned, reverted, or branched, **ask**. Do not
do it.

### What you output instead

When a task is complete, end with exactly two things:

**1. The changed files**, grouped by action:

```
created   apps/web/src/components/saqeel/media/Icon.tsx
created   apps/web/src/components/saqeel/media/Icon.module.css
created   apps/web/src/components/saqeel/media/icon-registry.ts
modified  apps/web/src/components/saqeel/index.ts
modified  apps/web/package.json
marked    apps/web/src/app/icons.tsx
modified  brain/web/05-RETIREMENT-LEDGER.md
created   brain/web/sessions/2026-08/2026-08-07-T-001-icon-layer.md
```

**2. One line.** A single Conventional Commit subject. Nothing else.

```
feat(saqeel): add lucide icon registry and Icon primitive
```

### The one-liner spec

- **One line. No body, no bullet list, no footer.** If the change genuinely
  cannot be described in one line, the task was too big — say so, and note it.
- Format: `<type>(<scope>): <subject>`
- Length: **≤ 72 characters** including the type and scope.
- Type: `feat` · `fix` · `refactor` · `perf` · `a11y` · `style` · `docs` ·
  `test` · `build` · `chore`
- Scope: the tracker task's area — `saqeel`, `shell`, `dashboard`,
  `operations`, `field`, `planning`, `admin`, `gates`, `web`
- Subject: **imperative mood**, lowercase start, no trailing full stop.
  "add", not "added" or "adds".
- No emoji. No ticket numbers. No `Co-Authored-By`. No agent attribution. No
  "as requested". The message describes the change to a reader in five years,
  not the conversation that produced it.
- Where a number is the point of the change, put it in the line:

```
perf(operations): rebuild board server-first, -316 KB first-load JS
a11y(field): fix focus order and labelling on inspection checklist
refactor(shell): split ShellClient into server shell and three islands
feat(saqeel): add Card, Stack, Cluster and Grid surface primitives
docs(web): record T-002 and refresh component ledger
chore(gates): add no-svg and icon-registry gates
```

Bad, and rejected:

```
Updated files                              ← says nothing
feat: changes                              ← says nothing
fixed the dashboard and also the sidebar and cleaned up some CSS   ← two tasks, and too long
feat(web): ✨ add amazing new card component!!                     ← emoji, hype
refactor(shell): split ShellClient (as you asked)                  ← conversation, not history
```

One task, one line. That is the whole contract.

---

## 5. Checklist — the last thing you do

- [ ] Tracker task set to `done`; next item moved into NOW
- [ ] Record written at `brain/web/sessions/<YYYY-MM>/<YYYY-MM-DD>-<TASK-ID>-<slug>.md`
- [ ] Every template section filled, including numbers and the a11y result
- [ ] Indexed in `02-SESSION-LOG.md`
- [ ] `01-PROJECT-STATUS.md` refreshed
- [ ] Component and retirement ledgers updated if touched
- [ ] Zero git write commands were run
- [ ] Changed-file list printed, grouped by action
- [ ] Exactly one Conventional Commit line proposed, ≤ 72 characters
