# Binding Design Decisions

## Preserve

- Saqeel name, Arabic wordmark, and ministry attribution. The former DEC-011
  launch-film color/type identity is superseded for authenticated product UI by
  sponsor-approved `CC-DESIGN-FOUNDATION-SHELL-RESET-001` (2026-07-18).
- Dark and light modes with persistent preference and no-flash initialization.
- English/Arabic switching and true RTL layouts.
- Existing URLs, server actions, Supabase data contracts, RLS, RBAC, audit, state guards, offline engine, and immutable submission semantics.
- Field/iPad experiences as touch-first, interruption-safe applications.
- Admin experiences as governed control planes rather than CRUD tables.

## Improve

- Information hierarchy and progressive disclosure.
- Consistent shell, page headers, filters, action placement, status language, and responsive behavior.
- Map/list synchronization, telemetry comprehension, failure states, and privacy cues.
- Media capture, annotation, chain-of-custody visibility, and upload recovery.
- Review density, returned-scope comprehension, and version comparison.
- Empty, loading, unauthorized, partial-service, offline, stale, conflict, and retry states.
- Accessibility and Arabic layout quality.

## 2026-07-18 foundation reset

- Authenticated product UI is institutional, productive and light-first.
- Cinematic Atlas v0.8 is the only expressive visual exception and owns its own
  local tokens; it may not influence shell, workflow, admin, field or evidence UI.
- Input, textarea, select and search geometry/behavior are frozen for this change.
- New MVP2/MVP3 UI must consume the shared semantic tokens and shell components;
  raw visual values or local expressive themes fail design acceptance.
- WCAG 2.2 AA is the release floor; normal text targets AAA where compatible with
  semantic status and control requirements.

## Research policy

Claude Design may use multiple enterprise pattern references for interaction research. It must record the problem, references examined, principle adopted, and styling rejected. It may not clone a screen, brand, icon set, copy, or navigation model.

## Truthfulness policy

- Use `Projected route` until genuine telemetry is connected.
- Use `Video provider pending` until the adapter is integrated.
- Distinguish queued, syncing, synced, failed, and conflicted evidence.
- Distinguish published configuration from editable draft.
- Distinguish read-only submitted content from returned editable sections.

## Delivery policy

Claude Design creates annotated code-ready outputs only. Fable makes code changes later on a controlled branch after the applicable acceptance rows are approved.
