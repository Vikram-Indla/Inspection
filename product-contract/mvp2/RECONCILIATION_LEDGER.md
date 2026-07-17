# MVP2 Cross-Module Reconciliation Ledger

Records cross-module contract conflicts surfaced during the MVP2 full-implementation
loop and the canonical resolution taken. Every entry cites the authority relied on.
Entries marked `DB_VALIDATION_PENDING` are correct at the source/contract level but
their runtime SQL behavior is unproven until the Inspection Supabase project
(`iiozvqntawxfwbgffzqu`) is reachable (local-source-certify-now decision).

---

## R-001 — M2-02 semantic-event boundary vs landed M2-05 RPC
- **Modules:** M2-02 (CD-043) producer ↔ M2-05 (CD-031) append boundary.
- **Conflict:** `apps/web/src/lib/workflow/events.ts` targeted a `semantic_events`
  table that does NOT exist. The landed M2-05 migration `20260717150000` exposes the
  canonical boundary as SECURITY DEFINER RPC `append_semantic_audit_event`, which
  accepts only event types registered in `audit_event_registry`, requires a proven
  `source_audit_event_id` (matching actor/object_type/action) with
  `source_system='audit_events'`, and a contracted `(source_object_type, source_action)`
  pair. CD-043's EVENT_CATALOG assumes a general `workflow.*/task.*/sla.*/notification.*`
  envelope with no per-event registry backing.
- **Authority:** Prompt 07 ("generic legacy events remain GENERIC ONLY; never promote
  them to canonical facts without an approved mapping"); CD-043 IMPLEMENTATION note
  ("M2-02 owns no storage/replay; emits through shared M2-05 envelope"); Master
  Controller authority precedence (live repo + landed migration > design catalog).
- **Resolution:** The landed `append_semantic_audit_event` RPC is THE single canonical
  append boundary. Generic workflow transitions stay in the append-only `audit_events`
  stream (already written by the governed-transition audit closure) and are NOT emitted
  as semantic milestones. The adapter now (a) removes the phantom `semantic_events`
  write, (b) emits through the RPC ONLY for events carrying a `milestone` block (a
  registered type + proven `sourceAuditEventId`), (c) returns honest
  `{emitted:false, reason:"not_a_registered_milestone"}` otherwise. No competing event
  architecture is created.
- **Follow-up (separate slices):** wire the genuine M2-02 milestones that ARE in the
  registry — `WorkflowActivated` (REQ-0151), `AssignmentAccepted` (REQ-0155),
  `NoticeIssued` (REQ-0147) — through the RPC at their specific actions, and add the
  matching `audit_event_source_contracts` rows in a forward M2-02 migration.
- **Verification:** typecheck clean; pure-contract spec
  `apps/web/e2e/mvp2-m2-02-events.spec.ts` (static lane) proves arg mapping + honest
  skip. `DB_VALIDATION_PENDING`: RPC acceptance/rejection unproven until remote DB access.
