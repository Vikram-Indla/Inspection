# 2026-08-18 · T-156 — `/admin/integrations` (index) rebuilt on SAQEEL

`task: T-156` · `status: done` · `duration: ~3h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

Design-critique transform of the **System connections** index — the MVP3
integration control plane (endpoint registry + API/rule events + data-sharing
exports). Owner approved the P0/P1 critique + widget mockup with two explicit
asks: fix the **card spacing** and the **skeleton left-right spacing**, keep
responsiveness in both directions, and move **English + Arabic into i18n files**.
Two scope decisions taken at approval: **all three routes back-to-back** (index
now, then senai-data, then factory-data as their own tasks), and the registry
becomes a **SAQEEL DataTable, no record drawer**.

## What was wrong

- `AdminDestinationFrame` (`@retiring`, pending this exact route) + 100% legacy
  chrome — `panel`/`stack`/`row`/`table`/`badge`/`sq-grid`/`t-caption`/`id-code`/
  `metric-strip`/`kpi-*`, inline `style={{ padding: var(--space-6), marginBlock … }}`.
- Copy hardcoded **in both languages inline** — `copy(en, ar)` ternary +
  `t(key, "English")` throughout, no namespace.
- Status via legacy `badge badge-compliant/badge-warning`; raw
  `new Date().toLocaleString()` dates; `<h2>/<h3>/<strong>/<small>` raw type.
- **Skeleton:** `loading.tsx` → flush `RouteLoading` (no page frame), and the
  shared parent `admin/loading.tsx` was flush too.
- Registry rows wired to the shared `AdminRecordDrawer` (6-route component).

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/integrations/page.tsx` | rebuilt as a route file (136 → 9) |
| `app/(app)/admin/integrations/loading.tsx` | **framed skeleton** (`IntegrationsSkeleton`) |
| `app/(app)/admin/loading.tsx` | **`framed`** — shared admin entry skeleton now inset; comment banner removed |
| `features/admin-integrations/{queries,types,strings}.ts` | created — three independent reads + view + message accessor |
| `components/sections/admin-integrations/` | `integrations-frame` · `integrations-screen` · `integration-registry` · `integration-activity` · `integrations-governance` · `integrations-skeleton` · `integrations.module.css` |
| `i18n/locales/{en,ar}/admin-integrations.json` | created — new namespace + `messages.ts` registration |

Deleted nothing — `AdminDestinationFrame`/`AdminRecordDrawer` stay (still used by
`/admin/risk` Studio + 6 routes).

## Decisions

**The frame.** Mirrors the migrated `access-frame`: `ShellPageFrame` +
`.metrics` grid (`Overline`/`Metric`/`Text`) + underline `.tabs` nav of cross-page
`Link`s (Connections/SENAI data/Factory data/Sync history). The two redundant
legacy nav buttons were dropped — the tabs already carry that navigation.

**Card spacing (owner's flag).** Every block is now a `Card` inside a single
`styles.stack` (`gap: --sqx-stack-section`), and the frame's own
`--sqx-stack-default` separates metrics → tabs → content. Events/exports and
governance/note each sit in a `.split` auto-fit grid (`minmax(min(100%,20rem),1fr)`).
Uniform token gaps replaced the per-panel inline padding.

**Skeleton (owner's flag).** `IntegrationsSkeleton` wraps `SkeletonRegion` in
`ShellPageFrame` (32 px inset). The route's own `loading.tsx` covers intra-admin
nav; the shared `admin/loading.tsx` gained `framed` so the **cross-section entry**
skeleton is inset too — the same mechanism verified live on the risk route
(`regionLeft: 32`). This fixes the flush skeleton for every admin route, not just
this one.

**Registry = DataTable, no drawer (owner's decision).** `IntegrationRegistry`
renders a SAQEEL `DataTable` — Name (`Text`+`Mono` key), Type (`humaniseEnum`),
Contract (`Mono`/`Not configured`), Status (`StatusPill` success/warning +
`formatDateTime(updated_at)` provenance). Empty → framed `EmptyState`. The
row-click record drawer is gone (secrets were never shown anyway; audit stays
reachable from `/admin/audit`).

**Governance preserved.** The "Configuration is not connectivity" banner, the
three governance points, and the reconstruction note all carried across as
`Card`s — no governance content lost. Events/exports render as neutral
`StatusPill` lists (matching the legacy neutral `badge`, no invented severity);
enum labels via `humaniseEnum` (parity with the old `rawLabel` fallback).

## No regression

Three source-reading / browser contracts re-pointed, every guarantee preserved:

- **`admin-integration-truth-states`** (test 1): re-pointed page.tsx →
  `queries.ts` (three independent `*Read.error` + `*Failed` flags),
  `integrations-screen.tsx` (all three flags surfaced separately), `en` JSON
  ("not available, not an empty"; no "14 controlled rows"), and
  `integration-registry.tsx` (`row.status === "configured"` truth-state +
  `formatDateTime(row.updated_at)` provenance). Tests 2–4 (factory-data,
  senai-data, senai CSS) untouched.
- **`mvp3-retrofit-regression`**: heading assertion `System Connections` →
  house-style `System connections`. Registry rowheader / empty-state, `main h2`,
  nav-current, Arabic heading (`اتصالات النظام`) and inspector-denial assertions
  all still hold against the rebuild — verified live.
- **`admin-core-orchestrator`**: integrations removed from `OWNED_DESTINATIONS`
  (legacy `data-saqeel-admin-destination` frame + h1) and `RECORD_SURFACES`
  (drawer) — arrays it can no longer satisfy after leaving the legacy frame.
  Kept in `PINNED_DESTINATIONS` (shell nav, unchanged) and the SQL-seed
  `MIGRATION_TITLES` read. Coverage of the new surface lives in the two specs
  above. (`OWNED_DESTINATIONS` was already partly stale — access shows the new
  title, localization still the old — so this suite is the legacy orchestrator
  migrations don't maintain; noted for a separate cleanup.)

`mvp3-enterprise-contract` needed no change: its integrations tests are
`existsSync` (page still exists) and an mvp3-key count the other three MVP3
pages satisfy.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed index + shared files — **0 problems** (subroute
      legacy lint debt is pre-existing baseline, owed to T-157/T-158)
- [x] `npm run gates:typography` — PASSED (**−7** vs baseline; left unrelocked to
      avoid entangling the concurrent agent's files)
- [x] `npm run gates:date-inputs` — PASSED (19 unchanged)
- [x] `npm run check:design-system-v5` — 62 → **61**; index adds **0** (remaining
      findings are legacy files incl. the senai-data subroute)
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] **axe** (admin persona, live) — **0 violations**, 26 passes
- [x] **live render** — dark + light (hairline elevation, accent as fill only)
- [x] **Arabic / RTL** at 375 px — `dir=rtl`, all copy from `ar` JSON, **0** horizontal overflow
- [x] **200% zoom** (desktop) — **0** horizontal overflow

## Parked

- `/admin/integrations/senai-data` (T-157) — 415-line page, 4 tabs, 4 tables,
  KPIs, own `AdminShell` + module.css; has a `toISOString().slice` v5 finding.
- `/admin/integrations/factory-data` (T-158) — 61-line page + `CsvImportForm`
  (2 raw inputs) + `MasterDataForms` (**17 raw inputs** — full WEB-015 pass).
- `admin-core-orchestrator` `OWNED_DESTINATIONS`/`RECORD_SURFACES` are stale for
  every already-migrated admin route — a separate spec-hygiene task.

## Proposed commit

```
feat(admin): rebuild integrations index on saqeel with framed skeleton
```

## Next

`/admin/integrations/senai-data` (T-157), same design-critique flow.
