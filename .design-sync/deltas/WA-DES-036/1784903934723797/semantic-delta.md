# Semantic Delta — New "List" frame added to SAQEEL Planning (WA-DES-036)

Frozen prior baseline: revision `1784901048581707` (unchanged, preserved — this is an addition, not a replacement).
New revision: `1784903934723797`.

## What changed
One new tab/frame added: **"List"** (`state.screen = "list"`, now the default), titled internally "Canonical Planning — List-first Operational Surface." Positioned first in the segmented tab control, ahead of Methods/Bulk/Single/Immediate/Plans, which are **all unchanged** — same content, same etag-content as the prior accepted revision, verbatim.

## New frame contents (semantic, matched against real runtime evidence)
- **Toolbar**: search input, "Last 30 days" date-range chip, "All Regions" region selector, notification bell (badge count), AI-assist icon — modeled directly on the real runtime screenshot's top bar (`real-implementation-planning-home-2026-07-24.png`), not invented.
- **KPI/status tab strip**: All / Draft / Published / Returned / Cancelled / Expired, each with a live-style count — represents the canonical `/planning`'s real KPI tabs (confirmed present in code, `PLANNING_TABS`) which the prior frame only described in prose.
- **Compact package notice**: single-line success alert, replacing the prior frame's fuller paragraph — matches the real runtime's condensed "Effective package present — Fire & Life Safety — General Factories · v2026.09" style.
- **Draft/visit table**: 10 rows, honest density (matches the real runtime's 10-row observed volume exactly, including Riyadh-localized timestamp format and mixed methods), explicit density note warning against thinning it for visual polish.
- **Planning methods, demoted to secondary**: 3-across desktop grid (`repeat(3,1fr)`), explicit responsive breakpoints in CSS (`@media` at 1023px → 2-across, 767px → 1-across) plus a text caption stating the exact breakpoints, since a static mockup can't literally render 3 viewport states — WA-DES-036's established convention (captions for facts a single canvas can't show) reused here, not invented fresh.
- **Distinguish block**: 3 cards explicitly separating `/planning` (this frame, list-first, default), `/planning/bulk|single|immediate` (focused routes, separate tabs), `/planning/visits` (wired Visit Management, external link) — directly answers the task's "clearly distinguish" requirement.
- **States reference row**: Empty / Loading / Error(unavailable) / Unauthorized chips — reusing the Methods frame's established chip pattern, now covering all 4 requested variants (the prior frame only had 3; Loading added here).
- **EN/AR**: full translation for every new string (toolbar labels, KPI tab labels, table headers, distinguish-block copy, breakpoint/density notes, all 4 state chips) — same `t.xxx`/`dir`/`lang` mechanism already established, extended, not re-architected.
- **Light/dark**: reuses the existing theme toggle infrastructure unchanged — new blocks use only CSS custom properties (`var(--surface-...)`, `var(--text-...)`, `var(--action-primary)`, `var(--status-...)`), no hardcoded colors introduced.

## What did NOT change
- The Methods/Bulk/Single/Immediate/Plans frames — byte-identical content to revision `1784901048581707`.
- No application code, no product-contract file, no Codex file, no other Claude Design page.
- The 7 corrections applied in the previous cycle (route-annotation, disabled-card note, etc.) — all still present, untouched, on the Methods frame.

## What is explicitly NOT claimed
- This new frame is a **design artifact**, not a 1:1 pixel reproduction of the real runtime screenshot — toolbar icon style, exact spacing, and exact typography were approximated from the screenshot, not measured pixel-for-pixel (no design-tool pixel-ruler evidence was available this pass).
- "3-across desktop, explicit breakpoints" is expressed as real CSS media queries plus a caption — not as three separately rendered canvases at three viewport widths (a static single-canvas mockup can't natively show that; the caption states the exact numbers instead).
- Loading/Error/Unauthorized/Empty states are documented as reference chips with real copy, not literally rendered as full alternate screens (consistent with how the rest of this design system documents non-happy-path states elsewhere in this file and others, e.g. `SAQEEL Report Inventory.dc.html`'s status-pill convention).
