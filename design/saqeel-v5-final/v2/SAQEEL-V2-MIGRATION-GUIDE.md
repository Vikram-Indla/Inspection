# Saqeel V2 — V1→V2 migration guide
1. Pull updated styles.css closure (tokens + astryx patches + v2-components).
2. Dark theme: audit anything assuming blue primary (charts, hardcoded #78AEDA) → primary is now green #64C2A1; blue = info only.
3. Inputs: 12px radius is gone; remove any local radius overrides.
4. Buttons: labels are 14/20 — remove local font overrides; replace toolbar variant="danger" with variant="danger-subtle" or overflow menu (solid danger = confirmation dialogs only); loading buttons now keep labels — remove any custom spinner hacks.
5. Wrap control groups in .ax-fieldset + legend; retitle labels sentence-case.
6. Replace bordered structural wrappers with .ax-field-tonal or plain rules; replace version cards with .ax-recordrow.
7. Add .ax-density-compact to admin roots, .ax-density-field to iPad roots.
8. Replace dt()/d10() UTC slicing with the Riyadh date service (P0 — see IMPLEMENTATION-MAPPING).
9. KPI values: use --ax-text-metric, reserve display for one statement per page.