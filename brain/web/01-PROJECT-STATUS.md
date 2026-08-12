# 01 — Project Status

`Last updated: 2026-08-12` · `Updated by: T-086 — single/bulk vocabulary`

## A `t()` default is not a fallback — it is the English build (2026-08-12)

`f360.actions.planSingle` rendered **"Plan single visit"** on one screen and
**"Plan one visit"** on two others. The key looks translated — it is called
through `t("f360.actions.planSingle", "…")` — but it has **no entry in either
locale file**, and `getDict("en")` returns `{}`. In the legacy `t(key, en)`
system there is no English dictionary at all: `tr()` resolves every key to its
second argument. **The literal in the call site *is* the shipped English**, so
three call sites meant three independently editable copies of one label.

This is why WEB-013 bans `t("key", "English")` rather than merely discouraging
it. The pattern does not degrade gracefully to a shared string — it silently
forks one label per call site, and nothing reports the divergence.

**When a control's label is asserted or referenced by other copy, the reference
decides the wording.** Here `planning-single/strings.ts:264` renders *"Only
planning staff can use **Plan a single visit**"* — a denial that names the
control. A button and the sentence naming it are one contract; the sentence had
been right all along and two buttons had drifted off it.

**Corollary found the same hour:** `cd-022-identity-lens.spec.ts:422` still
asserted the *old* wording while the source string had already moved. A rename
had landed in code with its spec left behind, and only grepping the obsolete
phrase surfaced it. **Grep the string you are replacing across `e2e/` as well as
`src/` — the spec is where the previous rename went to hide.**

## A control that cannot POST is why the banned one is still there (2026-08-12)

`Select` is a `<button>` plus a listbox, so it submits nothing. T-080 found that,
raised it, and kept the native `<select>` WEB-009 §14 bans. Nothing filled the gap,
so the defect sat on a **write path** for four tasks.

Filling it took two props. `name` renders a hidden input carrying the value —
**without it the swap compiles, renders correctly and silently submits an empty
field on every governed transition.** `defaultValue` is the half that matters
more: an uncontrolled control means the forms hold **no state at all** and the
answer is read once from `FormData` (WEB-004 §1 rung 4).

**When a primitive gap blocks a rule, fill the primitive. Working around it puts
the violation somewhere a future task has to find again.**

## Check the primitive's props before building a parallel one (2026-08-12)

The reschedule window looked like it needed a datetime picker that did not exist.
`DateRangePicker` already had `withTime`, `timeStep` and `timeLabels`, and already
emitted `YYYY-MM-DDTHH:mm`. It needed **two submit-name props**, not a new
component.

Read the whole prop list — including the TSDoc — before concluding something is
missing. This repo's recurring failure is the opposite one: a second
implementation that inherits the original's bugs and none of its fixes.

## Migrating off a native control breaks `selectOption()` (2026-08-12)

`page.selectOption()` only drives a native `<select>`. Every spec that uses it
against a control you are about to migrate **breaks at runtime**, and the type
checker cannot see it.

Budget for the rewrite before promising the migration: the row must be clicked by
the label the screen shows, which means the spec needs that label — take it from
**the same source the page reads** so the two cannot disagree. Also re-check every
`form >> button` locator, because the listbox trigger is now a button inside the
form and the old locator raises a strict-mode violation.

## An empty listbox is worse than the native control it replaced (2026-08-12)

A native `<select>` with no options still renders its placeholder. A custom
listbox opens onto an empty floating panel, which reads as a failure to load
rather than as unconfigured data.

`Select` now takes `emptyLabel` and renders a disabled row. **A migration is not
finished until its empty, error and unconfigured states are at least as good as
the control's.**

## An i18n object is a contract, and `Object.entries` assumes one you never wrote (2026-08-12)

`/planning`'s Method filter offered ten options and six of them could never match
anything. The cause was one line — `Object.entries(messages.methods)` — reading a
JSON object as a value→label map when it actually held **nine** keys: three real
method values *and* six title/description strings for a different surface's card
picker. Selecting *"Plan bulk visits"* filtered visits by `method = 'bulkTitle'`
and returned an empty list **with no error**, which reads as *no visits match*
rather than *that is not a filter*.

Nothing catches this. It typechecks (`Object.entries` over a JSON object is
well-typed), it passes every gate, and it renders without a warning. The same
object was **simultaneously correct** at `planning-drafts.tsx:38`, which does
`methods[draft.method]` — one object, two contracts, only one of them true.

**Never iterate an i18n namespace to build a control's options.** A locale file
groups strings by *screen area*, not by *domain enum*. Derive options from a
canonical constant and index the namespace by key; then a new string can never
become a selectable value.

**And validate the parameter as well as the control.** Cleaning the JSON alone
would have made the filter correct *by coincidence*. `parsePlanningParams` was
already whitelisting `tab` against `PLANNING_TABS` three lines above the
unvalidated `method` — the fix was the existing pattern applied to the field
that was missed.

## When a number contradicts an invariant, re-measure before explaining it (2026-08-12)

T-085's first measurement said the unfiltered planning list held **2** visits.
The real figure is **101**. A loose regex had matched a bucket counter instead of
the list total, and the mistake nearly reached the session record.

What exposed it was not care — it was an impossibility: a *filtered* query
returned **8** against a supposed unfiltered total of **2**. A filter cannot add
rows. The instinct at that moment is to explain the anomaly; the correct move is
to distrust the instrument. The rendered `Showing N of M scoped visits` counter
was the only trustworthy signal, and the `V-\d+` reference regex was as unreliable
as the first one.

**A measurement that violates an invariant is evidence about the measurement,
not about the system.**

## A shared primitive's debt is every route's debt (2026-08-12)

Until T-083, **no route in this application could reach zero typography
violations**, because each inherited a 6–9 violation floor from eight shared
`components/saqeel/*` stylesheets it does not control. `/factories` had migrated
its own code to **zero** — `components/sections/factories/` scans clean across 35
component directories — and still measured 7, none of them its own.

That makes "is this route done?" unanswerable, and it is the same argument
T-058/T-059/T-072 reached three times from the other direction: **fix a shared
primitive centrally, because a per-screen fix multiplies the same edit by the
number of consumers and still leaves the primitive wrong.** 12 declarations
cleared the floor from every route at once.

**Corollary for scoping a route audit:** always split the count into *own* /
*design-system* / *other-shared* before deciding a route is unmigrated. `/factories`
and `/planning` looked 7 and 52; the honest reading was 0 and 45.

## A retired-role rename is only a no-op if `lang` sits on `:root` (2026-08-12)

`--sqx-text-caption-*` are declared as `var(--sqx-text-body-*)`, so swapping
`caption → body` looks unconditionally safe. It is not. `:lang(ar)` overrides
`--sqx-text-body-line` to `1.8`, and **custom properties substitute at
computed-value time on the element the declaration applies to**. Had `lang="ar"`
sat on `<body>` while the aliases were declared on `:root`, `--sqx-text-caption-line`
would have resolved `1.6` against body's `1.8`, and the rename would have
**silently lengthened every affected line in Arabic** — no gate, no typecheck, no
English render would have shown it.

`layout.tsx:72` puts `lang` on `<html>`, which *is* `:root`, so both declarations
land on the same element and resolve together. Verified by measurement, not by
reading: with `locale=ar`, `--sqx-text-caption-line` reads `1.8` and
`caption === body` compares `true`.

**The general rule: an alias is only transparent while nothing re-declares what
it points at.** Before treating any `--sqx-text-*` alias swap as cosmetic, check
every block that redefines the target token — today that is `:lang(ar)`, and it
covers seven of the nine roles.

## `align-items` on a column is a cross-axis rule, and it sizes every child (2026-08-12)

T-081 added `align-items: flex-start` to two `flex-direction: column` forms so the
submit button would stop stretching. It did that — and it also collapsed **every
field above the button** to intrinsic width. T-082 measured the result on the live
route: a textarea at **178px** (the `cols=20` UA default) inside a 444px form, and
a drop zone at **229px**, its longest text line.

The field's own `inline-size: 100%` cannot win this: it resolves against a
shrink-to-fit parent.

**Give the one child that needs an exception its own row; do not align the
container.** The forms are `stretch` again and the button sits in a `.formActions`
row, keeping its natural width because it is `inline-flex`.

## `minmax(18rem, 1fr)` is a 320px reflow failure waiting to happen (2026-08-12)

`repeat(auto-fit, minmax(18rem, 1fr))` reads as responsive and is not: the 288px
track floor is a hard minimum, so in any container narrower than that the item
overflows its own grid. T-082 hit it at 183px and only a measured `offsetWidth`
comparison showed it — it is invisible in source, to the type checker and to every
gate.

**Write `minmax(min(18rem, 100%), 1fr)`.** Same collapse behaviour, never
overflows.

And note what `auto-fit` buys: with one child the surplus track collapses to 0 and
that child spans the row. **An empty second cell is what makes a full-width empty
state and a two-column filled state the same declaration** — no media query, no
conditional class.

## An object URL can be disposed by the element that consumed it (2026-08-12)

The reflex for `URL.createObjectURL` is an effect with a cleanup. It is not
needed. Create the URL in the change handler, revoke it in the image's own
`onLoad` once the bitmap has decoded, and key the `<img>` by the URL so a new file
mounts a new element. Verified live: `src` scheme `blob`, image still painted, and
a `fetch` of that URL fails.

WEB-004 §3's disposal case never had to be opened. **A disposal a DOM event can
express is not a reason to add an effect.**

## Check what a primitive already promises before translating a string for it (2026-08-12)

`notes.saving` and `att.uploading` existed in both locales, were mapped in
`strings.ts` and declared on two prop types — and rendered nowhere. `Button`'s own
TSDoc says `busy` keeps the label *"so the button does not resize or change
wording mid-action"*. Three layers of plumbing for copy the design system had
already decided not to show.

Both keys deleted. The primitive was right.

## Check that a spec's files exist before re-pointing anything (2026-08-12)

T-078 set out to re-point assertions and found **two tests already throwing**.
`responsive-dashboard-operations.spec.ts` reads two files the live-ops rebuild
deleted; `read()` is a bare `readFileSync`, so the tests die before asserting.
The rebuild that wrote the lesson *"a spec that names a file rots when the
behaviour moves"* missed one of its own call sites.

**First step of any spec work: existence-check every `read()` path.** It is one
script and it tells you what is already broken versus what you are about to
break.

## Cross-reference a re-pointed claim; do not duplicate it (2026-08-12)

The live route's responsive and direction claims had already been re-pointed
into `web-admin-m3-operations.spec.ts`. Copying them into a second spec would
make **both** weaker — either can drift while the other still passes.

The rule sits beside T-063's *re-point the assertion, do not delete it*:
**re-point it once, and cross-reference from anywhere else that used to assert
it.** De-duplicating a claim that is asserted elsewhere is not dropping it.


## Dress the native control; do not replace it (2026-08-12)

T-081 built the `FileUpload` primitive one task after T-080 found that `Select`
cannot participate in a form. The same trap was waiting: a JavaScript picker with
a styled button would look right and **submit nothing**.

The shape that works is **the native input, visually hidden but never replaced,
inside a `<label htmlFor>`**. That one decision buys click-to-browse, keyboard
operation and form participation for free — no `ref.click()`, no key handler, no
hidden mirror field. The zone is clothing; the input is the control.

**And the ring follows the control.** A 1px clipped input still takes focus, so
`:focus-within` draws the ring on the zone — otherwise a keyboard user is focused
on something invisible.

**WEB-012 and a file drop.** `inputRef.current.files = dataTransfer.files` is a
property write on a rendered node. It is the *library-handoff* exception, not a
breach: there is no React API for populating a file input, everything the reader
sees stays state, and without it a dropped file displays and then submits nothing.
**The rule bans DOM writes that stand in for render.**

## A form is a column of fields, not a block (2026-08-12)

*Save notes* sat flush against its textarea with **zero** gap. The reflex is a
margin on the button; the cause is that `<form>` is a block element and nothing
had given it a layout. One `flex-direction: column` and one gap token fixed it for
every field in that form, and the same class fixed the upload form beside it.

**When two adjacent controls touch, look at their container before their margins.**

## Dead code is rarely as dead as the note says (2026-08-12)

T-077 set out to delete four orphan trees and could only delete one.

1. **A spec that reads a file as text pins it.** Four spec files `readFileSync`
   `DashboardView.tsx`; two more read `dashboard.module.css`; two read
   `FactoryList.tsx`. **Deleting any of them fails the suite at runtime, not at
   compile time** — invisible to `tsc`, to the typography gate, and to a grep
   for `import`. Always search `e2e` and `scripts`, not just `src`.
2. **A type-only cycle reads as "still referenced".** Three planning components
   were imported for types by `assistant-view.ts`, which was imported only by a
   fourth dead component. Resolve it by asking what imports the set from
   *outside* the set.
3. **Check basenames for collisions before deleting.** `planning-assistant`
   existed in two directories — one live, one dead.
4. **`operations.module.css` was not dead**, contrary to T-072's record (now
   amended). Its typography was all on dead classes; the file itself is live.

**And the enforcement the rule assumes is missing:** none of the deleted files
carried the `@retiring` banner WEB-006 §4 mandates, and `gate:retirement` does
not exist in `package.json`.


## Task-ID collision: T-076 is used twice (2026-08-12)

Two concurrent sessions both claimed **T-076** — `/visits/[id]` foundation and
`planning family — typography, visible pass`. Both are recorded, both have
session files, and the tracker now lists two `### T-076` headings.

**Not renumbered unilaterally.** Renaming either chain breaks the cross-references
already written into the other's records, the retirement ledger and the session
log. A human should pick which chain moves. **The tracker has no ID reservation,
so parallel agents will keep colliding** — claiming the next id at the *start* of
a task, in the tracker, would prevent it.

## A primitive that cannot carry a `name` cannot be in a form (2026-08-12)

T-080 nearly swapped four native `<select>`s for the SAQEEL `Select`. It is a
controlled listbox — `value` + `onChange`, **no `name`, no hidden input** — and
those four controls submit through server actions that read `FormData` by name.
The swap would have **compiled, rendered correctly, and silently sent an empty
field on every governed write**: return, reassign, visit type, repackage.

`TextInput` has the same shape problem in miniature — no `datetime-local`.

1. **Before migrating a control, ask what reads it.** A form POST reads the DOM,
   not the React tree. This is T-043's portalled-control lesson with a second
   victim, now covering `<select>` and `<input>`.
2. **Keep the native control inside `Field` and hand-reset it** — the fourth
   recorded instance of *`saqeel.css` has no global control reset by design*.
3. **Both gaps are raised, not filled.**

## A per-file sweep misses what a per-route sweep catches (2026-08-12)

T-076 fixed thirteen UTC timestamps in `visits/[id]/page.tsx` and verified zero
`YYYY-MM-DD HH:MM` in the rendered DOM. T-080 found a **fourteenth** —
`uploadedAt.slice(0, 16)` in `Attachments.tsx`, two components down. It never
showed in the DOM check **because that visit had no attachments**.

**A render check only covers the states that rendered.** Pair it with a source
sweep across every child component, and provoke the states that carry the rest.

## Re-pointing an assertion can strengthen it (2026-08-12)

`cd-027` asserted the literal `role="status"` in `ActionBar.tsx`. After the
rebuild those roles come from `Text`'s `live` prop. The replacement asserts
**three** things — the call site's prop, the `aria-live` wrapper, and that `Text`
renders `role={live}` — which the original could not: a literal `role=` in a file
proves nothing about whether it reached the DOM.

**When a re-point is forced, ask whether the old assertion tested the claim or
just a spelling.**

## A hand-rolled copy inherits the bugs, never the fixes (2026-08-12)

`DataTable.head` used `overline` where WEB-014 assigns `label`; T-059 fixed it
in the primitive. T-076 then found `planning-visit-table` **hand-rolling its own
`<table>`** with the same defect, and three `planning-bulk` components repeating
it for KPI labels — the **fifth and sixth** instances.

The primitive was fixed once. Every copy of it still carries the original bug,
and will keep carrying it, because a copy is frozen at the moment it was made.
**Before fixing a rendering defect, look for the primitive it should have been.**

## Four dead trees are now known (2026-08-12)

`DashboardView` (13), `FactoryList` (3), `operations.module.css` +
`operations-details.tsx` (26), and `components/sections/planning/*` (30) — **72
violations in code with zero importers.** They surface in every audit and cost
real time to re-diagnose each pass. One deletion task clears all four.


## A string is written for a slot; moving it breaks it (2026-08-12)

T-079 fixed four defects T-078 introduced, and they were **one defect wearing four
hats**: a string reused somewhere it was not written for.

- `auditHeading` passed as *both* the history card's title and its fourth
  section's heading — so the card printed its own name twice.
- `noJourney` used as the empty state for **Location & provenance**.
- Four sections each carrying their own immutability caveat, so one card said
  "append-only / cannot be edited / only added to" four ways.
- `"Assignment:"`, `"created by"`, `"review:"` — written for sentences
  (`Assignment: Maha`) and dropped into `<dt>`, colons and all.

**A migration moves strings into new slots, and a slot has a shape**: a label is
capitalised, carries no colon and carries no data; a value carries the data; a
caveat is stated once at the level that owns it. **Re-read the copy in its new
position, not in the diff.**

**`{n} visits under this plan` was a label containing a count** and it
mispluralised to *"1 visits"*. Splitting it into `Status` and
`Visits under this plan = 1` fixed the plural **by construction** — no plural
rule needed, because the number moved to where numbers go.

## Search for the helper before writing the fallback (2026-08-12)

The same task rendered `published` and `periodic · physical` because the route
used `t(\`enum.${v}\`, v.replace(/_/g, " "))`. `lib/text.ts` has exported
`humaniseEnum(value, locale)` and `sentenceCase(value, locale)` all along, and
`features/operations` has used
`sentenceCase(t(\`enum.${v}\`, humaniseEnum(v)))` since T-042 — the local version
was the same idea with the sentence-case missing.

**And humanisation is not translation.** It makes an untranslated column
*readable*, not localised: those 26 `enum.*` values now read *Follow up* and
*Pending supervision* on the Arabic screen too. The app-wide `enum.*` gap is what
would fix that, and it is still open.

## Split a component by what it is, not by where the line count lands (2026-08-12)

T-078's first cut of `visit-detail.tsx` was 239 lines, over the 200-line soft cap.
The tempting fix is to slice off whatever gets it under. The excess turned out to
be **ribbon track construction** — reading the data layer and the messages to
build five view models, which is not composition at all. Moved to
`features/visits/detail/ribbon.ts`, the component fell to 180 and nothing was
deleted or duplicated.

**A component over the cap is usually holding something that belongs in another
layer.** The line count is the symptom; the misplaced responsibility is the
defect. Ask what each block *is* before asking which block to cut.

## Deferring a rule violation is legitimate when the fix would be done twice (2026-08-12)

T-076 left `/visits/[id]`'s route file at 443 lines against a 40-line cap, and
said so plainly rather than letting it pass. Reaching the cap then would have
meant extracting ~240 lines of legacy JSX into components that T-078 rewrites on
SAQEEL — the same work twice, with a real chance of a silent transcription error
in between. T-078 did it once: **546 → 43**.

**State a deferred violation, name what unblocks it, and land it in the slice
that was always going to touch that code.** A quiet miss and a recorded deferral
look identical in the diff and are opposite in kind.

## Ordering can be the defect (2026-08-12)

The visit detail screen put its management actions — return, republish, reassign,
reschedule, cancel — in an `<aside>` **after five history timelines**, roughly
2,500px below the fold, while the lifecycle ribbon's *"Allowed from here"* line
sat at the top telling the reader what they were permitted to do. Nothing was
missing and nothing was mislabelled; the sequence was wrong.

**Audit the order of a screen against the reader's task, not just its contents.**
The fix moved one node and needed no new data, no new copy and no new component.


## Counting a prefix is not counting coverage (2026-08-12)

T-076 sized `/visits/[id]`'s i18n work by running `grep -c "'visit\."` over the
migrations, got 93, and wrote into the record and the tracker that slice 2 would
be *"a port of existing reviewed Arabic, not re-authoring"*. That was approved on
those terms. Checking `used ∩ seeded` **per key** before starting T-077:

```
139 keys used by the route · 21 seeded with Arabic · 3 inline · 115 with none
```

The 92 seeded `visit.*` keys belong to *other* visit surfaces — the board, the
spine, the ledger. Not one of `visit.ribbon.heading`,
`visit.detail.configuration`, `visit.att.heading` or `visit.actions.returnBtn` was
among them. The slice was not a port; it was the largest Arabic authoring job in
this programme.

**A prefix count answers "how many rows mention this", never "is my screen
covered".** Intersect the keys the code actually calls with the keys that exist.
And when an estimate that was approved turns out wrong, say so and re-agree the
scope before spending the effort — the number changed what the work *was*.

## Reviewed copy is not automatically clean copy (2026-08-12)

Nine engineering identifiers were shipping to users on that route in both
locales — `FLD-VIS-001`, `set_operational_state` and `(M8)` in English;
`PLN-REQ-011`, `M02-006`, `M02-006/008`, `M01-050` in the **seeded, reviewed**
Arabic. That is exactly the defect
`20260731120000_simple_english_terminology_redo_ar_strings.sql` exists to fix —
its own notes read *"raw '(RLS)' was directly user-visible"* — on rows that pass
never reached. **A `status: draft` review stamp is not a guarantee about content.**

## A typed namespace converts a silent-fallback class into a build failure (2026-08-12)

All 144 `V.*` references type-checked on the first run after the rewrite. That is
the property `t(key, "English")` can never have, and it is *why* 115 strings on
this route had no Arabic while nothing ever failed: the fallback is the feature.
Once the namespace is typed, a renamed or dropped key is a compile error.

This is the third route where moving copy into a resource is what made the gap
countable (WEB-013 §8) — after `/planning/immediate` and `/operations/live`.


## A screen that disagrees with itself is telling you where the bug is (2026-08-12)

T-076 found `/visits/[id]` rendering **every** timestamp in UTC — three hours
early on a Saudi ministry record. Twelve `toISOString().slice()` sites: the visit
window, submission versions, plan dates, and four event streams.

**The proof was already in the file.** `cutoffDisplay` used `Intl.DateTimeFormat`
with `timeZone: "Asia/Riyadh"` — one correct timestamp among twelve wrong ones, in
the same component, while `formatDateTime()` had been sitting in `lib/dates.ts`
the whole time. **When one instance of something is right and the rest are wrong,
the right one is the specification.** A thirteenth site was the `riyadhToday()`
defect this document already records, bounding the repackage options by the UTC
day so a package version could be judged out of its window three hours early.

**Verify a date fix in the rendered DOM, not the diff.** The check that settled it
was "zero `YYYY-MM-DD HH:MM` matches in the whole document" — a formatter that
missed a call site would still have compiled and still have passed the gate.

## `as unknown as` hides nullability, and nullability is a crash (2026-08-12)

The same route carried eight casts. Moving its reads onto `readRows`/`readSingle`
with a `Shape<T>` made the compiler report what they had suppressed: `factories`
and `package_versions.packages` are **nullable**, and both were dereferenced
unconditionally. A visit whose factory RLS hides would have thrown a runtime
`TypeError` inside a Server Component — a blank error page, not a degraded read.

T-042's rule was "every `as` in a data layer is worth re-deriving". The sharper
version: **a cast does not silence a type error, it defers it to a user.**

## Check what an assertion protects before generalising it (2026-08-12)

Re-pointing `cd-027`'s "no raw provider text" check, the obvious move was to widen
it from `page.tsx` to the whole feature source and match `/\.error\.message/`. It
failed immediately — `queries.ts` logs provider messages to the **server console**
on purpose, which is the narrowing boundary reporting *why* a read failed. The
rule was never "the string must not appear"; it is "none of it reaches the reader".
The broad check stayed on the rendered surface and only `vErr`/`attErr` widened.

**A generalised assertion that fails on correct code was the wrong generalisation.**


## A size-only audit misses an inverted hierarchy (2026-08-12)

T-075 found `EmptyState` — a shared primitive with **44 consumers** — rendering
its title at **12px/600 above a description at 14px/400**. The heading was
smaller than the text it introduces.

**Both values are on-scale, so nothing flagged.** No gate, no token audit and no
list of distinct sizes shows this; it is only visible when a title is compared
against its *own* description. With the explain-panel key/value inversion
(T-059) and the factory-portfolio heading (T-064), that is three of these found
so far.

**Dump weight and colour alongside size when auditing a route**, and compare each
heading against the thing it introduces — not against the scale.


## A dependency can put a second typeface on your screen (2026-08-12)

T-074 found `/operations/live` rendering its Mapbox attribution in
`"Helvetica Neue", Arial`. The route's own CSS module was **completely clean** —
13 lines, no typography, zero static violations. The declaration came from
`mapbox-gl`'s stylesheet, so it exists in no source file, no token and no gate
rule this repository can write.

**Third-party chrome is still your typography.** Any dependency that injects DOM
— maps, editors, charts, date pickers — ships its own font stack. Measure the
rendered families; the source will never tell you.

**And normalise it in one place.** The fix went into a new
`components/saqeel/map/map-chrome.module.css` that both map canvases compose,
which *removed* the duplicated per-route `:global()` block instead of adding a
second one.

## When a route hangs on its fallback, check the session first (2026-08-12)

T-072's record blamed the Browser pane for `/dashboard` and `/factories` sitting
on `loading.tsx` forever. The real cause, found in T-074, was **the browser
session expiring mid-task**: the routes returned the login page and the fallback
never swapped. That record has been amended.

```js
const r = await fetch(location.pathname, { credentials: 'include' });
(await r.text()).includes('Keep me signed in')   // → session is gone
```


## A raw enum is why a heading cannot be translated (2026-08-12)

T-073 found `/operations/exceptions` rendering
`<h2>{category.replace(/_/g, " ")}</h2>` — `correction overdue`, lowercase,
straight from the column. WEB-000 §9 already bans `{value: v, label: v}`, but the
reason worth remembering is the **second-order** one: a screen that prints a
column has *nothing to translate*. There is no label, so there is no Arabic, and
no amount of i18n work on that file would have produced any. **Check enum
rendering when a screen resists translation.**

## Check that an error state is reachable before designing it (2026-08-12)

The same board displayed `{invariantOk ? "✓" : "⚠"}` — a check that grouped
counts equal the source count. The first proposal replaced the tick with a proper
fail-closed state that withdraws the counts. Re-reading `groupExceptions` showed
it **partitions every source into exactly one bucket**, so the sum always equals
the length and the `⚠` branch is unreachable by construction. The redesign would
have been untestable code guarding an impossibility.

1. **A status that can only ever have one value is not a status.** It was removed,
   not restyled.
2. **Deleting it from the UI did not weaken the guarantee** — the invariant stays
   proven in `mvp2-m2-09-exceptions.spec.ts`, which is where a partition bug would
   actually be caught. A unit test is a better home for a correctness invariant
   than a glyph a supervisor cannot act on.

## Widen a shared assertion per-route, never in one string (2026-08-12)

`mvp2-modules-live.spec.ts` asserts a visible `.sq-banner, .sq-state, .alert,
.panel` across **seven** routes — the claim being *a hard state is always present,
never a blank page*. A migrated route carries none of those classes. Appending
SAQEEL selectors to the shared string would have let any of the six unmigrated
routes lose its panel and still pass on a SAQEEL match. The table now takes an
optional per-route selector; each route brings its own as it migrates, and the
default stays byte-for-byte what it was.


## The same primitive mistake, three times (2026-08-12)

`MetricStrip` (T-058), `DataTable.head` (T-059) and now `StatCard.label`
(T-072) all used `overline` (11px) for something WEB-014 §5.2 defines as
`label` (12px). Three shared primitives, one misreading of the role.

**`overline` is *only* the uppercase eyebrow above a card title.** A KPI tile
label, a table column header and a key in a key–value row are all `label`. When
a defect appears in a shared primitive, fix it there — the same bug in three
primitives cost three separate route audits to find.

## Provoke the empty and error states (2026-08-12)

T-072's fourth unstyled-heading find — `GeoMap`'s `<h4>Map unavailable</h4>`
falling to the browser default — appeared **only because the map happened to
fail on one render**. It had been invisible in every earlier pass of every
route that embeds a map.

**A route audit that only sees the happy path is incomplete.** Error, empty,
loading and permission-denied states carry their own headings and their own
absent declarations.


## A second implementation inherits only the bug (2026-08-12)

T-071 found the Live Operations map hardcoding `lightPreset: "day"`, so on this
dark application the **largest element on the screen was a white slab**. The fix
had existed for months: `GeoMap`, the map `/operations` uses, tracks `data-theme`
on `<html>` with a `MutationObserver` and re-applies `setConfigProperty` when the
user toggles. `/operations/live` re-implemented the map and carried none of it.

**Every fix made to the original since the fork was a fix this screen did not
get.** When two files render the same thing, the second one is not "similar" —
it is frozen at the moment it was copied. Look for the sibling implementation
before debugging a rendering defect.

**A disclosure that is always true is not a legend entry.** The screen rendered
all three position-provenance states as a permanent rail, including
"Rejected implausible telemetry" in critical red, **with zero inspectors on
screen** — a colour-coded alarm for a condition that was not occurring. The split
that resolved it: *"Last recorded position — not guaranteed live"* is a claim
about the whole screen and is always shown; `unavailable` and `rejected` describe
individual rows and appear only when a row is in that state.

**Two empty states are one defect until you separate the two facts.** "Nothing in
scope" and "in scope but unmapped" had been conflated in a single
`noScopeRows || hasNoPositions` condition and printed the same sentence in two
places. They are different states — the second can be true while the list is
full — so the list states the empty case once and the map discloses the unmapped
case **only when the list is not empty**. Neither can now speak over the other.

**Fold a notice into the surface it describes rather than stacking it.** Four
amber bars above the content were all disclosures *about the map's data*; they now
render in the map card, keeping their `role="status"`/`role="alert"`. That also
**avoided adding a fourth copy of the Notice component this repo already has three
of** (`dashboard-notice`, `planning-notice`, `regulation-governance-notice`) — the
primitive gap stays raised rather than quietly filled a fourth time.

**A spec that asserts nesting outlives its usefulness the moment the nesting is
right.** `aside[…] button[aria-pressed] > bdi` pinned three structural accidents
at once and blocked making the row itself the control. Re-pointed to the row: the
guarantees are that the inspector name is direction-isolated and that the row
selects — not which element contains which.


## A spec that names a file rots when the behaviour moves (2026-08-12)

T-070 moved `/operations/live`'s reads out of a 412-line route file. Every
assertion in the "Live composition contract" — access ordering, integrity
filters, geography scoping, position provenance — was written against
`live/page.tsx` **as a single file**, so twenty claims that were all still true
would have gone red. `livePageSource` is now the route **plus its feature
modules**, which is exactly how `pageSource` had already been built for
`/operations` three hundred lines up in the same spec file.

1. **Read the spec's own precedents before re-pointing it.** The right pattern
   was already in the file; inventing a new one would have made the two routes
   inconsistent.
2. **Verify a re-pointed assertion against the real file, not by eye.** All 52
   were checked by script — every substring, both ordering checks, and the
   `/operations` assertions that had to survive the shared `AccessNotice` change.
   Three would have failed silently (`latestPositionByVisit.get(v.id)` became
   `.get(visit.id)`; two English literals had moved into the locale files).
3. **Re-point a claim, and check whether it is still the right claim.**
   `live.module.css` asserted `[dir="rtl"]` — a rule WEB-002 §6 **forbids**. The
   replacement asserts the opposite: logical properties, no direction override,
   no physical `left`/`right`.

**The Arabic language was living in a route file.** ~90 strings as
`t(key, locale === "ar" ? ar : en)`, and three with no Arabic in code, in the
locale files, or in `ui_strings` — so an Arabic reader got English and nothing
ever failed. Only moving copy into a resource makes the gap countable
(WEB-013 §8), which is now the third route where that has been true.

**A streaming fallback that never swaps is the hidden pane, not a bug.** With the
Browser pane undisplayed, the rendered DOM keeps each route's `loading.tsx` in
`<main>` with the resolved subtree in a body-level div. It reproduces on routes
the task never touched. Same limitation as the zeroed layout rects already
recorded below — **check an untouched route before diagnosing your own change.**


## Deleting a font-size from a button does not make it inherit (2026-08-12)

It makes it **Arial**. T-069 hit the T-064 bug again in a new place —
`factory-verification.module.css`, where most sized classes sit on `<button>`
and `<label>`. Stripping their `font-size` to satisfy the gate would have
dropped every chip, checkbox and attach control on the iPad inspection form to
the UA default face.

**`font: inherit` is the fix, and it is gate-legal.** Use it on any control
carrying text. Delete the declaration only for pure text, which inherits `body`.

**A green gate is not a green build.** Two bulk-regex mistakes in this task —
three unbalanced JSX tags and duplicate `font: inherit` declarations — were
caught by `typecheck`, not by `gates:typography`, which reads CSS and matches
single lines. After a bulk edit: compile, then read the diff.

**`/field/*` is a role boundary, not a lost session.** It returns
`login?reason=unauthorized` for a Planner. Verifying any field surface needs an
**inspector** persona — re-authenticating as the same user will not help, and a
redirect to `/login` there must not be read as a broken session.


## Two branches can read two variables and nothing will tell you (2026-08-12)

T-068 found the Operations Center's perspective toggle changing **half** the
screen. `activeView` (client state) drove which pins the map received; the
"National performance by region" section was gated on `view` — the URL prop the
toggle never updates. Selecting *National performance* swapped the dataset and
rendered no national content at all, and arriving at `?view=performance` then
clicking back stranded the section on screen.

**Both branches existed, both compiled, both passed every gate.** The approved
design has a single flag (`opsIsNational`) gating both. Three rules follow:

1. **A control that owns half a screen owns all of it.** When one piece of state
   has two representations, the bug is not which branch is wrong — it is that
   there are two.
2. **The state ladder ranks sources of truth, not storage mechanisms.** WEB-004 §1
   puts URL state above `useState`, and `/planning` (T-055) moved up that rung
   correctly. Here it is the wrong trade: **both datasets are already props**, so
   navigating on a tab click would re-run ten server reads and a signed-URL round
   trip to render what the browser already holds. Client state was kept
   deliberately, and there is now exactly one source of truth. **Record the reason
   when you decline a rung, or the next agent will "fix" it.**
3. **Duplication is counted in destinations, not in buttons.** The exception board
   had three entry points on one screen — a toolbar button, a KPI card CTA, and
   the section listing its rows — while `saqeel-revamp.html`'s ops toolbar carries
   **one** button and no route buttons at all. The fix was not deletion: each
   addition moved onto the surface it describes. Controls 4 → 2, **destinations
   lost 0**.

**A list sorted by a key it never shows is unreadable, and a status that never
varies is not a status.** `buildHighlights` computed a timestamp for every
exception, sorted by it, and the row type had no field for it — the design's
highlight row carries that line. Every leading pill read the same word, "Open".
The pill now carries the row's kind and the title carries the record, which is a
slot re-assignment, not new copy.

**Promoting a string makes its translation gap yours.** The eight highlight kinds
were `t(key, "English")` against `ui_strings` rows that do not exist, so they
rendered English on the Arabic screen — pre-existing, and invisible inside a
run-on description. Moving them into a prominent pill is what exposed it, so they
moved into `operations.highlights` in both locales rather than being parked.

**`DashboardView.tsx:426`'s lesson needed restoring a second time.** Every region
card wore a **pinging** "Compliance unavailable" pill — eight of them, the loudest
thing on the view, saying nothing. State an absence once, at the level that owns
it, and give the card back its real number.

## A fix verified on one screen says nothing about the others (2026-08-12)

T-067 found the owner’s **original** complaint — "the font 81.5 is so big
compared to the rest" — still live on `/factories/cr/[id]`, four tasks after it
was reported. `81.5` rendered at 26px and `Not Available` at 32px from an
inline `style={{ fontSize: "2rem" }}`, two panels apart.

The scale, the primitives and the gate were all in place. This route simply had
never been opened. **Route coverage is not a property of the design system; it
is a per-route fact that has to be measured.**

**24 of its 26 headings carried no class at all** — 18 `<h2>` at the browser
default 22px, 5 `<h3>` at 17px. With T-059’s page title and T-064’s Arial
button that is now three instances of the same defect class: **the value was
decided by an absent declaration.** No grep, no token audit and no gate rule
sees a missing property. Only measuring the render does.

**A gate that blocks the easy fix is working.** The two-line repair was
`.panel h2 { font: var(--sqx-text-heading) }` in the route’s CSS module — which
would have *raised* the ratchet. Converting the markup to `Heading` cost no
more and paid down debt instead of adding it.


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
