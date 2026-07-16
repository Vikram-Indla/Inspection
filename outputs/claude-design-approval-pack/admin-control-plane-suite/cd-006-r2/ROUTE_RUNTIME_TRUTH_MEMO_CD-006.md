# ROUTE_RUNTIME_TRUTH_MEMO — CD-006 (SCR-ADM-011)
- Contract route /admin/regulations/:id NOT implemented; detail is a logical mode of /admin/regulations.
- Proven reads: regulations(code,title,issuing_authority,status,created_at); regulation_clauses(id,regulation_id,clause_ref,title,applicability,legal_source); inspection_items.clause_id.
- Proven actions: createRegulation(draft); addClause(+optional legal_source); publishRegulation DIRECT draft->published (no validation).
- Audit: regulations row only (generic trigger); clause changes NOT audited; audit_events read NOT granted to compliance_admin/form_admin -> writer-persona timeline HANDOFF_BLOCKED.
- Persona: Compliance Admin + Reviewer.
- BLOCKED: mapped-clause publish validation, submit/approve, maker-checker, published immutability lock, version compare/lineage/supersede, dependency engine, dedicated detail route, route guard.
