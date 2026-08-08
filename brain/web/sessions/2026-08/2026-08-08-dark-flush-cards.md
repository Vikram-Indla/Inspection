# 2026-08-08 · Dark theme — flush parent cards on dashboard + operations

`task: ad-hoc (owner-requested)` · `status: done` · `duration: ~45m`
`rules applied: WEB-002 §2/§6 (tokens, module discipline), WEB-009 §3 (surfaces)`

---

## Goal

In dark theme on `/dashboard` and `/operations`, make top-level ("parent")
cards share the page background (near-black) and keep nested ("child") cards a
subtle dark gray — mirroring how the light theme already behaves (parent cards
flush with the canvas, children faintly grey) so there is less background
variation. Light theme must not change.

## The asymmetry that shaped the fix

Card backgrounds are structural: `.root` (top-level) = `--sqx-surface-default`,
`.root .root` (DOM-nested) = `--sqx-surface-raised`.

- **Light:** `surface-default` `#FFFFFF` == `surface-canvas` `#FFFFFF`, so parent
  cards are already flush; children are `surface-raised` grey-100. This is the
  target look, already shipping.
- **Dark:** the tokens were set the opposite way on purpose ("cards read as lit
  surfaces"): canvas grey-1000 `#080B10`, parent `surface-default` grey-900
  `#141A21` (lighter than page), child `surface-raised` grey-800 `#1C252E`.

Only dark needs to change, and no single token is "grey-100 in light /
grey-900 in dark", so a plain token retint can't express it. A container-level
token override was rejected because `--sqx-surface-default`/`-raised` are also
consumed by `explain-panel` (dashboard) and `operations-map-panel` (operations)
— it would leak beyond cards.

## What changed

| File | Action | Change |
| --- | --- | --- |
| `components/saqeel/card/card.module.css` | modified | +2 dark-gated rules keyed on a `[data-sqx-cards="flush"]` ancestor: parent `.root` → `--sqx-surface-canvas`, nested `.root .root` → `--sqx-surface-default` (grey-900 in dark). Base rules unchanged, so light and every non-flush screen (e.g. factories) are untouched. |
| `components/sections/dashboard/dashboard-sections/dashboard-sections.tsx` | modified | `data-sqx-cards="flush"` on the page's `.stack` container. |
| `app/(app)/operations/page.tsx` | modified | `data-sqx-cards="flush"` on the `operationalDetails` group and on a new wrapper around `RevampOperationsCenter` (its `<Stack>` root can't take the attribute). Also removed `performanceViewHref={…}` from the `RevampOperationsCenter` call — an excess prop the component does not declare (a type error); the local `performanceViewHref` const stays, still used by `performanceAnchor`. |

| `components/sections/dashboard/dashboard-skeleton/dashboard-skeleton.tsx` | modified | Wrapped `SkeletonRegion` in `data-sqx-cards="flush"` so the loading skeleton matches the loaded screen: two card tones in dark, not three. |
| `components/sections/operations/operations-skeleton/operations-skeleton.tsx` | modified | Same wrap. |

The skeletons build their shapes with the same nested `<Card as="div">`, so the
existing flush rules cover them with no new CSS — only the context attribute was
added. The shimmer bones use `--sqx-surface-subtle` (a translucent overlay), so
they stay legible on the grey-900 child surface; they are placeholder content,
not a third background tone.

Chosen scope: dashboard + operations only (owner's call). Factories and all
other Card users keep the current dark look.

## Decisions

- **Context via data attribute, not a Card prop.** Parent/child is DOM nesting,
  and the "flush" intent is a page-level context, so a single ancestor attribute
  drives it — no per-call-site `<Card>` prop churn. Cross-component styling by
  data attribute is the sanctioned mechanism (WEB-002 §6).
- **Dark-gated so light is provably inert.** Both new rules are prefixed
  `[data-theme="dark"]`; in light neither matches and cards fall through to the
  unchanged base rules.
- **Child uses `--sqx-surface-default`** because in dark that token is exactly
  grey-900 `#141A21` — the subtler shade chosen over grey-800. No new token was
  invented (WEB-002 §2 honoured).

## Rule tension noted (not resolved quietly — WEB-008 §5)

The nested-dark rule `[data-theme="dark"] [data-sqx-cards="flush"] .root .root`
is deeper than WEB-002 §6's "a class plus a data attribute" ideal (two
attributes + two classes). It was accepted because (a) the theme-asymmetric
requirement cannot be expressed by the existing token set without a new token
(which §2 says must be a deliberate change request, not inline), and (b)
`card.module.css` already uses comparably complex selectors (`:has()`, `::after`,
`+`). If a `no-deep-selector` gate lands in T-000, this is the one exception in
the file and should be waived or converted to a purpose-built token.

## Numbers

```
Visual/token change only. No JS, no perf impact.
card.module.css: +6 lines (2 rules). 2 container attributes + 1 wrapper div.
```

## Accessibility

Status still text + shape; no colour-only signalling introduced. Flush parent
cards keep their border + shadow + rim-light to stay distinguishable from the
page, exactly as the light theme's #FFF-on-#FFF cards already do. Contrast of
text on the new parent (grey-1000) and child (grey-900) surfaces is unchanged
from the values already measured for those greys in `saqeel.css`.

## Verification

- [ ] Browser / dark-theme visual check — could not run (SWC/env blocker). This
  needs an owner eyes-on pass in dark on both routes.
- [x] Static: selectors dark-gated (light untouched); `data-sqx-cards="flush"`
  present on the dashboard stack, the operations `operationalDetails`, and the
  `RevampOperationsCenter` wrapper; JSX balanced; excess prop removed.

Owner measurement request: open `/dashboard` and `/operations` in dark and
confirm parent cards read flush with the page and nested cards read one subtle
step up; confirm factories is unchanged.

## Parked

- `RevampOperationsCenter.tsx` still carries a `{/* */}` JSX comment
  (lines ~97-99) — a WEB-000 §1 violation the earlier comment sweep missed
  because it scoped to `components/**`, not the current view files in the route
  folders. Same likely applies to other `Revamp*`/route-folder view files. A
  follow-up sweep of `app/(app)/**` current (non-legacy) view files is due.
- If `factories` should get the same flush scheme later, add
  `data-sqx-cards="flush"` to its workspace container — the Card rule already
  supports it.

## Blocked / open questions

None. Visual confirmation is owner-side (env blocker).

## Proposed commit

```
style(web): flush dark parent cards on dashboard and operations
```

## Next

Owner dark-theme visual check on `/dashboard` and `/operations`.
