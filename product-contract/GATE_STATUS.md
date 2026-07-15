# Gate Status

## Current reconciliation — 2026-07-15

The historical G7–G10 approvals remain preserved below, but their old evidence
counts do not describe the current post-audit checkout. The current acceptance
ledger is **493 rows: 14 verified_live / 460 implemented / 19 partial / 0
missing**. The 19 partial rows are recorded as provider, schema, policy,
configuration, or pending-live-migration boundaries; none is upgraded by
guessing. The latest complete no-exclusion run reached **207 passed / 1 skipped
/ 0 failed** across 208 discovered tests. The one skipped case is the expected
data-dependent Arabic/RTL comparison case; no product or environmental failure
was recorded in this run.
CD-041 driven verification is live-verified. The arrival enum is live, but the
`evidence.evidence_note` column is not, so the forward repair migration and
replay verification remain open. The CD-028 one-open-review partial unique index
is versioned and source-verified but not live-applied. CD-031's independent audit is recorded, but
DEC-012 certification remains withheld because its authoritative wiring map is
absent.

| Gate | Status | Blocking condition |
|---|---|---|
| G0 Documentation Preservation | PASS | None |
| G1 Repository Discovery | CONDITIONAL PASS | Repository was empty; overlay now installed |
| G2 Canonical Process & Scope Freeze | PASS | None |
| G3 Documentation Determinism | PASS | None |
| G4 Memory / Obsidian / Claude Continuity | PASS | Cloud-verifiable tests all pass; Obsidian desktop screenshot is a non-blocking post-check |
| G5 Architecture / API / Data / Integration | CONDITIONAL PASS (historical approval; current repair pending) | Decisions accepted (DECISIONS_ACCEPTED_2026-07-11.yaml); additive field-arrival repair migration is versioned but `evidence.evidence_note` is absent from the current live schema |
| G6 UI/UX Design Authority | ACCEPTED (2026-07-11) | Astryx D1-D9 coded design authority accepted by sponsor; Mobbin excluded by sponsor instruction |
| G7 Acceptance / Evidence / Test Data | CONDITIONAL PASS (reconciled 2026-07-15) | AC ledger machine-computed over 493 rows (14 verified_live / 460 implemented / 19 partial / 0 missing); 19 partials remain explicitly upstream or pending live migration; B10-EV-001 golden journey + negatives; KSA canonical seed (24 factories, 8 history cycles) |
| G8 Pre-Build Certification | PASS (2026-07-11) | Sponsor authorized; slice evidence B1/B2/B3/B6/B8/B9/B10 captured |
| G9 Build completion | PASS for build (acceptance partials tracked) | Production build compiles; ministry theme; i18n EN/AR + RTL (865 keys, whole-app coverage loop at zero). Current ledger retains 19 partial acceptance rows; build success does not close their upstream boundaries. |
| G10 Verification | CONDITIONAL PASS (hardening rerun 2026-07-15) | Fresh no-exclusion Playwright run: 207 passed / 1 skipped / 0 failed across 208 tests. CD-041 driven/RBAC-negative/closed-session paths pass. Arrival evidence column repair remains unapplied and replay-unverified. |
| G11 Hardening | OPEN | Credential rotation (PAT/secret/demo passwords), Seoul→Frankfurt region decision, provider adapters (video/notifications), arrival-evidence repair/replay, CD-028 unique-index live application, CD-031 authoritative wiring map and privacy/preflight decisions, sponsor runtime acceptance |
| G12 Release | OPEN | No production hosting/deploy yet; runs as local production build |
