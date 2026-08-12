# 2026-08-12 · T-096 — `/planning/immediate`: one rule said three times, and a loading state that mirrored nothing

`task: T-096` · `status: partial — content verified in the DOM, layout geometry and axe unmeasured` · `duration: 2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-006 §4, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014`

---

## Goal

Owner-reported: the top of the screen is cluttered and confusing, there is too
much empty space, and the legacy loading state must go for a skeleton that
mirrors the layout and is inset like the page.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/planning/immediate/ImmediateForm.tsx` | rebuilt | 198 → 148 |
| `app/(app)/planning/immediate/page.tsx` | edited | 35 → 30 |
| `app/(app)/planning/immediate/loading.tsx` | rebuilt | 8 → 14 |
| `app/(app)/planning/immediate/immediate-form.module.css` | edited | 21 → 27 |
| `features/planning-immediate/protections.ts` | rebuilt | 137 → 64 |
| `features/planning-immediate/strings.ts` | rebuilt | 197 → 20 |
| `components/sections/planning-immediate/dispatch-protections/dispatch-protections.tsx` | rebuilt | 97 → 76 |
| `components/sections/planning-immediate/dispatch-protections/dispatch-protections.module.css` | rebuilt | 63 → 60 |
| `components/sections/planning-immediate/identity-section/identity-section.tsx` | edited | 146 → 124 |
| `components/sections/planning-immediate/identity-section/identity-section.module.css` | **deleted** | 12 → 0 |
| `components/sections/planning-immediate/location-dispatch/location-dispatch.tsx` | edited | 187 → 184 |
| `components/sections/planning-immediate/dispatch-checklist/dispatch-checklist.tsx` | **created** | 0 → 47 |
| `components/sections/planning-immediate/dispatch-checklist/dispatch-checklist.module.css` | **created** | 0 → 7 |
| `components/sections/planning-immediate/location-dispatch/location-dispatch.module.css` | edited | 37 → 19 |
| `components/sections/planning-immediate/immediate-form-skeleton/immediate-form-skeleton.tsx` | **created** | 0 → 135 |
| `components/sections/planning-immediate/immediate-form-skeleton/immediate-form-skeleton.module.css` | **created** | 0 → 71 |
| `i18n/locales/en/planning.json` | edited | 1187 → 1073 |
| `i18n/locales/ar/planning.json` | edited | 1187 → 1073 |
| `e2e/cd-023-immediate-authority-bar.spec.ts` | re-pointed | 5 assertions |

## Decisions

**The screenshot the owner attached was `/planning/bulk`; the route named was
`/planning/immediate`.** Worked the route that was named — the loading-state
complaint is only true of `immediate` (`bulk` moved off `RouteLoading` in
T-046), which confirms the naming rather than the image.

**The registered-factory rule now has exactly one home, and it is the identity
card — not the top of the page.** `identity.r05Body` was rendering **verbatim
twice** (`ImmediateForm:145` warning notice and `identity-section:51`
`CardHeader description`) and the same fact a third time as the disabled radio's
`lockedType` description. The notice survived and **moved inside the card, above
the search field it governs**; the card description and the radio are gone. A
governance statement belongs on the control it governs, not above the fold.

**The identity mode radio group was deleted, and the server action is why that
is safe.** `manualAvailable = false` was a literal, one radio was `checked` with
a no-op `onChange` and the other permanently `disabled` — a control that cannot
be operated. `actions.ts` **never reads `identity_mode`**, checked before the
edit, so nothing submitted changes. `identity.heading` had also been rendering
twice inside one card (title + `<legend>`); the legend went with the fieldset.

**`DispatchProtections` is a readiness strip, not a chip grid, and the shape was
borrowed rather than invented.** `planning-bulk/review-readiness` already
established it: one summary pill, **blockers only**, each row focusing its own
control. The old card rendered **9 chips and then re-listed every blocking chip
verbatim in a notice below them** — 3–4 facts twice inside one card on first
load. **Four of the nine chips were hardcoded `state: "informational"`** and
could never change; two of those (`AUDIT`, `NOTIFY`) had `controlId: null`, so
they were policy statements wearing status pills.

**Nothing was removed that is not still on screen.** `AUDIT` → `consequences.audit`.
`NOTIFY` → `consequences.notify`. `CHECKLIST` → `dispatch.packageOptionalHint`
on the field itself — and the chip **contradicted** it, saying *"Select an active
inspection checklist"* while the field says optional. `INSPECTOR` →
`dispatch.autoAssign` on the control. `AUTHORIZED` is tautological on a screen
guarded by `planning_access_class()`: if you can see it you are Planner or
Supervisor, and `ImmediateAccessState` says so when you are not.

**`protections.detail.notifyDetail` ("Queued — awaiting delivery confirmation")
was deleted rather than relocated, and that is a small correction, not just a
tidy-up** — it asserts a post-submission delivery state on a form that has not
been submitted.

**The `WINDOW` blocker carries no focus target, deliberately.** Its `controlId`
was `imm-window-start`, an id **that has never existed in the DOM** —
`DateRangePicker` takes no `id` prop, so `getElementById` has always returned
null there. As a chip that was an invisible no-op; as a readiness row it would be
a visibly dead button. Set to `null` so the row renders as plain text.
**Raised, not filled:** `DateRangePicker` needs an `id` prop, which is a
design-system change (WEB-002 §2).

**Zero new i18n keys.** The row's accessible name is still assembled from
translated parts (`name — blocking — detail`), which is what the chip did, so the
spec's regexes keep working and no new copy needed an Arabic review.

**The empty space was the grid, not the spacing.** `.columns` was
`repeat(auto-fit, minmax(24rem, 1fr))` over **three** children of very unequal
height — Identity (tall), Urgency (4 radios), Location (map + 6 fields) — so at
two columns the flow was `[Identity | Urgency]` then `[Location | ∅]`: a void
under Urgency and a whole empty column beside Location. Identity and Urgency now
share one `.column` (who + why), Location takes the other (where + when). Two
children of comparable height, **no new token, no media query**.

**The skeleton is inset by the route frame, not by its own declaration.**
`loading.tsx` renders inside `<Shell>` with the page title, so the bones sit in
the same `.sq-content` box the loaded page uses — measured **1017px wide with
20px inline padding on both sides**. This is T-089's rule applied: a skeleton
outside its page's frame cannot match it however well its bones are sized.

## Round 2 — the first fix was not enough, and measuring said why

Owner re-reported empty space on the rendered screen. **Measured at 1280px
(977px content) rather than argued:**

```
left column      712px      (Identity 420 + Urgency 244)
right column   1,492px      LocationDispatch
VOID UNDER LEFT  780px
inspection checklist  595px at 423px wide — 10 options, one per row
protections card      346px for four short rows
form total          2,311px
```

**One block was 40% of the taller column.** The checklist renders 10 packages at
`minmax(18rem, 1fr)`; inside a 423px column that grid resolves to **one** track,
so ten options stacked. Balancing two columns was never going to fix a card
carrying a block that wants to be wide.

**It moved out to its own full-width card below both columns**, where the same
grid resolves to 3–5 tracks. Extracted to
`planning-immediate/dispatch-checklist/`, taking `dispatch.packageLabel` as its
`CardHeader` title and `packageOptionalHint` as the description — both keys it
already rendered as a `<legend>` and a hint. **Zero new copy.** The `<fieldset>`
went with it: the card section is the group, so the options carry
`role="radiogroup" aria-labelledby` pointing at the card title instead of a
legend that would have restated it — the same duplicate-name defect this task
removed from the identity card.

**`packageId` left `DispatchValue` entirely.** `LocationDispatch` no longer owns
it, so keeping it in the shared value object would have been a prop that lies.
`catalogue: {packages, inspectors}` collapsed to `inspectors`.

**The readiness rows went back to a grid.** Making them a vertical list cost 346px
for four items with ~30 characters each. `repeat(auto-fit, minmax(14rem, 1fr))` —
the track the deleted chip grid used — puts all four on one row at 977px.

## Round 3 — the columns cannot be balanced by content, so they are balanced by the grid

Owner: *"make sure the first side is the same height"*. Round 2 closed 780px of
void down to ~140px; the residue is not a bug to find, it is arithmetic —
Identity (4 controls) plus Urgency (4 options) is simply less than Location plus
six dispatch fields, and every redistribution tried on paper just moved the void
to the other column.

**So the row balances the columns, not the content.** `.columns` went
`align-items: start` → `stretch`, and `.column > :last-child { flex-grow: 1 }`
lets the last card absorb the difference. `flex-grow` alone, **not `flex: 1`** —
`flex: 1` sets `flex-basis: 0`, which would make the card's height depend on free
space that the grid row is itself sizing from the card. That circularity
collapses the card when the left column is the taller one.

**The urgency options became a vertical list, which is both the better control
and part of the fix.** Four options spread across an 865px row is a sparse row of
a *required* single-select; stacked, it is the conventional scannable form
pattern, it fills 130px instead of 55px, and it leaves the stretch far less work
to do. `align-content: center` holds the group in the card's optical middle
rather than pinning it to the top of a grown box.

**Measured, seeded Planner, Arabic, 1280px viewport / 977px content:**

```
                        before        after
left column              712px        909px
right column           1,492px        909px
VOID UNDER LEFT          780px           0
protections card          346px        197px
inspection checklist  595px @ 465 wide   352px @ 977 wide (out of the column)
form total             2,311px      1,993px
```

**Both columns land on 909px exactly.** The before column is English and the
after is Arabic — Arabic runs `line-height: 1.8` against 1.6 — so **the total
height delta is indicative, not exact**. The void figure is structural and holds
in both.

**Arabic and RTL are no longer owed.** `lang="ar"`, `dir="rtl"`, **no horizontal
page overflow**, and the only four elements whose `scrollWidth` exceeds their
`clientWidth` are a decorative `ping-dot`, the `sqx-visually-hidden` live region
(clipped by design) and two Mapbox attribution controls. **No content clipping.**

## Inventory taken before writing code

**State (WEB-004 §1).** 27 `useState` → 14. Fifteen were declared and never
rendered: `enforcementAction`, `enforcementNotes`, `manualName`, `manualCr`,
`manualLicense`, `manualActivity`, `manualRegion`, `manualCity`,
`manualReasonKey`, `manualReasonComment`, `notifyFactory`, `factoryMobile`,
`notFoundConfirmed`, `mode`, plus the derived `manualCityOptions`,
`selectedType`, `packageOk`, `inspectorOk`, `immediateExecutable`.

**Effects.** 2 → 1. The survivor is `crypto.randomUUID()` on mount (external
synchronisation). The other reset `mode` when `manualAvailable` changed —
both were constants, so it could never fire.

**Comments.** 9 → 0 across the touched app files (6 in `ImmediateForm.tsx`,
3 in `RouteLoading.tsx`, now off this route).

**Literals.** No hex, px or font declaration added; every value is an existing
`--sqx-*`. No token added.

**`<svg>`.** None added. The legacy `glyph="◫"` left with `RouteLoading`.

**Accessibility failures found in existing markup:**
- `RouteLoading` rendered `<main className="sq-content">` **inside**
  `ShellClient`'s `<main id="main-content">` — two `main` landmarks. Now **1**,
  verified in the DOM.
- The identity `<legend>` duplicated the section's own accessible name.
- The loading state carried no page head, so the title appeared after load.

## Numbers

```
Route: /planning/immediate

duplicated leaf text strings in the form   n → 0        (measured in the DOM)
statements of the registered-factory rule  3 → 1
renderings of identity.heading             2 → 1
renderings of location.sourceNone          3 → 1
protection chips                           9 → 4 blocker rows, none repeated
blockers re-listed below their own chips   3–4 → 0
inoperable controls above the first field  2 → 0
blocks before the first usable control    13 → 8

<main> landmarks on the loading state      2 → 1
loading state                              centred EmptyState → skeleton mirroring the layout
skeleton inline padding                    20px / 20px, from .sq-content (route frame)

useState                                  27 → 14      useEffect 2 → 1
comments in touched app files              9 → 0
locale keys (planning.json, per locale)  997 → 940      parity asserted, 940 = 940
source lines removed (net, app code)      ~240
files deleted                                1 (identity-section.module.css)

typography gate                          734 → 734      none new, none removed; this task owed none
```

## Accessibility

- **axe: not run.** The pane is displayed only intermittently; every time it goes
  hidden the route stalls in its Suspense boundary. **Owed.**
- Manual checklist (WEB-003 §10): **Arabic/RTL passed** (see Round 3 — `dir=rtl`,
  no horizontal overflow, no content clipping). keyboard · screen reader · 200%
  zoom · 320px · dark · reduced motion · greyscale — **still owed**.
- **Verified in the DOM as a seeded Planner:** exactly **1 `<main>`**; the
  protections card is a labelled `region` announcing four blockers once each;
  `input[type=radio][name=identity_mode]` count **0**; **zero duplicated leaf
  text strings** anywhere in the form.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **no such script** in `apps/web` or the root; `gates` is
      the lint equivalent here
- [x] `npm run gates` — no finding on this route (the reported findings are
      pre-existing, on `/planning/supervision`, `/visits`, `admin/*`)
- [x] `npm run gates:typography` — **PASSED, 734, none new**
- [ ] `npm run test:e2e` — needs a production build and live REST; **owed**
- [ ] Definition of Done (WEB-006 §5) — not fully ticked; see Blocked

## Retirement

`RouteLoading` is **off this route**. It is not retired: **~25 other segments
still import it**, each carrying the same five defects (hardcoded `en`/`ar`
literals, the `locale === "ar"` ternary, the nested `<main>`, `glyph="◫"`,
`t-caption` at 11.5px). Parked as its own task.

`identity-section.module.css` **deleted** — both its classes (`.modes`,
`.legend`) belonged to the removed fieldset and it had no other consumer.

## Parked

- **Retire `RouteLoading` app-wide** (~25 segments). Five rule violations each,
  including a nested `<main>` on every one of them.
- **`DateRangePicker` has no `id` prop**, so no protection, label or spec can
  address the window control. Second component to hit this (T-080 raised the
  same shape on `Select`).
- **`cd-023-immediate-authority-bar.spec.ts` was already broken before this
  task** and most of it still is — `#imm-window-start` / `#imm-window-end`
  `.fill()` target ids that do not exist; `#imm-existing` and `#imm-visit-type`
  are driven with `selectOption` and `option` enumeration against a
  `SaqeelSelect` listbox; `"Complaint received"` is matched as a `button` when
  it is a `Choice` radio. **Five of these predate this diff and were not
  repaired** — repairing them needs a suite run to confirm, which needs a
  production build. Same class as T-078.
- **`ImmediateForm.tsx` is client code inside a route directory** (WEB-000 §3
  wants it under `components/sections/`). Pre-existing; a move, not a fix.

## Blocked / open questions

**The Browser pane is not displayed**, so the route never reveals out of its
Suspense boundary (`document.visibilityState === "hidden"`; the fully rendered
form sits in React's hidden staging `<div>` and every `getBoundingClientRect`
returns 0). Content was verified from that staged tree; **geometry was not**.
Owed once the pane is shown:

- the skeleton rendered at its own boundary — what is currently visible on a
  cold navigation is `PlanningSkeleton` from the **parent** `/planning`
  boundary ("Loading visit planning", 122 bones), not this route's skeleton.
  **Whether `/planning/loading.tsx` masks every nested route's skeleton is an
  open question and may be a defect wider than this task.**
- axe, the manual checklist, and the Arabic render

## Proposed commit

```
refactor(planning): declutter the urgent-visit form and its loading state
```

## Next

Display the Browser pane, sign in as Planner, and complete the owed
measurements: layout geometry, the skeleton at its own boundary, axe, and the
Arabic render. Then decide the `/planning/loading.tsx` masking question.
