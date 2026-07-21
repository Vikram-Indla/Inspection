# COMPONENT_MISUSE_GUIDE
- ✗ Two primary buttons in one view; ✗ danger for non-destructive acts; ✗ ghost for the main action.
- ✗ Colour-only status (badge without label, marker without legend); ✗ inventing an 11th status; ✗ status base colour on body text.
- ✗ Card-styled table rows, hidden hover-only actions, >2 font sizes per row, low-contrast headers (DataGrid prohibitions).
- ✗ Left-border accents anywhere except finding severity edge / table rail; ✗ pills beyond avatar/switch/marker/sync.
- ✗ Tinting maps or photography; ✗ decorative emerald floods; ✗ shadows on non-floating panels.
- ✗ Mono font for prose; ✗ letter-spacing on Arabic; ✗ mirroring identifiers/coordinates in RTL.
- ✗ Free-hex colours or component-level dark overrides — semantic tokens only.
- ✗ Toast for persistent conditions (use Alert); ✗ Modal for reference content (use Drawer).
- ✗ Rebuilding StatusSpine/EvidenceStack/ExceptionMark per page — always the shared components.
