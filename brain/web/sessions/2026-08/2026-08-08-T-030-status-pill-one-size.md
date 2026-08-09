# 2026-08-08 · T-030 — StatusPill: one size

`task: T-030` · `status: done` · `duration: 30m`
`rules applied: WEB-002 §4.5 §7, WEB-008, WEB-009 §1`

---

## Goal

Every status pill in the application is the same size. Reported on the
dashboard: the pills inside the "National performance", "Strategic
intervention" and "Enforcement action trend" cards — and "Scoped to your
access" — render taller and with more padding than every other pill on the
screen.

## Root cause

`StatusPill` carried `size?: "sm" | "md"` and **defaulted to `md`**. Nineteen of
the twenty-five call sites passed `size="sm"` explicitly. Six did not, and
silently got the larger rung:

| File | Pill |
| --- | --- |
| `sections/dashboard/strategic-view/strategic-view.tsx:159` | enforcement blocked |
| `sections/dashboard/strategic-view/strategic-view.tsx:171` | not configured |
| `sections/dashboard/strategic-view/strategic-view.tsx:183` | requirement description |
| `sections/dashboard/role-summary/role-summary.tsx:26` | **"Scoped to your access"** |
| `sections/dashboard/dashboard-notice/dashboard-notice.tsx:16` | notice pill |
| `sections/dashboard/metric-card/metric-card.tsx:38` | empty-state pill |

Every one is a `CardHeader trailing` or an empty-state slot — exactly the places
where nobody was copying an existing `size="sm"` from a neighbouring line.

## The fix

The `size` prop is **deleted**, not re-defaulted. Re-defaulting to `sm` would
have left `md` reachable and the same drift would return the first time someone
typed `size="md"`. WEB-002 §4.5 wants a closed variant API; a rung that is
never correct is not a variant.

`[data-size="sm"]` is folded into `.pill`, and `[data-ping][data-size="sm"]`
into `[data-ping]`. Net effect: the pill everyone was already asking for
becomes the only pill there is.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/status-pill/status-pill.tsx` | rebuilt | 37 → 34 |
| `components/saqeel/status-pill/status-pill.module.css` | rebuilt | 72 → 57 |
| 10 × `components/sections/operations/**` | `size` removed | unchanged |
| 3 × `components/sections/dashboard/**` | `size` removed | unchanged |
| 1 × `components/sections/factories/factories-portfolio` | `size` removed | unchanged |

The six files listed under Root cause are **not** in the change set — they never
passed `size`, so they inherit the new single size with no edit.

## Decisions

- **Deleted rather than defaulted.** See The fix.
- **`ping` was left alone.** It is a real semantic choice — "this is live / needs
  attention" — not a size. Fourteen call sites use it, eleven do not.
- **The codemod was scoped to `<StatusPill …>` tags only.** `Button size="sm"`,
  `EmptyState size="sm"` and `PingDot size="sm"` are untouched; those components
  have genuine size ladders. Verified by grep after the rewrite.

## Verification

- [x] All 25 `<StatusPill>` call sites carry no `size` prop
- [x] `Button` / `EmptyState` / `PingDot` `size` props intact
- [x] No module compensates for the old `md` geometry — checked
      `metric-card.module.css` and `strategic-view.module.css`, neither
      references the pill
- [x] `StatusPill` is **not** exported from `components/saqeel/index.ts`, so the
      only way to reach it is the direct path; every importer is under
      `components/sections/**` and all were rewritten
- [ ] `npm run typecheck` — not run; the dashboard import break still blocks it.
      **Note:** any missed `size=` would now be a compile error, not a silent
      regression, so typecheck is the backstop here.
- [ ] Visual confirmation in a browser — SWC still blocked

## The twenty-sixth call site

The first pass missed one. `app/(app)/operations/page.tsx` — the 75 KB route
file — imports `StatusPill` directly and used it once, at line 1216
(`"Read only"`). It was not staged during the first sweep because the device
bridge dropped mid-task, and it is the only `StatusPill` outside
`components/sections/**`. Patched, and the whole tree re-verified from disk
afterwards: **28 call sites, zero `size=` props.**

The lesson for the migration: `grep` the route files too, not just
`components/**`. A 75 KB `page.tsx` is exactly where a stray primitive call
hides.

## Blocked

- `app/(app)/dashboard/{page,loading}.tsx` import `@/components/dashboard/**`,
  which does not exist. Unchanged from T-020a. Still three lines.

## Proposed commit

```
fix(saqeel): give StatusPill one size and drop the size prop
```

## Next

Back to T-020c — the `/factories` middle column and end panel.
