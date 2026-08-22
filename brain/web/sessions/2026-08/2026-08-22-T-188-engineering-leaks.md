# 2026-08-22 · T-188 — engineering terms removed from user copy

`task: T-188` · `status: done` · `duration: 30m`
`rules applied: WEB-011, WEB-013, WEB-016`

---

## Goal

Remove `json` · `metadata` · `endpoint` · `payload` · `uuid` · `schema` ·
`canonical` · `idempotent` · `artifact` · `posture` from user-visible copy.

## What changed

46 strings in each language. Baseline 182 → 121. This is the group the original
audit named first — the reason marketing raised the complaint.

## Decisions

`endpoint` → **connection** or **address**, whichever the sentence meant.
`payload` → **what changed** or **values**. `metadata` → **details**.
`UUID` → **number**. `JSON object` → **structured value**. `idempotent` →
**safe to repeat**. `posture` → **status**.

## Numbers

```
strings rewritten     46 EN + 46 AR
gate baseline        182 → 121
```

Remaining: 20 catalogue · 15 advisory · 14 capability · 14 supervision ·
13 reconciliation · 12 registry · 9 override · 9 mandatory, and a small tail.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED, 61 removed, baseline 121
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.**

## Proposed commit

```
feat(copy): remove engineering terms from user-visible copy
```
