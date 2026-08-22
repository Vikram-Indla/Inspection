# 2026-08-22 · T-182 — eliminate "visible" and "read-only", both languages

`task: T-182` · `status: done` · `duration: 0.5h`
`rules applied: WEB-011, WEB-013, WEB-016`

---

## Goal

Remove the second and third most-used banned words from every user-visible
string, in English and Arabic.

## What changed

75 English strings across 22 namespaces, plus their 75 Arabic counterparts, plus
3 strings fixed on the way through. Baseline 246 → 206.

## Decisions

**`read-only` becomes "view only", not the vocabulary file's suggested phrase.**
`content-vocabulary.json` suggests "you can read this, not change it" — correct
for prose, far too long for a pill. Short labels take **"View only"**; prose
takes the full phrase. The word list should be updated to say both.

**`visible to you` becomes `you can see`.** The old phrasing described the
system's permission model; the new one describes the reader's situation.
"No accounts are visible to your session" → "You cannot see any accounts."

**Two of the three gate failures were my own replacement text** — a 16-word
sentence and the idiom "up to date". Third real use, third real catch. The gate
is catching its author more reliably than it catches the original copy.

## Numbers

```
"visible" in copy       45 uses → 0   (5 remain as JSON key names only)
"read-only" in copy     30 uses → 0
strings rewritten       78 EN + 78 AR
content baseline       246 → 206   (−40)
```

Cumulative across T-180 to T-182: **352 → 206, 146 violations cleared.**

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED, 40 removed, baseline ratcheted to 206
- [x] Zero "visible" or "read-only" in any English value
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.** Now covers T-177, T-180, T-181, T-182.

## Parked

- Update `content-vocabulary.json` so `read-only` suggests "view only" for
  labels and the long form for prose.
- Top offenders now: `administration` · `operational` · `CR` · `awaiting` ·
  `requests` · `blocked`.

## Proposed commit

```
feat(copy): replace "visible" and "read-only" in both languages
```
