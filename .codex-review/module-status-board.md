# SAQEEL Web/Admin Delivery Status

Updated: 2026-07-24  
Authority: `CC-WEB-ADMIN-PHASE1-001`  
Coverage: F0 foundation plus M1–M11, 71 Phase 1 routes

## Status key

| Status | Meaning |
|---|---|
| GREY — NOT STARTED | Inventoried; SAQEEL Phase 1 redesign is not certified. Existing product routes may still function. |
| AMBER — ACTIVE/PARTIAL | Work, review, evidence, or sponsor acceptance is incomplete. |
| GREEN — VERIFIED | Evidence-verified and accepted for this lane only. |
| RED — BLOCKED/FAILED | A named contract, decision, or failing check prevents progress. |
| N/A | The lane does not apply. |

Every module is tracked independently across Design, Frontend, Service Wiring,
QA, and Sponsor. A module never receives one overall colour.

## Sponsor board

| Execution / contract | Module | Design | Frontend | Service wiring | QA | Sponsor | Current focus |
|---|---|---|---|---|---|---|---|
| Foundation / F0 | Shared SAQEEL foundation | GREEN | GREEN | GREEN | AMBER | N/A | Historical protected-aggregate gaps remain disclosed. |
| Execution #1 / M2 | Planning & Visits | AMBER | AMBER | GREEN | AMBER | AMBER | Revision `1784904309230874` returned for route, data-grain, header, viewport, RTL and state correction before wiring. Existing RLS/audit/version services remain proven. |
| M1 | Dashboard | GREY | GREY | GREY | GREY | GREY | Design/code delta and KPI semantics `DEC-028`. |
| M3 | Operations Center | GREY | GREY | GREY | GREY | GREY | Live/exception/ETA and provider review. |
| M4 | Factories & Factory 360 | GREY | GREY | GREY | GREY | GREY | Industry Shared, privacy and provider contracts. |
| M5 | Reviews, Cases & Tasks | GREY | GREY | GREY | GREY | GREY | Maker-checker and immutable-version parity; depends on M2. |
| M6 | Compliance, Enforcement, Committee & Risk | GREY | GREY | GREY | GREY | GREY | Roles, terminal policy, risk, GIS and SLA decisions. |
| M7 | Reports, OCR, AI & Incidents | GREY | GREY | GREY | GREY | GREY | Provider-unavailable and report-state review. |
| M8 | Admin Identity, Roles & Security | GREY | GREY | GREY | GREY | GREY | Exact role and terminal-policy validation. |
| M9 | Admin Workflows, Forms, Lookups & KPI | GREY | GREY | GREY | GREY | GREY | Form-builder, workflow and KPI parity; depends on M8. |
| M10 | Admin Integrations, GIS, Execution & Provider Health | GREY | GREY | GREY | GREY | GREY | GIS/geofence and external-provider contracts; depends on M8. |
| M11 | Auth, Portal, Profile, Virtual & Shared States | GREY | GREY | GREY | GREY | GREY | Auth/provider, notifications, Arabic and shared-state certification. |

## Active parallel streams

1. **Design authority — Claude Design**
   - Correct WA-DES-036 without changing application code.
   - Preserve canonical route and data-grain truth.
   - Rebuild the existing 100-page Inspector journey artifact with a second
     Web/Admin Delivery view and five independent status lanes.
2. **Independent product challenge — ChatGPT**
   - Challenge premium maturity, header ownership, unsupported claims,
     responsive/RTL behavior and false-green status.
   - Return bounded Claude Design correction prompts, not application code.
3. **Repository orchestration and wiring — Codex**
   - Maintain the product contract and ownership boundary.
   - Independently map design to real routes/components/services.
   - Wire only a corrected, sponsor-permitted frontend delta.
   - Run positive, negative, permission, visual, responsive, RTL,
     accessibility and regression checks.
   - Show the real implementation in Chrome and stop for sponsor review.

## Planning checkpoint

Completed material implementation:

- Native SAQEEL shell/token reconciliation.
- Read-only Planning preview using real RLS-scoped data.
- Planning-owned Visits list/detail preview with audit/version preservation.
- Typecheck and production build pass.
- Focused F0 plus Planning M2: 16/16 pass.
- Additional static sweep: 21/29; eight stale/unrelated contracts remain
  recorded and are not waived.

Current hold:

- Do not implement the list-first redesign until Claude Design corrects the
  false `/planning/methods` route, duplicated header controls, undefined
  Planning date/region semantics, unproven “effective package” claim, visit
  versus draft grain collapse, missing viewport/RTL/theme/state evidence, and
  mismatched shell breakpoint behavior.

## Non-negotiable ownership boundary

- Claude Design changes design artifacts and status presentation only.
- ChatGPT is advisory and does not change repository or design artifacts.
- Codex is the sole application wiring owner for this lease.
- No backend, API, schema, RLS/RBAC, workflow, route cutover, deletion,
  Field/PWA/iPad, stash, provider, shared-data, push, merge, deploy or
  next-module implementation is authorized.
