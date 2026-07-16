# Codex field-handoff remediation — 2026-07-15

## Findings closed

- **MVP1-M03-005 / AC-0103:** the inspector calendar now supports a real
  drag gesture. Dropping a visit on another calendar day preserves its existing
  time-of-day and duration and calls the planner-owned
  `request_visit_reschedule` RPC. The visit is not moved optimistically; the
  result is surfaced as sent or failed.
- **MVP1-M03-006 / AC-0104:** the Startup return form is rendered and calls the
  guarded `request_visit_return` RPC.
- **MVP1-M04-050..054 / AC-0163..0167:** after an inside-fence check-in,
  Startup renders an arrival confirmation, Factory and Visit context cards,
  journey timestamp/progress/coordinates/accuracy/duration/distance summary,
  and native expandable details controls.
- **MVP1-M04-056..058 / AC-0169..0171:** the inspector cancellation form,
  governed reason selector, optional evidence queue and neutral failure path
  are rendered and wired; planner/ops remain owners of the actual cancellation.

## Arrival evidence follow-up

MVP1-M04-045 / AC-0158 now has a photo/comment capture surface and a
visit-linked offline outbox path. Forward migration
`20260715180000_field_arrival_evidence.sql` adds the contract's `arrival`
link value and an evidence note column. A read-only probe on 2026-07-15 found
the `arrival` enum live but `evidence.evidence_note` absent, so the migration
is only partially reflected in the shared project. The forward idempotent repair
`20260715193000_field_arrival_evidence_column_repair.sql` adds the missing
column. This remains partial until the repair is applied live and an
online/offline replay is verified.

The inspection workspace now also reads additive `visit_id` evidence and
merges it with inspection-linked evidence, so arrival/cancellation evidence
remains visible after the inspection row is created. The read is tolerant of
older schemas and logs a server-side diagnostic without exposing provider text
to the operator. Arrival completion is fail-closed: the UI does not mark the
inspector arrived until the immutable arrival geo event is persisted.

## Verification

- `npm run typecheck` — PASS
- `npm run build` — PASS
- Focused CD-023 field-handoff source checks — **7/7 PASS** (three auth setup
  cases plus drag-reschedule, arrival-handoff and visit-linked migration proofs)
- `git diff --check` — PASS

Remaining partial rows are tracked in `evidence/AC_LEDGER.csv`; provider,
source-schema, route-policy and live-migration boundaries are not represented
as completed by this remediation.
