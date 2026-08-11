# 2026-08-11 · T-053 — `/planning` null vocabulary, dead tiles, duplicate entry points

`task: T-053` · `status: partial` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-006 §4, WEB-009, WEB-011, WEB-013`

---

## Goal

Stop `/planning` reporting "No visits match" inside cells of rows that matched,
and remove the surfaces that duplicate one another or can never hold a value.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `features/planning/view.ts` | rebuilt null vocabulary | 81 → 79 |
| `components/planning/planning-buckets/planning-buckets.tsx` | rebuilt on `StatCard` + `CardGrid` | 63 → 46 |
| `components/planning/planning-buckets/planning-buckets.module.css` | deleted | 72 → 0 |
| `components/planning/planning-assistant/planning-assistant.tsx` | rebuilt as advisory strip | 80 → 24 |
| `components/planning/planning-assistant/planning-assistant.module.css` | rebuilt | 96 → 40 |
| `components/planning/planning-screen/planning-screen.tsx` | rewired strings, dropped `canCreate` | 164 → 160 |
| `components/planning/planning-visit-table/planning-visit-table.tsx` | 13 → 10 columns | 115 → 112 |
| `components/planning/planning-drafts/planning-drafts.tsx` | `empty` → `noValue`; discard cell → `null` | 82 → 82 |
| `components/sections/planning/planning-skeleton/planning-skeleton.tsx` | column/tile counts corrected | 125 → 89 |
| `app/(app)/planning/page.tsx` | dropped `canCreate` pass-through | 39 → 39 |
| `i18n/locales/{en,ar}/planning.json` | `table.noValue`, `table.notConfigured`, `assistant.stripTitle`, `buckets.activeNote`; 4 dead bucket keys removed | +6 / −4 keys each |

Net **−243 lines**.

## Decisions

**`table.empty` is an empty-state sentence and must never be a cell placeholder.**
`view.ts` bound `const dash = labels.empty` — the identifier said dash, the value
said "No visits match". Split into two governed words, per WEB-009 §"absent data
renders as a state":

- `table.noValue` = "Not assigned" / "غير مُسند" — a row field that is genuinely
  nullable (inspector, priority, last updated, draft author).
- `table.notConfigured` = "Not configured" / "غير مُهيَّأ" — a field with no data
  source wired at all (authority, risk).

The owner chose "Not assigned" over an em-dash. Do not re-litigate.

**`aiScore` removed from `PlanningVisitView` entirely** — it had exactly one
consumer, the column deleted here. `authority` and `risk` are *kept* on the view
model because `visit-drawer.tsx` renders both; they now read "Not configured"
there instead of contradicting the row.

**Discard cell renders `null`, not a placeholder.** "Not assigned" would be a
lie: the action is absent because the draft belongs to someone else, not because
a value is missing.

**Four buckets were deleted, not fixed.** `needsPlanning`, `highRisk`,
`expiring`, `aiSuggested` were hardcoded `count: null, href: null` — no data
source exists. Their i18n keys were removed from `buckets` in both locales
(`stats.*` still carries them for the unused sections tree).

## Inventory taken before writing code

- **State/effects:** none added or moved. `PlanningVisitTable` keeps its two
  `useState` islands (`selected`, `openId`) — both are genuine uncontrolled UI
  state at the correct ladder rung. `PlanningAssistant` and `PlanningBuckets`
  are now server components with zero state.
- **Literals → tokens:** no new literals. The rewritten
  `planning-assistant.module.css` is 100% `var(--sqx-*)`; the deleted
  `planning-buckets.module.css` was already token-clean and was removed because
  `StatCard` supersedes it, not because it violated anything.
- **`<svg>`:** none introduced. The strip keeps `Icon name="ai"` from the
  registry.
- **Accessibility failures found in existing markup:**
  1. `"No visits match"` announced 5× per matching row — resolved.
  2. `buckets.notConfigured` reachable only through `title=` (not announced by
     most screen readers, invisible on touch) — the string is now the visible
     value and `title` is gone.
  3. Skeleton declared 7 table columns against 13 rendered — layout shift on
     every load. Corrected to 11 (10 data + selection).

## Numbers

```
Route: /planning
first-load JS   ___ KB → ___ KB     MEASUREMENT REQUEST (WEB-005 §8)
route CSS       ___ KB → ___ KB     MEASUREMENT REQUEST
LCP (4G, mid)   ___ s  → ___ s      MEASUREMENT REQUEST
INP             ___ ms → ___ ms     MEASUREMENT REQUEST
CLS             ____   → ____       MEASUREMENT REQUEST — expected to improve;
                                    skeleton/table column mismatch was 7 vs 13
client islands  2      → 2          (visit table, discard button) — unchanged
legacy CSS deleted: 72 lines (planning-buckets.module.css)
source lines removed: 243 net
```

Production build is the human's to run (WEB-005 §8). No figure is invented here.

## Accessibility

- axe violations: **not run** — the route requires an authenticated
  `business_staff` session; `curl` to the running dev server returns 307.
- Manual checklist (WEB-003 §10): **not performed.** keyboard · screen reader ·
  200% zoom · 320 px · Arabic/RTL · dark · reduced motion · greyscale all owed.
- Found and fixed by construction: the three failures listed under Inventory.

## Verification

- [x] `npm run typecheck` — exit 0
- [ ] `npm run lint` — **script does not exist in this repo**
- [ ] `npm run gates` — **script does not exist in this repo**
- [x] `npm run check:design-system-v5` — exits 1 on **60 pre-existing findings**
      in unrelated files; **zero** in any file touched here
- [ ] `npm run test:e2e` — not run
- [ ] Definition of Done (WEB-006 §5) — **not fully ticked**; browser pass owed

## Retirement

- `planning-buckets.module.css` **deleted** — zero importers after the `StatCard`
  rebuild.
- No `@retiring` banner needed: nothing was superseded while still imported.

## Parked

Copy into the tracker's PARKED section:

1. **`components/sections/planning/*` is a dead parallel tree.** Only
   `planning-skeleton` is a value import. `planning-insights`,
   `planning-recommendations`, `planning-quick-actions`, `planning-stat-cards`,
   `planning-visit-table`, `planning-filter-bar`, `planning-ai-advisory` render
   nowhere. `features/planning/assistant-view.ts` is imported solely by one of
   them — fully orphaned. Needs a retire-or-adopt ruling.
2. **`authority` and `risk` have no data source.** They now say "Not configured"
   in the drawer. Wiring them is a contract question, not a UI one.
3. **58 Arabic strings from T-052 still need native review** (carried forward).

## Blocked / open questions

- **Native Arabic review** of the 4 strings authored here: `غير مُسند`,
  `غير مُهيَّأ`, `رؤى وتوصيات الذكاء الاصطناعي`, `يُصفّي القائمة`.
- **`npm run lint` / `npm run gates` do not exist.** `CLAUDE.md` and this
  template both require them. Either the scripts need adding to
  `apps/web/package.json` or the rulebook needs correcting.
- This task was worked while T-052's `/planning/immediate` changes sat
  uncommitted in the tree, at the owner's explicit instruction after the
  one-task-at-a-time conflict was raised twice. Those files were not touched.

## Proposed commit

```
fix(planning): separate null-value copy from the empty-list state
```

## Next

Browser pass on `/planning` with a seeded `business_staff` account — light/dark,
EN/AR, 320 px — then axe. Belongs to T-053 until its Definition of Done closes.
