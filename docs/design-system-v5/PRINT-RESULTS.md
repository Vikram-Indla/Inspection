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

## 5-layer content-model grouping — done (presentational, no logic touched)
Re-examined after re-reading the spec's five layers (identity/outcome, findings/compliance, violations/corrective-actions, evidence/versions/decisions/lineage, acknowledgement/signatures/legal-footer) against the report's actual existing 8 chapters: each chapter maps to exactly one layer with no ambiguous boundary —
- Layer 1 (identity/outcome): factory identity + visit configuration
- Layer 2 (findings/compliance): checklist responses (immutable snapshot)
- Layer 3 (violations/corrective-actions): violations/penalties + corrective action forms
- Layer 4 (evidence/versions/decisions/lineage): evidence manifest + submission versions/review decisions
- Layer 5 (acknowledgement/signatures/legal-footer): signature block (the legal footer itself was already a separate `<footer>`, outside any layer, unchanged)

Implemented in `apps/web/src/app/reports/inspection/[id]/page.tsx` as a pure wrapper: each existing `<section className="rp-section">` chapter (and its query, calculation, conditional-rendering, and DEF-WF-006 integrity-block logic) is untouched — only grouped inside a new outer `<section className="rp-layer">` with an `<h2>` layer heading. New `.rp-layer`/`.rp-layer__heading` CSS added to `report.css`; deliberately carries no page-break constraint of its own (the V2 spec's break-freely rule for chapters, confirmed above, still applies — only `.rp-sig` remains the atomic keep-together). While touching this file, also removed two raw hex fallbacks in the print-palette override block (`#555555`/`#111111`/`#FFFFFF`) in favor of the existing `--ax-color-print-*` tokens they duplicated in value — a guardrail-class fix, not a visual change.

Re-verified after the change: `tsc --noEmit` clean, guardrail 0 findings, `verify-dates.mjs` 17/17, `next build` clean, and a fresh authenticated re-capture of both the on-screen and print-media views against the same live submitted inspection (`apps/web/scripts/capture-report-layers.mjs` → `16a-report-screen-layers.png`, `16-report-print-preview.png`) — the 5 layer headings render correctly bilingually, page content and the print-CSS fixes above are unchanged, and the DEF-WF-006 integrity-block / immutable-snapshot-vs-live-reference logic was not touched (confirmed by inspection of the diff, not just by not looking).

## Still not done
- No fixture tests (1/20/100/300 items, no-violations, many-violations, long-Arabic-notes, missing-signature, multiple-versions, invalid-approval) were run — no test data/harness for these exists in this repo yet; the one real submitted inspection captured above happened to have zero violations and a single item set, so it doesn't exercise the larger/edge-case fixtures.
- The DEF-WF-006 invalid-approval block and immutable-snapshot-vs-live-reference distinction were not touched by this session's changes (CSS + presentational wrapper only), and were not independently re-verified beyond confirming the diff didn't touch them.

See FINAL-IMPLEMENTATION-REPORT.md "Remaining risks" for how this fits into the overall branch status.
