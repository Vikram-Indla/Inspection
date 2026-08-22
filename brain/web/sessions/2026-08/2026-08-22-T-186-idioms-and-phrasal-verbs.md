# 2026-08-22 · T-186 — every idiom and phrasal verb removed

`task: T-186` · `status: done` · `duration: 20m`
`rules applied: WEB-011, WEB-013, WEB-016`

---

## Goal

Clear the last idiom and phrasal-verb violations from user-visible copy.

## What changed

22 strings per language across 11 namespaces. Baseline 306 → 266.
**The `idiom` and `phrasal-verb` rules are now both at zero.**

## Decisions

**Seventeen of the twenty-two were the same idiom: "in scope".** It is the kind
of phrase a team stops hearing. An L2 reader cannot decode it from its two
words — "scope" is not a place, and "in" does not mean "belonging to" anywhere
else they have met it. Replaced with **"in your area"**, which says the same
thing and can be guessed by someone who knows both words.

**"Being carried out" → "In progress".** A status label should be the shortest
true thing, and the phrasal verb was doing no work.

## Numbers

```
strings rewritten     22 EN + 22 AR
idiom rule            17 → 0
phrasal-verb rule      5 → 0
gate baseline        306 → 266
```

Every remaining violation is now a single rule — `banned-word` — and its shape
is known:

```
84 scope · 20 catalogue · 15 registry · 15 advisory · 14 capability ·
14 reconciliation · 14 supervision · 13 override · 12 json · 12 metadata ·
11 endpoint · 9 mandatory · and a tail of single digits
```

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED, 40 removed, baseline 266
- [x] `idiom` and `phrasal-verb` rules both at zero
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.** Covers T-177 and T-180 to T-186.

## Parked

- `scope` (84) is the last large word. It is mostly the same phrase repeated.
- `json` · `metadata` · `endpoint` · `payload` · `uuid` · `schema` (46 together)
  are the engineering-leak group the original audit named first. They sit on
  admin screens and need the surrounding sentence rewritten, not a word swapped.
- **The 2,370 hardcoded literals with no Arabic remain untouched.**

## Proposed commit

```
feat(copy): remove every idiom and phrasal verb from user-visible copy
```
