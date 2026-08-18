# 2026-08-18 · T-153 — `/admin/planning/status` (read-only) rebuilt on SAQEEL

`task: T-153` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-002, WEB-003, WEB-013, WEB-014`

---

## Goal

Design-critique transform of `/admin/planning/status` — the **read-only** view of
the published visit-lifecycle rules (states, transitions) and the planning
capabilities. The owner approved the P0/P1 critique + widget mockup. Simpler than
lookups: read-only, so no editor, no server actions.

## What was wrong (P0/P1)

- **P0-1** English-only: `t(key,"English")` with no `ar` file; `CAPABILITY_MAP`,
  `STATE_LABELS`, the `"Read only"` badge, and the fallback all hardcoded English.
- **P0-2** 100 % raw HTML: two `<table className="table">`, `badge`/`alert`/
  `panel`/`t-caption`, inline `style={{ padding: "var(--space-6)" }}`,
  `<h2 style=…>`.
- **P0-3** not responsive: a 6-column transitions table + a 2-col capabilities
  table, no mobile strategy.
- **P0-4** no `loading.tsx`/`error.tsx`; fallback/source as raw `alert` divs;
  "Read only" a hardcoded Shell badge.
- **P1-1** raw `new Date(…).toLocaleDateString()` instead of `formatDate`.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/admin/planning/status/page.tsx` | rebuilt as a route file | 173 → **11** |
| `app/(app)/admin/planning/status/loading.tsx` | created — skeleton | 8 |
| `app/(app)/admin/planning/status/error.tsx` | created — `RouteError` | 29 |
| `features/admin-planning-status/queries.ts` | created — published-config read + fallback | 58 |
| `features/admin-planning-status/data.ts` | created — structural constants (states/transitions/capability keys) | 27 |
| `components/sections/admin-planning-status/status-screen.tsx` | created (server) | 95 |
| `…/transitions-table.tsx` | created (server) — responsive `DataTable` | 67 |
| `…/status-skeleton.tsx` | created | 16 |
| `…/status-screen.module.css` | created — token-only | 27 |
| `i18n/locales/{en,ar}/admin-planning-status.json` | created — new namespace | ~80 each |
| `i18n/messages.ts` | registered `adminPlanningStatus` | +4 |

## Decisions

**Server-only, no client islands.** The screen is a pure read-only projection —
`status-screen` + `transitions-table` + `DefinitionList` capabilities are all
Server Components. No `"use client"`, no actions.

**Mirrored the `expiry`/`lookups` siblings.** `ShellPageFrame` (consumed, shell
untouched) with the read-only `StatusPill` in its `actions` slot; governance a
`Card` (role note) with a `Button variant="link"` to `/admin/workflows`;
source-line via `formatDate`; the unpublished/read-failed fallback a
`Card`+`StatusPill` (warning) carrying the honest "standard reference" copy.

**Data + i18n split.** Structural constants (`FALLBACK_STATES`,
`FALLBACK_TRANSITIONS` with `id`/`from`/`to`/`actor`, `PLANNING_CAPABILITIES`
keys) live in `features/.../data.ts`; every label lives in the bilingual
namespace. State/actor labels resolve `copy.states[key] ?? humaniseEnum(key,
locale)` (the reusable helper). Fallback transition guards are keyed by
transition id in the namespace; **live payload `guard`/`side_effects` render
verbatim** — they are the published config's own governed data, not ours to
translate.

**No `Tabs`.** Unlike lookups, these are three reference sections scanned
top-to-bottom (stages → transitions → capabilities); tabs would hide content, so
they stay stacked. Transitions → responsive `DataTable` (stacks to cards);
capabilities → `DefinitionList columns="two"`; states → token chips with
`StatusPill`-style styling.

**No regression + governance contracts.** The `config_versions` (engine=workflow,
latest published) read and the honest labelled fallback to `visit-lifecycle-v4`
are preserved. The browser contracts **CD-044** (governance heading / read-only /
`Open workflow configuration` → `/admin/workflows` / published-or-unpublished-
notice) and **CD-045** (uses the page only as a launch point for the
Notifications bell) are satisfied by the new copy/roles — verified by reading the
specs (they run in the full browser e2e, not `test:static`).

## Accessibility

- `h1` (ShellPageFrame) → `h2` per section and per card header; read-only state a
  `StatusPill` in the header actions; transitions a `DataTable` that stacks to
  labelled cards on mobile; capabilities a real `<dl>` (`DefinitionList`). Arabic
  content carries `dir="auto"`. Dates via `formatDate` (Asia/Riyadh, localized).
- **Live render owed** — `/admin/planning/status` needs the admin persona; this
  session is an inspector/planner. axe / light / 200 % zoom / Arabic still owed.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — PASSED (relocked 1217 → 1213)
- [x] `npm run gates:date-inputs` — PASSED (19 unchanged)
- [x] `npm run check:design-system-v5` — **64** unchanged; adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] CD-044 / CD-045 / shell-navigation assertions read and confirmed satisfied
- [x] **live render (admin persona) — EN / dark AND Arabic / RTL** — browser-verified
      in the fallback state: governance card, reference notice, state chips,
      transitions table, capabilities list all render correctly; Arabic fully
      translated + mirrored, fallback guards resolved from the `ar` file, the
      dedup holds in both locales
- [ ] axe scan / light theme / 200 % zoom — owed

## Post-render fix

The owner's live look caught a **duplicate label**: the transitions section
`<Heading>` and the `DataTable`'s visible `<caption>` both rendered "How a visit
moves between stages". The migrated convention (`regulation-items`) uses the
`DataTable` `caption` as the label with no separate heading, but this screen's
three sections (states chips / transitions / capabilities list) each need a
consistent `<h2>`, and only the table carries a built-in caption. Fix: keep the
section `<Heading>` on all three, drop the `DataTable caption` — one bold `h2`
label per section, no duplication. Re-verified in the pane.

## Parked

- Live admin-persona render + axe/light/zoom/Arabic pass.

## Proposed commit

```
feat(admin): rebuild planning status rules on saqeel primitives
```

## Next

The remaining planning-admin surfaces, or roll `Tabs` out to hardcoded tab rows.
