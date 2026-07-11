export default function Shell({ current, children, title, context }: {
  current: string; children: React.ReactNode; title: string; context?: React.ReactNode;
}) {
  const nav = [
    ["Overview", "/"], ["Planning", "/planning"], ["Visits", "/visits"],
    ["Reviews", "/reviews"], ["Factory 360", "/factories"], ["Virtual", "/virtual"], ["Field", "/field"], ["Operations", "/operations"], ["Admin", "/admin"],
  ] as const;
  return (
    <div className="ax-shell">
      <nav className="ax-shell__nav" aria-label="Primary">
        <div className="ax-shell__brand"><span className="ax-shell__brand-mark">AX</span> MIM Inspection</div>
        {nav.map(([label, href]) => (
          <a key={href} className="ax-nav-item" aria-current={href === current ? "page" : undefined} href={href}>{label}</a>
        ))}
      </nav>
      <main className="ax-shell__main">
        <div className="ax-pagehead">
          <div className="ax-pagehead__row">
            <div className="ax-pagehead__context"><h2>{title}</h2>{context}</div>
          </div>
        </div>
        <div className="ax-content">{children}</div>
      </main>
    </div>
  );
}
