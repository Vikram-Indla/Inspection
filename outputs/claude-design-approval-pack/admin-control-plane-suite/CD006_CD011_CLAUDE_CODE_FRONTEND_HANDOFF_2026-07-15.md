# Claude Code frontend handoff — CD-006 through CD-011

Use this handoff **with** the six supplied `CLAUDE_CODE_IMPL_PROMPT_CD-006.md`
through `CLAUDE_CODE_IMPL_PROMPT_CD-011.md` files. Those prompts contain useful
screen-specific design and evidence instructions, but their backend truth is
stale. This file supersedes only the backend-blocked statements listed below.

## Start point

- Repository: `/Users/vikramindla/Documents/GitHub/Inspection`
- Preferred backend baseline: commit `4af67c0` on
  `codex/cd006-011-backend-completion`.
- If using another frontend worktree, cherry-pick `c4c5701` and `4af67c0` first.
- Read:
  - `product-contract/evidence/CD006_CD011_BACKEND_COMPLETION_2026-07-15.md`
  - the relevant CD-006..011 design package and implementation prompt
  - the full requirement folder at
    `/Users/vikramindla/Desktop/Inspection Documentation`
  - `product-contract/governance/HUMAN_APPROVALS.yaml`

## Parallel ownership

Do not modify these backend-owned paths while the backend branch is active:

- `supabase/migrations/**`
- `apps/web/src/app/admin/*/actions.ts`
- `apps/web/src/app/field/inspection/[id]/runtime.ts`
- `apps/web/e2e/cd-006-011-backend-completion.spec.ts`

Frontend scope is the CD-006..011 admin page/components, governed localization,
styles using existing design tokens, and replacement authenticated browser,
accessibility, RTL, theme, responsive, negative-path, and visual tests.

## Backend truth that supersedes stale prompt blockers

- Admin configuration writes have a fail-closed server guard and RLS.
- Regulations now support effective date, draft edit, attachment metadata,
  validated publish, maker-checker provenance, immutable published children,
  governed deactivation, and scoped audit history.
- Item authoring now supports photo/video/document/comment evidence presets,
  required/optional/conditional modes, `key=value` visibility conditions,
  mandatory-when-visible, explicit scoring enable/disable, and usage counts.
- Package publish validation now covers conditional grammar in addition to the
  existing item/evidence/action-form/violation/penalty dependencies.
- Violation catalogue now supports usage counts and governed active-to
  deactivation. Penalty mapping remains one-to-one with legal-basis and preset
  validation.
- Runtime submission now enforces optional/conditional mandatory behavior and
  scoring disable.

Therefore, remove or replace UI copy and tests that still claim these exact
capabilities are `HANDOFF_BLOCKED`, unavailable, unaudited, or permanently
disabled. Preserve genuinely unresolved provider/policy/design boundaries.

## Required frontend outcome

For each CD, update its source discovery log, implementation manifest, and
wiring map against commit `4af67c0`. Wire every supported action and truthful
load/empty/error/no-op/unauthorized state. Preserve the shared shell and tokens.
Use Arabic `ui_strings`, document-level RTL, keyboard semantics, non-color-only
status, 44px targets, and 1440/1024/narrow coverage. Revise the old CD browser
specs whose assertions encode superseded blocked backend states.

Do not claim live completion yet. Migration
`20260715200000_cd006_011_backend_completion.sql` is source-ready but still
requires the sponsor's explicit approval for this exact shared-schema change,
governed application, and live reconciliation. Frontend code may be built and
tested with mocks/source contracts in parallel; final authenticated live tests
must run after the migration lands.
