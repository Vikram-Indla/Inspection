# Factory 360 source handling

The checksum-verified execution pack is held locally at
`.local-inputs/factory-360/SAQEEL_FACTORY_360_CODEX_EXECUTION_PACK_2026-07-20/`
and is excluded from Git.

This directory retains only safe operational authority: endpoint/field inventories,
sponsor direction, authority order, sanitization reports and source checksums. The
sanitized Postman collection itself stays local because a second audit found remaining
business examples and over-redacted canonical field names.
The Word specification and HTML design reference remain local/external documents under
the repository documentation-storage policy. Their requirements and acceptance outcomes
are represented in the tracked Factory 360 ledgers.

Original secret-bearing API collections are prohibited. Provider credentials belong only
in approved secure environment or keychain configuration and must never be logged.

Runtime DTOs must be authored from verified endpoint documentation and the tracked field
inventory, never generated blindly from redacted example values.
