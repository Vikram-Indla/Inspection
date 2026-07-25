# WA-DES-034-C3 — Operations Live correction spec (Revision 3)

Revises WA-DES-034-C2. Changes from Revision 2 (per second Codex review): SPC-CMD-005 is corrected from "accepted acceptance row" to what it actually is — an authoritative acceptance rule already written into the accepted acceptance matrix, whose own row status is `not_started` (not implemented/passed); the wallboard mode's auto-refresh interval is removed/blocked until a refresh cadence is governed (last-observed timestamp may remain, per file 00 §0 item 15). Carried from Revision 2: no invented stale/amber threshold (last-observed timestamp + explicit freshness-policy-unconfigured state); tile/provider failure fails closed (map withdrawn, not schematically re-plotted); the route-trail behavior remains an unresolved conflict, not a designed-in behavior; a direct-route authorization frame is included.

Corrects WA-DES-034 (`SAQEEL Operations Live.dc.html`, sha `157b68c8ba4bbbdba4f61265b25ff98d097a810e5acb42f2aef67f4b4403452d`) against SPC-LIVE-001..007 and `AUTHENTICATED_LIVE_OPERATIONS_MAP.md`. Route: `/operations/live`.

## 1. Projected-route label (mandatory exact text)

Current source text (line 79-81 of the verified `.dc.html`): *"Inspector positions are projected from the visit window, not live GPS (pending telemetry integration)."*

Required: the label must read exactly **`Projected route — not live GPS`**, always visible, in every state below (not just the default view). Additional context (RLS scoping note, provider attribution) may remain as secondary caption text beneath the mandatory label, but must not replace or reword it.

**Unresolved conflict — route trail vs. no-route (flagged, not resolved by this spec):** `AUTHENTICATED_LIVE_OPERATIONS_MAP.md` (system prompt) asks for a designed "route trail." `SPC-CMD-005` — an authoritative acceptance rule already written into the accepted acceptance matrix, whose own row status is `not_started` (not implemented/passed, but binding once work reaches it) — requires "no route/navigation is drawn (Phase 1)." These conflict directly. The verified WA-DES-034 source already draws an animated route trail (`lv-route`/`lv-dash`, lines 16-17, 104-109) — that is the SPC-CMD-005-forbidden disposition. **Default safe disposition used throughout this corrected spec: markers and operational-state only, no route line, no path animation, no ETA**, until the sponsor rules on one of the two contracts. Codex must not implement the route-trail behavior from the current source without that ruling.

## 2. Required states (SPC-LIVE-001..007)

None of these exist in the verified WA-DES-034 source. Each is specified below; none has a captured runtime screenshot (design-only lease, no dev server/browser session — see package file 00 §6 G-4).

| State | Spec |
|---|---|
| Loading | Map container shows a skeleton/shimmer basemap silhouette; KPI counters show skeleton blocks; projected-route label still renders (it is a static disclosure, not data-dependent) |
| Freshness (corrected — no invented threshold) | Plain "Last observed: {timestamp}" line near the KPI counters, always shown. No "stale" boolean and no amber threshold are computed or displayed — no governed staleness cadence exists anywhere in `engine_settings` or the product contract today. Instead, a separate, always-visible `freshness-policy-unconfigured` state note: "Staleness cadence not yet configured — showing last-observed time only." This replaces Revision 1's invented stale/amber badge. |
| Empty (RLS scope) | No inspector pins/routes in the caller's authorized scope → basemap renders with zones only, centered message "No active visits in your scope right now", projected-route label still shown |
| Error | Full-panel error card (reuse `EmptyState`-equivalent pattern) — "Live map could not load" + retry, no partial/broken map render |
| Tile/provider failure (corrected — fails closed) | Basemap tiles fail to load (network/provider outage) → the entire map surface is withdrawn, not re-plotted schematically (Revision 1's "plot by lat/lng math on the flat gradient" implied a positional accuracy the system does not have and is withdrawn). Show: "Live map unavailable — basemap provider failed." The KPI counters and the accessible list alternative (§ below) remain fully populated from the same already-fetched, non-map-dependent data — this is a widget-local failure (FND-012/SPC-CMD-016), not a page-wide one. |
| No positions | Data loads successfully but zero inspectors currently on_the_way/arrived/executing → basemap + zones render, no pins, caption "No inspectors currently active" |
| Reduced motion | `prefers-reduced-motion: reduce` disables `lv-breathe`, `lv-ping` keyframes (source lines 18-21); zones at fixed opacity, pins static (no ping) — same data, no motion. `lv-dash`/route animation (lines 16-17) does not apply under the default no-route disposition above; if the sponsor later accepts the route-trail contract, reduced-motion must also render that trail as a static dashed line, never animated. |
| Accessible list alternative | A toggle or permanently visible side list: factory name, region, inspector state, since when — for users who cannot use the map (screen reader, no-JS-map-render) |
| Permission-denied (direct-route, DSG-CMD-020) | Typing `/operations/live` directly with an out-of-scope role/RLS resolves to an explicit unauthorized frame, not a silent redirect or generic 404 — same requirement as `/operations` (file 01 §8) |

## 3. Responsive / RTL / theme / wallboard

- Reference viewport 1200×800 (unchanged from `DESIGN_ROUTE_MAP.csv`); 1024/412/390/320 reflow per the same manifest row.
- RTL: legend and provenance panels (source lines 68-81) already use `inset-inline-start` — correction spec keeps this convention for all new state banners/badges.
- Theme: current source hardcodes dark (`state = { theme: "dark" }`, line 88) with a working light toggle already wired (`toggleTheme`) but untested against the map's hardcoded dark-only colors (`.lv-map` gradient, legend `rgba(12,18,26,.82)` backgrounds, line 68/79). Correction spec requires the light variant to use `--surface-*`/`--text-*` tokens instead of the hardcoded hex values in the legend/provenance panels, so light mode is not just a dark map with a light sidebar.
- **Wallboard mode** (corrected — no invented refresh cadence): new fixed layout for unattended display (ops-room TV, no interaction expected) — larger KPI counters (2-3x current 22px), no header search/avatar chrome, projected-route label rendered at higher contrast/larger size. The **last-observed timestamp** (§2) remains always visible. No auto-refresh interval is specified, implied, or displayed as a countdown/cadence — same ungoverned-cadence boundary as freshness (§2): until a refresh/staleness policy is governed, the page shows what it last loaded and when, not a promise of a refresh rate. If Codex's implementation technically re-fetches on some interval for operational reasons, that interval must not be surfaced to the viewer as a governed cadence. Triggered by a `?wallboard=1`-style flag or dedicated route segment (Codex's choice at implementation, named here as a requirement, not a route decision made by this design lease).

## 4. What this spec does not add

Per `AUTHENTICATED_LIVE_OPERATIONS_MAP.md`'s "future telemetry-ready mode": real location, accuracy, timestamp, freshness, consent, connection, and playback are explicitly **not** designed as active today. If Codex later integrates real telemetry, that is a separate correction package against a real provider contract — this spec only corrects the current MVP1 projection mode and its required negative/edge states.
