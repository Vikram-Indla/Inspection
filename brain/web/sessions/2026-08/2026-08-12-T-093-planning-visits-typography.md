# 2026-08-12 · T-093 — `/planning/visits`, and the planning family closes

`task: T-093` · `status: done (the populated board was not rendered)` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014 §2.1, §4.1, §8`

---

## Goal

Clear the last pocket in the planning family: 15 route-owned declarations in
`components/sections/visits/`, a different feature that shares a planning URL.

## What changed

**15 declarations across 3 modules → 0.** With this, **all thirteen planning
routes sit at 1 violation — `NotificationBell.tsx:270`, the shell.**

| Module | Removed | Note |
| --- | --- | --- |
| `visit-board` | 10 | incl. a **state-dependent weight** and 3 retired `caption` refs |
| `visit-filter-bar` | 3 | one on `<input>` |
| `visit-scope-bar` | 2 | retired `caption` |

Five retired-role references (`--sqx-text-caption`) cleared.

## Decisions

**The pressed row's reference goes 700 → 600, deliberately.**
`.preview[aria-pressed="true"]` set `font-weight: var(--sqx-weight-bold)` — 700.
The scale has **no 700 at body size**; `bodyStrong` is 600, and it is the only
emphasis role for body text. So the selected row now renders
`Text role={active ? "bodyStrong" : "body"}`.

This is the **mirror image** of T-087 and T-091, where KPI values moved 600 → 700
because `metric` *is* bold. Both are the same correction: a weight assembled by
hand is not a role. Here it goes down, there it went up — the direction follows
the scale, not a preference.

**`.preview` already had `font: inherit`, and that was checked, not assumed.**
It is a `<button>`, so the absence of a font declaration would have meant Arial
(T-064). The gate flagged only the `aria-pressed` state, which could equally have
meant the base was silently broken. It was not — `font: inherit` was already
there, so no Arial defect existed and none was introduced.

**Two `<input>` got `font: inherit`; nothing else needed it.** `.control` and
`.search`. `<label>` (`.choice`), `<a>` (`.chip`), `<ul>` (`.eligibility`) and
`<p>` all inherit `font` normally and simply lost their declarations.

**`--sqx-status-critical-on-soft` was reused as `tone="danger"` on the strength
of T-091's check** — both resolve to `--sqx-error-darker` / `--sqx-error-light`,
so `.formError`'s colour could be deleted rather than preserved on a wrapper. The
class keeps its padding and background; the text is `Text tone="danger"`.

**`.formError` became a `<div>`, which matches its own ref.** `summaryRef` is
declared `useRef<HTMLDivElement>` and is focused after a bulk action; it now sits
on a `<div>` carrying `tabIndex={-1}` and `role="alert"`, with the primitive
inside. Focus behaviour and the alert role are unchanged.

**T-091's invisible-violation sweep was run first and came back clean** — no
`.t-*` legacy classes and no string-literal `className` anywhere in
`components/sections/visits/`. That check is now part of the route inventory, not
an afterthought.

## Inventory taken before writing code

- 15 declarations, 3 modules, mapped **selector → rendered element** before
  editing: 2 `<input>`, 1 `<button>` state, 1 `<label>`, 1 `<a>`, 1 `<ul>`,
  2 `<p>`, 2 `<span>`.
- The map's first pass reported every class as "(not found)" because the classes
  live in **sibling** files (`visit-spine.tsx`, `visit-table.tsx`,
  `visit-bulk-actions.tsx`), not the namesake component. Resolved by grep before
  proceeding — **a "not found" from tooling is a question, not an answer.**
- No `.t-*`, no literal `className`, no glyph-as-icon, no state or effect changed.

## Numbers

```
/planning/visits   16 → 1 violations   (route-owned 15 → 0)
repo baseline     749 → 734
classes deleted     3

THE PLANNING FAMILY, ALL 13 ROUTES:  1 violation each — the shell, and nothing else.
```

Measured on the live route:

```
typefaces                1 (plexArabic)
off-scale sizes          0
filter bar               12px ×13, 11px ×1 — all on-scale
search <input>           plexArabic 14px / 22.4px / 400   ← font: inherit worked, no Arial
preview <button> label   plexArabic 14px / 22.4px / 400   = body (row not selected)
```

## Accessibility

- `role="alert"`, `tabIndex={-1}` and the focus target on the bulk-action error
  summary all preserved; only the element name changed, and it now matches the
  ref's declared type.
- `<label htmlFor>` association intact on `.choice`; the checkbox is untouched.
- No text got smaller. The selected-row emphasis drops from 700 to 600, which is
  still a visible weight step against the unselected 400.
- axe not re-run — no semantics changed.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist (T-083)
- [x] `npm run gates:typography` — 15 removed, re-baselined 749 → 734
- [x] Zero typography declarations left in `components/sections/visits/`
- [x] No orphaned `styles.x`, no unused class — both directions
- [x] T-091 sweep — no `.t-*`, no string-literal `className`
- [x] Rendered: one typeface, zero off-scale, `font: inherit` confirmed on the
      search input
- [ ] **The populated board was not rendered.** `main` held the loading skeleton
      for most of the pass; the filter bar, search input and one preview button
      were reachable and measured, but the **spine, bulk-action forms, eligibility
      list and table body were not**. That is where 10 of the 15 declarations
      were.
- [ ] **The pressed state was never seen.** `Text role="bodyStrong"` on a
      selected row is asserted from the scale, not observed.
- [ ] `npm run test:e2e` — not run; needs a production build

## Retirement

3 CSS classes deleted (`.spineEmpty`, `.count`, `.scope`). No files deleted.

## Parked

1. **The selected-row weight change wants a look.** 700 → 600 on the active
   reference is the correct scale value but it is a *visible* reduction in
   emphasis on the one element that tells a planner which row the spine is
   showing. If it reads as too weak, the answer is not a heavier weight — it is
   a second signal (the row already carries `aria-pressed` and a background).
2. **`visit-table` uses `DataTable`** — unlike `planning-visit-table`, which
   hand-rolls its own (T-076's fifth instance, still open after T-090).
3. **`NotificationBell.tsx:270` is now the only violation on all 13 planning
   routes**, and on `/factories`, `/factories/[id]` and others. It is a ruling,
   not a rename: `font-weight: 500` is not on the scale, so the fix is `body` vs
   `body-strong` and it changes how a read row differs from an unread one.

## Blocked / open questions

None.

## Proposed commit

```
refactor(visits): render the visits board through the type primitives
```

## Next

The planning family is closed. The remaining pockets are `/field/*` (226, needs
an inspector persona per T-069), `sections/approvals` (68),
`sections/regulations` (63) and `sections/enforcement` (52).
