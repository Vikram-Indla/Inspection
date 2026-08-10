# 2026-08-10 · T-043 — planning filter bar on SAQEEL controls + AI accent

`task: T-043` · `status: done (not verified in a browser)` · `duration: 1.5h`
`rules applied: WEB-000, WEB-001 §2, WEB-002, WEB-003, WEB-009, WEB-011`
`commit: 189a99a5`

---

## Goal

Replace every native control on the `/planning` filter bar with SAQEEL
primitives, stop the More Filters panel clipping, and mark the two AI columns of
the planning assistant as AI.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/planning/planning-toolbar/planning-toolbar.tsx` | rebuilt | 147 → 75 |
| `components/planning/planning-toolbar/filter-controls.tsx` | created | — → 106 |
| `components/planning/planning-toolbar/more-filters.tsx` | created | — → 138 |
| `components/planning/planning-toolbar/planning-toolbar.module.css` | rebuilt | 202 → 77 |
| `components/planning/planning-assistant/planning-assistant.tsx` | modified | 77 → 80 |
| `components/planning/planning-assistant/planning-assistant.module.css` | modified | — |
| `i18n/locales/{en,ar}/planning.json` | modified | +5 keys each |

10 native controls replaced: 8 `<select>` → `SaqeelSelect`, 2
`<input type="date">` → `DatePicker`.

## Decisions

**The `<details>` panel clipped because of the shell's scroll model, not
z-index.** `.moreGrid` was `position: absolute` inside the toolbar, which lives
inside `.sqx-shell__main` (`overflow-y: auto`). An absolutely-positioned box
cannot escape a clipping ancestor. `MenuSurface` portals to `document.body`, so
it is outside the clip entirely — the same reason every other popover in this
app portals (PARKED, 2026-08-09).

**A portalled control cannot participate in a GET form.** The panel's DOM sits
outside `<form>`, so native submit skips it. State therefore lives in one client
island, **every hidden input renders inside the form**, and the portalled panel
is presentation only. Submitted parameter names are unchanged, so
`parsePlanningParams` needed no edit and the URL contract is identical.

**The `<form>` stays a Server Component.** The first cut made the whole toolbar
`"use client"`, which breaks WEB-008 §2. Reverted: `planning-toolbar.tsx` owns
the form, search input and Apply/Clear; `filter-controls.tsx` is the single
client boundary. `more-filters.tsx` and the chip carry no directive because they
are only ever rendered inside that boundary.

**The first cut invented a chip and was rejected by the owner.** It wrapped
`SaqeelSelect` — which carries its own border and chevron — inside a bordered
pill with an inline label, producing doubled chrome. The house pattern is
`Field` + `SaqeelSelect` with the label stacked above, and `Button` primitives
for actions. `enforcement-filter-bar` had already solved exactly this problem;
the rebuild is a copy of it. **Read the nearest existing solution before
designing a new one.**

**AI accent marks only what is AI.** All three assistant columns carried a
Sparkles icon, including Quick Actions, which is navigation. A marker applied to
non-AI content defeats the marker. Insights and Recommendations now carry
`data-ai` (a `--sqx-border-width-thick` `--sqx-accent-ai` rail, heading in the
AI colour, and the platform's standard *"Advisory only · human decides"* tag);
Quick Actions moved to the `workflow` icon. The advisory string already existed
in the planning namespace with the same wording as `/factories` and
`/dashboard` — nothing was invented.

## Inventory taken before writing code

- 10 native controls, listed above.
- `<details>`/`<summary>` disclosure with an absolutely-positioned grid.
- Hand-rolled `.apply` button and `.clear` anchor instead of `Button`.
- 6 CSS classes orphaned by the rebuild, all deleted.
- No `<svg>`, no `alt=""`, no `div` with `onClick` on this surface.

## Numbers

```
Route: /planning
native controls   10 → 0
toolbar module    202 → 77 lines
client islands    1 (filter-controls) — was 0, the form was fully server
i18n keys added   5 × 2 locales (date picker vocabulary)
legacy CSS deleted: 0 (this screen's chrome was already module CSS)
```

## Accessibility

- axe: **not run** — cannot run a browser on this workstation.
- `SaqeelSelect` brings listbox roles, arrow keys, Home/End and type-ahead where
  a native select had them implicitly; `MenuSurface` brings Escape and a focus
  trap the `<details>` never had.
- **Unverified and worth checking:** Tab order through the portalled panel, and
  the panel in RTL (it is `align="end"`, so it mirrors).

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` / `gates` — do not exist (T-000)
- [ ] axe, keyboard pass, Arabic review, dark mode — all owed
- [x] i18n parity re-checked across all 9 namespaces after the change

## Retirement

Nothing marked. `filter-chip.tsx` was created and deleted within the task after
the owner rejected the design; it never shipped.

## Parked

- **`Button` does not forward a ref**, so it cannot be a `MenuSurface` trigger.
  Every existing trigger in the app (`shell-user-menu`, `shell-admin-palette`,
  `shell-mobile-nav`) is a raw `<button>` styled from `--sqx-action-secondary-*`.
  If a fourth appears, forward the ref on `Button` instead of styling a fourth
  raw button.
- **Media-query breakpoints remain literal** (`48rem`, `90rem`). CSS custom
  properties do not work in media queries, so this is not fixable with a token.

## Blocked / open questions

None.

## Proposed commit

```
fix(planning): rebuild filter bar on Field and Button primitives
```

## Next

T-046 — `/planning/bulk`, slice 1b: `page.tsx` 337 → ≤ 40.
