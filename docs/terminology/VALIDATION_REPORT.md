# Validation Report

Baseline: `origin/setup/Inspection` @ `d53e09f`
Implementation branch: `feat/plain-language-terminology-remediation` @ `3b7c057` (pre-Wave-5-commit)
Worktree: `.worktrees/plain-language-terminology-remediation`

## Typecheck

`cd apps/web && npx tsc --noEmit` — run after every single edit across all
5 waves (not just once at the end). **0 errors**, every time.

## Lint

No `lint`/`eslint` script exists in `apps/web/package.json` (`dev`, `build`,
`start`, `seed:kpi`, `typecheck`, `test:e2e` only). Not run — N/A, not a
gap this project introduced.

## i18n coverage checker

No `i18n:check`/`check-translations`/`verify-strings`-style script exists
in `package.json` or `scripts/`. Not run — N/A.

## Production build

`cd apps/web && npx next build` — **PASS**. `Time: 6.6s | Errors: 0 | Warnings: 0`.
(Required symlinking `apps/web/node_modules` from the main checkout into
this worktree first — a fresh git worktree doesn't inherit node_modules;
this is a worktree mechanics detail, not a code issue.)

## Playwright static suite

`cd apps/web && npx playwright test --config=playwright.static.config.ts`

Final run: **152 passed, 4 skipped, 0 failed** (156 total specs in the
static, no-live-infra config).

One real failure was caught and fixed during this pass:
`e2e/factory360-admin-control-plane.spec.ts` asserted the literal string
`"Factory 360 dossiers are read-only"`, which Wave 1 had already changed to
`"Factory 360 profiles are read-only."` in the source. This is exactly the
kind of drift the task's own instructions anticipated ("update text
assertions only when the underlying behaviour remains identical") — fixed
by updating the assertion to match the shipped text, not by reverting the
UI change.

The 4 skipped specs require live infrastructure (documented in their own
`test.skip` conditions, e.g. missing `GEMINI_API_KEY`/`RESEND_API_KEY`/
`DOCUSIGN_*`/`TWILIO_*` credentials for "LIVE:" integration tests) — these
are pre-existing skips unrelated to this project.

## Terminology regression test (new)

`apps/web/e2e/terminology-regression.spec.ts` — added per the task's
explicit requirement. Three checks:
1. No bare `"dossier"` outside a documented internal-symbol allowlist.
2. None of the explicitly banned phrases (`CR dossier`, `factory registry`,
   `plan register`, `penalty lineage`, `Evidence readiness & SLA-risk
   fingerprint`, `scan-first queue`, `contract-unverified`, `RLS-scoped`,
   etc.) appear in user-rendered production source (JSX text, `t()`
   fallbacks, `aria-label`/`alt` attributes) — deliberately excludes
   comments, `console.*` developer logs, and internal serialized payloads
   (e.g. a JSON.stringify'd object sent to an AI provider, never rendered).
3. `"server-side projection"`/`"read model"` architecture jargon does not
   leak into rendered headings/banners (still fine in comments/docs).

Registered in `playwright.static.config.ts`'s `testMatch` allowlist
alongside the other source-contract specs. All 3 pass.

## Residual literal search (manual, cross-checked against the regression test)

Ran an exhaustive grep across `apps/web/src` for every banned phrase and
`dossier` before closing out. Found and fixed (see `RESIDUAL_TERMS.md` for
the full list and reasoning):
- 1 missed `f360.err.neutral` call site still saying "factory registry"
  (Wave 1 fixed 2 of 3 call sites of this shared key).
- 1 Factory 360 destination page (`factories/[id]/page.tsx`) that no
  wave's directory scope named explicitly, despite being the primary link
  target from visits/planning/operations.
- 1 AI-advisory error message outside every wave's `app/` scope
  (`lib/ai/contextual-actions.ts`).
- 1 visible caption literally containing `"contract-unverified (fail-closed)"`.
- 12 occurrences of `"RLS-scoped"` (on the task's own banned list) across
  portal, visits, and compliance-request/approval surfaces that no wave's
  directory scope covered.

All fixed, re-typechecked, re-tested (152/152 static suite still passing
after the fixes).

## Known limitations

- **Full-browser visual acceptance** (Section 11 of the governing task:
  screenshots for Factory list EN/AR/light/dark, Factory profile web+iPad,
  Planning, Review queue, Operations Center at desktop + iPad viewports) —
  **not performed**. This worktree has no live Supabase-backed dev server
  or authenticated session available. This is the single largest open item
  before the human sign-off checklist in the governing task can be marked
  complete.
- **i18n coverage checker / lint** — genuinely absent from the repo, not
  a gap in this project's execution.
- **Arabic RTL rendering** — the Arabic strings were authored and the
  migration is syntactically valid (smoke-tested by executing it against
  an in-memory SQLite table matching the `ui_strings` schema — Postgres
  `on conflict ... do update ... where` syntax is supported identically),
  but actual RTL browser rendering was not visually verified for the same
  reason as above.
