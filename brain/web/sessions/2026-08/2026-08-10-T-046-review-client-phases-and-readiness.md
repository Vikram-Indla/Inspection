# 2026-08-10 · T-046 — `/planning/bulk` slice 4 (part 1): review phases + readiness

`task: T-046` · `status: done — every section migrated; review.css deleted`
`duration: 1h` · `rules applied: WEB-000, WEB-002 §2, WEB-003, WEB-008, WEB-009, WEB-011`

---

## Goal

Begin slice 4 by migrating the parts of `ReviewClient` that are self-contained
and highest-impact — the seven phase screens and the readiness rail — leaving
the app compiling at every step.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/planning/bulk/review/ReviewClient.tsx` | reduced | 855 → **743** |
| `app/(app)/planning/bulk/review/review.css` | rules deleted | 119 → **82** |
| `components/sections/planning-bulk/review-standby/**` | created | — → 78 + 6 |
| `components/sections/planning-bulk/review-outcome/**` | created | — → 130 + 74 |
| `components/sections/planning-bulk/review-readiness/**` | created | — → 87 + 63 |
| `i18n/locales/{en,ar}/planning.json` | extended | +1 key (`unavailableTag`) |

## Numbers

```
ReviewClient.tsx        855 → 743 lines
legacy sq-/cd- classes  231 → 162
inline style={{}}        52 → 28
emoji-as-icon glyphs     13 → 0     (BLK_META's ▣ ◆ ▲ ⟳ ● and ✓ ✕ ◌)
app/icons imports         1 → 0     (IconLock)
SAQEEL imports            0 → 4
review.css              119 → 82 lines, 21 rules deleted, braces balanced
```

## Decisions

**Sections were migrated as whole, shippable units, not top-to-bottom.** The
seven phase screens (`loading`/`unavailable`/`scope`/`empty`/`publishing`/
`failure`/`success`) are early `return`s with no coupling to the review-phase
derivations, so they extract cleanly and are what a user actually sees on load,
on failure and on success. The readiness rail followed because it is the
blocker-first signature of the screen. Everything below it — context card,
eligibility partition, targets table, evidence ledger, consequence ledger,
corrections and the publish action — is **untouched legacy**.

**Blocker severity is now text plus shape, not a glyph plus a colour class.**
`BLK_META` carried thirteen decorative glyphs (▣ ◆ ▲ ⟳ ●) beside a
`cd-blocker--critical|warning|unavailable` colour class. Both are gone: each
blocker renders a `StatusPill` whose tone **and label** state the severity, so it
survives greyscale. `BLK_META` now carries only what is behavioural — the tone
and which correction the Fix control performs.

**Two tokens were missing and were raised, not invented (WEB-002 §2).**
`--sqx-surface-danger` and `--sqx-surface-success` do not exist, so the outcome
badge does not tint its background; the icon differs per outcome (lock / X /
check) and the heading states the outcome, so the state is still carried by more
than colour. This is the **third** raised token gap on this screen after
`--sqx-opacity-muted` (T-048) and the busy-opacity token.

## Defect found, not caused — and it is on the screen the owner screenshotted

`criteria-builder.module.css:68` reads `flex: 0 1 var(--sqx-grid-min-xs)`.
**`--sqx-grid-min-xs` is not defined in `saqeel.css`** — only `-sm`, `-md` and
`-lg` exist. An undefined custom property makes the whole `flex` declaration
invalid, so it is dropped: `.fieldNarrow` has no flex basis at all. That is part
of why the criteria builder's Field/Operator/Value row does not lay out, and it
is **independent of the cache corruption**. It shipped in T-050 (`5e71b4f3`) and
has never been rendered. Fixing it needs a ruling on which existing rung it
should use, or a new token — a change request, not an inline edit.

## Mistakes made in this session

- **A CSS rule-splitter written on `split(/\}\s*\n+/)` corrupted `review.css`** —
  119 lines became 157 and two orphan rules survived, because that pattern
  cannot see nested or compound rules. Caught by re-running the orphan check
  rather than trusting the line count, restored with read-only
  `git show HEAD:<path>`, and rewritten as a brace-depth scanner. **A regex is
  not a parser; verify the output, not the exit code.** Second recorded instance
  of a regex damaging a file on this route (the first stripped every blank line
  from `page.tsx` in slice 1a).
- **A helper was deleted while a not-yet-migrated section still used it.**
  Removing `mark()` with the readiness rail broke the consequence ledger, which
  still renders legacy markup. Typecheck caught it; it should have been checked
  before the edit, not after.

## Accessibility

- Blocker severity no longer depends on colour or on a decorative glyph.
- The success/failure headings keep their `tabIndex={-1}` refs and `role`, so the
  existing focus-on-outcome behaviour is preserved exactly.
- The out-of-scope and empty phases moved from a hand-built `sq-state` block with
  a `◌` glyph to `EmptyState` with a registry icon and a `Button` action.
- axe **not run** — no authenticated session.

## Verification

- [x] `npm run typecheck` — clean after each unit
- [x] `review.css` brace balance checked (37/37) and re-scanned for orphans
- [ ] **No dev server was started, deliberately** — see the tracker's standing
      rule. Verification this session is static only, and a render pass on
      `/planning/bulk/review` is owed.
- [ ] Definition of Done — not met; the screen is part-migrated

## Retirement

`review.css` is down 37 lines but is **not** deletable: 40-odd classes are still
consumed by the six unmigrated sections and by `EvidenceLedger.tsx`.

## Parked

- **`EvidenceLedger.tsx` (128 lines, 0 SAQEEL imports) is untouched.**
- **`ReviewClient` still has zero `t()` calls of its own.** Everything it renders
  comes through the `strings` prop, which is now fully bilingual — but any string
  hardcoded inside the six remaining sections is still English-only.
- **`review/loading.tsx` is still `RouteLoading`.**

## Blocked / open questions

`--sqx-surface-danger` / `--sqx-surface-success`, and a ruling on what
`--sqx-grid-min-xs` should have been.

## Proposed commit

```
refactor(planning): move review phases and readiness onto saqeel
```

---

## Part 2 — the remaining six sections

| File | Action | Lines |
| --- | --- | --- |
| `review/ReviewClient.tsx` | reduced | 743 → **647** |
| `review/EvidenceLedger.tsx` | rebuilt on the shared ledger | 128 → **112** |
| `review/review.css` | **DELETED** | 119 → 0 |
| `review-context/**` | created | 140 + 60 |
| `review-targets/**` | created | 128 + 33 |
| `review-eligibility/**` | created | 53 + 28 |
| `review-assignment-split/**` | created | 44 + 33 |
| `review-consequence-ledger/**` | created | 91 + 82 |
| `review-publish-form/**` | created | 104 + 39 |

```
ReviewClient.tsx        855 → 647 lines
legacy sq-/cd- classes  243 → 0        (incl. EvidenceLedger)
inline style={{}}        52 → 0
native select/table/textarea 5 → 0
app/icons imports         1 → 0
emoji-as-icon            25 → 0
review.css              119 → DELETED
```

**`EvidenceLedger` reuses the consequence ledger rather than being a third
copy.** Both render the same four-group / marked-row shape; the Rule of Two says
the second occurrence extracts. `ConsequenceGroups` is now the shared
presentation and `ReviewConsequenceLedger` is its card wrapper. The mark set
gained `blocked`, which the evidence ledger needs and the consequence ledger
does not.

**Governed single-value selects use T-049 disabled options.** Visit type and
mode list every governed option with the unavailable ones `disabled` and carrying
`notBulkYet` as their note — "recorded but unavailable" stays visible and
announced instead of being silently absent. Their handler is named
`keepGovernedValue` rather than an anonymous no-op, because the name is the
explanation.

**The window controls stayed `datetime-local`.** Swapping them for a
`TextInput` would have been a regression — a text box where a date-time picker
was. `DateRangePicker withTime` is the right primitive and needs its own strings
in both locales; that is a follow-up, not something to fake here. They are the
only native controls left on the route and they are styled from the screen module.

**The disabled publish button lost `aria-describedby`.** `Button` exposes
`controls` but no `describedBy`, so the blocking reason now rides in the
buttons accessible name instead. Arguably better for a disabled control — the
name says why — but it is a primitive gap, recorded below.

### Two more mistakes in part 2

- **A brace-matched deletion of `rowEvidence` cut the wrong span** and left the
  evidence derivations duplicated, which only surfaced as
  `Cannot redeclare block-scoped variable`. Typecheck caught it; the second
  attempt walked the braces line by line and verified the call-site count was
  zero first.
- Same class of error as the CSS splitter earlier in this session. **Three
  regex/offset edits, three failures.** Anything structural in this codebase
  should be edited by locating a unique anchor and verifying the result, never by
  computing an offset and trusting it.

## Part 3 — owner ruled: close every gap

The owner ruled that the raised gaps should be filled rather than carried. All
four are closed, plus two defects the first render exposed.

**Three tokens added to `saqeel.css`, with measured contrast:**

| Token | Light | Dark | Ratio against its text token |
| --- | --- | --- | --- |
| `--sqx-surface-success` | `--sqx-success-lighter` | `--sqx-green-950` | **6.89** light · **12.22** dark |
| `--sqx-surface-danger` | `--sqx-error-lighter` | `--sqx-error-darker` | **9.51** light · **6.11** dark |
| `--sqx-grid-min-xs` | `11rem` | — | n/a |

Every pairing clears AA at normal text size. `--sqx-grid-min-xs` closes the
T-050 defect: `criteria-builder.module.css:68` referenced it, so `flex` was
invalid and dropped, and `.fieldNarrow` had no basis — part of why the criteria
builder did not lay out.

**`Button` gained `describedBy`.** `controls` was the wrong ARIA relationship
for "why is this disabled". The bulk publish button now points at its own reason
element again, restoring what the legacy markup had.

**The review window is a `DateRangePicker withTime`.** The last two native
controls on the route are gone; 11 picker strings were added in both locales.

### Two defects the first authenticated render exposed

- **The criteria URL was raw JSON.** `serializeCriteria` put
  `{"k":"g","c":"all","n":[…]}` straight into `?ct=`, which percent-encodes into
  an unreadable wall in the address bar. It is now **base64url**: 108 characters
  became 92, and it is opaque rather than ugly. `parseCt` tries the encoded form
  first and **falls back to raw JSON**, so every link shared before today still
  parses. The encoder is UTF-8 safe via `TextEncoder`/`TextDecoder` — criteria
  values can be Arabic, and `btoa` alone would have thrown on them.
- **Clicking a factory name navigated away.** The legacy table opened
  `/factories/<id>` with `target="_blank"`; my rewrite dropped it silently, so
  the targeting screen was replaced and read as "the screen goes blank". A
  behaviour I removed without noticing, restored.

**Both routes gained `error.tsx`.** Neither had one, so any client error blanked
the subtree with no state at all — which is exactly how the above was
experienced. `RouteError` now renders a titled state that says nothing was
selected, saved or published.

## Part 4 — raw labels

The first authenticated render showed `active` in the criteria value dropdown
and `eligible` / `high` / `complete` in the table pills — raw database values and
lower-case legacy `t()` defaults.

- `fieldOptions` changed from `Record<string, string[]>` to
  `Record<string, SuggestionOption[]>`. **The value stays the raw DB string**, so
  `evalNode` and every existing `ct` link are untouched; only the label changes.
- `planning.bulk.enumLabel` holds 23 governed values in both locales
  (`active`, `high`, `under_construction`, `non_compliant`, …). Anything not in
  it falls back to separator-stripped sentence case, which is honest for
  DB-driven values like region and city rather than inventing a translation.
- English pill copy sentence-cased: `Eligible`, `Duplicate — active visit`,
  `Complete`, `Unknown risk`, `No location — dispatch blocked`, `Synced {d}`,
  and risk bands `High`/`Medium`/`Low`.

## The "no results" report — not reproduced

The criteria pipeline was tested end to end by executing the real module with
`node --experimental-strip-types`:

```
serialize → parseCt round-trip   : equal
legacy raw-JSON ct               : still parses
hasCriteria(parsed)              : true
evalNode against a matching row  : true
emptyTree hasCriteria            : false
```

**The base64 change did not break matching.** A correction to the slice 1b
record: it claimed `distinctValues` "now trims before de-duplicating" — it does
not. `recordedText` trims only to test emptiness and returns the **untrimmed**
value, so suggestions and the evaluator agree. That parked note was wrong.

What could still produce zero rows, in order of likelihood: an unfilled value in
a condition (a blank leaf invalidates the whole `ct`, which renders as *Criteria
could not be read*), or a scope query returning nothing. **This needs one
observation to settle: the address bar plus what "In scope" reads.**

## Part 5 — the blank screen was never a crash

Reported five times as "the UI goes blank when I select a factory". Four
diagnostics were added on the assumption it was a React error — a route
`error.tsx`, a client `ErrorBoundary` around both islands, `global-error.tsx`,
and window-level `error`/`unhandledrejection` listeners. **All four correctly
reported nothing, because nothing threw.**

Instrumenting the geometry found it in one pass:

```
focusin  MAIN                docH 2846  winH 645  scrollY 0      ← before the click
focusin  INPUT.choice_input  docH 2846  winH 645  scrollY 1758   ← after
DOCUMENT SCROLLED           docH 2846  mainScroll 1736  mainScrollH 3146
```

**The document was already scrollable at rest.** The shell is 645px with
`overflow: hidden`, so everything past 645 is empty canvas. Clicking focused the
checkbox; the browser scrolled every scrollable ancestor to reveal it — `main`
(correct) and the document (should have been impossible) — parking the viewport
at 1758, below the shell. The page rendered perfectly the entire time.

**Fix:** `.shell` was `block-size: 100dvh; overflow: hidden` — right height,
still **in flow**, so any descendant escaping the clip grew `<body>` and gave the
page a second scroller. It is now `position: fixed; inset: 0`, which is what the
2026-08-07 shell decision has always claimed ("`.sqx-shell` is
`100dvh`/`overflow:hidden`, `.sqx-shell__main` owns `overflow-y`"). The document
cannot scroll; `main` is the only scroller.

**Blast radius: every authenticated route.** One rule in the app-shell module.
Nothing inside the shell should rely on document scroll, but this was not
verified beyond `/planning/bulk`.

**Regression guard:** `e2e/shell-single-scroller-contract.spec.ts` asserts on
four routes that the document is unscrollable at rest **and** that focusing the
last control in `main` leaves `window.scrollY` at 0. This class of defect is
invisible to typecheck, lint and axe — only geometry catches it.

### What this cost, and the rule that comes out of it

Five rounds, four wrong fixes, one corrupted `.next` cache. Every attempt
assumed "blank screen" meant "something threw". **Before instrumenting a
failure, establish that the failure is what it looks like** — one geometry probe
would have found this immediately, and it was available from the first report.

The boundaries added along the way stay: `global-error.tsx` and both route
`error.tsx` files did not exist, which is a real gap under WEB-000 §9 and
`web.md`. They were not the cause and they are not wasted.

## Gaps remaining

None raised by this task.

## Next

Slice 5 — `actions.ts` (846 lines) and moving `criteria.ts` out of the route
directory. The review screen itself is done.
