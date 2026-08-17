# 2026-08-17 · T-134 — merging the component ledger's two divergent copies

`task: T-134` · `status: done` · `duration: ~1h`
`rules applied: WEB-007 (the ledgers are the memory), WEB-002 §9`

---

## Goal

Repair `04-COMPONENT-LEDGER.md`, found by T-133 to contain two divergent copies of
itself. Merge them without losing a row.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `brain/web/04-COMPONENT-LEDGER.md` | two copies merged into one | 574 → 351 |

**177 unique rows recovered. 0 lost. 0 duplicated.**

## Why this mattered

This is the file whose entire job is *never build what already exists*. It had
been appended to itself, so the same component appeared twice with different
notes:

```
line  24   | `Button` | inherited | **`name` / `value` (T-040)**: a form with more than one outcome…
line 251   | `Button` | inherited | accepts `className` — must lose the escape hatch…
```

A reader who scrolled past the halfway point got stale facts about rows the first
half described correctly — and the ledger is consulted precisely by people who do
not already know the answer.

## The merge was not "pick the newer copy"

My first two readings of the file were both wrong, and the sequence is worth
keeping because each correction came from measuring rather than assuming.

**First guess:** a clean 227-line duplication. Wrong — a naive
`diff <(sed 1,227p) <(sed 228,454p)` said DIVERGENT, but the offset was
misaligned.

**Second guess:** copy A newer, copy B older, take A. Wrong — B is *longer*
(295 section lines vs 227) and holds **86 rows A never had**.

**What it actually was**, from the heading map:

```
1–228    copy A: title + preamble + all sections, incl. the newest T-126 rows
229–246  the preamble AGAIN
247–541  copy B: sections only — 173 rows, no title
542–574  tail: "Adding a row" + the T-111/T-122 additions (unique to neither copy)
```

So **neither copy was a superset**. The decision had to be made per row, and a
full key-set comparison is what made that safe:

```
A rows 91 · B rows 173 · union 177
only in A   type · route-error · dashboard/enforcement-trend · dashboard/executive-brief
only in B   86 rows (regulations, enforcement, approvals, factories workspaces)
shared 87   of which only 2 differ: Button, date-range-presets — A longer in both
```

For those two, A was verified to carry **every** fact B had before B was
discarded. `Button`: A contains B's text verbatim plus the T-040 `name`/`value`
note. `date-range-presets`: B's body is *not* verbatim inside A, so each
distinguishing phrase was probed individually —
`Calendar periods are deliberately absent`, `windowDateRangePresets`,
`seven, three and zero`, `T-021d` all present in A, which additionally has
`PAST_DATE_RANGE_PRESETS` and T-041.

**Length is not evidence of supersession.** Checking phrase-by-phrase is what
turned "A looks fuller" into "A loses nothing".

## The merge

Base = copy B's sections (173 rows). Then:

- A's `Button` and `date-range-presets` rows substituted in (A supersedes both)
- A's `type` inserted before `icon-button`, `route-error` after `trend-bars` —
  the two tables' row order was compared first and matches exactly, so the
  insertion points were unambiguous
- A's `dashboard/enforcement-trend` and `dashboard/executive-brief` appended to
  the end of the screen-sections table, where A had them
- A's title and preamble kept; the duplicated preamble at 229–246 dropped
- The tail kept intact

Every anchor line was asserted to be the expected row **before** any write — a
mismatch exits rather than merging blind.

```
inserted type: true · route-error: true
Button rows swapped: 1 · presets swapped: 1
rows after: 186   (177 union + 9 in the tail's T-111/T-122 sections)
duplicate keys: 0 · keys lost: 0 · duplicate headings: 0
lines: 574 → 351
```

The 186 rather than 177 is expected and was checked: the tail's
`charts/`, `use-media-query`, `breadcrumb` and T-122 sections carry 9 rows that
were in neither main copy.

## A guard against recurrence

The duplicate **headings** were the only visible symptom of a 223-line
duplication, and they are invisible in a table that long. The ledger now opens
with a banner recording the incident and one instruction: search for the row
before appending, edit in place if it exists, and never paste a section whose
heading is already present.

## Verification

- [x] 0 duplicate row keys
- [x] 0 keys lost against the union of both copies
- [x] 0 duplicate headings; every section heading appears exactly once
- [x] The 4 carried-over rows and the 2 superseded rows each appear exactly once
- [x] Row order in the primitives table spot-checked (`type` first,
      `route-error` after `trend-bars`)
- [x] `Button` retains T-040; `date-range-presets` retains `PAST_DATE_RANGE_PRESETS`
- n/a gates — no product code touched

## The other brain files were checked, not parked

Swept all five for the same shape. **Zero duplicate headings anywhere**, so no
other file carries the ledger's structural duplication.

But the sweep surfaced something else, and it is worse than recorded:

```
02-SESSION-LOG.md — duplicate task IDs
T-026  /factories snapshot hero        vs  /enforcement-library
T-027  /factories compliance           vs  Five-route rebuild + Jira canon
T-046  FOUR different /planning/bulk slices, all numbered T-046
T-077  delete the dead planning tree   vs  /visits/[id] bilingual resources
T-078  repair the responsive spec      vs  /visits/[id] read surface
```

These are **genuine ID collisions, not double-logged rows** — each pair carries a
different title describing different work. `01-PROJECT-STATUS.md` calls the
T-076 incident *"the third ID collision"*; it is actually **6 IDs across 13
rows**, and T-046 was used **four times**.

That document already prescribed the fix — *claim the ID in the tracker at the
start of a task* — and noted that nothing implements it. The prescription is now
being followed by hand (T-127…T-134 each advanced "Highest id in use" before
starting), but there is still no mechanism stopping a concurrent session from
taking the same number. **A prescription nobody can enforce is not a control**,
and the count above is what that costs over ~130 tasks.

## Parked

- **Enforce the ID reservation** rather than prescribing it. Cheapest real
  control: a gate that fails when `02-SESSION-LOG.md` contains a duplicate
  `T-NNN`, which is the one-line grep used above.
- `/dashboard` still has no `h1`; `StatusPill` still defaults `ping` to true.

## Proposed commit

```
docs(ledger): merge the component ledger's two divergent copies
```

## Next

Route work can resume, now that the file route tasks are required to consult is
trustworthy. Suggested first check next session: the session log for the same
duplication shape.
