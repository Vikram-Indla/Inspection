# 2026-08-12 · T-080 — `/visits/[id]` write surface on SAQEEL: two primitive gaps found, one more UTC timestamp (slice 3b of 3)

`task: T-080` · `status: done (axe, 320px, keyboard, Arabic owed for the whole route)`
`duration: ~1h` · `rules applied: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011`

---

## Goal

Slice 3b: the three write components — `ActionBar`, `Attachments`, `NotesEditor` —
onto the design system, keeping every form binding, id and live region the
CD-027 contract pins.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/visits/[id]/ActionBar.tsx` | three zones on `Card`/`Field`/`Button` | 247 → 257 |
| `app/(app)/visits/[id]/Attachments.tsx` | table → `DataTable` | 100 → 114 |
| `app/(app)/visits/[id]/NotesEditor.tsx` | → `Card`/`Field`/`Textarea` | 53 → 61 |
| `app/(app)/visits/[id]/action-bar.module.css` | created | 60 |
| `features/visits/detail/view.ts` | attachment stamp formatted at source | — |
| `e2e/cd-027-visit-detail.spec.ts` | live-region assertion re-pointed | — |

**The route now renders zero legacy classes** — verified in the DOM, not the
source: `document.querySelectorAll(".panel,.btn,.field,.alert,.t-caption,
.grid-toolbar,.table").length === 0`.

## Decisions

**Two primitive gaps stopped the obvious migration, and both were the same gap.**
`Select` is a controlled listbox — `value` + `onChange`, **no `name`, no hidden
input** — so it cannot participate in a form POST. Four governed transitions
(return, reassign, visit type, repackage) submit through server actions that read
`FormData` by name. Swapping them to `Select` would have compiled, rendered
correctly, and **silently sent an empty field on every write**. `TextInput` has
the same shape problem in miniature: no `datetime-local` type, which the
reschedule window needs.

Both keep native controls inside `Field`, hand-reset in the module the way every
migrated component that styles a control does — the fourth recorded instance of
*`saqeel.css` has no global button reset by design*, now extended to `select` and
`input`. **The gaps are raised, not filled**: this is exactly the T-043 lesson
that a portalled control cannot participate in a form, and it now has a second
victim.

**A fourteenth UTC timestamp was hiding in a child component.** T-076 fixed
thirteen in `page.tsx`; `Attachments.tsx` had
`a.uploadedAt.slice(0, 16).replace("T", " ")` — the upload time, in UTC, three
hours early. It survived because that slice searched the route file and this one
lives two components down. It is now formatted at source in
`visitAttachmentRows`, so the cell prints a string rather than slicing one.
**A per-file sweep misses what a per-route sweep catches.**

**The live regions moved from literal roles to the `Text` primitive.** The spec
asserted `role="status"` and `role="alert"` as source text in `ActionBar.tsx`;
they are now `Text live="status"` / `live="alert"`, with the primitive rendering
`role`. Re-pointed to assert **both halves** — the call site's `live` prop, the
retained `aria-live="polite"` wrapper, and that `Text` renders `role={live}` —
which is a stronger claim than the original, because the original could not tell
whether the role reached the DOM.

**Every write path was verified by script, not by eye.** Eight server actions
still bound to their forms, four identity fields (`visit_id`,
`expected_version`, `idempotency_key`, `correlation_id`) present, both guards
(`guardPublishedNew`, `guardPreStart`) untouched in `actions.ts`, soft delete
intact and no hard `visit_attachments` delete. All eight spec-pinned control ids
survive: `visit-return-reason`, `visit-return-comments`, `visit-cancel-comments`,
`visit-reassign-inspector`, `visit-type-select`, `visit-repackage`,
`visit-notes`, `visit-attachment-file`.

**Three components grew slightly and that is the right trade.** 400 → 432 lines
across the three, because `Field` + `Button` + explicit `label` props are more
verbose than `<div className="field"><label>`. What went is 91 legacy class uses
and a hand-rolled 5-column table; what arrived is a `DataTable` with a real empty
state and controls that inherit every future fix to the primitives.

## Inventory taken before writing code

- **State/effects:** unchanged — `useActionState` per action, one `useState` for
  transition identity. Nothing moved on the ladder.
- **Literals:** none. The new module is 60 lines of `var(--sqx-*)`.
- **`<svg>`:** none.
- **Comments:** the 11-line header block on `ActionBar` and the 4-line block on
  `NotesEditor` are gone (WEB-000 rule 1); the two that survive explain *why a
  native control is still native*, which is the non-obvious part.
- **Accessibility fixed:** the file input and the four selects now have
  programmatically bound labels through `Field` (they had hand-written
  `<label htmlFor>` before, which worked, but is now the primitive's job);
  the attachments table gained a caption and a real empty state.

## Numbers

```
Route: /visits/[id] — write surface
legacy class uses            91 → 0   (verified in the rendered DOM)
SAQEEL components used        0 → 8
hand-rolled tables            1 → 0   (DataTable)
UTC timestamp sites           1 → 0   (the fourteenth)
server actions bound          8 → 8
spec-pinned control ids       8 → 8
lines across the three      400 → 432
```

## Accessibility

- **axe: not run.** Owed for the whole route.
- Manual checklist: keyboard — owed · screen reader — owed · 200% zoom — owed ·
  320 px — owed · Arabic/RTL — owed since the restructure · **dark — verified** ·
  light — owed · reduced motion — nothing animates · greyscale — owed
- **Fixed:** labels are now primitive-bound; the attachments table has a caption
  and a governed empty state instead of a bare paragraph.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates` — typography PASSED, zero new
- [x] **Write-path integrity asserted by script** (see Decisions)
- [x] **Rendered signed in:** zero legacy elements in the DOM, the *Available now*
      zone present, notes and attachments cards with their controls, and **no
      `YYYY-MM-DD HH:MM` stamp anywhere**
- [ ] `npm run test:e2e` — needs the seeded personas. **This slice touches eight
      live write paths; the suite is the real proof and has not run.**
- [ ] Definition of Done — not fully ticked

## Retirement

Nothing new. `DualStateRibbon` and `FocusScroll` remain `@retiring` at zero
importers from T-078.

## Parked — two primitive gaps, raised not filled

- **`Select` cannot participate in a form.** No `name`, no hidden input. Any
  screen with a server-action `<form>` must keep a native `<select>`. Either the
  primitive gains a hidden input mirroring its value, or the rule is written down.
- **`TextInput` has no `datetime-local`.** Its `TextInputType` union omits it.
- The 26 `enum.*` values without `ui_strings` rows (T-077/T-079, unchanged).

## Blocked / open questions

No new copy authored — nothing new needs Arabic review. T-077's **115** and
T-079's **5** remain outstanding.

## Proposed commit

```
refactor(visits): rebuild the visit detail write surface on saqeel
```

## Next

The route is fully migrated. What it now owes is one pass, not more building:
axe on both themes, 320 px, keyboard through the ribbon and all eight forms, an
Arabic render of the restructured screen, and **the e2e suite** — which is the
only thing that can prove the eight write paths still transition correctly.
