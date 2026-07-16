# Claude Design Progressive Correction Prompt — CD-027 R1 → R2

Paste this entire prompt into **Claude Design** in the existing CD-027 Visit Detail project.

This is a focused design-package correction. It is **not** a Claude Code implementation prompt.

## Identity and hard boundary

- Product: Saqeel MVP1 (`صقيل | صناعي`)
- Design: `CD-027 / SCR-WEB-210 / P03 — Visit Detail`
- Revision to create: `R2`
- Route: `/visits/:id`
- Acceptance: `DSG-022`, `DSG-A11Y-001`

Keep exactly:

`implementation_authorized: false`

Every Claude Code-facing file must begin:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, migrations, database data, tests, product-contract files or Git history. Do not implement, commit, push, merge, deploy, modify `main`, switch branches, reset, clean, stash, discard, or overwrite the dirty worktree.

## Preserve the R1 work

Do not weaken or redesign:

- the accepted shared Saqeel shell, tokens, typography, dark/light themes, Arabic-first document RTL, focus grammar, role-scoped navigation, desktop collapse, or mobile drawer;
- the **Dual-State Ribbon** as the sole page-specific signature interaction;
- five separate state domains: planning, operational, assignment, inspection and review—never collapse them into one chip;
- RLS, append-only audit, immutable submission versions, system-only expiry, private soft-deleted attachments, and queued-not-delivered notification truth;
- the 14-leg wiring map and existing `HANDOFF_BLOCKED` truth: map, error mapping, attachment orphan recovery, previous-inspector notification, assignment release, and cross-write atomicity;
- available / disabled-with-why / unavailable action zones; no direct status mutation;
- the existing R1 dark/light, Arabic RTL, 1024px, 412px, partial-side-effect, stale/RLS, attachment and map-blocked state evidence;
- `BASELINE_REVERIFY_REQUIRED` with no exact-baseline equivalence claim.

Do not invent a map/provider/geofence result, notification delivery, SLA/risk/capacity/travel/suitability value, support/escalation path, direct state transition, assignment release, or transactional rollback.

## Correct only these two P1 defects

### 1. Create three real, distinct equal-fidelity hypothesis frames

The prior files named HYP-A/HYP-B/HYP-C were duplicate annotation fragments. Replace them with three complete, independently selectable, same-size high-fidelity 1440px Visit Detail compositions using the same realistic visit data, the same shell, the same five state domains, the same action boundary, and the same representative hard state.

Each full frame must show:

1. identity header with realistic mixed-direction visit/plan/package IDs;
2. the five state domains with text/icon/pattern—not colour only;
3. factory, assignment, schedule, package/version, inspection/review provenance, immutable history and timeline context;
4. allowed action / disabled-with-why / unavailable treatment;
5. a neutral partial-side-effect or unavailable-service truth;
6. keyboard-focus and screen-reader annotations;
7. the list-equivalent/no-map truth where a map would otherwise be implied.

The architectures must materially differ:

| Hypothesis | Composition |
| --- | --- |
| A — Provenance dossier (selected) | Identity header → Dual-State Ribbon is the governing decision zone → evidence-led detail chapters. |
| B — Action boundary first | The allowed-action/guard boundary leads; state/history is persistent adjacent evidence. It must still show the full visit reconstruction. |
| C — Chronological case file | Immutable event/history chain leads; current facts and allowed action are persistent summary rails. It must still expose current action truth without excessive scan. |

Do not change merely card order, colour or labels. Use no second signature interaction.

Create and verify distinct rendered output for:

- `CD-027_SCR-WEB-210_HYP-A-PROVENANCE_dark_en_1440_R2.png`
- `CD-027_SCR-WEB-210_HYP-B-ACTION_dark_en_1440_R2.png`
- `CD-027_SCR-WEB-210_HYP-C-CHRONO_dark_en_1440_R2.png`
- `CD-027_SCR-WEB-210_HYP-A-PROVENANCE_dark_ar_1440_R2.png`
- `CD-027_SCR-WEB-210_HYP-A-PROVENANCE_light_ar_412_R2.png`
- `CD-027_SCR-WEB-210_HYP-A-COUNTERFACTUAL_dark_en_1440_R2.png`

The counterfactual must be the populated A design with the Dual-State Ribbon removed—not annotation prose—and explain the loss of state provenance/action comprehension. Keep the selection rationale evidence-led, without numeric self-scoring or invented usability findings.

### 2. Submit one clean CD-027-only archive

Create a clean archive containing only:

`outputs/cd-027-r2/`

Include the complete R2 package:

1. `CD-027 Visit Detail.dc.html`
2. `CD-027 Visit Detail.standalone.html`
3. `cd27-stage.js`, `cd27-annot.js`, `support.js`
4. `saqeel-tokens.css`, `saqeel-astryx.css`, `saqeel-prism.svg`
5. `IMPLEMENTATION_MANIFEST_CD-027.yaml`
6. `COMPONENT_MAP_CD-027.csv`
7. `WIRING_MAP_CD-027.csv`
8. `STATE_MATRIX_CD-027.csv`
9. `ACCEPTANCE_CHECKLIST_CD-027.md`
10. `RESEARCH_PROVENANCE_CD-027.md`
11. `CLAUDE_CODE_HANDOFF_CD-027.md`
12. `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-027.md`
13. `PACKAGE_INVENTORY_CD-027.csv`
14. all R2 evidence PNGs, including the six hypothesis/counterfactual files above.

Do **not** include any CD-025 or CD-026 folder, root duplicate, `uploads/` directory, stale screenshot, or historical Claude Code handoff/prompt. Those are separate packages and must never be bundled here.

`PACKAGE_INVENTORY_CD-027.csv` must list every included file with relative path, revision `R2`, baseline wording, design/screen ID, implementation-facing flag, and `PRESENT — synchronized`. Every manifest reference must resolve inside `outputs/cd-027-r2/`.

## Required verification before return

Do not return until all are true:

- the three English desktop hypothesis PNGs are visually distinct complete compositions and have distinct file hashes;
- every hypothesis uses the same data/truth boundary, while differing in information architecture;
- selected A has complete Arabic RTL desktop and 412px light-theme proof;
- its counterfactual is a populated UI frame with the ribbon removed;
- all R2 package files agree on CD-027, SCR-WEB-210, R2, baseline posture and `implementation_authorized: false`;
- all prior blocked legs remain explicitly blocked; no backend/provider policy is fabricated;
- the final archive contains only `outputs/cd-027-r2/` and inventory-listed assets;
- final status is `READY_FOR_DESIGN_REVIEW_R2`, not sponsor-approved and not implementation-complete.

Return the clean R2 archive for sponsor/Codex review. Do not implement.
