# 2026-08-10 · T-037 + T-038 — regulation workspace and record

`task: T-037, T-038` · `status: done (static verification only)` · `duration: 2.5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-005, WEB-006, WEB-008, WEB-009, WEB-011`

---

## Goal

Finish the compliance library: rebuild the six-tab workspace and the `?id=`
record on SAQEEL, then delete every retiring file left behind by T-036.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/admin/regulations/page.tsx` | composes the new record | 21 → 21 |
| `app/(app)/compliance/page.tsx` | workspace wired in | 27 → 27 |
| `features/regulations/workspace-source.ts` | rewritten — reads the columns the legacy never selected | 102 → 186 |
| `features/regulations/workspace-view.ts` | created | 0 → 65 |
| `features/regulations/record-source.ts` | created (replaces `dossier-source.ts`) | 0 → 94 |
| `features/regulations/params.ts` | `tab` added to URL state | 47 → 55 |
| `components/sections/regulations/workspace/regulation-workspace/` | created | 0 → 160 + 3 |
| `components/sections/regulations/workspace/regulation-overview/` | created | 0 → 67 + 17 |
| `components/sections/regulations/workspace/regulation-items/` | created | 0 → 108 + 31 |
| `components/sections/regulations/workspace/regulation-violations/` | created | 0 → 93 + 31 |
| `components/sections/regulations/workspace/regulation-penalties/` | created | 0 → 90 + 31 |
| `components/sections/regulations/workspace/regulation-versions/` | created | 0 → 75 + 33 |
| `components/sections/regulations/workspace/regulation-audit/` | created | 0 → 38 + 6 |
| `components/sections/regulations/record/regulation-record/` | created | 0 → 175 + 43 |
| `components/sections/regulations/record/regulation-lifecycle/` | created (client) | 0 → 93 + 44 |
| `components/sections/regulations/catalogue/**` | 6 components moved under `catalogue/` | unchanged |
| `i18n/locales/{en,ar}/regulations.json` | 52 → 202 keys | exact parity |
| **Deleted** `app/(app)/admin/regulations/Controls.tsx` | retirement gate cleared | 71 → 0 |
| **Deleted** `app/(app)/compliance/LibraryTabs.tsx` | retirement gate cleared | 39 → 0 |
| **Deleted** `features/regulations/dossier-source.ts` | superseded by `record-source.ts` | 100 → 0 |
| **Deleted** `components/sections/regulations/regulation-workspace/` | rebuilt | 116 → 0 |
| **Deleted** `components/sections/regulations/regulation-dossier/` | rebuilt | 193 → 0 |

**Every `@retiring` file from T-036 is gone.** The four rows left in the
retirement ledger's Marked section all pre-date this work — the three shell
files and `VisitsBoard.tsx`.

## Decisions

**The sections tree was regrouped before writing a line.** Thirteen component
directories under `sections/regulations/` would have breached WEB-011's twelve
per directory. Split by role — `catalogue/` (6), `workspace/` (7), `record/` (2)
— which is also how the screen actually decomposes.

**Tabs are URL state, not client state.** `tab` joins `q`/`authority`/`status`/
`libraryId` in `searchParams`, so a tab is linkable, Back works, and the
workspace stays a Server Component. The legacy `LibraryTabs` island is deleted
rather than restyled. `tab` is omitted from the URL when it is `overview`, so the
default costs no query string, and it is reset whenever a filter changes — the
same rule that already drops `libraryId`.

**`WorkspaceTable<T>` makes "unreadable" unrepresentable as "empty".** Every tab
payload is `{ kind: "rows", rows } | { kind: "unavailable" }`. There is no shape
in which a failed read can be handed to a table as a zero-length array. The
legacy carried parallel `xUnavailable` booleans beside the arrays, which is the
same information one refactor away from drifting apart.

**Inspection items are read directly, not from the library view.** The view
embeds only `id`/`code`/`title`. The columns that make an item legible —
`response_model`, `evidence_rule`, `active` — need `inspection_items` itself.

**The item→violation link is the item's own mapping, not clause adjacency.**
`response_model.mapping.<response>.violation` names the violation code raised by
answering that way. That is a stronger statement than "a violation exists on the
same clause", and the Violations tab's "Raised by" column is computed from it —
with a footnote saying violations attach to a clause, so the reader knows why the
two views differ.

**Penalty amount is not money until it is recorded.** `amount` renders through
`Intl.NumberFormat` when present, and as "No amount set" when null, with a
footnote that an empty amount is not zero. No currency conversion, no default.

**The versions tab shows only published versions.** `compliance_entity_versions`
is the source; when it is empty but the library view carries a
`version_number`, the current version is synthesised from the view — that is a
row the database does assert. **Nothing is fabricated**: the mock invents a
superseded row by subtracting 0.1 from the current version, and that is not
copied.

**The lifecycle control was rebuilt, not moved.** It is the one write on this
screen, so it stays a client island (`useActionState`), but on `Field` +
`Button` + `StatusPill` with a tokened textarea. The draft case still renders
nothing rather than a disabled control — a draft was never activated, so
deactivation is not a transition that applies to it.

**Legal source is shown per clause and stated as such.** The mock puts a "Legal
Reference" on the regulation; the schema records `legal_source` on
`regulation_clauses`. The Overview lists the distinct sources across the clauses
and the footnote says where it comes from.

**What the overview says is missing, and why.** One line names the three fields
the mock shows that this schema does not store — description, inspection type,
last-modified timestamp — instead of leaving the reader to wonder whether the
record is incomplete or the screen is.

## Inventory taken before writing code

- **State:** the legacy workspace had one client island (`LibraryTabs`) holding
  the active tab. Moved to `searchParams` (rung 2). Nothing else was stateful.
  The rebuild adds one island back, for the lifecycle form only.
- **Effects:** none existed; none added.
- **Literals:** every legacy panel used `.panel-row`/`.badge`/`.desc`/`.kpi`/
  `.timeline` from the frozen sheets. All replaced with colocated modules on
  `var(--sqx-*)`.
- **`<svg>` / emoji:** none in the workspace; the record's legacy had `🔒`/`⚠`/
  `✓`/`ⓘ`, all dropped — the text beside them already carried the meaning.
- **Accessibility failures found:** the workspace `<header>` used `<h1>` inside a
  page that already had one; tab panels had no accessible relationship to their
  tabs; `new Date(...).toISOString()` printed a raw UTC stamp as user-facing
  text; every string was hardcoded English.
- **i18n:** 150 new keys, `en` + `ar`, taking the namespace from 52 to **202 at
  exact parity**.

## Numbers

```
Route: /compliance (and its /admin/regulations alias) + /admin/regulations?id=
first-load JS   not measured — measurement request, WEB-005 §8
route CSS       not measured
LCP (4G, mid)   not measured
INP             not measured
CLS             not measured
client islands  1 → 1 (LibraryTabs deleted; regulation-lifecycle added)
legacy CSS deleted: 0 further (the frozen sheets still serve unmigrated routes)
source lines removed: 519 (Controls 71, LibraryTabs 39, dossier-source 100,
                           legacy workspace 116, legacy dossier 193)
```

Reads on the workspace: one regulation row, then items + violations + versions +
audit in parallel, then penalties (which needs the violation ids). Five round
trips, three of them concurrent.

## Accessibility

- axe violations: **not run** — the dev server is behind a login the agent may
  not authenticate through.
- Manual checklist (WEB-003 §10): **not performed**, same reason.
- Fixed by construction: tabs are links inside a labelled `SegmentedControl`
  with `aria-current`; every table has a translated caption; timestamps go
  through `formatDateTime(locale)` (Asia/Riyadh, Arabic-Indic digits) instead of
  a raw ISO string; the lifecycle textarea has a real `<label>` and a hint;
  heading levels start at `h2` under the page title; unreadable tabs render a
  `tone="warning"` `EmptyState` whose title states the distinction.

## Verification

- [x] `npm run typecheck` — clean, whole repo
- [ ] `npm run lint` — **no `lint` script exists in `apps/web`**
- [x] `npm run check:design-system-v5` — zero findings in every file touched here
- [x] i18n parity — 202 keys, `en` and `ar` identical key sets
- [x] Zero line comments; TSDoc only
- [x] WEB-011 — 6 / 7 / 2 directories per group, 7 files in `features/regulations`
- [x] Every component under 200 lines; both route files under 30
- [ ] `npm run test:e2e` — not run
- [ ] **Neither screen has been loaded.**
- [ ] Definition of Done (WEB-006 §5) — not fully ticked

## Retirement

Five files deleted, all with zero importers at the time of deletion:
`Controls.tsx`, `LibraryTabs.tsx`, `dossier-source.ts`, and the two quarantined
components from T-036. `app/(app)/admin/regulations/actions.ts` **stays** — it is
the server-action module the rebuilt lifecycle control calls.

## Parked

- **`compliance/approvals` still imports `__shellRoute` by hand.** It resolves
  the alias with an inline ternary rather than `readRegulationScope`. Harmless
  today, duplicated logic tomorrow.
- **Shell rail hydration mismatch (T-039)** is still open and still reproduces on
  every rewritten route.
- **`/admin/items` and `/admin/packages` are unmigrated** and reachable from the
  same configuration journey.
- **`regulations.enum` is a small local map.** It covers the response,
  evidence-type and config-status values this screen renders. If a third screen
  needs the same vocabulary it belongs in `common.json`, not copied.

## Blocked / open questions

- **Arabic needs a native reviewer.** 150 new strings here, ~285 outstanding in
  total across the redesign.
- **Runtime verification is owed** for both screens.

## Proposed commit

```
feat(compliance): rebuild the regulation workspace and record
```

## Next

Load `/compliance` and `/admin/regulations?id=…` in the dev server as a writer
and as a reader, then T-039 (shell rail hydration).
