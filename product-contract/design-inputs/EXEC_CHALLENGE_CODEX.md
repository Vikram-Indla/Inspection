# Executive Overview — adversarial design challenge (Codex, repo-grounded)

Card: `exec` (web) · lanes design 70 / code 60 / wiring 60
Challenger: Claude Orchestrator · Respondent: Codex (gpt-5.2-codex), read-only repo access
Date: 2026-07-26 · Thread 019f9c6c-39ce-7182-9cec-8cf306e55b9d

20 questions posed across purpose/altitude, evidence/provenance, geography,
and composition. Constraints enforced in the prompt: no invented values, no
governed KPI targets exist, deterministic-not-AI contract, choropleth is
policy-blocked, Arabic primary, exec has no dedicated route.

## Committed decisions

| # | Decision |
| --- | --- |
| 1 | Keep one `/dashboard` route; Leadership lands in a Strategic composition, Ops in an Operational one |
| 2 | First number = approved checklist-response compliance rate, always with numerator/denominator |
| 3 | Executive job = national assurance triage, not performance certification |
| 4 | Commit to **assurance**; drop accountability and allocation |
| 5 | Withhold workload, GPS, live audit chatter, predictive signals from Leadership |
| 6 | Methodology is a trust asset — one action behind a "Basis and source" drawer |
| 7 | Exact recorded sync timestamp; never label data fresh/stale/live |
| 8 | Consolidate absences into one "Measures awaiting governance" register |
| 9 | No coverage percentage until registered-factory population is governed |
| 10 | Any number reaches formula, scope, version and source records in <= 2 actions |
| 11 | Neutral official-coordinate points; tone only from a governed persisted band |
| 12 | Demote the map below the assurance summary and regional queue |
| 13 | Worst-first regional sort, unavailable rows last, denominators visible |
| 14 | One persistent scope model national -> region -> sector -> factory |
| 15 | Briefing architecture: scope/provenance, assurance, exceptions, regions, geography, comparison, lineage |
| 16 | Descriptive cross-sectional comparison only — never "benchmark" or "vs target" |
| 17 | Kill the predictive panel; replace with "Recorded assurance exceptions" |
| 18 | Compose Arabic-first, not a mirrored English layout |
| 19 | Responsive, but below 1024 it becomes a briefing view |
| 20 | Prevent executive theatre, persona compromise, political misreading |

## First viewport at 1440x900

Header/scope/sync line · dominant approved-compliance figure with denominator ·
two supporting factual measures (linked violations, approved latest decisions) ·
one compact governance-absence notice · start of the worst-first regional queue.
**The map does not occupy the first viewport.**

## Kill list

Free-text Executive AI Composer · forecasting prompt chips · the four
illustrative hero values in the export · the "Live" freshness badge · ADM1
choropleth and threshold legend · sector-versus-target benchmark panel ·
predictive proactive signals · best-to-worst league table · operational
workload/GPS content in Leadership view · repeated blocked KPI cards · raw
hex/rgb/colour-utility styling in the export.

## Blocked — needs a Product Owner decision

1. KPI target policy (value, unit, population, exclusions, scope, dates, version, owner, comparison semantics)
2. Geographic classification policy (aggregation formula, ADM1 boundary source/version, bands, missing-data treatment)
3. Factory coverage definition (authoritative registered population, eligibility, exclusions, time basis)
4. Staleness policy (timestamp used, threshold, timezone, resulting status, UI consequence)
5. Executive AI authority (permitted at all? new closed-enum surface, evidence requirements, prohibited forecasting)
6. Risk/compliance classification authority (may persisted factory bands be displayed, engine/version, validity)
7. Accountability semantics (accountable entity per region/sector, attribution, publication authorisation)
8. English parity contract (required EN/LTR viewports, content parity, numeral/date conventions, acceptance evidence)

## Verified against the repo by the orchestrator

- `STR-KPI-001..011`, `DEC-028` ("Governed boundaries" panel), `complianceBreakdown`
  (region/city/sector/authority) all exist as cited.
- **Sharper than reported:** `page.tsx:221` sets `refreshedAt` from `Date.now()`
  (page render time) and `DashboardView.tsx:223` labels it
  `Live · refreshed {time} Riyadh` / `مباشر · تم التحديث`. The surface asserts
  liveness and a refresh time that describe rendering, not data. Fabricated
  freshness claim on the executive surface.
