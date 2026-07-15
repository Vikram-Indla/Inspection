# CD-009 — Premium Claude Design Prompt

## Paste instructions

Paste this entire file into Claude Design as one prompt. Return one complete sponsor-reviewable package. Independent review may request at most one consolidated correction; do not return exploratory fragments or ask the sponsor to discover packaging defects.

## Premium first-return rule

Before returning, silently verify: premium domain-specific composition; three materially different equal-fidelity hypotheses; Arabic-first RTL; equivalent English and dark/light states; constrained-width behavior; keyboard and accessibility semantics; no invented policy/runtime facts; literal file paths; complete-or-blocked wiring; standalone uncropped evidence exports with in-frame `DESIGN FIXTURE — NOT RUNTIME EVIDENCE`; measured dimensions and SHA-256; unchanged binding research IDs; and a visibly non-executable Claude Code handoff. Repair any failed check before returning.

A missing runtime leg is `HANDOFF_BLOCKED`, never a guessed success. The frozen shared shell is inherited, not redesigned.

---

CLAUDE DESIGN SCREEN PROMPT — CD-009 / SCR-ADM-031

You are designing Package and form designer for Saqeel MVP1. This is a controlled high-fidelity redesign of an already implemented product, not a greenfield concept.

MANDATORY REPOSITORY DISCOVERY
Read AGENTS.md; product-contract/00_START_HERE.md; CURRENT_STATE.md; GATE_STATUS.md; DECISIONS_ACCEPTED_2026-07-12_SAQEEL.yaml; design/claude-design-mvp1/00_START_HERE.md; CURRENT_UI_BASELINE.md; authority/CODE_ROUTE_RECONCILIATION.csv; product-contract/screens/screen_route_catalogue.csv; FABLE_UNDERSTANDING_TRACEABILITY.csv; FABLE_ACCEPTANCE_UNDERSTANDING.csv; and these screen-specific sources: PackageEditor.tsx; PackagePreview.tsx; DraftEditor/ImpactPanel/PublishControls; SCR-ADM-031. Inspect the existing implementation at apps/web/src/app/admin/packages. Record branch, commit and dirty-worktree state. Do not design from screenshots alone.

CONTRACT
Screen: SCR-ADM-031. Route/mode: /admin/packages (designer mode). Persona: Form Admin. Journey: P00. Engines: ENG-01, ENG-02, ENG-07, ENG-08. User job: Compose sections, rules, evidence and actions, then prove the package behaves correctly. Requirements: Filter the 493-row acceptance ledger and 478-row traceability by this screen and journey; preserve every matched row.

DESIGN THESIS
A three-pane studio—structure, field canvas, rule inspector—with an always-visible validation and runtime preview contract.
Why this way: A constrained builder must expose logic and downstream consequences without becoming an ungoverned no-code platform.
Signature differentiator: ‘Inspection consequence preview’ shows not only the question but the evidence, violation, action and review outcome it can produce.
Outlier/hard case: Circular conditions, hidden mandatory items, inaccessible field layouts and rules that work online but not offline.

INFLUENCE AND ORIGINALITY
Study references R01, R02, R03, R07, R10, R11 in the pack’s Reference Library. Adopt this principle: SafetyCulture inspection authoring, Field Maps form configuration and Camunda test-before-deploy discipline. Explicitly reject: No drag-anything canvas, BPMN palette, or consumer-form aesthetic. Saqeel’s DEC-011 tokens, typography, dark/light themes, EN/AR behavior and component grammar remain the visual authority.

MANDATORY OBJECTS
Section tree; item canvas; inspector; condition builder; evidence rule; action trigger; bilingual preview; simulation; validation; impact; publish controls.
Mandatory states: Clean draft; unsaved; validation errors; circular logic; preview; test pass/fail; submitted; published locked.
Blind spots to resolve visibly: Keyboard reordering; RTL preview; offline behavior; dependency impact; one screen can become too dense without focus mode.
Art direction: This is a flagship differentiator. Make complex configuration feel controlled, explainable and testable.

DELIVERABLE
Produce code-ready high-fidelity design, not a wireframe. Fit the existing route, React components, server actions, Supabase contracts, RBAC/RLS, state transitions, audit, offline outbox, version immutability and provider truth. Provide: (1) primary populated design; (2) the critical outlier/failure state; (3) applicable dark/light and EN/AR/RTL evidence; (4) desktop or 1024×1366 iPad portrait/landscape as appropriate; (5) component disposition—PRESERVE/UPDATE/CREATE/REMOVE, where REMOVE requires explicit human approval; (6) interaction, state, audit and data annotations; (7) PNG names CD-009_SCR-ADM-031_primary.png and CD-009_SCR-ADM-031_outlier.png.

DETERMINISTIC DESIGN-TO-CODE REPLACEMENT CONTRACT
The repository-derived candidate file inventory is: apps/web/src/app/admin/packages/DraftEditor.tsx; apps/web/src/app/admin/packages/ImpactPanel.tsx; apps/web/src/app/admin/packages/PackagePreview.tsx; apps/web/src/app/admin/packages/PublishControls.tsx; apps/web/src/app/admin/packages/actions.ts; apps/web/src/app/admin/packages/page.tsx. Verify this inventory against imports and runtime composition before designing; add transitive files only with evidence. For every affected .tsx, .ts, .css, localization or asset file, provide its exact repository-relative path, current responsibility BEFORE this redesign, disposition (PRESERVE/UPDATE/CREATE/REMOVE), responsibility AFTER this redesign, exact component/export/selector/token/design-node affected, and why the change is required. A directory, route or guessed filename is not sufficient. Preserve handlers, server actions, Supabase calls, schemas, RLS/RBAC, audit events, state transitions, localization keys, offline/conflict logic, test selectors and accessibility behavior unless an approved requirement explicitly changes them. Never overwrite the repository during the design phase.

Return these handoff files with the design: (A) IMPLEMENTATION_MANIFEST_CD-009.yaml containing prompt_id, screen_id, route, source_branch, source_commit, dirty_worktree, design_frame_ids, PNGs, and one file_changes entry per exact path with before_responsibility, disposition, after_responsibility, design_node, code_target, protected_behavior, dependencies, RTL/theme impact, tests and rollback; (B) COMPONENT_MAP_CD-009.csv mapping each design component/state to the existing or proposed code component and CSS selector/token; (C) CLAUDE_CODE_HANDOFF_CD-009.md with the controlled application order: semantic tokens → approved assets → shared components → route composition → localization → tests/evidence; and (D) ACCEPTANCE_CHECKLIST_CD-009.md tracing requirements, states, responsive modes, accessibility and visual evidence. If an exact file or behavior cannot be verified, use HANDOFF_BLOCKED with the missing evidence—never guess. Claude Code may apply only a human-approved manifest on a controlled branch/worktree and must report the resulting diff path by path.

SELF-CRITICISM LOOP — COMPLETE BEFORE RETURNING
Pass 1: contract coverage—no mapped requirement, state, role, error or negative path missing. Pass 2: inspection-domain plausibility—an inspector/admin/planner/reviewer can explain every object. Pass 3: differentiation—remove generic SaaS/dashboard/form-builder patterns and any copied product styling. Pass 4: cohesion—use the shared Saqeel shell, tokens and components; this screen must look native to all other screens. Pass 5: implementation fit—verify existing files, routes, data, responsiveness, 48px field targets, 16px inputs, WCAG AA, keyboard, focus, reduced motion and RTL. Revise internally until all five passes score 5/5. Return READY_FOR_DESIGN_REVIEW, never self-approve.

DESIGN AMBITION V2 — MANDATORY NON-GENERIC PROOF
1. Before the final screen, create three genuinely different composition hypotheses. They must change information architecture and task flow, not merely color, spacing or card treatment. Show a compact comparison and state why the chosen hypothesis best supports the primary 30-second user decision.
2. Include one signature interaction that compresses cognitive work, reveals causality/provenance, or prevents an irreversible error. Decorative novelty does not qualify.
3. Apply the genericity test: remove Saqeel branding, colors and the page title. If the design could pass unchanged as CRM, project management, ticketing or a generic dashboard, revise it.
4. Use inspection objects—factory, plan, visit, assignment, package version, submission, evidence, clause, violation, action and audit event—as the visual structure. Encode source, version, lifecycle state, scope and freshness wherever they affect a decision.
5. Research proof is required: cite at least three primary sources—one inspection/enterprise operational pattern, one Saudi government/public-service source, and one accessibility/RTL source. For each record the observed principle, what was adopted, and what visual/product treatment was explicitly rejected. Do not copy screenshots or brand grammar.
6. Arabic is a first-class composition, not a mirrored afterthought. Demonstrate realistic long Arabic strings, mixed-direction IDs/dates, full document RTL, keyboard order, focus, truncation and narrow layout. Supply dark and light states without changing semantic meaning.
7. Functional motion only: use it to preserve object continuity, explain a state change or transfer focus; include reduced-motion behavior. Do not use animation as polish theatre.
8. Do not self-award Grade 5. Return the evidence for every rubric dimension and finish with READY_FOR_DESIGN_REVIEW.

VERTICAL-SLICE HANDOFF V2 — DESIGN APPROVAL IS NOT BUILD COMPLETION
Return WIRING_MAP_<PROMPT_ID>.csv with one row for every user action and system state: UI trigger; client component; route/server action; validation/guard; canonical transition; table/RPC/storage/provider; RLS/grant/role; audit event; notification/side effect; success result; negative/partial-failure result; automated test; runtime evidence.
If any leg does not exist in the current repository/runtime, mark it HANDOFF_BLOCKED. Never invent a handler, table, RPC, policy, provider, state transition or successful side effect.
After sponsor design approval, Codex must independently audit the wiring before implementation authorization. Claude Code then implements only the approved vertical slice on a safe non-main branch/worktree and must prove the real data record, state transition, audit event, side effect, negative paths, Arabic/RTL/themes/responsive behavior, keyboard/screen-reader behavior and regression suite. Status may advance to VERTICAL_SLICE_PASS only after that evidence exists.

SHARED SHELL CONTRACT V3 — MANDATORY
Shell family: Shared Admin control-plane shell V1.
Tab/placement: Packages & Surveys · server-role-scoped group; no CRUD-only or unsupported placeholder tab.
The sponsor-approved global shell is implemented by apps/web/src/components/Shell.tsx, ShellClient.tsx, apps/web/src/lib/shell-navigation.ts and apps/web/src/app/astryx.css. Do not redesign the global sidebar, sticky topbar, account, theme, language, notification, sign-out, desktop collapse or mobile drawer inside this screen prompt. Preserve Arabic-first document RTL, magenta-violet Saqeel tokens, server-side role visibility, real links, accessible mobile focus/Escape behavior and page-specific filter scope. Unsupported Analytics, Lookup Management, Notification Configuration, Integration Management and AI destinations stay hidden unless a later governed contract and runtime route explicitly authorize them. Navigation visibility never replaces RLS, guards, canonical transitions, immutability or audit. Return any missing shell or route leg as HANDOFF_BLOCKED.
