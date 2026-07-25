# WA-DES-033-C3 — Operations Center correction spec (Revision 3)

Revises WA-DES-033-C2. Changes from Revision 2 (per second Codex review): WA-SP-031 requires exactly **five KPI cards**; Active Alerts is restored as the fifth card (not withdrawn to a non-KPI breakdown slot), with its value rendered `unavailable / decision required` pending an alert taxonomy/deduplication rule; Submitted Today is likewise corrected to `unavailable / decision required` pending a sponsor-approved metric-grain contract (Codex is not to pick a source itself). Carried from Revision 2: factory quick card risk display is rank/greyscale only, no colored band, per SPC-CMD-004/DSG-CMD-012; a national→region→factory drill (DSG-CMD-011) and a direct-route authorization frame (DSG-CMD-020) are included; the `/operations/exceptions` link-cleanup proposal remains withdrawn (see package file 00 §8).

Corrects WA-DES-033 (`SAQEEL Operations Center.dc.html`, sha `ea9dce0b775ba69eb1bea3ebe7a35c076de316c18f1b955b5b3d8a2e8c7988e1`) against CR-430..CR-448 / WA-M3-AC-001..006 / DSG-027 / DSG-CMD-009..013,020 / WA-SP-029..034 / WA-SHELL-AC-008..009. Route: `/operations`.

## 1. Primary structure

Replace the `command`/`exceptions` two-tab toggle with two **fixed primary views**, selected by the existing header `seg` control (`Command`/`Exceptions` labels → `Operations Map`/`National Performance`):

1. **Operations Map** (default) — the real, interactive `OpsMap.tsx` (Mapbox) already rendered mid-page in current code, promoted to the primary above-the-fold view, plus the five-KPI-card row (§2) and Operational Highlights.
2. **National Performance** — SLA watch, corrective actions, high-risk board, notifications, and the live monitoring table, reframed as a performance-review surface rather than an always-visible wall of panels.

`/operations/exceptions` remains a separate, secondary route (unchanged navigation), not folded into this toggle — this corrects the WA-DES-033 source, which had invented a third `exceptions` tab inline. GPS override queue and cancellation queue remain visible on **both** views (they are write-legs, not read-only reporting) — same placement as current code (`OverrideQueue`, `CancellationQueue` render before the view split).

## 2. Five KPI cards, WA-SP-031 (corrected — Active Alerts and Submitted Today stay cards)

Replace the 4-KPI `kpi-grid` (Executing now / Overrides pending / SLA at risk / Corrections overdue) with exactly **five KPI cards**, per WA-SP-031's preserved contract (`WEB_ADMIN_SHELL_PRESERVATION_MATRIX.csv:32`) under WA-SHELL-AC-009. All five keep the same `kpi-label`/`kpi-value`/`kpi-delta` card structure from WA-DES-033 — no card is replaced by a different widget type:

| Card | Value | Notes |
|---|---|---|
| Active Visits | `monitored.length` (real) | `page.tsx` line 383-386 (published ∪ on_the_way/arrived/executing, region/city-scoped) |
| On the Way | `counts.on_the_way` (real) | `page.tsx` line 376 |
| Executing | `counts.executing` (real) | `page.tsx` line 376 |
| Submitted Today | **`unavailable / decision required`** | `submitted_at` exists today on both `inspections` and `submission_versions` (migrations `0011_factory360_gis_ksa_seed.sql`, `20260723100000_al_ahsa_beverage_factory360_demo_seed.sql`, indexed `20260720154210_g11_navigation_performance_indexes.sql`) — the columns are not the gap. The gap is a sponsor-approved metric-grain contract: distinct visits vs. inspections vs. submission versions; first submission vs. latest resubmission; the Riyadh calendar-day boundary. Codex must not choose a source itself. `kpi-delta` line shows "grain/source pending sponsor decision" instead of a scope note. Once approved: no schema change needed, add the query to `page.tsx`'s existing `Promise.all` read set. |
| Active Alerts | **`unavailable / decision required`** | No accepted alert taxonomy or deduplication rule exists (a record can satisfy more than one alert source at once). `kpi-delta` line shows "taxonomy pending sponsor decision" instead of a scope note. |

Both `unavailable / decision required` cards render their value in the same `kpi-value` slot/typography as the other three (not a smaller or differently styled treatment) — WA-SP-031 requires five cards, not four cards plus a placeholder. Below the KPI row (not inside either card), a small supporting-context line may show:
- For Active Alerts: the four already-computed source counts as plain linked text — "SLA breaches {slaFlags.length} · Actions overdue {actions.filter(overdue).length} · Notifications failed {notifs.filter(failed).length} · Overrides pending {overrides.length}" — each linking to its own existing panel. This is context under the card, never the card's own value.
- For Submitted Today: a one-line note naming the three open choices (grain/source/boundary), never a fallback count.

## 3. Operational Highlights (new panel, Operations Map view)

A single evidence-linked feed replacing the separate always-on SLA/notifications/corrective-actions panels on this view (those panels move to National Performance, §1). Each row:

- Source-typed icon + label (SLA breach / override decision / corrective action overdue / notification failed).
- One-line description reusing existing formatted fields (factory name, inspector name, due/expiry timestamp via `formatDateTime`).
- "View evidence" link **only** when `evidence_url` is already populated server-side (`overrideQueueRows[].evidence_url`, `cancellationQueueRows[].evidence_url`); otherwise no link is shown — never a broken or placeholder link.
- Row click opens the inspector drawer or factory quick card (§4) for records that resolve to a visit/factory; falls back to full navigation (`/visits/:id`, `/factories/:id`, `/reviews/:id`) otherwise.
- Empty state: reuse `EmptyState` pattern already used elsewhere on this page ("No open items in scope" + short body), never hide the panel silently.

Feed composition is a client-side merge of already-fetched arrays (`slaFlags`, `actions` filtered overdue, `notifs` filtered failed, `overrideQueueRows`, `cancellationQueueRows`) sorted by recency/deadline — no new query.

## 4. Inspector drawer / factory quick card

Use the SAQEEL Design System's existing `Drawer` (`components/overlays/Drawer.jsx`) for the inspector drawer and `WidgetFrame` (`components/domain/WidgetFrame.jsx`) for the factory quick card — both already exist in the connected design system project (`49c57df3-…`), so no new component pattern is introduced (WA-SP-029..034 preservation).

- **Inspector drawer** opens from a monitoring-table row or map pin representing an assigned inspector. Content: name, current visit + operational state, today's assignment count (from `monitored` filtered by `assignments[].profiles.full_name`), last geo event (`scopedGeo` filtered to that inspector's visits), "Open full visit →" link. No location/telemetry beyond what `/operations/live` already discloses as projected.
- **Factory quick card** opens from a map pin or risk-board row. Content: name, region/city, **risk rank among the RLS-visible factory set** (e.g. "Rank 3 of 148 by risk score") shown as plain text or a greyscale/neutral indicator — never a colored badge implying a threshold band (SPC-CMD-004/DSG-CMD-012: color banding is decision-blocked pending threshold policy). If no accepted ranked-display contract exists either, show "Risk position — decision-blocked (SL-2 threshold policy absent)" and omit the field. Raw `risk_score` may still render as plain numeric text (it is real, RLS-scoped data) but never inside a colored lozenge. Also: active visit count at this factory, open corrective-action count, "Open Factory 360 →" link.
- Both are dismissible overlays (Esc + backdrop click + close button), keyboard-focus-trapped, and do not replace the existing full-page navigation — they are a faster preview, not a new destination.

## 5. Required states (Operations Map view + National Performance view)

Both views already have `loading.tsx`/`EmptyState`/error patterns in current code; the correction spec requires each to be explicit for the **new** elements (KPI strip, Highlights panel, drawer/card), not just the page shell:

| State | Operations Map view | National Performance view |
|---|---|---|
| Loading | KPI strip + highlights panel show skeleton rows (reuse `components/status/Skeleton.jsx` pattern) while map/data resolve | Table skeletons per existing `sq-tablewrap` pattern |
| Empty (RLS-scoped/no data) | "No active visits in scope" `EmptyState`. Only the three governed count KPIs (Active Visits, On the Way, Executing) render `0` (not hidden). Submitted Today and Active Alerts still render `unavailable / decision required` in this state — an empty scope does not change their governance status; they must never show `0` as a stand-in for the ungoverned value (§2). | Each panel keeps its existing `EmptyState` (already implemented per current code) |
| Error | Existing `loadErrors` banner (already implemented, line 591-595) extends to cover highlights-panel composition failure | Same banner, unchanged |
| Provider/tile failure (map only) | `OpsMap`'s existing Mapbox-load failure path (already handled: `ops.map.loading.*` strings) — the correction spec does not change this, only reuses it | n/a |
| No positions | "No mappable factories in scope" (`EmptyState`, already implemented lines 630-631) | n/a |
| Accessible list alternative to the map | New: a toggle or always-visible companion list (factory name, state, region) next to the map, reusing `monitorRows`, for screen-reader/no-map-rendering users | n/a (already tabular) |

## 6. Responsive / RTL / theme

- Reference viewport 1440×900 (unchanged from `DESIGN_ROUTE_MAP.csv`).
- KPI strip: 5 cards at 1440/1024 in one row; wraps to a 3+2 grid at 412/390; single column at 320.
- Highlights panel and drawer/card: full logical-property RTL mirroring (`inset-inline-start`/`padding-inline-*`), matching the existing SAQEEL pattern already used throughout WA-DES-033 (e.g. line 87, 90 of the source use `inset-inline-start` already — the correction spec extends the same convention, does not introduce a new one).
- Light/dark: both views inherit `data-theme` from the existing shell toggle (`toggleTheme`), no new theme logic.

## 7. National → region → factory drill (DSG-CMD-011, added)

National Performance is not a wall of independent tables. The regional performance map (§4's ranked/greyscale choropleth, reused from the Operations Map view or duplicated here per Codex's layout choice) drives a synchronized drilldown: selecting a region filters the SLA watch, corrective-actions, high-risk, and monitoring tables in place to that region, using the existing `region`/`city` `searchParams` mechanism already implemented (`page.tsx` lines 163-167, 382-385) — the map selection sets the same query param the region/city dropdown already sets, no new filter pipeline. Selecting a factory within a filtered region opens the factory quick card (§4) or navigates to Factory 360, matching the existing `/factories/:id` link pattern. A companion synchronized list (region name, factory count, aggregate open-item counts) sits beside the map per SPC-CMD-003's list-equivalent requirement, keyboard-navigable.

## 8. Direct-route authorization (DSG-CMD-020, added)

Typing `/operations` or `/operations/live` directly must resolve to the same authorization outcome as reaching it via nav: if the caller's role/RLS scope would hide the nav entry, the direct route renders an explicit unauthorized frame — not a silent redirect, not a generic 404, not a partial render — matching the pattern already cited at `dashboard/page.tsx:100`. RLS stays server-enforced and unchanged; this is a route-guard/frame requirement layered on top, not a new permission rule.

## 9. `/operations/exceptions` — withdrawn from this spec

Revision 1 proposed conditional link cleanup on `/operations/exceptions`. Withdrawn: there is no exact accepted design for that route, and the underlined-link pattern actually present in the verified WA-DES-033 source (lines 155-156, 162-163) belongs to WA-DES-033's *inline command-view exceptions tab* (§1, folded away by this correction), not the real `/operations/exceptions` page. No change is proposed to `/operations/exceptions`.
