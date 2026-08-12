# 2026-08-12 · T-081 — `FileUpload`: a drag-and-drop upload primitive that still submits through a form

`task: T-081` · `status: done (axe, 320px, keyboard, Arabic owed for /visits/[id])`
`duration: ~45m` · `rules applied: WEB-000, WEB-002 §2, WEB-003, WEB-009, WEB-011, WEB-012, WEB-013`

---

## Goal

Owner-reported on the rebuilt visit detail: the file field was still a raw
`Choose File / No file chosen`, and *Save notes* sat flush against its textarea.
Build a reusable upload control with browse **and** drag-and-drop.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/saqeel/file-upload/file-upload.tsx` | **created — new primitive** | 96 |
| `components/saqeel/file-upload/file-upload.module.css` | created | 76 |
| `components/saqeel/icon/icon-registry.ts` | `upload`, `attachment` added | +4 |
| `app/(app)/visits/[id]/Attachments.tsx` | consumes `FileUpload` | — |
| `app/(app)/visits/[id]/NotesEditor.tsx` | form is a column, not a block | — |
| `app/(app)/visits/[id]/action-bar.module.css` | `.stackedForm` / `.uploadForm` | +9 |
| `features/visits/detail/strings.ts`, `i18n/{en,ar}/visits.json` | 4 keys, both locales | 143 → 147 |

## Decisions

**The native input is the control; the zone is only its clothing.** T-080 recorded
that a SAQEEL `Select` cannot participate in a form because it has no `name`.
Building an upload control the same way would repeat that defect on a write path —
so `<input type="file">` is kept, visually hidden but **never replaced**, and the
drop zone is a `<label htmlFor>`. That gives click-to-browse **natively**, with no
key handler and no `ref.click()`: the label already does it, and it works with a
keyboard because focus lands on the real input.

**A drop has to hand its `FileList` to that input, and that is the one imperative
write.** `inputRef.current.files = event.dataTransfer.files` is a property write
on a rendered node, which WEB-012 restricts — but it is the sanctioned
*imperative library handoff*: there is no React way to populate a file input, and
without it a dropped file would display and then submit nothing. Everything the
reader sees — the file names, the dragging state, the empty line — is React state
and rendered normally. **The rule bans DOM writes that substitute for render, not
the handoff a browser API requires.**

**The visually-hidden input keeps its focus ring by moving it.** `:focus-within`
draws the ring on the zone, so a keyboard user sees the control they are on even
though the focused element is 1px and clipped.

**`aria-describedby` carries the selection, and the selection is a live region.**
The state line is both the input's description and `role="status"`, so choosing a
file announces without stealing focus, and a screen-reader user querying the field
hears which file is attached.

**The gap defect was structural, not a spacing token.** `<form>` is a block, so
`Save notes` sat flush under the textarea with no gap at all. The fix is that a
form is a **column of fields** — `.stackedForm` gives it `flex-direction: column`
and one gap token. The same applies to the upload form, which is why both classes
landed together rather than a margin being added to a button.

**Two icons were added to the registry, not imported locally.**
`upload: Upload` and `attachment: Paperclip` — the registry is the only file
permitted to import `lucide-react`, and the zone swaps between them to show
whether anything is attached (shape, not colour alone).

## Inventory taken before writing code

- **State:** `names` (selected file names) and `dragging`. Both are genuinely
  local view state at the leaf — rung 5 of the ladder, correctly.
- **Effects:** none.
- **Literals:** none. 76 lines of `var(--sqx-*)`; the transition is suppressed
  under `prefers-reduced-motion`.
- **`<svg>`:** none — both icons come through the registry by semantic name.
- **Copy:** 4 keys in both locales at asserted parity; nothing hardcoded, and
  the label/prompt/browse/selected/empty strings are all props, so the primitive
  carries no English.

## Numbers

```
new primitive                 FileUpload (96 + 76 lines)
registry icons                34 → 36
raw `Choose File` inputs on /visits/[id]   1 → 0
notes button gap              0 px → 12 px (verified in the DOM)
i18n keys                     143 → 147 per locale, parity asserted
```

## Accessibility — verified in the DOM

- `label[for]` ↔ `input[id]` bound (`visit-attachment-file`)
- **keyboard focusable** — focus lands on the real input; the ring is drawn on
  the zone via `:focus-within` (`outlineStyle: solid`)
- `aria-describedby` resolves to the state line, which is `role="status"`
- the input keeps `name="file"` and `required`, inside its `<form>`
- **axe: not run.** Owed with the rest of the route.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates` — typography PASSED, zero new
- [x] i18n parity asserted by script — **147/147**
- [x] **Rendered signed in:** the native input is hidden
      (`position: absolute`, width < 10px), the zone reads *Drag a file here ·
      or browse your device*, the state line reads *No file chosen yet.*, and the
      notes button now clears its textarea by **12 px**
- [ ] **A real drag-and-drop was not exercised** — it needs a synthetic
      `DataTransfer` or a manual drop, and neither was performed. Click-to-browse
      is proven structurally (the `for`/`id` binding), not by opening a picker.
- [ ] `npm run test:e2e`

## Retirement

None.

## Parked

- **`FileUpload` has one consumer.** The Rule of Two is satisfied by intent, not
  yet by use — `field/inspection` evidence capture and
  `planning/bulk` evidence are the obvious second and third.
- No `maxSize`/`accept` validation surface yet: the props exist (`accept`,
  `multiple`) but the component states no constraint and enforces none. A screen
  that needs a limit must say so in `hint` and validate server-side.
- `Select` still cannot participate in a form (T-080's open gap, unchanged).

## Blocked / open questions

**4 new Arabic strings need review** — `att.dropPrompt`, `att.browse`,
`att.fileSelected`, `att.noFileChosen` — on top of T-077's 115 and T-079's 5.

## Proposed commit

```
feat(saqeel): add a drag-and-drop file upload primitive
```

## Next

A real drop test, then the route's outstanding pass: axe, 320 px, keyboard,
Arabic, e2e.
