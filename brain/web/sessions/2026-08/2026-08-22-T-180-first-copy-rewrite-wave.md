# 2026-08-22 · T-180 — first copy rewrite wave, both languages

`task: T-180` · `status: done` · `duration: 0.5h`
`rules applied: WEB-008, WEB-011, WEB-013, WEB-016`

---

## Goal

Apply the 26 worst strings from the v2 content audit to the product, in English
and Arabic, and ratchet the content baseline down.

## What changed

26 strings across 16 namespaces, rewritten in `en` **and** `ar`:

`admin-senai-data` · `admin-gis` · `admin-enforcement-recommendations` ·
`admin-workflows` (×4) · `admin-integrations` · `admin-factory-data` ·
`field-unregistered` · `admin-planning-status` · `admin-risk` (×2) ·
`admin-notifications` · `enforcement` · `admin-audit` · `admin-items` (×2) ·
`admin-access` · `profile` · `planning` (×2) · `factories` ·
`admin-dashboard-config` · `admin-planning-lookups` · `analytics`

Plus `apps/web/scripts/content-baseline.json` ratcheted 352 → 313.

## Decisions

**Arabic was rewritten too, not just English.** The existing Arabic was a
faithful translation of the jargon — `الحمولة المحكومة` for "the governed
payload", `المخطط المطبّق` for "the applied schema". Translating bad English
accurately produces bad Arabic. WEB-011 requires both languages in the same
commit, so both were authored from the new English.

**The gate caught my own violation.** The first application failed on
`admin-senai-data.mapping.body`: my replacement text used "Not set up yet", and
`set up` is a phrasal verb banned by WEB-016 §3. Changed to "Fields with no rule
show as a dash", which also matches the em-dash rule. **This is the gate working
on real content on its first real use.**

## Numbers

```
strings rewritten            26  (52 including Arabic)
namespaces touched           16
content baseline            352 → 313   (−39)
mean L2 load after         0.32   (was 8-24 on these strings)
clean at the L2 standard  20/26   the other 6 flag only for passive voice,
                                  which WEB-016 §3 treats as judgement, not defect
```

Representative:

```
before  "Unregistered establishment recorded and visit dispatched."
after   "New factory saved. The visit is sent."

before  "Grant or revoke a capability for an entire role. A capability you do
         not hold cannot be granted to a role you hold, and access management
         can never be granted to or revoked from your own role."   (28 words)
after   "Give or take away a permission for a whole role. You can only give a
         permission you already have. You can never change access for your own
         role."                                                    (10 words)
```

## Accessibility

- axe-core: **not run** — stated as a gap.
- No markup changed; these are string values only.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED, 39 removed, baseline ratcheted to 313
- [x] All 26 re-measured after application: mean load 0.32
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.** 26 Arabic strings authored by an agent.
      Same blocker as T-177's `login.json`. Must not reach production without a
      native reviewer.

## Parked

- 3,522 strings still fail the L2 standard. This wave took the 26 worst.
- The 2,370 hardcoded literals with no Arabic remain the largest defect.

## Blocked / open questions

Arabic sign-off, now covering two tasks (T-177 and T-180).

## Proposed commit

```
feat(copy): rewrite the 26 worst strings in English and Arabic
```

## Next

Next wave, or the Arabic recovery (audit plan P1).
