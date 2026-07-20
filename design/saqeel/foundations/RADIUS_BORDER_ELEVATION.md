# RADIUS_BORDER_ELEVATION
- Radii (small on purpose): xs 2 (checks/badges) · sm 3 (buttons/inputs/chips) · md 4 (cards/panels/popovers) · lg 6 (modals/drawers) · full (avatars/markers/switch/sync pill only).
- Borders do the structural work: 1px subtle (structure) / strong (emphasis) / input (controls). No decorative thick borders; the only left-edge accent is the 3px severity edge on finding cards + 4px table rail.
- Elevation minimal: shadow-xs/sm/md/lg; light = soft ink; dark = 1px shade edge + ambient darkness (never glow). Panels are border-first; shadows only on genuinely floating layers (popover/modal/toast/map panels).
