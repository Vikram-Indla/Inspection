# 2026-08-18 · T-158 — `/admin/integrations/factory-data` rebuilt on SAQEEL

`task: T-158` · `status: done` · `duration: ~3.5h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

Final route of the integrations tree — the **Factory data integration** control
plane: a governed CSV staging uploader, four master-data forms (document /
representative / product / material) + a representative-status toggle, and a
three-part import history. Owner's explicit asks: **use our uploader** for the CSV
(not a raw file input) and **DS controls for every field** (WEB-015), bilingual
from i18n files.

## What was wrong

- Legacy `AdminShell`; `sq-input`/`sq-select`/`sq-choice`/`panel`/`badge`/`btn`/
  `sq-banner`/`sq-grid`/`t-caption` + inline `style` literals + raw `<h4>`.
- **WEB-015 debt:** a raw `<input type="file">` for the CSV, **2 raw
  `<input type="date">`**, 3 raw `<select>`, ~10 raw text/number/email `<input>`,
  2 raw checkboxes — **18 raw controls**.
- Copy hardcoded **English-only** across the page + both client forms.
- Raw `new Date().toLocaleString()` dates.
- Two hardcoded English sentence-errors in `actions.ts`.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/integrations/factory-data/page.tsx` | rebuilt as a route file (61 → 10) |
| `app/(app)/admin/integrations/factory-data/loading.tsx` | **framed skeleton** |
| `app/(app)/admin/integrations/factory-data/actions.ts` | 2 English sentence-errors → codes (`invalid_valid_range`, `invalid_capacity`); **all other logic byte-for-byte** |
| `features/admin-factory-data/{queries,types,strings}.ts` | created — 6 reads + view + `resultMessage(code)` localizer |
| `components/sections/admin-factory-data/` | 11 files: screen · csv-import · factory-picker · form-result · document-form · representative-form (+toggle) · catalog-forms (product+material) · master-data-panel · factory-history · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-factory-data.json` | created — new namespace (incl. `result` code map + `datePicker` strings) + `messages.ts` |
| Deleted | `factory-data/CsvImportForm.tsx` · `factory-data/MasterDataForms.tsx` (orphaned — the new screen replaces them) |

## Decisions

**The uploader (owner's ask).** The DS **`FileUpload`** already existed — drag-and-drop
+ click-to-browse, submits through the plain `<form action>` (so `stageFactoryCsv`
reads `csv_file` from `FormData` unchanged), fully i18n-driven via `strings`, and
an `onSelect` callback. The client CSV header-preview (required-column check) rides
`onSelect`; no new component was needed. **No raw file input remains.**

**Every field on a DS control (WEB-015).** `TextInput` (+ real-example placeholders)
for text/number/email, `SaqeelSelect` for doc-type / material-source / the factory
picker, **`DatePickerField`** for valid-from/valid-to (the 2 raw date inputs are
gone), `Choice` for the two primary flags. Fields are wrapped in `Field` for visible
labels. The factory picker is a client `SaqeelSelect` that navigates on change
(`?factory=`); every add-form is a `useActionState` client form.

**Error copy — codes → client i18n map (owner's choice).** `actions.ts` returns
stable codes; `resultMessage(code, strings)` maps each to `en`/`ar` copy, and the
shared `mapFactoryError` neutral DB output passes through as-is (localizing a
Factory-360-shared util is out of scope). The two hardcoded English sentences
became codes, moving the last copy out of the action.

**Logic preserved byte-for-byte.** The CSV custody path (parse, SHA-256,
staged-not-accepted, `senaei_sync_runs` + `factory_import_batches` +
`factory_import_rows` insert with rollback), the 5 master-data operations, the
admin-role gate, `validTo < validFrom` / `annualCapacity < 0` validation, and
every `revalidatePath` are unchanged.

## No regression

Two governed contracts re-pointed, guarantees preserved:

- **`admin-integration-truth-states`** (test 2): the six independent
  `*Read.error` reads → `queries.ts`; the raw-`run.status` + `run.created_at` DOM
  assertions → `factory-history.tsx` (`run.status` truth-state pill +
  `formatDateTime(run.created_at)`); "No batch provenance recorded" → `en` JSON.
  (Tests 1/3/4 were re-pointed in T-156/T-157.)
- **`factory360-admin-control-plane`** (tests 3–4): tests 1–2 read only the
  unchanged `layout.tsx`/`actions.ts` and pass as-is. Test 3's `value="op"` +
  `name="field"` assertions → the new `document-form`/`representative-form`/
  `catalog-forms` (joined); the `validTo < validFrom`, `annualCapacity < 0`,
  `mapFactoryError(error, "update")` assertions still hit `actions.ts` (logic
  intact); the "Factory 360 profiles are read-only" / `SENAEI_API_CONTRACT_NOT_SUPPLIED`
  page copy → `en` JSON. Test 4's five headings + "No remote call…" + "Staged does
  not mean imported" → `en` JSON. All 4 pass under the static config.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — PASSED (**−54** vs baseline; left unrelocked)
- [x] `npm run gates:date-inputs` — PASSED (19, none new — the 2 raw date inputs became `DatePickerField`)
- [x] `npm run check:design-system-v5` — **60** unchanged; factory-data adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] `factory360-admin-control-plane` (4) + all `admin-integration-truth-states` assertions — verified present/green
- [x] **axe** (admin persona, live, forms shown) — **0 violations**, 28 passes
- [x] **live** — the **DS uploader** dropzone, provider/CSV cards, factory `SaqeelSelect` picker (real factories), the four forms with `SaqeelSelect` / `TextInput`+placeholders / **`DatePickerField`** / `Choice`, the selected-factory dossier link, and the history `DataTable`
- [x] **Arabic / RTL** at 375 px — `dir=rtl`, all copy from `ar` JSON, forms mirror, single `<main>`, **0** horizontal overflow
- [x] **200% zoom** (desktop) — **0** horizontal overflow

## The integrations tree is complete

T-156 (index) · T-157 (senai-data) · **T-158 (factory-data)** — all three routes
migrated off the legacy chrome. `AdminDestinationFrame` no longer has
`/admin/integrations` on its retirement list.

## Proposed commit

```
feat(admin): rebuild factory data console on saqeel with ds uploader and controls
```

## Next

The remaining admin surfaces (audit, items, workflows, devices, …) or the parked
`admin-core-orchestrator` legacy-array cleanup.
