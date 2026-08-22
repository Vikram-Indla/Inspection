# 2026-08-22 · T-189 — last banned words cleared, favicon made visible

`task: T-189` · `status: done` · `duration: 45m`
`rules applied: WEB-003, WEB-011, WEB-013, WEB-016`

---

## Goal

Clear the remaining banned words, and fix a favicon that is invisible on light
browser chrome.

## What changed

117 English strings + 43 Arabic. All four favicon PNGs regenerated,
`saqeel-favicon.svg` rewritten. **Content baseline 121 → 0.**

## Decisions

**The favicon PNGs shipped with no plate at all.** Measured: corner and centre
pixels both `(0,0,0,0)`. The mark is `#CDBAEA`, a pale lavender, so on light tab
chrome it had nothing behind it:

```
                                as shipped   after
  white active tab                 1.78:1    5.01:1
  light theme tab (reported)       1.25:1    3.53:1
  grey inactive tab                1.36:1    3.82:1
  dark tab                         9.05:1    3.21:1
```

Only the SVG carried a plate, and its near-black `#090714` scored **1.24:1 on a
dark tab** — so even that version failed half the time.

**Plate is now the IRP brand fill `#7E61AC` with a white shield.** Five plate
colours were measured against all four tab backgrounds; it is the only one that
clears 3:1 on every one while keeping the mark at 5.01:1. It is also the actual
brand colour, so nothing was invented. No rasteriser exists on this machine, so
the PNGs were generated directly with 4× supersampling and verified by reading
their pixels back.

**Arabic needed three changes, not 117.** `كتالوج` is a transliterated loanword
and genuinely hard; `استشاري` is formal register; `التسوية` is legalistic. But
`صلاحية` (permission), `سجل` (record) and `إشراف` (supervision) are ordinary
Arabic and were left alone. Same lesson as T-187 — **the Arabic is often already
plainer than the English.**

## Numbers

```
strings rewritten     117 EN + 43 AR
content baseline      121 → 0
favicon contrast      1.25:1 → 3.53:1 on the reported tab
```

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — **0 violations, all four rules clean**
- [x] Favicon pixels read back and confirmed opaque; shape checked at 32px
- [ ] `npm run test:e2e` — not run
- [ ] **Arabic sign-off — NOT obtained.**

## Proposed commit

```
feat(copy): clear the last banned words and make the favicon visible
```
