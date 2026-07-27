# Module 01 — Planning comparison

Date: 2026-07-24
Implementation lease: `WA-P1-M2-BATCH-002`
Design baseline: `WA-DES-036`, revision `1784901048581707`
Implementation branch: `codex/planning-m2-saqeel-correction`

## Sponsor-visible outcome

The real Planning implementation is running at:

`http://127.0.0.1:3000/planning?wa_preview=1`

The Chrome tab is authenticated as the Planner persona and uses real,
RLS-scoped application data. The preview path is explicitly read-only; it does
not run the visit-expiry mutation while the sponsor compares the candidate.

Evidence:

- Claude Design baseline:
  `/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/WA-P1-M2-BATCH-002/module-01-planning/claude-design-WA-DES-036-r1784901048581707.png`
- Claude Design list-first candidate:
  `/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/WA-P1-M2-BATCH-002/module-01-planning/claude-design-WA-DES-036-r1784904309230874.png`
- Real implementation:
  `/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/WA-P1-M2-BATCH-002/module-01-planning/real-implementation-planning-home-2026-07-24.png`

## Material implementation achieved

- Restored the native SAQEEL shell and semantic-token vocabulary without
  re-importing the retired retired predecessor stylesheet.
- Removed the temporary legacy token bridge.
- Restored a styled Planning Home/Methods surface using co-located CSS modules.
- Preserved all three real Planning creation routes.
- Wired the Planning-owned Visit Management entry.
- Rendered ten real draft plans with localized Riyadh timestamps.
- Restored the Visit detail two-column management workspace.
- Removed rejected directional-arrow decoration from link labels.
- Kept canonical routes, RLS/RBAC, services, APIs, audit/version reads, and
  backend contracts unchanged.

## Design versus runtime

| Check | Result | Evidence |
|---|---|---|
| Planning capability and three methods | PARITY | Real links to bulk, single, and immediate routes |
| Effective package context | PARITY WITH VISUAL DELTA | Real package/version and draft count; design gives it stronger visual weight |
| Real draft work | IMPLEMENTATION AHEAD | Runtime renders ten live draft rows; the accepted design does not honestly model canonical list density |
| Visit Management wiring | PARITY | Preview route opens the real RLS-scoped Visit list and detail |
| Desktop method layout | AMBIGUOUS | Design shows three across; runtime stacks below its explicit 1099px breakpoint |
| Canonical list-first `/planning` authority | DESIGN GAP | No mature dedicated Claude frame exists |
| Premium information hierarchy | DESIGN CORRECTION REQUIRED | Runtime is operationally dense; design must model toolbar, table hierarchy, density, and responsive states |

## Verification

- TypeScript typecheck: PASS
- Production build: PASS
- Focused F0 + Planning M2 suite: **16/16 PASS**
- Includes live Planner journey, Visit detail, audit/version content, admin
  denial, explicit-query fail-closed behavior, Arabic RTL, narrow reflow, and
  automated accessibility.
- Additional protected static sweep: **21/29 PASS**. The eight failures are
  recorded as existing/stale cross-module contracts, including old Field
  three-tab/FAB expectations, an already-removed prism asset, broad scans of
  retired CSS, and unrelated shell-exception/palette assertions. They do not
  invalidate the focused Planning result and must not be silently waived.

## Independent premium review

ChatGPT classified the real implementation as functionally mature and the
remaining authority gap as design-side. Its bounded recommendation is:

- add a new canonical list-first Planning frame;
- make method cards secondary entry actions;
- state wide and narrow breakpoints explicitly;
- reduce the package banner to compact operational context;
- model an honest ten-row populated table plus empty, loading, error, and
  unauthorized states;
- provide EN/LTR, AR/RTL, light/dark, and responsive variants;
- leave application code unchanged until that new design revision is reviewed
  and sponsor-approved.

Claude completed that design-only lease. It preserved revision
`1784901048581707` and produced candidate revision `1784904309230874`. Codex
returned its first candidate because it reintroduced directional arrows and an
emoji. The final candidate has zero `Continue →`, `Visit management →`, and
lightning-emoji remnants; it uses a neutral SVG line icon and retains ten rows,
the list-first route model, and explicit breakpoints. Claude confirmed no
application, API, backend, schema, RBAC/RLS, product-contract, or Codex-worktree
changes.

## Current reviewer decision

**APPLICATION CORRECTION: PASS FOR THE ORIGINAL FOCUSED PLANNING LEASE.**

**NEW LIST-FIRST DESIGN CANDIDATE: APPROVE FOR SPONSOR CONSENT.**

**VISUAL PARITY TO THE NEW CANDIDATE: NOT YET CLAIMED.** The current read-only
sponsor preview remains methods-first. Candidate revision `1784904309230874`
introduces a list-first KPI/filter/table hierarchy and demotes method cards.
That is a new bounded frontend delta after sponsor consent, not evidence that
the present preview already matches it.

Do not perform the next frontend correction or start another module until the
sponsor accepts or rejects candidate revision `1784904309230874`.

## Ownership boundary

- Claude: Planning design authority, new revision, premium hierarchy, state and
  breakpoint definition.
- Codex: real application wiring, focused verification, browser evidence, and
  independent delta review.
- ChatGPT: advisory premium-maturity research only.
- No implementation lease may overlap Claude's design work or the unresolved
  cross-module foundation failures.
