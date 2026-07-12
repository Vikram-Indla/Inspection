# Verification Prompt — UX Acceptance Certification

Evaluate `acceptance/DESIGN_ACCEPTANCE_MATRIX.csv`, `SCREEN_STATE_MATRIX.csv`, `SPECIAL_COMPONENT_ACCEPTANCE.csv`, and `VISUAL_EVIDENCE_REGISTER.csv`.

Certification requires:

- 38/38 screens reviewed with no unresolved route mismatch.
- 20/20 storyboards covered.
- P00–P12 including P06A/P06B wired.
- All required states designed or explicitly non-applicable with reason.
- Representative English/Arabic, LTR/RTL, dark/light, desktop/iPad evidence.
- Keyboard, focus, semantics, touch, reduced motion, non-color status, and WCAG AA.
- Maps, projected/live truth, video placeholder, media lifecycle, offline conflicts, version comparison, and realtime alerts passing their dedicated rows.
- Component disposition and engineering constraints recorded.
- No behavior or scope regression.

Return blockers by P0/P1/P2, evidence gaps, and a proposed certification status: FAIL, CONDITIONAL, or READY_FOR_HUMAN_SIGNOFF. Never mark final approval yourself.
