# APPLICATION_SHELL
- Anatomy: graphite Sidebar (brand, grouped nav items with counts, user footer) + TopBar (nav toggle, global search, EN/AR seg, theme, notifications, user menu) + canvas content region.
- Sidebar: 248px; collapses to 60px icons+tooltips (auto ≤1024px); active item = emerald-tinted layer + indicator edge; groups are 10.5px uppercase (EN only).
- TopBar: 52px, surface-primary, hairline bottom; search ≤400-420px; scope controls (region/date) live in TopBar slots.
- Page region: breadcrumb → PageHeader (title, meta line with ID+status, actions, tabs) → content.
- Behaviour preserved from product: role-scoped nav building, RLS-scoped scopes, skip-link, flash-free theme boot.
- RTL: whole shell mirrors via logical properties; sidebar sits inline-start (right in AR).
- Reference: ui_kits screens; components/navigation/*.
