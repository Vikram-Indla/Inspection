# MOTION_SPECIFICATION
- Tokens: fast 120ms (hover/press), base 180ms (state changes), slow 260ms (drawers/sidebar collapse); one easing cubic-bezier(0.2,0,0,1).
- Motion is functional only: state feedback, layer entry, progress. No decorative animation, no parallax, no bounces.
- Existing approved product animations (map zone-hover lift) are preserved untouched.
- prefers-reduced-motion collapses every transition/animation to ~0.
