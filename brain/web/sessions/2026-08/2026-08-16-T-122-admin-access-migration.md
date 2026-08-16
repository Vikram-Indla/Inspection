# 2026-08-16 · T-122 — `/admin/access` onto SAQEEL, and six ways of saying the same thing become one

`task: T-122` · `status: partial — code complete, static gates green, gutter and dedupe measured; axe, Arabic render and e2e owed` · `duration: 3h`
`rules applied: WEB-000 … WEB-014`

---

## Goal

Migrate `/admin/access` — permission state, error boundary, skeleton and screen —
off the frozen sheets onto SAQEEL primitives, with a route-owned frame, no
functional regression, and the duplicated governance copy collapsed.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/admin/access/page.tsx` | rebuilt, composition only | 391 → **25** |
| `app/(app)/admin/access/layout.tsx` | route-owned permission boundary | 6 → 18 |
| `app/(app)/admin/access/loading.tsx` | layout-mirroring skeleton | 8 → 8 |
| `app/(app)/admin/access/error.tsx` | **created — the route had none** | 0 → 44 |
| `app/(app)/admin/access/AccessManager.tsx` | **deleted** | 265 → 0 |
| `app/(app)/admin/access/RoleCapabilityPanel.tsx` | **deleted** | 134 → 0 |
| `app/(app)/admin/access/access.module.css` | **deleted** (`.views` was already dead) | 52 → 0 |
| `features/admin-access/{queries,view,strings}.ts` | created | 0 → 227 |
| `components/sections/admin-access/**` | created — 9 components + 8 modules | 0 → 675 |
| `i18n/locales/{en,ar}/admin-access.json` | created — **109 keys × 2** | 0 → 218 |
| `i18n/messages.ts` | namespace registered | +5 |
| `admin/_components/AdminDestinationFrame.tsx` | `@retiring` banner | +1 |
| `e2e/admin-access-route-aware.spec.ts` | re-pointed, 3 tests → 4 | 38 → 62 |
| `e2e/execution-access-contract.spec.ts` | re-pointed | 2 tests re-addressed |

`actions.ts` and `role-capability-actions.ts` were **not touched** — the guarded
RPCs are the write authority and this task had no business in them.

## Decisions

**The route-owned frame turned out to be two thirds already built.**
`shell-page-frame` has existed since T-004 with **zero importers**, which
`05-RETIREMENT-LEDGER.md` records as its *expected* state, and it already
implements the gutter, the breadcrumb, the title and the description. So
`access-frame` composes it and adds only what is route-specific — the metric
band and the tabs. **This is the swap the ledger prescribes** ("each future
screen migration swaps one `Shell` for one `ShellPageFrame`") and it is the
first one taken.

**`AdminDestinationFrame` was marked, not edited.** It has **5 consumers**;
editing it would have silently restyled `/admin/integrations`, `/admin/localization`,
`/admin/packages` and `/admin/risk`, which nobody asked for (WEB-002: after
editing a shared component, render every consumer). It now carries an
`@retiring` banner naming those four as `pending`.

**The shared `AdminRouteBoundary` was likewise left alone** and a route-owned
`AccessDenied` built instead. Worth stating that this screen is *reachable*: the
parent `admin/layout.tsx` admits `admin` **and** `supervisor`, while
`access/layout.tsx` admits `admin` only — so a supervisor passes the outer gate
and is refused here.

**Six restatements of three facts became one card.** Measured before and after
on the rendered payload:

```
removed   "Reconstruction note"                    internal build commentary in production UI
removed   "Access is enforced by Row Level Security, not UI." alert
removed   the roster caption repeating the same fact
removed   "Role changes are guarded and audited" gate banner
removed   "Nothing is applied silently…" effect note
kept      one Governance card — rls · audit · effect
```

The gate banner is not merely relocated: it was **unconditional**, so read-only
viewers were told that writes are guarded when they cannot write at all. The
governance card is now role-aware — a read-only session gets `rls` +
`readOnly`, a manager gets `rls` + `audit` + `effect`.

**Status is text plus shape, and a role is not a status.** The admin badge was
`badge-warning` — a warning token spent on identity, the T-116 defect exactly.
Role keys now render as `StatusPill` `accent` (admin) / `neutral` (standard)
with the access class in `title`, and the key itself set in `Mono` because it is
a machine identifier.

**Nothing formats inline.** Every date goes through `formatDate(value, locale)`
(`lib/dates.ts`) and every count through `formatCount(value, locale)`
(`i18n/numbers.ts`). The old code called `new Date(...).toLocaleDateString()`
with **no locale at all**, which renders Latin digits and a Gregorian calendar
on the Arabic screen.

**The heading outline was fixed by being forced to.** `Text as="h3"` does not
typecheck — `TextElement` excludes headings — which is the primitive refusing to
let a heading be faked. The outline is now `h1` (frame) → `CardHeader level="h2"`
→ `Heading level={3}`, with no skip. The old screen went `h1` → `h3`.

## Inventory taken before writing code

Presented and approved before any file was written.

- **State**: 4 `useState` + 1 `useTransition` per panel. `selectedUserId` stays
  (rung 5, genuinely local UI selection); the two grant `<select>`s were read
  through **`document.getElementById(...) as HTMLSelectElement`** and are now
  `useState` inside `AccessGrantRow` (rung 5, one owner each).
- **Effects**: none found, none added.
- **Literals**: ~30 inline `style={{}}` objects carrying `6`, `280`, `360`,
  `420` and legacy `--space-*` / `--status-critical-text`. All removed; the new
  CSS consumes `--sqx-*` only.
- **`<svg>`**: none in the route's own code. The 94 in the rendered document all
  come from the icon registry, which is the sanctioned path.
- **Accessibility failures found**: `h1 → h3` skip; the destructive Revoke
  styled `btn btn-primary`; three table headers (`"Capability"`, `"Source"`,
  `"Actions"`) hardcoded in English so they rendered English under `dir="rtl"`;
  four native `<select>` (WEB-009 §14); error feedback at caption size.
- **Primitives needed**: `Card`, `CardHeader`, `CardBody`, `DataTable`,
  `SaqeelSelect`, `Button`, `StatusPill`, `EmptyState`, `Skeleton`, `Text`,
  `Heading`, `Mono`, `Metric`, `Overline`, `ShellPageFrame` — **all exist, none
  built**.

## Numbers

```
route file            391 → 25 lines          (40-line ceiling)
largest component     265 → 184               (200 soft budget)
typography gate       22 → 35 removed         (+13, the route's entire debt)
eslint gate           0 → 41 removed          new code 11 files / 0 findings
i18n keys             0 → 109 × 2 locales     t(key,"English") 120 → 0
copy(en, ar) helper   1 → 0                   locale === "ar" ternary 1 → 0
native <select>       4 → 0                   document.getElementById 3 → 0
inline style literals 30 → 0                  legacy classes 11 kinds → 0
governance copies     6 → 1
page gutter           0px → 32px both sides   measured
static e2e            407 → 408 passed        33 failed, all pre-existing
v5 gate               77 → 77                 none in a touched file
```

First-load JS and route CSS are **not recorded**: they need a production build,
which is a measurement request (WEB-005 §8), not an agent command.

## Verification

- [x] `npm run typecheck` — exit 0
- [x] `npm run lint` — PASSED, 41 removed; the new tree is **11 files, 0 findings**
- [x] `npm run gates:typography` — PASSED, 35 removed
- [ ] `npm run check:design-system-v5` — 77, **pre-existing**, none in a touched file
- [x] `npm run test:static` — 408 passed (from 407), 33 failed, all pre-existing
- [x] The two re-pointed contract specs — 13 + 4 passing

**Measured in the running dev server**, on the server-rendered payload:

```
Reconstruction note        0     old RLS alert       0
gate banner                0     old effect note     0
t-caption / sq-lozenge / sq-table / btn-primary / <select>   all 0
inline style with a px or hex literal                         0
heading outline   H1 Users & roles → H2 ×3 → (H3 in panels)   no skip
page gutter       padding-inline 32px / 32px  (was 0px / 0px)
```

## Accessibility

- Heading skip fixed; destructive actions on `variant="danger"`; the confirm bar
  is `role="alertdialog"` with an accessible name; the actions column uses
  `headerHidden` so it is named for screen readers without a visible header.
- `DataTable` stacks to labelled rows below 75rem, so the roster and the
  capability table are readable at 320px without horizontal scroll.
- **axe was not run and the manual checklist is not complete.** See Blocked.

## Retirement

- `AdminDestinationFrame.tsx` — **marked** `@retiring`, `pending`
  `/admin/integrations`, `/admin/localization`, `/admin/packages`, `/admin/risk`.
- `AccessManager.tsx`, `RoleCapabilityPanel.tsx`, `access.module.css` —
  **deleted**, zero importers, the one spec reading them re-pointed first.
- `shell-page-frame` gains its **first importer**, which is the ledger's stated
  goal for it.

## Follow-up in the same task — a hydration mismatch and a centralised breadcrumb

**Owner-reported hydration error, and it was not this migration.**
`AdminScreenRegistry` (the **parent** `/admin` layout, untouched here) matched
`usePathname()` against a table of unprefixed routes:

```
server  /admin/access       ADM-S01      middleware rewrites /en/admin/x → /admin/x
client  /en/admin/access    ADM-UNMAPPED usePathname() reads the browser URL
```

So `data-saqeel-admin-screen` and `data-saqeel-admin-route` differed across the
boundary on **every `/admin/*` route reached with a locale prefix**. The fix is
`stripLocale(usePathname())` — the helper already existed in `lib/locale-path.ts`
for exactly this. Verified: `/admin/access`, `/en/admin/access` and
`/ar/admin/access` all now resolve to `ADM-S01` / `/admin/access`.

**A hyphenated JSX attribute bypasses prop type-checking entirely.** The first
`Breadcrumb` put `aria-current` on `<Text>`, whose prop API is deliberately
closed (WEB-002: no escape hatch). TypeScript **accepted it and the attribute
vanished** — attributes containing a hyphen are not checked against the
component's props type. `tsc` was clean, the gate was green, and the current
page was unmarked in the accessibility tree. Caught by reading the rendered
markup, not by any check. **`aria-*` on a primitive is a silent no-op; put it on
the element you control.**

`Breadcrumb` now lives at `components/saqeel/breadcrumb/`. The existing
`navigation/Breadcrumb` was **not** reused, on T-104's test — it has zero
importers and is `"use client"` for no reason, emits a raw `<a>`, carries an
inline `style` and the frozen-sheet `.breadcrumb` global, keys by array index,
and hardcodes an English `aria-label`. `shell-page-frame` now composes the new
one and its three inline breadcrumb CSS rules are deleted; it gained
`breadcrumbLabel` so the landmark name comes from a resource key.

## Parked

- **`/admin/loading.tsx` renders `RouteLoading`, which puts a second `<main>`
  landmark on every admin route.** Measured `mains: 2` during the transition —
  `main-content` plus `sq-content`. Out of scope here (parent segment), and it
  is the same ~25-route defect `01-PROJECT-STATUS.md` already records.
- **`actions.ts` and `role-capability-actions.ts` hold 34 of the route's
  remaining ESLint findings**, all `web/no-comments`. Untouched deliberately.
- The four other `AdminDestinationFrame` consumers are now the cheapest
  follow-on migrations — the frame, the skeleton and the denied state are built
  and generic.

## Blocked / open questions

**The rendered check could not be completed, and the reason is recorded rather
than hidden.** The Browser pane's `visibilityState` is `hidden`, which stalls the
client route transition and holds the **parent** `/admin` fallback open — the
exact caveat `01-PROJECT-STATUS.md` records against T-096. The measurements above
were taken from the **server-rendered payload** and from computed styles read off
the loaded stylesheets with a detached probe; they are real, but they are not a
settled-DOM render.

Still owed before this is `done`:

- **axe on all four states**, both themes, LTR and RTL
- **a native Arabic review of 109 keys** — I wrote the Arabic
- **the responsive pass at 320 px measured in a visible viewport** (the token
  clamp was verified, the breakpoint behaviour was not)
- **e2e** — still blocked repo-wide on browsers and persona credentials (T-119)
- **first-load JS**, which is a measurement request for the human
