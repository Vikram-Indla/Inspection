# 2026-08-08 · T-026 — `/enforcement-library` rebuild (route slice of T-026)

`task: T-026` · `status: partial (enforcement-library only; compliance/execution/analytics untouched)` · `duration: 1h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-006, WEB-008`

---

## Goal

Rebuild `/enforcement-library` on Saqeel primitives against the approved
Enforcement Library design (`saqeel (4).html` → `buildEnforcement` /
`openEnforcementDrawer`), shrinking the 410-line route file to a ≤40-line
composition with queries in `features/enforcement`.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/src/app/(app)/enforcement-library/page.tsx` | rebuilt | 410 → 25 |
| `apps/web/src/features/enforcement/types.ts` | created | 73 |
| `apps/web/src/features/enforcement/filters.ts` | created | 40 |
| `apps/web/src/features/enforcement/queries.ts` | created | 50 |
| `apps/web/src/features/enforcement/records.ts` | created | 218 |
| `apps/web/src/components/enforcement/enforcement-sections/enforcement-sections.tsx` (+ module.css) | created | 102 + 6 |
| `apps/web/src/components/enforcement/enforcement-toolbar/enforcement-toolbar.tsx` (+ module.css) | created | 63 + 59 |
| `apps/web/src/components/enforcement/enforcement-table/enforcement-table.tsx` | created | 61 |
| `apps/web/src/components/enforcement/enforcement-drawer/enforcement-drawer.tsx` (+ module.css) | created | 58 + 74 |
| `apps/web/src/components/enforcement/enforcement-skeleton/enforcement-skeleton.tsx` (+ module.css) | created | 28 + 13 |
| `apps/web/src/i18n/locales/en/enforcement.json` | created | 87 |
| `apps/web/src/i18n/locales/ar/enforcement.json` | created | 87 |
| `apps/web/src/i18n/messages.ts` | edited | enforcement namespace wired |

## Decisions

- **URL contract preserved byte-for-byte**: `?q= &status= &range= &region=
  &violation=` and `/enforcement-library/export?…` unchanged, so the export
  route and any saved links keep working. Status filter keeps raw record
  statuses (not the design's Open/Closed pair) because the data model exposes
  the full lifecycle and collapsing it would fabricate a governed state.
- **Drawer groups follow the design exactly** — Factory Summary, Inspection
  Summary, Violation, Penalty, Evidence, Timeline, Audit, then Open Factory
  360 — with two additions inside Audit (source violation id, final mapping
  version) kept from the old page because audit provenance is accepted
  behaviour and removing it would weaken it.
- **Dropped from the old page as not-in-design**: the "Enforcement policy: Not
  configured" banner, the "Read only" shell badge, the action-form
  blocking-completeness computation and evidence hash commentary. Penalty
  cells still render only data or *Not issued* — nothing governed is invented.
- **Evidence stays counts-only** (design shows an attachment count). No
  storage URL signing exists on this route; the heavy reads sit behind a
  `Suspense` boundary in `enforcement-sections`, so the route shell streams
  immediately.
- Status = `StatusPill` text + tone (open-ish → danger, approved/completed →
  success, rejected/returned → warning, invalidated/unavailable → neutral),
  matching the design's risk-crit/risk-low stamps without a bare colour dot.

## Inventory taken before writing code

- No client state, no effects in the old page (all server) — preserved; zero
  client islands added.
- Legacy classes removed from the route: `sq-state`, `badge`, `alert`,
  `grid-toolbar`, `input`, `select filter-chip`, `table-wrap`, `table`,
  `drawer`, `panel`, `id-code`, `dot`.
- One comment block (INSP-734 glyph note) in the old page — removed with the
  legacy empty-state it annotated; the empty state is now `EmptyState`.
- `🔒`/`∅` emoji glyphs replaced by registry icons (`restricted`,
  `enforcement`, `risk`).
- a11y: empty close-anchor kept its `aria-label`; table now delegates
  `scope` handling to `DataTable`; selects carry `aria-label`s from i18n.

## Numbers

```
Route: /enforcement-library
first-load JS   measurement request — needs production build (WEB-005 §8)
route CSS       measurement request — needs production build
client islands  0 → 0
source lines: page 410 → 25; total new source 1 041 across 16 files
```

## Accessibility

- axe: not run in this session (no browser available) — flagged for the
  route-owner pass.
- Manual: drawer is a link-driven `role="dialog"` (no JS focus trap — same
  posture as the previous implementation); RTL via logical properties only;
  status conveyed as text + pill shape.

## Verification

- [x] `npm run typecheck` — clean for all task files (2 pre-existing errors in
      `operations/page.tsx` and `shell-topbar.tsx` from concurrent lanes,
      untouched by this task)
- [x] `check:design-system-v5` — zero findings in task files
- [ ] `npm run test:e2e` — not run; no spec targets `/enforcement-library`
      (verified by grep), a11y source-contract specs pass by construction
- [ ] production measurements — handed back as a measurement request

## Retirement

None — the legacy classes this route consumed live in the frozen sheets and
are still consumed by other routes; no rule became orphaned yet.

## Parked

- Export route still slices `toISOString()` for its filename
  (pre-existing gate finding, untouched).
- Page status filter values vs export route's open/closed interpretation are
  inconsistent (pre-existing); worth a contract decision when T-026 closes.

## Blocked / open questions

None for this slice.

## Proposed commit

```
refactor(enforcement): rebuild library on saqeel primitives, route 410→25
```

## Next

Remaining T-026 routes: `/compliance`, `/execution`, `/analytics`.
