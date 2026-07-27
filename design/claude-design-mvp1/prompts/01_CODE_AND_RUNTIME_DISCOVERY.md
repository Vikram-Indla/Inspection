# Prompt — Code and Runtime Discovery

Use the master constitution. Perform read-only discovery before designing.

## Inspect

- `apps/web/src/app`, `apps/web/src/components`, and `apps/web/src/lib`.
- `apps/web/src/app/tokens.css`, `retired-predecessor.css`, `Shell.tsx`, theme and localization components.
- Supabase migrations that define the journey's states and data.
- `product-contract/screens/screen_route_catalogue.csv` and `authority/CODE_ROUTE_RECONCILIATION.csv`.
- Current acceptance ledger, storyboard status, E2E tests, and known gaps.
- Existing retired predecessor prototypes only after inspecting current production source.

## Runtime precondition

Do not audit a stale `.next` output. Record the branch, commit, dirty files, build command, build result, browser dimensions, locale, theme, persona, and timestamp. If the build fails, stop the visual audit and report the exact blocker; do not substitute old screenshots.

## Deliverable

Produce one concise current-state audit containing:

- Actual routes and logical screen modes.
- Existing reusable components and one-off patterns.
- Token compliance and raw-value leaks.
- Navigation and information-architecture issues.
- Dark/light and English/Arabic behavior.
- Desktop and iPad breakpoint behavior.
- Map/video/offline/realtime provider status.
- Visual defects versus functional defects.
- Protected files and dirty-worktree risks.
- Recommended design sequence.

Do not propose code changes yet. The output becomes input to the journey prompt.
