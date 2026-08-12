# 2026-08-12 · T-084 — visit actions on SAQEEL controls, split into `visit-actions/*`

`task: T-084` · `status: done (3 rewritten e2e interactions unverified)` · `duration: ~2h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-006, WEB-009, WEB-011, WEB-013`

---

## Goal

Put the Management actions card on the design system's own select and date
controls, split the 257-line `ActionBar` into components named after the
transitions they perform, and remove the duplicated blocked-state copy — without
moving any part of the write path.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/visits/[id]/ActionBar.tsx` | **deleted** | 257 → 0 |
| `components/visits/visit-actions/visit-actions.tsx` | created (shell, zones, live regions) | — → 153 |
| `components/visits/visit-actions/visit-actions-strings.ts` | created (string contract + identity minting) | — → 55 |
| `components/visits/visit-actions/reschedule-form.tsx` | created | — → 62 |
| `components/visits/visit-actions/return-form.tsx` | created | — → 50 |
| `components/visits/visit-actions/reassign-form.tsx` | created | — → 50 |
| `components/visits/visit-actions/repackage-form.tsx` | created | — → 44 |
| `components/visits/visit-actions/visit-type-form.tsx` | created | — → 40 |
| `components/visits/visit-actions/cancel-form.tsx` | created | — → 32 |
| `components/visits/visit-actions/duplicate-form.tsx` | created | — → 32 |
| `components/visits/visit-actions/republish-form.tsx` | created | — → 21 |
| `components/visits/visit-actions/transition-fields.tsx` | created | — → 21 |
| `components/visits/visit-actions/visit-actions.module.css` | created | — → 42 |
| `components/saqeel/select/select.tsx` | `name` · `defaultValue` · `required` · `emptyLabel` | 177 → 216 |
| `components/saqeel/date-range-picker/date-range-picker.tsx` | `nameFrom` / `nameTo` | +13 |
| `components/saqeel/field/field.tsx` | `requiredLabel` | 17 → 27 |
| `components/saqeel/field/field.module.css` | `.required` | +5 |
| `lib/dates.ts` | `riyadhLocalInput()` | +19 |
| `features/visits/detail/view.ts` | `ChoiceOption`, `reasonChoices()`, Riyadh window | +14 |
| `features/visits/detail/strings.ts` | rebuilt for the nested string contract | 74 → 101 |
| `app/(app)/visits/[id]/page.tsx` | composes `VisitActions` | 44 → 44 |
| `e2e/cd-027-visit-detail.spec.ts` | re-pointed source read; listbox helper; 2 interactions | +18 |
| `e2e/reusable-inspector-concurrent-scheduling.spec.ts` | roster-driven listbox helper; 2 interactions | +12 |
| `i18n/locales/{en,ar}/visits.json` | `actions` 33 → 44 keys | — |

## Decisions

**Build the options in the view model, never in the component.** `ActionBar`
rendered `{o.label_en}` for every governed return and cancel reason, so the Arabic
planner read English on a Saudi ministry screen. `reasonLabel()` — which picks
`label_ar` by locale — had been exported from `features/visits/detail/view.ts:24`
the whole time, and `field/inspection/[id]/results/page.tsx:70` was already using
that exact pattern. **Third recorded instance of T-079's lesson.** `reasonChoices()`
now maps `ReasonOption[]` to `{value,label}` at the boundary, so no component can
reach a raw column again.

**Selecting a column by locale is not a banned `locale === "ar"` ternary.**
WEB-013 bans locale ternaries over *copy*; this is a **data** read choosing which
translated DB column to display. `results/page.tsx` set the precedent.

**The primitive gap gets filled, not worked around.** `Select` is a `<button>` +
listbox, so it posts nothing — which is exactly why the banned native `<select>`
survived T-080. It now takes `name` and renders a hidden input carrying the value.
Swapping without that would have compiled, rendered correctly and **silently
submitted an empty field on every governed transition.**

**`defaultValue` matters more than `name`.** A controlled `Select` would have
forced four `useState`s into the forms. The uncontrolled mode means the forms hold
**zero state** and the answer is read once from `FormData` — WEB-004 §1 rung 4.
The state audit for this diff is therefore empty on the form side; the shell keeps
the eight `useActionState` hooks and one `useState` for identity keys.

**`required` cannot be enforced by a hidden input, and does not need to be.** A
hidden input is exempt from constraint validation, so `required` writes
`aria-required` and the enforcing check stays on the server — where it already
was for all five fields (`reason_key`, `visit_type`, `inspector_id`,
`package_version_id`, `window_start/end`). The browser's validation bubble is
replaced by the card's existing `live="alert"` region. **No capability is lost,
but it does raise the cost of the parked hardcoded-English action copy**, because
an Arabic user now meets those English strings more often.

**The reschedule window needed no new component, and the owner was right.**
`DateRangePicker` already carried `withTime`, `timeStep`, `timeLabels` and already
emitted `YYYY-MM-DDTHH:mm`. Both `datetime-local` inputs are gone — WEB-009 §14
bans them for the same reason it bans `<select>` — with nothing built. The one
missing piece was submitting, so it gained `nameFrom`/`nameTo`.

**The window conversion belongs in `lib/dates.ts`.** The old code did
`new Date(iso).toISOString().slice(0, 16)`, i.e. the **UTC** instant, so editing a
window would write it back three hours early — the T-076 defect class, on a write
path this time. `riyadhLocalInput()` sits beside the other date logic because that
is where `TIME_ZONE` lives; exporting the constant to a feature module would have
put a second source of truth next to it.

**Split by transition, with the shell keeping the wiring.** Each form is a thing a
person asks for by name — "the reassign form". The shell keeps the eight
`useActionState` hooks deliberately: aggregate pending state is **one** concern
(*which transition is in flight*), and it is what disables every other button
during a submit. Pushing the hooks into the forms would have lost that
cross-form guard.

**A blank listbox was a regression I introduced.** This environment seeds zero
return reasons. The native control still rendered `—`; the listbox opened onto an
empty panel, which reads as a failure to load rather than as unconfigured data.
`Select` gained `emptyLabel` and now renders a disabled row — rule 9's *absent
data renders as a state*. The copy is the caller's, so the primitive ships no
English.

**The required marker moved out of the resource file.** `"Return reason *"` and
`"سبب الإعادة *"` baked a glyph into translated copy, and a screen reader
announced *"Return reason star"*. `Field` gained `requiredLabel`; the word is
still the caller's.

## Inventory taken before writing code

- **State:** forms 0 (uncontrolled `Select`, `FormData` on submit); shell 8
  `useActionState` + 1 `useState` (identity keys, minted once per mount — a fresh
  key per render would defeat the server's duplicate guard); `reschedule-form` 1
  `useState` for the window, because `DateRangePicker` is controlled by design.
  **Net new state versus `ActionBar`: −2** (three identity `useState` → one).
- **Effects:** 1, unchanged — the duplicate → `router.push` redirect, moved intact
  into `duplicate-form.tsx` with its dependency array.
- **Literals:** one, a `@media (min-width: 48rem)` breakpoint, matching the only
  pattern the migrated saqeel modules use.
- **`<svg>`:** none.
- **Dead copy found:** `actions.cancelReason` (the cancel form has no reason
  select — `cd-027:365` asserts `#visit-cancel-reason` has count 0, so the
  assertion was already passing vacuously) and `actions.executionStarted` (a
  near-duplicate of `scheduleLockedWhy`, superseded). Both deleted from both
  locales.
- **Duplicated UI:** the blocked row printed the three locked actions as a pill
  and then re-listed them in prose while repeating "locked", which the section
  heading *Not available yet* had already said. The pill keeps the list; the
  sentence keeps only the fact the pill cannot carry — which state blocked it.
  The card title's *"— only valid changes are allowed"* moved to the
  `CardHeader` description, the same shape used for Attachments in T-082.

## Numbers

```
Route: /visits/[id]  (measured on the live route at 1440px)

ActionBar.tsx            257 lines → deleted
visit-actions/           12 files, largest 153 (WEB-000 target 200)
native <select>          2 → 0
input[type=datetime-local] 2 → 0
useState in the forms    0
control rows             90|265|65 and 65|265|77  →  507|507|65 and 501|501|77
control heights          38px throughout, unchanged (WEB-009 §1)
i18n actions keys        33 → 44 per locale, parity asserted, 2 dead deleted
page overflow            0
```

## Accessibility

- **axe:** not run — owed.
- Manual checklist (WEB-003 §10):
  - **keyboard** — the listbox brings a full APG contract the native control
    never had here: Arrow/Home/End, type-ahead, Escape, Tab-closes,
    `aria-activedescendant`, focus returned to the trigger on commit. Verified in
    source, **not exercised by hand.**
  - **screen reader** — not run. Asserted in the DOM: both triggers are
    `role="combobox"` with `aria-required="true"`, `aria-expanded` tracks state,
    the surface is `role="listbox"` with an `aria-label`, and rows are
    `role="option"` with `aria-selected`. The empty state is a disabled option
    rather than an empty panel.
  - **200% zoom** — not run.
  - **320 px** — the rows stack below 48rem (`flex-direction: column`); page
    overflow measured 0 at 1440. **Not re-measured at 320 after the split.**
  - **Arabic/RTL** — **owed, still blocked.** `/ar/…` and the shell's `ع` toggle
    both leave `lang="en"`. The CSS is logical-property-only with no `[dir]`
    override, and `actions` parity is 44/44 with no Latin-only Arabic value.
  - **dark** — verified on the route. **Light theme owed.**
  - **reduced motion / greyscale** — no new animation; state is text plus shape.
- **Fixed:** the required marker is no longer a `*` glyph inside translated copy.

## Verification

- [x] `npx tsc --noEmit` — clean
- [ ] `npm run lint` — script does not exist (parked since T-053)
- [x] `gates:typography` — PASSED, 851 known, **none new**
- [ ] `npm run gates` — `check:design-system-v5` fails on 78 pre-existing findings,
      none in a file this task touched (parked since T-057)
- [ ] `npm run test:e2e` — **cannot run here; Playwright browsers are not
      installed on this workstation.**
- [ ] Definition of Done — not fully ticked: e2e, axe, Arabic, light theme, 320px.

**Verified on the live route** (`natives: 0`, `dateInputs: 0`): both triggers
`aria-required`, hidden `reason_key` and `inspector_id` present in the form
payload, rows aligned at 507/501, title and description split, blocked row reduced
to pill + one sentence, empty listbox rendering *No options are configured* as a
disabled option, page overflow 0.

**Not verified — and this is the real risk of the task.** Three e2e interactions
were rewritten because `selectOption()` only drives a native `<select>`:
`cd-027:253` and `reusable-inspector-concurrent-scheduling.spec.ts:229,253`. They
now click the trigger and pick the row by label, with the reassign helper reading
the **same roster RPC the page reads** so spec and UI cannot disagree about the
name. Two `form >> button` selectors were also narrowed to `button[type=submit]`,
because the form now contains the listbox trigger button as well and the old
locator would raise a strict-mode violation. **None of this has been executed.**

## Retirement

`ActionBar.tsx` deleted outright (zero importers after the route was re-pointed,
and its one source-text reader was re-pointed first). No `@retiring` banner was
needed because nothing else referenced it.

## Parked

- **`components/saqeel/inputs/` is a dead parallel input layer** — 8 of 9 files at
  zero importers, with names that collide with the live components. Copied to the
  tracker with the full finding.
- **`DateRangePicker.DEFAULT_STRINGS` is English copy inside a primitive**, and it
  is what `shell-scope-controls` renders today.
- The `actions.ts` hardcoded-English copy remains parked from T-082, and this task
  increases its impact.

## Blocked / open questions

- **The three rewritten e2e interactions need a run before this is trustworthy.**
  That needs `npx playwright install` and the seeded personas.
- `visit-actions/` sits at the 12-file directory cap. The next transition form
  requires regrouping, not another file.
- The locale toggle still does not switch the app, which blocks every Arabic pass.

## Proposed commit

```
feat(visits): move visit actions onto saqeel controls and split the card
```

## Next

Install the Playwright browsers and run `cd-027` plus
`reusable-inspector-concurrent-scheduling` — those three interactions are the only
unproven part of this change.
