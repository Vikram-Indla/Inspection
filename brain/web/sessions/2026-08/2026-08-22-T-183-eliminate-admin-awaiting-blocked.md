# 2026-08-22 · T-183 — "administration", "awaiting", "blocked", and a wider banned list

`task: T-183` · `status: done` · `duration: 0.5h`
`rules applied: WEB-011, WEB-013, WEB-016`

---

## Goal

Third rewrite wave, and close the hole that let the first two waves' gains
regress.

## What changed

72 strings in each language across 26 namespaces. `content-vocabulary.json`
banned list extended 50 → 74 words. Baseline re-cut at 592.

## Decisions

**The gate was not protecting what the earlier waves fixed.** T-181 and T-182
removed `governed`, `visible` and `read-only`, but only `governed` and
`read-only` were in the gate's banned list — `visible` could have walked straight
back in. Added the 24 words the audit instrument flags but the gate did not:
`visible` · `administration` · `awaiting` · `operational` · `supervision` ·
`advisory` · `mandatory` · `override` · `catalogue` · `scope` and others.

**This makes the baseline jump, on purpose.** 206 → 592. The gate now sees 386
violations it was previously blind to. They are pre-existing debt, not new
damage, and the ratchet still only fails on *new* violations. **A baseline that
rises because the gate got sharper is a different thing from a baseline that
rises because the copy got worse** — worth stating plainly so a future reader
does not misread the number.

**`Administration` → `Admin` in 21 breadcrumbs.** The full word ranks past B1;
the short form is the one staff say, and Arabic already used `الإدارة`.

**`blocked` → `stopped` or a plain "you cannot …".** "Blocked" reads as a fault
in the system. "Stopped before any change. The inspection has already started."
tells the reader what happened and that nothing was lost.

## Numbers

```
strings rewritten          72 EN + 72 AR
banned list               50 → 74 words
gate baseline            206 → 592   (gate got sharper, copy did not get worse)
i18n corpus, L2 audit:
  P0                     1,183 → 640
  P1                     2,365 → 1,538
  passing                        3,355 of 5,533
```

Remaining top offenders: `CR` 26 · `operational` 25 · `requests` 22 · `mode` 19.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED after re-baselining
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.** Covers T-177, T-180, T-181, T-182, T-183.

## Parked

`CR` needs expanding on first use per screen, not a blanket swap — it is an
acronym, not a hard word.

## Proposed commit

```
feat(copy): third rewrite wave and a wider banned word list
```
