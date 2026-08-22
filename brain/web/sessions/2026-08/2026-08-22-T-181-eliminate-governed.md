# 2026-08-22 · T-181 — eliminate "governed", both languages

`task: T-181` · `status: done` · `duration: 0.5h`
`rules applied: WEB-011, WEB-013, WEB-016`

---

## Goal

Remove the application's most-used banned word from every user-visible string,
in English and Arabic.

## What changed

62 English strings across 24 namespaces, plus their 62 Arabic counterparts, plus
3 Arabic strings whose English never said "governed". Baseline 313 → 246.

## Decisions

**In most strings the word was deleted, not replaced.** "Governed activity" →
"Activity". "View governed records" → "View records". "Governed task
management." → "Task management." The word carried no information for a reader —
it was the team reassuring itself that the data was official. Where it did carry
meaning, it became **"official"** (`Governed reference data` → `Official
reference data`) or the actual rule (`Governed by workflow configuration` →
`Set by the workflow`).

**Arabic used five different words for it** — محوكمة، محكومة، معتمدة، مُنظَّم،
الحاكمة — because five translators each solved the same untranslatable term
differently. All 62 rewritten from the new English, and three more found in
Arabic strings whose English never contained "governed" at all.

**The gate caught me twice more.** First on a 17-word sentence
(`execution.reschedule.noHandoff`), then it stayed clean. Second real use, second
real catch.

## Numbers

```
"governed" in English copy     92 uses → 0
Arabic equivalents             all variants → 0
strings rewritten              65 EN + 65 AR
content baseline              313 → 246   (−67)
```

Top offenders now: `visible` 45 · `read-only` 30 · `administration` 26 ·
`operational` 26 · `CR` 26 · `awaiting` 23.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED, 67 removed, baseline ratcheted to 246
- [x] Zero "governed" remains in `en`; zero Arabic equivalents remain in `ar`
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.** Now covers T-177, T-180 and T-181.

## Parked

3,460 strings still fail the standard. The 2,370 with no Arabic remain the
largest defect.

## Proposed commit

```
feat(copy): remove "governed" from every string in both languages
```

## Next

`visible`, `read-only`, `blocked`.
