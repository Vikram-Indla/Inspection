# 2026-08-21 · T-173 — Adopt the IRP palette, retire the acid-lime scheme

`task: T-173` · `status: done` · `duration: ~1h`
`rules applied: WEB-002, WEB-003, WEB-007`

---

## Goal

Retarget the single source of visual truth (`saqeel.css`) from the acid-lime
"linear" palette to the **IRP palette** (ir-frontend), on the manager's
instruction — colour only, leaving structure (typography, spacing, radii,
hairline elevation) on the `design/linear` reference.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `src/app/saqeel.css` | retargeted every colour primitive + colour-dependent semantic token to IRP; comments rewritten to match | 930 → 930 (≈150 lines edited) |
| `e2e/design-foundation-contract.spec.ts` | INSP-702 grey hexes updated in lockstep (same AA floor) | 151 → 151 (5 lines) |
| `brain/web/rules/WEB-002-design-system.md` | header + §1 (law item 2) + §7 rewritten: brand is aubergine and may be text; status is IRP's four verbatim | edited |
| `CLAUDE.md` | rule 7a + Design-authority section: palette is IRP, superseding `design/linear` colour | edited |
| `brain/web/README.md` | standing-rule short form (item 7) updated | edited |
| `design/linear/design.md` | amendment banner: palette superseded by IRP, structure retained | +11 |

## Decisions

- **Restore, don't reinvent.** `saqeel.css` *was* the IRP palette until commit
  `626a92dc` (2026-08-17) swapped it for acid-lime. The IRP mapping — already
  fitted to SAQEEL's token names and contrast-measured — was recovered from
  `626a92dc~1` and re-applied. No colour was invented (governance: open decisions
  are not permission to invent values).
- **Colour only.** `626a92dc` also changed typography, elevation and fonts. Only
  the colour primitives and colour-dependent semantic tokens were taken; the
  nine-role typography (WEB-014), spacing, radii and the **hairline elevation**
  (WEB-002 §8) — all adopted *after* the swap — were left untouched.
- **The brand may now be text.** Acid lime was fill-only (1.23:1 on white). IRP
  aubergine `#413259` is readable, so `--sqx-text-on-action` / `-action-primary-text`
  flip to white (fill needs white ink) and dark-mode `--sqx-text-link` /
  `-text-accent` / `-action-tertiary-text` / `-segment-label` move off neutral grey
  onto `brand-200`. This is the one behavioural change beyond hue.
- **IRP teal secondary deliberately not adopted** — at that saturation it reads as
  green and would collide with success (WEB-002 §7).
- **Alpha channel base** moved `138,143,152 → 145,158,171` (IRP grey-500), so
  every divider/hover/disabled fill stays neutral over the new greys.
- **Governance doc conflict resolved, not left dangling.** `design/linear`,
  WEB-002, CLAUDE.md rule 7a and README all asserted "acid-lime accent, fill never
  text." All four were amended so the rules match the code; `design/linear` keeps
  its structural authority via an explicit palette-superseded banner rather than a
  falsifying rewrite of the captured reference.

## Inventory taken before writing code

- Not a route migration — no per-screen state/effect/literal/`<svg>` inventory.
- Confirmed `saqeel.css` is the sole colour source: grepped `apps/web` for the
  lime hexes (`E4F222`/`EEF799`/`CEDB20`/…) → **zero** outside the base file (two
  hits were a false-positive comment and unrelated code).
- Confirmed no test/gate hardcodes a changed value except INSP-702's two grey
  `toContain` assertions (updated) — the first contrast test uses
  palette-independent literals; no `scripts/` gate references the hexes.

## Numbers

```
No route rebuilt — palette retarget of the token sheet only.
saqeel.css:  930 → 930 lines (~150 edited; 152 ins / 169 del by git --stat)
lime hexes remaining in apps/web outside saqeel.css: 0
tokens changed: grey ×13, brand ×12, status ×24, ai ×4, tint ×17, alpha ×11,
  veil ×4, + 6 semantic (on-action ×2 light, link/accent/tertiary/segment ×4 dark)
(production first-load JS / LCP / INP: unchanged — no JS or route change)
```

## Accessibility

- **Contrast re-verified for the changed regression guard (INSP-702):** grey-600
  `#637381` = 4.88:1 on white; grey-500 `#919EAB` = 5.68:1 on grey-800 `#1C252E`,
  6.41:1 on grey-900 `#141A21` — all ≥ 4.5 AA. The AA floor in the test is
  unchanged (not weakened).
- The IRP mapping ships its own measured ratios (see the `saqeel.css` status and
  brand comment blocks): brand fill `#7E61AC` carries white 5.01:1; status pill
  text-on-tint 6.78–9.27:1 light, 7.88–9.21:1 dark.
- Manual (WEB-003 §10): dark verified live (computed tokens resolve to IRP
  aubergine); full keyboard/SR/zoom/greyscale pass not re-run — no markup or DOM
  changed, only token values.

## Verification

- [x] `npm run typecheck` — 0
- [x] `npm run gates` — the palette change introduces no new finding; the only
      `check:design-system-v5` output is pre-existing (emoji-as-icon /
      utc-slice-date) in `field`/`planning`/`visits` files not touched here
- [x] Live (attached dev server, dark): computed `--sqx-brand-400 #7E61AC`,
      `-brand-600 #413259`, `-action-primary-bg #B49AD8`, `-nav-active-text
      #CDBAEA`, `-success-main #22C55E`, `-error-main #FF5630`, `-info-main
      #46CFE7` — IRP throughout
- [ ] `npm run test:e2e` (browser) — not run in-session (pane not displayed);
      INSP-702 assertions updated to pass, source + live verified
- [ ] Full production build — measurement request (WEB-005 §8), human-run

## Retirement

Nothing retired in code (repointing, not deletion). The **acid-lime visual
language** is retired as authority: `design/linear` colour superseded by IRP via
its amendment banner; WEB-002 / CLAUDE.md / README color rules rewritten to match.

## Parked

- The deprecated `--sqx-green-*` / `--sqx-warm-*` / `--sqx-ink-*` alias block in
  `saqeel.css` still exists as a safety net and now points at aubergine. Its
  own comment says to grep the un-audited routes (planning/execution/reviews/
  admin/factories/field) and delete it — still owed, still out of scope here.

## Blocked / open questions

- None blocking. Open for the manager: whether IRP's teal secondary should ever
  enter the system (currently excluded as green-adjacent, WEB-002 §7).

## Proposed commit

```
feat(tokens): adopt the IRP palette, retire the acid-lime scheme
```

## Next

T-174 — next unblocked NOW item (admin/shared legacy route). Palette work is
complete; no follow-up task required.
