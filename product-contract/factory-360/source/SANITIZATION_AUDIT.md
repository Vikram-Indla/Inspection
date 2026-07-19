# Sanitized API contract audit — 2026-07-20

The supplied report records 69 redactions, while the sanitized JSON contains 65 redaction
marker occurrences. The collection also contains business example identifiers, notes and
timestamps, and broad replacement damaged legitimate external names such as
`administrative_name` and `administrators_number` in descriptive/example text.

Disposition:

- The collection remains in ignored local inputs and is not committed.
- The tracked 11-endpoint and 438-field inventories are the machine-readable discovery
  record; `NoneType` means only that an example was null, not an authoritative field type.
- Wire DTOs preserve a misspelled external field only when independently confirmed by the
  request definition. Canonical DTOs use correctly named internal fields.
- Authentication and GET/POST contradictions remain explicit integration gaps and fail
  closed until `SENAEI_AUTH_MODE` and the production-line method are confirmed.
- No external API was called during this audit.
