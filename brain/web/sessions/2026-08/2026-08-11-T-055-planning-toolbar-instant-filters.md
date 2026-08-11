# 2026-08-11 · T-055 — `/planning` toolbar: filters into the panel, applied on change

`task: T-055` · `status: partial` · `duration: 1h`
`rules applied: WEB-000, WEB-002 §2, WEB-003, WEB-004 §1, WEB-009, WEB-011, WEB-013`

---

## Goal

Collapse the two-row filter bar to one row, move every filter except Status into
the panel, and drop the Apply button so a filter change queries the server
immediately.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/select/select.tsx` | gained `id?` (additive) | 167 → 177 |
| `components/planning/planning-toolbar/filter-controls.tsx` | rebuilt on URL state | 106 → 111 |
| `components/planning/planning-toolbar/more-filters.tsx` | 6 → 9 filters, `Field` removed except Sort | 138 → 160 |
| `components/planning/planning-toolbar/planning-toolbar.tsx` | Apply deleted, `size="sm"` dropped | 75 → 74 |
| `components/planning/planning-toolbar/planning-toolbar.module.css` | centre alignment, active-trigger state | 77 → 82 |
| `components/planning/planning-screen/planning-screen.tsx` | Status option names itself | 160 → 161 |

## Decisions

**Filter state moved from `useState` to the URL — a rung up the WEB-004 ladder,
not a rewrite for its own sake.** `filter-controls.tsx` held a `FilterState`
that mirrored the URL and was reconciled by a form submit. Values now come from
the server-parsed `params` and every change is a `router.replace` with `page`
cleared. `replace`, not `push`, because four filter tweaks should not become four
back-button presses. `scroll: false` so the list does not jump.

**Filtering was already server-side and stays that way.** `lib/planning/visit-list.ts`
issues PostgREST `.ilike` / `.in` / `.range` / `.or` queries and flips embeds to
`!inner` when a filter targets them; its own note records that post-filtering was
rejected because it corrupted the visible row count. Instant-apply changes only
*when* the server is asked, never *who* filters.

**No `Any` prefix — the empty option is the filter's own name.** Owner's call.
`Status`, `Priority`, `Inspector` when unset, the value when set. This needed
**no new i18n keys**: `toolbar.status`, `toolbar.priority`, `toolbar.inspector`,
`toolbar.method`, `toolbar.region`, `toolbar.city`, `toolbar.visitType` already
existed as the `Field` captions they are now replacing. `toolbar.allOption`,
`toolbar.allInspectors` and `toolbar.apply` are now unread — **left in both
locale files** because the dead `sections/planning/planning-filter-bar` still
types against `allInspectors`. Delete them with that tree.

**`Select` gained `id?` — raised as a gap and built only after an owner ruling**
(WEB-002 §2). `Field` renders `<label htmlFor>`, `Select` generated its list id
internally and exposed nothing to point at, so **every `Field` + `Select` pair in
the repo — 12 files — renders a `<label>` associated with nothing** while the
control names itself through `aria-label`. When `id` is passed, `Select` puts it
on the trigger and **drops its own `aria-label`**, so the visible label becomes
the accessible name instead of a second unassociated copy. `<button>` is a
labelable element, so `<label for>` binds correctly. Additive: none of the other
11 call sites pass `id`, so none change behaviour.

**Sort is the only control that keeps a caption.** Every other filter shows its
own name when empty; sort has no empty state, so its value (`Newest first`) never
implies what it controls.

**Search still needs Enter.** The `<form method="get">` survives with hidden
inputs carrying the current filters, so implicit submission preserves them.
Debouncing keystrokes into navigations was rejected — it turns every character
into a database query.

## Inventory taken before writing code

- **State and effects:** `useState<FilterState>` **deleted** — replaced by URL
  state read from `params` (ladder rung 2 instead of 5). `isOpen` stays in
  `MoreFilters`; it is disclosure state, not data. No `useEffect` added.
- **Literals → tokens:** none introduced; `planning-toolbar.module.css` remains
  fully `var(--sqx-*)`. Verified: no hex, no px.
- **`<svg>`:** none. `disclosure` and `dateScope` come from the registry.
- **Accessibility failures found in the existing markup:**
  1. Four orphaned `<label>` elements in the bar (`Field` with no `htmlFor`) —
     removed with the `Field` wrappers.
  2. `Apply` at `--sqx-control-h-sm` (2rem) beside controls at
     `--sqx-control-h-md` (2.375rem), bottom-aligned by `align-items: flex-end`
     so the 6px opened above it. **Owner-reported.** Resolved by deleting the
     button; the bar is now `align-items: center` with one control height.
  3. Two accent-filled buttons in view (`Apply` primary + header Create visit).
     Now one.

## Numbers

```
Route: /planning
first-load JS   ___ KB → ___ KB     MEASUREMENT REQUEST (WEB-005 §8)
route CSS       ___ KB → ___ KB     MEASUREMENT REQUEST
LCP (4G, mid)   ___ s  → ___ s      MEASUREMENT REQUEST
INP             ___ ms → ___ ms     MEASUREMENT REQUEST — each filter change is
                                    now a soft navigation, previously a full form GET
CLS             ____   → ____       MEASUREMENT REQUEST
client islands  2      → 2          unchanged
toolbar controls: 7 → 3 (search, Status, More filters, + Clear all when active)
visible labels in the bar: 4 → 0
```

## Accessibility

- axe violations: **not run** — route requires an authenticated `business_staff`
  session. **The owner's Chrome extension is not connected**, so their incognito
  window could not be driven either; the in-app browser has no session and
  credentials are not mine to enter.
- Manual checklist (WEB-003 §10): **not performed.** All owed.
- Fixed by construction: the three failures under Inventory.

## Verification

- [x] `npm run typecheck` — exit 0
- [ ] `npm run lint` — **script does not exist** (carried from T-053)
- [ ] `npm run gates` — **script does not exist** (carried from T-053)
- [x] `npm run check:design-system-v5` — zero findings in any touched file
- [ ] `npm run test:e2e` — not run
- [ ] Definition of Done (WEB-006 §5) — **not ticked**; browser pass owed

## Retirement

Nothing marked or deleted. `toolbar.allOption`, `toolbar.allInspectors` and
`toolbar.apply` are unread copy held alive only by the dead sections tree.

## Parked

1. **The panel must survive the navigation — unverified.** Every filter change is
   a `router.replace` while `isOpen` lives in `MoreFilters`. React preserves
   client component instances across a soft navigation, so it should stay open,
   but **if it does not, the panel slams shut after every selection** and the
   screen is worse than it was with Apply. **This is the first thing to check in
   a browser.**
2. **Active filters are invisible when the panel is closed** — the count badge on
   the trigger and `Clear all` are the whole signal. Accepted by the owner.
3. **11 remaining `Field` + `Select` pairs still render orphaned labels.** The
   primitive now supports the fix; each screen needs `id` wired. Own task.
4. Carried from T-053: dead `sections/planning/*` tree; `authority`/`risk` have
   no data source; `lint`/`gates` scripts missing.

## Blocked / open questions

- **Browser access.** Claude in Chrome is not connected — the extension needs
  installing/signing in, and "Allow in Incognito" ticking, before an incognito
  window can be driven. Until then every visual claim on this route is static
  reasoning.
- No new Arabic was authored this task; no native review is owed by it.

## Proposed commit

```
refactor(planning): apply list filters on change from the url
```

## Next

Browser pass on `/planning`, starting with parked item 1 — open More filters,
change one select, confirm the panel is still open and the list re-queried.
