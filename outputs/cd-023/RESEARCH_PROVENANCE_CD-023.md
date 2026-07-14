# RESEARCH_PROVENANCE_CD-023

Note: required approval-pack references R16/R21/R24/R25 are cited by the matrix but the mounted Reference Library defines R01-R15 only -> HANDOFF_BLOCKED on ID mapping. The three mandated categories are satisfied directly. No screenshots, layouts, branding or proprietary grammar copied.

## 1. IBM Maximo Manage — dispatching work to crews and labor (official enterprise urgent-dispatch source)
Link: https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=application-dispatching-work
Observed principle: urgent/unplanned dispatch (emergency work orders, sick labor) is a governed variant of planned scheduling — it still validates availability and qualification and records assignment; urgency changes timing, not controls.
Adopted: the availability-checked auto-assign default for speed, urgency as an operational state on the same governed pipeline, and the explicit assignment record with candidates audit.
Rejected: Gantt/graphical dispatch boards and capacity heuristics (no governed capacity limits exist in MVP1).
Fit for Saqeel: matches M01-048's existing availability semantics and the no-bypass design thesis.

## 2. Digital Government Authority (Saudi Arabia) — national digital-government standards (official Saudi government source)
Link: https://dga.gov.sa/en
Observed principle: government services must state authority, provenance and outcome truthfully — including when an operation partially fails — with Arabic-first presentation and neutral language.
Adopted: the authority bar's named-evidence chips, the consequence summary naming exactly what dispatch creates, truthful queued-vs-delivered notification language, Arabic-first RTL frame (3g).
Rejected: retired DGA green identity and GovBar chrome (DEC-011/CD-001); alarm-styled emergency visuals.
Fit for Saqeel: an urgent regulatory dispatch is a legal act by a ministry — authority and traceability are the product, not overhead.

## 3. W3C Internationalization + WAI — RTL/bidi and status-message accessibility (authoritative a11y/RTL source)
Link: https://www.w3.org/International/quicktips/ and https://www.w3.org/International/techniques/authoring-html
Observed principle: set base direction at the document root; isolate opposite-direction runs (codes, coordinates, times) from the bidirectional algorithm; status changes must be programmatically announced, not visually implied.
Adopted: document-level dir/lang, bdi-isolated CR/coordinate/time values inside Arabic chip labels, aria-live protocol (assertive protections/failures, polite counts), glyph+text chip states.
Rejected: CSS-only direction control; color-only chip states.
Fit for Saqeel: the authority bar is a status instrument — its truthfulness depends on announcements and bidi-safe identifiers as much as on layout.
