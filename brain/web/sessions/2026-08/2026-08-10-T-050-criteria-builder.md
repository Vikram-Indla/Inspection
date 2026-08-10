# 2026-08-10 · T-050 — `/planning/bulk` criteria builder on SAQEEL

`task: T-050` · `status: done (not verified in a browser)` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-009, WEB-011`

---

## Goal

Convert `CriteriaBuilder.tsx` — the AND/OR targeting instrument — off native
controls and legacy classes entirely. Slice 1c of T-046.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/planning/bulk/CriteriaBuilder.tsx` | rebuilt | 302 → 360 |
| `app/(app)/planning/bulk/criteria-builder.module.css` | created | — → 104 |
| `app/(app)/planning/bulk/TargetingLensClient.tsx` | modified | +`locale` |
| `app/(app)/planning/bulk/page.tsx` | modified | +5 strings |

| Check | Before | After |
| --- | --- | --- |
| Native controls | 13 | **0** |
| Legacy classes | 24 | **0** |
| Inline `style={{}}` | 11 | **0** |
| Legacy tokens (`--space-*`, `--border-*`, `--action-*`) | 9 | **0** |
| Comments | 21 | **0** |

## Decisions

**ALL/ANY became a `SegmentedControl`, not a `Select`.** Two mutually exclusive
options that drive the meaning of the whole group should be visible at once; a
dropdown hid half the operator.

**`between` uses two `DatePicker`s for date fields.** Previously two native
`type="date"` inputs. The `a..b` serialisation is unchanged, so existing `ct`
URLs keep parsing.

**Unsupplied fields now use T-049's `disabled` + `note`.** This was the blocker:
the old `<option disabled>{label} · Not available</option>` had no SAQEEL
equivalent, and dropping it would have converted a governed "recorded but
unavailable" state into an absence.

**The `in` operator keeps a plain `TextInput`.** No combobox primitive exists
and I did not invent one. The comma hint moved onto `Field`'s `hint` slot, so it
is now programmatically associated instead of a loose `<span>`.

**Two things I had to back out mid-task**, both because I assumed an API rather
than reading it:

- `icon="add"` — there is **no `add` icon** in the registry. Dropped the icon
  rather than add a registry entry mid-task.
- `name` on `SegmentedControl` — the prop does not exist. It is not needed: the
  whole tree serialises into the single hidden `ct` field, the form's only input.

## Inventory taken before writing code

13 native controls (4 `<select>`, 8 `<option>` groups, `<input type="date">`,
`<input list>` + `<datalist>`, 3 typed inputs); 24 legacy classes; 11 inline
styles using **legacy** `var(--space-3)` (not `--sqx-`); 21 comments; 3
`useState`/`useMemo`; ARIA `tree`/`treeitem`/`group` already correct and kept.

## Numbers

```
Route: /planning/bulk
CriteriaBuilder   302 → 360 lines (over the 200 target, under the 400 ceiling)
module CSS        0 → 104 lines, --sqx- only
i18n keys added   5 (date picker vocabulary), English fallback only
```

## Accessibility

- Every control now has a real `Field` association; previously `sq-field__label`
  with `htmlFor` pointing at native inputs, and no label at all on some.
- ARIA tree semantics preserved exactly.
- Move up/down/remove became `Button` with `compactLabel`, so they keep a text
  accessible name where they previously used bare `↑`/`↓` glyphs.
- axe: **not run**.

## Verification

- [x] `npm run typecheck` — clean
- [x] 0 native controls / legacy classes / inline styles / comments / legacy tokens
- [ ] browser pass on the recursive group layout, the `between` two-date row,
      and RTL — **owed**, none of it has been seen

## Retirement

Nothing marked. The legacy rules this screen released (`sq-rule`,
`sq-field__label`) are still used elsewhere and stay in the frozen sheets.

## Parked

- **`CriteriaBuilder` is 360 lines** — over the 200 target. `valueInput`,
  `renderCond` and `renderGroup` are three nameable things and should be three
  files when someone next touches it.
- **The 5 new date strings are English-only.** `/planning/bulk` reads Arabic from
  the **`ui_strings` table**, not the JSON namespaces, so they need DB rows.
- **No SAQEEL combobox** — the one remaining gap on this component.

## Blocked / open questions

None blocking. The combobox question carries forward from T-049.

## Proposed commit

```
feat(planning): rebuild the criteria builder on saqeel controls
```

## Next

T-046 slice 1b — `page.tsx` 337 → ≤ 40.
