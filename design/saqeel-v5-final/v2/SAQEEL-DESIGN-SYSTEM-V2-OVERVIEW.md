# Saqeel Design System V2 — overview
STATUS: canonical design system UPDATED (tokens + component CSS + V2 layer). The Inspection APPLICATION is NOT yet implemented.

V2 converts the approved premium direction into the canonical system: brand-green dark theme, 3:1 control boundaries, 6px fields, 14/20 action & label typography, labeled loading buttons, gated danger, three surface levels, density ladder, status chips/rail, metric strip, record rows, focus-not-obscured recipe, approved 1.5% chrome texture.

## The design promise
> Saqeel V2 is designed to pursue Palantir Foundry-level operational clarity and decision confidence, SafetyCulture-level field efficiency, and Apple-grade iPad ergonomics — while retaining a unique Saudi industrial-government identity.
This is an acceptance target, not self-certification. See SAQEEL-V2-COMPETITIVE-BENCHMARK.md.

## Three surface levels (hard rule)
1. Page canvas. 2. `.ax-field-tonal` borderless tonal field. 3. `.ax-surface` bounded interactive/contextual panel — every use needs a semantic reason (interactive, contextual, status, legal). Structural grouping = spacing, rules, alignment, typography.

## Files
Canonical CSS: styles.css → tokens/fonts.css + tokens/tokens.css + tokens/astryx.css (V1 baseline, patched) + tokens/v2-components.css (V2 layer). Reference screens: patterns/web, patterns/ipad, patterns/admin. Specs: v2/*.md. Redesigned specimen: components/core/core.card.html (the critiqued screenshot, rebuilt).