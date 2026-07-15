# CD-001 V7 UX-004 — Arabic-First RTL Handoff

Date: 2026-07-13  
Screen: SCR-PUB-010  
Task: CD-001-V7-UX-004

## Accepted outcome

- A fresh visit to `/login` defaults to Arabic before the first paint.
- The document and login surface use `lang="ar"` and `dir="rtl"`.
- The credential panel occupies the physical right side and the atlas occupies the physical left side on desktop.
- The lifecycle rail reads and navigates right-to-left in Arabic. `ArrowLeft` progresses Plan to Travel; English retains `ArrowRight` progression.
- Login copy, validation, trust text, lifecycle events, hotspot labels and zone labels are Arabic.
- Email values and the English language switch keep their appropriate left-to-right direction.
- The selected locale persists through both `login_locale` and shared `locale` cookies. Choosing English remains available and reversible.

## Map treatment

The approved public-safe raster is preserved. Arabic city and zone labels are native DOM overlays aligned to the contained image plane, so they remain responsive and accessible. Dossiers use physical placement classes so their position does not invert incorrectly under RTL.

## P1 limitation

The approved raster contains baked-in English geographic labels. Arabic DOM labels are overlaid, making the current atlas bilingual. A genuinely Arabic-only atlas requires a separately generated, reviewed and rights-cleared Arabic raster; CSS cannot safely remove text embedded in the image.

## Protected behavior

Authentication, anti-enumeration reset, ERR-AUTH-001, FND-003 audit, `/launch` RBAC routing, backend data, workflow state and the sanitized public-safe asset contract are unchanged.
