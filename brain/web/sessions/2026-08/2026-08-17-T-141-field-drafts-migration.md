# 2026-08-17 · T-141 — `/field/drafts` migrated off the parallel design system

`task: T-141` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/drafts` screen — the third `/field` slice — onto SAQEEL
primitives and the approved Linear language. It is the destination of the home
route's "N draft to resume" chip and merges server drafts with offline
IndexedDB drafts.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/drafts/page.tsx` | rebuilt as a route file | 150 → **11** |
| `features/field-drafts/queries.ts` | created — read, fixture exclusion, narrowing | 87 |
| `components/sections/field-drafts/drafts-screen.tsx` | created — composition | 86 |
| `…/draft-list.tsx` | created (client) — the offline merge, on DS primitives | 142 |
| `…/drafts.module.css` | created — token-only | 83 |
| `i18n/locales/{en,ar}/field-drafts.json` | created — new namespace | 19 each |
| `i18n/messages.ts` | registered `fieldDrafts` | +4 |
| `saqeel/icon/icon-registry.ts` | added `info` (`Info`) | +2 |
| `components/field/FieldDraftList.tsx` | **deleted** | 159 → 0 |
| `app/(app)/field/drafts/drafts.module.css` | **deleted** | 44 → 0 |
| `e2e/field-offline-isolation.spec.ts` | offline-accessor path re-pointed | — |

## Decisions

**The offline merge logic was carried across character-identical, but the `let`s
had to go.** `FieldDraftList` read three offline stores (`draftInspectionIds`,
`peekAll`, `getDrafts`) inside a `try/catch`-per-read effect that used **six
`let`s** — baselined debt in the old file, but rule 6 (no `let` in `.tsx`, ever)
means a migrated file lands at zero. Refactored to a single `async safeRead<T>()`
helper returning `{ value, ok }`, so every accumulator is `const`, the per-draft
item counts run through `Promise.all` instead of a mutating `for`-loop, and
`readFailed` is derived (`!idsRead.ok || !opsRead.ok || itemReads.some(…)`). The
governed behaviour — server drafts render immediately, local drafts layer in once
IndexedDB settles, unknown states render nothing rather than a guess — is
unchanged, and `field-offline-isolation`'s `localForUser` assertion still holds.

**`as unknown as VisitRow` is gone.** The old page cast the Supabase row; the new
`queries.ts` narrows from `unknown` in one place and returns only the
`in_progress`, fixture-excluded, published/expired server drafts.

**Added one icon: `info`.** The two footnote panels (offline note, grounding
note) used a raw info-circle `<svg>` and a sparkle. The sparkle maps to the
existing `ai`; the info-circle had no registry entry, so `info` (`lucide/Info`)
was added — the sanctioned mechanism under rule 8. That is the fifth semantic
name this `/field` sweep has added (`create`, `elapsed` in T-138; none in T-140;
`info` here).

## Inventory taken before writing code

- **State/effects:** the route is a Server Component; the one client leaf is the
  draft list, whose effect synchronises with the external IndexedDB stores —
  the sanctioned `useEffect` use (WEB-004 §1). No new state introduced.
- **Copy:** a local `tr(key, en, ar)` helper inlined both languages at **17**
  call sites; all moved to a new `field-drafts` namespace, Arabic lifted from the
  pairs. The queued-items line became the interpolated `{count} items queued`.
- **`<svg>` → icons:** 4 raw `<svg>` (back chevron, draft-card document, offline
  info-circle, grounding sparkle) → `previousPage`, `forms`, `info`, `ai`.
- **Accessibility failures found:** the page had **no `h1`** (the title was a
  `FieldHeader` prop rendering a `<div>`) and **no section heading** — the drafts
  list was an unlabelled `<section aria-label>`; the sync signals were `badge`
  spans with a bare `.dot`. Now `h1` + `h2`, and every signal is a labelled
  `StatusPill`.

## Numbers

```
Route: /field/drafts
route file            150 lines → 11
components            largest 142 (draft-list); queries.ts 87
client islands        1 → 1  (the draft list — external-store sync)
raw <svg> in app      4 → 0
inline style={{}}     14 (page 6 + list 8) → 0
headings              0 → 1>2   one h1, one main
rendered sizes        off-scale → 13·15
weight cap            700 → 590
hardcoded copy        17 tr() sites → 0
`let` in .tsx         6 (carried debt) → 0
typography gate       7 owned violations → 0   (baseline 1306 → 1299)
eslint baseline       7720 → 7669  (−51: the six let removed + others)
design-system-v5      72, unchanged
source lines deleted  203 (FieldDraftList 159 + old stylesheet 44)
```

## Accessibility

- **axe: 0 WCAG violations** across English/dark and Arabic/dark. Best-practice
  rules (`heading-order`, `page-has-heading-one`, `landmark-no-duplicate-main`,
  `region`, `duplicate-id`, `listitem`) also 0.
- **Found and fixed:** no `h1` and no section heading (above); the bare-dot sync
  badges became labelled `StatusPill`s.
- Manual checklist: keyboard ✓ · Arabic/RTL ✓ (no overflow, layout mirrors,
  factory name stays LTR via `dir="auto"`) · dark ✓. **Light theme, 200 % zoom
  and browser e2e still owed.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (relocked 7720 → 7669)
- [x] `npm run gates:typography` — PASSED (relocked 1306 → 1299)
- [x] `npm run check:design-system-v5` — 72, unchanged
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] axe on the rendered page, EN + AR
- [x] temporary axe file removed (404 confirmed), browser theme/locale restored
- [ ] light theme, 200 % zoom, browser e2e — still owed

**A dev-server note carried over from T-139.** The running dev server still logs
`RevampFactory360Portfolio`/`RevampOperationsCenter` 500s in its module graph
even after a restart — a stale-cache artefact of that rename, unrelated to this
task. The drafts route compiled and rendered correctly (verified `h1` + axe),
and `/factories` served without a 500 when checked directly, so the source is
clean; the noise is the dev server's HMR cache. A cold `.next` wipe clears it.

## Retirement

Deleted at zero imports: `FieldDraftList.tsx` (159), the old `drafts.module.css`
(44) — **203 lines**. The route folder is now a single `page.tsx`.

## Parked

- **The back-button chevron does not mirror in RTL.** `icon="previousPage"` on
  the saqeel `Button` renders a `ChevronLeft` that stays left-pointing in Arabic,
  because `Button` exposes no `mirrored` passthrough (`Icon`/`IconButton` do).
  This is the **same gap logged for `immediate-return-link` (T-052)** and is
  identical on the my-tasks back button (T-140) — a shared-component change that
  should fix every back control at once, not a per-slice patch.
- **The count pill reads "1 drafts".** No pluralisation; the old page did the
  same (`{n} {word}`). Belongs to a WEB-013 plural pass, not this migration.

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild drafts on saqeel primitives, offline merge intact
```

## Next

The `/field` list-shaped surfaces continue: `establishments` and the
`visits`/`visits/calendar` pair (the latter two already import
`assignment-task-model` and `FieldHeaderSync`). The large execution screens —
`[visitId]` startup and the 1,991-line `inspection/[id]/Workspace` — remain.
