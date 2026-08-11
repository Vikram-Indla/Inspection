# 2026-08-12 · T-075 — `/operations/exceptions` typography

`task: T-075` · `status: done` · `duration: 30m`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014`

---

## Goal

Audit `/operations/exceptions` for typography after T-073 rebuilt it.

## What changed

| File | Action |
| --- | --- |
| `saqeel/empty-state/empty-state.module.css` | `.title` `label` (12px) → `subheading` (16px), redundant `font-weight` dropped; `.description` retired `caption` → `body` |
| `scripts/typography-baseline.json` | 938 → 937 |

**Nothing in the route or its components was touched.**

## Decisions

**T-073's rebuild is the cleanest thing in this programme.** `page.tsx` is 36
lines, and `operations-board` — the component it renders — has **no CSS module
at all**. It is pure composition of design-system primitives. There is nothing to
migrate because there is nothing to migrate *from*.

**The one defect was an inverted hierarchy in `EmptyState`**, and it is a shared
primitive with **44 consumers**:

```
empty-state_title        12px / 600   ← the title
empty-state_description  14px / 400   ← its own description
```

**The title was smaller than the text it introduces.** Same defect class as the
explain-panel key/value inversion (T-059) and the factory-portfolio heading
(T-064) — a heading rendering below the weight of its own body. Now
`subheading` (16px) over `body` (14px).

`subheading` was chosen over `body-strong` on WEB-014 §2's own wording: it is
"a named group inside a card", which is exactly what an empty state is.
`body-strong` is "emphasis inside body; the value in a key–value row" — not a
title. The `.description` was also still on the **retired `caption`** role and
moved to canonical `body`.

**This cost the route no extra size.** 12px appeared on this screen only as the
empty-state title, so replacing it with 16px kept the count at four.

## Inventory taken before writing code

- `git log` checked first: T-073 committed (`e7cb2e96`), tree clean, no
  collision.
- Static scope: 3 baselined violations, **all in `operations-exceptions`, which
  this route no longer renders** — it is reached only by the legacy
  `RevampOperationsCenter`.
- Route rendered signed-in and measured **before** any edit.
- Every rendered node's size, weight and colour dumped to find the inversion —
  a size-only audit would have shown 12px and 14px as both on-scale and moved on.

## Numbers

```
                      before   after
distinct sizes           4        4    (30 · 20 · 16 · 14)
off-scale                0        0
typefaces                1        1
unstyled headings        0        0
empty-state title     12px     16px
repo violations        938      937
```

## Accessibility

- **axe:** not run. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — no markup change; `EmptyState` still renders `<p>` for both
    title and description, so no heading order moved
  - the empty-state title rose 12px → 16px, above the prose it introduces
  - **320px, Arabic/RTL — not verified. Owed.**
- No colour or tone change.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 937 known, **1 removed**
- [x] **Route rendered signed-in and measured** — 4 sizes, 0 off-scale,
      `allPlex: true`, 0 unstyled headings
- [x] `EmptyState` re-measured after the change — title 16px/600, description
      14px/400
- [x] **`/operations` re-checked for regression** — 4 sizes, 0 off-scale
- [x] Baseline diff audited — the single entry is this task's own
- [ ] **Only the empty state was observable.** This Planner sees no open
      exceptions, so the **populated board — groups, rows, counts — never
      rendered.** That is the majority of the screen and it is unverified.
- [ ] `EmptyState` has **44 consumers** and only two routes were re-checked.
- [ ] axe, 320px, Arabic/RTL — **owed**

**The session check from T-074 earned its place immediately.** The route hung on
its `loading.tsx` fallback mid-task; fetching it returned **369 KB with the board
present and no login markup**, proving the session was alive and the pane was at
fault this time. A fresh tab rendered it. **The same symptom has had two
different causes in two consecutive tasks — always run the check rather than
guessing which.**

## Retirement

`operations-exceptions` (3 violations) is now reached **only** by
`RevampOperationsCenter`, which `/operations` still renders via
`sections/operations-overview.tsx`. Not dead yet, but it is superseded by
`operations-board` on this route — worth a retire-or-adopt ruling before anyone
edits it.

## Parked

- **The populated exception board needs a look** with data in scope. Groups,
  rows and counts are unrendered here.
- **`EmptyState`'s 16px title lands on 44 consumers.** It is a size *increase*
  on every empty state in the app. Consistent and correct, but visible — worth
  an eyeball on a data-heavy screen.

## Blockers

None.
