# 01 — Project Status

`Last updated: 2026-08-11` · `Updated by: T-064 — /factories visible typography`

## A primitive's gaps only show up during migration (2026-08-11)

T-065 moved 20 `/factories` components onto the type primitives and found three
gaps the inventory had missed, each of which would have caused a silent defect:

1. **`Text` had no `dir`.** Nine call sites carry `dir="auto"` on user data. In
   an Arabic-first app that is correctness, not decoration — without it a mixed
   Arabic/Latin string renders in the wrong visual order.
2. **`role="alert"` collided with `Text`'s own `role` prop**, which names the
   typography role. Added `live` rather than renaming `role` everywhere.
3. **`Heading` could not express a heading that renders small.** A heading's
   semantic level and its visual weight are independent — that is the point of
   `visual`, so it must cover the whole scale, not just the large end.

**A violation count is never worth a real heading.** The portfolio summary was
an `<h2 id>` serving as its card's `aria-labelledby` target; converting it to
`<Text as="span">` satisfied the gate and removed a heading from the document
outline. Reverted, then done properly once `Heading visual="label"` existed.

**Do not change colours while migrating typography.** A regex strip removed
`font: var(--sqx-text-metric)` from the portfolio KPI values with nothing
replacing it — every number would have shrunk 28px → 14px. The fix used
`Metric tone="inherit"` so the status colours stayed exact rather than being
swapped for the `Text` tone family.

Both near-misses were caught by **measuring the render, not reading the diff**.

## A typeface can be decided by something absent (2026-08-11)

T-064 found the factory name on `/factories` rendering in **Arial**.
`button.factories-portfolio_select` never declared `font: inherit`, so it took
Chrome's UA button default of 13.33px Arial, and the `.name` span inside set
only `font-weight` and inherited it. The most important string on the route, in
a different typeface from the rest of the application.

**Nothing in the source looks wrong.** There is no bad value to grep for, no
token misused, nothing for the gate to flag — the defect is a *missing*
declaration. With T-058's `--sqx-font-sans` bug this is now a pattern, and the
rule that follows is: **`button`, `input`, `select` and `textarea` do not
inherit `font`. Any of them carrying text needs `font: inherit` or an explicit
role.**

**Measure the alternative before committing to it.** `subheading` (16px) was
tried for the picker row and reads as obviously correct in source; measured, it
added a fifth size to the route and rendered the same factory name at 20px, 16px
and 14px on one screen. `body-strong` keeps `/factories` at the same four sizes
as `/dashboard`.

**A gate rule can flag but must not auto-fix.** The five `eyebrow` call sites
needed three different answers — a subtitle in the wrong slot, a **title** in
the wrong slot, and a provenance line whose card already had a description.

## Deleting a panel is a contract change (2026-08-11)

T-062 removed the Operational priorities panel on an owner ruling, after T-060
had refused to remove it unilaterally because two e2e specs asserted it as a
**canonical panel**. Two rules came out of doing it properly:

1. **Move the information before deleting the container.** The panel's summary and
   governance footnote now live on Today's operations. A card can be redundant
   while the sentences inside it are not.
2. **A spec update records the deletion; it does not drop the assertion.** The
   heading is asserted at **count 0** *and* both moved strings are asserted
   visible, so the contract states what went and what survived. Deleting the
   line instead would have left the contract silent.

**Do not re-baseline the typography ratchet as a side effect, and do not claim
another agent's improvement.** During T-061/T-062 the gate reported "7
violation(s) removed since the baseline" and invited `gates:typography:update`.
Neither task touched a single typography declaration — the removals came from a
**concurrent typography pass sharing the same uncommitted working tree** (27 files
under `components/sections/factories/**`, `saqeel/definition-list/` and
`app/(app)/factories/**`). Two rules: read a gate's delta against `git status`
before attributing it, and never re-baseline a ratchet mid-pass on someone
else's work. A green gate needs no re-baseline, because the ratchet only fails on
additions.

## Colour is a claim (2026-08-11)

T-061 found the enforcement trend colouring a fall in penalty notices `success`
and a rise `warning`, one line below a comment insisting the movement "is a
signal to read, not a score". Fewer penalty notices can mean improved compliance
or reduced enforcement coverage; the screen cannot know which, and the executive
brief on the same screen promises it "does not attribute a cause".

**A tone is a governed judgement, and CLAUDE.md §9 bans inventing one.** Three
rules follow, all of them now in code with the reasoning attached:

1. **Neutral until the ministry publishes a direction.** Movement gets a
   magnitude and a period, never a verdict. The reasoning lives in the function's
   doc comment, because a future agent will otherwise restore the colour as a
   nice touch.
2. **A tone applied to a series paints every point.** The decline was drawn by
   colouring the *previous* period — the one with more enforcement — green.
   Check what a tone lands on, not just what it means.
3. **Zero is not a small quantity.** `TrendBars` floored every bar at 4px in the
   value colour, so a period with no enforcement looked like a period with a
   little. A zero point is now a dashed baseline with a printed `0`.

**A chart also needs its labels visible, not only announced.** The period dates
existed solely in `sqx-visually-hidden`, so a screen-reader user could tell which
bar was the current period and a sighted user could not — the approved design had
specified a visible label and value under every bar all along.

## A verification limit to know about (2026-08-11)

With the Browser pane undisplayed the page stops compositing, so screenshots time
out and **every `getBoundingClientRect()` returns 0**. Computed styles and DOM
structure are unaffected. If layout numbers come back as zeroes, the pane is
hidden — do not conclude the element is missing.

## A rebuild can drop a lesson its predecessor wrote down (2026-08-11)

T-060 found the dashboard's reported clutter was **not** accumulated debt. The
retired `DashboardView.tsx:513` passed `excluded={representedIds}` into its
coverage grid so no measure rendered twice, and `:426` recorded why the blocked
states had been consolidated: *"repeated warning pills made disciplined absence
read as a broken product."* The rebuilt `strategic-view` passed all twelve ids and
gridded every blocked one. Both lessons were in the file being replaced.

Two rules follow:

1. **One governed measure renders once per view.** `STR-KPI-001` was showing as
   "Compliance rate trend" and "National compliance rate" with the identical
   numerator and denominator. Two names for one figure is a governance defect,
   not a layout one — the reader cannot tell whether they are two measures that
   agree. `features/dashboard/strip.ts` now owns the exclusion sets.
2. **Read the retiring file for its recorded reasoning before replacing it.** A
   comment explaining a deletion is the most expensive kind of knowledge to
   rediscover, and it is deleted along with the code that carries it.

## Read the e2e specs during inventory, not after review (2026-08-11)

Two of T-060's planned changes were wrong and the specs said so before any code
was written. "Operational priorities" holds no control and duplicates two tiles
below it, but `web-admin-m1-dashboard.spec.ts:217` and
`dashboard-business.spec.ts:124` assert it as a **canonical panel** — deleting it
is a contract change needing a ruling. And promoting "Your work" to the card
title would have broken three exact-heading assertions on the persona name; the
actual defect was that **`yourWork.scoped` was defined in both locales and
rendered nowhere**, while `:166` asserts it is visible.

**A spec is part of the inventory.** It also revealed that
`web-admin-m1-dashboard.spec.ts:200-215` asserted a heading and body copy that
exist only in the retired `RevampStrategicView` — already failing before any of
this work. **T-063 fixed it, and found the same rot in two more specs**
(`dashboard-business.spec.ts:92-93`, `exec-hard-states.spec.ts:103`).

## Read the design's data model, not only its markup (2026-08-11)

T-066 found the Operational View rendering seven metrics under one heading where
`saqeel-revamp.html` defines **four labelled groups** — Today's operations,
Execution status, Approvals, Operational exceptions. Every previous dashboard task
had read the design's *markup* for card anatomy and section order; the grouping
lives in its `OPERATIONAL` **data model**, further down the same file, and had
never been read.

Three things followed from it, and they are the pattern to expect:

1. **The heading was factually wrong for four of its seven cards.** Returned
   reports are not "today's operations". A heading that misdescribes its contents
   is worse than no heading.
2. **The visual defect was a symptom, not the fault.** Seven cards in a
   six-column grid stranded the seventh beside ~1100×180px of dead space. Fixing
   the grid would have hidden the mislabelling.
3. **The fix was free of functional risk because the order already matched.** The
   metric array was already in the design's group order — only the boundaries had
   been lost, so the diff is pure composition.

**A spec that asserts a sentence is hostage to copy.** T-062 asserted the summary
sentence was visible; T-066 deleted that sentence one task later, so both specs
were re-pointed at the four group headings instead. Assert structure.

## A spec that greps source can rot without the DOM changing (2026-08-11)

Two of the six dead assertions T-063 repaired were **static**: that spec reads
source files as text, and asserted `en/dashboard.json` contained two governance
sentences that live only in the retired component. `grep -c` over the locale file
returns **0** for both. A DOM-only fix would have sailed straight past them, and
the failure reads like a copy regression rather than a stale test.

1. **Re-point the assertion; do not delete it.** Each dead line was moved to
   where its claim actually lives — "no quarterly series is inferred" onto
   `STR-KPI-003`'s registry note, "no generated claim until a configured
   provider" onto `STR-KPI-012`'s.
2. **A claim about what the platform refuses to compute belongs on the registry,
   not in a locale file.** A redesign can move a string; it cannot move an
   immutable formula note — and these two assertions had already been broken once
   by exactly that. Copy assertions are for reader-facing honesty.
3. **`innerText` lies when the page is not compositing.** With the Browser pane
   hidden it returns empty for genuinely rendered nodes while `textContent` is
   unaffected. Three assertions looked absent until re-checked.

## `/dashboard` typography is closed (2026-08-11)

Both views render the **identical** size set — 28 · 20 · 14 · 12 — with zero
off-scale values and one typeface. Verified signed-in in a browser, not read
from source.

**A static gate cannot catch a disagreement between two valid tokens.** T-059
found KPI numbers rendering at 30px and 28px on the same screen — the owner's
original "81.5 is so big compared to the rest" complaint, still live after two
tasks aimed squarely at it, because both call sites were token-clean and the
gate had nothing to flag. Two more defects surfaced the same way: table headers
at 11px against every other label's 12px, and a page title with **no font rule
at all**, falling back to the browser default on every route.

The lesson is now WEB-008 practice: **a screen is not done until it has been
rendered and measured.** Source reading and a green gate are necessary and not
sufficient.

Remaining on the route: 21 violations — 13 in the dead `dashboard.module.css`
(deletion, not migration) and 8 in `explain-panel`, blocked on `Heading` needing
`ref`/`tabIndex`.


## The app had four typefaces (2026-08-11)

T-058 found `--sqx-font-sans` pointing at two fonts that were **never loaded**.
`next/font/local` registers a scoped family (`plexArabic`); the token named
`"Readex Pro", "IBM Plex Sans Arabic"` as string literals, so every
token-styled element fell through to `system-ui` while elements referencing
`--font-plex-arabic` directly rendered the real face. Result: **Segoe UI on 224
elements, IBM Plex on 209, Times New Roman on 4, Consolas on every mono site.**

Two lessons that outlive this fix:

1. **CSS never errors on a missing font family.** It renders something else, and
   the token still reads correctly to anyone reviewing it. Verify a typeface by
   measuring rendered glyph widths, not by reading `fontFamily` (WEB-014 §2.0).
2. **A gate that matches nothing looks identical to a gate that passes.** The new
   `card-eyebrow-above-title` rule found 0 of 24 real call sites on its first run
   because it was line-scoped against multi-line JSX. Prove a new rule fires
   before trusting its green.

Now one typeface app-wide, `--sqx-font-mono` aliased to it, verified in a
browser.

## Card slot order — owner ruling (2026-08-11)

**Title first, always larger and `--sqx-text-primary`. Description second,
`body` and `--sqx-text-secondary`.** This inverts WEB-014 §5 as first written;
the rule document is updated and is the authority. `CardHeader.eyebrow` renders
the rejected pattern and is retiring behind a gate rule — 24 call sites left.

**KPI tiles are exempt** (WEB-014 §5.2): a tile whose subject is a number is
label → value. Do not promote the label above the number.

## Where typography stands (2026-08-11)

T-057 rebuilt the type system after the owner reported, from a `/factories`
screenshot, that the app did not look like an enterprise product. The finding
that matters to every future task: **the rules were being followed and the
output was still inconsistent.** Both components named in the report used only
`var(--sqx-text-*)`, held zero hardcoded values, and passed every gate — one
rendered its prose at 14px and the next line at 11.5px, and the design system
allowed it.

The scale had twelve roles with four inside a 2px band and no rule for choosing
between them, so agents defaulted to the smallest that fit: `caption` was used
164 times against `body`'s 59. **72% of all type usage sat at ≤12px and 3.5%
above 16px** — the app had no typographic top end. Alongside it, **203 raw
`font-size` declarations** were already shipped against CLAUDE.md rule 7, which
is the real mechanism of drift: an agent reads the rulebook, then reads the
neighbouring file, and **precedent beats prose**.

What is now true:

- **Nine roles, one prose size.** `caption`, `body-lg`, `title` and `code` are
  retired, but resolve as aliases so no unmigrated screen breaks. The aliasing
  *performed* the migration — all 164 caption sites became 14px in one edit.
- **Feature code cannot express typography.** Only
  `src/components/saqeel/` may declare a font property; screens compose `Text`,
  `Heading`, `Overline`, `Mono`, `Metric`.
- **`npm run gates:typography` is a ratchet.** 1,130 known violations across 380
  entries are baselined; new ones fail the build and the count may only fall.
- **`WEB-014` is binding law** and is linked from CLAUDE.md rule 7b. Its §9 is a
  review gate every text-touching task answers in its record.

Body stayed at 14px for demo-night safety; **15px remains the recommendation**
for a system read on office monitors, and is a one-token change.

Still owed on this task: axe, 320px, and a browser pass on the authenticated
screens — specifically checking dense tables for reflow now that 11.5px text
renders at 14px.

## Where `/planning/single` stands (2026-08-11)

T-056 took the first-run state after the owner reported it: one search card, a
gap, then a raised sticky bar carrying **Save draft** and **Submit for
supervision**, both permanently disabled, and nothing else on the page. The bar
now renders only when a target exists.

Three rulings from this task generalise:

- **A permanently disabled control is not a preview of an action, it is dead
  UI** — and worse than a hidden one, because a disabled control leaves the tab
  order, so the keyboard user cannot reach the thing that would explain why it
  is disabled. `PublishReadiness` and `PublishBlockers` on this same screen were
  already gated on a target; the bar was the outlier, not the pattern.
- **Deleting a submit button changes how Enter behaves.** A form with no submit
  button submits on Enter when exactly one field blocks implicit submission —
  and on this screen that field was the search box, so the disabled button had
  been suppressing Enter by accident. The fix was structural: search and
  portfolio selection moved **outside** the `<form>`, which is what they are.
  Safe only because the published target has always been built from hidden
  fields rather than read back out of the radios. **Check the implicit-submission
  consequence before removing a submit button from any form.**
- **A step number inside a translated string is data in the wrong file.** Two
  cards both read "2 ·" — `portfolioStep` and `licenseStep`, in `en` and `ar`,
  because they are the same step on two paths and nobody could see both at once.
  Numbers moved to a `CardHeader` eyebrow; the copy holds only the name.

Also fixed: the search input was named three times (heading, `aria-label`,
placeholder) with no visible `<label>`, against `TextInput`'s own TSDoc; the
first run now states what to type and what follows; the skeleton drew three
cards where the screen renders one.

**Owed:** browser, keyboard, Arabic/RTL and axe passes — no dev server was
started. **10 new Arabic strings need a native review.** The screen's other ~110
strings are still `t(key, "English")` on the `ui_strings` table.

## Where `/planning` stands (2026-08-11)

T-055 took the filter bar after the owner reported it still read as cluttered.
The cause was structural, not cosmetic: **`Field` renders `<label htmlFor>` and
`Select` exposed no id to point at**, so every filter printed its name twice —
an unassociated caption plus an `aria-label`. That is a design-system defect with
**12 call sites**, not a planning one; `Select` gained `id?` after an owner
ruling and drops its `aria-label` when passed. The other 11 sites are untouched
until each wires it.

The bar went to search · Status · More filters · Clear all, the remaining nine
filters moved into the panel, and every control now names itself when empty
instead of captioning a box that says "All". **Apply was deleted and filter
state moved from `useState` to the URL** — a rung *up* the WEB-004 ladder, since
that state had only ever mirrored the URL. Filtering was already server-side in
`visit-list.ts` and stays there; instant-apply changes when the server is asked,
not who filters.

One ruling generalises beyond this screen:

- **A caption that is not programmatically bound is not a label, it is
  decoration — and a second copy of the name.** The tell is a component pairing
  a label wrapper with a control that owns its own `aria-label`: the announced
  name is right, so nothing fails a smoke test, while the visible text is inert
  and the screen carries every caption twice. Check that the wrapper can
  actually reach the control's id before assuming a `Field` is doing anything.

**Unverified and highest risk:** the More filters panel must stay open across the
navigation each filter change triggers. If it does not, the screen is worse than
it was with Apply. The owner's Chrome extension is not connected, so this could
not be checked.

T-053 fixed the defect the owner screenshotted: the list route reported
**"No visits match" inside the cells of rows that had matched**, in the KPI
tiles, and in every status-filter option. One binding caused all of it —
`view.ts` had `const dash = labels.empty`, where `labels.empty` is the
empty-*list* sentence.

Two rulings from this task generalise:

- **An empty-state sentence and a null-value placeholder are different strings.**
  Sharing one key makes a screen contradict itself the moment data arrives, and
  the failure is silent: types pass, gates pass, nothing throws. `/planning` now
  distinguishes `table.noValue` ("Not assigned") for a genuinely absent value
  from `table.notConfigured` for a field with no data source wired at all — the
  WEB-009 vocabulary, applied per-field rather than per-screen.
- **A control that can never hold a value is not an empty state, it is dead
  UI.** Four of eight KPI tiles and three of thirteen table columns were
  hardcoded `null` — no source existed for any of them — and they were rendering
  an apology in half the space above the fold. They were deleted, not restyled.
  The check is whether a data path exists, not whether today's payload is empty.

Also removed: the AI band's two panels (hardcoded `<EmptyState>`, no data prop,
could never render content) and the Quick Actions grid, whose entries duplicated
the header create-menu's hrefs exactly and the KPI tiles' counts — Draft and
Returned had each been rendering three times on one screen. Net **−243 lines**.

**Owed on this route:** browser pass, axe, e2e. Same blocker as everything
below — no seeded account.

## Where `/planning/immediate` stands (2026-08-11)

**T-051 was rejected by the owner and reverted in full.** The route is back to
its legacy state — 5 files, 913 lines, zero SAQEEL imports — and is being
rebuilt in five slices. Slice 1 (T-052) took the foundation: `page.tsx`
**252 → 26**, every read behind an `unauthorized | ready` union, and all
**128 strings into `planning.immediate` in both locales**, which took the screen
off `ui_strings` entirely. **Slice 2 (T-054) is the first visible one** — the
nine dispatch protections and the R05 notice, with `AuthorityBar.tsx` deleted at
**6 hooks → 0** and the emoji states replaced by `StatusPill` text-plus-shape.

Two more rulings worth carrying:

- **`saqeel.css` has no global `button` reset, by design.** A `<button>` styled
  as a surface carries a UA border and inherits neither `font` nor `color`, so
  every migrated component that does this resets it by hand. Copying a rule set
  onto a different tag is not copying the solution — ask what the user-agent
  stylesheet already paints on that element.
- **An announcement is usually a derived string, not an effect.** React mutates
  a text node only when the string changes, which is precisely "announce when
  the set changes, not on every keystroke". Two `useEffect`s and a `useRef`
  existed to reproduce what render already does.

Three rulings from this slice generalise:

- **A constant that policy owns does not belong in the component.** `actorMode`
  as a local `const` is narrowed by TypeScript to its literal, so every
  `=== "inspector"` branch becomes a compile error. Moving it to the query layer
  fixed the type error *and* put the policy where policy lives — the type system
  was pointing at a layering mistake, not asking for an annotation.
- **`as never` and `as unknown as` were hiding a real shape.** PostgREST types
  an embedded to-one relation as an **array**; both casts existed to silence
  that. Every `as` in a data layer is worth re-deriving rather than carrying.
- **A screen can be fully "translated" and still ship English.** 58 of the 128
  keys had no Arabic anywhere — in code, in the locale files, or in the seeded
  `ui_strings` migrations — so `t()` fell back to English on an Arabic screen and
  nothing ever failed. Only moving the copy into the resource made the gap
  countable (WEB-013 §8).

> **The workstation blocker is stale.** `next dev` ran on 2026-08-10 and
> compiled `/planning/bulk` clean; the SWC Application Control error did not
> reproduce. What still prevents a rendered pass is **a seeded account** —
> `planning_access_class` denies the anonymous caller, so every authenticated
> route 307s to `/login`. Do not repeat "static verification only" without
> re-testing it. See BLOCKED in `03-REDESIGN-TRACKER.md`.

## Where `/planning/bulk` stands (2026-08-10)

Slices **1a** (data layer behind the T-042 narrowing boundary), **1b** (route
file 348 → **27**) and **1c** (criteria builder — 13 native controls and 24
legacy classes to zero) are done, plus the shared AI advisory. Slices **2** (the evidence form) and **3** (the review route, 288 → 30) are done
too. **Slice 4 is done — the review screen is fully migrated.** `ReviewClient`
855 → 647, `EvidenceLedger` 128 → 112, and **`review.css` is deleted**: legacy
classes 243 → 0, inline styles 52 → 0, native controls 5 → 0, emoji-as-icon
25 → 0. **Only `actions.ts` (846 lines) remains** on this route.

The entry screen is now server composition: `features/planning-bulk/` holds the
reads, the view models and three string modules; `resolveBulkTargeting()`
returns the criteria tree, match set, suggestion lists, focus contributions,
freshness and counts as one value, which is what keeps the screen component's
body at 44 lines. Two rulings from this slice generalise:

- **A type lie relocated is a type lie.** `factories as never` existed because
  `BulkForm` demanded non-null `factory_code`, `cr_number` and `visits` that the
  query has always been able to return null for. Widening the row type at four
  use sites removed the cast; passing it down one level would not have.
- **Arabic is a resource, not a fallback.** ~130 strings moved into
  `planning.bulk` in **both** locale files at asserted key parity, and the JSON
  shape was authored to match the four string contracts — so the three string
  modules fell 272 → 77 lines and a drifted key is now a **type error** instead
  of a silent English fallback. This screen no longer needs a `ui_strings` row.
  `/planning/single` and the review step still do.
- **Derive the list the registry already implies.** The nine value-suggestion
  fields were hardcoded beside a `FIELD_REGISTRY` that documents itself as the
  single place a field is added. They are now
  `filter(supplied && (text | enum))`.

Two primitives were extended to unblock this work, both raised as gaps first and
built only after a ruling (WEB-002 §2): `Button.busy` and
`SelectOption.disabled`. **Neither gap was filled inline** — that is the pattern
to repeat.

Rulings worth carrying forward:

- **"Recorded but unavailable" and "never offered" are different facts.** A
  disabled option stays visible, readable and announced, with its reason. Only
  the first of those two states is something a user can act on.
- **A disabled flag must guard every path in** — click, Enter/Space, arrow keys,
  Home/End, type-ahead, and the initial open. Guarding `onClick` alone leaves a
  row reachable that then refuses to activate.
- **Check specificity before writing a CSS override.** Three separate defects in
  this codebase now trace to an equal-or-higher-specificity rule silently
  beating a variant (`Card`'s AI accent on hover, the frozen sheet's
  `a { color }`, and `Button`'s busy state stripping the AI accent).

**Still unrecorded:** the eight pre-session wizard commits
(`754c5f1c` … `462e3675`, `cf36da85`). Also note `21d92022`'s message describes
only a visit-list fix while actually containing the whole T-042 boundary.

## Where planning stands (2026-08-10)

`/planning` itself is migrated: 10 native controls gone, More Filters portalled,
AI columns accented (T-043). `/planning/single` has honest search states and
correct pill tones (T-045). **`/planning/bulk` is where the legacy mass is** —
before T-046 it had **zero SAQEEL imports** across 14 files and 3,512 lines.
Slice 1a moved its reads behind the narrowing boundary; the other five slices
are on the board.

Three rulings from this run generalise:

- **A portalled control cannot participate in a GET form.** Its DOM sits outside
  the `<form>`, so native submit skips it. Keep the state in one island and
  render every hidden input inside the form; the panel is presentation only.
- **Two portals into `document.body` are DOM siblings** however deeply nested
  they are in React. `contains()` cannot express menu ownership — React context
  can, because it follows the React tree. This caused a hard crash before it was
  found (T-044).
- **Read the nearest existing solution before designing a new one.** The
  `/planning` filter bar was built twice because `enforcement-filter-bar` had
  already solved the same problem, and the first attempt invented a chip that
  double-bordered every control.


## Where the data layer stands (2026-08-10)

**Every `as unknown as` is gone from the migrated data layer** — 48 casts across
21 files, replaced by `lib/postgrest/{shape,read}.ts` and a `Shape<T>` per row
type. Reads narrow once at the boundary and **fail closed**: a malformed row
fails the whole read into the screen's existing *unavailable* state, never into
a silently smaller number.

Two things generalise from that work:

- **`supabaseServer()` has no `Database` generic**, so `.select()` infers every
  column as `any` **and every embedded relation as an array** — including
  to-one embeds PostgREST returns as objects. That is why the casts existed, and
  why `typecheck` passing did not mean the reads were type-safe. Generating
  database types (`supabase gen types typescript`) is the real fix and needs a
  live database.
- **A row type must declare what the query selects, not what the screen wants.**
  The dashboard's types described the *post-hydration* shape, so every read had
  to be asserted into it. Splitting `VisitScopeRef` out — `factory_id` from the
  query, `factories` filled by `hydrate.ts` — removed six casts without changing
  a line of behaviour.

**150 casts remain in unmigrated legacy** (`field/**`, `admin/**`,
`reviews/[id]`, `visits/[id]`, `reports/**`, `lib/factory360/dossier.ts`). Each
screen migration should convert its own reads onto the boundary.


## Where enforcement stands (2026-08-10)

Both screens behind `/admin/violations` are migrated: the enforcement library
(410 → 24) and the catalogue admin (511 → 26). **All three rewritten routes are
now done** — compliance library, approval queue, enforcement.

The recurring lesson across T-036…T-041 is that **the schema holds more than the
screens admit**. Every one of these migrations found recorded columns the UI was
ignoring while showing a placeholder or a UUID: `inspections.inspection_no`,
`inspection_penalties.status`, penalty `amount`, `violation_codes.corrective_action`,
`compliance_configuration_requests.description`. Read the migrations before
concluding a value is unavailable — `0001_foundation.sql` alone understates the
schema badly.

**Dates:** `new Date().toISOString().slice(0, 10)` appears in unmigrated code as
a "today" for date-bounded comparisons. It is the UTC day and rolls over three
hours early in Riyadh. `riyadhToday()` in `lib/dates.ts` is the correct one.

---

## Where the approval queue stands (2026-08-10)

`/compliance/approvals` is migrated — 499 → 25 lines — with the request rail,
review sequence, field diffs, per-object and package decisions, progress and a
timeline that now includes submission and return. Reached from
`/admin/compliance-approvals`, which the middleware rewrites **unconditionally**;
those four files are marked `@retiring` because that segment never runs at all.

Three live defects were fixed on the way, all of the same shape — **a value that
looked wired but was never read**: `?view=pending` from the admin home, a
correlation id minted fresh on every failed render (so the reference shown to the
user matched nothing in the logs), and `toLocaleString(locale)` instead of
Asia/Riyadh. Worth a look on any screen not yet migrated.

---

## Where the compliance library stands (2026-08-09)

**The compliance library is fully migrated.** `app/(app)/compliance/page.tsx`
**303 → 27** and `/admin/regulations` **546 → 21**. Catalogue, six-tab workspace
and the governed record are all on SAQEEL, and **every `@retiring` file is
deleted** — the retirement ledger's Marked section is empty. Search, filters and
the active tab are all `searchParams`; the only client code left on either screen
is the lifecycle form.

The pattern worth reusing: `WorkspaceTable<T>` is
`{kind:"rows", rows} | {kind:"unavailable"}`, so a failed read **cannot** be
handed to a table as an empty array. Prefer that to a boolean beside the data —
the two drift, the union cannot.

**Three admin routes do not render their own page.** `middleware.ts` rewrites
`/admin/regulations` → `/compliance`, `/admin/compliance-approvals` →
`/compliance/approvals`, and `/admin/violations` → `/enforcement-library`,
passing the typed path in `__shellRoute`. T-036 was first built against
`/admin/regulations` and the entire rebuild was unreachable. **Read
`middleware.ts` during inventory, before deciding which file a screen lives in.**

**The schema is richer than any admin screen currently admits.** `violation_codes`
already carries `level`, `corrective_action`, `grace_period_days`, `category` and
`applicability`; `penalty_mappings` carries `penalty_type`, `amount`,
`grace_period_days`, `due_period_days`, `legal_basis` and a `template_version_id`
naming the action form; and `inspection_items.response_model.mapping` holds a
**direct item→violation link**. All of it is governed with maker-checker and
immutability triggers. Before concluding a field is missing, read
`supabase/migrations/20260715220000_m09_authoritative_contract_completion.sql` —
the foundation migration alone understates what exists.

---

## Where the dashboard stands (2026-08-09)

`/dashboard?view=strategic` no longer ends in two placeholders. The
**enforcement action trend** is computed from `penalty_notices.issued_at` over
the scoped period against the immediately preceding period of equal length, and
the **executive AI brief** is a real governed advisory on the `executive_brief`
surface, generated on demand.

Two rulings from that work generalise:

- **An empty result under RLS is not an absence of facts.** `penalty_notices` is
  invisible to most roles and returns an empty set rather than an error. Any
  query over a role-gated table must carry a `readable` flag, and the screen
  must render a restricted state — not a zero. The same flag goes into any AI
  context built from that table.
- **A client field may be a filter; it is never a fact.** The executive brief's
  hidden `context` is convenience only: `generateContextualInsight` re-reads
  every figure under the caller's RLS and accepts from the client only the
  reporting period, validated as an ISO day with `from <= to`.

`RevampStrategicView.tsx` and `DashboardView.tsx` still hold the old
placeholders in legacy markup, but both are unreachable — `DashboardView`
returns before its remaining hundred-plus lines, and `page.tsx` imports neither.
They belong to the retirement sweep.

---


> **The tracker's NOW section below is older than the work.** Since the last
> status refresh, `/dashboard`, `/operations`, `/factories` (list **and**
> `[id]` dossier), the `/planning` list, and now **Visit Management**
> (`/planning/visits` + `/visits`) have all been migrated onto SAQEEL. Several
> of those tasks have session records; the dashboard and operations migrations
> still do not. Read `02-SESSION-LOG.md` for what actually happened.

## Where Visit Management stands (2026-08-09)

The screen behind `/planning` → **Visit management** is migrated. The 706-line
`VisitsBoard` client monolith is superseded by six components under
`components/sections/visits/**` (none over 182 lines) plus a five-module data
layer at `features/visits/**`; both route files are 36 lines.

**The list is now server-driven.** Nine client filter states became
`searchParams`, implemented by reusing `queryPlanningVisits` — the hardened
query already behind `/planning` — extended additively with
`requireReference: false` so Visit Management keeps the reference-less visits it
exists to correct while `/planning` stays provably unchanged. 14 `useState` → 2,
3 effects → 2, 37 inline style objects → tokens, one inline `<svg>` → the new
`externalLink` registry name, and 259 i18n keys at exact `en`/`ar` parity.

`VisitsBoard.tsx` has **zero importers** and is marked `@retiring`. It is the
only retirement row with an empty `pending` list — deleting it needs the e2e
specs updated, nothing more.

**`npm run typecheck` is clean across the whole repository (2026-08-09).** It had
not been: `shell-topbar.tsx:81` failed for several sessions and was carried as
"pre-existing". T-021d found it was masking two live defects in the topbar's date
scope — five of seven presets rendering `undefined` labels, and a `locale` that
was never passed, so the shell never rendered Arabic-Indic digits. Treat a
standing type error in a shared component as a defect, not as noise.

---

---

## What this is

`apps/web` — the MIM Inspection Platform web application. Next.js 15 (App
Router), React 19, TypeScript strict, Supabase, PWA with offline field
capture, bilingual English/Arabic with RTL, maps (Leaflet + Mapbox), 3D
(Three), video (Twilio).

The application **works**. This programme is a redesign and a disciplining, not
a rebuild.

---

## Where we stand

**Phase: 2 — the shell consumes the system; pages do not yet.**

`apps/web/src/app/saqeel.css` is the design system: one file, three cascade layers
(`sqx.tokens`, `sqx.base`, `sqx.components`), 339 custom properties, 59
classes, 3 keyframes, imported once from `app/layout.tsx`. Variants are data
attributes. It sits entirely inside cascade layers while the three legacy sheets
are unlayered, so it cannot override them and the visual diff of adding it is
zero — a migrated screen must *delete* the legacy rule, not out-specify it.

**T-004 rebuilt the authenticated shell on it.** `components/app-shell/**` (15
files) plus `features/shell/**` (4) render the rail and topbar as Server
Components; eight scoped client islands replace the single 839-line
`ShellClient`. The icon layer is `lucide-react` behind one registry —
`components/saqeel/icon/icon-registry.ts` is the only file allowed to import it.
`app/(app)/layout.tsx` is six lines.

No **page** uses the system yet. The typed primitive layer is now **T-006**,
adopting `ShellPageFrame` across 55 route files is **T-007**, and finishing the
two out-of-group admin layouts is **T-008** — until T-007 and T-008 land,
`ShellClient.tsx` and `Shell.tsx` are marked but not deletable, and none of the
46 KB is actually recovered.

**The shell has never been rendered.** See the blocker below.

The rulebook is still not machine-enforced. No lint config, no gate scripts —
every rule T-002 obeyed was checked by hand. That is **T-000**, and it remains
the highest-priority unblocked item.

> ~~**The app does not run on this workstation.**~~ **DID NOT REPRODUCE
> 2026-08-10 — see the note at the top of this file.** Windows Application
> Control was blocking `@next/swc-win32-x64-msvc`, so `next dev` served nothing and
> `next build` hangs. No browser verification, no e2e, no axe, no bundle
> numbers — every task is currently limited to static verification, and the
> Definition of Done cannot be fully ticked by anyone working here. See
> BLOCKED in `03-REDESIGN-TRACKER.md`. This outranks T-000.
>
> **This is now urgent, not merely inconvenient.** T-004 replaced the chrome on
> every authenticated route and not one page was ever rendered to check it.
> `tsc` passes; nothing else was possible. If the first render is wrong, the
> revert is one line — point `app/(app)/layout.tsx` back at `AppShell` from
> `@/components/Shell`. Nothing was deleted.

---

## Baseline — measured 2026-08-06

| | |
| --- | --- |
| Files under `apps/web/src` | 814 |
| Source bytes | ≈ 5.9 MB |
| Route files under `app/(app)` | 495 |
| Saqeel primitives already built | 60 |
| Global CSS | `saqeel-runtime.css` 170 KB · `saqeel-components.css` 50 KB · `login.css` 57 KB · `tokens.css` 18 KB · **`saqeel.css` 59 KB (added 2026-08-07, 8.7 KB gzip)** |
| Lint config | none |
| CI gates | none beyond a PR contract check |

### The ten files that hold most of the problem

| File | Size | Principal violation |
| --- | --- | --- |
| `app/(app)/field/inspection/[id]/Workspace.tsx` | 136 KB | ~34× the component ceiling |
| `app/(app)/field/[visitId]/Startup.tsx` | 85 KB | client component on the strictest perf surface |
| `app/(app)/operations/page.tsx` | 79 KB | route file carrying an entire application |
| `app/(app)/field/inspection/[id]/page.tsx` | 70 KB | route file, same |
| `app/(app)/field/[visitId]/page.tsx` | 61 KB | route file, same |
| `app/(app)/planning/bulk/review/ReviewClient.tsx` | 53 KB | |
| `app/(app)/field/page.tsx` | 49 KB | route file |
| `app/(app)/factories/cr/[id]/page.tsx` | 49 KB | route file |
| `components/ShellClient.tsx` | 46 KB | client JS on **every** route |
| `app/(app)/dashboard/DashboardView.tsx` | 45 KB | |

### Known systemic issues

- Route files contain application logic and client code (WEB-001 §2).
- Icons are ~90 hand-authored inline SVG components in `app/icons.tsx` and
  scattered through screens (WEB-002 §5).
- `saqeel-runtime.css` at 170 KB loads globally; most of it is unused per route.
- Heavy libraries (`mapbox-gl`, `leaflet`, `three`, `twilio-video`) are not
  confirmed to be code-split.
- No lint configuration, so none of the code law is currently enforceable.
- Component directories mix primitives, domain components, and one-off screens.

---

## Assets we are keeping

- **`app/tokens.css`** — an audited, owner-approved semantic token sheet with
  recorded contrast ratios, a dark theme, and RTL support. This is the expensive
  half of a design system and it already exists. It is the single source of
  visual truth going forward.
- **`components/saqeel/**`** — 60 primitives already organised by concern
  (actions, inputs, data, feedback, navigation, grid, map, inspection,
  signature). They need hardening against the WEB-002 §4 contract, not replacing.
- The existing e2e and axe Playwright configuration.

---

## Decisions on record

| Date | Decision |
| --- | --- |
| 2026-08-06 | Design system is **SAQEEL**. Astryx stays banned. Existing tokens are kept; the component layer is hardened on top of them. |
| 2026-08-06 | Icons: **`lucide-react`** behind a semantic registry and one `Icon` primitive. Hand-authored `<svg>` banned in application code. |
| 2026-08-06 | ~~Styling mechanism for new work: **CSS Modules** colocated with the component.~~ **Superseded 2026-08-07.** |
| 2026-08-07 | Styling mechanism, **final**: `app/saqeel.css` holds **only tokens, base, keyframes and reduced motion** (801 lines, `@layer sqx.tokens, sqx.base`). Every component class lives in a **CSS Module paired with its component in the same directory** (`shell-rail/shell-rail.tsx` + `shell-rail/shell-rail.module.css`). Modules are never imported across directories — cross-component styling uses data attributes (`[data-brand-name]`), never a foreign class. Modules are unlayered so they can out-specify the legacy unlayered `a { color }`. Reverses the one-stylesheet decision below. WEB-002 §6 rewritten. |
| 2026-08-07 | ~~Styling mechanism: **one system stylesheet**, `apps/web/src/app/saqeel.css`.~~ **Superseded the same day.** Tokens, base and every component class in one file under `@layer sqx.tokens, sqx.base, sqx.components`. Components ship no CSS — they apply `.sqx-*` classes and data attributes. No `.module.css`, no CSS-in-JS, no Tailwind. WEB-002 §6 rewritten. |
| 2026-08-07 | Prefix is **`--sqx-` / `.sqx-`**. `--sq-` is still live in `saqeel-runtime.css` (seven nav/map custom properties) and `.sq-` owns 281 legacy classes there; `.saqeel-` is taken by `.saqeel-state` / `.saqeel-reference`. `sqx` collides with nothing — `grep -c sqx` is 0 in every legacy sheet. One prefix across custom properties, classes, cascade layer names and keyframe names. |
| 2026-08-07 | Direction is a **six-token set** declared at `:root` and `:root:dir(rtl)` in `saqeel.css` — the only `dir()` / `[dir]` rules permitted in `apps/web/src`. CSS has no `to inline-end`, so a gradient angle cannot be logical. WEB-001 §9. |
| 2026-08-07 | The three legacy sheets stay **unlayered** for now, so they outrank `saqeel.css` by construction. Migration deletes legacy rules; it never overrides them. |
| 2026-08-07 | ~~Shell active state is **server-rendered** via the `x-pathname` request header.~~ **Superseded the same day.** `app/(app)/layout.tsx` is a persistent layout — Next does not re-render it on navigation between child routes, so `headers()` is read once and the highlight never updates without a refresh. Server-computed active state is incompatible with a persistent layout. `shell-nav-group.tsx` is now a client component reading `usePathname()`; the rail, brand, topbar and page frame stay Server Components. This is the fallback T-004's §6.1 anticipated, taken as narrowly as possible. |
| 2026-08-07 | Icons are **`lucide-react` behind `components/saqeel/icon/icon-registry.ts`** — the only file permitted to import it. 34 semantic names. Hand-authored `<svg>` is banned in application code. |
| 2026-08-07 | The shell's scroll model is fixed: `.sqx-shell` is `100dvh`/`overflow:hidden`, `.sqx-shell__main` owns `overflow-y`, the topbar is a non-sticky sibling above it. This is **required**, not stylistic — the legacy `.sq-pagehead` is sticky and 55 pages still render it. |
| 2026-08-07 | **Chrome is a flat colour, not a gradient.** Rail, topbar and drawer use `--sqx-surface-chrome` — `#EAF8F0` light, `--sqx-green-950` `#001F11` near-black green dark. Gradients are reserved for small surfaces: the CTA, the active-row edge, labels and cards. Supersedes §4.1 of the T-004 brief. "Deep green" here means **near-black green**, not a brighter forest green — `--sqx-green-800` was tried and is the wrong direction. The rail and topbar dividers use `--sqx-border-strong` and are load-bearing in both themes; `--sqx-border-subtle` scores 1.14:1 on the dark chrome and disappears. |
| 2026-08-07 | `<main>` keeps `id="main-content"`. The T-004 brief asked for `id="main"`; three assertions in `e2e/ui-compliance-runtime.spec.ts` pin the existing id and e2e was out of scope. |
| 2026-08-06 | Accessibility target raised to **WCAG 2.2 Level AA**. |
| 2026-08-06 | Rulebook and session memory live in `brain/web/`. Root `CLAUDE.md` is the onboarding pointer. |

---

## Open change request — 13 tokens (blocks T-005)

T-005 stopped on WEB-002 §2: a missing token is raised, never added inline. Eight
of its ten primitives are blocked, and `menu-surface` alone blocks five of them.
The exact declarations are in
[the T-005 record](sessions/2026-08/2026-08-07-T-005-header-controls.md).

One of the thirteen needs a **decision**, not just a value:
`--sqx-rim-light` already exists as a colour and is consumed by
`--sqx-elevation-1…4`, but WEB-009 §4 specifies it as a per-theme box-shadow.
Redefining it in place breaks all four elevation tokens. The record proposes
renaming the colour to `--sqx-rim-tint`.

---

## Next action

**T-000 — Guardrails: gate scripts, lint, verify pipeline.**
See `03-REDESIGN-TRACKER.md`.

T-000 now also owes two gates that T-002 created the need for:
`gate:one-stylesheet` (no new `.module.css`; no `--sqx-*` or `.sqx-*`
declared outside `saqeel.css`) and the `dir()` check that enforces WEB-001 §9.
