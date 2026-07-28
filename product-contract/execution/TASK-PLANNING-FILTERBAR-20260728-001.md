# TASK-PLANNING-FILTERBAR-20260728-001

| Field | Value |
|---|---|
| task_id | `TASK-PLANNING-FILTERBAR-20260728-001` |
| parent_task | `SAQEEL-BOARD-DELIVERY-001` |
| change_control_id | `SAQEEL-WORKFORCE-REINSTATEMENT-20260725` |
| card | `planning` |
| channel | `web` |
| lease | `LEASE-SAQEEL-PLANNING-001` (GRANTED, holder `codex`) |
| gate | G10 verification / G11 hardening |
| issued | 2026-07-28 |
| repo | `/Users/vikramindla/Developer/Inspection` |

Each finding is self-contained: file, line, exact current text, exact
replacement. Verification is `grep` + `tsc` only. No browser, no design server,
no `.dc.html`, no git merge/reset/commit operations.

---

## Hard rules — apply to every finding

Source: `CLAUDE.md`.

- No new CSS class, no new CSS file, no styled-component, no Tailwind utility,
  no `style={{ }}` prop.
- No raw hex / `rgb()` / `hsl()` / px font-size / px radius. Semantic tokens only.
- Logical properties only. No `left`/`right`. No `[dir="rtl"]` rule that flips a value.
- Never invent a governed value. Absent data renders **Not configured**.
- Do not rename routes or query-param names. Do not change the GET-form / URL
  state contract on `/planning`.

---

## Finding index

| ID | Sev | Action | File |
|---|---|---|---|
| F1 | P0 | FIX | `saqeel-components.css:68` |
| F2 | P0 | REPORT ONLY | `saqeel-components.css:97` |
| F3 | P1 | REPORT ONLY | `saqeel-components.css:98,101` |
| F4 | P1 | REPORT ONLY | `saqeel-components.css:241` |
| F5 | P1 | FIX | `planning/page.tsx:364` |
| F6 | P1 | FIX | `planning/page.tsx:281` |
| F7 | P2 | FIX | `planning/page.tsx:286` |
| F8 | P2 | FIX | `planning/page.tsx:366` |
| F9 | P0 | PARTIAL FIX | `planning/PlanningPreview.tsx:52,58,59,61` |
| F10 | P1 | FIX | `planning/PlanningPreview.tsx:64` |
| F11 | P2 | DO NOT TOUCH | `planning/PlanningPreview.tsx:49,52,53,54` |

---

## F1 — P0 — Field label styling never applies

**File:** `apps/web/src/app/saqeel-components.css:68`

**Current:**

```css
.field > label {
  font-size: var(--type-label-size); font-weight: var(--type-label-w);
  color: var(--text-secondary); line-height: var(--type-label-lh);
}
```

**Why it is broken:** every consumer writes `<label className="field"><span>Text</span>…`
— the `.field` element *is* the label, so the text is a `<span>` child, not a
`<label>` child. The selector matches nothing. 26 occurrences of
`<label className="field">` exist. Label text falls back to inherited body
typography instead of `--type-label-size` / `--type-label-w` / `--text-secondary`.

**Replace with:**

```css
.field > label, .field > span:first-child {
  font-size: var(--type-label-size); font-weight: var(--type-label-w);
  color: var(--text-secondary); line-height: var(--type-label-lh);
}
```

Use `:first-child`, **not** a bare `.field > span`. `.field-help` (line 92) and
`.field-error` (line 93) are also span children and must keep their own
typography — they are defined later in the file so they would win on
`font-size`/`color` anyway, but `:first-child` keeps the intent explicit.

**Blast radius:** 87 elements carry `className="field"` across `apps/web/src`.
After the edit, grep them and confirm none render a non-label span first.
Report the count you checked.

**Related, report only — do not change:** there are two competing label systems.
`.field > label` (`saqeel-components.css:68`) is small / subtle / `--text-secondary`.
`.sq-field__label` (`saqeel-runtime.css:115`) is `font: var(--type-body-strong)`
and has 262 consumers. They are not visually equivalent. Do not unify them in
this task. State in your report which one the planning filter should use.

---

## F2 — P0 — Raw hex in the select chevron; chevron is theme-blind

**File:** `apps/web/src/app/saqeel-components.css:97`

**Current:**

```css
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371787e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
```

**Why it is broken:** `%2371787e` is `#71787e` — a raw hex, banned by CLAUDE.md
rule 2. It is the light-theme value of `--neutral-600` (`tokens.css:111`), frozen
into a data URI, so the chevron never responds to the theme. It is the only
hardcoded hex in `saqeel-components.css`. Confirm with:

```bash
grep -no "stroke='%23[0-9a-fA-F]*'" apps/web/src/app/saqeel-components.css
```

**Action: REPORT ONLY — do not invent a fix.** Analysis to hand back:

- A data-URI `background-image` cannot read `currentColor` or a CSS variable.
- `mask-image` + `background-color` is unavailable: `.select` already uses
  `background` for `--surface-primary`, and there is no `mask-image` precedent
  anywhere in the repo (grep returns zero).
- A pseudo-element chevron will not render: the element is a `<select>`.
- `.input-affix` (`saqeel-components.css:102`) is the DS's existing
  icon-inside-control pattern, but it targets `.input` and would require a
  markup change at every select consumer.

Present these three options and stop. **Do not add a `[data-theme]` rule
containing a second hex** — that doubles the violation.

---

## F3 — P1 — Physical direction + RTL flip override on the select chevron

**File:** `apps/web/src/app/saqeel-components.css:98` and `:101`

**Current:**

```css
  background-repeat: no-repeat; background-position: right var(--space-2) center;
  padding-inline-end: var(--space-6);
}
[dir="rtl"] .select { background-position: left var(--space-2) center; }
```

**Why it is broken:** CLAUDE.md rule 7 bans physical `left`/`right` **and** bans
a `[dir="rtl"]` override that flips a value. This does both.

**Action:** replace with a single logical expression on `.select` and delete the
`[dir="rtl"] .select` rule entirely. Note that `background-position` has no
logical keyword — resolve it with an inline-direction-aware technique that
introduces no new class and no second rule. If no such technique exists in plain
CSS without adding a rule, say so and leave both lines untouched rather than
half-fixing it.

**Verify:**

```bash
grep -c '\[dir="rtl"\]' apps/web/src/app/saqeel-components.css
```

Must be exactly one lower than your starting count, or unchanged if you report
instead of fixing. Never higher.

---

## F4 — P1 — Filter toolbar has no column grid

**File:** `apps/web/src/app/saqeel-components.css:241`

**Current:**

```css
.grid-toolbar { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-block-end: var(--border-w) solid var(--border-subtle); background: var(--surface-primary); flex-wrap: wrap; }
```

**Why it is broken:** flex + wrap gives each wrapped row independent widths, so
row 1 and row 2 of the `/planning` filter bar do not share column tracks and
nothing aligns vertically. `align-items: center` vertically centres children of
unequal height instead of aligning their control baselines — `.field` children
are column-flex (label over input) so their heights differ from a bare button.

**Action: REPORT ONLY** unless you can make the change with zero regression.
This class is shared, not planning-specific. Before proposing anything:

```bash
grep -rn "grid-toolbar" apps/web/src --include="*.tsx" | wc -l
```

List every consumer and state, per consumer, whether a grid conversion would
change its rendering. Hand back the list and your recommendation. Do not edit a
shared class on the strength of one screen.

---

## F5 — P1 — Filter action buttons sit outside the field grid

**File:** `apps/web/src/app/(app)/planning/page.tsx:364`

**Current:**

```tsx
<div>
  <button type="submit" className="btn btn-primary">{tr("plan.list.apply", "Apply", "تطبيق")}</button>
  <a className="btn btn-secondary" href="/planning">{tr("plan.list.reset", "Reset", "إعادة تعيين")}</a>
</div>
```

**Why it is broken:** every sibling in this form is `<label className="field">`
— a column flex with a label span above the control. This div has no class, so
it gets no label spacer and no gap. Apply/Reset land off the control baseline
and sit flush against each other.

**Action:** use the same `.field` shell, carrying an empty first span so the two
buttons align to the other controls' baseline. Existing classes only — add no
class, add no CSS. Reference the sibling markup at `page.tsx:283` for the shape.

---

## F6 — P1 — Filter form has no accessible name

**File:** `apps/web/src/app/(app)/planning/page.tsx:281`

**Current:**

```tsx
<form method="get" action="/planning" className="grid-toolbar">
```

**Why it is broken:** 14 form controls follow with no grouping label. A screen
reader announces them as orphans immediately after the KPI tab group.

**Action:** same form element carrying an `aria-label` built through the existing
`tr()` helper with EN and AR strings. Copy the pattern already used on the
`kpi-grid` `role="group"` at `page.tsx:268`. Arabic goes through `tr()`, never
inline in the component (CLAUDE.md rule 8).

---

## F7 — P2 — Search placeholder overflows its field

**File:** `apps/web/src/app/(app)/planning/page.tsx:286`

**Current placeholder (EN):**

```
Visit reference, plan reference, CR, licence, factory or inspector…
```

**Why it is broken:** seven items in a placeholder; it truncates mid-word at the
rendered field width (`…factory or in`).

**Action:** shortened EN string and a matching shortened AR string, both through
`tr()`. The full searchable-field list belongs in help text, not the placeholder.
If the design does not show help text under this field, just shorten the string
— do not add a `.field-help` element speculatively.

---

## F8 — P2 — Reset is live when there is nothing to reset

**File:** `apps/web/src/app/(app)/planning/page.tsx:366`

**Current:**

```tsx
<a className="btn btn-secondary" href="/planning">…</a>
```

**Why it is broken:** renders active even with an empty query string.

**Action:** same anchor, plus `aria-disabled="true"` when no filter, search or
sort param is present in the URL. `.btn` already carries the
`[aria-disabled="true"]` rule at `saqeel-components.css:17` — reuse it, add
nothing. Keep it an anchor; do not convert to a button (that would change the
GET/URL contract).

---

## F9 — P0 — Four `style={{ }}` props on the planning landing

**File:** `apps/web/src/app/(app)/planning/PlanningPreview.tsx`

**Current — line 52:**

```tsx
className={`sq-surface wa-planning-method ${styles.method}`} style={{ textDecoration: "none", color: "inherit" }}>
```

**Current — line 58:**

```tsx
<section className="sq-surface" aria-labelledby="wa-m2-plans-heading" style={{ overflow: "hidden" }}>
```

**Current — line 59:**

```tsx
<h2 id="wa-m2-plans-heading" style={{ margin: 0, fontSize: "var(--type-page-title-size)" }}>{copy.plans}</h2>
```

**Current — line 61:**

```tsx
<p className="sq-caption" style={{ padding: "var(--space-6)" }}>{copy.noDrafts}</p>
```

**Why it is broken:** CLAUDE.md rule 1 bans `style={{ }}` outright. Four violations.

**Action:** move each declaration into the rule that the **same element already
carries** in `apps/web/src/app/(app)/planning/PlanningPreview.module.css` —
`.method` (line 8) absorbs line 52's `text-decoration` and `color`; `.methods`
(line 1) already exists. Add no new class and no new file.

Lines 58, 59 and 61 target elements with **no** existing module rule. For those,
stop and report — do not create a rule to receive them. The module has no
`.icon`/`.copy` gap for these; do not repurpose them.

**Verify:**

```bash
grep -c "style={{" "apps/web/src/app/(app)/planning/PlanningPreview.tsx"
```

Should drop by exactly the number you fixed. Report the remaining count and
which lines they are on.

---

## F10 — P1 — Draft status renders raw and untranslated

**File:** `apps/web/src/app/(app)/planning/PlanningPreview.tsx:64`

**Current:**

```tsx
<td>{draft.method}</td><td><span className="sq-lozenge sq-lozenge--info">{draft.status}</span></td>
```

**Why it is broken:** `draft.status` is a raw string typed `status: string`
(`PlanningPreview.tsx:4`). It renders directly into the lozenge — no governed
label, no AR translation. The AR copy block at lines 22–33 translates the column
**header** but not the value.

**Action:** route the value through the component's existing `copy` object
pattern (the `ar ? {...} : {...}` block at line 22). If no governed label set
exists for planning draft status, render **Not configured** per CLAUDE.md rule 10
and report the gap. Do not invent status labels.

---

## F11 — P2 — Inert contract classes — do not touch, do not implement

**Files:** `apps/web/src/app/(app)/planning/PlanningPreview.tsx:49,52,53,54`

`.wa-planning-methods` / `.wa-planning-method` / `.wa-planning-method__icon` /
`.wa-planning-method__copy` exist in **zero** stylesheets. Confirm:

```bash
grep -rn "wa-planning-method" apps/web/src/app/*.css
```

Returns nothing. They are inert selector hooks, and three e2e specs select on them:

- `apps/web/e2e/cd-020-planning-home.spec.ts:31`
- `apps/web/e2e/web-admin-m2-batch-002.spec.ts:77`
- `apps/web/e2e/shell-f0-design-system.spec.ts:84`

Leave the class names exactly as they are. Do not write CSS for them, do not
rename them, do not delete them. Listed here so they are not "cleaned up".

---

## Out of scope — do not implement, needs a product ruling

- Moving Sort out of the filter form (`page.tsx:358`). Sort is a view control,
  not a filter, but relocating it changes the form's submitted params.
- Progressive disclosure / active-filter chips for the 14-control bar.
- Native `<input type="date">` renders `dd/mm/yyyy` from browser locale and will
  not translate under AR (`page.tsx:339-352`). Inherent to the native control.
- A `blockedReason` field on the planning `Method` contract. Neither
  `CreateVisitSection.tsx` nor `PlanningPreview.tsx` types declare it and no
  caller supplies one. Adding it is a governed-contract decision.
- The curated-preset targeting UX conflict recorded in the board card's own
  `pending[]` entries. Product Owner decision, explicitly excluded by
  `LEASE-SAQEEL-PLANNING-001`.

---

## Verification — run these only

```bash
cd apps/web && npx tsc --noEmit -p tsconfig.json
```

```bash
grep -rnE "(#[0-9a-fA-F]{3,8}|rgba?\(|hsl[a]?\()" apps/web/src/app/saqeel-components.css
```

```bash
grep -c '\[dir="rtl"\]' apps/web/src/app/saqeel-components.css
```

```bash
grep -c "style={{" "apps/web/src/app/(app)/planning/PlanningPreview.tsx"
```

```bash
grep -rn "wa-planning-method" "apps/web/src/app/(app)/planning/PlanningPreview.tsx"
```

Expected: `tsc` clean; no **new** hex hits versus your starting count; the
`[dir="rtl"]` count equal or lower, never higher; the `style={{` count lower;
all four `wa-planning-*` hooks still present.

`tsc --noEmit` and `next build` are the gate. Playwright is not
(`CURRENT_SLICE.yaml` standing boundary).

---

## Reporting

Per finding: **fixed / report-only / blocked**, with before-and-after grep
numbers. Do not commit. Do not push.

---

## Prior state of the working tree (context, no action required)

The merge that was in progress on `fix/brand-mark-patch` had two unresolved
conflicts in the planning card. Both are resolved and staged; `tsc` is clean.
The merge is **uncommitted** — do not commit it, do not `git merge --abort`,
do not reset. Work on top of the staged tree.

| File | Resolution |
|---|---|
| `CreateVisitSection.tsx` | Took HEAD (`sq-typecard` family). Dropped the incoming `blockedReason` branch — `CreateVisitMethod` has no such field and no caller supplies one, so it was dead code that would not compile. |
| `PlanningPreview.tsx` | Took HEAD, plus restored the `import styles from "./PlanningPreview.module.css"` the merge had dropped (HEAD used `styles.*` with no import). HEAD wins because three e2e specs assert on `.wa-planning-method*`, which the incoming side deleted. Incoming's `planningDraftLabel` / `planningDraftHelp` were undefined identifiers. |
