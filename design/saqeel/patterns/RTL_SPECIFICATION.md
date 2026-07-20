# RTL_SPECIFICATION — SAQEEL Inspection
- Flip mechanism: `dir="rtl"` (+ `lang="ar"`) on <html>. No RTL class forks; all CSS uses logical properties (inline-start/end, block-start/end).
- Typography: Arabic-first stack + raised leading applied automatically; letter-spacing forced to 0; uppercase transforms disabled for Arabic labels.
- Identifiers/coordinates/phones: ALWAYS LTR via .id-code/.t-mono (direction:ltr; unicode-bidi:embed) inside RTL text.
- Directional icons (chevrons, forward/back arrows, pagination ‹›): flip. Status shapes, numbers, clock icons: never flip.
- Layout: sidebar moves to inline-start (right); drawers open from inline-end (left); table column order reverses with pinned ID column staying inline-start; breadcrumb separators and Steps lines mirror automatically; map panels use inset-inline so they mirror; the basemap itself does not mirror.
- Numerals: Latin digits default; tabular-nums for alignment. Dates: "20 يوليو 2026".
- Validation messages appear below the field in both directions; label above field in both.
- Reference screens: register-ar.html, map-command-ar.html, detail-ar-dark.html, register-ar-dark.html.
