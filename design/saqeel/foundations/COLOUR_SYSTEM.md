# COLOUR_SYSTEM
Authoritative values: ../tokens/tokens.json (light+dark) and tokens.css. Summary:
- **Surfaces**: canvas (warm neutral) → primary (white/charcoal) → secondary → sunken → raised. Dark mode is layered charcoal, composed not inverted.
- **Navigation**: deep graphite in BOTH themes; emerald-tinted selected layer + 2.5px indicator.
- **Action**: one emerald. Light: #115c44, hover darker. Dark: #2e9e77, hover LIGHTER. Soft accent = selection.
- **Status (10 fixed roles)**: critical, major, warning, compliant, info, pending, draft, onhold, completed, disabled — each base/soft/text per theme. Meanings never drift; colour never decorates.
- **Charts**: 6 desaturated categorical steps (chart-1 = emerald), grid + label tokens, per theme.
- **Evidence**: verified/pending/rejected alias the status roles.
- **Text on surfaces ≥4.5:1**; status base colours never used at body size — use -text slots.
