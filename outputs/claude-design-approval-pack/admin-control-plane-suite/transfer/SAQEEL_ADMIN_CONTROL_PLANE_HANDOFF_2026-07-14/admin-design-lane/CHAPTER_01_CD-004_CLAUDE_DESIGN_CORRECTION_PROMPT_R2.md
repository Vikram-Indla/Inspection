# Claude Design Correction Prompt — CD-004 R2 → R2B

Use this prompt with the complete R2 package and `CD-004_DESIGN_REVIEW_R2.md`.

---

Perform the narrow CD-004 **R2 → R2B evidence-and-handoff correction** for the Admin Control Plane family only.

The Configuration Evidence Spine, the Arabic-first visual direction, the state model, and the full interactive R2 frames are retained. Do not redesign the screen, create a new hypothesis, add Admin destinations, begin CD-005, or perform application implementation.

This work is limited to fixing the outstanding P0/P1 evidence, data-truth, manifest/component-map, and research-ledger defects identified in `CD-004_DESIGN_REVIEW_R2.md`.

## 1. Regenerate the declared approval evidence correctly

Export each named frame directly, at native dimensions, as one standalone image:

- Arabic RTL dark — `1440×1024`
- Arabic RTL light — `1440×1024`
- English LTR dark — `1440×1024`
- English LTR light — `1440×1024`
- Arabic constrained desktop — exactly `1024` CSS px wide, full frame
- English constrained desktop — exactly `1024` CSS px wide, full frame
- decision-zone close-up
- counterfactual
- complete hard-state contact sheet

Do not export a viewport crop, a scaled design canvas, or an image containing adjacent source frames. Every exported image must visibly include the in-frame reviewer disclosure:

`DESIGN FIXTURE — NOT RUNTIME EVIDENCE`

For each regenerated file, measure actual pixel dimensions, calculate SHA-256, and rewrite `EVIDENCE_MANIFEST_CD-004_R2B.csv` from those measured values. Do not claim dimensions not present in the file. The hard-state export must show every state in the state matrix, including both Arabic and English critical failure/recovery states.

## 2. Correct the proposed data-truth rows or remove them

The current schema names are binding:

- `audit_events`: `object_type`, `object_id`, `occurred_at` (not `entity`, `created_at`)
- `package_versions`: `package_id`, `version_label`, `status`, `published_at`
- package code belongs to `packages.code`, reached through `package_versions.package_id`

For every retained proposed read, supply exact table/join, exact columns, filter/order, RLS/guard, null/error rendering, test requirement, audit implication, and `HANDOFF_BLOCKED` rationale. If any item is not demonstrably exact, remove it from the data-truth ledger and manifest. It may not be called exact merely because it is blocked.

## 3. Make the handoff path-level deterministic

- Use literal repository paths only—no parenthetical labels inside a `path` value.
- Do not describe `apps/web/src/lib/i18n.ts` as a generated key store. Its actual role is Arabic lookup from `ui_strings`; identify the true authorized localization mechanism or retain that change as blocked.
- For every proposed component, choose one exact implementation shape: inline in the existing `apps/web/src/app/admin/page.tsx`, or an exact new component path with `create` disposition. Record the choice in both manifest and component map.
- The per-source Retry action must name its owning file/handler disposition. Until the action mechanism is decided, retain an explicit `HANDOFF_BLOCKED` record and do not imply it is currently implemented.

## 4. Repair the research ledger ID mapping

Use the binding IDs exactly:

- `R01`: product contract/internal authority
- `R02`: Saqeel DEC-011/tokens
- `R09`: ArcGIS Dashboards coordinated operational context
- `R11`: SAP Fiori role-oriented overview/floorplan principles
- `R12`: IBM Carbon dense-table and status discipline
- `R16` or `R17`: Saudi Digital Government authority
- `R18`: WCAG 2.2
- `R19`: WAI-ARIA Authoring Practices

Supporting research such as GOV.UK, PostgreSQL, or NN/g may remain only under new supplementary IDs. Do not relabel them as binding source IDs. Correct the target-size citation: WCAG 2.5.8 does not establish a 44×44 rule; retain 44×44 as a Saqeel design-system choice if needed and cite its actual authority.

## Completion constraints

- Preserve all R2 strengths and all existing `HANDOFF_BLOCKED` truth.
- Keep the non-executable Claude Code banner and `implementation_authorized: false`.
- Do not claim sponsor approval or implementation readiness.
- Return the corrected package as `cd-004-r2b/` with a concise correction log mapping each R2 finding to exact regenerated artifact(s).
- End the package with exactly:

`READY_FOR_MANDATORY_R2B_REVIEW`

---

