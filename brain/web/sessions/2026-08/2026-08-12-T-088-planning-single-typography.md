# 2026-08-12 · T-088 — `/planning/single` typography, route-owned code to zero

`task: T-088` · `status: done (3 of 5 components never rendered — see Verification)` · `duration: 45m`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014 §4.1, §8`

---

## Goal

Move `/planning/single`'s eight typography declarations out of feature CSS and
onto the type primitives, per WEB-014 §4.1.

## What changed

Five CSS modules and their five components. Every declaration was a **layer**
move: the size, weight, tracking and colour are identical before and after.

| Module | Declarations removed | Class | Replacement |
| --- | --- | --- | --- |
| `visit-configuration` | 4 | `.legend`, `.hint` | `Text role="label" tone="secondary"`, `Text tone="muted"` |
| `planning-notice` | 1 | `.body` | `Text tone="secondary"` |
| `identity-dossier` | 1 | `.hint` | `Text tone="muted"` |
| `portfolio-picker` | 1 | `.hint` | `Text tone="muted"` |
| `publish-readiness` | 1 | `.label` | `Text as="span" tone="secondary"` |

**Four classes were deleted outright** — `.body`, `.label`, and two `.hint` — because
every property they carried is supplied by the primitive. `.legend` survives with
one non-typography declaration (`padding: 0`).

## Decisions

**The replacement was verified property-by-property against `type.module.css`
before a single edit.** `.text` sets `margin: 0`; `.text[data-role="body"]` sets
`font: var(--sqx-text-body)`, its tracking **and** `text-wrap: pretty`;
`[data-tone="secondary"|"muted"]` set exactly the colour tokens the classes used.
So the deleted blocks and the primitive are the same declaration set, which is
why four classes could go entirely rather than being trimmed.

**`.legend` carried a redundant declaration that made it look like a
size change.** It set `font: var(--sqx-text-label)` *and*
`font-weight: var(--sqx-weight-semibold)` — but the `label` role's weight
**is** semibold, so the second line was a no-op. Removing it changes nothing;
reading the diff without checking the token would suggest a weight change.

**`<legend>` keeps the element and gains a child, rather than the primitive
gaining a member.** `Text`'s `as` union has no `"legend"`, and the obvious fix —
adding one — is a design-system change the owner has asked to be consulted on. A
`<legend>` accepts phrasing content, so `<legend><Text as="span" role="label"
…></legend>` keeps the fieldset's semantics intact, keeps the label styling in
the primitive, and touches nothing in `components/saqeel/`. **Recorded so the
next migration does not "fix" it by extending the union without asking.**

**`planning-notice` is shared by four surfaces** — `/planning/single`,
`/planning/bulk`, `/planning/bulk/review` and `/planning/immediate` — so this one
change removes a violation from all of them. It is also the only one of the five
that renders outside the wizard, which is why it is the one that could be
measured.

## Inventory taken before writing code

- 8 route-owned declarations across 5 modules; 1 further violation
  (`NotificationBell.tsx:270`) belongs to the shell and is **out of scope by
  owner instruction**.
- **All eight sit on plain text** — `<p>`, `<span>`, `<legend>`. No `<button>`,
  `<input>`, `<select>` or `<textarea>`, so T-064's *"deleting a font-size from a
  control makes it Arial"* trap does not apply here. Checked before editing, not
  after.
- Every class confirmed single-owner (one `styles.x` reference each, two for
  `.hint` and `.legend` inside their own component) before deletion.
- No state, no effects, no `<svg>`, no copy, no `let`, no literal values.

## Numbers

```
/planning/single      9 → 1 violations   (route-owned 8 → 0)
The residual 1 is NotificationBell.tsx — the shell, excluded by instruction.

repo baseline       851 → 843
CSS classes deleted   4  (.body, .label, .hint ×2)
```

Measured live on `/planning/bulk`, where `PlanningNotice` renders:

```
                 before (deleted CSS)        after (Text tone="secondary")
element          <p>                         <p>            ← unchanged
font-size        var(--sqx-text-body) 14px   14px
line-height      1.6 → 22.4px                22.4px
font-weight      400                         400
color            --sqx-text-secondary        rgb(196,205,213)  ← the same token
margin           0                           0
typefaces        1 (plexArabic)              1 (plexArabic)
```

## Accessibility

- `<legend>` is preserved as the element; its accessible name is unchanged — the
  text simply sits in a `<span>` inside it. The fieldset/legend association is
  untouched.
- No heading level, `id`, `aria-labelledby` or landmark changed.
- No size decreased anywhere; prose stays at 14px in both locales.
- axe not re-run — no markup semantics changed, only the element carrying the
  font declaration.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist (T-083)
- [x] `npm run gates:typography` — 8 removed, re-baselined 851 → 843
- [x] Per-route import-graph scan — `/planning/single` route-owned **0**
- [x] `PlanningNotice` measured on the live route — identical to the deleted CSS
- [ ] **3 of 5 components were never rendered.** `visit-configuration`
      (both legends, both hints), `identity-dossier` and `portfolio-picker` sit
      behind steps 2–4 of a four-step wizard. Step 1 (*Find the factory*) renders;
      the Factory 360 handoff URL (`?cr=…&license=…&source=factory360`) was tried
      and the client wizard **would not hydrate past the loading skeleton in this
      pane** — the recurring compositing failure recorded in T-061/T-072/T-082.
      `<legend>` is confirmed absent from the DOM, so the legend change in
      particular is **unrendered and unmeasured**.
- [ ] `npm run test:e2e` — not run; needs a production build

## Retirement

Nothing retired. Four now-empty CSS classes deleted with their declarations.

## Parked

1. **`Text` cannot render a `<legend>`.** The `as` union covers `p · span · div ·
   dt · dd · li · strong · em · code · time · figcaption · address`. Every
   `<fieldset>` in the app needs the nested-span workaround used here. If a third
   site needs it, extend the union — **with the owner's agreement**, since it is a
   design-system change.
2. **`NotificationBell.tsx:270` is still the last violation on this route**, as
   it is on `/factories`, `/factories/[id]` and `/planning/visits/[id]`. Shell —
   excluded by instruction, and it needs a ruling anyway (weight 500 is not on
   the scale).

## Blocked / open questions

None blocking. The unrendered wizard steps are a verification debt, not a
correctness doubt: each replacement was checked declaration-by-declaration
against `type.module.css`, and the one component that could be rendered matched
exactly. But **it is measurement owed, and §11.3 asks for it** — the next session
touching `/planning/single` should drive the wizard to step 3 and confirm the two
legends render at 12px `label` and the hints at 14px `body`.

## Proposed commit

```
refactor(planning): render single-visit text through the type primitives
```

## Next

T-087 — `/planning/bulk/review`, 31 route-owned violations across ten `review-*`
modules, already inventoried. Its shape is different from this one: it has
hand-rolled card headers, two focusable headings the primitives cannot express,
and KPI values at `metric` size but the wrong weight.
