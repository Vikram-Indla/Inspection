# 2026-08-18 · T-152 — `/admin/planning/lookups` rebuilt on SAQEEL + a reusable `Tabs` primitive

`task: T-152` · `status: done` · `duration: ~3h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014`
`component added: Tabs (components/saqeel/tabs/)`

---

## Goal

Design-critique-driven transform of the legacy `/admin/planning/lookups` admin
(the governed reference-data editor). The owner flagged: clutter, raw inputs/
labels, no design components, no responsiveness, legacy loading + permission
gate, and broken Arabic. Approved the redesign **with a recommendation**: the
kind selector should be **tabs, not buttons**, with first-letter capitalization
via a **reusable function** (not inline). The DS had no tabs primitive, so the
owner approved building one: *"Create a reusable tab component and use it here —
we will later use it everywhere we have hardcoded tabs."*

## The new primitive — `Tabs`

`components/saqeel/tabs/{tabs.tsx, tabs.module.css}` — a real
`role="tablist"` / `role="tab"` / tabpanel selector:
- roving `tabIndex` (selected = 0, rest = -1); arrow-key + Home/End navigation on
  the focused tab (keydown on the buttons, not the container, so it's
  focus-correct for `jsx-a11y`);
- `tabPanelProps(idBase, activeValue)` helper returns `{ role, id,
  aria-labelledby, tabIndex }` for the caller's panel, wiring `aria-controls` ↔
  `aria-labelledby` without exposing ids;
- underline-active in the Linear language, horizontal-scroll on overflow, RTL via
  the shared `--sqx-mirror` convention; optional per-tab `count` and `lang`.
- API mirrors `SegmentedControl` (`items` / `value` / `onChange` / `label`) so
  it's a drop-in for the many hardcoded tab rows across the app.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/saqeel/tabs/tabs.tsx` + `.module.css` | **created** — reusable tabs primitive | 107 + 60 |
| `app/(app)/admin/planning/lookups/page.tsx` | rebuilt as a route file | 77 → **11** |
| `app/(app)/admin/planning/lookups/loading.tsx` | created — skeleton | 8 |
| `app/(app)/admin/planning/lookups/error.tsx` | created — `RouteError` | 29 |
| `app/(app)/admin/planning/lookups/actions.ts` | localized (kept logic) | 130 → 122 |
| `app/(app)/admin/planning/lookups/constants.ts` | comment stripped | 11 → 8 |
| `features/admin-planning-lookups/queries.ts` | created — load + gate | 56 |
| `components/sections/admin-planning-lookups/lookups-screen.tsx` | created (server) | 74 |
| `…/lookups-manager.tsx` | created (client) — tabs + panel state | 69 |
| `…/lookups-editor.tsx` | created (client) — one add/edit surface | 127 |
| `…/lookups-table.tsx` | created (client) — responsive `DataTable` | 134 |
| `…/lookups-skeleton.tsx` | created | 16 |
| `…/lookups-screen.module.css` | created — token-only | 129 |
| `i18n/locales/{en,ar}/admin-planning-lookups.json` | created — new namespace | 90 each |
| `i18n/messages.ts` | registered `adminPlanningLookups` | +4 |
| `app/(app)/admin/planning/lookups/LookupsAdmin.tsx` | **deleted** | 160 → 0 |

## Decisions

**Mirrored the migrated `expiry` sibling exactly.** `ShellPageFrame` (consumed,
shell untouched) + governance / read-only / error `Card` notices with
`StatusPill`, all data-driven from `canConfigure` / `readFailed` — the P0-4
legacy-gate/loading fix. `loading.tsx` → `lookups-skeleton`, `error.tsx` →
`RouteError`.

**One editor surface (P1-1 clutter).** The legacy `LookupForm` rendered as a
persistent add-form **and** an inline edit-form nested inside a table `<td>`. Now
a single `lookups-editor`: add mode by default, "Edit" opens it pre-filled
(`key` on the row id remounts it), never a form in a cell. Raw-JSON metadata moved
behind a native `<details>` **Advanced** disclosure; flags became a `Choice`
checkbox set; status a `StatusPill`; flags readable chips.

**Kind selector = `Tabs`, labels via the reusable helper.** The owner's
recommendation: `copy.kinds[kind] ?? humaniseEnum(kind, locale)` — the translated
label from the `en`/`ar` JSON, falling back to `humaniseEnum` from `lib/text.ts`
(first-letter capitalized, underscores → spaces). Not inline, and **not** the
`titleCase` in `features/factories/` (the concurrent agent's file — wrong
dependency).

**Arabic fixed end to end (P0-1).** The legacy screen was `t(key, "English")` with
no `ar` file — English-only in Arabic. New `adminPlanningLookups` namespace in
both locales covers every string, and `actions.ts` now resolves `getLocale()` +
`getMessages(...).adminPlanningLookups.actions` with `fill(...)` for the
`{kind}.{key}` interpolation, so ok/error toasts are bilingual too.

**No regression.** Every branch of `actions.ts` (capability gate, `buildMetadata`
guided-flags + raw-JSON-replace, unique-key 23505 handling, never-delete /
`is_active` toggle, `revalidatePath`) is byte-for-byte identical — only the
message strings moved to i18n. `constants.ts` (`LOOKUP_KINDS`,
`KNOWN_METADATA_FLAGS`) unchanged.

## Inventory taken before writing code

- Read the full route (`page`/`LookupsAdmin`/`actions`/`constants`), the migrated
  `expiry` sibling (the template), and a full DS survey (subagent) of data-table /
  form / chrome components + gaps.
- **State:** manager holds `kind` (tab) + `editingId`; editor + table are client
  islands calling the existing server actions via `FormData` + `useTransition`.
- **Copy:** ~40 `t(key, en)` sites (page) + inline English (actions) → the new
  bilingual namespace.
- **Raw HTML → components:** `<select>`/`<input>`/`<label>`/`<table>`/checkboxes/
  `sq-btn`/`sq-lozenge`/`sq-banner`/`t-caption`/inline-style literals → `Field`/
  `TextInput`/`SaqeelSelect`/`Choice`/`DataTable`/`StatusPill`/`Button`/`Tabs`.
- **A11y found:** kind buttons in a `sq-kpi-row` (not tabs); form nested in a
  table cell; status as a lozenge; no empty state. All fixed.

## Numbers

```
Route: /admin/planning/lookups
route file            77 → 11
components ≤ 200      max 134 (lookups-table); Tabs primitive 107
new DS primitive      Tabs (tablist/tab/tabpanel, roving focus)
raw HTML controls     select/input/label/table/checkbox → 0
duplicated editors    2 (add + edit-in-cell) → 1
hardcoded copy        ~40 t() + inline action strings → 0 (bilingual namespace)
Arabic                English-only → full ar namespace + localized actions
typography gate       7 owned violations → 0   (baseline 1224 → 1217)
design-system-v5      64 → 64 (lookups + tabs add 0)
source deleted        160 (LookupsAdmin.tsx)
```

## Accessibility

- Real `tablist`/`tab`/`tabpanel` with roving tabindex + arrow/Home/End keys;
  the panel is `aria-labelledby` the active tab. `h1` (ShellPageFrame) → `h2`
  (governance/read-only/error card headers). `StatusPill` for status (text +
  shape). `DataTable` stacks to labelled cards on mobile. Arabic content carries
  `dir="auto"`; keys/`#sort` wrapped in `<bdi><Mono>`.
- **Live render owed** — `/admin/planning/lookups` needs the admin persona; this
  session is an inspector/planner (the admin gate refuses it). The DS components
  and `Tabs` are otherwise proven; axe / light-theme / 200 % zoom / Arabic render
  still owed.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — PASSED (relocked 1224 → 1217)
- [x] `npm run gates:date-inputs` — PASSED (no date inputs; 19 unchanged)
- [x] `npm run check:design-system-v5` — **64** unchanged; lookups + tabs add **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline** (the 3
      specs touching lookups reference the route path / DB table, not the deleted file)
- [ ] live render + axe + light theme + 200 % zoom + Arabic — owed (admin persona)

## Concurrent agent

A second agent's factories work (`features/factories/*`, `components/sections/
factories/factory-risk-meter/*`, `i18n/numbers.ts`) carries its own `no-comments`
lint violations — the only failures in `npm run lint`. Untouched; the eslint
baseline was **not** relocked so their debt is not baked in under this task.

## Parked

- Adopt `Tabs` across the app wherever tab rows are hardcoded (the owner's stated
  follow-up).
- Live admin-persona render + axe/light/zoom/Arabic pass on the lookups screen.

## Proposed commit

```
feat(admin): rebuild planning lookups on saqeel with a reusable Tabs primitive
```

## Next

Roll `Tabs` out to the other hardcoded tab rows, or the next migration slice.
