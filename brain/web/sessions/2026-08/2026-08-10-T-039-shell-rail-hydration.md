# 2026-08-10 · T-039 — shell rail hydration mismatch on rewritten routes

`task: T-039` · `status: done (fix is by construction; not observed in a browser)` · `duration: 0.5h`
`rules applied: WEB-000, WEB-004, WEB-011`

---

## Goal

Stop the shell rail rendering one `aria-current` on the server and another at
hydration, on the three routes the middleware rewrites.

## The defect

React reported it twice, on two different routes, and both reports had the same
shape:

```
+  data-current=""        aria-current="page"     (server HTML)
-  data-current={null}    aria-current={null}     (client)
```

The server resolved the pathname into **alias space** — the space every
navigation href is written in — and the client resolved it into something that
did not match. The only paths where those two spaces differ are the three the
middleware rewrites, which is exactly the set of affected routes:

| Typed (alias) | Renders (design) |
| --- | --- |
| `/admin/regulations` (no `?id=`) | `/compliance` |
| `/admin/compliance-approvals` | `/compliance/approvals` |
| `/admin/violations` (no `?mode=`) | `/enforcement-library` |

`ShellNavGroupSection` is a client component computing
`stripLocale(usePathname() || pathname)`, comparing the result against hrefs
that are all in alias space. Under a rewrite the server-resolved pathname and
the client's `usePathname()` can report **different spaces for the same
request**, so the comparison returns different answers on the two passes and
React refuses to patch the attribute.

## The fix

The rewrite map lived inline in `middleware.ts` as a ternary chain, so nothing
else in the app could know a path had been rewritten. It is now
`lib/route-rewrites.ts`, consumed by both sides:

- `designRouteFor(pathname, searchParams)` — middleware. Reproduces the previous
  chain exactly, including the two query-parameter guards.
- `shellRouteOf(pathname)` — the shell. Maps a design route back to its alias.

`shell-nav-group.tsx` now runs **both** the server-provided pathname and the
client's `usePathname()` through `shellRouteOf`, so they land in the same space
whichever one each reports. The agreement is structural, not a guess about which
side was wrong.

Verified across the space of inputs:

```
server sees alias      /admin/compliance-approvals -> /admin/compliance-approvals  current = true
client sees design     /compliance/approvals       -> /admin/compliance-approvals  current = true
client sees alias      /admin/compliance-approvals -> /admin/compliance-approvals  current = true
server sees design     /compliance                 -> /admin/regulations           current = true
record route           /admin/regulations          -> /admin/regulations           current = true
enforcement design     /enforcement-library        -> /admin/violations            current = true
unrelated route        /planning                   -> /planning                    current = false
```

A path that is not a rewrite target is returned untouched, so nothing outside
those three routes changes behaviour.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `lib/route-rewrites.ts` | created — the single definition of the three rewrites | 0 → 46 |
| `middleware.ts` | inline ternary chain → `designRouteFor` | 8 lines → 1 |
| `components/app-shell/shell-rail/shell-nav-group.tsx` | pathname normalised through `shellRouteOf` | +1 import, 1 line changed |

## Decisions

**Normalise rather than suppress.** The conventional fix is to defer the client
value until after mount, which needs `useState` + `useEffect` and would leave
the rail briefly wrong on every route. Mapping both sides into one space fixes
the cause and adds no state — the component stays exactly as reactive to client
navigation as it was.

**One definition, two directions.** Duplicating the rewrite table in the shell
would have re-created the same class of drift a month later. The middleware now
reads it forwards and the shell reads it backwards.

**Scope held to nav-current matching.** `features/shell/queries.ts` also derives
`isAdminWorkspace` and `shellScopeForRoute` from the raw pathname. Those are
consistent within a render — the mismatch is specifically between the server
pass and the client pass of one client component — so they are left alone rather
than swept into an unverified fix. Parked below.

## Numbers

No measurable change: one import and one function call on a component that
already rendered on every authenticated route.

## Accessibility

The defect **was** an accessibility defect: `aria-current="page"` was announced
by the server HTML and then removed at hydration, so a screen-reader user could
be told which navigation item was current and then have that fact silently
withdrawn. Both passes now agree.

Not verified in a browser — the dev server is behind a login the agent may not
authenticate through.

## Verification

- [x] `npm run typecheck` — clean, whole repo
- [x] `npm run check:design-system-v5` — zero findings
- [x] Mapping verified across alias / design / unrelated inputs
- [x] Middleware behaviour is unchanged — the map reproduces the previous chain,
      guards included
- [ ] **Not observed in a browser.** The mechanism is inferred from two matching
      React reports plus the code; the fix is written to hold whichever side
      reported which space, but the disappearance of the warning is unconfirmed.

## Parked

- **`isAdminWorkspace` and `shellScopeForRoute`** read the raw pathname, so on a
  rewritten route they see whichever space the server reported. This does not
  produce a hydration mismatch, but it does mean `/compliance` may or may not
  count as the admin workspace depending on which path arrives. Worth settling
  once the rail fix is confirmed.
- **`__shellRoute` is resolved by hand in two screens.** `features/regulations`
  and `features/approvals` each read it into a `routeBase`; they could now read
  the shared map instead.

## Proposed commit

```
fix(shell): resolve nav current-state through one route-rewrite map
```

## Next

Reload `/admin/compliance-approvals` and `/admin/regulations` and confirm the
hydration warning is gone. If it persists, the remaining suspect is
`features/shell/queries.ts` reading `x-pathname` — capture what `usePathname()`
actually returns on a rewritten route before changing anything else.
