# 2026-08-18 · T-151 — form controls: DatePickerField + the no-raw-date-input rule

`task: T-151` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-002, WEB-013` · `rule added: WEB-015`

---

## Goal

The owner flagged `/admin/packages` → "Action-form templates" rendering **raw
native date inputs** instead of the design system's date picker, and set two
standing rules: (1) no raw HTML date input — use the DS date picker; if a needed
control is missing from the DS, build it first, never inline raw HTML; (2) no
input without a placeholder.

## The gap (raised, then filled)

`TemplateRegistry` (the Action-form templates screen) and `PublishControls` used
`<TextInput type="date" name= required />`, which renders a **native
`<input type="date">`** — the control the owner objects to. The DS has a proper
`DatePicker`, **but it is a controlled popover with no `name` / hidden input**, so
it cannot submit through these native server-action forms. That is exactly the
"component not available" case the new rule governs: rather than wrap raw HTML
around it, a form-submittable field was built.

**`DatePickerField`** (`components/saqeel/date-picker-field/`) — uncontrolled
(`name` + `defaultValue`, holds its own value state), wraps `DatePicker`, and
emits `<input type="hidden" name value>`. It is the single-date twin of
`DateRangePicker`'s existing `nameFrom` / `nameTo` contract, and a drop-in for
`TextInput type="date"` (same uncontrolled-with-`name` DX). Required is enforced
server-side (as `DateRangePicker` already does), not by the inert hidden input.

## What changed

| File | Action |
| --- | --- |
| `components/saqeel/date-picker-field/date-picker-field.tsx` + `.module.css` | **created** — form-submittable single-date field |
| `components/saqeel/text-input/text-input.tsx` | removed `"date"` from `TextInputType` — `TextInput type="date"` is now a compile error |
| `app/(app)/admin/packages/TemplateRegistry.tsx` | 2 date fields → `DatePickerField`; placeholders on key/version/titleEn/titleAr/reason/schema; `locale` prop |
| `app/(app)/admin/packages/PublishControls.tsx` | 2 date fields → `DatePickerField`; deactivation-reason placeholder; `locale` on `NewDraftForm`/`DeactivatePackage` |
| `app/(app)/admin/packages/PackagesEditors.tsx` | threads `locale` to the three consumers |
| `features/admin-packages/editor-strings.ts` | `datePicker` bag + placeholder strings (template + publish) |
| `app/(app)/admin/templates/page.tsx` | same new strings + `locale` (second `TemplateStrings` builder) |
| `brain/web/rules/WEB-015-form-controls.md` | **new rule** |
| `brain/web/README.md` | registered WEB-015 |
| `scripts/check-date-inputs.mjs` + `scripts/date-inputs-baseline.json` | **new ratchet gate**, baseline 19 |
| `package.json` | wired `gates:date-inputs` into `gates` |

## Decisions

**Enforced at three levels.** Type (`TextInputType` drops `date`), written law
(WEB-015), and a CI ratchet (`gates:date-inputs`, baseline **19**, may only
fall). The 4 admin/packages fields are gone from the baseline; the remaining 19
are legacy/unmigrated screens retired as each is migrated.

**`PackagePreview`'s disabled date preview was deliberately left raw.** It is a
read-only projection of the inspector's Workspace form, which still renders a raw
date input (unmigrated, 1,991 lines). Swapping only the preview would make it
misrepresent the real screen — WEB-015 §5 records this: a preview matches the
screen it projects, and both migrate together. It stays in the gate baseline.

**Placeholders are real examples, from i18n.** Every input in the two forms now
carries a placeholder (`"Example: chem-storage-checklist"`, `"v1"`, `"Select a
date"`, …) built through the existing admin `t(key, default)` bags, not empty and
not a repeat of the label.

## Concurrent agent

A second agent left `src/features/factories/view.ts` (missing `formatCount` /
`formatDecimal`) and `src/i18n/numbers.ts` (a banned comment) mid-edit. Those are
the **only** typecheck/lint failures in the tree and are **not** part of this
task — left untouched.

## Verification

- [x] `npm run typecheck` — clean for every file this task touched (only the
      concurrent agent's `factories/view.ts` errors remain)
- [x] `eslint` on all changed files — no new violations (the `as unknown as`,
      119-line route and async `useT` shown are pre-existing baselined legacy
      issues in `admin/templates/page.tsx`, not introduced here)
- [x] `npm run gates:date-inputs` — PASSED (19 known, none new); `TemplateRegistry`
      and `PublishControls` no longer appear
- [ ] Live render — **owed.** `/admin/packages` needs the admin persona; this
      session is an inspector. `DatePicker` is already proven across planning,
      visits, analytics and enforcement screens.
- [ ] Full `npm run gates` / `test:static` — not run to green: the concurrent
      agent's broken `factories/view.ts` fails typecheck for the whole tree.

## Parked

- Migrate the 19 baselined raw date inputs as their screens are touched (the
  inspector `Workspace`, `admin/delegation`, `factories/[id]`, the field
  `*-reports` forms, `VisitsBoard`, the legacy `ShellClient` and
  `saqeel/inputs/DateRangePicker`), each lowering the gate baseline.
- Placeholder sweep of inputs outside `/admin/packages` (WEB-015 §3) as each
  screen is touched.

## Proposed commit

```
feat(saqeel): add DatePickerField and ban raw date inputs (WEB-015)
```

## Next

Back to the field migration (the parked settings sub-routes) unless redirected.
