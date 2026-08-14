# 2026-08-14 · T-103 — the nested shell overflowed every route by exactly one topbar

`task: T-103` · `status: done — measured on a probe route; per-route visual sweep owed` · `duration: ~30m`
`rules applied: WEB-002, WEB-005, WEB-009, WEB-010`

---

## Goal

Found while chasing an unrelated scroll report on the notification panel: every
route under `(app)` carried a phantom scroll of exactly the topbar height.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/components/app-shell/app-shell.module.css` | added one scoped rule | 57 → 71 |

## The defect

`app/(app)/layout.tsx` wraps every route in `AppShell`. **93 page files under
`(app)` then mount the legacy `Shell` inside it** — `dashboard/page.tsx:17` among
them. `AppShell.main` is `100dvh` minus the topbar; the legacy shell pins **three**
boxes to a hard `100dvh` (`saqeel-runtime.css:540`, `:558`, `:722`).

Measured on a probe route rendering the real classes, viewport 945,
`--sqx-topbar-h` 3.5rem:

```
                     block-size   overflow-y   client   scroll   scrolls by
.main                889px        auto          889      945       56
.sq-shell            945px        hidden        945      945        0   (clipped 56 by parent)
.sq-shell__nav       945px        hidden
.sq-shell__main      945px        auto                             ← the visible scrollbar
```

`.sq-shell__main` is the one carrying `overflow-y: auto`, so its scroll range —
and the scrollbar itself, arrows included — ran 56px past the visible box. The
last 56px of any long page was unreachable, and the track's end sat under the
clip.

## The fix

```css
.main :global(.sq-shell),
.main :global(.sq-shell__nav),
.main :global(.sq-shell__main) { min-block-size: 100%; block-size: 100%; }
```

In the **CSS module**, not the frozen sheet, and scoped to the nested case so a
standalone `.sq-shell` keeps its viewport height.

## Numbers

```
.main scrolls by      56 → 0
.sq-shell clips       56 → 0
all five boxes        889px, SCROLLS_BY 0 across the board
tall-content check    889px viewport onto 2000px of content
                      max scroll 1111 · bottom lands at 2000
                      overshoot past content 0 · parent clips 0
```

## Decisions

**Fixed at the module, not the frozen sheet.** `.sq-shell` is used standalone by
routes that do not sit under `AppShell`; changing `saqeel-runtime.css:540`
globally would collapse those to a parent with no definite height. The scoped
descendant rule leaves them untouched.

**This is a symptom fix and says so in the comment.** The real defect is 93 route
files double-mounting a shell the layout already provides. The block is written
to be deleted by that migration.

## Verification

- [x] Measured before/after on a probe route using the real classes
- [x] `npm run typecheck` — exit 0
- [x] `npm run gates` — typography none new; design-system 0 findings in this file
- [ ] Per-route visual sweep — **owed**; the rule touches every `(app)` route

## Parked

- **93 route files mount `Shell` inside `AppShell`.** The ledger already notes
  adopting `shell-page-frame` as future work; this measurement is the cost of
  not doing it.
- `saqeel-runtime.css:540/:558/:722` keep their `100dvh` and are now overridden
  in one place. Delete the override with the migration, not before.

## Proposed commit

```
fix(shell): contain the nested legacy shell to its layout height
```

## Next

Per-route visual sweep, then fold into the `shell-page-frame` migration.
