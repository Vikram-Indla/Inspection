# Planning Home/Methods — Runtime Comparison Checklist

Frozen design baseline: `SAQEEL Planning.dc.html`, project `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`, **accepted revision (etag) `1784901048581707`**. Target runtime: `/planning?wa_preview=1` (`PlanningPreview.tsx`, `SAQEEL_M2_PREVIEW=enabled`), Home/Methods frame only. Design-side prep only — no code, no product-contract, no Codex files, no further design edit this pass.

## 1. Exact visible hierarchy (top to bottom)

1. Sidebar (unchanged shell — not part of this batch's scope, reference only).
2. Header row: search input (placeholder, non-functional) → language toggle button → theme toggle button → divider → avatar + "a.saleh" / role label.
3. Search-note caption directly under the header row (small, muted): clarifies search is a placeholder, real search lives on canonical `/planning`.
4. Title block: `H1` "Visit planning" + tagline "Planner-only · publish needs an effective package" (both localized).
5. Segmented tab control (Methods / Bulk / Single / Immediate / Plans), "Methods" pressed/active on Home.
6. Route-annotation caption directly under the tab row: explains each tab is a separate application route, not an in-page switch.
7. Success alert banner: "Effective package present — Fire Safety v3. 4 drafts in progress."
8. Canonical-`/planning` info panel (icon + heading + body) explaining the real list-first surface isn't depicted on this screen.
9. Drafts-preview table panel: header "Draft plans — continue where you left off" + `4 drafts` badge, 6 columns (Plan/Method/Status/Created/Planner/blank-continue), 2 mock rows.
10. Three method cards in a responsive grid: Bulk (▦), Single (▣), Immediate (⚡) — glyph, title, description each.
11. Disabled-card caption directly under the card grid.
12. "Non-happy-path states (reference)" label + 3 compact state chips in a row: Authorized role required / Planning data unavailable / No visits match.

## 2. Premium-quality details to check pixel-for-pixel

- Search input: pill-shaped (`border-radius: full`), icon inset, sunken background tone — not a plain square input.
- Language/theme toggle buttons: pill-shaped, `12.5px` bold label, consistent padding (`7px 13px`) — should look like a matched pair, not mismatched sizes.
- Success alert: green/compliant tone, checkmark-in-circle icon, `Fire Safety v3` rendered as `id-code` (monospace-ish token style), not plain text.
- Canonical-`/planning` info panel: distinct from the success alert — should read as neutral/informational tone, not success-green or warning-amber.
- Drafts table: badge `4 drafts` uses the "onhold" tone (amber/neutral, not critical-red); row plan references (`PLN-2206`, `PLN-2203`) rendered as `id-code` tokens; "Continue" is a link, not a button.
- Method cards: glyphs are oversized (`22px`) Unicode symbols, not icon-font/SVG — confirm they render legibly in both themes and don't clip.
- State-reference chips: small, bordered, `max-width: 220px`, title (`b`) + body text stacked — should look like reference/documentation chips, distinctly less prominent than the alert/info panels above them (they are NOT live application states, just a design-side glossary).
- Spacing rhythm: `16px` gap between major blocks (alert → info panel → drafts table → cards → disabled-note → states row) — should read as one consistent vertical stack, not uneven gaps.

## 3. Interaction / state expectations

- Tab buttons: `aria-pressed` reflects active tab; clicking Bulk/Single/Immediate/Plans switches the design's own internal preview (this is a design-tool interaction only — the real app uses actual route navigation, per the route-annotation caption in item 6 above; **do not expect matching interaction in the runtime**, only expect the runtime to actually navigate).
- Method cards: `onClick` in the design switches its internal preview; in the runtime, cards are real `<Link>`s. **Runtime-only expectation:** cards must be `aria-disabled` and unreachable (no navigation) when the signed-in user lacks `planning.create` — this state is described in the disabled-card caption but is not independently toggleable in the static design (no fixture for "logged in without create capability" exists in the mockup).
- Theme toggle: dark ⇄ light, affects the whole page including the new drafts table/info panel/state chips (they use CSS custom properties, should adapt automatically) — confirm no hardcoded colors were introduced in the new blocks.
- Language toggle: EN ⇄ AR must flip `dir` (ltr/rtl) and re-render *all* of: header search-note, title/tagline, all 5 tab labels, route-note, alert lead/drafts-count text, canonical-panel title/body, drafts-table column headers + status label, all 3 method card titles/descriptions, disabled-note, states-heading, and all 3 state-chip titles/bodies. **Every one of these strings has an AR counterpart in the corrected design** — if any stays English after toggling to AR in the runtime, that's a real wiring gap worth flagging, not a design gap (design has the AR string).

## 4. EN/AR directionality

- LTR (EN): search icon left-inset, tab order left-to-right (Methods→Plans), card grid fills left-to-right, table columns left-to-right with "Continue" link at the far right.
- RTL (AR): entire layout should mirror via logical properties — search icon should flip to right-inset, tab reading order should visually reverse, table's "Continue" (متابعة) column should appear at the visual left (start-side in RTL), numeric/id-code tokens (`PLN-2206`, `Fire Safety v3`) should stay LTR-embedded within RTL flow (no digit reversal or garbling).
- Brand lockup ("صقيل / صناعي") in the sidebar is unaffected by this page's toggle — already static Arabic regardless of `lang` state.

## 5. Design items that MUST be visible in the real runtime (non-negotiable per the accepted design)

1. The route-annotation caption (item 6 above) — if absent, the runtime is silently reintroducing the single-page-SPA misconception this correction was meant to kill.
2. The canonical-`/planning` info panel (item 8) — if absent, a user landing on the preview has no signal that a richer, different `/planning` exists.
3. The drafts-preview table (item 9) — must show **real** drafts (bound to the actual `drafts` prop already wired in `PlanningPreview.tsx`), not the design's 2 static mock rows.
4. The disabled-card caption (item 11) paired with **actually working** `aria-disabled` behavior on the cards when `canCreate` is false.
5. Full AR translation coverage per item 3 above — partial translation is a real, flaggable gap.
6. The 3 non-happy-path state chips (item 12) — these are a **design-side glossary only**; the runtime should NOT render literal chip UI for this (that would be wrong) — instead, the runtime should be checked against the *actual* EmptyState components (unauthorized/unavailable/empty) existing and matching this copy, which the earlier delta already confirmed as real and correct. Runtime comparison should verify the copy still matches, not that chips exist.

## Classification key for the next pass (runtime screenshot/delta from Codex)

When Codex returns the actual runtime screenshot/delta, every mismatch found against this checklist gets exactly one of:
- **CODE CORRECTION** — runtime doesn't implement something the accepted design now shows (e.g. missing AR string, canonical-panel absent, disabled-card state not wired).
- **DESIGN CORRECTION** — design still says something that's genuinely wrong or premature relative to real, confirmed runtime behavior (should be rare now, since this design pass was just corrected against the actual code).
- **WIRING** — the visual/structural piece exists but isn't bound to real data (e.g. drafts table renders but shows hardcoded mock rows instead of the real `drafts` prop).
- **RESEARCH** — can't classify without more evidence (e.g. ambiguous whether a visual difference is a real bug or a legitimate runtime-only affordance).
- **BLOCK** — mismatch traces back to a missing/broken contract (e.g. the `has_planning_capability` RPC not returning correctly for a test persona), not something design or a simple code tweak can resolve.

No design change will be applied until that classification pass runs on real evidence.
