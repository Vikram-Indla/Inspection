# Planning Data and API Mapping

Planning consumes server-side canonical projections. The raw Postman file contains credentials and personal example values and is deliberately not redistributed.

- **CR/unified/name** — source: Senaei task detail / canonical commercial_registrations; use: Single search/display, list, export; role: Contextual/live-synced canonical; guardrail: Never browser-call provider.
- **Licence number/type/status/investment** — source: Senaei task detail / industrial_licenses; use: Target selection, filters, detail; role: Contextual/master canonical; guardrail: One selected licence per visit.
- **Plant number/state** — source: Senaei task detail / plant mapping; use: Plant search and target; role: Contextual/master canonical; guardrail: No CR-only visit when plant target required.
- **Address/city/region/coordinates** — source: Senaei task detail / plant_addresses; use: Map, filters, visit location; role: Master plus visit override; guardrail: Preserve original/current/source.
- **Products/raw materials/machines/spares** — source: Production-line endpoint / canonical line items; use: Bulk product/activity filters, context; role: Canonical synced; guardrail: Pagination and source freshness.
- **Activities/ISIC** — source: Task detail + product activity + Industry Shared when verified; use: Activity filters/display; role: Canonical; contract-unverified if missing; guardrail: Do not infer from names.
- **Employee/workforce** — source: Industry Shared job/workforce/HRSD when verified; use: Employee-count filter/recommendation context; role: CONTRACT_NOT_SUPPLIED until verified; guardrail: Never zero-fill.
- **Contacts** — source: Industry Shared contact list when verified; use: Manual/notification context; role: Permission-sensitive; guardrail: Mask and restrict.
- **Task list/detail** — source: Inspection API; use: Downstream inspector context only; role: Contextual; guardrail: Not Planning create authority.
- **Regulations/packages** — source: Inspection API regulations + local published package versions; use: Package eligibility/preparation; role: Versioned local runtime; guardrail: Zero packages allowed in Planning.
