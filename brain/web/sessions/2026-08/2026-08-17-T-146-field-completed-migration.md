# 2026-08-17 · T-146 — `/field/completed` (list + receipt) migrated off the parallel design system

`task: T-146` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-009, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/completed` surface — the completed-inspection history list and
the `[id]` completion-receipt detail — onto SAQEEL primitives and the approved
Linear language. Both read only immutable submission versions and share the
offline history cache, so they migrate as one task.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/completed/page.tsx` | rebuilt as a route file | 110 → **11** |
| `app/(app)/field/completed/[id]/page.tsx` | rebuilt as a route file | 97 → **15** |
| `features/field-completed/queries.ts` | created — list + receipt load, narrowing | 124 |
| `components/sections/field-completed/completed-screen.tsx` | created | 40 |
| `…/completed-history-list.tsx` | created (client) — offline cache | 55 |
| `…/completed-card.tsx` | created — one history card | 43 |
| `…/completed-receipt-screen.tsx` | created — the receipt detail | 103 |
| `…/completed-unavailable.tsx` | created — receipt error branch | 30 |
| `…/locked-notice.tsx` | created — the lock banner (shared) | 12 |
| `…/completed.module.css` | created — token-only | 134 |
| `i18n/locales/{en,ar}/field-completed.json` | created — new namespace | 31 each |
| `i18n/messages.ts` | registered `fieldCompleted` | +4 |
| `components/field/CompletedHistoryCache.tsx` | **deleted** | 94 → 0 |
| `app/(app)/field/completed/completed.module.css` | **deleted** | 3 → 0 |
| 2 × `e2e/*.spec.ts` | contracts re-pointed | — |

## Decisions

**A `🔒` emoji-as-icon was the standout violation — on both pages.** The lock
banner used a literal `🔒` (U+1F512), which the v5 `emoji-as-icon` gate flags
(pictographic emoji as a product icon). Replaced with the `restricted` (Lock)
registry icon in a shared `LockedNotice`. Removing both emojis plus the banner's
`border-radius: 12px` literal dropped **v5 from 70 → 67**.

**Two `<main>` landmarks were fixed** — the same duplicate-main bug as T-144. Both
the list and the detail rendered their own `<main>` inside the shell's; the
rebuild renders a `<div>`, browser-verified `main` count 1 on all three states
(list, receipt, unavailable).

**Both `as unknown as` casts are gone, and the flattening is shared.** The list
cast `read.data as unknown as AssignmentRow[]` and the detail cast the embedded
`visits`. `queries.ts` now has one `toRecords(visitValue: unknown)` that narrows
from `unknown` and drives both loaders — the list flattens every assignment, the
receipt filters to the requested inspection's latest version. The governed
`normalizeEmbedded`/`latestSubmittedVersions`/`summarizeSnapshot`/
`completionReference` helpers are used unchanged (the INSP-699 cardinality
handling stays exactly as it was).

**The offline history cache was preserved verbatim.** `CompletedHistoryCache`'s
`localForUser(...).cacheCompletedHistory` / `getCompletedHistory` fallback moved
into `completed-history-list.tsx` unchanged — live records cached on success, the
cached copy shown with a read-only notice when the live read failed.

**`force-dynamic` was dropped.** Both routes declared `export const dynamic =
"force-dynamic"`; the authenticated layout already infers dynamic rendering from
the cookie-scoped auth (the K-002 lesson from T-138), so it was redundant.

## Inventory taken before writing code

- **State/effects:** the list's only client piece is the offline-cache island
  (the sanctioned external-sync `useEffect`); the receipt is fully server. Both
  route pages are Server Components.
- **Copy:** local `tr(key, en, ar)` helpers inlined both languages at **~35**
  call sites across the list, receipt and cache; all moved to a new
  `field-completed` namespace, Arabic lifted from the pairs.
- **`<svg>`/emoji → icons:** the two `🔒` emojis → `restricted`; the back
  chevrons → `previousPage`. No other glyphs.
- **Accessibility failures found:** the list had **no `h1`** (FieldHeader title
  was a `<div>`); the receipt's `<h1 style="font-size:19px">` was raw inline
  typography and its sections were `<h2 style=…>`; the version badge was a `badge`
  span; the summary/findings used inline `fontSize`. Now `h1` on both, `1>2>2>2`
  on the receipt, and the version marker is a `StatusPill`.

## Numbers

```
Routes: /field/completed and /field/completed/[id]
route files           110 + 97 → 11 + 15
components ≤ 200      max component 103 (receipt); queries.ts 124 (feature, < 400)
client islands        1 → 1  (the offline history cache)
raw <svg>/emoji       2 🔒 + back chevrons → 0
duplicate <main>      2 → 1 (shell owns it)
headings              0 → 1 (list) / 1>2>2>2 (receipt)
rendered sizes        off-scale → 13·15
weight cap            700 → 590
hardcoded copy        ~35 tr() sites → 0
typography gate       15 owned violations → 0   (baseline 1258 → 1243)
eslint baseline       7482 → 7466
design-system-v5      70 → 67 (2 emoji-as-icon + 1 raw 12px radius removed)
source lines deleted  97 (CompletedHistoryCache 94 + old stylesheet 3)
```

## Accessibility

- **axe: 0 WCAG violations** across English/dark and Arabic/dark, on the list
  (empty state) and the receipt's unavailable branch. Best-practice rules
  (`heading-order`, `page-has-heading-one`, `landmark-no-duplicate-main`,
  `region`, `duplicate-id`) also 0. The green lock banner (Lock icon + success
  text on the success surface) passes contrast.
- **Found and fixed:** the missing `h1` on both routes; the duplicate `<main>`.
- Manual checklist: keyboard ✓ · Arabic/RTL ✓ (title, subtitle, locked banner
  translate; no emoji, no overflow) · dark ✓. The seeded inspector has no
  completed inspections, so the populated list/card and the full receipt were
  verified by typecheck + the unavailable branch at runtime rather than with live
  data. **Light theme, 200 % zoom, browser e2e with a completed record still
  owed.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (relocked 7482 → 7466)
- [x] `npm run gates:typography` — PASSED (relocked 1258 → 1243)
- [x] `npm run check:design-system-v5` — **67** (was 70)
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] axe on the list + the receipt-unavailable branch, EN + AR
- [x] temporary axe file removed (404 confirmed), browser theme/locale restored
- [ ] light theme, 200 % zoom, browser e2e with a completed record — still owed

**Two specs re-pointed across the split.** The gated
`field-completed-history-contract` asserted the inspector-scope + immutable
backing + no-mutation patterns on `page.tsx` and `[id]/page.tsx`; both moved to
`queries.ts` (`.eq("inspector_id", user.id)`, `submission_versions`,
`submission_versions!inner`, and the negative no-`<form>`/`checklist_responses`/
`evidence`-write check). The CI-only `responsive-execution-field` read
`latestSubmittedVersions`/`submission_versions`/no-mutation from `page.tsx`;
re-pointed to `queries.ts`. Its separate `no FieldNav` check still reads the (now
thin) `page.tsx` and passes.

## Retirement

Deleted at zero imports: `CompletedHistoryCache.tsx` (94), the old
`completed.module.css` (3) — **97 lines**. The `completed/` folder is now
`page.tsx` + `[id]/page.tsx`; all logic lives in `features/field-completed/` and
`components/sections/field-completed/`.

## Parked

- The seeded inspector has no completed inspections; a browser pass over a
  populated list + a real receipt is owed when a submitted record is available.
- The remaining `/field` surfaces: `reports` and `settings`, then the two large
  execution screens (`[visitId]` startup, the 1,991-line
  `inspection/[id]/Workspace`).
- Cross-cutting: the `Button` mirror gap (T-052/T-140/T-141), field-pill
  pluralisation (T-141).

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild completed history and receipt on saqeel primitives
```

## Next

`reports` and `settings`, then the two large execution screens — `[visitId]`
startup (1,384 lines) and the 1,991-line `inspection/[id]/Workspace`.
