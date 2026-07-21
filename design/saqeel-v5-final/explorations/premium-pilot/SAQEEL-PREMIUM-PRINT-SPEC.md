# Saqeel Premium — A4 print specification
One governed content model, two renderers. Print renderer is shared by A1 and A2 (command chrome never prints) so the legal document has one composition.

## Page geometry
@page A4, margin 12mm; running header 18mm (ministry lockup EN/AR + report ref + immutable version chip); running footer 10mm (report ref · Page n of N · generated timestamp Riyadh · M04-215/M06-018/DEC-009/ENG-12).

## Break rules
- NO break-inside:avoid on chapters/sections (removes current defect).
- Atomic keep-together blocks ONLY: single table row, KV pair group, signature block, one timeline entry.
- thead { display: table-header-group } — headers repeat on every continued page; continued tables show "Chapter 02 — continued" via chapter running label.
- Signatures: block kept together; if <40mm remains, pushed to next page (page-break-before:auto with min-height guard).
- Orphans/widows: 2/2 on prose.

## Grayscale-safe status
Chips print as bordered squares with glyph+word ("▲ NON-COMPLIANT", "✓ COMPLIANT", "◔ OVERDUE 14 DAYS") — meaning survives monochrome. Compliance bar prints with per-segment numeric labels + pattern fills.

## Screen→print transformations
- Collapsed chapters/disclosures: fully expanded (all 48 items, all 9 evidence rows with full storage path + sha256, overflow-wrap:anywhere).
- Interactive: links print as plain text (visit/report refs keep visible reference numbers); evidence thumbs become manifest table rows; decision bar, command bar, nav omitted (.no-print).
- Texture: omitted entirely in print.
- Colors: --ax-print-text #111, borders #555, rules #999.

## Pagination reference (see A4 Print Reference.html)
P1 header+outcome+identity · P2 findings (chapter tables, repeated heads) · P3 findings continued + violations/actions · P4 evidence manifest + timeline · P5 signatures + legal footer. Verified compositions to test at build: 1 / 20 / 100 / 300 items; 0 / many violations; long AR notes; long paths; multi-version; missing signature; DEF-WF-006 invalid approval (prints VOID band, outcome layer suppressed).