# SAQEEL FINAL CUT — brutal design review and in-place correction

**Reviewer stance:** independent design director, pre-implementation gate.
**Artifact under review:** `Saqeel Revamp.dc.html` (revised **in place** — no alternative version, no duplicate screens).
**Design revision:** H4 → **FC1** · 26 Jul 2026
**Before-cut snapshot:** `export/pre-final-cut-H4-snapshot.html` (byte copy taken before any correction)
**Repository base:** `github.com/Vikram-Indla/Inspection` — see `github.md` for branch and last sync
**Evidence:** `designs/` (45 frames, pre-cut) + measured DOM probes recorded per finding below

---

## WHAT I WOULD REJECT IF ANOTHER DESIGNER SUBMITTED THIS

Six things, and I would not have approved payment on any of them.

1. **The segmented control is not the design system's segmented control.** Eight tracks, and only one used `.seg-opt`. The other seven were raw `<button>` elements with inline `background: var(--action-primary)` painted on by a helper called `segStyle()`. It looked close enough in a screenshot. It was a hand-rolled imitation of a component that already exists — exactly the thing a design system is supposed to stop — and it carried no `aria-pressed`, so a screen-reader user could not tell which perspective was active.
2. **And it visibly broke.** Because the track was sized to its content and set to `flex-wrap: wrap`, the Dashboard's two options measured 249px inside a 251px box. Two pixels. Any font substitution, any letter-spacing change, Arabic — and "Operational view" dropped onto a second line, outside the pill track. That is a defect I dismissed twice as a screenshot artifact. It was not; it was a real fragility that a wider label or a slower font load would expose in production.
3. **Forty-four uppercase transforms with letter-spacing.** The Saqeel content rule is sentence case, and the type system is explicit that overlines "rely on size, not uppercase transforms." I shipped `NATIONAL PERFORMANCE`, `PORTFOLIO · CR …`, and 42 more. It is the cheapest possible way to signal hierarchy and it reads as a template, not as an institution. Worse in Arabic, where letter-spacing is meaningless and the token sheet forcibly zeroes it.
4. **Display type used as decoration.** KPI values at 32/40 in weight 500 — larger than the canonical metric size, in the wrong weight, with a duplicated `font-variant-numeric` declaration in the same style string. Eight more inline sizes at 24px where the page-title token is 22px. Inline pixel values bypassing a token ladder that exists and is loaded.
5. **The tinted band with a coloured left edge.** Two of them, on the Dashboard's AI priorities. Full-bleed, one line of text, a metre of empty space to the right. It is the single most recognisable "AI-generated interface" trope and it was doing no work that a panel with a heading would not do better.
6. **Twenty-five `ax-` class references** left in the markup after the token migration was declared complete — including `.ax-shell`, `.ax-pagehead` and `.ax-textarea`. Astryx was supposed to be gone. Some of those classes were still silently supplying layout from the bundle, which means the migration had not actually been verified — only assumed.

---

## Findings

Severity: `REJECT` unacceptable · `MAJOR` materially weakens · `MODERATE` visible inconsistency · `POLISH` refinement.

### FC-01 · REJECT · Segmented control is a hand-rolled imitation and wraps out of its track
- **Route/screen:** `/dashboard`, `/operations`, `/factories`, `/execution` ×2, `/analytics` — 7 of 8 tracks
- **Component:** `.seg` / `.seg-opt`
- **Evidence:** `document.querySelectorAll('.seg-opt').length === 0` on Dashboard while `.seg` existed; track 255px, options 115 + 132 + 2 gap = 249px inside 251px of usable width; `flex-wrap: wrap` set inline.
- **Why it weakens the product:** an imitation component drifts from the system on every future change, and the active state was conveyed by colour alone with no `aria-pressed`. The 2px margin means the control breaks under Arabic, a font fallback, or any label edit.
- **Saqeel rule:** `.seg` / `.seg-opt[aria-pressed="true"]` in `saqeel-components.css`; status must not be colour-only.
- **Correction:** all 11 option buttons converted to `.seg-opt` with `aria-pressed`; `segStyle()` deleted; tracks set to `flex-wrap: nowrap`.
- **Impact:** content none · structure none · theme both · RTL improved (no letter-spacing dependency) · responsive improved · a11y improved (pressed state exposed).

### FC-02 · MAJOR · Typography outside the canonical ladder
- **Route/screen:** all
- **Evidence:** KPI value computed 32px/40px weight 500 (canonical metric: 30px/1.15/700); 8 × `font-size:24px` where page title is 22px; 2 × 28px, 1 × 26px; duplicated `font-variant-numeric` in one declaration.
- **Why it weakens the product:** oversized values shout over the titles that give them meaning, and inline pixels make the artifact impossible to re-theme — engineering would have to hunt them individually.
- **Correction:** metrics to 30/34 weight 700 with tabular numerals; 24 → 22 with a matching line height; 26/28 → 24. Applied at the shared style level, not per screen.
- **Impact:** content none · structure none · Arabic line-heights follow the token sheet's RTL overrides.

### FC-03 · MAJOR · Forty-four uppercase transforms and 47 letter-spacing hacks
- **Route/screen:** every section overline; portfolio and admin headers
- **Evidence:** `text-transform:uppercase` × 44, `letter-spacing:.08em|.1em|.14em` × 47.
- **Why it weakens the product:** contradicts the Saqeel sentence-case rule; in RTL the token sheet zeroes letter-spacing with `!important`, so the English and Arabic renderings of the same overline were not the same design.
- **Correction:** all transforms removed; tracking normalised to `.01em`. The brand wordmark's `.24em` is deliberately preserved as the one exception.
- **Impact:** content none — the underlying strings were already sentence case.

### FC-04 · MAJOR · Metric card hierarchy inverted by a filled definition box
- **Route/screen:** `/dashboard` strategic and operational cards
- **Evidence:** definition rendered as a filled `--surface-secondary` block at 13/20 directly under the value, heavier than the interpretation line below it; business question set at 13/18 in secondary text, competing with the 16/24 title.
- **Correction:** definition becomes a hairline-led caption at 12/18; question drops to 11.5/16 muted so the title leads. Nothing removed — question, definition, worked example, interpretation and drill action all remain.
- **Impact:** content none · reading order now title → value → evidence.

### FC-05 · MAJOR · Left-accent tinted band (AI-slop trope)
- **Route/screen:** `/dashboard` operational — Operational AI priorities; one further band
- **Evidence:** `.alert` with `border-inline-start-color: var(--action-primary)` and `background: var(--accent-soft)`, full width, single line of copy (user-supplied crop).
- **Correction:** converted to `.panel` with proper internal spacing. Same strings, same order, same evidence chip and action.

### FC-06 · MODERATE · Astryx residue after the migration was declared complete
- **Evidence:** 25 `ax-*` references; `.ax-pagehead__topbar` was still supplying `display:flex` from the bundle — proof the migration had not been verified.
- **Correction:** renamed to `sq-*` artifact-local hooks, dead classes dropped, and the layout those Astryx classes were silently providing is now owned explicitly in inline styles against repo tokens. **Zero `ax-` references and zero occurrences of the string "astryx" remain in the artifact.**
- **Note (honest):** the bound design-system package is internally Astryx-prefixed; the artifact still loads it for **fonts and the `Icon` component only**. Zero Astryx classes and zero Astryx tokens are used. If the sponsor requires zero Astryx *dependency*, the remaining step is to inline the ~25 icon paths and self-host the two font files — a mechanical change, flagged rather than silently made.

### FC-07 · MODERATE · Arabic gaps across the newest surfaces
- **Evidence (first pass):** `Representative design fixtures`, its explanatory sentence, `Export · unavailable`, `Strategic view`, `Operational view`.
- **Evidence (second pass, after the verifier challenged the FC-07 claim):** 47 English nodes on `/analytics` (KPI decision-required states, bottleneck definitions, regional callouts), then a further ~110 across `/execution` and `/reviews` — every surface built after the original translation pass. My first FC-07 claim of "parity restored" was wrong: I fixed five strings and asserted the whole. That assertion should not have been written.
- **Correction:** dictionary extended 583 → 725 entries, plus nine new pattern rules for generated composites (`… · submitted N days ago · NAME`, `NN.N% preliminary/final`, `N violations`, `Week of …`, `VS-… · state`, `Submitted by NAME · <relative>`).
- **Verification:** route sweep over eight destinations in Arabic returns **zero** untranslated visible nodes outside the wordmark, Mapbox attribution and contract identifiers.

### FC-08 · POLISH · Two regressions caused by this pass, found and fixed within it
- Removing `.ax-pagehead` collapsed the topbar into four stacked rows (the Astryx class had been supplying the flex layout). Fixed by owning the layout explicitly.
- `aria-pressed` conversion initially left two `sc-for` tracks (lens selector, analytics layer switch) on the old style holes. Both converted; `segStyle()` removed so the pattern cannot come back.

### FC-09 · MAJOR · Status colour is washed out in light mode — and it is a design-system bug, not taste
- **Route/screen:** everywhere status is shown; most visible on `/reviews`
- **Evidence:** `.badge` declares a semantic `border-color` and then sets `border-width: 0`, so the boundary it defines is never drawn. Measured light theme on `/reviews`: chip fill vs panel **1.09 : 1** (`badge-compliant` #E2F0E7 on #FFFFFF), `badge-warning` 1.12 : 1, `badge-critical` 1.10 : 1. Text contrast was already fine (6.4–7.6 : 1) — the chip, not the text, was disappearing.
- **Why it weakens the product:** a status lozenge that cannot be perceived as an object is just tinted text, and it undermines the rule that status is carried by text + glyph rather than colour, because the carrier itself is invisible. The same absent boundary made selected rows read as a pale wash in light and a heavy green block in dark.
- **Correction:** raised as **CR-001** (`repo-css/ds-cr-001-status-legibility.css`), an additive sheet loaded after the canonical components — no canonical rule edited in place. It draws the 1px boundary the component already declares, deepens the fill by a fixed `color-mix`, and gives dark mode its own mix rather than inheriting light values. Selection was separately converted from a tint to a **bounded tonal surface**: `--surface-secondary` + 3px accent bar + a 26% primary inset hairline, which behaves identically in both themes because it reads from the boundary, not from a wash. 19 selection tints converted; `--accent-soft` is no longer used as a surface anywhere.
- **Measured after:** chips carry a visible 1px semantic boundary, text contrast preserved at 6.0–7.2 : 1, selected rows legible in both themes.
- **Status:** CR-001 is **PROPOSED** and needs design-system owner sign-off. It is the only change request this review raises.

### FC-10 · MODERATE · The pressed segmented option lost its colour — my fault, and here is the defence
- **Question asked in review:** why did the Operations map / National performance toggle come out of the FC-01 fix with no colour at all?
- **Honest answer:** because I swapped an imitation for the canonical component and accepted the canonical component's pressed state without asking whether it was good enough. `.seg-opt[aria-pressed="true"]` in `saqeel-components.css` is a white raised pill on a sunken track — deliberately colour-free, so state is carried by elevation rather than hue. That is defensible on its own terms (it satisfies the colour-alone rule), and the old green fill I removed was *not* the system's answer, it was mine. But the result is weaker than what it replaced: on a light canvas a white pill on a near-white track is a very quiet signal, and it is the primary view switch on four screens.
- **What I will not do:** re-hand-roll the control. That was FC-01.
- **Correction:** CR-001 adds an accent to the canonical pressed rule — `--accent-text` colour, weight 600, and a 34% primary inset hairline on top of the existing `--shadow-xs`. The class, the markup and `aria-pressed` are untouched; only the pressed treatment gains a colour signal, in both themes.
- **Table density** — 12/16 with wrapping cells and column shedding below 1280 is a deliberate no-horizontal-scroll contract, verified at 390/834/1024/1280/1600. Tightening rows further would re-introduce truncation.
- **Analytics header depth** — four bands (title, fixture notice, freshness row, filter panel) looks tall, but each band is required content from the mandate. Compressing it would hide the source-status indicator, which is the point of the page.
- **Calendar cell tints** — visit days use `--surface-secondary`, empty days `--surface-sunken`. Measured and correct; the apparent green in screenshots is the visit chip, not the cell.
- **Dark selected states** — measured against tokens: `--accent-soft` is `#203a32` in dark, a restrained tint, not a neon fill.

---

## Integrity reports

### Screen, route and content regression (before → after)

| Inventory | Pre-cut | Post-cut | Verdict |
|---|---|---|---|
| Navigation destinations | 6 groups / 15 destinations | identical | unchanged |
| Annotated routes | 17 | 17 | unchanged |
| Conditional screens (`sc-if`) | 123 | 123 | unchanged |
| Repeaters (`sc-for`) | 149 | 149 | unchanged |
| Tables | 8 | 8 | unchanged |
| Segmented tracks | 8 | 8 | unchanged |
| Buttons | 80 | 80 | unchanged |
| Inputs / selects | 10 / 8 | 10 / 8 | unchanged |
| Badges | 19 | 19 | unchanged |
| Panels | 59 | 61 | **+2** — the two accent bands became panels (FC-05) |
| Uppercase transforms | 44 | **0** | corrected |
| `ax-` references | 25 | **0** | corrected |
| Arabic dictionary entries | 583 | 587 | +4 (FC-07) |

**No screen, route, tab, table, column, filter, action, metric, map layer or business string was added or removed.** The only count that moved is `panel`, and it moved because two `alert` elements became `panel` elements carrying the same content.

### Side-rail and top-navigation integrity
Groups (Overview · Operations · Compliance · Insights · pinned Administration), order, labels, destinations, badges, the Inspection chevron group, the pinned collapsed Administration group, 248/68px geometry and the footer Expand row are **byte-identical** to the pre-cut snapshot apart from the `ax-shell` → `sq-shell` class rename.

### Component-usage report
Canonical repo components in use: `.btn` (+`-secondary`/`-ghost`/`-danger`/`-icon`/`-sm`), `.panel`, `.badge` (+ status variants), `.table`/`.table-wrap`, `.nav-item`/`.sidebar*`, `.seg`/`.seg-opt`, `.tabs`/`.tab`, `.filter-chip`, `.input`/`.select`/`.textarea`/`.input-affix`, `.field`, `.kpi`, `.drawer`, `.alert`, `.skeleton`, `.id-code`, `.avatar`. Hand-rolled components remaining: **none** — FC-01 was the last one.

### Token-usage report
Colour, spacing, radius, shadow and type all resolve to repo custom properties; all 25 referenced properties resolve against the loaded sheets. No hex is authored in the artifact; tints derive via `color-mix()`. Remaining inline pixel type values are intentional micro-adjustments within the ladder (11.5 / 12 / 13 / 13.5), and are the one thing I would still like to convert to `.t-*` utility classes in a follow-up.

### Design-system change requests
**One raised: CR-001 (status legibility)** — see FC-09. Additive sheet, no canonical rule modified in place, awaiting design-system owner sign-off.

### Parity reports
- **Light / dark:** both verified per screen after the cut; surfaces, borders and selected states measured, not eyeballed.
- **English / Arabic:** parity restored (FC-07). Residual English is limited to the wordmark, Mapbox attribution and contract identifiers, which are never translated by rule.
- **LTR / RTL:** logical properties only; chronological charts keep semantic order rather than mirroring.
- **Responsive:** zero overflowing elements at 390 / 834 / 1024 / 1280 / 1600 in both languages. FC-01 removes the last wrap-dependent control.
- **Accessibility:** `aria-pressed` now exposed on all 8 segmented tracks (was 1); status carried by text + glyph, never colour alone; 2px focus ring retained; reduced motion honoured.

---

## Remaining limitations, stated plainly

1. **The design-system package is still Astryx-derived internally.** Zero Astryx classes and tokens are used, but the bundle is loaded for fonts and icons. Full removal is mechanical and flagged, not done (FC-06).
2. **Inline type values remain** where a `.t-*` utility would be cleaner. Functionally token-true, stylistically not ideal for handoff.
3. **Values on screen are design fixtures**, labelled as such on Analytics and listed in `HANDOFF.md` §13.
4. **Twelve sponsor questions are still open** (`HANDOFF.md` §12); none block Phases 1–4 of implementation.
5. **This review was performed at 924px and at forced widths via probes**, not on physical devices. Device testing remains a build-phase task.
