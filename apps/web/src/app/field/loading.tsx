import Shell from "@/components/Shell";

export default function Loading() {
  return (
    <Shell current="/field" title="Field dashboard">
      <div className="ax-surface"><div className="ax-state">
        <span className="ax-state__glyph">…</span><h4>Loading dashboard</h4>
        <p className="ax-caption">Fetching your assigned visits, review outcomes and submission history (SCR-IPAD-600 · RBAC-009).</p>
      </div></div>
    </Shell>
  );
}
