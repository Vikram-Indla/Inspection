# COMPONENT_MAP_CD-004_R2B.md
Implementation shape decision (matches manifest): ALL CD-004 UI pieces are inline in apps/web/src/app/admin/page.tsx — no new component files. Semantics repeat the binding a11y spec (section refs in parentheses).

| Piece | Shape | File | Semantics contract |
|---|---|---|---|
| Admin home | modify | apps/web/src/app/admin/page.tsx | <main> + single h1 + skip-link target (spec 1-2); owns per-source result modelling |
| Evidence spine | inline JSX in page.tsx | apps/web/src/app/admin/page.tsx | true <table> + caption + th scope=col/row (spec 3); five read-backed family rows |
| Spine row | inline | apps/web/src/app/admin/page.tsx | family th; read-result cell tabindex=-1 focus target (spec 7); link name "Open {family} — {family} module" (spec 4) |
| Per-source retry | inline trigger; handler BLOCKED | candidate apps/web/src/app/admin/actions.ts (create — blocked) | button "Retry reading {family}" >=44px; pending keeps focus (spec 7) |
| Link-only family band | inline | apps/web/src/app/admin/page.tsx | labelled nav list; existing routes only |
| Role-scope band | inline | apps/web/src/app/admin/page.tsx | h2 + prose from server roles; no action affordances |
| Page source lozenge | inline | apps/web/src/app/admin/page.tsx | focusable summary; glyph+word; never a health verdict |
| Live regions | inline | apps/web/src/app/admin/page.tsx | singleton polite + singleton assertive (spec 8) |
| Frozen shell | FREEZE | Shell.tsx / ShellClient.tsx / shell-navigation.ts / NotificationBell.tsx / tokens.css | untouched |
| Localization | BLOCKED | ui_strings rows (data change) — i18n.ts is a lookup layer, not a key store | LOCALIZATION_INVENTORY_CD-004_R2B.csv |
