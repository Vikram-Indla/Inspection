# Admin Control Plane (CD-004 → CD-011) — Vertical Slice Evidence

- **Date:** 2026-07-15
- **Branch:** `feat/admin-control-plane` (never touched `main`)
- **Authorization:** DEC-ADMIN-CP-001 (sponsor Vikram Indla) — see
  `product-contract/governance/DEC-ADMIN-CONTROL-PLANE-AUTH.md`.
- **Governing brief:** `implementation-prompts/CLAUDE_CODE_MCP_PROMPT_CD-004_TO_CD-011_CONSOLIDATED.md`
- **Binding truth:** `CD006_CD011_CORRECTION_SOURCE_TRUTH_2026-07-15.md` + per-CD r2 packs.

## Status by CD

| CD | Screen | Route (logical mode) | Impl | Evidence |
|----|--------|----------------------|------|----------|
| CD-004 | SCR-ADM-001 | `/admin` | ✅ pre-existing R2 | e2e `cd-004-admin-control-plane-home.spec.ts` + AR `20260715090000_cd004_ar_strings.sql` |
| CD-005 | SCR-ADM-010 | `/admin/regulations` (list) | ✅ R2 uplift | e2e `cd-005-006-regulations.spec.ts` + AR `20260715100000` |
| CD-006 | SCR-ADM-011 | `/admin/regulations?id=` (detail) | ✅ R2 uplift | same as CD-005 |
| CD-007 | SCR-ADM-020 | `/admin/items` | ✅ R2 uplift | e2e `cd-007-items.spec.ts` + AR `20260715101000` |
| CD-008 | SCR-ADM-030 | `/admin/packages` | ✅ pre-existing R2 | e2e `cd-008-009-packages.spec.ts` + AR `20260715103000` |
| CD-009 | SCR-ADM-031 | `/admin/packages` (designer) | ✅ pre-existing R2 | same as CD-008 |
| CD-010 | SCR-ADM-040 | `/admin/violations` | ✅ R2 uplift | e2e `cd-010-011-violations.spec.ts` + AR `20260715102000` |
| CD-011 | SCR-ADM-041 | `/admin/violations?mode=penalty` | ✅ R2 uplift | same as CD-010 |

## Verification (deployment gate)
- `npx tsc --noEmit` → **TypeScript: No errors found**.
- `npx next build` → **Errors: 0** (2 pre-existing lint warnings, unrelated to this vertical).
- Color-law scan across `apps/web/src/app/admin/` → **clean** (no hex/rgb/hsl/named/Tailwind colors; ADS tokens only).
- No new live contract routes created (`/admin/regulations/:id`, `/admin/packages/:id/designer`, `/admin/penalties` remain logical modes, never live URLs; verified no `[id]` / `penalties` folders).
- No frozen files touched (Shell, ShellClient, shell-navigation, tokens.css, astryx.css, i18n.ts).
- No `audit_events` writes introduced; no invented tables/columns/RPCs/roles/values.

## Truth-over-completion legs (rendered as disabled HANDOFF_BLOCKED targets — NOT working controls)
- **Admin-family route guard** (all CDs) — owner: platform. UI relies on RLS write-grant; guard disclosed, not invented.
- **Regulations:** validated publish (mapped-clause + maker-checker + published lock), version compare/lineage/supersede, dependency engine, audit timeline for compliance/form admin, dedicated detail route.
- **Items:** item edit/version, deactivation-reason capture, item-row audit trigger (does not exist), per-item published-use count (rendered `unavailable`, never fabricated), conditional-rule authoring.
- **Packages/Designer:** item reorder, condition authoring, per-item rules, scoring toggle, evidence-model editor, action-form authoring, simulation engine, circular-condition detector.
- **Violations:** category, applicability, edit, version, deactivate action, usage count, trigger-trace, `violation_codes` audit trigger (does not exist).
- **Penalty:** effective periods, overlap/gap engine, cardinality > 1:1, submit/approve/publish lifecycle, penalty maker-checker, mapping immutability, mapping audit trigger.

## Parked — require separate sponsor go (irreversible / external)
- Push / merge to `main`.
- Apply the 4 new `ui_strings` AR migrations to the live Supabase project (`iiozvqntawxfwbgffzqu`). **Until applied, Arabic labels fall back to English at runtime.**
- Supabase MCP auth (needed for live migration apply + advisor checks).
- Cloud deployment.
- Playwright e2e specs were authored + parse-verified but **not executed** (need a running app + seeded DB).

## Localization note
CD-005/006 introduced ~50 new keys; authored Arabic existed only for the CD-005 register/rail subset. The remainder were seeded `status='draft'` and marked `(machine)` in the migration `context` column — human review gates promotion to `reviewed`. CD-007/008/009/010/011 keys were seeded EN+AR (faithful MSA for labels; identifiers/tokens/placeholders kept verbatim).
