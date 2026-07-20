# TASK-WEB-COMPLIANCE-SHARED-SHELL-001 evidence

Date: 2026-07-19 (Asia/Riyadh)
Branch: `codex/compliance-shared-shell-001`
Base commit: `c285d528cac55c071ced3099a146798f55e4e1c6`
Status: `IMPLEMENTED_VERIFIED_AWAITING_SPONSOR_ACCEPTANCE`

## Scope and preserved boundaries

Prompt 01 implements only the Web/Admin shared navigation shell, topbar and
visibility model. No migration, DDL, runtime-data, Compliance entity schema,
Inspector/iPad runtime, Mapbox, notification-provider, SMS, email, push,
digital-signature, offline, audit, versioning or historical-record source was
changed. Navigation remains a presentation layer; destination route guards,
server actions and RLS remain authoritative.

## Durable Prompt 00 decision pack

- Durable directory: `/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/SAQEEL_COMPLIANCE_PROMPT_00_2026-07-19`
- ZIP: `SAQEEL_COMPLIANCE_PROMPT_00_DECISION_PACK_2026-07-19.zip`
- Required and observed SHA-256: `8964ae5580b9962802fae8762f229e8a521bffe8e8b037009e23e0bd81fe569a`
- Source branch/commit recorded at transfer: `setup/Inspection` / `c285d528cac55c071ced3099a146798f55e4e1c6`
- Transfer timestamp: `2026-07-19T20:44:23+0300`
- Inventory: 22 durable files: ZIP, `DURABLE_TRANSFER_RECORD.md`, and 20 files under `decision-pack/` (19 pack artifacts plus `MANIFEST.sha256`).
- Verification: ZIP checksum exact-match PASS; all 19 entries in `decision-pack/MANIFEST.sha256` PASS.
- Move completion: the temporary source directory was removed only after the durable 22/22 inventory and checksums passed.
- Exact inventory and per-file hashes: durable `DURABLE_TRANSFER_RECORD.md` and `decision-pack/MANIFEST.sha256`.

## Before and after persona navigation

| Persona/family | Before Prompt 01 | After Prompt 01 |
|---|---|---|
| Planner | Shared Dashboard/Operations/Factory 360; Planning and Visit Management only | All ten business destinations enabled; seven primary Administration entries visible and locked |
| Inspector | Shared Dashboard/Operations/Factory 360; My assignments and Virtual Inspections only | All ten business destinations enabled; seven primary Administration entries visible and locked |
| Reviewer | Shared Dashboard/Operations/Factory 360; Review & Approval only | All ten business destinations enabled; seven primary Administration entries visible and locked |
| Operations | Shared Dashboard/Operations/Factory 360; Visit Management only | All ten business destinations enabled; seven primary Administration entries visible and locked |
| Leadership | Shared Dashboard/Operations/Factory 360 only | All ten business destinations enabled; seven primary Administration entries visible and locked |
| Administrator role families | Only role-filtered control-plane entries; no common business catalogue | All ten business destinations enabled; each of the seven primary Administration entries enabled only when its existing role family permits; otherwise visible and locked; permitted advanced entries remain visible |

The ten unified business destinations are Dashboard, Operations Center, Factory
360, Planning, Inspection / Execution, Inspection / Review & Approval,
Compliance Library, Approval Queue, Enforcement Library and AI Insights.

## Enabled, disabled and hidden rules

- Business destinations: enabled for every recognized business persona. They are
  also available to recognized admin role families so an administrator does not
  lose the business shell. This grants no data or action authority.
- Primary Administration: Users and Roles require `security_admin`; Lookup
  Management requires `compliance_admin`, `workflow_admin` or `security_admin`;
  Risk Configuration requires `risk_owner`; Survey Configuration requires
  `form_admin` or `compliance_admin`; Notification Configuration accepts any
  existing admin family; Integration Management requires `security_admin` or
  `workflow_admin`.
- Missing primary Administration authority: the item stays visible as a
  keyboard-focusable `role=link`, has `aria-disabled=true`, has no `href`, shows
  a lock glyph, and exposes the bilingual administrator-required reason.
- Advanced pre-existing Administration destinations: visible only to the role
  families that already owned them; otherwise hidden.
- Authentication, route guards, action permissions and RLS remain authoritative
  after navigation. A visible or enabled menu item never grants access.

## Shared topbar

The shell provides authenticated global search, date scope, region scope, theme,
notifications, AI entry and user account/avatar. Existing language, profile and
sign-out behavior remains in the account surface. Global search uses the normal
authenticated Supabase server client and RLS-scoped reads of factories, visits
and inspections; it has no elevated client. Date and region controls are enabled
only on their declared consumer routes and otherwise communicate not-applicable.

## Route guard and RLS evidence

- `compliance-shared-shell.spec.ts`: route boundary, unavailable state and
  authenticated non-elevated search source contracts PASS (5/5 combined Prompt
  01 source tests).
- `cd-006-regulation-publish-provenance.spec.ts`: maker-checker/provenance source
  contract PASS and live planner publish attempt denied/no representation under
  RLS PASS (2/2). The denied PATCH left runtime data unchanged.
- No middleware, `AdminRouteBoundary`, RLS policy, migration or action file was
  edited in this slice.

## Verification results

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` with existing local approved environment | PASS; `/api/shell/search` included |
| Prompt 01 + protected Inspector-boundary source checks | 10/10 PASS |
| Shared-shell browser role/responsive/RTL/theme checks | 8/8 PASS |
| Visual evidence harness | 2/2 PASS; four reviewed frames |
| Live route/RLS negative | 2/2 PASS |
| Complete non-mutating static inventory | 91 passed, 4 intentional provider skips, 1 pre-existing failure |
| `git diff --check` | PASS |

The single static failure is outside Prompt 01: the base-branch
`platform-design-system-contract.spec.ts` still asserts the former
`IBM_Plex_Sans_Arabic` import identifier, while the current root layout already
self-hosts IBM Plex Sans Arabic using `localFont`. Prompt 01 did not alter either
file. The latest existing complete protected browser certificate remains 510
passed, 9 intentional skips, 0 failed (`TASK-MVP3-RETROFIT-REGRESSION-001`). It
was not rerun because that inventory contains state-mutating journeys and this
authorization expressly prohibits runtime-data mutation.

## Visual evidence

Durable directory:
`/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/TASK-WEB-COMPLIANCE-SHARED-SHELL-001`

- `planner-desktop-en-light.png` — English, light, expanded; all seven locked Administration entries visible.
- `planner-desktop-en-dark.png` — English, dark, expanded.
- `planner-desktop-en-collapsed.png` — English, dark, collapsed.
- `planner-mobile-ar-light-drawer.png` — Arabic RTL, light, responsive drawer; zero horizontal overflow.
- `SCREENSHOT_MANIFEST.sha256` — per-image checksum record.

## Remaining P0/P1

- P0: none found within the authorized Prompt 01 implementation boundary.
- P1: sponsor runtime/visual acceptance is pending.
- P1: separately maintain the stale IBM Plex Sans Arabic import-name assertion;
  it is an existing regression-contract maintenance issue, not a product runtime
  or Prompt 01 defect.

Stop state: `AWAITING_SPONSOR_SHARED_SHELL_ACCEPTANCE`.
