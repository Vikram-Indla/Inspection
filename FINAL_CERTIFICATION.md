# MIM Inspection Platform MVP1 — Build Certification Report

## 2026-07-16 release-verification addendum

The current authority is `product-contract/evidence/TASK-G11-G12-RELEASE-001.md`.
The reconciled production candidate passes **291/291** checks with no failure,
skip or exclusion; typecheck/build pass; the live arrival-outbox/readback and
CD-028 duplicate-open-review negative pass; and the ledger is **493 rows = 15
verified_live / 460 implemented / 18 partial / 0 missing**. G10 is PASS.

This does **not** supersede the honest release-gap principle below. G11 and G12
remain OPEN because credential rotation, migration-history governance,
provider/region/CD-031 privacy/provider/asset/geographic/sponsor-runtime boundaries and the 18
upstream partials remain, and no production hosting/deployment/rollback target
is configured. The original 2026-07-11 report is preserved below as historical
build certification.

CD-031 continuation on 2026-07-16 removed the stale missing-wiring-map and
preflight blocker: the recovered R3 package is hash-verified, its independent
DEC-012 wiring audit is **PASS**, focused runtime is 18/18, and rollback-only
local/live database probes prove all four write paths, representative activation,
five append-only audit events and Inspector denials with zero residual live rows.
The rebuilt continuation candidate passes **293/293** checks: 4 authenticated
setups + 289 application checks, with no failure, skip or exclusion. The
unsupported privacy/provider rows remain explicit blockers, so this evidence
does not change the G11/G12 OPEN disposition.

**Date:** 2026-07-11 · **Branch:** `setup/g4-memory-continuity` · **Backend:** Supabase `iiozvqntawxfwbgffzqu` (live)
**Status: FUNCTIONAL CORE COMPLETE — all 9 build slices delivered; certified against the evidence contract with the known-gaps register below. READY_FOR_REVIEW, not self-approved.**

## Slice ledger

| Slice | Status | Evidence |
|---|---|---|
| B1 Foundation | ✓ | 30 tables · 5 state-domain enums · 58 RLS policies · 48 triggers · append-only audit — B1-EV-001 (guards attacked live, all held) |
| B2 Admin engines | ✓ | Risk/GIS/Workflow/Access/Packages/Items/Violations screens on live config · governed publish — B2-EV-001 (draft→self-approve-blocked→distinct-approver→immutable) |
| B3 Golden slice | ✓ | Full P01→P12 on production, 4 role-scoped users, config-driven violation chain, v1→return[s1]→v2→approve · B3-EV-001 (3 negatives DB-rejected) |
| B4 Web channel | ✓ | Single wizard (real publish + exact blockers + duplicate guard) · bulk (eligibility flags, atomic publish) · immediate (temp entity, mandatory location) · dossier + lifecycle actions · Factory 360 |
| B5 Field offline | ✓ core | IndexedDB outbox · idempotent replay · explicit conflicts + resolver · live-config geofence check-in · sha-256 at capture · PWA shell/manifest/SW (B8) |
| B6 Virtual | ✓ | Server-side OTP engine (policy from DB; lockout refuses even correct code) — B6-EV-001 · shared handoff into one submission flow |
| B7 Review + Ops | ✓ | Review workspace (read-only render, decision panel, exact return scope, irreversibility) · Operations dashboard (operational-state KPIs, tracking history, actions, notifications) |
| B8 Hardening | ✓ core | Negative permission sweep 6/6 — B8-EV-001 · returned-correction with section locks + next-version resubmit · PWA app-shell |
| B9 Regression | ✓ | 6/6 protected behaviors rerun intact — B9-EV-001 · baseline: 30 tables/58 policies/48 triggers/45 audit events |

## What is DB-enforced (attack-tested, not policy)
Published-config immutability · maker-checker (constraint + approver-required trigger) · post-submit content lock · decided-review immutability · append-only audit (admin connection included) · submission idempotency (409 on replay) · RLS least-privilege (0-row writes for wrong roles, 0 rows anonymous) · OTP lockout/cooldown/expiry server-side.

## Known gaps — honest register (blockers for RELEASE, not for review)
1. **Providers are adapters:** OTP = dev-console (Unifonic at release) · maps = abstraction (GMP key needed) · video session = not integrated · malware scan pending storage config.
2. **Arabic:** RTL-ready layouts + design-system capability; app-chrome i18n dictionaries not yet wired (DEC-004 bilingual scope → content pass).
3. **G7 scenario suite:** evidence files cover critical paths; the full 478-row automated acceptance run (UI+API+E2E per AC row) is the remaining certification volume.
4. **Region:** still Seoul; accepted decision says migrate to eu-central-1 before data load — do it now, data is tiny.
5. **Ops depth:** live map with provider tiles, SLA timer engine (calendar math), alert rules engine — dashboard is live-data but these engines are basic.
6. **Video evidence** (photo/doc done) · notification dispatch (rows created; push/SMS delivery needs provider).
7. **Security hygiene:** rotate the `sbp_` PAT + `sb_secret_` key (both appeared in chat) and the 5 demo user passwords before any external exposure. `main` branch untouched — merge is a human decision.

## Where everything lives
`apps/web` (Next.js app) · `supabase/migrations/0001–0009` (all applied live) · `design/retired-predecessor/` (visual authority, D1–D9) · `product-contract/evidence/B*-EV-*.txt` (all machine-generated against production) · `BUILD_PLAN.md` (slice ledger) · governance updated throughout.
