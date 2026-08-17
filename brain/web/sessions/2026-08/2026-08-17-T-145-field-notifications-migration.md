# 2026-08-17 · T-145 — `/field/notifications` (list + detail) migrated off the parallel design system

`task: T-145` · `status: done` · `duration: ~3h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/notifications` surface — the offline-capable list and the
`[id]` detail — onto SAQEEL primitives and the approved Linear language. The two
share an icon/category vocabulary (`notification-meta`) and the governed
notification libs, so they migrate as one task.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/notifications/page.tsx` | rebuilt as a route file | 110 → **13** |
| `app/(app)/field/notifications/[id]/page.tsx` | rebuilt as a route file | 179 → **16** |
| `features/field-notifications/queries.ts` | created — list + detail load, receipt | 119 |
| `features/field-notifications/rows.ts` | created — narrowing (shared client/server) | 32 |
| `features/field-notifications/meta.ts` | created — icon/tone/category vocabulary | 50 |
| `components/sections/field-notifications/notifications-screen.tsx` | created | 56 |
| `…/notification-attention-list.tsx` | created (client) — offline cache/refresh/ack | 182 |
| `…/notification-row.tsx` | created — one list row | 47 |
| `…/notification-tile.tsx` | created — tone-coloured icon tile | 14 |
| `…/notification-detail-screen.tsx` | created | 87 |
| `…/notification-unavailable.tsx` | created — detail error branch | 30 |
| `…/notifications.module.css` | created — token-only | 199 |
| `i18n/locales/{en,ar}/field-notifications.json` | created — new namespace | 46 each |
| `i18n/messages.ts` | registered `fieldNotifications` | +4 |
| `saqeel/icon/icon-registry.ts` | added `revert` (`Undo2`) | +2 |
| `NotificationAttentionCenter.tsx` | **deleted** | 263 → 0 |
| `notification-meta.ts` (old) | **deleted** | 75 → 0 |
| `notifications.module.css` (old) | **deleted** | 116 → 0 |
| 2 × `e2e/*.spec.ts` | contracts re-pointed | — |

## Decisions

**`notification-meta.ts` stored raw `<svg>` path strings — the biggest rule-8
violation in the surface.** Each of the six notification categories carried a
literal SVG `d` path plus a hardcoded `bg`/`color`. Rule 8 bars `<svg>` in app
code (icons come from the registry by semantic name), and rule 15 bars hardcoded
copy (the category labels were inline EN/AR). The rebuilt `meta.ts` maps each
category to a **registry `IconName` + a semantic tone** — `license→forms/accent`,
`assign→review/success`, `return→revert/warning`, `sync→refresh/neutral`,
`calendar→calendar/accent`, `cancel→risk/danger` — and the category labels moved
to the i18n namespace. One icon (`revert`, `lucide/Undo2`) was added for the
"report returned" glyph, the only category with no existing registry match.

**The icon tile is a neutral tile with a tone-coloured glyph, not a coloured
tile.** There is no `--sqx-surface-warning`, so a per-tone soft background would
be inconsistent (and the T-142 lesson warns that `--sqx-surface-accent` is a tint
for backgrounds-behind-normal-text). So every tile is `--sqx-surface-subtle` and
the glyph carries the tone colour (`--sqx-text-success`/`-warning`/`-danger`/
`-accent`/`-secondary`). Browser-verified: 0 colour-contrast violations.

**The governed offline/receipt behaviour was preserved verbatim.** The client
center keeps the inspector-namespaced localStorage cache, the online/offline
listeners, the reconnect refresh, the honest stale-snapshot notice, and the
mark-read acknowledgement — recipient-scoped, first-receipt-only (`.is("read_at",
null)`), offline-guarded (`if (!online)`). The detail route's read-receipt (a
conditional single-row update on open) moved into `loadNotificationDetail` but is
otherwise unchanged. Both browser-verified: opening a detail dropped the shell
unread badge 35 → 34.

**`as unknown as` casts gone, and one narrowing shared across the boundary.** Both
the server loader and the client `loadLive` built the visit-name map with an
`as unknown as {…}[]` cast. `rows.ts` now owns `notificationVisitIds` and
`toVisitNames` as pure narrowing functions, imported by both — no browser code
leaks into the server bundle because `rows.ts` imports only types.

## Inventory taken before writing code

- **State/effects:** the list is a genuine offline-sync client (cache, listeners,
  refresh, ack) — the sanctioned `useEffect` use (external synchronisation). Kept
  intact. The detail and list pages are Server Components.
- **Copy:** local `tr(key, en, ar)` helpers inlined both languages at **~40**
  call sites across list, detail and `notification-meta`; all moved to a new
  `field-notifications` namespace, Arabic lifted from the pairs. `offlineCached`
  became the interpolated `{time}`.
- **`<svg>` → icons:** the six category glyphs (raw paths in `notification-meta`)
  → registry names; the back chevrons → `previousPage`.
- **Accessibility failures found:** the list had **no `h1`** (FieldHeader title
  was a `<div>`); the New badge was a `badge` span; the filter chips were bare
  `<a>`. The detail's `<h1 class=heroTitle>` existed but was orphaned styling.
  Now `h1` on both, `h1>h2` on detail, and the New badge is a `StatusPill`.

## Numbers

```
Routes: /field/notifications and /field/notifications/[id]
route files           110 + 179 → 13 + 16
components ≤ 200      max component 182 (list, after extracting the row)
client islands        1 → 1  (the attention list — offline sync)
raw <svg> in app      6 category glyphs + backs → 0
headings              0 → 1 (list) / 1>2 (detail)
rendered sizes        off-scale → 13·15
weight cap            700 → 590
hardcoded copy        ~40 tr() sites + inline category labels → 0
typography gate       13 owned violations → 0   (baseline 1271 → 1258)
eslint baseline       7566 → 7482
design-system-v5      71 → 70 (the meta's hardcoded icon colours removed)
source lines deleted  454 (attention center 263 + meta 75 + stylesheet 116)
```

## Accessibility

- **axe: 0 WCAG violations** across English/dark and Arabic/dark, on the list
  (35 rows) and the detail. Best-practice rules (`heading-order`,
  `page-has-heading-one`, `landmark-no-duplicate-main`, `region`, `duplicate-id`,
  `listitem`) also 0.
- **Found and fixed:** the missing `h1` on both routes; the tone-coloured glyphs
  were verified for contrast (28 axe passes, none failed).
- Manual checklist: keyboard ✓ · Arabic/RTL ✓ (filter tabs, kind labels and
  category labels translate; factory names and payload values stay LTR via
  `dir="auto"`/Mono) · dark ✓ · the read-receipt fires on detail open (unread
  badge decrements). **Light theme, 200 % zoom and browser e2e still owed.**
- Status is text-plus-shape (WEB-002 §5): the New badge is a labelled
  `StatusPill`; the tone-coloured tile is decorative reinforcement of the kind
  label, never the sole signal.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (relocked 7566 → 7482)
- [x] `npm run gates:typography` — PASSED (relocked 1271 → 1258)
- [x] `npm run check:design-system-v5` — 70 (was 71)
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] axe on list + detail, EN + AR; read-receipt verified
- [x] temporary axe file removed (404 confirmed), browser theme/locale restored
- [ ] light theme, 200 % zoom, browser e2e — still owed

**Two gated specs re-pointed across the split, without weakening a contract.**
`field-notification-attention-center` asserted the recipient/receipt/offline
patterns on `page.tsx` + `NotificationAttentionCenter.tsx`; re-pointed to
`features/field-notifications/queries.ts` (the list read's `.eq("recipient",
user.id)`), the migrated `notification-attention-list.tsx` (`.eq("recipient",
userId)`, `.is("read_at", null)`, `if (!online)`, the online listener) and the en
JSON (the `"No acknowledgement was recorded."` ack string that moved to i18n).
`field-notifications-contract` asserted the detail read + receipt + payload-empty
string on `[id]/page.tsx`; re-pointed to `queries.ts` (the column literal, the
recipient scope, `notificationReadPatch`, `.update(patch)`, `.is("read_at",
null)`, `notificationPayloadEntries`) and the en JSON (the payload-empty string).
The live `field-notifications.spec.ts` asserts the payload-empty text by role at
runtime — the exact English string was kept in the en namespace so it still
renders and matches.

**The attention list was split to stay under 200 lines.** After the first pass it
was 206; extracting `notification-row.tsx` (the per-row markup) dropped it to 182
and left the offline-sync logic as the component's whole body.

## Retirement

Deleted at zero imports: `NotificationAttentionCenter.tsx` (263),
`notification-meta.ts` (75), the old `notifications.module.css` (116) — **454
lines**. The `notifications/` folder is now `page.tsx` + `[id]/page.tsx`; all
logic lives in `features/field-notifications/` and
`components/sections/field-notifications/`.

## Parked

- The report/notification-adjacent surfaces (`completed`, `reports`, `settings`)
  and the large execution screens (`[visitId]` startup, the 1,991-line
  `inspection/[id]/Workspace`) remain.
- Cross-cutting items still stand: the `Button` mirror gap (T-052/T-140/T-141),
  field-pill pluralisation (T-141).
- Light theme, 200 % zoom, browser e2e owed for these routes.

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild notifications list and detail on saqeel primitives
```

## Next

The report surfaces (`completed`, `reports`) and `settings`, then the two large
execution screens — `[visitId]` startup (1,384 lines) and the 1,991-line
`inspection/[id]/Workspace`.
