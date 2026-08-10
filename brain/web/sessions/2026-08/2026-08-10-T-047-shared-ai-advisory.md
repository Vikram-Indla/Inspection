# 2026-08-10 · T-047 — shared AI advisory panel

`task: T-047` · `status: done (not verified in a browser)` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-006 §4, WEB-009`

---

## Goal

Rebuild the contextual AI panel on SAQEEL and generalise it, so every screen
that shows a governed advisory uses one component.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/sections/ai/ai-advisory/ai-advisory.tsx` | created | — → 110 |
| `components/sections/ai/ai-advisory/ai-advisory.module.css` | created | — → 27 |
| `components/ContextualAiPanel.tsx` | marked `@retiring` | 76 |
| `app/(app)/planning/bulk/page.tsx` | modified | — |
| `brain/web/05-RETIREMENT-LEDGER.md` | modified | +1 row |

## Decisions

**Rule of Two, applied properly.** `factory-ai-advisory` was already the correct
SAQEEL shape (`Card accent="ai"`, `Icon name="ai"`, `StatusPill`, `Button`) but
hardcoded to factories, while `ContextualAiPanel` had **7 consumers** on legacy
markup. The answer was to generalise the good one, not to write a third.
`ai-advisory` carries the full legacy prop surface — `surface`, `context`,
`evidenceRefs`, `targetRef`, `itemId`, offline detection, `providerState` — so
the remaining six migrate by swapping an import.

**Four separate defects were visible in the owner's screenshot, all from legacy
CSS rather than the JSX:**

- No AI accent — it was `<section className="panel">`, a generic legacy surface.
- A 🔒 emoji nobody wrote: `sq-banner--immutable` injects it via `::before`.
- "Source evidence" rendered **twice** — once above the form, once inside the
  result block.
- A full-bleed lavender slab: `btn btn-primary btn-touch btn-block`.

**`aria-live` was wrapping the wrong element.** The old panel put it on the same
`<div>` that was the button's `aria-describedby` target, so a screen reader
re-read the button label instead of announcing the outcome. Now `aria-live`
wraps only the status text and the button uses `controls`.

## Inventory taken before writing code

7 importers; 12 legacy classes (`panel`, `panel-header`, `row`, `grow`, `stack`,
`btn*`, `alert*`, `sq-banner--immutable`, `sq-link`, `t-caption`); 1 duplicated
label; zero `<svg>`; the emoji came from CSS, not markup.

## Numbers

```
legacy classes   12 → 0
duplicate labels  1 → 0
consumers migrated 1 of 7 (/planning/bulk)
```

## Accessibility

- Status announcement fixed (see Decisions).
- Advisory tone is text plus pill, never colour alone.
- axe: **not run** — no browser on this workstation.

## Verification

- [x] `npm run typecheck` — clean
- [x] zero comments, zero literals, `--sqx-` only in the module
- [ ] axe, keyboard, Arabic, dark — owed

## Retirement

`components/ContextualAiPanel.tsx` marked `@retiring` with a ledger row naming
all **6 remaining consumers**. Not deletable.

## Parked

- Six consumers still on the legacy panel: `/factories/[id]`,
  `/factories/cr/[id]`, `/field/factory-360/[id]`, `/field/inspection/[id]`,
  `/field/[visitId]`, `sections/visits/visit-ai-summary`.
- `factory-ai-advisory` is now a near-duplicate of `ai-advisory` and should
  adopt it rather than keep its own copy.

## Blocked / open questions

None.

## Proposed commit

```
feat(ai): rebuild the contextual advisory panel on saqeel
```

## Next

T-048 — a busy state on `Button`.
