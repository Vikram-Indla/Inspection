# DARK_MODE_SPECIFICATION — SAQEEL Inspection
- Mechanism: `[data-theme="dark"]` re-declares every semantic token; components change nothing.
- Composed, not inverted: canvas #17191d → surfaces layer UP (#1e2126 → #23262c → #282c33); sunken goes below canvas (#131518).
- Navigation stays graphite (#131519) — darker than canvas so the shell still frames the workspace; selected keeps the emerald-tinted layer + indicator.
- Action emerald brightens (#2e9e77) and hover/pressed go LIGHTER (opposite of light mode).
- Elevation = 1px shade edge + ambient darkness (inset ring in shadow tokens); never glow, never heavy stacks.
- Status ramps re-tuned: bases lifted for contrast, softs are deep tints, text slots are light. Same 10 meanings.
- Charts re-tuned (--chart-* dark set). Maps: use a dark basemap style from the engine — never a dark overlay on a light map.
- text-on-action is near-black on the bright emerald (#08120e) — check any new filled control against it.
- Reference screens: dashboard-dark, map-command-dark, register-dark, register-ar-dark, detail-ar-dark.
