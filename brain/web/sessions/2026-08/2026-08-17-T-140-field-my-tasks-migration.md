# 2026-08-17 · T-140 — `/field/my-tasks` migrated off the parallel design system

`task: T-140` · `status: done` · `duration: ~3h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-009, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/my-tasks` master/detail screen — the second `/field` slice —
onto SAQEEL primitives and the approved Linear language. T-137 measured it at
five `h3`s, no `h1`, and nine off-scale sizes on the parallel stylesheet.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/my-tasks/page.tsx` | rebuilt as a route file | 611 → **16** |
| `features/field-my-tasks/queries.ts` | created — reads, dossier resolution, derivation | 373 |
| `features/field-my-tasks/rows.ts` | created — narrowing from `unknown` | 134 |
| `features/field-my-tasks/labels.ts` | created — enum + status labels, tones | 37 |
| `components/sections/field-my-tasks/my-tasks-screen.tsx` | created | 88 |
| `…/my-tasks-list.tsx` | created (client) | 187 |
| `…/my-tasks-detail.tsx` | created | 156 |
| `…/my-tasks-regulatory.tsx` | created | 66 |
| `…/my-tasks-location.tsx` | created | 38 |
| `…/my-tasks-sync-status.tsx` | created (client) | 46 |
| `…/prepare-assignment-action.tsx` | created (client) | 46 |
| `…/my-tasks.module.css` | created — token-only | 181 |
| `i18n/locales/{en,ar}/field-my-tasks.json` | created — new namespace | 137 each |
| `i18n/messages.ts` | registered `fieldMyTasks` | +4 |
| `components/GeoMap.tsx` | additive `unavailableHeadingLevel` prop | +2 |
| `components/field/FieldLocationMap.tsx` | passthrough of that prop | +6 |
| `app/(app)/field/my-tasks/AssignmentTaskBrowser.tsx` | **deleted** | 211 → 0 |
| `app/(app)/field/my-tasks/TaskHeaderStatus.tsx` | **deleted** | 73 → 0 |
| `app/(app)/field/my-tasks/PrepareAssignmentAction.tsx` | **deleted** | 42 → 0 |
| `app/(app)/field/my-tasks/my-tasks.module.css` | **deleted** | 154 → 0 |
| 4 × `e2e/*.spec.ts` | contracts re-pointed | — |

`actions.ts` and `assignment-task-model.ts` stay in the route folder: both are
pure server/data modules with no styling, `assignment-task-model` is imported by
`/field/visits` too, and the migrated list reuses both unchanged.

## Decisions

**Kept `assignment-task-model.ts` and reused `connectivityPresentation`.** The
list's filter/sort/counts logic and the offline-message derivation were already
pure functions with a passing contract (`scr-ipad-600`). Rewriting them would
have risked the governed filter semantics for no gain; the new client list calls
the exact same functions. The old `AssignmentTaskBrowser` was deleted because it
was UI, not logic.

**Governed enums read the shared `visits.enum`, not the local namespace — and
this was a regression I caught only in the Arabic render.** My first pass routed
risk band, licence status, licence type and establishment status through a local
`copy.status` table, which does not contain `low`/`medium`/`high`. The old code
translated those via `label()` → `t("enum.<v>")` against the shared namespace,
where `low` → `منخفضة` exists. So my first Arabic render showed the risk pill as
`35 · low` in English. Fixed by adding `enumLabel(enums, …)` and threading
`messages.visits.enum` into the detail, exactly as T-138 did. **The list's
operational-state labels stay in the new namespace** because those were in-code
`tr()` pairs the old page owned, and `scr-ipad-600` asserts them there.

**`normal` priority is left as-is.** A visit with `priority: "normal"` renders a
danger `StatusPill` reading `Priority: normal` — the value is not in the
governed low/medium/high/urgent set, so it falls through untranslated. This is
**pre-existing**: the old page rendered any truthy `priority` as `badge-critical`
with the same fallback. Not widened here; parked.

**The map's "Map unavailable" heading needed a level, and the fix is additive.**
GeoMap hard-codes `<Heading level={4}>` for its governed empty state. Under the
home page's `h3` card title that is a valid `h3 → h4`; under this screen's `h2`
"Visit Location" section it is an `h2 → h4` **skip**, which axe's `heading-order`
caught. Added an optional `unavailableHeadingLevel` prop to GeoMap **defaulting to
4** — every one of its other consumers is byte-for-byte unchanged — and passed
`3` through `FieldLocationMap` (now a my-tasks-only component). This is the
mirror of T-138's home-map finding: the same GeoMap state, valid there because of
the surrounding heading, invalid here.

## Inventory taken before writing code

- **State/effects:** the route was already a Server Component. Three genuine
  client leaves remain — the list (search/filter/sort/online state), the sync
  pill (`router.refresh`), and the prepare action (`useActionState`) — each kept
  minimal. The dossier resolution (licence → CR → shared loader) stays on the
  server.
- **Copy:** a local `tr = (key, en, ar) => …` helper at `page.tsx:86` inlined
  both languages at **103** call sites; **95** distinct keys moved to a new
  `field-my-tasks` namespace, Arabic lifted from the existing pairs. Only the
  interpolated `{passed}/{answered}` basis and `{section}` no-source line are new
  shapes.
- **`<svg>` → icons:** 3 raw `<svg>` (back chevron, timeline clock, sync) →
  `previousPage`, `elapsed`, `refresh` from the registry.
- **Accessibility failures found:** six section titles were `<h3>` under a shell
  with no `h1`; the risk/status signals were `badge` spans, some paired with a
  bare `.dot`. All are now `Heading` and text-bearing `StatusPill`s.
- **`as unknown as Assignment[]`** — the banned cast is gone; `rows.ts` narrows
  from `unknown`.

## Numbers

```
Route: /field/my-tasks
route file            611 lines → 16
components ≤ 200      max component 187 (list); queries.ts 373 (feature, < 400)
client islands        1 → 3   (list, sync pill, prepare action — all leaves)
raw <svg> in app      3 → 0
headings              5×h3, no h1 → 1>2>2>2>2>2>2 (+h3 map status), one main
rendered sizes        9 off-scale → 13·15·24  (list) / 13·15·24 (detail)
weight cap            700 → 590
hardcoded copy        103 tr() call sites, 95 keys → 0
typography gate       30 owned violations → 0   (baseline 1336 → 1306)
eslint baseline       7812 → 7720
design-system-v5      75 → 72
source lines deleted  480 (3 components + 154-line stylesheet)
```

## Accessibility

- **axe: 0 WCAG violations** across English/dark and Arabic/dark, on both the
  list-only and full-dossier renders. Best-practice rules (`heading-order`,
  `page-has-heading-one`, `landmark-no-duplicate-main`, `region`, `duplicate-id`,
  `listitem`, `aria-allowed-attr`) also 0 **after** the map-heading fix.
- **Found and fixed:** the `h2 → h4` map-heading skip (above); the Arabic
  risk/licence enum regression (above).
- Manual checklist: keyboard ✓ · Arabic/RTL ✓ (no overflow, acid-lime primary
  flips to the trailing edge) · dark ✓ · master/detail reflow ✓ (single-column
  below 60em, two-pane above). **Light theme, 200 % zoom and browser e2e still
  owed.**
- Status is text-plus-shape throughout (WEB-002 §5): every risk band, visit
  state, licence status and package signal is a labelled `StatusPill`.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (baseline relocked 7812 → 7720)
- [x] `npm run gates:typography` — PASSED (relocked 1336 → 1306)
- [x] `npm run check:design-system-v5` — 72 (was 75)
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] `scr-ipad-600`, `field-a11y-hardening`, `factory360-ipad-field` (run under a
      temporary in-repo config, removed after) — **all green**
- [x] axe on list and full-dossier renders, EN + AR
- [x] temporary axe file removed (404 confirmed), browser theme/locale restored
- [ ] light theme, 200 % zoom, browser e2e — still owed

**One added comment tripped the ratchet and was removed.** A TSDoc block I wrote
for the GeoMap prop is not exempt — GeoMap is not under `components/saqeel/` — so
it read as new comment debt on a file already carrying baselined comments. The
prop name is self-documenting; the comment came out and the baseline held.

**Five spec dependencies re-pointed.** Four read files this migration replaced;
each was re-pointed at the file that now owns the concern:

| Spec | Change |
| --- | --- |
| `scr-ipad-600-assigned-widgets` | reads → `features/field-my-tasks/{queries,rows}.ts`, the new list/prepare components, and the en/ar namespace files; the old in-code `tr(key,en,ar)` assertions became per-locale key assertions (WEB-013) |
| `field-a11y-hardening` | `a11y.scope` assertion → `my-tasks-screen.tsx` |
| `factory360-ipad-field` | dossier-link assertion → `features/field-my-tasks/queries.ts` |
| `design-foundation-contract` | **gradient budget assertion inverted** (below) |

**`design-foundation-contract` encoded a superseded rule.** It asserted the
authenticated tree contains **exactly one** `linear-gradient`, pinned to
`my-tasks.module.css`. WEB-009 §11 sets the gradient budget to **zero**, and the
migrated stylesheet has none. The assertion was flipped to `toBe(0)` and the
pinned-selector check removed — the spec now enforces the current law rather than
the old map-backdrop gradient it was written around.

## Retirement

Deleted at zero imports: `AssignmentTaskBrowser.tsx` (211), `TaskHeaderStatus.tsx`
(73), `PrepareAssignmentAction.tsx` (42), the old `my-tasks.module.css` (154) —
**480 lines**. The route folder drops from 7 files to 3 (`page.tsx`, `actions.ts`,
`assignment-task-model.ts`).

`FieldLocationMap` is **not** retired — it is now a my-tasks-only component,
migrated in place with the additive map-heading prop.

## Parked

- **`normal` priority renders a danger pill with an untranslated label.**
  Pre-existing; the governed priority set is low/medium/high/urgent and `normal`
  is outside it. Belongs to a governed-enum audit, not this migration.
- **The `/field/my-tasks` header duplicates the AppShell**, same as the home
  route (T-138) — search is absent here but the sync pill and title block still
  sit below the shell's own row. IA decision for the channel.
- **`GeoMap` still hard-codes English/Arabic strings** for its unavailable state
  (`"Map unavailable"` / `"الخريطة غير متاحة"`) inside the component. Shared-infra
  debt, not this slice's to move.
- Light theme, 200 % zoom, browser e2e owed for this route.

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild my-tasks master/detail on saqeel primitives
```

## Next

The `/field` channel continues. `drafts` and `establishments` are the next
list-shaped surfaces and both reuse `assignment-task-model`; `[visitId]` (the
visit startup) and `inspection/[id]` (the 1,991-line workspace) are the large
execution screens still on the parallel sheet.
