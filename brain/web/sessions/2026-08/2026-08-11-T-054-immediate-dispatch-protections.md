# 2026-08-11 · T-054 — `/planning/immediate` slice 2: dispatch protections + R05 notice

## Goal

Replace the nine-chip authority bar and the R05 identity notice — the top third
of the urgent-visit screen, and the first block a planner reads. Slice 2 of 5.

## What changed

`AuthorityBar.tsx` (95 lines, **6 hooks**) deleted. In its place
`components/sections/planning-immediate/dispatch-protections` at **zero hooks**,
over a pure view model in `features/planning-immediate/protections.ts`. The R05
warning moved from `alert alert-warning` to `PlanningNotice`.

## Decisions

- **Copied `review-readiness`'s declarations rather than choosing values.**
  `--sqx-surface-sunken`, `--sqx-radius-control`, `--sqx-space-3` padding, pill
  leading then a `.body` column, **no border**. The `.grid` is
  `publish-readiness`'s `repeat(auto-fit, minmax(--sqx-grid-min-sm, 1fr))`. The
  only declarations not copied are the button reset, which the sibling does not
  need because its item is an `<li>`.
- **Six of the nine are `<button>`, so `.chip` resets the user agent.**
  `saqeel.css` has no global `button` rule by design, and a `<button>` carries a
  UA border and inherits neither `font` nor `color`. `.chip` declares `border: 0`,
  `font`, `color`, `text-align` and `background`, so the button and span branches
  are visually identical. Hover is `--sqx-surface-subtle`; `--sqx-surface-accent`
  is reserved for selection (WEB-009 §11).
- **Three protections are not buttons.** AUTHORIZED, AUDIT and NOTIFY own no
  control. The legacy rendered them focusable and they silently did nothing on
  Enter. They are plain `<span>`s whose visible text is their accessible text —
  no `aria-label`, because there is nothing to override.
- **The roving tabindex went with them.** A `role="group"` of buttons is
  Tab-navigable by contract; roving tabindex belongs to `toolbar` and `listbox`.
- **`scrollIntoView({behavior:"smooth"})` deleted.** It ignored
  `prefers-reduced-motion`, and `focus()` already scrolls the control into view.
- **The announcement needed no effect.** It is a derived string; React mutates
  that text node only when the string actually changes, which *is* the "announce
  when the blocking set changes, not on every keystroke" behaviour the two
  `useEffect`s and a `useRef` were hand-rolling.
- **The blocking summary now lists every blocker.** The legacy showed the first
  one visibly and the full set to screen readers, so a planner with four blocking
  protections was told about one.
- **The R05 notice carries its title in the body, not in a pill.**
  `PlanningNotice`'s label renders as a `StatusPill`, and the R05 title is a
  six-word sentence — a sentence in a pill is not the grammar. The title is a
  `<strong>` lead inside the notice body, so all copy is preserved and the
  meaning is in the text rather than in the border colour.

## Inventory taken before writing code

`AuthorityBar.tsx` read in full; `cd-023-immediate-authority-bar.spec.ts` read
for the assertions that constrain the markup —
`getByRole("group", {name: /Immediate dispatch protections/i})` containing
`getByRole("button", {name: /REASON — blocking — …/i})`. **Every regex in that
spec carries `/i`**, which is what made yesterday's sentence-casing safe and is
re-verified here.

## Numbers

| File | Before | After |
| --- | --- | --- |
| `AuthorityBar.tsx` | 95 | **deleted** |
| `dispatch-protections.tsx` | — | 96 |
| `dispatch-protections.module.css` | — | 74 |
| `features/planning-immediate/protections.ts` | — | 136 |
| `ImmediateForm.tsx` | 352 | 328 |

Hooks in this block **6 → 0**. Emoji-as-state **3 → 0**. Legacy classes in this
block (`panel`, `panel-body`, `stack`, `filter-bar`, `filter-chip`, `is-set`,
`t-caption`, `alert`, `alert-critical`, `alert-warning`, `alert-title`,
`sr-only`) **12 → 0**. Focusable no-op controls **3 → 0**. Blockers shown to
sighted users **1 → all**.

## Accessibility

- State is `StatusPill` text plus tone, never colour alone (WEB-009 §12).
- Button branch keeps CD-023's `LABEL — state — detail` accessible name; the
  non-interactive branch exposes the same three facts as ordinary text.
- Focus ring is the token ring at `:focus-visible` only, and moves nothing.
- `prefers-reduced-motion: reduce` disables the one `background-color`
  transition; there is no other motion.
- **axe not run** — no dev server, no seeded account.

## Verification

- `npx tsc --noEmit` — **zero errors from this slice**. One unrelated error
  exists in `components/planning/planning-drafts/planning-drafts.tsx`
  (`Cannot find name 'empty'`), a file modified in the working tree by the
  parallel T-053 session. Not touched.
- Rule sweep: zero comments, zero suppressions, zero `any`/`as unknown as`/`!`,
  zero `let`, zero literal visual values, zero `<svg>`, zero emoji.
- **Not run:** browser, keyboard, Arabic/RTL, light/dark, axe.

## Retirement

`AuthorityBar.tsx` **deleted**, not banner-marked: its only importer was rewired
in the same change, so the 0-imports gate cleared immediately (WEB-006 §4). Row
added to `05-RETIREMENT-LEDGER.md`.

## Parked

- `ImmediateForm` now takes both `strings` (flat adapter) and `messages`
  (nested). That is the transition: each slice moves a block onto `messages`,
  and `strings` disappears with the last one.

## Blocked / open questions

- **WEB-009 §14 versus CD-023 still lands in slice 4**, unchanged: the rule bans
  `<select>` and `<input type="date">`, the spec drives `#imm-existing` with
  `selectOption` and fills `#imm-window-start` as `datetime-local`.
- The 58 Arabic strings authored in T-052 still need a native review.

## Proposed commit

`refactor(planning): rebuild the urgent-visit protections on saqeel`

## Next

Slice 3 — Identity: mode toggle, factory search, the registered-factory select,
the preview card, urgency reason and visit type.
