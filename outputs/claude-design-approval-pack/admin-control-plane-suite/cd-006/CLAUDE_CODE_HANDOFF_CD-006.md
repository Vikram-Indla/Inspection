# CLAUDE_CODE_HANDOFF_CD-006.md
Controlled application order (per prompt): semantic tokens → approved assets → shared components → route composition → localization → tests/evidence.

This is a design handoff, not an implementation authorization. implementation_authorized: false in IMPLEMENTATION_MANIFEST_CD-006.yaml.

1. Semantic tokens: no new tokens proposed; reuse existing Saqeel dark/light tokens and astryx status grammar.
2. Approved assets: none (no icons/images beyond existing glyph characters used throughout the Admin suite).
3. Shared components: reuse ax-surface/ax-lozenge/table semantics from astryx.css; do not redesign the shell.
4. Route composition: apps/web/src/app/admin/regulations/page.tsx gains the dossier region per IMPLEMENTATION_MANIFEST_CD-006.yaml file_changes; Controls.tsx relocates publish/add-clause into the dossier; actions.ts is preserved untouched.
5. Localization: add ui_strings rows per LOCALIZATION_INVENTORY_CD-006.csv; i18n.ts code is not modified.
6. Tests/evidence: implement wiring rows W01-W03/W05-W06/W09 first (current-after-modify); W04/W07/W08/W10 stay HANDOFF_BLOCKED until their named decisions exist (retry mechanism, comparison feature scope, audit-timeline query, route guard).

Codex must independently audit this wiring map before any implementation authorization. Claude Code implements only on a controlled, non-main branch/worktree and must report the diff path by path.
