# 2026-08-10 · T-044 — nested menu panels keep their ancestor's dismissal scope

`task: T-044` · `status: done (fix by construction; not observed in a browser)` · `duration: 45m`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-012`
`commit: e69422e9`

---

## Goal

Stop `Cannot read properties of null (reading 'removeChild')` when a `Select`
or `DatePicker` is used inside a portalled `MenuSurface`.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/menu-surface/menu-surface.tsx` | modified | 198 → 240 |

## Decisions

**The crash was a chain of two bugs, and the first one is the real defect.**
`MenuSurface` portals to `document.body`. A `SaqeelSelect` opened *inside*
another `MenuSurface` is therefore a DOM **sibling** of its parent panel, not a
descendant — however deeply nested the two are in the React tree. The
outside-click test was `panelRef.current.contains(target)`, which is **false**
for a click on an option in the nested panel. So the ancestor dismissed itself
at `pointerdown`, unmounting the option under the user's finger while React was
already committing the inner portal's removal. That is the `removeChild` of
null.

The visible bug behind the crash: **picking any value inside More Filters closed
the whole panel.**

**Ownership travels down the React tree, which portals preserve.** A
`MenuScopeContext` is provided around each panel's children; a nested surface
registers its panel with every ancestor on open and deregisters on close.
Dismissal now asks `holds(target)` — my own panel **or** any panel registered
beneath me. DOM containment cannot express this relationship; React context can,
because context follows the React tree rather than the DOM.

**Escape closes innermost-first.** An ancestor ignores Escape while it has a
registered open descendant, so the nested select closes before the dialog that
contains it.

**No new DOM writes.** `contains()` is a read. This does **not** add to the
WEB-012 §5 debt already recorded against this file, and no `document.createElement`
container-per-portal approach was used precisely because that would have.

**Backward compatible by construction.** For the five non-nested consumers
(`shell-user-menu`, `date-range-picker`, `date-picker`, `select`,
`planning-create-menu`), `parentScope` is `null`, the descendant set stays empty,
and `holds()` reduces to exactly the previous `contains()` check.

## Inventory taken before writing code

- 6 `MenuSurface` consumers; only `more-filters` nests one inside another today.
- The `place()` layout effect already writes `style.setProperty` and
  `dataset.side` — the recorded WEB-012 §5 conflict. Left untouched.

## Numbers

```
menu-surface.tsx   198 → 240 lines (over the 200 target, under the 400 ceiling)
consumers changed  0 (additive context; no call site edited)
```

## Accessibility

- Escape ordering is now correct for nested overlays (innermost first), which it
  was not before.
- **Known gap, unverified:** the ancestor's focus trap queries only its own
  panel, so Tab does not reach a nested select's options — the select closes on
  Tab via its own handler instead. Not a crash; needs a keyboard pass.

## Verification

- [x] `npm run typecheck` — clean
- [ ] Reproduce the original crash and confirm it is gone — **owed**, needs a browser
- [ ] Keyboard pass over a nested menu
- [ ] RTL pass (the panel is `align="end"` at the only nesting site)

## Retirement

Nothing marked.

## Parked

- **Tab does not enter a nested panel.** If nested menus become common, the trap
  should query the ancestor's panel *plus* its registered descendants — the same
  set `holds()` already maintains.
- **CSS anchor positioning would delete `place()` entirely** and with it the
  WEB-012 conflict. Still not safe across the browsers this platform targets.

## Blocked / open questions

None.

## Proposed commit

```
fix(saqeel): keep nested menu panels inside their ancestor's dismissal scope
```

## Next

T-045 — `/planning/single` search states.
