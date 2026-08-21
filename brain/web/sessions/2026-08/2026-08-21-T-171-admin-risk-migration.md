# 2026-08-21 · T-171 — `/admin/risk` Risk Studio rebuilt on SAQEEL

`task: T-171` · `status: done` · `duration: ~3h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-009, WEB-013, WEB-014, WEB-015`

---

## Goal

Rebuild `/admin/risk` (SCR-ADM-060 / CD-014 — the Risk Studio: live factor
weights + score bands over `engine_settings`) on the SAQEEL page/feature/section
split, and retire the `AdminDestinationFrame` + `AdminRecordDrawer` subsystem it
was the last consumer of.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/app/(app)/admin/risk/page.tsx` | rebuilt thin route | 162 → 12 |
| `src/app/(app)/admin/risk/RiskForm.tsx` | rebuilt → `sections/admin-risk/risk-form.tsx` | 175 → 150 |
| `src/app/(app)/admin/risk/actions.ts` | error strings → typed codes | 32 → 33 |
| `src/app/(app)/admin/risk/loading.tsx` | de-hardcoded label, re-pointed CSS | 29 → 35 |
| `src/features/admin-risk/queries.ts` | created (`loadRiskSettings`, discriminated state) | → 48 |
| `src/features/admin-risk/types.ts` | created (data + save-result codes) | → 25 |
| `src/components/sections/admin-risk/risk-studio-screen.tsx` | created (ShellPageFrame + nav + metrics + form + governance) | → 106 |
| `src/components/sections/admin-risk/risk-form.tsx` | created (`"use client"` controlled form) | → 150 |
| `src/components/sections/admin-risk/admin-risk.module.css` | created | → 112 |
| `src/i18n/locales/en/admin-risk.json` | created (`adminRisk` namespace) | → 78 |
| `src/i18n/locales/ar/admin-risk.json` | created (Arabic parity) | → 78 |
| `src/i18n/messages.ts` | registered `adminRisk` | +7 |
| `_components/AdminDestinationFrame.tsx` + `.module.css` | **deleted** (retiring, sole consumer gone) | 116 + 207 → 0 |
| `_components/AdminRecordDrawer.tsx` + `.module.css` | **deleted** (sole consumer gone) | 338 + 188 → 0 |
| `_components/adminRecordDrawerCopy.ts` | **deleted** | 33 → 0 |
| `_components/admin-destination-frame.module.css` | **deleted** (orphaned) | 12 → 0 |
| `admin/risk/risk-studio.module.css` | **deleted** (replaced) | 28 → 0 |

**1,097 lines of legacy retired** — a whole admin-frame subsystem.

## Decisions

- **Reused the sibling `RiskSectionNav`** (`sections/admin-risk-models`) for the
  Studio/Model-versions tabs and mirrored `RiskModelsScreen`'s `ShellPageFrame`
  composition, rather than rebuilding the frame's metrics/tabs/gate. One nav,
  two routes, consistent.
- **Server action now returns typed codes** (`weight_range`/`weight_sum`/
  `band_bounds`/`provider`), mapped to bilingual copy on the client. The English
  validation strings it used to return were rule-15 copy leaking from a `.ts`.
  The type lives in `features/admin-risk/types.ts` because a `"use server"`
  module may only export async functions.
- **Canonical factor key is `last_outcome_recency_severity`.** The foundation
  seed used `outcome_recency_severity`; the later `20260716210000` migration and
  the running action supersede it. Namespace + seed both use the current key.
- **Seeded the missing `engine_settings` risk row from the accepted config**, not
  invented (WEB rule 9). Values are the `DECISIONS_ACCEPTED_2026-07-11` /
  `0001_foundation.sql` config — weights 0.30/0.20/0.20/0.15/0.15, bands
  [0,39]/[40,69]/[70,100], `version_label v1-accepted-2026-07-11` — restored
  under the current key via MCP `on conflict do nothing`. Absent data still
  renders the governed empty state; the row was genuinely missing in this env.

## Inventory taken before writing code

- state/effects: weights/lowMax/medMax/confirmedLive `useState` + `useActionState`;
  no `useEffect` (was already effect-free; kept as one client leaf).
- literals → tokens: raw `.panel`/`.sq-input`/`.badge`/`.btn`/`.row`/`.rk-*`/
  `.t-caption` and every inline `style={{…}}` (padding/flex/gap/color/width) →
  colocated module on `var(--sqx-*)`; the weight bar fill is a `--weight-fill`
  custom property (the one sanctioned inline escape).
- `<svg>`: none introduced; `EmptyState icon="risk"` from the registry.
- date: `new Date().toISOString().slice(0,16)` (utc-slice) → `formatDateTime`
  (Asia/Riyadh) server-side, passed in pre-formatted.
- a11y: raw `<h4>`/`<b>`/`<p class=t-caption>` → `Text`/`Heading`; `.badge` →
  `StatusPill` (dot + text); native `.sq-input` → `Field` + `TextInput`; band
  chips are labelled `StatusPill`s (success/warning/danger), not colour-only.

## Numbers

```
Route: /admin/risk
page.tsx        162 → 12 lines
legacy deleted  1,097 lines (frame 116+207, drawer 338+188, copy 33,
                orphan css 12, old form 175, old css 28)
new feature/section/CSS/i18n: 597 lines
client islands: 1 (the controlled RiskForm) — unchanged count, off .sq-*
lint:           −369 (ratchet held; +16 over T-170)
typography:     −248 (ratchet held; +28 over T-170)
(production first-load JS / LCP / INP: measurement request per WEB-005 §8)
```

## Accessibility

- axe: not run in-browser (browser spawn blocked — `spawn UNKNOWN`). Verified by
  contract + live render.
- Manual (WEB-003 §10): keyboard (Field/TextInput/Checkbox/Button focus order) ·
  Arabic/RTL (verified live — logical properties, LTR-correct numeric values,
  localized factor names) · dark (verified live) · no horizontal overflow at 1280
  (`scrollWidth − clientWidth = 0`, `dir=rtl`). Status never colour-only.

## Verification

- [x] `npm run typecheck` — 0
- [x] `npm run lint` — 0, −369
- [x] `npm run gates:typography` — PASSED, −248
- [x] `npm run check:design-system-v5` — **zero violations in admin-risk files**
      (repo has pre-existing failures in field/dashboard screens, none mine)
- [x] Live as Admin, EN + AR/RTL — empty state (pre-seed) then populated form
      (100% Σ, 5 factors, v1-accepted-2026-07-11, band chips, live sum,
      confirm-live gating the Save)
- [ ] `npm run test:e2e` (browser) — BLOCKED (spawn), source + live verified

## Retirement

Deleted the entire `AdminDestinationFrame` + `AdminRecordDrawer` subsystem
(frame, drawer, `AdminRecordArticle`, copy helper, both module sheets, one
orphan sheet) — `/admin/risk` was the last consumer. No `@retiring` banner
needed; zero imports remained after the rebuild.

## Parked

- `_components/AdminConfigurationJourney.tsx` + `AdminScreenRegistry.tsx` remain
  (used by `admin/layout` + `admin/templates`) — candidates when templates migrates.

## Blocked / open questions

- None. If the demo DB is reset, re-seed the risk row from the accepted config
  block in this record (same `on conflict do nothing` insert).

## Proposed commit

```
feat(admin-risk): rebuild the Risk Studio server-first, retire AdminDestinationFrame
```

## Next

T-172 — next admin/shared legacy route in the breadth sweep (templates /
bulk-violations / portal / cases / committee / incident-reports).
