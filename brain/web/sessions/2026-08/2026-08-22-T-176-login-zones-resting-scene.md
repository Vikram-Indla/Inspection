# 2026-08-22 · T-176 — Zones is the resting scene on /login

`task: T-176` · `status: done` · `duration: 0.5h`
`rules applied: WEB-000, WEB-004, WEB-008`

---

## Goal

Stop the five-scene motion loop taking the atlas away from the Zones view a
reader is looking at. Manager-directed: Zones stays unless the reader toggles.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/app/login/StoryPanel.tsx` | rebuilt | 172 → 104 |

## Decisions

**The timeline is no longer wired into the panel.** It was constructed, started
and immediately paused, then resumed after a 12s hold. With the loop retired it
would have been inert machinery behind two effects, which WEB-004 §1 forbids.
Removed with it: `manualRef`, `pausedRef`, `atlasInteractingRef`, `armResume`,
the timeline effect, the `paused` effect, and an unused `activeIndex`.

**`saudi-atlas-motion.ts` now has zero importers and was deliberately NOT
bannered or deleted.** The `@retiring` banner requires a `replaced-by` path and
nothing replaces this module — inventing one would breach WEB-008 §1 "never
invent". Two specs also assert its source text (`saqeel-login-revamp.spec.ts:45`
pins `STAGE_END_S`, `login-atlas-canonical.spec.ts:41` lists the file), and the
30s loop is accepted behaviour SLR-AC-002. **Retiring it needs a manager
decision.** Recorded in the tracker's PARKED section, not resolved here.

**Manual pick holds for 12s then returns to Zones.** `MANUAL_HOLD_MS` is kept at
its previous value so the timing a reader already knows does not change.

## Inventory taken before writing code

- State ladder: `stage` and `atlasInteracting` are genuine `useState`; every
  other ref existed only to arbitrate between the loop and the reader and left
  with the loop. One `useEffect` remains, cleanup-only, clearing the return
  timer — external synchronisation, permitted.
- `let` found in `onTabKey` (WEB-000 rule 6) and removed by extracting
  `nextTabIndex`, which returns `number | null`.
- 29 comment lines removed (WEB-000 rule 1); the file now has none.
- No literals, no `<svg>`, no `alt`.
- Accessibility already correct: roving tabindex, `aria-selected`,
  `aria-controls`, `role="status"` live region. All preserved.
- e2e sweep: every stage spec drives the tablist by explicit click, so none
  depended on the loop. `cd-001-v7-atlas.spec.ts:142` captures the initial stage
  and asserts it is unchanged after 2.8s — this task makes that assertion
  strictly stronger.

## Numbers

```
Route: /login
StoryPanel.tsx        172 → 104 lines
comments               29 → 0
useEffect               2 → 1 (cleanup only)
useRef                  5 → 2
client islands   unchanged (StoryPanel and the dynamic Atlas import)
measured live: stage held "decide" for 45s (previously moved at 12s)
               manual pick → travel, held 7s, returned to decide at 13.5s
```

## Accessibility

- axe-core: **not run** — stated as a gap.
- Manual: keyboard verified live — roving tabindex `-1,-1,-1,-1,0`, Home →
  scene 01, ArrowRight → 02, End → 05, focus follows selection. Arabic/RTL
  verified (`05 المناطق` active, arrow direction still mirrored). Reduced motion
  is now trivially satisfied — nothing animates the stage.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run lint` — `ESLint: No issues found` on `StoryPanel.tsx`
- [x] `npm run gates` — typography and date-input PASSED; `check:design-system-v5`
      fails on pre-existing debt, zero hits on this file. Not ticked as green.
- [ ] `npm run test:e2e` — not run this session
- [ ] Definition of Done — axe and e2e outstanding

## Retirement

`saudi-atlas-motion.ts` — zero importers, deliberately not marked. See Decisions.

## Parked

- Decide whether the five-scene loop returns at all. If it does not,
  `saudi-atlas-motion.ts` needs a retirement path and SLR-AC-002 needs amending.
- `.lg-atlas-image.is-zone-engaged` still drops the plate to `brightness(.73)`
  on zone hover. Now that Zones is the resting scene this fires more often.

## Blocked / open questions

Retiring `saudi-atlas-motion.ts` weakens accepted behaviour SLR-AC-002 and needs
a manager decision.

## Proposed commit

```
feat(login): rest the atlas on Zones instead of looping scenes
```

## Next

T-177 — login copy redundancy and the `login` i18n namespace.
