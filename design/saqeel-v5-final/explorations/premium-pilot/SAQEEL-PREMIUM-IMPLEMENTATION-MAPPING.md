# Saqeel Premium — Implementation mapping (for Claude Code; repository NOT edited)
Maps each approved pattern to its probable home in Vikram-Indla/Inspection@setup/Inspection.

| Design pattern | Probable location | Change type |
|---|---|---|
| Riyadh date service (P0) | NEW apps/web/src/lib/dates.ts; replaces dt()/d10() in reports/inspection/[id]/page.tsx and defaultDateRange() in components/ShellClient.tsx | new module + call-site swaps |
| Tokens (metric, border-control, surface-field, print ladder, texture policy) | apps/web/src/app/tokens.css | additive tokens + usage-rule comments |
| Status chip / status rail | astryx.css (.ax-chip/.ax-statusrail NEW; refactor .ax-lozenge usage) | new components |
| Report content model | NEW lib/report/model.ts assembling the existing page.tsx query result | extraction, no schema change |
| Editorial screen renderer | reports/inspection/[id]/page.tsx + report.css rewrite (5 layers, disclosures, responsive rows) | rewrite |
| A4 print renderer | report.css @media print rewrite per PRINT-SPEC (remove section break-inside:avoid, add running header/footer, thead repeat) | rewrite |
| Integrity VOID treatment | existing approvedWithoutVersion branch (DEF-WF-006) | restyle + print band |
| Review workspace (B2) | apps/web/src/app/reviews/[id]/* (DecisionPanel.tsx) — issue navigator, evidence panel, sticky decision bar | major refactor |
| Hybrid shell / command bar | components/ShellClient.tsx + astryx.css shell sections | incremental (keep rail, restructure topbar) |
| Tabs/route-nav semantics fix | dashboard page tabs (role=tab on links) | remove roles or true tabs |
| Table contract (sort buttons, row labels, captions) | design-system DataTable + rp-table | component upgrade |
| Modal/Drawer/Pagination/Combobox a11y contracts | design-system components + ShellClient search | component upgrade |
| Texture (approved, chrome-only) | command bar / brand band CSS only | additive, gated |

Regression checklist (run after each wave): date boundaries 00:00–03:00 Riyadh; print 1/20/100/300 items; 320px reflow + 400% zoom; focus-not-obscured under both sticky bars; axe pass (contrast, names, roles); AR/RTL visual parity; dark theme; DEF-WF-006 scenario; immutability (no edit affordances on timeline/decisions).