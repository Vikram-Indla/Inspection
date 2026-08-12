# 2026-08-12 · T-067 — `/factories/cr/[id]` typography pass

`task: T-067` · `status: done (typography only — rebuild remains T-020)` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014`

---

## Goal

Put Factory 360 on the type scale. **Scope was explicitly limited to typography**
— this route is already scheduled for a full rebuild as T-020, so structural
work was deliberately not attempted.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/factories/cr/[id]/page.tsx` | 18 `<h2>` + 6 `<h3>` → `Heading`; inline `style={{ fontSize: "2rem" }}` → `Metric`; `.riskSummary strong` → `Metric` |
| `app/(app)/factories/cr/[id]/factory360.module.css` | dead `.riskSummary strong` rule deleted |
| `scripts/typography-baseline.json` | re-levelled 1,002 → 1,000 |

## Decisions

**This is the screen from the owner's original screenshot, and their original
complaint was still live on it.** "See the font 81.5 it's so big compared to the
rest" — `81.5` rendered at **26px** (`.riskSummary strong { font-size: 1.625rem }`)
and, two panels away, `Not Available` rendered at **32px** from an inline
`style={{ fontSize: "2rem" }}`. Two headline figures, two sizes, neither on the
scale. Every prior task in this sequence was aimed at that complaint and none of
them touched this route. Both are now `Metric` (28px), the single number size.

**24 of 26 headings had no class at all.** 18 × `<h2>` rendering at the browser
default 22px and 5 × `<h3>` at 17px. That — not the tokens — is why the screen
read as unstructured: it had no typographic hierarchy, only the UA's. This is
the same defect class as T-059's page title and T-064's Arial button: **the
value was decided by an absent declaration**, which no grep and no token audit
can see.

**The fix went in the markup, not the stylesheet, and the gate forced that.**
The obvious repair was `.panel h2 { font: var(--sqx-text-heading) }` in the
route's CSS module — two lines. But that file is not exempt, so it would have
*raised* the ratchet. Converting to `Heading level={2}` / `level={3}` instead
cost no more and moves the route toward its rebuild rather than away from it.
**The gate pushed the change to the right layer**, which is what it is for.

**Scope held deliberately.** The owner was offered typography-only versus full
rebuild and did not answer; typography-only was taken as the recommended option
and stated plainly. What was *not* touched, and why:

- **`page.tsx` is 409 lines** against WEB-001's 40-line route ceiling — 10×
  over, with the whole screen inline. That is T-020, not a typography task.
- **`factory360.module.css` (269 lines) is on the pre-Saqeel `--type-*` token
  set** — `--text-secondary`, `--space-2`, not `--sqx-*`. A different design
  system. Migrating it is the rebuild.
- Frozen global classes `.sq-surface`, `.sq-numeric`, `.sq-caption` remain.

**Two stragglers left, both inside `ContextualAiPanel`** — an `<h3>` with no
class (14px, on-scale) and a `.btn` at 13px (on-scale). That component already
carries an `@retiring` banner naming this route as one of its blockers, and its
replacement `sections/ai/ai-advisory` exists. Styling a retiring component is
work that gets deleted.

## Inventory taken before writing code

Route rendered signed-in and measured before any edit (WEB-008).

- 9 distinct sizes, 4 of them off-scale: 32px, 26px, 22px ×18, 17px ×5.
- 24 of 26 headings unstyled; heading ancestry walked to confirm UA defaults.
- `.sq-numeric` traced — 38 uses, only two of them oversized.
- One typeface already correct (the T-058 global fix reached here).
- `page.tsx` and `factory360.module.css` line counts and token set recorded.
- Tracker checked: T-020 already schedules this route's rebuild.

## Numbers

```
                        before   after
distinct sizes             9       7
off-scale sizes            4       0
unstyled headings         24       1
heading sizes         22/17px  20/16px
hero numbers          26 + 32   28 + 28  (both Metric)
violations (route)         6       5
violations (repo)      1,002   1,000
```

## Accessibility

- **axe:** not run — needs the production build. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — **every `aria-labelledby` target preserved**: all 18 `<h2 id>`
    kept their ids through the `Heading` conversion, and heading levels are
    unchanged, so the document outline is identical
  - the outline is now *visually* expressed as well as semantically — h2 at
    20px and h3 at 16px instead of both at UA defaults
  - **320px, Arabic/RTL — not verified. Owed.**
- No colour, tone or status change.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 1,000 known, 0 new
- [x] **Rendered signed-in and measured** — 7 sizes, **0 off-scale**, one typeface
- [x] Heading audit re-run: 25 of 26 headings now carry a role
- [ ] axe, 320px, Arabic/RTL — **owed**

**This route takes ~40–50s to render in dev** and the Browser pane will sit on
the `loading.tsx` fallback the whole time; a `fetch()` of the same URL returns
the full 419 KB in 3.6 s. Fronting the tab with `tabs_select` and waiting is what
finally lands it. **Do not conclude the page is broken from the fallback alone**
— check the server response first. Also note `/factories/cr/[id]` takes
`commercial_registrations.id` (a UUID), not the CR number; reaching it via
`/factories/[id]` redirects with the right one.

## Retirement

No change. `ContextualAiPanel` still lists this route as a blocker; the two
remaining stragglers here go away when it does.

## Parked

- **T-020 still owns this route's rebuild** — 409-line `page.tsx`, 269 lines of
  `--type-*` CSS, frozen `.sq-*` globals. This task made it render correctly; it
  did not make it correct.
- 5 remaining violations in `factory360.module.css` are `font-weight: 600` ×3 and
  `line-height` ×2. They affect no size and die with the rebuild.

## Blockers

None.
