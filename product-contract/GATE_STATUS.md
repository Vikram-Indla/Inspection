# Gate Status

## Current reconciliation — 2026-07-16

The historical G7–G10 approvals remain preserved below, but their old evidence
counts do not describe the current post-audit checkout. The current acceptance
ledger is **493 rows: 14 verified_live / 460 implemented / 19 partial / 0
missing**. The 19 partial rows are recorded as provider, schema, policy,
configuration, or pending-live-migration boundaries; none is upgraded by
guessing. `TASK-G11-REMEDIATION-001` completed its local engineering exit with
the current inventory at **276 passed / 0 skipped / 0 failed / 0 excluded**:
three authenticated-persona setup tests plus 273 application tests executed in
fresh-browser shards. The prior Arabic/RTL comparison skip was a locale-bound
test-selector defect and now passes live.
CD-041 driven verification is live-verified. **As of 2026-07-16 the three G11
staging migrations are applied and verified live** on `iiozvqntawxfwbgffzqu`
(Management API path): `evidence.evidence_note` column present; CD-028
`reviews_one_open_per_version` partial unique index created (0-duplicate
pre-check); CD-025 `plan.review.scopeReduced` AR string seeded. Arrival-evidence
replay is verified — golden-journey 9/9 PASS incl the P2 inspector arrival
`evidence_note` queue (M04-045). CD-031's independent audit is recorded, but
DEC-012 certification remains withheld because its authoritative wiring map is
absent.

Full-regression note (2026-07-16): a release-candidate run against `main`
(`bbef6f6`, incl CD-025) returned 293/302 in a single-worker **serial** pass on
shared live staging; **every failure passed on isolated re-run** — shared-DB
serial contamination, not code faults. The authoritative 276/276 baseline used
12 fresh shards. CD-025 + the three migrations regressed nothing. Evidence:
`evidence/G11-G12-RELEASE-PREP-2026-07-16.md`.

| Gate | Status | Blocking condition |
|---|---|---|
| G0 Documentation Preservation | PASS | None |
| G1 Repository Discovery | CONDITIONAL PASS | Repository was empty; overlay now installed |
| G2 Canonical Process & Scope Freeze | PASS | None |
| G3 Documentation Determinism | PASS | None |
| G4 Memory / Obsidian / Claude Continuity | PASS | Cloud-verifiable tests all pass; Obsidian desktop screenshot is a non-blocking post-check |
| G5 Architecture / API / Data / Integration | CONDITIONAL PASS (historical approval; repair applied 2026-07-16) | Decisions accepted (DECISIONS_ACCEPTED_2026-07-11.yaml); additive field-arrival repair migration versioned **and applied live** — `evidence.evidence_note` now present in the live schema |
| G6 UI/UX Design Authority | ACCEPTED (2026-07-11) | Astryx D1-D9 coded design authority accepted by sponsor; Mobbin excluded by sponsor instruction |
| G7 Acceptance / Evidence / Test Data | CONDITIONAL PASS (reconciled 2026-07-15) | AC ledger machine-computed over 493 rows (14 verified_live / 460 implemented / 19 partial / 0 missing); 19 partials remain explicitly upstream or pending live migration; B10-EV-001 golden journey + negatives; KSA canonical seed (24 factories, 8 history cycles) |
| G8 Pre-Build Certification | PASS (2026-07-11) | Sponsor authorized; slice evidence B1/B2/B3/B6/B8/B9/B10 captured |
| G9 Build completion | PASS for build (acceptance partials tracked) | Production build compiles; ministry theme; i18n EN/AR + RTL (865 keys, whole-app coverage loop at zero). Current ledger retains 19 partial acceptance rows; build success does not close their upstream boundaries. |
| G10 Verification | CONDITIONAL PASS (hardening rerun 2026-07-16) | Baseline inventory: 276/276 PASS (12 fresh shards), 0 failed/skipped/excluded. CD-041 driven/RBAC-negative/closed-session paths pass. **Arrival evidence column repair applied live and replay-verified 2026-07-16** (golden-journey 9/9, M04-045). Serial-run reds are shared-DB contamination only (all pass isolated). |
| G11 Hardening | OPEN (migration + replay lane closed 2026-07-16) | **Closed:** arrival-evidence repair/replay ✅, CD-028 unique-index live application ✅, CD-025 landed on main ✅. **Remaining:** credential rotation (PAT/secret/demo passwords), Seoul→Frankfurt region decision, provider adapters (video/notifications), CD-031 authoritative wiring map and privacy/preflight decisions, sponsor runtime acceptance |
| G12 Release | OPEN (deploy deferred by sponsor R2, 2026-07-16) | No production hosting target configured (no vercel/netlify/Docker/CI); provider selection not inventable. Runs as local production build. Sponsor deferred deploy; staging is the operating environment. |
