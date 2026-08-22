# 2026-08-22 · T-175 — unbreak the bilingual brand lockup on /login

`task: T-175` · `status: done` · `duration: 0.5h`
`rules applied: WEB-000, WEB-008, WEB-014`

---

## Goal

Restore the `/login` brand lockup to one line per language after T-174's rename
overflowed its fixed-width container.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/app/login/field/field-login.css` | one declaration added to `.fl-brand` | 349 → 350 |
| `e2e/saqeel-login-revamp.spec.ts` | re-pointed two assertions left red by T-174 | unchanged |

## Decisions

**Fixed by composition, not by typography.** WEB-014 §7b forbids `font-size`,
`font-weight` and `letter-spacing` in feature CSS. The obvious fix — shrink the
wordmark — was therefore illegal and also unnecessary: stacking removes the
overflow at the existing sizes. `.fl-brand` gains `flex-direction: column` and
`align-items: center`. No font property was touched, no literal was added, the
typography ratchet did not move.

**This restores T-174's own stated intent.** Its record says bilingual lockups
"stack both, each `lang`-tagged". The login card was the one surface that never
implemented that, and the rename exposed it.

## Inventory taken before writing code

- Root cause is `eadd0cce` (T-174): `SAQEEL`+`صقيل` → `Inspection Platform`+`منصة التفتيش`,
  text only, zero CSS changed.
- Measured on the running page: Latin natural width 299.0px, gap 10px, Arabic
  138.6px = **447.6px required inside a 400px `.fl-col`**. Both flex children
  shrank, each wrapped to two lines, giving a four-line brand block.
- Stacked requirement: 299.0px, i.e. 101px of headroom at the same font sizes.
- e2e sweep by source path (WEB-008 §1): `saqeel-login-revamp.spec.ts:14-15`
  still expected `SAQEEL` / `صقيل`. **Already red before this task** — T-174 did
  not update them. Re-pointed to the current brand.
- No literals mapped, no `<svg>` touched, no accessibility failure found in the
  lockup markup (`lang` attributes already correct on both spans).

## Numbers

```
Route: /login
brand lockup      4 rendered lines → 2   (Latin 2→1, Arabic 2→1)
required width    447.6px in a 400px box → 299.0px (101px headroom)
font properties changed                  0
new literal values added                 0
typography ratchet                       unchanged (gate PASSED)
```

## Accessibility

- axe-core: **not run** — stated as a gap, not ticked.
- Manual: keyboard (nothing focusable in the lockup) · Arabic/RTL verified live
  (`dir=rtl`, `lang=ar`, both wordmarks one line) · dark verified (the route is
  dark-locked) · 200% zoom and 320px not re-checked, unchanged from before.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run lint` — 0 issues on both changed files
- [x] `npm run gates` — typecheck, typography and date-input gates PASSED;
      `check:design-system-v5` fails on pre-existing emoji-as-icon and UTC-date
      debt in field/planning/analytics. **Zero hits on any file in this task.**
      Not ticked as green.
- [ ] `npm run test:e2e` — not run this session
- [ ] Definition of Done — axe and e2e outstanding

## Retirement

Nothing marked, nothing deleted.

## Parked

- `saqeel-login-revamp.spec.ts` asserts brand copy by literal. A brand rename
  will keep breaking it. Consider asserting against the i18n value instead.

## Blocked / open questions

None.

## Proposed commit

```
fix(login): stack the bilingual lockup so neither wordmark wraps
```

## Next

T-176 — Zones resting scene.
