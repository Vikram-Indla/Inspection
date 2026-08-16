# 2026-08-16 · T-124 — `/admin/packages`, where eleven impact reports rendered at once

`task: T-124` · `status: partial — register, states and naming done; the editor components are T-125; axe, Arabic review and browser e2e owed` · `duration: 5h`
`rules applied: WEB-000 … WEB-014`

---

## Correction — this record certified "no functional regression" and two features were gone (added by T-126)

**`NewDraftForm` and `TemplateRegistry` were dropped from the render tree by
this task.** Both files kept compiling, typechecking, and passing lint,
typography and v5. Nothing imported them into the page.

```
rendered at e84ce9bd^      rendered after T-124
NewDraftForm               —
TemplateRegistry           —
```

`PublishControls.tsx:90` is the only path to `createDraftVersion`, so from this
task until T-126 **a writer could not create a version for an existing
package** — exactly the state the "No versions" filter selects for.

This is the second defect this record certified clean, after the ten spec
assertions T-125 found. Both were the same failure: **the code was checked for
being well-formed and never for being reachable.** WEB-008's first standing
sweep is the one that catches it, and it is two lines:

```
git show <base>:page.tsx | grep -oE "<[A-Z][A-Za-z]+\b" | sort -u
grep -rhoE "<[A-Z][A-Za-z]+\b" <new sources> | sort -u
```

Fixed in [T-126](2026-08-16-T-126-packages-workbench.md).

---

## Goal

Migrate the `/admin/packages` register, its four states and its identity onto
SAQEEL; judge whether any chart fits; leave the package **designer** components
to T-125.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `admin/packages/page.tsx` | rebuilt, composition only | 574 → **40** |
| `admin/packages/layout.tsx` | route-owned permission boundary | 5 → 13 |
| `admin/packages/loading.tsx` | layout-mirroring skeleton | 22 → 8 |
| `admin/packages/error.tsx` | rebuilt on primitives | 30 → 45 |
| `admin/packages/PackagesEditors.tsx` | **created** — bridge to the legacy editors | 0 → 110 |
| `features/admin-packages/*` | created — queries · view · impact · editor-strings · strings | 0 → 420 |
| `components/sections/admin-packages/**` | created — 7 components + 7 modules | 0 → 380 |
| `i18n/locales/{en,ar}/admin-packages.json` | created — **86 keys × 2** | 0 → 172 |

`actions.ts`, `DraftEditor`, `PackagePreview`, `PublishControls`,
`TemplateRegistry`, `ImpactPanel` and `packages.module.css` are **untouched** —
T-125.

## Decisions

**Eleven publish-impact reports rendered at once.** `open={version.status ===
"draft" || index === 0}` opened the first version of every package, so the
screen was eleven expanded impact reports stacked vertically — *"In-flight work
on prior published versions"*, *"Other published packages sharing these items"*,
*"Changes vs the currently published version"*, each ×11. That, plus 22 prose
blocks, **was** the screen at **479 leaf nodes**.

Impact is now a per-version `<details>`, closed by default.

```
impact panels open   11 → 0
leaf nodes in cards       203
```

**Stated honestly: `<details>` collapses the panel visually, it does not remove
it from the DOM.** All eleven impact reports are still serialised (document
≈ 498 KB). Making impact genuinely on-demand needs a per-version server action,
which is a bigger change than this task — parked below with its measurement.

**No chart fits, and that is the finding.** Six candidates were judged against
the real data — **10 packages, 11 versions, 9 items**:

```
declined  version status distribution   9 published / 2 draft / 0 locked — 2 non-zero, one dominant
declined  items-in-use gauge            denominator 9; the sentence says more
declined  packages by scope             scope is free text, not a governed enum
declined  items per package             10 bars of config counts a designer cannot act on
```

This is a **configuration workbench, not an analytics surface**. The two gauges
on `/admin/localization` earned their place because 1,797/1,821 and 0/1,797 were
governed ratios that changed what the reader understood. Nothing here clears
that bar, and T-113/T-115's test — *count the non-zero categories before
choosing a form* — rules out every distribution on the page.

**The screen had four names.** Rail *Survey Configuration*, page *Inspection
Forms*, loading *Package library & designer*, body *Inspection packages,
tracked by version*. Now one: **Inspection packages**. The rail is
`lib/shell-navigation.ts` and is **not** changed here — see Parked, because
unlike T-123 this label has a `businessTab` grouping key attached to it.

**Effective-date windows were evaluated in UTC.** `currentPublished` used
`new Date().toISOString().slice(0, 10)`, so between 21:00 and midnight Riyadh
the "currently published" version could resolve to the wrong one. Now
`riyadhToday()` from `lib/dates.ts`, threaded through as `today`.

**Three tabs left the route** (`/admin/items`, `/admin/templates`, an anchor)
plus a second three-step "configuration journey" strip that also left. Third
occurrence of this defect. The tab row is now the four package states.

**`Definition` is mirrored in `view.ts`, not imported from the editor.**
`DraftEditor`'s types are module-private, and a feature module importing from an
app component would invert the layering (WEB-000 §6). The shape is duplicated
deliberately and collapses in T-125.

## Inventory taken before writing code

Both WEB-008 sweeps.

**Sweep 1 — loaded vs rendered.** Four reads: packages+versions, item bank,
templates, violations. The screen rendered `publishedPackages` and
`draftPackages` and dropped the per-version status breakdown; that is now the
filter row. **The UTC/Riyadh defect surfaced from this sweep**, because reading
what `currentPublished` compares against is the same exercise.

**Sweep 2 — grep `e2e/` for source paths.** **9 specs** pinned to
`admin/packages`.

> **CORRECTED BY T-125 — this task's original claim was wrong.** It read *"None
> needed re-pointing … verified by running the static suite before and after,
> 408 passed both times."* Six assertions in `cd-008-009-packages.spec.ts` were
> in fact broken by this task: `WRITER_ROLES` as a `new Set([…])` literal in
> `page.tsx`, `version.status === "draft" && canWrite`, `canWrite && <section`,
> `mandatoryWhenVisible`, `scoringEnabled: response.scoring_enabled !== false`,
> and `aria-busy="true"` in `loading.tsx`.
>
> **The verification was the error, not the sweep.** That spec is not in
> `playwright.static.config.ts`'s allowlist, so "the static suite is unchanged"
> could never have covered it — and the spec's own tests cannot run at all here
> because its describe block needs a browser. Re-pointed in T-125; the
> `aria-busy` one was not a behavioural regression, because `SkeletonRegion`
> sets it, so only the spelling moved.

- **State**: none in the register; filter and search are URL state (rung 2).
- **Effects**: none added.
- **Accessibility failures found**: heading outline ran `H1 → H2 → H3 → H4 ×11
  → H3 → H2 → H2`, with *"Publish impact"* as eleven identical H4s. Now one H2
  per package card.

## Numbers

```
route file          574 → 40 lines      largest new component  110
typography          66 → 77 removed     (+11; 38 remain, all T-125 files)
eslint              74 → 81 removed     (+7)
i18n                0 → 86 keys × 2     copy(en, ar) in the register → 0
impact panels open  11 → 0              leaf nodes in cards → 203
screen names        4 → 1               tabs 4 (3 off-route) + journey → 4 states
reconstruction note 1 → 0               "Boundaries kept visible" 1 → 0
static e2e          408 passed, 33 failed — unchanged, none new
v5                  77 → 77
```

## Verification

- [x] `npm run typecheck` — exit 0
- [x] `npm run lint` — PASSED, 81 removed
- [x] `npm run gates:typography` — PASSED, 77 removed
- [ ] `npm run check:design-system-v5` — 77, pre-existing
- [x] `npm run test:static` — 408 passed, 33 failed, all pre-existing

**Measured on the server-rendered payload and the live DOM:**

```
status              200            impact panels open  0 of 11
headings            H1 → H2 per package, no H4 repeats
removed             Reconstruction note 0 · "Inspection Forms" 0 · "Boundaries kept visible" 0
filters             all 11 cards · filter=draft 3 · q=UAT 3
Arabic              lang=ar dir=rtl · title, filters, governance all Arabic
                    Arabic-Indic digits in cards · untranslated English 0
                    Latin remaining = package codes and version labels only (WEB-013 §3)
responsive          320px and 1440px, LTR and RTL: overflow-x 0, elements outside viewport 0
RTL filters         1108 → 1023 → 940 → 834, mirrors correctly
```

## Two mistakes, both caught by measuring

**I deleted `packages.module.css` and the route returned 500.** `page.tsx` no
longer imported it, so I removed it — without checking the other importers.
`DraftEditor.tsx:6` still imports it. Restored with `git show`. **This is T-093's
lesson exactly** — *"acting on the tool's answer would have deleted three live
stylesheets"* — and the check is one grep. It also means the file's 2 typography
violations belong to T-125, not to this task's count.

**I changed what "Draft" counts without noticing.** Making the states mutually
exclusive meant a package with both a publish and an open draft counted only as
published, so the Draft filter read **0** where the old metric read **2**. A
filter is not a partition: `draft` now means *has an open draft*, which is the
operational question someone actually asks. Caught by comparing the rendered
count against the old screen's, not by any gate.

## Parked

- **T-125 — the package designer.** `DraftEditor` (18 KB), `PackagePreview`,
  `PublishControls`, `TemplateRegistry`, `ImpactPanel` and
  `packages.module.css`: **38 typography violations and ~60 eslint findings**.
  `PackagesEditors.tsx` and `features/admin-packages/editor-strings.ts` exist
  only to bridge to them and both disappear with that task.
- **Impact is collapsed, not deferred.** ~498 KB still crosses the wire. A
  per-version server action would make it genuinely on-demand.
- **The rail still says *Survey Configuration*.** Unlike T-123's entry, this one
  carries `businessTab: "Survey Configuration"`, which is a grouping key rather
  than a label — renaming the label without ruling on the grouping key would
  leave them inconsistent. Owner call.

## Blocked / open questions

Owed before `done`: **axe** on all four states in both themes and directions, a
**native Arabic review of 86 keys** (I wrote the Arabic), **browser e2e** (still
the repo-wide chromium and credentials blocker), and the **first-load number**
as a measurement request.
