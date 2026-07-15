# Codex Wiring Audit Checklist — CD-0XX design-to-code slices

Authority: satisfies precondition (2) of every `CLAUDE_CODE_MCP_PROMPT_CD-0XX.md`
("confirm the independent Codex wiring audit of `outputs/cd-0XX/WIRING_MAP_CD-0XX.csv`
is recorded"). Resolved by DEC-012 (`governance/decision_register.csv`): sponsor
session-direction does NOT substitute for this audit. No CD-0XX slice may be marked
complete/closed/sponsor-runtime-accepted without a recorded pass of this checklist.

## Who runs this

An independent reviewer (Codex), not the agent that authored the design package or
wrote the implementation code. If the same agent that implemented the slice also
"audits" its own wiring map, that is not an independent audit — record it as such
and do not count it against this gate.

## Inputs

- `outputs/cd-0XX/WIRING_MAP_CD-0XX.csv` (the claims under audit)
- `outputs/cd-0XX/IMPLEMENTATION_MANIFEST_CD-0XX.yaml` (declared file_changes/scope)
- The actual runtime files in the manifest's `file_changes` (current state on the
  implementation branch, not the design package's "before" description)
- `product-contract/domain/state_transitions.csv`, `governance/error_catalogue.csv`,
  `domain/rbac_matrix.csv` (ground truth for transitions/errors/roles)

## Per-row verification (repeat for every row in the wiring map)

For each `ui_trigger` row, check its 13 columns against the actual code, not against
the design package's description of the code:

1. **client_component** — the named component/file exists at the claimed path and
   actually renders/handles this trigger.
2. **server_action** — the named server action/route exists and is reachable from
   that client trigger (not orphaned, not dead code).
3. **validation_guard** — the stated guard is actually enforced server-side (not
   client-only). If the row claims a requirement ID (e.g. "M01-046"), the guard
   must block on that requirement, not merely reference it in a comment.
4. **canonical_transition** — if non-"none", the code calls the actual transition
   defined in `state_transitions.csv` — never a direct status column write.
5. **table_rpc_storage** — the named tables/RPCs are the ones actually touched;
   flag any table write the row does not disclose.
6. **rls_grant_role** — confirm the query/write path is RLS-scoped through the
   normal client (no service-role key, no RLS bypass) unless the row explicitly
   and correctly says otherwise for a documented reason.
7. **audit_event** — if claimed, an audit row is actually inserted (append-only,
   never updated/deleted) for this action.
8. **notification_side_effect** — if claimed, verify the copy/state used is
   truthful (e.g. "queued" language only where delivery is genuinely unconfirmed —
   never "delivered" without delivery proof).
9. **success_result** — reproduce it; confirm the UI actually reaches the stated
   end state on the happy path.
10. **negative_partial_result** — force the failure (bad input, forced write
    failure, RLS denial, etc.) and confirm the UI reaches the stated state, not a
    raw stack trace / provider error string in the DOM.
11. **automated_test** — if the cell says anything other than `proposed`, a test
    with that description actually exists in the repo and passes. A cell reading
    `proposed` is a gap, not a pass — do not let a slice close with a wiring row
    still marked `proposed` unless it is formally deferred with a decision ID.
12. **runtime_evidence** — this column is the design researcher's own code-read,
    not evidence for this audit. Do not accept it as a substitute for checks 1-11;
    re-derive the evidence yourself from the current runtime code.
13. **HANDOFF_BLOCKED rows** — confirm the row is genuinely undecided upstream
    (no invented policy/threshold/role snuck in to close it) and that the code
    truthfully reflects the blocked state (e.g. shows "not available" rather than
    fabricating a value).

## Cross-cutting checks (whole slice, not row-by-row)

- No invented policy values, thresholds, SLAs, roles, or provider behavior anywhere
  in the diff (grep the diff for new literals that look like thresholds/limits).
- RLS is the only authorization boundary exercised — no client-side-only gate that
  isn't re-checked server-side.
- Atomicity claims are truthful: if the manifest/handoff says atomicity is
  `HANDOFF_BLOCKED`, the shipped code must show a truthful step-ledger, not a
  comment claiming atomicity that isn't backed by a transaction/RPC.
- Raw provider/DB error text (`e.message`, stack traces, SQL errors) never reaches
  the DOM — confirm against `error_catalogue.csv` mappings.
- Retry paths (if claimed) are actually idempotent — re-run a forced-failure retry
  and confirm no duplicate row is created.
- Non-color-only status communication (glyph + text, not color alone) where the
  slice's acceptance IDs require it (e.g. FND-011).
- Nothing in `removals` was actually removed unless a separate human approval for
  that removal is recorded.

## Recording the result (this is what makes it "recorded" per precondition 2)

Append one row per wiring-map row (or one summary block, reviewer's choice) to
either:
- `outputs/cd-0XX/WIRING_MAP_CD-0XX.csv` as new columns
  (`codex_audit_verdict`, `codex_audit_date`, `codex_audit_reviewer`, `codex_audit_notes`), or
- a companion file `product-contract/evidence/screens/<slice>/CODEX_AUDIT_CD-0XX.md`
  with the same fields per row.

Required fields per row/finding:

| field | value |
|---|---|
| reviewer | who ran the audit (name/handle, not "self") |
| date | ISO date |
| verdict | PASS / FAIL / BLOCKED_UPSTREAM |
| evidence | how it was checked (file:line, test run, forced-failure repro) |

A slice's Codex audit is only "recorded" once every row has a verdict and the file
exists in the repo. A CSV where every `automated_test` cell says `proposed` and
every `runtime_evidence` cell is a self-read is NOT a recorded audit — that is the
exact gap DEC-012 flagged for CD-021/022/023.

## Verdict rollup

- **PASS** — slice may be marked complete pending only sponsor runtime acceptance.
- **FAIL** — list the failing rows; slice returns to implementation, not closure.
- **BLOCKED_UPSTREAM** — row depends on an unresolved decision (e.g. another
  DEC-0XX); slice may still close if the row was already correctly marked
  `HANDOFF_BLOCKED` in the manifest and the code reflects that truthfully.
