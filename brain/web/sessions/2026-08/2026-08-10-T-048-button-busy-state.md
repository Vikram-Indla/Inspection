# 2026-08-10 · T-048 — a busy state on `Button`

`task: T-048` · `status: done (not verified in a browser)` · `duration: 40m`
`rules applied: WEB-000, WEB-002 §2, WEB-003, WEB-009, WEB-010`

---

## Goal

Give `Button` a real in-flight state, replacing the `{pending ? label + "…" : label}`
pattern hand-rolled at eight call sites.

## What changed

| File | Action |
| --- | --- |
| `components/saqeel/button/button.tsx` | modified — `busy?: boolean` |
| `components/saqeel/button/button.module.css` | modified — `.spinner`, `[data-busy]` |
| `components/sections/ai/ai-advisory/ai-advisory.tsx` | modified — first consumer |

## Decisions

**The visible label must not change.** Swapping "Generate planning summary" for
"Generating planning summary…" resized the button under the cursor mid-click.
The label stays; the spinner replaces the **leading icon**, so width is stable.
The *accessible* name still changes, so assistive tech is told.

**A busy button keeps its own colours.** Painting the disabled palette on every
async submit reads as *"this control broke"*, not *"this is working"*.

**The first attempt at that was wrong and is worth recording.** I wrote
`.root[data-busy]:disabled { color: inherit; background: inherit }`. `:not()`
adds no specificity but its argument does, so that selector scores **(0,3,0)**
against `.root[data-variant="ai"]`'s **(0,2,0)** — my override outranked every
variant block and stripped the AI accent **exactly while the button worked**.
The fix is to stop the disabled palette applying rather than to undo it:

```css
.root:disabled:not([data-busy]) { …disabled palette… }
.root[data-busy] { cursor: progress; }
```

This is the third instance in this codebase of *an equal-or-higher-specificity
rule silently killing a variant* — the others are `Card`'s AI accent on hover
and `a { color }` in the frozen sheet. **Check specificity before writing an
override, not after.**

**Compositor-only motion.** The spin is `transform: rotate(1turn)` — no layout,
no paint (WEB-010). The global `prefers-reduced-motion` block in `saqeel.css`
already clamps it, so no per-component rule was needed.

**Still `disabled` while busy**, so it cannot be double-submitted, and an `href`
button falls back to `<button>` rather than staying a navigable link.

## Inventory taken before writing code

8 call sites hand-rolling a pending label: `executive-brief`, `export-button`,
`refresh-button`, `factory-ai-advisory`, `planning-ai-advisory`,
`regulation-lifecycle`, `approval-decision-form`, `ai-advisory`.

## Numbers

```
Button   +1 prop, +2 CSS rules, +1 keyframe
consumers converted   1 of 8
```

## Accessibility

`aria-busy` set; the control stays disabled; `cursor: progress`. The spinner is
`aria-hidden` — the state is carried by `aria-busy` and the accessible name,
not by a decorative ring.

## Verification

- [x] `npm run typecheck` — clean
- [x] every token confirmed present in `saqeel.css`
- [ ] visual check of the ring against `variant="ai"` in **light** theme — owed

## Retirement

Nothing marked.

## Parked

- **Seven call sites still swap their labels.** Converting them is mechanical.
- **`--sqx-opacity-muted` does not exist.** I wanted it to soften the spinner and
  dropped it rather than add a token inline (WEB-002 §2). If the ring reads too
  strong, that is a one-token change request.

## Blocked / open questions

None.

## Proposed commit

```
feat(saqeel): add a busy state to Button
```

## Next

T-049 — disabled options in `Select`.
