# SAQEEL Module Status Board

Status values are evidence-based. Green means implemented and verified within
the named boundary, not inferred from a design or screenshot.

| Module | Design authority | Frontend | Service wiring | QA | Sponsor state | Next controlled action |
| --- | --- | --- | --- | --- | --- | --- |
| F0 Shared Web/Admin shell | GREEN | GREEN candidate | AMBER | AMBER | REVIEW | Sponsor reviews real runtime; preserve Analytics and Execution blockers |
| M1 Dashboard | AMBER | NOT STARTED under current lease | NOT STARTED | NOT STARTED | DESIGN RECONCILIATION | Reconcile `dashboard.xlsx`, WA-SP-010..028, current implementation, and Claude Design |
| M2 Planning & Visits | AMBER | BLOCKED | BLOCKED | BLOCKED | NEEDS SEPARATE LEASE | Resolve shared/Field ownership and certify preview gate before Execution cutover |
| M3 Operations Center | NOT REVIEWED | NOT LEASED | NOT REVIEWED | NOT STARTED | PENDING | Establish authority and bounded module delta |
| M4 Factory 360 | NOT REVIEWED | NOT LEASED | NOT REVIEWED | NOT STARTED | PENDING | Establish authority and bounded module delta |
| M5 Compliance | PARTIAL | SHELL LINKS CORRECTED | EXISTING ROUTES PRESERVED | PARTIAL | PENDING | Module-level design/code/wiring review |
| M6 Review & Approval | NOT REVIEWED | NOT LEASED | NOT REVIEWED | NOT STARTED | PENDING | Establish authority and bounded module delta |
| M7 Administration hubs | SHELL AUTHORITY GREEN | SIX HUBS CORRECTED | EXISTING ROUTES PRESERVED | F0 NAV ONLY | PENDING | Review each control-plane module separately |
| M8 Field Inspector / iPad PWA | OUTSIDE F0 | UNTOUCHED | UNTOUCHED | PRE-EXISTING FAILURES RECORDED | BLOCKED FROM THIS LEASE | Separate Field ownership and acceptance cycle |

## Current sponsor-visible result

The real application is running at `http://127.0.0.1:3002/operations` with the
corrected F0 Web/Admin shell. The status board does not mark M1–M8 green merely
because their navigation entries exist.
