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
| Foundation / F0 | Shared SAQEEL foundation | GREEN | RED | AMBER | RED | AMBER | `WA-SHELL-r4` passed independent design evidence review across the six named frames, EN/AR, light/dark, mobile actions and representative negative states. Runtime remains `REGISTERED_NOT_IMPLEMENTED`; sponsor consent for a bounded frontend lease is pending. |
| Execution #1 / M2 | Planning & Visits | AMBER | RED | AMBER | RED | AMBER | `WA-DES-036-r4` is observable, but Planning cannot be certified above a failed shared shell. Canonical HEAD also contains unloaded legacy styling and stale self-referential tests. No new wiring is authorized. |
| M1 | Dashboard | AMBER | AMBER | AMBER | RED | GREY | Authority/workbook comparison active. Preserve the richer current runtime semantics while restoring the full Strategic/Operational IA and shell options. |
| M3 | Operations Center | AMBER | GREY | GREY | GREY | GREY | Design correction active for Live Operations Map, Regional Performance Map and traceable Operational Highlights. |
| M4 | Factories & Factory 360 | AMBER | GREY | GREY | GREY | GREY | Design correction active for the CR/license model, compliance, industrial/government data, documents, timeline and evidence-linked risk/AI. |
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

## Fixed control-room and execution order

The sponsor-visible workspace is arranged as four persistent quadrants:

1. Claude Design — design authority, revisions and visual evidence.
2. Real SAQEEL runtime — implementation truth and regression comparison.
3. ChatGPT challenge hub — independent RCA, product challenge and prompt
   refinement.
4. Claude Code — read-only repository preparation until an implementation
   lease is approved.

The execution order is fixed:

1. F0 shared shell.
2. M1 Dashboard.
3. M3 Operations Center.
4. M4 Factories and Factory 360.
5. M2 Planning/Visits and the remaining modules only after their parent shell
   and preceding dependencies are stable.

Each module repeats the same drill: authority preflight, current-runtime
inventory, design delta, independent visual challenge, sponsor consent,
single-owner frontend lease, positive/negative testing and real Chrome proof.
No module is allowed to skip directly from a clean mock to implementation.

## Planning checkpoint

Material implementation already present:

- Real RLS-scoped Dashboard, Planning and Visits behavior exists and must be
  preserved.
- Real search, notifications, theme, account, responsive drawer, RTL and
  fail-closed AI behavior exists and must be preserved.
- These capabilities do **not** certify F0 shell parity. The binding shell
  acceptance rows remain `REGISTERED_NOT_IMPLEMENTED`.
- Current focused tests are not sufficient evidence because some assertions
  were copied from the drifting implementation rather than the authority.

Current hold:

- Do not implement a module correction until the shared-shell design contract,
  preservation matrix and sponsor consent are complete.
- Claude Design is correcting F0, Dashboard, Operations Center and Factory 360
  as design-only work. Planning `WA-DES-036-r4` remains under the same shared
  shell and cannot be marked implementation-ready independently.
- No lane may turn green without runtime evidence derived from the authority,
  including EN/AR, light/dark, responsive, permission-negative and `/field`
  isolation checks.

## Non-negotiable ownership boundary

- Claude Design changes design artifacts and status presentation only.
- ChatGPT is advisory and does not change repository or design artifacts.
- Codex is the sole application wiring owner for this lease.
- No backend, API, schema, RLS/RBAC, workflow, route cutover, deletion,
  Field/PWA/iPad, stash, provider, shared-data, push, merge, deploy or
  next-module implementation is authorized.
