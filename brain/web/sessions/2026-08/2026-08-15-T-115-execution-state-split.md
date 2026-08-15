# 2026-08-15 · T-115 — Two of the four remaining dashboard sections earned a chart; two did not

`task: T-115` · `status: partial — code complete, axe clean, gates green; e2e and a native Arabic review owed` · `duration: ~1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-011, WEB-013, WEB-014`

---

## Goal

Owner asked whether **Today's operations**, **Execution status**, **Approvals**
and **High-priority visits pending execution** could become charts. Judge each
against its data rather than assuming yes or no.

## The verdict, section by section

| Section | Current value | Verdict | Reasoning |
| --- | --- | --- | --- |
| **Execution status** | Active 9 · Overdue 10 | **Chart — built** | `activeField` collapses **three governed states into one number**. Split now renders: executing 4 · on the way 4 · arrived 1. |
| **Today's operations** | Planned 0 · Completion *Unavailable* | **Chart — built, self-gated** | `todayVisits` carries `operational_state`, so the same split applies. Zero visits today, so it renders nothing. |
| **Approvals** | Awaiting 0 · Returned 0 | **Declined** | Both zero. The honest chart here is the **decision mix** (approved / returned / rejected — exactly three, the palette fit), and `decidedScoped` is also 0 in this scope. |
| **High-priority pending** | 1 | **Declined** | `priority` splits high/critical — a two-way split of **one row** is a single bar. |

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/dashboard/operational-groups/operational-groups.tsx` | created (extracted) | — → 117 |
| `components/dashboard/operational-view/operational-view.tsx` | slimmed | 193 → 129 |
| `features/dashboard/strip.ts` | `stateSlices` added | 161 → 185 |
| `app/(app)/dashboard/metrics.ts` | exposes `activeFieldRows` | 3 lines |
| `components/dashboard/pipeline-breakdown/pipeline-breakdown.tsx` | empty strings optional | 64 → 66 |
| `i18n/locales/{en,ar}/dashboard.json` | +8 keys each | — |

## Decisions

**`activeField` was a `.length` with the array thrown away.** `metrics.ts`
computed the filtered rows, took the count, and discarded the rest — so the three
states behind "9" were never reachable. Exposing `activeFieldRows` alongside the
count is three lines and no new query.

**The breakdown sits *inside* its section, not after it.** The owner named four
sections; a chart in a separate card below would not answer "transform this
section". It renders in the same `Card`, under an `h3 subheading` — "a named
group inside a card" (WEB-014 §2) — with the heading outline verified: **0
skipped levels**.

**`stateSlices` returns `[]` below two distinct states, and the caller drops the
chart entirely.** One bar restates the tile that already shows the number; no
bars reads as broken rather than empty. This is why Today's operations renders no
chart at all today rather than an empty plot — the same gate `OperationsStates`
uses (T-113), now shared.

**Adding to `operational-view` would have breached the 200-line budget** (it hit
**224**). Extracted the four group cards to `operational-groups`, which is where
they belonged anyway — the file was building view models and rendering them.
Result: **129 + 117**, both comfortably inside budget.

**Approvals was declined on data, not on principle.** The decision mix is a good
chart and remains the strongest unbuilt candidate on this screen; it is parked
rather than refused.

## Numbers

```
Execution status   "9"  →  executing 4 · on the way 4 · arrived 1
Today's operations  0 visits today → chart self-gated, renders nothing
operational-view   193 → 129 lines   (+ operational-groups 117)
```

## Accessibility

- **axe: 0 violations, 0 incomplete** — operational view, dark, RTL.
- Heading outline: **0 skipped levels**; `<main>` landmarks **1**.
- RTL measured on the new chart: all three labels end at **168–169** against bars
  starting at **176** — clear, inheriting T-112's `direction: ltr` fix.
- Digits Arabic-Indic (`٤ · ٤ · ١ · ٩`), enum labels resolved through
  `visits.enum` (`قيد التنفيذ · في الطريق · وصل`) — no new enum keys needed.

## Verification

- [x] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — script does not exist
- [x] `npm run gates` — 77 v5 findings, unchanged. The one finding in a file this
      task touched (`metrics.ts:149`, `utc-slice-date-format`) is **pre-existing**:
      the diff touches lines 343, 345 and 502 only.
- [ ] `npm run test:e2e` — not run

## Parked

- **Approvals decision mix** — approved / returned / rejected over one
  denominator, exactly three categories. Build when the scope holds decisions.
- **Overdue by age** was considered and **rejected on principle**: bucket
  boundaries ("1–3 days", "4–7") would read as an SLA banding, and the governed
  one is `slaWarnAtFraction`. Inventing bands is WEB-008 §2.
- **High-priority by priority level** — honest when the list is populated.

## Proposed commit

```
feat(dashboard): split active inspections by state inside execution status
```

## Next

Approvals decision mix once the scope holds decided reviews. Tracker T-116.
