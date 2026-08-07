# 01 — Project Status

`Last updated: 2026-08-07` · `Updated by: T-002 — SAQEEL design system`

---

## What this is

`apps/web` — the MIM Inspection Platform web application. Next.js 15 (App
Router), React 19, TypeScript strict, Supabase, PWA with offline field
capture, bilingual English/Arabic with RTL, maps (Leaflet + Mapbox), 3D
(Three), video (Twilio).

The application **works**. This programme is a redesign and a disciplining, not
a rebuild.

---

## Where we stand

**Phase: 2 — the shell consumes the system; pages do not yet.**

`apps/web/src/app/saqeel.css` is the design system: one file, three cascade layers
(`sqx.tokens`, `sqx.base`, `sqx.components`), 339 custom properties, 59
classes, 3 keyframes, imported once from `app/layout.tsx`. Variants are data
attributes. It sits entirely inside cascade layers while the three legacy sheets
are unlayered, so it cannot override them and the visual diff of adding it is
zero — a migrated screen must *delete* the legacy rule, not out-specify it.

**T-004 rebuilt the authenticated shell on it.** `components/app-shell/**` (15
files) plus `features/shell/**` (4) render the rail and topbar as Server
Components; eight scoped client islands replace the single 839-line
`ShellClient`. The icon layer is `lucide-react` behind one registry —
`components/saqeel/icon/icon-registry.ts` is the only file allowed to import it.
`app/(app)/layout.tsx` is six lines.

No **page** uses the system yet. The typed primitive layer is now **T-006**,
adopting `ShellPageFrame` across 55 route files is **T-007**, and finishing the
two out-of-group admin layouts is **T-008** — until T-007 and T-008 land,
`ShellClient.tsx` and `Shell.tsx` are marked but not deletable, and none of the
46 KB is actually recovered.

**The shell has never been rendered.** See the blocker below.

The rulebook is still not machine-enforced. No lint config, no gate scripts —
every rule T-002 obeyed was checked by hand. That is **T-000**, and it remains
the highest-priority unblocked item.

> **The app does not run on this workstation.** Windows Application Control
> blocks `@next/swc-win32-x64-msvc`, so `next dev` serves nothing and
> `next build` hangs. No browser verification, no e2e, no axe, no bundle
> numbers — every task is currently limited to static verification, and the
> Definition of Done cannot be fully ticked by anyone working here. See
> BLOCKED in `03-REDESIGN-TRACKER.md`. This outranks T-000.
>
> **This is now urgent, not merely inconvenient.** T-004 replaced the chrome on
> every authenticated route and not one page was ever rendered to check it.
> `tsc` passes; nothing else was possible. If the first render is wrong, the
> revert is one line — point `app/(app)/layout.tsx` back at `AppShell` from
> `@/components/Shell`. Nothing was deleted.

---

## Baseline — measured 2026-08-06

| | |
| --- | --- |
| Files under `apps/web/src` | 814 |
| Source bytes | ≈ 5.9 MB |
| Route files under `app/(app)` | 495 |
| Saqeel primitives already built | 60 |
| Global CSS | `saqeel-runtime.css` 170 KB · `saqeel-components.css` 50 KB · `login.css` 57 KB · `tokens.css` 18 KB · **`saqeel.css` 59 KB (added 2026-08-07, 8.7 KB gzip)** |
| Lint config | none |
| CI gates | none beyond a PR contract check |

### The ten files that hold most of the problem

| File | Size | Principal violation |
| --- | --- | --- |
| `app/(app)/field/inspection/[id]/Workspace.tsx` | 136 KB | ~34× the component ceiling |
| `app/(app)/field/[visitId]/Startup.tsx` | 85 KB | client component on the strictest perf surface |
| `app/(app)/operations/page.tsx` | 79 KB | route file carrying an entire application |
| `app/(app)/field/inspection/[id]/page.tsx` | 70 KB | route file, same |
| `app/(app)/field/[visitId]/page.tsx` | 61 KB | route file, same |
| `app/(app)/planning/bulk/review/ReviewClient.tsx` | 53 KB | |
| `app/(app)/field/page.tsx` | 49 KB | route file |
| `app/(app)/factories/cr/[id]/page.tsx` | 49 KB | route file |
| `components/ShellClient.tsx` | 46 KB | client JS on **every** route |
| `app/(app)/dashboard/DashboardView.tsx` | 45 KB | |

### Known systemic issues

- Route files contain application logic and client code (WEB-001 §2).
- Icons are ~90 hand-authored inline SVG components in `app/icons.tsx` and
  scattered through screens (WEB-002 §5).
- `saqeel-runtime.css` at 170 KB loads globally; most of it is unused per route.
- Heavy libraries (`mapbox-gl`, `leaflet`, `three`, `twilio-video`) are not
  confirmed to be code-split.
- No lint configuration, so none of the code law is currently enforceable.
- Component directories mix primitives, domain components, and one-off screens.

---

## Assets we are keeping

- **`app/tokens.css`** — an audited, owner-approved semantic token sheet with
  recorded contrast ratios, a dark theme, and RTL support. This is the expensive
  half of a design system and it already exists. It is the single source of
  visual truth going forward.
- **`components/saqeel/**`** — 60 primitives already organised by concern
  (actions, inputs, data, feedback, navigation, grid, map, inspection,
  signature). They need hardening against the WEB-002 §4 contract, not replacing.
- The existing e2e and axe Playwright configuration.

---

## Decisions on record

| Date | Decision |
| --- | --- |
| 2026-08-06 | Design system is **SAQEEL**. Astryx stays banned. Existing tokens are kept; the component layer is hardened on top of them. |
| 2026-08-06 | Icons: **`lucide-react`** behind a semantic registry and one `Icon` primitive. Hand-authored `<svg>` banned in application code. |
| 2026-08-06 | ~~Styling mechanism for new work: **CSS Modules** colocated with the component.~~ **Superseded 2026-08-07.** |
| 2026-08-07 | Styling mechanism, **final**: `app/saqeel.css` holds **only tokens, base, keyframes and reduced motion** (801 lines, `@layer sqx.tokens, sqx.base`). Every component class lives in a **CSS Module paired with its component in the same directory** (`shell-rail/shell-rail.tsx` + `shell-rail/shell-rail.module.css`). Modules are never imported across directories — cross-component styling uses data attributes (`[data-brand-name]`), never a foreign class. Modules are unlayered so they can out-specify the legacy unlayered `a { color }`. Reverses the one-stylesheet decision below. WEB-002 §6 rewritten. |
| 2026-08-07 | ~~Styling mechanism: **one system stylesheet**, `apps/web/src/app/saqeel.css`.~~ **Superseded the same day.** Tokens, base and every component class in one file under `@layer sqx.tokens, sqx.base, sqx.components`. Components ship no CSS — they apply `.sqx-*` classes and data attributes. No `.module.css`, no CSS-in-JS, no Tailwind. WEB-002 §6 rewritten. |
| 2026-08-07 | Prefix is **`--sqx-` / `.sqx-`**. `--sq-` is still live in `saqeel-runtime.css` (seven nav/map custom properties) and `.sq-` owns 281 legacy classes there; `.saqeel-` is taken by `.saqeel-state` / `.saqeel-reference`. `sqx` collides with nothing — `grep -c sqx` is 0 in every legacy sheet. One prefix across custom properties, classes, cascade layer names and keyframe names. |
| 2026-08-07 | Direction is a **six-token set** declared at `:root` and `:root:dir(rtl)` in `saqeel.css` — the only `dir()` / `[dir]` rules permitted in `apps/web/src`. CSS has no `to inline-end`, so a gradient angle cannot be logical. WEB-001 §9. |
| 2026-08-07 | The three legacy sheets stay **unlayered** for now, so they outrank `saqeel.css` by construction. Migration deletes legacy rules; it never overrides them. |
| 2026-08-07 | ~~Shell active state is **server-rendered** via the `x-pathname` request header.~~ **Superseded the same day.** `app/(app)/layout.tsx` is a persistent layout — Next does not re-render it on navigation between child routes, so `headers()` is read once and the highlight never updates without a refresh. Server-computed active state is incompatible with a persistent layout. `shell-nav-group.tsx` is now a client component reading `usePathname()`; the rail, brand, topbar and page frame stay Server Components. This is the fallback T-004's §6.1 anticipated, taken as narrowly as possible. |
| 2026-08-07 | Icons are **`lucide-react` behind `components/saqeel/icon/icon-registry.ts`** — the only file permitted to import it. 34 semantic names. Hand-authored `<svg>` is banned in application code. |
| 2026-08-07 | The shell's scroll model is fixed: `.sqx-shell` is `100dvh`/`overflow:hidden`, `.sqx-shell__main` owns `overflow-y`, the topbar is a non-sticky sibling above it. This is **required**, not stylistic — the legacy `.sq-pagehead` is sticky and 55 pages still render it. |
| 2026-08-07 | **Chrome is a flat colour, not a gradient.** Rail, topbar and drawer use `--sqx-surface-chrome` — `#EAF8F0` light, `--sqx-green-950` `#001F11` near-black green dark. Gradients are reserved for small surfaces: the CTA, the active-row edge, labels and cards. Supersedes §4.1 of the T-004 brief. "Deep green" here means **near-black green**, not a brighter forest green — `--sqx-green-800` was tried and is the wrong direction. The rail and topbar dividers use `--sqx-border-strong` and are load-bearing in both themes; `--sqx-border-subtle` scores 1.14:1 on the dark chrome and disappears. |
| 2026-08-07 | `<main>` keeps `id="main-content"`. The T-004 brief asked for `id="main"`; three assertions in `e2e/ui-compliance-runtime.spec.ts` pin the existing id and e2e was out of scope. |
| 2026-08-06 | Accessibility target raised to **WCAG 2.2 Level AA**. |
| 2026-08-06 | Rulebook and session memory live in `brain/web/`. Root `CLAUDE.md` is the onboarding pointer. |

---

## Open change request — 13 tokens (blocks T-005)

T-005 stopped on WEB-002 §2: a missing token is raised, never added inline. Eight
of its ten primitives are blocked, and `menu-surface` alone blocks five of them.
The exact declarations are in
[the T-005 record](sessions/2026-08/2026-08-07-T-005-header-controls.md).

One of the thirteen needs a **decision**, not just a value:
`--sqx-rim-light` already exists as a colour and is consumed by
`--sqx-elevation-1…4`, but WEB-009 §4 specifies it as a per-theme box-shadow.
Redefining it in place breaks all four elevation tokens. The record proposes
renaming the colour to `--sqx-rim-tint`.

---

## Next action

**T-000 — Guardrails: gate scripts, lint, verify pipeline.**
See `03-REDESIGN-TRACKER.md`.

T-000 now also owes two gates that T-002 created the need for:
`gate:one-stylesheet` (no new `.module.css`; no `--sqx-*` or `.sqx-*`
declared outside `saqeel.css`) and the `dir()` check that enforces WEB-001 §9.
