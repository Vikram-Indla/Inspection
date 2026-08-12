# 2026-08-12 · T-098 — the calendar stops being 42 boxes, and the enum stops reaching the screen

`task: T-098` · `status: partial — verified in Arabic; English render, axe and the rest of the checklist owed` · `duration: 1h`
`rules applied: WEB-000, WEB-002 §5 §6, WEB-003, WEB-008, WEB-009, WEB-011, WEB-013`

---

## Goal

Owner-reported: month and week read as detached boxes rather than a grid, and
raw values like `pending_supervision` render as labels.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `i18n/enum-label.ts` | **created** | 0 → 16 |
| `i18n/locales/en/visits.json` | edited | +22 keys |
| `i18n/locales/ar/visits.json` | edited | +22 keys |
| `components/sections/visits/visit-calendar/visit-calendar-month.module.css` | rebuilt | 54 → 54 |
| `components/sections/visits/visit-calendar/visit-calendar-week.module.css` | rebuilt | 32 → 36 |
| `components/sections/visits/visit-calendar/visit-calendar-month.tsx` | edited | 2 roles |
| `components/sections/visits/visit-calendar/visit-calendar-week.tsx` | edited | 2 roles |
| `app/(app)/visits/calendar/CalendarView.tsx` | edited | 72 → 72 |
| `components/sections/visits/visit-management-screen/visit-management-screen.tsx` | edited | −1 |
| `app/(app)/visits/[id]/page.tsx` | edited | −1 |

## Decisions

**The rules are the container showing through 1px gaps, not borders on 42
cells.** The container paints `--sqx-border-subtle`, the cells paint
`--sqx-surface-default`, and a `gap: var(--sqx-border-width-hair)` between them
*is* the rule. Every row is the same `repeat(7, minmax(0, 1fr))`, so the vertical
gaps align across all six rows into continuous columns, and the flex gap between
rows into continuous rows. **No `:first-child` exceptions, no double borders, and
no physical direction anywhere** — which is what makes it correct in RTL by
construction rather than by an override (WEB-002 §6).

**This is not a new visual idea — it is the calendar catching up with
`DataTable`.** That component already collapses its borders, already puts its
header on a `--sqx-surface-header` band, and its own source argues the case:
square corners on purpose, because *"rounding it would read as a floating chip
rather than a header rule."* The calendar was the one tabular surface in the app
that never got the treatment.

**Today had to change signal, and that is a consequence of the fix, not a
preference.** It was marked *only* by `border-color: var(--sqx-border-focus)`;
once cells own no border there is nothing to colour. It is now filled with
`--sqx-surface-accent` — the same token `DataTable` gives a selected row — so the
marker is reused rather than invented.

**`role="grid"` was a promise the markup did not keep.** The ARIA grid pattern
implies arrow-key cell navigation; no cell was focusable and there was no roving
`tabindex`. Same class as the malformed `role="tree"` T-094 removed from
`/planning/bulk`. Now `table` / `row` / `columnheader` / `cell`, which describes
what is actually there and carries no interaction contract. **0 `role="grid"` or
`role="gridcell"` remain on the route**, verified in the DOM.

**The raw label was three different fallbacks in three adjacent lines.**
`CalendarView` read `t("enum.X", <fallback>)` with the raw value for
`planning_status` and `visit_type` and `.replaceAll("_", " ")` for
`operational_state`. Since `getDict()` returns `{}` (T-086), **the fallback is
the rendered string** — which is why every pill was lowercase, not just the
underscored one.

**Labels now come from the locale JSON, per owner instruction, not from the
`ui_strings` dictionary.** `visits.json` gained an `enum` block in both locales —
**22 keys each, parity asserted 200 = 200** — covering the four domains at their
database definitions: `planning_status` (7, from `0001_foundation` plus the
`validated` and `pending_supervision` additions), `operational_state` (8, plus
`under_review` and `closed`), `execution_mode` (3), and the `visit_type`
reference values.

**The Arabic was harvested, not invented.** `operations.json` already ships
`onTheWay`/`arrived`/`executing`; `enforcement.json` and `approvals.json` already
ship `draft`, `published`, `returned`, `cancelled`, `submitted`, `under_review`,
`closed`; a DEC-L seed already ships `administrative` and
`administrative_enforcement`. Those strings were reused verbatim. **Planning and
operational states take feminine agreement** (الزيارة is feminine) — منشورة,
ملغاة, منتهية, مُعادة — while `execution_mode` stays masculine (نمط التنفيذ).
**The nine strings with no prior art need a native review**: مُدقَّقة, بانتظار
الإشراف, جديدة, مُجهَّزة, مُرسلة, دورية, متابعة, شكوى, منتهية.

**`humaniseEnum` is the fallback formatter, and it is a defect marker, not a
translation.** An unmapped value formats its identifier rather than translating
it; the TSDoc says so, so the next reader closes the gap by adding the key in
both locales instead of treating the fallback as copy.

**Three surfaces were wired, not one, because fixing only the calendar would
have created the inconsistency it was reported for.** The board
(`visit-management-screen`) and the detail route (`visits/[id]`) each carried
their own `t("enum.…")` closure; all three now call `makeEnumLabel(locale)`.
`sentenceCase` is the agreed casing and is already what `humaniseEnum` applies,
so the extra wrapper both call sites had is gone.

## Inventory taken before writing code

- **Four `enumLabel` implementations existed** and two disagreed:
  `operations/sections/labels.ts` and `visit-management-screen` used
  `sentenceCase`, `factories/[id]` uses `titleCase` → *"Pending Supervision"*.
  Owner ruled `sentenceCase`. **`factories/[id]` is not converted** — its
  `enumLabel` also covers risk bands and form statuses that are outside the
  `visits.enum` domain, so it needs its own namespace decision.
- Literals: no hex, px or font declaration added; every value an existing
  `--sqx-*`. **No token added.**
- Comments: none added to any `.css` or `.tsx`. The one TSDoc block is on
  `makeEnumLabel`'s public contract, matching `PlanningNotice`'s precedent.

## Numbers

```
Route: /planning/calendar  (measured live, seeded Planner, Arabic, ?view=month)

cells                             42        42
per-cell border               1px all      0px      ← the boxes are gone
per-cell radius        --sqx-radius-control  0px
grid frame                      none      1px + --sqx-radius-card (12px)
rules between cells         --sqx-space-1 gap    1px hairline, continuous
today marker              border-colour   --sqx-surface-accent fill
role="grid" / "gridcell"           2        0

status pills rendered   published · expired · pending_supervision · cancelled
                     →  منشورة · منتهية · بانتظار الإشراف · ملغاة
snake_case labels on screen        4        0
visits.json keys per locale      178      200   (parity 200 = 200)
enum surfaces on one source        0        3   (calendar, board, detail)
typography gate                  734      734   ← none new, none removed
```

## Accessibility

- **axe: not run.** The pane is displayed only intermittently. **Owed.**
- Manual checklist (WEB-003 §10): **Arabic/RTL passed** — `lang="ar"`,
  `dir="rtl"`, no horizontal page overflow, 42 cells and 25 chips rendered.
  keyboard · screen reader · 200% zoom · 320px · dark · reduced motion ·
  greyscale — **owed**.
- **Fixed:** `role="grid"` without keyboard navigation, on both views.
- **Status is still text plus shape** (WEB-002 §5) — the fill change is on the
  day cell, not on a status; every pill keeps its text label.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates` — no finding on this route
- [x] `npm run gates:typography` — **PASSED, 734, none new**
- [ ] `npm run test:e2e` — needs a production build; **owed**
- [ ] Definition of Done (WEB-006 §5) — not fully ticked; see Blocked

## Retirement

Nothing marked. Three `t("enum.…")` closures deleted at their call sites; the
legacy `t()` dictionary is untouched and still serves other surfaces.

## Parked

- **`factories/[id]` still uses `titleCase`**, so it renders *"Pending
  Supervision"* against the agreed *"Pending supervision"* everywhere else. It
  needs a namespace decision first — its enum domain is wider than `visits.enum`.
- **Two more local `enumLabel` implementations** remain
  (`admin/integrations/senai-data`, `admin/packages` inlines
  `.replace(/_/g, " ")`).
- **`visits.enum` is the wrong long-term home if other domains adopt it** — it is
  named for the namespace that owns visit lifecycle enums, not for enums at large.
- **The day number renders `Mono`.** `DataTable`'s house answer for numerals is
  `font-variant-numeric: tabular-nums` on ordinary text. Raised with the owner;
  **not changed** — it is a WEB-014 decision, not a layout one.
- **Uneven month row heights** are now much more visible with continuous rules.
  Normal for month calendars; flagged in case the owner wants them equalised.

## Blocked / open questions

- **Nine Arabic strings need a native review** (listed in Decisions). They follow
  house style and existing agreement patterns but have no prior art in the repo.
- **The English render was not captured.** The session locale is `ar` and
  navigating to `/en/…` does not flip the cookie-driven locale, so English was
  not observed. The Arabic result is the stronger proof — `بانتظار الإشراف`
  cannot come from `humaniseEnum`, so the JSON lookup is confirmed — but the
  English strings are asserted from the file, not seen.

## Proposed commit

```
refactor(visits): collapse the calendar grid and translate visit enums
```

## Next

Capture the English render and run axe on `/planning/calendar`, then take the
`factories/[id]` casing decision.
