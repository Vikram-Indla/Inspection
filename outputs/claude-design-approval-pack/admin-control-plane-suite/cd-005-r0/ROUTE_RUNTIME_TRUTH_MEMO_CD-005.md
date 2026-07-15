# CD-005 route and runtime truth memo

## Identity

- Prompt: `CD-005`
- Screen: `SCR-ADM-010`
- Route: `/admin/regulations`
- Persona: Compliance Admin
- Process: `P00`
- Engines: `ENG-01`, `ENG-12`
- Primary requirement: `MVP1-M09-001`
- Supporting configuration requirements: `MVP1-M09-010..015`, `MVP1-M09-028..030`
- Acceptance range: `AC-0449..0478`, filtered to the regulation-library responsibility during design review

## Current composition

The route is one server page with three client controls and three server actions:

- `apps/web/src/app/admin/regulations/page.tsx`
- `apps/web/src/app/admin/regulations/Controls.tsx`
- `apps/web/src/app/admin/regulations/actions.ts`

It reads regulations, nested clauses and mapped inspection-item identifiers. It creates a regulation draft, adds clauses and changes a regulation from `draft` to `published`.

## Proven data

- `regulations`: `id`, `code`, `title`, `issuing_authority`, `status`, `created_at`.
- `regulation_clauses`: `id`, `regulation_id`, `clause_ref`, `title`, `applicability`, `legal_source`.
- `inspection_items.clause_id` proves mapped-item relationships.
- Authenticated users can read configuration tables; Compliance Admin and Form Admin have broad table write policies.
- Audit triggers include `regulations` and other configuration tables.

## Important gaps that must remain visible

1. No direct Admin-family route guard is proven by this route.
2. The database does not store regulation owner, effective dates or a regulation version label on `regulations`.
3. `config_versions` can model regulatory versions, but this route does not read or write it and no exact regulation lifecycle service is proven.
4. Direct publishing is a table update, not a proven validate → submit → approve → publish maker-checker transition.
5. No published-regulation immutability trigger is present; only published package-version immutability is proven.
6. No archive, clone, comparison, deactivation, overlap detector or dependency-validation handler is present.
7. Current impact is only mapped inspection-item identifiers. Package usage, active inspections, violations, reports and future effective-date impact are not queried.
8. Query errors collapse into empty data; a source failure can be misrepresented as zero regulations.
9. Server actions return raw database error messages to the client.
10. Current page combines SCR-ADM-010 library work with SCR-ADM-011 clause editing and publishing.

All unsupported legs are `HANDOFF_BLOCKED`. CD-005 may design their placement and unavailable/blocked semantics, but must not assert they work.

## Ownership boundary with CD-006

CD-005 owns discovery, lifecycle filtering, provenance scanning, impact preview, validation markers and create-draft entry. CD-006 owns regulation detail, clause editing, applicability editing, comparison, review/approval and publishing. The current inline clause editor and direct publish control must be dispositioned carefully; removal requires approval and replacement by a proven detail route.
