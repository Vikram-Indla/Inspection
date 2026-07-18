# Government Foundation and Shell Reset V1

## Authority

Sponsor-approved on 2026-07-18 under `CC-DESIGN-FOUNDATION-SHELL-RESET-001`.
This contract supersedes the launch-film visual identity for authenticated UI.

## Scope IDs

- Task: `TASK-DESIGN-FOUNDATION-SHELL-RESET-001`
- Sponsor requirements: `SPONSOR-DSF-001..030`
- Acceptance: `DSF-AC-001..030`
- Shared screen: `SCR-SHARED-SHELL-001`; applies to all governed authenticated screens.
- Engines touched visually only: `ENG-11` notifications and `ENG-12` audit surfaces.

## Non-negotiable foundation

1. Product UI is productive, institutional and content-first.
2. Light is the first-install default; neutral dark remains first-class.
3. IBM Plex Sans Arabic provides bilingual continuity; geometric display styling is removed from product UI.
4. Running text stays 16/24 or larger; field text stays 17/26.
5. Headings use 500 by default; 600 is reserved for short decisive emphasis.
6. Mono is restricted to identifiers, hashes, coordinates and machine timestamps.
7. Operational text is sentence case and never italic.
8. Neutral layers dominate. Accent color identifies actions and selection, not decoration.
9. No functional gradients, glow, glass blur or decorative shadows.
10. Card radii are restrained; pill geometry is reserved for status and compact controls.
11. Text inputs, textareas, selects and search geometry/behavior remain unchanged.
12. The prism has no baked black tile. Its container supplies an accessible context surface.
13. Notification and account controls use professional vector icons, bounded badges and responsive disclosure.
14. Collapsed navigation retains a clear brand mark, tooltips/accessible names and stable action placement.
15. New MVP2/MVP3 surfaces consume semantic tokens and shared shell primitives; raw local visual values fail review.

## Cinematic Atlas v0.8 exception

The Cinematic Atlas v0.8 is the only expressive visual exception.
The login Atlas may retain its photographic night scene, motion and local expressive
tokens under `login.css`. It may not reuse or redefine authenticated shell tokens.
The login form, accessibility, authentication behavior and locked text boxes remain governed.

## WCAG contract

- WCAG 2.2 AA is mandatory for text, non-text controls, keyboard, focus, reflow and status communication.
- Normal body text targets 7:1 where the palette permits; never below 4.5:1.
- Large text and meaningful icons never fall below 3:1.
- Focus indicators have at least 3:1 contrast against adjacent colors and remain visible in both themes.
- Status is never color-only; reduced motion, 200% zoom, 320 CSS-pixel reflow and Arabic RTL are verified.

## Acceptance guardrails

- Computed-style lock for input, textarea, select and search geometry/behavior.
- Automated token contrast checks for both themes.
- No `font-style: italic` in authenticated UI.
- No authenticated gradient except skeleton loading or data visualization with a documented semantic need.
- Shell verified expanded, collapsed, tablet, mobile drawer, English, Arabic, light and dark.
- Prism, notification badge and account control verified on every shell breakpoint.
- Typecheck, production build, focused shell tests and mapped regression pass before completion.
