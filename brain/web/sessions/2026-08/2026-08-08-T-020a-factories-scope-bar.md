# 2026-08-08 · T-020a — Factories top stripe

`task: T-020a` · `status: done` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011`

---

## Goal

Replace the `/factories` portfolio chooser — the top stripe — with Saqeel
primitives, retiring the native `<select>` and the last `.sq-*` classes on that
row.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/sections/factories/factories-scope-bar/factories-scope-bar.tsx` | created | — → 44 |
| `components/sections/factories/factories-scope-bar/factories-scope-bar.module.css` | created | — → 25 |
| `i18n/locales/en/factories.json` | created | — → 8 |
| `i18n/locales/ar/factories.json` | created | — → 8 |
| `i18n/messages.ts` | modified | 32 → 35 |
| `app/(app)/factories/page.tsx` | modified | 123 → 121 |

## Decisions

- **The two-step interaction is preserved.** The owner chose to keep the stripe
  a GET form: the select holds the pending scope, `View factory` submits it.
  `operations-scope-filter` routes on change instead; that pattern was
  deliberately not adopted here because dropping the button would change
  behaviour, not just visuals.
- **The form stays a real `<form method="get">`.** The pending value rides a
  hidden `scope` input, so submission is a document navigation and the server
  component re-reads `searchParams` exactly as before. No router, no effect.
- **`Toolbar` was not used.** `Toolbar` centres its items; this row pairs a
  two-line `Field` with single-line controls and must align on `flex-end`, the
  same reason `operations-scope-filter` owns a module rather than composing
  `Toolbar`.
- **`Card` was not used.** `Card` lifts on hover; a filter row is chrome, not a
  card, and dashboard/operations render their control rows directly on the page
  surface.
- **Count is `CountBadge` + caption**, per the owner: badge carries the shown
  figure with an `aria-label`, the caption carries `of {total} factories`.

## Inventory taken before writing code

- **Literals mapped to tokens.** The row carried no inline literals; it carried
  six legacy classes — `sq-surface`, `sq-row`, `sq-field`, `sq-field__label`,
  `sq-select`, `sq-btn sq-btn--secondary`, `sq-caption`, `sq-numeric` — all now
  expressed through `--sqx-space-3/4`, `--sqx-control-h-md`,
  `--sqx-text-caption`, `--sqx-text-muted` and the primitives' own modules.
- **State and effects.** One new `useState` (the pending scope). No effect. The
  ladder rung is correct: it is transient UI state that cannot be derived from
  props, and it resets naturally because a GET submit remounts the tree.
- **`<svg>`.** None in the old row; the new chevron comes from the icon registry
  through `SaqeelSelect`.
- **Accessibility failures found in the existing markup.** The native `<select>`
  cannot follow the dark theme (WEB-009 §14). Replaced by `SaqeelSelect`, which
  carries the full APG combobox keyboard contract.

## Numbers

```
Route: /factories
first-load JS   not measured — SWC blocked on this workstation
route CSS       not measured
LCP / INP / CLS not measured
client islands  0 → 1  (factories-scope-bar; owns the select's open state)
legacy CSS deleted: 0 lines — every class on the row is still used elsewhere
source lines removed: 10 (the JSX block), replaced by a 7-line composition
```

Control heights are token-identical rather than measured: `SaqeelSelect`'s
trigger and `Button` at `size="md"` both resolve `--sqx-control-h-md`
(2.375rem), so the row satisfies WEB-009 §1 by construction. **A measured pixel
height is still owed** and is listed below.

## Accessibility

- axe violations: **not run** — the app does not build on this workstation.
- Manual checklist (WEB-003 §10): **not run**, same reason.
- Reasoned, not verified:
  - The select's accessible name is `Choose a factory` via `aria-label`; the
    form carries the same name.
  - `CountBadge` carries `aria-label="Factories shown"` so the bare figure is
    not announced without meaning.
  - Focus is the primitives' own `:focus-visible` border-colour change; nothing
    in this component moves on focus.
- **Known gap, inherited:** `Field` renders a visible `<label>` with no `for`
  because `SaqeelSelect` exposes no id. The accessible name is still correct
  (the select self-labels), but `jsx-a11y/label-has-associated-control` will
  flag it once T-000 lands. This is the established pattern —
  `operations-scope-filter` has the same shape. Parked below.

## Verification

- [ ] `npm run typecheck` — **not run.** See Blocked: `app/(app)/dashboard`
      imports a folder that no longer exists, so the project does not typecheck
      as it stands.
- [ ] `npm run lint` — no lint config exists yet (T-000)
- [ ] `npm run gates` — no gate scripts exist yet (T-000)
- [ ] `npm run test:e2e` — SWC blocked
- [ ] Definition of Done (WEB-006 §5) fully ticked

Checked by hand, on the new files only:

- [x] zero comments, zero `any`, zero `let`, zero `<svg>`
- [x] zero hex / rgb / px / rem / em / font-family / box-shadow / z-index literals
- [x] zero `--sq-`, `.sq-`, `.saqeel-`, `ax-`
- [x] logical properties only — no `left`, `right`, `margin-left`, `padding-right`
- [x] every `--sqx-*` token used is declared in `app/saqeel.css`
- [x] every new key exists in both `en` and `ar`
- [x] no `letter-spacing` set anywhere in the module

## Arabic review (WEB-011 §8)

- [x] Every new key exists in `en` and `ar`.
- [x] Arabic is written, not transliterated: `اختر مصنعاً` (imperative, correct
      accusative tanwin), `عرض المصنع`, `من أصل {total} مصنع`.
- [x] No question strings, so no `؟` is owed; no lists, so no `،`.
- [x] No `letter-spacing` — the module sets none, and `saqeel.css` guards
      `:lang(ar)` globally.
- [x] No physical properties.
- [ ] **Not opened in Arabic in a browser** — SWC blocked. The row wraps rather
      than truncates (`flex-wrap: wrap`, content-sized trigger, no fixed width),
      so the longest Arabic option label — `منشآت R05 اليدوية` — cannot clip;
      this is reasoned from the CSS, not seen.

## Retirement

Nothing became deletable. The eight legacy classes this row dropped are all
still consumed by other screens, so `saqeel-runtime.css` is unchanged.

## Parked

- **`Field` + `SaqeelSelect` produce an orphan `<label>`.** Either `Field`
  passes an id down, or `SaqeelSelect` accepts one and `Field` points `htmlFor`
  at it. Fixing it in `SaqeelSelect` fixes it for `operations-scope-filter` too.
- **The `Manual R05 establishments` option label still comes from the legacy
  `t()` fallback table**, not the new `factories` namespace, because it is
  produced in the route file alongside other `f360.*` strings. It moves when the
  rest of the page migrates.
- **`app/(app)/factories/page.tsx` still carries four `//` comments and is 121
  lines of data logic in a route file** (WEB-001 §2 caps route files at 40).
  That is T-020's job, not this stripe's.

## Blocked / open questions

- **`app/(app)/dashboard` imports a folder that does not exist.** `page.tsx` and
  `loading.tsx` both import from `@/components/dashboard/...`, but those
  components live at `@/components/sections/dashboard/...`. `tsconfig` maps
  `@/*` to `./src/*` and `src/components/dashboard/` is absent, so the project
  cannot typecheck. Three import lines. Left untouched because the dashboard is
  outside this task's scope — **it needs a decision, then one small edit.**
- **The workstation still cannot run the app** (Windows Application Control
  blocks `@next/swc-win32-x64-msvc`), so every runtime number and every
  accessibility check above is owed rather than done.

## Proposed commit

```
feat(factories): rebuild the portfolio stripe on saqeel primitives
```

## Next

`/factories` list body — `RevampFactory360Portfolio` (11.6 KB, `sq-f360__*`
throughout, hard-coded English labels) is the next block on this screen. Tracker
item T-020.
