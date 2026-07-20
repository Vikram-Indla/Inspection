# VISUAL_QA_MATRIX — pre-release checks
For every component and screen, verify:
| Check | How |
|---|---|
| No Barlow / Astryx fonts | computed font-family on EN + AR pages = IBM Plex only |
| No raw hex in app code | lint: colours via var(--*) |
| Semantic tokens resolve in all 4 modes | toggle data-theme × dir |
| Focus ring visible everywhere | tab through each screen |
| Status = colour + label/shape | scan badges, markers, rails |
| Identifiers mono + LTR in RTL | register-ar, detail-ar-dark |
| Table headers ≥4.5:1, rows ≤2 font sizes | register screens |
| Touch targets ≥44px on tablet | tablet.html |
| Reduced motion honoured | emulate prefers-reduced-motion |
| Map untinted; markers legible | map-command all modes |
| One primary button per view | all screens |
| Radius ≤6px; no pills except avatar/switch/marker | visual scan |
| Density attribute honoured | toggle data-density |
Report format: screen · mode · check · pass/fail · fix.
