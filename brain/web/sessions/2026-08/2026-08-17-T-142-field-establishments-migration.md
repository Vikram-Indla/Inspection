# 2026-08-17 · T-142 — `/field/establishments` migrated off the parallel design system

`task: T-142` · `status: done` · `duration: ~2.5h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-009, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/establishments` list — the fourth `/field` slice and the
largest so far — onto SAQEEL primitives and the approved Linear language. It is a
filterable, paginated, tabbed card grid with a filter drawer. Scoped to the main
list; the `/field/establishments/unregistered` create form is its own screen.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/establishments/page.tsx` | rebuilt as a route file | 406 → **15** |
| `features/field-establishments/queries.ts` | created — facets, list, counts, fixtures | 117 |
| `features/field-establishments/params.ts` | created — param parse + href builder | 69 |
| `features/field-establishments/rows.ts` | created — narrowing from `unknown` | 68 |
| `features/field-establishments/labels.ts` | created — risk tone/label | 22 |
| `components/sections/field-establishments/establishments-screen.tsx` | created | 136 |
| `…/establishment-card.tsx` | created | 55 |
| `…/establishment-filters.tsx` | created (client) — the filter drawer | 69 |
| `…/establishments.module.css` | created — token-only | 214 |
| `i18n/locales/{en,ar}/field-establishments.json` | created — new namespace | 54 each |
| `i18n/messages.ts` | registered `fieldEstablishments` | +4 |
| `saqeel/icon/icon-registry.ts` | added `filter` (`SlidersHorizontal`) | +2 |
| `app/(app)/field/establishments/establishments.module.css` | **deleted** | 65 → 0 |
| `e2e/field-establishment-incidents.spec.ts` | assertions re-pointed, dead const removed | — |

The `unregistered/` subroute (page, form, actions — 331 lines) is untouched and
becomes its own task.

## Decisions

**The filter drawer stayed server-rendered, driven by URL state.** The design's
drawer opens on `?filter=1` and closes by navigating away; the GET form submits
the filters. The saqeel `Drawer` primitive is a *client-controlled* legacy
component (`open`/`onClose`, `t-heading`/`btn` classes) — wrong for a URL-state
drawer. So the drawer is a plain server-rendered overlay `<Link>` + `<aside>`
panel, and only the form controls inside are client leaves (`Select`,
`TextInput`, `Button`) — the exact pattern the migrated `analytics-filters`
already uses. Zero drawer JS; open/close is navigation.

**The query building moved to `queries.ts`, which resolves the `let` naturally.**
The old page built three PostgREST queries with `let listQuery = …; if (q)
listQuery = listQuery.or(…)` — `let` in a `.tsx`, baselined debt. In a `.ts`
feature module `let` is allowed and idiomatic for query composition, so the
migration removes the violation by relocation, not contortion. The two count
queries collapsed into one `countFor(temporary)` helper. `as unknown as
EstablishmentRow[]` is gone — `rows.ts` narrows from `unknown`.

**Param parsing and the href builder became pure functions** (`params.ts`):
`parseParams` clamps `status`/`risk`/`region`/`city`/`page` against the real
facet lists, `buildHref` preserves the active filters across every link. Pulling
them out of the render makes them testable and keeps the screen declarative.

**Added the `filter` icon** (`lucide/SlidersHorizontal`) — the sixth semantic
name this `/field` sweep has needed. The drawer close `✕` (a literal glyph in the
old code) became the `dismiss` icon on a `<Link>`.

## Inventory taken before writing code

- **State/effects:** already a Server Component, zero hooks — every filter is URL
  state (the top rung of the ladder). Kept that way. The two client leaves are
  the search `TextInput` and the drawer form controls; no `useState`/`useEffect`
  introduced anywhere.
- **Copy:** a local `tr(key, en, ar)` helper inlined both languages at **39**
  call sites; all moved to a new `field-establishments` namespace, Arabic lifted
  from the pairs. `count`, `pager.page` became interpolated (`{shown}`/`{total}`,
  `{page}`/`{count}`).
- **`<svg>` → icons:** 4 raw `<svg>` (add-plus, empty-hint info, search, filter)
  → `create`, `info`, (search lives in `TextInput`), `filter`; the drawer `✕` →
  `dismiss`.
- **Accessibility failures found:** the page had **no `h1`** and **no headings at
  all**; status/risk were `badge`/`exc-chip` spans with bare `.exc-mark` dots.
  Now `h1` (+ `h2` in the drawer), and every status/risk is a labelled
  `StatusPill`.

## Numbers

```
Route: /field/establishments
route file            406 lines → 15
components ≤ 200      max component 136 (screen); queries.ts 117 (feature, < 400)
client islands        0 → 2 leaves (search input, drawer form) — drawer itself is server
raw <svg> in app      4 → 0
inline style={{}}     21 → 0
headings              0 → 1  (+ h2 in the open drawer)
rendered sizes        off-scale → 13·15
weight cap            700 → 590
`let` in .tsx         3 (carried debt) → 0  (relocated to a .ts module)
hardcoded copy        39 tr() sites → 0
typography gate       12 owned violations → 0   (baseline 1299 → 1287)
eslint baseline       7669 → 7615
design-system-v5      72 → 71
source lines deleted  65 (old stylesheet); 391 out of the route file
```

## Accessibility

- **axe: 0 WCAG violations** across English/dark and Arabic/dark, on the list AND
  the open filter drawer. Best-practice rules (`heading-order`,
  `page-has-heading-one`, `landmark-no-duplicate-main`, `region`, `duplicate-id`,
  `listitem`) also 0.
- **Two defects found by measuring, both the acid-lime trap.** (1) The active tab
  used `--sqx-surface-accent` — a *soft* dark-olive tint (`#292b13` in dark), not
  the bright fill — with dark `inverse` text, giving **1.23:1**. Fixed to the
  bright `--sqx-action-primary-bg` fill with its ink, label `tone="inherit"`;
  now void ink (`rgb(8,9,10)`) on lime, the fill-only accent law. (2) The card
  avatar had the same soft-surface + dark-text (a barely-visible initial, though
  decorative so axe stayed silent) — moved to a neutral `--sqx-surface-sunken`
  with `secondary` text. **`--sqx-surface-accent` is a tint for backgrounds
  behind normal text, never a fill for inverse text** — the distinction that
  bit T-129 and bit again here.
- **A layout defect found by measuring, not axe.** I copied
  `max-inline-size: var(--sqx-grid-min-lg)` (24rem/384px) from the home slice but
  **omitted its `@media (min-width: 60em) { max-inline-size: none }` override**,
  so the card grid was clamped to a 384px single column. The home pattern needs
  *both* lines; added the override and the grid now fills to 3 columns at the
  960px preview.
- Manual checklist: keyboard ✓ · Arabic/RTL ✓ (drawer flips to inline-start, tabs
  and risk pills translate, factory names stay LTR) · dark ✓ · filter drawer open
  ✓. **Light theme, 200 % zoom and browser e2e still owed.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (relocked 7669 → 7615)
- [x] `npm run gates:typography` — PASSED (relocked 1299 → 1287)
- [x] `npm run check:design-system-v5` — 71 (was 72)
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] axe on list + open drawer, EN + AR
- [x] temporary axe file removed (404 confirmed), browser theme/locale restored
- [ ] light theme, 200 % zoom, browser e2e — still owed

**`field-establishment-incidents` re-pointed across the split.** It asserted the
DB strings, the dossier-link prefix and the unregistered href from the old
`page.tsx`. Re-pointed: `from("factories")` + the license embed + `is_temporary",
query.status === "unlicensed"` → `queries.ts`; `/field/factory-360/` →
`rows.ts`; `href="/field/establishments/unregistered"` and the negative
`not href="/factories"` → the screen. The now-unused `ESTABLISHMENTS` path
constant was deleted.

## Retirement

Deleted at zero imports: the old `establishments.module.css` (65). The route
folder now holds `page.tsx` + the `unregistered/` subroute.

## Parked

- **`/field/establishments/unregistered` is still on the parallel system** — the
  create form (page 94, form 128, actions 109). Its own task; `actions.ts` is
  governed and asserted by `field-establishment-incidents`, so migrate the UI
  and leave the RPC call untouched.
- The `role="tab"` links carry `aria-selected` but no `aria-controls`/`tabpanel`
  (they navigate rather than toggle panels). Carried from the old page; axe is
  clean. A true tablist vs. nav-links decision belongs to a broader pattern pass.
- Light theme, 200 % zoom, browser e2e owed for this route.
- The cross-cutting `Button` mirror gap (T-052/T-140/T-141) and field-pill
  pluralisation (T-141) still stand.

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild establishments list on saqeel primitives
```

## Next

`/field/establishments/unregistered` (the create form) closes out the
establishments surface. After that the `/field/visits` + `/field/visits/calendar`
pair (both already import `assignment-task-model` and `FieldHeaderSync`), then
the large execution screens — `[visitId]` startup and the 1,991-line
`inspection/[id]/Workspace`.
