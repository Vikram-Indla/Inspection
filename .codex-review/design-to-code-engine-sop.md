# SAQEEL Design-to-Code Delivery Engine

## Operating principle

Design discovery may run in parallel. Product-code implementation is leased to
one owner per module/file set. Independent reviewers never edit leased files.

## One-to-one module cell

Each active module has:

1. one existing ChatGPT context thread for product challenge and research;
2. one dedicated Claude Design chat/file for stable visual authority;
3. one Codex orchestrator task for repository mapping, wiring and evidence;
4. one exclusive implementation lease after design acceptance;
5. one independent QA/reviewer stream.

No chat memory is treated as authority. Every material output is normalized into
the module's versioned handoff packet.

## Required handoff packet

- module/task/process/requirement/screen/engine/acceptance IDs;
- source artifact names and hashes;
- stable Claude project/file/page/revision identifiers;
- design screenshots for required viewports, locale directions and themes;
- workbook/requirement parity matrix;
- design-to-code route/component/service mapping;
- semantic delta and functional implication;
- explicit live/partial/stale/empty/unavailable/not-configured/
  decision-required/unauthorized/provider-unavailable states;
- proposed file lease and concurrent ownership check;
- API/backend/policy implications;
- positive, negative, accessibility, responsive and regression tests;
- sponsor consent packet.

## Module lifecycle

| Gate | Meaning | Required owner |
| --- | --- | --- |
| DISCOVER | requirements, workbook, code and services mapped | Codex orchestrator |
| DESIGN | stable Claude revision produced | Claude Design |
| CHALLENGE | ChatGPT and Codex independently identify defects | ChatGPT + Codex |
| CONSENT | sponsor accepts the bounded revision and business decisions | Sponsor |
| LEASE | exact files and exclusions recorded | Root orchestrator |
| BUILD | one implementation owner changes only leased files | Assigned CLI |
| VERIFY | negative paths, regression and evidence completed | Independent reviewer |
| DEMO | real application shown in Chrome | Root orchestrator |
| ACCEPT | sponsor accepts the real module | Sponsor |

## Status semantics

- Design GREEN: stable accepted revision and complete design evidence.
- Frontend GREEN: real application implementation, not a design export.
- Service Wiring GREEN: real governed data/actions, including failure states.
- QA GREEN: required positive, negative, responsive, RTL, accessibility and
  regression evidence passes.
- Sponsor GREEN: sponsor accepts the real browser implementation.

No aggregate module is GREEN while any required P0/P1 row is missing or
unevidenced. A requirement may be visibly BLOCKED without making the reporting
dishonest; it may not be silently removed.

## Concurrency rules

- M1 Dashboard may build only after its stable design revision passes.
- M3 Operations Center and M4 Factory 360 may perform read-only discovery in
  parallel once their governance slices are recorded.
- Only one stream may own shared shell, shared map, shared KPI or global token
  files at a time.
- Field/PWA/iPad ownership is separate from Web/Admin.
- Backend/API/schema work requires a separately authorized lease.
- ChatGPT/Claude outputs never directly modify product code.

## Sponsor interruption policy

Return to the sponsor only for:

- a new or conflicting business policy;
- role/permission changes;
- backend/API/schema expansion;
- destructive or irreversible action;
- shared-file ownership conflict;
- final module acceptance.

Ordinary design corrections, repository mapping, test preparation and bounded
implementation decisions continue without sponsor interruption.
