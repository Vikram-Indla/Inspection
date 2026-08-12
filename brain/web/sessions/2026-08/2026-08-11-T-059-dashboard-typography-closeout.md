# 2026-08-11 · T-059 — `/dashboard` typography closeout, both views verified

`task: T-059` · `status: done` · `duration: 2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011, WEB-014`

---

## Goal

Close `/dashboard` typography properly: render both views in a signed-in
browser, fix what the render exposes, and migrate feature CSS onto the type
primitives so the drift cannot return.

## What changed

| File | Action |
| --- | --- |
| `saqeel/card/card.module.css` | `CardValue[data-size="md"]` retired-`title` → `metric` |
| `saqeel/data-table/data-table.module.css` | `.head` `overline` → `label`; `.caption` `caption` → `body` |
| `saqeel/type/text.tsx` + `type.module.css` | added `tone="inherit"` |
| `components/Shell.tsx` | page title `<h2>` → `<Heading level={2} visual="display">` |
| `dashboard/metric-card/{tsx,module.css}` | detail block → `Text`; summary label → `Text`; CSS typography removed |
| `dashboard/metric-strip/{tsx,module.css}` | label + sub → `Text`; CSS typography removed |
| `dashboard/executive-brief/{tsx,module.css}` | 5 paragraphs → `Text`; CSS typography removed |
| `dashboard/dashboard-sections/{tsx,module.css}` | 4 paragraphs → `Text`; CSS typography removed |
| `dashboard/enforcement-trend/{tsx,module.css}` | current + footnote → `Text`; CSS typography removed |
| `dashboard/operational-view/{tsx,module.css}` | footnote → `Text`; CSS typography removed |
| `dashboard/compliance-explorer/{tsx,module.css}` | rate → `Text role="bodyStrong"`; CSS typography removed |
| `dashboard/search-results/{tsx,module.css}` | group heading → `Overline`; CSS typography removed |
| `dashboard/dashboard-toolbar/{tsx,module.css}` | timestamp → `Text`; CSS typography removed |
| `dashboard/strategic-view/strategic-view.module.css` | dead `.footnote` rule deleted |
| `dashboard/explain-panel/explain-panel.module.css` | inverted key/value sizes corrected |
| `dashboard/dashboard-skeleton/dashboard-skeleton.tsx` | 3 × `eyebrow` → `description` |
| `scripts/typography-baseline.json` | re-levelled 1,130 → 1,104 |

## Decisions

**Rendering both views found three defects that source reading had missed.**
This is the entire argument for WEB-008's browser requirement:

1. **KPI numbers were rendering at two sizes** — 30px and 28px on the same
   screen. `CardValue size="md"` still pointed at the retired `title` alias
   (which T-057 mapped to `display`/30px) while the default used `metric`/28px.
   This is *the same defect* the owner originally reported as "81.5 is so big
   compared to the rest", surviving two prior tasks because both call sites were
   token-clean and the gate cannot see that two tokens disagree. Now every number
   in the app is `metric`.
2. **Table headers were 11px** while every other label was 12px —
   `DataTable.head` used `overline`. WEB-014 §2 assigns table column headers to
   `label`. Fixed in the shared primitive, so every table in the app follows.
3. **The page title had no font rule at all.** `.sq-pagehead__context > h2` in
   the frozen `saqeel-runtime.css` sets only layout, so the `<h2>` fell back to
   the **browser default** (22px, off-scale) on every route. This is the missing
   "typographic top end" diagnosed at the very start of this work — `display`
   was used exactly once in the entire application. Now `Heading visual="display"`.

**`tone="inherit"` was added to the type primitive.** A `<summary>` or button
owns its own colour (`--sqx-action-tertiary-text`), and a text primitive nested
inside must be able to defer rather than force a tone. Without it the only way
to keep the interactive colour was to leave `font:` in feature CSS — i.e. the
missing tone was actively preventing migration.

**The loading skeleton was fixed to match the real card.** It still rendered an
eyebrow line above the title after T-058 removed the eyebrow from `MetricCard`,
so the layout shifted when data arrived. Skeletons are part of the contract, not
decoration.

**`explain-panel` is deliberately left unmigrated (8 violations).** Its `<h2>`
carries `tabIndex={-1}` and a `ref` for dialog focus management, which `Heading`
does not yet support; adding that is a primitive change and this task had
already made two. Its *visual* defect — the key rendering at 14px and its value
at 12px, so the value was smaller than its own label — **was** fixed.

**`dashboard.module.css` (13 violations) stays untouched** — the orphaned
`DashboardView` tree from T-058. It is a deletion, not a migration.

## Inventory taken before writing code

- Both views rendered and audited in a signed-in browser (see Verification).
- Every `font:`/`font-size`/`letter-spacing` declaration in the 11 live
  dashboard components enumerated before any edit.
- Import graph re-walked to confirm `dashboard.module.css` is still dead.
- No new i18n keys; no new client islands; no `<svg>` added.

## Numbers

```
                              before        after
distinct sizes — strategic       8            4     (28 · 20 · 14 · 12)
distinct sizes — operational     5            4     (28 · 20 · 14 · 12)
off-scale sizes                  1 (22px)     0
typefaces rendered               1            1
KPI number sizes                 2 (30,28)    1 (28)
typography violations (route)   44           21
typography violations (repo) 1,130        1,104
```

Both views now render the **identical** size set — the first time that has been
true.

## Accessibility

- **axe:** still not run — needs the production build. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — `Heading level={2}` preserves the page-title outline;
    `Overline as="p"` keeps the `id` that `ListRows labelledBy` points at; the
    `dt`/`dd` pair in the explain panel is unchanged structurally
  - **DOM nesting checked** — `Text` renders `<p>` by default, so `as="span"`
    was used everywhere the parent is inline (`.foot`, `.summary`, trend
    summary, compliance cell). Console shows no `validateDOMNesting` warnings.
  - keyboard / 200% zoom / dark / reduced motion — unaffected
  - **320px — still not verified. Owed.**
  - **Arabic/RTL — still not verified**, and still blocked by the parked
    `lang="en"` finding.
- Table headers rose 11px → 12px; the explain-panel value rose 12px → 14px.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 1,104 known, 0 new
- [x] **Strategic view rendered and audited signed-in** — 4 sizes, 0 off-scale,
      one typeface
- [x] **Operational view rendered and audited signed-in** — 4 sizes, 0 off-scale,
      one typeface
- [x] Title-above-subtitle confirmed in rendered text: *"Inspection coverage
      against annual target"* then *"Are we achieving the national inspection
      strategy?"*
- [x] Type primitive confirmed in the live DOM
      (`class="type_text__…" data-role="label" data-tone="inherit"`)
- [x] Console checked for React nesting warnings — none
- [ ] `npm run lint` — script still does not exist (parked)
- [ ] `npm run gates` — still red on the pre-existing `check:design-system-v5`
      date rules (parked, not introduced here)
- [ ] axe, 320px, Arabic/RTL — **owed**

**A console entry reading `ReferenceError: Text is not defined at MetricCard`
appears in the buffer and is a false alarm** — it was emitted during the HMR
compile between adding the JSX and adding the import. Verified stale by
confirming the component renders its full `<details>` body with the primitive's
generated class in the live DOM.

## Retirement

Unchanged from T-058: the orphaned `DashboardView` tree awaits a deletion task.
`CardHeader.eyebrow` drops from 24 → 21 call sites (the 3 skeleton uses are
gone); the prop is deleted when the count reaches 0.

## Parked

- `Heading` needs `ref` + `tabIndex` support before `explain-panel` can migrate.
  React 19 takes `ref` as a plain prop, so this is small — but it is a
  design-system change and belongs in its own task.
- `.sq-pagehead` is still legacy `.sq-` markup in `Shell.tsx` reading from the
  frozen `saqeel-runtime.css`. Only its title is fixed; the header itself wants
  migrating with the shell.

## Blockers

None.
