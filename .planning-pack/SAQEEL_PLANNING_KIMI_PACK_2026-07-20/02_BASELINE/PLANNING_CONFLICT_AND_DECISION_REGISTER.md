# Planning Conflict and Decision Register

The CSV beside this file is the execution ledger. Every conflict must be re-verified against the latest branch and either remediated or evidenced as no longer applicable.

## PLN-CON-001 — Planning landing

- **Business authority:** Detailed spec says nav opens Planning Visit List
- **Current conflict:** /planning currently opens method cards
- **Resolution:** Make /planning canonical list + Create Visit method drawer/section; preserve /visits alias and existing routes
- **Priority:** P0

## PLN-CON-002 — Roles

- **Business authority:** Business asks Admin/Inspector as explicit roles and no ops role
- **Current conflict:** Routes/RLS depend on planner/ops/reviewer/leadership and six admin roles
- **Resolution:** Introduce Admin/Inspector flags + default business-staff capabilities; retain legacy role aliases during migration
- **Priority:** P0

## PLN-CON-003 — Package optionality

- **Business authority:** Package optional in planning; inspector selects later
- **Current conflict:** Planning home and journeys block when package missing; one package only
- **Resolution:** Allow zero-many package versions; preparation resolves when zero; preserve selected immutable versions
- **Priority:** P0

## PLN-CON-004 — Single target

- **Business authority:** Must search CR/licence/plant and select licence/plant under multi-licence CR
- **Current conflict:** Current search uses local factory rows and no plant; may continue against CR
- **Resolution:** Use canonical CR/licence/plant resolver; require plant/licence selection where required
- **Priority:** P0

## PLN-CON-005 — Immediate

- **Business authority:** Detailed document emphasizes Single/Bulk
- **Current conflict:** Existing BRD/code has Immediate and user forbids deletion
- **Resolution:** Preserve Immediate as additive exception and upgrade to detailed manual/provenance rules
- **Priority:** P0

## PLN-CON-006 — Bulk criteria

- **Business authority:** Full 14+ criteria/operators/AND-OR groups
- **Current conflict:** Current 4 fields and is/is-not only
- **Resolution:** Expand typed criteria dictionary/evaluator/query plan; keep nested tree security caps
- **Priority:** P0

## PLN-CON-007 — Bulk invalid rows

- **Business authority:** One invalid target must not block valid targets
- **Current conflict:** Current publish narrative emphasizes all-or-nothing
- **Resolution:** Partition eligible/ineligible before publish; atomically commit sponsor-confirmed eligible subset
- **Priority:** P0

## PLN-CON-008 — Drafts

- **Business authority:** Server-persisted resumable drafts required
- **Current conflict:** Bulk selection is sessionStorage; home says resume unavailable
- **Resolution:** Persist criteria, selection, config, assignment and validation as visit_plan draft with autosave/version
- **Priority:** P0

## PLN-CON-009 — Assignment

- **Business authority:** Region/workload/availability recommendation and bulk distribution
- **Current conflict:** Current first-available and preview overlap; skills/capacity not evaluated; auto conflict gap
- **Resolution:** Implement deterministic engine and in-transaction concurrency/overlap guard; named unavailable evidence
- **Priority:** P0

## PLN-CON-010 — Configuration

- **Business authority:** Visit type/mode/priority/zero-many package/attachments/etc
- **Current conflict:** Bulk fixed periodic/physical/one package; priority incomplete
- **Resolution:** Admin lookups + complete shared configuration model
- **Priority:** P0

## PLN-CON-011 — Return data

- **Business authority:** Dedicated reason/comments/history
- **Current conflict:** Reason encoded in notes prefix in detail
- **Resolution:** Normalize return cycles while backfilling legacy display
- **Priority:** P0

## PLN-CON-012 — Expiry

- **Business authority:** Multiple configurable expiry rules/reasons
- **Current conflict:** One fixed scheduled condition
- **Resolution:** Versioned expiry rules and scheduled evaluator; preserve current cron foundation
- **Priority:** P0

## PLN-CON-013 — Admin access

- **Business authority:** Admin must manage statuses/roles/lookups
- **Current conflict:** Access page read-only; workflow JSON-oriented
- **Resolution:** Build audited grant/revoke and Planning control-plane forms over existing engines
- **Priority:** P0

## PLN-CON-014 — Planning list

- **Business authority:** Full columns/search/filter/export/session continuity
- **Current conflict:** /visits is partial and client-limited
- **Resolution:** Canonical server-side list query, full filters, export and state persistence
- **Priority:** P0

## PLN-CON-015 — Manual factory

- **Business authority:** Mandatory eligibility, reason, region/city/pin/contact conditions
- **Current conflict:** Immediate manual fields are more permissive and no full attachment/reason contract
- **Resolution:** Implement eligibility engine and complete manual fields
- **Priority:** P0

## PLN-CON-016 — Location

- **Business authority:** Original/current/source/actor/history required
- **Current conflict:** Current pins exist but full history contract must be confirmed
- **Resolution:** Add visit-location versions/provenance; never overwrite master
- **Priority:** P0

## PLN-CON-017 — Visible statuses

- **Business authority:** User tabs Draft/Published/Returned/Cancelled/Expired
- **Current conflict:** Internal validated state exists
- **Resolution:** Retain internal validated; map to documented user statuses
- **Priority:** P1

## PLN-CON-018 — Draft delete/cancel

- **Business authority:** Source contains both delete and cancel wording
- **Current conflict:** Potential semantic ambiguity
- **Resolution:** Discard/soft-delete incomplete draft; Cancel only durable lifecycle decision, both audited
- **Priority:** P1

## PLN-CON-019 — Provider fields

- **Business authority:** Employee/workforce/contact filters expected
- **Current conflict:** Industry Shared contracts incomplete
- **Resolution:** Disable/surface contract-not-supplied; never fake zero or silently ignore
- **Priority:** P0

## PLN-CON-020 — Dashboard counts

- **Business authority:** Planning contributes to dashboard and downstream
- **Current conflict:** Potential duplicate page-specific counts
- **Resolution:** One canonical view/query contract for list/KPIs/dashboard/operations
- **Priority:** P0
