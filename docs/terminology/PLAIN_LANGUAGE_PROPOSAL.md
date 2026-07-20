# Plain-Language Terminology Remediation — Wave 0 Proposal

Status: Wave 0 (inventory only). No application code, migrations, or design files were edited to produce this document. All findings below are grep/read-verified file:line references as of this worktree's HEAD (branch `feat/plain-language-terminology-remediation`, base `d53e09f`).

Companion file: `docs/terminology/PLAIN_LANGUAGE_INVENTORY.csv` — the machine-readable row-level inventory. This document groups the same findings by product surface and adds narrative rationale.

## 0. Legal/regulatory terms requiring sign-off before any change (classification C)

These terms are **not** part of the approved plain-language glossary and must not be reworded without legal/business sign-off, per the ban's own carve-out. They are flagged here so Wave 1+ does not accidentally sweep them up:

- **Commercial Registration (CR)** — used throughout Factory 360 (`apps/web/src/app/factories/cr/[id]/page.tsx`, `apps/web/src/app/field/factory-360/[id]/page.tsx`) and Planning. Contextual meaning is a specific Saudi legal registration; do not rename.
- **Violation** — `apps/web/src/app/admin/violations/page.tsx`. Legal/enforcement term.
- **Penalty** — appears alongside "Penalty lineage" (F0-030); the word "Penalty" itself is legal vocabulary and is out of scope — only "lineage" is being swapped to "history".
- **Compliance** — `apps/web/src/app/admin/compliance-requests/page.tsx`, `apps/web/src/app/admin/regulations/*`. Regulatory-domain term, keep.
- **Corrective Action** — enforcement/workflow term, keep.
- **Approved / Rejected / Returned** — workflow decision states across Review/Approval surfaces; contextual meaning only, keep.
- **Legal Identity** — Factory/CR identity fields, keep.

Recommendation: route classification-C items to the product/legal owner for a one-time confirmation that no swap is needed, then close them out — they do not need further engineering research.

## 1. Factory 360 (web + iPad)

This is the module the "dossier" ban is framed around, and it is the highest-volume surface. Web and iPad share the same data loader (`apps/web/src/lib/factory360/dossier.ts` → `loadFactory360Dossier`), and the comment at `apps/web/src/app/field/factory-360/[id]/page.tsx:18-19` states the two surfaces render "identical business data … BY CONSTRUCTION" — every string fix below must land on both `apps/web/src/app/factories/cr/[id]/page.tsx` (web) and `apps/web/src/app/field/factory-360/[id]/page.tsx` (iPad) simultaneously, since they share translation keys.

| Finding | File:line | Current | Proposed EN | Classification |
|---|---|---|---|---|
| F0-001 | `apps/web/src/app/factories/FactoryList.tsx:93` | link text "dossier" | View factory | A |
| F0-002 | `apps/web/src/app/factories/page.tsx:51` | `f360.list.dossier` fallback "dossier" | View factory | A |
| F0-003 / F0-005 | `factories/cr/[id]/page.tsx:31` + `field/factory-360/[id]/page.tsx:42` | "This CR dossier is outside your authorized permissions." | "This CR profile is outside your authorized permissions." | A |
| F0-004 / F0-006 | `factories/cr/[id]/page.tsx:37` + `field/factory-360/[id]/page.tsx:49` | "Factory 360 dossier unavailable" | "Factory 360 profile unavailable" | A |
| F0-007 | `apps/web/src/app/factories/[id]/loading.tsx:6` | `aria-label="Loading factory dossier"` | "Loading factory profile" | D |
| F0-025 / F0-026 | `factories/cr/[id]/page.tsx:39` + `field/factory-360/[id]/page.tsx:51` | "The registry is temporarily unavailable." | "The Factory list is temporarily unavailable." | A |
| F0-028 / (iPad mirror) | `factories/cr/[id]/page.tsx:106` + `field/…:159` | "License portfolio" heading | "All licenses" | A |
| F0-029 | `factories/cr/[id]/page.tsx:115` + `field/…:159` | "Portfolio facts only…" | "All-licenses facts only…" | A |
| F0-030 | `factories/cr/[id]/page.tsx:224` + `field/…:198` | "Penalty lineage" heading | "Penalty history" | A |
| F0-051 | ~40+ strings across the module, see §7 | "immutable" | "Final submitted version" (contextual) | A — deferred to a dedicated wave |

Not flagged for change (internal-only, F0-048): `apps/web/src/lib/factory360/dossier.ts`, `canonical-projection.ts`, and ~25 e2e spec references (`factory360-cr-dossier-contract.spec.ts`, `cd-031-factory-360.spec.ts`, `factory360-ipad-field.spec.ts`, `factory360-admin-control-plane.spec.ts`, `factory360-cross-provider-contract.spec.ts`) are symbol/selector names, not rendered text.

## 2. Inspector iPad

The iPad surface is served by responsive routes under `apps/web/src/app/field/...`, not a separate codebase. Findings specific to iPad beyond the shared Factory 360 keys above:

- **F0-039** `apps/web/src/app/field/[visitId]/page.tsx:99` — `field.start.geofenceHeading` = "Geofence — {name}" → "Location exception — {name}" (glossary carve-out: geofence → location exception, inspector-facing). Companion key `field.start.geofenceCheck` at line 98 needs the same treatment.
- iPad mirrors of F0-005/F0-006/F0-025/F0-026/F0-028/F0-029/F0-030 above.

## 3. Planning

- **F0-050** `apps/web/src/app/planning/single/IdentityDossier.tsx` — this file is explicitly named in scope for the dossier ban. Only comments (e.g. "Identity dossier: identifier grid…") were confirmed in this pass; no literal rendered "dossier" string was found in the component body. **Recommend a dedicated read of this file's JSX before Wave 1 closes it out** rather than treating the "internal-only" conclusion as final.
- `apps/web/src/app/planning/single/Wizard.tsx` — only imports/comments reference the IdentityDossier component; no direct rendered "dossier" string found.
- No genuinely user-visible "registry/portfolio/lineage" hits found in Planning beyond the CR context already covered under Factory 360.

## 4. Inspection execution

- No genuinely user-visible dossier/registry/portfolio/lineage hits found in `apps/web/src/app/field/inspection/[id]/page.tsx` or `apps/web/src/app/field/[visitId]/page.tsx` beyond the geofence findings above and the immutable cluster (§7), e.g. a submit button reading "Review & submit — immutable v1".

## 5. Review and approval

- **F0-020** `apps/web/src/app/reviews/page.tsx:278` — `review.list.scanTitle` = "Scan-first queue" → "Review overview". Exact, isolated match to the approved glossary term.
- **F0-021 / F0-022** `apps/web/src/app/reviews/page.tsx:236-237` — `review.list.colOpen` = "Workspace" (table header) and `review.list.open` = "Open workspace" (row-action link) → "Open review" for both. This is the highest-priority workspace fix — it is a literal row action, structurally identical to the FactoryList "dossier" row action.
- **F0-023** same banner as F0-020, body text also contains "workspace" mid-sentence — same key, same fix.
- **F0-024** `apps/web/src/app/reviews/[id]/page.tsx:61` — `review.ws.unauthBody` = "This workspace requires the Level 2 Reviewer role…" → "This review requires…". This string also leaks the internal term "RLS" (see §13).
- **F0-040** `apps/web/src/app/reviews/page.tsx:268` — a context badge literally renders "SCR-WEB-300 · /reviews · RLS-scoped" to the reviewer. Companion at `apps/web/src/app/visits/page.tsx:202,214` ("SCR-WEB-200/210 · RLS-scoped"). This looks like a deliberate traceability-badge convention (screen ID + scope note shown as an `ax-lozenge`), not accidental leakage — **flagged for a product decision on whether it's in scope for this remediation wave** before anyone edits it.
- **Out-of-scope "workspace" usages** (different concept — task/launch context, not the review scan-first queue; needs its own product decision, not swept into this glossary item): `apps/web/src/app/tasks/page.tsx` ("Task workspace"), `apps/web/src/app/launch/loading.tsx:17`, `apps/web/src/app/launch/no-workspace/page.tsx:27` (route name `/launch/no-workspace` + heading), `apps/web/src/components/AdminRouteBoundary.tsx:25-26`, `apps/web/src/app/virtual/[id]/page.tsx:59`.

## 6. Operations Center

- **F0-008** `apps/web/src/app/operations/page.tsx:382` — map hint "…open the visit or factory dossier." → "…open the visit or factory profile."
- **F0-038** `apps/web/src/app/operations/page.tsx:388` — `ops.override.heading` = "Geofence override approvals (M04-043)" → "Location exception approvals" (also strip the bracketed requirement code, see §13).
- **F0-033/F0-034/F0-035** — an "SLA watch (ENG-09)" section with table headers "SLA" and a separate "Deadline" column that already coexist inconsistently (`ops.sla.th.sla` = "SLA" at line 436 vs. `ops.sla.th.deadline` = "Deadline" at line 435). Per the glossary carve-out (SLA → Deadline for ordinary users; Operations staff are ordinary users, not admin-config editors), this section needs a coordinated rename — product should decide the final two-column wording so it doesn't produce a duplicate "Deadline" header.
- `thGeofence` table header ("Geofence") at line 370 — also a candidate for the location-exception swap since Operations staff are not the GIS-admin carve-out audience; needs a scope call alongside the Compliance/GIS-admin boundary in §8.

## 7. Compliance (Immutable cluster — F0-051)

The single largest genuinely-user-visible cluster found in Wave 0: **~40+ distinct strings** containing "immutable" across `apps/web/src/app/visits/[id]/page.tsx`, `apps/web/src/app/admin/page.tsx`, `apps/web/src/app/admin/compliance-requests/page.tsx` (+ `[id]/page.tsx`), `apps/web/src/app/admin/workflows/page.tsx`, `apps/web/src/app/admin/packages/page.tsx`, `apps/web/src/app/admin/regulations/page.tsx`, `apps/web/src/app/admin/risk/page.tsx` (+ `models/page.tsx`), `apps/web/src/app/admin/violations/page.tsx`, `apps/web/src/app/field/factory-360/[id]/page.tsx` and `apps/web/src/app/factories/cr/[id]/page.tsx` (table header "Latest immutable version"), `apps/web/src/app/field/inspection/[id]/page.tsx` (submit button "Review & submit — immutable v1"), `apps/web/src/app/field/[visitId]/page.tsx`, `apps/web/src/app/operations/page.tsx`, `apps/web/src/app/dashboard/DashboardView.tsx`, `apps/web/src/app/factories/[id]/page.tsx`, `apps/web/src/app/virtual/[id]/page.tsx`, `apps/web/src/app/reports/inspection/[id]/page.tsx`, `apps/web/src/app/reviews/page.tsx` and `apps/web/src/app/reviews/[id]/page.tsx`.

Usages vary in shape — a short badge ("immutable"), a full sentence ("Published version — immutable."), and a table header ("Latest immutable version") — so a single mechanical find-replace to "Final submitted version" will not fit every slot. **Recommend this become its own dedicated wave (Wave 2 candidate)** with a file-by-file inventory pass rather than being folded into the dossier/registry/portfolio/lineage wave.

The `ui_strings` seed data also contains this term widely: `supabase/migrations/20260715210000_cd006_011_frontend_strings.sql:85,91,99,231,249`, `20260715103000_cd008_cd009_ar_strings.sql:18-20`, `20260715102000_cd010_cd011_ar_strings.sql:36`, `20260715090000_cd004_ar_strings.sql:30`, `20260716220000_def_wf_006_approved_requires_submission.sql:38,42`.

## 8. Enforcement

- F0-030/F0-031/F0-032 (lineage → history) are the primary enforcement-adjacent findings — see §1 and §9.
- "Frozen" appears descriptively in a few places (`apps/web/src/app/admin/packages/page.tsx:251` "Existing work stays on the frozen version it downloaded…"; `apps/web/src/app/field/factory-360/[id]/page.tsx:181` / `factories/cr/[id]/page.tsx:146` "…its frozen package definition."). Not on the approved glossary — flagged as plain-English already, no swap proposed pending a product decision.

## 9. Administration

- **F0-011 / F0-012** `apps/web/src/app/admin/regulations/page.tsx:150` and `Controls.tsx:62,338` — `admin.reg.r1.openDossier` = "Open dossier" → needs its own label since this opens a *regulation* record, not a factory (product to confirm exact wording, e.g. "Open regulation detail"). DB seed source is `supabase/migrations/20260715100000_cd005_cd006_ar_strings.sql:38`.
- **F0-013 / F0-014 / F0-015** `apps/web/src/app/admin/audit/AuditReplayWorkspace.tsx:13-14` — a dense inline strings object (not wrapped in `t()`) renders "Point-in-time dossier" (EN; Arabic at the same key already says "ملف الحالة في لحظة" — "file at a point in time" — so **Arabic already avoids the banned word and English is the outlier**) and "Portfolio / current readable scope". This file is also the densest concentration of unassigned jargon found in the whole audit (see §13).
- **F0-027** `supabase/migrations/20260715210000_cd006_011_frontend_strings.sql:230` — `admin.template.heading` = "Governed template registry" → registry glossary swap, needs product confirmation for an admin-config screen.
- **F0-031 / F0-032** `apps/web/src/app/admin/regulations/page.tsx:403,408` — "Version lineage" heading + "governed successor" → "Version history" / "newer version".

## 10. Notifications

No genuinely user-visible dossier/registry/portfolio/lineage hits found in `apps/web/src/app/admin/notifications/page.tsx`. This screen legitimately keeps "SLA" per the glossary carve-out (admin config context: `slaMinutes`, `colSla`, page title "Notification & SLA Rules", `escalationNote`) — no action needed there.

## 11. Exports and reports

- **F0-043** `design/astryx/d3/D3-07_factory-360.html:27` — mockup button "Export dossier (permission-gated)" → "Export profile (permission-gated)". This is a design-mockup precursor to a not-yet-built export feature; classified as export/report copy so a future implementer starts from the corrected wording.
- The immutable cluster (§7) also touches `apps/web/src/app/reports/inspection/[id]/page.tsx` (5 hits including `report.hist.immutable`) — deferred to the immutable wave.

## 12. Shared shell and navigation

- `apps/web/src/components/ShellClient.tsx:332` — only a code comment ("search opens the field-native Factory 360 instead of the web dossier"), no rendered text. Internal-only, no action.
- Login page (`apps/web/src/app/login/*`) — `SaudiAtlasDossier.tsx`, `StoryPanel.tsx`, `page.tsx:118` all use "dossier" only in component/type/prop names (`DossierStrings`, `dossierStrings`) and CSS class selectors (`lg-atlas3d__dossier*` in `login.css`, ~22 hits). The actual strings object rendered to the user only contains keys `industry`, `state`, `close`, `mapLabel` — **no literal "dossier" text is rendered on the login page.** False positive, no action needed (F0-049).

## 13. Errors and empty states

- F0-003/F0-005 (CR permission body), F0-004/F0-006 (Factory 360 not-found title), F0-025/F0-026 (registry unavailable), F0-016 (committee decision dossier not enabled) are all error/empty-state copy — see §1 and the CSV.
- **Dev-jargon leaking into user-visible error/empty-state copy (new finding, not on the approved glossary — flagged for a product decision):**
  - `RLS-scoped` / `RLS` — literal badge text at `apps/web/src/app/visits/page.tsx:202,214`, `apps/web/src/app/reviews/page.tsx:258,268`, `apps/web/src/app/visits/calendar/page.tsx:60`, `apps/web/src/app/visits/map/page.tsx:39`, `apps/web/src/app/admin/access/page.tsx:36`; also appears inside `review.ws.unauthBody` (F0-024) — "Navigation visibility is not authorization; RLS remains the boundary."
  - Bracketed requirement codes inside otherwise-plain headings: `ops.sla.heading` "SLA watch (ENG-09)" and `ops.override.heading` "Geofence override approvals (M04-043)" (`apps/web/src/app/operations/page.tsx:517,388`). A representative sample only — recommend a dedicated sweep for bracketed requirement codes in visible headings as part of Wave 3.
  - `apps/web/src/app/committee/page.tsx:19` — the raw env-var name `FEATURE_DECISION_DOSSIER` is rendered as the `seam` prop text inside an expandable "Why / prerequisites" `<details>` (see `apps/web/src/components/NotYetBoundary.tsx:43`). Low severity — only visible if a user expands the disclosure — but it's a real dev-code leak (F0-017).
- **Status/provenance vocabulary with no assigned glossary replacement** — heavily concentrated in `apps/web/src/app/factories/cr/[id]/page.tsx` / `apps/web/src/app/field/factory-360/[id]/page.tsx` (`f360.section.degraded` "This source section is degraded; other sections remain available.", `f360.source.heading` "Source status & freshness", "saved snapshots", "governed factory snapshot", "source-backed products…") and in `AuditReplayWorkspace.tsx` ("DEGRADED.", "PARTIAL SCOPE.", "POLICY_HELD", "zero disclosure", "CONFLICT"). **These terms (degraded, freshness, snapshot, source-backed, governed, canonical, authoritative, fingerprint, reconciliation, contract-unverified) are not on the approved glossary.** Recommend escalating them to product as a new "provenance/status vocabulary" glossary category before any Wave touches them — they are real plain-language problems but have no assigned replacement today.

## 14. Accessibility labels (classification D)

- **F0-007** `apps/web/src/app/factories/[id]/loading.tsx:6` — `aria-label="Loading factory dossier"` → "Loading factory profile". This is the only confirmed aria-label/alt/title hit containing a banned term found in Wave 0; other loading-state copy (e.g. `apps/web/src/app/field/[visitId]/loading.tsx:10` "Fetching visit window, package version and geofence configuration") uses "geofence" as visible body text rather than an ARIA attribute — tracked under §2/§6 instead.

## 15. Arabic and RTL

- **The Arabic UI-string source of truth is the single bilingual `ui_strings` Postgres table**, created by `supabase/migrations/0013_ui_strings_localization.sql` (`key text primary key, en text, ar text, status, context…`) and extended by `0014_ui_strings_history_sync.sql`. There is **no separate Arabic-only table** — Arabic values live in the `ar` column of the same rows, seeded across many `..._ar_strings.sql` migrations (e.g. `20260715100000_cd005_cd006_ar_strings.sql`, `20260715180000_cd006_ar_strings.sql`, `20260715210000_cd006_011_frontend_strings.sql`, `20260715103000_cd008_cd009_ar_strings.sql`, `20260715102000_cd010_cd011_ar_strings.sql`, `20260715090000_cd004_ar_strings.sql`, `20260716223000_scr_adm_080_ar_strings.sql`, `20260716161605_ipad_geo_override_approval_workflow.sql`).
- **Surprise finding:** Arabic translations are in several places *already ahead of English* — they avoid "dossier" (using ملف / "file" or سجل / "record") where the English fallback in the source code still says "dossier". Confirmed at F0-013 (`AuditReplayWorkspace.tsx` — AR "ملف الحالة في لحظة" vs EN "Point-in-time dossier") and F0-019b/F0-019c (regulation detail migration rows — AR uses الملف/السجل, EN still says "dossier"). **This means some remediation work is English-only catch-up, not a synchronized bilingual rewrite** — Wave 4 should audit for this pattern broadly rather than assuming every fix needs new Arabic authored from scratch.
- **Gap found, worth flagging to product:** migration comments reference source-of-truth Arabic authoring packs — `LOCALIZATION_INVENTORY_CD-005_R1.csv` and `TRANSLATION_REVIEW_REGISTER.csv` — that do **not exist anywhere in this worktree** (`product-contract/` or `design/`). If they exist under `INSPECTION_DOCS_ROOT` or another branch, Wave 1/4 should locate them before authoring new Arabic strings, since they may already contain vetted proposals for some of these terms.
- Direct migration-level dossier hits requiring a forward-migration fix (not an edit to the frozen historical migration): F0-019, F0-019b, F0-019c in `supabase/migrations/20260715100000_cd005_cd006_ar_strings.sql`.

---

## Classification F/H/I summaries (not enumerated exhaustively per instructions)

- **F0-048 — INTERNAL_CODE_KEEP:** `dossier.ts`, `loadFactory360Dossier`, `Factory360Dossier`-family symbol and file names (~10 hits in `dossier.ts`, ~18 in `canonical-projection.ts`), plus CSS class selectors in `login.css` (~22, `lg-atlas3d__dossier*`) and the `dossierStrings` prop wiring in `SaudiIndustrialAtlas.tsx` (~14). None render literal text to a user. No action required to satisfy the ban; a later internal-consistency refactor is optional and out of scope for this wave.
- **F0-052 — TEST_EXPECTATION_UPDATE:** ~25 Playwright e2e specs assert current copy (representative files: `factory360-cr-dossier-contract.spec.ts`, `cd-031-factory-360.spec.ts`, `cd-022-identity-lens.spec.ts`, `remaining-requirements-backend.spec.ts`, `factory360-admin-control-plane.spec.ts`, `factory360-ipad-field.spec.ts`, `cd-005-006-regulations.spec.ts`). Every A/B/C/D/E change above needs its matching spec(s) updated in the same commit.
- **F0-053 — HISTORICAL_DOCUMENT_KEEP:** 212 files under `product-contract/` contain at least one searched glossary term (breakdown: `evidence/` 87, `factory-360/` 19, `governance/` 13, `execution/` 12, `mvp2/` 7, `mvp3/` 6, remainder scattered). Sampled and confirmed as spec prose, audit verdicts, or contract-column headers describing the built feature — not literal proposed UI copy. Kept as-is. One soft flag: `design/claude-design-mvp1/acceptance/DESIGN_ACCEPTANCE_MATRIX.csv` row DSG-026 (SCR-WEB-400) describes Factory 360 as "a resilient source/freshness-aware dossier" in descriptive prose — not a literal copy string, but Wave 1 should sanity-check the acceptance row still reads sensibly once the UI no longer uses the word.
- **F0-047 / F0-049 — FALSE_POSITIVE:** `decision_dossier_v1` contract/design-artifact key references (internal ID, not rendered text); the entire login-page `SaudiAtlasDossier`/`DossierStrings` naming chain (component/type/prop names only, no rendered "dossier" text confirmed).

## Open questions for product before Wave 1+

1. `admin.reg.r1.openDossier` ("Open dossier" on the regulation detail screen) — confirm exact replacement wording since it is not a factory-context string (F0-011/F0-012/F0-019).
2. `SLA` on Operations Center and Dashboard — confirm the ordinary-user vs. admin-config boundary (Operations Center and Dashboard read as ordinary-user surfaces per the carve-out, but they are adjacent to admin screens that legitimately keep "SLA").
3. `RLS-scoped` context badges — deliberate traceability convention or accidental leak? Needs a product ruling before anyone edits `apps/web/src/app/visits/page.tsx`, `apps/web/src/app/reviews/page.tsx`, etc.
4. Provenance/status vocabulary (degraded, freshness, snapshot, source-backed, governed, canonical, authoritative, fingerprint, reconciliation, contract-unverified) has no assigned glossary replacement — needs a product decision before any wave touches Factory 360's source-status panel or the Audit Replay Workspace.
5. Bracketed requirement codes in visible headings (ENG-09, M04-043, and likely more) — confirm whether stripping them from user-visible text is in scope for this remediation or a separate cleanup.
6. Locate (or confirm the absence of) `LOCALIZATION_INVENTORY_CD-005_R1.csv` / `TRANSLATION_REVIEW_REGISTER.csv` before Wave 4 authors new Arabic strings from scratch.
