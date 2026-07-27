# MVP3 Implementation Control

This directory is the lightweight, repository-resident control plane for the sponsor-authorized
MVP3 implementation. It does not duplicate the external BRD or rendered design archives.

## Binding inputs

- `MVP3_84_ROW_MASTER_REGISTER.csv` is the exact 84-row requirement, acceptance and evidence
  register supplied in the approved MVP3 design pack.
- `MVP3_84_ROW_COVERAGE_RECONCILIATION_R2.csv` is the corrected R2 cross-module design
  reconciliation. Both files contain 84 data rows and must remain one-to-one.
- `MVP3_MODULE_BUILD_SEQUENCE.csv` controls implementation order and dependency boundaries.
- `MVP3_PROVIDER_POLICY_HOLDS.csv` prevents external decisions from being silently invented.

## Delivery rule

Every row must end in one honest state: `IMPLEMENTED_EVIDENCED`, `DEPENDENCY_BLOCKED`, or
`NOT_APPLICABLE_WITH_SOURCE_PROOF`. A module cannot be called complete while any row is merely
designed, mocked, hidden, or untested. Existing MVP1/MVP2 routes, data and security contracts are
reused before any additive object is introduced.

## Design authority

The corrected CD-050 through CD-061 R2 packages remain the visual and interaction authority.
Implementation uses the integrated retired predecessor government foundation and authenticated shell already
present in the repository. Design HTML is reference material, not production source code.
