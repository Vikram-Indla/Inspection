// Recreation of components/ShellClient.tsx — Saqeel authenticated web shell
const { Icon, Avatar, Badge } = window.SaqeelDesignSystem_49c57d;
const NAV = [
  { id: "work", label: "Work", items: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "planning", label: "Planning", icon: "calendar" },
    { id: "visits", label: "Visits", icon: "visits" },
    { id: "reviews", label: "Reviews", icon: "review" },
  ]},
  { id: "records", label: "Records", items: [
    { id: "factories", label: "Factory 360", icon: "factory" },
    { id: "operations", label: "Operations", icon: "radar" },
    { id: "virtual", label: "Virtual", icon: "virtual" },
  ]},
  { id: "govern", label: "Governance", items: [
    { id: "admin", label: "Admin", icon: "admin" },
    { id: "enforcement", label: "Enforcement", icon: "enforcement", disabled: true, reason: "Requires Enforcement role (RBAC-011)" },
  ]},
];
function Shell({ current, title, context, children, onNavigate }) {
  return <div className="ax-shell">
    <nav className="ax-shell__nav" aria-label="Primary">
      <div className="ax-shell__brand">
        <img className="ax-shell__brand-mark" src="../../assets/saqeel-prism.svg" alt="" />
        <span className="ax-shell__brand-lockup">
          <span className="ax-shell__brand-wordmark" lang="ar">صقيل</span>
          <span className="ax-shell__brand-sub" lang="ar">صناعي</span>
        </span>
      </div>
      <div className="ax-shell__groups">
        {NAV.map(group => <section className="ax-nav-group" key={group.id}>
          <button className="ax-nav-group__trigger" type="button" aria-expanded="true">
            <span className="ax-nav-label">{group.label}</span>
            <svg className="ax-nav-group__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>
          </button>
          <div>
            {group.items.map(item => item.disabled ?
              <span key={item.id} className="ax-nav-item is-disabled" role="link" aria-disabled="true" title={item.label + " — " + item.reason} tabIndex={0}>
                <span className="ax-nav-icon"><Icon name={item.icon} /></span>
                <span className="ax-nav-label">{item.label}</span>
                <span className="ax-nav-lock" aria-hidden="true"><Icon name="lock" size={16} /></span>
              </span> :
              <a key={item.id} className="ax-nav-item" href="#" aria-current={current === item.id ? "page" : undefined}
                onClick={e => { e.preventDefault(); onNavigate(item.id); }}>
                <span className="ax-nav-icon"><Icon name={item.icon} /></span>
                <span className="ax-nav-label">{item.label}</span>
              </a>)}
          </div>
        </section>)}
      </div>
    </nav>
    <main className="ax-shell__main">
      <header className="ax-pagehead">
        <div className="ax-pagehead__topbar">
          <div className="ax-shell-controls">
            <div className="ax-shell-search">
              <span className="ax-shell-search__icon" aria-hidden="true"><Icon name="search" size={18} /></span>
              <input type="search" placeholder="Search CR, license, factory…" aria-label="Search" />
            </div>
            <button className="ax-shell-scope" type="button">
              <Icon name="calendar" size={17} /><span>Last 30 days</span>
            </button>
          </div>
          <div className="ax-pagehead__actions">
            <button className="ax-topbar-icon" type="button" aria-label="AI suggestions"><Icon name="insights" /></button>
            <span className="ax-notification"><button className="ax-notification__trigger" type="button" aria-label="Notifications"><Icon name="notify" /><span className="ax-notification__badge">3</span></button></span>
            <div className="ax-shell-account">
              <button className="ax-shell-account__trigger" type="button">
                <span className="ax-shell-account__avatar" aria-hidden="true">LA</span>
                <span className="ax-shell-account__identity"><strong>l.alharbi</strong><small>Planner · Reviewer L2</small></span>
                <svg className="ax-shell-account__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="ax-pagehead__row">
          <div className="ax-pagehead__context"><h2 style={{ margin: 0, font: "var(--ax-text-title)" }}>{title}</h2>{context}</div>
        </div>
      </header>
      <div className="ax-content">{children}</div>
    </main>
  </div>;
}
Object.assign(window, { Shell });
