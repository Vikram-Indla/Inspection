# Independent Codex wiring audit — CD-031 / SCR-WEB-400

Date: 2026-07-15  
Repository: `Vikram-Indla/Inspection`  
Branch: `setup/Inspection` (dirty; concurrent work preserved)  
Auditor: Codex (independent of the CD-031 implementation session)

## Verdict

**BLOCKED_UPSTREAM — authoritative `WIRING_MAP_CD-031.csv` is not present in this checkout.**

The requested row-by-row audit cannot truthfully be certified against that map until the
design handoff supplies it. The repository contains `apps/web/e2e/cd-031-factory-360.spec.ts`,
`outputs/cd-031-r3/` (design HTML only), and the CD-031 design-review/correction prompts, but
no `WIRING_MAP_CD-031.csv` under the repository or sibling GitHub workspaces. I did not
reconstruct or invent the missing authoritative map.

The supplemental table below audits the legs named by the existing CD-031 runtime spec and
design review. It is evidence of current wiring only; it is **not** a substitute for the
missing map or for sponsor/runtime acceptance.

## Evidence run

| Check | Result |
|---|---|
| `npm run typecheck` | PASS (verified in the same continuation) |
| `npm run build` | PASS (production build after review-workspace fixes) |
| `cd-031-factory-360.spec.ts` | **15/15 PASS** after the neutral-error remediation; source/runtime assertions cover the corrected paths |
| CD-004 focused regression | **18/18 PASS** after the existing guarded Arabic seed was applied live; the prior audit-era Arabic failure is closed |
| CD-028 focused regression | **13/13 PASS** after the shared-live row-selection assertion was hardened |
| CD-022 focused regression | **13/13 PASS** after deterministic newest-first factory search and unique live-fixture term |
| Complete no-exclusion Playwright regression | Prior baseline was 182 passed, 2 failed, 1 skipped; the two failures were CD-004 live Arabic seed and a shared-live CD-028 row-selection fixture, now each closed in focused reruns. A fresh full run remains the final regression check. |
| Design preflight | R2 review recorded two P1 corrections; R3 contains a design HTML artifact, but no authoritative wiring map or machine-readable hash/preflight companion was found |

## Supplemental leg disposition (derived, non-authoritative)

| Leg | Current evidence | Disposition |
|---|---|---|
| 1 | `/factories/:id` reads factory identity and renders the dossier; live planner navigation is covered by the CD-031 spec | PASS (supplemental) |
| 2 | Source/provenance and `source_synced_at` are displayed; no freshness threshold is invented | PASS (supplemental) |
| 3 | Current `risk_score`, `risk_band`, and `risk_version` are source-read and labelled | PASS (supplemental) |
| 4 | Risk-driver breakdown is explicitly `HANDOFF_BLOCKED_RISK_DRIVERS` | HANDOFF_BLOCKED |
| 4b | Risk-version history is explicitly unavailable; only current `risk_version` is queried | HANDOFF_BLOCKED |
| 4c | Evidence timeline is explicitly unavailable; no unsupported evidence query is inferred | HANDOFF_BLOCKED |
| 5 | Inspection history is rendered from visits/inspections and submission versions | PASS (supplemental) |
| 6 | Findings/violations are rendered from inspection violation joins | PASS (supplemental) |
| 7 | Corrective-action records are rendered from inspection action forms | PASS (supplemental) |
| 8 | Review decisions are rendered only when a stored decision exists | PASS (supplemental) |
| 9 | Report links are emitted only when a submitted version exists | PASS (supplemental) |
| 10 | Document registry reads metadata and validity facts | PASS (supplemental) |
| 11 | Document preview/signed URL/custody retrieval is explicitly `HANDOFF_BLOCKED_DOCUMENT_VIEWER` | HANDOFF_BLOCKED |
| 12 | Representatives are rendered; leadership-only contact masking is explicit and role-specific | CONDITIONAL — role-policy acceptance still required |
| 13 | Products and HS codes are read/rendered; Add Product action exists | PASS (supplemental) |
| 14 | Materials and source/HS code are read/rendered; Add Material action exists | PASS (supplemental) |
| 15 | Map provider/map rendering is explicitly unavailable | HANDOFF_BLOCKED |
| 16 | Boundary polygon/coordinate-conflict proof is explicitly unavailable | HANDOFF_BLOCKED |
| 17 | Documents, representatives, products, and materials have independent error flags and isolated banners | **PASS** — independent flags remain isolated; `mapFactoryError` now prevents raw provider/database text from reaching page/actions and logs diagnostics server-side |
| 18 | Section anchor strip is real keyboard-focusable navigation; CSS target is 48px; Arabic/RTL and mixed-direction IDs are covered | PASS (supplemental) |

## Findings requiring disposition

1. **P0 evidence blocker — missing authoritative map.** Supply the exact
   `WIRING_MAP_CD-031.csv` from the approved design handoff. Until then, no DEC-012
   row-level PASS/FAIL verdict can be issued.
2. **P1 runtime safety — raw provider/database errors reached the UI (CLOSED).**
   `neutral.ts` now classifies only safe categories (RLS/not-found/conflict/general),
   logs the raw error server-side, and returns neutral localized-safe copy. The page's
   five section errors and all CRUD actions use it. Typecheck/build and the focused
   CD-031 suite (15/15) pass; no policy value was invented.
3. **P1 governance — leadership contact masking is unproven.** The implementation
   masks when every resolved role is `leadership`, but the role/privacy decision is
   still marked `HANDOFF_BLOCKED_ROLE`; sponsor acceptance or an authoritative RBAC/privacy
   rule is required before calling this leg complete.
4. **Design package completeness remains unproven.** The local R3 directory contains a
   design HTML artifact, but the requested machine-readable wiring map and the R2 review's
   literal A/B/C SHA-256 preflight companion were not found locally.

## No self-approval

This report does not mark CD-031 complete, sponsor-accepted, merged, pushed, or production-
ready. The missing map, role/privacy decision, and design-package completeness must be
resolved and independently re-run before certification.
