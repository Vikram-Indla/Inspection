# COMPONENT_MAP_CD-004_R2.md
Repeats the binding a11y semantics (spec section refs in parentheses).

| Component | Disposition | Semantics contract |
|---|---|---|
| AdminHome (page.tsx) | modify after authorization | <main> + h1 + skip link target (spec 1-2); owns per-source result modelling |
| ConfigurationEvidenceSpine (proposed, name only) | create after authorization; route target = /admin composition | true <table> + caption + th scopes (spec 3); rows for the 5 read-backed families |
| SpineRow | part of spine | th scope=row family cell; read-result cell tabindex=-1 focus target (spec 7); action link name "Open {family} — {family} module" (spec 4) |
| SourceRetry | part of spine | button "Retry reading {family}" >=44px; pending keeps focus, aria-disabled (spec 7) |
| LinkOnlyFamilyBand | create after authorization | nav-labelled list of existing routes only |
| RoleScopeBand | create after authorization | h2 + prose from server roles; no action affordances |
| PageSourceLozenge | create after authorization | focusable summary; glyph+word; never a health verdict |
| LiveRegions | create after authorization | singleton polite + singleton assertive (spec 8) |
| Frozen shell components | FREEZE | untouched |
