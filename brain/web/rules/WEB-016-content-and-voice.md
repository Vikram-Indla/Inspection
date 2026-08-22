# WEB-016 — Content & Voice Contract

> Status: **BINDING**. Governs every user-visible word in `apps/web`, in both
> languages. Sits beside WEB-013 (where copy lives) and WEB-014 (how copy is
> rendered) — this rule is about **what the words are**.
> Enforced by `npm run gates:content` (static, ratcheted).
> Word list: `apps/web/scripts/content-vocabulary.json` — owned by the content
> lead, not by engineering.
> Evidence: `Inspection Documentation/05_UI_UX_AND_STORYBOARDS/Inspection-Platform-Content-Audit-v2-2026-08-22.xlsx`

---

## 1. Who reads this application

Staff of the Ministry of Industry & Mineral Resources, in Riyadh. **Arabic is
their first language. English is their second, and for many of them it is
elementary.** An inspector reads it on a phone inside a plant. A planner reads
it against a deadline. A reviewer reads it before signing a decision they will
have to defend.

None of them are the person who wrote the code.

## 2. Why the previous measure was wrong

The first audit of this application scored readability with Flesch-Kincaid. FK
counts syllables and is calibrated on **native US schoolchildren**. It reported
909 failing strings and a target of "reading grade 8".

Both numbers were wrong, because a second-language reader fails on different
things. They trip on low-frequency words, phrasal verbs, idioms and stacked
clauses — not on syllables. *Waive* is one syllable and far harder than
*information*. Re-measured against vocabulary frequency, **3,548 strings fail,
not 909.** Almost four times as many.

**Do not reintroduce a syllable-based readability score for this application.**

## 3. The standard

**Vocabulary.** Every word must be one of:
- in the **top 5,000** most common English words, or
- in the **job glossary** (§4), or
- in the **interface glossary** (§4), or
- a proper noun.

Anything else is replaced, or taught once on first use on that screen.

**Sentences.** 15 words maximum. One idea per string. Two ideas means two
sentences.

**Never.** Phrasal verbs (*set up*, *carry out*, *check in*, *work out*).
Idioms (*in place*, *up to date*, *at a glance*). Formal connectors (*unless*,
*whereas*, *notwithstanding*, *pursuant to*) — use *if*, *but*, *so*, *until*.

**Acronyms.** Expanded on first use on every screen. CR, SLA, GIS, AI and CSV
all fail this today.

**Errors name the next action.** "Not correct" is not an error message. Say what
to do about it.

**Nothing to show is an em dash.** Never `N/A`, never `null`, never
*not configured*.

**Passive voice is a signal, not a defect.** "You were signed out" and "The link
was broken" beat their active rewrites. Judge each one. Do not convert
mechanically — the gate does not check passive voice for exactly this reason.

## 4. Two glossaries, and the difference between them

**The job glossary is allowed.** These are the words the job itself teaches:
*inspection · inspector · factory · establishment · licence · violation ·
compliance · evidence · penalty · visit · planner · schedule · reviewer ·
approval · enforcement · regulation · ministry · risk · score · weights ·
bands · deadline · timer · calendar · workflow · zone · region.*
Staff learn these on the job. Explain each once, then use it freely.

**The banned list is not.** These are engineering and legal words the job does
**not** teach: *governed · read-only · reconciliation · capability · payload ·
schema · endpoint · UUID · JSON · metadata · docket · registry · immutable ·
adjudication · disposition · contravention · pursuant.*

The distinction is the whole rule. **A word is allowed because the job teaches
it, not because the team is used to saying it.** `governed` appears 92 times in
this application. It is the team's word, not the reader's.

## 5. Arabic is the primary text

For this audience English has a ceiling that no rewrite raises. **30% of the
application — 2,370 strings — is hardcoded English with no Arabic at all**
(WEB-013 is the rule they break). That is the largest content defect in the
product, and it outranks every readability finding.

Arabic is **authored from the English, never machine-translated**, and every new
or changed Arabic string needs a native reviewer's sign-off before release. An
agent may draft Arabic. An agent may not approve it.

## 6. The gate

```bash
npm run gates:content              # check
npm run gates:content -- --update  # lower the baseline after an improvement
```

Ratcheted per namespace per rule, exactly like `gates:typography`: existing debt
does not block, **new violations do**. Baseline
`apps/web/scripts/content-baseline.json`; it only ever moves down.

Rules checked: `banned-word` · `phrasal-verb` · `formal-connector` · `idiom` ·
`long-sentence` · `empty-state` · `no-arabic`.

Each failure names the replacement, so the fix is in the error message:

```
[banned-word]
  admin-risk.banner.body
    "governed" — say "set by rules / official"
```

**Known limit.** The gate reads `src/i18n/locales/en/*.json` only. The 2,370
hardcoded literals are invisible to it, because they are invisible to the
translation system — which is the point of §5. A scanner for those is parked.

## 7. Adding a word to the list

Edit `apps/web/scripts/content-vocabulary.json`. It is data, not code, so the
content lead owns it without an engineering change. Adding a banned word makes
the gate reject it in any **new** string; it does not retroactively fail the
existing baseline.

Removing a word from the banned list is a decision, not a convenience. Record
why in the task record.

## 8. Review gate — answer these in the session record

1. Every new user-visible string: which glossary does each non-common word come
   from, or where is it taught on first use?
2. Longest sentence you shipped, in words.
3. Did you add Arabic? Was it authored from the English or translated? Who is
   signing it off?
4. Does every error message you touched name the next action?
5. `npm run gates:content` output, pasted.
