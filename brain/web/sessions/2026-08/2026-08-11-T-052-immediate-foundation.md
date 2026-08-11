# 2026-08-11 · T-052 — `/planning/immediate` slice 1: route, data layer, bilingual resources

## Goal

Take the urgent-visit route off its 252-line route file and off `ui_strings`,
without changing a pixel. Slice 1 of 5 on the whole wizard.

## What changed

`page.tsx` **252 → 26 lines**. Every read moved to
`features/planning-immediate/queries.ts` behind an
`unauthorized | ready` union; the access gate, the five parallel reads, the
region/city derivation and the visit-type lookup fallback went with them.
All **128 strings** moved to `planning.immediate` in **both** locale files and
are read by key through `getMessages(locale)` — the route no longer calls `t()`
at all. `ImmediateForm` went from **16 props to 3**.

## Decisions

- **The prior attempt (T-051, commit `e62f7c65`) was reverted in full at the
  owner's instruction** before this task started — file contents restored from
  `e62f7c65^` via read-only `git show`, added files deleted. `git diff e62f7c65^`
  over every path that commit touched is empty. No `git revert` was run; the
  agent never runs a git write command.
- **`actorMode` and `manualEntryAllowed` are policy and moved to `queries.ts`.**
  As a local `const` in the component TypeScript narrows `actorMode` to the
  literal `"planner"` and every `=== "inspector"` branch becomes a compile
  error. They are data about the route, resolved once, in the layer that owns
  policy.
- **The flat `ImmediateFormStrings` adapter is deliberate and temporary.** The
  JSON is nested by block (WEB-013 §4); the adapter flattens it to the shape the
  legacy form already consumes, so **86 `strings.*` references were not
  touched** in a file slices 3–5 delete. Its type is
  `ReturnType<typeof …> & …` over six private block builders, so no 115-field
  type literal exists and every function body stays under the 40-line target.
- **Two `as`-hidden type lies were fixed, not carried.** `packages={… as never}`
  and `(r.profiles as unknown as {full_name}).full_name` both hid that
  PostgREST types an embedded to-one relation as an **array**. Both now narrow
  through one `embeddedOne<T>` guard that accepts either shape.
- **`Priority` took the reviewed copy from the database, not the code default.**
  `20260731120000_…_ar_strings.sql` carries `plan.imm.priority` as
  "Priority (no approved list yet)" / "الأولوية (لا توجد قائمة معتمدة بعد)",
  and `t()` resolves `ui_strings` ahead of the in-code default — so the code
  default "Priority (not configured)" was never what shipped.
- **`Location (mandatory — )` was corrected to `Location (mandatory)`.** The
  trailing em dash had nothing after it. Recorded because it is a copy edit, not
  a migration.

## Inventory taken before writing code

Whole route read end to end before any file was written: `page.tsx` 252,
`ImmediateForm.tsx` 395, `AuthorityBar.tsx` 95, `actions.ts` 163,
`loading.tsx` 8 — **913 lines, zero SAQEEL imports**. 28 `useState`,
3 `useEffect`, 1 `useRef`, a module-level `let mapLoadingLabel` written during
render, 3 native `<select>`, 2 `datetime-local`, `✓/✕/◌` as state, and
4 hardcoded English literals. `cd-023-immediate-authority-bar.spec.ts` read in
full because it pins the live DOM.

## Numbers

| File | Before | After |
| --- | --- | --- |
| `app/(app)/planning/immediate/page.tsx` | 252 | **26** |
| `ImmediateForm.tsx` | 395 | 352 |
| `features/planning-immediate/types.ts` | — | 65 |
| `features/planning-immediate/queries.ts` | — | 172 |
| `features/planning-immediate/strings.ts` | — | 197 |
| `immediate-access-state.tsx` | — | 16 |
| `immediate-page-context.tsx` | — | 22 |
| `immediate-return-link.tsx` | — | 22 |

`t()` calls in the route **123 → 0**. Props on `ImmediateForm` **16 → 3**.
Hardcoded English literals in the form **4 → 0**. Locale keys **0 → 128 × 2**,
key trees asserted identical.

## Accessibility

No markup changed in this slice beyond the two handoff surfaces: the Factory 360
lozenge is now a `StatusPill` (text plus tone, not colour alone) and the return
link is a `Button variant="link"`, which is a real `<a>` with a visible focus
ring — it was a bare `sq-link` before. axe not run: no dev server this session.

## Verification

- `npx tsc --noEmit` — **zero errors**
- locale parity asserted by script: 128 keys each side, trees identical, **zero
  English prose in `ar/`**, zero Arabic in `en/`
- rule sweep over every authored file: zero comments, zero suppressions, zero
  `any`/`as unknown as`/`!`, zero `let` in `.tsx`, zero hardcoded copy
- **Not run:** browser pass, keyboard pass, Arabic/RTL render, light/dark,
  reduced-motion, axe. No dev server was started.

## Retirement

Nothing retired yet. `AuthorityBar.tsx` and `ImmediateForm.tsx` are superseded
by slices 2–5 and get their banners then.

## Parked

- **`Button` cannot mirror a directional icon.** `Icon` and `IconButton` take
  `mirrored`; `Button` does not, so the return link's `previousPage` chevron
  points the same way in Arabic. Raised, not filled inline (WEB-002 §2).
- `WEB-000 §6` fixes the feature file set to `queries · actions · mappers ·
  types · keys`; `strings.ts` is not in it, yet `planning-bulk`,
  `planning-single` and now `planning-immediate` all have one. The rulebook or
  the practice should move.

## Blocked / open questions

- **58 of the 128 Arabic strings are newly authored by this task.** 69 were
  harvested verbatim from the existing `tr()` calls and 1 from the migration;
  the rest had no Arabic anywhere in the repo, so this screen has been rendering
  English to Arabic readers. They need a native review pass, especially
  `identity.*` and `consequences.*`.
- **WEB-009 §14 versus CD-023.** The rule bans `<select>` and
  `<input type="date">`; the governed spec drives `#imm-existing` with
  Playwright `selectOption` and fills `#imm-window-start` as `datetime-local`.
  Slice 4 will break those locators. The rulebook outranks the spec
  (WEB-000 §0), so the spec needs re-baselining — **not** silently rewritten.

## Proposed commit

`refactor(planning): move the urgent-visit route onto a data layer`

## Next

Slice 2 — the nine dispatch protections and the R05 notice, on
`review-readiness`'s grammar. Deletes `AuthorityBar.tsx`, its 6 hooks, the
emoji states and the unguarded `scrollIntoView`.
