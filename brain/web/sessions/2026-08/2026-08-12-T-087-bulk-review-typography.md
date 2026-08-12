# 2026-08-12 · T-087 — `/planning/bulk/review` typography, 30 → 0

`task: T-087` · `status: done (nothing was render-verified — the session expired)` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-006 §4, WEB-008, WEB-009, WEB-011, WEB-014 §4.1, §8, §11.4`

---

## Goal

Take the ten `review-*` modules off feature-CSS typography and onto the type
primitives. The route had never been swept.

## What changed

**30 declarations across 9 modules → 0.** The route's only remaining violation is
`NotificationBell.tsx:270`, the shell.

| Module | Removed | Notes |
| --- | --- | --- |
| `review-outcome` | 6 | incl. the hand-rolled card title |
| `review-assignment-split` | 5 | KPI label/value/note |
| `review-consequence-ledger` | 4 | `<h4>` → `Heading visual="label"` |
| `review-eligibility` | 4 | KPI grid |
| `review-context` | 3 | one of them **dead** |
| `review-readiness` | 3 | incl. the focusable heading |
| `review-publish-form` | 2 | status + blocked lines |
| `review-targets` | 2 | table cell identity |
| `review-standby` | 1 | **stylesheet deleted** — `.note` was its only class |

`review-standby.module.css` deleted outright. `review-context`'s `.moment`
(17 lines including a `:focus-visible` block) was **dead** — zero consumers,
left behind when the window control became `DateRangePicker`.

## Decisions

**The whole app renders body text at two different line-heights, and this route
had both.** `<body>` is matched by **two** `font:` shorthands:

```
saqeel.css:869          font: var(--sqx-text-body)    → 1.6 → 22.4px
saqeel-runtime.css:19   font: var(--type-body-font)   → 1.5 → 21px   ← wins
```

The **frozen legacy sheet wins on load order**, so anything inheriting its line
height renders at 21px while every type primitive renders at 22.4px. Measured
before the migration: `review-standby`'s `.note` was **14px / 21px**, while the
already-migrated `PlanningNotice` on the same family measured **14px / 22.4px**.

So the twelve `font-size: var(--sqx-text-body-size)`-only classes here were
**not** rendering `body` — they were rendering the body *size* with the legacy
*leading*. Migrating them is a visible change: **+1.4px of leading per line**,
toward the documented contract and consistent with every already-migrated
surface. Recorded rather than shipped silently.

**KPI values change weight, 600 → 700, and that is the contract.** `.value` /
`.cellValue` set `font-size: var(--sqx-text-metric-size)` with
`font-weight: var(--sqx-weight-semibold)` — metric *size* at the wrong *weight*,
because the class was assembled from parts rather than using the role.
`--sqx-text-metric-weight` is `--sqx-weight-bold` (700), so `<Metric>` renders
700. WEB-014 §2 and §5.2 both say every number is `metric`; the previous 600 was
off-contract. **Visible, deliberate, and the single most noticeable change in
this diff.**

**Two focusable headings were a real primitive gap (§11.4), closed without
touching the design system.** Both need `subheading` *plus* a `ref` and
`tabIndex={-1}`, because `ReviewClient` focuses them after publish succeeds or
fails. `Heading` accepts neither; `Text` has no `subheading` role at all. The
owner was asked whether to extend `Heading` and did not answer, so the
**reversible** option was taken:

```tsx
<div tabIndex={-1} ref={headingRef} role={live}>
  <Heading level={3} visual="subheading">{title}</Heading>
</div>
```

This is a pattern the repo already uses in at least four places
(`DraftEditor.tsx:117`, `PublishControls.tsx:35`, `VisitsBoard.tsx:590`,
`DecisionPanel.tsx:104`). **It also fixes a pre-existing accessibility defect:**
`review-outcome`'s heading was `<h3 role={live}>`, and `role="status"`
**replaces** the heading role — the element was not a heading in the
accessibility tree at all. The role now sits on the wrapper and the `<h3>` is a
heading again. Three `useRef<HTMLHeadingElement>` in `ReviewClient` became
`HTMLDivElement` to match.

**`<legend>` hit the same wall as T-088** and took the same answer: the element
stays, a `<Text as="span">` goes inside it. Second instance — see Parked.

## Inventory taken before writing code

- 30 route-owned declarations, 9 modules, enumerated with line numbers.
- Every class checked for other consumers before deletion; every `styles.x`
  checked for a surviving definition after. **Both directions came back clean.**
- 1 dead class (`.moment`), 1 stylesheet reducible to nothing
  (`review-standby.module.css`).
- No `<svg>`, no glyphs, no copy, no `let`, no literal values, no state added.

## Numbers

```
/planning/bulk/review   31 → 1 violations   (route-owned 30 → 0)
repo baseline          843 → 813
stylesheets deleted      1  (review-standby.module.css)
dead CSS removed        17 lines (.moment + its :focus-visible)
```

Deliberate visible changes, both toward the contract:

```
KPI values     28px / 600  →  28px / 700   (Metric; --sqx-text-metric-weight is bold)
body prose     14px / 21px →  14px / 22.4px (legacy 1.5 leading → body 1.6)
```

## Accessibility

- **Improved:** `review-outcome`'s `<h3>` was carrying `role="status"`, which
  replaced its heading role. It is a heading again, with the live region on its
  wrapper. The announcement behaviour is unchanged; the document outline gains a
  heading back.
- Focus targets: three refs moved from the `<h3>` to its wrapper `<div
  tabIndex={-1}>`. Focus still lands on an element containing exactly the
  heading text, so the announcement on focus is equivalent.
- No heading level, `id`, `aria-labelledby` or landmark changed.
- No text got smaller. Leading increased slightly, which is a legibility gain.
- axe not re-run — see Verification.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist (T-083)
- [x] `npm run gates:typography` — 30 removed, re-baselined 843 → 813
- [x] Zero typography declarations left in `review-*` — asserted by grep
- [x] No orphaned `styles.x` and no unused class, checked both directions
- [x] Per-route import-graph scan — route-owned **0**
- [ ] **Nothing was render-verified, and this is the task's real gap.** The route
      shows its standby state without a staged bulk plan in the browser session,
      and the session then **expired mid-check** (`/en/login?reason=expired`) —
      the T-072/T-074 failure. The only *before* measurement captured is
      `review-standby`'s `.note` at **14px / 21px / 400**; there is no matching
      *after*. **Every claim above about rendered output is derived from
      `type.module.css` and `saqeel.css`, not observed.**
- [ ] `npm run test:e2e` — not run; needs a production build

## Retirement

`review-standby.module.css` deleted. `.moment` deleted from
`review-context.module.css`.

## Parked

1. **`Text` still cannot render a `<legend>`** — second instance after T-088
   (`review-context`, `visit-configuration`). **The third occurrence should
   extend the `as` union rather than repeat the workaround**, with the owner's
   agreement since it is a design-system change.
2. **The `<body>` line-height conflict is app-wide and unresolved.**
   `saqeel-runtime.css:19` overrides `saqeel.css:869` on `<body>` itself, so the
   design system's own body rule loses to a frozen sheet. Every unmigrated
   surface renders 1.5 leading and every migrated one renders 1.6. **This is not
   fixable per route** — it needs a ruling on load order or on deleting the
   legacy `body` rule, and it would shift leading app-wide.
3. **`review-eligibility` shows seven counts at two different treatments.** Six
   render as `Metric` (28px); the *eligible* count renders as a `StatusPill`
   (14px). WEB-014 §2 rule 2 — two numbers at two sizes assert that one matters
   more. Either all seven are metrics or the pill is not carrying a count. **Not
   a typography violation, so out of scope here** — a design question.
4. **Focus now lands on a wrapper, not the heading.** If the owner prefers the
   heading itself, extending `Heading` with `ref`/`tabIndex` is the alternative
   and this change is a clean revert.

## Blocked / open questions

**The primitive-gap question was asked and not answered.** The reversible option
shipped. If `Heading` should gain `ref`/`tabIndex` instead, say so and it is a
small, contained change.

## Proposed commit

```
refactor(planning): render bulk review text through the type primitives
```

## Next

Render-verify this route with a staged bulk plan and a live session — the
`Metric` weight change and the leading change both want a measured after-state.
Then `/planning` itself: 46 violations, 45 route-owned, the largest remaining
pocket in the planning family.
