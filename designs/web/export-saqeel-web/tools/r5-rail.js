// WA-SHELL-r5 rail generator — the single source of the swept rail markup.
// Mirrors web/src/lib/shell-navigation.ts (groups, order, labels, hrefs, icons)
// and web/src/components/ShellClient.tsx (brand row + icon-only collapse,
// Administration pinned and collapsed by default, sub-groups, locked items).
// Node/browser agnostic: exports a single buildRail(activeId, prefix).

const I = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6M12 3v2M21 12h-2"/>',
  factory: '<path d="M3 21V9l6 3V9l6 3V5h6v16z"/><path d="M7 17h2M13 17h2M18 9h3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  inspect: '<path d="M9 11l2 2 4-4"/><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
  review: '<path d="M9 5h10v16H5V9z"/><path d="M9 5v4H5M9 14l2 2 4-4"/>',
  library: '<path d="M4 4h6v16H4zM14 4h6v16h-6z"/><path d="M7 8h.01M17 8h.01"/>',
  enforcement: '<path d="M4 20h16M8 17l8-8M10 5l4 4M6 9l4 4"/>',
  access: '<circle cx="9" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0112 0v2M17 11h4M19 9v4"/>',
  risk: '<path d="M12 3l10 18H2z"/><path d="M12 9v5M12 18h.01"/>',
  forms: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/>',
  workflow: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M17 8l-4 8M7 8l4 8"/>',
  map: '<path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12z"/><circle cx="12" cy="9" r="2"/>',
  notify: '<path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 004 0"/>',
  admin: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87A2 2 0 1 1 16.9 19.7a1.7 1.7 0 0 0-2.87 1.3 2 2 0 0 1-4 0 1.7 1.7 0 0 0-2.87-1.3A2 2 0 1 1 4.3 16.87 1.7 1.7 0 0 0 3 14a2 2 0 0 1 0-4 1.7 1.7 0 0 0 1.3-2.87A2 2 0 1 1 7.13 4.3 1.7 1.7 0 0 0 10 3a2 2 0 0 1 4 0 1.7 1.7 0 0 0 2.87 1.3A2 2 0 1 1 19.7 7.13 1.7 1.7 0 0 0 21 10a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/>',
};

const svg = (k, size) =>
  '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" ' +
  'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + I[k] + '</svg>';

const CHEV = '<svg class="r5-chev" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m8 10 4 4 4-4"/></svg>';
const CARET = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="margin-inline-start:auto;"><path d="m9 6 6 6-6 6"/></svg>';
const LOCK = '<span class="r5-lock" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>';

// [id, label, href, icon, child?, locked reason?]
const GROUPS = [
  { id: 'overview', label: 'Overview', open: true, items: [
    ['dashboard', 'Dashboard', '/dashboard', 'dashboard'],
    ['operations', 'Operations Center', '/operations', 'radar'],
    ['factories', 'Factory 360', '/factories', 'factory'],
  ]},
  { id: 'operations', label: 'Operations', open: true, items: [
    ['planning', 'Planning', '/planning', 'calendar'],
    { sub: 'Inspection', icon: 'inspect', items: [
      ['execution', 'Execution', '/field', 'inspect'],
      ['reviews', 'Review & Approval', '/reviews', 'review'],
    ]},
  ]},
  { id: 'compliance', label: 'Compliance', open: true, items: [
    ['regulations', 'Inspection Rules', '/admin/regulations', 'library'],
    ['approvals', 'Awaiting Approval', '/admin/compliance-approvals', 'review'],
    ['violations', 'Violations & Penalties', '/admin/violations', 'enforcement'],
  ]},
  { id: 'administration', label: 'Administration', open: false, admin: true, items: [
    ['users', 'Users', '/admin/access', 'access'],
    ['roles', 'Roles', '/admin/access?view=roles', 'access', null, 'Administrator access required'],
    ['lookups', 'Reference Lists', '/admin/localization', 'library'],
    ['planning-lookups', 'Planning Lookups', '/admin/planning/lookups', 'library'],
    ['planning-expiry', 'Planning Expiry Rules', '/admin/planning/expiry', 'workflow'],
    ['planning-status', 'Planning Status Rules', '/admin/planning/status', 'workflow'],
    ['risk', 'Risk Settings', '/admin/risk', 'risk'],
    ['forms', 'Inspection Forms', '/admin/packages', 'forms'],
    ['notifications', 'Notification Settings', '/admin/notifications', 'notify'],
    ['integrations', 'System Connections', '/admin/integrations', 'workflow'],
    { sub: 'Advanced Administration', icon: 'workflow', items: [
      ['exec-settings', 'Execution Settings', '/admin/execution', 'workflow'],
      ['workflows', 'Workflow Settings', '/admin/workflows', 'workflow'],
      ['gis', 'Map Settings', '/admin/gis', 'map'],
      ['audit', 'Activity Log', '/admin/audit', 'access'],
      ['platform-operations', 'System Operations', '/admin/operations', 'radar'],
      ['security-access', 'Security & Access Review', '/admin/security-access', 'access'],
      ['devices', 'Trusted Devices', '/admin/devices', 'inspect'],
      ['admin-home', 'Approval & Configuration', '/admin', 'admin'],
      ['items', 'Inspection Items', '/admin/items', 'forms'],
      ['enforcement-recommendations', 'Enforcement Recommendations', '/admin/enforcement-recommendations', 'enforcement'],
      ['bulk-violations', 'Issue Multiple Violations', '/admin/bulk-violations', 'enforcement'],
      ['localization', 'Language & Translations', '/admin/localization', 'library'],
      ['enforcement-cases', 'Violation Cases', '/enforcement', 'enforcement'],
    ]},
  ]},
];

function item(row, activeId, indent) {
  const [id, label, href, icon, , locked] = row;
  const cls = 'nav-item' + (indent ? ' r5-child' : '') + (locked ? ' is-locked' : '') + (id === activeId ? ' is-active' : '');
  const ic = '<span class="nav-icon">' + svg(icon, 20) + '</span>';
  const lb = '<span class="nav-label">' + label.replace(/&/g, '&amp;') + '</span>';
  if (locked) {
    return '<span class="' + cls + '" role="link" aria-disabled="true" tabindex="0" title="' + label +
      ' — ' + locked + '." aria-label="' + label + '. ' + locked + '.">' + ic + lb + LOCK + '</span>';
  }
  return '<a class="' + cls + '" href="#' + id + '" data-route="' + href + '"' +
    (id === activeId ? ' aria-current="page"' : '') + '>' + ic + lb + '</a>';
}

export function buildRail(activeId, prefix = '') {
  const out = [];
  out.push('<aside class="sidebar" id="saqeel-primary-nav" aria-label="Primary navigation" style="height:100vh;">');
  out.push('    <div class="sidebar-brand" style="gap:11px; min-height:64px;">');
  out.push('      <img class="brand-wordmark" src="' + prefix + 'export-wordmark-icons/saqeel-wordmark-dark-mode.svg" alt="SAQEEL | صقيل" width="260" height="40">');
  out.push('      <img class="brand-favicon" src="' + prefix + 'export-wordmark-icons/saqeel-favicon.svg" alt="SAQEEL" width="32" height="32">');
  out.push('      <button class="r5-collapse" type="button" aria-label="Collapse navigation" aria-expanded="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>');
  out.push('    </div>');

  const render = g => {
    const cls = 'r5-group' + (g.admin ? ' r5-group--admin' : '');
    const rows = [];
    // open="open" (not a bare attribute) — the template parser drops valueless attrs.
    rows.push('      <details class="' + cls + '"' + (g.open ? ' open="open"' : '') + '>');
    rows.push('        <summary>' + (g.admin ? '<span class="nav-icon">' + svg('admin', 20) + '</span>' : '') +
      '<span class="nav-label">' + g.label + '</span>' + CHEV + '</summary>');
    for (const entry of g.items) {
      if (Array.isArray(entry)) { rows.push('        ' + item(entry, activeId, false)); continue; }
      rows.push('        <div role="group" aria-labelledby="r5-p-' + entry.sub.replace(/\s+/g, '-').toLowerCase() + '">');
      rows.push('          <div class="r5-sub" id="r5-p-' + entry.sub.replace(/\s+/g, '-').toLowerCase() + '">' +
        '<span class="nav-icon">' + svg(entry.icon, 20) + '</span><span class="nav-label">' + entry.sub + '</span>' + CARET + '</div>');
      for (const child of entry.items) rows.push('          ' + item(child, activeId, true));
      rows.push('        </div>');
    }
    rows.push('      </details>');
    return rows.join('\n');
  };

  out.push('    <div style="flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">');
  for (const g of GROUPS) if (!g.admin) out.push(render(g));
  out.push('    </div>');
  out.push('    <div style="border-block-start:1px solid var(--nav-border); padding-block-start:6px;">');
  for (const g of GROUPS) if (g.admin) out.push(render(g));
  out.push('    </div>');
  out.push('  </aside>');
  return out.join('\n');
}


// ── Topbar (repo parity: ShellClient.tsx .ax-pagehead__topbar + astryx.css) ──
// Fully static: no {{ }} holes, so it renders identically on every design page
// regardless of that page's logic class. Popovers use <details>/<summary>.
// Scope controls are route-aware exactly as shellScopeForRoute() decides:
// /dashboard = date + region, /operations* = region only, everything else
// renders both disabled with "Not applicable" — disabled, never hidden.
const SCOPE = { dashboard: 'both', operations: 'region' };

export function buildTopbar(activeId) {
  const scope = SCOPE[activeId] || 'none';
  const dateOn = scope === 'both';
  const regionOn = scope === 'both' || scope === 'region';
  const t = [];
  t.push('    <a class="r5-skip" href="#page-body">Skip to content</a>');
  t.push('    <div class="r5-progress" role="status" aria-busy="false"><i></i><span class="sr-only">Loading destination</span></div>');
  t.push('    <div class="r5-topbar">');
  t.push('      <button class="r5-iconbtn r5-menu" type="button" aria-label="Open menu" aria-controls="saqeel-primary-nav" aria-expanded="false">' + svg('dashboard', 20).replace(I.dashboard, '<path d="M4 7h16M4 12h16M4 17h16"/>') + '</button>');
  t.push('      <details class="r5-search">');
  t.push('        <summary><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input class="r5-search__input" type="search" role="combobox" aria-expanded="false" aria-controls="r5-search-results" aria-autocomplete="list" aria-label="Search navigation, factories, visits" placeholder="Search navigation, factories, visits"></summary>');
  t.push('        <div class="r5-pop r5-pop--search" id="r5-search-results" role="listbox" aria-label="Search results"><p class="r5-pop__note">Type to search. Navigation matches and backend results are returned together; loading, no-match and unavailable are distinct states.</p></div>');
  t.push('      </details>');
  if (dateOn) {
    t.push('      <details class="r5-scope"><summary aria-label="Date scope"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg><span>Last 30 days</span></summary><div class="r5-pop"><label class="r5-field"><span class="t-label">From</span><input class="input" type="date" value="2026-06-26"></label><label class="r5-field"><span class="t-label">To</span><input class="input" type="date" value="2026-07-25"></label><button class="btn btn-secondary btn-sm" type="button">Apply</button></div></details>');
  } else {
    t.push('      <button class="r5-scope is-off" type="button" disabled="disabled" aria-label="Date scope: not applicable on this route" title="Not applicable"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg><span>Not applicable</span></button>');
  }
  t.push('      <label class="r5-scope' + (regionOn ? '' : ' is-off') + '"><span class="sr-only">Region scope</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12z"/><circle cx="12" cy="9" r="2"/></svg><select aria-label="Region scope"' + (regionOn ? '' : ' disabled="disabled"') + '><option>' + (regionOn ? 'All regions' : 'Not applicable') + '</option><option>Riyadh</option><option>Makkah</option><option>Eastern Province</option></select></label>');
  t.push('      <span class="r5-spacer"></span>');
  t.push('      <button class="r5-iconbtn" type="button" aria-label="Switch theme"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg></button>');
  t.push('      <button class="r5-iconbtn r5-notif" type="button" aria-label="Notifications, 4 unread"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 004 0"/></svg><span class="r5-badge">4</span></button>');
  t.push('      <a class="r5-iconbtn" href="#ai" aria-label="AI Insights" title="AI Insights"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" fill="currentColor" stroke="none"/><path d="M19 3v2.5M20.25 4.25H17.75"/></svg></a>');
  t.push('      <details class="r5-account"><summary aria-label="Account"><span class="r5-avatar" aria-hidden="true">FA</span><span class="r5-who"><strong>f.admin</strong><small>compliance_admin · ops</small></span><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m8 10 4 4 4-4"/></svg></summary><div class="r5-pop r5-pop--account"><strong>f.admin@mim.gov.sa</strong><span class="t-caption">Roles: compliance_admin, ops</span><hr><a href="#locale">العربية</a><a href="#profile">Profile &amp; settings</a><a href="#signout" class="r5-signout">Sign out</a></div></details>');
  t.push('    </div>');
  return t.join('\n');
}
