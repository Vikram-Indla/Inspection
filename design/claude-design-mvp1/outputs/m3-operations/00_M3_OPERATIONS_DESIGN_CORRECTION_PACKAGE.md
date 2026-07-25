# M3 Operations Center — Design Correction Package (Revision 3)

Status: `BLOCK DUE TO MISSING CONNECTED DESIGN CONTRACT` (design correctness of WA-DES-033/034 pages)
Handoff-record status: `READY_FOR_CODEX_REVIEW` (this revised delta record only — see §11)
Owner: Claude Design (design-only lease, no application-code or frozen product-contract edits)
Scope: CR-430..CR-448 · WA-M3-AC-001..006 · DSG-027 · DSG-CMD-009..013,020 · SPC-LIVE-001..007 · SPC-CMD-004,005 (rows `not_started`, not accepted — see §0.15) · WA-SP-029..034 (WA-SP-031 five-KPI contract, see §3) · WA-SHELL-AC-008..009
Routes: `/operations`, `/operations/exceptions` (preserved, unedited), `/operations/live`
Design source-of-record: WA-DES-033 (`SAQEEL Operations Center.dc.html`), WA-DES-034 (`SAQEEL Operations Live.dc.html`)
Revises: Revision 2, returned by Codex review with 3 precise corrections (5-KPI-card contract, Submitted Today grain/source governance, SPC-CMD-005 status wording + wallboard cadence). All 3 addressed below (items 13-15), CSV/link/status re-validated (§0 close, files 01-03).

## 0. What changed since Revision 1

Codex review found Revision 1 invented or under-specified several things it should have flagged as blocked or ungoverned instead. Corrected in Revision 2 (items 1-12), then further corrected in Revision 3 (items 13-15) after a second Codex review:

1. **G-1 was wrong.** `public.inspections.submitted_at` and `public.submission_versions.submitted_at` already exist (confirmed this session: `grep submitted_at supabase/migrations/*` — populated by seed migrations `0011_factory360_gis_ksa_seed.sql:120/126`, `20260723100000_al_ahsa_beverage_factory360_demo_seed.sql:98/106`, indexed by `20260720154210_g11_navigation_performance_indexes.sql:9`). Submitted Today has real source columns to query — but see item 14, which further corrects how this KPI must render until its exact metric contract is governed.
2. **Active Alerts — see item 13, which supersedes this.** (Revision 2 had withdrawn Active Alerts as a KPI and replaced it with a non-KPI breakdown slot. Revision 3 reverses that: WA-SP-031 requires five KPI **cards**, and Active Alerts must remain the fifth card.)
3. **Factory quick card risk display corrected.** `risk_score`/`risk_band` may not render as a KPI-style number or color-coded badge on the quick card without an approved governed source; per SPC-CMD-004/DSG-CMD-012 the only default is ranked/greyscale, with color banding explicitly `decision-blocked` pending threshold policy. See §4.
4. **No invented freshness thresholds.** "Stale" and an amber staleness window in Revision 1 were invented. Replaced with last-observed timestamp only, plus an explicit `freshness-policy-unconfigured` state. See §5.
5. **Provider/tile failure now fails closed.** Revision 1's "schematic positions by lat/lng math" implied accuracy the system does not have. Corrected: on tile/provider failure the map surface is withdrawn entirely; the accessible list and KPIs remain the only source of truth. See §5.
6. **Projected-route vs. no-route conflict named — see item 15, which further corrects the wording used for SPC-CMD-005.** Default safe disposition is still **markers/status only, no route line, no ETA**, until the sponsor rules. See §6.
7. **DSG-CMD-011 drill added.** National → region → factory drill with a synchronized list was missing from Revision 1's "National Performance = tables" framing. Added. See §7.
8. **DSG-CMD-020 addressed.** Direct-route authorization (typing `/operations` or `/operations/live` directly) must match the broadened-nav authorization state, with RLS unchanged and an explicit unauthorized frame. Added. See §8.
9. **Mutating-GET defect recorded.** `apps/web/src/app/(app)/operations/page.tsx` lines 172-173 call `sb.rpc("expire_stale_geo_override_requests")` unconditionally on every page load — a write during what should be a pure read/capture. Confirmed this session by reading the file. Recorded as a defect for Codex; this design package does not and cannot fix the code. See §9.
10. **`/operations/exceptions` edit proposal withdrawn.** There is no accepted design for this route in the WA-DES-033/034 source. `/operations/exceptions` is preserved untouched by this package.
11. **Error/RLS-empty/permission-denied kept distinct, per widget.** Corrected throughout §5/§7/§9 tables: each surface's own failure stays local to that surface (fault isolation, FND-012/SPC-CMD-016), never a page-wide substitute for another surface's state.
12. **Design-lease ceiling stated plainly.** Markdown correction specs are not corrected `.dc.html` pages. They cannot become a true visual-diff target (WA-M3-AC-003) or satisfy any DSG-CMD/SPC-CMD acceptance row, which require an actual rendered frame. This package is therefore `BLOCK DUE TO MISSING CONNECTED DESIGN CONTRACT` for the design-correctness work itself. See §11 for the exact missing dependency.
13. **Active Alerts restored as the fifth KPI card (Revision 3).** WA-SP-031 (`WEB_ADMIN_SHELL_PRESERVATION_MATRIX.csv:32`) explicitly names "Five KPI cards" — Active Visits; On the Way; Executing; Submitted Today; Active Alerts — as a preserved contract for `/operations` under WA-SHELL-AC-009. Revision 2's non-KPI breakdown slot violated this by not being a fifth card at all. Corrected: Active Alerts **is** the fifth card, same visual treatment as the other four, but its **value** renders as `unavailable / decision required` (not a number, not zero, not hidden) because the alert taxonomy and deduplication rule remain ungoverned (§3 explains why a number would misstate the data). The four-source breakdown from Revision 2 (SLA breaches / actions overdue / notifications failed / overrides pending) survives only as supporting context displayed below the card, never as the card's own value.
14. **Submitted Today also corrected to unavailable / decision required (Revision 3).** Revision 2 already established that `submitted_at` exists on both `inspections` and `submission_versions`, but incorrectly told Codex to "pick one canonical source" itself. That is a metric-contract decision (distinct visits vs. inspections vs. submission versions; first submission vs. latest resubmission; Riyadh calendar-day boundary), not an implementation detail Codex should resolve unilaterally. Corrected: the Submitted Today card also renders `unavailable / decision required` until that exact metric contract is sponsor-approved. Once approved, no schema change is needed — the query is real and ready to write (§3).
15. **SPC-CMD-005 wording corrected — it is not an accepted row (Revision 3).** Revision 2 called SPC-CMD-005 "an accepted acceptance row" in three places (§5, §6, §11 language). Its actual status in `CD042_SPECIAL_COMPONENT_ROWS.csv`/`SPECIAL_COMPONENT_ACCEPTANCE.csv` is `not_started` — it is an **authoritative acceptance rule already written into the accepted acceptance matrix**, but its own row has not been implemented/passed. Every phrase implying otherwise is corrected below (§5, §6, §10, §11). Also per this same review: the wallboard mode's auto-refresh interval is corrected — no refresh cadence may be specified or implied until a cadence is governed (same ungoverned-cadence problem as freshness in item 4); the last-observed timestamp itself may still be shown. See §5/file 02 §3.

## 1. Baseline and connection proof (unchanged from Revision 1, re-verified)

- Worktree HEAD merge-base against canonical `origin/main` (`9d8c414258a5e04244fdf9ce350e5f25f952dfc1`) verified at session start; `git diff main --name-only` showed only two audit-log files.
- No live Claude Design project hosting the Operations Center/Live pages was found via `list_projects`/`list_files` (20 projects enumerated; the design-system project `49c57df3-…` holds tokens/components/patterns only). This absence is the root cause of the BLOCK in §11.
- WA-DES-033/034 `.dc.html` bytes extracted from the registered external zip (`/Users/vikramindla/Attachment dump/MIM_Inspection_Web_Admin_Codex_Plan_Starter.zip → 03_SAQEEL_WEB_ADMIN_DESIGN_AUTHORITY.zip`) and SHA-256-verified exact match to `DESIGN_ROUTE_MAP.csv`/`DESIGN_SOURCE_MANIFEST.csv`:
  - WA-DES-033 → `ea9dce0b775ba69eb1bea3ebe7a35c076de316c18f1b955b5b3d8a2e8c7988e1`
  - WA-DES-034 → `157b68c8ba4bbbdba4f61265b25ff98d097a810e5acb42f2aef67f4b4403452d`
- No binary recommitted to git.

## 2. Stable revision IDs

| ID | File | SHA-256 (verified) | Status after Revision 3 |
|---|---|---|---|
| WA-DES-033 | SAQEEL Operations Center.dc.html | `ea9dce0b775…8988e1` | UNCHANGED source bytes; correction spec is WA-DES-033-C3 (`01_OPERATIONS_CENTER_CORRECTION_SPEC.md`, revised) |
| WA-DES-034 | SAQEEL Operations Live.dc.html | `157b68c8ba4…403452d` | UNCHANGED source bytes; correction spec is WA-DES-034-C3 (`02_OPERATIONS_LIVE_CORRECTION_SPEC.md`, revised) |

These are still markdown correction specs, not rendered `.dc.html` pages — see §11.

## 3. Five KPI cards (WA-SP-031) — Submitted Today and Active Alerts corrected

WA-SP-031 (`WEB_ADMIN_SHELL_PRESERVATION_MATRIX.csv:32`) preserves exactly **five KPI cards** on `/operations`: Active Visits, On the Way, Executing, Submitted Today, Active Alerts — all five real, same visual treatment. Two of the five cannot show a real number today without a sponsor-approved metric contract; per WA-SP-031 they remain full KPI cards regardless, with the card **value** rendered as `unavailable / decision required` rather than removed, replaced by a different widget type, or invented.

| Card | Value | Why |
|---|---|---|
| Active Visits | `monitored.length` (real) | `page.tsx` line 383-386 |
| On the Way | `counts.on_the_way` (real) | `page.tsx` line 376 |
| Executing | `counts.executing` (real) | `page.tsx` line 376 |
| Submitted Today | **`unavailable / decision required`** | `submitted_at` exists on both `inspections` and `submission_versions` (confirmed via migrations `0011_factory360_gis_ksa_seed.sql`, `20260723100000_al_ahsa_beverage_factory360_demo_seed.sql`, indexed by `20260720154210_g11_navigation_performance_indexes.sql`) — the *columns* are not the gap. The gap is an ungoverned **metric grain/source contract**: distinct visits vs. inspections vs. submission versions; first submission vs. latest resubmission; the exact Riyadh calendar-day boundary. This is a sponsor decision, not an implementation choice — Codex must not pick a source unilaterally. Once that exact contract is sponsor-approved, **no schema change is needed**: the query is real, RLS-scoped, and ready to write the same day the contract lands. |
| Active Alerts | **`unavailable / decision required`** | No accepted alert taxonomy exists (what counts as an "alert," severity ordering) and no deduplication rule exists for records that satisfy more than one alert source at once (e.g. a visit that is both SLA-overdue and has a pending override). Summing SLA breaches + overdue actions + failed notifications + pending overrides, as a prior revision did, would present an ungoverned number as if it were a governed KPI. |

Each of the two `unavailable / decision required` cards keeps the card's real supporting context immediately below it — not as the card's value, but as context that helps a reviewer understand *why* it is unavailable and what it will become once governed:
- Submitted Today: a short note naming the exact three open choices above (grain/source/boundary), not a fallback count.
- Active Alerts: the four already-computed source counts as plain supporting context — "SLA breaches {slaFlags.length} · Actions overdue {actions.filter(overdue).length} · Notifications failed {notifs.filter(failed).length} · Overrides pending {overrides.length}" — shown below the card, each linking to its own existing panel, explicitly never substituted into the card's value slot.

All five remain KPI cards in the same `kpi-grid` row (WA-SP-031's structural requirement); only the value rendering differs for two of them.

## 4. Factory quick card — risk display corrected

Per SPC-CMD-004 / DSG-CMD-012 (regional map color banding is `decision-blocked` pending threshold policy — the same governance boundary applies to any other rendering of `risk_score`/`risk_band`), the factory quick card (file 01 §4) may show:
- Risk **rank** among the RLS-visible factory set (e.g. "Rank 3 of 148 by risk score"), displayed as plain rank text or a greyscale/neutral-tone indicator — never a colored badge implying a threshold (no red/amber/green banding).
- If no accepted ranked-display contract exists yet either, the card shows: "Risk position — decision-blocked (SL-2 threshold policy absent)" and nothing else for that field.
- `risk_score` as a raw number may still render as plain text (it is real, RLS-scoped data), but never inside a colored lozenge/badge component that implies a governed band.

## 5. Operations Live — freshness, tile failure, and route/no-route corrected

**Freshness (corrected — no invented threshold):**
Replace any "stale" badge with amber-threshold logic with: a plain "Last observed: {timestamp}" line, always shown, plus an explicit state — `freshness-policy-unconfigured` — shown whenever no governed staleness cadence exists (which is the current reality; no such policy is registered anywhere in `engine_settings` or the product contract). Do not compute or display "stale" as a derived boolean until a cadence is governed.

**Tile/provider failure (corrected — fails closed):**
On tile/provider failure, withdraw the map surface entirely (no schematic lat/lng plotting as a substitute — that implied positional accuracy the system does not have). Show: "Live map unavailable — basemap provider failed" plus the accessible list alternative (factory name, region, inspector state, since-when) and the KPI/source-breakdown area, both of which remain fully populated from the same already-fetched data (they do not depend on the map tile provider). This is a widget-local failure (FND-012/SPC-CMD-016): KPIs and the list never go dark because the map did.

**Projected trail vs. no-route (corrected — conflict named, not resolved by design):**
`AUTHENTICATED_LIVE_OPERATIONS_MAP.md` (system prompt) asks for a route trail; `SPC-CMD-005` — an authoritative acceptance rule already written into the accepted acceptance matrix (`CD042_SPECIAL_COMPONENT_ROWS.csv`/`SPECIAL_COMPONENT_ACCEPTANCE.csv`), though its own row status is `not_started`, not implemented/passed — requires no route/navigation drawn in Phase 1. The rule and the system prompt are in direct conflict regardless of the row's `not_started` status; the rule is binding once work reaches it. **Default safe disposition, used in this correction spec: markers and operational-state only — no route line, no path animation, no ETA.** The `lv-route`/`lv-dash` animated path elements in the verified WA-DES-034 source (lines 16-17, 104-109) are therefore also flagged: they render a route trail today, which is the disposition SPC-CMD-005 requires against. This conflict is an **open decision for the sponsor**, not something this design lease resolves unilaterally; Codex/PO must pick one contract (amend the SPC-CMD-005 rule to allow projected trails, or amend the system prompt to drop the trail requirement) before either the current source or the correction spec can be treated as compliant with SPC-CMD-005.

## 6. National Performance — drill and route-guard added

**DSG-CMD-011 drill (added, was missing from Revision 1):**
National Performance is not tables alone. It must offer a national → region → factory drilldown synchronized with a list: selecting a region on the (ranked/greyscale, per §4) regional map filters the SLA watch, corrective-actions, high-risk, and monitoring tables to that region in place (reusing the existing `region`/`city` `searchParams`-driven filter already implemented in `page.tsx` lines 163-167, 382-385 — no new filter mechanism needed, just wired to the map selection instead of only the dropdown).

**DSG-CMD-020 direct-route authorization (added):**
Typing `/operations` or `/operations/live` directly (not via nav) must resolve to the same authorization state as the nav-visible entry point: if the caller's role/RLS scope would hide the nav item, the direct route must show an explicit unauthorized frame (not a silent redirect, not a generic 404, not a partially-rendered page) — matching `dashboard/page.tsx:100`'s existing pattern per the acceptance row's own citation. RLS remains server-enforced and unchanged; this is a route-guard/frame requirement only.

## 7. Mutating-GET defect (recorded, not fixed by this lease)

`apps/web/src/app/(app)/operations/page.tsx:172-173`:
```
const { error: overrideExpiryError } = await sb.rpc("expire_stale_geo_override_requests");
```
This runs on every server-rendered request to `/operations`, including a guarded preview or screenshot-capture pass used purely to produce visual evidence. That means visual evidence capture for WA-M3-AC-003/WA-M3-EV-* as currently coded is not side-effect-free — it mutates `geo_override_requests` rows (expiring them) as a byproduct of looking at the page. Requirement for Codex: any preview/screenshot lease used to capture evidence must cause zero writes — either build a read-only preview variant with this RPC call stubbed/flagged off, or obtain a separately authorized action lease that explicitly accepts the write as in-scope. This design package records the defect; it does not touch `page.tsx`.

## 8. `/operations/exceptions` — preserved, not touched

Withdrawn from this package entirely (Revision 1 §7 proposed conditional link cleanup on this route "if the same pattern is found" — there is no exact accepted design for `/operations/exceptions`, and the underlined-link pattern actually observed in the verified WA-DES-033 source is on an *inline command-view tab*, not this route). No change is proposed to `/operations/exceptions` by this package.

## 9. Required-state disposition (corrected: distinct, widget-local)

Every state keeps its own identity — error, RLS-empty, and permission-denied are never merged into one generic "empty," and a failure on one widget (map, a table, the highlights/breakdown list) never substitutes for or hides another widget's own state (FND-012/SPC-CMD-016). All rows below remain `SPEC_ONLY_NOT_CAPTURED` (file `03_REQUIRED_STATE_MATRIX.csv`, unchanged disposition) — no runtime screenshot exists from this design-only lease.

| Surface | Distinct states required |
|---|---|
| Operations Map view (KPIs + map + source breakdown) | loading · empty (RLS-scoped, zero visible rows) · error (query failed) · permission-denied (route-guard, §6) · no-positions · tile/provider failure (map only, §5 — KPIs/list stay live) · accessible-list-alternative |
| National Performance view (drill + tables) | loading · empty · error · permission-denied · per-panel partial-source isolation (existing `loadErrors` pattern, unchanged) |
| Operations Live map | loading · RLS-empty · error · permission-denied (§6) · tile/provider failure (fails closed, §5) · no-positions · freshness-policy-unconfigured (§5, replaces invented "stale") · reduced-motion · accessible-list-alternative · wallboard |

## 10. Acceptance-row disposition (unchanged discipline, no self-approval)

All six `WA-M3-AC-001..006` rows remain `PLANNED_NOT_IMPLEMENTED`. Additionally, this revision makes explicit that **DSG-CMD-009/011/012/013/020 and SPC-CMD-004/005/007/016 also remain `not_started`** per their own acceptance CSVs (`CD042_ACCEPTANCE_ROWS.csv`, `SPECIAL_COMPONENT_ACCEPTANCE.csv`) — nothing in this package advances any of those rows past `not_started`, because a markdown spec is not the rendered frame those rows require (§0 item 12). No frontend, wiring, QA, or design-acceptance claim is made.

## 11. BLOCK DUE TO MISSING CONNECTED DESIGN CONTRACT

The design-correctness work for WA-DES-033/034 cannot be completed by this lease, because there is no writable, connected Claude Design project hosting the actual Operations Center/Live pages. A markdown correction spec (files 01/02) can describe the required change precisely, but per §0 item 12 it is not a rendered frame and cannot serve as a WA-M3-AC-003 visual-diff target or satisfy any DSG-CMD/SPC-CMD acceptance row, all of which require an actual frame to inspect.

**Exact missing dependency:** a Claude Design project, shared with edit access to this session's account, containing (or willing to receive a copy of) `SAQEEL Operations Center.dc.html` (sha `ea9dce0b775ba69eb1bea3ebe7a35c076de316c18f1b955b5b3d8a2e8c7988e1`) and `SAQEEL Operations Live.dc.html` (sha `157b68c8ba4bbbdba4f61265b25ff98d097a810e5acb42f2aef67f4b4403452d`), plus the SAQEEL Design System's `Drawer`/`WidgetFrame` components already present in project `49c57df3-d852-46aa-bdec-a34e5ef70941`. Once that project exists (or an existing one is identified and shared), the corrections in this package (§3-§9, plus files 01/02) can be applied directly to the real pages, producing an actual rendered frame set that can then serve as the WA-M3-AC-003 target and be scored against DSG-CMD-009/011/012/013/020 and SPC-CMD-004/005/007/016. Until that dependency is supplied, the design-correctness work item is blocked; this package's markdown corrections are the complete, ready-to-apply specification for whoever has that write access next (Codex, a future Claude Design session with the grant, or the product owner directly).

Also open, separate from the missing project: the SPC-CMD-005 vs. `AUTHENTICATED_LIVE_OPERATIONS_MAP.md` route/no-route conflict (§5) needs a sponsor decision before either the current source or the correction spec can be called compliant with SPC-CMD-005 for that one behavior, independent of where the pages get rendered. (SPC-CMD-005's own acceptance row remains `not_started` regardless — resolving the conflict does not by itself pass the row; passing it still requires the rendered-frame evidence named in §11.)

## 12. Handoff to Codex (revised)

**This revised delta record (files 00-03 in `design/claude-design-mvp1/outputs/m3-operations/`) is `READY_FOR_CODEX_REVIEW`.** It is ready as a *record of what is corrected, what is blocked, and what is open* — not as a claim that the Operations Center/Live design is now visually complete or acceptance-passing. Codex's next actions, in order:
1. Decide/obtain the missing Claude Design project access named in §11, or accept that the corrected `.dc.html` pages will be produced directly by Codex/engineering instead of via Claude Design, and record that decision.
2. Escalate two sponsor decisions before either KPI card can show a real number: (a) the exact Submitted Today metric-grain contract (§3) — which record type, first-submission-vs-latest, Riyadh day boundary; (b) the Active Alerts taxonomy and deduplication rule (§3). Neither is Codex's to decide unilaterally.
3. Escalate the SPC-CMD-005 vs. system-prompt route/no-route conflict (§5/§6) to the product owner for a one-line ruling before implementing the live map's trail behavior either way — noting SPC-CMD-005 is a binding accepted-matrix rule whose own row is `not_started`, not an optional or already-passed constraint.
4. Fix the mutating-GET defect (§7) as its own, separately authorized action-lease task before any visual-evidence capture pass runs against `/operations`.
5. Only after 1-4, proceed with the bounded implementation slice (unchanged in scope since Revision 1: `page.tsx`, `live/page.tsx`+`LiveOps.tsx`+`LiveMapInner.tsx`, new focused Playwright coverage) — built against the five-KPI-card specification in files 01/02 (Submitted Today and Active Alerts render `unavailable / decision required` until 2(a)/2(b) land, then need no schema change to go live), the corrected quick-card/freshness/drill/route-guard behavior, and with no auto-refresh cadence invented anywhere.
