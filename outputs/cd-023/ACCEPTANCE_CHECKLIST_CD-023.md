# ACCEPTANCE_CHECKLIST_CD-023 (DSG-018, DSG-A11Y-001)

Status reflects the post-audit implementation, not the superseded pre-remediation
design hypotheses. A checked implementation item does not close DEC-012; the
fresh independent Codex audit remains mandatory.

## DSG-018 — immediate dispatch with minimum controls

- [x] Authority bar shows all 9 protections in every state; none removable.
- [x] Each chip is focusable, has glyph+text state, and targets its owning control.
- [x] Accepted D3 urgency values are Complaint received, Incident / accident report,
  Referral from authority, and Other; Other requires Notes justification.
- [x] Server action enforces the urgency set with localized blockers.
- [x] Migration 20260714060935_cd023_urgency_contract.sql enforces the same
  contract for crafted RPC calls without rewriting historical rows.
- [x] Registered/unregistered is explicit; registered search matches CR, Industrial
  License, or name.
- [x] Exact CR/licence reuse blocks duplicate temporary-entity creation.
- [x] Temporary identity accepts any available name/CR/licence/activity; region and
  city are optional; no Riyadh value is invented.
- [x] No coordinate prefill; typed/official pair is range/provenance validated and
  stored on the Visit without changing factory master coordinates.
- [x] Package status is revalidated inside the creation transaction.
- [x] Planner assignment validates role-pool membership and overlap; Inspector
  self-assigns; the write-time overlap constraint prevents races.
- [x] Planner review and explicit ordered window are required; Inspector uses one
  start-now instant. No default duration is invented (DEC-003).
- [x] A published Visit is created directly without a Visit Plan (M01-050).
- [x] Creation is one atomic SECURITY INVOKER RPC; there is no partial-dispatch state.
- [x] Same-request retry is idempotent and cannot duplicate Visit, assignment, or
  notification.
- [x] Planner assignment queues one truthful provider-status notification; Inspector
  self-assignment queues none.
- [x] Entered work is preserved on blockers.
- [x] Non-Planner/non-Inspector receives a localized no-data state and no form.
- [x] Immediate creation and the Inspector handoff's inspection-insert failure never
  show raw provider or database error text.

## DSG-A11Y-001

- [x] Document-level RTL and logical layout; authority bar mirrors.
- [x] Localized Arabic chip labels/details and assertive announcement.
- [x] Glyph+text status avoids color-only meaning.
- [x] Eight EN/AR × dark/light × desktop/narrow frames exist.
- [x] Automated 420px horizontal-overflow assertion exists.

## Verification and governance still open

- [ ] Apply migration 20260714060935_cd023_urgency_contract.sql through linked
  migration history; do not bypass history with Dashboard SQL.
- [ ] Run the complete focused CD-023 suite against that migrated database.
- [ ] Run one coherent complete Playwright regression.
- [ ] Have a separate independent OpenAI Codex reviewer re-audit all 13 wiring-map
  columns per row and record PASS/FAIL/BLOCKED_UPSTREAM.
- [ ] Obtain sponsor runtime acceptance.
