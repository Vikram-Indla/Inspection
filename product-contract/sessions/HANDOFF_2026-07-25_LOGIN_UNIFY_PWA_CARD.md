# Session Record — Unify /login to PWA card look

- Date: 2026-07-25
- Branch: `feat/unify-login-pwa-card` (off `codex/ipad-phase1-audit-build`)
- Requested by: user (khan.jahanara@gmail.com), explicit direction in chat.

## Authorized override
This work is **outside** the locked slice `TASK-WEB-ADMIN-PHASE1-M2-BATCH-002`
(Planning screens). The user explicitly authorized proceeding as an override of
the locked slice and the `do_not_touch` login-routing caution. No push / merge /
deploy without further approval. `main` and `setup/Inspection` untouched.

## Scope (user-confirmed: "Restyle only")
Make `/login` (`SCR-PUB-010`) adopt the field/PWA login card look:
- Narrow/responsive: centered PWA-style credential card (atlas already hides).
- Wide/desktop: PWA-style card + existing atlas `StoryPanel`.
- Replace the plain web sign-in card treatment with the field card's centered
  shield + brand lockup + full-bleed surface language.

## Preserved (must not change)
- Email + password Supabase auth (`signInWithPassword`).
- Role-based redirect via `homeForRoles` (planner→/planning, ops→ops center…).
- Forgot-password / OTP reset flow, DemoAccess (env-gated), EN/AR, light+dark.
- Shared `/reset` page: restyle is scoped to `.lg-page--split` so `/reset`
  (`.lg-page:not(--split)`) is unaffected.
- `/login/field`, `/field/**`, brand assets, PWA manifest, migrations, providers.

## Method
CSS-only restyle appended to `apps/web/src/app/login/login.css`, scoped to
`.lg-page--split`. No markup or auth logic changes.

## Rollback
Revert this branch, or delete the appended `.lg-page--split` PWA-card CSS block.
