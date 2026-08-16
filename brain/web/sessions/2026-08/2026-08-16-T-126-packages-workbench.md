# 2026-08-16 · T-126 — the register stops being the editor

`task: T-126` · `status: partial — structure, states and specs done; axe, native Arabic review and browser e2e owed` · `duration: 5h`
`rules applied: WEB-000 … WEB-014`

---

## Goal

`/admin/packages` was measured, critiqued and rebuilt as two surfaces: a
scannable register, and a package workbench reached by query state.

## The measurement that set the scope

The critique was written from the live DOM, not from reading the source:

```
content height        6,810px   ·  7.5 screens
inputs                    103   ·  buttons 61  ·  forms 15
required fields            20   ·  every one armed and visible
tallest two cards       1,597 / 1,485px       median card 382px
heading-order skips         2   ·  H2 → H4, twice
```

The register was also the editor. Every draft package rendered the whole
three-pane designer inline; every published version rendered an open
**Deactivate version** form with two required fields and a danger submit.

## What changed

| File | Action | Result |
| --- | --- | --- |
| `features/admin-packages/view.ts` | query gained `package`/`version`/`tab`; `resolveSelection`, `resolveTab`, `availableTabs`, `isEditableDraft`, `registerHref` | 148 → 214 lines |
| `features/admin-packages/queries.ts` | resolves `selection` from the **unfiltered** set | +3 lines |
| `sections/admin-packages/package-row/` | **new** — one register row on `ListRow` | 84 + 16 |
| `sections/admin-packages/packages-register/` | card grid → `ListRows` | 51 → 49 |
| `sections/admin-packages/designer-screen/` | **new** — the workbench frame | 137 + 8 |
| `sections/admin-packages/designer-tabs/` | **new** — four tabs as links | 32 + 39 |
| `sections/admin-packages/version-list/` | **new** — Versions tab | 110 + 30 |
| `sections/admin-packages/packages-disclosure/` | **new** — the one disclosure chrome | 24 + 55 |
| `sections/admin-packages/packages-notices/` | **new** — the four service notices, shared | 50 |
| `sections/admin-packages/packages-screen/` | register only; notices and templates extracted | 115 → 103 |
| `sections/admin-packages/packages-skeleton/` | reshaped to the row register | 41 + 58 |
| `sections/admin-packages/package-card/` | **deleted** — zero importers | −101 −54 |
| `packages/PackagesEditors.tsx` | branches register vs workbench; renders the two dropped components again | 114 → 128 |
| `packages/DraftEditor.tsx` | legacy classes → SAQEEL primitives; headings 3/4 | 134 → 273 |
| `packages/_designer/designer-panes.tsx` | **new** — item-rule panel and action-forms pane | 187 |
| `packages/_designer/designer-types.ts` | **new** — shared designer types and helpers | 68 |
| `packages/PublishControls.tsx` | `NewPackageForm` lost its card chrome | −11 |
| `packages/TemplateRegistry.tsx` | lost its own `<details>`; the shared disclosure owns it | −4 |
| `packages/PackagePreview.tsx` | `headingLevel` + `defaultOpen` | +4 |
| `packages/ImpactPanel.tsx` | `role="region"` named by its title | +1 |
| `packages/packages.module.css` | legacy tokens → `--sqx-*`; RTL override deleted | 100 → 143 |
| `saqeel/icon/icon-registry.ts` | `moveUp`, `moveDown`, `remove` | +4 |
| `i18n/locales/{en,ar}/admin-packages.json` | 26 keys added, 10 dead keys removed | both locales |
| `e2e/cd-008-009-packages.spec.ts` | 5 source assertions re-pointed, 4 runtime blocks rewritten | |

## Numbers

```
register height       6,810px → 1,977px     tallest card 1,597px → ~100px row
inputs rendered           103 → 32          visible required fields 20 → 0
open destructive forms      9 → 0           inline designers 2 → 0
buttons                    61 → 6           forms 15 → 5    leaf nodes 332 → 129
heading-order skips         2 → 0
legacy classes (designer)  40 → 5           the 5 are PackagePreview's, by ruling
typography (route)          0 → 0           gate 115 removed, unchanged
eslint                gate 97 removed       v5 76, unchanged
static e2e            408 passed, 33 failed — unchanged
```

## The regression T-124 shipped and T-124 certified clean

**`NewDraftForm` and `TemplateRegistry` were rendered by nothing.**

```
rendered before e84ce9bd      rendered now (before this task)
NewDraftForm                  —
TemplateRegistry              —
```

`PublishControls.tsx:90` is the only path to `createDraftVersion`, so a package
with no draft was a dead end — precisely the state the "No versions" filter
selects for. Both files compiled, typechecked and passed every gate, which is
why nothing caught it.

**My T-124 record claims "no functional regression." That claim was false**, and
this is the second uncaught T-124 defect after the ten spec assertions T-125
found. The lesson is already written as WEB-008's first standing sweep —
*diff what the page loads against what it renders* — and T-124 did not run it.
Running it here is a two-line grep:

```
git show <base>:page.tsx | grep -oE "<(Component|…)\b" | sort -u
grep -rhoE "<(Component|…)\b" <new sources> | sort -u
```

## Decisions

**The workbench is query state, not a subroute.** CLAUDE.md fixes the route list
and says *"tabs and filters are query state, never subroutes"*, so the designer
opens on `?package=&version=&tab=`. It is deep-linkable, server-rendered and
costs no client state. The critique proposed `?version=` alone; the shipped key
is `?package=` **with** an optional `?version=`, because a package with no
versions has no version id to key on and is exactly the case that needs the
workbench most.

**The Designer tab does not exist for a version that cannot be edited.** A
published version offers Field preview / Publish impact / Versions, and an
inline notice says why — a disabled fourth tab would be a control that never
does anything.

**`PackagePreview` keeps the field-workspace look.** The owner ruled on T-125's
parked question. It gained `headingLevel` so one component sits at H3 as its own
tab and H5 inside the designer's third pane, which is what removed both
heading-order skips.

**`DraftEditor`'s legacy chrome went, and the file was split rather than
suppressed.** Migrating 22 `btn`, 5 `sq-field`, 4 `sq-input`, `sq-select`,
`sq-choice` and `sq-panel` onto primitives took the file to 429 lines, past the
400 hard ceiling. The item-rule panel and the action-forms pane moved to
`_designer/` — an underscore folder, so App Router does not read it as a segment
and no route was added.

**Three icons were registered.** `moveUp`, `moveDown` and `remove` (lucide
`ChevronUp`/`ChevronDown`/`X`) replaced `↑ ↓ ✕` text glyphs in buttons. Rule 8
requires icons by semantic name from the registry, and the registry had no
vertical ordering pair.

## Verification

- [x] `npm run typecheck` — exit 0
- [x] `npm run lint` — PASSED, 97 removed
- [x] `npm run gates:typography` — PASSED, 115 removed; route measures **0**
- [x] `npm run check:design-system-v5` — **76**, unchanged
- [x] `npm run test:static` — 408 passed, 33 failed, unchanged — **and this
      proves nothing about `cd-008-009-packages`, which is not in the
      allowlist.** The spec sweep below is what covers it.
- [x] Register, LTR: 1,977px, 10 rows, 0 visible required fields, 0 heading skips
- [x] Workbench, draft version: 4 tabs, outline H1 → H2 → H3 → H4, no skips
- [x] Workbench, published version: **3 tabs, no Designer**, immutability notice
- [x] Workbench, package with no versions: Versions tab only, **`NewDraftForm`
      reachable** — the P0 regression is fixed and proven from the rendered DOM
- [x] Stale `?package=` id: register renders with the "no longer available"
      notice and all 10 rows
- [x] Search with no match: "No packages match this view"
- [x] Arabic: `dir=rtl`, `lang=ar`, Arabic-Indic digits in tab counts and dates,
      both new disclosures closed, no horizontal overflow
- [x] 375px: no horizontal overflow, no overflowing element, whole 133px row is
      the link target
- [x] Console clean on a fresh tab

## The spec sweep, and how it under-reported

Five assertions broke. My first sweep found **four** — it extracted string
literals with a regex, which mis-parsed `"…!== \"draft\""`. Rewriting the
extractor to hand each literal to `eval` found the fifth and every one since.
**Regex is the wrong tool for reading JS string literals; let JS read them.**

```
✗ PackagesEditors.tsx  'version.status === "draft" && data.canWrite'
✗ PackagesEditors.tsx  'data.canWrite && version.status !== "draft"'
✗ DraftEditor.tsx      score_weight · evidence_rule · response_mapping
```

Re-pointed: the writer-mirroring claim now reads `isEditableDraft` in `view.ts`
plus its use in the bridge, and the deactivate-for-published claim reads
`version-list.tsx`. The three item-rule tokens read `_designer/designer-panes.tsx`.
Four runtime blocks were rewritten for the register/workbench navigation, and
`ImpactPanel` gained a named region so the impact test has a stable hook
instead of the CSS-module class `.sq-impact`, which no longer exists.

**Nine specs reference this route; only two bind a file this task changed**, and
both sweep clean (36 in-scope assertions, 0 broken). The other seven bind SQL
migrations and unrelated sources.

## A measurement that was wrong until it was checked twice

`getBoundingClientRect()` reported **12 visible required fields** on the
register. `checkVisibility()` reports **0**. Content inside a closed `<details>`
sits under `content-visibility: hidden`: it still has a layout box and a
non-null `offsetParent`, but it is not rendered and not focusable. **A rect is
not a visibility test.** Every "is it really hidden" claim in this record is
`checkVisibility()`.

Separately, I twice read a mid-compile dev-server state as a defect — a second
`<main>` from `RouteLoading`'s loading boundary, and a "wedged" route. Both
resolved on a settled load (`mains: 1`). Neither is a defect; I nearly filed the
first as one.

## Parked

- **The string bags remain.** `PackagesEditors.tsx` and
  `features/admin-packages/editor-strings.ts` still bridge ~120
  `t(key, "English")` calls that owe the `admin-packages` namespace (WEB-013).
  This is the largest remaining debt on the route and wants its own task.
- **The route directory holds 15 files against a cap of 12** (WEB-002 §11).
  `_designer/` absorbed two, but the six editor components belong in
  `components/sections/admin-packages/` with everything else. Moving them
  re-points `cd-008-009-packages`'s `PKG()` bindings, so it is a task, not a step.
- `TemplateStrings.heading` is now unused — the disclosure supplies the label
  from the namespace. It collapses with the bag migration.

## Blocked / open questions

Owed before `done`: **axe** on all four workbench tabs and the register,
a **native Arabic review**, **browser e2e** (the repo-wide chromium and persona
credential blocker from T-119 — the rewritten runtime blocks in
`cd-008-009-packages.spec.ts` are **unverified by execution**; they were written
against the DOM measured by hand in this session), and the **first-load number**
for both surfaces.
