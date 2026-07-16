# Claude Design consolidated correction prompt — CD-006 through CD-011

## Paste instructions

Attach these three inputs, then paste this entire prompt into Claude Design:

1. the original `MVP1 UXUI refinement program (1) 2.zip` return;
2. `CD006_CD011_INDEPENDENT_REVIEW_2026-07-15.md`;
3. `CD006_CD011_CORRECTION_SOURCE_TRUTH_2026-07-15.md`.
4. `CD006_CD011_CORRECTION_CLOSURE_TEMPLATE.csv`.

This is the one consolidated correction iteration. Return one complete corrected folder or zip covering CD-006 through CD-011. Do not ask the sponsor to assemble missing files or discover packaging defects.

---

Perform the mandatory **CD-006–CD-011 consolidated correction** for the Saqeel Admin Control Plane family.

Scope is exactly CD-006, CD-007, CD-008, CD-009, CD-010, and CD-011. CD-004 and CD-005 are already outside this review and must not be redesigned, modified, regenerated, or used to waive any requirement.

This remains design-only. Do not edit application code, Supabase, migrations, the shared shell, product-contract files, tests, Git state, or deployment. Every Claude Code handoff must remain prominently `NOT EXECUTABLE` with `implementation_authorized: false` until sponsor design approval, an independent wiring audit, and separate explicit implementation authorization.

## Binding inputs and source discovery

The independent review is binding for defects. `CD006_CD011_CORRECTION_SOURCE_TRUTH_2026-07-15.md` is the binding source-truth memo prepared from:

- branch `setup/Inspection`;
- commit `1b530afe06a620b3b85173d10cec1f12074e2c18`;
- dirty worktree `true` on 2026-07-15;
- current Admin route source and migrations.

Before changing any frame, read the complete review and source-truth memo. Inspect every exact source file named for that CD in the memo, using the attached runtime snapshot/repository files. Return `SOURCE_DISCOVERY_LOG_CD006_CD011.md` listing each file actually read, its observed responsibility, relevant functions/queries/guards, and any contradiction with the memo.

Do not write `unknown — no fresh repository read`. Do not claim direct live-repository access if you used the packaged snapshot. The manifests must state:

- `source_branch: setup/Inspection`;
- `source_commit: 1b530afe06a620b3b85173d10cec1f12074e2c18`;
- `dirty_worktree: true`;
- `source_evidence: supplied Codex source-truth memo plus inspected attached source files`;
- the exact repository-relative paths actually inspected.

If an attached file contradicts the memo, do not choose silently. Record the contradiction, preserve the safer behavior, mark the affected leg `HANDOFF_BLOCKED`, and end the entire return `CORRECTION_BLOCKED` instead of claiming readiness.

## Preserve the strongest visual direction

Retain and refine these approved-in-principle directions unless runtime truth forces a local correction:

- CD-006: regulation dossier and clause-to-runtime trace;
- CD-007: semantic item catalogue and runtime-preview strip;
- CD-008: version-led package library and visible impact;
- CD-009: governed package studio and read-only field preview;
- CD-010: legal taxonomy and trace ribbon;
- CD-011: relationship workspace, restricted to proven one-to-one mapping conditions.

Do not restart branding, redesign the frozen shell, introduce generic dashboard/CRUD composition, add more than one page-specific signature pattern, or use decorative novelty. Correct truth, state coverage, accessibility, and packaging without lowering visual quality.

## Audit findings that must all close

Copy `CD006_CD011_CORRECTION_CLOSURE_TEMPLATE.csv` to `CORRECTION_CLOSURE_MATRIX_CD006_CD011.csv`, preserve every row and column, and complete it with exact corrected artifact/frame references, verification method, and `PASS` or `BLOCKED`. No row may be omitted.

| Finding ID | Required closure |
| --- | --- |
| AUD-P0-01 | Repository/source discovery is evidenced; branch, commit, dirty state, paths, before-responsibilities, queries/actions/RLS/audit are exact. |
| AUD-P0-02 | CD-011 has a complete visual and evidence package; every declared artifact physically exists. |
| AUD-P0-03A | CD-006 no longer implies mapped-clause validation, regulation maker-checker, published immutability, version compare, or audit visibility is implemented when it is not. |
| AUD-P0-03B | CD-007 uses the confirmed item schema/actions/RLS and isolates genuinely absent reuse/usage/audit legs. |
| AUD-P0-03C | CD-010 removes unsupported `violation_codes` audit and invented schema/action claims. |
| AUD-P0-03D | CD-011 uses the real `penalty_mappings` schema and one-to-one constraint; invented overlap/effective-period/lifecycle/approval/audit behavior is removed or blocked. |
| AUD-P1-01 | Every required state is mapped to delivered evidence for every CD. |
| AUD-P1-02 | Every 1024×1366 file is a native 1024×1366 export, not 700×520 or a scaled canvas. |
| AUD-P1-03 | Every user action and system state has a complete wiring row or an exact `HANDOFF_BLOCKED` row. |
| AUD-P1-04 | CD-008 and CD-009 bind the retained concepts to the real package RPC/editor/preview/validation/maker-checker/audit/immutability behavior. |

## Shared truth and presentation rules

1. Contract routes and current routes must both be shown in the route/runtime memo. Consolidated logical modes remain inside the current route; do not invent `/admin/regulations/:id`, `/admin/packages/:id/designer`, or `/admin/penalties` as live routes.
2. Base configuration SELECT is authenticated-wide; writes are RLS-limited to `compliance_admin`/`form_admin`. Where this differs from the catalogue persona, disclose the mismatch; do not broaden the contract.
3. Generic row audit exists for `regulations` and `package_versions`, not for `regulation_clauses`, `inspection_items`, `violation_codes`, or `penalty_mappings`.
4. Audit-event reading is not granted to Compliance/Form Admin solely through those roles. Do not show a usable audit timeline for them without an exact permitted source.
5. A visual fixture must never be described as runtime proof. Every visual export must visibly include `DESIGN FIXTURE — NOT RUNTIME EVIDENCE`.
6. Every invented-looking count, version, date, identifier, title, or legal reference must be labelled as a design fixture. Monetary amounts and new legal rules are prohibited.
7. Any failed/denied source renders `unavailable` or `unknown`; never zero, healthy, mapped, delivered, complete, or successful.
8. No stale duration, SLA, provider status, legal threshold, risk weight, or policy may be invented.
9. Arabic is the primary composition: realistic long legal/configuration copy, full document RTL, stable mixed-direction codes/dates, correct physical order, and no mirrored icon/identifier errors.
10. Dark/light and EN/AR variants must preserve the same objects, state, actions, and semantic priority.

## Per-CD corrections

### CD-006 — SCR-ADM-011

Retain the dossier and trace direction, but correct the lifecycle truth:

- Persona is Compliance Admin and Reviewer from the catalogue. Do not invent a generic Approver role.
- Proven data: regulation code/title/issuing authority/status; clauses with ref/title; mapped item codes. `addClause` also accepts legal source even though the page query does not read it back.
- Proven actions: create regulation draft, add clause, direct `draft → published` update.
- Proven audit: regulation row only; not clause rows. Audit visibility differs by role.
- Not proven: mapped-clause publish validation, submit, approve, compare, successor/supersede, regulation published lock, dependency engine, audit timeline query, dedicated detail route, route guard.

The visual may specify target states required by the product contract, but every unavailable target must be visibly annotated `DESIGN TARGET — HANDOFF_BLOCKED`, and working controls must not be shown. Replace W05’s “current-after-modify” claim with an exact split: current direct publish versus blocked contract-safe validation/maker-checker/lock path.

Required hard case: a draft with unmapped clauses where the design explains that contract-safe publish must block, while the current runtime does not enforce that rule. This is a blocker disclosure, not a functioning button.

### CD-007 — SCR-ADM-020

Retain the semantic catalogue and preview strip, using exact current truth:

- Current fields: code, title, active, score weight, response model, evidence rule, clause/regulation link; schema also has score-exclusion and EN/AR guidance.
- Current actions: create item from governed presets and toggle active state.
- Current package validation rejects inactive/missing items and malformed dependent mappings.
- Database unique code supports the duplicate negative path.
- Missing: item edit/version lifecycle, deactivation reason, item audit trigger, item-route package-usage count, conditional-rule authoring.

Remove “schema unconfirmed” from proven rows. A published-use warning may exist as a design target only when its count is `unavailable` and its query leg is `HANDOFF_BLOCKED`; do not show a fabricated usage count. Preserve history on deactivation but do not claim a stored reason.

### CD-008 — SCR-ADM-030

Retain the version-led library and bind it to the current package implementation:

- Use the real packages/package_versions read.
- Use `package_version_impact(uuid)` for active visit/inspection counts pinned to prior published/locked versions.
- Use the current definition diff and shared-item package fan-out from `page.tsx`/`ImpactPanel.tsx`.
- Use `createDraftVersion`, `PackagePreview`, publish-time `validateDefinition`, `approveAndPublish`, the package maker-checker constraint/trigger, the published-version immutability trigger, and the package-version audit trigger.
- RPC denied/error state is `unavailable`, never zero.
- Do not invent effective dates, scheduled versions, or a supersede lifecycle not present in the schema.

Replace all unknown current responsibilities with literal file/component responsibilities. Show a clear distinction between current published, other published/locked versions, and draft using only actual status values. Any fixture count must be watermarked and never cited as runtime evidence.

### CD-009 — SCR-ADM-031

Retain the governed studio but separate current editor controls from blocked target capabilities:

- Working/current: edit section title; section mandatory flag; add/remove item; add section; save draft definition; read-only field preview; impact; publish validation; package maker-checker; package audit; package immutability.
- Stored order exists through the item array, but no current reorder control exists.
- Existing conditions may be displayed from item data; no current condition authoring exists.
- No simulation engine, circular-condition detector, per-item required/optional/conditional authoring, scoring toggle, full evidence editor, or action-form authoring is proved.

Do not render blocked capabilities as enabled controls. If retained to communicate the future contract, use visibly disabled/non-interactive target panels labelled `HANDOFF_BLOCKED` with the missing schema/action/engine. Describe `PackagePreview` as a read-only runtime-shaped projection, not a simulator.

### CD-010 — SCR-ADM-040

Retain the legal taxonomy and trace direction, but use the actual violation-code model:

- Current schema: unique code, title, L1/L2/L3 level, clause link, active-from, active-to.
- Current action: create with code/title/level/clause/active-from.
- Current route also reads the nested penalty summary.
- Missing: category, violation-row applicability, edit, version, deactivate action, usage count, trigger-trace query, violation-code audit.
- Legal basis belongs to the penalty mapping, not the violation-code row.
- Do not confuse runtime `violations` with configuration `violation_codes`.

If active/future/deactivated is shown, derive it explicitly from active-from/active-to and the visible current date; do not claim a status enum. The orphan/duplicate negative paths must use actual clause/unique-code facts. Historical record counts and package-use counts must not be fabricated.

### CD-011 — SCR-ADM-041

Regenerate this CD completely; the prior text-only package is not evidence.

Use the real consolidated penalty mapping behavior:

- Current route: `/admin/violations` penalty mode; `/admin/penalties` is contract-only.
- Current schema: unique violation reference, penalty reference, JSON range preset, JSON repeat-rule preset, legal basis, mapping version.
- Current action: create a mapping with required legal basis and governed presets.
- Proven conflict/negative states: unmapped violation, missing legal basis before create, missing/invalid preset, duplicate one-to-one mapping rejection.
- Not present: effective periods, overlap/gap engine, configurable cardinality beyond one-to-one, submit/approve/publish status, maker-checker, mapping immutability, mapping audit trigger.
- `FLD-PEN-001` makes the exact version used by results an immutable reference; it does not prove the mapping row is immutable.

The relationship workspace may retain a “conflict lens” only for proven conditions above. Remove effective-period overlap/gap visualizations, monetary examples, working approver/publish controls, and published-lock claims. Contract-target approval/publish states may appear only as clearly blocked/non-interactive annotations.

## Required state evidence for every CD

Create `STATE_MATRIX_CD-0XX.csv` with these exact state IDs:

- `S01_POPULATED`
- `S02_LOADING`
- `S03_EMPTY`
- `S04_VALIDATION`
- `S05_UNAUTHORIZED`
- `S06_READ_ONLY`
- `S07_STALE`
- `S08_DEGRADED`
- `S09_RECOVERY`

Columns must include: state ID, contract source, trigger, persona, source/query, visible result, prohibited false result, action availability, keyboard/focus behavior, screen-reader announcement, theme/locale evidence file, current/proposed/blocked disposition, and wiring-row IDs.

At minimum, the primary and outlier frames plus a complete hard-state contact sheet must visibly cover all nine states. Do not merely list a state in text. Unauthorized must remain distinct from unauthenticated login and from an empty result. Read-only must identify why mutation is unavailable. Degraded must isolate one failing source. Recovery must show retry/focus/status behavior without implying success before the read succeeds.

## Required visual exports per CD

Export every file directly and standalone—no canvas crops, neighbouring frames, or scaled preview files:

- `CD-0XX_<SCREEN>_primary.png` — 1440×1024;
- `CD-0XX_<SCREEN>_outlier.png` — 1440×1024;
- `CD-0XX_<SCREEN>_ar_dark_1440.png` — 1440×1024;
- `CD-0XX_<SCREEN>_ar_light_1440.png` — 1440×1024;
- `CD-0XX_<SCREEN>_en_dark_1440.png` — 1440×1024;
- `CD-0XX_<SCREEN>_en_light_1440.png` — 1440×1024;
- `CD-0XX_<SCREEN>_constrained_1024x1366.png` — exactly 1024×1366 native pixels;
- `CD-0XX_<SCREEN>_hard_states.png` — large enough for every state to be legible at 100% review scale.

Measure actual dimensions and calculate SHA-256 from the delivered files. Generate `EVIDENCE_MANIFEST_CD-0XX.csv` from those measurements. The manifest must fail closed if a named file is absent. Never type dimensions from intent.

## Required handoff files per CD

Return a self-contained `cd-0XX-r2/` directory for each CD with:

1. `ROUTE_RUNTIME_TRUTH_MEMO_CD-0XX.md`
2. `CURRENT_SCREEN_CRITIQUE_CD-0XX.md`
3. `DATA_TRUTH_LEDGER_CD-0XX.csv`
4. `HYPOTHESIS_COMPARISON_CD-0XX.md` — preserve the selected direction; note only corrections
5. all required PNGs
6. `EVIDENCE_MANIFEST_CD-0XX.csv`
7. `STATE_MATRIX_CD-0XX.csv`
8. `ACCESSIBILITY_KEYBOARD_SPEC_CD-0XX.md`
9. `LOCALIZATION_INVENTORY_CD-0XX.csv`
10. `RESEARCH_LEDGER_CD-0XX.csv`
11. `COMPONENT_MAP_CD-0XX.csv`
12. `IMPLEMENTATION_MANIFEST_CD-0XX.yaml`
13. `WIRING_MAP_CD-0XX.csv`
14. `ACCEPTANCE_CHECKLIST_CD-0XX.md`
15. `CLAUDE_CODE_HANDOFF_CD-0XX.md`

Every implementation-manifest path must be a literal repository-relative path. Every affected current file needs exact before-responsibility, disposition, after-responsibility, exact export/selector/design node, protected behavior, dependencies, RTL/theme impact, tests, rollback, and current/proposed/blocked status. A directory or guessed filename is invalid.

Every wiring map must include one row per action and per system state with:

`wiring_id, state_or_action_id, ui_trigger, client_component, route_server_action, validation_guard, canonical_transition, table_rpc_provider, exact_columns_or_payload, rls_grant_role, audit_event, notification_side_effect, success_result, negative_partial_failure, keyboard_focus_announcement, automated_test, runtime_evidence, disposition, blocker_owner`

Use `none` only when the source proves no leg is required. Use `HANDOFF_BLOCKED` with the exact missing handler/schema/policy/route/test when a leg does not exist. “Assumed,” “likely,” and “unknown” are not acceptable final dispositions.

## Accessibility and interaction gate

For every CD, specify and evidence:

- semantic page landmark and heading order;
- row/card selection semantics;
- tab/arrow/Enter/Space/Escape behavior where applicable;
- focus entry, focus return, and focus transfer after error/retry;
- `role=status` versus `role=alert` announcements;
- non-color lifecycle/error cues;
- 44px minimum Saqeel target choice and 16px input text;
- logical-property RTL layout and stable mixed-direction identifiers;
- reduced-motion behavior for any disclosure/trace continuity;
- no keyboard-only hidden action or drag-only reorder requirement.

## Silent preflight before return

Before returning, verify all of the following without asking the sponsor to inspect them for you:

1. Every audit finding has a closure-matrix row.
2. Every declared file exists.
3. Every PNG dimension and SHA-256 matches the manifest.
4. Every required state maps to legible visual evidence and wiring.
5. Every current claim matches the source-truth memo and inspected source.
6. Every absent runtime leg is visibly and textually `HANDOFF_BLOCKED`.
7. No design fixture is presented as runtime evidence.
8. CD-011 is visually complete.
9. No CD-004/CD-005 or shared-shell artifact changed.
10. Every Claude Code handoff says `NOT EXECUTABLE` and `implementation_authorized: false`.

If all ten pass, end the package with exactly:

`READY_FOR_MANDATORY_FINAL_REVIEW`

If any P0/P1 cannot be corrected from the supplied evidence, do not return a false ready marker. End with exactly:

`CORRECTION_BLOCKED`

and list the unresolved finding ID, missing evidence, owner, and next allowed action.
