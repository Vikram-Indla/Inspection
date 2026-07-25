# CLAUDE-M4-RESPONSIVE-RTL-EVIDENCE-001 — read-only audit

Files audited (full content read this session, project `5e8154ad-...`): `SAQEEL Factories.dc.html` (WA-DES-026), `SAQEEL Factory 360.dc.html` (WA-DES-027). Read-only — no Claude Design or product-code write.

## 1. CSS breakpoints — exact, per file

| File | Breakpoints found | Gap |
|---|---|---|
| WA-DES-026 | **None.** The entire `<style>` block is `html, body { height: 100%; margin: 0; }` — no `@media` rule anywhere in the file. | Zero responsive behavior authored in this file for any width. Layout is a fixed `grid-template-columns:248px 1fr` with no collapse rule at any breakpoint — at 412/390/320 the 248px sidebar would consume most of a 320-390px viewport with no fallback (drawer/hide), unlike M3's corrected `WA-DES-033-C3` which defines `[data-mode="drawer"|"mobile"] aside { position:absolute; ...; transform:translateX(-100%); }`. |
| WA-DES-027 | Exactly two: `@media (max-width: 1280px) { .f360-ws { grid-template-columns: minmax(0,1fr) 320px; } .f360-ws > aside:first-child { grid-column: 1 / -1; position: static; } }` and `@media (max-width: 900px) { .f360-ws { grid-template-columns: 1fr; } .f360-ws > aside { position: static; } }` | No breakpoint below 900px — the design manifest requires named evidence at 412/390/320 (`DESIGN_ROUTE_MAP.csv` row 28), and while the 900px rule's `1fr` column would technically still render at narrower widths (cascading), there is no distinct mobile-specific type-scale/spacing adjustment (contrast with M3-C3's `[data-w="390"]` rule block that shrinks padding/font-size specifically at that width) — narrow-width legibility is unverified, not just unevidenced. |

## 2. Logical properties — exact, per file

| File | Logical properties found | Physical properties that should likely be logical |
|---|---|---|
| WA-DES-026 | None found in the content read | Table/panel padding, header layout all use physical `padding:Npx Npx` shorthand — acceptable for symmetric padding, but the search-input/filter-bar row ordering is pure DOM order with no RTL consideration point (no `dir` attribute exists to test against — see §3) |
| WA-DES-027 | `padding-inline-start:36px` (sub-nav items), `margin-inline-start:auto` (chevron icon) — both in the shared shell sidebar markup, already logical | The `.f360-ws` grid itself (`grid-template-columns: 250px minmax(0,1fr) 320px`) is a fixed left-to-right column order (left rail, main, right rail) with no mirroring mechanism for RTL — grid-column order does not auto-mirror under `dir="rtl"` without an explicit `direction`-aware rule or logical grid properties, and since §3 confirms no `dir` attribute exists on the page at all, this is currently untestable rather than confirmed-broken |

## 3. RTL order — critical finding: no RTL mechanism exists in either file

**Neither file's root wrapper carries a `dir` attribute at all** — confirmed by re-reading both files' opening `<div data-theme="{{ theme }}" style="height:100vh; display:grid; grid-template-columns:248px 1fr; ...">` element: no `dir="{{ dir }}"`, no language toggle button, no `lang` state variable in either component's `renderVals()`. This is a materially larger gap than "missing evidence" — it means **there is no RTL scaffold to evidence in the first place**, unlike M3's `WA-DES-033-C3`/`034-C3` which both wire `dir: ar ? "rtl" : "ltr"` and a visible language-toggle button. Both M4 files have only two static Arabic text spans (the sidebar brand "صقيل / صناعي" wordmark, and WA-DES-027's one Arabic company-name field with an explicit local `dir="rtl"` on that single `<dd>` element) — everything else in both pages is LTR-only with no toggle to test the reverse.

## 4. Overflow — per file

| File | Overflow handling found | Gap |
|---|---|---|
| WA-DES-026 | `main { overflow-y:auto }` (page-level scroll); map panel is `height:620px; position:relative` with the map component absolutely filling it (`inset:0`) — no overflow concern there; the fixture table itself relies on the external `saqeel/styles.css`'s `.table-wrap` class for any horizontal-scroll behavior, **not verified from this file alone** (that stylesheet is not part of the audited `.dc.html` content) | Table horizontal-overflow behavior at narrow widths is unverified, not confirmed either way |
| WA-DES-027 | Same `main { overflow-y:auto }`; the two sticky side-rails (`position:sticky; top:132px`) rely on the workspace's overflow container being the `<main>` scroller, consistent with the CSS — no broken overflow found, but likewise the several `.table-wrap` tables (inspection reports, violations, industrial info, documents) depend on the same external stylesheet class | Same external-dependency caveat as WA-DES-026 |

## 5. Keyboard / focus semantics — exact, per file

| File | Findings |
|---|---|
| WA-DES-026 | No `:focus`/`:focus-visible` rule in the file's own `<style>` block (relies entirely on the external stylesheet, unverified from this file). The license-status filter (`<div class="seg" role="group" aria-label="Filter by license status">`) is the only `aria-*` beyond the standard `aria-label="Toggle theme"` button — its three `seg-opt` buttons have **hardcoded static** `aria-pressed="true"/"false"` values with no `onClick` handler, i.e. they are visual fixtures only, not yet interactive — expected for an early design mockup, but flagged so it is not mistaken for a working filter when reviewed. |
| WA-DES-027 | Zero `aria-*` attributes found beyond the standard theme-toggle button. The license-picker (`<button onClick="{{ l.pick }}" style="background:{{ l.bg }}; ...">`) — the **only** truly interactive, stateful control in either file — indicates the selected license **by background color alone** (`l.bg` toggling between `var(--accent-soft)` and `var(--surface-primary)`), with no `aria-pressed`/`aria-selected`/`aria-current` and no visible focus-ring rule authored in this file. This is a real accessibility gap: color-only state signaling with no ARIA state and no evidenced keyboard-focus treatment on the one control in the page that actually changes what's displayed. |

## 6. Named viewport / state evidence gaps — summary (cross-references `01_M4_INVENTORY_MATRIX.md` §2)

Confirmed absent in both files, same conclusion as the prior inventory pass, now with exact CSS-level grounding added: no `sc-if`-gated state toggle bar (loading/empty/error/degraded/unauthorized/stale/provider-unavailable), no frame-picker for 1024/412/390/320, no RTL toggle (§3 — none exists at all, not just untoggled), no demonstrated theme-toggle evidence despite the function existing.

## 7. Bounded design-write packet (audit only — not written, awaiting Codex lease)

**`CLAUDE-M4-RESPONSIVE-RTL-EVIDENCE-002`** (renumbered from the prior packet name to reflect this is now grounded in exact CSS-level evidence, not just a state-inventory gap):

- Files: `SAQEEL Factories.dc.html`, `SAQEEL Factory 360.dc.html` (project `5e8154ad-...`).
- Scope, in priority order:
  1. Add `dir`/`lang` state and a visible language toggle to both files' root wrapper (currently absent entirely — §3) — this is the prerequisite for any RTL evidence to exist at all.
  2. Add the `[data-mode="drawer"|"mobile"]` sidebar-collapse pattern to WA-DES-026 (currently has zero breakpoints — §1) and extend WA-DES-027's existing 1280/900px breakpoints down to a named 412/390/320 mobile treatment (matching M3-C3's `[data-w="…"]` density-adjustment pattern).
  3. Add `aria-pressed`/`aria-selected` (or equivalent) to WA-DES-027's license picker, plus a visible focus-ring rule, so the page's one interactive control is not color-signaled only (§5).
  4. Build the same frame-picker/state-toggle tooling bar used in `WA-DES-033-C3`/`034-C3` so all of the above becomes verifiable evidence, not asserted CSS.
- Out of scope: no provider-naming change (that's Packet A / the MODON prompt), no new business content, no route/RBAC change.
- Dependency: Codex-issued Claude Design write lease for project `5e8154ad-...` — no business decision blocks this packet.

## 8. Disposition

Audit complete, grounded in the exact file content read this session (not the external `saqeel/styles.css`, which is out of this audit's reach — flagged wherever a finding depends on it). No Claude Design or product-code write performed.
