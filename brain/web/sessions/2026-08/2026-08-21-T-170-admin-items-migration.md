# 2026-08-21 · T-170 — `/admin/items` Inspection Item Catalogue rebuilt on SAQEEL

`task: T-170` · `status: done` · `duration: ~4h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-013, WEB-014, WEB-015`

---

## Goal

Rebuild `/admin/items` (CD-007 / SCR-ADM-020) — the semantic item catalogue plus
the read-only runtime-preview strip — on the SAQEEL page/feature/section split,
off the frozen `.sq-*` sheets and the legacy `t()`/ui_strings copy path.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/app/(app)/admin/items/page.tsx` | rebuilt thin route | 360 → 32 |
| `src/app/(app)/admin/items/Controls.tsx` | deleted | 306 → 0 |
| `src/features/admin-items/queries.ts` | created (`loadAdminItems`, usage + audit + `display_names` actor resolution) | → 144 |
| `src/features/admin-items/types.ts` | created | → 59 |
| `src/components/sections/admin-items/items-screen.tsx` | created (catalogue `DataTable`, governance region, nav, sections) | → 157 |
| `src/components/sections/admin-items/item-forms.tsx` | created (`"use client"` — new/edit/toggle) | → 107 |
| `src/components/sections/admin-items/item-preview.tsx` | created (`"use client"` — read-only projection) | → 85 |
| `src/components/sections/admin-items/admin-items.module.css` | created | → 118 |
| `src/i18n/locales/en/admin-items.json` | created (`adminItems` namespace, ~100 keys) | → 90 |
| `src/i18n/locales/ar/admin-items.json` | created (Arabic parity) | → 90 |
| `src/i18n/messages.ts` | registered `adminItems` namespace | +7 |
| `e2e/cd-007-items.spec.ts` | re-pointed to feature/section split, role/text selectors | 113 changed |
| `e2e/compliance-library.spec.ts` | re-pointed items → screen + JSON; regulations copy → `en/regulations.json`; handoff → governance-notice | 28 changed |
| `e2e/neutral-error-sweep.spec.ts` | items → `queries.ts`+screen; violations → enforcement `catalogue.ts` | 24 changed |
| `e2e/admin-development-closure-contract.spec.ts` | guards → `features/{regulations/access,admin-packages/queries,enforcement/catalogue,admin-items/queries}.ts` | 8 changed |
| `e2e/cd-006-011-backend-completion.spec.ts` | dropped migrated items page + Controls from the `t()`/ui_strings list | 1 changed |

## Decisions

- **Actor ids are resolved to names, never rendered raw.** The audit feed runs
  every `actor` uuid through the `display_names` SECURITY DEFINER RPC (RLS blocks
  admin reading `profiles` directly). This is now a binding rule —
  [[never-show-raw-ids]]. Absent name renders as a governed state, not the uuid.
- **Item titles/codes/guidance are stored data, not copy.** They stay as-is (e.g.
  `EG-201`, `V-FS-01`) — business codes wrapped in `<bdi dir="ltr">`, not raw
  ids and not i18n keys. Only chrome, enum labels, and states are namespaced.
- **The library nav lives on the items screen**, with an i18n accessible name
  (`aria-label={strings.title}`). The regulations rebuild (below) removed the old
  literal `aria-label="Inspection Rules"` nav from regulations; regulations
  authoring is now request-only via the governance notice.
- **Enforcement's neutral-error mechanism differs from items'.** Items logs
  `logProviderError` + renders `strings.error.body`; the enforcement (violation)
  catalogue reduces provider failure to a governed boolean (`catalogueReadable`)
  and renders `strings.degradedBody`. Both satisfy "no raw provider text"; the
  neutral-error contract asserts each on its own terms.
- **Toggle knob is dark on the lime track** (`saqeel-components.css`
  `.switch input:checked::after { background: var(--text-on-action) }`) — a white
  knob on lime read as broken.

## Inventory taken before writing code

- state/effects: create/edit/toggle were client-form state; kept as three small
  `"use client"` leaves (`item-forms`), the rest server-rendered. No `useEffect`.
- literals → tokens: all spacing/radius/surface on `var(--sqx-*)` in the module;
  zero hex/px in feature CSS.
- `<svg>` → semantic icons: `risk` (legacy notice), `reveal`/`search` via registry.
- a11y found: catalogue was a `.sq-*` div grid, not a table → rebuilt as a true
  `DataTable` (`<th scope="col">`, 8 columns); governance block became a named
  region (`labelledBy`); status became `StatusPill` (dot + text label).

## Numbers

```
Route: /admin/items
page.tsx        360 → 32 lines
Controls.tsx    306 → 0 (deleted)
new feature/section/CSS: 670 lines (queries 144, types 59, screen 157,
  forms 107, preview 85, module 118)
i18n:           new adminItems namespace, EN 90 + AR 90 (was t()/ui_strings)
client islands: monolithic Controls → 3 leaf forms
lint:           −353 (ratchet held)
typography:     −220 (ratchet held)
(production first-load JS / LCP / INP measurements: handed back as a
 measurement request per WEB-005 §8 — never run locally)
```

## Accessibility

- axe: not run in-browser (auth-gated e2e + browser spawn blocked on this
  Windows host — `spawn UNKNOWN`). Verified by source contract + live render.
- Manual checklist (WEB-003 §10): keyboard (native table + Button/Select focus) ·
  Arabic/RTL (verified live — logical properties throughout, `<bdi dir="ltr">`
  on codes) · dark + light (verified live) · 44px touch targets (`.editSummary`
  `min-block-size: 2.75rem`). 200% zoom / greyscale / reduced-motion: source-level
  only (no overflow, no colour-only status).

## Verification

- [x] `npm run typecheck` — 0
- [x] `npm run lint` — 0, −353
- [x] `npm run gates:typography` — PASSED, −220
- [x] static contract suite (`playwright.static.config.ts`) — **408 passed / 0 failed**
- [ ] `npm run test:e2e` (browser) — BLOCKED, browser won't spawn on this host
- [x] Live render as Admin, EN + AR/RTL (catalogue, runtime preview, forms)
- [~] `check:design-system-v5` — 1 failure in `src/lib/analytics/query-state.ts:18`,
  **pre-existing** (committed `bbc4a602 feat(demo)`, untouched here, red at HEAD;
  an `<input type=date>` value-wiring case). Flagged to the human — not this task.

## Retirement

`Controls.tsx` (306 lines) deleted — the last client-monolith on `/admin/items`.
Legacy `t("admin.items.*")`/ui_strings keys for this screen retired in favour of
the `adminItems` JSON namespace.

## Parked

- `src/lib/analytics/query-state.ts:18` utc-slice → `lib/dates.ts` or v5 allowlist
  (owner: the `bbc4a602` demo-dataset commit, not admin-items).

## Blocked / open questions

- Browser e2e (`spawn UNKNOWN`) remains unrunnable locally — CD-007's live legs
  are source-verified + hand-verified via the dev-server preview only.

## Discovered during re-point (not this task, flagged)

Three contract specs were **already red at HEAD** because concurrent committed
migrations left them stale: regulations (`ba382425`/`3f394e95`), packages, and
violations→enforcement (`bbc4a602`) all moved their role guards / copy into
`features/*` without re-pointing the specs. Chased each to its new home so the
static suite is green again.

## Proposed commit

```
feat(admin-items): rebuild the item catalogue server-first on SAQEEL
```

(Already committed by the human as `6d142b6d`.)

## Next

T-171 — next unblocked legacy surface in the overnight demo sweep.
