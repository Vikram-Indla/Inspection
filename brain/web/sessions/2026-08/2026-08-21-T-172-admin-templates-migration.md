# 2026-08-21 · T-172 — `/admin/templates` Template Registry rebuilt on SAQEEL

`task: T-172` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-013, WEB-014, WEB-015`

---

## Goal

Rebuild `/admin/templates` (the governed configuration-template registry) on the
SAQEEL page/feature/section split, off the `AdminShell` breadcrumb and the
`t()`/ui_strings copy path, and retire the legacy `AdminConfigurationJourney`.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/app/(app)/admin/templates/page.tsx` | rebuilt thin route | 131 → 11 |
| `src/features/admin-templates/queries.ts` | created (`loadTemplates`, discriminated state, explicit row map) | → 44 |
| `src/components/sections/admin-templates/templates-screen.tsx` | created (ShellPageFrame + journey + states + registry host) | → 59 |
| `src/components/sections/admin-templates/configuration-journey.tsx` | created (SAQEEL rebuild of the journey nav) | → 46 |
| `src/components/sections/admin-templates/admin-templates.module.css` | created | → 42 |
| `src/i18n/locales/en/admin-templates.json` | created (`adminTemplates` namespace) | → 69 |
| `src/i18n/locales/ar/admin-templates.json` | created (Arabic parity) | → 69 |
| `src/i18n/messages.ts` | registered `adminTemplates` | +7 |
| `_components/AdminConfigurationJourney.tsx` | **deleted** (templates was sole consumer) | 54 → 0 |
| `admin/templates/form-builder.module.css` | **deleted** (orphaned, zero importers) | 80 → 0 |

## Decisions

- **Kept the shared `TemplateRegistry`** (client form-builder, also used by
  `admin/packages`) as-is — it already carries zero `.sq-*` classes. Migrated
  only the templates page's copy: its `strings` now come from the `adminTemplates`
  namespace (`{ ...copy.registry, datePicker: copy.datePicker }`) instead of ~40
  `t("admin.template.*", "English")` fallbacks.
- **Rebuilt the journey nav as a SAQEEL section** (`configuration-journey.tsx`)
  and deleted `AdminConfigurationJourney` — templates was its only consumer. Steps
  are `next/link` + `Text` with `aria-current="step"` (the `RiskSectionNav`
  pattern); the active step takes the accent combo (`--sqx-text-accent` on
  `--sqx-surface-accent`), not colour-only.
- **Moved off `AdminShell` to `ShellPageFrame`.** `AdminShell`'s breadcrumb
  hard-codes `t("nav.administration", "Administration")`, which rendered
  **"Administration" untranslated in Arabic**. `ShellPageFrame` takes the
  breadcrumb from the namespace (`الإدارة`), matching the T-171 risk pattern.
- **Removed the banned `as unknown as`.** The old page cast
  `(templates ?? []) as unknown as TemplateRow[]`; the query now maps each row
  explicitly (`row.schema` is `unknown`, so it assigns cleanly).
- **`▦` emoji glyph → `EmptyState icon="forms"`**; raw `.badge`/`.alert`/`.panel`/
  `.saqeel-state`/`.sq-link`/`<h3>`/`<p class=t-caption>` → `Card`/`StatusPill`/
  `EmptyState`/`Text`.

## Inventory taken before writing code

- state/effects: none in the page (Server Component); the client state lives in the
  untouched shared `TemplateRegistry`.
- literals → tokens: journey styles colocated on `var(--sqx-*)`; active step uses
  the accent tokens, not a raw colour.
- `<svg>`: none; `EmptyState icon="forms"` from the registry replaces the `▦` glyph.
- a11y: journey steps carry `aria-current`; nav has an accessible name; status is
  `StatusPill` (text + tone), never colour-only.

## Numbers

```
Route: /admin/templates
page.tsx        131 → 11 lines
legacy deleted  134 lines (journey 54, orphan css 80)
new feature/section/CSS/i18n: 329 lines
client islands: unchanged (shared TemplateRegistry kept)
lint:           −371 (ratchet held; +2 over T-171)
typography:     −258 (ratchet held; +10 over T-171)
(production first-load JS / LCP / INP: measurement request per WEB-005 §8)
```

## Accessibility

- axe: not run in-browser (browser spawn blocked). Verified by contract + live.
- Manual (WEB-003 §10): keyboard (journey links + registry form) · Arabic/RTL
  (verified live — breadcrumb now `الإدارة`, journey + registry localized, LTR
  template keys) · dark (verified live) · no horizontal overflow at 1280
  (`scrollWidth − clientWidth = 0`, `dir=rtl`).

## Verification

- [x] `npm run typecheck` — 0
- [x] `npm run lint` — 0, −371
- [x] `npm run gates:typography` — PASSED, −258
- [x] `npm run check:design-system-v5` — zero violations in the new files
- [x] Live as Admin, EN + AR/RTL — journey (active step in lime), registry form
      (create + 2 published templates), localized breadcrumb, no overflow
- [ ] `npm run test:e2e` (browser) — BLOCKED (spawn); source + live verified.
      `cd-006-011` reads `templates/actions.ts` (untouched) — unaffected.

## Retirement

Deleted `AdminConfigurationJourney.tsx` (sole consumer migrated) and the orphaned
`form-builder.module.css` (zero importers). `admin/templates` no longer imports
`AdminShell`.

## Parked

- The shared `TemplateRegistry` still shows `title_en` for a row even when a
  `title_ar` exists — a shared-component localization gap (also affects
  `admin/packages`), out of scope for this page migration.

## Blocked / open questions

- None.

## Proposed commit

```
feat(admin-templates): rebuild the template registry server-first, retire AdminConfigurationJourney
```

## Next

T-173 — next admin/shared legacy route (bulk-violations / portal / cases /
committee / incident-reports).
