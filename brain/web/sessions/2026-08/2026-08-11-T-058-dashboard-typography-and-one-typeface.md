# 2026-08-11 · T-058 — `/dashboard`: one typeface, title above subtitle

`task: T-058` · `status: partial (authenticated screen not viewed)` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011, WEB-014`

---

## Goal

First screen of the screen-by-screen typography migration. Owner ruling: the
card title always renders **above** the subtitle, and is always the larger and
whiter of the two. Plus: one typeface across the whole application, no others.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/src/app/saqeel.css` | `--sqx-font-sans` repointed at the loaded face; `--sqx-font-mono` aliased to it; `font-family` set on `:root` | 971 → 975 |
| `dashboard/metric-card/metric-card.tsx` | `eyebrow` → `description` | 62 → 62 |
| `dashboard/metric-card/metric-card.module.css` | `caption` → `body` | 82 → 82 |
| `dashboard/role-summary/role-summary.tsx` | `eyebrow` → `description` | 34 → 34 |
| `dashboard/metric-strip/metric-strip.module.css` | `overline` → `label`; `caption` → `body` | 27 → 26 |
| `dashboard/executive-brief/executive-brief.module.css` | 2 × `caption` → `body` | 27 → 27 |
| `dashboard/strategic-view/strategic-view.module.css` | `caption` → `body` | 11 → 11 |
| `dashboard/compliance-explorer/compliance-explorer.module.css` | `caption` → `body` | — |
| `dashboard/dashboard-toolbar/dashboard-toolbar.module.css` | `caption` → `body` | — |
| `dashboard/enforcement-trend/enforcement-trend.module.css` | 2 × `caption` → `body` | — |
| `dashboard/explain-panel/explain-panel.module.css` | 2 × `caption` → `body`; `code` → `mono` | — |
| `dashboard/operational-view/operational-view.module.css` | `caption` → `body` | — |
| `apps/web/scripts/check-typography.mjs` | 2 new rules + file-scoped matching | 173 → 196 |
| `apps/web/scripts/typography-baseline.json` | re-levelled | 382 → 384 entries |
| `brain/web/rules/WEB-014-typography-contract.md` | §2.0 one-typeface law; §5 slot order inverted; §5.1, §5.2 added | 233 → 300 |

## Decisions

**The font stack was broken, and that mattered more than any size.** The owner
asked for "the same fonts throughout — no other fonts". Measurement showed the
app rendering **four typefaces simultaneously**:

| Stack | Actually rendered | Elements |
| --- | --- | --- |
| `--sqx-font-sans` | **Segoe UI** | 224 |
| `--font-plex-arabic` | IBM Plex Sans Arabic | 209 |
| unstyled | **Times New Roman** | 4 |
| `--sqx-font-mono` | **Consolas** | mono sites |

`--sqx-font-sans` read `"Readex Pro", "IBM Plex Sans Arabic", system-ui,
sans-serif` and **neither named family was ever loaded** — `next/font/local`
registers a *scoped* family (`plexArabic`), which the token never referenced. So
every token-styled element silently fell through to `system-ui`. This is the
worst class of design-system bug: CSS raises no error for a missing family, it
just renders something else, and a reviewer reading the token sees a correct
stack. Fixed by pointing the token at `var(--font-plex-arabic)`, aliasing
`--sqx-font-mono` to it, and declaring `font-family` on `:root` so nothing
inherits the UA serif default. **Verified by canvas metrics, not by reading the
stack** — the measurement recipe is now in WEB-014 §2.0.

**Mono is no longer a separate typeface (owner ruling).** JetBrains Mono was
never loaded anyway. The `mono` role survives as 13px Plex at weight 500 with
tabular numerals — identifiers still align in columns without a second face.

**Slot order inverted (owner ruling), superseding WEB-014 §5 as written in
T-057.** Title first, always larger and `--sqx-text-primary`; description
second, `body` and `--sqx-text-secondary`. The `eyebrow` prop now renders the
pattern the owner rejected — a long question in 11px uppercase grey, read before
the title — so §5.1 marks it retiring and the gate blocks new uses. It stays on
`CardHeader` only so the 24 unmigrated call sites keep compiling.

**KPI tiles are exempt, and this is deliberate (owner-confirmed).** A tile whose
subject is a number is **label → value**, not title → subtitle. Promoting
"Visit pipeline" above 217 in size would demote the number the tile exists to
show. Recorded as WEB-014 §5.2 so a future agent does not "fix" it. The label
moved 11px uppercase `overline` → 12px `label`, which is a legibility gain
without changing the hierarchy.

**`dashboard.module.css` was NOT migrated — it is dead.** 318 lines holding the
worst literals on the route (`52px`, `42px`, `34px`, `22px`, `18px`, `13px`) and
still on the pre-Saqeel `--type-*` token set. It is imported only by
`DashboardView.tsx`, `DecisionCanvas.tsx`, `RegionalScope.tsx` and
`BasisDrawer.tsx`; `DashboardView` is the root of that tree and **nothing
imports it**. `page.tsx` renders `DashboardSections` only. Migrating it would
have been the single largest chunk of work on this task and would have produced
no rendered change. Routed to retirement instead.

## Inventory taken before writing code

Presented to the owner and confirmed before any edit (WEB-008).

- **Three distinct card shapes** found on the route, not one: `MetricCard`
  (question above title), `RoleSummary` (kicker above persona), `MetricStrip`
  (label above value). The owner's rule could not apply identically to all three
  — confirmed the split before writing.
- **Fonts measured, not read** — four typefaces, per the table above.
- **i18n** — zero new keys. `dashboard.national.*.question` and
  `dashboard.yourWork.eyebrow` already exist in both locales and simply moved
  slot. Arabic checked (`عملك`).
- **State and effects** — none added. `metric-strip` was already `"use client"`
  for `useExplain`; every other file touched stays a Server Component.
- **`<svg>`** — none.
- **Dead code** — the `DashboardView` tree, established by import-graph walk.

## Numbers

```
Route: /dashboard  (login page used as proxy — see Verification)
typefaces rendered        4 → 1
distinct font sizes       8 → 5   (16 · 14 · 12 · 11 · 10)
typography violations   1,140 → 1,130   (-10, baseline re-levelled)
retired-role refs in components/dashboard/   10 → 0
new i18n keys              0
new client islands         0
dead CSS identified for retirement:  318 lines (dashboard.module.css)
```

Bundle numbers not taken — no route or client-JS change, and a production build
is the human's (WEB-005 §8). **Measurement request:** first-load JS and LCP on
`/dashboard`, before/after, to confirm dropping the phantom `Readex Pro` and
`JetBrains Mono` entries changes nothing (it should not — neither was fetched).

## Accessibility

- **axe:** not run — needs the production build and a session. **Owed.**
- Manual checklist (WEB-003 §10):
  - keyboard — no interactive element changed
  - screen reader — moving a string from `eyebrow` to `description` does not
    change the accessible name; `CardHeader` still renders the title as the real
    `h2`/`h3` and `titleId`/`labelledBy` wiring is untouched
  - 200% zoom — scale is `rem`-based throughout
  - 320px — **not verified. Owed.**
  - Arabic/RTL — no logical-property change; `عملك` reads correctly as a
    description. **Still blocked by the parked `lang="en"` finding.**
  - dark / reduced motion / greyscale — unaffected
- **Net gains:** smallest text on the route rose 11px → 12px (`MetricStrip`
  label), and every explanatory paragraph rose 11.5px → 14px.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 1,130 known, 0 new
- [x] New gate rules proven to fire — `card-eyebrow-above-title` initially
      matched **0 of 24** real call sites because the pattern was line-scoped and
      every real `<CardHeader>` spans multiple JSX lines. Added `fileMust` and
      it then found all 24. **A gate that silently matches nothing is worse than
      no gate**; always confirm a new rule fires before trusting a pass.
- [x] **One typeface confirmed in the browser** — every rendered family resolves
      to `plexArabic` by canvas measurement (399.73px vs Segoe UI's 385.95px).
- [x] Distinct sizes on the rendered page: 8 → 5.
- [ ] `npm run lint` — script still does not exist (parked)
- [ ] `npm run gates` — still fails on the pre-existing
      `check:design-system-v5` date rules (parked, not introduced here)
- [ ] **Authenticated `/dashboard` never viewed** — sign-in needs credentials
      the agent does not enter. Everything above was measured on `/en/login`,
      which exercises the same tokens but not the cards. **Owed: owner to
      confirm the National performance and Your work cards now read
      title-then-subtitle.**
- [ ] Definition of Done (WEB-006 §5) — not fully ticked; axe, 320px and the
      authenticated pass are owed.

## Retirement

**New retirement candidate — the orphaned dashboard tree.** `DashboardView.tsx`,
`DecisionCanvas.tsx`, `RegionalScope.tsx`, `BasisDrawer.tsx` and
`dashboard.module.css` under `src/app/(app)/dashboard/`. Zero inbound imports;
the route renders `DashboardSections`. Not deleted here — deletion is its own
task under WEB-006 §4, and the owner has a demo in flight. `@retiring` banners
not added: these are route-adjacent files, not design-system components, and
WEB-006 §4's banner is regex-locked to the latter.

**`CardHeader.eyebrow`** is retiring — 24 call sites remain, enforced down by the
`card-eyebrow-above-title` gate rule. The prop is deleted when the count hits 0.

## Parked

- The orphaned `DashboardView` tree (above), added to the tracker.
- `dashboard.yourWork.eyebrow` is now a misnamed i18n key — it renders as a
  description. Renaming touches both locales and one call site; deferred rather
  than done mid-task.

## Blockers

None.
