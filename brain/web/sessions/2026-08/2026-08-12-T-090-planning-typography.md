# 2026-08-12 · T-090 — `/planning` typography, 45 → 0

`task: T-090` · `status: done (the visit drawer — 10 of the 45 — never rendered)` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014 §4.1, §8`

---

## Goal

Clear the largest remaining pocket in the planning family: 45 route-owned
typography declarations across `components/planning/`.

## What changed

**45 declarations across 11 modules → 0.** `/planning`'s only remaining
violation is `NotificationBell.tsx:270`, the shell.

| Module | Removed | Shape |
| --- | --- | --- |
| `planning-visit-table/visit-drawer` | 10 | h2, p, h3 ×5, dt, dd, a |
| `saved-views-menu` | 7 | strong, a, p, label, **input** |
| `create-visit-section` | 5 | **summary**, 2 spans |
| `planning-visit-table` | 4 | th, td, **button** |
| `planning-assistant` | 4 | h2 + 2 spans |
| `planning-screen` | 3 | span, a |
| `planning-visit-table/bulk-bar` | 3 | strong, span |
| `planning-toolbar` | 3 | **input**, **button** |
| `planning-denied` | 3 | h1, p |
| `planning-header` | 2 | h1 |
| `header-actions` | 1 | span |

## Decisions

**Four native controls got `font: inherit`, not deletion — and only four.**
`<input>`, `<button>`, `<select>` and `<textarea>` do **not** inherit `font`;
deleting a declaration from one makes it render in the UA's Arial (the T-064
defect). Two `<input>` (`planning-toolbar`, `saved-views-menu`) and two
`<button>` (`.reference`, `.moreTrigger`) took `font: inherit`.

**`<a>`, `<label>`, `<summary>`, `<th>` and `<td>` are *not* in that set** and
were checked rather than assumed — they inherit `font` normally, so their classes
could simply lose the declaration. Treating them as controls would have added
four unnecessary `font: inherit` lines; treating the four real controls as
ordinary elements would have shipped Arial.

**The primitives take no `className`, and that shaped every edit.** `Text` and
`Heading` expose no class hook, so a class mixing layout with typography cannot
simply become a primitive. The rule applied throughout:

> **The element keeps its layout class; the primitive goes inside it as a span.**

That is why `.pagerLink`, `.trigger`, `.fieldValue`, `.status`, `.advisory`,
`.empty`, `.fieldLabel` and both `<th>`/`<button>` cases still have a class — it
now carries only layout — while purely typographic classes (`.count`, `.note`,
`.menuTitle`, `.itemTitle`, `.itemDesc`, `.pagerSummary`, `.title` ×3,
`.groupTitle`, `.fieldLabel`, `.subtitle`, `.exportNote`) were **deleted
outright**.

**`--sqx-accent-ai` is not one of the nine tones, so the colour moved rather than
changed.** `planning-assistant`'s heading is `--sqx-accent-ai` (`#A78BFA`), which
is neither `--sqx-text-accent` nor any other tone. Mapping it to `tone="accent"`
would have **changed a colour during a typography migration** — precisely what
T-065 forbids. Instead the heading is `<Heading tone="inherit">` wrapping a
`.headingInk` span that keeps the colour and the icon's flex layout. Verified
live: `rgb(167, 139, 250)`, byte-identical to the token.

**Table cells inherit; column headers do not.** `.cell` (`<td>`) holds mixed
content — status pills, links, plain text — so it keeps colour only and inherits
body, the precedent T-065 set for mixed-content containers. `.head` (`<th>`) is
pure text, so each column label became `Text role="label"`. **The first `<th>`
has no label** (it holds the select-all checkbox) and correctly got no primitive.

**`planning-denied`'s title is `heading`, not `display`.** It is an `<h1>` that
was deliberately set to 20px, so it became `Heading level={1} visual="heading"` —
the level and the visual genuinely diverge, which is what `visual` exists for.
The route's one `display` remains `planning-header`'s `<h1>` (WEB-014 §9.3).

## Inventory taken before writing code

- 45 declarations, 11 modules, each mapped **selector → rendered element** by
  script before any edit — that map is what identified the four controls.
- Two classes were not found by the naive map and were resolved by hand:
  `.exportNote` lives in `export-button.tsx`, `.moreTrigger` in
  `more-filters.tsx` (sibling files, not the directory's namesake component).
- Every class checked for other consumers before deletion; every `styles.x`
  re-checked afterwards against **its own** stylesheet.
- No copy, no `<svg>`, no state, no `let`, no literal values changed.

## Numbers

```
/planning        46 → 1 violations   (route-owned 45 → 0)
repo baseline   813 → 768
classes deleted  13
```

Rendered and measured on the live route as a seeded Planner:

```
distinct sizes   30 · 28 · 20 · 14 · 12     (5, all on-scale, 0 off-scale)
typefaces        1 (plexArabic)

h1  (page title)      30px / 34.5px / 700   = display   (30 × 1.15)
h2  (assistant)       20px / 26px   / 600   = heading   (20 × 1.30), colour #A78BFA preserved
th  (column label)    12px / 16.8px / 600   = label     (12 × 1.40)
summary (Create)      12px / 16.8px / 600   = label
a   (pager Next)      12px / 16.8px / 600   = label
button (V-2151)       14px / 22.4px / 600   = bodyStrong — font: inherit worked, no Arial
```

## Accessibility

- No heading level, `id`, `aria-label`, `aria-labelledby` or landmark changed.
- `<legend>`/`<label>` associations untouched; `.fieldLabel`'s `htmlFor` intact.
- The select-all `<th>` keeps its empty label and its `aria-label`-bearing input.
- No text got smaller; the four controls kept their sizes.
- axe not re-run — no semantics changed, only which element carries the font.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist (T-083)
- [x] `npm run gates:typography` — 45 removed, re-baselined 813 → 768
- [x] Zero typography declarations left in `components/planning/` — asserted by grep
- [x] No orphaned `styles.x`, no unused class — **after fixing the check itself**
      (see below)
- [x] Rendered and measured on the live route, six element classes probed
- [ ] **The visit drawer never rendered — 10 of the 45.** It opens on a row
      click; `drawerCount` was 0 in the measured DOM. Its `h2`, `subtitle`, five
      `groupTitle`s, `dt`/`dd` and `openLink` are **unverified**.
- [ ] `npm run test:e2e` — not run; needs a production build

## Three mistakes worth recording

1. **An unbalanced `</span>` — T-069's exact mistake, one task after reading it.**
   Converting `<span className={styles.pagerSummary}>` to `<Text>` left the
   closing `</span>` behind. Caught by re-reading the file after the edit, not by
   the gate — **the gate reads CSS and would have stayed green on broken JSX.**
2. **`className={undefined}` on `Text`.** Written reflexively while converting a
   `<dd>`; `Text` has no such prop and the layout it needed
   (`text-align: end; overflow-wrap: anywhere`) would have been lost. Corrected to
   keep the `<dd>` and nest the primitive.
3. **A scripted bulk replace matched 0 of 7 patterns because the file is CRLF.**
   `visit-drawer.module.css` uses `\r\n`; the `\n`-joined patterns silently
   matched nothing and the script reported success on an unchanged file. **A
   zero-match bulk edit is the T-058/T-076 signal — stop and change approach**,
   which is what happened (switched to per-block edits).

## Retirement

Nothing retired. 13 CSS classes deleted with their declarations.

## Parked

1. **The visit drawer wants a measured render** — open a row on `/planning` and
   confirm the five `groupTitle`s at 16px `subheading`, the `dt`/`dd` pair at
   14px, and `openLink` at 12px `label`.
2. **`planning-visit-table` is still a hand-rolled `<table>`**, not `DataTable` —
   T-076 recorded this as the fifth instance of the same duplication. Its
   typography is now correct, but it inherits none of `DataTable`'s fixes and
   none of its future ones.
3. **`/planning/bulk` (20) and `/planning/visits` (16) are the last pockets in
   the family.** `/planning/visits` owns none of its 16 — they belong to
   `components/sections/visits/`.

## Blocked / open questions

None.

## Proposed commit

```
refactor(planning): render the planning workspace through the type primitives
```

## Next

`/planning/bulk` — 20 violations, the last substantial pocket in the family
after this one.
