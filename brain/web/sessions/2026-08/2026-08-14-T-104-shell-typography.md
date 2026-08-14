# 2026-08-14 · T-104 — the shell stops charging every route for its typography

`task: T-104` · `status: partial — code complete and gate-green; one primitive gap raised, four states unrendered` · `duration: ~3h`
`rules applied: WEB-000, WEB-002 §2, WEB-003, WEB-006 §4, WEB-008, WEB-009, WEB-011, WEB-014 §2.1, §4.1, §8, §11`

---

## Goal

Take `components/app-shell/` to zero typography violations. It is imported by
`app/(app)/layout.tsx:2`, so its debt was live on **every route in the
application** — including the thirteen planning routes the tracker recorded as
closed at "1 violation each".

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `shell-topbar/shell-topbar.module.css` | migrated + dead CSS deleted | 456 → 223 |
| `shell-topbar/shell-user-menu.module.css` | migrated | 167 → 134 |
| `shell-rail/shell-rail.module.css` | migrated | 244 → 272 |
| `shell-page-frame/shell-page-frame.module.css` | migrated | 79 → 71 |
| `app-shell.module.css` | migrated | 73 → 72 |
| `shell-brand/shell-brand.module.css` | partially migrated | 32 → 36 |
| `shell-topbar/shell-user-menu.tsx` | migrated | 95 → 104 |
| `shell-topbar/shell-search.tsx` | migrated | 133 → 141 |
| `shell-topbar/shell-admin-palette.tsx` | migrated | 98 → 100 |
| `shell-rail/shell-nav-item.tsx` | migrated | 55 → 69 |
| `shell-rail/shell-nav-group.tsx` | migrated | 89 → 92 |
| `shell-page-frame/shell-page-frame.tsx` | migrated | 45 → 50 |
| `shell-brand/shell-brand.tsx` | partially migrated | 15 → 18 |
| `app-shell.tsx` | migrated | 41 → 44 |
| `saqeel/kbd/kbd.module.css` | retired role fixed | 13 → 13 |

## Numbers

```
baseline           1846 → 1781        app-shell  66 → 2

shell-topbar.module.css     26 → 0     shell-page-frame.module.css   7 → 0
shell-user-menu.module.css  19 → 0     app-shell.module.css          1 → 0
shell-rail.module.css        9 → 0     shell-brand.module.css        4 → 2
saqeel/kbd.module.css        1 → 0

shell rendered sizes   11 · 12 · 14 · 16 · 20 px, all on the nine-role scale
shell typefaces        plexArabic, one
```

**Every migrated route's shared floor drops from 61 to 2.**

## Decisions

**Half of `shell-topbar.module.css` was styling markup that no longer exists.**
Fourteen classes — `iconButton cta ctaLabel locale localeOption user userTrigger
userAvatar userIdentity userMenu userHeadline userDetail userSeparator
userAction` — referenced nowhere, **224 lines**, 14 of the file's 26 violations.
The locale control had become `SegmentedControl`, the user menu had moved to its
own module, the text CTA had become the icon-only `.aiButton`, and none of the
superseded CSS was removed at the time. Verified dead three ways: no `styles.X`
anywhere in `src` or `e2e`, no `composes`, no `:global`.

**The user menu had an inverted hierarchy that no gate could see.** `.name` was
`label` (**12px**) and `.role` was `caption` (**14px**) — the role summary rendered
*larger* than the person's name. Both tokens legal, which is why it survived.
Fourth instance of the T-075 shape after `EmptyState`, the explain-panel key/value
and the factory portfolio heading.

**Geometry decided which correction was available.** The contract-literal reading
of §10 — *"you want smaller prose → `tone="muted"` at body"* — puts name and role
both at 14px, which measures **54.4px inside a 56px topbar in Arabic**: 1.6px of
clearance. `bodyStrong` over `label` measures **49.78px, 6.2px clearance**, and in
English the identity block is **41.19px, identical to before**, because it is the
same two line boxes swapped between the two lines.

**`font: inherit` is legal in feature CSS and is the only answer for a control.**
It matches neither gate rule — `raw-typography-property` lists the longhands,
`font-shorthand-outside-design-system` requires `var(--sqx-text-`. An `<input>`
has no children so it cannot host a primitive. Applied to `.searchInput`,
`.paletteInput`, `.paletteTrigger`, `.trigger`.

**But what `inherit` inherits is the frozen legacy sheet.** Both inputs measure
**14px/21px** — leading `1.5`, from `saqeel-runtime.css:19` beating
`saqeel.css:869` on `<body>`. Family and size are right and on a single-line
control the leading is inert, but **every `font: inherit` in this application
resolves against the legacy body rule until that conflict is ruled on.** Nobody
had written that down.

**`tone="inherit"` is load-bearing in the rail.** `.item` colour is driven by
`[data-state]`, `:hover`, `[aria-current]` and `[data-state="restricted"]`, and
`.subgroup:has([aria-current]) .subgroupLabel` repaints the parent. A hardcoded
tone would have frozen five states into one.

**Two no-ops removed, both of the same shape.** `.item[aria-current="page"] {
font-weight: semibold }` — `.item` already resolved `--sqx-text-label`, whose
weight *is* semibold, so the active nav item never rendered heavier than its
siblings. And `.name { font: label; font-weight: semibold }` in the user menu.
Second and third instances of T-088's already-semibold shape.

**A class can lose its font and keep its layout.** `.searchResults p` kept
`padding: var(--sqx-space-3)`; `Text` renders `<p>` for `body`, so the element
selector still matches — measured at 8px padding with `role="status"` intact.

**Two primitives adopted, two rejected, each on inspection rather than by rule.**
`Kbd` adopted, and its own retired `code` role fixed in the design system per
§2.1 — `⌘K` now measures 13px/500 plexArabic. `Heading level={1}` adopted in
`shell-page-frame`, replacing the retired `title` role.
`Avatar` **rejected**: it renders `className="avatar"`, a frozen-sheet global,
plus an inline `style`, and its `UserChip` sibling carries `t-caption` and
`fontWeight: 500` — adopting it would import three legacy constructs to remove
one. `CountBadge` **rejected**: identical type and identical danger tokens, but
`--sqx-radius-sm` against `.itemBadge`'s `--sqx-radius-pill` plus different
min-width and padding, which is a **shape** change riding inside a typography
task.

**Reuse is conditional on the primitive being clean. Check it before composing
it.**

## What went wrong

**A partial `replace_all` shipped a live regression.** `shell-nav-item.tsx`
renders the same two lines twice — a disabled `<span>` branch at 8-space indent
and an enabled `<Link>` branch at 6. A `replace_all` on the 8-space form matched
**one** occurrence and reported success, so the CSS lost its `font` while the
enabled branch kept bare markup: **every clickable nav item in the application
rendered at inherited 14px/400 instead of 12px/600**, and the gate counted 9
removed and stayed green — it counts declarations deleted, not text rendered.

Fourth instance of a shape already recorded three times: T-058's rule matching 0
of 24, T-076's regex matching 0 of 7, T-090's CRLF replace on an unchanged file.
**A partial match is worse than a zero match, because it looks like success.**
After any multi-site edit, count the sites you expected against the sites you
changed, and re-render.

**`shell-page-frame` was deleted and restored.** Zero importers read as dead;
`04-COMPONENT-LEDGER.md:180` says *"Supersedes the default `Shell` export;
adopting it in the 55 route files is future work."* **Zero importers is its
expected state.** Restored byte-for-byte. T-077's checklist for "is it really
dead" covers specs and scripts; **the ledger belongs on that list.**

**`.scope` looked unused and is not** — it lives in `shell-scope-controls.tsx`, a
sibling of the module's namesake. Third instance of T-093's shape.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **the script does not exist** (T-102)
- [x] `npm run gates:typography` — PASSED, 1781 known, none new
- [ ] `npm run gates` — fails on a pre-existing `check:design-system-v5` finding
      in `src/lib/analytics/query-state.ts:18`, untouched by this task
- [ ] `npm run test:e2e` — not run
- [x] Orphaned `styles.x` and unused classes checked **both directions** on every
      module touched — zero of each, except `.scope` which is a live sibling

**Rendered and measured**, English and Arabic, on `/dashboard` and
`/admin/access`:

```
group headers   11px/700 uppercase muted      nav item active  12px/600 accent
nav item normal 12px/600 secondary            subgroup label   12px/600 secondary
user name       14px/600                      user role        12px/600 muted
kv key → value  12px → 14px                   search input     14px plexArabic
result title    14px/600                      result detail    12px/600 muted
empty message   14px muted, role=status       ⌘K               13px/500 plexArabic
palette input   14px plexArabic               palette count    14px, ids match
skip link       12px/600 link colour          SAQEEL           11px/700 uppercase
```

**Not rendered, and therefore reasoned rather than measured:** the restricted nav
item (`data-state="restricted"`), both `.itemBadge` sites, `:hover` on rail items,
and **the whole of `shell-page-frame`, which has no importers and cannot be
rendered from any route**. Its migration is structurally identical to the others
and typechecks, and that is an argument, not a measurement.

**No screenshot.** The Browser pane is not displayed, so the page does not
composite frames; every figure above is a `getComputedStyle` measurement.

## Blocked / open questions

**The brand wordmark is the one thing left, and it is not a primitive gap — it is
an object the scale does not govern.** `.brandAr` renders `صقيل` at
`font: var(--sqx-text-subheading)` (16px). `Text` cannot express `subheading` —
`TextRole` is body · bodyStrong · label · overline · mono — and `Heading` can, but
only by emitting an `<h1>`–`<h6>`, which would inject a heading into the document
outline of **every page** and break "exactly one `display` per route".

§11.4 says extend the primitive. **I did not**, because WEB-014 §2 defines
`subheading` as *"a named group inside a card"*, and a logotype is not that. The
question is not "how do we reach 16px from `Text`" but **"is a bilingual logotype
typography at all, or is it a mark that happens to be set in the UI face?"**
Adding `subheading` to `TextRole` would answer it by accident and hand every
feature a 16px non-heading — the exact expressiveness §1 removed on purpose.
WEB-002 §2 and §10 both say a genuine gap stops the work and is raised. **Raised.
2 violations remain in `shell-brand.module.css` and they are deliberate.**

**Owner decisions this task did not take:**

1. `shell-page-frame` — a frame with zero importers and 55 route files awaiting
   adoption. Migrated in place; still unadopted and unrenderable.
2. `app-shell.module.css:1` opens with a three-line comment explaining why the
   shell is `fixed` rather than `100dvh` — the two-scroller problem. Rule 1 says
   delete it; it is the only record of that decision. **Left in place.**
3. `CountBadge` in the rail — pill vs `radius-sm`, a one-line ruling.
4. `app-shell.tsx` carries four `t("key", ar ? "…" : "…")` calls — the banned
   pattern WEB-013 exists to kill. Out of scope here, but it is in the shell,
   so it is on every route.

## Retirement

Nothing marked. 224 lines of superseded topbar CSS deleted outright — it had no
`@retiring` banner because it was never a component, only orphaned rules.

## Parked

- Adopt `CountBadge` in `shell-rail` once the shape ruling lands
- `04-COMPONENT-LEDGER.md` claims app-shell components *"ship no CSS — every
  visual is a `.sqx-shell*` class in `app/saqeel.css`"*. Six CSS Modules say
  otherwise, and the whole `components/app-shell/` section is **duplicated** at
  ledger lines 157-194 and 376-413.
- The user-menu trigger renders the role summary that the panel repeats two lines
  below (T-094's duplication shape).
- `Planner` and `Riyadh` render untranslated in the Arabic user menu — the known
  app-wide `enum.*` gap.

## Proposed commit

```
refactor(shell): render shell typography through saqeel type primitives
```

## Next

**T-105 — `/operations`, 26.** `operations.module.css`, live via
`OperationsPreview.tsx` and `sections/operations-details.tsx`, plus its four
legacy `--type-*` references.
