# DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
# CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-029.md — R1
implementation_authorized: false

You are Claude Code. Implement the sponsor-approved slice of CD-029 / SCR-WEB-310 / P10 — Level 2 Review Workspace (/reviews/:id).

## 0. Stop conditions
- Baseline is main; sources were read this session but not independently resolved (BASELINE_REVERIFY_REQUIRED). If local main differs, STOP and report. Do not use setup/Inspection.
- The working tree is dirty with unrelated user work. Preserve it. Do NOT commit/push/merge/deploy/reset/clean/stash or modify main/branches, migrations, data, tests, contract files or Git history.
- If sponsor design approval or the independent Codex wiring audit is not recorded, STOP.

## 1. Read first
Approved design CD-029 Level 2 Review Workspace.dc.html and every file in outputs/cd-029-r1/. Re-read runtime truth: reviews/[id]/page.tsx, DecisionPanel.tsx, actions.ts, lib/factory-verification.ts, lib/notify.ts, reviews/page.tsx, Shell.tsx, ShellClient.tsx, shell-navigation.ts, astryx.css, tokens.css, and review/inspection/audit/notification migrations. Record branch/commit/dirty state.

## 2. Implement only the approved slice
- Build the three-zone workspace and the Finding Trace Chain as a keyboard-operable, list-equivalent disclosure that binds question→response→evidence→clause→violation→corrective action→decision comment, each source/version-labelled; unavailable links shown, never fabricated.
- HANDOFF_BLOCKED_PAGELOAD_MUTATION: only change the on-open review-create + under_review transition if that backend workflow change is in the approved slice; otherwise surface it honestly and do not claim open is side-effect-free.
- HANDOFF_BLOCKED_ATOMIC: do not claim the decision write is atomic. If transactional remediation is approved, implement it explicitly; otherwise keep the offered→recheck→recorded→transitioned→queued ladder and the partial-failure state with neutral copy.
- Keep the immutable version read-only; return = exact sections + reason; reject = reason; diff from stored answers; append-only audit; decided reviews DB-locked; factory verification never mutates Senaei; notifications queued-not-delivered.
- Keep claim/reassign and provider media shown unavailable unless separately approved (HANDOFF_BLOCKED_CLAIM/_MEDIA). No invented support path (HANDOFF_BLOCKED_ERRORMAP).
- Implement all hard states, Arabic/RTL, dark/light, 1440/1024/412, disclosure buttons, focus to invalid control, role=status/alert, reduced-motion.

## 3. Do NOT invent
Atomic completion/rollback/delivery, a side-effect-free open before it is true, claim/reassign paths, a provider media viewer, a support/escalation destination, or any RLS/transition/audit behaviour not proven in source.

## 4. Evidence
Create apps/web/e2e/cd-029-review-workspace.spec.ts (does not exist — write it; do not claim it passes before writing). Cover trace chain (keyboard + unavailable links), return/reject validation with focus, partial decision side-effect, decided-locked, stale, unauthorized, missing evidence, degraded media, multi-critical, linked-source failure, Arabic/RTL, theme, 1024/412. Then an independent Codex wiring audit across all 18 legs per WIRING_MAP_CD-029.csv; any unproven/partial/non-atomic leg stays HANDOFF_BLOCKED. Report path-by-path diffs.

## 5. Prohibited
Inventing backend/policy behaviour; commit/push/merge/deploy/main changes without separate authorization; calling the decision atomic or the open side-effect-free before it is true; redesigning the CD-028 queue.
