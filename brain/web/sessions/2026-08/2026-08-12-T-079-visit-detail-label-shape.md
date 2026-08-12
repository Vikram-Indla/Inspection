# 2026-08-12 · T-079 — `/visits/[id]` label shape: humanised enums, and four defects T-078 introduced

`task: T-079` · `status: done` · `duration: ~40m`
`rules applied: WEB-000 §9, WEB-008 §2, WEB-011, WEB-013`

---

## Goal

Owner-reported on the rebuilt screen: raw enum labels (`published`,
`periodic · physical`) and a History card that repeats itself. Use the existing
humanisation helper rather than a local `replace`.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/visits/[id]/page.tsx` | `enumLabel` now `sentenceCase(t(…, humaniseEnum(value, locale)), locale)` |
| `components/visits/visit-detail/visit-detail.tsx` | history card strings, location empty state, plan status/count pair |
| `i18n/locales/{en,ar}/visits.json` | 3 headings rewritten, 5 keys added, 1 deleted, 12 values re-cased |

## Decisions

**The helper already existed and I had written a worse copy of it.**
`lib/text.ts` exports `humaniseEnum(value, locale)` and `sentenceCase(value,
locale)`, and `features`/`operations` has used
`sentenceCase(t(\`enum.${v}\`, humaniseEnum(v)))` since T-042. My route used
`t(\`enum.${value}\`, value.replace(/_/g, " "))` — the same idea, missing the
sentence-case, which is exactly why `published`, `periodic · physical`,
`pending supervision` and `not started` rendered lowercase.
**Search for the helper before writing the fallback.**

**Four defects in T-078's own output, all the same shape: a string used in a slot
it was not written for.**

1. **The History card printed its own title twice.** I passed
   `V.detail.auditHeading` as the card title *and* as the fourth section's
   heading, so "Planning history — cannot be edited, only added to (latest 30)"
   appeared at both levels.
2. **"No journey yet." was the empty state for Location & provenance.** I reused
   `noJourney` for a section that is not the journey. Added `noLocation`.
3. **Four sections each carried their own immutability caveat** — "append-only",
   "cannot be edited", "cannot be edited, only added to" — so the card said the
   same thing four ways. Now stated once as the card description, and the
   sections are named for what they are: Lifecycle · Location & provenance ·
   Journey · Planning changes (latest 30). The `(latest 30)` cap survives because
   it is a fact about the read, not a caveat.
4. **Prose fragments were reused as definition-list labels.** `"Assignment:"`,
   `"created by"`, `"published"`, `"review:"` and `"window"` were written for
   sentences (`Assignment: X`) and I put them in `<dt>`, so the list read
   *window · Configuration · Assignment: · created by · published*. Stray colons
   removed, all labels sentence-cased.

**`{n} visits under this plan` was a label containing a count, and it
mispluralised.** With one sibling it read *"1 visits under this plan"* — and a
`<dt>` should not carry data at all. Split into `Status = Pending supervision`
and `Visits under this plan = 1`, which fixes the plural by construction and puts
the number where values go. The interpolated key was deleted as dead copy.

**Twelve standalone state values were lowercase beside humanised enums.**
`unassigned`, `no review`, `not submitted`, `append-only audit trail`,
`review engine`… all sat in the same pill row or definition list as *Pending
supervision*. These are resource strings, so `sentenceCase` never touches them —
they had to be re-cased at the source. Arabic is unaffected (no case), so only
`en` changed, and the two Arabic strings carrying a trailing colon were fixed.

**Scope check: this was one site, not a sweep.** `replace(/_/g, " ")` still
appears in `visits/calendar`, `visits/map`, `operations/CancellationQueue`,
`operations/Monitoring` and a dozen `admin/*` screens — **all routes this
programme has not migrated**. Within the four routes migrated this session the
only raw-fallback site was this one. Not claimed as fixed repo-wide.

## Numbers

```
raw enum fallbacks in migrated routes   1 → 0
duplicated card/section headings        1 → 0
wrong empty-state strings               1 → 0
immutability caveats in one card        4 → 1
labels with stray colons                2 → 0
lowercase-initial standalone values    12 → 0
mispluralised counts                    1 → 0
i18n keys                             142 → 143 (5 added, 1 deleted, both locales)
```

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates` — typography PASSED, **44 removed**, zero new
- [x] i18n parity asserted by script — **143/143**
- [x] **Rendered signed in.** Definition list reads *State · Latest verified
      event · Source of truth · Allowed from here · Window · Configuration ·
      Assignment · Linked plan · Created by · Published · Status · Visits under
      this plan*, with **zero** stray colons, **zero** lowercase-initial labels
      and no `1 visits`. Pills: *Pending supervision · New · Unassigned · Not
      started · No review*. Configuration reads **Follow up · Physical**.
      History: one title, four distinctly named sections, each with its own
      correct empty sentence.
- [ ] axe, 320 px, keyboard, Arabic render — still owed from T-078

## Parked

- The unmigrated routes listed above still use a local `replace(/_/g, " ")`.
- 26 `enum.*` values have no `ui_strings` row, so they are humanised from the
  column rather than translated — they now read *Follow up*, *Physical*,
  *Pending supervision* in Arabic too. **Humanisation is not translation**; the
  app-wide `enum.*` gap from T-077 is unchanged and is what would fix it.

## Blocked / open questions

**5 new Arabic strings need review** on top of T-077's 115 — `historyTitle`,
`historyDescription`, `noLocation`, `planStatus`, `siblingsLabel`.

## Proposed commit

```
fix(visits): humanise enum labels and repair the history card copy
```
