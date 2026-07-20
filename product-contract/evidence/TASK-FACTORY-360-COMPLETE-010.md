# TASK-FACTORY-360-COMPLETE-010 — Prompt 00 evidence

Date: 2026-07-20 Asia/Riyadh
Gate: G11 Factory 360 v2 controlled implementation
Branch: `codex/factory-360-complete-010`
Starting integration commit: `7f8cd1a`

## Verdict

The additive Factory 360 v2 source slice is implemented and source-verified. It is ready for sponsor functional acceptance and the separately controlled Prompt 02 staging run. This record does not claim live Senaei equivalence, authenticated shared-runtime acceptance, remote DDL, deployment, or production release.

## Source custody

- Execution-pack SHA-256: `4ebd7717dab4866bba5847e8ebd186b933942ddf076a5a08fa326a8155869cc2`.
- All 20 manifest entries verified.
- All nine rendered Word-specification pages were visually inspected.
- The supplied sanitization report claimed 69 redactions while 65 markers were independently observed. Residual business examples and over-redacted field names were recorded in `factory-360/source/SANITIZATION_AUDIT.md`.
- The ZIP, DOCX, HTML, rendered pages, and sanitized JSON remain ignored/local inputs. No source binary or JSON payload is committed.

## Delivered contracts

- CR → Industrial License → existing factory/plant compatibility hierarchy; no legacy factory ID or route is removed.
- CR-centred read-only dossier with selected-license context, CR portfolio facts, license/plant industrial data, approved inspection reports, approved-snapshot compliance, existing Risk Engine history/explanation, government records, source/provenance, five separated media categories, documents/OCR linkage, violation/action lineage, permission-bound planning/export, and truthful unavailable states.
- Global search extends to CR, unified number, Arabic/English legal name, license, and plant identifiers while retaining legacy factory results.
- Administration `/admin/integrations/factory-data` control plane with strict 2 MiB/5,000-row CSV custody, allow-listed headers, SHA-256 source custody, rejected-row history, and reconciliation staging. Imported rows never write source-of-truth hierarchy tables directly.
- Typed server-only Senaei boundary for every documented endpoint. HTTPS/host/method/path allow-lists, response and timeout bounds, GET-only retry, explicit auth modes, multipart protection, wire-schema isolation, and `SENAEI_API_CONTRACT_NOT_SUPPLIED` fail-closed stubs are enforced.
- Fine-grained permissions: `view_factory_360`, `view_factory_documents`, `download_factory_documents`, `view_risk_details`, `export_factory`, and `create_inspection`.
- Additive PostgreSQL schema for synchronization custody, raw immutable snapshots, normalized hierarchy, versioned production-line data, immutable submission-linked factory snapshots, government records, media taxonomy, reconciliation, RLS, audit, and immutable external identifiers.

## Verification

- `npm run typecheck`: PASS.
- Focused Factory 360/Senaei static contracts: 20/20 PASS.
- Protected static inventory: 131 PASS, 4 intentional live-provider skips, 0 failed (135 total).
- `npm run build`: PASS; `/factories/cr/[id]` and `/admin/integrations/factory-data` are production-bundled.
- PostgreSQL 16: migration compile PASS; immediate replay PASS; date-order negative PASS; `0032_factory360_v2_foundation_contract.sql` returned `FACTORY360_V2_FOUNDATION_CONTRACT_PASS` and rolled back fixtures.
- `git diff --check`: PASS.
- CSV ledgers remain BOM-free, rectangular, and count to master 90, acceptance 36, journeys 20, preservation 11, integration gaps 14, data dictionary 87, endpoints 11, and fields 438.

## Preserved boundaries

Existing Mapbox/spatial history, Risk Engine records, immutable submissions/reports, violation/action/review/penalty lineage, evidence custody, advisory OCR, audit, notification, RLS, offline behavior, legacy factory route, and existing Administration write capabilities remain present. Factory 360 contains no direct edit control, no CR-level risk/compliance calculation, and no mixing of official/profile media with inspection evidence.

## Honest blockers

- `F360-AC-012`: live industrial equivalence to Senaei cannot be certified without an approved base URL/auth resolution, credentials, and controlled connectivity.
- `F360-AC-013`: incentives/services and related government domains have no supplied endpoint contract; the UI and adapter remain explicitly unavailable.
- The 14 integration-gap rows are `BLOCKED_EXTERNAL`; undocumented domains, contradictory production-line method/auth/base URL details, nullability, and over-redacted wire fields were not guessed.
- Open-violation and active-penalty CR portfolio counts remain Not Available because current runtime records do not expose the governed state semantics required to calculate them safely.
- Qualified native-Arabic review and authenticated sponsor runtime acceptance remain human gates.
- Prompt 02 must apply the migration and exercise controlled live provider/partial-failure journeys. Prompt 00 performed no remote DDL or deployment.

## Resume

Run Prompt 02 from this pushed branch. Reconcile migration history before applying DDL; configure only approved Senaei contract values; execute authenticated CR/license/plant, permission-negative, partial-provider-failure, import/reconciliation, signed-document, export, and Arabic/RTL journeys; then update the two blocked acceptance rows only from captured evidence.
