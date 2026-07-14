# CD-027 Change-Control Requests — 3 held-blocked wiring legs

**Status: DRAFT — UNAPPROVED.** Each request below follows the required fields in
`product-contract/governance/CHANGE_CONTROL.md`. None is authorized. On sponsor
signoff, the approved request graduates into
`product-contract/governance/ACTIVE_CHANGE_APPROVAL.yaml` (one active record per
approval) and the decision it depends on is recorded in `decision_register.csv`.

These legs were held blocked in [CD-027_WIRING_AUDIT_R1.md](CD-027_WIRING_AUDIT_R1.md)
because closing any of them would breach a hard rule: invent a value, self-approve
an open product decision, or weaken accepted behavior. Each needs a sponsor
decision **before** code — no implementation shortcut is a valid reason.

Route/screen: `/visits/:id` · SCR-WEB-210 · P03. Files that would change:
`apps/web/src/app/visits/[id]/**` (+ a migration for ATOMIC).

---

## CC-CD027-MAP-001 — Visit-detail map / location provider

- **Change ID:** CC-CD027-MAP-001
- **Requestor:** Claude Code (on behalf of CD-027 slice)
- **Business reason:** State S34 (`HANDOFF_BLOCKED_MAP`) currently shows a truthful
  "no-map" region with the journey/geo-event list as the authoritative source.
  A detail-route map would visualise arrival/geofence context inline.
- **Source evidence:** WIRING_MAP_CD-027 leg (map absent); STATE_MATRIX S34;
  existing `journey_sessions`/`geo_events` reads in `page.tsx`.
- **Affected requirements/screens/fields/states/APIs/tests:** SCR-WEB-210; a new
  read-only map component; `geo_events` (lat/lng/accuracy/geofence_result already
  read); no write. Test: add a map-renders / map-degrades case to
  `cd-027-visit-detail.spec.ts`.
- **Decision required first (blocks this CR):** **DEC-008 maps provider** and
  **DEC-002 GIS accuracy / geofence policy** — a tile/map provider, attribution,
  data-residency stance, and geofence-display values must be supplied by the
  sponsor. Claude may **not** invent a provider, tiles, or geofence values.
- **MVP1/MVP2 impact:** MVP1 visualisation enhancement; the list remains the
  contractual source of truth, so deferral to MVP2 removes nothing.
- **Regression impact:** None if additive and behind the resolved provider; must
  not alter `geo_events` reads or the S34 fallback when the provider is absent.
- **Decision owner:** Vikram Indla
- **Approval:** ☐ pending
- **Effective version:** — (set on approval)

---

## CC-CD027-ASSIGNMENT-RELEASE-001 — Assignment release on visit cancel

- **Change ID:** CC-CD027-ASSIGNMENT-RELEASE-001
- **Requestor:** Claude Code (on behalf of CD-027 slice)
- **Business reason:** On `cancelVisit` the assigned inspector is notified but the
  assignment record is left intact (leg 6, `HANDOFF_BLOCKED_ASSIGNMENT_RELEASE`).
  Releasing the assignment could free the inspector's capacity and reflect that a
  cancelled visit has no active assignee.
- **Source evidence:** `actions.ts::cancelVisit` (no assignment mutation); WIRING_MAP
  leg 6 note "assignment-release NOT claimed"; assignments state usage in `page.tsx`.
- **Affected requirements/screens/fields/states/APIs/tests:** SCR-WEB-210;
  `assignments` row (status/inspector_id); the assignment state machine; possibly a
  notification to the released inspector. Test: cancel-then-assert-assignment-state.
- **Decision required first (blocks this CR):** the **assignment state-machine
  policy** — does cancel (a) leave the assignment as historical record (current,
  audit-friendly), (b) set it to a released/void status, or (c) null the assignee?
  Option (b) needs a **valid assignment status value** that must already exist in
  the contract or be added by decision — Claude may **not** invent a status.
  Interaction with append-only audit and immutability must be confirmed.
- **MVP1/MVP2 impact:** Behavior addition, not a scope removal; current behavior is
  safe and truthful, so this is optional hardening.
- **Regression impact:** Touches the assignment state machine and the cancel path —
  requires re-running assignment/reassign/cancel guards and audit assertions.
- **Decision owner:** Vikram Indla
- **Approval:** ☐ pending
- **Effective version:** —

---

## CC-CD027-ATOMIC-001 — Transactional cross-write for management actions

- **Change ID:** CC-CD027-ATOMIC-001
- **Requestor:** Claude Code (on behalf of CD-027 slice)
- **Business reason:** Management verbs (e.g. cancel/reschedule/reassign) perform a
  primary write plus a best-effort notification insert as **separate,
  non-transactional** statements (`HANDOFF_BLOCKED_ATOMIC`). A transaction/RPC
  would make the pair all-or-nothing.
- **Source evidence:** `actions.ts` (primary `.update` then separate notification
  insert; nErr surfaced but never rolls back); `notify.ts` best-effort contract.
- **Affected requirements/screens/fields/states/APIs/tests:** SCR-WEB-210; a new
  Postgres function / RPC + migration; `visits`/`assignments`/`notifications`
  writes; RLS re-verification inside the function. Test: partial-failure rollback.
- **⚠ Accepted-behavior conflict (blocks this CR):** the **currently accepted
  contract is "primary commits, notification is best-effort"** (FND-004,
  queued-not-delivered; `notify.ts` "the caller decides… it usually must not [block]").
  Making notify transactional **changes** that contract — a notification failure
  would roll back the user's cancel/reschedule. This is a weakening/altering of
  accepted behavior and needs an explicit sponsor decision to override FND-004,
  plus a migration for the RPC. Claude may **not** self-approve this.
- **MVP1/MVP2 impact:** Reliability change; must not silently drop the honest
  queued-not-delivered surface if the decision keeps notify best-effort.
- **Regression impact:** High — every management verb rerouted through an RPC;
  full re-run of the CD-027 + visit-management suites and RLS checks required.
- **Decision owner:** Vikram Indla
- **Approval:** ☐ pending
- **Effective version:** —

---

## Summary for the sponsor
| CR | Depends on decision | Can Claude close without it? |
|----|--------------------|------------------------------|
| CC-CD027-MAP-001 | DEC-008 provider + DEC-002 geofence values | No — never invent a provider/geofence |
| CC-CD027-ASSIGNMENT-RELEASE-001 | assignment state-machine policy on cancel | No — open product decision, no self-approval |
| CC-CD027-ATOMIC-001 | override of FND-004 best-effort-notify + RPC migration | No — would weaken accepted behavior |

Recommendation: **MAP** is the lowest-risk to authorize once DEC-008/DEC-002 land
(additive, read-only, list stays authoritative). **ASSIGNMENT_RELEASE** and
**ATOMIC** should stay deferred until their product decisions are recorded — the
current behavior is safe and truthful in both cases.
