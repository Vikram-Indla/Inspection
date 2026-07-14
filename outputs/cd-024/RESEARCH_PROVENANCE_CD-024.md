# RESEARCH_PROVENANCE_CD-024 (R2 — exact mandated primary sources)

## 1. Microsoft Dynamics 365 Field Service — schedule board / manual scheduling
Link: https://learn.microsoft.com/en-us/dynamics365/field-service/work-with-schedule-board
Observed principle: the schedule board is a dispatcher surface for explicit manual booking over KNOWN bookings; it displays existing bookings and requirements — it does not infer availability.
Adopted: manual assignment is decided over known assignments rendered as text evidence (exact conflicting visit + window); manual is an explicit, honest mode.
Rejected: the board/timeline visualization itself — it reads as availability, which Saqeel has no verified source for (no work hours, capacity, location).
Saqeel-specific reason: MVP1-FND-013 forbids invented freshness/truth; the overlap query returns known assignments only.

## 2. Microsoft Dynamics 365 Field Service — scheduling resource types
Link: https://learn.microsoft.com/en-us/dynamics365/field-service/scheduling-resource-types
Observed principle: scheduling behavior depends on which resource attributes are actually modelled; a resource only supports what its type carries.
Adopted: candidate evidence limited to attributes Saqeel verifiably has (inspector role membership, known assignments); everything else is a named "Not evaluated".
Rejected: skill / territory / location / working-hours attributes — no Saqeel source exists.
Saqeel-specific reason: candidates come solely from user_roles('inspector'); rendering richer attributes would be fabrication.

## 3. W3C ARIA APG — grid pattern
Link: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
Observed principle: a composite grid requires the full managed-focus contract (focus entry/exit, arrow-key cell/row navigation, Enter/F2/Escape, screen-reader behavior).
Adopted: as the rejection criterion — the design uses a plain semantic table with native tabbable controls; no grid semantics are claimed.
Rejected: roving / one-tab-stop behavior without the grid contract (withdrawn per R1-7).
Saqeel-specific reason: the task is per-row decisions with a few native controls; DSG-A11Y-001 requires a coherent single model.

## 4. W3C ARIA APG — listbox pattern
Link: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
Observed principle: custom listboxes carry selection-model and screen-reader caveats that native select elements avoid.
Adopted: native selects for method/inspector, in the normal tab order.
Rejected: styled ARIA listboxes for candidate choice.
Saqeel-specific reason: keyboard burden was a named hypothesis-comparison criterion; native controls minimize it.

## 5. GOV.UK Design System — error summary
Link: https://design-system.service.gov.uk/components/error-summary/
Observed principle: on failed submit the summary receives focus, each error links to its control, entered values are preserved; permission problems are not field validation.
Adopted: verbatim (frame 4i): role=alert summary, per-blocker anchors, focus transfer, input preservation, unauthorized handled separately.
Rejected: nothing material.
Saqeel-specific reason: repairs the R1 finding that conflict submission lacked focus transfer and a linked summary.

## 6. Saudi Digital Government Authority — web accessibility for people with disabilities and the elderly
Link: https://dga.gov.sa/en/digital-knowledge/web-accessibility-disabilities-and-elderly-people
Observed principle: Saudi government digital services must remain operable for disabled and elderly users — keyboard operation, clear language, adequate control sizes.
Adopted: >=44-48px touch/click targets, glyph+text status (never color alone, MVP1-FND-011), plain-language failure copy.
Rejected: nothing in scope.
Saqeel-specific note (R1-9): Arabic-first fresh-session default is NOT sourced from DGA — it is the binding Saqeel baseline decision (DEC-011). The generic DGA homepage is not used as evidence.

No external visuals were copied; no scheduling function beyond the verified runtime was introduced.
