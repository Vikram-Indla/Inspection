// B1 foundation shell — real platform entry. Screens land per build slice,
// each implementing its Astryx design frame 1:1 (design/astryx/* = visual authority).
export default function Home() {
  return (
    <div className="ax-shell">
      <nav className="ax-shell__nav" aria-label="Primary">
        <div className="ax-shell__brand">
          <span className="ax-shell__brand-mark">AX</span> MIM Inspection
        </div>
        <a className="ax-nav-item" aria-current="page" href="/">Overview</a>
        <a className="ax-nav-item" href="/planning">Planning</a>
        <a className="ax-nav-item" href="/visits">Visits</a>
        <a className="ax-nav-item" href="/reviews">Reviews</a>
        <a className="ax-nav-item" href="/operations">Operations</a>
        <a className="ax-nav-item" href="/admin">Admin</a>
      </nav>
      <main className="ax-shell__main">
        <div className="ax-pagehead">
          <div className="ax-pagehead__row">
            <div className="ax-pagehead__context">
              <h2>Platform foundation — build slice B1</h2>
              <span className="ax-lozenge ax-lozenge--info">LIVE SCAFFOLD</span>
            </div>
          </div>
        </div>
        <div className="ax-content">
          <div className="ax-banner">
            <div>
              <strong>This is the product, not a mockup.</strong> Next.js + Supabase per
              DEC-010. Schema: <code>supabase/migrations/0001_foundation.sql</code> (5 state
              domains, 30+ tables, RLS, accepted engine settings). Screens arrive per slice,
              certified against the acceptance contract.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
