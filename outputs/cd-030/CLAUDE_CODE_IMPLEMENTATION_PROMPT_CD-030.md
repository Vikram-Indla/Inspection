# DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
# CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-030.md — R1
implementation_authorized: false

You are Claude Code. Implement the sponsor-approved slice of CD-030 / SCR-WEB-320 / P11 — Version Comparison (route-neutral compare mode inside /reviews/:id).

## 0. Stop conditions
- Baseline is main; sources were read this session but not independently resolved (BASELINE_REVERIFY_REQUIRED). If local main differs, STOP and report. Do not use setup/Inspection.
- The working tree is dirty with unrelated user work. Preserve it. Do NOT commit/push/merge/deploy/reset/clean/stash or modify main/branches, migrations, data, tests, contract files or Git history.
- If sponsor design approval or the independent Codex wiring audit is not recorded, STOP.

## 1. Read first
Approved design CD-030 Version Comparison.dc.html and every file in outputs/cd-030-r1/. Re-read runtime truth: reviews/[id]/page.tsx (version selection + stored-answer diff), DecisionPanel/actions, reviews.returned_sections, review/audit migrations, submission_versions, Shell.tsx, ShellClient.tsx, shell-navigation.ts, astryx.css, tokens.css. Record branch/commit/dirty state.

## 2. Implement only the approved slice
- Build the route-neutral compare mode and the Tamper-evident Scope Rail: classify each changed answer against reviews.returned_sections (stored) into expected / unexpected (locked-section) / unchanged / unavailable. Never infer scope from the diff; never label an uncomputed category 'unchanged'.
- Keep the diff exactly as the stored-answer, union-of-keys, latest-vs-prior comparison. Do not invent a semantic/evidence/package/metadata diff (HANDOFF_BLOCKED_MEDIADIFF/_PKGSEMANTIC/_METADIFF) — render those unavailable.
- Keep comparison navigation-only; do NOT add accept/merge unless separately approved (HANDOFF_BLOCKED_ACCEPT).
- Opening the review is read-only. Do not resolve or hide CD-029's non-atomic startReview sequence (HANDOFF_BLOCKED_START_REVIEW_ATOMIC) or its non-transactional decision writes (HANDOFF_BLOCKED_ATOMIC).
- Implement all hard states, Arabic/RTL, dark/light, 1440/1024/412, disclosure buttons, focus order + version-selector focus, role=status/alert, reduced-motion.

## 3. Do NOT invent
A semantic/evidence/package/metadata diff derivation, an accept/merge action, a dedicated /reviews/:id/compare route, scope inferred from changed answers, a freshness threshold, or any RLS/transition/audit behaviour not proven in source.

## 4. Evidence
Create apps/web/e2e/cd-030-version-comparison.spec.ts (does not exist — write it; do not claim it passes before writing). Cover scope-rail classification (expected/unexpected/unchanged/unavailable), tampered locked-section change, no-prior, empty diff, unavailable categories, degraded source, stale, unauthorized, auditor read-only, Arabic/RTL, theme, 1024/412, keyboard disclosure + focus. Then an independent Codex wiring audit across all 17 legs per WIRING_MAP_CD-030.csv; any unproven diff/action leg stays HANDOFF_BLOCKED. Report path-by-path diffs.

## 5. Prohibited
Inventing backend/policy behaviour; commit/push/merge/deploy/main changes without separate authorization; calling an uncomputed category 'unchanged'; adding accept/merge; redesigning CD-028/CD-029.
