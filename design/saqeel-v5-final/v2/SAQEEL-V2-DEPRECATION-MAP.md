# Saqeel V2 — deprecation map
| Item | Status | Replacement |
|---|---|---|
| --ax-radius-input:12px | REMOVED | 6px value under same token |
| Dark primary #78AEDA | REPLACED | #64C2A1 (blue remains as --ax-color-info) |
| .ax-btn transparent-label loading | REMOVED | label + trailing spinner |
| .ax-btn--danger in toolbars | PROHIBITED | .ax-btn--danger-subtle / overflow menu; solid = confirmation only |
| .ax-typecard for version/report lists | DEPRECATED | .ax-recordrow |
| .ax-lozenge | RETAINED (domain glyph system) | .ax-chip for outcome/urgency/custody chips |
| .ax-segmented dark-raised selected | REPLACED | primary-tint quiet selection |
| Bordered .ax-surface as generic wrapper | RESTRICTED | 3-level surface rule; .ax-field-tonal for structure |
| Space Grotesk input voice | REMOVED | IBM Plex Sans Arabic via `--ax-font-input: var(--ax-font-sans)` |
| pilot-only --v2-* vars | SUPERSEDED | canonical tokens (pilot kept read-only for provenance) |
Lint gates for build (engineering): forbid 12px input radii, transparent-label loading, solid-danger outside dialogs, role=tab on route links, raw hex outside tokens.