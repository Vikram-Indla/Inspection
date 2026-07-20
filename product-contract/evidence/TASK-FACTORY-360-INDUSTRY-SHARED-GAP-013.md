# Factory 360 Industry Shared API gap closure evidence

- Task: `TASK-FACTORY-360-INDUSTRY-SHARED-GAP-013`
- Gate: G11 Factory 360 integration hardening
- Branch: `codex/industry-shared-factory360-gap-013`
- Baseline: `db52854647fa9b4ca8fac362dfecd4ecc7ccf704`
- Requirements: `F360-ISH-REQ-001..018`
- Acceptance: `F360-ISH-AC-001..018`
- Endpoints: `ISH-API-001..011`
- Primary screen: `SCR-WEB-400`; connected consumers: P01, P03, P04, P08, P10, P11

## Source authority and discovery

The sponsor-supplied ZIP SHA-256 is
`212e89c0684cf1b0bc066e0a59d0b4cac0a252639385836155fdad682bf5a7d9`.
`Factory_360_Specification_v2.0.docx` rendered successfully and all nine pages were
visually inspected. The pack supplies the beta host and eleven endpoint paths, but it does
not supply verified HTTP methods, authentication, identifier placement, request schemas,
response schemas, common errors, pagination, privacy handling, or sanitized fixtures.

The beta host redirected to `https://beta-backoffice.industry.sa/login` on the initial
attempt and the user-requested retry. After the user authenticated, the Senaei dashboard and
integration area became available. Authenticated GET method-mismatch probes prove `POST` for
`ISH-API-001..003`, `ISH-API-008`, and `ISH-API-009`. The HRSD integration UI proves only that
its visible inquiry form uses POST and requires a text field labelled `HR Factory`; it does not
prove the `hrsd-labors` API request contract. The plant API path was blocked by the browser
client, and sensitive contact, delegation, and workforce routes were not exercised with real
identifiers. No token, cookie, personal payload, stack trace, or framework version was stored.
No Industry Shared credential variable names or prior repository call sites were found.
The available sanitized API collection belongs to the separate `/api/inspection` Senaei
provider family and was not reused as Industry Shared contract authority.

## Implemented source boundary

- One permanent ledger row exists for each of `ISH-API-001..011`.
- A dedicated server-only Industry Shared provider family is isolated from Senaei.
- Every lead fails before network I/O with
  `INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED`.
- POST is recorded only for the five endpoints proven by authenticated method-mismatch
  responses. Auth, identifiers, bodies, schemas, errors, privacy, retention, masking, and
  fixture values remain explicit discovery requirements rather than inferred defaults.
- Contact, delegation, GOSI, MHRSD, and NIC workforce domains remain distinct.
- `F360-BR-002` one Industrial License equals one Plant is preserved; no conflicting provider
  cardinality is normalized without approved change control.
- Existing Mapbox, Risk, OCR, evidence custody, audit, notification, RLS, offline, immutable
  inspection/report, violation, and penalty behavior is untouched.

No stub is retired and no canonical schema migration is introduced. The exact retirement
preconditions are recorded in
`factory-360/industry-shared/FACTORY360_STUB_RETIREMENT_MATRIX.csv`.

## Verification

- `npm run typecheck`: PASS
- `npm run build`: PASS
- focused Industry Shared static contract: 4/4 PASS
- protected static regression: 135 PASS / 4 intentional live-provider skips / 0 failed
- DOCX rendered review: 9/9 pages inspected
- diff whitespace check: PASS
- remote DDL: not run
- deployment: not run
- main merge: not run
- shared runtime/data mutation: none

## Blocking evidence and exact continuation

All eleven endpoint contracts remain `BLOCKED_EXTERNAL`; five now have method-only evidence.
For each endpoint, continuation requires a sanitized developer contract or an explicitly
authorized synthetic/test identifier and expected outcome that
proves method, authentication mechanism, identifiers and validation, request/response/error
schemas, field types/nullability/cardinality, pagination, bilingual/source metadata,
authority semantics, privacy/masking/retention, and a synthetic fixture checksum.

Exact next action: provide sanitized developer contracts or authorize named synthetic/test
identifiers and expected outcomes for the POST endpoints. The next implementation must verify
one endpoint end to end before adding auth, a request body, parser, canonical mapping, or
migration.

## Approved checkpoint safety verification

The sponsor accepted the partial discovery and explicitly approved pushing the isolated branch
to `https://github.com/Vikram-Indla/Inspection.git`. Before push, the branch was verified as
`codex/industry-shared-factory360-gap-013`, clean at the reported checkpoint history, with
`ef2b794` contained under `810a7a2` before this sanitized continuation record.

- Added/changed filenames contain no environment, cookie, token, credential, HAR, screenshot,
  document, archive, video, or other browser-capture artifact.
- Added content scans contain no private key, JWT, GitHub/OpenAI/AWS key pattern, assigned
  secret, email address, Saudi phone number, or standalone ten-digit real identifier.
- The Industry Shared client contains no `fetch` or other network call and all endpoints remain
  `DISCOVERY_REQUIRED`.
- Contact, delegation, job-workforce, plant-labour, and HRSD domains remain separate.
- `stubs_retired` remains zero; every retirement disposition remains retained/pending/blocked.
- No Supabase migration or Factory 360 page/projection file is changed by this branch.
- Typecheck and production build pass; focused contracts pass 4/4; protected static regression
  passes 135 with four intentional live-provider skips and zero failures.

Exact next action: Verify `POST /shared/api/v2/license-info` end to end using the approved
synthetic beta licence and expected result.
