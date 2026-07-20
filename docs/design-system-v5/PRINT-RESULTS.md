# Print Results — Saqeel V5.1

## Done and verified this session
`apps/web/src/app/reports/report.css` was audited against `design/saqeel-v5-final/v2/SAQEEL-V2-REPORT-PRINT-SPEC.md` and three real gaps were fixed (see commit `420f3f8`):
1. `.rp-section` no longer forces `break-inside: avoid` on every chapter — chapters flow across pages now, per spec. Only `.rp-sig` (the signature block) is an atomic keep-together, also per spec.
2. `.rp-table thead { display: table-header-group }` added so column headers repeat on every printed page.
3. `@media print` now scopes a token override to `.rp-page` so the report always prints in the grayscale-safe `--ax-color-print-*` palette (`#111111`/`#FFFFFF`/`#555555`), regardless of whether the viewer's browser session is in dark mode. Before this fix, printing from a dark-mode session would have produced a dark-background PDF.

`apps/web/src/app/reports/inspection/[id]/page.tsx`'s `dt()`/`d10()` date helpers were converted to the governed Riyadh date service earlier (Wave 3, commit `cb0cdf0`).

`tsc --noEmit` clean, guardrail clean, `verify-dates.mjs` 17/17, full `next build` clean.

## Known, documented limitation (not silently dropped)
The spec asks for page numbers + report reference in a running footer. Native browser print — this app's sanctioned PDF path, per `components/PrintReport.tsx`'s own comment — does not support CSS Paged Media page-number generated content (`@page { @bottom-center: counter(page) }`) in any major browser engine without a polyfill (Paged.js/Prince/WeasyPrint), none of which are in this stack. Browsers' own print dialogs add a page-number header/footer by default, but that's OS/browser chrome the app doesn't control, and users can disable it. No non-functional CSS was added that would look like a fix without doing anything — this is recorded as a platform constraint, not solved by this branch.

## Print-preview screenshot: captured
A real print-preview screenshot was captured against a real submitted inspection (`apps/web/scripts/capture-v5-evidence.mjs`, screenshot 16 — see `RTL-DARK-RESPONSIVE-RESULTS.md`), authenticated, with `page.emulateMedia({media:"print"})`. It confirms live: the grayscale-safe palette regardless of on-screen theme, the bilingual Ministry header, glyph+word compliance status (not color-only), Riyadh-formatted dates throughout, and the signature block — all three CSS fixes above are visually correct on a real document, not just present in source.

## Still not done
- No fixture tests (1/20/100/300 items, no-violations, many-violations, long-Arabic-notes, missing-signature, multiple-versions, invalid-approval) were run — no test data/harness for these exists in this repo yet; the one real submitted inspection captured above happened to have zero violations and a single item set, so it doesn't exercise the larger/edge-case fixtures.
- The DEF-WF-006 invalid-approval block and immutable-snapshot-vs-live-reference distinction were not touched by this session's CSS-only changes, and were not independently re-verified beyond that.
- The 5-layer content-model rebuild described in the spec (identity/outcome, findings/compliance, violations/corrective-actions, evidence/versions/decisions/lineage, acknowledgement/signatures/legal-footer as five distinct governed layers with two renderers) was not attempted — the existing single-page-with-sections structure was kept and its print CSS corrected, not restructured. Restructuring the content model of a legal document is exactly the kind of change that needs its own dedicated pass with real test coverage, not a CSS-conformance sweep; the print-preview screenshot above confirms the current structure already renders correctly, which weighs against rushing a rebuild that could introduce new content-correctness risk on a legally-significant document without commensurate benefit.

See FINAL-IMPLEMENTATION-REPORT.md "Remaining risks" for how this fits into the overall branch status.
