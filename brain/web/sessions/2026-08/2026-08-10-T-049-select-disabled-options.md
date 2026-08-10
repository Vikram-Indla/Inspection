# 2026-08-10 · T-049 — disabled options in `Select`

`task: T-049` · `status: done (not verified in a browser)` · `duration: 40m`
`rules applied: WEB-000, WEB-002 §2, WEB-003, WEB-004`

---

## Goal

Let `SaqeelSelect` express "offered but not choosable", which the criteria
builder needs and which blocked T-050.

## What changed

| File | Action |
| --- | --- |
| `components/saqeel/select/select.tsx` | modified — `disabled?`, `note?` on `SelectOption`; nav skips |
| `components/saqeel/menu-surface/menu-row.tsx` | modified — `disabled?`, `note?` |
| `components/saqeel/menu-surface/menu-surface.module.css` | modified — `[data-disabled]`, `.note` |

## Decisions

**Raised as a gap first, built only after an owner ruling.** WEB-002 §2 forbids
filling a primitive gap inline; T-050's inventory stopped on this and on the
missing combobox. The owner ruled on `disabled`; the combobox is still open.

**Why the option must stay visible.** `/planning/bulk` deliberately lists
criteria fields the dataset does **not** supply, tagged *Not available* with the
recorded reason (PLN-CON-019), so a planner learns why they cannot target on
something. Hiding them would turn "recorded but unavailable" into "never
offered" — two different facts. So the row dims to `--sqx-text-muted`, **not**
the disabled palette, and keeps its `note`.

**Disabled has to mean disabled on every path in, not just click.** A flag that
only guards `onClick` leaves a row reachable by keyboard that then refuses to
activate — worse than not offering it. So:

- `commit()` refuses a disabled index (blocks Enter/Space)
- `step()` walks over disabled rows for ArrowUp/ArrowDown
- `edge()` does the same for Home/End
- `typeAhead()` will not match a disabled label
- `open()` lands on the first **enabled** row when nothing is selected

**`:hover` scoped to `:not([data-disabled])`** so a later rule cannot re-light a
disabled row — the same equal-specificity trap recorded in T-048.

## Inventory taken before writing code

`SelectOption` was `{ value, label, count? }`. No SAQEEL combobox exists
(`saqeel/inputs/Combobox.tsx` is a pre-SAQEEL primitive). `SegmentedControl`
exists and suits two-choice cases.

## Numbers

```
Select    +2 optional props, 5 interaction paths guarded
call sites broken   0 (both props optional)
```

## Accessibility

`aria-disabled` on the row (not the `disabled` attribute, so it stays in the
listbox and stays announced); the check mark is hidden; the reason is rendered
as text beside the label rather than as a title attribute.

## Verification

- [x] `npm run typecheck` — clean
- [x] tokens confirmed present
- [ ] keyboard pass over a list containing disabled rows — **owed**, this is the
      part most likely to be subtly wrong

## Retirement

Nothing marked.

## Parked

- **A disabled *and* selected row still shows its check**, because
  `.row[aria-selected="true"] .check` and `.row[data-disabled] .check` tie on
  specificity and the former is later. Defensible (it is the current value), but
  it is chance, not choice.
- **There is still no SAQEEL combobox** — free text plus suggestions. This is
  the one gap left on the criteria builder.

## Blocked / open questions

Combobox: build `saqeel/combobox`, or accept `SaqeelSelect` for `is`/`is-not`
and a plain `TextInput` for `in` (what T-050 shipped).

## Proposed commit

```
feat(saqeel): support disabled options in Select
```

## Next

T-050 — the criteria builder.
