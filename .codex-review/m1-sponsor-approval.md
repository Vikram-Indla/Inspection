# M1 Dashboard — Sponsor Direction and Preparation Record

## Sponsor authority

- Decision date: 2026-07-24
- Sponsor responses: `approved`; `Please proceed`; `consider all approvals given`
- Approved operating mandate:
  - accept F0 as the working Web/Admin shell baseline;
  - proceed to M1 Dashboard using design challenge, independent mapping,
    bounded wiring, tests, and real-browser proof;
  - continue the same evidence-based cycle module by module;
  - run the complete design-to-code, seeding, QA, critic and real-browser
    correction loop until the module is ready for final acceptance;
  - return to the sponsor only for a genuinely missing external business
    contract, destructive expansion, or final module acceptance.

## Approved business defaults

- Dashboard is not a Field Inspector destination.
- Missing governed risk information is shown as unavailable/not configured.
- Partial source failure is shown as partial/degraded, never fully live.
- Blocked contractual content remains visible and is not removed.
- No targets, thresholds, formulas, policies, backend fields, workflow states,
  or production values may be invented.

## Role-authority reconciliation

The sponsor direction names Operations, management, and authorised
administrators. Existing repository authorities conflict:

- one design/business contract limits M1 to Operations and Leadership;
- another later reconciliation record permits a broader business-role set;
- the active route currently uses `BUSINESS_ROLE_KEYS`.

No role access will be widened under this preparation record. Claude Design
must identify the conflict, and the implementation lease must bind the final
role matrix through recorded change control before route or RBAC behavior is
changed.

## Current gate

- F0 candidate baseline: `c8bdf6d1`
- M1 branch: `codex/m1-dashboard-reconciliation`
- Claude Design immutable revision metadata: pending evidence capture in
  parallel; sponsor authorized bounded M1 implementation from the currently
  observed M1 design plus registered design sources.
- Independent repository audits: complete
- Product-code modification: opened under the exact M1 lease in
  `product-contract/execution/CURRENT_SLICE.yaml`
- Backend/API/schema modification: prohibited
- Cutover/merge/push/deploy: prohibited
