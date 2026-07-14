# RESEARCH_PROVENANCE_CD-025 (R1 - exact mandated primary sources)

## 1. GOV.UK Design System - Check answers
Link: https://design-system.service.gov.uk/patterns/check-answers/
Observed principle: before an irreversible submit, restate everything with a change link per section.
Adopted: object sections with per-section "Change" links carrying accessible hidden context (frame 5a).
Rejected: generic government styling; Q/A phrasing - Saqeel objects are factories/visits/packages.
Saqeel reason: publication is a governed act over regulated objects, not a form.
Frame/node: 5a object sections; #frame-cd025-primary.

## 2. GOV.UK Design System - Confirmation pages
Link: https://design-system.service.gov.uk/patterns/confirmation-pages/
Observed principle: confirm only what happened; say what happens next.
Adopted: completion panel with committed counts + truthful destination (5i, S26).
Rejected: green panel implying delivery; invented reference persistence; support contact.
Saqeel reason: FND-004/FND-013 - queued is not delivered; no receipt exists.
Frame/node: #frame-cd025-success.

## 3. GOV.UK Design System - Error summary
Link: https://design-system.service.gov.uk/components/error-summary/
Observed principle: focused summary, per-error links, values preserved.
Adopted: verbatim (5j; S3/S18).
Rejected: nothing material.
Frame/node: #frame-cd025-error.

## 4. W3C WCAG 2.2 - Focus Order
Link: https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html
Observed principle: focus order follows meaning and operability.
Adopted: reading order = mandated narrow order; summary->row->restoration transfers (5j, S28).
Rejected: sticky action bars that reorder or cover focus targets.
Frame/node: 5n order; 5j focus chain.

## 5. W3C WCAG 2.2 - Status Messages
Link: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
Observed principle: convey status without stealing focus; assertive only when actionable.
Adopted: role=status for validating/publishing/scope counts; role=alert once for blockers/failures; no duplication (5g spec panel).
Rejected: announcing every state change assertively.
Frame/node: #frame-cd025-publishing.

## 6. Saudi DGA - Web accessibility for people with disabilities and the elderly
Link: https://dga.gov.sa/en/digital-knowledge/web-accessibility-disabilities-and-elderly-people
Observed principle: government services stay operable for disabled and elderly users.
Adopted: >=44-48px targets; plain-language consequence copy; glyph+text status (FND-011).
Rejected: nothing in scope.
Saqeel note: Arabic-first fresh-session default is the binding Saqeel baseline (DEC-011), NOT sourced from DGA.
Frame/node: 5k/5n.

## 7. PostgreSQL documentation - Transaction Isolation
Link: https://www.postgresql.org/docs/current/transaction-iso.html
Observed principle: a transaction guarantees atomicity of its writes, not freshness of reads made before it began.
Adopted: bulk copy separates "created together or not at all" (RPC-true) from "checks re-run before publish; a final-moment change is not caught" (5a readiness; S11/S18).
Rejected: any "concurrency-safe" or "rechecked inside the transaction" claim.
Frame/node: 5a readiness + ledger; S17/S18.

No external visual brand copied; no unsupported scheduling/approval function introduced.
