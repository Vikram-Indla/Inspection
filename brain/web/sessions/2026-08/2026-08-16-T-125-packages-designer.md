# 2026-08-16 · T-125 — the package designer reaches zero typography, and T-124's spec claim is corrected

`task: T-125` · `status: partial — typography 0 and specs re-pointed; legacy component classes remain in two files; axe, Arabic review and browser e2e owed` · `duration: 3h`
`rules applied: WEB-000 … WEB-014`

---

## Goal

Migrate the five `/admin/packages` designer components onto SAQEEL primitives
and take the route's typography debt to zero.

## What changed

| File | Action | Result |
| --- | --- | --- |
| `TemplateRegistry.tsx` | rebuilt on `Field`/`TextInput`/`TextArea`/`SaqeelSelect`/`Button` | 39 → 197 lines, readable |
| `ImpactPanel.tsx` | rebuilt on `Text`/`StatusPill`/`Mono` | 126 → 155, 13 typography → 0 |
| `PublishControls.tsx` | rebuilt on `Field`/`TextInput`/`Button`/`Card` | 102 → 157, 4 → 0 |
| `PackagePreview.tsx` | typography only — 8 surgical replacements | 12 → 0 |
| `DraftEditor.tsx` | typography + the `let` ban | 4 → 0, `no-restricted-syntax` 2 → 0 |
| `packages.module.css` | dead rules pruned | **226 → 100 lines**, 18 of 27 classes deleted |
| `text-input/text-input.tsx` | `TextInputType` gained `"date"` | primitive gap filled |
| `e2e/cd-008-009-packages.spec.ts` | **10 assertions re-pointed** | T-124's debt |

## The correction that mattered more than the migration

**T-124 reported "9 specs pinned, none needed re-pointing," and that was wrong.**
It had broken **ten** assertions in `cd-008-009-packages.spec.ts`.

```
WRITER_ROLES as a new Set([…]) literal in page.tsx
version.status === "draft" && canWrite          canWrite && <section
mandatoryWhenVisible                            scoringEnabled: …!== false
aria-busy="true" in loading.tsx                 packageUnavailable
itemBankUnavailable · pkgs.length === 0 · href="/admin/packages"
configuration_templates · violation_codes       the Arabic error literal
```

**The sweep worked; the verification did not.** T-124 verified with *"the static
suite is unchanged at 408"* — but that spec is **not in
`playwright.static.config.ts`'s allowlist**, so the static run could never have
executed it, and the spec cannot run here at all because its describe block
needs a browser this workstation does not have.

**What settles it without a browser is a five-line script** that reads the
asserted strings and greps them against the new source. That is how all ten were
found and how each re-point was confirmed. The T-124 record and the session log
now carry the correction inline rather than silently.

**One of the ten was not a regression.** `aria-busy="true"` moved out of
`loading.tsx` into `SkeletonRegion`, which sets it — so the behaviour improved
from a literal to a primitive guarantee and only the spelling moved. Re-pointed
to assert it where it is now kept.

## Decisions

**`TextInputType` gained `"date"` — the primitive was filled, not worked
around.** Three forms need a date that submits inside a plain `<form action>`.
`DatePicker` is controlled, needs locale and strings threaded, and does not
submit; `TextInput` excluded `date` outright. T-080's ruling is explicit —
*"when a primitive gap blocks a rule, fill the primitive; working around it puts
the violation somewhere a future task has to find again"* — so the union gained
one member.

**`PackagePreview` was migrated surgically, not rebuilt.** It deliberately
mimics the field workspace's `ipad-q` / `sq-btn--field` visual language so a
checker previews what an inspector will actually see. Those are **component**
classes, not type classes, and the typography gate does not flag them (T-102's
derivation). Rewriting them onto SAQEEL primitives would change what the preview
previews — a fidelity decision, not a typography one. Only the 12 typography
violations were replaced.

**18 of 27 CSS classes were dead and are deleted.** T-124 replaced the old
version table with `PackageCard`, so `versionTable`, `packageGroup`, `hero`,
`emptyState` and 14 others had zero references — including both remaining
`--type-*` declarations. Checked for indirect references before deleting
(T-093), then pruned: **226 → 100 lines**.

**The `let` ban was satisfied by structure, not suppression.** `addSection`
built a unique key with `let key` + `let suffix` in a `while` loop. It is now a
`Set` of taken keys plus a small recursive `nextFreeKey`, which is what the rule
is asking for.

## Numbers

```
typography (route)   38 → 0            gate 77 → 115 removed
eslint               gate 81 → 97 removed
packages.module.css  226 → 100 lines   18 of 27 classes deleted
v5                   77 → 76           one finding cleared as a side effect
spec assertions      10 re-pointed     all verified against the new source
static e2e           408 passed, 33 failed — unchanged
```

## Verification

- [x] `npm run typecheck` — exit 0
- [x] `npm run lint` — PASSED, 97 removed
- [x] `npm run gates:typography` — PASSED, 115 removed; **`/admin/packages` measures 0**
- [x] `npm run check:design-system-v5` — **77 → 76**
- [x] `npm run test:static` — 408 passed, 33 failed, all pre-existing
- [x] Route renders **200**, impact panels 0 of 11 open, heading outline H1 → H2 per card

## Two process notes

**I hit the zero-match-reports-success shape again.** An import was inserted
against an anchor (`import styles`) that `PackagePreview` does not contain; the
replace was a no-op and the script logged *"import added"*. Caught by the next
typecheck, which resolved `Text` to the DOM `Text` interface. **This document
records that shape four times already, and this is the second time in two
sessions.** Every replace helper written from here asserts the result, which is
what the corrected version does.

**I reached for `git checkout` to restore a baseline** after running
`--update` to take a measurement. That is on WEB-006 §3's never-run list.
Restored with `git show HEAD:… > file` instead, and confirmed byte-identical to
HEAD (311 entries, 1,542 total) — the `M` in `git status` is a CRLF artifact
only. **Measuring by mutating a tracked baseline was the mistake**; the reading
should be taken from the gate's own output.

## Parked

- **Legacy component classes remain in two files.** Not typography, so the gate
  is green, but the frozen sheets still supply them:

  ```
  DraftEditor      sq-field__label 14 · sq-input 8 · sq-panel 3 · sq-state 1 · badge 2
  PackagePreview   sq-lozenge 9 · sq-field__label 3 · sq-input 2 · badge 6 · sq-btn 1
  ```

  `DraftEditor`'s are a straight swap to `Field`/`TextInput`/`Card`.
  **`PackagePreview`'s are the open question**, because they are deliberate
  field-app mimicry — migrating them needs a ruling on whether the preview
  should look like SAQEEL or like the field workspace it previews.
- `PackagesEditors.tsx` and `features/admin-packages/editor-strings.ts` still
  bridge to the string bags. They collapse when the remaining `t(key,"English")`
  calls move into the `admin-packages` namespace.

## Blocked / open questions

Owed before `done`: **axe** on the designer surfaces, a **native Arabic review**,
**browser e2e** (still the repo-wide chromium and credentials blocker from
T-119 — and this task is the clearest evidence yet of what that blocker costs,
since ten broken assertions sat unnoticed through a whole task), and the
**first-load number**.
