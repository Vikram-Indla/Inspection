# 2026-08-11 · T-056 — `/planning/single` first-run state

`task: T-056` · `status: partial (not verified in a browser)` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-008, WEB-009, WEB-011, WEB-013`

---

## Goal

The empty screen showed one search card and a raised bar holding two permanently
disabled buttons. Remove the dead action bar, give the first run a label and a
next step, and stop two steps both calling themselves "2 ·".

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/sections/planning-single/single-visit-screen/single-visit-screen.tsx` | rebuilt composition — search out of the form, actions gated on a target | 249 → 256 |
| `components/sections/planning-single/single-visit-screen/publish-actions.tsx` | permission notice moved out, `hasTarget` prop deleted | 57 → 60 |
| `components/sections/planning-single/single-visit-screen/factory-search.tsx` | step eyebrow, new strings contract | 70 → 76 |
| `components/sections/planning-single/single-visit-screen/configuration-card.tsx` | step eyebrow | 48 → 53 |
| `components/sections/planning-single/factory-results/factory-results.tsx` | `Field` + visible label, guidance empty state | 137 → 150 |
| `components/sections/planning-single/portfolio-picker/portfolio-picker.tsx` | step eyebrow | 88 → 93 |
| `components/sections/planning-single/target-confirmation/target-confirmation.tsx` | step eyebrows (2 and 3) | 133 → 135 |
| `components/sections/planning-single/single-visit-skeleton/single-visit-skeleton.tsx` | trimmed to the real first paint | 59 → 26 |
| `components/sections/planning-single/single-visit-skeleton/single-visit-skeleton.module.css` | dead rules deleted | 40 → 21 |
| `components/sections/planning-single/single-visit-screen/single-visit-screen.module.css` | `.screen` added beside `.form` | 33 → 37 |
| `features/planning-single/strings.ts` | takes `locale`, reads 10 keys from JSON, `stepLabels` added | 254 → 275 |
| `app/(app)/planning/single/page.tsx` | passes `locale` | 28 → 28 |
| `app/(app)/planning/single/loading.tsx` | passes `locale` | 16 → 16 |
| `i18n/locales/en/planning.json` | 10 keys under `single` | 1188 → 1198 |
| `i18n/locales/ar/planning.json` | same tree, written Arabic | 1188 → 1198 |

## Decisions

**The action bar renders only when a target exists.** Two disabled buttons on an
empty screen state the opposite of the truth — nothing has been entered, so
there is nothing to save and nothing to submit — and a disabled control leaves
the tab order, so a keyboard user cannot even reach the thing that would explain
itself. `PublishReadiness` and `PublishBlockers` were already gated this way; the
bar was the outlier.

**Removing that button re-arms implicit form submission, so the search moved out
of the form.** Per the HTML spec a form with no submit button submits on Enter
when exactly one field blocks implicit submission — and in the empty state the
search box is that one field. The disabled button had been suppressing it by
accident. `FactorySearch` and `PortfolioPicker` now sit outside `<form>`, which
also matches what they are: selection, not submission. The published target has
always been built from `TargetFields`' hidden inputs, never read back out of the
radios (`target.ts` says so explicitly), so nothing the action reads moved.
**Cost, taken with an owner ruling:** `actions.ts` falls back to the `factory_id`
radio when `target_factory_id` is empty, and that fallback — documented as
backward compatibility for an older rendered form — is now unreachable. The
`license_number` radio and the `location_confirmed` checkbox stay inside the
form, because the action genuinely reads them.

**The permission blocker moved above the search.** It lived inside
`PublishActions`; gating that component on a target would have hidden it until
after a factory was chosen. A planner without `planning.submit_for_supervision`
should learn that before doing the work, not after.

**Step numbers left the copy and became structure.** `portfolioStep` was
"2 · Select the Industrial License / plant" and `licenseStep` was
"2 · Industrial License" — two different steps, both numbered 2, in both
locales. They are the same step on two paths (canonical portfolio pick vs legacy
licence confirm), so both now carry `Step 2 of 4` in a `CardHeader` eyebrow and
the translated string holds only the name. The selected-profile card keeps its
own eyebrow and is deliberately not numbered: it is a confirmation, not a step.

**The search input got a visible label.** `TextInput`'s `label` writes
`aria-label` only, and it was being passed the same string as the section
heading, which the placeholder then restated a third time. `TextInput`'s own
TSDoc says a control inside a form belongs in `Field`. The placeholder is now one
example identifier and the field label names the identifier set.

**The minimum-length hint went into the guidance empty state, not `Field`'s
hint.** `Field` renders its hint as an unassociated `<p>` — there is no id to
point `aria-describedby` at — and giving it one is a design-system change
requiring an owner ruling (WEB-002 §2). Putting the sentence in the `EmptyState`
description keeps it in one place, associated with nothing it should not be, and
it disappears the moment a search starts.

**The skeleton was trimmed rather than left promising three cards.** It drew a
search card, a configuration card and a readiness card; the real first paint is
one card. That drift predates this task but this task made it visible, so the
skeleton now mirrors what actually renders.

## Inventory taken before writing code

- **State:** no rung changed. The screen's 14 `useState` and 2 `useEffect` were
  read and left alone — the debounced search effect is external synchronisation
  (URL), the error-focus effect is a focus call. Neither is in scope here.
- **Literals:** 10 new strings, all into `planning.single` in `en` and `ar`.
  4 step strings lost their numeric prefixes. No new `t(key, "English")`.
- **`<svg>`:** none. The guidance state uses the registry's `search` icon.
- **Accessibility failures found:** search input named twice (heading +
  `aria-label`) with no visible label; two disabled buttons with no
  `aria-describedby` and no keyboard reachability; no first-run instruction;
  duplicate step number.
- **Not fixed, deliberately:** `portfolio-picker.tsx:53` puts `role="listbox"` on
  a `<ul>` of `<li>` radios — invalid ARIA child structure. Not part of this
  screen state; parked.

## Numbers

```
Route: /planning/single
first-load JS   ___ KB → ___ KB    (measurement request — WEB-005 §8)
route CSS       ___ KB → ___ KB    (measurement request)
LCP / INP / CLS ___    → ___       (measurement request)
client islands  5      → 5         (unchanged; form boundary moved, not the islands)
legacy CSS deleted: 0 lines
source lines removed: 52 (skeleton 33 tsx + 19 css)
```

Perf numbers need a production compile, which agents do not run (CLAUDE.md).

## Accessibility

- axe: **not run** — no dev server was started (the owner's server holds
  `apps/web/.next` and the tracker's standing note forbids a second one).
- Manual checklist (WEB-003 §10): **not performed** — same reason.
- Fixed by construction: the search field now has a visible `<label>` bound with
  `htmlFor`/`id` and is named once; the first-run state announces what to enter
  and what follows; no permanently disabled control is rendered.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **the script does not exist in `apps/web/package.json`**
- [ ] `npm run gates` — **the script does not exist**
- [ ] `npm run test:e2e` — not run
- [ ] Definition of Done (WEB-006 §5) — browser, axe and Arabic passes owed

Manual gate greps run instead: zero comments in every touched `.tsx`, zero
literal visual values in both touched CSS modules, en/ar key parity under
`planning.single` asserted (11 = 11), no new `t(key, "English")` in the diff.

## Retirement

Nothing marked, nothing deleted. `FactoryResultsStrings` lost `heading`, which
was passed by the only call site and never read.

## Parked

- `single-visit-screen.tsx` is **256 lines against a 200-line cap** (it was 249
  before this task). Extracting the notice stack moves ~10 lines and does not
  clear it; the real fix is splitting the screen, which is its own task.
- `portfolio-picker.tsx:53` — `role="listbox"` on a `<ul>` whose children are
  `<li>` radios. Invalid ARIA child structure.
- The screen's remaining ~110 strings are still `t(key, "English")` reading
  Arabic from the `ui_strings` table, and `plan.single.searching` still has no
  Arabic row (owed since T-045). Migrating them to `planning.single` is a
  screen-sized task, not a rider on this one (WEB-013 §5).

## Blocked / open questions

- **10 newly authored Arabic strings need a native review**, in particular
  `configStep` ("التهيئة والاقتراح") and `searchPromptBody`.
- Whether the unreachable `factory_id` fallback in `actions.ts` should now be
  deleted outright or left as dead defence.

## Proposed commit

```
fix(planning): drop the dead publish bar from the single-visit first run
```

## Next

Load `/planning/single` as a planner: confirm Enter in the search box does
nothing, confirm the bar appears only once a factory is selected, then the
Arabic and axe passes.
