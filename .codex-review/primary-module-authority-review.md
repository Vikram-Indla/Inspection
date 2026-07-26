# Primary Web Module Authority Review

Date: 2026-07-24  
Review type: supplied-reference and runtime comparison; no product-code changes

## Authority order

1. `CR-001` through `CR-478` and canonical product contracts control behavior,
   security, workflow, data and acceptance.
2. `WA-SHELL-SRC-001` controls the shared Web/Admin shell and the represented
   primary information architecture.
3. The supplied Dashboard, Operations Center, Factory 360, Planning,
   Compliance and Execution references control deeper module information
   architecture where they do not conflict with the product contract.
4. Proven current services and functionality are no-regression evidence.
5. The current frontend is not allowed to redefine the binding authority.

## Shared shell

Status: **DESIGN VALIDATED / RUNTIME REGISTERED_NOT_IMPLEMENTED**

The fixed left rail is:

- Overview: Dashboard, Operations Center, Factory 360.
- Operations: Planning; Inspection containing Execution and Review & Approval.
- Compliance: Compliance Library, Approval Queue, Enforcement Library.
- Insights: Analytics.
- Administration: Users & Roles, Lookup Management, Risk Configuration, Survey
  Configuration, Notification Configuration, Integration Management.

Web/Admin Execution belongs at `/planning/visits?view=execution`. `/field/**`
belongs to the Field/PWA channel and is excluded.

The expanded rail must use the approved bilingual wordmark asset. Generated
Arabic-only text is not an acceptable substitute in either locale.

Direct visual verification of `WA-SHELL-r3` confirmed the corrected bilingual
asset, exact rail and stable 1024 EN/AR layouts. It also found three unresolved
design defects:

- mobile/tablet users cannot reach search, date/region scope, AI, theme or
  language from the compact header or navigation drawer;
- the 1440 evidence frame clips critical chrome in the ordinary review canvas;
- loading, empty, error, unauthorized, degraded and provider-unavailable states
  are described but are not directly selectable evidence.

These defects were returned to Claude Design and corrected in `WA-SHELL-r4`.
Independent validation directly exercised:

- 1440, 1024, 768–899 drawer, 412, 390 and 320;
- EN/LTR and AR/RTL;
- light and dark;
- navigation drawer and mobile shell-actions sheet;
- Loading, Unauthorized and Provider unavailable states.

F0 Design is green. Frontend and QA remain red because the real application is
still non-compliant. Service Wiring is amber because the underlying services
exist but the shell routes and hierarchy are not reconciled. Sponsor is amber
pending an explicit bounded implementation decision.

## M1 Dashboard

Design status: **AMBER — correction assigned**  
Current runtime status: **functional but not authority-certified**

### Strategic View required content

- compliance-rate trend;
- risk distribution;
- violation trend;
- decision mix: Approve, Return and Reject;
- license exposure;
- cancellation rate;
- inspection coverage;
- uninspected factories by stage, sector and region;
- checklist items by authority;
- risk-to-attention mismatch;
- repeat-violation rate;
- traceable Strategic AI Summary.

The AI summary is advisory, covers the current and trailing two or three
periods, contains three to five ranked findings and mixes improvements with
concerns. Every sentence must open the real underlying records.

### Operational View required content

- Draft, Published, Returned and Cancelled visit pipeline;
- expiring-soon visits;
- active executions;
- pending approvals;
- pending publish;
- today's schedule load;
- GPS overrides today;
- live activity;
- time-critical Operational AI Nudges.

Nudges are advisory and today-only. Each CTA opens exact prefilled context but
must never execute the action.

### Runtime finding

The real Dashboard already has meaningful safe behavior that must be retained:
RLS-scoped data, Strategic/Operational tabs, linked violations, approved versus
pending compliance grains, live refresh, source-aware intervention counts and
truthful `not configured` coverage instead of fabricated metrics.

Recommended action: **CORRECT DESIGN, THEN CORRECT SHELL/WIRE WITHOUT REGRESSION**.

## M3 Operations Center

Design status: **AMBER — correction assigned**  
Runtime certification: **not yet completed**

### Live Operations Map

- only inspectors with active journeys or operational states;
- latest GPS, assigned factory and active visit;
- filters for region, city, inspector, visit type and operational state;
- inspector card, Visit Details and Factory 360 links;
- elapsed time and last update;
- conditional arrival and inspection timestamps;
- no route calculation or navigation in Phase 1.

### Regional Performance Map

- Saudi national view with one selected metric;
- drill national → region → factories → quick card → Factory 360;
- the same metric and grain at every level;
- passed/answered compliance formula;
- configurable thresholds only; no invented threshold.

### Operational Highlights

- predefined rule- or system-event-backed natural-language items;
- grouped, prioritized, timestamped and deep-linked;
- Critical, High, Medium, Information order;
- traceable and auto-refreshing;
- no recommendations or automatic decisions.

Recommended action: **CORRECT DESIGN; BLOCK IMPLEMENTATION UNTIL STABLE
REVISION AND SERVICE/TRUTH MATRIX**.

## M4 Factories and Factory 360

Design status: **AMBER — correction assigned**  
Runtime certification: **not yet completed**

### Required information architecture

- CR Overview;
- License Selector;
- License Overview;
- Factory Profile;
- Compliance;
- Industrial Information;
- Government Information;
- Documents;
- Timeline;
- AI Insights.

One commercial registration may contain multiple industrial licenses; one
license represents one plant.

### Required semantics

- Factory profile and Senaei/government data are read-only.
- Compliance rate uses the latest approved inspection only; Returned and
  Rejected inspections are excluded.
- Risk uses the latest completed Risk Engine calculation; its explanation may
  cite only recorded Risk Engine factors.
- Compliance history includes submitted reports, latest version and immutable
  version history; metrics and trends use approved reports only.
- Official images/documents remain separate from inspection/arrival/violation
  evidence.
- Expired government data remains visible in history.
- Export and Create Inspection are permission-based.
- Provider unavailable and empty states are explicit.

Recommended action: **CORRECT DESIGN; BLOCK IMPLEMENTATION UNTIL STABLE
REVISION, PROVIDER CONTRACT AND PERMISSION EVIDENCE**.

## Planning, Execution and Compliance preservation

- Planning must retain the canonical visit list, URL-backed search/filter/sort/
  pagination/actions, distinct draft-resume grain, Single/Bulk/Immediate,
  factory eligibility, location provenance, assignment, Visit Window,
  publish/return/cancel/expiry, notifications and audit.
- Web/Admin Execution is Planning-owned oversight. It does not move into
  `/field/**`.
- Compliance must retain its complete bilingual regulation lifecycle,
  approvals, violations, penalties, inspection items, response types,
  dependencies, permissions, audit and negative states.

## Sponsor-readable delivery position

| Module | Design | Frontend | Wiring | QA | Sponsor |
|---|---|---|---|---|---|
| F0 Shared Shell | RED | RED | AMBER | RED | RED |
| M1 Dashboard | AMBER | AMBER | AMBER | RED | GREY |
| M2 Planning & Visits | AMBER | RED | AMBER | RED | AMBER |
| M3 Operations Center | AMBER | GREY | GREY | GREY | GREY |
| M4 Factory 360 | AMBER | GREY | GREY | GREY | GREY |

No module is implementation-ready. The next consent point is a stable,
independently validated shared-shell revision plus the selected module revision,
not general approval of the entire programme.
