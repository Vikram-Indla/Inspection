# COMPONENT_MAP_CD-005_R1.md
Literal paths only; implementation shape decided per piece.

| Piece | Shape | File | Disposition | Note |
|---|---|---|---|---|
| Regulation register + rail | inline JSX | apps/web/src/app/admin/regulations/page.tsx | modify (post-authorization) | replaces raw nested list; per-source result modelling for W01 |
| Search + lifecycle filter | inline client state | apps/web/src/app/admin/regulations/page.tsx | create (client component split TBD at wiring audit) | W02/W03 BLOCKED — filter logic does not exist today |
| Impact rail disclosure | inline JSX | apps/web/src/app/admin/regulations/page.tsx | modify | uses data already fetched in W01 |
| Per-row impact retry | candidate action | apps/web/src/app/admin/regulations/actions.ts | create (blocked) | mechanism undecided; W05 |
| Create-draft control | existing | apps/web/src/app/admin/regulations/Controls.tsx | preserve — export disposition: keep createDraft export; the add-clause and publish exports are ownership debt against CD-006, disposition decided at CD-006 wiring audit | W06 |
| Create-draft server action | existing | apps/web/src/app/admin/regulations/actions.ts | preserve — createDraftRegulation kept; addClause/publishRegulation exports flagged as ownership debt, not removed here | W06 |
| Localization lookup | existing mechanism | apps/web/src/lib/i18n.ts | preserve — Arabic lookup via ui_strings; NOT a generated key store | localization inventory |
| Shared tokens/styles | existing | apps/web/src/app/tokens.css, apps/web/src/app/astryx.css | preserve — no reusable gap proven in R1 | n/a |
| Frozen shell | FREEZE | apps/web/src/components/Shell.tsx (+ ShellClient/shell-navigation) | preserve | untouched in all frames |
| Detail route | proposed | /admin/regulations/:id | HANDOFF_BLOCKED | owned by CD-006, not this CD |
