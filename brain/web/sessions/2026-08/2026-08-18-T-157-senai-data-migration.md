# 2026-08-18 · T-157 — `/admin/integrations/senai-data` rebuilt on SAQEEL

`task: T-157` · `status: done` · `duration: ~2.5h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014`

---

## Goal

Second of the integrations tree (after T-156). The **SENAI data management** console —
four sections (Sources / Endpoints / Field mapping / Sync & reconcile) over the
upstream source registry, the SENAI endpoint contract, field mapping, and sync/
reconciliation. Owner's explicit steer, pointing at the tab bar: **make the four
tabs a single toggle, and fix the spacing.**

## What was wrong

- Legacy `AdminShell` (`Shell`) + `panel`/`table`/`table-wrap`/`badge`/`kpi`/
  `id-code`/`t-caption`, inline `style` literals, own 95-line `senai-data.module.css`
  with raw `px` + `--action-primary` fill.
- **Four separate pill tabs** (`.tab`/`.tabActive`) with a cramped `gap: 4px`.
- Copy hardcoded **English-only** — ~60 `t("admin.senai.…","English")` calls, no `ar`.
- **Code comments** (WEB-000 §2) at the top of both the page and the CSS.
- Raw `new Date().toISOString().slice()` dates (a v5 finding at page.tsx:62).

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/integrations/senai-data/page.tsx` | rebuilt as a route file (415 → 11) |
| `app/(app)/admin/integrations/senai-data/loading.tsx` | **framed skeleton** (`SenaiDataSkeleton`) |
| `features/admin-senai-data/{queries,types,strings}.ts` | created — 4 independent reads + derivations + tab resolver |
| `components/sections/admin-senai-data/` | `senai-data-screen` · `senai-sources` · `senai-endpoints` · `senai-mapping` · `senai-reconcile` · `senai-data-skeleton` · `senai-data.module.css` |
| `i18n/locales/{en,ar}/admin-senai-data.json` | created — new namespace + `messages.ts` |
| Deleted | `senai-data/senai-data.module.css` (orphaned — the old page was its only importer) |

## Decisions

**The single toggle (owner's flag).** The four `<Link>` pills became **one
`SegmentedControl`** with `href` items (`?tab=sources` …). When every item has an
`href` the component renders a single connected `<nav>` of `<Link>`s with a
sliding pill indicator and `aria-current="page"` — one unit, its own internal
spacing, RTL-correct (the pill sits on the right in Arabic). The URL-query tab
state is unchanged, so each section still server-renders its own data.
**`tone="accent"`** (owner's follow-up) paints the active pill the primary
acid-lime fill (`--sqx-action-primary-bg`) with `--sqx-action-primary-text` on it
— axe-clean, no contrast violation (accent as a fill, never as text — WEB-002 §7a).

**Spacing.** The whole page moved onto `ShellPageFrame` (32 px inset) + a single
`--sqx-stack-section` stack, so the toggle, FND-007 banner, KPIs, and tables share
one rhythm instead of the legacy `gap: 16px` / `margin-block-end: 4px` mix. The
old "back" button retired — the 3-crumb breadcrumb (Administration / Connections &
geography → `/admin/integrations` / SENAI data) carries the back path.

**Tables + KPIs.** All four tables are `DataTable`s (which own their own
horizontal scroll and stack to cards on narrow screens); statuses are `StatusPill`
(connection config: validated=success / configured=warning / else neutral; call
outcome: accepted=success / rejected·blocked=warning / else danger). The reconcile
KPIs are `Metric` cards. Enum labels via `humaniseEnum` (parity with the old
`rawLabel` fallback); dates via `formatDateTime` (Asia/Riyadh).

**Governed truth preserved.** The **FND-007 write-back assertion is derived, not
asserted** — `holds`/`breach` still computed from
`SENAEI_MASTER_DATA_WRITE_BACK_ENDPOINTS.length` at render. The SENAI endpoint
contract (`SENAEI_CONTRACT_ENDPOINTS`), the recorded-call verification logic
(`verified/total`, per-endpoint latest call), and every "not available" (failed
read) vs "checked-empty" distinction are byte-for-byte in behaviour — moved into
`queries.ts` + the four views. `endpoint.purpose`/`governanceBlock` render as
contract data (English, as before — not translatable UI copy).

## No regression

`admin-integration-truth-states` tests 3 and 4 read this page's source + CSS —
re-pointed, guarantees preserved:

- **test 3** (failed reads never become zero/empty truth): page → `queries.ts`
  (all four `*Read.error`, no `schemaUnavailable`), `senai-sources`/`senai-reconcile`
  (`data.runsFailed`/`data.connectionsFailed` → `strings.unavailable`, never zero),
  `senai-endpoints` (`verificationUnavailableShort`), the `row.outcome` truth-state,
  and the `en` JSON ("not available, not a checked, empty divergence set").
- **test 4** (narrow-screen overflow safe, no raw colours): the old page CSS was
  deleted, so it now reads the new `senai-data.module.css` (`min-inline-size: 0`,
  token-only — no hex/rgb/hsl) **and** `data-table.module.css` (`overflow-x: auto`),
  proving wide tables scroll inside the DataTable, not the page. Tests 1–2
  (integrations index, factory-data) untouched.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new files — **0 problems**
- [x] `npm run gates:typography` — PASSED (**−43** vs baseline; left unrelocked)
- [x] `npm run gates:date-inputs` — PASSED (19 unchanged)
- [x] `npm run check:design-system-v5` — 61 → **60** (old `toISOString` finding gone); senai adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] **axe** (admin persona, live) — **0 violations** on both the mapping (25 passes) and endpoints (28 passes) tabs
- [x] **live** — all four tabs render, the **single toggle** switches with the correct active segment (Sources / Endpoints / Field mapping / Sync & reconcile)
- [x] **Arabic / RTL** at 375 px — `dir=rtl`, all copy from `ar` JSON, toggle mirrors (pill on the right), **0** horizontal overflow, single `<main>`
- [x] **200% zoom** (desktop) — **0** horizontal overflow

## Parked

- `/admin/integrations/factory-data` (T-158) — the last of the tree: 61-line page +
  `CsvImportForm` (2 raw inputs) + `MasterDataForms` (**17 raw inputs** — full WEB-015).

## Proposed commit

```
feat(admin): rebuild senai data console on saqeel with a single tab toggle
```

## Next

`/admin/integrations/factory-data` (T-158) — same design-critique flow.
