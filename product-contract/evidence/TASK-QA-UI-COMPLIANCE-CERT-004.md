# UI Compliance Certification 004

## Governing references

- W3C WCAG 2.2 Recommendation and conformance model:
  `https://www.w3.org/WAI/standards-guidelines/wcag/`.
- DGA accessibility guideline V2, document `DGA-1-2-4-203`, explicitly covering
  WCAG 2.2 and assistive technologies:
  `https://dga.gov.sa/sites/default/files/2024-05/Guideline%20For%20Web%20Accessibility%20of%20Digital%20Channels%20Content%20to%20Serve%20People%20with%20Disabilities%20and%20the%20Elderly-V2.0.pdf`.
- DGA Digital Transformation Basic Standards V4.0, standard `5.13.8`, requiring
  an executive plan to apply the unified design system — Platform Code — across
  government platforms, applications and websites:
  `https://dga.gov.sa/sites/default/files/2025-10/Digital%20Transformation%20Basic%20Standards%20-%20V4.0.pdf`.
- DGA Platform Code national design-system description:
  `https://dga.gov.sa/ar/digital-knowledge/national-design-system-of-Saudi-Arabia`.

## DGA Platform Code executive adoption plan

1. Foundation: one root bilingual font, semantic palette, spacing, radius, elevation,
   motion, focus and responsive token authority.
2. Components: all working authenticated pages consume the shared shell and Astryx
   primitives; named auth, redirect and print exceptions remain explicit.
3. Journeys: planning, visit management, review, admin, factory context, operations,
   virtual and field experiences remain mapped to governed screen and process IDs.
4. Prevention: source contracts reject new authenticated raw palettes, italics,
   cinematic styling, ungoverned shells and Atlas-token leakage.
5. Verification: WCAG runtime scan, keyboard, focus, 320px reflow, target size,
   reduced motion, Arabic/RTL and theme matrices run before release.
6. Human evidence: native Arabic review and representative inspector endurance are
   mandatory signoffs, never inferred from automated tests.

This plan satisfies the source/product implementation leg of 5.13.8. Agency domain,
IPv6, DNSSEC, DGA submission and organizational verification are deployment/agency
responsibilities outside this repository and are not claimed here.

## Runtime audit scope

Read-only authenticated journeys cover planning, visit management, review queue,
admin home, regulation library and inspector factory context in English/Arabic and
light/dark. Axe is configured for WCAG 2.0/2.1/2.2 A/AA tags. Manual automation adds
320 CSS-pixel reflow, 24px targets, keyboard focus, focus visibility, RTL physical
mirroring and reduced-motion checks.

The authenticated `/field` route is not called against the shared backend because its
server load performs canonical visit expiry. Its non-mutating component harness covers
the approved shell/taskbar geometry. Full field runtime remains for a controlled database
or the observed endurance sessions.

## Native Arabic review protocol

Reviewer prerequisites: native Arabic, government/industrial terminology competence,
no implementation role. Review every critical journey in light/dark and narrow/desktop:
meaning parity, terminology, grammar, truncation, reading order, bidi identifiers,
dates/numbers, error/action clarity and screen-reader announcement order. Record reviewer,
date, build SHA, route/state, severity and disposition. Any open P0/P1 blocks PASS.

## Inspector endurance protocol

Run at least one representative morning session and one night session, each four to five
hours, using production-representative iPad hardware and controlled data. Capture task
completion, error/recovery, interruption resumption, navigation recall, missed status,
fatigue rating at hourly intervals, theme changes, glare/readability observations and
critical incidents. No self-approval: participant and observer sign the session record.
Any open P0/P1 blocks PASS.

## Current verdict

`CONDITIONAL PASS — TECHNICAL PASS / HUMAN EVIDENCE PENDING`.

### Executed technical evidence

- Production build: PASS across all compiled routes.
- TypeScript validation: PASS with zero errors.
- Compliance source guard: 4/4 PASS.
- Authenticated runtime carrier: all eight exact checks PASS in controlled shard
  executions. Coverage includes planning, visits, reviews, admin, regulations and
  factory context; English/Arabic; light/dark; Axe WCAG 2.0/2.1/2.2 A/AA; 320 CSS-pixel
  reflow; target sizing; landmarks; keyboard/focus; RTL physical mirror and reduced motion.
- A consolidated carrier was also attempted. The shared verification Auth service returned
  HTTP 429 after consecutive renders even with five-second pacing; this is recorded as an
  infrastructure ceiling, not converted into a product PASS or FAIL. The exact checks are
  therefore retained as independently executable read-only shards.
- Diff whitespace validation: PASS.

### Defects found and closed

1. Inline links used colour as their only visual distinction. Governed inline links now
   retain an underline while button-links remain unchanged.
2. Visit date filters and latent bulk-action fields lacked explicit label association.
   Stable `id`/`htmlFor` relationships now name every affected control.
3. Compact visit-table preview/detail actions missed the WCAG 2.2 24 CSS-pixel target
   floor. A shared logical-size target utility corrects them without changing inputs.
4. The Factory 360 region filter had no accessible name. Its visible label is now
   explicitly associated.

The current technical implementation has no open P0/P1 finding in this certification
scope. Native Arabic review (UIC-AC-023/038) and representative morning/night inspector
endurance (UIC-AC-039/040) remain `HUMAN_PENDING`. They require actual qualified people
and observed sessions; automation and the implementer cannot self-sign them. Production
PASS is therefore correctly withheld until those three evidence records are completed
without open P0/P1 findings.

### Adjacent release observation

`npm audit --omit=dev` reports two moderate PostCSS advisories through the pinned Next.js
toolchain. The offered automatic remediation is a breaking Next.js downgrade and was not
applied inside this UI-only change authority. This is a separate G11 dependency-hardening
item, not hidden or misreported as part of the UI compliance result.
