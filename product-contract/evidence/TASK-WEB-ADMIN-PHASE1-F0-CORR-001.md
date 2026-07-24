# WA-P1-F0-CORR-001 — Web/Admin favicon and wordmark correction

## Approved scope

- Browser favicon on the Web/Admin application
- Expanded authenticated shell identity
- Collapsed authenticated shell mark
- `SAQEEL Design System (7).zip` as asset authority

No route, backend, RLS/RBAC, workflow, audit, version, integration, Field/PWA,
offline execution, or iPad implementation changed.

## Source

- Archive: `/Users/vikramindla/Attachment dump/SAQEEL Design System (7).zip`
- Size: `2324` bytes
- SHA-256: `0b78a174e622e3e81e215f159ae27c1fee8111535fe6be1761fced2569d6b270`
- Assets: green shield/check favicon; dark and light `SAQEEL | صقيل` wordmarks

## Implementation

- Root metadata now links `/saqeel-favicon.svg`; active Web/Admin metadata no longer links the prism.
- Expanded graphite navigation renders the approved dark-surface bilingual wordmark.
- Collapsed navigation renders the approved green shield/check favicon.
- The light-surface wordmark is tracked for approved light backgrounds.
- Legacy prism files are retained for rollback; PWA manifest and service worker are unchanged.

## Verification

- Typecheck: PASS
- Production build: PASS
- Focused branding contract including auth setup: 6/6 PASS
- Live asset HTTP checks: PASS
- Visible in-app browser reload: PASS
- Live head icon: `/saqeel-favicon.svg`
- Live expanded shell image: `/saqeel-wordmark-dark-mode.svg`, alt `SAQEEL | صقيل`
- Live collapsed shell image source: `/saqeel-favicon.svg`
- Permission-negative state remained visible and unchanged during review
- Broader login-atlas focused test: FAIL before favicon assertion because the expected `inspection-atlas-scene-base-v2-light.png` element is absent on this branch; recorded as a pre-existing cross-line baseline mismatch, not waived

## Rollback

Revert the correction commit or restore the retained metadata/shell references.
Do not delete legacy assets until stabilization and Product Owner removal
approval.

Implementation commit: `c75407aa`.
