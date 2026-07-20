# COMPONENT_API_CONTRACT — SAQEEL Inspection
The authoritative per-component contract lives NEXT TO each component:
- `components/<group>/<Name>.d.ts` — props interface (names, types, defaults noted in comments). This is the API.
- `components/<group>/<Name>.prompt.md` — purpose, usage example, variant/misuse notes.
- `components/<group>/*.card.html` — rendered anatomy and states.
Shared contract (applies to every component):
- **States:** default, hover, focus-visible (2px --focus-ring, offset 2), active/pressed (action ramp one step), selected (--accent-soft), disabled (45% opacity, no pointer), loading (layout-preserving), error (--status-critical border + role=alert message), read-only (--surface-sunken), empty/partial (EmptyState / skeleton conventions).
- **Keyboard:** all interactive elements tabbable in DOM order; Esc closes any layer (menu, palette, modal, drawer); arrows navigate listboxes/menus; Enter activates; Shift-click extends sort.
- **Focus:** layers trap focus and restore it to the trigger on close; focus never lost to body.
- **RTL:** logical properties only; directional icons flip via data-directional; identifiers embedded LTR.
- **Theming:** semantic tokens only; a component must render correctly in all four modes with zero component-level colour overrides.
- **Responsive:** controls keep ≥44px touch targets on tablet surfaces; grids collapse per RESPONSIVE_SPECIFICATION.md.
- **Naming:** props are camelCase; status vocabulary is the fixed 10-role set; stage vocabulary is the 13-stage spine set.
