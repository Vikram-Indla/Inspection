# CD-004 Mandatory Independent Design Review — R1

## Decision

**Gate verdict: FAIL**  
**Program status: CORRECTION_REQUIRED**  
**Implementation authorization: NOT GRANTED**  
**Chapter 2 authorization: NOT GRANTED**

The selected **Configuration Evidence Spine** is the right direction: it reads as a governed inspection control plane rather than a generic KPI dashboard, isolates a failed source, distinguishes unknown from zero, preserves the frozen shell, and avoids placing approve/publish controls on the home route. R1 is nevertheless not approvable. Seven P0 truth/handoff defects and six P1 evidence/polish defects remain.

The only allowed next action is one consolidated Claude Design correction pass producing a complete R2 package, followed by mandatory independent R2 review.

## Review authority and provenance

| Item | Value |
|---|---|
| Task | `TASK-DESIGN-ADMIN-SUITE-001` |
| CD / screen / route | `CD-004` / `SCR-ADM-001` / `/admin` |
| Review date | `2026-07-14` Asia/Riyadh |
| Reviewed archive | `MVP1 UXUI refinement program (1).zip` |
| Archive SHA-256 | `ce9ebc31f4b5822267212554d9c2d9be446a11faaf3768c329b8f9fa2ed91620` |
| Interactive HTML SHA-256 | `4a862a47fed3ed8787e87c02bb01a435ee02397b319097b6afb791ca5f378cff` |
| Repository branch / observed commit | `main` / `9360fc9dfcb9900bbffb50c2ae5e2540a987a545` |
| Review standard | `ADMIN_QUALITY_GATE_V1.md` plus the direct R1 prompt |

Review scope included every supplied CD-004 textual artifact, all six supplied PNGs, the interactive HTML source, full-size browser renders generated from that HTML, and the current `/admin` route/query/schema/RLS/test truth referenced by the R1 prompt. Unrelated CD packages in the archive were not judged.

## Evidence received

Received under `outputs/claude-design-approval-pack/admin-control-plane-suite/cd-004/`:

- `ACCEPTANCE_CHECKLIST_CD-004.md`
- `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-004.md`
- `COMPONENT_MAP_CD-004.md`
- `IMPLEMENTATION_MANIFEST_CD-004.yaml`
- `RESEARCH_PROVENANCE_CD-004.md`
- `ROUTE_RUNTIME_TRUTH_MEMO_CD-004.md`
- `STATE_MATRIX_CD-004.md`
- `WIRING_MAP_CD-004.csv`
- six PNG evidence images
- interactive source `CD-004 Admin Control Plane Home.dc.html`

The supplied PNGs are all `909×525` crops. Independent rendering of the HTML exposed frames at approximately `1602×743` primary, `1602×634` English dark, `934×234` light close-up, `414×537` narrow, `1600×634` states, `794×336` spine close-up, and `674×336` counterfactual. The document is fixed around 1600 px; it does not supply the required full 1440×1024 and 1024-wide evidence.

Required exact return artifacts that were not supplied:

- `CURRENT_SCREEN_CRITIQUE_CD-004.md`
- `HYPOTHESIS_COMPARISON_CD-004.md`
- `RESEARCH_LEDGER_CD-004.csv`
- `DESIGN_REVIEW_INDEX_CD-004.md`
- `CLAUDE_CODE_HANDOFF_CD-004.md`

Some of that content appears inline elsewhere, but the specified auditable package was not returned.

## What is worth preserving

1. **The signature interaction is specific and useful.** The Configuration Evidence Spine makes governance lineage visible at the point of navigation and is more appropriate than an equal-card dashboard.
2. **Failure semantics are directionally correct.** One source can be unavailable without turning its value into zero or presenting a platform-wide outage.
3. **The home remains an overview.** Detailed lifecycle actions remain outside CD-004 and no unsupported notification, analytics, lookup, integration, or AI destination was added.
4. **Arabic-first composition is visible.** The primary frame uses RTL shell placement and isolates mixed-direction identifiers with `bdi` treatment.
5. **The state model is broad.** The contact sheet conceptually covers nine states, and offline/sync is correctly treated as not applicable to this online admin route.
6. **The implementation boundary is prominent.** The handoff states that it is non-executable pending approval and audit.

These strengths should be refined, not discarded or replaced with a new visual concept.

## P0 findings — approval blockers

### P0-01 — Displayed lifecycle and provenance exceed current runtime truth

**Artifacts:** primary/English HTML frames; `ROUTE_RUNTIME_TRUTH_MEMO_CD-004.md`; `STATE_MATRIX_CD-004.md`; `WIRING_MAP_CD-004.csv`.

The current `/admin` route reads six result sets: engine-setting identity/timestamp and counts for regulations, checklist items, published packages, violations, and audit events. R1 additionally presents workflow verification, regulation update time, latest package version, a draft awaiting a distinct approver, and other provenance that is not supplied by those reads.

Specific contract violations:

- The regulation row shows a “last updated” date even though the inspected `regulations` schema does not provide `updated_at`.
- `ENG-05 · v2026.07.11` is presented as an engine-setting record, while current `engine_settings` keys are configuration domains such as risk, GIS, SLA, evidence, OTP, and field—not canonical `ENG-*` IDs.
- `draft → approve → publish → lock` overstates the proven package lifecycle. Current runtime truth supports draft/published behavior, distinct-approver constraints, and immutability after publication; it does not prove four separate canonical transitions.
- “Verified/versioned” workflow data and “1 draft awaiting distinct approver” have no exact current query mapping.

Every displayed fact must map to a current query result or to a precisely specified proposed query with table, columns, RLS, error handling, and blocked authorization status. Otherwise it must be removed or visibly `HANDOFF_BLOCKED`.

### P0-02 — Fixture disclosure is outside the exported product evidence

**Artifacts:** all full-page frames and PNG exports; `ACCEPTANCE_CHECKLIST_CD-004.md`.

Values such as 38, 6, 12 engines, 1,284 audit events, a recovery value of 54, versions, and timestamps are design fixtures. The only fixture note sits outside the product frame in the interactive canvas, and the supplied cropped exports omit it. The checklist's assertion that every count is labelled as a fixture is therefore false.

Use actual inspected runtime values, or place a persistent reviewer-evidence watermark/legend inside every exported evidence frame. It need not become production UI, but it must be inseparable from the evidence used for approval.

### P0-03 — Authorization/RLS statement contradicts inspected runtime truth

**Artifact:** `WIRING_MAP_CD-004.csv`, unauthorized-state row.

The row says “RLS denies data today.” Inspected configuration-read policies allow broad authenticated reads, and current tests permit an Inspector to reach `/admin`. The route-guard mismatch is an existing `HANDOFF_BLOCKED` issue; R1 may not convert it into a protection that does not exist.

The corrected artifact must state the current exposure plainly, separate route authorization from data RLS, identify the missing guard/policy decision, and preserve the blocked state without inventing a fix.

### P0-04 — Wiring map is neither row-complete nor action-complete

**Artifact:** `WIRING_MAP_CD-004.csv`.

Five broad rows do not satisfy the required mapping of each data source, route link, authentication/role resolution leg, audit link, hard state, refresh/retry action, and negative result. Multiple module links are collapsed into one row, while proposed refresh/retry behavior has no exact handler/query/result mapping.

Each interactive or stateful leg must map:

`UI element → guard → query/RLS → transition or read result → audit/side effect → failure result → test/evidence`.

Unsupported legs must be `HANDOFF_BLOCKED`, not inferred.

### P0-05 — Implementation manifest and localization handoff are not deterministic

**Artifacts:** `IMPLEMENTATION_MANIFEST_CD-004.yaml`; `COMPONENT_MAP_CD-004.md`; implementation prompt.

The manifest has no required `file_changes` collection and does not identify exact path, responsibility, disposition, test impact, and rollback for every proposed file. `ConfigurationEvidenceSpine` is left with `ROUTE_TARGET_BLOCKED` instead of an exact disposition. Localization keys are deferred to a future audit rather than enumerated now.

This fails `ADM-QG-16` and prevents a later implementation agent from making a bounded, reviewable change.

### P0-06 — Accessibility claims are not translated into implementable semantics

**Artifacts:** interactive HTML; `COMPONENT_MAP_CD-004.md`; implementation prompt.

The narrative claims a semantic table, skip link, main landmark, headings, and keyboard model. The design source itself contains no `main`, `h1`, `h2`, `table`, `th`, or skip link structure, and the component handoff does not specify the exact semantic model that production code must implement. Several apparent action targets are 36–40 px while research claims a 44 px target rule.

Design evidence need not be production HTML, but the handoff must unambiguously specify landmarks, heading order, table/list semantics, accessible names, focus sequence/transfer, status announcements, reduced motion, and target-size exceptions or corrections.

### P0-07 — Mandatory handoff files are missing and the acceptance record is not trustworthy

**Artifacts:** package inventory; `ACCEPTANCE_CHECKLIST_CD-004.md`.

Five exact required artifacts are absent. The acceptance checklist is a self-asserted evidence list rather than an honest `PASS/FAIL/BLOCKED/NOT_APPLICABLE` record, and it asserts fixture and wiring completeness contradicted by the package. Auditability is a P0 handoff requirement even where fragments exist in other files.

Return every required filename and rewrite acceptance rows against actual evidence. A failed or blocked row must remain failed or blocked.

## P1 findings — required quality corrections

### P1-01 — Viewport, theme, language, and export evidence is incomplete

The supplied PNGs are cropped `909×525` images. The underlying “light” frame is only a decision-zone close-up, the narrow frame is approximately 414 px mobile rather than the required constrained 1024 desktop, and no equivalent full-page Arabic dark/light pair is supplied. Return full, legible evidence at the named viewport sizes with fixture disclosure present.

### P1-02 — Hypotheses are not equal fidelity and do not match the requested alternatives

The two non-selected hypotheses are labelled content crops, are compact English-only fragments, and do not carry the same hard case. They also drift from the required alternatives: lifecycle spine, exception-first ledger, and control-plane matrix. Rebuild A/B/C at equal page/decision-zone fidelity with the same dataset, state, role, and Arabic-first constraints, then compare them using the approved decision criteria.

### P1-03 — Primary-source research coverage and ledger are incomplete

The package does not include the required CSV ledger and omits required source groups R01, R02, R09, R11, R12, and R19. NN/g may be supporting research but cannot replace the specified primary authorities. Record adopted principle, rejected treatment, Saqeel-specific implication, and the exact artifact decision for every required source.

### P1-04 — Arabic copy and mixed-direction treatment need a human-quality pass

The Arabic frame contains the English product-facing line `SIGNATURE — CONFIGURATION EVIDENCE SPINE`; this must be localized or moved to reviewer annotation. Several Arabic phrases read literally rather than as confident government-product language. Verify lifecycle-arrow physical order, dates, version labels, and identifiers in RTL at both widths.

### P1-05 — Admin-family and role composition is underrepresented

The selected spine exposes five broad rows and conflates distinct governed domains under engine settings. It does not demonstrate how risk, GIS, access, and other real Admin destinations/families compose across all six Admin roles. Provide a route/family/role visibility matrix and representative evidence without exposing actions a role cannot perform.

### P1-06 — Premium hierarchy, readable density, and equivalent theme proof need refinement

The dark composition is coherent and restrained, but important Arabic provenance and lifecycle copy frequently sits around 12–13 px in a very wide table. Improve rhythm, scan order, and legibility using inherited tokens; preserve the selected spine and avoid adding decorative dashboard chrome. Prove equivalent hierarchy and semantics in full light and dark frames.

## P2 observations

1. The critique says `Promise.all` creates fate-sharing. More precisely, the current Supabase calls resolve result objects and the route fails to inspect per-source `error`/null outcomes. Correct the diagnosis and specify explicit per-source result modelling.
2. The design document depends on externally fetched Google Fonts. Evidence should be self-contained or document the local/fallback font used so review renders remain reproducible.

## Gate table

| Gate | Result | Reason |
|---|---|---|
| `ADM-QG-01` | PASS | Core IDs, route, role, acceptance, and engine scope are traceable. |
| `ADM-QG-02` | FAIL | Runtime inspection is directionally good but displayed facts and authorization statements contradict inspected data/RLS truth. |
| `ADM-QG-03` | FAIL | Unsupported data and authorization legs are sometimes presented as verified rather than blocked. |
| `ADM-QG-04` | PASS | Selected concept is a governed control plane, not a generic KPI wall. |
| `ADM-QG-05` | FAIL | Alternatives are content crops, not equal-fidelity hypotheses using the specified three models. |
| `ADM-QG-06` | PASS | Selection rationale and counterfactual explain the reduction in hidden assumptions and decision time. |
| `ADM-QG-07` | PASS | One justified page-specific signature pattern is used. |
| `ADM-QG-08` | PASS | Frozen shell and core Saqeel visual language are substantially preserved. |
| `ADM-QG-09` | FAIL | Several values/fields are invented or undisclosed fixtures in exported evidence. |
| `ADM-QG-10` | FAIL | State concepts exist, but evidence and exact state wiring are incomplete. |
| `ADM-QG-11` | PASS | Partial source failure is isolated and not rendered as zero/platform-wide failure. |
| `ADM-QG-12` | FAIL | Arabic primary exists, but constrained/full-theme evidence and language quality are incomplete. |
| `ADM-QG-13` | FAIL | No equivalent full-page light/dark proof. |
| `ADM-QG-14` | FAIL | Accessibility narrative is not converted into deterministic semantic/keyboard handoff. |
| `ADM-QG-15` | FAIL | Required primary sources and research ledger are incomplete. |
| `ADM-QG-16` | FAIL | Manifest lacks exact path-level `file_changes`, dispositions, tests, and rollback. |
| `ADM-QG-17` | FAIL | Wiring map has five aggregate rows and an incorrect RLS claim. |
| `ADM-QG-18` | PASS | Non-executable boundary is prominent. |
| `CD004-QG-01` | PASS | The visual does not label counts or timestamps as canonical engine health. |
| `CD004-QG-02` | PASS | A failed count is presented as unknown/unavailable rather than zero. |
| `CD004-QG-03` | FAIL | Unsupported dates, versions, workflow verification, and draft/approver facts are displayed. |
| `CD004-QG-04` | FAIL | The route mismatch is mentioned but the wiring map falsely claims RLS denial. |
| `CD004-QG-05` | FAIL | Six-role/Admin-family composition is not demonstrated. |
| `CD004-QG-06` | PASS | Only governed real destinations are represented; no forbidden placeholder route is added. |
| `CD004-QG-07` | PASS | Home does not impersonate later module approval/publish actions. |
| `CD004-QG-08` | FAIL | Screen-level visual and evidence package is incomplete/cropped. |

## Required disposition

- Preserve the Configuration Evidence Spine as the selected direction.
- Correct every P0 and P1 in the consolidated R2 prompt.
- Return the complete package ending `READY_FOR_MANDATORY_R2_REVIEW`.
- Do not request sponsor approval until R2 passes independent review.
- Do not implement, edit application code, change RLS, add migrations, or advance to CD-005/Chapter 2.

