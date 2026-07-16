# CD-005 premium Claude Design prompt — first-return contract

Design the Saqeel Regulation Library: `CD-005 / SCR-ADM-010 /admin/regulations`.

This is a premium, design-only, code-ready return. It must be sponsor-reviewable on its first delivery. Independent review may produce at most one consolidated correction. Do not return an exploratory fragment, wireframe, generic admin table, or incomplete handoff.

End exactly: `READY_FOR_MANDATORY_CD005_R1_REVIEW`

## 1. Authority and frozen inputs

Read the repository authority in its prescribed order, then read:

1. `outputs/claude-design-approval-pack/admin-control-plane-suite/PREMIUM_ONE_RETURN_PROTOCOL_V1.md`
2. `outputs/claude-design-approval-pack/admin-control-plane-suite/CD-005_SEQUENCE_OVERRIDE_2026-07-15.md`
3. `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-005-r0/ROUTE_RUNTIME_TRUTH_MEMO_CD-005.md`
4. the Admin Master Foundation, Quality Gate and Component Inheritance Ledger from the supplied Admin handoff
5. `apps/web/src/app/admin/regulations/page.tsx`
6. `apps/web/src/app/admin/regulations/Controls.tsx`
7. `apps/web/src/app/admin/regulations/actions.ts`
8. `apps/web/src/components/Shell.tsx`
9. `apps/web/src/lib/i18n.ts`
10. `apps/web/src/app/tokens.css`
11. `apps/web/src/app/astryx.css`
12. `supabase/migrations/0001_foundation.sql`
13. `supabase/migrations/0002_rbac_audit.sql`
14. `product-contract/screens/screen_route_catalogue.csv` rows `SCR-ADM-010` and `SCR-ADM-011`
15. `product-contract/domain/atomic_scope.csv` rows `MVP1-M09-001`, `MVP1-M09-010..015`, `MVP1-M09-028..030`
16. relevant RBAC, error-catalogue, acceptance-ledger and localization records

Record branch, commit and dirty-worktree paths. Read only; do not modify, stage, clean, reset, commit or implement.

The supplied route/runtime memo is the frozen baseline. Do not guess beyond it. If repository evidence contradicts it, record the contradiction and mark that leg `HANDOFF_BLOCKED`.

## 2. Contract

- Task: `TASK-DESIGN-ADMIN-SUITE-001`
- Prompt: `CD-005`
- Screen: `SCR-ADM-010`
- Route: `/admin/regulations`
- Persona: Compliance Admin
- Process: `P00`
- Engines: `ENG-01`, `ENG-12`
- Primary requirement: `MVP1-M09-001`
- Supporting requirements: `MVP1-M09-010..015`, `MVP1-M09-028..030`
- Acceptance scope: `AC-0449..0478`, filtered to Regulation Library ownership
- Primary decision: “Which regulation needs attention, why, and what downstream impact can I safely trust?”

CD-005 owns discovery, lifecycle filtering, provenance scanning, impact preview, validation markers and create-draft entry. CD-006 owns regulation detail, clause editing, applicability editing, comparison, review/approval and publishing.

## 3. Premium design thesis

Create a legal-governance library, not CRUD.

Source provenance, lifecycle truth and downstream inspection impact must dominate edit controls. The page must feel unmistakably built for Saudi industrial inspection regulation governance even with Saqeel branding and colors removed.

Use one page-specific signature interaction only:

**Impact Footprint Rail** — physically attached to the active regulation row. It explains the traceable path from regulation → clauses → inspection items, then clearly marks unproven downstream legs as unavailable. It compresses provenance and prevents a user from treating unknown impact as zero impact.

This interaction must aid a real decision; it is not decorative animation.

## 4. Three premium hypotheses

Develop all three at equal fidelity using identical realistic content and the same hard case:

- A — Lifecycle-led legal register: dense regulation list with attached Impact Footprint Rail.
- B — Authority/provenance navigator: issuing authority and legal-source hierarchy leading to regulations and clauses.
- C — Exception-first governance queue: problems and blocked records first, with the complete library retained as a secondary mode.

Compare them without numerical self-scoring against decision speed, provenance clarity, unknown-versus-zero safety, irreversible-action prevention, Arabic RTL clarity, keyboard burden and 1024px survival.

Select one and show a counterfactual without its signature interaction. Explain the lost decision value. Do not combine all three into a crowded hybrid.

## 5. Frozen runtime truth

Only these facts are currently proven:

- `regulations`: `id`, `code`, `title`, `issuing_authority`, `status`, `created_at`.
- `regulation_clauses`: `id`, `regulation_id`, `clause_ref`, `title`, `applicability`, `legal_source`.
- `inspection_items.clause_id` supports mapped-item relationships.
- Current route reads regulations with nested clauses and mapped item identifiers.
- Current actions create a draft regulation, add a clause and directly update `draft` to `published`.
- Authenticated configuration reads and Compliance/Form Admin table writes exist through current RLS.
- Configuration-table audit triggers include regulations.

These are not proven and must never appear as working/live facts:

- regulation owner;
- regulation effective dates;
- regulation version label/history;
- maker-checker regulation lifecycle;
- published-regulation immutability;
- archive, clone, compare or deactivation;
- overlap detection;
- dependency-validation handler;
- package, active-inspection, violation, report or future-effective impact counts;
- direct Admin-family route guard;
- safe catalogued server-action errors.

Show unsupported capability only as `HANDOFF_BLOCKED`, unavailable or proposed. Never invent sample legal policy, approval deadlines, thresholds, providers or successful side effects.

## 6. Required selected composition

The chosen full page must include:

1. Frozen shared Admin shell, unchanged.
2. A compact command band for search, lifecycle and provenance scope.
3. A dense semantic list/register prioritizing regulation code/title, issuing authority/source, lifecycle truth, clause/item footprint and evidence freshness.
4. The attached Impact Footprint Rail for the selected regulation.
5. Explicit invalid, blocked, unknown, source-failed and legitimate-zero language.
6. A create-draft entry separated from irreversible lifecycle actions.
7. A detail handoff shown as blocked/proposed until `/admin/regulations/:id` is implemented.
8. No desired-state inline clause editor or direct publish action; identify both as current ownership debt to be reconciled with CD-006.

Avoid oversized cards, equal KPI tiles, spreadsheet-style inline editing, unexplained legal badges, decorative gradients, fake charts and generic “AI insights.”

## 7. Arabic, themes, responsive and accessibility

- Compose Arabic first with `lang=ar`, `dir=rtl`, realistic long Saudi legal titles and mixed-direction codes, clause references and dates.
- Physical RTL hierarchy must be intentional, not a mirrored English layout.
- English LTR must preserve the same semantic hierarchy.
- Dark and light must preserve meaning, emphasis and state severity.
- The 1024px design must recompose without horizontal-scroll dependency.
- Specify landmarks, headings, list/table semantics, row selection, keyboard order, visible focus, focus after filtering/failure, status announcements, non-color cues and reduced motion.
- Source failure must be isolated; it must never turn into zero records or whole-platform failure.
- Tooltips may supplement, never contain the only legal or status meaning.

## 8. Exact evidence exports

Export standalone frames, not design-canvas screenshots or crops:

- `CD-005_SCR-ADM-010_R1_primary_ar_dark_1440.png` — exactly 1440×1024.
- `CD-005_SCR-ADM-010_R1_primary_ar_light_1440.png` — exactly 1440×1024.
- `CD-005_SCR-ADM-010_R1_primary_en_dark_1440.png` — exactly 1440×1024.
- `CD-005_SCR-ADM-010_R1_primary_en_light_1440.png` — exactly 1440×1024.
- `CD-005_SCR-ADM-010_R1_ar_1024.png` — exactly 1024px wide, complete standalone frame.
- `CD-005_SCR-ADM-010_R1_en_1024.png` — exactly 1024px wide, complete standalone frame.
- `CD-005_SCR-ADM-010_R1_impact_rail_closeup.png`.
- `CD-005_SCR-ADM-010_R1_counterfactual.png`.
- `CD-005_SCR-ADM-010_R1_hard_states.png` — complete contact sheet.

Every frame must visibly contain `DESIGN FIXTURE — NOT RUNTIME EVIDENCE` inside the frame. The hard-state sheet must cover loading, legitimate empty, filtered empty, invalid record, publish blocked, published/read-only presentation, unauthorized design state, per-source failure, recovery and unknown impact.

Measure delivered dimensions and calculate SHA-256 from the final files. Never declare intended dimensions as measured dimensions.

## 9. Exact file ownership

Use literal paths only:

- `apps/web/src/app/admin/regulations/page.tsx` — server data loading and page composition.
- `apps/web/src/app/admin/regulations/Controls.tsx` — existing client create/clause/publish controls; disposition each export explicitly.
- `apps/web/src/app/admin/regulations/actions.ts` — existing create/add/publish actions; preserve unless a separately authorized implementation changes them.
- `apps/web/src/lib/i18n.ts` — current Arabic lookup mechanism using `ui_strings`; never call it a generated key store.
- `apps/web/src/app/tokens.css` and `apps/web/src/app/astryx.css` — existing shared tokens/styles; avoid changes unless the design proves a reusable gap.
- Frozen shell files are `PRESERVE`, not redesign targets.

Every proposed component must either be inline-owned by one exact file above or have one exact new repository path. No directory-only paths, placeholder filenames or parenthetical descriptions in path fields. Any retry or blocked action must name its owning file even when implementation remains blocked.

## 10. Binding research mapping

Do not remap these IDs:

- `R01`: product contract/internal authority.
- `R02`: Saqeel DEC-011 and tokens.
- `R11`: SAP Fiori list-report/role-oriented principles.
- `R12`: IBM Carbon dense-table and status principles.
- `R16` or `R17`: Saudi Digital Government authority.
- `R18`: WCAG 2.2.
- `R19`: WAI-ARIA Authoring Practices.

Additional research receives supplementary IDs. For every source record the adopted principle, rejected treatment and Saqeel-specific adaptation. Do not copy product styling or attribute Saqeel’s 44×44 target rule to WCAG 2.5.8.

## 11. One complete return package

Return one folder `cd-005-r1/` containing:

1. design index and current-screen critique;
2. route/runtime truth memo;
3. three-hypothesis comparison and counterfactual rationale;
4. state matrix;
5. role/route visibility matrix;
6. data-truth ledger;
7. row-complete wiring map;
8. exact-path component map and inheritance ledger;
9. localization inventory;
10. research ledger using the binding mapping;
11. implementation manifest;
12. Claude Code handoff with this banner at the top: `NOT EXECUTABLE — SPONSOR DESIGN APPROVAL, INDEPENDENT WIRING AUDIT, EXPLICIT IMPLEMENTATION AUTHORIZATION, AND A CLEAN DEDICATED WORKTREE ARE REQUIRED.`;
13. acceptance checklist covering every applicable Admin quality gate;
14. evidence manifest with measured dimensions and SHA-256;
15. interactive source and all required PNGs.

Every wiring row must map: UI trigger → client owner → route/action → validation/guard → transition → table/RPC/provider → RLS/role → audit → side effect → success → negative/partial failure → automated test → runtime evidence. Use `HANDOFF_BLOCKED` with an exact reason for every missing leg.

## 12. Silent preflight before return

Do not return until all of these pass:

- premium and regulation-specific after removing brand/title;
- three materially different hypotheses at equal fidelity;
- no invented runtime fact or legal policy;
- CD-005/CD-006 ownership separation is clear;
- every path is literal and deterministic;
- every wiring row complete or blocked;
- Arabic RTL, English, dark/light and 1024 evidence complete;
- keyboard/accessibility model complete;
- every export standalone and correctly measured;
- fixture disclosure visible inside every frame;
- research IDs unchanged;
- Claude Code handoff visibly non-executable.

If any check fails, repair it before returning. Do not ask the sponsor to catch packaging defects.

Do not implement, modify the frozen shell, start CD-006, claim approval or self-approve. End exactly:

`READY_FOR_MANDATORY_CD005_R1_REVIEW`
