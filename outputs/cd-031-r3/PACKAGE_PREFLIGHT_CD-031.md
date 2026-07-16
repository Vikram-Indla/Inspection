# PACKAGE_PREFLIGHT_CD-031.md — R3

Micro-correction of two R2 acceptance failures. No redesign; no application code. Archive root = `outputs/cd-031-r3/` only (42 files).

## R3 corrections
1. **Target size.** Every Factory 360 section-navigation pill (`.cd-secitem`, external `cd31.css` + inline `secNav` base) is now ≥48×48px via `min-block-size:48px; min-inline-size:48px; box-sizing:border-box; inline-flex` centering. Separated labels, boundaries, `.is-active` selected state and `:focus-visible` keyboard focus preserved.
2. **SHA-256.** Literal per-PNG SHA-256 recorded below for the A/B/C hypothesis frames; all three differ.

## 1. Target-size proof (measured live via getBoundingClientRect, 7 pills)
| Layout | min height | min width | pass (≥48×48) |
|---|---|---|---|
| Desktop (EN LTR) | 48px | 83px | ✓ |
| Arabic RTL (desktop) | 48px | 64px | ✓ |
| Narrow 412px | 48px | 64px | ✓ |

Per-pill desktop heights all = 48px (Identity 88×48, Case timeline 124×48, History 83×48, Documents 111×48, Representatives 144×48, Products 96×48, Workforce 104×48). Narrow AR shortest pill = الهوية 64×48. No pill falls below 48px in any of the three required layouts.

## 2. A/B/C hypothesis PNG SHA-256 (literal; all different)
```
CD-031_SCR-WEB-400_HYP-A-PROVENANCE_dark_en_1440.png  00d32713425974720eda5ee0abd8fad44f1da33e47008d2675f1f89c4762dafc
CD-031_SCR-WEB-400_HYP-B-TIMELINE_dark_en_1440.png    cfa8c16a76788abd93cdc798ac6ac4b698724ef9baaa1473ab97c3b727520ceb
CD-031_SCR-WEB-400_HYP-C-DECISION_dark_en_1440.png    66ef0ea8397246d44f867a0a6dc188afbe884ab50cfc28045edd001d5108e23e
```
allDifferent = true (verified by SHA-256, not by "distinct bytes" assertion). The three remain genuinely different information-architecture compositions (A provenance-first, B case-timeline-first, C decision-context-first).

## 3. Archive listing (sole root `outputs/cd-031-r3/`, 42 files)
```
Source (9): CD-031 Factory 360.dc.html, CD-031 Factory 360.standalone.html, cd31-stage.js,
  cd31-annot.js, cd31.css, support.js, saqeel-tokens.css, saqeel-astryx.css, saqeel-prism.svg
Docs (10): ACCEPTANCE_CHECKLIST_CD-031.md, COMPONENT_MAP_CD-031.csv, IMPLEMENTATION_MANIFEST_CD-031.yaml,
  PACKAGE_INVENTORY_CD-031.csv, PACKAGE_PREFLIGHT_CD-031.md, RESEARCH_PROVENANCE_CD-031.md,
  STATE_MATRIX_CD-031.csv, WIRING_MAP_CD-031.csv, CLAUDE_CODE_HANDOFF_CD-031.md,
  CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-031.md
Evidence PNGs (23): S01-POPULATED ×5 (dark_en_1440, dark_ar_1440, dark_en_1024, light_en_1440, light_ar_412),
  S02-NOHISTORY, S03-STALESOURCE, S04-MAPUNAVAIL, S05-BOUNDARY, S06-SERVICEFAIL, S07-MASKED,
  S08-HIGHRISK (dark_en_1440 + light_ar_1440), S09-DOCUNAVAIL, S10-RISKDRIVERS, S11-LOADING,
  S12-NOTFOUND, S13-COUNTERFACTUAL, S14-RISKHIST, S15-EVIDENCE, HYP-A-PROVENANCE, HYP-B-TIMELINE, HYP-C-DECISION
```
No CD-025..030 file, no root duplicate, no `screens/` or `uploads/` artifact. All governed files identify CD-031, SCR-WEB-400 and R3. The 23 populated PNGs are re-captured from the R3 build so every section-nav pill reflects the 48px target size.

## 4. Local-reference resolution
`CD-031 Factory 360.dc.html` references resolve inside the archive: `support.js` ✓, `saqeel-tokens.css` ✓, `saqeel-astryx.css` ✓, `saqeel-prism.svg` ✓, `cd31.css` ✓, `./cd31-stage.js` ✓, `./cd31-annot.js` ✓; Google Fonts via CDN. Standalone is fully self-contained.

## 5. Preserved (unchanged from R2)
Single-root archive; all R2 timeline truth blocks (Spatial Case Timeline, source-labelling, unavailable rows); all 15 states + counterfactual + 3 hypotheses; all routes/roles and blocked classifications (HANDOFF_BLOCKED_MAP / BOUNDARY / COORDINATE_CONFLICT / RISK_DRIVERS / RISK_HISTORY / EVIDENCE_TIMELINE / DOCUMENT_VIEWER); frozen shared shell.

## 6. Governance
- `implementation_authorized: false` in the manifest and both Claude Code files. ✓
- Both Claude Code files begin with `DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`. ✓
- No self-scoring; no sponsor-approval claim; CD-025..030 not redesigned. ✓

Result: **PACKAGE_PREFLIGHT_PASS** · **READY_FOR_DESIGN_REVIEW_R3**

BASELINE_REVERIFY_REQUIRED — factories/[id] sources read at main this session; no exact-baseline equivalence claim; deferred to independent Codex audit.
