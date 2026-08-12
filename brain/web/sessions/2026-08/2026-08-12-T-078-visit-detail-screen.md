# 2026-08-12 · T-078 — `/visits/[id]` read surface on SAQEEL: one history card, actions above the fold, glyphs gone (slice 3a of 3)

`task: T-078` · `status: partial (the three write components are slice 3b)` · `duration: ~2h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011`

---

## Goal

Slice 3: rebuild the visible screen on the design system, promote the management
actions above the history, and consolidate five history panels into one card with
four anchored sections (owner ruling).

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/visits/[id]/page.tsx` | composition only | **439 → 43** |
| `components/visits/visit-detail/visit-detail.tsx` | created — composition | 180 |
| `components/visits/visit-detail/visit-summary.tsx` | created | 129 |
| `components/visits/visit-detail/visit-lifecycle-ribbon.tsx` | created | 96 |
| `components/visits/visit-detail/visit-history.tsx` | created | 53 |
| `components/visits/visit-detail/visit-detail-unavailable.tsx` | created | 25 |
| `components/visits/visit-detail/visit-detail.module.css` | created | 84 |
| `features/visits/detail/ribbon.ts` | created — track view models | 77 |
| `features/visits/detail/strings.ts` | created — the three legacy string blocks | 70 |
| `features/visits/detail/view.ts` | + attachment rows, ActionBar props | 173 → 250 |
| `app/(app)/visits/[id]/DualStateRibbon.tsx` | **@retiring**, 0 importers | 97 |
| `app/(app)/visits/[id]/FocusScroll.tsx` | **@retiring**, 0 importers | 12 |
| `e2e/cd-027-visit-detail.spec.ts` | ribbon assertions re-pointed | — |

## Decisions

**The route file finally hit the cap: 546 → 43.** T-076 deliberately left it at
443 because reaching ≤40 meant extracting legacy JSX that this slice rewrites.
Doing it once, here, is what that deferral was for.

**Five history panels became one card with four anchored sections.** Checklists ·
Lifecycle · Location · Journey · Planning history were five identical-looking
panels, and the route's own comment recorded that the audit trigger *"already
records every status transition"* — so a return appeared in **both** the lifecycle
stream and the audit log, worded differently. The four genuine event streams now
share one `History` card on the `Timeline` primitive, each keeping its own
heading, its own empty sentence and its own anchor (`#lifecycle` `#location`
`#journey` `#audit`) so the ribbon's links and the spec still resolve. Checklists
is not an event stream and stayed its own card.

**The actions moved above the history — the ordering was the defect.** `ActionBar`
sat in an `<aside>` after five timelines, roughly 2,500px down, while the ribbon's
*"Allowed from here"* line told the reader what they could do. Verified in the
DOM: ribbon → **actions** → configuration → linked plan → checklists → notes →
attachments → history.

**The five glyphs are gone and the contract is intact.** `▣ ● ⬡ ◇ ◆` were
decorative `aria-hidden` spans carrying no information the label did not already
carry. The rebuilt ribbon keeps every guarantee CD-027 pins — `role="tablist"`
named *state domains*, exactly five `role="tab"`, a visible `role="tabpanel"`,
roving tabindex with Arrow/Home/End, and the 412px reflow (now a column via the
CSS module rather than a legacy global). The state moved into the tab as a
`StatusPill`, which is text-plus-shape rather than a glyph.

**A 239-line component is a layering smell, not a length problem.** The first cut
of `visit-detail.tsx` was over the 200-line soft cap. The excess was **ribbon
track construction** — view-model work reading the data layer and the messages,
not composition. Moved to `features/visits/detail/ribbon.ts`; the component fell
to 180 without deleting anything. **Split by what the code *is*, not by where the
line count lands.**

**`DualStateRibbon` and `FocusScroll` have zero importers and are `@retiring`,
not deleted.** `FocusScroll` implemented the `?focus=return` deep-link scroll; the
return reason is now a governed notice at the top of the summary, above the fold,
so nothing needs scrolling to. The spec's FND-002 assertion re-pointed to the new
ribbon plus its track builder, and gained two checks it did not have: that the
tablist and tabpanel roles exist, and that exactly five track ids are declared.

**The three write components were deliberately left on legacy markup.**
`ActionBar` (247 lines, three zones, eight forms), `Attachments` and `NotesEditor`
carry spec-pinned ids (`#visit-return-reason`, `#visit-cancel-comments`),
`role="status"`/`role="alert"` wiring and live server actions. Rebuilding them is
slice 3b. **The read surface is complete; the write surface is untouched** — a
boundary chosen so no form contract moves in the same diff as a layout change.

## Inventory taken before writing code

- **State:** the ribbon's `active` index is the only client state on the read
  surface, unchanged. **Effects:** none.
- **Literals:** none. The new module is 84 lines of `var(--sqx-*)`.
- **`<svg>`:** none. Five glyph-as-icon removed; `∅` and `…` in the error and
  loading states went with T-076's skeleton and this slice's `EmptyState`.
- **Accessibility fixed:** the duplicated `<h1>` under `?wa_route_base=planning`
  is gone (the Shell owns the heading); the five glyphs were `aria-hidden`
  decoration; every history section is a labelled `<section>` rather than a bare
  `<ul>`.

## Numbers

```
Route: /visits/[id] — read surface
route file                    439 → 43 lines   (cap 40 — met)
className uses (read surface) 187 → 6   (all CSS-module refs; 0 legacy classes)
glyph-as-icon                   5 → 0
history panels                  5 → 1 card, 4 anchored sections
actions position               last → second
files at 0 importers             0 → 2 (@retiring)
typography violations removed         37 since the baseline
```

## Accessibility

- **axe: not run.** Owed.
- Manual checklist: keyboard — **the ribbon's APG model preserved and asserted**,
  full pass owed · screen reader — owed · 200% zoom — owed · 320 px — owed ·
  **Arabic/RTL — verified in T-077, not re-checked after the restructure** ·
  **dark — verified rendering** · light — owed · reduced motion — no animation
  added · greyscale — owed
- **Fixed:** a duplicated `<h1>`; five decorative glyphs inside interactive
  controls; four history streams that were bare `<ul>`s without accessible names.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — no `lint` script exists
- [x] `npm run gates` — typography PASSED, **37 violations removed**, zero new;
      the only `visits` hit in the design-system gate is
      `planning/visits/[id]`, a different route, pre-existing
- [x] **cd-027 source assertions re-verified by script** — `.limit(30)`,
      `createSignedUrl`, no map library, the five track ids, the roving tabindex,
      and the `neutral` import
- [x] **Rendered signed in:** five tabs with **zero glyphs**, a visible tabpanel,
      all eight anchors (`#config #inspection #plan #packages #lifecycle
      #location #journey #audit`), the history card present, **19 `(Riyadh)`
      stamps**, and the section order confirmed with actions ahead of history
- [ ] `npm run test:e2e` — needs the seeded personas
- [ ] Definition of Done — not fully ticked

## Retirement

`DualStateRibbon.tsx` and `FocusScroll.tsx` marked `@retiring` at **zero
importers**, both with ledger rows owed. Deleting them needs the e2e suite run
once, nothing more.

## Parked

- **Slice 3b:** `ActionBar` (247 lines), `Attachments` (100), `NotesEditor` (53)
  are still legacy markup — 91 `className` uses between them.
- 26 `enum.*` values still render English on the Arabic screen (app-wide
  `ui_strings` vocabulary — T-077's parked item, unchanged).
- `actions.ts` (497 lines) is untouched by design.

## Blocked / open questions

None. No new copy was authored, so nothing new needs Arabic review — T-077's
**115 strings** remain the outstanding review debt.

## Proposed commit

```
refactor(visits): rebuild the visit detail read surface on saqeel
```

## Next

**Slice 3b — the write surface.** `ActionBar`'s three zones on `Card` + `Field` +
`Button`, `Attachments` on `DataTable`, `NotesEditor` on `Textarea`, keeping every
form id and `role="status"`/`role="alert"` the spec pins. Then axe, 320px,
keyboard and an Arabic pass over the restructured screen.
