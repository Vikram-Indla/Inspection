# 2026-08-09 · T-036 — compliance library catalogue

`task: T-036` · `status: partial (catalogue done, static verification only)` · `duration: 3h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-005, WEB-006, WEB-008, WEB-011`

---

## Goal

Migrate the Compliance Library catalogue onto SAQEEL, including its skeleton,
and bring across what the vendor mock shows that our screen was missing —
without inventing a value the schema cannot produce.

## The mistake this task made first — read this before scoping any admin route

**The task was started against `/admin/regulations` and that route does not
render its own list.** `middleware.ts:75` rewrites it:

```
pathname === "/admin/regulations" && !searchParams.has("id")  →  "/compliance"
```

The first pass rebuilt `app/(app)/admin/regulations/page.tsx` end to end —
route, components, i18n, skeleton — and **none of it was reachable**. The owner
loaded the screen and correctly reported "no UI change, it's all legacy code":
they were looking at `app/(app)/compliance/page.tsx`, which the inventory never
opened.

Three rewrites exist and all three behave this way:

| Typed route | Actually renders | Alias carried in |
| --- | --- | --- |
| `/admin/regulations` (no `?id=`) | `/compliance` | `__shellRoute` |
| `/admin/compliance-approvals` | `/compliance/approvals` | `__shellRoute` |
| `/admin/violations` (no `?mode=`) | `/enforcement-library` | `__shellRoute` |

**An inventory of a route is not complete until `middleware.ts` has been read.**
The route folder, the schema and the component tree all looked consistent and
all pointed at the wrong file.

The work was retargeted onto `/compliance` with the owner's agreement. The
feature layer and every section component survived unchanged in substance —
only the route that composes them, and the URL contract, moved.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/compliance/page.tsx` | rebuilt | **303 → 27** |
| `app/(app)/compliance/loading.tsx` | rebuilt on the mirroring skeleton | 4 → 8 |
| `app/(app)/admin/regulations/page.tsx` | reduced to the `?id=` record | **546 → 21** |
| `app/(app)/admin/regulations/loading.tsx` | rebuilt | 23 → 25 |
| `app/(app)/admin/regulations/Controls.tsx` | superseded half deleted, `@retiring` | 314 → 71 |
| `app/(app)/admin/regulations/RouteContract.tsx` | **deleted** (zero importers) | 121 → 0 |
| `app/(app)/admin/regulations/m6-library.module.css` | **deleted** | 67 → 0 |
| `features/regulations/params.ts` | created | 0 → 47 |
| `features/regulations/queries.ts` | created | 0 → 75 |
| `features/regulations/rows.ts` | created | 0 → 131 |
| `features/regulations/access.ts` | created | 0 → 33 |
| `features/regulations/workspace-source.ts` | created | 0 → 102 |
| `features/regulations/dossier-source.ts` | created | 0 → 100 |
| `components/sections/regulations/regulations-screen/` | created | 0 → 105 + 18 |
| `components/sections/regulations/regulation-authority-nav/` | created | 0 → 52 + 55 |
| `components/sections/regulations/regulation-catalogue/` | created | 0 → 102 + 47 |
| `components/sections/regulations/regulation-filter-bar/` | created | 0 → 64 + 71 |
| `components/sections/regulations/regulation-governance-notice/` | created | 0 → 81 + 6 |
| `components/sections/regulations/regulations-skeleton/` | created | 0 → 63 + 47 |
| `components/sections/regulations/regulation-workspace/` | six-tab workspace quarantined, `@retiring` | 0 → 116 |
| `components/sections/regulations/regulation-dossier/` | `?id=` record quarantined, `@retiring` | 0 → 193 |
| `i18n/locales/{en,ar}/regulations.json` | created | 0 → 52 keys each |
| `i18n/messages.ts` | namespace registered | +5 |

**Zero client islands added.** Search, authority and status filters are all
`searchParams`, so the catalogue is a Server Component end to end.

## Decisions

**`/compliance` is canonical; `/admin/regulations` is the alias.** Every link
the screen builds is rebased on `scope.routeBase`, read from `__shellRoute`. An
officer who typed the alias stays on the alias — otherwise the first filter click
would silently relocate them.

**The URL contract was preserved, not replaced.** The screen keeps `q`,
`authority`, `status` and `libraryId` exactly as `/compliance` already used them,
so existing links and the rail keep working. My first pass invented `lifecycle`
and `id`; those are gone.

**`libraryId` is dropped by every filter change.** A workspace left open beside a
catalogue that no longer lists it is a lie about what is selected.

**Status chips are derived from the data, not from a fixed list.** The library
view emits `draft` and `locked` alongside the three lifecycle states, and a chip
for a state nothing is in is noise. Unknown values fall back to the raw string
rather than rendering blank.

**Authorities group on the recorded text (owner ruling).** No authority registry
exists to join against. Two consequences stated in the UI: regulations with no
recorded authority get their **own** group — the legacy screen folded them into a
literal `"Other"`, indistinguishable from an authority actually named Other — and
a caption says these are not reconciled against any register. The mock hardcodes
counts (24/31/18/12) that do not match even its own row list.

**`unknown` is a first-class footprint value.** `clauses`, `items` and
`violations` are `number | "unknown"`. A `verified_unknown` clause payload, or a
failed `violation_codes` read, prints "Unknown" for every affected row — never
`0`. This is the contract the legacy screen already held, extended to the new
violation column.

**Violations are counted through the clause.** `violation_codes.clause_id`
references `regulation_clauses`, not the regulation and not the item. The count
is assembled in `queries.ts` because the library view is a `union all` over two
sources and cannot carry the join.

**A failed role read is its own state.** `readRegulationAccess` returns
`unverified` rather than collapsing into "read only for your role" — claiming a
permission verdict the app never resolved would be a fabricated fact.

## Inventory taken before writing code

Presented to the owner before any file was written — and **incomplete**: it
covered the route folder and the schema but not `middleware.ts`. See above.

- **State:** `/admin/regulations`' `RegulationRegister` held `useState` for
  search and lifecycle over an already-loaded array. `/compliance` was already
  server-filtered but rendered raw `<select>` and anchor chips. Both now derive
  in `rows.ts` from `searchParams`.
- **Effects:** none existed; none added.
- **Literals mapped to tokens:** 45 inline `style={{}}` objects and 27 px
  literals, plus `m6-library.module.css`'s raw `10.5px`/`11.5px`/`12.5px`/`190px`.
  Two tokens I reached for do not exist (`--sqx-surface-selected`,
  `--sqx-focus-ring`); corrected to `--sqx-surface-accent` and the
  `--sqx-border-focus` + `--sqx-focus-ring-offset` pair `DataTable` already uses.
- **`<svg>` / emoji mapped to icons:** 21 emoji-as-icon glyphs removed. **No icon
  replaced them** — each sat beside text that already carried the meaning, and
  the registry has no alert/warning name. Adding one would be a design-system
  change request, not a task step.
- **Accessibility failures found:** an `<h2>` whose accessible name was a status
  sentence; `<th scope="row">` wrapping a `<strong>` plus a caption `<div>`;
  filter chips as `<button aria-pressed>` mutating a client array; a native
  `<select name="status">` with no submit affordance beside a disabled
  "Inspection type" chip; `sr-only` captions in English only.
- **i18n:** `/compliance` was **entirely hardcoded English** — every label,
  every empty state, every tab. `/admin/regulations` used
  `t("key", "English default")` inline. 52 keys now exist in `en` and `ar` at
  exact parity for everything the catalogue renders.

## Numbers

```
Route: /compliance (and its /admin/regulations alias)
first-load JS   not measured — measurement request, WEB-005 §8
route CSS       not measured
LCP (4G, mid)   not measured
INP             not measured
CLS             not measured
client islands  1 → 1 (LibraryTabs, inside the quarantined workspace)
legacy CSS deleted: 67 lines (m6-library.module.css)
source lines removed: ~1,150 across the two route files
```

## Accessibility

- axe violations: **not run** — the dev server is behind a login the agent may
  not authenticate through.
- Manual checklist (WEB-003 §10): **not performed**, same reason.
- Fixed by construction: captions and headings translated; the authority rail is
  a real `<nav aria-labelledby>` of links with `aria-current`; status chips are
  links, not fake toggles; search is a labelled GET form with a submit button;
  footprint columns are `numeric`; the selected row carries `aria-current`
  through `DataTable`'s `getRowSelected` **and** a "Selected" label, so selection
  is never colour alone.

## Verification

- [x] `npm run typecheck` — clean, whole repo
- [ ] `npm run lint` — **no `lint` script exists in `apps/web`**
- [x] `npm run check:design-system-v5` — zero findings in every file touched here
- [x] i18n parity — 52 keys, `en` and `ar` identical key sets
- [x] Zero line comments in the new files; TSDoc only
- [ ] `npm run test:e2e` — not run
- [ ] **The screen has not been loaded once.** This is the whole reason the
      first pass shipped an unreachable route.
- [ ] Definition of Done (WEB-006 §5) — not fully ticked

## Retirement

- **Deleted:** `RouteContract.tsx` (zero importers — never wired into any of the
  three library routes its header claimed to serve) and `m6-library.module.css`.
- **Marked `@retiring`:** `Controls.tsx` (lifecycle form only),
  `regulation-workspace` (the six-tab detail, T-038) and `regulation-dossier`
  (the `?id=` record, T-037).

## Parked

- **Shell rail hydration mismatch on all three rewritten routes.** Server and
  client disagree on `aria-current`/`data-current` in
  `components/app-shell/shell-rail/shell-nav-group.tsx`, which takes its pathname
  from the `x-pathname` header on the server and recomputes it with
  `usePathname()` on the client. Owner parked it as its own task — the diagnosis
  is unverified and it touches navigation on every authenticated route.
- **The mock's deeper tabs are mostly already backed.** `violation_codes` carries
  `level`, `corrective_action`, `grace_period_days`, `category`, `applicability`;
  `penalty_mappings` carries `penalty_type`, `amount`, `grace_period_days`,
  `due_period_days`, `legal_basis` and a `template_version_id` naming the action
  form; `inspection_items.response_model.mapping.non_compliant` holds a **direct
  item→violation link** plus `.action_form`. The quarantined workspace currently
  shows only `code`/`title`/`level` and `penalty_ref`/`mapping_version`.
- **Not in the schema — must render as absence in T-038:** regulation
  description, regulation-level legal reference (only
  `regulation_clauses.legal_source` exists, per clause), inspection type, item
  section, report type, self-assessment, a real `updated_at`, and per-user
  favourites / recently-opened. The mock's Versions tab **fabricates** its
  superseded row by subtracting 0.1 from the current version.
- **The "Inspection type" filter chip was dropped, not disabled.** The legacy
  screen rendered it permanently disabled with a title explaining no such field
  exists. A control that can never do anything is not a state; it is furniture.

## Blocked / open questions

- **Arabic needs a native reviewer.** 52 new strings, on top of the ~135 already
  outstanding.
- **Runtime verification is owed** and this task proves why it matters.

## Proposed commit

```
feat(compliance): rebuild the library catalogue server-first
```

## Next

T-038 — rebuild the six-tab workspace on SAQEEL primitives with the real
`violation_codes` and `penalty_mappings` columns, then T-037 for the `?id=`
record. Before either, load `/compliance` in the dev server and confirm this
catalogue actually renders.
