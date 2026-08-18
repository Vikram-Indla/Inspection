# 2026-08-18 · T-155 — `/admin/risk/models` rebuilt on SAQEEL (+ section tabs, + skeleton spacing fix)

`task: T-155` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014`

---

## Goal

Design-critique transform of the risk-model workbench — a maker-checker
draft-layer for risk scoring models (create draft → review → approve → publish →
retire, with weight-sum + band validation). Owner approved the P0/P1 critique +
widget mockup, with **two explicit asks**: verify the section tabs, and fix the
skeleton's left-right spacing.

## What was wrong

- `AdminShell`, 100 % raw HTML (`<fieldset>`/`<select>`/`<input>`/`<details>`) +
  `panel`/`sq-field`/`sq-input numeric`/`rk-composer`/`rk-factor-row`/`rk-band*`/
  `badge`/`t-caption`, inline `style={{ gap: var(--space-3), color: var(--status-critical) }}`,
  legacy `EmptyState`/`IconChart`.
- `t(key,"English")` with **no `ar`** (English-only in Arabic) + English action
  messages.
- **The skeleton bug (owner's flag):** `loading.tsx` → `RouteLoading` rendered
  `SkeletonRegion` with **no page frame**, so it sat edge-to-edge while the real
  content (inside `AdminShell`) was padded/centred.
- **The tabs (`RiskSectionNav`)** on legacy `rk-section-nav` classes.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/risk/models/page.tsx` | rebuilt as a route file (79 → 11) |
| `app/(app)/admin/risk/models/loading.tsx` | **framed skeleton** (`ShellPageFrame`-wrapped) — the spacing fix |
| `app/(app)/admin/risk/models/actions.ts` | localized (55 → 59), logic byte-for-byte |
| `features/admin-risk-models/queries.ts` | created — load + feature flag |
| `components/sections/admin-risk-models/` | `risk-models-screen` · `risk-section-nav` · `risk-composer` · `risk-model-card` · `risk-models-skeleton` · `risk-models.module.css` |
| `i18n/locales/{en,ar}/admin-risk-models.json` | created — new namespace + `messages.ts` |
| Deleted | `models/RiskModels.tsx` (rebuilt) · `risk/RiskSectionNav.tsx` (rebuilt) |

## Decisions

**The skeleton spacing fix.** The migrated `loading.tsx` renders
`RiskModelsSkeleton`, which wraps `SkeletonRegion` in **`ShellPageFrame`** — same
max-width + horizontal padding as the screen — so the skeleton no longer sits
flush to the edge. The shared `RouteLoading` is left untouched; risk/models gets
its own framed skeleton like every other migrated route.

**The tabs.** `RiskSectionNav` became a SAQEEL underline-tab nav — a `<nav>` of
real `<Link>`s (Risk Studio → `/admin/risk`, Model versions → `/admin/risk/models`)
with the hint as a `Text tone="muted"` subtitle, `data-active` underline via
`--sqx-border-width-thick`, RTL-safe logical properties. These are **cross-page
navigation**, so they stay href-based (not the on-page `Tabs` primitive, which is
for panel-switching). Browser-verified: both tabs render, "Model versions" shows
the active underline on this route, and clicking "Risk Studio" navigates to
`/admin/risk`. (The Studio screen is a separate migrated surface that renders its
own layout — it does not consume this nav; flagged at approval, not touched here.)

**Components + governance.** `Field`/`TextInput`/`SaqeelSelect`/`Button`/`Card`/
`StatusPill` (tone map draft=neutral/review=pending/approved=info/published=
success/retired=neutral)/`DefinitionList`/saqeel `EmptyState`. The client-side
live validation (`validateRiskModelPayload` over the composed `factors`/`bands`)
is preserved, and `actions.ts` is localized (`getLocale()` + the namespace, with
`fill` for the transition messages) while every branch — the
`FEATURE_RISK_WORKBENCH` gate, `isRiskModelTransitionAllowed`, `row_version`
optimistic concurrency, the `risk_model_transition` RPC, `revalidatePath` — stays
byte-for-byte. The `NotYetBoundary` flag-off path is preserved.

## No regression

The governance contract `admin-risk-studio-contract` (5 tests) read the old
`RiskModels.tsx` / `RiskSectionNav.tsx` / `page.tsx`. Re-pointed to the new
component files + the `en` namespace, preserving every guarantee — the two nav
hrefs, `current="/admin/risk/models"`, the empty-vs-read-failure split, the
`type="hidden" name="payload"` + `validateRiskModelPayload` client validation, the
`isRiskModelTransitionAllowed` + `published` immutable state, the
`risk_model_transition` RPC, and the domain transition maps. Its Studio and
frozen-CSS (`saqeel-runtime.css` `.rk-section-nav`) assertions are untouched (the
frozen sheet is unchanged; the new nav uses a colocated module instead).

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — PASSED (relocked 1190 → 1186)
- [x] `npm run gates:date-inputs` — PASSED (19 unchanged)
- [x] `npm run check:design-system-v5` — **62** unchanged; risk-models adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline** (risk contract re-pointed, 5/5 green)
- [x] **live render (admin persona)** — the section **tabs** render with the correct
      active underline and **navigate** (Risk Studio → `/admin/risk`); the content
      is padded in line with the title (skeleton fix is the same framing)
- [ ] board / composer / model-card render — **owed**: `FEATURE_RISK_WORKBENCH` is
      **off** in this env, so the page shows `NotYetBoundary`; the composer, model
      cards, transitions, and Arabic/axe/zoom on a populated board need the flag on.

## Parked

- Populated-board render (flag on) + axe / light / zoom / Arabic on the composer
  and model cards.
- The Risk **Studio** page (`/admin/risk`) doesn't render this cross-page nav —
  a small consistency follow-up, its own screen.

## Proposed commit

```
feat(admin): rebuild risk models workbench on saqeel with framed skeleton
```

## Next

The remaining admin surfaces, or the Studio-nav consistency follow-up.
