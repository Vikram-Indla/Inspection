# M3 Operations — Claude Design Revision 3 Review

Date: 2026-07-24  
Reviewer: Codex  
Module: M3 Operations Center  
Routes: `/operations`, `/operations/live`; `/operations/exceptions` preserved unchanged  
Requirements: `CR-430..CR-448`  
Acceptance: `WA-M3-AC-001..006`, `WA-SHELL-AC-008..009`  
Design: `WA-DES-033`, `WA-DES-034`, `DSG-027`, `DSG-CMD-009..013`, `DSG-CMD-020`, `SPC-LIVE-001..007`, `SPC-CMD-004`, `SPC-CMD-005`

## Reviewer recommendation

**APPROVE FOR SPONSOR CONSENT**

Claude Design Revision 3 is accepted as a corrected semantic delta specification and as a rendered visual-design candidate. It is ready for sponsor consent. This review does not itself authorize application implementation.

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
- Rendered Operations Center page: PASS (`WA-DES-033-C3`).
- Rendered Operations Live page: PASS (`WA-DES-034-C3`).
- EN/LTR wordmark and AR/RTL separation: PASS after critic correction.
- Operations Live active-navigation semantics: PASS after critic correction.
- Distinct 390-pixel state on both rendered pages: PASS after critic correction.

## Evidence reviewed

Claude-owned design outputs:

- `design/claude-design-mvp1/outputs/m3-operations/00_M3_OPERATIONS_DESIGN_CORRECTION_PACKAGE.md`
- `design/claude-design-mvp1/outputs/m3-operations/01_OPERATIONS_CENTER_CORRECTION_SPEC.md`
- `design/claude-design-mvp1/outputs/m3-operations/02_OPERATIONS_LIVE_CORRECTION_SPEC.md`
- `design/claude-design-mvp1/outputs/m3-operations/03_REQUIRED_STATE_MATRIX.csv`

Source design hashes remain unchanged:

- `WA-DES-033`: `ea9dce0b775ba69eb1bea3ebe7a35c076de316c18f1b955b5b3d8a2e8c7988e1`
- `WA-DES-034`: `157b68c8ba4bbbdba4f61265b25ff98d097a810e5acb42f2aef67f4b4403452d`

The sponsor-provided Claude Design project was inspected. It now exposes 104 pages and includes these two rendered revision candidates:

- `WA-DES-033-C3`: `https://claude.ai/design/p/5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61?file=SAQEEL+M3+Operations+Center+-+WA-DES-033-C3.dc.html`
- `WA-DES-034-C3`: `https://claude.ai/design/p/5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61?file=SAQEEL+M3+Operations+Live+-+WA-DES-034-C3.dc.html`

The first rendered pass was returned to Claude Design because its EN/LTR frame used an Arabic wordmark and Operations Live presented the wrong active navigation. Both were corrected. A second critic pass found that 390 pixels had been omitted as a distinct responsive state. Claude Design added a separate 390 selector and a 390-specific layout to both pages. Codex verified the Operations Live mobile state as `390×844 · Mobile · dark · EN/LTR`.

## Remaining acceptance conditions

The rendered design dependency is no longer missing. Application implementation still requires sponsor consent for these exact rendered revisions and a recorded implementation lease. `WA-M3-AC-003` and the relevant design/special-component acceptance rows must remain evidence-backed during implementation.

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

## Product decisions preserved as fail-closed

These are product definitions, not implementation preferences:

1. **Submitted Today:** select the metric grain and source:
   - distinct visits, inspections or submission versions;
   - first submission or latest resubmission;
   - Riyadh calendar-day boundary.
2. **Active Alerts:** approve the alert taxonomy, severity ordering and deduplication rule.
3. **Live map behavior:** confirm the recommended Phase 1 contract — markers/status only, with no route line, path animation or ETA — resolving the conflict between the live-map prompt and `SPC-CMD-005`.
The rendered design does not fabricate the first two definitions: both affected cards remain present and visibly unavailable. It implements the recommended safe Phase 1 live-map behavior for the third decision.

## Route-safety prerequisite

Before runtime evidence capture against `/operations`, use a separate bounded lease containing only:

- `apps/web/src/app/(app)/operations/page.tsx`
- a new `apps/web/e2e/web-admin-m3-route-safety.spec.ts`

Remove the render-time `expire_stale_geo_override_requests` RPC, use one request-start timestamp, and filter the actionable pending queue with `expires_at > nowIso`. Keep the existing atomic decision guard as the expiry-race authority. Repeated GETs must prove zero override, visit and audit mutations. The equivalent Field-page issue is outside this M3 lease and must not be silently absorbed.

## Proposed ownership boundary

Before visual sign-off:

- Claude Design owns rendered Operations design correction and revision evidence.
- Codex owns mapping, semantic delta review, route/data/test validation and sponsor decision packaging.
- Neither party modifies application code.

After visual sign-off:

- Codex receives the exclusive implementation lease for M3-local Operations files and focused tests.
- Claude remains design reviewer.
- `/operations/exceptions`, shared shell, shared `GeoMap`, global CSS, Field/PWA/iPad, APIs, migrations and remote Supabase remain outside the lease unless separately authorized.
