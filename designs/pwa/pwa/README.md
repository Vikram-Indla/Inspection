# SAQEEL PWA — separate project surface (field / iPad)

**This folder is SAQEEL PWA, the inspector-facing product. The desktop surface is SAQEEL Web at the project root. They are separate and stay separate.**

- 45 pages: `SAQEEL PWA-Field *`, `SAQEEL PWA-Inspector *`, `SAQEEL PWA-Index`, `SAQEEL iPad Dashboard`.
- Self-contained: its own `saqeel/` design-system copy, `support.js`, `image-slot.js`, `ksa-adm1-map.js`. Nothing here reaches into the Web/Admin root except two deliberate cross-links (`../SAQEEL Delegation.dc.html`, `../SAQEEL Web-Index.dc.html`).
- SAQEEL Web lives at the project root and keeps its own `saqeel/` copy. The two stylesheets are siblings, not shared — a change to one does not silently change the other.

## Rules

1. SAQEEL Web work never edits anything under `pwa/`. SAQEEL PWA work never edits root pages.
2. Shell identity differs by surface and that is intentional: SAQEEL Web uses the `WA-BRAND-r1` rail lockup; the field app uses its own sticky header / tab bar treatment.
3. If a token or component genuinely must change in both, change it twice, deliberately, and note it — do not re-merge the two `saqeel/` copies.
4. One filename was normalized during separation: `SAQEEL PWA-Field Immediate & Incident` → `SAQEEL PWA-Field Immediate and Incident` (the `&` broke tooling paths).
5. Internal PWA links were repointed to the current `PWA-` filenames; two links that target Web/Admin pages now use `../`.
