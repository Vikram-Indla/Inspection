# RESEARCH_PROVENANCE_CD-022

Note: the approval pack's required set R16/R19/R21/R24 is cited by the 43-screen matrix but the mounted Reference Library defines R01-R15 only -> HANDOFF_BLOCKED on the ID mapping. The three mandated source categories are satisfied directly below. No screenshots, layouts, branding or proprietary grammar copied.

## 1. SAP Fiori Design Guidelines — Value Help Dialog / selection controls (official enterprise identity-selection source)
Link: https://experience.sap.com/fiori-design-web/v1-50/value-help-dialog/ and https://www.sap.com/design-system/fiori-design-web/v1-96/foundations/best-practices/ui-elements/which-selection-control-to-use
Observed principle: when values are hard to distinguish, selection needs a dedicated dialog showing the object's ID and description first plus disambiguating attributes — users identify the "right" object by multiple data points, not name alone; plain autocomplete is explicitly insufficient past small/similar datasets.
Adopted: identifier-first result cards (ID + differing attribute always visible), the 2d side-by-side comparison for ambiguous candidates, and the rule that selection is an explicit act on a fully-described object.
Rejected: Fiori's range/condition tabs and token selection (multi-select is out of scope — this flow selects exactly one legal entity), and any dialog chrome (the comparison lives in the workspace).
Fit for Saqeel: mirrors the CR/license-driven identification the runtime already enforces (M01-035/036) and the "no autocomplete-to-form jump" rule in the pack's own matrix row for SCR-WEB-120.

## 2. Digital Government Authority (Saudi Arabia) — national digital-government standards (official Saudi government source)
Link: https://dga.gov.sa/en
Observed principle: Saudi government services are Arabic-first, must state data provenance truthfully, and use neutral, non-technical failure language.
Adopted: Arabic-primary entity names with the English legal name as a secondary line (2f); registry source + sync time beside every identity claim; catalogued neutral error copy replacing raw provider text.
Rejected: retired DGA green identity and GovBar chrome (DEC-011 / CD-001).
Fit for Saqeel: MIM ministry release context; identity errors on a legal entity are exactly the class of harm DGA truthfulness rules target.

## 3. W3C Internationalization — RTL/bidi authoring best practices (authoritative a11y + RTL source)
Link: https://www.w3.org/International/quicktips/ and https://www.w3.org/International/techniques/authoring-html
Observed principle: set base direction once at the document root; isolate opposite-direction runs (codes, numbers) so the bidirectional algorithm cannot reorder them; prefer markup over CSS for direction.
Adopted: document-level dir/lang on the RTL frame, bdi-isolated CR/license/coordinate/date values, logical properties throughout, markup-declared direction in the handoff contract.
Rejected: CSS-only direction control and visual reordering.
Fit for Saqeel: identity verification is where a reordered digit run (e.g. a CR number) causes the exact wrong-entity error this screen exists to prevent — bidi isolation here is a safety control, not cosmetics.
