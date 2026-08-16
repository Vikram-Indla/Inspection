# 2026-08-17 · T-127 — `/admin/planning/expiry` rebuilt in the experimental Linear language

`task: T-127` · `status: partial — code complete, rendered and measured in both themes and both locales; axe and browser e2e owed` · `duration: ~4h`
`rules applied: WEB-000 … WEB-014, with two deliberate, owner-authorised departures recorded below`

---

## Goal

Rebuild one route in the experimental design system at `apps/web/experimental/`
so the owner's manager can judge it against the current SAQEEL transformation,
and decide whether to adopt it, reject it, or take parts of it.

**This is an A/B trial, not a migration.** The SAQEEL screen it replaces is
deliberately still on disk (see Retirement).

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/admin/planning/expiry/page.tsx` | rebuilt | 107 → 14 |
| `app/(app)/admin/planning/expiry/loading.tsx` | created | — → 7 |
| `app/(app)/admin/planning/expiry/error.tsx` | created | — → 40 |
| `app/(app)/admin/planning/expiry/ExpiryAdmin.tsx` | **retained deliberately, unrendered** | 222 → 222 |
| `app/(app)/admin/planning/expiry/actions.ts` | untouched — governed M9 write layer | 211 |
| `features/admin-planning-expiry/queries.ts` | created | — → 96 |
| `components/experimental/linear/*` (12 files) | created — the experimental design system | — → 590 |
| `components/experimental/planning-expiry/*` (11 files) | created — the screen | — → 545 |
| `i18n/locales/{en,ar}/admin-planning-expiry.json` | created | — → 67 keys each |
| `i18n/messages.ts` | registered the namespace | +5 |
| `scripts/check-typography.mjs` | exempted the experimental type layer | +2 |
| `e2e/cd-044-admin-planning.spec.ts` | 3 assertions re-pointed + 3 locators de-ambiguated | 6 lines |
| `.claude/launch.json` | added a `web-dev` launch entry | +7 |

## Decisions

1. **Tokens are prefixed `--lnr-*` and scoped to a class, never `:root`.**
   `variables.css` defines `--radius-sm`, `--radius-md`, `--shadow-sm` and
   `--shadow-md`, **all four of which already exist in the frozen
   `src/app/tokens.css`**. A global `:root` block would have silently changed
   radii and shadows on every route in the application. The experiment cannot
   leak; deleting the directory removes it completely.
2. **`theme.css` is unused.** It is a Tailwind v4 `@theme { }` block and
   duplicates `variables.css` exactly. This repo has no Tailwind and WEB-002 §3
   bans it. `variables.css` + `design.md` + `token.json` are the authority.
3. **The light theme is derived from their own 16 colours, not invented.**
   `design.md` is dark-only. The ladder inverts cleanly: `fog` is muted text on
   dark, `ash` is muted text on light; `graphite`/`smoke` hairlines become
   `bone`/`mist`. The one derived value is the light raised surface (`#fafafa`).
   Every pair was measured (see Accessibility).
4. **Green and red are not status colours here — `design.md` says so twice**,
   and that single rule fixes the worst defect of the old screen. The old screen
   painted every superseded version with `sq-lozenge--critical`, so a page whose
   normal resting state is "one enabled version among many" rendered mostly red.
   Now: enabled = neutral badge + acid-lime dot + medium weight; superseded =
   neutral badge. Status remains text-plus-shape (rule 5).
5. **Acid lime is a fill only, never text.** Measured `#e4f222` as text on white
   is **1.23:1**. As a fill with `#08090a` ink it is **16.15:1 in both themes**,
   so the accent survives the light theme unchanged.
6. **`AdminShell` was dropped from this route.** It nests a second shell inside
   `(app)/layout.tsx`'s `AppShell`, and renders the page title as an `h2` — so
   the route had **no `h1` at all**. The Linear screen owns its heading outline:
   `h1` + four `h2`. Consequence: the breadcrumb is gone on this route. If the
   experiment is adopted, the breadcrumb must be rebuilt in the new language.
7. **The read-only role still drops the Actions column.** My own critique argued
   the column set should not change by permission — I softened that, because a
   column of em-dashes is worse than its absence, and the explicit read-only
   notice makes the change non-silent. Recorded because it contradicts the
   critique.
8. **The 96px section gap was applied at page-region level only.** `design.md`
   is a marketing-site reference (hero type at 64–72px, customer logo strips,
   *"information density stays low"*, *"never uses 3-column card grids"*). Four
   governed data tables 96px apart is unusable. Header→content is 48px, card→card
   is 24px; both are on their spacing scale. **This is the single biggest
   open question for the manager** — see Blocked.

## Inventory taken before writing code

- **State:** whole screen was one `"use client"` component (222 lines) holding
  `editingId`, `creatingType`, `toggleFeedback`, `useTransition`. Now the page,
  screen, skeleton and error frame are Server Components; three client leaves
  remain (`section`, `row`, `editor`) because the editor is a form with pending
  state and the toggle needs optimistic feedback.
- **Literals:** ~60 `t(key, "English")` bridges → 0; 67 keys × 2 locales.
- **Legacy classes:** 17 (`panel`, `sq-table`, `sq-btn`, `sq-lozenge`,
  `sq-banner`, `t-caption`, `sq-field__label`, `alert`, …) → 0.
- **Inline styles:** ~20 `style={{ }}` objects → 0.
- **`<svg>`:** none present, none added.
- **Accessibility failures found:** no `h1`; four tables with no accessible
  name; governed data (Scope, Notify, Effective) at 11.5px `--text-muted`; the
  edit form rendered inside the narrowest `<td>` of an 8-column table; Cancel
  styled `btn btn-primary` beside the real submit; feedback rendered at page top
  while its trigger could be three sections down.
- **`e2e/` source-path grep (WEB-008):** no spec reads these files as text.
  Four specs reference the route; only `cd-044` asserts its markup.

## Numbers

```
Route: /admin/planning/expiry
route file            107 → 14 lines
client-component tree  1 whole screen → 3 leaves
hardcoded copy         ~60 t(key,"English") → 0   (67 keys × en/ar, parity identical)
legacy CSS classes     17 → 0
inline style objects   ~20 → 0
smallest rendered text 11.5px → 13px
heading outline        no h1 (shell h2 + 4× h2) → h1 + 4× h2
tables with a name     0 of 4 → 4 of 4 (<caption>)
document                77,613 bytes (measured after; no before captured)
```

**Not measured:** first-load JS, route CSS, LCP/INP/CLS. These need a production
build, which is human-only (WEB-006 §3) — **measurement request, not an agent
command.**

## Accessibility

Measured in the running app with `getComputedStyle`, compositing alpha
backgrounds against their real ancestors — not asserted from the palette.

```
DARK                                              LIGHT
h1                     19.93:1  AA                19.93:1  AA
subtitle (muted)        6.13:1  AA                 5.77:1  AA
column header           5.86:1  AA                 5.77:1  AA
reason cell            13.04:1  AA                11.26:1  AA
scope cell (muted)      5.86:1  AA                 5.77:1  AA
status badge           11.68:1  AA                10.14:1  AA
ghost button text          —                      11.26:1  AA
ghost button border        —                       5.77:1  (needs 3:1)
```

**Two failures found by measuring and fixed:**

1. **`design.md`'s own badge specification fails AA.** It specifies
   `rgba(255,255,255,0.05)` background with `#8a8f98` text; the tint lightens the
   ground and the composite measures **3.25:1** at 13px. Badge text moved to
   `--lnr-text-body` → **11.68:1**. Live/superseded stay distinct via the dot and
   weight.
2. **`design.md` assigns `ash #62666d` to "muted body text"; on `void` that is
   3.45:1** — large-text only. Muted text on dark uses `fog #8a8f98` (6.13:1)
   instead; `ash` is kept for control borders, where 3:1 applies and it passes.

**Hairline borders are decorative, control borders are not.** `graphite` on
`void` is 1.30:1 — correct for dividers under WCAG 1.4.11, insufficient for an
input boundary. Controls use `--lnr-control-edge` (`ash`), measured 3.45:1 dark /
5.77:1 light.

Manual checklist (WEB-003 §10):
- **keyboard** — every control reachable; form opened, all 7 controls present and
  each has a wired `<label for>` (verified in the DOM).
- **Arabic / RTL** — `dir=rtl`, `lang=ar`, layout mirrors (sidebar, accent bars,
  table). **`nonZeroLetterSpacing: 0`** — the WEB-011 no-tracking-on-Arabic rule
  holds via an RTL token reset. **92 Arabic-Indic digit nodes**; the only 30
  Latin-digit nodes are the seeded `reason` values, which are database content,
  not copy.
- **dark + light** — both rendered and measured above.
- **reduced motion** — skeleton pulse is `opacity` only and disabled under
  `prefers-reduced-motion`.
- **320px / 200% zoom** — not yet checked. **Owed.**
- **axe** — not run. **Owed.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 104 below baseline
- [x] `npm run gates:typography` — PASSED, 115 below baseline
- [x] `npm run check:design-system-v5` — 76 findings, **unchanged**, none in a
      file this task touched (pre-existing; red for everyone since 2026-08-15)
- [x] `npm run verify:dates` — 17 checks passed
- [x] `npm run test:static` — 408 passed, 4 skipped (baseline unchanged)
- [x] Rendered and measured in dark, light, English and Arabic
- [ ] `npm run test:e2e` — **blocked**, no browsers installed and no credentials (T-119)
- [ ] axe — **owed**
- [ ] Definition of Done (WEB-006 §5) — not fully ticked

**`test:static` passing does NOT cover `cd-044`** — it is not in
`playwright.static.config.ts`'s hand-maintained allowlist. This is the exact trap
T-124 fell into. The contract was therefore verified **live in the browser**
instead: section element with the target heading ✓, `tr` for v1 ✓, buttons
`Enable`/`Disable`/`New version` ✓, form inside the section ✓,
`input[name="reason"]` ✓, submit labelled exactly `Create version (disabled)` ✓,
all seven control names matching what `actions.ts` parses ✓.

## Spec changes

- **3 assertions re-pointed.** `.sq-banner--success` no longer exists on this
  route; success feedback is now a per-section `role="status"` notice, so the
  assertions became `section(page).getByRole("status")`. Re-pointed **before**
  the code was called done, not after a failure. The fourth occurrence at
  line 144 belongs to `/admin/planning/lookups` and was **not** touched.
- **3 locators de-ambiguated — a latent bug, not mine.**
  `locator("tr", { hasText: "v1" })` is a substring match. The spec's own
  create-version test grows that section every run and it is **already at v9**;
  at v10 the locator matches both `v1` and `v10` and fails Playwright strict
  mode. Replaced with an exact cell match, verified in the DOM to resolve to one
  row. Left alone, the next run would have failed and looked like this migration.
- Both edits were made **by line number through a script**, because the file is
  CRLF and this repo has hit the CRLF zero-match trap four times. Each edit
  asserted its own landing (`remaining: 0`, `rewritten: 3`).

## Retirement

**Nothing was marked or deleted, deliberately.** `ExpiryAdmin.tsx` (222 lines)
now has zero importers, which normally starts the retirement protocol. It is the
**control arm of a trial**: if the manager rejects the Linear language, restoring
the old screen is a one-line change to `page.tsx`. Marking it `@retiring` would
assert a decision nobody has made. Revisit when the verdict lands.

## Parked

- **Inter is not rendering, and cannot be without shipping a font file.**
  Measured by width comparison: as-declared **500.20px** ≡ `plexArabic`
  **500.20px**, against Inter's probe at 435.25px. The route renders in IBM Plex
  Sans Arabic. `app/layout.tsx` self-hosts deliberately so the build never
  depends on a Google fetch, so Inter would have to be self-hosted the same way.
  **The manager is currently seeing Linear's colour, spacing, shape and hierarchy
  in the ministry's typeface — not its typography.**
- `expiry-copy.ts` is a 3-line type alias; fold it into the screen if the
  experiment is adopted.
- `features/admin-planning-expiry/queries.ts` imports `types.ts` from the route
  directory — layering runs backwards. Correct by moving `types.ts` into the
  feature, which requires touching `actions.ts`.
- The experimental directory holds the design system for **one** route. A second
  adopter would trigger the Rule of Two and a real ledger entry.

## Blocked / open questions

1. **Density.** `design.md` is a marketing-site reference and this is a dense
   governed table. I applied its rhythm at page-region level and used its
   component-level spacing inside cards. **If the manager wants the literal 96px
   band rhythm, this screen needs a different information architecture, not
   different CSS.**
2. **Inter.** Ship a self-hosted Inter Variable (with `cv01`/`ss03`/`zero`, which
   `design.md` calls its typographic identity), or accept IBM Plex Sans Arabic
   and lose it? Arabic must keep Plex regardless.
3. **Arabic.** The Linear reference has no Arabic story at all — no Arabic
   typeface, and a type scale whose negative tracking must be zeroed for Arabic.
   For a Saudi ministry platform where **Arabic is primary**, adopting this
   system means authoring its Arabic half from scratch.
4. **The typography gate now exempts `components/experimental/linear/`.** That
   is a *detection* reduction, which WEB-014 §8's ratchet does not govern and
   this repo has been burned by before (T-102). It is justified only while the
   directory is a sanctioned trial. **If the experiment is rejected, delete the
   directory and the exemption together.**

## Proposed commit

```
feat(expiry): rebuild planning expiry in the experimental linear system
```

## Next

Owner/manager verdict on the three questions above. If adopted, the next task is
Inter self-hosting plus an Arabic type ruling, before any second route is
converted. If rejected, delete `components/experimental/` and the gate exemption,
and point `page.tsx` back at `ExpiryAdmin`.
