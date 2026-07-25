# M4 Factories / Factory 360 — complete inventory matrix (read-only)

Packet: `CLAUDE-M4-DESIGN-INVENTORY-001` (resubmission) / `CLAUDE-M4-DESIGN-DELTA-002`
Scope: CR-410..CR-429, WA-DES-026, WA-DES-027, WA-M4-AC-001..006
Project: `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61` (verified live read access this session)

## 1. Stable live Claude Design page IDs / revisions

| Design ID | Live file path (project 5e8154ad) | Last-observed etag (this session) | Content sha256 (matches manifest) | Revision label present in-file |
|---|---|---|---|---|
| WA-DES-026 | `SAQEEL Factories.dc.html` | `1784806013700217` | `b6fbf963aee937be7cf40b8df65862b10a88ccd8a89dd3ac5a6021a87f2244c6` — matches `DESIGN_ROUTE_MAP.csv:27` and `DESIGN_SOURCE_MANIFEST.csv:27` exactly | None — original source, no `-C1`/correction suffix exists for this file in this project |
| WA-DES-027 | `SAQEEL Factory 360.dc.html` | `1784806013700217` (identical to WA-DES-026 — same upload batch) | `680c838cde826e24d1ad53ac4438a4de06379e0cf07605d30ad3d1d1a2392d77` — matches `DESIGN_ROUTE_MAP.csv:28` and `DESIGN_SOURCE_MANIFEST.csv:28` exactly | None |

No corrected/superseding revision exists for either file (unlike M3's WA-DES-033-C3/034-C3, which were already materialized in this same project). This is the **first** correction cycle for M4.

## 2. Frame / required-state inventory — design vs. required (WA-M4-AC-004, ACCEPTANCE_CRITERIA.csv rows 26-31)

| Route | Required states (per `DESIGN_ROUTE_MAP.csv` row 27/28) | Present in the live design file | Gap |
|---|---|---|---|
| WA-DES-026 (`/factories`) | loading, empty, error, degraded, unauthorized, stale/conflict, provider-unavailable | **None** — only a List/Map view toggle (`seg` control) and a single static 8-row fixture table exist. No `sc-if`-gated state toggle bar of any kind. | All 7 required states missing as design frames |
| WA-DES-026 responsive/theme | EN/LTR, AR/RTL, 1200x860 reference, 1024x768, 412x915/390x844, 320x800, light/dark | Single fixed `$preview` size (1200×860) in `data-props`; a `toggleTheme` function exists in the component's JS but nothing demonstrates it was exercised against this specific table/map layout; no RTL toggle, no responsive frame picker | RTL, all four secondary viewports, and a demonstrated (not just theoretically-wired) theme toggle are all missing as evidence |
| WA-DES-027 (`/factories/:id`, `/factories/cr/:id`) | loading, empty, error, degraded, unauthorized, stale/conflict, provider-unavailable (route map); migration CSV is more specific: `:id`→loading;empty;error;conflict;not-found, `cr/:id`→loading;empty;error;degraded;conflict;stale;not-found | **None** — single always-populated CR dossier state | All required states missing for both routes |
| WA-DES-027 second route | The file is assigned to `/factories/:id` (legacy, non-CR, direct-table-read) as well as `/factories/cr/:id` — see §4 below | Only the CR-dossier layout exists; the plain/legacy factory view has no distinct frame | The `/factories/:id` route's actual content contract (see §4) is entirely undesigned |
| WA-DES-027 responsive/theme | 1440x900 reference + same matrix as above | Plain CSS `@media` breakpoints at 1280px/900px exist in the stylesheet (collapses the 3-column `.f360-ws` grid), so *some* narrow-width behavior is authored, but no named/demonstrated 1024/412/390/320 evidence frame, no RTL toggle beyond two static Arabic text spans, no `sc-if`-based state frames | Responsive behavior partially authored in CSS but not evidenced; RTL and all named states absent |

Compare against M3's corrected `WA-DES-033-C3`/`034-C3`, which built an explicit tooling bar (frame picker, state `<select>`, RTL/theme toggle buttons, route-authorized/unauthorized toggle) — that is the bar M4 has not yet met.

## 3. Route → component → business-capability mapping (cross-checked against real code this session)

| Route | Business capability (per `REQUIREMENT_BASELINE.csv` CR-410) | Real page file | Real supporting components |
|---|---|---|---|
| `/factories` | "Provide a full centralized factory profile" entry list — search/browse to open a factory | `apps/web/src/app/(app)/factories/page.tsx` | `FactoryList.tsx` (confirmed on disk) |
| `/factories/:id` | Legacy/direct factory profile — full centralized profile read straight from source tables, for factories without (or before) a CR-scoped dossier | `apps/web/src/app/(app)/factories/[id]/page.tsx` | `Controls.tsx`, `FactorySpatialMap.tsx`, `actions.ts`, `neutral.ts` (all confirmed on disk) |
| `/factories/cr/:id` | CR-centered dossier — "Factory 360° is the full profile page, not the small Factory Card" (CR-410 business rule) | `apps/web/src/app/(app)/factories/cr/[id]/page.tsx` | `Factory360ExportButton.tsx`, `factory360.module.css` (confirmed on disk); imports `@/lib/factory360/compliance` (`calculateApprovedCompliance`) and `@/lib/factory360/dossier` (`loadFactory360Dossier`, `resolveFactory360Permissions`, `latestSubmission`) — a distinct service layer from `/factories/:id` |

**This confirms the design gap in §2 is real and material**: `/factories/:id` and `/factories/cr/:id` are not two views of the same data — they use entirely different service layers (`[id]/page.tsx` queries `factories`/`factory_documents`/`factory_materials`/`factory_products`/`factory_representatives`/`factory_risk_snapshots`/`industrial_licenses`/`penalty_notices` directly; `cr/[id]/page.tsx` goes through `@/lib/factory360/compliance` + `@/lib/factory360/dossier` with no tables statically detected in the page file itself). WA-DES-027 depicts only the second.

## 4. Service / API / RLS / RBAC / audit mapping — re-read exact predicates and triggers this session, no generalized claim

Every cell below is either a verbatim predicate/trigger name read directly from the migration file this session, or explicitly marked `INSUFFICIENT EVIDENCE` where it is not.

| Table | RLS enabled | Read policy — exact current predicate | Write policy — exact current predicate | Audit trigger (verified by exact grep, not inferred) |
|---|---|---|---|---|
| `factories` | Yes (`0002_rbac_audit.sql:15`) | `for select using (auth.uid() is not null)` — any authenticated user | insert: `has_any_role(['gis_admin','planner','compliance_admin'])`; update: `has_any_role(['gis_admin','planner'])` (`0002_rbac_audit.sql:16-17`) | **Confirmed present**: `trg_audit_factories after insert or update or delete on factories` (`20260716210000_remaining_requirements_backend.sql:284`) |
| `industrial_licenses` | Yes, via looped generator (`20260720010000_factory360_v2_foundation.sql:666`) | `has_permission('view_factory_360')` (`20260720010000_factory360_v2_foundation.sql:720`, generated per-table) | Admin-role `all` policy for `security_admin`/`workflow_admin`/`compliance_admin` (line ~706, generated) | **Not an audit trigger** — `trg_f360_guard_license_external_ids before update ... execute function guard_factory360_external_identifiers()` (`20260720010000_factory360_v2_foundation.sql:262-267`) is an **immutability guard** (blocks `license_number`/`factory_id`/`plant_number` changes), not a change-history/audit-log trigger. No `trg_audit_*`-style trigger found for this table this session → **INSUFFICIENT EVIDENCE that changes are audit-logged**, only that certain fields cannot be silently replaced. |
| `factory_risk_snapshots` | Yes (`20260716210000_remaining_requirements_backend.sql:163`) | `for select to authenticated using (auth.uid() is not null)` — any authenticated user, **no role restriction** (`...:165`) | insert-only via seed pattern; no explicit application-facing insert policy re-read beyond the seed migration itself | **Confirmed present**: `trg_audit_factory_risk_snapshots after insert on factory_risk_snapshots` (`20260716210000_remaining_requirements_backend.sql:288`) |
| `factory_documents` | Yes (`0011_factory360_gis_ksa_seed.sql:30`) | **Superseded read policy, current version**: `drop policy if exists fdocs_read ...; create policy fdocs_read ... using (has_any_role(['planner','inspector','reviewer','ops','auditor','compliance_admin','gis_admin']))` (`20260716210000_remaining_requirements_backend.sql:47-49`) — the earlier `0011` `auth.uid() is not null` version is no longer active, dropped and replaced by this later migration | insert: `has_any_role(['planner','ops','compliance_admin','gis_admin'])` (`0011_factory360_gis_ksa_seed.sql:32`, not superseded) | No `trg_audit_*` trigger found for this table this session → **INSUFFICIENT EVIDENCE** |
| `factory_materials` / `factory_products` | Yes (`0017_w3_factory_master_data.sql:45,47`) | `auth.uid() is not null` (both tables, unchanged, no later supersession found) | `has_any_role(['planner','ops','compliance_admin'])` (both tables) | No `trg_audit_*` trigger found for either table this session → **INSUFFICIENT EVIDENCE** |
| `factory_representatives` | Yes (`0011_factory360_gis_ksa_seed.sql:30`) | **Superseded, current version**: `has_any_role(['planner','inspector','reviewer','ops','auditor','compliance_admin'])` (`20260716210000_remaining_requirements_backend.sql:50-52`) — the earlier `auth.uid() is not null` is dropped | insert/update: `has_any_role(['planner','ops','compliance_admin'])` (`0011_factory360_gis_ksa_seed.sql:35-36`) | No `trg_audit_*` trigger found → **INSUFFICIENT EVIDENCE** |
| `geo_events` | Yes (`0002_rbac_audit.sql:34`, widened `0008_visibility_widen.sql:4`) | `has_any_role(['ops','auditor','reviewer']) or is_assigned_inspector(visit_id)` | `is_assigned_inspector(visit_id) or has_role('ops')` | No `trg_audit_*` trigger found. Table has no update/delete policy defined (insert-only), consistent with an append-only design, but this session found **no explicit audit trigger** to corroborate that append-only-by-policy equals audit-logged → **INSUFFICIENT EVIDENCE for a dedicated audit trail beyond the table's own insert-only policy shape** |
| `penalty_notices` | Yes (`20260716210000_remaining_requirements_backend.sql:106`) | `has_any_role(['reviewer','ops','auditor','compliance_admin','leadership'])` (`...:108-110`) | `has_any_role(['compliance_admin','ops']) and issued_by = auth.uid()` (`...:112-114`) | **Confirmed present**: `trg_audit_penalty_notices after insert on penalty_notices` (`...:292`) |

**Corrected conclusion**: RLS is enabled on every table in scope — confirmed exact, no generalized claim needed there. Audit-trigger coverage is **not uniform**: confirmed present on `factories`, `factory_risk_snapshots`, `penalty_notices`; confirmed **absent** (not merely unverified) on `factory_documents`, `factory_representatives`, `factory_materials`, `factory_products`, `geo_events`; `industrial_licenses` has an immutability guard but no confirmed audit-log trigger. This is a real, specific gap worth a separate dirty-laundry entry if change-history on those tables is required by any CR-410..429 row — not asserted here as a requirement violation, only as a factual coverage gap.

## 5. Design-vs-code delta (beyond the MODON finding, already recorded in `00_M4_MODON_INVENTED_PROVIDER_CORRECTION.md`)

- **Missing sections entirely absent from WA-DES-027 that real code already serves data for**: `factory_materials`, `factory_products`, `factory_representatives` are read by `[id]/page.tsx` (confirmed lines 73-79 of that file) but WA-DES-027's dossier has no corresponding section for representatives or a materials/products table distinct from the "Industrial information" table shown (which may or may not be the same data — not confirmed this pass; flagged as ambiguous, not asserted as a gap).
- **`penalty_notices` visibility is conditional in code** (`canSeeSensitiveHistory ? sb.from("penalty_notices")... : Promise.resolve({ data: [] })`, line 119 of `[id]/page.tsx`) — a real conditional-visibility rule (RBAC-013-style masking). WA-DES-027's "Penalty lineage" panel shows an unconditional single row with no masked/hidden-for-role state modeled — a real missing negative/masked-state design frame.
- **`ContextualAiPanel` is imported by both `[id]/page.tsx` and `cr/[id]/page.tsx`** (confirmed) but WA-DES-027's only AI-adjacent element ("Explain saved risk") is correctly bounded (advisory-only, human-decision-required) — this is a positive match, not a gap, but the design does not show what `ContextualAiPanel`'s actual component contract requires (no evidence this was cross-checked at the component-prop level; flagged as ambiguous).
- **License-selector interaction is correctly modeled**: WA-DES-027's left-rail license picker (`sc-for licenses`) driving the "selected license, plant & address" and "saved risk" sections matches CR-410/DSG-CMD-014's "selecting a license refreshes all sections" business rule — a positive match, not a gap.
- **Compliance-rate formula is honest and matches the established pattern**: "84%... 126/150 scored answers · Health-distinct" mirrors the same passed/answered formula already sponsor-approved for M1's dashboard — no invented formula here.

## 6. Acceptance / test gap

Confirmed on disk this session (existence only, not executed — no app lease):
- `apps/web/e2e/factory360-cr-dossier-contract.spec.ts`
- `apps/web/e2e/cd-031-factory-360.spec.ts`
- `apps/web/e2e/factory360-ipad-field.spec.ts`

All six `WA-M4-AC-001..006` rows remain `PLANNED_NOT_IMPLEMENTED` (`ACCEPTANCE_CRITERIA.csv:26-31`) — this inventory does not change that; test *existence* is confirmed, test *content/coverage* against the corrected design (once corrected) is not yet verified and is explicitly out of scope for a read-only design lease. Per `SAQEEL_OPERATING_SYSTEM.md` §4: existence, traceability, or a passing happy-path test does not count as completion.

## 7. Two bounded READY packets (final)

**Packet A — `CLAUDE-M4-DESIGN-CORRECTION-001`** (see `00_M4_MODON_INVENTED_PROVIDER_CORRECTION.md` and `02_M4_MODON_NEUTRAL_CORRECTION_PROMPT.md`):
- Files: `SAQEEL Factories.dc.html`, `SAQEEL Factory 360.dc.html` (project `5e8154ad-...`) — Claude Design write, not yet authorized.
- Scope: apply the provider-neutral `{source}`/`{source_synced_at}` correction prompt (§ below); add the 7 required states to both files as an explicit toggle bar (mirroring M3's WA-DES-033-C3 pattern); add the missing legacy `/factories/:id` frame distinct from the CR dossier; add the masked/hidden `penalty_notices` state.
- Out of scope: no route change, no RBAC change, no new component contract invented for `ContextualAiPanel` beyond what's already bounded.
- **Dependency, corrected**: this is **not** blocked on a future sponsor MODON-scope decision — no accepted MODON provider contract exists today (`EXTERNAL_SOURCE_CONTRACT_REGISTER.csv:5`), so the canonical no-invention rule already mandates the neutral `{source}`/`{source_synced_at}` + "Source not configured" fix regardless of any later ruling. The only real dependency is the **Codex-issued design-write lease** for this project — a scheduling/authorization gate, not a pending business decision.

**Packet B — `CLAUDE-M4-RESPONSIVE-RTL-EVIDENCE-001`** (independent, no blocking dependency):
- Same two files.
- Scope: build the explicit frame-picker/state-toggle/RTL-toggle/theme-toggle tooling bar (same pattern as WA-DES-033-C3), demonstrating 1440/1200x860/1024/412/390/320 × EN-LTR/AR-RTL × light/dark, so responsive/RTL/theme claims become verifiable evidence instead of assumed CSS behavior.
- Out of scope: no content/data change, no provider-naming change (that's Packet A).

## 8. Disposition

No Claude Design or product-code write performed. This matrix, `00_M4_MODON_INVENTED_PROVIDER_CORRECTION.md`, and `02_M4_MODON_NEUTRAL_CORRECTION_PROMPT.md` together constitute the complete `CLAUDE-M4-DESIGN-INVENTORY-001`/`CLAUDE-M4-DESIGN-DELTA-002` deliverable.
