# CD-004 Mandatory Independent Design Review — R2

## Gate verdict: FAIL

**Status:** `CORRECTION_REQUIRED`  
**Implementation authorization:** not granted  
**CD-005 / Chapter 2:** still blocked

R2 substantially improves the design. The selected Configuration Evidence Spine is coherent, control-plane specific, Arabic-first, and visibly separates a failed source from a zero or platform-wide failure. Independent rendering confirms that the interactive design source contains complete 1440×1024 Arabic/English dark/light frames with a visible in-frame fixture watermark.

The delivered approval package nevertheless fails because the exported evidence and several deterministic handoff claims do not match what they declare. These are repairable without changing the selected design direction.

## Scope and provenance

| Item | Value |
|---|---|
| CD / screen / route | `CD-004` / `SCR-ADM-001` / `/admin` |
| Reviewed archive | `MVP1 UXUI refinement program 2.zip` |
| Archive SHA-256 | `4023337c583b929e0aed0e750d66379d3935e378e2e4aee55762f3bea13c2d04` |
| R2 source | `CD-004 Admin Control Plane Home R2.dc.html` |
| Review date | `2026-07-14`, Asia/Riyadh |
| Repository observed | `feat/cd-026-visit-management` at `8af01857477893e6a9521e5ecd139ec50990fdbc`; concurrent dirty worktree preserved |

The review covered the complete `cd-004-r2/` package, both CD-004 HTML sources, all supplied PNGs, all R2 manifests/ledgers/specifications, current `/admin` code, relevant schema/migrations, and shell navigation. Non-Admin archive contents were excluded.

## What now passes

- The source frames correctly retain the Configuration Evidence Spine rather than reverting to an equal-card dashboard.
- Full interactive source evidence is Arabic-first, includes the required dark/light and 1440/1024 compositions, shows an in-frame `DESIGN FIXTURE — NOT RUNTIME EVIDENCE` label, and has polished mixed-direction treatment.
- Current authorization truth is accurately stated: broad authenticated configuration reads, no Admin-family route guard, and no false RLS-denial claim.
- Per-source failure is isolated, modelled as unknown/not zero, and has a credible state/recovery/accessibility specification.
- The wiring map is genuinely expanded to W01–W21 and retains unresolved enforcement/action legs as `HANDOFF_BLOCKED`.
- The non-executable Claude Code boundary, role visibility matrix, localization inventory, and state model are materially improved.

## Remaining P0 findings

### P0-R2-01 — Exported approval evidence is not the declared evidence

**Affected artifacts:** every PNG named in `EVIDENCE_MANIFEST_CD-004_R2.csv`; `ACCEPTANCE_CHECKLIST_CD-004_R2.md` rows ADM-QG-09 and CD004-QG-08.

The evidence manifest declares four `1440×1024` full-page PNGs and two 1024-wide constrained frames. The actual files are:

| Declared evidence | Actual delivered dimensions | Result |
|---|---:|---|
| `*_ar_dark_1440.png`, `*_ar_light_1440.png`, `*_en_dark_1440.png`, `*_en_light_1440.png` | `909×525` each | Cropped top portions; full page and bottom fixture watermark are absent. |
| `*_ar_1024.png`, `*_en_1024.png` | `924×540` each | Canvas crops that include neighbouring source content; not a standalone 1024 frame. |
| `*_hard_states.png` | `909×525` | Only part of the contact sheet; critical state coverage is clipped. |

The interactive source itself contains valid `1440×1024` frames, which was independently rendered at `1442×1026` including its border. That does not make the submitted PNG exports accurate. The package's fixture-disclosure assertion is false for the four primary crops because the in-frame watermark is outside the delivered crop.

Regenerate the evidence from each named frame, at its declared native dimensions, with no source-canvas labels or neighbouring frames. Recalculate hashes, dimensions, and manifest rows from the regenerated files. Do not use screenshots of the design canvas.

### P0-R2-02 — The data-truth ledger names nonexistent schema fields in its “exact” proposed reads

**Affected artifact:** `DATA_TRUTH_LEDGER_CD-004_R2.csv`, rows 14–15.

The ledger labels its proposed reads exact, but:

- `audit_events` has `object_type`, `object_id`, and `occurred_at`; it does not have `entity` or `created_at` as named in row 14.
- `package_versions` has `version_label`, not `version`, and package `code` belongs to `packages`; row 15 also omits `published_at` from its declared columns despite filtering/ordering by it.

Blocked does not permit a false schema claim. Either correct each proposed read to the inspected schema with a deterministic join/filter/RLS/error/test/audit contract, or remove it completely from the ledger and manifest until an authorized data-design decision exists.

### P0-R2-03 — The implementation manifest/component map is still not exact-path deterministic

**Affected artifacts:** `IMPLEMENTATION_MANIFEST_CD-004_R2.yaml` lines 33–43; `COMPONENT_MAP_CD-004_R2.md` lines 6–13.

`apps/web/src/lib/i18n.ts (generated key store)` is not an exact repository path and describes a capability the existing `i18n.ts` does not provide: it loads Arabic values from `ui_strings` and has no generated key store. The manifest must name the literal file path and the real data/change mechanism, or keep localization changes blocked.

Likewise, `ConfigurationEvidenceSpine`, `LinkOnlyFamilyBand`, `RoleScopeBand`, `PageSourceLozenge`, and `LiveRegions` are listed as components to create but have no exact target paths/dispositions. The page may own them inline, or each may have an exact new file path; the handoff must choose one. A proposed per-source Retry is also visually active while its handler remains undecided; retain its `HANDOFF_BLOCKED` status in the exact owning file/action disposition.

## Remaining P1 finding

### P1-R2-01 — Research ledger uses the required IDs for different sources

**Affected artifact:** `RESEARCH_LEDGER_CD-004_R2.csv`.

The binding R1 prompt assigned: R01 product contract/internal authority; R02 Saqeel DEC-011/tokens; R09 ArcGIS Dashboards; R11 SAP Fiori; R12 IBM Carbon; R16/17 Saudi Digital Government authority; R18 WCAG 2.2; R19 WAI-ARIA Authoring Practices.

R2 instead assigns GOV.UK to R01/R02, WCAG to R09/R11/R12, PostgreSQL to R18, and NN/g to R19. The principles may be useful supporting research, but they do not satisfy the named authorities. In particular, WCAG 2.5.8 has a 24×24 CSS-pixel minimum; a 44×44 target can remain a Saqeel design rule but must not be attributed to that WCAG criterion.

Rebuild the ledger with the required source-to-ID mapping. Supporting sources must receive separate supplementary IDs and must not displace the binding sources.

## Gate table

| Gate | Result | Reason |
|---|---|---|
| `ADM-QG-01` | PASS | Scope/IDs remain traceable. |
| `ADM-QG-02` | FAIL | “Exact” proposed schema mappings use nonexistent fields. |
| `ADM-QG-03` | PASS | Unsupported legs are visibly and explicitly blocked. |
| `ADM-QG-04` | PASS | Control-plane model, not generic CRUD/KPI. |
| `ADM-QG-05` | PASS | A/B/C are materially distinct in the interactive source. |
| `ADM-QG-06` | PASS | Selection and counterfactual are evidence-based. |
| `ADM-QG-07` | PASS | One signature pattern. |
| `ADM-QG-08` | PASS | Frozen shell intent is respected. |
| `ADM-QG-09` | FAIL | Delivered crops omit required fixture disclosure and proposed truth ledger is inaccurate. |
| `ADM-QG-10` | FAIL | Hard-state export is incomplete/cropped. |
| `ADM-QG-11` | PASS | One source failure remains isolated. |
| `ADM-QG-12` | FAIL | Source frame passes, but submitted Arabic full-frame evidence does not exist. |
| `ADM-QG-13` | FAIL | Source frame passes, but submitted equivalent full-page dark/light PNG proof does not exist. |
| `ADM-QG-14` | PASS | Deterministic semantics, focus, live regions, and target rules are specified. |
| `ADM-QG-15` | FAIL | Required research IDs point to the wrong sources. |
| `ADM-QG-16` | FAIL | Component and localization file responsibilities lack exact valid paths/mechanisms. |
| `ADM-QG-17` | PASS | W01–W21 provide row-complete mapping and blockers. |
| `ADM-QG-18` | PASS | Handoff remains unambiguously non-executable. |
| `CD004-QG-01` | PASS | No engine-health inference. |
| `CD004-QG-02` | PASS | Unknown and zero remain distinct per source. |
| `CD004-QG-03` | PASS | No unsupported facts appear in the selected rendered frames. |
| `CD004-QG-04` | PASS | Guard mismatch is truthful and blocked. |
| `CD004-QG-05` | PASS | Six-role/family matrix is supplied. |
| `CD004-QG-06` | PASS | Destinations map to real Admin routes only. |
| `CD004-QG-07` | PASS | Home does not impersonate module lifecycle controls. |
| `CD004-QG-08` | FAIL | Required screen-level PNG evidence is falsely labelled and incomplete. |

## Next allowed action

Run the narrowly scoped R2 evidence-and-handoff correction prompt. Preserve the design source and selected interaction; repair only the exported evidence, research mapping, and deterministic ledger/manifest/component-map issues. Return `READY_FOR_MANDATORY_R2B_REVIEW` for another independent gate check. Do not begin CD-005, seek sponsor approval, or implement.

