# ACCESSIBILITY_KEYBOARD_SPEC_CD-004_R2B.md
Binding for implementation; the component map repeats these semantics.

1. Landmarks: skip link ("Skip to overview" / Arabic key admin.a11y.skip) as first focusable -> <main id="overview">. Shell nav/topbar remain the frozen shell's landmarks.
2. Headings: exactly one <h1> (page title). <h2> x3: evidence spine, families without reads, your scope. No skipped levels.
3. Spine semantics: a true <table> with <caption>Configuration evidence spine</caption>; th scope="col" = Family / Read result / Proven lifecycle / Action; th scope="row" = family name cell. Rationale: cell-to-column relationships carry meaning (read state vs lifecycle vs action); a list would lose header association. NO role=grid — no composite keyboard navigation exists.
4. Accessible names: action links = "Open {family} — {family} module"; retry buttons = "Retry reading {family}". Visible label may be shorter; the name carries the family.
5. Keyboard: Tab order = DOM order = visual order (RTL-aware): page lozenge (focusable summary) -> per row: Retry (when present) -> Open -> link-only family links -> audit link -> scope band links. Enter/Space activate. No focus traps; no modals.
6. Focus ring: dark 3px #9487FF offset 3px; light 2px #6A5AE8 offset 2px (both shown in frames).
7. Focus transfer: Retry keeps focus on the button while pending (aria-disabled, name unchanged); on result, focus moves to the row's read-result cell (tabindex=-1) and the singleton region announces once. Refresh-all returns focus to the page lozenge.
8. Live regions: ONE polite region (refresh start/finish, recovery, timestamp updates, scope-count changes) + ONE assertive region (newly failed source, total failure). Regions are singletons reused in place — announcement storms structurally impossible.
9. Non-color cues: every state = glyph + word (checkmark verified / cross unavailable / half-circle partial); lifecycle facts are words; counts carry their verification word.
10. Targets: all primary actions >= 44x44 CSS px. Exception (documented): inline links inside annotation prose are non-primary.
11. Zoom/reflow: 400% zoom uses the 1024/stacked composition; no horizontal scroll; identifiers never truncate (wrap onto own line).
12. Mixed direction: every code/date/version in <bdi dir="ltr">; Arabic frames use document-level lang="ar" dir="rtl"; physical order verified at 1440 and 1024.
13. Reduced motion: no shimmer (static placeholders), static retry glyph, state swap without transition; object continuity by fixed layout.
