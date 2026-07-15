# CD-006–CD-011 correction execution guide

## Current status

The independent review found blocking P0/P1 defects. A single consolidated correction prompt now covers every finding. The original designs remain unapproved and non-executable until the corrected return is independently reviewed.

## Run order

1. Start a fresh Claude Design task in the destination account.
2. Attach:
   - the original CD-006–CD-011 zip;
   - `CD006_CD011_INDEPENDENT_REVIEW_2026-07-15.md`;
   - `CD006_CD011_CORRECTION_SOURCE_TRUTH_2026-07-15.md`.
   - `CD006_CD011_CORRECTION_CLOSURE_TEMPLATE.csv`.
3. Paste the complete contents of `CD006_CD011_CLAUDE_DESIGN_CONSOLIDATED_CORRECTION_PROMPT_R1.md`.
4. Require one complete corrected return containing `cd-006-r2/` through `cd-011-r2/`, the source-discovery log, and the audit closure matrix.
5. Reject a return that ends in neither `READY_FOR_MANDATORY_FINAL_REVIEW` nor `CORRECTION_BLOCKED`.
6. Bring the complete corrected zip back to Codex for the mandatory final review. Do not merge selected files from multiple partial returns.

Before returning the package to Codex, run the included read-only mechanical gate:

`bash verify_cd006_cd011_corrected_return.sh /absolute/path/to/corrected-return`

A mechanical PASS does not approve the design; it only proves that the return is complete enough to enter the independent semantic and visual review.

## Return acceptance gate

The corrected return enters final review only when all of the following are physically present:

- six self-contained per-CD directories;
- all declared visual exports, including a complete CD-011 visual set;
- native 1024×1366 constrained evidence for every CD;
- measured SHA-256/dimension manifests;
- one state matrix per CD covering all nine required states;
- one row-complete wiring map per CD;
- exact source metadata and source-discovery log;
- source-derived route/runtime and data-truth records;
- literal path-level implementation manifests and component maps;
- accessibility, localization, research, acceptance, and non-executable handoff files;
- `CORRECTION_CLOSURE_MATRIX_CD006_CD011.csv` with every `AUD-P0-*` and `AUD-P1-*` row.

Missing evidence is a failed return, not a minor packaging issue. Sponsor approval and implementation remain blocked until the final independent review reports no remaining P0/P1 findings.
