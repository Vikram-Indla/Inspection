# 2026-08-12 · T-082 — `/visits/[id]` write surface: layout, upload preview, duplicate copy

`task: T-082` · `status: done (Arabic/RTL render owed)` · `duration: ~1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-009, WEB-011, WEB-012, WEB-013, WEB-014`

---

## Goal

Stop the Notes and Attachments fields collapsing to intrinsic width, give the
uploader the row it was leaving empty, preview a chosen image, and say the
permission fact once instead of three times — without moving any part of the
write path.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/file-upload/file-upload.tsx` | rebuilt (grid, blob preview, comments trimmed to interface TSDoc) | 98 → 141 |
| `components/saqeel/file-upload/file-upload.module.css` | rebuilt (`.fields` grid, `.preview`/`.thumb`/`.image`/`.meta`, 3 comments deleted) | 75 → 119 |
| `app/(app)/visits/[id]/action-bar.module.css` | edited (`align-items` fix, `.formActions`, prose cap, 3 comments deleted) | 70 → 75 |
| `app/(app)/visits/[id]/Attachments.tsx` | edited (card description, actions row, string type) | 127 → 129 |
| `app/(app)/visits/[id]/NotesEditor.tsx` | edited (actions row, string type) | 59 → 60 |
| `features/visits/detail/strings.ts` | edited (2 keys dropped, 2 added) | 74 → 73 |
| `i18n/locales/en/visits.json` | edited (`att`, `notes`) | — |
| `i18n/locales/ar/visits.json` | edited (`att`, `notes`) | — |

## Decisions

**`align-items` on a column flex container is a cross-axis declaration, and it
is never the way to size one child.** T-081 added `align-items: flex-start` to
`.stackedForm`/`.uploadForm` so the submit button would not stretch. That is
what it did — and it also shrank every field above it to intrinsic width, which
is the defect the owner reported. The container is now `stretch`; the button
sits in its own `.formActions` row and keeps its natural width because it is
`inline-flex`. **Fix the child that needed the exception, not the parent that
sizes everything.**

**`repeat(auto-fit, minmax(min(18rem, 100%), 1fr))` — the `min()` is load-bearing.**
Plain `minmax(18rem, 1fr)` gives a 288px track floor that a 183px container
cannot honour, so the zone overflowed its own grid at narrow widths. Nothing in
the source looks wrong and no gate sees it; only a measured `offsetWidth`
comparison did. `min(…, 100%)` keeps the auto-fit behaviour and clamps the floor
to the container.

**`auto-fit` is what makes the empty state correct, so no media query exists.**
With nothing chosen there is one grid item, the surplus track collapses to 0 and
the drop zone spans the row — which is precisely the "orphan with dead space
beside it" the owner objected to. With a file chosen the preview claims column
two and both are equal. One declaration expresses both states.

**The object URL is revoked by the image that consumed it, so WEB-004 §3 was
never opened.** The URL is created in the change handler (not in render) and
revoked in `<img onLoad>` once the bitmap has decoded; the element is keyed by
the URL so a new file mounts a new `<img>`. `adopt()` also revokes any prior URL
before replacing it, covering a selection changed before the first load fired.
**A disposal that a DOM event can express is not a reason to add an effect.**

**The name lives in the state line, not in the preview panel.** The panel carries
the thumbnail and the MIME type; the always-mounted `live="status"` line below
the grid carries `Selected: {name}`. Putting the name in the panel would have
read better but would have made the only live region one that mounts together
with its content — unreliable to announce — or duplicated the filename to fix
that. This deviates from the mockup approved in the critique, and the owner was
told. The line carries `dir="auto"`: a filename is user data and mixes scripts
(T-065's lesson).

**`aria-describedby` is conditional, the live region is not.** The region is
always in the DOM so a selection is announced; `aria-describedby` only points at
it once it has content, so nothing describes the input with an empty string.

**`Button.busy` keeps its label by documented design, which made two translated
keys dead on arrival.** `notes.saving` and `att.uploading` were defined in both
locales, mapped in `strings.ts`, declared on two prop types, and rendered by
nothing — the primitive's own TSDoc says the label "stays put, so the button does
not resize or change wording mid-action". Deleted rather than wired: the
primitive is right. **Check what a primitive already promises before translating
a string for it.**

**One permission fact, one place.** *Planner or operations only* was rendering
three times across two adjacent cards — the Notes hint, the `fileLabel`
parenthetical, and inside the attachments empty state. `Attachments` now states
it once as the `CardHeader description` it was the only card of the pair to be
missing; `fileLabel` is a field label again and `empty` is an empty state again.
`noFileChosen` deleted outright: a resting line reading "No file chosen yet."
directly under a zone reading "Drag a file here / or browse your device" is the
zone's own text restated.

## Owner review round 2 — five follow-ups

The owner reviewed the rendered result and asked for five things. Two of them
exposed defects in what I had just written.

**1 · The textarea must be full width.** The `--sqx-prose-max` cap was my call for
readability; it is overridden. `.stackedForm` lost `max-inline-size` and the field
now measures **1095px = its form = the card's content box** on the live route.

**2 · "Do we have a reusable textarea?" — yes, and that is the finding.**
`components/saqeel/textarea` exists, is sound, and has **4 consumers**. Another
**~50 multi-line fields are hand-rolled `<textarea>`** on legacy classes:
`className="input"` (~25, all `field/*`), `sq-textarea` (~8), `sq-input` (~3), plus
local module classes in `sections/approvals/*` and `sections/regulations/*`. They
miss the new focus treatment, keep the browser's `resize: both`, and carry their
own font declarations. **Reported and parked, not swept** — each call site also
needs `Field`, i18n and a state review, so it belongs with each screen's own
migration, not in a 50-file blind pass.

**3 · Focus is a border colour now, not a ring.** `outline: none` +
`border-color: var(--sqx-border-focus)` on `TextInput`, `Textarea`, the
`FileUpload` zone and this route's two native control resets.

**4 · The preview was redesigned and 5 · a chosen file can be discarded** — below.

### The `18rem` track floor was mine, and it was off-pattern

WEB-000 §7 bans length literals outside `saqeel.css`. Sweeping every migrated
saqeel module shows rem literals appear in **media-query breakpoints only** —
never as a size, never as a grid track. My
`repeat(auto-fit, minmax(min(18rem, 100%), 1fr))` was the only one of its kind in
the design system.

Replaced with `grid-template-columns: minmax(0, 1fr)` plus
`@media (min-width: 48rem) { .fields[data-filled] { …1fr 1fr } }`, matching
`timeline` and `date-range-picker`. **Identical geometry at all five widths**, one
literal, in the one place this codebase puts them. The `data-filled` flag is
render-driven state, not a DOM write.

### `object-fit: cover` does not bound an image whose parent has no definite height

The first cut of the redesigned preview grew to **780×487** and dragged the drop
zone to the same height — worse than the defect it replaced. `.well` was a flex
item with `flex-basis: 0` inside a grid row sized by its own content: circular, so
it resolved to the image's **intrinsic** height, and `block-size` lost to
`flex-basis` while `min-block-size: 0` changed nothing.

**The fix is to take the image out of flow** — `position: absolute; inset: 0` in a
`position: relative` well. An out-of-flow child cannot contribute to layout, so the
well's height comes only from `flex: 1` filling the row. Row is a stable **145px**
and the image fills its cell edge to edge at every width.

### Focus: what changed, what it costs, and what it breaks

`Select` **already** expressed focus as `outline: none` + `border-color`, so the
design system disagreed with itself before this task; the three input primitives
now match it.

`[aria-invalid]` moved **above** `:focus-visible` in both stylesheets. Previously
the two states set different properties (outline vs border-color) and could not
conflict; with both on `border-color` they can, and a focused invalid field must
still show focus (WCAG 2.4.7). The error stays conveyed by `aria-invalid`, the
error text, and the border the moment focus leaves.

**This contradicts WEB-009 §5, which mandates an outline ring.** Per WEB-000 §0 a
rule conflict is written down, never silently broken — raised in the tracker's
PARKED section with proposed wording. **Until §5 is amended the rulebook and the
design system disagree, and a future task will "fix" one of them at random.**

### Hover beat focus, and it was specificity, not order

Owner-reported after round 2: a focused input showed no focus colour while the
pointer was over it. **This was a regression I introduced.**

```
.root:hover:not(:disabled):not([readonly])   (0,4,0)
.root[aria-invalid]                          (0,2,0)
.root:focus-visible                          (0,2,0)
```

Hover carries **two extra `:not()`s**, so it outranks both — and no amount of
reordering fixes that, because specificity is decided before source order. It was
latent before this task: focus used to set `outline` while hover set
`border-color`, two different properties that could not collide, so only the
invalid-and-hovered case was wrong and nobody saw it. Moving focus onto
`border-color` made the pre-existing conflict visible.

**The fix is to narrow the hover rule, not to inflate the others**:
`:not(:focus-visible):not([aria-invalid])`. Hover styling now means "hovered and
nothing more important is true", which is what it always meant.

**Same bug, second instance, in the same file.** `.zone:hover` was declared
*before* `.zone[data-filled]` at equal specificity, so once a file was chosen the
zone stopped responding to hover at all — feedback lost in exactly the state where
a user wants to swap the file. Reordered to base → `[data-filled]` → `:hover` →
`[data-dragging]` → `:focus-within`.

Verified by state matrix rather than by inspection — 16 combinations of
focus × hover × invalid on `TextInput` and `Textarea`, and 8 of
filled × idle/hover/dragging/focus on the zone. All correct. **Two of the eight
zone rows would have failed before the reorder.**

`FileUpload` has **no invalid state** — the matrix surfaced it. Not added here: it
needs an API and a token decision, and nothing asks for it yet.

### Discarding a chosen file

`IconButton dismiss` in the preview bar rebuilds the `FileList` through a
`DataTransfer` — the same sanctioned library handoff T-081 established for the drop
path, and the only way to write a file input. Partial removal keeps the right file;
a full clear leaves `files.length === 0` **and** `value === ""`, so a stale file
cannot be submitted. Focus returns to the input, which is a read/`focus()`
operation and not a mutation (WEB-012).

### Two verification traps worth keeping

- **`getComputedStyle` returns a live object, not a snapshot.** Reading `focused`,
  then blurring and reading `resting` compares the value to itself and always
  reports "no change". My first focus test passed a false negative for exactly this
  reason. Copy the strings out before changing state.
- **A colour read immediately after focus catches a mid-transition value.** The
  zone animates `border-color`, so the first reading was an interpolated
  `rgba(233, 226, 244, .565)`. Inject `*{transition:none !important}` before
  measuring.
- **The Browser pane cannot validate focus at all.** `document.hasFocus()` is
  `false` there, so `:focus` never applies for styling no matter what
  `document.activeElement` reports — and `matches(':focus-within')` still returns
  `true`, which makes it look like a CSS bug. Focus was verified in headless Chrome
  where the document is focused.

## Inventory taken before writing code

- **State:** `names: string[]` → `chosen: Chosen[]` (one state, one fact: what
  the input currently holds). `dragging` unchanged. No new rung; nothing moved
  down the ladder because nothing could — the object URL and the drag state are
  genuinely ephemeral and local. **No `useEffect` added or present.**
- **Literals:** none introduced. The thumbnail is sized on `--sqx-control-h-lg`,
  matching the existing `.badge` precedent of sizing a square on a control
  height, so no token gap was opened and no work stopped.
- **`<svg>`:** none. The non-image preview uses the registry's `forms` icon.
- **Accessibility failures found in the existing markup:** `aria-describedby`
  pointed at an element whose content was the string "No file chosen yet.",
  i.e. it described the input as having nothing — noise, not a description. The
  drop zone had no reflow ceiling and would overflow below ~300px once the grid
  landed. Both fixed.
- **Copy:** 3 duplicate statements of one permission fact, 2 dead keys, 1
  redundant resting line — all listed in the critique before the first edit.

## Numbers

```
Route: /visits/[id]

Notes textarea       178px (fixed, cols=20) → full width of its card
                       320 / 768 / 1024 / 1440 / 1600  →  288 / 736 / 992 / 1408 / 1568
                       live route @1440: textarea 1095 = form 1095 = card box
Upload drop zone     229px orphan → full row when empty (same five widths)
  with a file chosen                → 364|364 · 492|492 · 700|700 · 780|780
                       live route @1440: zone 544x139 = preview 544x139
Preview image        44px chip in a 780px cell → fills its cell, 778x96, object-fit cover
  first cut of the redesign        → 780x487 and dragged the zone with it (fixed)
Row height, chosen   145px, stable at every width
Dead space beside the uploader at 1600px:  ~1340px → 0
320px reflow         zone 288 > container 183 (overflow) → 288 = 288, page overflow 0
Focus indicator      2px offset ring → border rgba(255,255,255,.16) → rgb(180,154,216)
                       border width unchanged · size shift 0x0 · outline-style none
                       contrast 7.13:1 dark · 11.5:1 light  (1.4.11 needs 3:1)
Remove control       32x32 (2.5.8 needs 24x24) · clears to files=0 and value=""
i18n keys (att)      18 → 19   (2 deleted, 3 added)   parity asserted
i18n keys (notes)     6 → 5    (1 deleted)            parity asserted
useEffect added       0
client islands        unchanged (3)
length literals       1, a media-query breakpoint (the codebase's only pattern)
```

Geometry measured in Chrome (system channel) against the real CSS modules at
320/768/1024/1440/1600, and confirmed on the running route for the 280px case.
**Not measured:** first-load JS, LCP, INP, CLS — those need a production build,
which is the human's to run (WEB-005 §8). This diff adds no dependency and no
client island; the only new runtime work is one `createObjectURL` per selection.

## Accessibility

- **axe:** not run — owed.
- Manual checklist (WEB-003 §10):
  - **keyboard** — unchanged by construction: the control is still the native
    `<input type="file">` inside a `<label htmlFor>`, focus still lands on the
    input and the ring is still drawn on the zone by `:focus-within`.
  - **screen reader** — not run with a real AT. Asserted in the DOM: the live
    region is always mounted, carries `role="status"`, and receives
    `Selected: {name}`; `aria-describedby` resolves to it only when populated.
  - **200% zoom** — not run.
  - **320 px** — verified. Zone width equals its grid container, page overflow 0.
    Also verified at 280px on the live route, below the requirement.
  - **Arabic/RTL** — **owed, and blocked outside this diff.** `/ar/visits/[id]`
    and the shell's `ع` toggle both left `document.documentElement.lang === "en"`
    and `dir="ltr"`, so the Arabic screen could not be rendered to look at. What
    *was* asserted statically: both CSS modules contain zero `left`/`right`
    declarations and zero `[dir="rtl"]` overrides — logical properties only
    (WEB-002 §6) — and en/ar key parity for `att` and `notes` is exact with no
    Latin-only Arabic value.
  - **dark** — the route renders dark and was verified there. Light theme owed.
  - **reduced motion** — the zone's transition is still disabled under
    `prefers-reduced-motion: reduce`; no new animation added.
  - **greyscale** — the filled state remains a border-style change
    (dashed → solid) plus an icon swap, not colour alone.
- **`alt`:** the thumbnail carries `previewAlt` with `{name}` interpolated —
  verified rendering as `Preview of site-photo-الموقع.png`. No `alt=""`.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **the script does not exist** (already PARKED since T-053)
- [x] `npm run gates:typography` — PASSED, 863 known, **none new**
- [ ] `npm run gates` — fails on `check:design-system-v5`, **78 findings, all
      pre-existing and none in a file this task touched** (verified by filtering
      the gate output against the changed-file list). Already PARKED since T-057.
- [ ] `npm run test:e2e` — not run. `cd-027-visit-detail.spec.ts` pins none of
      this copy and none of these selectors, checked before editing.
- [ ] Definition of Done (WEB-006 §5) — not fully ticked: axe, Arabic/RTL,
      200% zoom, light theme and e2e are owed.

**Write-path integrity, asserted on the live route rather than reasoned about:**
a scripted `DataTransfer` selection left `input.files.length === 1`, the image
rendered from a `blob:` URL, and that URL failed to `fetch` afterwards — so the
file still submits, the preview is real, and nothing leaks. No server action
signature, form `name`, hidden identity field, `required` flag or guard changed.

## Retirement

Nothing marked, nothing deleted. `FileUpload` gained behaviour rather than a
successor; its only consumer is `Attachments`.

## Parked

- **`visits/[id]/actions.ts` renders hardcoded English to users in both
  locales**, including the engineering identifier `(M02-042, audited)`. Raised in
  the critique, **owner ruled it a task of its own**. Copied to the tracker's
  PARKED section with the full finding.
- **After a successful upload the preview and the input both keep the file**,
  so the just-uploaded item shows in the panel and in the table at once. The old
  `Selected:` line had the same behaviour, so this is inherited, not introduced.
  Clearing it means writing `input.value = ""`, which wants a WEB-012 ruling
  first.
- **`FileUpload` has no `accept` and the action has no size ceiling** while
  `uploadVisitAttachment` does `await file.arrayBuffer()` server-side. Raised as
  P1-6 in the critique; not a layout change, so not taken here.

## Blocked / open questions

- **The locale toggle does not switch the app.** Neither the `/ar/` path prefix
  nor the shell's `ع` control changed `lang`/`dir`. Every route's Arabic review
  depends on this, so it is worth its own task before the next screen claims an
  Arabic pass.
- The Browser pane stopped compositing repeatedly (all rects 0), the same failure
  T-061 and T-072 recorded. Geometry was taken in headless Chrome against the
  real CSS instead. **Playwright's browsers are not installed on this
  workstation** (`npx playwright install` never run) — the system Chrome channel
  was used. That also means `npm run test:e2e` cannot run here at all.

## Proposed commit

```
fix(visits): stop the visit write surface collapsing to intrinsic width
```

## Next

Give the Arabic screen a render — the locale toggle defect above is the blocker
for that and for every remaining route's WEB-011 pass.
