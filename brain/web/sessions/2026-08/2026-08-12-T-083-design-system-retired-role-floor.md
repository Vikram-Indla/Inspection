# 2026-08-12 · T-083 — the design-system retired-role floor

`task: T-083` · `status: done` · `duration: 45m`
`rules applied: WEB-000, WEB-002 §2, WEB-006, WEB-008, WEB-011, WEB-014 §2.1, §4.1`

---

## Goal

Clear the retired-role references inside `components/saqeel/` that every route in
the application inherits, so that "is this route clean?" becomes an answerable
question.

## What changed

12 declarations across 8 component stylesheets. Every one is a single token
rename — `caption → body`, `code → mono`. No selector, no value, no other
property touched.

| File | Action | Change |
| --- | --- | --- |
| `saqeel/status-pill/status-pill.module.css` | renamed | `caption` → `body` (font + tracking) ×2 |
| `saqeel/timeline/timeline.module.css` | renamed | `caption` → `body` ×2, `code` → `mono` ×1 |
| `saqeel/route-error/route-error.module.css` | renamed | `caption` → `body`, `code` → `mono` |
| `saqeel/data-table/data-table.module.css` | renamed | `caption` → `body` |
| `saqeel/menu-surface/menu-surface.module.css` | renamed | `caption` → `body` |
| `saqeel/count-badge/count-badge.module.css` | renamed | `caption` → `body` |
| `saqeel/field/field.module.css` | renamed | `caption` → `body` |
| `saqeel/choice/choice.module.css` | renamed | `caption` → `body` |
| `scripts/typography-baseline.json` | re-baselined | 863 → 851 |

**`app/saqeel.css` was not touched. `components/saqeel/type/` was not touched.**
No token was added, removed, renamed or revalued — WEB-002 §2 was not engaged at
any point.

## Decisions

**The fix has to live inside the design system, and that is not a violation of
"don't touch the design system" — it is the only legal place.** WEB-014 §4.1
makes `components/saqeel/` the sole authoring zone for typography, so a retired
role referenced there cannot be repaired from anywhere else. The owner asked
explicitly whether the base system would be modified; the answer given was that
the **token file and the type primitives** would not be, and the **component
stylesheets** would. Approved on that basis. A future session must not read
"design system untouched" as covering `saqeel/*/*.module.css`.

**Equality was proven at the token, not inferred from a histogram.** The
retired roles are declared as aliases — `--sqx-text-caption-{size,line,weight,
tracking}` are each `var(--sqx-text-body-*)` (saqeel.css:609-612), and the
composites at 796 and 787 differ only in which alias they read. So the swap
deletes an indirection rather than changing a value.

**The Arabic case was the one that could have broken it, and it was checked
rather than assumed.** `:lang(ar)` overrides `--sqx-text-body-line` to `1.8`
(saqeel.css:765) while `--sqx-text-caption-line` is defined as
`var(--sqx-text-body-line)`. Whether those stay equal depends entirely on
**which element carries `lang`**: custom properties substitute at computed-value
time, so if `lang="ar"` sat on `<body>` while the aliases were declared on
`:root`, caption would have computed `1.6` against body's `1.8` and this rename
would have silently **lengthened every affected line in Arabic**. `layout.tsx:72`
puts `lang` on `<html>`, which *is* `:root`, so both declarations land on the
same element and resolve together. **Measured, not reasoned:** with
`locale=ar`, `--sqx-text-caption-line` reads `1.8` and
`caption === body` compares `true`.

**`choice.module.css` now has `.label` and `.description` both on `body`.** That
is not a regression introduced here — `caption` already resolved to `body`, so
they have rendered identically all along. The rename makes the existing
sameness visible, which is information a future task needs when it decides
whether `.description` should be `tone="muted"` instead.

## Inventory taken before writing code

- 28 retired-role references in `components/saqeel/`; **12** reachable from the
  routes under review, **16** deliberately left (see Parked).
- No state, no effects, no `<svg>`, no literals — this task changes no markup and
  no TypeScript.
- Accessibility failures found in the existing markup: one, and it is not in
  scope (see Parked — the 10px notification badge).

## Numbers

```
Typography gate      863 → 851   (−12, ratchet locked)
Baseline entries     250 → 242
Design-system refs    28 → 16

Per route (whole import graph from the route entry):
/factories             7 → 1     /planning              52 → 46
/factories/[id]        7 → 1     /planning/single       17 →  9
/factories/cr/[id]     8 → 6     /planning/bulk         30 → 21
/planning/immediate    8 → 2     /planning/bulk/review  41 → 32
/planning/visits/[id]  8 → 1     /planning/visits       22 → 16
/planning/{plans,plans/[id],calendar,map,workload,supervision}  1 → 1

The residual 1 on every route is NotificationBell.tsx:270 — the shell, not the route.

Rendered, measured on /planning (dev server, seeded Planner):
                     en                          ar
StatusPill      14px / 22.4px / 600         14px / 25.2px / 600
                (= body 14 × 1.6)           (= body 14 × 1.8, :lang(ar))
typefaces       1 (plexArabic)              1 (plexArabic)
distinct sizes  30·28·20·16·14·12·11·10     30·28·20·16·14·12·11·10
```

Size sets are identical before and after **by construction** — the composites are
byte-identical strings in both locales, so no element can compute differently.
The after-state is recorded above; the equality proof is the token comparison,
which is stronger than a histogram diff because it holds for every element
including ones this render did not reach.

No first-load JS, route CSS, LCP, INP or CLS numbers: this change adds and
removes zero bytes of shipped CSS (a token name of different length inside a
`var()` reference, resolved at parse time) and touches no JavaScript. A
measurement request would return noise.

## Accessibility

- No markup changed, so no axe delta. Not re-run.
- Contrast, focus, roles, landmarks: untouched.
- Line-height in Arabic explicitly verified as **unchanged at 1.8** — the one
  accessibility-relevant property this rename could have moved.
- **Found, not fixed, not mine:** `sq-notification__badge` renders at **10px**,
  below WEB-014 §7's 11px floor. It is a frozen-sheet `.sq-*` global in the shell,
  so it appears on every route in the application. Parked.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **this script does not exist**, in `apps/web` or at the
      repo root. CLAUDE.md's working protocol names it (and `npm run verify`);
      neither is defined. Recorded as documentation drift, not fixed here.
- [x] `npm run gates:typography` — PASSED, 12 removed, re-baselined
- [x] `npm run check:design-system-v5` — 78 pre-existing findings, **none in any
      of the 8 files**; this task adds none
- [ ] `npm run test:e2e` — not run; needs a production build, which is the
      human's to run (WEB-005 §8)
- [x] Rendered and measured in both locales

## Retirement

Nothing marked or deleted. The retired **roles** moved 12 references closer to
the point where `caption`, `body-lg`, `title` and `code` can be deleted from
`saqeel.css` outright. 16 references remain inside the design system and an
unknown number in feature code; the aliases cannot be removed until all are gone.

## Parked

1. **`primitives/primitives.module.css` — 14 retired-role refs** (`title` ×2,
   `body-lg` ×2, `caption` ×8, `code` ×2). Out of the agreed scope for this task.
   Note that `title → display` and `body-lg → body` are the same kind of alias
   rename, but `primitives.module.css` is 1,200+ lines and was not read here, so
   whether each site *wants* the canonical role is not established.
2. **`kbd/kbd.module.css:7` (`code`) and `list-row/list-row.module.css:106`
   (`caption`)** — 2 more, same shape, not reachable from the reviewed routes.
3. **`NotificationBell.tsx:270`** — `style={{ fontWeight: unreadRow ? 600 : 500 }}`.
   The last violation on every otherwise-clean route. It is a real decision, not
   a rename: 500 is not a weight the scale has, so the fix is `body` vs
   `body-strong` and that changes what unread rows look like. Needs a ruling.
4. **`sq-notification__badge` at 10px** — below the accessibility floor, on every
   route, in a frozen sheet.
5. **`npm run lint` / `npm run verify` do not exist.** Either CLAUDE.md is stale
   or the scripts were lost.

## Blocked / open questions

None. The task is complete as scoped.

## Proposed commit

```
refactor(saqeel): retire caption and code aliases in eight component sheets
```

## Next

`/planning/bulk/review` — 32 violations, 31 of them its own, across ten
`review-*` modules. It appears in no session record and looks untouched by the
sweep. Tracker item to be opened as T-084.
