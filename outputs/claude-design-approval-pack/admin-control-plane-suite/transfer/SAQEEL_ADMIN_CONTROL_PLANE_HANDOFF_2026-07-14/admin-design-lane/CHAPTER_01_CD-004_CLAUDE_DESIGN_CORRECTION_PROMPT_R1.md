# Claude Design Correction Prompt — CD-004 R1 → R2

Paste this prompt into Claude Design together with the complete R1 package.

---

You are performing the single mandatory correction pass for Saqeel Admin Control Plane **CD-004 — Admin Control Plane Home** (`SCR-ADM-001`, route `/admin`).

This is a **design and deterministic handoff correction only**. It is not application implementation, sponsor approval, wiring approval, or authorization to change code, data, RLS, migrations, routes, product-contract artifacts, or Git state.

## Read first

Treat these as binding, in this order:

1. `ADMIN_MASTER_FOUNDATION_V1.md`
2. `ADMIN_QUALITY_GATE_V1.md`
3. `ADMIN_COMPONENT_INHERITANCE_LEDGER_V1.md`
4. `CHAPTER_01_CD-004_CLAUDE_DESIGN_PROMPT_R1.md`
5. `CD-004_DESIGN_REVIEW_R1.md`
6. the complete R1 CD-004 return package

Do not reinterpret the review findings. Resolve all P0 and P1 items in one coherent R2 package.

## Preserve the approved direction

Keep **Configuration Evidence Spine** as the selected signature interaction. Preserve:

- the governed-control-plane character;
- Arabic-first RTL shell placement;
- a source failure shown as unknown/unavailable, never zero or platform-wide failure;
- provenance/lifecycle visibility at the point of navigation;
- the frozen Saqeel shell, tokens, type system, navigation, focus language, and theme semantics;
- the overview boundary: no approve, publish, transition, or module-detail action on the home route;
- no unsupported notification, analytics, lookup, integration, or AI destination;
- the prominent `NOT EXECUTABLE` implementation boundary.

Do not restart the visual direction, invent a second signature pattern, or turn the page into equal KPI cards.

## Mandatory P0 corrections

### 1. Make every displayed fact source-exact

Create a data-truth ledger with one row per visible value or claim:

`visual element → label → value/type → current/proposed source → exact table/view/function → exact columns → query/filter → RLS/guard → error/null rendering → fixture/runtime status → evidence reference`.

Current `/admin` truth is limited to the inspected route reads unless you specify a proposed implementation leg precisely. In particular:

- Do not use `regulations.updated_at`; that inspected column does not exist.
- Do not represent `ENG-05` as an `engine_settings` key. Use actual configuration-domain keys only when sourced, or remove the claim.
- Do not show workflow settings as “verified/versioned” without an exact query and inspected record shape.
- Do not show latest package version, draft queue count, approver dependency, or update timestamp without exact source mapping.
- Do not show `draft → approve → publish → lock` as the canonical package lifecycle. Use only proven canonical states/transitions, or mark the unresolved lifecycle representation `HANDOFF_BLOCKED`.
- Never infer engine health, runtime consumption, provider health, SLA, overdue status, staleness, risk, or approval age from counts or timestamps.

If a useful design element requires a new read, list the exact proposed table/view/RPC, columns, filtering, RLS, error contract, test, and audit implications. Mark it `HANDOFF_BLOCKED — IMPLEMENTATION/AUTHORIZATION REQUIRED`; do not present it as current runtime truth.

### 2. Make fixtures inseparable from approval evidence

Use one of these approaches for every evidence frame:

- render inspected runtime values and identify the capture source/date; or
- include a persistent visible reviewer overlay/watermark such as `DESIGN FIXTURE — NOT RUNTIME EVIDENCE` plus a fixture legend.

The label may be outside the production UI boundary but must be inside every exported image. It must cover counts, dates, names, versions, statuses, and recovery values. Do not assert that a fixture is labelled when the exported frame omits the label.

### 3. Correct authorization and RLS truth

State explicitly:

- current configuration-read policies permit broad authenticated reads where confirmed by inspection;
- current route/tests do not prove the required Admin-family direct-route guard and may permit an Inspector to reach `/admin`;
- route authorization and data RLS are separate enforcement layers;
- the mismatch remains `HANDOFF_BLOCKED` pending an authorized implementation/change decision.

Do not say “RLS denies data today.” Do not design a UI-only guard as if it were enforcement.

### 4. Replace the wiring map with a row-complete version

Return `WIRING_MAP_CD-004.csv`, one row per:

- authentication/session resolution;
- Admin-family role resolution and direct-route guard;
- each of the six current data-source reads;
- every proposed additional read, separately marked blocked;
- every distinct governed route link;
- audit-log link;
- refresh/retry action per source;
- loading, legitimate zero, empty/not-configured, unauthorized, read-only, stale/last-known, degraded/partial failure, total failure, and recovery behavior;
- language/theme behavior only where it affects state or persistence.

Required columns:

`wiring_id, screen_id, role, ui_element, user_intent, route_or_handler, guard, source_type, source_name, query_or_transition, rls_or_permission, audit_or_side_effect, success_result, negative_result, error_result, retry_or_recovery, test_id, evidence_id, disposition, blocker_reason`.

Do not collapse all module links or all sources into one row. Do not invent transitions or audit events for read-only navigation.

### 5. Return a deterministic path-level implementation manifest

`IMPLEMENTATION_MANIFEST_CD-004.yaml` must contain a `file_changes` array. Each item must include:

`path, responsibility, disposition(reuse|modify|create|remove|blocked), exact_change, contract_ids, dependencies, localization_keys, tests, evidence, rollback, authorization_status`.

Use exact repository paths. If an exact path cannot be justified from inspection, mark the item blocked; do not use a placeholder path. Include a forbidden/do-not-touch list. Enumerate every Arabic and English localization key with default copy, interpolation, directionality notes, and fallback behavior in a dedicated localization inventory.

### 6. Make accessibility implementable and internally consistent

Supply an accessibility/keyboard specification that fixes:

- skip link and `main` landmark;
- one `h1` and deterministic heading order;
- exact semantic structure for the evidence spine (table, list, or grouped regions) and why it is correct;
- row/link accessible names and relationship between visible labels and provenance details;
- keyboard order, activation, focus ring, focus transfer after retry/recovery, and focus restoration;
- live-region behavior for per-source loading/failure/recovery without announcement storms;
- non-color status cues, reduced-motion behavior, zoom/reflow, truncation/wrapping, and mixed-direction text;
- a 44×44 CSS-pixel target for primary actions, with any allowed exception explicitly documented.

The component map and implementation handoff must repeat these semantics precisely. Do not claim semantics that the handoff does not specify.

### 7. Restore the complete auditable artifact set

Return every exact file listed below. Rewrite the acceptance checklist as evidence-based rows using only `PASS`, `FAIL`, `BLOCKED`, or `NOT_APPLICABLE`, with artifact/frame references. No self-approval and no unsupported completeness claim.

## Mandatory P1 corrections

### 8. Rebuild evidence at the required full viewports

Return uncropped, legible, full-frame evidence for:

- Arabic RTL primary, dark, `1440×1024`;
- Arabic RTL primary, light, `1440×1024`;
- English LTR equivalent state, dark, `1440×1024`;
- English LTR equivalent state, light, `1440×1024`;
- Arabic constrained desktop, `1024` px wide;
- English constrained desktop, `1024` px wide;
- primary evidence-spine close-up;
- counterfactual without the signature interaction;
- every required hard state, with at least the critical partial-failure/recovery path in Arabic and English.

Do not substitute a 414 px mobile frame for constrained desktop. Maintain equivalent data/state/role across theme and language comparisons. Put fixture disclosure inside every exported image.

### 9. Rebuild the three hypotheses at equal fidelity

Use the same role, dataset, hard case, shell, and viewport for all three:

- **A — Lifecycle evidence spine**
- **B — Exception-first governance ledger**
- **C — Control-plane matrix**

Each must be a complete decision-zone/full-page candidate, not a content crop. Show realistic Arabic-first treatment and the same source-failure case. Compare decision time, assumption visibility, irreversible-error risk, Arabic scan quality, role clarity, accessibility, implementation risk, and signature-pattern cost. Keep A selected only if the evidence still supports it.

### 10. Complete the primary-source research ledger

Return `RESEARCH_LEDGER_CD-004.csv` covering at minimum R01, R02, R09, R11, R12, R16 or R17, R18, and R19 from the foundation/prompt. Each row must include:

`research_id, primary_source, source_section, accessed_date, adopted_principle, rejected_treatment, saqeel_decision, affected_artifact, provenance_note`.

Supporting secondary research may remain, but it cannot replace the named primary authorities. Record principles; do not copy product compositions.

### 11. Perform a human-quality Arabic and bidi pass

- Localize or move `SIGNATURE — CONFIGURATION EVIDENCE SPINE` to reviewer-only annotation.
- Replace literal/awkward Arabic with concise, authoritative government-product language.
- Verify physical RTL order for breadcrumb, row flow, lifecycle sequences, chevrons, icons, dates, version labels, and identifiers.
- Use `dir`, `bdi`, or isolation rules explicitly for mixed-direction values.
- Test realistic long Arabic labels at 1440 and 1024 without unreadable 12–13 px critical text.

### 12. Prove Admin-family and role composition

Return a route/family/role visibility matrix covering the six Admin roles and all real governed Admin destinations relevant to CD-004, including distinct treatment for compliance, packages, enforcement, workflow, risk, GIS, access, and engine/settings domains where supported by the route inventory.

For each role show `visible`, `linked`, `read-only`, `hidden`, or `HANDOFF_BLOCKED`, with the exact authority. Do not expose or enable unauthorized actions. Include representative frame evidence for the primary role plus at least one materially different read-only/restricted role.

### 13. Raise the visual finish without adding decorative chrome

Refine the selected full page for:

- readable Arabic body/provenance type;
- clear scan order from page purpose to exceptions to governed destinations;
- calm spacing rhythm and alignment across the wide spine;
- unambiguous status hierarchy using text/icon/shape, not color alone;
- equivalent semantic prominence in light and dark;
- stable layout under long labels, mixed-direction values, zoom, and 1024 width.

Use inherited Saqeel tokens. Do not add gradients, glass effects, arbitrary KPI cards, ornamental charts, or a second signature component.

## Precision corrections

- Replace “`Promise.all` fate-sharing” with the exact diagnosis: Supabase calls resolve per-source result objects, while the current route fails to inspect and model each result's `error`, null, and count state independently.
- Make design evidence reproducible without relying on an external font fetch, or document the bundled/local fallback used for capture.

## Exact R2 return package

Return one self-contained `cd-004-r2/` package with these exact artifacts:

1. `DESIGN_REVIEW_INDEX_CD-004_R2.md`
2. `ROUTE_RUNTIME_TRUTH_MEMO_CD-004_R2.md`
3. `CURRENT_SCREEN_CRITIQUE_CD-004_R2.md`
4. `DATA_TRUTH_LEDGER_CD-004_R2.csv`
5. `RESEARCH_LEDGER_CD-004_R2.csv`
6. `HYPOTHESIS_COMPARISON_CD-004_R2.md`
7. three equal-fidelity hypothesis frames
8. selected Arabic/English, dark/light, 1440/1024 full-page evidence
9. selected decision-zone close-up and counterfactual
10. populated and all required hard-state frames
11. `ROLE_ROUTE_VISIBILITY_MATRIX_CD-004_R2.csv`
12. `COMPONENT_INHERITANCE_CD-004_R2.md`
13. `ACCESSIBILITY_KEYBOARD_SPEC_CD-004_R2.md`
14. `STATE_MATRIX_CD-004_R2.md`
15. `IMPLEMENTATION_MANIFEST_CD-004_R2.yaml`
16. `COMPONENT_MAP_CD-004_R2.md`
17. `LOCALIZATION_INVENTORY_CD-004_R2.csv`
18. `WIRING_MAP_CD-004_R2.csv`
19. `ACCEPTANCE_CHECKLIST_CD-004_R2.md`
20. `CLAUDE_CODE_HANDOFF_CD-004_R2.md`
21. the corrected interactive design source and an evidence manifest with viewport, theme, language, role, state, fixture/runtime status, file hash, and artifact path for every image

The Claude Code handoff must begin with:

`NOT EXECUTABLE — DESIGN HANDOFF ONLY. REQUIRES SPONSOR DESIGN APPROVAL, INDEPENDENT WIRING AUDIT, AND EXPLICIT IMPLEMENTATION AUTHORIZATION.`

It must not instruct Claude Code to begin work now.

## Completion rule

Before returning, audit every `ADM-QG-*` and `CD004-QG-*` row against actual R2 evidence. Any unresolved item stays `FAIL` or `BLOCKED`; never self-waive it. End the package with exactly:

`READY_FOR_MANDATORY_R2_REVIEW`

Do not say approved, implementation-ready, or ready for sponsor review.

---

