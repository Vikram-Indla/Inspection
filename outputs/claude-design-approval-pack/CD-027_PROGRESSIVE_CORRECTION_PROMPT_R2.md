# Claude Design Correction Prompt — CD-027 R2 Package Synchronization

Paste this into the existing **CD-027 Visit Detail** Claude Design project. This is package synchronization only; do not redesign or implement.

Keep `implementation_authorized: false` and keep this exact first line in all Claude Code-facing files:

`DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT`

Do not edit application code, database, tests, Git history or `main`.

## Preserve

Preserve the R2 Dual-State Ribbon, all five separate state domains, the 14-leg wiring map, all `HANDOFF_BLOCKED` legs, Arabic/dark/light/narrow evidence, distinct A/B/C hypothesis frames, counterfactual, frozen shell, RLS/audit/immutable-history/queued-not-delivered truth, and the Track 1/Track 2 boundary.

## Correct exactly two P1 defects

1. **Eliminate R1 references from the R2 package.**
   - In `IMPLEMENTATION_MANIFEST_CD-027.yaml`, set the standalone path to `outputs/cd-027-r2/CD-027 Visit Detail.standalone.html`.
   - In `CLAUDE_CODE_HANDOFF_CD-027.md` and `CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-027.md`, direct every required read to `outputs/cd-027-r2/`.
   - Scan all R2 artifacts for `cd-027-r1`, `outputs/cd-027-r1`, stale R1 asset paths and inconsistent revision labels. Correct them all.

2. **Create a clean delivery ZIP.**
   - ZIP root must contain only `outputs/cd-027-r2/`.
   - Include every file listed in `PACKAGE_INVENTORY_CD-027.csv` and no other source/package/history folder.
   - Exclude CD-025, CD-026, CD-027 R1, root `.dc.html`/script duplicates, `uploads/`, stale screenshots and every historical Claude Code prompt.

Before return, validate every manifest/inventory path resolves within `outputs/cd-027-r2/`, verify no R1 path remains in implementation-facing files, and report `READY_FOR_DESIGN_REVIEW_R2`. Do not implement.
