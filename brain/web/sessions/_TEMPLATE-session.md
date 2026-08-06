# <YYYY-MM-DD> · <Task ID> — <short title>

`task: T-0NN` · `status: done | partial | blocked` · `duration: <h>`
`rules applied: WEB-000, WEB-00N, …`

---

## Goal

One sentence. What this session set out to change.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| | created / rebuilt / split / marked / deleted | |

## Decisions

Anything a future session must not re-litigate, and why. If a rule was
interpreted, record the interpretation here so it is applied consistently next
time.

## Inventory taken before writing code

- state and effects found, and the ladder rung each was moved to
- literals mapped to tokens
- `<svg>` mapped to semantic icon names
- accessibility failures found in the existing markup

## Numbers

```
Route: /<route>
first-load JS   ___ KB → ___ KB
route CSS       ___ KB → ___ KB
LCP (4G, mid)   ___ s  → ___ s
INP             ___ ms → ___ ms
CLS             ____   → ____
client islands  ___    → ___
legacy CSS deleted: ___ lines / ___ KB
source lines removed: ___
```

## Accessibility

- axe violations: **0** / list them
- Manual checklist (WEB-003 §10): keyboard · screen reader · 200% zoom · 320 px
  · Arabic/RTL · dark · reduced motion · greyscale
- Anything found and fixed:

## Verification

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run gates`
- [ ] `npm run test:e2e`
- [ ] Definition of Done (WEB-006 §5) fully ticked

## Retirement

What was marked, what moved closer to deletion, what was deleted.

## Parked

Ideas found but deliberately not chased. Copy each into the tracker's PARKED
section.

## Blocked / open questions

What the next session needs a decision on before it can proceed.

## Proposed commit

```
<type>(<scope>): <subject>
```

## Next

The single next action, and the tracker item it belongs to.
