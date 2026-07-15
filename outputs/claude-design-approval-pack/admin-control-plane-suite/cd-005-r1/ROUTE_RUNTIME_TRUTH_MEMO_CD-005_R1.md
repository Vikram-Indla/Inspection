# ROUTE_RUNTIME_TRUTH_MEMO_CD-005_R1.md
Frozen baseline per cd-005-r0/ROUTE_RUNTIME_TRUTH_MEMO_CD-005.md (2026-07-15). Repository re-inspection was unavailable this session; the supplied memo is used verbatim per PREMIUM_ONE_RETURN_PROTOCOL_V1 — nothing beyond it is claimed. Any future contradiction is HANDOFF_BLOCKED, not a design fact.

## Proven
- regulations(id, code, title, issuing_authority, status, created_at)
- regulation_clauses(id, regulation_id, clause_ref, title, applicability, legal_source)
- inspection_items.clause_id mapped-item relationships
- current route reads regulations with nested clauses + mapped item identifiers in one load
- current actions: create draft regulation; add clause; direct draft→published update
- authenticated configuration reads + Compliance/Form Admin table writes via current RLS
- configuration-table audit triggers include regulations

## Ownership debt (not fixed here, named)
Live page draws inline clause-add and direct publish beside the list — both belong to CD-006's governed detail. This design draws neither.

## Not proven — unavailable/not evaluated/blocked only
regulation owner; effective dates; version label/history; maker-checker lifecycle; published immutability; archive/clone/compare/deactivate; overlap detection; dependency-validation handler; package/active-inspection/violation/report/future-effective impact counts; admin-family route guard; catalogued server-action errors.

## Page law
Unknown ≠ zero: a failed clause→item read renders "impact unknown — not zero" with retry, never an empty rail. Downstream-of-items legs always render "Not evaluated — no verified source". Detail navigation to /admin/regulations/:id is drawn disabled — the route does not exist.
