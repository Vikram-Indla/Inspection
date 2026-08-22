# 2026-08-22 · T-185 — every sentence under 15 words

`task: T-185` · `status: done` · `duration: 1h`
`rules applied: WEB-011, WEB-013, WEB-016`

---

## Goal

Rewrite every user-visible string containing a sentence longer than 15 words,
in English and Arabic.

## What changed

63 strings per language across 24 namespaces. Baseline 380 → 306.
**The `long-sentence` rule is now at zero.**

## Decisions

**This is the wave that mattered.** The earlier waves swapped words; this one
changed whether a sentence can be read in one pass. A 25-word sentence is not
hard because of any single word in it — it is hard because the reader has to
hold the whole thing in memory before it resolves.

**Split, do not compress.** The instinct is to shorten by deleting. That loses
governed meaning, which WEB-008 forbids. Every rewrite here keeps every fact and
splits it across sentences instead:

```
before  "No establishment or factory master-data change is sent to SENAI: the
         endpoint contract has no master-data write endpoint, so there is no
         path for one."                                              (25 words)
after   "Nothing is sent back to SENAI. There is no agreed way to write factory
         records there."                                        (two sentences)
```

**My first draft failed its own rule 15 times out of 63.** I self-checked before
applying, found 15 rewrites still over the cap, fixed them, and three of those
were still over on the second pass. Writing short sentences is harder than
recognising long ones — worth knowing for whoever does the next wave.

**The gate caught one more after that** — "sets up" in `admin-risk.trace.desc`,
a phrasal verb in my own replacement text. Fifth wave, fifth catch on the author.

## Numbers

```
strings rewritten       63 EN + 63 AR
long-sentence rule      63 → 0
gate baseline          380 → 306
```

Remaining gate debt:

```
  284  banned-word    CR · scope · advisory · supervision · catalogue
   17  idiom
    5  phrasal-verb
```

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED, 74 removed, baseline 306
- [x] Every sentence in every en string is now 15 words or fewer
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.** Covers T-177 and T-180 to T-185.

## Parked

- 22 idiom + phrasal-verb violations — small and tractable, next wave.
- `CR` (26) — expand on first use per screen.
- **The 2,370 hardcoded literals with no Arabic remain untouched and remain the
  largest defect in the product.**

## Proposed commit

```
feat(copy): split every sentence over fifteen words, both languages
```
