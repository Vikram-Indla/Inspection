# Saqeel Premium — Approved direction record (design stage only)
STATUS: DESIGN PACKAGE READY FOR VISUAL APPROVAL — NOT YET IMPLEMENTED. No production code or design-system tokens changed.

## Stakeholder decisions recorded (this round)
1. Texture experiment APPROVED at 1–2% strength, ONLY in low-information chrome: command bar, brand band, navigation chrome, empty canvas. NEVER behind report text, tables, forms, evidence, legal content, signatures, or interactive controls.
2. Dates: GREGORIAN PRIMARY, all user-facing times in Asia/Riyadh. Hijri = documented optional org-controlled secondary display (NOT rendered in pilot frames; see RESPONSIVE-RTL-SPEC §Dates).
3. Pending: final direction pick — recommended A1 (report) + B2 (review workspace) hybrid.

## Recommendation
- Report: **A1 Industrial Editorial** — numbered-chapter rule composition, largest container reduction (31→12), near-lossless A4 translation, reads as a governed state document.
- Review workspace: **B2 Industrial Command** — issue-queue canvas + status rail + evidence panel + sticky governed decision bar; shortest reviewer eye-line.
- Hybrid is one system: both share the V2 primitives (28/32 metric, 3:1 control border, 3 surface levels, Riyadh date grammar, chip/status language, texture policy).

## Implementation risks
- Riyadh date service touches every surface (shell, report, review) — regression-test day boundaries 00:00–03:00.
- Print renderer split (screen vs A4) must keep one governed content model — snapshot parity test required.
- Control-border token change (#D6DDE2→#7A8894 on controls) re-tints every input/chip; audit dark theme derivations.
- Sticky decision bar + sticky command bar: verify focus-not-obscured (WCAG 2.4.11) at 400% zoom.

## Build-first order
1. Date/time service + display grammar (P0, unblocks everything).
2. Tokens: --ax-text-metric, --ax-color-border-control, surface tiers, print tokens.
3. Status chip + status rail + version chip (shared by all frames).
4. Report content model + editorial screen renderer + A4 print renderer.
5. Review workspace shell (issue navigator, evidence panel, sticky decision bar).
6. Hybrid app shell (command bar + retained service rail).

## Approval still required from stakeholder
- (a) A1+B2 hybrid [recommended] / (b) all-Editorial / (c) all-Command / (d) specified mix.
- Sign-off on container-count justifications per frame (see canvas annotations).
- Sign-off on token spec before any design-system file changes.