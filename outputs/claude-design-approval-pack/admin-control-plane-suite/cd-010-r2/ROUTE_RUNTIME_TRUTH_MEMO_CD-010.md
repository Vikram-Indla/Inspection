# ROUTE_RUNTIME_TRUTH_MEMO — CD-010 (SCR-ADM-040, /admin/violations direct)
- Confirmed: violation_codes(id, UNIQUE code, title, level, optional clause_id, active_from, active_to). createViolationCode requires code+title+level(L1/L2/L3)+clause+active_from.
- active/future/deactivated is DERIVED from active_from/active_to + current date — not a stored status enum.
- Legal basis belongs to the penalty mapping, NOT the violation-code row; trace may show the clause link only.
- Config violation_codes is distinct from runtime 'violations'.
- BLOCKED: violation_codes audit trigger (none), category, applicability, edit, version, deactivate action, usage count, explicit trigger-trace query.
