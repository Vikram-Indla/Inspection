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

**Phase: 1 — the visual vocabulary exists; nothing consumes it yet.**

`apps/web/src/app/saqeel.css` is the design system: one file, three cascade layers
(`saqeel.tokens`, `saqeel.base`, `saqeel.components`), 339 custom properties, 59
classes, 3 keyframes, imported once from `app/layout.tsx`. Variants are data
attributes. It sits entirely inside cascade layers while the three legacy sheets
are unlayered, so it cannot override them and the visual diff of adding it is
zero — a migrated screen must *delete* the legacy rule, not out-specify it.

No screen uses it yet. The React layer that applies these classes is **T-004**.

The rulebook is still not machine-enforced. No lint config, no gate scripts —
every rule T-002 obeyed was checked by hand. That is **T-000**, and it remains
the highest-priority unblocked item.

> **The app does not run on this workstation.** Windows Application Control
> blocks `@next/swc-win32-x64-msvc`, so `next dev` serves nothing and
> `next build` hangs. No browser verification, no e2e, no axe, no bundle
> numbers — every task is currently limited to static verification, and the
> Definition of Done cannot be fully ticked by anyone working here. See
> BLOCKED in `03-REDESIGN-TRACKER.md`. This outranks T-000.

---

## Baseline — measured 2026-08-06

| | |
| --- | --- |
| Files under `apps/web/src` | 814 |
| Source bytes | ≈ 5.9 MB |
| Route files under `app/(app)` | 495 |
| Saqeel primitives already built | 60 |
| Global CSS | `saqeel-runtime.css` 170 KB · `saqeel-components.css` 50 KB · `login.css` 57 KB · `tokens.css` 18 KB · **`saqeel.css` 65 KB (added 2026-08-07, 9.0 KB gzip)** |
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
| 2026-08-07 | Styling mechanism: **one system stylesheet**, `apps/web/src/app/saqeel.css`. Tokens, base and every component class in one file under `@layer saqeel.tokens, saqeel.base, saqeel.components`. Components ship no CSS — they apply `.saqeel-*` classes and data attributes. No `.module.css`, no CSS-in-JS, no Tailwind. WEB-002 §6 rewritten. |
| 2026-08-07 | Prefix is **`--saqeel-` / `.saqeel-`**, not `--sq-`. `--sq-` is still live in `saqeel-runtime.css` (seven nav/map custom properties) and `.sq-*` owns 804 class hits. One prefix across custom properties, classes, layer names and keyframe names. |
| 2026-08-07 | Direction is a **six-token set** declared at `:root` and `:root:dir(rtl)` in `saqeel.css` — the only `dir()` / `[dir]` rules permitted in `apps/web/src`. CSS has no `to inline-end`, so a gradient angle cannot be logical. WEB-001 §9. |
| 2026-08-07 | The three legacy sheets stay **unlayered** for now, so they outrank `saqeel.css` by construction. Migration deletes legacy rules; it never overrides them. |
| 2026-08-06 | Accessibility target raised to **WCAG 2.2 Level AA**. |
| 2026-08-06 | Rulebook and session memory live in `brain/web/`. Root `CLAUDE.md` is the onboarding pointer. |

---

## Next action

**T-000 — Guardrails: gate scripts, lint, verify pipeline.**
See `03-REDESIGN-TRACKER.md`.

T-000 now also owes two gates that T-002 created the need for:
`gate:one-stylesheet` (no new `.module.css`; no `--saqeel-*` or `.saqeel-*`
declared outside `saqeel.css`) and the `dir()` check that enforces WEB-001 §9.
