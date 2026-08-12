# 03 — Redesign Tracker

The work board for `apps/web`. **One task at a time.** Take the top unblocked
item in NOW. Do not start a second task until the current one clears the full
Definition of Done in `rules/WEB-006-definition-of-done.md`.

Statuses: `todo` · `in-progress` · `blocked` · `done`

---

## NOW

### T-089 · `/factories` — declutter: one AI strip, one identity, one provenance card
`status: done (axe, Arabic, light theme, e2e owed)` · `rules: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013` · `est: 1.5h`
`record:` [2026-08-12-T-089-factories-declutter](sessions/2026-08/2026-08-12-T-089-factories-declutter.md)

Owner-reported: *"a lot of clutterness"*, with the instruction that **the AI part can be
done just like the dashboard version**.

**The clutter was measurable, so it was measured before anything moved.** The
workspace rendered **11 cards, 8 `h2`, 21 status pills, 131 leaf text nodes and
3,039px** for **one** factory, with **14 distinct strings appearing more than once** —
the factory name 3×, `Plant number` 3×, `Petrochemical` 3×, `Open violations` 3×,
and *"This section is available in the full factory profile."* **4×**.

**The dashboard had already fixed the AI defect and the fix was never carried
across.** `FactoryAiAdvisory` was a 226px `Card` rendering the idle line, the
provenance line **and** the no-confidence line unconditionally, above an empty
result — precisely what T-060 removed from the dashboard when `ExecutiveBrief`
became a strip whose notes render *with* a brief. **Rather than copy the strip and
create the second implementation this programme keeps warning about**
(T-071, T-076), the strip was extracted to `components/ai/advisory-strip/` and both
surfaces now compose it. Two orphaned stylesheets went with it.

**Two owner rulings on the layout.** The action sits **below** the paragraph, not
floated to the row end — the dashboard's `.action { margin-inline-start: auto }` is
what left the gap before the button. **Applying it to the shared strip grows the
dashboard's brief 44 → 74px** — stated, not hidden. And the strip moved **out of the
right rail to the top of the workspace**, full width, which is where `/dashboard`
puts its brief: `FactoryWorkspace` gained a `top` slot at `grid-column: 1 / -1`, so
it spans every column at all three breakpoints by construction rather than by a
per-breakpoint rule. Verified first in the grid at 1137px wide above both rails.

**One governed figure was rendering twice**, exactly the defect T-060 recorded on
`/dashboard`: `81.5` and its `Critical attention required` pill appeared in both the
snapshot and Risk outlook. The snapshot keeps the number and the band; the outlook
keeps only the *explanation* — drivers, model version, next action. Its
`Open factory profile` button went too: it was the **third** route to the same page.

**`latestChange` became nullable rather than a sentence.** Its "no calculation
recorded" fallback repeated the Risk trend card's empty state verbatim; the view
model now returns `null` and the line simply does not render.

```
cards 11 → 9 · pills 21 → 19 · leaf nodes 131 → 116 · workspace 3,039 → 2,512px
AI card 226 → 74px · risk outlook 390 → 268 · two provenance cards 382 → 278
duplicated strings 14 → 9 · availability sentence 4× → 1× · 4 dead locale keys
```

**Owed:** axe, Arabic (still blocked on the locale toggle), light theme, e2e. The 9
remaining repeats are the left-rail-versus-hero overlap, which is scanning versus
detail and was deliberately kept.

### T-088 · `/planning/single` — typography, route-owned code to zero
`status: done (3 of 5 components never rendered)` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014 §4.1, §8` · `est: 45m`
`record:` [2026-08-12-T-088-planning-single-typography](sessions/2026-08/2026-08-12-T-088-planning-single-typography.md)

**8 route-owned declarations → 0**, across five modules. Every one was a *layer*
move: size, weight, tracking and colour are identical before and after, verified
declaration-by-declaration against `type.module.css` **before** editing — `.text`
supplies `margin: 0`, the role supplies `font` + tracking + `text-wrap: pretty`,
the tone supplies the exact colour token. **Four classes were deleted outright**
because the primitive covered everything they carried.

**`.legend` carried a redundant `font-weight: semibold` on top of
`font: var(--sqx-text-label)`** — the `label` role is already semibold, so the
second line was a no-op. Reading the diff without checking the token would
suggest a weight change.

**`Text` cannot render a `<legend>`** — `as` has no such member. Rather than
extend the union (a design-system change the owner wants to be consulted on), the
`<legend>` keeps the element and gains a `<Text as="span" role="label">` child.
Phrasing content is legal there and the fieldset association is untouched.
**Parked**: if a third site needs it, extend the union *with agreement*.

**`planning-notice` is shared by four surfaces**, so this removes a violation
from `/planning/bulk`, `/planning/bulk/review` and `/planning/immediate` too —
and it is the only one of the five that renders outside the wizard, so it is the
one that could be measured: `<p>`, **14px / 22.4px / 400**, colour
`rgb(196,205,213)` = `--sqx-text-secondary`, margin 0 — identical to the deleted CSS.

```
/planning/single   9 → 1   (route-owned 8 → 0; the 1 is NotificationBell — shell, excluded)
baseline         851 → 843
```

**Owed:** `visit-configuration`, `identity-dossier` and `portfolio-picker` sit
behind steps 2–4 of a four-step wizard that **would not hydrate past the loading
skeleton** (the T-061/T-072/T-082 pane failure); the Factory 360 handoff URL was
tried. `<legend>` is confirmed **absent from the DOM** — that change is unrendered
and unmeasured. WEB-014 §11.3 wants it measured; drive the wizard to step 3.

### T-086 · "one/multiple" → Single/Bulk — and it was not on `/planning`
`status: done` · `rules: WEB-000 §9, WEB-006 §4, WEB-008, WEB-011, WEB-013` · `est: 1h`
`record:` [2026-08-12-T-086-single-bulk-vocabulary](sessions/2026-08/2026-08-12-T-086-single-bulk-vocabulary.md)

Owner reported "one" used for Single and "multiple" for Bulk. **Rendering all
three planning routes showed none of it there** — every "one" on `/planning`,
`/planning/bulk` and `/planning/single` is an ordinary numeral ("at least one
criterion"), and the picker already reads Single Visit / Bulk Planning /
Immediate Visit.

**The live defect was on Factory 360: one key, two English labels.**
`f360.actions.planSingle` has **no entry in either locale file**, and
`getDict("en")` returns `{}` — so for legacy `t(key, en)` call sites *the literal
in the code is the rendered string*. Three call sites hardcoded two defaults, so
the same button read **"Plan single visit"** on `/factories/cr/[id]` and
**"Plan one visit"** on `/factories/[id]` and `/field/factory-360/[id]`.

**The governance message chose the wording, not taste.** `planning-single/strings.ts:264`
renders *"Only planning staff can use **Plan a single visit**"* — a denial that
**names the control**, so the control must carry that exact name.

**A spec was already stale and would have failed.** `cd-022-identity-lens.spec.ts:422`
asserted "Plan one visit" while the source had long said "Plan a single visit" —
**the rename had already happened in code and the spec was never updated.**

**Dead copy deleted, not renamed.** The two strings the owner quoted verbatim —
`assistant.quick.planSingle`/`planBulk` — render nowhere: `PlanningAssistant`
takes `messages.assistant` but declares and renders **4** props. `assistant.*` is
47 keys of which 4 render; the rest is parked as a dead-copy sweep.

**Raised, not filled:** the three Factory 360 screens are wholly on the legacy
`t()` system (167/152/115 call sites) and **cannot read the typed JSON at all**,
so the owner's "load it from the respective JSON files" needs a T-020-scale
migration. Made consistent, **not** made compliant.

### T-084 · `/visits/[id]` — actions card on SAQEEL controls, split into `visit-actions/*`
`status: done (the 3 rewritten e2e interactions are unverified — Playwright browsers are not installed here)` · `rules: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-006, WEB-009, WEB-011, WEB-013` · `est: 2h`
`record:` [2026-08-12-T-084-visit-actions-on-saqeel-controls](sessions/2026-08/2026-08-12-T-084-visit-actions-on-saqeel-controls.md)

Owner-reported on the Management actions card, with a standing instruction to use
the design system's own select and input.

**The Arabic planner was reading English, and the helper was one file away.**
`ActionBar` rendered `{o.label_en}` for every governed return and cancel reason
while `features/visits/detail/view.ts:24` already exported `reasonLabel()`, which
picks `label_ar` by locale — and `field/inspection/[id]/results/page.tsx:70` had
been doing it correctly all along. **Third instance of T-079's lesson: search for
the helper before writing the fallback.** Options are now built in the view model,
so `label_en` appears in no component.

**`Select` could not POST, which is why the banned native `<select>` was still
there.** T-080 raised the gap and nothing filled it. `Select` now takes `name`
(hidden input carrying the value), `defaultValue` (uncontrolled) and `required`
(`aria-required`); `DateRangePicker` takes `nameFrom`/`nameTo`. **The uncontrolled
mode is the point: the forms gained zero `useState`** — WEB-004 §1 rung 4, read on
submit through `FormData`.

**The reschedule window needed no new component.** `DateRangePicker` already had
`withTime`, `timeStep` and `timeLabels` and already emitted `YYYY-MM-DDTHH:mm` —
the owner was right that it existed. Both `datetime-local` inputs are gone with no
primitive built, and `riyadhLocalInput()` joined `lib/dates.ts` so the window
round-trips in Riyadh time rather than three hours early.

**Migrating to a listbox breaks `selectOption()`, and that is unavoidable.** Three
spec call sites drove the native control; they now click the trigger and pick the
row by the label the screen shows, sourced from the same roster RPC the page reads
so spec and UI cannot disagree. `cd-027:97` also read `ActionBar.tsx` as **source
text** — re-pointed to the new shell before the file was deleted (the T-077/T-078
`readFileSync` trap). **None of the three could be executed here.**

**A blank listbox was a regression I introduced and had to fix.** This environment
seeds zero return reasons; the native control at least rendered `—`, the new one
opened onto an empty panel. `Select` gained `emptyLabel`, so absent data renders as
a state (rule 9) — verified rendering *No options are configured* as a disabled row.

```
ActionBar.tsx 257 lines → deleted; visit-actions/ 12 files, largest 153
native <select> 2 → 0 · input[type=datetime-local] 2 → 0 · useState in forms 0
control rows   90|265|65 and 65|265|77  →  507|507|65 and 501|501|77
i18n actions   33 → 44 keys per locale at asserted parity (2 dead keys deleted)
```

**Owed:** the e2e suite, axe, the Arabic render (still blocked on the locale
toggle), light theme. **`visit-actions/` is at the 12-file cap** — the next form
needs a regroup, not another file.

### T-085 · `/planning` — the Method filter offered six values that never match
`status: done` · `rules: WEB-000 §9, WEB-004, WEB-006 §4, WEB-008, WEB-011, WEB-013` · `est: 1h`
`record:` [2026-08-12-T-085-planning-method-filter](sessions/2026-08/2026-08-12-T-085-planning-method-filter.md)

**Ten options, six of them broken.** `planning-screen.tsx:97` read
`Object.entries(messages.methods)` as a value→label map. It is not — `methods`
held **nine** keys: three real method values *and* six title/description strings
for a card picker. Selecting *"Plan bulk visits"* set `?method=bulkTitle`, which
reached the database unvalidated and returned **an empty list with no error** —
it read as "no visits match" rather than "that is not a filter".

**One object was serving two incompatible contracts** and only one was true:
`planning-drafts.tsx:38` uses the same object correctly as `methods[draft.method]`.

**Fixed at two layers, because either alone leaves the hole open.** Cleaning the
JSON would have made `Object.entries` correct *by coincidence* — the next key
added re-breaks it. Options now derive from a canonical `PLANNING_METHODS`, and
the URL parameter is whitelisted against the same constant. **The whitelist
pattern already existed three lines up** — `tab` was validated against
`PLANNING_TABS` in the same function while `method` was passed straight through.

```
filter options   10 → 4      broken options   6 → 0
dead strings     12 → 0      dead source      −33 lines (create-methods.ts deleted)

measured, seeded Planner, "Showing N of M":
no filter 101 · ?method=bulkTitle 0 → 101 · ?method=bulk 8 (unchanged) · single 1 (unchanged)
```

**New defect found and parked, needing a ruling: `?method=immediate` can never
match.** The embed turns `!inner` when a method filter is set, while the label
`"immediate"` is *derived from `visit_plans` being NULL* — so a visit shown as
Immediate is exactly one the join excludes. It is now **more** visible, not less.

### T-087 · `/planning/bulk/review` — typography, 30 → 0
`status: done (nothing render-verified — the session expired)` · `rules: WEB-000, WEB-002, WEB-003, WEB-006 §4, WEB-008, WEB-009, WEB-011, WEB-014 §4.1, §8, §11.4` · `est: 1.5h`
`record:` [2026-08-12-T-087-bulk-review-typography](sessions/2026-08/2026-08-12-T-087-bulk-review-typography.md)

**30 declarations across 9 modules → 0.** The route had never been swept; its only
remaining violation is `NotificationBell.tsx:270`, the shell.

**The whole app renders body text at two line-heights, and this route had both.**
`<body>` is matched by **two** `font:` shorthands — `saqeel.css:869`
(`--sqx-text-body`, 1.6 → 22.4px) and `saqeel-runtime.css:19`
(`--type-body-font`, 1.5 → 21px) — and **the frozen legacy sheet wins on load
order.** So the twelve `font-size`-only classes here were rendering the body
*size* with legacy *leading*. Measured before: `review-standby`'s `.note` at
**14px/21px**, against the already-migrated `PlanningNotice` at **14px/22.4px**.

**KPI values change weight 600 → 700, deliberately.** `.value`/`.cellValue` set
metric *size* with `--sqx-weight-semibold` — assembled from parts instead of
using the role. `--sqx-text-metric-weight` is bold, so `<Metric>` renders 700, and
WEB-014 §2/§5.2 make every number `metric`. The most visible change in the diff.

**Two focusable headings were a real §11.4 primitive gap, closed without touching
the design system.** Both need `subheading` *plus* `ref` *plus* `tabIndex`;
`Heading` accepts neither and `Text` has no `subheading` role. Owner was asked
and did not answer, so the **reversible** wrapper shipped — a pattern already in
4 places in this repo. **It also fixes an a11y defect:** `review-outcome`'s
`<h3 role={live}>` was **not a heading in the accessibility tree**, because
`role="status"` replaces the heading role.

`review-standby.module.css` **deleted** (its only class was `.note`);
`review-context`'s `.moment` was **dead** — 17 lines including a
`:focus-visible` block, orphaned when the control became `DateRangePicker`.

```
/planning/bulk/review  31 → 1   (route-owned 30 → 0)
baseline              843 → 813
```

**Owed, and it is the real gap: nothing was render-verified.** The route shows
standby without a staged bulk plan, and the session **expired mid-check**
(`?reason=expired`). Every claim about rendered output is derived from
`type.module.css`/`saqeel.css`, not observed.

### T-083 · design-system retired-role floor
`status: done` · `rules: WEB-000, WEB-002 §2, WEB-006, WEB-008, WEB-011, WEB-014 §2.1, §4.1` · `est: 45m`
`record:` [2026-08-12-T-083-design-system-retired-role-floor](sessions/2026-08/2026-08-12-T-083-design-system-retired-role-floor.md)

**Every route in the application inherited a 6–9 violation floor from shared
code it does not control**, which made "is this route clean?" unanswerable. 12
declarations across 8 `components/saqeel/*` stylesheets, every one a single token
rename — `caption → body`, `code → mono`.

**The fix had to live inside the design system, and that is not a contradiction.**
WEB-014 §4.1 makes `components/saqeel/` the only legal authoring zone for
typography, so a retired role referenced there cannot be repaired from anywhere
else. Owner approved on an explicit split: **`app/saqeel.css` and
`components/saqeel/type/` untouched** — no token added, removed, renamed or
revalued — component stylesheets changed. **Do not read "design system
untouched" as covering `saqeel/*/*.module.css`.**

**The Arabic case could have broken it and was checked rather than assumed.**
`:lang(ar)` overrides `--sqx-text-body-line` to `1.8` while
`--sqx-text-caption-line` is `var(--sqx-text-body-line)`; custom properties
substitute at computed-value time, so had `lang="ar"` sat on `<body>` while the
aliases were declared on `:root`, caption would have computed `1.6` against
body's `1.8` and this rename would have **silently lengthened every affected line
in Arabic**. `layout.tsx:72` puts `lang` on `<html>`, which *is* `:root`.
Verified live in both locales.

```
gate            863 → 851 (delta exactly 12 — no concurrent work absorbed)
/factories        7 → 1     /planning/visits/[id]   8 → 1
/factories/[id]   7 → 1     /planning/immediate     8 → 2
/planning        52 → 46    /planning/bulk/review  41 → 32
```

The residual 1 on every otherwise-clean route is `NotificationBell.tsx:270`.

**Owed:** e2e (needs a production build).

### T-082 · `/visits/[id]` — the write surface stops collapsing to intrinsic width
`status: done (Arabic/RTL render owed — the locale toggle would not switch)` · `rules: WEB-000, WEB-002, WEB-003, WEB-004, WEB-009, WEB-011, WEB-012, WEB-013, WEB-014` · `est: 1h`
`record:` [2026-08-12-T-082-visit-detail-write-surface-layout](sessions/2026-08/2026-08-12-T-082-visit-detail-write-surface-layout.md)

Owner-reported on T-081's output: the notes textarea is a sliver, the uploader is
an orphan on its own line with a screen's width of dead space beside it, and a
chosen file shows no preview.

**One declaration caused both symptoms, and it was T-081's own fix.**
`align-items: flex-start` on `.stackedForm`/`.uploadForm` sets the **cross** axis
of a **column** flex container, so every field shrank to intrinsic width. Measured
live: textarea **178px** (the `cols=20` UA default) inside a 444px form; drop zone
**229px** (its longest text line). T-081 added it to stop the submit stretching —
it fixed the button and broke every field above it. **A container-level alignment
is not a way to size one child; give the child its own row.**

**`repeat(auto-fit, minmax(min(18rem, 100%), 1fr))` needs the `min()`, and only
measurement said so.** Without it the 288px track floor exceeded the container at
280px and the zone overflowed its own grid — a 320px reflow failure invisible in
source. The `min()` idiom keeps the collapse behaviour and never overflows.
**auto-fit is what makes the empty state right:** with no file chosen the empty
track collapses and the zone spans the full row; a chosen file takes column two.
Zero media queries.

**The blob preview needed no `useEffect` and leaks nothing.** The object URL is
created in the change handler and revoked in the image's own `onLoad` once the
bitmap is decoded, with the `<img>` keyed by the URL. WEB-004 §3's disposal case
never had to be opened. Verified on the live route: `src` scheme `blob`, image
still painted, and a `fetch` of that URL now fails.

**Write-path integrity proven, not assumed:** after a scripted selection the native
input still reported `files.length === 1`, so the server action's `FormData` read
is untouched. No action signature, `name`, hidden identity field or guard moved.

**Three statements of one permission fact became one.** The Notes hint, the
`fileLabel` parenthetical and the empty state each said *planner or operations
only*; `Attachments` now carries it once as the `CardHeader description` it had
been missing while Notes had one. `noFileChosen` deleted — the zone already says
what it said. `notes.saving`/`att.uploading` deleted: **`Button.busy` keeps its
label by documented design, so both keys had been threaded through three layers to
render nowhere.**

```
textarea   178px fixed → fills its form (288 at 320px, 513 capped by --sqx-prose-max)
drop zone  229px orphan → full row when empty · 2 equal columns when chosen
320px reflow  overflow → 0    att+notes keys 23 → 23 per locale at asserted parity
```

**Owner review round 2 — five follow-ups, and two of them found my own defects.**

**The prose cap was mine and it was wrong for this field.** I had capped the notes
form at `--sqx-prose-max` (68ch) for readability; the owner wants full width.
Removed — the textarea now measures **1095px = its form = the card's content box**
on the live route.

**The `18rem` grid-track floor was off-pattern and I introduced it.** WEB-000 §7
bans length literals outside `saqeel.css`, and a sweep of every migrated saqeel
module shows rem literals appear in **media-query breakpoints only** — never as a
size or a track. `repeat(auto-fit, minmax(min(18rem, 100%), 1fr))` became
`grid-template-columns: minmax(0, 1fr)` plus a `@media (min-width: 48rem)` rule on
`.fields[data-filled]`, matching `timeline` and `date-range-picker`. Identical
geometry at all five widths, one literal, in the one place the codebase puts them.

**`object-fit: cover` does not bound an image whose parent has no definite
height.** The redesigned preview grew to **780×487** and dragged the drop zone to
match, because `.well` was a flex item with `flex-basis: 0` inside a grid row sized
by its own content — circular, so it resolved to the image's intrinsic height.
`block-size` lost to `flex-basis`; `min-block-size: 0` did not help. **The fix is
to take the image out of flow** (`position: absolute; inset: 0`), so it can never
contribute to layout. Row is now a stable **145px** and the image fills its cell
edge to edge at every width.

**Focus is now a border colour, not a ring** — `outline: none` +
`border-color: var(--sqx-border-focus)` on `TextInput`, `Textarea`, the
`FileUpload` zone and this route's two native controls. **`Select` already did
exactly this**, so the design system disagreed with itself; the code is now
consistent and **WEB-009 §5 is the thing that needs amending — flagged, not
silently broken.** `[aria-invalid]` was moved *above* `:focus-visible` so a focused
invalid field still shows focus; previously outline and border were different
properties and could not conflict. Measured: `rgba(255,255,255,.16)` →
`rgb(180,154,216)`, border width unchanged, **size shift 0×0**, contrast **7.13:1**
dark / **11.5:1** light, both far above 1.4.11's 3:1.

**A chosen file can be discarded.** `IconButton dismiss` in the preview bar rebuilds
the `FileList` through a `DataTransfer` — the same sanctioned handoff T-081
established — so partial removal keeps the right file and a full clear leaves
`files.length === 0` **and** `value === ""`. Focus returns to the input. Proven on
the live route: preview unmounted, grid back to one column, state line and
`aria-describedby` both cleared.

**Two verification traps worth keeping.** `getComputedStyle` returns a **live**
object — snapshotting `focused` then blurring and reading `resting` compares the
value to itself and always reports "no change"; copy the strings out first. And a
border-colour read taken immediately after focus catches a **mid-transition**
value, so kill transitions before measuring.

**Owed and unchanged:** the Arabic/RTL render — `/ar/…` and the shell's `ع` toggle
both kept `lang="en"`, a locale-switching defect outside this diff. Also owed: axe,
200% zoom, light theme, e2e. **The Browser pane cannot validate focus at all:**
`document.hasFocus()` is `false` there, so `:focus` never applies no matter what
`document.activeElement` says.

**Round 3 — hover beat focus, and it was specificity, not order.** Owner-reported:
a focused input lost its focus colour under the pointer. **A regression I
introduced.** `.root:hover:not(:disabled):not([readonly])` is **(0,4,0)** against
`:focus-visible` and `[aria-invalid]` at **(0,2,0)** — reordering cannot fix that,
because specificity is resolved before source order. It was latent before this
task: focus set `outline` while hover set `border-color`, two properties that could
not collide, so only the invalid-and-hovered case was wrong and nobody saw it.
**Narrow the hover rule, do not inflate the others** —
`:not(:focus-visible):not([aria-invalid])`. Second instance in the same diff:
`.zone:hover` sat *before* `.zone[data-filled]` at equal specificity, so a filled
zone stopped responding to hover entirely. Reordered. **Verified by state matrix,
not inspection:** 16 combinations on `TextInput`/`Textarea` and 8 on the zone, all
correct — 2 of the 8 would have failed before the reorder. **`FileUpload` has no
invalid state**, which the matrix surfaced; not added, it needs an API ruling.

**Reported, not done:** the reusable `Textarea` primitive already exists and is
sound; **~50 hand-rolled `<textarea>` remain across unmigrated screens** on
`sq-textarea` / `input` / `sq-input`. That sweep is its own task — see PARKED.

### T-078 · repair the already-broken responsive spec
`status: partial — one spec repaired; the deletion-enabling re-pointing is not started` · `rules: WEB-000, WEB-006 §4, WEB-008` · `est: 45m`
`record:` [2026-08-12-T-078-repair-the-broken-responsive-spec](sessions/2026-08/2026-08-12-T-078-repair-the-broken-responsive-spec.md)

**The suite is already broken, and not by this programme's deletions.**
`responsive-dashboard-operations.spec.ts` reads `live/live.module.css` and
`live/LiveOps.tsx`, both deleted by T-070/T-071. Its `read()` is a bare
`readFileSync`, so **two tests throw before a single assertion runs**, and
`git log` shows the spec was never touched by that rebuild — **the same work
that produced the "a spec that names a file rots" lesson missed one of its own
call sites.**

**The live claims were already re-pointed, in a different spec.**
`web-admin-m3-operations.spec.ts:302-312` owns them, including the ruling that
the old `[dir="rtl"]` override is **not** carried across because WEB-002 §6
forbids one. So the repair here was to **cross-reference, not duplicate** —
a claim asserted in two specs makes both weaker, because either can drift while
the other still passes. `providerFailed` and the locale contract *did* need
re-pointing (claims about the component, not the stylesheet) and now read
`operations-live.tsx`.

**All 13 assertions verified by script against the real files** — T-070's rule
that a re-pointed assertion is checked, never eyeballed.

**The dead dashboard tree is bigger than recorded:** `RevampStrategicView.tsx`
is imported **only** by `DashboardView.tsx`, which has zero importers — a second
closed dead pair after T-077's `assistant-view.ts` cycle.

**Not started:** the deletion-enabling re-pointing. **7 spec files** hold
governance claims against the doomed files — `"Compliance in approved
inspections"`, `href="/reports"`, `"Open records"` — each needing its equivalent
located on the shipped surface first, and **some may no longer be the right
claim**. It wants a suite run to confirm, which needs a production build.


### T-081 · `FileUpload` — a drag-and-drop upload primitive that still submits
`status: done (a real drop was not exercised)` · `rules: WEB-000, WEB-002 §2, WEB-003, WEB-009, WEB-011, WEB-012, WEB-013` · `est: 45m`
`record:` [2026-08-12-T-081-file-upload-primitive](sessions/2026-08/2026-08-12-T-081-file-upload-primitive.md)

Owner-reported: the file field was still a raw `Choose File / No file chosen`, and
*Save notes* sat flush against its textarea.

**The native input is the control; the zone is only its clothing.** T-080 recorded
that `Select` cannot participate in a form because it has no `name` — building an
upload the same way would repeat that defect on a **write path**. So
`<input type="file">` is kept, visually hidden but never replaced, and the drop
zone is a `<label htmlFor>`: click-to-browse works **natively**, with no key
handler and no `ref.click()`, and the keyboard works because focus lands on the
real input.

**A drop must hand its `FileList` to that input — the one imperative write.**
`inputRef.current.files = dataTransfer.files` is WEB-012's sanctioned *library
handoff*: there is no React way to populate a file input, and without it a dropped
file would display and then submit nothing. **The rule bans DOM writes that
substitute for render, not the handoff a browser API requires.**

**The gap defect was structural, not a token.** `<form>` is a block, so the button
sat flush with zero gap. A form is a **column of fields** — `.stackedForm` gives it
`flex-direction: column` and one gap token, now 12 px, verified in the DOM.

2 registry icons added (`upload`, `attachment`); 4 keys both locales, parity 147.
**Owed:** a real drag-and-drop was never exercised — click-to-browse is proven
structurally, not by opening a picker. **4 new Arabic strings need review.**

### T-077 · delete the dead planning tree (1 of 4 orphan trees)
`status: done — the other 3 trees are blocked on spec work` · `rules: WEB-000, WEB-006 §4, WEB-008, WEB-011` · `est: 45m`
`record:` [2026-08-12-T-077-delete-the-dead-planning-tree](sessions/2026-08/2026-08-12-T-077-delete-the-dead-planning-tree.md)

**The task as scoped was wrong, and reading the gate is what revealed it.** "Four
dead trees, 72 violations" is really **one deletable tree and three blocked
ones**. WEB-006 §4's second condition — *no string-referenced path, no test
fixture references it* — fails for the rest:

| Tree | Blocker |
| --- | --- |
| `DashboardView` + 3 siblings | **4 spec files read `DashboardView.tsx` as source text** |
| `dashboard.module.css` | read by 2 spec files |
| `FactoryList` + its CSS | read by 2 spec files |
| `operations.module.css` | **not dead** — live `OperationsPreview` imports it |

**Deleting a file a spec reads as text does not fail `tsc` — it fails the suite
at runtime** when `readFileSync` throws. Invisible to the type checker, the
typography gate, and any grep for `import`.

**T-072's record was wrong about `operations.module.css` and has been amended.**
All 49 of its typography declarations sit on dead classes, but the *file* is
live for seven `preview*` classes.

**The deletable tree was larger and more tangled than the parked note said** — 10
directories, not 7. `planning-skeleton` is **live** and kept; three others were
imported **for types only** by `features/planning/assistant-view.ts`, which is
itself imported only by `planning-recommendations`, which is dead — **a closed
dead cycle that reads as "still referenced" to a naive import search.** There is
also a **name collision**: `planning-assistant` exists in both
`components/planning/` (live, edited in T-076) and `components/sections/planning/`
(dead) — deleting by basename would have taken the live one.

```
9 files deleted · 38,809 bytes (~38 KB) · 30 violations · repo 893 → 863
```

**Owed:** the full e2e suite (needs a production build) — WEB-006 §4 formally
requires it even for zero-reference code.


### T-080 · `/visits/[id]` — write surface on SAQEEL (slice 3b of 3)
`status: done (axe, 320px, keyboard, Arabic, e2e owed for the route)` · `rules: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011` · `est: 1h`
`record:` [2026-08-12-T-080-visit-detail-write-surface](sessions/2026-08/2026-08-12-T-080-visit-detail-write-surface.md)

**The route now renders zero legacy classes**, verified in the DOM rather than the
source. 91 legacy class uses across the three write components → 0.

**Two primitive gaps stopped the obvious migration, and they are the same gap.**
`Select` is a controlled listbox — `value` + `onChange`, **no `name`, no hidden
input** — so it cannot participate in a form POST. Four governed transitions
submit through server actions reading `FormData` by name; swapping them would have
compiled, rendered correctly and **silently sent an empty field on every write**.
`TextInput` has the same shape problem in miniature: no `datetime-local`. Both keep
native controls inside `Field`, hand-reset in the module — the second victim of
T-043's portalled-control lesson. **Raised, not filled.**

**A fourteenth UTC timestamp was hiding in a child component.** T-076 fixed
thirteen in `page.tsx`; `Attachments` had `uploadedAt.slice(0, 16)` two components
down. **A per-file sweep misses what a per-route sweep catches.**

**Live regions moved from literal roles to `Text live=`**, and the re-pointed
assertion is *stronger* than the original — it now checks the call site, the
`aria-live` wrapper **and** that the primitive renders `role`, which the old
source-text check could not.

**Write-path integrity asserted by script:** 8 server actions bound, 4 identity
fields per form, both guards untouched, soft delete intact, all 8 spec-pinned
control ids present. **The e2e suite has not run and is the real proof.**

### T-076 · planning family — typography, visible pass
`status: partial — visible defects fixed on all three routes; primitive migration outstanding` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014` · `est: 1.5h`
`record:` [2026-08-12-T-076-planning-family-typography](sessions/2026-08/2026-08-12-T-076-planning-family-typography.md)

Owner asked for all three planning routes. **Every rendered defect is fixed;
~98 architectural violations remain.**

**The most-repeated defect in this programme appeared twice more.**
`planning-visit-table` hand-rolls its own `<table>` with `<th>` on `overline`
(11px) — it does **not** use the shared `DataTable`, whose identical defect was
fixed in T-059. Three `planning-bulk` components did the same for KPI labels.
That is the **fifth and sixth** instance. **A hand-rolled copy inherits the
original's bugs and none of its fixes** — same conclusion T-071 drew about the
live map.

**The `81.5` defect class returned on `/planning/bulk`** — two KPI numbers on
one screen at **32px and 28px**. The 32px came from `.kpi-value`, a legacy
global in the **frozen** `saqeel-components.css`, still shared with admin
screens. The frozen sheet stays; `EligibilityLedger` stopped using it and now
composes `Text`/`Metric`.

**Four of the seven eyebrow swaps collided with an existing `description`** —
step label vs source/freshness provenance, both supporting context, so they were
**merged with the ` · ` separator already in use**. No new i18n keys. The naive
swap produced duplicate JSX attributes and typecheck caught it.

**A structural regex matched zero across all 7 sites**; a line-based swap worked
first time. **A silent zero-match is the same failure mode as T-058's gate rule
that matched 0 of 24 — stop tuning, change approach.**

```
/planning        6 → 5 sizes, 11px gone
/planning/bulk   8 → 6 sizes, 32px gone, both KPIs at 28px
violations     172 → 128  (30 of which are dead code)
```

**Fourth dead tree confirmed:** `components/sections/planning/*` — 7 components,
**30 violations**, zero importers.

**Owed:** `/planning/single`'s after-state was never re-rendered (pane would not
complete it; SSR healthy, session alive), plus axe, 320px, Arabic/RTL.


### T-079 · `/visits/[id]` — label shape: humanised enums, history card repaired
`status: done` · `rules: WEB-000 §9, WEB-008 §2, WEB-011, WEB-013` · `est: 40m`
`record:` [2026-08-12-T-079-visit-detail-label-shape](sessions/2026-08/2026-08-12-T-079-visit-detail-label-shape.md)

Owner-reported on T-078's output. **The helper already existed and I had written a
worse copy of it** — `lib/text.ts` exports `humaniseEnum`/`sentenceCase` and
`operations` has used `sentenceCase(t(…, humaniseEnum(v)))` since T-042, while
this route used a bare `replace(/_/g, " ")`, which is exactly why `published` and
`periodic · physical` rendered lowercase. **Search for the helper before writing
the fallback.**

**Four defects T-078 introduced, all one shape — a string used in a slot it was
not written for:** the History card printed its own title twice (`auditHeading`
as both card title and section heading); `noJourney` was the empty state for
**Location**; four sections each carried their own immutability caveat so the card
said it four ways; and prose fragments (`"Assignment:"`, `"created by"`,
`"review:"`) were reused as `<dt>` labels, colons and all.

**`{n} visits under this plan` was a label containing a count and it
mispluralised** — "1 visits". Split into `Status` and `Visits under this plan = 1`,
which fixes the plural by construction and puts the number where values go.
12 lowercase standalone values re-cased; **Arabic unaffected (no case)**.

**Scope stated honestly:** one site, not a sweep — `replace(/_/g, " ")` remains in
`visits/calendar`, `visits/map`, `operations/Monitoring` and a dozen `admin/*`
screens, **all unmigrated**. **5 new Arabic strings need review.**

### T-078 · `/visits/[id]` — read surface on SAQEEL (slice 3a of 3)
`status: partial (the three write components are slice 3b)` · `rules: WEB-000, WEB-001, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011` · `est: 2h`
`record:` [2026-08-12-T-078-visit-detail-screen](sessions/2026-08/2026-08-12-T-078-visit-detail-screen.md)

**Route file 439 → 43 — the cap is met.** T-076 deliberately deferred it rather
than extract legacy JSX twice; this is what that deferral was for. Read surface:
**187 `className` uses → 6**, all CSS-module refs, zero legacy classes.

**Five history panels → one card with four anchored sections** (owner ruling).
The route's own comment recorded that the audit trigger *"already records every
status transition"*, so a return appeared in **both** the lifecycle stream and the
audit log, worded differently. Each stream keeps its heading, empty sentence and
anchor (`#lifecycle` `#location` `#journey` `#audit`) so the ribbon links and the
spec still resolve. Checklists is not an event stream and stayed its own card.

**The actions moved above the history — the ordering *was* the defect.**
`ActionBar` sat after five timelines, ~2,500px down, while the ribbon's "Allowed
from here" told the reader what they could do. Verified in the DOM: ribbon →
actions → configuration → plan → checklists → notes → attachments → history.

**Five glyphs gone, CD-027 intact.** `▣ ● ⬡ ◇ ◆` were `aria-hidden` decoration
carrying nothing the label did not. The rebuilt ribbon keeps the tablist named
*state domains*, five tabs, a visible tabpanel, roving tabindex with
Arrow/Home/End and the 412px reflow; state is now a `StatusPill` — text plus
shape rather than a glyph.

**A 239-line component was a layering smell, not a length problem.** The excess
was ribbon **track construction** — view-model work, not composition — so it moved
to `features/visits/detail/ribbon.ts` and the component fell to 180 with nothing
deleted. **Split by what the code is, not by where the line count lands.**

`DualStateRibbon` and `FocusScroll` are `@retiring` at **zero importers** with
ledger rows. **Slice 3b:** `ActionBar` (247), `Attachments` (100), `NotesEditor`
(53) are still legacy — the write surface was kept out of this diff so no form
contract moves alongside a layout change.

### T-077 · `/visits/[id]` — bilingual resources, 139 keys (slice 2 of 3)
`status: partial (the visible screen is slice 3)` · `rules: WEB-000, WEB-006, WEB-008, WEB-011, WEB-013` · `est: 1.5h`
`record:` [2026-08-12-T-077-visit-detail-resources](sessions/2026-08/2026-08-12-T-077-visit-detail-resources.md)

**The slice was scoped wrong and it was corrected before any work.** T-076's
record and this board both promised "port the ~98 seeded `visit.*` Arabic rows —
moved, not re-authored". Cross-referencing key by key: **139 keys used, 21 seeded
with Arabic, 3 inline, 115 with no Arabic anywhere.** The 92 seeded keys belong to
*other* visit surfaces — `spine`, `ledger`, `elig`, `outcome`, `list`, `map` — the
board and its siblings, not the detail route.

**Counting a prefix is not counting coverage.** `grep -c "'visit\."` returns a
number that looks like an answer and is not one; the check that mattered was
`used ∩ seeded`, per key. Owner ruled: author the 115, flagged for review.

**Nine engineering identifiers were shipping to users in both locales** —
`FLD-VIS-001`, `set_operational_state`, `(M8)` in English; `PLN-REQ-011`,
`M02-006`, `M01-050` and more in the **seeded, reviewed** Arabic. Exactly what the
`simple_english_terminology_redo` migration existed to fix, on rows it never
reached. **Reviewed copy is not automatically clean copy.**

**Typed resources turned the whole bug class into a compile error:** 144 `V.*`
references type-checked on the first run, so a renamed key is now a build failure
rather than a silent English fallback — which is precisely why 115 strings had
gone missing with nothing ever failing. 142 `t()` + 3 `tr()` → **0**; the last
`locale === "ar"` was not copy but a formatter duplicating `derived.cutoffDisplay`.

**115 new Arabic strings need native review** — the largest such debt raised by
one task here. **Parked:** 26 `enum.*` values still render English on the Arabic
screen (app-wide `ui_strings` vocabulary, not fixable inside one route).

### T-076 · `/visits/[id]` — foundation: Riyadh timestamps, narrowed reads, skeleton (slice 1 of 3)
`status: partial (i18n is slice 2, the visible screen is slice 3)` · `rules: WEB-000, WEB-001, WEB-002, WEB-005, WEB-006, WEB-008, WEB-011` · `est: 2h`
`record:` [2026-08-12-T-076-visit-detail-foundation](sessions/2026-08/2026-08-12-T-076-visit-detail-foundation.md)

**Every timestamp on a ministry record was rendering in UTC — three hours early.**
Twelve `toISOString().slice()` sites printed the visit window, submissions, plan
dates, lifecycle, location, journey and audit times. **The screen already
disagreed with itself:** `cutoffDisplay` used `Intl.DateTimeFormat` with
`timeZone: "Asia/Riyadh"` — one correct stamp among twelve wrong ones in the same
component, while `formatDateTime()` had existed in `lib/dates.ts` throughout. A
thirteenth site was the `riyadhToday()` defect this board already records, bounding
the repackage options by the UTC day. The rendered DOM now holds **zero**
`YYYY-MM-DD HH:MM` stamps and every one carries `(Riyadh)`.

**The 8 `as unknown as` casts were not cosmetic — three were lies.** Moving the
reads onto `readRows`/`readSingle` + `Shape<T>` made the compiler report what the
casts suppressed: `factories` and `package_versions.packages` are **nullable** and
both were dereferenced unconditionally, so a visit whose factory RLS hides would
have thrown inside a Server Component. 9 inline reads + 2 RPCs → **0** in the route.

**A negative assertion had to get narrower, not wider.** Generalising "no raw
provider text" to `/\.error\.message/` across the feature modules failed at once —
`queries.ts` logs provider messages to the **server console** deliberately, which
is the narrowing boundary reporting why a read failed. **Check what an assertion
protects before generalising it.**

**The route file is 443 lines, not ≤40, deliberately** — the cap needs ~240 lines
of legacy JSX extracted into components that slice 3 rewrites, so it moves there
rather than being transcribed twice. Stated, not quietly missed.

**Slice 2:** port the ~98 seeded `visit.*` Arabic rows out of four `ui_strings`
migrations into locale files — existing reviewed Arabic, moved, not re-authored.
**Slice 3:** ≤40-line route, SAQEEL throughout, the ribbon's five glyphs, actions
promoted above the history, five history panels → one card with four anchored
sections (owner ruling).

### T-075 · `/operations/exceptions` — typography
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014` · `est: 30m`
`record:` [2026-08-12-T-075-exception-board-typography](sessions/2026-08/2026-08-12-T-075-exception-board-typography.md)

**T-073's rebuild is the cleanest thing in this programme** — 36-line
`page.tsx`, and `operations-board` has **no CSS module at all**, just
composition of design-system primitives. Nothing in the route or its components
was touched.

**The one defect was an inverted hierarchy in `EmptyState`** — a shared
primitive with **44 consumers**:

```
title        12px / 600   ← smaller than
description  14px / 400   ← the text it introduces
```

Now `subheading` (16px) over `body` (14px). `subheading` was chosen on WEB-014
§2's own wording — "a named group inside a card" is exactly what an empty state
is — and `.description` was also still on the **retired `caption`** role.

**A size-only audit would have missed this.** Both 12px and 14px are on-scale;
the defect is only visible when you compare a title against its *own*
description. **Dump weight and colour alongside size.**

**Owed, and it is most of the screen:** this Planner sees no open exceptions, so
**the populated board — groups, rows, counts — never rendered.** Only the empty
state was observable.


### T-074 · `/operations/live` — typography
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014` · `est: 30m`
`record:` [2026-08-12-T-074-operations-live-typography](sessions/2026-08/2026-08-12-T-074-operations-live-typography.md)

**T-070/T-071's rebuild arrived essentially correct** — zero static violations,
a 32-line `page.tsx`, a 13-line CSS module with **no typography at all**, and a
render of **5 sizes (30 · 28 · 20 · 14 · 12), all on-scale, zero unstyled
headings**. First route in the programme that needed nothing structural.

**One defect, and only measurement could see it: `allPlex: false`.** The Mapbox
attribution rendered in `"Helvetica Neue", Arial` — **a second typeface**,
injected by `mapbox-gl`'s own stylesheet, so it appears in no source file, no
token and no gate rule. The canvas CSS was genuinely clean; the defect lived in
a dependency.

**Fixed centrally.** Mapbox normalisation already existed in exactly one place —
a per-route `:global()` block in `operations-map-panel.module.css` carrying a
baselined violation. Copying it would have duplicated a hack and *added* a
violation. It moved to a new `components/saqeel/map/map-chrome.module.css` that
both canvases compose, so the change **removes** a violation and any future map
inherits the same chrome.

**Attribution is `label` (12px), not `body`.** The first pass mirrored the old
rule's `body` and measured 14px — visibly enlarging legally-required fine print
Mapbox had been rendering at 12px. **Caught by re-measuring, not by reading.**

**Session expiry was diagnosed here and back-corrected into T-072**, which had
wrongly blamed the Browser pane for `/dashboard` and `/factories` hanging on
`loading.tsx`.


### T-073 · `/operations/exceptions` — the exception board on SAQEEL
`status: partial (axe, 320px, keyboard, light theme, e2e owed)` · `rules: WEB-000, WEB-001, WEB-002, WEB-003, WEB-006, WEB-008, WEB-011, WEB-013` · `est: 1.5h`
`record:` [2026-08-12-T-073-exception-board](sessions/2026-08/2026-08-12-T-073-exception-board.md)

`page.tsx` **80 → 36**, 11 legacy class uses → **0** (verified in the rendered
DOM), two untyped inline reads behind `readRows` + a `Shape<T>` each, and 17
`t(key, "English")` strings → 21 keys per locale at asserted parity.

**The group heading was a raw database enum** — `{category.replace(/_/g," ")}`
rendered `correction overdue`, which is exactly why it could never be Arabic:
there was no label to translate, only a column. WEB-000 §9's `{value: v, label: v}`
defect, on a heading.

**A developer invariant was on the supervisor's screen, and it could not fail.**
The banner ended in `{invariantOk ? "✓" : "⚠"}`; `groupExceptions` partitions
every source into exactly one bucket, so the sum always equals the length and the
`⚠` branch is **unreachable by construction**. Removed from the UI — the guarantee
stays proven in `mvp2-m2-09-exceptions.spec.ts`, where a partition bug would
actually be caught (owner ruling). **The first proposal drew a fail-closed state
for it; re-reading the function showed that would be untestable code guarding an
impossibility. Check that an error state is reachable before designing it.**

**Third and last journey nav on the operations family** — four buttons
duplicating the left rail, after T-068 and T-071. The banner's *claim* survived as
the card description; the banner did not. Two of four drill destinations were a
guess (`? "/reviews" : "/execution"`), so `DRILL_HREF` now maps only the two real
ones and a category without one renders *Not configured*.

**The sort key was invisible again** — `ExceptionGroup.items` is sorted
newest-first and was never rendered, the same defect as T-068's exceptions list.
Each group now prints its most recent occurrence.

**A shared spec selector gains a per-route override rather than being loosened.**
`mvp2-modules-live.spec.ts` asserts a legacy-chrome selector across **seven**
routes; widening it would have weakened the six that have not migrated.

**21 new Arabic strings need native review** — twelve of the keys they replace
had no Arabic anywhere. **Owed:** axe, 320px, keyboard, light theme, e2e, **and
the board with data** — only the empty state could be exercised.

### T-072 · `/operations` — typography (live/ excluded)
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014` · `est: 1h`
`record:` [2026-08-12-T-072-operations-typography](sessions/2026-08/2026-08-12-T-072-operations-typography.md)

**The healthiest route yet** — 6 sizes, **0 off-scale**, one typeface, **0
unstyled headings**, and a 19-line `page.tsx` already inside WEB-001's limit.
Only two visible defects, and **both were in shared primitives, not in
operations code at all**:

1. **`StatCard.label` was `overline` (11px)** where WEB-014 §5.2 says a KPI tile
   label is `label` (12px). Third instance of this same mistake in a shared
   primitive after `MetricStrip` (T-058) and `DataTable.head` (T-059) — which is
   the argument for fixing them centrally, not per screen.
2. **`CardValue[data-kind="text"]` was `subheading` (16px)** → owner-ruled to
   `body-strong`. A text value in a KPI slot reads as a value, not a heading.

Both views now render **28 · 20 · 14 · 12 — the same four sizes as `/dashboard`
and `/factories`.**

**A fourth unstyled-heading find, and it only appeared because the map failed to
load on one render.** `GeoMap`'s `<h4>Map unavailable</h4>` has no class and the
frozen `.sq-state h4` rule sets colour only, so it fell to the UA default 15px.
**Error and empty states are part of the route and must be provoked, not
assumed.**

**26 of the 50 violations are dead.** `operations.module.css` is reached by
`OperationsPreview` (live) and `operations-details.tsx` (**zero importers**);
checked per declaration, **all 49 typography declarations sit on classes the live
preview never uses**. Third dead stylesheet after `dashboard.module.css` and
`factory-list.module.css` — **needs deleting, not migrating**.

**Attribution:** the gate said 20 removed; **6 of those are another agent's
deletion of `live/live.module.css`. This task removed 14.**

**Owed:** axe, 320px, Arabic/RTL, and a look at the 5 unrendered screens
`StatCard` reaches.


### T-071 · `/operations/live` — the visible screen on SAQEEL (slice 2 of 2)
`status: partial (axe, 320px, keyboard, light theme, e2e owed)` · `rules: WEB-000, WEB-002, WEB-003, WEB-004, WEB-006, WEB-008, WEB-009, WEB-011, WEB-012` · `est: 2h`
`record:` [2026-08-12-T-071-operations-live-visible-screen](sessions/2026-08/2026-08-12-T-071-operations-live-visible-screen.md)

**48 legacy class uses → 0, verified in the rendered DOM**, and `LiveOps.tsx`
deleted (287 lines). With slice 1's stylesheet that is **754 legacy lines gone**
from this route.

**The largest element on a dark screen was a white slab, and the fix already
existed.** `LiveMapInner` hardcoded `lightPreset: "day"`; `GeoMap` — the map
`/operations` uses — has tracked `data-theme` with a `MutationObserver` and
re-applied `setConfigProperty` since it was written. **A second implementation of
a solved problem inherits only the bug it started with.**

**A disclosure that is always true is not a legend entry.** All three provenance
states rendered unconditionally, including a critical-red one, with zero
inspectors on screen. *"Last recorded position — not guaranteed live"* is a claim
about the whole screen, so it is now a **standing disclosure**; `unavailable` and
`rejected` describe rows and render only when a row is in that state.

**Two empty states became one by separating two facts.** "Nothing in scope" and
"in scope but unmapped" are different — the second can be true while the list is
full. The list states the empty case once; the map discloses the unmapped case
**only when the list is not empty**, so they can never both speak. Four notice
bars dissolved into the surface they describe, which also **avoided adding a
fourth copy of the Notice component this repo already has three of**.

**`ListRow` gained a selectable mode (`onSelect` + `pressed`) — the row is the
control**, the same stretched-hit-area contract `href` already had. `.link` now
hand-resets `font`/`color`/`background`/`border`, the fourth recorded instance of
*`saqeel.css` has no global button reset by design*.

4 glyph-as-icon → 0. Two `div[aria-label]` with no role — invisible to assistive
tech — are now a real `<section aria-label>` and `role="application"`.

**Owed:** axe, 320px, keyboard, light theme, e2e — **and a screenshot of the dark
basemap**, the one claim source alone cannot settle. The Browser pane is
undisplayed, so the map cannot be seen.

### T-070 · `/operations/live` — foundation: route, data layer, resources, skeleton (slice 1 of 2)
`status: partial (visible screen is slice 2; axe, 320px, keyboard owed)` · `rules: WEB-000, WEB-001, WEB-002, WEB-003, WEB-006, WEB-008, WEB-011, WEB-013` · `est: 2h`
`record:` [2026-08-12-T-070-operations-live-foundation](sessions/2026-08/2026-08-12-T-070-operations-live-foundation.md)

Owner-reported: the screen is legacy, the loading state is legacy, and it
duplicates UI. **`page.tsx` 412 → 32** with every read behind
`features/operations/live/**` and **~90 strings → 62 keys in both locales at
asserted parity** — the Arabic had been living in the route file as
`t(key, locale === "ar" ? ar : en)`, and three strings had **no Arabic anywhere**.

**`live.module.css` deleted — 467 lines, zero importers**, kept alive only by a
spec that read it from disk (owner ruling). Its responsive and direction claims
moved onto the skeleton's CSS and were **inverted**: the old file carried a
`[dir="rtl"]` override, which WEB-002 §6 forbids, so the replacement is asserted
to have none. 6 baselined typography violations went with it.

**A spec that asserts which file holds a behaviour rots when the behaviour
moves.** The whole Live composition contract asserted against `page.tsx` as one
file; `livePageSource` is now route + feature modules, exactly how `pageSource`
was already built for `/operations` three hundred lines up in the same spec.
**52 re-pointed assertions verified by script** before calling it done.

**5 `as unknown as` casts** went with the move onto `readPages` + `Shape<T>` —
the T-042 debt this route still carried. Two constants that were maintained in
two places (`CLEAN_FACTORY_CODES`, the geography filter) now come from one.
The journey nav — 3 buttons duplicating the shell rail — is deleted, the same
defect T-068 removed from `/operations`; the wallboard exit stays. 3 string
fields were declared, built and read by nothing.

**3 new Arabic strings need native review.** **Owed:** axe, 320px, keyboard,
light/dark, e2e.

**Slice 2:** the map ignores the app theme (`lightPreset: "day"` hardcoded while
`GeoMap` already tracks `data-theme`), 48 legacy classes → 0, the duplicated
empty state, the permanent three-state alarm rail plus its duplicate footer
legend, 4 glyph-as-icon, `ListRow` for the rows and `DefinitionList` for details.
**Blocked on a ruling:** `Card` has no `aside` element and the runtime spec pins
`aside[aria-labelledby="live-inspector-list-title"]`.

### T-069 · factory-family typography sweep (7 files, one pass)
`status: partial — field surfaces not rendered` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014` · `est: 1.5h`
`record:` [2026-08-12-T-069-factory-family-typography-sweep](sessions/2026-08/2026-08-12-T-069-factory-family-typography-sweep.md)

Owner asked for every remaining factory-named file in one pass. **Factory-family
violations 49 → 8**; repo 1,000 → 959.

**Controls got `font: inherit`, not a primitive.** Most sized classes in
`factory-verification.module.css` sit on `<button>`/`<label>` — `.chip`,
`.check`, `.statusChip`, `.evidenceAttach`. **Deleting a `font-size` from a
button does not make it inherit, it makes it Arial** (the T-064 bug). Five got
`font: inherit`; pure-text classes had the declaration deleted and inherit `body`.

**Decorative glyphs became icons.** `<div style={{fontSize:32}}>⛔</div>` is a
graphic typed as text; now `<Icon name="restricted" size="xl" />`. Clears the
inline-font violation and CLAUDE.md rule 9 together.

**Two regex mistakes, both caught by typecheck, neither by the gate** — a
`<summary><span>` conversion left three unbalanced JSX tags, and a second pass
produced duplicate `font: inherit` declarations. **The gate was green while the
JSX was broken**, because it reads CSS and single lines. Bulk edits across 20
files need a compile and a diff read.

**`factory-verification` is not a factories route** — it is `/field/inspection/[id]`,
i.e. T-024 ("split last"). Included because the owner asked for every
factory-named file; flagged before starting.

**Owed — and this is most of the task:** `/field/factory-360`,
`/field/factory-360/[id]` and `/field/inspection/[id]` were **never rendered**.
`/field/*` returns `login?reason=unauthorized` for a Planner — it is a **role
boundary, not a lost session**, so it needs an *inspector* persona. **34 of the
41 changes are on that unverified surface.** Two to watch on device:
`.statVal` 20px → `Metric` 28px and `.rosterFoot strong` 18px → 28px, both in
dense iPad rows that could overflow.

Remaining 8: 5 in `factory360.module.css` (`font-weight`/`line-height`, no size
effect, die with T-020) and 3 in the **dead** `factory-list.module.css`.


### T-068 · `/operations` — duplicate entry points, split-brain view toggle, dead KPI vocabulary
`status: partial (axe, 320px, 1024px, keyboard, light theme owed)` · `rules: WEB-000, WEB-002, WEB-003, WEB-004, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013` · `est: 2h`
`record:` [2026-08-12-T-068-operations-center-duplicate-entry-points](sessions/2026-08/2026-08-12-T-068-operations-center-duplicate-entry-points.md)

Owner screenshotted the Operations Center. **The perspective toggle changed half
the screen.** `activeView` drove the map dataset while the regions section was
gated on `view` — the URL prop the toggle never updates — so selecting *National
performance* swapped the pins and rendered no national content at all. Both
branches existed and read different variables; nothing typechecks or gates that.

**Client state was kept deliberately against the ladder's usual answer**: both
datasets are already props, so navigating would re-run ten server reads to render
what the browser holds. The ladder ranks sources of truth, and there is now one.

**Three entry points to the exception board on one screen** — toolbar button, KPI
CTA, and the section listing the rows. `saqeel-revamp.html`'s toolbar carries
**one** button; *Live positions* and *Exception board* were both additions.
**Neither was deleted** — each moved onto the surface it describes. Top-level
controls 4 → 2, destinations lost **0**.

**Owner ruling, taken before the edit:** the two `value: "—"` KPI cards render
`Not configured` and lose their actions — the alerts card had been drilling to the
exception board while the rows render below it. Asserted three times, so the spec
was **re-pointed, not dropped** (T-062 protocol), plus a new regression test that
the toggle drives the national section without a navigation.

**Eight pinging warning pills → one.** Every region card wore "Compliance
unavailable" with a ping — verbatim `DashboardView.tsx:426`'s recorded lesson that
*repeated warning pills made disciplined absence read as a broken product*. The
absence is stated once in the section header; each card recovered its value slot
for its real active-visit count.

**The exceptions list was sorted by a timestamp it never showed** and every pill
read the same word. Pill → kind, title → record, `ListRow.meta` → the time the
design specified all along. No new copy. **8 highlight strings moved into
`operations.highlights` in both locales** — promoting them into a pill is what
made the English-on-Arabic conspicuous.

4 dead i18n keys deleted from both locales. **8 new Arabic strings need native
review.** **Owed:** axe, 320px, 1024px overflow, keyboard, light theme, e2e.

### T-067 · `/factories/cr/[id]` — typography pass (rebuild stays T-020)
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014` · `est: 1h`
`record:` [2026-08-12-T-067-factory360-cr-typography](sessions/2026-08/2026-08-12-T-067-factory360-cr-typography.md)

**The owner’s original complaint was still live on this screen.** "See the font
81.5 it’s so big compared to the rest" — `81.5` rendered at **26px** and, two
panels away, `Not Available` at **32px** from an inline
`style={{ fontSize: "2rem" }}`. Two headline figures, two sizes, neither on the
scale. Four tasks aimed at that complaint and none had touched this route. Both
are now `Metric` (28px).

**24 of 26 headings had no class at all** — 18 × `<h2>` at the browser default
22px, 5 × `<h3>` at 17px. That is why the screen read as unstructured: it had
no hierarchy but the UA’s. Same defect class as T-059’s page title and T-064’s
Arial button — **the value was decided by an absent declaration**, invisible to
grep and to any token audit.

**The gate forced the fix into the right layer.** The obvious repair was two
lines of `.panel h2 { font: … }` in the route CSS — but that file is not exempt,
so it would have *raised* the ratchet. Converting to `Heading` cost no more and
moves the route toward its rebuild instead of away from it.

**0 off-scale (was 4); 9 → 7 sizes; every `aria-labelledby` id preserved.**

**Scope held deliberately.** `page.tsx` is **409 lines** against WEB-001’s
40-line ceiling, and `factory360.module.css` (269 lines) is on the pre-Saqeel
`--type-*` token set. **This task made the route render correctly; it did not
make it correct.** The rebuild is T-020.


### T-064 · `/factories` — visible typography (part 1 of 2)
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014` · `est: 1h`
`record:` [2026-08-11-T-064-factories-visible-typography](sessions/2026-08/2026-08-11-T-064-factories-visible-typography.md)

Owner split the route: everything visible first, primitive migration second.

**The factory name was rendering in Arial.** `button.factories-portfolio_select`
never declared `font: inherit`, so it took Chrome's UA button default (Arial
13.33px) and the name inside inherited it — the most important string on the
route, in a different typeface from the whole application. Nothing in the source
looks wrong; **the typeface was decided by something absent**, the same failure
class as the `--sqx-font-sans` bug in T-058. Only measurement finds these.
Its `<h3>` was also `label` (12px) — a heading smaller than its own content.

**31 × 11px `overline` → 12px `label`.** None were eyebrows above a card title
(WEB-014 §2's definition) — they are key-value keys and in-card section labels.
`DefinitionList` fixed in the shared primitive, so every screen benefits.

**Three eyebrow call sites needed three different answers**, which is why the
gate rule flags but cannot auto-fix: one was a subtitle in the wrong slot; one
had the **title** in the wrong slot ("Identity" was the eyebrow, a bare CR code
was the title); one already had a description, so its provenance line became a
trailing `StatusPill`.

**`body-strong` beat `subheading` for the picker row** — 16px was tried and
measured, and it produced a fifth size plus the same factory name at three sizes
on one screen.

Route now renders **the same four sizes as `/dashboard`** — 28 · 20 · 14 · 12,
zero off-scale, one typeface. Violations 113 → 76.

**Owed:** axe, 320px, Arabic/RTL.

### T-065 · `/factories` — primitive migration (part 2 of 2)
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014` · `est: 1.5h`
`record:` [2026-08-11-T-065-factories-primitive-migration](sessions/2026-08/2026-08-11-T-065-factories-primitive-migration.md)

20 components migrated; **`components/sections/factories/` is now at zero
violations.** Two stylesheets deleted outright — they held nothing but
typography. Scope 76 → 11, and none of the 11 are on `/factories`.

**The migration found three primitive gaps that inventory had not:**

1. **`dir="auto"` was unavailable on `Text`** — nine call sites carry it on
   user data. In an Arabic-first app that is correctness, not decoration:
   without it a mixed Arabic/Latin string renders in the wrong visual order.
2. **`role="alert"` collided with `Text`'s own `role` prop.** Added `live`
   rather than renaming `role` across every existing call site.
3. **`Heading` could not express a heading that renders small** — only
   display/heading/subheading. **A heading's semantic level and visual weight
   are independent; that is the point of `visual`, so it must cover the whole
   scale.** Extended with `bodyStrong` and `label`.

**Two near-misses, both caught by measuring rather than reading:**

- Converting the trend `<h3>`s to `subheading` moved them 14px → 16px and added
  a **fifth** size to the route.
- A regex strip removed `font: var(--sqx-text-metric)` from the portfolio KPI
  values with no primitive replacing it — every portfolio number would have
  shrunk 28px → 14px. Fixed with `Metric tone="inherit"` so the status colours
  stay exact: **do not change colours while migrating typography.**

**And one bad trade caught on review:** the portfolio summary `<h2 id>` (the
card's `aria-labelledby` target) was converted to `<Text as="span">` — gate
clean, but it **removes a heading from the document outline**. Reverted, then
done properly once `Heading visual="label"` existed. **A violation count is
never worth a real heading.**

Mixed-content containers (flex rows of pills/links/badges) keep no font
declaration and inherit `body` — same rendered result, no markup churn.

`FactoryList.tsx` + `factory-list.module.css` confirmed **dead** (zero
importers) and routed to retirement rather than migrated.

### T-066 · `/dashboard` Operational View — the design's four metric groups (declutter part 3)
`status: partial (axe, 320px, screenshots owed)` · `rules: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-011, WEB-013` · `est: 1h`
`record:` [2026-08-11-T-066-operational-view-four-design-groups](sessions/2026-08/2026-08-11-T-066-operational-view-four-design-groups.md)

**The design had already answered this screen and the shipped code ignored one
line of it.** `saqeel-revamp.html` defines `OPERATIONAL` as **four labelled
groups** — Today's operations (2) · Execution status (2) · Approvals (2) ·
Operational exceptions (1) — and the app put all seven metrics under one
"Today's operations" heading, which is **factually wrong for four of them**:
returned reports and reports awaiting approval are Approvals, overdue visits are
Execution status. A supervisor scanning for approvals had no reason to look under
"today".

**The `today` array was already in the design's exact group order**, so only the
boundaries had been lost — pure composition, zero query/metric/value/ordering
change. That is also what removed the orphan: seven cards in a six-column grid
stranded the seventh beside ~1100×180px of dead space, the largest element on the
screen. Sections **1 → 4**, `h2` landmarks **4 → 7**.

**The header sentence T-062 moved here is deleted, and it was mine.** It restated
the two cards directly beneath it; relocating it had been the wrong call, dropping
it is the right one. `priorities.summary` deleted from both locales. The
governance footnote survives on Operational exceptions — it is a claim, not data.
`priorities.footnote` keeps its key name deliberately (renaming churns both
locales for no visible gain).

**Both specs T-062 wrote had to be re-pointed one task later** — they asserted the
sentence this task deletes. They now assert the four **group headings**, with
`Approvals` as `exact: true` so it cannot match "Inspection reports awaiting
approval" or "Open Review & Approval". **A spec that asserts a sentence is hostage
to copy; one that asserts structure is not.**

**Filtered drills raised, not taken** (owner ruling): `/execution` accepts **no
searchParams at all**, so two of the four duplicate buttons cannot be filtered
without rebuilding that route; `/planning` can filter but its `tab` values
describe *visit planning status* while these cards count *inspection reports*, and
the `priority` keys live in a DB lookup this workstation cannot read. Guessing
either would send the reader to a plausible **wrong** list.

### T-063 · Dashboard specs — re-point at the shipped strategic surface
`status: done (suite not executed)` · `rules: WEB-000, WEB-006, WEB-008, WEB-011` · `est: 40m`
`record:` [2026-08-11-T-063-repoint-dashboard-specs-at-the-shipped-surface](sessions/2026-08/2026-08-11-T-063-repoint-dashboard-specs-at-the-shipped-surface.md)

**The rot was in three files, not the one the owner pointed at.** Grepping the
retired `RevampStrategicView` strings found the same dead assertions in
`dashboard-business.spec.ts:92-93` and `exec-hard-states.spec.ts:103` as well as
`web-admin-m1-dashboard.spec.ts`. **Two of them were static, not runtime** — that
spec reads source files as text and asserted `en/dashboard.json` contains two
sentences that live only in the retired component (`grep -c` returns 0 for both).
**A spec that greps source can rot without the DOM changing.**

Nothing was deleted; each assertion was re-pointed to where its claim now lives.
"No quarterly series is inferred" → **`STR-KPI-003`'s registry note** ("violations
has NO issue-time column … cannot be produced without silently substituting
submission time"). "No generated claim is shown until a configured provider" →
**`STR-KPI-012`'s note** (`evidence_refs`, "Disabled until configured") plus the
brief's idle line. `heading "Provider output withheld"` → `heading "Executive AI
brief"` with its advisory pill. **The registry is the better home for a claim
about what the platform refuses to compute** — a redesign can move a locale
string; it cannot move an immutable formula note.

Verified without running the suite: **13 automated checks** that every asserted
string exists in its real source (including the advisory pill's middot
**byte-identical** to the locale file, and the Arabic needle checked against
`ar/dashboard.json`), then confirmed against the dev server that each runtime
target resolves to exactly **one leaf element** so `getByText` cannot raise a
strict-mode violation. **Owed:** the suite itself — it needs the seeded personas.

### T-062 · `/dashboard` — delete the Operational priorities panel (owner ruling)
`status: done (axe and 320px carried from T-061)` · `rules: WEB-000, WEB-003, WEB-006, WEB-008, WEB-011, WEB-013` · `est: 30m`
`record:` [2026-08-11-T-062-delete-operational-priorities-panel](sessions/2026-08/2026-08-11-T-062-delete-operational-priorities-panel.md)

Closes T-060's blocker. The owner ruled: delete it and update the two specs. The
panel was a heading, a summary sentence carrying two live numbers, and a
governance footnote — no control, and both numbers already rendered as two of the
seven cards directly below. **The panel went, the information did not:** the
summary is now the Today's operations header description and the footnote is its
`CardFooter`. Operational sections **5 → 4**, `operational.priorities.title`
deleted from both locales as dead copy.

**The specs record the deletion rather than losing the coverage.**
`web-admin-m1-dashboard.spec.ts` now asserts the heading has **count 0** *and*
that both moved strings are visible — so the contract states what was removed and
that the governance statement survived the move, which is the part that mattered.
`dashboard-business.spec.ts` swapped its heading assertion for the summary text.
Regex, not exact text, because the summary interpolates two seeded counts.

**The gate's "7 violations removed" belongs to another agent, not to this task.**
`git status` shows 27 uncommitted files under `components/sections/factories/**`,
`saqeel/definition-list/` and `app/(app)/factories/**` — a concurrent typography
pass in the same working tree. Neither T-061 nor T-062 adds or removes a single
typography declaration. **`gates:typography:update` deliberately NOT run:** it
would rewrite `scripts/typography-baseline.json` underneath that agent and lock a
count taken mid-pass. The ratchet only fails on additions, so the gate is green
either way; whoever finishes that work owns the re-baseline.

**Parked, with the trap recorded:** the skeleton does not draw the executive brief
strip, so everything below shifts 44px when data lands — **but do not key the
skeleton on `scope.view`**, because `effectiveView(scope, isAdmin)` renders
*operational* for a non-admin with no `view` param and the admin flag is only
known after the fetch the Suspense boundary is waiting on.

### T-061 · `/dashboard` — enforcement trend honesty, requirement register (declutter part 2)
`status: partial (axe, 320px, screenshots owed)` · `rules: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013` · `est: 2h`
`record:` [2026-08-11-T-061-enforcement-trend-and-requirement-register](sessions/2026-08/2026-08-11-T-061-enforcement-trend-and-requirement-register.md)

Owner screenshotted the lower strategic view. **The enforcement trend was
scoring its own data:** `enforcementTrendView` mapped a fall in penalty notices
to `success` and a rise to `warning`, with a comment claiming the movement "is a
signal to read, not a score" one line above the code that scored it. Fewer
penalty notices can mean better compliance **or** less enforcement coverage —
the screen cannot know which, and the executive brief two sections up promises it
"does not attribute a cause". Worse, `tone` paints **every** bar, so a decline
rendered the *previous* period in success green: the loudest element on the route
was a green block meaning "six notices happened, before now". **Tone is now
neutral permanently, with the reason in the doc comment so it is not restored as
a nice touch.**

**The chart was also missing what the approved design requires** — each bar
column is bar → visible period label → visible value in `saqeel-revamp.html`,
and shipped the dates existed only in `sqx-visually-hidden`, so the sighted and
announced readings disagreed about which bar is *now*. Restored. **Zero stopped
being drawn as a quantity:** `.bar` floored every bar at 4px in the value colour,
so the current period's 0 rendered as a small green line; it is now a 2px dashed
baseline with a printed `0`. That fix went into the primitive, so
`factory-trends` gains it too (owner ruling). `TrendBars` took two **optional**
props, chart height 4rem → 6rem and columns capped at 6rem so a two-point series
stops rendering as two half-width slabs. **No token added.**

Requirement coverage **6 card surfaces → 6 rows** on `DataTable`, every lineage
drawer intact and now naming its metric. **No "Live" pill was invented** — a live
row shows its value in the State column. **Blocked cards lost their dead CTA:**
"Top violated regulation → Unavailable" was still offering *Open the regulation*.
`trend.current` deleted from both locales — with the count printed under its own
bar, "0 this period" restated a number 40px below it.

**Owed:** axe, 320px (the register's stacked `DataTable` mode has not been seen),
keyboard, screenshots — the Browser pane was undisplayed so the page stopped
compositing and every layout rect read 0; DOM and computed styles carried the
verification instead. **3 new Arabic strings need native review.**

### T-060 · `/dashboard` — duplicate KPI layer, AI brief strip (declutter part 1)
`status: partial (axe, 320px, e2e owed)` · `rules: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013, WEB-014` · `est: 2h`
`record:` [2026-08-11-T-060-dashboard-duplicate-kpi-layer](sessions/2026-08/2026-08-11-T-060-dashboard-duplicate-kpi-layer.md)

Owner-reported: "the screen looks so cluttered and there are too many widgets".
**The cause was a regression this programme introduced.** The retired
`DashboardView.tsx:513` passed `excluded={representedIds}` into its coverage
grid; the rebuilt `strategic-view` passed all 12 ids. So the 12-tile
"Strategic requirement coverage" block was re-rendering six measures already on
the screen — `STR-KPI-001` as both "Compliance rate trend" and "National
compliance rate", identical numerator and denominator, **two names for one
governed figure**. `DashboardView.tsx:426` had also recorded why blocked states
were consolidated: *"repeated warning pills made disciplined absence read as a
broken product."* Both lessons restored.

Strategic **22 → 16** tiles, requirement strip **12 → 6**, absence badges
**14 → 11**; operational **20 → 15**, strip **9 → 4**. Trend card moved below
intervention, restoring the order the approved design and
`exec-overview-gate.spec.ts:10` both state. Executive brief **~182px → 44px** as
the one-row strip `/planning` uses — its provenance and no-cause lines now render
with a generated brief instead of above an empty one. Blocked tiles sort last in
every strip. **`requirement.description` was shipping
"Decision required: approved description pending." as a pinging warning pill in
both locales.**

**Two planned changes were backed out by reading the specs first:**
"Operational priorities" is an asserted **canonical panel**
(`web-admin-m1-dashboard.spec.ts:217`, `dashboard-business.spec.ts:124`), and the
"Your work" title swap would have broken three exact-heading assertions. The real
header defect was the opposite — `yourWork.scoped` was defined in both locales
and **rendered nowhere**, while `:166` asserts it is visible. Fixing it repairs
an already-red assertion.

**Owed:** axe, 320px, keyboard, e2e. **2 new Arabic strings need native review.**
**Blocked:** may "Operational priorities" be deleted (needs the two specs
updated)? And `web-admin-m1-dashboard.spec.ts:200-215` asserts strings that exist
only in the retired `RevampStrategicView` — already red, needs its own task.

### T-059 · `/dashboard` — typography closeout, both views verified in a browser
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011, WEB-014` · `est: 2h`
`record:` [2026-08-11-T-059-dashboard-typography-closeout](sessions/2026-08/2026-08-11-T-059-dashboard-typography-closeout.md)

First task in this sequence to actually **render** the screens signed-in, and it
immediately found three defects source-reading had missed across two prior
tasks:

1. **KPI numbers rendered at two sizes (30px and 28px) on one screen** —
   `CardValue size="md"` still resolved through the retired `title` alias.
   **This is the owner's original "81.5 is so big compared to the rest"
   complaint, still live**, because both call sites were token-clean and *a gate
   cannot see that two valid tokens disagree*. Every number is now `metric`.
2. **Table headers were 11px** against every other label's 12px —
   `DataTable.head` used `overline`. Fixed in the shared primitive.
3. **The page title had no font rule at all** — `.sq-pagehead__context > h2` in
   the frozen sheet sets layout only, so every route's `<h2>` fell back to the
   **browser default 22px**. This was the missing typographic top end: `display`
   had one use in the whole app. Now `Heading visual="display"`.

11 dashboard components migrated off feature-CSS typography onto the type
primitives. `tone="inherit"` added — without it, text inside a colour-owning
`<summary>` or button could not migrate at all. Loading skeleton corrected to
match the card (it still drew an eyebrow, so layout shifted on data arrival).

**Both views now render the identical size set — 28 · 20 · 14 · 12, zero
off-scale, one typeface.** Route debt 44 → 21, of which 13 are the dead
`dashboard.module.css` and 8 are `explain-panel` (blocked on `Heading` needing
`ref`/`tabIndex`).

**Owed:** axe, 320px, Arabic/RTL.

### T-058 · `/dashboard` — one typeface, title above subtitle
`status: partial (authenticated screen not viewed)` · `rules: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011, WEB-014` · `est: 1.5h`
`record:` [2026-08-11-T-058-dashboard-typography-and-one-typeface](sessions/2026-08/2026-08-11-T-058-dashboard-typography-and-one-typeface.md)

First screen of the screen-by-screen migration. **The font stack was broken and
that mattered more than any size:** the app was rendering **four typefaces at
once** — Segoe UI (224 elements), IBM Plex Sans Arabic (209), Times New Roman
(4), Consolas (every mono site). `--sqx-font-sans` named `"Readex Pro",
"IBM Plex Sans Arabic"` and **neither was ever loaded**, because `next/font`
registers a *scoped* family the token never referenced. CSS raises no error for
a missing family — it just renders something else. Now one face app-wide,
verified by canvas measurement, and `--sqx-font-mono` is an alias (owner ruling:
no second typeface; `mono` keeps only tabular numerals).

**Owner ruling inverts WEB-014 §5:** title first and always larger/whiter,
description second. `CardHeader.eyebrow` renders the rejected pattern and is now
retiring behind a gate rule — **24 call sites remain**. KPI tiles are exempt
(§5.2): a tile's number is the hero, so label → value stands.

**`dashboard.module.css` was not migrated — it is dead.** 318 lines with the
worst literals on the route (`52px`, `34px`), imported only by the orphaned
`DashboardView` tree. Routed to retirement, saving the largest chunk of work on
this task for zero rendered change.

**Owed:** axe, 320px, and an owner pass on the authenticated screen — sign-in
needs credentials the agent does not enter.

### T-057 · Typography contract — nine roles, type primitives, ratcheted gate
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011, WEB-014` · `est: 2h`
`record:` [2026-08-11-T-057-typography-contract](sessions/2026-08/2026-08-11-T-057-typography-contract.md)

Owner-reported from a `/factories` screenshot: prose rendering at two sizes
inside one card, card titles varying, eyebrow/title order inconsistent. Audit
found the cause was **not** rule-breaking — both named components used only
`var(--sqx-text-*)` and passed every gate. The scale offered **12 roles with
four inside a 2px band** and no selection rule, so agents defaulted to the
smallest: `caption` (11.5px) used 164×, `body` 59×. **72% of all type usage sat
at ≤12px; 3.5% above 16px.** The app had no typographic top end.

Scale cut **12 roles → 9**. `caption`, `body-lg`, `title`, `code` retired but
**kept as resolving aliases** (`caption`/`body-lg` → `body`, `title` →
`display`, `code` → `mono`) so no unmigrated screen breaks — the alias *is* the
migration, and it fixed all 164 caption sites in one edit. New
`components/saqeel/type/` (`Text`, `Heading`, `Overline`, `Mono`, `Metric`) is
now the **only** place in the repo permitted to declare a typography property.
Card titles unified 16px → 20px via `CardHeader`, whose existing
eyebrow→title→description slot order is now binding law rather than convention
— **no `SectionCard` was built; `Card` already had it.**

`WEB-014` written; `CLAUDE.md` rule 7b and the README rule index point at it.
`npm run gates:typography` baselines the **1,130 existing violations across 380
entries** and fails on any new one — a ratchet that may only go down.

**Owed:** the 1,130-violation burndown is screen-by-screen (WEB-014 §8), and
`e2e/typography-scale-contract.spec.ts` has not been executed — it needs a
production build, which is the human's to run (WEB-005 §8).

### T-056 · `/planning/single` — first-run state, dead publish bar, step numbering
`status: partial (not verified in a browser)` · `rules: WEB-000, WEB-002, WEB-003, WEB-004, WEB-009, WEB-011, WEB-013` · `est: 1.5h`
`record:` [2026-08-11-T-056-single-visit-first-run](sessions/2026-08/2026-08-11-T-056-single-visit-first-run.md)

Owner-reported: the empty screen was one search card plus a raised bar holding
**two permanently disabled buttons**. The bar now renders only when a target
exists — matching `PublishReadiness` and `PublishBlockers`, which were already
gated that way.

**Removing the submit button re-arms implicit submission:** a form with no submit
button submits on Enter when exactly one field blocks it, and on the empty screen
that field is the search box. `FactorySearch` and `PortfolioPicker` therefore
moved **outside** the `<form>`, which is also what they are. The published target
was already built from hidden fields, never read from the radios — the cost is
`actions.ts`'s documented `factory_id` fallback becoming unreachable (owner
ruling). The permission blocker moved above the search so a planner without
`planning.submit_for_supervision` learns it before doing the work.

**Two steps were both numbered "2 ·"** — `portfolioStep` and `licenseStep`, in
both locales. Numbers left the copy for a `CardHeader` eyebrow (`Step 2 of 4` on
both, since they are one step on two paths). The search input got a real visible
`<label>` — it had been named by the heading *and* `aria-label` *and* the
placeholder — plus a first-run guidance state. Skeleton trimmed 3 cards → 1 to
match the real first paint. **10 new keys in `planning.single`, both locales.**

**Owed:** browser, keyboard (confirm Enter is inert), Arabic/RTL, axe. **10 new
Arabic strings need native review.**

### T-055 · `/planning` toolbar — filters into the panel, applied on change
`status: partial (not verified in a browser)` · `rules: WEB-000, WEB-002 §2, WEB-003, WEB-004 §1, WEB-009, WEB-011, WEB-013` · `est: 1h`
`record:` [2026-08-11-T-055-planning-toolbar-instant-filters](sessions/2026-08/2026-08-11-T-055-planning-toolbar-instant-filters.md)

Toolbar **7 controls → 3** (search · Status · More filters, plus Clear all when
active). The other nine filters moved into the panel; every control names itself
when empty (`Status`, `Priority`, `Inspector`) instead of carrying a caption
above a box reading "All" — **which needed no new i18n keys**, the captions
became the empty-option labels. **Apply deleted:** filter state left `useState`
for the URL (a rung up the WEB-004 ladder — it had only ever mirrored the URL),
each change a `router.replace` with `page` cleared. Filtering was and remains
server-side in `visit-list.ts`. Owner-reported 6px misalignment resolved by
deleting the button: the bar is one control height at `--sqx-control-h-md`.

**`Select` gained `id?` after an owner ruling** (WEB-002 §2) — `Field`'s
`htmlFor` had been unsatisfiable, so **all 12 `Field` + `Select` pairs in the repo
render a `<label>` bound to nothing.** Additive; the other 11 are unchanged until
each wires `id`.

**Owed:** browser pass. **Check first:** the panel must stay open across the
navigation — if it does not, this is worse than Apply was.

### T-054 · `/planning/immediate` — dispatch protections + R05 notice (slice 2/5)
`status: done (not verified in a browser)` · `rules: WEB-000…004, WEB-009, WEB-011, WEB-012` · `est: 1.5h`
`record:` [2026-08-11-T-054-immediate-dispatch-protections](sessions/2026-08/2026-08-11-T-054-immediate-dispatch-protections.md)

The first block a planner reads. `AuthorityBar.tsx` **deleted** — 95 lines,
**6 hooks → 0**, 3 emoji states → `StatusPill` text-plus-shape, 12 legacy
classes → 0, and 3 focusable no-op buttons → plain items. Policy moved to
`features/planning-immediate/protections.ts`.

Built on `review-readiness`'s exact declarations, not chosen values. **The six
protections with an owning control are `<button>`s, and `saqeel.css` has no
global button reset by design** — `.chip` resets `border`/`font`/`color`/
`text-align`/`background` by hand, the way every other migrated component that
styles a button as a surface does. Hover is `--sqx-surface-subtle`, never
`--sqx-surface-accent` (WEB-009 §11 reserves that for selection).

The assertive announcement needed no effect — it is a derived string, and React
mutates that text node only when it changes. The blocking summary now lists
**every** blocker; the legacy showed one to sighted users and all of them to
screen readers. `scrollIntoView({behavior:"smooth"})` deleted — it ignored
`prefers-reduced-motion`, and `focus()` already scrolls.

**Owed:** browser, keyboard, Arabic/RTL, light/dark, axe — no seeded account.

### T-053 · `/planning` — null vocabulary, dead tiles, duplicate entry points
`status: partial (not verified in a browser)` · `rules: WEB-000, WEB-002…004, WEB-006 §4, WEB-009, WEB-011, WEB-013` · `est: 1h`
`record:` [2026-08-11-T-053-planning-null-vocabulary](sessions/2026-08/2026-08-11-T-053-planning-null-vocabulary.md)

`view.ts` bound `const dash = labels.empty` — so `table.empty` ("No visits
match") rendered as the placeholder in **every** empty cell, KPI tile and status
option, on rows that had matched. Split into `table.noValue` ("Not assigned",
owner's choice) for nullable fields and `table.notConfigured` for fields with no
data source. **4 of 8 buckets deleted** (hardcoded `count: null, href: null`),
the rest rebuilt on `StatCard` + `CardGrid`; `planning-buckets.module.css`
deleted. AI band **3 columns → 1 strip** — both AI panels hardcoded an
`EmptyState` and could never render content. Quick Actions removed: creation
duplicated the header menu's three hrefs exactly, review duplicated the tiles.
Table **13 → 10 columns**. Skeleton corrected 7 → 11 columns, 8 → 4 tiles.
Net **−243 lines**.

**Owed:** browser pass (light/dark, EN/AR, 320 px), axe, e2e — dev server
requires an authenticated `business_staff` session. **4 new Arabic strings need
native review.** Perf numbers are a measurement request (WEB-005 §8).

### T-052 · `/planning/immediate` — route, data layer, bilingual resources (slice 1/5)
`status: done (not verified in a browser)` · `rules: WEB-000…004, WEB-008, WEB-011, WEB-013` · `est: 2h`
`record:` [2026-08-11-T-052-immediate-foundation](sessions/2026-08/2026-08-11-T-052-immediate-foundation.md)

**T-051 was reverted in full at the owner's instruction** (`e62f7c65`, verified
byte-identical to `e62f7c65^`) and the wizard restarts from its legacy state:
5 files, 913 lines, zero SAQEEL imports.

`page.tsx` **252 → 26**. All reads behind `loadImmediatePlanning()` as an
`unauthorized | ready` union; `ImmediateForm` **16 props → 3**. **128 strings
into `planning.immediate` in both locales at asserted key parity**, `t()` in the
route **123 → 0** — this screen had been rendering English to Arabic readers for
58 of them. `actorMode`/`manualEntryAllowed` moved to the query layer because a
local `const` narrows to its literal and makes the inspector branches a compile
error. Two `as`-hidden lies (`as never`, `as unknown as`) replaced by one
`embeddedOne<T>` guard over PostgREST's array-typed to-one embeds.

**Owed:** browser pass (light/dark, EN/AR, 420 px), axe, keyboard — no dev
server was started. **58 newly authored Arabic strings need a native review.**

**Next slices:** 2 protections + R05 notice · 3 identity · 4 location/dispatch ·
5 consequences, submit, `error.tsx`, skeleton.

### T-050 · `/planning/bulk` — criteria builder on SAQEEL
`status: done (not verified in a browser)` · `rules: WEB-000…004, WEB-009, WEB-011` · `est: 1.5h`
`record:` [2026-08-10-T-050-criteria-builder](sessions/2026-08/2026-08-10-T-050-criteria-builder.md)

Slice 1c of T-046. 13 native controls → 0, 24 legacy classes → 0, 11 inline
styles → 0, 21 comments → 0, 9 **legacy** tokens (`--space-*`) → 0. ALL/ANY
became a `SegmentedControl` — two mutually exclusive options that change the
meaning of the group should both be visible. Unsupplied criteria fields use
T-049's `disabled` + `note`, which is what made this slice possible at all.

**Owed:** browser pass on the recursive group layout, the `between` two-date row
and RTL. The 5 new date strings are English-only — this screen reads Arabic from
`ui_strings`, not the JSON namespaces.

---

### T-049 · `Select` — disabled options
`status: done (not verified in a browser)` · `rules: WEB-000, WEB-002 §2, WEB-003, WEB-004` · `est: 40m`
`record:` [2026-08-10-T-049-select-disabled-options](sessions/2026-08/2026-08-10-T-049-select-disabled-options.md)

Raised as a gap, built only after an owner ruling (WEB-002 §2). `SelectOption`
gains `disabled?` and `note?`. **Disabled means disabled on every path in** —
`commit`, arrow keys, Home/End, type-ahead and the initial open all skip it; a
flag guarding only `onClick` would leave a row reachable that then refuses to
activate. Dims to `--sqx-text-muted`, not the disabled palette, because
"recorded but unavailable" must stay readable.

**Still open:** there is no SAQEEL combobox (free text + suggestions).

---

### T-048 · `Button` — busy state
`status: done (not verified in a browser)` · `rules: WEB-000, WEB-002 §2, WEB-003, WEB-009, WEB-010` · `est: 40m`
`record:` [2026-08-10-T-048-button-busy-state](sessions/2026-08/2026-08-10-T-048-button-busy-state.md)

`busy?` replaces the `{pending ? label + "…" : label}` pattern at 8 call sites
(1 converted). The visible label no longer changes — the spinner takes the icon
slot, so the button does not resize under the cursor.

**Third recorded instance of a specificity override silently killing a
variant:** `.root[data-busy]:disabled` scores (0,3,0) and outranked
`[data-variant="ai"]` at (0,2,0), stripping the AI accent exactly while the
button worked. Fixed by scoping the disabled palette away from `[data-busy]`
rather than undoing it. **Check specificity before writing an override.**

---

### T-047 · Shared AI advisory panel
`status: done (not verified in a browser)` · `rules: WEB-000, WEB-002, WEB-003, WEB-006 §4, WEB-009` · `est: 1h`
`record:` [2026-08-10-T-047-shared-ai-advisory](sessions/2026-08/2026-08-10-T-047-shared-ai-advisory.md)

`components/sections/ai/ai-advisory` generalises `factory-ai-advisory` and
supersedes `ContextualAiPanel` (7 consumers, 1 migrated). Four visible defects
were all legacy CSS, not JSX — including a 🔒 emoji injected by
`sq-banner--immutable::before` and "Source evidence" rendered twice.
`ContextualAiPanel` marked `@retiring` with its ledger row.

---

### T-046 · `/planning/bulk` — criteria & targeting migration
`status: in-progress (slices 1a + 1b + 1c done; 2–5 open)` · `rules: WEB-000…004, WEB-008, WEB-009, WEB-011` · `est: 12h total`
`record (slice 1a):` [2026-08-10-T-046-bulk-targeting-feature-layer](sessions/2026-08/2026-08-10-T-046-bulk-targeting-feature-layer.md)
`record (slice 1b):` [2026-08-10-T-046-bulk-screen-composition](sessions/2026-08/2026-08-10-T-046-bulk-screen-composition.md)
`record (slice 3):` [2026-08-10-T-046-review-route-composition](sessions/2026-08/2026-08-10-T-046-review-route-composition.md)
`record (slice 4 pt 1):` [2026-08-10-T-046-review-client-phases-and-readiness](sessions/2026-08/2026-08-10-T-046-review-client-phases-and-readiness.md)

**The route had zero SAQEEL imports before this task** — 14 files, 3,512 lines,
505 comments, ~180 legacy class uses, 26 colour-only `sq-lozenge`, 15 native
controls. Full inventory in the record.

**Slice 1a done:** three Supabase reads moved to `features/planning-bulk/**`
behind the T-042 narrowing boundary (`page.tsx` 424 → 337, 3 casts gone, 5
`sb.from` gone), banners → `PlanningNotice`, context pill → `StatusPill`. These
reads feed `evalNode`, so a wrong value changes **which factories get
inspected** — fail-closed matters here more than on a read-only screen.

**Slice 1b done:** `page.tsx` **348 → 27**. The three `t()` blocks became
`features/planning-bulk/{strings,criteria-strings,form-strings}.ts`; every
derivation became one `resolveBulkTargeting()` view model in `targeting.ts`;
composition became `components/sections/planning-bulk/{bulk-screen,
bulk-access-state}`. 34 comments → 0, 148 `t()` in the route → 0, 1 `let` → 0,
2 emoji-as-icon → 0, and the `as never` at the `TargetingLensClient` seam → 0
(`BulkForm`'s row type now admits the nulls the query has always been able to
return). Suggestion fields are derived from `FIELD_REGISTRY`, not restated.

**Slice 1b′ (same pass):** every string on the entry screen moved into
`planning.bulk` in **both** `en/planning.json` and `ar/planning.json` — ~130
strings, +170 lines each, exact key parity asserted before write. **This screen
no longer depends on the `ui_strings` table for Arabic.** The three string
modules fell 272 → 77 lines because the JSON shape was authored to match the
four string contracts, so a drifted key is a type error rather than a silent
English fallback. `RouteLoading` is off the route: `loading.tsx` renders
`bulk-targeting-skeleton`, mirroring the real first-paint order (criteria card,
ledger, three distribution panels, evidence table).

**Remaining slices:** 2 `BulkForm` (10 classes, 7 `useState`, `sq-table` →
`DataTable`, and 16 pass-through props on `TargetingLensClient`) · 3
`review/page.tsx` 288 → ≤ 40 and delete `review.css` · 4 `ReviewClient` 853
lines · 5 `actions.ts` 846 → domain modules, and move `criteria.ts` out of the
route directory.

---

### T-045 · `/planning/single` — search states + registry pill tone
`status: done (not verified in a browser)` · `rules: WEB-000…004, WEB-009, WEB-011` · `est: 1h`
`record:` [2026-08-10-T-045-single-visit-search-states](sessions/2026-08/2026-08-10-T-045-single-visit-search-states.md)

Three owner-reported defects. The loading state **existed for screen readers
only** — `aria-busy` was set and nothing rendered. "No factory matches" was a
real bug: the screen runs **two independent lookups** (graded legacy search and
canonical CR resolver) and the empty state tested only one, so it contradicted
the factory shown right below it. Active pills now map through
`registryStatusTone`; only `active` is asserted because the status columns are
free `text` with no check constraint.

**Owed:** `plan.single.searching` has no Arabic — this screen's Arabic lives in
the **`ui_strings` table**, not the JSON namespaces, so the key needs a DB row.

---

### T-044 · Nested menu panels keep their ancestor's dismissal scope
`status: done (fix by construction; not observed in a browser)` · `rules: WEB-000, WEB-002…004, WEB-012` · `est: 45m`
`record:` [2026-08-10-T-044-nested-menu-dismissal-scope](sessions/2026-08/2026-08-10-T-044-nested-menu-dismissal-scope.md)

`Cannot read properties of null (reading 'removeChild')` when a `Select` opens
inside a portalled `MenuSurface`. Both portal to `document.body`, so the nested
panel is a DOM **sibling** — `contains()` returned false, the ancestor dismissed
itself at `pointerdown`, and React was mid-removal on the inner portal.
Ownership now travels down the **React tree** via `MenuScopeContext`, which
portals preserve. Backward compatible: non-nested consumers reduce to the old
check exactly.

---

### T-043 · `/planning` filter bar on SAQEEL controls + AI accent
`status: done (not verified in a browser)` · `rules: WEB-000…003, WEB-009, WEB-011` · `est: 1.5h`
`record:` [2026-08-10-T-043-planning-filter-bar-and-ai-accent](sessions/2026-08/2026-08-10-T-043-planning-filter-bar-and-ai-accent.md)

10 native controls → `SaqeelSelect` / `DatePicker`; More Filters `<details>` →
portalled `MenuSurface`. **A portalled control cannot participate in a GET
form**, so state lives in one island and every hidden input renders inside the
`<form>`; the panel is presentation only.

**The first cut was rejected by the owner** for inventing a chip that wrapped a
bordered `SaqeelSelect` in a bordered pill. `enforcement-filter-bar` had already
solved this — `Field` + `SaqeelSelect`, `Button` for actions. **Read the nearest
existing solution before designing a new one.**

AI accent applied to Insights and Recommendations only; Quick Actions is
navigation and lost its Sparkles icon.

---

### T-042 · Narrow the PostgREST boundary — delete every `as unknown as`
`status: done (static verification only)` · `rules: WEB-000 §5, WEB-001 §4, WEB-008 §2` · `est: 3h`
`record:` [2026-08-10-T-042-postgrest-narrowing-boundary](sessions/2026-08/2026-08-10-T-042-postgrest-narrowing-boundary.md)

All **48** `as unknown as` casts are gone from the migrated data layer
(`features/**`, plus `lib/planning/visit-list.ts` and `lib/shell-search.ts`
which feed migrated screens). They are replaced by one narrowing boundary —
`lib/postgrest/{shape,read}.ts` — and a `Shape<T>` per row type.

**The casts were not cosmetic.** `supabaseServer()` has no `Database` generic,
so `.select()` infers every column as `any` **and every embedded relation as an
array**, including to-one embeds that PostgREST returns as objects. A renamed
column produced no type error and a runtime failure inside a component. Reads
now fail closed with a logged reason and route into each screen's existing
*unavailable* state — never into a silently smaller number.

`console.*` in `features/**` went 42 → 22: the boundary logs once, so twelve
duplicate error lines in `features/operations/queries.ts` were deleted.

**Owed:** the measurement request in the record — generate Supabase database
types and type the client, which would make most of `features/*/shapes.ts`
redundant. Needs database access this workstation lacks.

---

### T-036 · Compliance library — catalogue
`status: done (catalogue; NEVER LOADED IN A BROWSER)` · `rules: WEB-000…006, WEB-008, WEB-011` · `est: 3h`
`record:` [2026-08-09-T-036-regulations-catalogue](sessions/2026-08/2026-08-09-T-036-regulations-catalogue.md)

`/compliance` 303 → 27 lines; `/admin/regulations` reduced to the `?id=` record,
546 → 21. Authority navigator, status chips and search all in `searchParams`,
a clause/item/violation footprint per row, a mirroring skeleton, and 52 i18n keys
on a screen that had **no Arabic at all**.

**This task was first built against `/admin/regulations`, which `middleware.ts`
rewrites to `/compliance`.** The rebuild was unreachable and the owner caught it.
Two other routes rewrite the same way. **Read `middleware.ts` during inventory.**

**Owed:** load `/compliance` in the dev server, axe, Arabic review, bundle
measurement.

---

### T-041 · Enforcement library + violation catalogue
`status: done (NEVER LOADED IN A BROWSER)` · `rules: WEB-000…006, WEB-008, WEB-009, WEB-011` · `est: 3.5h`
`record:` [2026-08-10-T-041-enforcement-library-and-catalogue](sessions/2026-08/2026-08-10-T-041-enforcement-library-and-catalogue.md)

Both screens behind `/admin/violations`: the enforcement library (410 → 24) and
the catalogue admin (511 → 26). Record/Action split, the official inspection
number, penalty amount and issued-vs-informational state, a Riyadh-correct
lifecycle clock, and 166 i18n keys. 275 lines of unreachable write layer deleted.

**Owed:** load both, confirm the inspection number renders, decide whether the
catalogue admin needs a navigation entry — it is currently reachable only by
typing `?mode=`.

---

### T-040 · Compliance approval queue
`status: done (NEVER LOADED IN A BROWSER)` · `rules: WEB-000…006, WEB-008, WEB-009, WEB-011` · `est: 3h`
`record:` [2026-08-10-T-040-approval-queue](sessions/2026-08/2026-08-10-T-040-approval-queue.md)

`/compliance/approvals` 499 → 25. Request rail, step navigation, field diffs,
per-object and package decisions, review progress and a timeline that finally
includes submission and return — all on SAQEEL, all URL-driven. 136 i18n keys on
a screen that had no Arabic.

Fixed in passing: `?view=pending` never read, a per-render correlation id that
matched nothing in the logs, and browser-locale timestamps. The auto-reject
cascade is warned about before the reviewer commits.

`app/(app)/admin/compliance-approvals/**` marked `@retiring` — rewritten
unconditionally, so nothing in that segment ever runs.

**Owed:** load it as reviewer and as observer, axe, Arabic review, bundle
measurement.

---

### T-037 + T-038 · Compliance library — workspace and record
`status: done (NEVER LOADED IN A BROWSER)` · `rules: WEB-000…006, WEB-008, WEB-009, WEB-011` · `est: 2.5h`
`record:` [2026-08-10-T-037-T-038-regulation-workspace-and-record](sessions/2026-08/2026-08-10-T-037-T-038-regulation-workspace-and-record.md)

The six-tab workspace and the `?id=` record are on SAQEEL, with tabs as URL
state and the full violation / penalty / item column set. **Every `@retiring`
file from T-036 is deleted** — 519 lines, all at zero importers. 202 i18n keys at
exact en/ar parity.

**Owed:** load `/compliance` and `/admin/regulations?id=…` as a writer and as a
reader, axe, Arabic review, bundle measurement.

---

### T-039 · Shell rail hydration on rewritten routes
`status: done (fix by construction; not observed in a browser)` · `rules: WEB-000, WEB-004, WEB-011` · `est: 0.5h`
`record:` [2026-08-10-T-039-shell-rail-hydration](sessions/2026-08/2026-08-10-T-039-shell-rail-hydration.md)

The rewrite table moved out of `middleware.ts` into `lib/route-rewrites.ts` and
is now read in both directions. The rail normalises the server pathname and
`usePathname()` into the same space, so `aria-current` cannot differ between the
two passes.

**Owed:** reload `/admin/compliance-approvals` and `/admin/regulations` and
confirm the warning is gone. If it persists, capture what `usePathname()`
actually returns on a rewritten route before changing anything else.

---

### T-035 · `/dashboard` — enforcement trend + executive AI brief
`status: done (static verification only)` · `rules: WEB-000…004, WEB-008, WEB-009, WEB-011` · `est: 1.5h`
`record:` [2026-08-09-T-035-dashboard-enforcement-trend-and-brief](sessions/2026-08/2026-08-09-T-035-dashboard-enforcement-trend-and-brief.md)

The two placeholder cards at the end of the strategic view are gone. The
**enforcement trend** counts `penalty_notices.issued_at` over the scoped period
against the immediately preceding period of equal length, and renders a
**restricted** state — never a zero — for roles RLS hides the table from. The
**executive brief** is a real governed advisory on a new `executive_brief`
surface, generated on demand, with every fact re-read server-side under the
caller's RLS and a prompt that forbids attributing a cause. New `trend-bars`
primitive (Rule of Two: `factory-trends` + dashboard).

**Owed before this can be called fully done:** the screen exercised in the dev
server as both a penalty-readable and a penalty-blind role, axe, Arabic review,
and the bundle measurement request.

---

### T-021a · Visit Management — server-driven list, filters and board
`status: done (static verification only)` · `rules: WEB-000…004, WEB-008, WEB-009, WEB-011, WEB-012` · `est: 5h`
`record:` [2026-08-09-T-021a-visit-management-server-filters](sessions/2026-08/2026-08-09-T-021a-visit-management-server-filters.md)

The screen behind `/planning` → **Visit management** (`/planning/visits` and its
`/visits` twin). The 706-line `VisitsBoard` island is superseded by six
components under `components/sections/visits/**`, none over 182 lines; the route
went 272 → 36. Filters moved from client `useState` to `searchParams` **by
reusing `queryPlanningVisits`**, with an additive `requireReference: false` so
Visit Management keeps reference-less visits while `/planning` is unchanged.
259 i18n keys at exact `en`/`ar` parity.

`VisitsBoard.tsx` is marked `@retiring` with **zero importers** — it cannot be
deleted until the e2e gate clears.

**Owed before this can be called fully done:** e2e (`cd-026-visit-management`
and `ai-user-journey` assert against the old DOM and will fail), axe, Arabic
review by a native speaker, and the bundle measurement request.

---

### T-024 · `/factories` — replace mock content, slice by slice
`status: in-progress (start panel done)` · `rules: WEB-000, WEB-002, WEB-003, WEB-008, WEB-011` · `est: 1.5h per slice`
`record (start panel):` [2026-08-09-T-024-factories-portfolio-panel](sessions/2026-08/2026-08-09-T-024-factories-portfolio-panel.md)

Owner is replacing the vendor mock's content one panel at a time. **Start panel
done:** real open-violation and active-penalty counts (owner-agreed
definitions), licence expiry with an `Expired`/`Expiring soon` pill at 30 days,
Compliance % removed (no column exists), and the repeated provenance pill
reduced to one conditional warning on the portfolio header.

**End panel done (T-025):** "why this risk" reuses `FactoryRisk` over the
recorded driver breakdown, "latest change" comes from the two most recent risk
snapshots, the AI advisory reuses the existing `factory_risk_explanation`
surface, data sources show two honest states rather than three unconditional
ticks, and **predicted risk renders "Not available"** because no forecasting
model exists.
`record:` [2026-08-09-T-025-factories-end-panel-ai](sessions/2026-08/2026-08-09-T-025-factories-end-panel-ai.md)

**Middle column done (T-026):** header 4-up fact row, and a `factory-snapshot`
carrying an overall-condition panel with **derived** reasons (open violations,
days since last inspection, licence expiry) plus six real metrics. Compliance
rate and machines dropped — neither exists in the schema. Removed the duplicated
provenance card, the condition card and the snapshot-facts card;
`factory-overview` 159 → 104 lines.
`record:` [2026-08-09-T-026-factories-middle-column](sessions/2026-08/2026-08-09-T-026-factories-middle-column.md)

**Compliance section done (T-027):** inspection reports, violations and
penalties on three canonical `DataTable`s at the end of the middle column, with
the reference's un-sourced columns (violation open/closed, penalty amount)
dropped rather than faked, and a **restricted** state for RLS-hidden penalties.
`record:` [2026-08-09-T-027-factories-compliance-section](sessions/2026-08/2026-08-09-T-027-factories-compliance-section.md)

**Trends + ordering done (T-028):** a real risk-score trend from the recorded
snapshot history (compliance trend states its absence — no such score exists),
and the four disclosures moved to the very end via a new `factory-sections`.
`record:` [2026-08-09-T-028-factories-trends-and-order](sessions/2026-08/2026-08-09-T-028-factories-trends-and-order.md)

**Extraction done + Factory profile card (T-029):** `features/factories/view.ts`
now owns every view model, taking `RevampFactory360Portfolio.tsx` from **361 to
202 lines** of pure composition. The profile card leads the disclosure stack —
Activity, Region, City and the primary representative are real; Sector shows
*Not available* (no column); media is **counted, never previewed** (no signed
retrieval surface on this screen).
`record:` [2026-08-09-T-029-factories-profile-and-extraction](sessions/2026-08/2026-08-09-T-029-factories-profile-and-extraction.md)

**Remaining slices:** filling the four disclosure sections (they only link into
the dossier today), and `/factories/cr/[id]`, untouched legacy.

---

### T-023 · Slim `app/(app)/planning/page.tsx`
`status: todo` · `rules: WEB-001 §2, WEB-000 §2` · `est: 3h`

**555 lines against a 40-line cap** — the largest route-file violation on the
migrated surface, and T-022 made it worse by ~75. Same remedy that worked for
Visit Management: a `planning-workspace` screen component owning composition and
string mapping, route reduced to access + query + render. Also clears the
route's remaining `//` and `{/* */}` comments.

---

### T-022 · Planning assistant — insights, recommendations, quick actions, stats
`status: done (static verification only)` · `rules: WEB-000…004, WEB-008, WEB-009, WEB-011` · `est: 2.5h`
`record:` [2026-08-09-T-022-planning-assistant-panels](sessions/2026-08/2026-08-09-T-022-planning-assistant-panels.md)

The vendor mock's AI band and stat row, on SAQEEL components over the platform's
**existing** governed AI foundation — `ai_suggestions`/`ai_events`, the
fail-closed Gemini adapter, and the RLS-re-reading server action.
**No edge functions were needed or written.**

Four mock values were not governed data and were not copied: the two confidence
percentages (the provider supplies none), the per-visit AI score, "Needs
Planning" and "Expiring Windows". Recommendations rank by recorded
`factories.risk_score`; the two undefined buckets render *Not configured*.

---

### T-021e · Planning skeleton + segmented-control width
`status: done (static verification only)` · `rules: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011` · `est: 40m`
`record:` [2026-08-09-T-021e-planning-skeleton-and-segment-width](sessions/2026-08/2026-08-09-T-021e-planning-skeleton-and-segment-width.md)

- **`SegmentedControl` gained `inline-size: fit-content`.** `inline-grid` is not
  "shrink to fit" for a flex/grid child — those parents blockify and stretch it,
  which is why the same control was inline in every toolbar but full-width on
  `/planning`. Fixed once at the base rather than wrapped at one call site.
- **`planning-skeleton`** replaces `RouteLoading` on `/planning`, mirroring the
  real first-paint order. The collapsed create-method grid is deliberately not
  drawn. `RouteLoading` stays — 10+ admin routes still use it.

Touches five screens; wants an LTR **and** RTL pass (mirrored sliding pill).

---

### T-021d · Shared date presets, visit-status pill, ping geometry
`status: done (static verification only)` · `rules: WEB-000, WEB-002, WEB-008, WEB-009, WEB-011` · `est: 1h`
`record:` [2026-08-09-T-021d-shared-date-presets-status-pill-ping](sessions/2026-08/2026-08-09-T-021d-shared-date-presets-status-pill-ping.md)

- **One preset set** in `saqeel/date-range-picker/date-range-presets.ts`, labels
  in `common.scope`. Shell, `/planning` and Visit Management all consume it.
- **The shell's own picker was broken** — 8 of 16 required strings, no `locale`.
  That was the `shell-topbar.tsx:81` "pre-existing" error; it hid two defects.
  **The repo now typechecks clean for the first time on this branch.**
- **Visit status** is a pinging `StatusPill`, not bare text.
- **`PingDot`** is circular by construction (`aspect-ratio`) and centred
  (`vertical-align`, explicit `transform-origin`).

---

### T-021c · Primitive refinements + Visit Management skeleton
`status: done (static verification only)` · `rules: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011` · `est: 1.5h`
`record:` [2026-08-09-T-021c-primitive-refinements-and-visits-skeleton](sessions/2026-08/2026-08-09-T-021c-primitive-refinements-and-visits-skeleton.md)

Three base-primitive defects fixed at source, one skeleton built:

- **`DataTable`** — `grow` gave one column 100 % of the slack (dead gap + a
  wrapped neighbour). Rule deleted, **rung deleted**, 20 call sites updated.
- **`Select` / `MenuRow`** — the count rides inside the label as a **superscript
  `CountBadge`** (a variant of the primitive, keeping its surface and corner in
  both themes), not a full-size badge beside it; the selected-check moved to the
  row's end.
- **`StatusPill`** — symmetric `padding-inline`; `[data-ping]` no longer
  overrides only the start edge.
- **`visits-skeleton`** — mirrors the real layout; both loading routes rebuilt.

All four are visual and need a browser pass in light/dark and RTL.

---

### T-021b · Visit Management — remaining surfaces
`status: todo` · `rules: WEB-002 §2, WEB-003` · `est: 4h` · `blocked-by: T-021a e2e`

The bulk-action forms still hold native `<select>` and `datetime-local`
controls — **there is no datetime primitive**, which is the one genuine gap
blocking a fully native-control-free screen. The four sibling views
(`calendar`, `map`, `workload`, `[id]`) are untouched legacy and still hold the
`sq-table` / `sq-lozenge` rules that keep the legacy sheets alive.

---

### T-020a · `/factories` — top stripe
`status: done` · `rules: WEB-002, WEB-003, WEB-008, WEB-009, WEB-011` · `est: 1h`
`record:` [2026-08-08-T-020a-factories-scope-bar](sessions/2026-08/2026-08-08-T-020a-factories-scope-bar.md)

First slice of T-020. The portfolio chooser is now
`components/sections/factories/factories-scope-bar` — `Field` + `SaqeelSelect` +
`Button` + `CountBadge` on a GET form, new `factories` i18n namespace in `en` and
`ar`. The owner chose to keep the two-step interaction (select, then
`View factory`) rather than route on change as `operations-scope-filter` does.

Static verification only. Nothing on the row became deletable.

---

### T-030 · `StatusPill` — one size
`status: done` · `rules: WEB-002 §4.5 §7, WEB-009 §1` · `est: 30m`
`record:` [2026-08-08-T-030-status-pill-one-size](sessions/2026-08/2026-08-08-T-030-status-pill-one-size.md)

Owner-reported: two pill sizes shipping side by side on the dashboard. Cause was
`size?: "sm" | "md"` **defaulting to `md`** — 19 of 25 call sites passed `sm`,
six did not. The prop is deleted rather than re-defaulted, so the rung cannot
come back. 15 files rewritten; verified from disk at 28 call sites, zero `size=`.

One site was missed on the first pass — `app/(app)/operations/page.tsx:1216`, the
only `StatusPill` outside `components/sections/**`. **Grep the route files too.**

**This is the pattern to repeat as the app migrates:** when a primitive offers a
rung nobody should use, delete the rung. A prop with one correct value is a
future inconsistency, not a variant.

---

### T-020b · `/factories` — workspace grid and start panel
`status: done` · `rules: WEB-000…003, WEB-008, WEB-009, WEB-011` · `est: 2h`
`record:` [2026-08-08-T-020b-factory-workspace-and-portfolio](sessions/2026-08/2026-08-08-T-020b-factory-workspace-and-portfolio.md)

The screen is now a real grid: `factory-workspace` (18 + 36 lines) owns
start / middle / end on fractional columns, collapsing 3 → 2 → 1. The start
panel is `factories-portfolio` (144 + 94) on `Card`, `StatCard`, `StatusPill`
and `Icon`; mapping moved to `features/factories/portfolio.ts`.

Fixed on the way through: `<dl>` inside `<button>`, a `[dir="rtl"]` box-shadow
flip, colour-only selection, and a missing heading level. Also made
`e2e/factory360-provenance-contract.spec.ts` pass — it was already red.

Middle and end columns are still legacy. Static verification only.

---

### T-020c · `/factories` — middle column and end panel
`status: in-progress (sliced)` · `rules: WEB-000 §2, WEB-001 §2, WEB-002, WEB-011, WEB-012` · `est: 4h`
`record (pass 1):` [2026-08-08-T-020c-p1-factory-middle-column](sessions/2026-08/2026-08-08-T-020c-p1-factory-middle-column.md)
`record (pass 2):` [2026-08-08-T-020c-p2-factory-end-panel](sessions/2026-08/2026-08-08-T-020c-p2-factory-end-panel.md)

**Pass 1 done:** the middle column (`sq-f360__hero`, provenance banner,
`__condition`, `__snapshot`, four `__section` accordions) is now
`components/sections/factories/factory-overview` on Saqeel primitives; ~25 labels
moved to the `factories` i18n namespace in `en` + `ar`; risk is a `StatusPill`,
not colour-only. Static verification only.

**Pass 2 done:** the `__context` **end panel** is now
`components/sections/factories/factory-context` (Selected context / source status
/ Contextual AI cards); the `sq-f360__context` bridge and the `provenanceBadge`
map are gone; new `ai` i18n group (en + ar). All `StatusPill`s on the screen now
ping (owner request). Static verification only.

**Still remaining for full T-020c:** the route-file slim
(`app/(app)/factories/page.tsx` reads → `features/factories/queries.ts`, clearing
its legacy `//` comments and the `let`), and the orphaned-CSS deletion below.
Also open: whether pill-ping becomes a global rule (owner decision — affects
dense operations/risk tables).

Deletes on completion: `saqeel-runtime.css` 786–804 — the eighteen
`.sq-f360__summary` / `.sq-f360__license` rules orphaned by T-020b — plus
whatever the middle column releases.

Route file `app/(app)/factories/page.tsx` is 121 lines of data logic and four
comments; WEB-001 §2 caps it at 40 and moves the reads into
`features/factories/queries.ts`.

---

### T-000 · Guardrails: gate scripts, lint, verify pipeline
`status: todo` · `rules: WEB-000, WEB-006` · `est: 3h`

Nothing else starts until the rules are machine-enforced, because a rule that is
only in a document is a suggestion.

- `apps/web/scripts/gates/` — one script per gate in WEB-006 §3
- ESLint flat config: `@next/eslint-plugin-next`, `eslint-plugin-jsx-a11y`
  (all rules error), `@typescript-eslint` strict, `no-restricted-syntax` for
  `let` in `.tsx`, `no-console`
- `npm run gates`, `npm run verify`
- Wire both into `.github/workflows/`
- Baseline report: current violation count per gate, recorded in the session
  neuron, so progress is measurable

Acceptance: `npm run gates` runs, reports, and fails on a deliberately planted
violation of each rule.

---

### T-001 · Icon layer: lucide-react, registry, `Icon` primitive
`status: todo` · `rules: WEB-002 §5` · `est: 2h` · `blocked-by: T-000`

- Add `lucide-react`
- `components/saqeel/media/icon-registry.ts` — semantic name → Lucide component
- `components/saqeel/media/Icon.tsx` + `Icon.module.css` (token-driven sizes,
  `currentColor`, `aria-hidden` by default, `label` for standalone use)
- Map every glyph currently in `app/icons.tsx` to a semantic registry name
- Mark `app/icons.tsx` with the `@retiring` banner; add its ledger row
- Enable `gate:no-svg` and `gate:icon-registry`

Acceptance: `<Icon name="riskCritical" />` renders; zero new `<svg>` possible.

---

### T-002 · SAQEEL design system — one stylesheet
`status: done` · `rules: WEB-000, WEB-002, WEB-003, WEB-005, WEB-007` · `est: 5h`
`record:` [2026-08-07-T-002-design-system](sessions/2026-08/2026-08-07-T-002-design-system.md)

**Redefined by the owner on 2026-08-07.** The original T-002 ("core primitives",
CSS Modules, React components) was replaced before it started. The design system
is now **one stylesheet**, not a component library plus per-component modules.

Delivered: `apps/web/src/app/saqeel.css` — 2,050 lines, one file, three cascade
layers (`sqx.tokens`, `sqx.base`, `sqx.components`). 339 custom
properties, 59 classes, 3 keyframes. Prefix is `--sqx-` / `.sqx-` — `--sq-` and
`.sq-` belong to the legacy sheets, and `sqx` collides with nothing. Variants are data
attributes, not modifier classes. Imported once from `app/layout.tsx`.
`tokens.css` untouched. WEB-002 §6 replaced; WEB-001 §9 gained the direction
exception.

The React primitives that consume these classes are **not** part of T-002 and are
now T-004.

---

### T-003 · Install and self-host Readex Pro
`status: todo` · `rules: WEB-005 §5` · `est: 2h`

`saqeel.css` declares `--sqx-font-sans: "Readex Pro", "IBM Plex Sans Arabic",
system-ui, sans-serif` but ships no font files, so the fallback currently carries
the app. This task self-hosts the family.

- `next/font/local`, variable 160–700, one file per script (Latin, Arabic)
- Only the weights the twelve type roles use: 400, 500, 600, 700
- `display: swap`, preloaded, subset where the character set allows
- Record the byte cost per weight and drop any weight that cannot justify itself

Acceptance: no external font request, no FOIT, first-load JS unchanged, byte cost
recorded.

---

### T-004 · App shell — header, sidebar, content frame
`status: done` · `rules: WEB-000…005, WEB-007` · `est: 6h`
`record:` [2026-08-07-T-004-app-shell](sessions/2026-08/2026-08-07-T-004-app-shell.md)

**Redefined by the owner on 2026-08-07** — the board's T-004 was "React
primitives over `saqeel.css`"; that work is now **T-006**.

Delivered: `components/app-shell/**` (15 files, 897 lines), `features/shell/**`
(4 files, 307 lines), `components/saqeel/icon/**` (2 files, 89 lines), plus 638
lines of `.sqx-shell*` CSS in `app/saqeel.css`. `(app)/layout.tsx` is 6 lines.
`ShellClient.tsx` (46 KB) is off every `(app)` route. Icon layer is
`lucide-react` behind one registry — zero hand-authored `<svg>` in the shell.

**Not verified in a browser.** The SWC blocker below meant none of the brief's
13 runtime checks could run. Static verification only.

---

### T-005a · Kill the native dropdown and date picker
`status: done` · `rules: WEB-002 §2 (suspended), WEB-008, WEB-009` · `est: 3h`
`record:` [2026-08-07-T-005a-native-controls](sessions/2026-08/2026-08-07-T-005a-native-controls.md)

`menu-surface`, `select` and `date-range-picker` built; the topbar scope controls
rebuilt on them. Both Definition-of-Done greps pass. The ink and green ramps were
re-saturated at hue 152 — `--sqx-surface-canvas` is now `#000A05` and all 20
claimed contrast ratios were re-measured and confirmed.

`--sqx-rim-light` changed from a colour to a shadow, which required rewriting
`--sqx-elevation-1…4`; without it every dark elevation would have silently
dropped. `--sqx-gradient-chrome` was restated as instructed but is **not
consumed** — the chrome stays flat per the owner's earlier decision.

---

### T-005 · Header controls — the reusable control family
`status: blocked` · `rules: WEB-002 §2, WEB-008, WEB-009` · `est: 8h`
`record:` [2026-08-07-T-005-header-controls](sessions/2026-08/2026-08-07-T-005-header-controls.md)

**Blocked on 13 missing tokens.** WEB-002 §2 and WEB-008 §2 forbid adding a token
inline; a gap is reported and stopped on. Two of the ten components need no new
token and are delivered: `icon-button`, `kbd`. The other eight are blocked, and
`menu-surface` blocks five of them on its own.

Delivered: `components/saqeel/icon-button/**`, `components/saqeel/kbd/**`,
barrel exports, and the topbar's hand-built icon buttons replaced.

**Unblocking is one change request**: add the 13 tokens in the record's gap block
to `saqeel.css`, then T-005 completes in one pass.

---

### T-006 · React primitives over `saqeel.css`
`status: todo` · `rules: WEB-002, WEB-003` · `est: 5h`

The typed component layer that applies the classes T-002 built. Components ship
**no CSS** — they map props onto `.sqx-*` classes and data attributes.

- `surface/` — `Card`, `Panel`, `Section`, `SectionHeader`, `Divider`
- `surface/` layout — `Stack`, `Cluster`, `Grid` (the only sources of spacing)
- `data/StatusPill` — the ten canonical roles, text plus shape
- `inputs/Switch` (Toggle) — full APG keyboard and labelling contract
- `actions/Button`, `actions/IconButton` — rebuilt to the primitive contract
- `data/KpiTile`, `feedback/EmptyState`, `feedback/Skeleton` — rebuilt

Acceptance: each primitive under 200 lines, zero colocated CSS, axe-clean,
correct in dark and RTL, ledger rows written.

---

### T-007 · Adopt `ShellPageFrame` across the 55 route files
`status: todo` · `rules: WEB-001 §2, WEB-005` · `est: 6h` · `blocked-by: T-004`

T-004 built `shell-page-frame` but was forbidden from touching pages, so the
default `Shell` export from `components/Shell.tsx` is still imported by 55 files
under `app/(app)/**`. Each one swaps `<Shell title>` for `<ShellPageFrame>`.
Only when all 55 are migrated — plus T-008 — can `Shell.tsx` be deleted.

---

### T-008 · Migrate the two out-of-group admin layouts
`status: todo` · `rules: WEB-001 §7` · `est: 2h` · `blocked-by: T-004`

`app/admin/execution/layout.tsx` and `app/admin/dashboard-config/layout.tsx` sit
**outside** the `(app)` route group and still import the named `AppShell` from
`components/Shell.tsx`, so `ShellClient.tsx` (46 KB) still ships on those two
routes. Point them at `components/app-shell/app-shell` and `ShellClient` reaches
zero imports.

---

### T-005 · Reference route — the showcase
`status: todo` · `rules: WEB-002 §9` · `est: 2h` · `blocked-by: T-004`

A single internal route rendering every primitive in every variant, in light,
dark, English and Arabic. This is what gets opened in the manager meeting and it
is also the fastest way to spot a broken variant.

Acceptance: one page, every primitive, every state, zero axe violations.

---

## NEXT

### T-010 · Application shell
`status: todo` · `rules: WEB-001, WEB-004, WEB-005` · `est: 6h`

`ShellClient.tsx` is 45 KB of client JavaScript loaded on every route — the
single largest tax in the app.

- Rebuild `Sidebar`, `TopBar`, `PageHeader`, `Breadcrumb` as server components
- Isolate genuinely interactive pieces (menu, theme toggle, notification bell,
  command palette) as small client islands
- Navigation config becomes typed data, not JSX
- Skip link, landmarks, focus-on-route-change
- Mark `Shell.tsx`, `ShellClient.tsx`, `ShellNavIcon.tsx` for retirement

Acceptance: shared chunk drops measurably; shell fully keyboard operable; every
route inherits the improvement.

---

### T-011 · `/dashboard`
`status: todo` · `est: 5h` · `blocked-by: T-010`

`DashboardView.tsx` is 45 KB. KPI tiles, charts, and activity become server
components; charts get accessible data tables; `<Suspense>` per widget.

---

### T-012 · `/operations`
`status: todo` · `est: 6h` · `blocked-by: T-010`

`page.tsx` is 79 KB of route file — the clearest violation of WEB-001 §2 in the
repository. Becomes a ≤ 40-line page composing a server-rendered board, with
filters and tabs moved to `searchParams`.

---

## LATER

| Task | Target | Why |
| --- | --- | --- |
| T-020 | `/factories` list + `/factories/[id]` + `/factories/cr/[id]` | 45–49 KB each. **Typography is already done on all three (T-064/065/067) — carry it across unchanged and read [WEB-014 §11](rules/WEB-014-typography-contract.md) before you start.** Your scope is structure: route files, `--type-*` → `--sqx-*`, frozen `.sq-*` globals. Not one font size is yours to re-decide, and a rebuild is not a fresh start for §4.1. |
| T-021 | `/planning` + `/planning/bulk` + `/planning/single` | 41 KB + 53 KB `ReviewClient` + 34 KB `Wizard` |
| T-022 | `/reviews/[id]`, `/visits`, `/visits/[id]` | 40–46 KB each |
| T-023 | `/field` home, `/field/my-tasks`, `/field/[visitId]` | `Startup.tsx` 85 KB; strictest perf budget |
| T-024 | `/field/inspection/[id]` | `Workspace.tsx` **136 KB** — the largest single file; split last, after every primitive exists |
| T-025 | `/admin/*` | packages 46 KB, regulations 36 KB, violations 34 KB, access 27 KB |
| T-026 | `/compliance`, `/execution`, `/analytics` — `/enforcement-library` done 2026-08-08 (page 410 → 25 lines, `features/enforcement/` + `components/enforcement/`) | |
| T-030 | Dynamic-import `mapbox-gl`, `leaflet`, `three`, `twilio-video` | remove from shared chunk |
| T-031 | Font weight audit — drop unused Arabic weights | ~45 KB each |
| T-032 | Legacy CSS sweep — delete orphaned rules from `saqeel-runtime.css` (170 KB) and `saqeel-components.css` (50 KB) | runs continuously, closed out here |
| T-033 | Cache posture pass — declare and tag every query | WEB-001 §5 |
| T-034 | Delete every file that has cleared its retirement gate | WEB-006 §4 |

---

## PARKED

Ideas discovered mid-task go here and are left alone until their proper turn.
Pull one in only if it is genuinely part of doing the active task well.

- **`sq-notification__badge` renders at 10px — below WEB-014 §7's 11px floor**
  (found in T-083, measured on `/planning` in both locales). It is a frozen-sheet
  `.sq-*` global in the shell, so the breach is on **every route in the
  application**. The frozen sheets are exempt from the gate, so nothing will ever
  flag it; only a render finds it.

- **`NotificationBell.tsx:270` is the last violation on every otherwise-clean
  route** (found in T-083). `style={{ fontWeight: unreadRow ? 600 : 500 }}` —
  banned outright by WEB-014 §4.1 with no exemption. **It is a ruling, not a
  rename:** 500 is not a weight the nine-role scale has, so the fix is `body` vs
  `body-strong`, and that visibly changes how a read row differs from an unread
  one. `/factories`, `/factories/[id]` and `/planning/visits/[id]` each sit at
  exactly 1 violation and this is it.

- **16 retired-role references remain inside `components/saqeel/`** (found in
  T-083, deliberately out of that task's agreed scope): `primitives.module.css`
  ×14 (`title` ×2, `body-lg` ×2, `caption` ×8, `code` ×2), `kbd.module.css` ×1,
  `list-row.module.css` ×1. `title → display` and `body-lg → body` are the same
  alias-rename shape, **but `primitives.module.css` is 1,200+ lines and was not
  read**, so whether each site wants the canonical role is not established. The
  `caption`/`body-lg`/`title`/`code` aliases cannot be deleted from `saqeel.css`
  until these and the feature-code references are all gone.

- **`npm run lint` and `npm run verify` do not exist** (found in T-083) — not in
  `apps/web/package.json` and not at the repo root, though CLAUDE.md's working
  protocol names both and the session template has a checkbox for `lint`. Either
  the doc is stale or the scripts were lost. Every session record that ticked
  `npm run lint` ticked something that could not have run.

- **Task-ID collisions in the tracker and session log** (found in T-083): two
  distinct records share **T-078** (`repair-the-broken-responsive-spec` and
  `visit-detail-screen`), and T-082 was nearly reused. IDs are allocated by
  reading the board, so a concurrent session picks the same number. Needs a rule
  or a counter.

- **`Skeleton shape="pill"` is 8px taller than the `StatusPill` it stands in for**
  (found in T-089). The bone is `block-size: var(--sqx-control-h-sm)` = **32px**;
  `StatusPill` is `min-block-size: var(--sqx-space-6)` and renders **24px**.
  Measured on the factories advisory strip — skeleton 82px, live 74px. **This is
  app-wide:** every skeleton drawing a pill overshoots by 8px per pill row, so
  every route with a skeleton has a small layout shift on data arrival. The fix is
  one line in `skeleton.module.css`, but it moves every skeleton in the app and so
  needs its own task with a per-route re-measure.
- **`components/saqeel/inputs/` is a dead parallel input layer inside the design
  system** (found in T-084, while checking which "our own Select" to use).
  Nine files — `Select`, `Input`, `Field`, `FileUpload`, `Combobox`,
  `DateRangePicker`, `SegmentedControl`, `StatusSelector`, `Choice` — of which
  **eight have zero importers**; only `Switch` from `Choice` survives, in
  `profile/NotificationPrefsForm.tsx`. **The names collide with the live
  components**, so an agent told "use our own Select" can import
  `saqeel/inputs/Select` — the dead one, built on the banned native `<select>`
  with `className="input"`, inline `style={{}}`, a `/* */` comment and hardcoded
  English `aria-label`s. This is exactly T-077's name-collision trap, sitting in
  the design-system folder. Retirement needs the WEB-006 §4 protocol and a
  re-baseline: `Combobox.tsx` and `StatusSelector.tsx` each hold a typography
  violation in `scripts/typography-baseline.json`.
- **`DateRangePicker.DEFAULT_STRINGS` is English copy inside a primitive**
  (found in T-084). "From", "To", "Reset", "Apply", "Not set" are hardcoded and
  are what `shell-scope-controls` renders today, since it passes no `strings`.
  WEB-013 applies to the design system too; the default should be removed and the
  prop made required, which is a change across its 6 consumers.
- **~50 hand-rolled `<textarea>` bypass the `Textarea` primitive** (found in
  T-082, owner asked whether the app has a reusable one). It does —
  `components/saqeel/textarea` — with **4 consumers**: this route's `NotesEditor`
  plus three `planning-*` sections. Every other multi-line field is a raw
  `<textarea>` on a legacy class: `className="input"` (~25, all under `field/*`),
  `sq-textarea` (~8), `sq-input` (~3), and a handful on local module classes in
  `sections/approvals/*` and `sections/regulations/*`. They therefore **miss the
  new border-colour focus treatment**, keep the browser's `resize: both`, and
  carry their own font declarations. Not a defect in the primitive — a migration
  the unmigrated screens have not had. Should be sequenced per screen alongside
  those routes' own rebuilds rather than as one 50-file sweep, because each call
  site also needs `Field`, i18n and state review.
- **WEB-009 §5 now contradicts the code** (found in T-082). The rule says focus is
  an `outline` ring that moves nothing; the owner has ruled that inputs express
  focus as a **border colour** with no ring, which is what `Select` already did
  before this task. `TextInput`, `Textarea` and `FileUpload` now match. §5 needs
  rewording to say: controls with a border express focus by recolouring it to
  `--sqx-border-focus` at unchanged width; controls without one (buttons, rows,
  tabs, the checkbox box) keep the ring. **Until it is amended the rulebook and
  the design system disagree, and a future task will "fix" one of them at random.**
- **`visits/[id]/actions.ts` renders hardcoded English to users in both locales**
  (found in T-082; owner ruled it a task of its own, not a fold-in). Every one of
  the eight server actions builds its `ActionResult` copy inline —
  `"Session expired — sign in again."`, `"Choose a file first"`,
  `"Missing visit id"`, `"This attachment is already removed…"`,
  `"Attachment removed. The file and its audit record are kept."` — and
  `NotesEditor`/`Attachments`/`ActionBar` print them straight into their
  `live="alert"` and `live="status"` regions. Two compounding defects: **the
  Arabic screen shows English on every write outcome** (WEB-013 / rule 18), and
  the success line ships an engineering identifier —
  `Attachment "{name}" uploaded (M02-042, audited)` — which is exactly the class
  T-077 raised against the seeded `ui_strings` rows. Needs ~10 keys per locale,
  a decision on whether `(M02-042, audited)` is user copy at all, and a look at
  `mapError()`, which may be a second source of raw provider text.
- **`components/sections/planning/*` is a dead parallel tree** (found in T-053).
  Only `planning-skeleton` is a value import, from `planning/loading.tsx`.
  `planning-insights`, `planning-recommendations`, `planning-quick-actions`,
  `planning-stat-cards`, `planning-visit-table`, `planning-filter-bar` and
  `planning-ai-advisory` render nowhere, and `features/planning/assistant-view.ts`
  is imported by exactly one of them — fully orphaned. Needs a retire-or-adopt
  ruling before anyone edits `components/planning/*` again and mistakes which
  tree is live.
- **`authority` and `risk` have no data source on `/planning`** (found in T-053).
  Both were hardcoded placeholders in `view.ts`; they now read "Not configured"
  in the visit drawer. Wiring them is a product-contract question.
- **`npm run lint` does not exist** (found in T-053; `gates` added in T-057).
  `CLAUDE.md`, `WEB-006` and `sessions/_TEMPLATE-session.md` all require it;
  `apps/web/package.json` still has no `lint`. Either add the script or correct
  the rulebook — records currently tick a box that cannot be run.
- **`check:design-system-v5` has been failing since before T-057** (found in
  T-057). It reports `utc-slice-date-format` hits in `lib/ai/briefing.ts` and
  `lib/analytics/query-state.ts`, plus a glyph rule. Verified pre-existing by
  stashing T-057's diff and re-running. `npm run gates` therefore exits non-zero
  on a clean tree — fix or allowlist these before the gate can be trusted as a
  merge condition.
- **`/ar/login` serves `<html lang="en" dir="ltr">`** (found in T-057). The
  `:lang(ar)` block in `saqeel.css` carries every Arabic line-height override,
  so if `lang` is never `ar` on a rendered route, **none of the Arabic
  typography tuning applies**. Confirm which routes actually set it before
  T-031's font audit, or the measurements will be taken against the wrong
  cascade.
- **`FactoryList.tsx` + `factory-list.module.css` are orphaned** (found in
  T-065). Zero importers — `/factories` renders `RevampFactory360Portfolio`.
  3 typography violations that will keep surfacing in audits until deleted.
  Bundle this with the `DashboardView` deletion below into one retirement task.
- **The `DashboardView` tree under `src/app/(app)/dashboard/` is orphaned**
  (found in T-058). `DashboardView.tsx`, `DecisionCanvas.tsx`,
  `RegionalScope.tsx`, `BasisDrawer.tsx` and the 318-line
  `dashboard.module.css` have **zero inbound imports** — `page.tsx` renders
  `DashboardSections`. The stylesheet still holds the worst literals in the
  repository (`52px`, `42px`, `34px`, `22px`, `18px`) on the pre-Saqeel
  `--type-*` token set, so it will keep showing up in audits until deleted.
  Same shape as the parked `components/sections/planning/*` orphan. Needs a
  retire ruling, then deletion under WEB-006 §4.
- **`Heading` needs `ref` and `tabIndex` support** (found in T-059). Blocks
  `explain-panel` migrating its `<h2>`, which carries `tabIndex={-1}` and a
  `ref` for dialog focus return. React 19 accepts `ref` as a plain prop so the
  change is small, but it is a design-system change and needs its own task.
  8 violations wait on it.
- **`.sq-pagehead` is still legacy `.sq-` markup** (found in T-059).
  `Shell.tsx` renders it against rules in the frozen `saqeel-runtime.css`.
  T-059 fixed only the title's font; the header migrates with the shell.
- **`CardHeader.eyebrow` has 21 remaining call sites** (found in T-058, 3 closed
  in T-059).
  Enforced down by the `card-eyebrow-above-title` gate rule; the prop is deleted
  when the count reaches 0. Concentrated in `planning-single` (7), `factories`
  (5), `enforcement` (3) and skeletons (6).
- **`dashboard.yourWork.eyebrow` is a misnamed i18n key** (found in T-058). It
  now renders as a card description, not an eyebrow. Renaming touches both
  locales and one call site.
- **`04-COMPONENT-LEDGER.md` is duplicated end to end** (found in T-057). Every
  section from `## actions/` appears twice — lines ~20–193 and again ~195–486 —
  and the two copies have **diverged**: the first carries the current detailed
  rows, the second is a stale earlier draft. An agent reading the file top to
  bottom can act on either. T-057's new row was inserted into the first copy
  only. Delete the stale half before the next ledger edit.
- **1,130 typography violations across 380 entries** (baselined in T-057).
  `scripts/typography-baseline.json` is a ratchet; each screen task burns its
  own entries down per WEB-014 §8. The remaining bulk sits in `/field/*`,
  `/admin/*` and `dashboard.module.css`, which carry raw `52px` / `34px` /
  `12.5px` values predating the token sheet.
- **`SegmentedControl`'s `subtle` default is wrong for a toggle.** Five shipped
  toggles pass `tone="accent"`; the only `subtle` consumers left are three tab
  strips (`catalogue-screen`, `regulation-workspace`, `IdentityDossier`'s map
  switch). The bulk ALL/ANY control shipped near-black because it took the
  default. Either `accent` becomes the default and tabs opt out, or the two
  roles get distinct names — a design-system decision, in the shape of T-030's
  "a prop with one correct value is a future inconsistency".
- **`single-visit-screen.tsx` is 256 lines against a 200-line cap** (found in
  T-056; it was 249 before). Extracting the notice stack moves ~10 lines and does
  not clear it — the real fix is splitting the screen.
- **`portfolio-picker.tsx:53` puts `role="listbox"` on a `<ul>` whose children
  are `<li>` radios** (found in T-056). Invalid ARIA child structure: a listbox
  takes `option`s, and these are labelled radio controls.
- **`/planning/single` still holds ~110 `t(key, "English")` call sites** reading
  Arabic from the `ui_strings` table, and `plan.single.searching` still has no
  Arabic row (owed since T-045). T-056 moved 10 keys into `planning.single`;
  the rest is a screen-sized WEB-013 migration.
- **`actions.ts`'s `factory_id` / `license_number` radio fallbacks** are now
  partly unreachable after T-056 moved the search out of the publish form.
  Delete outright, or keep as dead defence — needs a ruling.
- **`IdentityDossier`'s map toggle on `/planning/single` is still `subtle`** and
  is a toggle, not a tab strip. It has the same defect the owner reported on
  `/planning/bulk`, and was left alone because it is a different screen.
- **NEVER run a second dev server against a `.next` another one is using, and
  never `taskkill /F` one.** T-046 ran seven dev servers on ports 3111–3118 to
  verify compiles while the owner's server held port 3000, and force-killed each.
  They all share `apps/web/.next`. The result was 4 half-written `*.pack.gz_`
  files and a webpack cache that **silently stopped emitting
  `static/css/app/(app)/planning/bulk/page.css`** — the route rendered with the
  global sheets only, so every CSS Module on it (criteria-builder,
  planning-notice, field) vanished and the owner saw an unstyled screen. The
  `Caching failed for pack ... rename '65.pack.gz_' -> '65.pack.gz'` warnings
  were visible for three turns and were dismissed as harmless. **A cache warning
  on a shared `.next` is a defect report.** Cure: stop every dev server, delete
  `apps/web/.next`, restart one. CLAUDE.md already said this; it was not heeded.
- **A regex is not a CSS parser.** `split(/}s*
+/)` corrupted `review.css`
  (119 → 157 lines, two orphans surviving) because it cannot see nested or
  compound rules; recovered with read-only `git show` and rewritten as a
  brace-depth scanner. Second time a regex has damaged a file on this route.
- **Verify what a stylesheet is holding up before believing its importer owns
  it.** `review.css` was imported by `review/page.tsx`, which used exactly one of
  its 58 classes; `ReviewClient` uses 44 and `EvidenceLedger` 12. Deleting it
  with the route file would have stripped the whole review screen.
- **`review/loading.tsx` is still `RouteLoading`** — a centred glyph with no
  mirror of the screen, and it needs the `<Shell>` wrapper the bulk skeleton
  initially missed.
- **`loadBulkDraft` is a read living in `actions.ts`**, a `"use server"` write
  module, now called from `queries.ts`. It belongs on the read side; moving it
  rides with slice 5.
- **A `loading.tsx` that skips `<Shell>` renders full-bleed.** The page frame
  padding lives in `.sq-content`, which `Shell` owns, so a bare skeleton sits
  against the rail and the viewport edge and the page head pops in afterwards.
  Caught on `/planning/bulk`; check any future skeleton against its sibling
  routes, which already wrap correctly.
- **THE APP SHELL MUST BE THE ONLY SCROLLER — now enforced.** `.shell` was
  `block-size: 100dvh; overflow: hidden` but still **in flow**, so a descendant
  escaping the clip grew `<body>` and the page had two scrollers. A focus change
  then scrolled both and parked the viewport below the 645px shell: the screen
  read as blank while rendering perfectly. Reported five times on
  `/planning/bulk` and misdiagnosed as a crash four times. Fixed with
  `position: fixed; inset: 0`; guarded by
  `e2e/shell-single-scroller-contract.spec.ts`. **Touches every authenticated
  route** and wants a visual pass.
- **"Blank screen" does not mean "something threw".** Four error boundaries were
  added before anyone measured `document.documentElement.scrollHeight`. Establish
  that a failure is what it looks like before instrumenting for it.
- **`global-error.tsx` did not exist.** Without it, an error escaping the `(app)`
  layout renders a literally blank document — no overlay, no state. Added, along
  with `error.tsx` for both bulk routes.
- **NEVER RENDER A RAW LABEL — now WEB-000 §9, binding.** Owner ruling after
  `medium`/`high`/`food`/`petrochemical` shipped raw in the distribution panels
  and `active` in the criteria dropdown. Everything carries `{ value, label }`;
  the label resolves once server-side through the locale resource; governed bands
  render as `StatusPill`. Resolution never goes inside a primitive.
- **A raw database value is not a label.** The criteria value dropdown rendered
  `{ value: v, label: v }`, and the English pill copy was inherited verbatim from
  the legacy `t("plan.bulk.eligible", "eligible")` defaults — so the screen
  showed `active`, `eligible`, `high`, `complete` in lower case, raw. Options now
  carry `{ value, label }`: the **value stays the raw DB string** so `evalNode`
  is untouched, and the label resolves through `planning.bulk.enumLabel` (23
  governed values, both locales) falling back to separator-stripped sentence
  case. Any screen mapping a DB enum straight into a label has the same bug.
- **RESOLVED 2026-08-10 — the owner ruled to fill, not carry.** `--sqx-surface-success`
  (6.89 light / 12.22 dark), `--sqx-surface-danger` (9.51 / 6.11) and
  `--sqx-grid-min-xs` (11rem) are in `saqeel.css` with measured ratios;
  `Button` gained `describedBy`; the review window is a `DateRangePicker withTime`.
  The `grid-min-xs` addition also fixes T-050s invalid `flex` in
  `criteria-builder.module.css:68`.
- **A criteria URL must never carry raw JSON.** `?ct=` percent-encoded a whole
  wire object into an unreadable address bar. Now base64url, UTF-8 safe via
  `TextEncoder` (`btoa` alone throws on Arabic criteria values), with `parseCt`
  falling back to the raw form so shared links keep working.
- **Dropping `target="_blank"` in a rewrite is a behaviour change.** The bulk
  targets table lost it silently and clicking a factory replaced the screen,
  which reads as a crash. Diff behaviour attributes, not just markup.
- **`/planning/bulk` and `/planning/bulk/review` now have `error.tsx`.** Neither
  did, so any client error blanked the subtree with no state. Check every
  migrated route for a boundary.
- **There is no busy/loading opacity token**, so a control or region that wants
  to read as "working" can only say so with text plus `aria-busy`. Wanted twice
  now (T-048's `--sqx-opacity-muted`, and the bulk filter's table dim) and
  dropped both times rather than invented. Third request should be a change
  request.
- **There is no shared spinner.** `Button` owns one inside its own module, so a
  non-button surface that wants the same mark has to duplicate the CSS. The
  bulk filter used text instead. Rule of Two says the next one extracts it.
- **A `Field` inside `Toolbar` collapses to its content width.** `Field` has no
  width and `TextInput` is `inline-size: 100%`, so a toolbar search box needs a
  `min-inline-size` wrapper from the calling screen. It caught `/planning/bulk`;
  any other toolbar search field has the same trap armed.
- **`bulk-targeting-form.tsx` is 219 lines**, over the 200 target. The
  select-all confirmation is the natural fifth extraction.
- **`TargetingLensClient` takes 16 props** against a review limit of 8, all
  pass-through to its four children. Slice 2 should hand it the view model and
  the string bundles, not 16 scalars.
- **`criteria.ts` still lives in `app/(app)/planning/bulk/`** and is now
  imported by `features/**` and `components/**`. It holds no React and no
  Supabase — it belongs in `features/planning-bulk/` or `lib/planning/`. The
  move is mechanical but touches `actions.ts`, `BulkForm`, `CriteriaBuilder`
  and the review route, so it rides with slice 5.
- **`distinctValues` now trims before de-duplicating** (T-046 slice 1b), so a
  whitespace-only `region` no longer appears as a suggestion. `evalNode` still
  compares raw values, so such a row stays matchable by a typed criterion — the
  suggestion list and the evaluator disagree by exactly that edge case.
- **`inline-grid` / `inline-flex` is not "shrink to fit" for a flex or grid
  child** — the parent blockifies and stretches it. `SegmentedControl` carried
  that bug invisibly until a page placed it outside a toolbar (T-021e). Any
  other primitive relying on an inline display type for its width has the same
  trap armed; worth a sweep at the next design-system audit.
- **`FactoryRisk` and `factory-risk-outlook` overlap.** Both render a score, band
  pill and driver lines; the outlook adds predicted risk, latest change and the
  action. If `/factories/[id]` ever wants those three sections, it should adopt
  `factory-risk-outlook` and `FactoryRisk` retires.
- **The mock's "Top Risks" list has no source.** Overdue checklist items, repeat
  violations within 12 months and inspection-cycle breaches each need a governed
  definition and a query. The recorded driver breakdown is the honest stand-in
  shipped by T-025.
- **There is no risk forecasting model.** `/factories`' end panel states
  "Predicted risk — not available" rather than projecting one. Any future
  forecast is a modelling decision, not a UI one.
- **`e2e/factory360-provenance-contract.spec.ts` is very likely red.** It asserts
  against raw source text and was already flagged fragile; T-024 and T-025
  reshaped both side panels, and **T-026 deleted the middle column's provenance
  block outright** (the end panel now owns provenance).
- **The type scale is net −1 px per role (T-026, owner request)** — applied as
  −2 px then +1 px after seeing it rendered. Smallest roles are now overline
  **10 px** (uppercase, `0.12em` tracking) and caption/code **11.5 px**: tight
  but defensible. Worth a look at 200 % zoom and on a phone before sign-off.
- **The recorded contrast ratios in `saqeel.css` predate the scale change.**
  Some pairs were justified at 3:1 on the WCAG "large text" allowance (≥ 24 px,
  or ≥ 18.66 px bold). `heading` at 21 px bold still clears it; **`subheading` at
  16 px semibold does not**, so pairs relying on 3:1 there now need 4.5:1.
  **Re-measure before the next accessibility sign-off.**
- **"Latest inspection" counts an inspection in any state**, including started
  but unsubmitted. If the product means *completed*, the read filters on
  `submitted_at` alone — one line, once ruled.
- **Neither a compliance score nor a machines table exists.** Both were dropped
  from the `/factories` snapshot rather than stubbed; they are schema gaps, not
  UI ones.
- **Seeded test data is excluded on `/factories` only.** T-024 added
  `isTestSourceFactory` (source-marked test rows) beside the existing
  `isTestFixtureEstablishment` (name/code fixtures) — **two independent signals,
  and only the first was being applied**. Every other screen reading `factories`
  (`/operations`, `/planning`, the dossier routes, the AI briefing) still carries
  a partial filter or none. **Before any customer demo**, fold both into one
  shared predicate applied at the query layer, so a caller cannot apply half of
  it.
- **`align-items: flex-start` on a container silently kills any grid inside it.**
  It shrink-wraps children to their content width, so a
  `repeat(auto-fit, minmax(…, 1fr))` grid has nothing to fill and collapses to
  one column. `factory-sections`' disclosure chrome carries it — correct for a
  note plus a button, wrong the moment a disclosure holds a grid (T-029).
  Anything reusing those styles inherits the trap.
- **A media gallery needs a signed-URL retrieval surface and a per-asset access
  check.** `/factories` counts `factory_media_assets` rather than previewing
  them (T-029) — an `<img>` with no working source is a broken image, not a
  placeholder. Building the real gallery is its own task.
- **`factories` has no sector column**, so the profile card's Sector reads
  *Not available*. Schema gap, not a UI one.
- **`/factories` issues eight reads per page load** across three batched
  `Promise.all` groups, all scoped to the visible portfolio. Worth a measurement
  pass once the app can run.
- **An empty result under RLS must never render as an absence of facts.**
  `penalty_notices` is readable only by reviewer/ops/auditor/compliance_admin/
  leadership; every other role gets an **empty set, not an error**. T-027 renders
  a *restricted* state for it — but **T-024's Active-penalties stat tile still
  shows `0`** for those roles and needs the same treatment. Check every
  role-restricted table for this pattern.
- **`penalty_notices` has no amount column**, so a penalty value cannot be shown
  anywhere. The reference's "Fine — SAR 4,000" has no source.
- **Trends are unbuilt.** A compliance trend has no source at all; a risk trend
  could come from `factory_risk_snapshots`, but a sparkline is a charting task
  with its own guidance and should be its own slice.
- **`invalidated_at is null` is a proxy for "open violation", not a definition.**
  `violations` has no resolution or closure state, so T-024's count means *not
  retracted*. If the table gains one, the count must move to it.
- **"Active penalty" is inferred, not a status.** `penalty_notices` has
  `issued/served/settled/withdrawn`; T-024 treats the first two as active. If the
  lifecycle grows a state, revisit.
- **`LICENCE_EXPIRY_SOON_DAYS = 30` is a display rule only.** It must not leak
  into planning or enforcement logic without being ruled a governed SLA.
- **Per-factory Compliance % has no source at all** — not a UI gap. A score would
  have to be defined and computed before the slot can return.
- **43 `emoji-as-icon` findings remain**, all on un-migrated planning sub-routes
  (`bulk`, `immediate`, `plans`, `supervision`, `single`) and other legacy
  screens. `CreateVisitSection` was cleared in T-022.
- **`MenuSurface` is now portalled and fixed — every menu in the app changed.**
  `select`, `date-picker`, `date-range-picker`, `shell-user-menu` and the
  planning create menu all inherit it. **Only the create menu was looked at; the
  other four need a browser pass in both directions**, especially
  `date-range-picker` (two-month `role="dialog"`) and `shell-user-menu`
  (`align="end"` near the viewport edge).
- **An absolutely-positioned overlay cannot escape a clipping ancestor.**
  `.sq-shell__main` is `overflow-y: auto`, so every popover inside the shell must
  portal out. Worth remembering before reaching for `z-index` on the next one.
- **`trapFocus` now moves focus into the panel**, so `date-picker` and
  `date-range-picker` gain initial focus on their first control. Correct for a
  trapped dialog, but a behaviour change to two shipped controls.
- **CSS anchor positioning would delete `MenuSurface.place()` entirely** and with
  it the WEB-012 DOM-write conflict. Not yet safe across the browsers this
  platform targets; revisit.
- **A `role="menu"` needs arrow-key navigation to meet APG.** The planning create
  menu traps focus and closes on Escape, but its items are reached with Tab.
- **A hover rule at equal specificity silently beats a variant.** `.root:hover`
  repainted `border-color` and killed `Card`'s AI accent because both selectors
  score `(0,2,0)` and `:hover` came later. Any future `Card` variant that sets a
  border must restate it under `:hover`, or the variant disappears exactly when
  the user points at it.
- **A nullable count must not mean two things.** `PlanningQuickAction.count` used
  `null` for both "this action has no count" and "the count failed to read", so
  two available actions rendered "Unavailable" (T-022). Any future optional
  figure needs the two states separated at the type.
- **"Needs Planning" and "Expiring Windows" need governed definitions.** A
  factory with no visit in the inspection year, and a day threshold before window
  end. Both render *Not configured* on `/planning` until a value is ruled.
- **"Assign unassigned visits" needs an `unassigned` planning filter.**
  `PlanningListFilters` has `inspectorId`, not "has no assignment"; a PostgREST
  "not exists" over an embedded resource could not be verified without a
  database. The quick action stays out until the filter exists.
- **The planning AI advisory is generated on demand, not on load.** A Gemini call
  per page render would be slow and costly. If the product wants it
  pre-generated, that is a scheduled job writing `ai_suggestions` and the panel
  reading the latest row — not a provider call in the render path.
- **Recommendations rank by `factories.risk_score` alone**, so a factory already
  covered by a published upcoming visit can still appear. Excluding those needs a
  "has an open visit in window" predicate worth building properly.
- **A skeleton for a part-migrated screen must be read from the CSS, not the
  JSX.** `/planning` still gets `.sq-planning-heading` (one row, `space-between`)
  and `.grid-toolbar` (a bordered bar, actions from the start edge) from the
  frozen sheets — both lay out differently from how the component tree reads,
  and T-021e's first cut mirrored the tree and got both wrong. `/planning/bulk`,
  `/reviews` and `/field` are in the same position.
- **There is no button-width token.** A skeleton bone standing in for a control
  has to borrow a spacing token, because every `Skeleton` width is a percentage
  of its container and percentages scale controls with the viewport. If more
  skeletons mirror action rows, a real control-width token is the fix.
- **Every remaining `RouteLoading` consumer is an un-mirrored loading state.**
  `/dashboard`, `/factories`, `/visits` and `/planning` now have skeletons that
  match their layout; 10+ admin routes still flash a centred glyph inside a
  nested `<main>` and re-lay-out on hydration. One per admin migration.
- **Calendar-period date presets do not exist.** `DateRangePreset` only
  expresses "N days from today", so "this month / quarter / year" cannot be
  built from it — the shell's old labels claiming otherwise were removed rather
  than kept as a lie (T-021d). Reintroducing them needs month-boundary maths in
  the primitive **and** a ruling on Gregorian vs Hijri periods, which a Saudi
  ministry platform must not assume (WEB-011).
- **Two pinging pills per visit row.** Planning status and visit status both
  ping; at 100 rows that is 200 infinite animations. Compositor-only and
  reduced-motion-safe, but if the board reads as busy the answer is a rule about
  *which* pill pings — not demoting one back to plain text.
- **A type error in a shared component is a live defect, not background noise.**
  `ShellScopeControls` carried a 16-key strings contract no call site satisfied;
  it was reported as "pre-existing" across two sessions and was hiding both
  `undefined` preset labels and a missing `locale` in the topbar (T-021d).
- **WEB-000 §2 bans `/* */` but does not scope the ban to a language**, and the
  design-system CSS (`saqeel.css`, `data-table.module.css`,
  `menu-surface.module.css`) is full of rationale comments written under these
  rules. T-021c followed that convention when commenting three primitive fixes.
  **Needs an owner ruling:** exempt design-system CSS rationale explicitly, or
  strip the comments repo-wide. A rule that the codebase visibly disobeys is
  worse than either answer.
- **`DataTable` column widths are now entirely content-driven** after T-021c
  deleted `grow`. If a screen genuinely needs a fixed proportion, that is a new
  explicit rung (a numeric weight) — not a revival of `grow`.
- **`CountBadge` now has two shapes** (inline and `superscript`). A third wants a
  named `size`/`placement` scale, not another boolean.
- **The superscript badge sits inside `MenuRow`'s `.label`**, which ellipsises.
  A label long enough to truncate will clip its own count. Only short status
  labels carry counts today; a long-label select with counts would have to move
  the badge back out to a `flex: none` sibling.
- **The reassignment roster is fetched for every visible row at page load**, not
  for the selection the user actually makes. Up to ten RPC round-trips per load,
  and because `list_available_reassignment_inspectors` is all-or-nothing per
  100-visit chunk, one out-of-scope visit anywhere on the page denies the whole
  roster. Fetching per selection (a server action on selection change) would be
  both cheaper and more precise. T-021a made the denial honest; it did not make
  it unnecessary.
- **RLS read scope is wider than `planning_closure_factory_in_scope`.** A visit
  can be readable on the board but outside reassign scope. Any future bulk verb
  gated by a closure-scope RPC will hit the same asymmetry — surface it as a
  state, never as an empty control.
- ~~**There is no datetime primitive.**~~ **WRONG — corrected 2026-08-10 (T-046).**
  `DateRangePicker` accepts `withTime`, `timeStep` and `timeLabels` and emits
  `YYYY-MM-DDTHH:mm` — the `datetime-local` shape. It is already in production in
  `visit-configuration` and `visit-bulk-actions`. Any remaining native
  `datetime-local` that expresses a **window** maps straight onto it. A
  single date **and** time (not a range) still has no primitive; nothing on the
  board needs one today.
- **`--sqx-control-accent` does not exist**, so native checkboxes cannot be
  tinted to brand without inventing a token. Left on the UA default. A real
  `checkbox`/`switch` primitive removes the need.
- **`rowSelect()` in `lib/planning/visit-list.ts` never selects `factory_id`
  — now PROVEN, not suspected (T-042, observed at runtime).** The narrowing
  boundary threw `planning.visit_list[0].factory_id expected a string, received
  nothing` on first page load. `factory_id` is `uuid not null` in the schema and
  the `Joined` type declared it as `string`, but the projection at
  `visit-list.ts:230` omits it, so `fixtureFactoryIds.has(undefined)` has always
  returned false and `readVisibleRows`' fixture filter has **never removed a
  single row**.

  **The counts path does not have this bug** — `readFixtureCount` selects
  `factory_id` explicitly and subtracts fixtures correctly. So tab badges and
  totals exclude fixture factories while the rows beside them do not. That
  asymmetry is very likely behind the "honest non-empty total alongside zero
  displayed rows" defect the retry logic in that file was written to paper over.

  T-042 made the type honest (`factory_id: string | null`, filter skips rows
  whose id is unknown) — **behaviour is byte-identical to before**. The real fix
  is adding `factory_id` to `rowSelect()`, which makes rows and counts agree and
  **will remove fixture rows from `/planning` for the first time**. Still needs
  its own task and a visual regression pass, now with the evidence attached.
- **The factory-name sort was dropped from Visit Management.** The shared sort
  whitelist has no embedded-column sort, and PostgREST parent-ordering on a
  to-one embed could not be verified without a database. Either add it to
  `visit-list.ts` with a real DB to test against, or accept Planning's sort
  vocabulary everywhere.
- **`SegmentedControl` renders no ARIA role when its items are links** (it is a
  `radiogroup` only when it holds buttons). `ai-user-journey.spec.ts` asserts a
  `role="group"` around the visit view switcher. Either the spec updates, or the
  primitive gains a `group` role for the navigating variant — a design-system
  decision, not a screen one.
- **`DataTable` has no sortable-header contract.** Sorting is a `Select` in the
  filter panel. The moment a second screen wants column-header sorting, that is
  a primitive change.

- **`highRisk` has no non-colour way to signal "attention required".** The
  legacy `[data-tone="critical"] strong { color: … }` tint was dropped by T-020b
  as colour-alone signalling. Either a governed label exists for it, or the
  figure stays plain. Product question.
- **Licence selection is a toggle-button list, not an APG radiogroup.** Arrow
  keys do not move between licences; Tab does. Pre-existing behaviour, preserved.
- **`FactoryWorkspace` is a candidate primitive.** Promote it out of
  `sections/factories/` the moment a second screen wants the same three-pane
  shape — not before (Rule of Two, WEB-002 §9).
- **`e2e/factory360-provenance-contract.spec.ts` asserts against raw source
  text.** It survived T-020b's refactor as much by luck as by design; any future
  move of the provenance ternary breaks it. It should assert behaviour.
- **`Field` + `SaqeelSelect` produce an orphan `<label>`.** `Field` renders a
  visible `<label>` with no `for`, because `SaqeelSelect` exposes no id. The
  accessible name is still correct — the select self-labels via `aria-label` —
  but `jsx-a11y/label-has-associated-control` will flag every use once T-000
  lands. Fixing it inside `SaqeelSelect` fixes `operations-scope-filter` and
  `factories-scope-bar` together.
- **`gate:one-stylesheet`** — fail CI on any new `.module.css` under
  `apps/web/src`, on any `--sqx-*` or `.sqx-*` declaration outside
  `saqeel.css`, and on any `dir()` / `[dir]` rule outside the two direction rules
  in `saqeel.css`. Belongs with T-000.
- **`gate:one-prefix`** — the legacy sheets own 804 `.sq-*` class hits and seven
  live `--sq-nav-*` / `--sq-map-*` custom properties. Once T-032 clears them, a
  gate should stop `--sq-` coming back so a future rename to the shorter prefix
  stays possible.
- **`@layer` the legacy sheets.** `saqeel-runtime.css`, `saqeel-components.css`
  and `v2-components.css` are unlayered, so they outrank everything in
  `saqeel.css` regardless of order. Wrapping them in a `legacy` layer declared
  *before* `saqeel.*` would invert that and let migrated screens win without
  specificity games. Cheap, high leverage, but it changes cascade behaviour app
  wide — it needs its own task and its own visual regression pass.
- **Base-layer reset scope.** `sqx.base` resets margins on `h5 h6 figure
  blockquote dl dd ol ul` and sets `img/svg/video { display: block }` globally.
  Legacy screens zero those per class rather than globally, so the reset is new
  behaviour for any element the legacy sheets miss. Verified against the built
  app; if a screen is ever found to depend on a UA default, the fix is that
  screen, not the reset.
- **Chart series 7 and 8** are `--sqx-neon-steel-deep` / `--sqx-neon-sky`,
  primitives added to satisfy the eight-series chart scale. They are the only
  primitives in `saqeel.css` not named in the T-002 brief.
- **`--sqx-ease-linear`** exists solely so seamless looping gradients do not
  have to write the `linear` keyword inline. Delete it if a future motion pass
  removes the looping gradients.
- **`ThemeScript` cannot see `prefers-color-scheme`.** WEB-002/T-004 asked for
  resolution order stored → `prefers-color-scheme` → dark, but `ThemeScript.tsx`
  was outside T-004's editable file list. The toggle works around it by writing
  a resolved value to the `saqeel-theme` key that `ThemeScript` already reads, so
  first paint never flashes. A proper fix edits `ThemeScript` to read the media
  query itself, and must keep `ThemeChannelSync` and the toggle in agreement —
  all three encode the same fallback today.
- **Three preserved topbar controls have no home in the shell brief.** Locale
  toggle, date/region scope and the ⌘K admin palette exist in `ShellClient` and
  would have been deleted by building only the files T-004 listed. They were
  rebuilt as islands under `shell-topbar/`. If the product wants them gone, that
  is a product decision and its own task — not a side effect of a refactor.
- **Shell island count is 8, not the brief's 5.** See the T-004 record. Getting
  to 5 means deleting the three controls above.
- **`e2e/ui-compliance-runtime.spec.ts` pins `main#main-content`.** T-004's brief
  asked for `<main id="main">`; the id was kept as `main-content` so three
  existing assertions stay green. Renaming it is a cross-cutting change that
  needs the e2e file in scope.
- **`a { color: var(--text-link) }` in `saqeel-components.css:15` is unlayered
  and beats every cascade layer.** It repainted every anchor in the new shell
  legacy-blue. `.sqx-shell*` had to be moved **out** of `@layer sqx.components`
  to compete on specificity. This is the first time the "legacy outranks
  `saqeel.css`" property caused a defect rather than preventing one, and it will
  recur on every migrated screen that renders a link. Two clean fixes, both
  already parked: delete that one declaration from the frozen sheet, or wrap the
  legacy sheets in a `legacy` layer declared before `sqx.*`. Either lets the
  shell move back inside the layer. **Until then, check any new `.sqx-*` rule
  that sets `color` on an anchor.**
- **`--sqx-surface-accent` is invisible on `--sqx-gradient-chrome`.** In dark it
  is `#0A2416` and the chrome's top stop is `#0A2A18` — 1.02:1. T-004's first
  cut used it for the active nav fill and the indicator effectively did not
  exist. Anything placed on the chrome gradient must have its separation
  measured against **all three** stops, not against `--sqx-surface-default`.
  Fixed by `--sqx-nav-active-bg` / `--sqx-nav-group-bg`; the same trap is waiting
  for any future chrome element.
- **`.sq-pagehead` is `position: sticky` inside the scrolling `main`.** The new
  shell had to reproduce that scroll model exactly (`.sqx-shell__main` owns
  `overflow-y`, topbar is a flex sibling above it, not sticky) or every one of
  the 55 pages still using the legacy `Shell` frame would have had two elements
  stuck to the viewport top. Keep this in mind for T-007.

---

## BLOCKED

- ~~**`app/(app)/dashboard` imports a folder that no longer exists.**~~
  **RESOLVED / was already fixed (verified 2026-08-08).** `page.tsx` and
  `loading.tsx` now import `@/components/sections/dashboard/dashboard-sections/…`
  and `…/dashboard-skeleton/…` — the correct paths. A static import resolver
  over the migrated surface (dashboard, operations, factories, shell) checked
  371 edges for path and named-export correctness and found **zero** broken
  imports. Note: this is not a full-repo `tsc` (the SWC blocker below prevents
  that); it covers the migrated surface and the legacy files in its route
  folders. See the 2026-08-08 comments/`let` sweep record.

- **What actually blocks verification is a seeded account, not the compiler
  (observed 2026-08-10, T-046 slice 1b).** `next dev` started in 19.8 s,
  compiled `/planning/bulk` in 4.2 s across 1424 modules with no warnings, and
  served `/login` with a 200. `GET /planning/bulk` returns 307 to `/en/login`
  because `planning_access_class` answers `permission denied` for an anonymous
  caller — so the screen still cannot be rendered, axe still cannot run, and the
  WEB-003 §10 checklist still cannot be ticked. **Every "static verification
  only" status since T-000 rests on the entry below; re-test it before repeating
  it.** Production numbers remain a measurement request either way (WEB-005 §8).

- ~~**The app will not run on this workstation.**~~ **DID NOT REPRODUCE
  2026-08-10 — see above.** Windows Application Control was blocking Next.js's
  native compiler:

  ```
  ⚠ Attempted to load @next/swc-win32-x64-msvc, but an error occurred:
    An Application Control policy has blocked this file.
    apps\web\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node
  ```

  `next dev` starts, then serves nothing. `next build` hangs. Consequences: no
  browser verification, no e2e, no axe, no Lighthouse, no bundle numbers. Every
  task is limited to static verification, and WEB-006 §3's "exercised by hand in
  the running dev server" and WEB-003 §10's manual checklist cannot be satisfied
  by anyone working on this machine. Not a code problem — it needs the binary
  allowlisted, or a WASM-compiler fallback accepted for local work. **This blocks
  the Definition of Done for every task from T-000 onward.**

---

## The 48-hour demonstration path

If the objective is to show the manager what this becomes, the shortest
credible story is **T-000 → T-001 → T-002 → T-003 → T-010 → T-012**:

> a rulebook enforced by CI · a design system you can browse · a shell that
> ships a fraction of the JavaScript · and one flagship screen rebuilt on it,
> with before-and-after numbers and an accessibility report.

That is a system with evidence, not a repainted page.
