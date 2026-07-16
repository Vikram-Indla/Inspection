# Documentation Storage Policy

## What stays in Git

- Application source, migrations, tests, fixtures, package manifests, lockfiles, build and CI configuration, and environment templates without secrets.
- `AGENTS.md`, `CLAUDE.md`, `HOME.md`, `.claude/**`, the active `product-contract/**` controls, and the code-ready design authority needed for safe session continuity.
- Small machine-readable acceptance, wiring, route, schema, state, audit, and evidence indexes that automation reads.
- Lightweight repository instructions and pointers such as this policy and `docs/README.md`.

## What stays outside Git

- Source workbooks, BRDs, functional-specification exports, PDFs, office files, storyboards, training and handover packs.
- Screenshots, videos, visual-regression output, evidence attachments, generated reports, design exports, packaged archives, and historical repository/documentation snapshots.

The approved external root is `/Users/vikramindla/Desktop/Inspection Documentation`. Tools must honor `INSPECTION_DOCS_ROOT`; Vikram's local default is the approved Desktop location. Runtime application code must not depend on that local path.

## File-size and Git LFS policy

The maximum recommended size for a newly tracked file is 10 MB. `.githooks/pre-commit` blocks newly added files above that default unless the path is explicitly reviewed and added to `.githooks/large-file-allowlist`.

Enable the repository-managed hook once per clone with `git config core.hooksPath .githooks`. CI or other automation may invoke `scripts/check_large_files.sh` directly. This cleanup worktree does not change shared local Git configuration automatically because another dirty worktree is active.

Git LFS is not installed or configured in the current repository. Do not introduce it ad hoc. A future LFS adoption requires explicit approval, repository attributes, contributor tooling, CI support, retention/cost review, and a migration plan. LFS is not a substitute for the external documentation store.

## Evidence-storage policy

Textual acceptance and evidence indexes remain in the product contract. Binary evidence is stored under `07_TEST_EVIDENCE_AND_SCREENSHOTS` at the external root. Browser tests resolve their output through `INSPECTION_DOCS_ROOT` and must not regenerate tracked repository screenshots.

Packaged master archives, complete documentation dumps, and repository snapshots are prohibited in Git. Pre-move or rollback archives belong under external category `10_REPOSITORY_EXPORTS`.

## Adding a new document

1. Decide whether the file is operational machine input or human documentation.
2. Store human documentation in the matching external category and preserve the source name.
3. Record its path, size, SHA-256, authority, and lifecycle in the external manifest.
4. Add or update only a lightweight pointer/index in Git when developers or automation need discoverability.
5. If a file must be tracked despite exceeding 10 MB, document the build/runtime reason, obtain human review, and add its exact path to `.githooks/large-file-allowlist`.
6. Never store credentials, `.env` files, keys, tokens, database dumps, or private connection material with documentation.
