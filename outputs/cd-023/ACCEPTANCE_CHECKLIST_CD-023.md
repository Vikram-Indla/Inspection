# ACCEPTANCE_CHECKLIST_CD-023 (DSG-018, DSG-A11Y-001)

## DSG-018 — immediate dispatch with minimum controls
- [ ] Authority bar shows all 9 protections in every state; none removable
- [ ] Each chip focusable; Enter jumps to owning control; state change announced
- [ ] Urgency limited to the 3 governed enum values; required; audit-stamped
- [ ] Registered/unregistered is an explicit toggle; registered search graded by identifier
- [ ] Exact registered CR match blocks duplicate temporary-entity creation
- [ ] Temporary entity: name required; region + city required (no Riyadh hardcode); flagged + reconciliation note
- [ ] No coordinate prefill; pin-drop or typed pair (both, range-validated); source stated by name/time, no scores
- [ ] Map always paired with text/coordinate equivalent; tiles-down path fully functional
- [ ] Package re-validated at dispatch; retired version returns as named blocker
- [ ] Inspector availability/conflict inline (M01-048); auto-assign default preserved
- [ ] Window: blank = urgent default now->+8h; both-or-neither rule (M01-047)
- [ ] Priority truth-labelled as ungoverned free text
- [ ] Consequence summary names: published visit without plan (M01-050), assignment, audit, queued notification
- [ ] Partial dispatch: step ledger with what-exists/what-failed/retry-safety/duplication answers (3f)
- [ ] Retry never creates a second visit or temp factory; existing-visit discovery reported (state 26)
- [ ] Notification failure shown as "inspector NOT notified"; delivery never claimed
- [ ] Entered work preserved on validation and transport failure
- [ ] Unauthorized: no-data RLS screen; no override path (3e)
- [ ] No red emergency theatre; amber only for degraded truths

## DSG-A11Y-001
- [ ] Document-level RTL; bar mirrors; bdi-isolated identifiers (3g)
- [ ] Keyboard-only dispatch (state 31); first-error focus transfer
- [ ] Assertive: protection changes, validation, step failures; polite: search/availability
- [ ] WCAG AA both themes; glyph+text status
- [ ] >=48px targets; 16px inputs; 420px no overflow (3i); reduced motion honored

## Codex audit legs
- [ ] Assignment-insert result checked before continuing (currently NOT)
- [ ] Region/city capture replaces hardcode
- [ ] Retry idempotence keyed to created ids
- [ ] HANDOFF_BLOCKED resolved or accepted: atomicity RPC; inspector grant; priority enum; reconciliation queue; commit/worktree; R16/R21/R24/R25 library
