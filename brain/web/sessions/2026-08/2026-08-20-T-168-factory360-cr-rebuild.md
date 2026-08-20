# T-168 · `/factories/cr/[id]` — Factory 360 rebuilt on SAQEEL

`date: 2026-08-20` · `rules: WEB-000..015` · `route: /factories/cr/[id]?license=`

## What this was

The canonical Factory 360 screen — `/factories/[id]` redirects here — and the last
wholly-legacy surface of its size: a **410-line** single `page.tsx`, 14 data
sections plus a left license rail and a right context rail, on the frozen `.sq-*`
sheets with ~130 hardcoded `t(key, "English")` / `bilingual()` / `locale==="ar"?`
literals, emoji glyphs (`⛔`,`∅`), raw `<table>`/`<select>`/`<img>`/`<form>`,
inline `style={{blockSize}}` trend bars, `as never`/`as unknown as`, and a
single-bar skeleton. T-067 did a typography-only pass and explicitly deferred the
rebuild to T-020/this task.

## Approach

Owner chose **one full rebuild** with the **compliance trend as the only chart**.

- **Data unchanged.** Kept the governed `loadFactory360Dossier` projection,
  `resolveFactory360Permissions`, `calculateApprovedCompliance`, `factory_timeline`
  RPC. Wrapped them in `features/factories/cr-dossier/queries.ts` (discriminated
  `denied | not-found | ready`) + `view.ts` (formatters: `text/dt/label/amount/
  sourceState`, `reconciliationTone`, `crTitle`, `crFreshness`).
- **Bilingual namespace `factoriesCr`** (en+ar) — English lifted verbatim from the
  legacy `t()` fallbacks, **Arabic lifted verbatim from the approved
  `FACTORY360_AR_FALLBACK` store** in `lib/factory360/arabic.ts` (no re-translation).
  Registered in `messages.ts`.
- **Composition on primitives.** `FactoryWorkspace` (existing 3-col grid) with
  `start` = license rail, `end` = context rail, `top` = license-degraded notice.
  Sections are `Card`/`CardHeader`/`CardBody` + `DataTable` + `DefinitionList` +
  `StatusPill` + `EmptyState` + `Metric`/`Mono`/`Text`. The compliance trend is a
  real `BarSeries` (0–100 `domainMax`, `track`, `rtl`), replacing the inline-height
  divs. Server components pass formatter functions + dossier slices to server
  panels; only `CrVisits` (instant client filter), `BarSeries`, `CrExportButton`
  and `ContextualAiPanel` are client leaves, all fed plain data.

## Files

| File | Lines | Note |
|---|---|---|
| `app/(app)/factories/cr/[id]/page.tsx` | 410 → **40** | thin: query → Shell + screen |
| `app/(app)/factories/cr/[id]/loading.tsx` | 17 → 14 | framed `CrSkeleton` (was 1 bar) |
| `app/(app)/factories/cr/[id]/factory360.module.css` | **deleted** | 269-line pre-SAQEEL sheet, zero importers |
| `features/factories/cr-dossier/{queries,view}.ts` | 2 | data + formatters |
| `components/sections/factories/factory360-cr/` | 8 | screen, skeleton, license-rail, context-rail, cr-visits(client), cr-export-button(client), module.css |
| `…/factory360-cr/panels/` | 8 | registry, selected, compliance(+chart), inspections, industrial, permits, documents, provenance |
| `i18n/locales/{en,ar}/factories-cr.json` | 2 | new `factoriesCr` namespace |
| `i18n/messages.ts` | — | 5-line registration |

Every component ≤ 136 lines (ceiling 200); every dir ≤ 8 files (ceiling 12);
route 40 lines (ceiling 40).

`Factory360ExportButton.tsx` **kept** — still imported by `field/factory-360/[id]`.

## Gates

- `typecheck` PASS · `lint` PASS (**−279** vs baseline; the legacy page's
  violations gone) · `gates:typography` PASS (**−144**) · `gates:date-inputs` PASS.
- `check:design-system-v5` red — but **every** hit is pre-existing and outside this
  task: `factories/page.tsx` + `factories/[id]/page.tsx` (emoji glyphs),
  `analytics/query-state.ts` + `factories/[id]/page.tsx` (utc-slice). This task
  *removed* the CR route's two emoji-glyph violations.

## Verified (browser, EN + AR/RTL)

The exact owner URL. EN: header + freshness, license rail, CR identity + portfolio
DefinitionLists, selected-license + instant-filter visit table, compliance metric
(chart hidden — this factory has no approved trend), observed/reports/violations
empty states, industrial + government tables, chemical/customs (customs correctly
**degraded**), documents **restricted** (admin lacks the permission), business-event
timeline, cross-provider reconciliation (**Unverified master**). AR: fully mirrored,
Arabic labels throughout, no console errors from the route.

## Parked

- Timeline event titles for **snake_case** keys not in `timeline.events`
  (`visit_planned`, `source_sync`, …) fall back to `humaniseEnum` — English in AR.
  Same behaviour as legacy; a small AR polish if the RPC's key set is enumerated.
- Sibling factory routes (`/factories`, `/factories/[id]`) still carry the emoji /
  utc-slice DSV5 debt — separate tasks.
