# M3 Operations — Claude Design Revision 3 Review

Date: 2026-07-24  
Reviewer: Codex  
Module: M3 Operations Center  
Routes: `/operations`, `/operations/live`; `/operations/exceptions` preserved unchanged  
Requirements: `CR-430..CR-448`  
Acceptance: `WA-M3-AC-001..006`, `WA-SHELL-AC-008..009`  
Design: `WA-DES-033`, `WA-DES-034`, `DSG-027`, `DSG-CMD-009..013`, `DSG-CMD-020`, `SPC-LIVE-001..007`, `SPC-CMD-004`, `SPC-CMD-005`

## Reviewer recommendation

**BLOCK DUE TO MISSING CONTRACT**

Claude Design Revision 3 is accepted as a corrected semantic delta specification. It is not accepted as a visual design revision and does not authorize application implementation.

## What Codex challenged and Claude corrected

1. Preserved the exact five-card contract from `WA-SP-031`: Active Visits, On the Way, Executing, Submitted Today and Active Alerts.
2. Prevented an invented Active Alerts total. The card remains present but displays `unavailable / decision required` until taxonomy and deduplication are governed.
3. Prevented Codex from choosing the Submitted Today metric grain. The card remains present but displays `unavailable / decision required` until source, grain and Riyadh day boundary are governed.
4. Corrected the RLS-empty state: only the three governed count cards may display zero; the two decision-blocked cards remain unavailable.
5. Removed invented risk thresholds and colored risk bands.
6. Removed invented freshness and wallboard refresh cadence.
7. Required provider failure to fail closed without schematic pseudo-location.
8. Preserved the Phase 1 safe default for Operations Live: markers and status only; no route line, path animation or ETA.
9. Added national-to-region-to-factory drill and a synchronized list.
10. Added direct-route authorization states.
11. Withdrew all proposed changes to `/operations/exceptions`, which has no exact accepted design match.
12. Recorded the existing mutating GET defect on `/operations`; the review did not change application code.

## Validation results

- Revision labels: PASS (`WA-DES-033-C3`, `WA-DES-034-C3`, Revision 3).
- Five KPI cards: PASS.
- Governance-blocked KPI zero handling: PASS.
- No invented refresh/staleness cadence: PASS.
- No default route/path/ETA: PASS.
- Required-state CSV: PASS, 44 data rows plus header; every row has exactly five fields.
- Markdown/state references: PASS.
- Whitespace validation: PASS.
- Application product code changed: NO.
- Frozen product-contract artifacts changed by Codex: NO.

## Evidence reviewed

Claude-owned design outputs:

- `design/claude-design-mvp1/outputs/m3-operations/00_M3_OPERATIONS_DESIGN_CORRECTION_PACKAGE.md`
- `design/claude-design-mvp1/outputs/m3-operations/01_OPERATIONS_CENTER_CORRECTION_SPEC.md`
- `design/claude-design-mvp1/outputs/m3-operations/02_OPERATIONS_LIVE_CORRECTION_SPEC.md`
- `design/claude-design-mvp1/outputs/m3-operations/03_REQUIRED_STATE_MATRIX.csv`

Source design hashes remain unchanged:

- `WA-DES-033`: `ea9dce0b775ba69eb1bea3ebe7a35c076de316c18f1b955b5b3d8a2e8c7988e1`
- `WA-DES-034`: `157b68c8ba4bbbdba4f61265b25ff98d097a810e5acb42f2aef67f4b4403452d`

The open sponsor-provided Claude Design project was inspected. It exposes 102 pages and includes SAQEEL PWA journey, M1 Dashboard, Web Shell and Web Dashboard families. No rendered Operations Center or Operations Live revision was established as the writable visual source for `WA-DES-033` or `WA-DES-034`.

## Missing contract

Implementation remains blocked until an actual rendered Claude Design revision exists for both Operations pages and receives human sign-off. Markdown correction specifications cannot satisfy `WA-M3-AC-003` or the relevant design/special-component acceptance rows.

The design revision must visibly cover:

- five-card KPI row, including both decision-blocked values;
- Operations Map and National Performance views;
- regional drill and synchronized list;
- direct-route unauthorized state;
- loading, RLS-empty, query error, no-position and provider-failure states;
- accessible map-list alternative;
- EN/LTR and AR/RTL at registered desktop and mobile widths;
- light and dark themes;
- Operations Live last-observed and freshness-policy-unconfigured states;
- reduced-motion and wallboard states;
- no default route, path animation or ETA.

## Sponsor decisions still required

These are product definitions, not implementation preferences:

1. **Submitted Today:** select the metric grain and source:
   - distinct visits, inspections or submission versions;
   - first submission or latest resubmission;
   - Riyadh calendar-day boundary.
2. **Active Alerts:** approve the alert taxonomy, severity ordering and deduplication rule.
3. **Live map behavior:** confirm the recommended Phase 1 contract — markers/status only, with no route line, path animation or ETA — resolving the conflict between the live-map prompt and `SPC-CMD-005`.
4. **Rendered design home:** identify or create the writable Claude Design project/file that will own corrected `WA-DES-033` and `WA-DES-034`.
5. **Route safety lease:** authorize a separate bounded correction for the mutating GET before any visual evidence capture is performed against `/operations`.

## Proposed ownership boundary

Before visual sign-off:

- Claude Design owns rendered Operations design correction and revision evidence.
- Codex owns mapping, semantic delta review, route/data/test validation and sponsor decision packaging.
- Neither party modifies application code.

After visual sign-off:

- Codex receives the exclusive implementation lease for M3-local Operations files and focused tests.
- Claude remains design reviewer.
- `/operations/exceptions`, shared shell, shared `GeoMap`, global CSS, Field/PWA/iPad, APIs, migrations and remote Supabase remain outside the lease unless separately authorized.

