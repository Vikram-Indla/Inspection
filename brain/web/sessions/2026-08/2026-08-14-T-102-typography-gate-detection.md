# 2026-08-14 · T-102 — the gate learns to see the defects it was written for

`task: T-102` · `status: done` · `duration: ~1h`
`rules applied: WEB-006, WEB-007, WEB-008, WEB-014 §4.1, §8`

---

## Goal

Make `check-typography.mjs` detect the three defect classes it has been provably
blind to, and re-baseline honestly, so that "zero violations on a migrated route"
can become a statement about the screen rather than about its CSS files.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/scripts/check-typography.mjs` | modified | 173 → 217 |
| `apps/web/scripts/typography-baseline.json` | re-baselined | 188 → 413 |

## Why this task exists

`01-PROJECT-STATUS.md` records the hole three separate times and the tracker
records it once more: T-090, T-091, T-092 and T-097 each found their real defect
by **measuring a render**, after the gate had reported the route clean. The
status doc states it plainly — *"a route at '1 violation' is not evidence that it
renders on-scale"*. Four tasks paying the same cost is a tooling defect, not four
unlucky sessions.

Measured before touching anything, across the five migrated route families:

```
EmptyState.tsx:28          <p className="t-caption">   → 11.5px prose · 44 consumers
ContextualAiPanel.tsx ×4   t-caption                   → 11.5px prose
GeoMap.tsx:315             t-caption                   → 11.5px prose · 18 consumers
PlanningReadFailure.tsx:26 id-code                     → 12.5px in ui-monospace
```

All four scored **zero**. `.t-caption` is `--type-caption-size` (**11.5px**,
`tokens.css:228`) and `--font-mono` is `ui-monospace, "SF Mono", …`
(`tokens.css:190`) — a second typeface, which §2.0 forbids outright.

## What changed in the gate

**1 · `legacy-type-class-in-jsx`.** The class list is **derived from the frozen
sheets, not invented**: every global class whose declaration body is *only*
typography and colour. `tokens.css:219-230` yields the twelve `.t-*` utilities;
`saqeel-runtime.css:61` yields `.sq-overline`; `saqeel-components.css:163` yields
`.id-code`. Fourteen names, each one the legacy analogue of a type primitive.

The pattern matches the bare token with `(?<![\w-])…(?![\w-])` rather than
looking for `className=`, because T-097's defect reached the DOM through a
variable and a same-line `className` match would have missed it. The longest
alternative is listed first so `t-body-lg` is never scored as `t-body`.

**2 · `legacy-type-token`.** `--type-*` outside the four frozen sheets, across
`.css`, `.ts` and `.tsx`. Deliberately **not** exempting `components/saqeel/` —
the authoring zone may declare typography, but it may not declare it from the
*pre-SAQEEL* scale, and eight sites there were doing exactly that.

**3 · `inline-font-style` made multiline.** The rule was correct and the engine
was not: patterns were tested line by line, so `[^}]*` could never cross a
newline and every multi-line style object escaped. Rules may now set
`multiline: true`, in which case the source is matched whole and the line number
is derived from the match index. This found **19** further sites — and, as a side
effect, corrected the count downward where a single object had previously been
scored once per line.

## Numbers

```
baseline            733 → 1846        entries  188 → 411

by rule                          before   after   delta
legacy-type-class-in-jsx              0     944    +944
legacy-type-token                     0     179    +179
inline-font-style                   112     130     +18
raw-typography-property             364     346     -18
font-shorthand-outside-design-system  151     143      -8
retired-typography-role              97      95      -2
card-eyebrow-above-title              9       9       0

newly detected by this task                  +1142
removed by T-101 (concurrent, uncommitted)     -29
```

**1,142 defects that existed this morning were invisible this morning.** The
number did not get worse; the instrument got honest. The four negative deltas are
**not** detections lost — all four keys belong to `NotificationBell.*`, which
T-101 deleted in the same working tree (see *Blocked* below).

## Decisions

**The ratchet was raised deliberately, and this is the carve-out.** WEB-014 §8
says the baseline may only go down and *"a task that raises it is rejected on
sight"*. That clause governs **regressions** — code that got worse. It cannot
govern **detection**, or the gate can never be improved and every blind spot is
permanent by construction. A future task raising the number by writing a
violation is still rejected on sight; this one raised it by *finding* violations
that were already shipped, and the rule text should be amended to say so.

**Detection scope stops at whole-token typography classes.** The frozen sheets
define ~180 classes carrying a font declaration (`.kpi-label`, `.spine-title`,
`.sq-f360__license dd`, and so on). Those are **component** classes that happen
to include type; banning them from JSX would ban the legacy components
themselves, which is a migration decision, not a typography one. Only the
fourteen classes whose entire purpose is typography are in scope.

**`.tsx` only for the class rule.** A class name in a `.ts` file is not rendering
anything by itself. Widening it would trade a real signal for noise.

## Inventory taken before writing code

- Legacy class list derived by parsing all four frozen sheets for class blocks
  containing `font-size|font-family|font-weight|line-height|letter-spacing`, then
  reading each candidate's body to separate pure-typography from component classes
- Reachability graph built from every `page`/`layout`/`error`/`loading` entry to
  separate live debt from dead debt before counting anything
- No component, route, or user-visible string was touched by this task

## Accessibility

Not applicable — no rendered output changed. No route was modified.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **the script does not exist** (see *Blocked*)
- [x] `npm run gates:typography` — PASSED, 1846 known, none new
- [ ] `npm run gates` — fails on a **pre-existing** `check:design-system-v5`
      finding in `src/lib/analytics/query-state.ts:18`, a file neither session
      touched. It was red before this task started.
- [ ] `npm run test:e2e` — not run

## Retirement

Nothing marked or deleted. The fourteen legacy type classes are now *counted*,
which is the precondition for retiring them; `tokens.css:219-230` cannot be
deleted until `legacy-type-class-in-jsx` reaches zero.

## Parked

- **`shell-page-frame.module.css` carries 7 violations and is not reachable** from
  `app/(app)/layout.tsx`. Either a dead module or an import path the graph missed
  — settle it inside T-104.
- The `.t-*` utilities are 944 of the 1846. A codemod is tempting and wrong: each
  site needs a role decision (`t-caption` on a sentence is `body`, on a key is
  `label`), which is the judgement the contract exists to make.

## Blocked / open questions

**Two sessions ran concurrently and the working tree is entangled.** A parallel
session completed a task **also numbered T-101** — *the notification panel leaves
the frozen sheets* — deleting `NotificationBell.tsx` and `NotificationBell.module.css`
(29 baselined violations) and creating `components/notifications/*` (zero
violations, clean work). This task was renumbered **T-101 → T-102** on discovery;
their record and cross-references are untouched.

Consequences the human must resolve:

1. **`typography-baseline.json` is now co-owned by two uncommitted tasks.** The
   1846 figure includes their −29. If their work is reverted, the gate fails with
   29 "new" violations — the safe direction, but it must be reverted *with* them.
   The two changes should land in the same commit or not at all.
2. **This is the third recorded ID collision** (T-076 twice, now T-101 twice). The
   status doc already prescribes the fix — claim the ID in the tracker at the
   *start* of a task — and nothing implements it.
3. **`npm run lint` does not exist in `package.json`.** WEB-008 §3 and
   `CLAUDE.md` both require it before any task is called done, so every session
   claiming a green lint claimed something it could not have run. This is the
   second missing script of its kind after `gate:retirement` (T-077).

## Proposed commit

```
build(gates): detect legacy type classes, tokens and multiline inline fonts
```

## Next

**T-104 — shell and topbar to zero.** 59 counted violations in
`components/app-shell/*`, live on every route through `app/(app)/layout.tsx:2`.
Inventory delivered with this record.
