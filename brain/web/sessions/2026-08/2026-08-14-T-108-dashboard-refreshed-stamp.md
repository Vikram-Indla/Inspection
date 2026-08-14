# 2026-08-14 · T-108 — the dashboard stamp was British, and only in English

`task: T-108` · `status: done` · `duration: ~0.5h`
`rules applied: WEB-000, WEB-002, WEB-008, WEB-011, WEB-013, WEB-014`

---

## Goal

Make the dashboard toolbar's *Updated* stamp a localized 12-hour datetime.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `lib/dates.ts` | edited — `formatDateTime` gained `{ hour12 }` | 172 → 178 |
| `components/dashboard/dashboard-sections/dashboard-sections.tsx` | edited — private formatter deleted | 178 → 172 |
| `components/dashboard/dashboard-toolbar/dashboard-toolbar.tsx` | edited — formats at the render site | 39 → 42 |

## Decisions

**The defect was not the format, it was a bypass.** `dashboard-sections.tsx:28`
carried its own `Intl.DateTimeFormat("en-GB", …)` — hardcoded British locale,
`hour12: false`, time only. The Arabic dashboard rendered Latin digits in British
format regardless of locale. The fix routes through `lib/dates.ts`, the governed
single source, rather than correcting the private copy.

**`formatDateTime` gained an option; it did not change behaviour.** `hour12`
defaults to `false`, so **all 94 existing call sites are byte-identical**.
Changing the default would move every timestamp in the application, which is a
design-system decision, not a dashboard one.

**`hour12` also switches `hour` to `numeric`, and that was measured not guessed.**
`hour: "2-digit"` with `hour12: true` renders `08:28 PM`; `numeric` renders
`8:28 PM`. Confirmed against ICU in both locales before writing the branch.

**The toolbar now receives the raw instant, not a pre-formatted string.** The
prop is `number` and formatting happens where `locale` already lives.

## Inventory taken before writing code

- `formatDateTime`: **94** consumers · `formatTime`: **6** · `hour12` appears in
  6 places, one of which is `riyadhLocalInput` and **must stay 24-hour** because
  `<input type="datetime-local">` requires it.
- `dashboard-business.spec.ts:85` asserts `getByText("Updated", { exact: true })`
  — the label sits in its own span and did not move.

## Numbers

```
Route: /dashboard
rendered (en)   "20:28"  →  "14 Aug 2026, 8:28 PM (Riyadh)"
rendered (ar)   "20:28"  →  "١٤ أغسطس ٢٠٢٦, ٨:٢٨ م (الرياض)"
call sites changed by the default   0 of 94
private date formatters             1 → 0
typecheck                           0 errors
v5 gate                             unchanged at 105
```

## Accessibility

The stamp is `<Text as="time" numeric>`. Arabic renders Arabic-Indic digits and
the `م` marker on the Gregorian calendar, which is what `lib/dates.ts` exists to
guarantee (`ar-SA` defaults to `islamic-umalqura` without an explicit calendar).

**`<time>` still has no `dateTime` attribute** — see Parked.

## Verification

- [x] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — script does not exist
- [x] `npm run gates:typography` — PASSED
- [x] `check:design-system-v5` — 105, unchanged
- [ ] `npm run test:e2e` — not run
- [x] Rendered strings measured in both locales against ICU

## Retirement

Nothing marked or deleted. One private formatter removed.

## Parked

- **The Arabic separator is wrong.** `formatDateTime` joins date and time with a
  Latin `,`; Arabic takes `،`. Visible in the measured output above. Fixing it
  moves all 94 consumers, so it belongs in its own task. **WEB-011 defect.**
- **`Text` cannot carry `dateTime`.** `TextProps` has no such prop, so every
  `<Text as="time">` in the app emits a `<time>` with no machine-readable value.
  Extending the primitive is an owner decision (T-087's precedent).
- **The dashboard is now the only 12-hour surface.** Flipping the default in
  `formatDateTime` is one line and moves 94 sites — owner's call.

## Blocked / open questions

None.

## Proposed commit

```
fix(dashboard): localize the refreshed stamp and show 12-hour datetime
```

## Next

Decide whether 12-hour becomes the app-wide default, and fix the Arabic comma in
the same task if so.
