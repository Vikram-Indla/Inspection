# 2026-08-22 · T-184 — "operational" removed, and the banned list corrected

`task: T-184` · `status: done` · `duration: 0.5h`
`rules applied: WEB-011, WEB-013, WEB-016`

---

## Goal

Fourth rewrite wave — and correct an over-reach in T-183's banned list.

## What changed

25 strings per language. `content-vocabulary.json` banned list trimmed 74 → 60.
Baseline re-cut at 380.

## Decisions

**I over-banned in T-183, and this task reverses it.** T-183 added 24 words the
audit instrument flagged. Fourteen of them were wrong: `mode` · `cancellation` ·
`temporarily` · `invalid` · `duplicate` · `verified` · `stored` · `generated` ·
`criteria` · `coordinates` · `snapshot` · `preparation` · `reschedule` ·
`submission` · `execution`.

"Light mode" and "Dark mode" are universal interface vocabulary. "Cancelled" is
a status every reader knows. Rewriting them would have made the product **worse**
while the numbers said it got better. Unbanned, and the baseline fell 592 → 380
as a result — a fall that reflects a corrected rule, not corrected copy.

**The frequency corpus under-ranks workplace nouns, and this is where that
starts to bite.** The remaining top "offenders" — `requests` 22, `mode` 19,
`reload` 18, `cancelled` 18, `issued` 17 — are ordinary words that a
film-subtitle corpus simply does not contain often. **Mechanical
word-elimination has reached its useful limit on this corpus.**

**`operational` was the genuine one in this tier.** 25 strings. `Operational
state` → `Work state`. `Operational View` → `Day-to-day view`. `Operational
exceptions` → `Things that need attention`.

## Numbers

```
strings rewritten        25 EN + 25 AR
banned list             74 → 60 words   (14 wrongly banned, reversed)
gate baseline          592 → 380
i18n corpus L2:  P0 640 → 632 · P1 1,538 → 1,532 · passing 3,369 of 5,533
```

Remaining gate debt, by rule — **this is the real remaining work**:

```
  293  banned-word      mostly CR, scope, advisory, supervision, catalogue
   63  long-sentence    prose over 15 words — needs rewriting, not swapping
   18  idiom
    6  phrasal-verb
```

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED, baseline re-cut to 380
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.** Covers T-177 and T-180 to T-184.

## Parked

- `CR` (26) — an acronym, needs expanding on first use per screen.
- The 63 long sentences are the highest-value prose work left.
- **The 2,370 hardcoded literals with no Arabic remain the largest defect and
  no wave has touched them.**

## Proposed commit

```
feat(copy): replace "operational" and correct the banned word list
```
