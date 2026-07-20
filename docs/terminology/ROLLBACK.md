# Rollback

## Safety net already in place

- Backup branch (untouched baseline): `backup/pre-plain-language-terminology-20260721-010721`
  → `origin/setup/Inspection` @ `d53e09f7ee4018bf2046e36d95fe45df355b11a2`
- Implementation lives entirely on `feat/plain-language-terminology-remediation`,
  in a dedicated worktree at `.worktrees/plain-language-terminology-remediation`.
  `setup/Inspection` itself was never checked out or modified by this project.
- No remote database migration was applied. No deploy occurred. No merge to
  `setup/Inspection` or `main` occurred.

## Full rollback (abandon the entire project)

```bash
# From the main repo checkout (not the worktree):
git worktree remove .worktrees/plain-language-terminology-remediation
git branch -D feat/plain-language-terminology-remediation
# backup/pre-plain-language-terminology-20260721-010721 remains as a
# reference point if needed later; delete it too once confident it's not needed:
# git branch -D backup/pre-plain-language-terminology-20260721-010721
```

Nothing on `setup/Inspection` or `main` needs to change — they were never
touched.

## Partial rollback (revert one wave, keep the rest)

Each wave is a separate commit on `feat/plain-language-terminology-remediation`:

```
afefdcb  Wave 0 — discovery inventory + proposal (docs only, no risk)
15a4790  Wave 1 — Factory 360
60c7b04  Wave 2 — core journeys
faca972  Wave 3 — navigation & administration
3b7c057  Wave 4 — Arabic strings + residual English fixes
<wave5>  Wave 5 — regression test + closure docs (this commit)
```

To drop a single wave while keeping the others, `git revert <sha>` that
wave's commit on the branch (do not rewrite history with rebase/reset once
any part of this branch has been shared/pushed). Waves 2-4 touch some of
the same files as later waves in a few places (e.g. `visits/[id]/page.tsx`
was touched in both Wave 2 and Wave 4) — a revert may produce a merge
conflict; resolve by keeping the later wave's version of any overlapping
line, since later waves are corrections/additions on top of earlier ones,
not replacements.

## Rolling back just the Arabic migration

The migration
`supabase/migrations/20260721020000_plain_language_terminology_ar_strings.sql`
was never applied to any database (per instructions). To discard it before
it's ever applied: `git rm` the file, or revert the Wave 4 commit. If it
*has* since been applied to a live `ui_strings` table by a human operator,
rolling back the data itself only affects rows still at `status='draft'`
(the guarded upsert never touched `status='reviewed'` rows) — a
human-reviewer would need to manually restore prior English/Arabic values
for any affected `draft` keys, since the migration itself contains no
down/reverse statement (consistent with every other `*_ar_strings.sql`
migration in this repo — none of them are reversible by convention).

## Rolling back the terminology regression test

`apps/web/e2e/terminology-regression.spec.ts` and its `testMatch` entry in
`playwright.static.config.ts` are additive and side-effect-free (a static
grep over source files, no app behavior). Safe to delete independently of
any other rollback if it ever produces unwanted false positives — see
`RESIDUAL_TERMS.md` for the deliberate allowlist patterns it depends on
before assuming a failure is a real regression.
