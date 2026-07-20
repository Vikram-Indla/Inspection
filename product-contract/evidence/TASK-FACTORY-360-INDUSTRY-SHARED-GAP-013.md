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
integration area became available. The sponsor then explicitly authorized read-only discovery
with existing beta business records. Authenticated GET method-mismatch probes prove `POST` for
`ISH-API-001..005` and `ISH-API-008..010`. The `plants`, `plant-with-labors`, and `hrsd-labors`
routes were blocked by the browser client, so their methods remain unverified.

Read-only inspection covered licence detail and its product, contact and delegated-user
relations; the legacy plant register; the future-factories list; the industrial journey contact
lookup; the English and Arabic activity catalogue; and the HRSD inquiry. The HRSD UI proves one
required text field labelled `HR Factory` and the validation format `xx-xxxxxxx`, but not the
`hrsd-labors` API body. No supplied `/shared/api/v2` call site appears in the visible pages or
Livewire state. The available authenticated browser surface exposes DOM/Livewire state and
console output, but no request-header, request-body or response inspection. UI fields were
therefore recorded only as structural/domain evidence and were not treated as API schemas.
No real value, token, cookie, personal payload, stack trace, or framework version was stored.
No Industry Shared credential variable names or prior repository call sites were found.
The available sanitized API collection belongs to the separate `/api/inspection` Senaei
provider family and was not reused as Industry Shared contract authority.

## Implemented source boundary

- One permanent ledger row exists for each of `ISH-API-001..011`.
- A dedicated server-only Industry Shared provider family is isolated from Senaei.
- Every lead fails before network I/O with
  `INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED`.
- POST is recorded only for the eight endpoints proven by authenticated method-mismatch
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

All eleven endpoint contracts remain `BLOCKED_EXTERNAL`; eight now have method-only evidence
and three remain method-unverified because the browser client blocked the exact route. For each
endpoint, continuation requires a sanitized actual network export or developer contract that
proves method, authentication mechanism, identifiers and validation, request/response/error
schemas, field types/nullability/cardinality, pagination, bilingual/source metadata,
authority semantics, privacy/masking/retention, and a sanitized fixture checksum.

Exact next action: obtain a sanitized actual `POST /shared/api/v2/license-info` request/response
export or developer contract that exposes authentication, content type, exact fields and
schemas, then verify it end to end against the sponsor-authorized beta record. The next
implementation must verify that endpoint before adding auth, a request body, parser, canonical
mapping, or migration.

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

## Sponsor-authorized real-beta continuation safety verification

- The exact licence, CR, plant, business, product, contact and delegation values used at runtime
  were not copied into fixtures, ledgers, logs, screenshots, or committed evidence.
- No mutation control was used. The HRSD inquiry was read-only and returned validation only.
- Product, contact, delegation, plant and bilingual activity UI labels are structural evidence,
  not inferred request/response or canonical schemas.
- The verbose framework-error exposure remains a sanitized security finding; no stack or version
  detail is reproduced.
- Eight POST methods are preserved, three methods remain unknown, all eleven endpoints remain
  `DISCOVERY_REQUIRED`, and `stubs_retired` remains zero.

Exact next action: obtain a sanitized actual `POST /shared/api/v2/license-info` request/response
export or developer contract, then verify it end to end against the authorized beta record.
